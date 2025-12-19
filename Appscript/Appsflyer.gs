/*************************************
 * CONFIG
 *************************************/
const CONFIG = {
  spreadsheetId: "", // leave empty if bound to sheet
  rawSheet: "Raw",
  summarySheet: "Hourly Summary",

  // event classifier
  installEvents: ["install", "af_install"],
  purchaseEvents: ["purchase", "af_purchase"],
};

/*************************************
 * Ensure sheet exists
 *************************************/
function getSheet_(name) {
  const ss = CONFIG.spreadsheetId
    ? SpreadsheetApp.openById(CONFIG.spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

/*************************************
 * Webhook endpoint (AppsFlyer → Google Sheet Raw)
 *************************************/
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: false, error: "Missing body" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const payload = JSON.parse(e.postData.contents);

    const raw = getSheet_(CONFIG.rawSheet);

    // Ensure headers
    const headers = ["timestamp_received", "campaign", "media_source", "event_name", "event_time", "payload_raw"];
    if (raw.getLastRow() === 0) {
      raw.appendRow(headers);
    }

    // payload may be single object or array
    const items = Array.isArray(payload)
      ? payload
      : payload.data || payload.events || [payload];

    if (items.length === 0) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: true, inserted: 0 })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const rows = items.map(item => [
      new Date().toISOString(),
      item.campaign || "",
      item.media_source || "",
      item.event_name || "",
      item.event_time || "",
      JSON.stringify(item)
    ]);

    raw.getRange(raw.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, inserted: rows.length })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/*************************************
 * AGGREGATION JOB (runs hourly)
 *************************************/
function aggregateHourly_() {
  const raw = getSheet_(CONFIG.rawSheet);
  const summary = getSheet_(CONFIG.summarySheet);

  // Ensure summary sheet headers
  const headers = ["hour", "campaign", "media_source", "installs", "events", "purchases", "total"];
  if (summary.getLastRow() === 0) summary.appendRow(headers);

  const data = raw.getRange(2, 1, raw.getLastRow() - 1, raw.getLastColumn()).getValues();
  if (data.length === 0) return;

  // Grouped result object
  const agg = {};

  data.forEach(row => {
    const timestampReceived = row[0];
    const campaign = row[1] || "UNKNOWN";
    const media = row[2] || "UNKNOWN";
    const eventName = row[3] || "";
    
    const hour = new Date(timestampReceived);
    hour.setMinutes(0, 0, 0); // round down to hour
    const hourKey = hour.toISOString();

    const key = hourKey + "|" + campaign + "|" + media;
    if (!agg[key]) {
      agg[key] = { hour: hourKey, campaign, media, installs: 0, events: 0, purchases: 0 };
    }

    if (CONFIG.installEvents.includes(eventName)) {
      agg[key].installs++;
    } else if (CONFIG.purchaseEvents.includes(eventName)) {
      agg[key].purchases++;
    } else {
      agg[key].events++;
    }
  });

  // Write aggregated rows
  const out = [];
  Object.values(agg).forEach(a => {
    a.total = a.installs + a.events + a.purchases;
    out.push([
      a.hour, a.campaign, a.media, a.installs, a.events, a.purchases, a.total
    ]);
  });

  summary.getRange(summary.getLastRow() + 1, 1, out.length, out[0].length).setValues(out);

  // Clear raw data after processing
  raw.deleteRows(2, raw.getLastRow() - 1);
}

/*************************************
 * Setup hourly trigger (run once)
 *************************************/
function setupHourlyTrigger() {
  ScriptApp.newTrigger("aggregateHourly_")
    .timeBased()
    .everyHours(1)
    .create();
}