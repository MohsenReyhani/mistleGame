// Game Settings - Easy to modify
const GAME_SETTINGS = {
  // Dark mode settings
  darkModeDuration: 8000, // 8 seconds
  lightCircleRadius: 150, // Light circle around player
  darkOverlayAlpha: 0.8,  // How dark the screen gets
  
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
      this.darkModeActive = false;
      this.darkModeTimer = null;
      this.darkOverlay = null;
      this.lightMask = null;
      this.powerUpActive = false; // Prevent multiple power-ups at once
      this.playerHit = false; // Track if player is in hit animation
      this.playerHitTimer = null; // Timer for hit animation
    }

    create() {
      const { width, height } = this.scale;

      // Reset game stats
      this.resetGameStats();

      // background
      this.add.image(width/2, height/2, 'game_bg')
          .setDisplaySize(width, height);

      // audio
      this.sound.play('bgm', { loop: true, volume: 0.3 });

      // ground - make it indestructible
      this.ground = this.add.rectangle(width/2, height - 8, width, 16)
          .setOrigin(0.5, 0.5)
          .setFillStyle(0x333333);
      this.physics.add.existing(this.ground, true);

      // player with idle animation - using character from sprite sheet
      this.player = this.physics.add.sprite(width/2, height - 100, 'hero')
          .setCollideWorldBounds(true);
      this.player.play('player_idle');

      // meteors
      this.meteors = this.physics.add.group();

      // power-ups
      this.guns = this.physics.add.group();
      this.secretBoxes = this.physics.add.group();

      // bullets for gun
      this.bullets = this.physics.add.group();

      // collisions
      this.physics.add.collider(this.player, this.ground);
      this.physics.add.collider(this.meteors, this.ground, this.onGroundHit, null, this);
      this.physics.add.overlap(this.player, this.meteors, this.onHit, null, this);
      
      // power-up collisions
      this.physics.add.overlap(this.player, this.guns, this.onGunPickup, null, this);
      this.physics.add.overlap(this.player, this.secretBoxes, this.onSecretBoxPickup, null, this);
      
      // bullet collisions
      this.physics.add.overlap(this.bullets, this.meteors, this.onBulletHit, null, this);

      // keyboard input
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = this.input.keyboard.addKeys('W,A,S,D');

      // jump on tap/space
      this.input.on('pointerdown', () => {
        if (this.player.body.blocked.down) {
          this.player.setVelocityY(-400);
          this.sound.play('jump');
        }
      });

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
          this.spawnTimer.reset({
            delay: this.spawnInterval,
            loop: true,
            callback: this.spawnMeteor,
            callbackScope: this
          });
        }
      });

      // UI
      this.strikesText = this.add.text(10, 10, 'Strikes: 0', { fontSize: '20px', fill: '#ffffff' });
      this.powerUpText = this.add.text(10, 40, '', { fontSize: '16px', fill: '#ffff00' });
      this.gunTimerText = this.add.text(10, 70, '', { fontSize: '14px', fill: '#00ff00' });
      this.darkModeTimerText = this.add.text(10, 100, '', { fontSize: '14px', fill: '#ff00ff' });
      
      // Start game timer
      this.gameStartTime = this.time.now;
    }

    resetGameStats() {
      this.strikes = 0;
      this.spawnInterval = GAME_SETTINGS.initialSpawnInterval;
      this.playerHasGun = false;
      this.darkModeActive = false;
      this.powerUpActive = false;
      this.playerHit = false;
      
      // Clear any existing timers
      if (this.gunTimer) {
        this.gunTimer.destroy();
        this.gunTimer = null;
      }
      if (this.darkModeTimer) {
        this.darkModeTimer.destroy();
        this.darkModeTimer = null;
      }
      if (this.playerHitTimer) {
        this.playerHitTimer.destroy();
        this.playerHitTimer = null;
      }
      
      // Remove dark overlay if exists
      if (this.darkOverlay) {
        this.darkOverlay.destroy();
        this.darkOverlay = null;
      }
      if (this.lightMask) {
        this.lightMask.destroy();
        this.lightMask = null;
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
      if (this.darkModeTimerText) {
        this.darkModeTimerText.setText('');
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
      
      // Activate dark mode
      this.activateDarkMode();
    }

    activateDarkMode() {
      this.powerUpActive = true;
      this.darkModeActive = true;
      this.powerUpText.setText('🌙 DARK MODE ACTIVATED!');
      
      // Create completely black overlay
      this.darkOverlay = this.add.rectangle(
        this.scale.width/2, 
        this.scale.height/2, 
        this.scale.width, 
        this.scale.height, 
        0x000000, 
        1.0 // Completely black
      );
      
      // Create a mask for the light circle
      this.lightMask = this.add.graphics();
      this.lightMask.fillStyle(0xffffff);
      this.lightMask.fillCircle(this.player.x, this.player.y, GAME_SETTINGS.lightCircleRadius);
      
      // Apply the mask to the dark overlay to create a hole
      this.darkOverlay.setMask(this.lightMask.createGeometryMask());
      
      // Dark mode lasts for configured duration
      this.darkModeTimer = this.time.addEvent({
        delay: GAME_SETTINGS.darkModeDuration,
        callback: () => {
          this.deactivateDarkMode();
        }
      });
    }

    deactivateDarkMode() {
      this.darkModeActive = false;
      this.powerUpActive = false;
      this.powerUpText.setText('');
      this.darkModeTimerText.setText('');
      
      if (this.darkOverlay) {
        this.darkOverlay.destroy();
        this.darkOverlay = null;
      }
      if (this.lightMask) {
        this.lightMask.destroy();
        this.lightMask = null;
      }
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
      const fireEffect = this.add.sprite(this.player.x + 15, this.player.y - 5, 'fire');
      fireEffect.setTint(0xff6600); // Orange tint for fire effect
      fireEffect.play('gun_fire_anim');
      fireEffect.once('animationcomplete', () => {
        fireEffect.destroy();
      });
      
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
      // Update light mask position in dark mode
      if (this.darkModeActive && this.lightMask) {
        this.lightMask.clear();
        this.lightMask.fillStyle(0xffffff);
        this.lightMask.fillCircle(this.player.x, this.player.y, GAME_SETTINGS.lightCircleRadius);
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

      // Update dark mode timer display
      if (this.darkModeActive && this.darkModeTimer) {
        const remainingTime = Math.ceil(this.darkModeTimer.getRemainingSeconds());
        this.darkModeTimerText.setText(`🌙 Dark Mode: ${remainingTime}s`);
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

      // jumping: only allow if touching down (arrow up or W for jump)
      if ((Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.W)) && this.player.body.touching.down) {
        this.player.setVelocityY(-400);
        this.sound.play('jump');
        // Play jump animation
        this.player.play('player_jump');
      }

      // Shooting with gun (only if player has gun and not jumping)
      if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && this.playerHasGun && !this.player.body.touching.down) {
        this.shootBullet();
      }

      const speed = 300;
      let isMoving = false;
      
      // Movement: Arrow keys OR WASD (A/D for left/right, W for jump)
      if (this.cursors.left.isDown || this.wasd.A.isDown) {
        this.player.setVelocityX(-speed);
        isMoving = true;
      }
      else if (this.cursors.right.isDown || this.wasd.D.isDown) {
        this.player.setVelocityX(speed);
        isMoving = true;
      }
      else {
        this.player.setVelocityX(0);
      }

      // Handle player animations
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
  