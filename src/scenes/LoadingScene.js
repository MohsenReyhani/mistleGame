// path: src/scenes/LoadingScene.js
class LoadingScene extends Phaser.Scene {
  constructor() { super('LoadingScene'); }

  preload() {
    // loading screen assets
    this.load.image('loading_bg', 'assets/ui/loading_bg.png');
    // this.load.image('loading_bar','assets/ui/loading_bar.png'); // Suspended - missing file

    //————————————————————————————————————————
    // REAL ASSETS
    // backgrounds
    this.load.image('menu_bg','assets/ui/menu_bg.png');
    this.load.image('game_bg','assets/ui/game_bg.jpg');

    // sprites
    // this.load.image('player_old',   'assets/sprites/player.png'); // Old player image (not used)
    this.load.image('meteor',   'assets/sprites/meteor.png');
    this.load.spritesheet('hero',
      'assets/sprites/character_malePerson_sheet.png',
      { frameWidth: 96, frameHeight: 128 }
    )
    
    // Try to load new sprites, will fall back to meteor if they don't exist
    this.load.image('gun',      'assets/sprites/gun.png');
    this.load.image('bullet',   'assets/sprites/bullet.png');
    this.load.image('fire',     'assets/sprites/fire.png');
    // this.load.image('light_circle', 'assets/sprites/light_circle.png'); // Not needed anymore - using masking

    // explosion spritesheet
    // make sure your explosion.png is e.g. 256×256 px → 4×4 frames of 64×64
    this.load.spritesheet('explosion',
      'assets/sprites/explosion.png',
      { frameWidth: 64, frameHeight: 64 }
    );

    // Suspended animations - using single frame placeholders
    // this.load.image('player_idle', 'assets/sprites/player.png'); // Using player as idle placeholder
    this.load.image('gun_fire', 'assets/sprites/meteor.png'); // Using meteor as fire placeholder
    this.load.image('meteor_rotate', 'assets/sprites/meteor.png'); // Using meteor as rotation placeholder

    // audio (preload here so it's available immediately)
    this.load.audio('bgm',  ['assets/audio/bgm.mp3']);
    this.load.audio('jump', ['assets/audio/jump.wav']);
    this.load.audio('hit',  ['assets/audio/hit.wav']);
    this.load.audio('thud', ['assets/audio/thud.wav']);
    this.load.audio('die',  ['assets/audio/die.wav']);
    this.load.audio('gun_fire', ['assets/audio/gun_fire.wav']);
  }

  create() {
    // Create animations
    this.createAnimations();
    
    // Show loading screen for at least 1 second
    const { width, height } = this.scale;
    
    // Add loading background
    this.add.image(width/2, height/2, 'loading_bg')
        .setDisplaySize(width, height);
    
    // Add loading text
    const loadingText = this.add.text(width/2, height/2, 'Loading...', {
      fontSize: '32px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Wait 1 second then go to menu
    this.time.delayedCall(1000, () => {
      this.scene.start('MenuScene');
    });
  }

  createAnimations() {
    // Character animations from sprite sheet
    
    this.anims.create({
      key: 'player_idle',
      frames: this.anims.generateFrameNumbers('hero', {
        start: 1,
        end:   2
      }),
      frameRate: 1,
      repeat: -1                // loop forever
    });

    this.anims.create({
      key: 'player_walk',
      frames: this.anims.generateFrameNumbers('hero', {
        start: 37,
        end:   44
      }),
      frameRate: 3,
      repeat: -1                // loop forever
    });

    this.anims.create({
      key: 'player_jump',
      frames: this.anims.generateFrameNumbers('hero', {
        start: 12,
        end:   17
      }),
      frameRate: 5,
      repeat: 0                  // play once
    });

    this.anims.create({
      key: 'player_hit',
      frames: this.anims.generateFrameNumbers('hero', {
        start: 44,
        end:   45
      }),
      frameRate: 1,
      repeat: 0
    });

    // Gun fire animation - single frame for now
    this.anims.create({
      key: 'gun_fire_anim',
      frames: [{ key: 'gun_fire' }],
      frameRate: 1,
      repeat: 0
    });

    // Meteor rotation animation - single frame for now
    this.anims.create({
      key: 'meteor_rotate',
      frames: [{ key: 'meteor_rotate' }],
      frameRate: 1,
      repeat: -1
    });

    // Explosion animation (already exists but let's make sure)
    try {
      const explosionTexture = this.textures.get('explosion');
      const totalFrames = explosionTexture.frameTotal;
      console.log('Explosion frames available:', totalFrames);
      
      // Use fewer frames to avoid going out of bounds
      const maxFrames = Math.min(totalFrames, 15); // Limit to 15 frames max
      
      this.anims.create({
        key: 'explode',
        frames: this.anims.generateFrameNumbers('explosion', {
          start: 0,
          end: maxFrames - 1
        }),
        frameRate: 20,
        hideOnComplete: true
      });
    } catch (error) {
      console.warn('Explosion animation not available, using single frame');
      this.anims.create({
        key: 'explode',
        frames: [{ key: 'explosion', frame: 0 }],
        frameRate: 1,
        hideOnComplete: true
      });
    }
  }
  
  spawnMeteor() {
    const x = Phaser.Math.Between(20, this.scale.width - 20);
    const m = this.meteors.create(x, -20, 'meteor');
    m.setVelocityY(Phaser.Math.Between(150, 300));
    // now you should *see* your meteor graphic
  }

}
