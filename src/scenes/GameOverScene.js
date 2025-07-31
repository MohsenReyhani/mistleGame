class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }
    init(data) {
      this.finalScore = data.score; // you could calculate time survived
    }
    create() {
      const { width, height } = this.scale;
      this.add.text(width/2, height/2 - 20, 'Game Over', { fontSize: '36px' })
          .setOrigin(0.5);
      this.add.text(width/2, height/2 + 20, '▶ Restart', { fontSize: '24px' })
          .setOrigin(0.5)
          .setInteractive()
          .on('pointerdown', () => this.scene.start('GameScene'));
    }
  }
  