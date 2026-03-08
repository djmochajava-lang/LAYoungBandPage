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

    // Load band member character art (updated cartoon PNGs)
    var memberPaths = [
      '../images/band/Sax.png',         // member_0 = Eugene Chapman (Saxophone)
      '../images/band/bassPlayer.png',   // member_1 = Kevin Walker (Bass)
      '../images/band/guiatur.png',      // member_2 = Kevin Robinson (Guitar)
      '../images/band/drums.png',        // member_3 = Jimmy Carney (Drums)
      '../images/band/LA-Singer.png'     // member_4 = L.A. Young (Vocals)
    ];
    for (var i = 0; i < 5; i++) {
      this.load.image('member_' + i, memberPaths[i]);
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
    // Remove white/grey backgrounds from band member PNGs (make transparent)
    this.removeBgFromTextures();
    this.generatePlaceholders();
    // Use game.scene (global SceneManager) - scene plugin's start() is unreliable from create()
    this.game.scene.stop('BootScene');
    this.game.scene.start('MainMenuScene');
  },

  /**
   * Flood-fill remove light backgrounds from band member & la_cartoon images.
   * Converts connected light/unsaturated background pixels to fully transparent.
   * Uses the same approach as LAFace.processTexture but sets alpha=0 instead of dark fill.
   */
  removeBgFromTextures: function () {
    var game = this.game;
    var keysToProcess = ['member_0', 'member_1', 'member_2', 'member_3', 'member_4'];

    for (var k = 0; k < keysToProcess.length; k++) {
      var texKey = keysToProcess[k];
      var tex = game.textures.get(texKey);
      if (!tex || !tex.source || !tex.source[0]) continue;

      var source = tex.getSourceImage();
      var w = source.width, h = source.height;
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      var ctx = c.getContext('2d');
      ctx.drawImage(source, 0, 0);

      var imageData = ctx.getImageData(0, 0, w, h);
      var data = imageData.data;

      // Is pixel a "light unsaturated background" candidate?
      function isBG(idx) {
        var r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
        if (a < 10) return true; // already transparent
        var brightness = (r + g + b) / 3;
        var sat = Math.max(r, g, b) - Math.min(r, g, b);
        return sat < 70 && brightness > 180;
      }

      // Flood-fill mask from all four edges
      var mask = new Uint8Array(w * h);
      var queue = [];
      var x, y;
      for (x = 0; x < w; x++) {
        if (isBG(x * 4))                 { mask[x] = 1; queue.push(x); }
        if (isBG(((h - 1) * w + x) * 4)) { mask[(h - 1) * w + x] = 1; queue.push((h - 1) * w + x); }
      }
      for (y = 0; y < h; y++) {
        if (isBG(y * w * 4))             { mask[y * w] = 1; queue.push(y * w); }
        if (isBG((y * w + w - 1) * 4))   { mask[y * w + w - 1] = 1; queue.push(y * w + w - 1); }
      }

      // BFS flood fill
      var head = 0;
      while (head < queue.length) {
        var pos = queue[head++];
        var px = pos % w, py = (pos - px) / w;
        var neighbours = [];
        if (px > 0)     neighbours.push(pos - 1);
        if (px < w - 1) neighbours.push(pos + 1);
        if (py > 0)     neighbours.push(pos - w);
        if (py < h - 1) neighbours.push(pos + w);
        for (var n = 0; n < neighbours.length; n++) {
          var nb = neighbours[n];
          if (!mask[nb] && isBG(nb * 4)) {
            mask[nb] = 1;
            queue.push(nb);
          }
        }
      }

      // Set masked pixels to fully transparent
      for (var i = 0; i < mask.length; i++) {
        if (mask[i]) {
          data[i * 4 + 3] = 0; // alpha = 0
        }
      }

      ctx.putImageData(imageData, 0, 0);
      game.textures.remove(texKey);
      game.textures.addCanvas(texKey, c);
    }
  },

  generatePlaceholders: function () {
    var g;

    // --- Player car (top-down, blue sports car, facing UP) --- 80x120 canvas
    g = this.make.graphics({ x: 0, y: 0, add: false });
    // Neon underglow (drawn first, behind everything)
    g.fillStyle(0x00e5ff, 0.10);
    g.fillEllipse(40, 60, 76, 110);
    // Shadow under body
    g.fillStyle(0x000000, 0.25);
    g.fillRoundedRect(10, 8, 60, 108, { tl: 18, tr: 18, bl: 10, br: 10 });
    // Main body (rounded sports car shape)
    g.fillStyle(0x1a5ccc);
    g.fillRoundedRect(12, 6, 56, 106, { tl: 18, tr: 18, bl: 10, br: 10 });
    // Body highlight stripe (metallic sheen down center)
    g.fillStyle(0x3388ee, 0.6);
    g.fillRoundedRect(28, 8, 24, 100, { tl: 10, tr: 10, bl: 6, br: 6 });
    // Hood panel (front = top)
    g.fillStyle(0x2070dd, 0.9);
    g.fillRoundedRect(16, 8, 48, 28, { tl: 16, tr: 16, bl: 4, br: 4 });
    // Hood crease lines
    g.lineStyle(1, 0x4499ee, 0.4);
    g.lineBetween(30, 10, 30, 34);
    g.lineBetween(50, 10, 50, 34);
    // Windshield (front glass, curved top)
    g.fillStyle(0x88ccff, 0.85);
    g.fillRoundedRect(18, 12, 44, 22, { tl: 10, tr: 10, bl: 4, br: 4 });
    // Windshield reflection streak
    g.fillStyle(0xbbddff, 0.4);
    g.fillRect(22, 14, 6, 18);
    // Windshield divider (center post)
    g.lineStyle(1.5, 0x1a55bb, 0.6);
    g.lineBetween(40, 13, 40, 33);
    // A-pillar lines
    g.lineStyle(1, 0x1a55bb, 0.4);
    g.lineBetween(19, 33, 24, 12);
    g.lineBetween(61, 33, 56, 12);
    // Roof panel
    g.fillStyle(0x2266dd, 0.95);
    g.fillRoundedRect(20, 36, 40, 32, 4);
    // Roof highlight (sunroof / gloss)
    g.fillStyle(0x77bbff, 0.25);
    g.fillRoundedRect(26, 40, 28, 20, 6);
    g.fillStyle(0xaaddff, 0.15);
    g.fillRoundedRect(28, 42, 10, 14, 3);
    // Door panels (left and right)
    g.fillStyle(0x1550aa, 0.5);
    g.fillRect(12, 36, 10, 34);
    g.fillRect(58, 36, 10, 34);
    // Door handles
    g.fillStyle(0xccddee, 0.7);
    g.fillRoundedRect(13, 50, 6, 2, 1);
    g.fillRoundedRect(61, 50, 6, 2, 1);
    // Door lines
    g.lineStyle(1, 0x0e3d80, 0.5);
    g.lineBetween(22, 36, 22, 70);
    g.lineBetween(58, 36, 58, 70);
    // Rear window
    g.fillStyle(0x445577, 0.75);
    g.fillRoundedRect(22, 70, 36, 14, { tl: 3, tr: 3, bl: 8, br: 8 });
    // Rear window reflection
    g.fillStyle(0x88aacc, 0.2);
    g.fillRect(26, 72, 5, 10);
    // Trunk panel
    g.fillStyle(0x1850b0, 0.7);
    g.fillRoundedRect(16, 84, 48, 22, { tl: 3, tr: 3, bl: 8, br: 8 });
    // Trunk crease
    g.lineStyle(1, 0x4488cc, 0.3);
    g.lineBetween(40, 86, 40, 100);
    // Spoiler
    g.fillStyle(0x0d2f66, 0.9);
    g.fillRoundedRect(14, 102, 52, 5, 2);
    g.fillStyle(0x1a55bb, 0.7);
    g.fillRect(18, 100, 4, 5);
    g.fillRect(58, 100, 4, 5);
    // Headlights (top = front, LED style)
    g.fillStyle(0xffffff, 0.95);
    g.fillRoundedRect(14, 8, 10, 5, 2);
    g.fillRoundedRect(56, 8, 10, 5, 2);
    g.fillStyle(0xffffcc, 0.8);
    g.fillRoundedRect(15, 9, 8, 3, 1);
    g.fillRoundedRect(57, 9, 8, 3, 1);
    // DRL light strips below headlights
    g.fillStyle(0x00ccff, 0.6);
    g.fillRoundedRect(14, 14, 8, 2, 1);
    g.fillRoundedRect(58, 14, 8, 2, 1);
    // Taillights (bottom = rear, wide LED bar style)
    g.fillStyle(0xff2222, 0.9);
    g.fillRoundedRect(14, 104, 12, 4, 2);
    g.fillRoundedRect(54, 104, 12, 4, 2);
    // Taillight inner glow
    g.fillStyle(0xff6666, 0.5);
    g.fillRoundedRect(16, 105, 8, 2, 1);
    g.fillRoundedRect(56, 105, 8, 2, 1);
    // Connecting tail strip
    g.fillStyle(0xff0000, 0.3);
    g.fillRect(26, 105, 28, 2);
    // Side mirrors (more detailed)
    g.fillStyle(0x1a55bb);
    g.fillRoundedRect(6, 28, 8, 10, 3);
    g.fillRoundedRect(66, 28, 8, 10, 3);
    g.fillStyle(0x88ccff, 0.5);
    g.fillRect(7, 30, 5, 4);
    g.fillRect(68, 30, 5, 4);
    // Wheel arches (dark ovals at corners)
    g.fillStyle(0x0a0a0a, 0.7);
    g.fillEllipse(16, 26, 10, 14);
    g.fillEllipse(64, 26, 10, 14);
    g.fillEllipse(16, 92, 10, 14);
    g.fillEllipse(64, 92, 10, 14);
    // Wheels (dark with chrome rim highlight)
    g.fillStyle(0x1a1a1a);
    g.fillEllipse(16, 26, 8, 12);
    g.fillEllipse(64, 26, 8, 12);
    g.fillEllipse(16, 92, 8, 12);
    g.fillEllipse(64, 92, 8, 12);
    // Chrome rim rings
    g.lineStyle(1, 0xaaaacc, 0.6);
    g.strokeEllipse(16, 26, 7, 10);
    g.strokeEllipse(64, 26, 7, 10);
    g.strokeEllipse(16, 92, 7, 10);
    g.strokeEllipse(64, 92, 7, 10);
    // Front bumper chrome strip
    g.fillStyle(0xcccccc, 0.4);
    g.fillRoundedRect(18, 6, 44, 3, 1);
    // Rear bumper
    g.fillStyle(0x888888, 0.3);
    g.fillRoundedRect(18, 108, 44, 3, 1);
    // Exhaust pipes
    g.fillStyle(0x666666, 0.8);
    g.fillCircle(22, 112, 3);
    g.fillCircle(58, 112, 3);
    g.fillStyle(0x333333, 0.9);
    g.fillCircle(22, 112, 2);
    g.fillCircle(58, 112, 2);
    g.generateTexture('van', 80, 120);
    g.destroy();

    // --- Obstacle cars (top-down, facing DOWN = oncoming, 60x100 each) ---
    // 5 distinct variants: red sedan, orange SUV, grey coupe, yellow taxi, green muscle car

    // Helper to draw common car elements
    var drawCarBase = function (gfx, bodyColor, darkColor, bodyTop, bodyH, bodyRound, carW, carH) {
      // Shadow
      gfx.fillStyle(0x000000, 0.2);
      gfx.fillRoundedRect(8, bodyTop + 2, carW - 16, bodyH, bodyRound);
      // Main body
      gfx.fillStyle(bodyColor);
      gfx.fillRoundedRect(8, bodyTop, carW - 16, bodyH, bodyRound);
      // Center metallic highlight
      gfx.fillStyle(0xffffff, 0.08);
      gfx.fillRoundedRect(22, bodyTop + 2, 16, bodyH - 4, 4);
    };

    // --- Variant 0: Red Sedan ---
    g = this.make.graphics({ x: 0, y: 0, add: false });
    drawCarBase(g, 0xe63946, 0xb02030, 4, 92, { tl: 14, tr: 14, bl: 8, br: 8 }, 60, 100);
    // Hood (top = rear since facing down toward us; bottom = front facing us)
    // For oncoming: TOP of texture = their rear, BOTTOM = their front
    // Rear window (top)
    g.fillStyle(0x445566, 0.7);
    g.fillRoundedRect(16, 8, 28, 12, { tl: 6, tr: 6, bl: 3, br: 3 });
    // Roof
    g.fillStyle(0xcc3040, 0.6);
    g.fillRoundedRect(14, 22, 32, 28, 4);
    g.fillStyle(0xff6070, 0.15);
    g.fillRoundedRect(20, 26, 20, 18, 4);
    // Windshield (bottom = front facing us)
    g.fillStyle(0x88ccff, 0.8);
    g.fillRoundedRect(14, 52, 32, 16, { tl: 3, tr: 3, bl: 8, br: 8 });
    g.fillStyle(0xbbddff, 0.3);
    g.fillRect(18, 54, 5, 12);
    // Windshield divider
    g.lineStyle(1, 0xb02030, 0.5);
    g.lineBetween(30, 53, 30, 67);
    // Door panels
    g.fillStyle(0xc02838, 0.5);
    g.fillRect(8, 30, 8, 24);
    g.fillRect(44, 30, 8, 24);
    // Door handles
    g.fillStyle(0xcccccc, 0.6);
    g.fillRect(10, 40, 4, 2);
    g.fillRect(46, 40, 4, 2);
    // Door lines
    g.lineStyle(1, 0x8a1a24, 0.4);
    g.lineBetween(16, 24, 16, 56);
    g.lineBetween(44, 24, 44, 56);
    // Wheel arches
    g.fillStyle(0x0a0a0a, 0.65);
    g.fillEllipse(12, 20, 8, 12);
    g.fillEllipse(48, 20, 8, 12);
    g.fillEllipse(12, 78, 8, 12);
    g.fillEllipse(48, 78, 8, 12);
    // Wheels
    g.fillStyle(0x1a1a1a);
    g.fillEllipse(12, 20, 6, 10);
    g.fillEllipse(48, 20, 6, 10);
    g.fillEllipse(12, 78, 6, 10);
    g.fillEllipse(48, 78, 6, 10);
    g.lineStyle(1, 0x999999, 0.5);
    g.strokeEllipse(12, 20, 5, 8);
    g.strokeEllipse(48, 20, 5, 8);
    g.strokeEllipse(12, 78, 5, 8);
    g.strokeEllipse(48, 78, 5, 8);
    // Side mirrors
    g.fillStyle(0xe63946);
    g.fillRoundedRect(3, 56, 7, 8, 2);
    g.fillRoundedRect(50, 56, 7, 8, 2);
    // Headlights (bottom = front facing us)
    g.fillStyle(0xffffff, 0.9);
    g.fillRoundedRect(10, 90, 10, 4, 2);
    g.fillRoundedRect(40, 90, 10, 4, 2);
    g.fillStyle(0xffffcc, 0.7);
    g.fillRoundedRect(12, 91, 6, 2, 1);
    g.fillRoundedRect(42, 91, 6, 2, 1);
    // Taillights (top = rear)
    g.fillStyle(0xff0000, 0.8);
    g.fillRoundedRect(10, 4, 10, 4, 2);
    g.fillRoundedRect(40, 4, 10, 4, 2);
    // Front bumper
    g.fillStyle(0xaaaaaa, 0.3);
    g.fillRoundedRect(14, 94, 32, 3, 1);
    // Grille
    g.fillStyle(0x222222, 0.6);
    g.fillRoundedRect(20, 88, 20, 4, 2);
    g.lineStyle(0.5, 0x444444, 0.4);
    g.lineBetween(24, 88, 24, 92);
    g.lineBetween(30, 88, 30, 92);
    g.lineBetween(36, 88, 36, 92);
    g.generateTexture('obstacle_car_0', 60, 100);
    g.destroy();

    // --- Variant 1: Orange SUV (taller/boxier) ---
    g = this.make.graphics({ x: 0, y: 0, add: false });
    drawCarBase(g, 0xcc5500, 0x994400, 2, 96, { tl: 10, tr: 10, bl: 8, br: 8 }, 60, 100);
    // SUV has boxier shape - widen body slightly
    g.fillStyle(0xcc5500);
    g.fillRect(6, 16, 4, 68);
    g.fillRect(50, 16, 4, 68);
    // Rear window
    g.fillStyle(0x445566, 0.7);
    g.fillRoundedRect(14, 6, 32, 14, 4);
    // Roof rack bars
    g.fillStyle(0x999999, 0.6);
    g.fillRect(16, 22, 28, 2);
    g.fillRect(16, 32, 28, 2);
    // Roof
    g.fillStyle(0xb34800, 0.5);
    g.fillRoundedRect(12, 20, 36, 28, 3);
    // Windshield
    g.fillStyle(0x88ccff, 0.8);
    g.fillRoundedRect(14, 50, 32, 18, { tl: 3, tr: 3, bl: 6, br: 6 });
    g.fillStyle(0xbbddff, 0.25);
    g.fillRect(16, 52, 6, 14);
    // Windshield divider
    g.lineStyle(1.5, 0x994400, 0.5);
    g.lineBetween(30, 51, 30, 67);
    // Door panels
    g.fillStyle(0xaa4400, 0.4);
    g.fillRect(6, 30, 10, 26);
    g.fillRect(44, 30, 10, 26);
    // Door handles
    g.fillStyle(0xcccccc, 0.6);
    g.fillRect(8, 42, 5, 2);
    g.fillRect(47, 42, 5, 2);
    // Door lines
    g.lineStyle(1, 0x773300, 0.4);
    g.lineBetween(16, 22, 16, 56);
    g.lineBetween(44, 22, 44, 56);
    // Wheel arches (bigger for SUV)
    g.fillStyle(0x0a0a0a, 0.7);
    g.fillEllipse(12, 18, 10, 14);
    g.fillEllipse(48, 18, 10, 14);
    g.fillEllipse(12, 80, 10, 14);
    g.fillEllipse(48, 80, 10, 14);
    // Bigger wheels
    g.fillStyle(0x1a1a1a);
    g.fillEllipse(12, 18, 8, 12);
    g.fillEllipse(48, 18, 8, 12);
    g.fillEllipse(12, 80, 8, 12);
    g.fillEllipse(48, 80, 8, 12);
    g.lineStyle(1, 0x888888, 0.5);
    g.strokeEllipse(12, 18, 6, 10);
    g.strokeEllipse(48, 18, 6, 10);
    g.strokeEllipse(12, 80, 6, 10);
    g.strokeEllipse(48, 80, 6, 10);
    // Side mirrors
    g.fillStyle(0xcc5500);
    g.fillRoundedRect(2, 52, 6, 8, 2);
    g.fillRoundedRect(52, 52, 6, 8, 2);
    // Headlights (big round SUV lights)
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(14, 92, 5);
    g.fillCircle(46, 92, 5);
    g.fillStyle(0xffffaa, 0.6);
    g.fillCircle(14, 92, 3);
    g.fillCircle(46, 92, 3);
    // Taillights
    g.fillStyle(0xff0000, 0.8);
    g.fillRoundedRect(10, 2, 8, 5, 2);
    g.fillRoundedRect(42, 2, 8, 5, 2);
    // Front bumper / bull bar
    g.fillStyle(0x888888, 0.5);
    g.fillRoundedRect(10, 96, 40, 3, 1);
    g.fillStyle(0x666666, 0.4);
    g.fillRect(14, 94, 2, 5);
    g.fillRect(44, 94, 2, 5);
    // Grille
    g.fillStyle(0x222222, 0.7);
    g.fillRoundedRect(18, 86, 24, 6, 2);
    g.lineStyle(0.5, 0x555555, 0.5);
    g.lineBetween(22, 86, 22, 92);
    g.lineBetween(30, 86, 30, 92);
    g.lineBetween(38, 86, 38, 92);
    g.generateTexture('obstacle_car_1', 60, 100);
    g.destroy();

    // --- Variant 2: Grey Coupe (sleek/low) ---
    g = this.make.graphics({ x: 0, y: 0, add: false });
    drawCarBase(g, 0x888899, 0x666677, 6, 88, { tl: 16, tr: 16, bl: 10, br: 10 }, 60, 100);
    // Sleeker profile
    g.fillStyle(0x999aaa, 0.3);
    g.fillRoundedRect(24, 8, 12, 84, 4);
    // Rear window
    g.fillStyle(0x334455, 0.75);
    g.fillRoundedRect(18, 10, 24, 10, { tl: 8, tr: 8, bl: 2, br: 2 });
    // Fastback roof
    g.fillStyle(0x777788, 0.6);
    g.fillRoundedRect(16, 22, 28, 22, 4);
    g.fillStyle(0xaabbcc, 0.12);
    g.fillRoundedRect(22, 26, 16, 14, 3);
    // Windshield (wider, sportier)
    g.fillStyle(0x88ccff, 0.85);
    g.fillRoundedRect(14, 46, 32, 18, { tl: 2, tr: 2, bl: 10, br: 10 });
    g.fillStyle(0xbbddff, 0.35);
    g.fillRect(18, 48, 5, 14);
    g.lineStyle(1, 0x666677, 0.5);
    g.lineBetween(30, 47, 30, 63);
    // Door panels
    g.fillStyle(0x777788, 0.4);
    g.fillRect(8, 28, 8, 22);
    g.fillRect(44, 28, 8, 22);
    // Door handles
    g.fillStyle(0xdddddd, 0.5);
    g.fillRect(10, 38, 4, 2);
    g.fillRect(46, 38, 4, 2);
    g.lineStyle(1, 0x555566, 0.4);
    g.lineBetween(16, 22, 16, 50);
    g.lineBetween(44, 22, 44, 50);
    // Wheel arches
    g.fillStyle(0x0a0a0a, 0.6);
    g.fillEllipse(12, 20, 8, 12);
    g.fillEllipse(48, 20, 8, 12);
    g.fillEllipse(12, 76, 8, 12);
    g.fillEllipse(48, 76, 8, 12);
    g.fillStyle(0x1a1a1a);
    g.fillEllipse(12, 20, 6, 10);
    g.fillEllipse(48, 20, 6, 10);
    g.fillEllipse(12, 76, 6, 10);
    g.fillEllipse(48, 76, 6, 10);
    g.lineStyle(1, 0xaaaaaa, 0.5);
    g.strokeEllipse(12, 20, 5, 8);
    g.strokeEllipse(48, 20, 5, 8);
    g.strokeEllipse(12, 76, 5, 8);
    g.strokeEllipse(48, 76, 5, 8);
    // Side mirrors
    g.fillStyle(0x888899);
    g.fillRoundedRect(3, 50, 7, 7, 2);
    g.fillRoundedRect(50, 50, 7, 7, 2);
    // Headlights (angular, sporty)
    g.fillStyle(0xffffff, 0.9);
    g.fillRoundedRect(10, 86, 12, 3, 1);
    g.fillRoundedRect(38, 86, 12, 3, 1);
    g.fillStyle(0xffffcc, 0.6);
    g.fillRoundedRect(12, 87, 8, 1, 1);
    g.fillRoundedRect(40, 87, 8, 1, 1);
    // DRL strips
    g.fillStyle(0xffffff, 0.4);
    g.fillRect(10, 90, 10, 1);
    g.fillRect(40, 90, 10, 1);
    // Taillights
    g.fillStyle(0xff0000, 0.8);
    g.fillRoundedRect(10, 6, 12, 3, 1);
    g.fillRoundedRect(38, 6, 12, 3, 1);
    // Rear bumper
    g.fillStyle(0x555555, 0.3);
    g.fillRoundedRect(16, 92, 28, 3, 1);
    // Diffuser vents
    g.lineStyle(0.5, 0x444444, 0.3);
    g.lineBetween(20, 92, 20, 95);
    g.lineBetween(26, 92, 26, 95);
    g.lineBetween(34, 92, 34, 95);
    g.lineBetween(40, 92, 40, 95);
    g.generateTexture('obstacle_car_2', 60, 100);
    g.destroy();

    // --- Variant 3: Yellow Taxi ---
    g = this.make.graphics({ x: 0, y: 0, add: false });
    drawCarBase(g, 0xe8c800, 0xc8a800, 4, 92, { tl: 12, tr: 12, bl: 8, br: 8 }, 60, 100);
    // Rear window
    g.fillStyle(0x445566, 0.7);
    g.fillRoundedRect(16, 8, 28, 12, 4);
    // Taxi sign on roof
    g.fillStyle(0xffffff, 0.9);
    g.fillRoundedRect(22, 22, 16, 6, 2);
    g.fillStyle(0x000000, 0.7);
    g.fillRect(24, 23, 3, 4);  // T
    g.fillRect(29, 23, 3, 4);  // A
    g.fillRect(34, 23, 3, 4);  // X
    // Roof
    g.fillStyle(0xd0b800, 0.5);
    g.fillRoundedRect(14, 28, 32, 22, 3);
    // Windshield
    g.fillStyle(0x88ccff, 0.8);
    g.fillRoundedRect(14, 52, 32, 16, { tl: 3, tr: 3, bl: 7, br: 7 });
    g.lineStyle(1, 0xc8a800, 0.5);
    g.lineBetween(30, 53, 30, 67);
    // Checkered stripe (taxi pattern along door)
    g.fillStyle(0x000000, 0.6);
    for (var tx = 8; tx < 52; tx += 8) {
      g.fillRect(tx, 44, 4, 4);
    }
    // Door panels
    g.fillStyle(0xc8a800, 0.4);
    g.fillRect(8, 32, 8, 22);
    g.fillRect(44, 32, 8, 22);
    g.fillStyle(0xcccccc, 0.5);
    g.fillRect(10, 40, 4, 2);
    g.fillRect(46, 40, 4, 2);
    g.lineStyle(1, 0xa08800, 0.4);
    g.lineBetween(16, 24, 16, 54);
    g.lineBetween(44, 24, 44, 54);
    // Wheels
    g.fillStyle(0x0a0a0a, 0.65);
    g.fillEllipse(12, 18, 8, 12);
    g.fillEllipse(48, 18, 8, 12);
    g.fillEllipse(12, 78, 8, 12);
    g.fillEllipse(48, 78, 8, 12);
    g.fillStyle(0x1a1a1a);
    g.fillEllipse(12, 18, 6, 10);
    g.fillEllipse(48, 18, 6, 10);
    g.fillEllipse(12, 78, 6, 10);
    g.fillEllipse(48, 78, 6, 10);
    g.lineStyle(1, 0x999999, 0.4);
    g.strokeEllipse(12, 18, 5, 8);
    g.strokeEllipse(48, 18, 5, 8);
    g.strokeEllipse(12, 78, 5, 8);
    g.strokeEllipse(48, 78, 5, 8);
    // Side mirrors
    g.fillStyle(0xe8c800);
    g.fillRoundedRect(3, 54, 7, 8, 2);
    g.fillRoundedRect(50, 54, 7, 8, 2);
    // Headlights
    g.fillStyle(0xffffff, 0.9);
    g.fillRoundedRect(10, 90, 10, 4, 2);
    g.fillRoundedRect(40, 90, 10, 4, 2);
    g.fillStyle(0xffffcc, 0.6);
    g.fillRoundedRect(12, 91, 6, 2, 1);
    g.fillRoundedRect(42, 91, 6, 2, 1);
    // Taillights
    g.fillStyle(0xff0000, 0.8);
    g.fillRoundedRect(10, 4, 10, 4, 2);
    g.fillRoundedRect(40, 4, 10, 4, 2);
    // Front bumper
    g.fillStyle(0xaaaaaa, 0.3);
    g.fillRoundedRect(14, 94, 32, 3, 1);
    // Grille
    g.fillStyle(0x222222, 0.6);
    g.fillRoundedRect(20, 86, 20, 4, 2);
    g.generateTexture('obstacle_car_3', 60, 100);
    g.destroy();

    // --- Variant 4: Green Muscle Car ---
    g = this.make.graphics({ x: 0, y: 0, add: false });
    drawCarBase(g, 0x228833, 0x1a6628, 6, 88, { tl: 12, tr: 12, bl: 8, br: 8 }, 60, 100);
    g.fillStyle(0x33aa44, 0.3);
    g.fillRoundedRect(22, 8, 16, 82, 4);
    // Racing stripes
    g.fillStyle(0xffffff, 0.12);
    g.fillRect(26, 8, 3, 82);
    g.fillRect(31, 8, 3, 82);
    // Rear window (small, muscle car)
    g.fillStyle(0x334455, 0.7);
    g.fillRoundedRect(18, 10, 24, 8, { tl: 4, tr: 4, bl: 2, br: 2 });
    // Low roof
    g.fillStyle(0x1a7028, 0.6);
    g.fillRoundedRect(16, 20, 28, 18, 3);
    // Windshield
    g.fillStyle(0x88ccff, 0.8);
    g.fillRoundedRect(14, 40, 32, 16, { tl: 2, tr: 2, bl: 8, br: 8 });
    g.lineStyle(1, 0x1a6628, 0.5);
    g.lineBetween(30, 41, 30, 55);
    // Wide fenders
    g.fillStyle(0x1f7730, 0.6);
    g.fillRect(6, 56, 10, 24);
    g.fillRect(44, 56, 10, 24);
    // Door panels
    g.fillStyle(0x1a6628, 0.4);
    g.fillRect(8, 26, 8, 20);
    g.fillRect(44, 26, 8, 20);
    g.fillStyle(0xcccccc, 0.5);
    g.fillRect(10, 34, 4, 2);
    g.fillRect(46, 34, 4, 2);
    g.lineStyle(1, 0x145520, 0.4);
    g.lineBetween(16, 20, 16, 46);
    g.lineBetween(44, 20, 44, 46);
    // Wide wheels (muscle car stance)
    g.fillStyle(0x0a0a0a, 0.7);
    g.fillEllipse(10, 18, 10, 12);
    g.fillEllipse(50, 18, 10, 12);
    g.fillEllipse(10, 76, 10, 12);
    g.fillEllipse(50, 76, 10, 12);
    g.fillStyle(0x1a1a1a);
    g.fillEllipse(10, 18, 8, 10);
    g.fillEllipse(50, 18, 8, 10);
    g.fillEllipse(10, 76, 8, 10);
    g.fillEllipse(50, 76, 8, 10);
    g.lineStyle(1, 0xcccccc, 0.5);
    g.strokeEllipse(10, 18, 6, 8);
    g.strokeEllipse(50, 18, 6, 8);
    g.strokeEllipse(10, 76, 6, 8);
    g.strokeEllipse(50, 76, 6, 8);
    // Side mirrors
    g.fillStyle(0x228833);
    g.fillRoundedRect(2, 44, 6, 7, 2);
    g.fillRoundedRect(52, 44, 6, 7, 2);
    // Headlights (dual round, classic muscle)
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(14, 88, 4);
    g.fillCircle(22, 88, 3);
    g.fillCircle(46, 88, 4);
    g.fillCircle(38, 88, 3);
    g.fillStyle(0xffffaa, 0.5);
    g.fillCircle(14, 88, 2);
    g.fillCircle(46, 88, 2);
    // Taillights
    g.fillStyle(0xff0000, 0.85);
    g.fillCircle(14, 8, 4);
    g.fillCircle(46, 8, 4);
    // Hood scoop (front = bottom)
    g.fillStyle(0x1a5520, 0.8);
    g.fillRoundedRect(24, 58, 12, 8, 2);
    g.fillStyle(0x0a0a0a, 0.5);
    g.fillRoundedRect(26, 60, 8, 4, 1);
    // Front bumper
    g.fillStyle(0x888888, 0.4);
    g.fillRoundedRect(12, 92, 36, 3, 1);
    // Grille (wide opening)
    g.fillStyle(0x111111, 0.7);
    g.fillRoundedRect(16, 84, 28, 6, 2);
    g.lineStyle(0.5, 0x444444, 0.4);
    g.lineBetween(22, 84, 22, 90);
    g.lineBetween(30, 84, 30, 90);
    g.lineBetween(38, 84, 38, 90);
    g.generateTexture('obstacle_car_4', 60, 100);
    g.destroy();

    // Fallback 'obstacle' texture (use red sedan)
    g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xe63946);
    g.fillRoundedRect(8, 4, 44, 92, { tl: 14, tr: 14, bl: 8, br: 8 });
    g.fillStyle(0x88ccff, 0.7);
    g.fillRoundedRect(14, 52, 32, 16, 6);
    g.fillStyle(0x445566, 0.6);
    g.fillRoundedRect(16, 8, 28, 12, 4);
    g.fillStyle(0xffffff, 0.8);
    g.fillRoundedRect(10, 90, 10, 4, 2);
    g.fillRoundedRect(40, 90, 10, 4, 2);
    g.fillStyle(0xff0000, 0.8);
    g.fillRoundedRect(10, 4, 10, 4, 2);
    g.fillRoundedRect(40, 4, 10, 4, 2);
    g.fillStyle(0xffffff, 0.12);
    g.fillRoundedRect(10, 10, 14, 60, 3);
    g.generateTexture('obstacle', 60, 100);
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
