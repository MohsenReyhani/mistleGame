class GameScene extends Phaser.Scene {
    constructor() {
      super('GameScene');
      this.strikes = 0;
      this.spawnInterval = 2000;
    }

    create() {
      const { width, height } = this.scale;

      // background
      this.add.image(width/2, height/2, 'game_bg')
          .setDisplaySize(width, height);

      // audio
      this.sound.play('bgm', { loop: true, volume: 0.5 });

      // ground
      const ground = this.add.rectangle(width/2, height, width, 16)
          .setOrigin(0.5, 1)
          .setFillStyle(0x333333);
      this.physics.add.existing(ground, true);

      // player
      this.player = this.physics.add.sprite(width/2, height - 100, 'player')
          .setCollideWorldBounds(true);

      // meteors
      this.meteors = this.physics.add.group();

      // collisions
      this.physics.add.collider(this.player, ground);
      this.physics.add.collider(this.meteors, ground, this.onGroundHit, null, this);
      this.physics.add.overlap(this.player, this.meteors, this.onHit, null, this);

      // jump on tap/space
      this.input.on('pointerdown', () => {
        if (this.player.body.blocked.down) {
          this.player.setVelocityY(-400);
          this.sound.play('jump');
        }
      });

      // explosion anim
      const totalFrames = this.textures.get('explosion').frameTotal;
      this.anims.create({
        key: 'explode',
        frames: this.anims.generateFrameNumbers('explosion', {
          start: 0,
          end: totalFrames - 1
        }),
        frameRate: 20,
        hideOnComplete: true
      });

      // spawn loop
      this.spawnTimer = this.time.addEvent({
        delay: this.spawnInterval,
        loop: true,
        callback: this.spawnMeteor,
        callbackScope: this
      });
      this.time.addEvent({
        delay: 1000, loop: true,
        callback: () => {
          this.spawnInterval = Math.max(200, this.spawnInterval - 20);
          this.spawnTimer.reset({
            delay: this.spawnInterval,
            loop: true,
            callback: this.spawnMeteor,
            callbackScope: this
          });
        }
      });

      // UI
      this.strikesText = this.add.text(10, 10, 'Strikes: 0', { fontSize: '20px' });
    }
  
    spawnMeteor() {
      const x = Phaser.Math.Between(20, this.scale.width - 20);
      const m = this.meteors.create(x, -20, 'meteor');
      m.setVelocityY(Phaser.Math.Between(150, 300));
      m.setData('hit', false);
    }
  
    onHit(player, meteor) {
      this.sound.play('hit');
      if (meteor.getData('hit')) return;
      
      meteor.setData('hit', true);
      meteor.destroy();
      this.strikes++;
      this.strikesText.setText(`Strikes: ${this.strikes}`);
      if (this.strikes >= 3) {
        this.scene.start('GameOverScene', { score: this.time.now });
      }
    }

    onGroundHit(meteor, ground) {
      // spawn an explosion at the meteor’s position
      const boom = this.add.sprite(meteor.x, meteor.y, 'explosion');
      boom.play('explode');
      this.sound.play('thud');
    
      meteor.destroy();  // remove the falling meteor
    }
  
    update() {

      // at top of update():
      const cursors = this.input.keyboard.createCursorKeys();

      // jumping: only allow if touching down
      if (Phaser.Input.Keyboard.JustDown(cursors.up) && this.player.body.touching.down) {
        this.player.setVelocityY(-400);
      }

      const speed = 300;
      if (cursors.left.isDown) this.player.setVelocityX(-speed);
      else if (cursors.right.isDown) this.player.setVelocityX(speed);
      else this.player.setVelocityX(0);
  
      // occasional camera shake
      if (Phaser.Math.Between(0, 1000) < 2) {
        this.cameras.main.shake(200, 0.01);
      }
    }
  }
  