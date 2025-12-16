const FRUIT_SCORE = 10;
const GROUND_PENALTY = 5;
const START_LIVES = 3;
const BULLET_SPEED = 900;
const FIRE_RATE = 240;

let gameConfig = {
    type: Phaser.AUTO,
    parent: "game-container",
    backgroundColor: 0x1b1b2f,

    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 120 },
            debug: false
        }
    },

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1920,
        height: 1024
    },

    scene: { preload, create, update }
};

const game = new Phaser.Game(gameConfig);

window.addEventListener("orientationchange", () => {
    game.scale.refresh();
});

function preload() {
    this.load.image("fruit", "assets/fruits/fruit.png");
    this.load.image("bomb", "assets/bombs/bomb.png");
    this.load.image("shooter", "assets/ui/shooter.jpg");
    this.load.image("bullet", "assets/ui/bullet.png");
    this.load.image("muzzle", "assets/ui/muzzle_flash.png");
    this.load.image("heart", "assets/ui/heart.png");
}

function create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.physics.world.setBounds(-1000, 0, w + 2000, h);

    this.score = 0;
    this.lives = START_LIVES;
    this.isGameOver = false;
    this.isFiring = false;

    // Shooter (fixed bottom-center)
    this.shooter = this.physics.add.image(w * 0.5, h * 0.95, "shooter")
        .setScale(0.09)
        .setOrigin(0.5, 0.9)
        .setDepth(5);

    this.shooter.body.allowGravity = false;
    this.shooter.body.setImmovable = true;
    this.shooter.setVelocity(0, 0);
    this.shooter.setAcceleration(0, 0);


    this.shooterAngle = -90;

    this.bullets = this.physics.add.group({allowGravity: false, immovable: false});
    this.objects = this.physics.add.group();

    // UI
    this.scoreText = this.add.text(20, 20, "Score: 0", {
        fontSize: 32,
        color: "#ffd966"
    }).setDepth(20);

    this.livesText = this.add.text(w - 200, 20, `Lives: ${this.lives}`, {
        fontSize: 32,
        color: "#ff8a8a"
    }).setDepth(20);

    // ❤️ Hearts UI
this.hearts = [];

for (let i = 0; i < START_LIVES; i++) {
    const heart = this.add.image(
        w - 40 - i * 40,
        70,
        "heart"
    )
    .setScale(0.6)
    .setDepth(20);

    this.hearts.push(heart);
}


    // Continuous firing timer
    this.fireTimer = this.time.addEvent({
        delay: FIRE_RATE,
        callback: shoot,
        callbackScope: this,
        loop: true,
        paused: true
    });

    // Spawn fruits/bombs
    this.spawnTimer = this.time.addEvent({
        delay: 900,
        loop: true,
        callback: spawnObject,
        callbackScope: this
    });

    // Input
    let startX = 0;

    this.input.on("pointerdown", p => {
        startX = p.x;
        this.isFiring = true;
        shoot.call(this);
        this.fireTimer.paused = false;
    });

    this.input.on("pointerup", () => {
        this.isFiring = false;
        this.fireTimer.paused = true;
    });

    this.input.on("pointermove", p => {
        if (!this.isFiring) return;

        const deltaX = p.x - startX;
        this.shooterAngle += deltaX * 0.08;
        this.shooterAngle = Phaser.Math.Clamp(this.shooterAngle, -160, -20);
        startX = p.x;
    });

    // Collisions
    this.physics.add.overlap(
        this.bullets,
        this.objects,
        bulletHitObject,
        null,
        this
    );
}

function update() {
    
    
this.shooter.setRotation(Phaser.Math.DegToRad(this.shooterAngle + 90));

    this.bullets.children.each(b => {
        if (b.y < -50 || b.x < -50 || b.x > this.scale.width + 50) {
            b.destroy();
        }
    });

    this.bullets.children.each(b => {
    if (!b || !b.body) return;
});


    this.objects.children.each(o => {
        if (o.y > this.scale.height + 200) {
            handleGroundHit.call(this, o);
        }
    });
}

