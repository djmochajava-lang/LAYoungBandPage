/* GroovyBandRush/js/scenes/StoryScene.js — V3 NIGHT SKY + SHOW LIGHTS */

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

    // Resume audio on interaction
    AudioSynth.resume();

    // ============================================================
    //  PER-ACT ACCENT COLORS
    // ============================================================
    var actThemes = [
      { accent: 0xe8751a, accentHex: '#e8751a', glow: 0xffd700, light1: 0xe84393, light2: 0x00e5ff, light3: 0xffd700 },
      { accent: 0x3498db, accentHex: '#3498db', glow: 0x00e5ff, light1: 0x3498db, light2: 0x2ecc71, light3: 0x00e5ff },
      { accent: 0x2ecc71, accentHex: '#2ecc71', glow: 0x2ecc71, light1: 0x2ecc71, light2: 0xffd700, light3: 0x00e5ff },
      { accent: 0x9b59b6, accentHex: '#9b59b6', glow: 0xe84393, light1: 0x9b59b6, light2: 0xe84393, light3: 0x3498db },
      { accent: 0xe63946, accentHex: '#e63946', glow: 0xff6b6b, light1: 0xe63946, light2: 0xffd700, light3: 0xe84393 },
      { accent: 0xffd700, accentHex: '#ffd700', glow: 0xffd700, light1: 0xffd700, light2: 0xe8751a, light3: 0xe84393 }
    ];
    var theme = actThemes[Math.min(this.actNumber, actThemes.length - 1)];

    // ============================================================
    //  LAYOUT MAP (800px height):
    //
    //  0.04  (32)   ACT badge
    //  0.13  (104)  Title
    //  0.30  (240)  L.A. Young portrait center
    //  0.46  (368)  Speaker name
    //  0.51–0.72    Dialogue box
    //  0.80  (640)  LET'S GO! button
    //  0.93  (744)  Band progress icons
    // ============================================================

    // ============================================================
    //  LAYER 0 — Deep night sky gradient
    // ============================================================
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x050510, 0x050510, 0x0a1628, 0x0d1f3c);
    bg.fillRect(0, 0, W, H);

    // Subtle deep blue vignette glow at center
    var vignette = this.add.graphics();
    vignette.fillStyle(0x1a2a4a, 0.15);
    vignette.fillCircle(cx, H * 0.4, 350);

    // ============================================================
    //  LAYER 1 — Twinkling starfield
    // ============================================================
    for (var i = 0; i < 55; i++) {
      var starX = Phaser.Math.Between(0, W);
      var starY = Phaser.Math.Between(0, H);
      var starSize = Phaser.Math.FloatBetween(0.5, 2.5);
      var starAlpha = Phaser.Math.FloatBetween(0.15, 0.85);

      var star = this.add.circle(starX, starY, starSize, 0xffffff, starAlpha);

      // Twinkle animation — varied speeds for realistic feel
      this.tweens.add({
        targets: star,
        alpha: { from: starAlpha, to: Phaser.Math.FloatBetween(0.02, 0.15) },
        duration: Phaser.Math.Between(800, 3000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2500),
        ease: 'Sine.easeInOut'
      });
    }

    // A few bright colored accent stars
    var accentStarColors = [0xffd700, 0x00e5ff, 0xe84393, 0xff6b6b, 0x2ecc71];
    for (var a = 0; a < 8; a++) {
      var astar = this.add.image(
        Phaser.Math.Between(20, W - 20),
        Phaser.Math.Between(10, H * 0.5),
        'star'
      ).setScale(Phaser.Math.FloatBetween(0.4, 1.0))
       .setAlpha(Phaser.Math.FloatBetween(0.3, 0.7))
       .setTint(Phaser.Math.RND.pick(accentStarColors));

      this.tweens.add({
        targets: astar,
        alpha: 0.05,
        scaleX: astar.scaleX * 0.6,
        scaleY: astar.scaleY * 0.6,
        duration: Phaser.Math.Between(1200, 2800),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
        ease: 'Sine.easeInOut'
      });
    }

    // ============================================================
    //  LAYER 2 — Animated show lights (sweeping color beams)
    // ============================================================
    var lightsGfx = this.add.graphics();
    lightsGfx.setAlpha(0.12);
    lightsGfx.setBlendMode(Phaser.BlendModes.ADD);

    // Draw 3 triangular light beams from top
    var lightBeams = [
      { originX: W * 0.15, color: theme.light1, angle: 0, speed: 2200 },
      { originX: W * 0.5,  color: theme.light2, angle: 0, speed: 3000 },
      { originX: W * 0.85, color: theme.light3, angle: 0, speed: 2600 }
    ];

    // Use a container to hold light beam graphics so we can animate them
    var beamObjects = [];
    for (var b = 0; b < lightBeams.length; b++) {
      var beam = lightBeams[b];
      var beamGfx = this.add.graphics();
      beamGfx.setAlpha(0.08);
      beamGfx.setBlendMode(Phaser.BlendModes.ADD);

      // Wide triangle from origin point downward
      beamGfx.fillStyle(beam.color, 1);
      beamGfx.fillTriangle(
        beam.originX, 0,
        beam.originX - 100, H * 0.7,
        beam.originX + 100, H * 0.7
      );

      beamObjects.push(beamGfx);

      // Sway the beam left-right
      this.tweens.add({
        targets: beamGfx,
        x: { from: -40, to: 40 },
        alpha: { from: 0.08, to: 0.14 },
        duration: beam.speed,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: b * 400
      });
    }

    // ============================================================
    //  LAYER 3 — Act badge
    // ============================================================
    var actLabel = this.actNumber === 0 ? '\u2B50 PROLOGUE \u2B50' : '\u2B50 ACT ' + this.actNumber + ' \u2B50';
    var badge = this.add.text(cx, H * 0.04, actLabel, {
      fontFamily: GBR.FONTS.fun,
      fontSize: '16px',
      color: '#1a0a2e',
      backgroundColor: '#ffd700',
      padding: { x: 20, y: 6 }
    }).setOrigin(0.5);
    badge.setScale(0);
    this.tweens.add({ targets: badge, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.easeOut', delay: 100 });
    this.tweens.add({
      targets: badge,
      scaleX: { from: 1, to: 1.05 }, scaleY: { from: 1, to: 1.05 },
      duration: 900, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut', delay: 600
    });

    // ============================================================
    //  LAYER 4 — Title (big, bold, glowing on dark)
    // ============================================================
    var titleText = this.add.text(cx, H * 0.12, story.title, {
      fontFamily: GBR.FONTS.display,
      fontSize: '48px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 0, color: theme.accentHex, blur: 16, fill: true },
      padding: { left: 16, right: 16, top: 6, bottom: 6 }
    }).setOrigin(0.5);

    // Pop-in animation
    titleText.setScale(0);
    this.tweens.add({ targets: titleText, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut', delay: 200 });

    // Subtle tilt
    this.tweens.add({
      targets: titleText,
      angle: { from: -1, to: 1 },
      duration: 2500, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut', delay: 800
    });

    // ============================================================
    //  LAYER 5 — L.A. Young portrait (spotlight glow)
    // ============================================================
    var photoY = H * 0.30;
    var photoRadius = 80;

    // Soft spotlight glow behind portrait (looks like a stage light hitting her)
    var portraitSpot = this.add.graphics();
    portraitSpot.fillStyle(theme.glow, 0.06);
    portraitSpot.fillCircle(cx, photoY, photoRadius + 60);
    portraitSpot.fillStyle(0xffffff, 0.03);
    portraitSpot.fillCircle(cx, photoY, photoRadius + 35);

    // Pulsing glow ellipse (matches LAFace elliptical shape: 170w x 200h)
    var glowEllipse = this.add.graphics();
    glowEllipse.fillStyle(theme.glow, 0.12);
    glowEllipse.fillEllipse(cx, photoY, 200, 230);
    this.tweens.add({
      targets: glowEllipse,
      scaleX: 1.12, scaleY: 1.12, alpha: 0.02,
      duration: 1400, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Animated talking face (L.A. Young) — includes its own bold gold elliptical border
    var face = LAFace.create(this, cx, photoY);

    // Gentle float for glow + spotlight (face already floats via LAFace)
    this.tweens.add({
      targets: [glowEllipse, portraitSpot],
      y: '-=3',
      duration: 2000, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // ============================================================
    //  LAYER 6 — Speaker name
    // ============================================================
    var speakerText = this.add.text(cx, H * 0.46, story.speaker, {
      fontFamily: GBR.FONTS.fun,
      fontSize: '22px',
      color: theme.accentHex,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(10);

    speakerText.setScale(0);
    this.tweens.add({ targets: speakerText, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.easeOut', delay: 350 });

    // ============================================================
    //  LAYER 7 — Dialogue box (dark glass panel)
    // ============================================================
    var dialogX = W * 0.08;
    var dialogW = W * 0.84;
    var dialogY = H * 0.51;
    var dialogH = H * 0.21;

    var dialogBg = this.add.graphics();
    // Dark semi-transparent panel
    dialogBg.fillStyle(0x0a0e1a, 0.75);
    dialogBg.fillRoundedRect(dialogX, dialogY, dialogW, dialogH, 16);
    // Gold accent border
    dialogBg.lineStyle(2, 0xffd700, 0.35);
    dialogBg.strokeRoundedRect(dialogX, dialogY, dialogW, dialogH, 16);
    // Subtle inner highlight (top edge glow)
    dialogBg.lineStyle(1, 0xffffff, 0.06);
    dialogBg.strokeRoundedRect(dialogX + 2, dialogY + 2, dialogW - 4, dialogH - 4, 14);

    // Speech triangle pointing up toward speaker
    dialogBg.fillStyle(0x0a0e1a, 0.75);
    dialogBg.fillTriangle(cx - 8, dialogY, cx + 8, dialogY, cx, dialogY - 10);
    dialogBg.lineStyle(2, 0xffd700, 0.35);
    dialogBg.lineBetween(cx - 8, dialogY, cx, dialogY - 10);
    dialogBg.lineBetween(cx, dialogY - 10, cx + 8, dialogY);

    // Pop-in dialog box
    dialogBg.setScale(0.9);
    dialogBg.setAlpha(0);
    this.tweens.add({
      targets: dialogBg,
      scaleX: 1, scaleY: 1, alpha: 1,
      duration: 400, ease: 'Back.easeOut', delay: 400
    });

    // Typewriter text
    var dialogText = this.add.text(dialogX + 24, dialogY + 18, '', {
      fontFamily: GBR.FONTS.body,
      fontSize: '16px',
      color: '#e0e0e0',
      wordWrap: { width: dialogW - 48 },
      lineSpacing: 7
    });

    var fullText = story.text;
    var charIndex = 0;

    // Start talking when typewriter begins
    face.startTalking();

    var typeTimer = this.time.addEvent({
      delay: 30,
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

    // Tap to skip typewriter
    this.input.once('pointerdown', function () {
      if (charIndex < fullText.length) {
        typeTimer.destroy();
        charIndex = fullText.length;
        dialogText.setText(fullText);
        face.stopTalking();
        face.setExpression('excited');
      }
    });

    // Cleanup face timers when scene shuts down
    this.events.once('shutdown', function () {
      face.destroy();
    });

    // ============================================================
    //  LAYER 8 — LET'S GO! button (gold on dark = pops nicely)
    // ============================================================
    var btnY = H * 0.80;

    // Glow behind button
    var btnGlow = this.add.graphics();
    btnGlow.fillStyle(theme.glow, 0.10);
    btnGlow.fillRoundedRect(cx - 140, btnY - 35, 280, 70, 35);

    setTimeout(function () {
      if (!self.scene || !self.scene.isActive()) return;

      // Glow pulse
      self.tweens.add({
        targets: btnGlow,
        alpha: { from: 1, to: 0.2 },
        duration: 900, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Button — use gold button on dark background for contrast
      var goBtn = self.add.image(cx, btnY, 'btn_gold').setScale(1.15);
      var goText = self.add.text(cx, btnY, "\u25B6  LET'S GO!", {
        fontFamily: GBR.FONTS.display,
        fontSize: '30px',
        color: '#1a0a2e',
        stroke: '#000000',
        strokeThickness: 1,
        padding: { left: 8, right: 8 }
      }).setOrigin(0.5);

      goBtn.setInteractive({ useHandCursor: true });

      // Bounce-in entrance
      goBtn.setScale(0);
      goText.setScale(0);
      self.tweens.add({ targets: goBtn, scaleX: 1.15, scaleY: 1.15, duration: 500, ease: 'Back.easeOut' });
      self.tweens.add({ targets: goText, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut' });

      // Continuous pulse
      self.tweens.add({
        targets: [goBtn, goText, btnGlow],
        y: '-=4',
        duration: 1000, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut', delay: 600
      });

      goBtn.on('pointerover', function () {
        self.tweens.add({ targets: goBtn, scaleX: 1.3, scaleY: 1.3, duration: 120 });
        self.tweens.add({ targets: goText, scaleX: 1.06, scaleY: 1.06, duration: 120 });
      });
      goBtn.on('pointerout', function () {
        self.tweens.add({ targets: goBtn, scaleX: 1.15, scaleY: 1.15, duration: 120 });
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
    //  LAYER 9 — Band progress (bottom, with glow)
    // ============================================================
    var progressY = H * 0.93;
    var progSpacing = Math.min(W / 6, 80);
    var progStartX = cx - progSpacing * 2;

    for (var m = 0; m < 5; m++) {
      var member = GBR.BAND[m];
      var found = GBR.state.bandMembers[m].found;
      var mx = progStartX + m * progSpacing;

      // Glow circle behind found members
      if (found) {
        var progGlow = this.add.circle(mx, progressY, 22, member.color, 0.18);
        this.tweens.add({
          targets: progGlow,
          alpha: { from: 0.18, to: 0.05 },
          scaleX: { from: 1, to: 1.2 }, scaleY: { from: 1, to: 1.2 },
          duration: 1000, yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut', delay: m * 200
        });
      }

      // Member icon
      this.add.image(mx, progressY, 'member_' + m)
        .setScale(found ? 0.14 : 0.12)
        .setAlpha(found ? 1 : 0.2);

      // Emoji label below
      this.add.text(mx, progressY + 24, member.emoji, {
        fontSize: '12px'
      }).setOrigin(0.5).setAlpha(found ? 0.8 : 0.15);
    }

    // ============================================================
    //  LAYER 10 — Sparkle emitter near portrait
    // ============================================================
    if (this.add.particles) {
      try {
        this.add.particles(cx, photoY, 'star', {
          speed: { min: 8, max: 30 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.35, end: 0 },
          alpha: { start: 0.5, end: 0 },
          lifespan: 2000,
          frequency: 400,
          tint: [0xffd700, theme.accent, 0xffffff],
          blendMode: 'ADD',
          emitZone: {
            type: 'random',
            source: new Phaser.Geom.Rectangle(-90, -90, 180, 180)
          }
        }).setDepth(0);
      } catch (e) { /* fail silently */ }
    }

    // ============================================================
    //  CAMERA — Fade in
    // ============================================================
    TransitionHelper.fadeIn(this, 600);
  }
});
