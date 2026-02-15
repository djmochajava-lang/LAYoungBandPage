/* GroovyBandRush/js/scenes/StoryScene.js — V7 HERO SPLASH ALL ACTS */

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
        .setDisplaySize(30, 45)
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
  //  HERO SPLASH LAYOUT (Acts 1-4) — Same dramatic style as Prologue
  // ================================================================
  _createComicLayout: function (W, H, cx, story, theme) {
    var self = this;

    // ============================================================
    //  LAYER 2 — Compressed city skyline (behind hero)
    // ============================================================
    var skylineBase = H * 0.62;
    var skyGfx = this.add.graphics().setDepth(1);

    var blds = [];
    var bx = 0;
    while (bx < W + 10) {
      var bw = Phaser.Math.Between(22, 45);
      var bh = Phaser.Math.Between(40, 100);
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

    // Ground fill below skyline
    var ground = this.add.graphics().setDepth(1);
    ground.fillStyle(0x080810, 1);
    ground.fillRect(0, skylineBase, W, H - skylineBase);
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
        .setDisplaySize(30, 45)
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
    var heroScale = (H * 0.65) / 1536;
    heroScale = Math.max(0.28, Math.min(0.42, heroScale));

    var hero = this.add.image(cx, H + 200, 'la_cartoon')
      .setOrigin(0.5, 1)
      .setScale(heroScale * 0.8)
      .setDepth(8);

    // Hero Slam entrance
    var heroSlamDuration = 500;
    this.tweens.add({
      targets: hero,
      y: heroTargetY,
      scaleX: heroScale,
      scaleY: heroScale,
      duration: heroSlamDuration,
      ease: 'Back.easeOut',
      onComplete: function () {
        TransitionHelper.flash(self, 150);
        TransitionHelper.shake(self, 150, 0.008);

        self._createActionLines(W, H, cx, heroTargetY - (1536 * heroScale * 0.45), theme);

        // Idle breathing
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
    //  LAYER 4b — Found band member celebration (flies in beside L.A.)
    // ============================================================
    // The previous act found a member (actNumber 1 = member 0, etc.)
    var foundMemberIdx = this.actNumber - 1;
    if (foundMemberIdx >= 0 && foundMemberIdx < 4) {
      var memberInfo = GBR.BAND[foundMemberIdx];
      var heroImgW = 1024 * heroScale;
      var memberX = cx + heroImgW / 2 + 30;
      var memberTargetY = H * 0.70;

      // Band member sprite flies in from right
      var foundMember = this.add.image(W + 100, memberTargetY, 'member_' + foundMemberIdx)
        .setDisplaySize(46, 69)
        .setOrigin(0.5, 1)
        .setDepth(10);

      this.tweens.add({
        targets: foundMember,
        x: memberX,
        duration: 600,
        delay: heroSlamDuration + 200,
        ease: 'Back.easeOut',
        onComplete: function () {
          // Bounce idle
          self.tweens.add({
            targets: foundMember,
            y: memberTargetY - 6,
            duration: 1800,
            yoyo: true, repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      });

      // Member name tag
      var memberTag = this.add.text(memberX, memberTargetY + 8, memberInfo.emoji + ' ' + memberInfo.role, {
        fontFamily: GBR.FONTS.fun,
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: memberInfo.colorHex,
        padding: { x: 8, y: 3 }
      }).setOrigin(0.5, 0).setDepth(11).setAlpha(0);

      this.tweens.add({
        targets: memberTag,
        alpha: 1,
        delay: heroSlamDuration + 600,
        duration: 300
      });

      // Glow behind found member
      var memberGlow = this.add.graphics().setDepth(9);
      memberGlow.fillStyle(memberInfo.color, 0.15);
      memberGlow.fillEllipse(memberX, memberTargetY - 25, 55, 80);
      memberGlow.setAlpha(0);
      this.tweens.add({
        targets: memberGlow,
        alpha: 1,
        delay: heroSlamDuration + 200,
        duration: 400
      });
    }

    // ============================================================
    //  LAYER 5 — Dialogue text (floating, same as Prologue)
    // ============================================================
    var panelY = H * 0.05;
    var panelW = W - 40;

    var textContainer = this.add.container(0, -H * 0.3).setDepth(16);

    // Act badge — white on theme color
    var actLabel = '\u2B50 ACT ' + this.actNumber + ' \u2B50';
    var badge = this.add.text(cx, panelY + 18, actLabel, {
      fontFamily: GBR.FONTS.fun,
      fontSize: '13px',
      color: '#ffffff',
      backgroundColor: theme.accentHex,
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

    // Speaker chip on hero photo top-right corner
    var heroImgW2 = 1024 * heroScale;
    var heroImgH2 = 1536 * heroScale;
    var chipX = cx + heroImgW2 / 2 - 8;
    var chipY = heroTargetY - heroImgH2 + 8;
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

    // Slide text container down
    this.tweens.add({
      targets: textContainer,
      y: 0,
      duration: 500,
      ease: 'Back.easeOut',
      delay: heroSlamDuration + 100,
      onComplete: function () {
        self._startTypewriter(dialogText, story.text);
      }
    });

    // ============================================================
    //  LAYER 7 — LET'S GO button (3D pressable, same as Prologue)
    // ============================================================
    var btnY = H * 0.83;
    var btnW = 180;
    var btnH = 44;
    var btnR = 22;

    setTimeout(function () {
      if (!self.scene || !self.scene.isActive()) return;

      // 3D button: shadow layer
      var btnShadow = self.add.graphics().setDepth(18);
      btnShadow.fillStyle(0xb8860b, 1);
      btnShadow.fillRoundedRect(cx - btnW / 2, btnY - btnH / 2 + 4, btnW, btnH, btnR);

      // 3D button: main face
      var btnFace = self.add.graphics().setDepth(19);
      btnFace.fillStyle(0xffd700, 1);
      btnFace.fillRoundedRect(cx - btnW / 2, btnY - btnH / 2, btnW, btnH, btnR);
      btnFace.fillStyle(0xffec80, 0.5);
      btnFace.fillRoundedRect(cx - btnW / 2 + 4, btnY - btnH / 2 + 2, btnW - 8, btnH / 2 - 2, { tl: btnR - 2, tr: btnR - 2, bl: 0, br: 0 });

      // Hit area
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
      btnShadow.setScale(0);
      btnFace.setScale(0);
      goText.setScale(0);
      self.tweens.add({ targets: btnShadow, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut' });
      self.tweens.add({ targets: btnFace, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut' });
      self.tweens.add({ targets: goText, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut' });

      // Gentle float
      self.tweens.add({
        targets: [btnShadow, btnFace, goText, hitZone],
        y: '-=3',
        duration: 1000, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut', delay: 600
      });

      // Hover
      hitZone.on('pointerover', function () {
        self.tweens.add({ targets: [btnFace, goText], y: '-=2', duration: 100 });
      });
      hitZone.on('pointerout', function () {
        self.tweens.add({ targets: [btnFace, goText], y: '+=2', duration: 100 });
      });

      // Press
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
  }
});
