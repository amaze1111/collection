// Main game logic for Stick Bridge Game

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let sprite;
let blocks = [];
let score = 0;
let isPressing = false;
let gameOver = false;
let moveComplete = true;

let BLOCK_HEIGHT = canvas.height * 0.7;
let BLOCK_BASELINE = canvas.height - BLOCK_HEIGHT;
let SPRITE_WIDTH = 50;
let SPRITE_HEIGHT = 50;

function randomBlockWidth() {
    return Math.floor(Math.random() * 161) + 40; // 40 to 200 px
}
function randomGap() {
    return Math.floor(Math.random() * 81) + 20; // 20 to 100 px
}

class Sprite {
    constructor(x) {
        this.x = x;
        this.y = BLOCK_BASELINE - SPRITE_HEIGHT;
        this.width = SPRITE_WIDTH;
        this.height = SPRITE_HEIGHT;
        this.state = 'rest';
        this.image = new Image();
        this.updateImage();
    }
    updateImage() {
        this.image.src = this.state === 'rest' ? 'assets/safe.png' : 'assets/run.png';
    }
    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

class Block {
    constructor(x, width) {
        this.x = x;
        this.y = BLOCK_BASELINE;
        this.width = width;
        this.height = BLOCK_HEIGHT;
        this.image = new Image();
        this.image.src = 'assets/base.png';
        this.padding = 17;
    }
    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

function createNewBlock() {
    let lastBlock = blocks[blocks.length - 1];
    let lastBlockEnd = lastBlock.x + lastBlock.width;
    let gap = randomGap();
    let width = randomBlockWidth();
    blocks.push(new Block(lastBlockEnd + gap, width));
}

function drawBlocks() {
    blocks.forEach(block => block.draw());
}

function drawStick() {
    ctx.save();
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 6;
    ctx.translate(stick.x, stick.y);
    ctx.rotate(stick.angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stick.length);
    ctx.stroke();
    ctx.restore();
}

function isSpriteOnBlock() {
    for (let block of blocks) {
        const hitbox = {
            x: block.x,
            y: block.y + block.padding,
            width: block.width,
            height: block.height - 2 * block.padding
        };
        const spriteFeetX = sprite.x + sprite.width / 2;
        const spriteFeetY = sprite.y + sprite.height;
        if (
            spriteFeetX >= hitbox.x &&
            spriteFeetX <= hitbox.x + hitbox.width &&
            Math.abs(spriteFeetY - hitbox.y) < 2
        ) {
            return true;
        }
    }
    return false;
}

function getBlockIndexUnderSprite() {
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const hitbox = {
            x: block.x,
            y: block.y + block.padding,
            width: block.width,
            height: block.height - 2 * block.padding
        };
        const spriteFeetX = sprite.x + sprite.width / 2;
        const spriteFeetY = sprite.y + sprite.height;
        if (
            spriteFeetX >= hitbox.x &&
            spriteFeetX <= hitbox.x + hitbox.width &&
            Math.abs(spriteFeetY - hitbox.y) < 2
        ) {
            return i;
        }
    }
    return -1;
}

let startBlockIndex = 0;

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (isPressing && !stick.rotating) {
        stick.length += 4;
    }
    drawBlocks();
    drawStick();
    sprite.draw();


    if (stick.rotating && stick.angle < Math.PI / 2) {
        stick.angle += 0.07;
        if (stick.angle > Math.PI / 2) stick.angle = Math.PI / 2;
    }

    ctx.font = "bold 48px Arial";
    ctx.fillStyle = "#222";
    ctx.textAlign = "center";
    ctx.fillText("Score: " + score, canvas.width / 2, 70);
    ctx.textAlign = "start";
}

let animationFrameId = null;

function gameLoop() {
    update();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function stopGameLoop() {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// Make canvas responsive
function resizeCanvas() {
    // 9:16 aspect ratio (portrait)
    const aspect = 9 / 16;
    let width = window.innerWidth;
    let height = window.innerHeight;

    if (width / height > aspect) {
        width = height * aspect;
    } else {
        height = width / aspect;
    }

    canvas.width = width;
    canvas.height = height;

    // Update dependent constants
    BLOCK_HEIGHT = canvas.height * 0.7;
    BLOCK_BASELINE = canvas.height - BLOCK_HEIGHT;
    SPRITE_WIDTH = canvas.width * 0.12;   // scale sprite size
    SPRITE_HEIGHT = canvas.width * 0.12;  // scale sprite size

    // Optionally, reposition blocks/sprite here if needed
}
window.addEventListener('resize', () => {
    resizeCanvas();
    // Optionally, re-calculate block/sprite positions here if needed
});
resizeCanvas();

// Prevent scrolling on touch
document.body.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

// Add touch event support in setupEventListeners
function setupEventListeners() {
    // Mouse events
    canvas.addEventListener('mousedown', onPressStart);
    canvas.addEventListener('mouseup', onPressEnd);

    // Touch events
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        onPressStart();
    }, { passive: false });
    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        onPressEnd();
    }, { passive: false });
}

