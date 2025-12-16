let game;
window.onload = function () {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const config = {
    type: Phaser.AUTO,
    width,
    height,
    backgroundColor: '#87ceeb',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: height * 1 },
        debug: false
      }
    },
    scene: [MainScene]
  };
  game = new Phaser.Game(config);
};

class MainScene extends Phaser.Scene {
  preload() {
    this.load.image('bird', 'assets/bird.png');
    this.load.image('obstacle', 'assets/obstacle.png');
    this.load.image('bg', 'assets/background.png');
  }

  create() {
    const width = this.game.config.width;
    const height = this.game.config.height;

    this.obstacles = this.physics.add.group();

    this.add.image(width / 2, height / 2, 'bg').setDisplaySize(width, height);

    this.bird = this.physics.add.sprite(width * 0.2, height * 0.4, 'bird');
    const birdScale = (0.1 * height / this.bird.height);
    this.bird.setScale(birdScale);

    this.bird.body.setSize(this.bird.width * 0.7, this.bird.height * 0.7).setOffset(this.bird.width * 0.15, this.bird.height * 0.15);

    this.score = 0;
    this.scoreText = this.add.text(width * 0.04, height * 0.03, `Score: ${this.score}`, {
      fontSize: `${Math.floor(height * 0.045)}px`,
      fill: '#fff'
    });

    this.gameOver = false;

    this.time.addEvent({
      delay: 2000,
      callback: this.spawnObstaclePair,
      callbackScope: this,
      loop: true
    });

    this.input.on('pointerup', this.handleTouchEnd, this);
    this.touchStartTime = 0;

    this.physics.add.overlap(this.bird, this.obstacles, () => {
      console.log('Bird hit an obstacle');
      this.hitObstacle(this.bird);
    }, null, this);
  }

  update() {
    if (this.gameOver) return;

    const height = this.game.config.height;
    const birdTop = this.bird.y - this.bird.displayHeight / 2;
    const birdBottom = this.bird.y + this.bird.displayHeight / 2;

    if (birdTop <= 0 || birdBottom >= height) {
      this.hitObstacle(this.bird);
    }

    if (this.bird.body.velocity.y < 0) {
      this.bird.angle = -20;
    } else {
      this.bird.angle = Math.min(this.bird.angle + 1, 20);
    }

    this.obstacles.getChildren().forEach(ob => {

      if (ob.isbottom) {
        if (!ob.scored && ob.x + ob.displayWidth / 2 < this.bird.x - this.bird.displayWidth / 2) {
          ob.scored = true;
          this.score += 1;
          this.scoreText.setText(`Score: ${this.score}`);
        }
      }

      if (ob.x + ob.displayWidth / 2 < 0) {
        ob.destroy();
      }
    });
  }

  handleTouchEnd() {
    const height = this.game.config.height;
    this.bird.setVelocityY(-height * 0.6);
  }

  spawnObstaclePair() {
    const width = this.game.config.width;
    const height = this.game.config.height;

    const originalPipeHeight = this.textures.get('obstacle').getSourceImage().height;

    const pipeScale = 0.2 * height / originalPipeHeight;
    const gap = height * 0.2;

    const pipeHeight = originalPipeHeight * pipeScale;

    const minGapY = pipeHeight + gap / 2;
    const maxGapY = height - minGapY;
    const gapY = Phaser.Math.Between(minGapY, maxGapY);

    const pipeSpeed = -width * 0.4;

    const top = this.obstacles.create(width + 50, gapY - gap / 2, 'obstacle').setScale(pipeScale);
    top.setOrigin(0.5, 1);
    top.setFlipY(true);
    top.setVelocityX(pipeSpeed);
    top.body.allowGravity = false;
    top.setImmovable(true);
    top.isbottom = false;
    top.body.setSize(top.width * 0.2, top.height * 0.75).setOffset(top.width * 0.42, top.height * (-0.025));

    const bottom = this.obstacles.create(width + 50, gapY + gap / 2, 'obstacle').setScale(pipeScale);
    bottom.setOrigin(0.5, 0);
    bottom.setVelocityX(pipeSpeed);
    bottom.body.allowGravity = false;
    bottom.setImmovable(true);
    bottom.isbottom = true;
    bottom.scored = false;
    bottom.body.setSize(bottom.width * 0.2, bottom.height * 0.75).setOffset(bottom.width * 0.42, bottom.height * 0.25);
  }

  hitObstacle(bird) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.physics.pause();
    this.bird.setTint(0xff0000);

    const width = this.game.config.width;
    const height = this.game.config.height;
    this.gameOverText = this.add.text(width / 2, height / 2, 'Game Over\nTap to Restart', {
      fontSize: `${Math.floor(height * 0.07)}px`,
      fill: '#fff',
      align: 'center'
    }).setOrigin(0.5);

    this.input.once('pointerup', () => {
      this.scene.restart();
    });
  }
}