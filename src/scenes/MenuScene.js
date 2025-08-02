class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.scale;

    this.input.once('pointerdown', () => {
      this.sound.play('bgm', { loop: true, volume: 0.3 });
    });

    // Add background
    this.add.image(width / 2, height / 2, 'menu_bg')
      .setDisplaySize(width, height);

    this.add.text(width / 2, height / 2 - 40, 'Dodge the Meteor', {
      fontSize: '32px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const start = this.add.text(width / 2, height / 2 + 20, '▶ Start Game', {
      fontSize: '24px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    start.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}
