const FRUIT_SCORE = 10;
const START_LIVES = 3;

let gameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  backgroundColor: 0x1b1b2f,

  physics: {
    default: "arcade",
    arcade: { debug: false }
  },

  scale: {
    mode: Phaser.Scale.RESIZE,     // fully responsive
    autoCenter: Phaser.Scale.CENTER_BOTH
  },

  scene: { preload, create, update }
};

const game = new Phaser.Game(gameConfig);

// ---------------------------
// PRELOAD
// ---------------------------
function preload() {
  this.load.image("fruit", "assets/fruits/fruit.png");
  this.load.image("bomb", "assets/bombs/bomb.png");
  this.load.image("shooter", "assets/ui/shooter.jpg");
  this.load.image("muzzle", "assets/ui/muzzle_flash.png");
  this.load.image("heart", "assets/ui/heart.png");
}

// ---------------------------
// CREATE
// ---------------------------
function create() {

  console.log("CAMERA SIZE:", this.cameras.main.width, this.cameras.main.height);

  // bullet texture (draw circle once)
  const g = this.add.graphics();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(6, 6, 6);
  g.generateTexture("bulletTexture", 12, 12);
  g.destroy();

  this.score = 0;
  this.lives = START_LIVES;
  this.isGameOver = false;

  const cam = this.cameras.main;

  // shooter at bottom center
  this.shooter = this.add.image(cam.width / 2, cam.height - 80, "shooter")
    .setScale(0.09)
    .setDepth(5);

  this.bullets = this.physics.add.group();
  this.objects = this.physics.add.group();

  this.scoreText = this.add.text(20, 20, "Score: 0", {
    fontSize: 28,
    color: "#ffd966"
  }).setDepth(50);

  this.livesText = this.add.text(cam.width - 200, 20, `Lives: ${this.lives}`, {
    fontSize: 28,
    color: "#ff8a8a"
  }).setDepth(50);

  this.hearts = [];
  for (let i = 0; i < START_LIVES; i++) {
    this.hearts.push(
      this.add.image(cam.width - 50 - i * 40, 70, "heart")
        .setDepth(50)
        .setScale(0.45)
    );
  }

  // shooter follows pointer
  this.input.on("pointermove", p => {
    if (!this.isGameOver) {
      this.shooter.x = Phaser.Math.Clamp(p.x, 40, this.cameras.main.width - 40);
    }
  });

  this.input.on("pointerdown", () => {
    if (!this.isGameOver) shoot.call(this);
  });

  this.physics.add.overlap(this.bullets, this.objects, bulletHitObject, null, this);

  this.spawnTimer = this.time.addEvent({
    delay: 800,
    loop: true,
    callback: spawnObject,
    callbackScope: this
  });

  // resize handler
  this.scale.on("resize", size => {
    const cam = this.cameras.main;

    this.shooter.x = cam.width / 2;
    this.shooter.y = cam.height - 80;

    this.livesText.setX(cam.width - 200);

    this.hearts.forEach((h, i) => {
      h.x = cam.width - 50 - i * 40;
    });
  });
}

// ---------------------------
// UPDATE
// ---------------------------
function update() {

  // remove offscreen objects
  const cam = this.cameras.main;

  this.objects.children.each(obj => {
    if (obj.x > cam.width + 150) obj.destroy();
  });

  this.bullets.children.each(b => {
    if (b.y < -60) b.destroy();
  });
}

// ---------------------------
// SHOOT
// ---------------------------
function shoot() {
  const cam = this.cameras.main;

  const spawnX = this.shooter.x;
  const spawnY = this.shooter.y - (this.shooter.displayHeight / 2) - 12;

  const bullet = this.physics.add.sprite(spawnX, spawnY, "bulletTexture")
    .setDepth(20)
    .setScale(1);

  bullet.setVelocityY(-900);
  bullet.body.setAllowGravity(false);
  this.bullets.add(bullet);

  // muzzle flash
  const muzzle = this.add.image(
    spawnX,
    this.shooter.y - (this.shooter.displayHeight / 2),
    "muzzle"
  ).setDepth(40).setScale(0.45);

  this.tweens.add({
    targets: muzzle,
    alpha: 0,
    scale: 0.8,
    duration: 100,
    onComplete: () => muzzle.destroy()
  });
}

// ---------------------------
// SPAWN FRUIT / BOMB
// ---------------------------
function spawnObject() {
  const cam = this.cameras.main;

  const isBomb = Math.random() < 0.2;
  const key = isBomb ? "bomb" : "fruit";

  const x = -80;
  const y = Phaser.Math.Between(cam.height * 0.2, cam.height * 0.75);

  const sprite = this.physics.add.image(x, y, key)
    .setScale(0.35)
    .setDepth(10);

  sprite.objectType = isBomb ? "bomb" : "fruit";

  sprite.setVelocityX(Phaser.Math.Between(150, 220));

  if (isBomb) sprite.setAngularVelocity(45);

  this.objects.add(sprite);
}

// ---------------------------
// COLLISIONS
// ---------------------------
function bulletHitObject(bullet, obj) {
  if (!obj.active) return;

  bullet.destroy();

  if (obj.objectType === "fruit") fruitPop.call(this, obj);
  else bombHit.call(this, obj);
}

function fruitPop(obj) {
  const popup = this.add.text(obj.x, obj.y - 20, `+${FRUIT_SCORE}`, {
    fontSize: 30,
    color: "#ffde59",
    stroke: "#000",
    strokeThickness: 6
  }).setDepth(100);

  this.tweens.add({
    targets: popup,
    y: obj.y - 80,
    alpha: 0,
    duration: 700,
    onComplete: () => popup.destroy()
  });

  obj.destroy();

  this.score += FRUIT_SCORE;
  this.scoreText.setText("Score: " + this.score);
}

function bombHit(obj) {
  explodeBomb.call(this, obj);

  this.lives--;
  this.livesText.setText(`Lives: ${this.lives}`);

  if (this.hearts[this.lives]) {
    this.tweens.add({
      targets: this.hearts[this.lives],
      alpha: 0,
      scale: 0.2,
      duration: 300,
      onComplete: () => this.hearts[this.lives].setVisible(false)
    });
  }

  if (this.lives <= 0) triggerGameOver.call(this);
}

function explodeBomb(obj) {
  this.cameras.main.shake(200, 0.01);
  obj.destroy();
}

function triggerGameOver() {
  this.isGameOver = true;
  this.physics.pause();
  this.spawnTimer.paused = true;

  this.add.text(
    this.cameras.main.width / 2 - 120,
    this.cameras.main.height / 2 - 40,
    "GAME OVER",
    { fontSize: 48, color: "#ff4444" }
  ).setDepth(200);
}
