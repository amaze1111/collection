const FRUIT_SCORE = 10;
const START_LIVES = 3;

let gameConfig = {
    type: Phaser.AUTO,
    parent: "game-container",
    backgroundColor: 0x1b1b2f,

    physics: {
        default: "arcade",
        arcade: {
            debug: false,
        }
    },

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1920,
        height: 1024,
        expandParent: true
    },

    scene: { preload, create, update }
};

const game = new Phaser.Game(gameConfig);

window.addEventListener("orientationchange", () => {
    game.scale.refresh();
});

function preload() {
    // game objects
    this.load.image("fruit", "assets/fruits/fruit.png");
    this.load.image("bomb", "assets/bombs/bomb.png");

    // UI assets
    this.load.image("shooter", "assets/ui/shooter.jpg");
    this.load.image("muzzle", "assets/ui/muzzle_flash.png");
    this.load.image("heart", "assets/ui/heart.png");

    // Bullet (tiny circle PNG, preloaded)
    this.load.image("bullet", "assets/ui/bullet.png");
}

function create() {
    this.score = 0;
    this.lives = START_LIVES;
    this.isGameOver = false;

    const w = this.scale.width;
    const h = this.scale.height;

    this.shooter = this.add.image(w * 0.5, h * 0.95, "shooter")
        .setScale(0.09)
        .setOrigin(0.5)
        .setDepth(5); 

    this.bullets = this.physics.add.group();
    this.objects = this.physics.add.group();

    this.scoreText = this.add.text(20, 20, "Score: 0", {
        fontSize: 32,
        color: "#ffd966"
    }).setDepth(20);

    this.livesText = this.add.text(w - 180, 20, `Lives: ${this.lives}`, {
        fontSize: 32,
        color: "#ff8a8a"
    }).setDepth(20);
//////////////////////////////////////////////////////////////////////////
    this.hearts = [];
    for (let i = 0; i < START_LIVES; i++) {
        this.hearts.push(
            this.add.image(w - 50 - i * 40, 70, "heart")
                .setScale(0.45)
                .setDepth(20)
        );
    }

    this.input.on("pointermove", (p) => {
        this.shooter.x = Phaser.Math.Clamp(
            p.x,
            40,
            this.scale.width - 40
        );
    });

    this.input.on("pointerdown", () => {
        if (!this.isGameOver) shoot.call(this);
    });

    this.physics.add.overlap(
        this.bullets,
        this.objects,
        bulletHitObject,
        null,
        this
    );

    this.spawnTimer = this.time.addEvent({
        delay: 900,
        loop: true,
        callback: spawnObject,
        callbackScope: this
    });
}

function update() {
    this.bullets.children.each(b => {
        if (b.y < -60) b.destroy();
    });

    this.objects.children.each(o => {
        if (o.x > this.scale.width + 150) o.destroy();
    });
}

function shoot() {
    const spawnX = this.shooter.x;
    const spawnY = this.shooter.y - this.shooter.displayHeight / 2 - 10;

    const bullet = this.physics.add.image(spawnX, spawnY, "bullet")
        .setScale(0.6)
        .setDepth(50);

    bullet.body.deltaMax.set(1000, 1000)
    this.bullets.add(bullet);
    bullet.setVelocityY(-900);
    bullet.body.setAllowGravity(false);

    // Muzzle flash
    const muzzle = this.add.image(
        spawnX,
        this.shooter.y - this.shooter.displayHeight / 2,
        "muzzle"
    ).setScale(0.5).setDepth(100);

    this.tweens.add({
        targets: muzzle,
        alpha: 0,
        scale: 0.8,
        duration: 120,
        onComplete: () => muzzle.destroy()
    });
}


// ============================
// SPAWN FRUIT / BOMB
// ============================
function spawnObject() {
    const isBomb = Math.random() < 0.4;
    const key = isBomb ? "bomb" : "fruit";

    const sprite = this.physics.add.image(
        Phaser.Math.Between(this.scale.width * 0.2, this.scale.height * 2),
        Phaser.Math.Between(this.scale.height * 0.2, this.scale.height * 0.6),
        key
    )
        .setScale(0.2 + Math.random() * 0.7)
        .setDepth(10);

    sprite.objectType = key;
    sprite.setVelocityX(Phaser.Math.Between(150, 220));

    if (isBomb) sprite.setAngularVelocity(45);

    this.objects.add(sprite);
}


// ============================
// COLLISIONS
// ============================
function bulletHitObject(bullet, obj) {
    bullet.destroy();

    if (obj.objectType === "fruit") {
        fruitPop.call(this, obj);
    } else {
        bombHit.call(this, obj);
    }
}

function fruitPop(obj) {
    const popup = this.add.text(obj.x, obj.y - 20, "+10", {
        fontSize: "32px",
        color: "#ffe066",
        stroke: "#000",
        strokeThickness: 6
    }).setDepth(200);

    this.tweens.add({
        targets: popup,
        y: popup.y - 80,
        alpha: 0,
        duration: 600,
        onComplete: () => popup.destroy()
    });

    obj.destroy();

    this.score += FRUIT_SCORE;
    this.scoreText.setText("Score: " + this.score);
}

function bombHit(obj) {
    obj.destroy();

    this.cameras.main.shake(200, 0.01);

    this.lives--;
    this.livesText.setText(`Lives: ${this.lives}`);

    if (this.hearts[this.lives]) {
        this.hearts[this.lives].setVisible(false);
    }

    if (this.lives <= 0) triggerGameOver.call(this);
}

function triggerGameOver() {
    this.isGameOver = true;
    this.spawnTimer.paused = true;
    this.physics.pause();

    this.add.text(
        this.scale.width / 2 - 120,
        this.scale.height / 2 - 40,
        "GAME OVER",
        { fontSize: 48, color: "#ff3333" }
    ).setDepth(500);
}
