// main.js
const config = {

  type: Phaser.AUTO,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,      // or Phaser.Scale.RESIZE
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,    // initial size
    height: window.innerHeight,
  },
  physics: { default: 'arcade', arcade: { gravity: { y: 600 } } },
  scene: [ BootScene, LoadingScene, MenuScene, GameScene, GameOverScene ],


  // type: Phaser.AUTO,
  // width: 480,
  // height: 640,
  // scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  // physics: { default: 'arcade', arcade: { gravity: { y: 600 } } },
  // audio: { disableWebAudio: true },    // ← use HTML5 Audio
};

const game = new Phaser.Game(config);
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

