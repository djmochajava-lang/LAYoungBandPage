/* GroovyBandRush/js/scenes/StoryScene.js — V6 HERO SPLASH PROLOGUE */

var StoryScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function StoryScene() {
    Phaser.Scene.call(this, { key: 'StoryScene' });
  },

  init: function (data) {
    this.actNumber = data.actNumber !== undefined ? data.actNumber : 0;
    this.nextScene = data.nextScene || 'Act1RunnerScene';
  },

  create: function () {
    var W = this.cameras.main.width;
    var H = this.cameras.main.height;
    var self = this;
    var cx = W / 2;
    var story = GBR.STORIES[this.actNumber];

    AudioSynth.resume();

    // ============================================================
    //  PER-ACT ACCENT COLORS
    // ============================================================
    var actThemes = [
      { accent: 0xe8751a, accentHex: '#e8751a', glow: 0xffd700, light1: 0xe84393, light2: 0x00e5ff, light3: 0xffd700, light4: 0x9b59b6 },
      { accent: 0x3498db, accentHex: '#3498db', glow: 0x00e5ff, light1: 0x3498db, light2: 0x2ecc71, light3: 0x00e5ff, light4: 0x9b59b6 },
      { accent: 0x2ecc71, accentHex: '#2ecc71', glow: 0x2ecc71, light1: 0x2ecc71, light2: 0xffd700, light3: 0x00e5ff, light4: 0xe84393 },
      { accent: 0x9b59b6, accentHex: '#9b59b6', glow: 0xe84393, light1: 0x9b59b6, light2: 0xe84393, light3: 0x3498db, light4: 0xffd700 },
      { accent: 0xe63946, accentHex: '#e63946', glow: 0xff6b6b, light1: 0xe63946, light2: 0xffd700, light3: 0xe84393, light4: 0x00e5ff },
      { accent: 0xffd700, accentHex: '#ffd700', glow: 0xffd700, light1: 0xffd700, light2: 0xe8751a, light3: 0xe84393, light4: 0x00e5ff }
    ];
    var theme = actThemes[Math.min(this.actNumber, actThemes.length - 1)];

    // ============================================================
    //  SHARED LAYERS — Night sky, stars, light beams (all acts)
    // ============================================================

    // --- Deep night sky gradient ---
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x030308, 0x040510, 0x081028, 0x0c1838);
    bg.fillRect(0, 0, W, H);

    // --- Twinkling stars ---
    for (var i = 0; i < 80; i++) {
      var sx = Phaser.Math.Between(0, W);
      var sy = Phaser.Math.Between(0, H * 0.50);
      var sr = Phaser.Math.FloatBetween(0.5, 2.0);
      var sa = Phaser.Math.FloatBetween(0.15, 0.85);
      var star = this.add.circle(sx, sy, sr, 0xffffff, sa);
      this.tweens.add({
        targets: star,
        alpha: { from: sa, to: Phaser.Math.FloatBetween(0.02, 0.15) },
        duration: Phaser.Math.Between(800, 2500),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
        ease: 'Sine.easeInOut'
      });
    }

    // Bright accent star sprites
    var accentColors = [0xffd700, 0x00e5ff, 0xe84393, 0xff6b6b];
    for (var a = 0; a < 8; a++) {
      var astar = this.add.image(
        Phaser.Math.Between(10, W - 10),
        Phaser.Math.Between(5, H * 0.42),
        'star'
      ).setScale(Phaser.Math.FloatBetween(0.4, 1.0))
       .setAlpha(Phaser.Math.FloatBetween(0.3, 0.7))
       .setTint(Phaser.Math.RND.pick(accentColors));
      this.tweens.add({
        targets: astar,
        alpha: 0.05, scaleX: astar.scaleX * 0.5, scaleY: astar.scaleY * 0.5,
        duration: Phaser.Math.Between(1200, 2800),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 1500),
        ease: 'Sine.easeInOut'
      });
    }

    // --- Show light beams ---
    var beamData = [
      { x: W * 0.08,  color: theme.light1, speed: 2800, spread: 110 },
      { x: W * 0.32, color: theme.light2, speed: 3500, spread: 120 },
      { x: W * 0.58, color: theme.light3, speed: 3100, spread: 115 },
      { x: W * 0.85, color: theme.light4, speed: 2600, spread: 105 }
    ];
    for (var b = 0; b < beamData.length; b++) {
      var bd = beamData[b];
      var beam = this.add.graphics();
      beam.setBlendMode(Phaser.BlendModes.ADD);
      beam.fillStyle(bd.color, 1);
      beam.fillTriangle(bd.x, -10, bd.x - bd.spread, H * 0.70, bd.x + bd.spread, H * 0.70);
      beam.setAlpha(0.05);
      this.tweens.add({
        targets: beam,
        x: { from: -40, to: 40 },
        alpha: { from: 0.05, to: 0.14 },
        duration: bd.speed,
        yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut',
        delay: b * 350
      });
    }

    // ============================================================
    //  BRANCH: Prologue (Act 0) = Hero Splash, Acts 1-4 = V5 Comic
    // ============================================================
    if (this.actNumber === 0) {
      this._createHeroSplash(W, H, cx, story, theme);
    } else {
      this._createComicLayout(W, H, cx, story, theme);
    }

    // ============================================================
    //  CAMERA — Fade in
    // ============================================================
    TransitionHelper.fadeIn(this, 600);
  },

  // ================================================================
  //  HERO SPLASH PROLOGUE (Act 0 only)
  // ================================================================
  _createHeroSplash: function (W, H, cx, story, theme) {
    var self = this;

    // ============================================================
    //  LAYER 2 — Compressed city skyline (behind L.A.)
    // ============================================================
    var skylineBase = H * 0.62;
    var skyGfx = this.add.graphics().setDepth(1);

    var blds = [];
    var bx = 0;
    while (bx < W + 10) {
      var bw = Phaser.Math.Between(22, 45);
      var bh = Phaser.Math.Between(40, 100);  // shorter buildings
      blds.push({ x: bx, w: bw, h: bh });
      bx += bw + Phaser.Math.Between(0, 5);
    }

    skyGfx.fillStyle(0x0a0a14, 0.97);
    for (var bl = 0; bl < blds.length; bl++) {
      var bld = blds[bl];
      skyGfx.fillRect(bld.x, skylineBase - bld.h, bld.w - 2, bld.h + (H - skylineBase) + 20);
    }

    // Lit windows
    skyGfx.fillStyle(0xffd700, 0.22);
    for (var bl2 = 0; bl2 < blds.length; bl2++) {
      var b2 = blds[bl2];
      for (var wy = skylineBase - b2.h + 8; wy < skylineBase - 4; wy += 13) {
        for (var wx = b2.x + 3; wx < b2.x + b2.w - 6; wx += 9) {
          if (Math.random() > 0.40) {
            skyGfx.fillRect(wx, wy, 4, 6);
          }
        }
      }
    }

    // Ground fill below skyline
    var ground = this.add.graphics().setDepth(1);
    ground.fillStyle(0x080810, 1);
    ground.fillRect(0, skylineBase, W, H - skylineBase);
    // Subtle curb glow
    ground.fillStyle(theme.glow, 0.05);
    ground.fillRect(0, skylineBase, W, 20);

    // ============================================================
    //  LAYER 3 — Band members (pushed to edges)
    // ============================================================
    var memberSlots = [
      { pct: 0.06, idx: 0 },
      { pct: 0.22, idx: 1 },
      { pct: 0.78, idx: 2 },
      { pct: 0.94, idx: 3 }
    ];

    for (var mp = 0; mp < memberSlots.length; mp++) {
      var slot = memberSlots[mp];
      var mx = W * slot.pct;
      var my = skylineBase + 5;
      var found = GBR.state.bandMembers[slot.idx].found;

      var peeker = this.add.image(mx, my, 'member_' + slot.idx)
        .setScale(0.22)
        .setOrigin(0.5, 1)
        .setAlpha(found ? 0.85 : 0.45)
        .setDepth(3);

      if (!found) {
        var qmark = this.add.text(mx, my - 80, '?', {
          fontFamily: GBR.FONTS.display,
          fontSize: '22px',
          color: '#ffd700',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5).setDepth(4);

        this.tweens.add({
          targets: qmark,
          y: qmark.y - 8,
          alpha: { from: 1, to: 0.3 },
          duration: 900, yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut',
          delay: mp * 280
        });
      } else {
        this.add.text(mx, my - 80, '\u2713', {
          fontFamily: GBR.FONTS.display,
          fontSize: '20px',
          color: '#2ecc71',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5).setDepth(4);
      }

      this.tweens.add({
        targets: peeker,
        x: mx + (mp % 2 === 0 ? 5 : -5),
        duration: Phaser.Math.Between(1500, 2500),
        yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut',
        delay: mp * 350
      });
    }

    // ============================================================
    //  LAYER 4 — HERO IMAGE: L.A. Cartoon (centerpiece)
    // ============================================================
    var heroTargetY = H * 0.92;
    var heroScale = (H * 0.65) / 1536;  // 1536 = image height, fill 65% of screen
    // Clamp scale for very wide screens where H is still 800
    heroScale = Math.max(0.28, Math.min(0.42, heroScale));

    var hero = this.add.image(cx, H + 200, 'la_cartoon')
      .setOrigin(0.5, 1)
      .setScale(heroScale * 0.8)
      .setDepth(8);

    // Hero Slam entrance — slide up with overshoot
    var heroSlamDuration = 500;
    this.tweens.add({
      targets: hero,
      y: heroTargetY,
      scaleX: heroScale,
      scaleY: heroScale,
      duration: heroSlamDuration,
      ease: 'Back.easeOut',
      onComplete: function () {
        // Impact flash + shake
        TransitionHelper.flash(self, 150);
        TransitionHelper.shake(self, 150, 0.008);

        // Action line speed burst
        self._createActionLines(W, H, cx, heroTargetY - (1536 * heroScale * 0.45), theme);

        // Idle breathing animation
        self.tweens.add({
          targets: hero,
          scaleX: heroScale * 1.015,
          scaleY: heroScale * 1.015,
          y: heroTargetY - 3,
          duration: 2500,
          yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });

    // ============================================================
    //  LAYER 5 — Dialogue text (floating over night sky, no panel)
    // ============================================================
    var panelX = 20;
    var panelY = H * 0.05;
    var panelW = W - 40;

    // Text container for slide-in animation
    var textContainer = this.add.container(0, -H * 0.3).setDepth(16);

    // Act badge — white on orange (like BAND RUSH style)
    var badge = this.add.text(cx, panelY + 18, '\u2B50 PROLOGUE \u2B50', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '13px',
      color: '#ffffff',
      backgroundColor: '#e8751a',
      padding: { x: 14, y: 4 }
    }).setOrigin(0.5);
    textContainer.add(badge);

    // Title
    var titleText = this.add.text(cx, panelY + 46, story.title, {
      fontFamily: GBR.FONTS.display,
      fontSize: '36px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 0, color: theme.accentHex, blur: 12, fill: true },
      padding: { left: 8, right: 8, top: 8, bottom: 8 }
    }).setOrigin(0.5);
    textContainer.add(titleText);

    // Speaker name chip — pinned to top-right corner of hero photo
    var heroImgW = 1024 * heroScale;
    var heroImgH = 1536 * heroScale;
    var chipX = cx + heroImgW / 2 - 8;
    var chipY = heroTargetY - heroImgH + 8;
    var speakerText = this.add.text(chipX, chipY, story.speaker, {
      fontFamily: GBR.FONTS.fun,
      fontSize: '14px',
      color: '#1a0a2e',
      backgroundColor: theme.accentHex,
      padding: { x: 10, y: 3 }
    }).setOrigin(1, 0).setDepth(12);

    // Dialogue text (centered typewriter)
    var dialogText = this.add.text(cx, panelY + 72, '', {
      fontFamily: GBR.FONTS.body,
      fontSize: '15px',
      color: '#ffffff',
      wordWrap: { width: panelW - 40 },
      lineSpacing: 5,
      align: 'center'
    }).setOrigin(0.5, 0);
    textContainer.add(dialogText);

    // Slide text container down with panel
    this.tweens.add({
      targets: textContainer,
      y: 0,
      duration: 500,
      ease: 'Back.easeOut',
      delay: heroSlamDuration + 100,
      onComplete: function () {
        // Start typewriter after panel settles
        self._startTypewriter(dialogText, story.text);
      }
    });

    // ============================================================
    //  LAYER 7 — LET'S GO button (smaller, 3D pressable look)
    // ============================================================
    var btnY = H * 0.83;
    var btnW = 180;
    var btnH = 44;
    var btnR = 22;

    setTimeout(function () {
      if (!self.scene || !self.scene.isActive()) return;

      // 3D button: shadow layer (bottom edge depth)
      var btnShadow = self.add.graphics().setDepth(18);
      btnShadow.fillStyle(0xb8860b, 1);  // dark gold
      btnShadow.fillRoundedRect(cx - btnW / 2, btnY - btnH / 2 + 4, btnW, btnH, btnR);

      // 3D button: main face
      var btnFace = self.add.graphics().setDepth(19);
      btnFace.fillStyle(0xffd700, 1);
      btnFace.fillRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, btnR);
      // Top highlight
      btnFace.fillStyle(0xffec80, 0.5);
      btnFace.fillRoundedRect(cx - btnW / 2 + 4, btnY - btnH / 2 + 2, btnW - 8, btnH / 2 - 2, { tl: btnR - 2, tr: btnR - 2, bl: 0, br: 0 });

      // Hit area (invisible interactive zone)
      var hitZone = self.add.rectangle(cx, btnY, btnW, btnH + 8)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.001)
        .setDepth(22);

      var goText = self.add.text(cx, btnY - 1, "\u25B6 LET'S GO!", {
        fontFamily: GBR.FONTS.display,
        fontSize: '22px',
        color: '#1a0a2e',
        padding: { left: 6, right: 6 }
      }).setOrigin(0.5).setDepth(21);

      // Pop-in
      var btnGroup = [btnShadow, btnFace, goText, hitZone];
      btnShadow.setScale(0);
      btnFace.setScale(0);
      goText.setScale(0);
      self.tweens.add({ targets: btnShadow, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut' });
      self.tweens.add({ targets: btnFace, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut' });
      self.tweens.add({ targets: goText, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut' });

      // Gentle float
      self.tweens.add({
        targets: btnGroup,
        y: '-=3',
        duration: 1000, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut', delay: 600
      });

      // Hover — lift up slightly
      hitZone.on('pointerover', function () {
        self.tweens.add({ targets: [btnFace, goText], y: '-=2', duration: 100 });
      });
      hitZone.on('pointerout', function () {
        self.tweens.add({ targets: [btnFace, goText], y: '+=2', duration: 100 });
      });

      // Press — squash down (face meets shadow = "pressed" look)
      hitZone.on('pointerdown', function () {
        self.tweens.add({ targets: [btnFace, goText], y: '+=3', duration: 50 });
        setTimeout(function () {
          AudioSynth.resume();
          AudioSynth.playCollect();
          GBR.state.currentAct = self.actNumber + 1;
          TransitionHelper.fadeToScene(self, self.nextScene);
        }, 120);
      });
    }, 1200);

    // ============================================================
    //  LAYER 8 — Sparkle particles around L.A.
    // ============================================================
    if (this.add.particles) {
      try {
        var particleCY = heroTargetY - (1536 * heroScale * 0.55);
        this.add.particles(cx, particleCY, 'star', {
          speed: { min: 8, max: 25 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.3, end: 0 },
          alpha: { start: 0.5, end: 0 },
          lifespan: 1800,
          frequency: 400,
          tint: [0xffd700, theme.accent, 0xffffff, 0x00e5ff],
          blendMode: 'ADD',
          emitZone: {
            type: 'random',
            source: new Phaser.Geom.Rectangle(-120, -150, 240, 300)
          }
        }).setDepth(9);
      } catch (e) { /* fail silently */ }
    }
  },

  // ================================================================
  //  ACTION LINE SPEED BURST (fighting-game impact starburst)
  // ================================================================
  _createActionLines: function (W, H, cx, centerY, theme) {
    var lineCount = 14;
    var lineGfx = this.add.graphics().setDepth(7);
    lineGfx.setBlendMode(Phaser.BlendModes.ADD);

    for (var li = 0; li < lineCount; li++) {
      var angle = (li / lineCount) * Math.PI * 2;
      var innerR = 60;
      var outerR = Math.max(W, H) * 0.6;
      var x1 = cx + Math.cos(angle) * innerR;
      var y1 = centerY + Math.sin(angle) * innerR;
      var x2 = cx + Math.cos(angle) * outerR;
      var y2 = centerY + Math.sin(angle) * outerR;

      // Alternate between gold and accent color
      var lineColor = (li % 2 === 0) ? 0xffd700 : theme.accent;
      lineGfx.lineStyle(Phaser.Math.Between(2, 5), lineColor, 0.35);
      lineGfx.lineBetween(x1, y1, x2, y2);
    }

    // Fade out
    this.tweens.add({
      targets: lineGfx,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut'
    });
  },

  // ================================================================
  //  TYPEWRITER HELPER
  // ================================================================
  _startTypewriter: function (dialogText, fullText) {
    var self = this;
    var charIndex = 0;

    var typeTimer = this.time.addEvent({
      delay: 28,
      callback: function () {
        charIndex++;
        dialogText.setText(fullText.substring(0, charIndex));
        if (charIndex >= fullText.length) {
          typeTimer.destroy();
        }
      },
      repeat: fullText.length - 1
    });

    // Tap to skip
    this.input.once('pointerdown', function () {
      if (charIndex < fullText.length) {
        typeTimer.destroy();
        charIndex = fullText.length;
        dialogText.setText(fullText);
      }
    });
  },

  // ================================================================
  //  V5 COMIC LAYOUT (Acts 1-4)
  // ================================================================
  _createComicLayout: function (W, H, cx, story, theme) {
    var self = this;

    // ============================================================
    //  LAYER 2 — City skyline
    // ============================================================
    var skylineBase = H * 0.58;
    var skyGfx = this.add.graphics();

    var blds = [];
    var bx = 0;
    while (bx < W + 10) {
      var bw = Phaser.Math.Between(22, 45);
      var bh = Phaser.Math.Between(60, 185);
      blds.push({ x: bx, w: bw, h: bh });
      bx += bw + Phaser.Math.Between(0, 5);
    }

    skyGfx.fillStyle(0x0a0a14, 0.97);
    for (var bl = 0; bl < blds.length; bl++) {
      var bld = blds[bl];
      skyGfx.fillRect(bld.x, skylineBase - bld.h, bld.w - 2, bld.h + (H - skylineBase) + 20);
    }

    skyGfx.fillStyle(0xffd700, 0.22);
    for (var bl2 = 0; bl2 < blds.length; bl2++) {
      var b2 = blds[bl2];
      for (var wy = skylineBase - b2.h + 8; wy < skylineBase - 4; wy += 13) {
        for (var wx = b2.x + 3; wx < b2.x + b2.w - 6; wx += 9) {
          if (Math.random() > 0.40) {
            skyGfx.fillRect(wx, wy, 4, 6);
          }
        }
      }
    }

    // Ground area
    var road = this.add.graphics();
    road.fillStyle(0x0e0e16, 1);
    road.fillRect(0, skylineBase + 2, W, H - skylineBase);
    road.fillStyle(theme.glow, 0.07);
    road.fillRect(0, skylineBase + 2, W, 25);
    road.fillStyle(0x080810, 1);
    road.fillRect(0, skylineBase + 40, W, H - skylineBase - 40);
    road.fillStyle(0xffd700, 0.06);
    for (var dx = 10; dx < W; dx += 40) {
      road.fillRect(dx, skylineBase + 60, 20, 3);
    }
    road.fillStyle(theme.glow, 0.02);
    road.fillRect(0, skylineBase + 40, W, 80);

    // Street lamps
    var lampGfx = this.add.graphics().setDepth(1);
    for (var lp = 0; lp < 5; lp++) {
      var lpx = W * 0.12 + lp * (W * 0.20);
      lampGfx.fillStyle(0x333344, 0.6);
      lampGfx.fillRect(lpx - 1, skylineBase - 30, 3, 30);
      lampGfx.fillStyle(0xffd700, 0.4);
      lampGfx.fillCircle(lpx, skylineBase - 33, 4);
      lampGfx.fillStyle(0xffd700, 0.03);
      lampGfx.fillEllipse(lpx, skylineBase + 15, 50, 20);
    }

    // City reflection
    var reflGfx = this.add.graphics().setDepth(0);
    reflGfx.fillStyle(0xffd700, 0.015);
    for (var ri = 0; ri < blds.length; ri++) {
      var rb = blds[ri];
      if (rb.x > W) break;
      reflGfx.fillRect(rb.x, skylineBase + 42, rb.w - 2, Math.min(rb.h * 0.3, 40));
    }

    road.fillStyle(0x222233, 0.4);
    road.fillRect(0, skylineBase + 38, W, 2);

    var bottomGrad = this.add.graphics().setDepth(0);
    bottomGrad.fillStyle(theme.glow, 0.02);
    bottomGrad.fillRect(0, H * 0.85, W, H * 0.15);

    // ============================================================
    //  LAYER 3 — Band members
    // ============================================================
    var memberSlots = [
      { pct: 0.10, idx: 0 },
      { pct: 0.32, idx: 1 },
      { pct: 0.55, idx: 2 },
      { pct: 0.78, idx: 3 }
    ];

    for (var mp = 0; mp < memberSlots.length; mp++) {
      var slot = memberSlots[mp];
      var mx = W * slot.pct;
      var my = skylineBase + 5;
      var found = GBR.state.bandMembers[slot.idx].found;

      var peeker = this.add.image(mx, my, 'member_' + slot.idx)
        .setScale(0.25)
        .setOrigin(0.5, 1)
        .setAlpha(found ? 0.95 : 0.55)
        .setDepth(3);

      if (!found) {
        var qmark = this.add.text(mx, my - 90, '?', {
          fontFamily: GBR.FONTS.display,
          fontSize: '26px',
          color: '#ffd700',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5).setDepth(4);

        this.tweens.add({
          targets: qmark,
          y: qmark.y - 8,
          alpha: { from: 1, to: 0.3 },
          duration: 900, yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut',
          delay: mp * 280
        });
      } else {
        this.add.text(mx, my - 90, '\u2713', {
          fontFamily: GBR.FONTS.display,
          fontSize: '24px',
          color: '#2ecc71',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5).setDepth(4);
      }

      this.tweens.add({
        targets: peeker,
        x: mx + (mp % 2 === 0 ? 6 : -6),
        duration: Phaser.Math.Between(1500, 2500),
        yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut',
        delay: mp * 350
      });
    }

    // ============================================================
    //  LAYER 4 — L.A. Young portrait (LEFT side)
    // ============================================================
    var portraitX = W * 0.22;
    var portraitY = H * 0.38;

    var laSpot = this.add.graphics().setDepth(5);
    laSpot.fillStyle(theme.glow, 0.10);
    laSpot.fillEllipse(portraitX, portraitY, 260, 290);
    laSpot.fillStyle(0xffffff, 0.04);
    laSpot.fillEllipse(portraitX, portraitY, 200, 230);

    var glowEllipse = this.add.graphics().setDepth(5);
    glowEllipse.fillStyle(theme.glow, 0.16);
    glowEllipse.fillEllipse(portraitX, portraitY, 210, 240);
    this.tweens.add({
      targets: glowEllipse,
      scaleX: 1.12, scaleY: 1.12, alpha: 0.02,
      duration: 1600, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });

    var face = LAFace.create(this, portraitX, portraitY);
    face.container.setDepth(6);

    this.tweens.add({
      targets: [glowEllipse, laSpot],
      y: '-=3',
      duration: 2000, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // ============================================================
    //  LAYER 5 — Act badge + Title
    // ============================================================
    var titleCX = W * 0.64;

    var actLabel = '\u2B50 ACT ' + this.actNumber + ' \u2B50';
    var badge = this.add.text(titleCX, H * 0.06, actLabel, {
      fontFamily: GBR.FONTS.fun,
      fontSize: '15px',
      color: '#1a0a2e',
      backgroundColor: '#ffd700',
      padding: { x: 18, y: 5 }
    }).setOrigin(0.5).setDepth(10);
    badge.setScale(0);
    this.tweens.add({ targets: badge, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.easeOut', delay: 100 });
    this.tweens.add({
      targets: badge,
      scaleX: { from: 1, to: 1.04 }, scaleY: { from: 1, to: 1.04 },
      duration: 900, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut', delay: 600
    });

    var titleText = this.add.text(titleCX, H * 0.14, story.title, {
      fontFamily: GBR.FONTS.display,
      fontSize: '42px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 0, color: theme.accentHex, blur: 14, fill: true },
      padding: { left: 14, right: 14, top: 4, bottom: 4 }
    }).setOrigin(0.5).setDepth(10);
    titleText.setScale(0);
    this.tweens.add({ targets: titleText, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut', delay: 200 });

    // ============================================================
    //  LAYER 6 — Comic speech bubble
    // ============================================================
    var bubbleLeft = W * 0.36;
    var bubbleW = W * 0.60;
    var bubbleTop = H * 0.24;
    var bubbleH = H * 0.17;

    var speakerText = this.add.text(bubbleLeft + 14, bubbleTop - 20, story.speaker, {
      fontFamily: GBR.FONTS.fun,
      fontSize: '17px',
      color: '#1a0a2e',
      backgroundColor: theme.accentHex,
      padding: { x: 12, y: 4 }
    }).setOrigin(0, 0.5).setDepth(12);
    speakerText.setScale(0);
    this.tweens.add({ targets: speakerText, scaleX: 1, scaleY: 1, duration: 350, ease: 'Back.easeOut', delay: 300 });

    var bubble = this.add.graphics().setDepth(10);
    bubble.fillStyle(0xffffff, 0.95);
    bubble.fillRoundedRect(bubbleLeft, bubbleTop, bubbleW, bubbleH, 18);
    bubble.lineStyle(3, 0x1a1a2e, 1);
    bubble.strokeRoundedRect(bubbleLeft, bubbleTop, bubbleW, bubbleH, 18);

    var tailBaseX = bubbleLeft;
    var tailBaseY = bubbleTop + bubbleH * 0.40;
    bubble.fillStyle(0xffffff, 0.95);
    bubble.fillTriangle(
      tailBaseX, tailBaseY - 12,
      tailBaseX, tailBaseY + 12,
      tailBaseX - 22, tailBaseY + 8
    );
    bubble.lineStyle(3, 0x1a1a2e, 1);
    bubble.lineBetween(tailBaseX - 22, tailBaseY + 8, tailBaseX, tailBaseY - 12);
    bubble.lineBetween(tailBaseX - 22, tailBaseY + 8, tailBaseX, tailBaseY + 12);

    bubble.setScale(0.85);
    bubble.setAlpha(0);
    this.tweens.add({
      targets: bubble,
      scaleX: 1, scaleY: 1, alpha: 1,
      duration: 400, ease: 'Back.easeOut', delay: 350
    });

    var dialogText = this.add.text(bubbleLeft + 18, bubbleTop + 14, '', {
      fontFamily: GBR.FONTS.body,
      fontSize: '16px',
      color: '#1a1a2e',
      wordWrap: { width: bubbleW - 36 },
      lineSpacing: 6
    }).setDepth(11);

    var fullText = story.text;
    var charIndex = 0;
    face.startTalking();

    var typeTimer = this.time.addEvent({
      delay: 28,
      callback: function () {
        charIndex++;
        dialogText.setText(fullText.substring(0, charIndex));
        if (charIndex >= fullText.length) {
          typeTimer.destroy();
          face.stopTalking();
          face.setExpression('excited');
        }
      },
      repeat: fullText.length - 1
    });

    this.input.once('pointerdown', function () {
      if (charIndex < fullText.length) {
        typeTimer.destroy();
        charIndex = fullText.length;
        dialogText.setText(fullText);
        face.stopTalking();
        face.setExpression('excited');
      }
    });

    this.events.once('shutdown', function () {
      face.destroy();
    });

    // ============================================================
    //  LAYER 7 — Venue marquee
    // ============================================================
    var venueX = W * 0.88;
    var venueY = skylineBase;
    var venueW = 60;
    var venueH = 120;
    var venue = this.add.graphics().setDepth(2);
    venue.fillStyle(0x12121a, 1);
    venue.fillRect(venueX - venueW / 2, venueY - venueH, venueW, venueH + 20);
    venue.fillStyle(theme.accent, 0.9);
    venue.fillRect(venueX - venueW / 2 - 5, venueY - venueH - 2, venueW + 10, 18);
    venue.fillStyle(0xffd700, 0.15);
    venue.fillRect(venueX - 8, venueY - 22, 16, 22);
    for (var ml = 0; ml < 6; ml++) {
      var lx = venueX - venueW / 2 - 2 + ml * 11;
      var bulb = this.add.circle(lx, venueY - venueH - 6, 2.5, 0xffd700, 0.8).setDepth(2);
      this.tweens.add({
        targets: bulb,
        alpha: { from: 0.8, to: 0.15 },
        duration: 400,
        yoyo: true, repeat: -1,
        delay: ml * 120,
        ease: 'Sine.easeInOut'
      });
    }
    var tonightText = this.add.text(venueX, venueY - venueH + 6, 'TONIGHT', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '9px',
      color: '#ffd700'
    }).setOrigin(0.5).setDepth(3);
    this.tweens.add({
      targets: tonightText,
      alpha: { from: 1, to: 0.3 },
      duration: 700, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // ============================================================
    //  LAYER 8 — LET'S GO button
    // ============================================================
    var btnY = skylineBase + 120;
    btnY = Math.min(btnY, H * 0.88);
    btnY = Math.max(btnY, H * 0.72);

    var btnSpot = this.add.graphics().setDepth(14);
    btnSpot.fillStyle(theme.glow, 0.08);
    btnSpot.fillEllipse(cx, btnY, 280, 60);

    setTimeout(function () {
      if (!self.scene || !self.scene.isActive()) return;

      self.tweens.add({
        targets: btnSpot,
        alpha: { from: 1, to: 0.2 },
        duration: 900, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut'
      });

      var goBtn = self.add.image(cx, btnY, 'btn_gold').setScale(1.2).setDepth(16);
      var goText = self.add.text(cx, btnY, "\u25B6  LET'S GO!", {
        fontFamily: GBR.FONTS.display,
        fontSize: '30px',
        color: '#1a0a2e',
        stroke: '#ffd700',
        strokeThickness: 1,
        padding: { left: 8, right: 8 }
      }).setOrigin(0.5).setDepth(17);

      goBtn.setInteractive({ useHandCursor: true });

      goBtn.setScale(0);
      goText.setScale(0);
      self.tweens.add({ targets: goBtn, scaleX: 1.2, scaleY: 1.2, duration: 500, ease: 'Back.easeOut' });
      self.tweens.add({ targets: goText, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut' });

      self.tweens.add({
        targets: [goBtn, goText, btnSpot],
        y: '-=3',
        duration: 1000, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut', delay: 600
      });

      goBtn.on('pointerover', function () {
        self.tweens.add({ targets: goBtn, scaleX: 1.35, scaleY: 1.35, duration: 120 });
        self.tweens.add({ targets: goText, scaleX: 1.08, scaleY: 1.08, duration: 120 });
      });
      goBtn.on('pointerout', function () {
        self.tweens.add({ targets: goBtn, scaleX: 1.2, scaleY: 1.2, duration: 120 });
        self.tweens.add({ targets: goText, scaleX: 1, scaleY: 1, duration: 120 });
      });
      goBtn.on('pointerdown', function () {
        AudioSynth.resume();
        AudioSynth.playCollect();
        GBR.state.currentAct = self.actNumber + 1;
        TransitionHelper.fadeToScene(self, self.nextScene);
      });
    }, 1200);

    // ============================================================
    //  LAYER 9 — Sparkle particles
    // ============================================================
    if (this.add.particles) {
      try {
        this.add.particles(portraitX, portraitY, 'star', {
          speed: { min: 8, max: 25 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.25, end: 0 },
          alpha: { start: 0.45, end: 0 },
          lifespan: 1600,
          frequency: 500,
          tint: [0xffd700, theme.accent, 0xffffff],
          blendMode: 'ADD',
          emitZone: {
            type: 'random',
            source: new Phaser.Geom.Rectangle(-80, -90, 160, 180)
          }
        }).setDepth(7);
      } catch (e) { /* fail silently */ }
    }
  }
});
