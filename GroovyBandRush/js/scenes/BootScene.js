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

    // Player vehicle is now generated procedurally in generatePlaceholders()
    // this.load.image('van', '../images/cartoon/suv.png');

    // Load L.A. Young headshot for main menu
    this.load.image('la_headshot', '../images/artist/headshot3.jpg');

    // Load L.A. Young cartoon illustration for Prologue Hero Splash
    this.load.image('la_cartoon', '../images/cartoon/LAYoungCartoon3.png');
  },

  create: function () {
    this.generatePlaceholders();
    // Use game.scene (global SceneManager) - scene plugin's start() is unreliable from create()
    this.game.scene.stop('BootScene');
    this.game.scene.start('MainMenuScene');
  },

  generatePlaceholders: function () {
    var g;

    // --- Player car (top-down, blue, facing UP) ---
    g = this.make.graphics({ x: 0, y: 0, add: false });
    // Car body
    g.fillStyle(0x2266dd);
    g.fillRoundedRect(8, 4, 44, 82, { tl: 14, tr: 14, bl: 8, br: 8 });
    // Darker side panels
    g.fillStyle(0x1a55bb, 0.6);
    g.fillRect(8, 20, 8, 50);
    g.fillRect(44, 20, 8, 50);
    // Windshield (at top = front of car facing up)
    g.fillStyle(0x88ccff, 0.8);
    g.fillRoundedRect(14, 10, 32, 18, { tl: 8, tr: 8, bl: 3, br: 3 });
    // Rear window
    g.fillStyle(0x334466, 0.7);
    g.fillRoundedRect(16, 66, 28, 12, { tl: 3, tr: 3, bl: 6, br: 6 });
    // Roof highlight
    g.fillStyle(0x66aaff, 0.3);
    g.fillRoundedRect(18, 32, 24, 28, 4);
    // Hood line
    g.lineStyle(1, 0x4488ee, 0.5);
    g.lineBetween(30, 12, 30, 28);
    // Headlights (top = front)
    g.fillStyle(0xffffcc);
    g.fillCircle(16, 8, 4);
    g.fillCircle(44, 8, 4);
    // Taillights (bottom = rear)
    g.fillStyle(0xff3333);
    g.fillRect(12, 82, 8, 4);
    g.fillRect(40, 82, 8, 4);
    // Side mirrors
    g.fillStyle(0x2266dd);
    g.fillRect(4, 22, 6, 8);
    g.fillRect(50, 22, 6, 8);
    // Neon underglow
    g.fillStyle(0x00e5ff, 0.15);
    g.fillRoundedRect(6, 6, 48, 78, 10);
    g.generateTexture('van', 60, 90);
    g.destroy();

    // --- Obstacle: oncoming car (top-down, 3 color variants) ---
    var obsCols = [0xe63946, 0xcc5500, 0x888888]; // red, orange, grey
    for (var oi = 0; oi < obsCols.length; oi++) {
      g = this.make.graphics({ x: 0, y: 0, add: false });
      var oc = obsCols[oi];
      // Car body (facing DOWN = oncoming)
      g.fillStyle(oc);
      g.fillRoundedRect(6, 2, 28, 56, { tl: 10, tr: 10, bl: 6, br: 6 });
      // Windshield (near top since car faces us)
      g.fillStyle(0x88ccff, 0.7);
      g.fillRoundedRect(10, 6, 20, 12, 4);
      // Rear window
      g.fillStyle(0x334455, 0.6);
      g.fillRoundedRect(12, 44, 16, 8, 3);
      // Headlights (at top = facing us)
      g.fillStyle(0xffffaa);
      g.fillCircle(10, 6, 3);
      g.fillCircle(30, 6, 3);
      // Taillights (at bottom)
      g.fillStyle(0xff2222);
      g.fillRect(8, 54, 6, 3);
      g.fillRect(26, 54, 6, 3);
      // Side highlight
      g.fillStyle(0xffffff, 0.15);
      g.fillRoundedRect(8, 8, 10, 42, 3);
      g.generateTexture('obstacle_car_' + oi, 40, 60);
      g.destroy();
    }
    // Default obstacle key still works (pick random in runner scene)
    // Generate a fallback 'obstacle' using the red car
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xe63946);
    g.fillRoundedRect(6, 2, 28, 56, { tl: 10, tr: 10, bl: 6, br: 6 });
    g.fillStyle(0x88ccff, 0.7);
    g.fillRoundedRect(10, 6, 20, 12, 4);
    g.fillStyle(0x334455, 0.6);
    g.fillRoundedRect(12, 44, 16, 8, 3);
    g.fillStyle(0xffffaa);
    g.fillCircle(10, 6, 3);
    g.fillCircle(30, 6, 3);
    g.fillStyle(0xff2222);
    g.fillRect(8, 54, 6, 3);
    g.fillRect(26, 54, 6, 3);
    g.fillStyle(0xffffff, 0.15);
    g.fillRoundedRect(8, 8, 10, 42, 3);
    g.generateTexture('obstacle', 40, 60);
    g.destroy();

    // --- Dollar collectible (green bill with $ sign) ---
    g = this.make.graphics({ x: 0, y: 0, add: false });
    // Bill background
    g.fillStyle(0x1a8a3a);
    g.fillRoundedRect(0, 4, 40, 24, 3);
    // Inner border
    g.lineStyle(1, 0x2ecc71, 0.8);
    g.strokeRoundedRect(2, 6, 36, 20, 2);
    // Light green center strip
    g.fillStyle(0x2ecc71, 0.4);
    g.fillRect(4, 10, 32, 12);
    // $ symbol in center
    g.fillStyle(0xffffff);
    g.fillRect(18, 8, 4, 16);     // vertical bar
    g.fillRect(14, 8, 12, 3);     // top horizontal
    g.fillRect(14, 14, 12, 3);    // middle horizontal
    g.fillRect(14, 21, 12, 3);    // bottom horizontal
    g.fillRect(14, 8, 4, 9);      // top-left curve
    g.fillRect(22, 14, 4, 10);    // bottom-right curve
    // Sparkle corners
    g.fillStyle(0xffd700);
    g.fillCircle(4, 4, 3);
    g.fillCircle(36, 4, 3);
    g.generateTexture('dollar', 40, 32);
    g.destroy();

    // --- Instrument collectible (golden sax silhouette) ---
    g = this.make.graphics({ x: 0, y: 0, add: false });
    // Golden glow circle
    g.fillStyle(0xffd700, 0.3);
    g.fillCircle(20, 20, 20);
    // Inner bright circle
    g.fillStyle(0xffd700);
    g.fillCircle(20, 20, 14);
    // Music note symbol
    g.fillStyle(0x1a0a2e);
    g.fillCircle(16, 24, 5);     // note head
    g.fillRect(20, 8, 3, 16);    // stem
    g.fillRect(20, 8, 8, 3);     // flag top
    g.fillRect(25, 8, 3, 8);     // flag side
    // Shine
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(14, 14, 4);
    g.generateTexture('instrument', 40, 40);
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
