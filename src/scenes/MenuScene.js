class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.scale;

    this.add.text(width/2, height/2 - 40, 'Dodge the Meteor', {
      fontSize: '32px'
    }).setOrigin(0.5);

    const start = this.add.text(width/2, height/2 + 20, '▶ Start Game', {
      fontSize: '24px'
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    start.on('pointerdown', () => {
      // request full-screen on user gesture
      if (!this.scale.isFullscreen) {
        this.scale.startFullscreen();  // now allowed
      }
      this.scene.start('GameScene');
    });
  }
}
