/* GroovyBandRush/js/scenes/BootScene.js */

var BootScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function BootScene() {
    Phaser.Scene.call(this, { key: 'BootScene' });
  },

  preload: function () {
    // Show loading bar
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;

    var progressBox = this.add.graphics();
    var progressBar = this.add.graphics();

    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 15, 320, 30, 8);

    var loadingText = this.add.text(width / 2, height / 2 - 40, 'Loading...', {
      fontFamily: GBR.FONTS.display,
      fontSize: '24px',
      color: '#ffd700'
    }).setOrigin(0.5);

    this.load.on('progress', function (value) {
      progressBar.clear();
      progressBar.fillStyle(0xffd700, 1);
      progressBar.fillRoundedRect(width / 2 - 155, height / 2 - 10, 310 * value, 20, 6);
    });

    this.load.on('complete', function () {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Load band member character art (SVG)
    for (var i = 0; i < 5; i++) {
      this.load.svg('member_' + i, 'assets/sprites/member_' + i + '.svg', { width: 200, height: 300 });
    }

    // Load per-member outfit card art (SVG) - 5 members x 3 outfits
    for (var m = 0; m < 5; m++) {
      for (var o = 0; o < 3; o++) {
        this.load.svg('outfit_' + m + '_' + o, 'assets/sprites/outfit_' + m + '_' + o + '.svg', { width: 120, height: 160 });
      }
    }

    // Load L.A. Young avatar (default / fallback)
    this.load.image('la_avatar', '../images/la-avatar.png');

    // Load L.A. Young talking head photo (used for StoryScene portraits)
    this.load.image('la_talking_head', '../images/artist/IMG_3118.jpg');

    // Load L.A. Young outfit photos for SingerOutfitScene
    this.load.image('la_outfit_0', '../images/artist/LAPopSinger.jpeg');
    this.load.image('la_outfit_1', '../images/artist/LAYoungPink.JPG');
    this.load.image('la_outfit_2', '../images/artist/laPowerSister.png');

    // Load SUV image for Act1 player vehicle
    this.load.image('van', '../images/cartoon/suv.png');

    // Load L.A. Young headshot for main menu
    this.load.image('la_headshot', '../images/artist/headshot3.jpg');
  },

  create: function () {
    this.generatePlaceholders();
    // Use game.scene (global SceneManager) - scene plugin's start() is unreliable from create()
    this.game.scene.stop('BootScene');
    this.game.scene.start('MainMenuScene');
  },

  generatePlaceholders: function () {
    var g;

    // Van is now loaded as an image (suv.png) in preload()

    // --- Obstacle (rock) ---
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x666666);
    g.fillCircle(20, 20, 20);
    g.fillStyle(0x888888);
    g.fillCircle(16, 14, 8);
    g.generateTexture('obstacle', 40, 40);
    g.destroy();

    // --- Dollar collectible ---
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x32cd32);
    g.fillCircle(16, 16, 16);
    g.fillStyle(0xffffff);
    g.fillRect(12, 6, 2, 20);
    g.fillRect(14, 6, 6, 2);
    g.fillRect(14, 14, 4, 2);
    g.fillRect(14, 24, 6, 2);
    g.generateTexture('dollar', 32, 32);
    g.destroy();

    // --- Instrument collectible ---
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffd700);
    g.fillCircle(18, 18, 18);
    g.fillStyle(0x1a1a2e);
    g.fillCircle(18, 18, 10);
    g.fillStyle(0xffd700);
    g.fillCircle(18, 18, 4);
    g.generateTexture('instrument', 36, 36);
    g.destroy();

    // Band member textures loaded from SVG in preload()
    // (member_0 through member_4)

    // --- Drum pads (4 colors) ---
    var drumColors = [0xe63946, 0x3498db, 0x2ecc71, 0xffd700];
    for (var d = 0; d < 4; d++) {
      g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(drumColors[d]);
      g.fillCircle(50, 50, 50);
      g.fillStyle(0xffffff, 0.3);
      g.fillCircle(40, 35, 20);
      g.generateTexture('drum_' + d, 100, 100);
      g.destroy();

      // Highlighted version
      g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff);
      g.fillCircle(50, 50, 50);
      g.fillStyle(drumColors[d], 0.6);
      g.fillCircle(50, 50, 45);
      g.generateTexture('drum_' + d + '_lit', 100, 100);
      g.destroy();
    }

    // --- Piano keys (8 colors for one octave) ---
    var keyColors = [0xe63946, 0xe8751a, 0xffd700, 0x2ecc71, 0x3498db, 0x6c3483, 0xe84393, 0xf39c12];
    for (var k = 0; k < 8; k++) {
      g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(keyColors[k]);
      g.fillRoundedRect(0, 0, 80, 140, { tl: 6, tr: 6, bl: 16, br: 16 });
      g.fillStyle(0xffffff, 0.25);
      g.fillRoundedRect(4, 4, 72, 40, 4);
      g.generateTexture('pianokey_' + k, 80, 140);
      g.destroy();

      // Pressed version
      g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff);
      g.fillRoundedRect(0, 0, 80, 140, { tl: 6, tr: 6, bl: 16, br: 16 });
      g.fillStyle(keyColors[k], 0.4);
      g.fillRoundedRect(2, 2, 76, 136, { tl: 5, tr: 5, bl: 15, br: 15 });
      g.generateTexture('pianokey_' + k + '_lit', 80, 140);
      g.destroy();
    }

    // --- Match-three tiles (5 instrument types + microphone wildcard) ---
    var tileColors = [0xe63946, 0x3498db, 0x2ecc71, 0x9b59b6, 0xe8751a, 0xffd700];
    var tileSymbols = ['G', 'S', 'D', 'B', 'P', 'M']; // Guitar, Sax, Drums, Bass, Piano, Mic
    for (var t = 0; t < 6; t++) {
      g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(tileColors[t]);
      g.fillRoundedRect(0, 0, 64, 64, 12);
      g.fillStyle(0xffffff, 0.3);
      g.fillRoundedRect(4, 4, 56, 28, 8);
      g.generateTexture('tile_' + t, 64, 64);
      g.destroy();
    }

    // --- Rhythm note ---
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffd700);
    g.fillCircle(24, 24, 24);
    g.fillStyle(0x1a1a2e);
    g.fillCircle(24, 24, 16);
    g.generateTexture('note', 48, 48);
    g.destroy();

    // --- Star particle ---
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffd700);
    // Draw a simple diamond/star shape manually
    g.fillTriangle(8, 0, 12, 8, 4, 8);   // top
    g.fillTriangle(4, 8, 12, 8, 8, 16);   // bottom
    g.fillTriangle(0, 8, 8, 4, 8, 12);    // left
    g.fillTriangle(16, 8, 8, 4, 8, 12);   // right
    g.generateTexture('star', 16, 16);
    g.destroy();

    // --- Simple white particle ---
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle', 8, 8);
    g.destroy();

    // --- Button background ---
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xe8751a);
    g.fillRoundedRect(0, 0, 240, 64, 32);
    g.generateTexture('btn_orange', 240, 64);
    g.destroy();

    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffd700);
    g.fillRoundedRect(0, 0, 240, 64, 32);
    g.generateTexture('btn_gold', 240, 64);
    g.destroy();

    // Outfit card textures loaded from SVG in preload()
    // (outfit_0, outfit_1, outfit_2)

    // --- Road stripe ---
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 8, 40);
    g.generateTexture('road_stripe', 8, 40);
    g.destroy();

    // --- Heart (life indicator) ---
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xe63946);
    g.fillCircle(8, 10, 8);
    g.fillCircle(20, 10, 8);
    g.fillTriangle(0, 14, 28, 14, 14, 28);
    g.generateTexture('heart', 28, 28);
    g.destroy();

    // --- Empty heart ---
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x444444);
    g.fillCircle(8, 10, 8);
    g.fillCircle(20, 10, 8);
    g.fillTriangle(0, 14, 28, 14, 14, 28);
    g.generateTexture('heart_empty', 28, 28);
    g.destroy();
  }
});
