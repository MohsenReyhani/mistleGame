// Game Settings - Easy to modify
const GAME_SETTINGS = {

  // Gun settings
  gunDuration: 10000,     // 10 seconds
  bulletSpeed: 1200,      // Bullet velocity (increased for faster bullets)
  bulletGravity: false,   // Whether bullets are affected by gravity

  // Meteor settings
  meteorZigzag: true,     // Enable zigzag movement
  zigzagAmplitude: 50,    // How wide the zigzag is
  zigzagFrequency: 2,     // How fast the zigzag cycles

  // Power-up spawn intervals
  gunSpawnInterval: 5000, // 5 seconds
  secretBoxSpawnInterval: 8000, // 8 seconds

  // Difficulty settings
  initialSpawnInterval: 2000,
  minSpawnInterval: 200,
  difficultyIncrease: 20
};

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.strikes = 0;
    this.spawnInterval = GAME_SETTINGS.initialSpawnInterval;
    this.gameStartTime = 0;
    this.playerHasGun = false;
    this.playerGun = null;
    this.gunTimer = null;
    this.powerUpActive = false; // Prevent multiple power-ups at once
    this.playerHit = false; // Track if player is in hit animation
    this.playerHitTimer = null; // Timer for hit animation
    this.lastTapTime = 0;       // timestamp of the previous tap
    this.tapThreshold = 300;  // max ms between taps to count as “double”
  }

  create() {
    const { width, height } = this.scale;

    this.guns = this.physics.add.group();
    this.secretBoxes = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.meteors = this.physics.add.group();

    // Reset game stats
    this.resetGameStats();

    // background
    this.add.image(width / 2, height / 2, 'game_bg')
      .setDisplaySize(width, height);

    // // ground - make it indestructible
    // this.textures.generate('pixel', { width: 1, height: 1 });
    // this.ground = this.add.rectangle(width/2, height - 8, width, 16)
    //     .setOrigin(0.5, 0.5)
    //     .setFillStyle(0x333333);
    // this.physics.add.existing(this.ground, true);
    // this.ground.body.setSize(width, 16);
    // this.ground.body.setOffset(-width/2, -8);
    // this.ground.body.allowGravity = false;

    this.ground = this.physics.add
      .staticImage(width / 2, height - 8, 'pixel')
      .setDisplaySize(width, 16)
      .refreshBody();

    // player with idle animation - using character from sprite sheet
    this.player = this.physics.add.sprite(width / 2, height - 100, 'hero')
      .setCollideWorldBounds(true);
    this.player.play('player_idle');


    // track where we’re moving to (null = no auto‐move)
    this.moveToX = null;

    this.cursors = this.input.keyboard.createCursorKeys();

    // single pointer handler: jump if tapped above, else walk toward tap
    this.input.on('pointerdown', pointer => {

      const now = this.time.now;               // current in-game timestamp
      const msSinceLast = now - this.lastTapTime;

      if (this.playerHasGun) {
        this.shootBullet();
      } else if (!this.playerHasGun && msSinceLast < this.tapThreshold) {
        // ── DOUBLE TAP DETECTED ──
        if (this.player.body.blocked.down) {
          this.player.setVelocityY(-400);
          this.sound.play('jump');
        }
        // reset so you need a fresh double-tap for the next jump
        this.lastTapTime = 0;
      } else {
        // ── FIRST TAP ──
        // record and let the second tap within threshold trigger
        this.lastTapTime = now;
      }

      // 2) otherwise WALK horizontally toward the tap position
      this.moveToX = pointer.x;
      const speed = 300;
      this.player.setVelocityX(this.moveToX < this.player.x ? -speed : speed);

    });


    // collisions
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.meteors, this.ground, this.onGroundHit, null, this);
    this.physics.add.overlap(this.player, this.meteors, this.onHit, null, this);

    // power-up collisions
    this.physics.add.overlap(this.player, this.guns, this.onGunPickup, null, this);
    this.physics.add.overlap(this.player, this.secretBoxes, this.onSecretBoxPickup, null, this);

    // bullet collisions
    this.physics.add.overlap(this.bullets, this.meteors, this.onBulletHit, null, this);

    // spawn loop
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnInterval,
      loop: true,
      callback: this.spawnMeteor,
      callbackScope: this
    });

    // Spawn first meteor immediately
    this.spawnMeteor();

    // Spawn power-ups only when no power-up is active
    this.time.addEvent({
      delay: GAME_SETTINGS.gunSpawnInterval,
      loop: true,
      callback: this.spawnGun,
      callbackScope: this
    });

    this.time.addEvent({
      delay: GAME_SETTINGS.secretBoxSpawnInterval,
      loop: true,
      callback: this.spawnSecretBox,
      callbackScope: this
    });

    // difficulty increase
    this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => {
        this.spawnInterval = Math.max(GAME_SETTINGS.minSpawnInterval, this.spawnInterval - GAME_SETTINGS.difficultyIncrease);
        this.spawnInterval = Math.max(GAME_SETTINGS.minSpawnInterval, this.spawnInterval - GAME_SETTINGS.difficultyIncrease);
        this.spawnTimer.delay = this.spawnInterval;
      }
    });

    // UI
    this.strikesText = this.add.text(10, 10, 'Strikes: 0', { fontSize: '20px', fill: '#ffffff' });
    this.powerUpText = this.add.text(10, 40, '', { fontSize: '16px', fill: '#ffff00' });
    this.gunTimerText = this.add.text(10, 70, '', { fontSize: '14px', fill: '#00ff00' });

    // Start game timer
    this.gameStartTime = this.time.now;
  }

  resetGameStats() {
    this.strikes = 0;
    this.spawnInterval = GAME_SETTINGS.initialSpawnInterval;
    this.playerHasGun = false;
    this.powerUpActive = false;
    this.playerHit = false;

    // Clear any existing timers
    if (this.gunTimer) {
      this.gunTimer.destroy();
      this.gunTimer = null;
    }
    if (this.playerHitTimer) {
      this.playerHitTimer.destroy();
      this.playerHitTimer = null;
    }


    // Remove player gun if exists
    if (this.playerGun) {
      this.playerGun.destroy();
      this.playerGun = null;
    }

    // Clear power-up groups
    if (this.guns) {
      this.guns.clear(true, true);
    }
    if (this.secretBoxes) {
      this.secretBoxes.clear(true, true);
    }
    if (this.bullets) {
      this.bullets.clear(true, true);
    }

    // Clear UI texts
    if (this.powerUpText) {
      this.powerUpText.setText('');
    }
    if (this.gunTimerText) {
      this.gunTimerText.setText('');
    }
  }

  spawnMeteor() {
    const x = Phaser.Math.Between(20, this.scale.width - 20);
    const m = this.meteors.create(x, -20, 'meteor');
    m.setVelocityY(Phaser.Math.Between(150, 300));
    m.setData('hit', false);
    m.setData('startX', x);
    m.setData('startTime', this.time.now);

    // Add rotation animation
    m.play('meteor_rotate');

    // Add zigzag movement if enabled
    if (GAME_SETTINGS.meteorZigzag) {
      m.setData('zigzag', true);
    }
  }

  spawnGun() {
    if (this.powerUpActive) return; // Don't spawn if another power-up is active

    const x = Phaser.Math.Between(50, this.scale.width - 50);
    const gun = this.guns.create(x, -20, 'gun');
    gun.setVelocityY(200);
    gun.setScale(1);
    //gun.setTint(0x00ff00); // Green tint to distinguish from meteors
    gun.setData('type', 'gun');
  }

  spawnSecretBox() {
    if (this.powerUpActive) return; // Don't spawn if another power-up is active

    const x = Phaser.Math.Between(50, this.scale.width - 50);
    const box = this.secretBoxes.create(x, -20, 'meteor'); // Using meteor sprite for now
    box.setVelocityY(100);
    box.setTint(0xff00ff);
    box.setScale(0.6);
    box.setData('type', 'secretBox');
  }

  onGunPickup(player, gun) {
    if (this.powerUpActive) return;

    this.sound.play('hit'); // Using hit sound for gun pickup
    gun.destroy();

    this.powerUpActive = true;
    this.playerHasGun = true;
    this.powerUpText.setText('🔫 GUN ACTIVATED! Press SPACE to shoot!');

    // Add gun to player's hand
    this.playerGun = this.add.sprite(this.player.x + 15, this.player.y - 5, 'gun');
    this.playerGun.setScale(0.6);
    this.playerGun.setTint(0x00ff00);

    // Gun lasts for configured duration
    this.gunTimer = this.time.addEvent({
      delay: GAME_SETTINGS.gunDuration,
      callback: () => {
        this.playerHasGun = false;
        this.powerUpActive = false;
        this.powerUpText.setText('');
        this.gunTimerText.setText('');
        // Remove gun from player's hand
        if (this.playerGun) {
          this.playerGun.destroy();
          this.playerGun = null;
        }
      }
    });
  }

  onSecretBoxPickup(player, box) {
    if (this.powerUpActive) return;

    this.sound.play('hit'); // Using hit sound for box pickup
    box.destroy();

  }

  shootBullet() {
    if (!this.playerHasGun) return;

    const bullet = this.bullets.create(this.player.x + 15, this.player.y - 10, 'bullet');
    bullet.setScale(1.2); // Made bullet bigger
    bullet.setTint(0xffff00); // Yellow tint to distinguish from meteors
    bullet.setVelocityY(-GAME_SETTINGS.bulletSpeed);

    // Disable gravity for bullets
    bullet.body.setGravityY(0);

    // Play gun fire animation at gun position
    const fireEffect = this.add.sprite(this.player.x + 15, this.player.y - 5, 'fire').setDepth(10);
    this.tweens.add({
      targets: fireEffect,
      alpha: 0,
      duration: 1000,
      onComplete: () => fireEffect.destroy()
    });
    // fireEffect.setTint(0xff6600); // Orange tint for fire effect
    //fireEffect.play('gun_fire_anim');
    // fireEffect.once('animationcomplete', () => {
    //   fireEffect.destroy();
    // });

    // Play gun fire sound
    this.sound.play('gun_fire');

    // Bullet will be cleaned up in update() when it goes off screen
  }

  onBulletHit(bullet, meteor) {
    bullet.destroy();

    // Play explosion animation
    const boom = this.add.sprite(meteor.x, meteor.y, 'explosion');
    boom.play('explode');
    this.sound.play('hit');

    meteor.destroy();
  }

  onHit(player, meteor) {
    this.sound.play('hit');
    if (meteor.getData('hit')) return;

    meteor.setData('hit', true);
    meteor.destroy();
    this.strikes++;
    this.strikesText.setText(`Strikes: ${this.strikes}`);

    // Play hit animation
    this.playerHit = true;
    this.player.play('player_hit');
    this.player.once('animationcomplete-player_hit', () => {
      this.playerHit = false;
      // decide walk or idle here
      this.player.play(this.player.body.blocked.down ? 'player_idle' : 'player_jump');
    });

    // Reset hit animation after it completes
    this.playerHitTimer = this.time.delayedCall(1000, () => {
      this.playerHit = false;
      this.playerHitTimer = null;
    });

    if (this.strikes >= 3) {
      this.sound.stopAll();
      // pause or stop the GameScene
      this.scene.pause();            // optional, since restart will stop it anyway        
      this.scene.start('GameOverScene', { score: this.time.now - this.gameStartTime });
    }
  }

  onGroundHit(meteor, ground) {
    // spawn an explosion at the meteor's position
    const boom = this.add.sprite(meteor.x, meteor.y, 'explosion');
    boom.play('explode');
    this.sound.play('thud');

    meteor.destroy();  // remove the falling meteor
    // Ground remains intact - no destruction
  }

  update() {

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      if (this.playerHasGun) {
        this.shootBullet();
      } else if (this.player.body.blocked.down) {
        this.player.setVelocityY(-400);
        this.sound.play('jump');
      }
    }

    if (this.moveToX !== null) {
      // moving left & overshot?
      if (this.player.body.velocity.x < 0 && this.player.x <= this.moveToX
        || this.player.body.velocity.x > 0 && this.player.x >= this.moveToX) {
        this.player.setVelocityX(0);
        this.moveToX = null;
      }
    }
    // Update gun position on player
    if (this.playerHasGun && this.playerGun) {
      this.playerGun.setPosition(this.player.x + 15, this.player.y - 5);
    }

    // Update gun timer display
    if (this.playerHasGun && this.gunTimer) {
      const remainingTime = Math.ceil(this.gunTimer.getRemainingSeconds());
      this.gunTimerText.setText(`🔫 Gun: ${remainingTime}s`);
    }

    // Update meteor zigzag movement
    this.meteors.getChildren().forEach(meteor => {
      if (meteor.getData('zigzag')) {
        const time = this.time.now - meteor.getData('startTime');
        const startX = meteor.getData('startX');
        const zigzagX = startX + Math.sin(time * 0.001 * GAME_SETTINGS.zigzagFrequency) * GAME_SETTINGS.zigzagAmplitude;
        meteor.setX(zigzagX);
      }
    });

    // Clean up bullets that go off screen
    this.bullets.getChildren().forEach(bullet => {
      if (bullet.y < -50) {
        bullet.destroy();
      }
    });

    // Determine if the player is currently moving horizontally
    const isMoving = this.player.body.velocity.x !== 0;

    // Handle player animations based on isMoving / in-air
    this.handlePlayerAnimations(isMoving);

    // occasional camera shake
    if (Phaser.Math.Between(0, 1000) < 2) {
      this.cameras.main.shake(200, 0.01);
    }

  }

  handlePlayerAnimations(isMoving) {
    // if in hit animation, bail out
    if (this.playerHit) return;

    // jumping
    if (!this.player.body.blocked.down) {
      if (this.player.anims.currentAnim?.key !== 'player_jump') {
        this.player.play('player_jump');
      }
    }
    // walking
    else if (isMoving) {
      if (this.player.anims.currentAnim?.key !== 'player_walk') {
        this.player.play('player_walk');
      }
    }
    // idle
    else {
      if (this.player.anims.currentAnim?.key !== 'player_idle') {
        this.player.play('player_idle');
      }
    }
  }

}