function onPressStart() {
    if (gameOver) {
        init();
        return;
    }
    if (stick.rotating || !moveComplete) return;
    isPressing = true;
    moveComplete = false;
    stick.length = 0;
    stick.angle = 0;
    stick.x = sprite.x + sprite.width / 2;
    stick.y = blocks[0].y + blocks[0].padding;
}

function onPressEnd() {
    if (!isPressing || stick.rotating || gameOver) return;
    isPressing = false;
    stick.rotating = true;
    let rotateInterval = setInterval(() => {
        if (stick.angle < Math.PI / 2) {
            stick.angle += 0.07;
            if (stick.angle > Math.PI / 2) {
                stick.angle = Math.PI / 2;
            }
        }
        if (stick.angle >= Math.PI / 2) {
            stick.angle = Math.PI / 2;
            clearInterval(rotateInterval);
            stick.rotating = false;
            moveSpriteAlongStick();
        }
    }, 16);
}

function init() {
    gameOver = false;
    score = 0;
    blocks = [];
    let firstWidth = randomBlockWidth();
    blocks.push(new Block(0, firstWidth));
    sprite = new Sprite(blocks[0].x);
    sprite.y = blocks[0].y + blocks[0].padding - SPRITE_HEIGHT;
    initialSpriteX = sprite.x;
    for (let i = 0; i < 2; i++) {
        createNewBlock();
    }
    stick.x = sprite.x + sprite.width / 2;
    stick.y = blocks[0].y + blocks[0].padding;
    stick.length = 0;
    stick.rotating = false;
    stick.angle = 0;
    if (!window._eventListenersSet) {
        setupEventListeners();
        window._eventListenersSet = true;
    }
    moveComplete = true;
    gameLoop();
}

document.addEventListener('DOMContentLoaded', init);

let stick = {
    x: 0,
    y: 0,
    length: 0,
    rotating: false,
    angle: 0
};

let initialSpriteX = 0;

// Update moveSpriteAlongStick to set startBlockIndex before moving
function moveSpriteAlongStick() {
    moveComplete = false;
    startBlockIndex = getBlockIndexUnderSprite(); // Track starting block
    const startX = stick.x - sprite.width / 2;
    const startY = stick.y - sprite.height;
    const endX = stick.x + stick.length - sprite.width / 2;
    const endY = stick.y - sprite.height;
    const duration = 300;
    const startTime = performance.now();

    function animate(now) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        sprite.x = startX + (endX - startX) * t;
        sprite.y = startY + (endY - startY) * t;

        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            // Check if sprite is on any block after moving
            if (getBlockIndexUnderSprite() !== -1) {
                handleSuccessfulMove();
            } else {
                // Animate fall
                animateSpriteFall(() => {
                    gameOver = true;
                    setTimeout(() => {
                        alert('Game Over! Your score: ' + score);
                    }, 100);
                });
            }
        }
    }
    requestAnimationFrame(animate);
}

// Add this helper if not present
function animateSpriteFall(callback) {
    const fallDistance = canvas.height - sprite.y;
    const duration = 500;
    const startY = sprite.y;
    const startTime = performance.now();

    function animate(now) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        sprite.y = startY + fallDistance * t;
        update();
        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            callback && callback();
        }
    }
    requestAnimationFrame(animate);
}

// Update handleSuccessfulMove to check block indices
function handleSuccessfulMove() {
    gameOver = false;
    sprite.state = 'glide';
    sprite.updateImage();
    const endBlockIndex = getBlockIndexUnderSprite();
    if (endBlockIndex !== -1 && endBlockIndex !== startBlockIndex) {
        score++;
    }
    createNewBlock();
    setTimeout(() => {
        sprite.state = 'rest';
        sprite.updateImage();
        stick.length = 0;
        stick.angle = 0;
        animateWorldShift(() => {
            moveComplete = true;
        });
    }, 300);
}

function animateWorldShift(callback) {
    const shiftAmount = sprite.x - initialSpriteX;
    const duration = 400;
    const startTime = performance.now();

    function animate(now) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const currentShift = shiftAmount * (1 - t);

        sprite.x = initialSpriteX + currentShift;
        blocks.forEach(block => {
            block.x -= shiftAmount * t - shiftAmount * (t - 1 / (duration / 16));
        });

        if (t < 1) {
            requestAnimationFrame(animate);
        } else {
            sprite.x = initialSpriteX;
            callback && callback();
        }
    }
    requestAnimationFrame(animate);
}