// path: src/scenes/LoadingScene.js
class LoadingScene extends Phaser.Scene {
  constructor() { super('LoadingScene'); }

  preload() {
    // loading screen assets
    this.load.image('loading_bg', 'assets/ui/loading_bg.png');
    this.load.image('loading_bar','assets/ui/loading_bar.png');

    //————————————————————————————————————————
    // REAL ASSETS
    // backgrounds
    this.load.image('menu_bg','assets/ui/menu_bg.png');
    this.load.image('game_bg','assets/ui/game_bg.jpg');

    // sprites
    this.load.image('player',   'assets/sprites/player.png');
    this.load.image('meteor',   'assets/sprites/meteor.png');

    // explosion spritesheet
    // make sure your explosion.png is e.g. 256×256 px → 4×4 frames of 64×64
    this.load.spritesheet('explosion',
      'assets/sprites/explosion.png',
      { frameWidth: 64, frameHeight: 64 }
    );

    // audio (preload here so it’s available immediately)
    this.load.audio('bgm',  ['assets/audio/bgm.mp3']);
    this.load.audio('jump', ['assets/audio/jump.wav']);
    this.load.audio('hit',  ['assets/audio/hit.wav']);
    this.load.audio('thud', ['assets/audio/thud.wav']);
    this.load.audio('die',  ['assets/audio/die.wav']);
  }

  create() {
    this.scene.start('MenuScene');
  }
  
  spawnMeteor() {
    const x = Phaser.Math.Between(20, this.scale.width - 20);
    const m = this.meteors.create(x, -20, 'meteor');
    m.setVelocityY(Phaser.Math.Between(150, 300));
    // now you should *see* your meteor graphic
  }

}
