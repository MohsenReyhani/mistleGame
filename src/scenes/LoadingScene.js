// path: src/scenes/LoadingScene.js
class LoadingScene extends Phaser.Scene {

  constructor() {
    super('LoadingScene');
    this._sounds = ['bgm', 'jump', 'hit', 'thud', 'die', 'gun_fire'];
  }

  preload() {
    // loading screen assets
    this.load.image('loading_bg', 'assets/ui/loading_bg.png');
    // this.load.image('loading_bar','assets/ui/loading_bar.png'); // Suspended - missing file

    //————————————————————————————————————————
    // REAL ASSETS
    // backgrounds
    this.load.image('menu_bg', 'assets/ui/menu_bg.png');
    this.load.image('game_bg', 'assets/ui/game_bg.jpg');

    // sprites
    // this.load.image('player_old',   'assets/sprites/player.png'); // Old player image (not used)
    this.load.image('meteor', 'assets/sprites/meteor.png');
    this.load.spritesheet('hero',
      'assets/sprites/character_malePerson_sheet.png',
      { frameWidth: 96, frameHeight: 128 }
    )

    // Try to load new sprites, will fall back to meteor if they don't exist
    this.load.image('gun', 'assets/sprites/gun.png');
    this.load.image('bullet', 'assets/sprites/bullet.png');
    this.load.image('fire', 'assets/sprites/fire.png');
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

    const audioPromise = this._loadAllAudio();
    this.load.start();
    Promise.all([
      new Promise(res => this.load.once('complete', res)),
      audioPromise
    ]).then(() => {
      this.sound.play('bgm', { loop: true, volume: 0.3 });
      this.scene.start('MenuScene');
    });

  }

  _loadAllAudio() {
    const decodePromises = [];

    this._sounds.forEach(key => {
      // queue up the binary load
      this.load.binary(`${key}_raw`, `assets/audio/${key}.dat`);

      // wait for Phaser to fetch it…
      const p = new Promise(resolve => {
        this.load.once(
          `filecomplete-binary-${key}_raw`,
          (_fileKey, _fileType, arrayBuffer) => {
            // listen for the Sound Manager to finish decoding
            const onDecoded = decodedKey => {
              if (decodedKey === key) {
                this.sound.off(Phaser.Sound.Events.DECODED, onDecoded);
                resolve();
              }
            };
            this.sound.on(Phaser.Sound.Events.DECODED, onDecoded);

            // hand it off to Phaser’s WebAudioSoundManager
            this.sound.decodeAudio(key, arrayBuffer);
          },
          this
        );
      });

      decodePromises.push(p);
    });

    return Promise.all(decodePromises);
  }

  /** Decode a single sound's raw ArrayBuffer and stash it in Phaser's cache */
  async _decodeAndCacheSound(key, arrayBuffer) {
    const audioBuffer = await this.sound.context.decodeAudioData(arrayBuffer);
    this.cache.audio.add(key, audioBuffer);
  }

  create() {

    const canvasTex = this.textures.createCanvas('pixel', 1, 1);
    canvasTex.context.fillStyle = '#ffffff';   // white pixel (or any color, it's just a mask)
    canvasTex.context.fillRect(0, 0, 1, 1);
    canvasTex.refresh();

    // Create animations
    this.createAnimations();

    // Show loading screen for at least 1 second
    const { width, height } = this.scale;

    // Add loading background
    this.add.image(width / 2, height / 2, 'loading_bg')
      .setDisplaySize(width, height);

    // Add loading text
    const loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
      fontSize: '32px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Wait 1 second then go to menu
    this.load.once('complete', () => {
      this.scene.start('MenuScene');
    });
  }

  createAnimations() {
    // Character animations from sprite sheet

    this.anims.create({
      key: 'player_idle',
      frames: this.anims.generateFrameNumbers('hero', {
        start: 1,
        end: 2
      }),
      frameRate: 1,
      repeat: -1                // loop forever
    });

    this.anims.create({
      key: 'player_walk',
      frames: this.anims.generateFrameNumbers('hero', {
        start: 36,
        end: 43
      }),
      frameRate: 3,
      repeat: -1                // loop forever
    });

    this.anims.create({
      key: 'player_jump',
      frames: this.anims.generateFrameNumbers('hero', {
        start: 11,
        end: 16
      }),
      frameRate: 11,
      repeat: 0                  // play once
    });

    this.anims.create({
      key: 'player_hit',
      frames: this.anims.generateFrameNumbers('hero', {
        start: 43,
        end: 44
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
