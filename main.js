// main.js
const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 640,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { y: 600 } } },
  audio: { disableWebAudio: true },    // ← use HTML5 Audio
  scene: [ BootScene, LoadingScene, MenuScene, GameScene, GameOverScene ]
};
new Phaser.Game(config);