// =======================
// SHOOTING
// =======================
function shoot() {
    if (this.isGameOver) return;

    const rad = Phaser.Math.DegToRad(this.shooterAngle);
    const x = this.shooter.x + Math.cos(rad) * 40;
    const y = this.shooter.y + Math.sin(rad) * 40;

    const bullet = this.physics.add.image(x, y, "bullet")
        .setScale(0.6)
        .setDepth(50);

            this.bullets.add(bullet);
bullet.body.setImmovable(false);
        bullet.body.moves = true;


    bullet.body.allowGravity = false;
    bullet.body.gravity.y = 0;

    bullet.body.setAcceleration(0, 0);
bullet.body.setDrag(0, 0);
bullet.body.setAngularVelocity(0);
bullet.body.setAngularDrag(0);
    
    bullet.body.setVelocity(
        Math.cos(rad) * BULLET_SPEED,
        Math.sin(rad) * BULLET_SPEED
    );


    // Muzzle flash
    const muzzle = this.add.image(x,y,"muzzle")
        .setScale(0.5)
        .setDepth(100);

    this.tweens.add({
        targets: muzzle,
        alpha: 0,
        scale: 0.8,
        duration: 120,
        onComplete: () => muzzle.destroy()
    });
}

// =======================
// SPAWN OBJECTS
// =======================
function spawnObject() {
    const fromLeft = Math.random() < 0.5;
    const isBomb = Math.random() < 0.4;
    const key = isBomb ? "bomb" : "fruit";

    const x = fromLeft ? -60 : this.scale.width + 60;
    // const y = this.scale.height * 0.3 + Math.random() * this.scale.height * 0.4;
    const y = Phaser.Math.Between(
        this.scale.height * 0.25,
        this.scale.height * 0.55
    );
    const vx = fromLeft ? Phaser.Math.Between(250, 350) : Phaser.Math.Between(-350, -250);
    const vy = Phaser.Math.Between(-250, -350);


    const obj = this.physics.add.image(x, y, key)
    .setScale(0.4)
    .setDepth(100);

    this.objects.add(obj);

    obj.body.moves = true;
    obj.body.immovable = false;
    
    obj.body.allowGravity = true;
    obj.body.setCollideWorldBounds(false);

    obj.setVelocity(vx, vy);
    obj.objectType = key;

    if (isBomb) obj.setAngularVelocity(120);

    // this.objects.add(obj);
}

// =======================
// COLLISIONS
// =======================
// function bulletHitObject(bullet, obj) {
//     bullet.destroy();

//     if (obj.objectType === "fruit") {
//         this.score += FRUIT_SCORE;
//         this.scoreText.setText("Score: " + this.score);
//     } else {
//         this.lives--;
//         this.livesText.setText(`Lives: ${this.lives}`);
//         this.cameras.main.shake(200, 0.01);
//         if (this.lives <= 0) triggerGameOver.call(this);
//     }

//     obj.destroy();
// }

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

    // if (this.lives <= 0) triggerGameOver.call(this);
    if (this.lives <= 0) {
    this.time.delayedCall(0, () => {
        triggerGameOver.call(this);
    });
}

}

function handleGroundHit(obj) {
    console.log("Object hit ground:", obj.objectType, obj.y);

    if (obj.objectType === "fruit") {
        this.score = Math.max(0, this.score - GROUND_PENALTY);
        this.scoreText.setText("Score: " + this.score);
    }
    obj.destroy();
}

function triggerGameOver() {
    this.isGameOver = true;
    this.spawnTimer.paused = true;
    this.fireTimer.paused = true;
    this.physics.pause();

    this.add.text(
        this.scale.width / 2,
        this.scale.height / 2,
        "GAME OVER",
        { fontSize: 56, color: "#ff3333" }
    ).setDepth(500);
}
