class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }
  
    preload() {
      // these are tiny assets used in LoadingScene itself
      this.load.image('loading_bg', 'assets/ui/loading_bg.png');
      this.load.image('loading_bar', 'assets/ui/loading_bar.png');
    }
  
    create() {
      this.scene.start('LoadingScene');
    }
  }
  