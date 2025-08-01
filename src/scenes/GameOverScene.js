class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }
    init(data) {
      this.finalScore = data.score; // you could calculate time survived
    }
    create() {
      const { width, height } = this.scale;
      
      // Add background
      this.add.image(width/2, height/2, 'menu_bg')
          .setDisplaySize(width, height);
      
      this.add.text(width/2, height/2 - 40, 'Game Over', { 
        fontSize: '36px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
      
      this.add.text(width/2, height/2, `Score: ${Math.floor(this.finalScore / 1000)}s`, { 
        fontSize: '24px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      const restartButton = this.add.text(width/2, height/2 + 40, '▶ Restart', { 
        fontSize: '24px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
            this.scene.start('GameScene');
          });
    }
  }
  