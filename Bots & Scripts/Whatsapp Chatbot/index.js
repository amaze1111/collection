// index.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const responsesPath = path.join(__dirname, 'responses.json');

// Default responses (used if responses.json missing)
let responses = {
  "greeting": {
    "keywords": ["hello", "hi", "hey"],
    "reply": "Hi, How can I help you?"
  },
  "opinion": {
    "keywords": ["not working", "opinion"],
    "reply": "Please share more details about the issue."
  }
};

// Load or create responses.json
try {
  if (fs.existsSync(responsesPath)) {
    responses = JSON.parse(fs.readFileSync(responsesPath, 'utf8'));
    console.log('Loaded responses.json');
  } else {
    fs.writeFileSync(responsesPath, JSON.stringify(responses, null, 2));
    console.log('Created responses.json with defaults');
  }
} catch (err) {
  console.error('Error loading responses.json:', err);
}

// Watch file for changes (hot reload)
fs.watchFile(responsesPath, () => {
  try {
    responses = JSON.parse(fs.readFileSync(responsesPath, 'utf8'));
    console.log('Reloaded responses.json');
  } catch (e) {
    console.error('Failed to reload responses.json:', e);
  }
});

// WhatsApp client setup
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: puppeteer.executablePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log('Scan the QR code above with WhatsApp mobile app');
});

client.on('ready', () => {
  console.log('WhatsApp bot is ready!');
});

// Handle messages
client.on('message', msg => {
  const text = (msg.body || '').toLowerCase();

  for (let intent in responses) {
    const { keywords, reply } = responses[intent];
    if (keywords.some(k => text.includes(k.toLowerCase()))) {
      msg.reply(reply);
      console.log(`Matched intent: ${intent} → Replied`);
      return; // stop at first matched intent
    }
  }
});

client.initialize();
