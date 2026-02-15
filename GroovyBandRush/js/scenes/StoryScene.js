/* GroovyBandRush/js/scenes/StoryScene.js — V2 HIGH-ENERGY STORY CUTSCENE */

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
    //  PER-ACT ACCENT COLORS (keeps each act feeling fresh)
    // ============================================================
    var actThemes = [
      { grad1: 0x2d1b69, grad2: 0xe84393, grad3: 0xfd7014, accent: 0xe8751a, accentHex: '#e8751a', glow: 0xffd700 },  // Prologue: purple→pink→orange
      { grad1: 0x1a3a5c, grad2: 0x2196f3, grad3: 0x00e5ff, accent: 0x3498db, accentHex: '#3498db', glow: 0x00e5ff },  // Act 1: blue tones
      { grad1: 0x1a4a2e, grad2: 0x2ecc71, grad3: 0xf1c40f, accent: 0x2ecc71, accentHex: '#2ecc71', glow: 0x2ecc71 },  // Act 2: green tones
      { grad1: 0x3a1a5c, grad2: 0x9b59b6, grad3: 0xe84393, accent: 0x9b59b6, accentHex: '#9b59b6', glow: 0xe84393 },  // Act 3: purple tones
      { grad1: 0x5c1a1a, grad2: 0xe63946, grad3: 0xfd7014, accent: 0xe63946, accentHex: '#e63946', glow: 0xff6b6b },  // Act 4: red tones
      { grad1: 0x2d1b69, grad2: 0xffd700, grad3: 0xe8751a, accent: 0xffd700, accentHex: '#ffd700', glow: 0xffd700 }   // Act 5: gold celebration
    ];
    var theme = actThemes[Math.min(this.actNumber, actThemes.length - 1)];

    // ============================================================
    //  LAYOUT MAP (800px height):
    //
    //  0.04  (32)   ACT badge (PROLOGUE / ACT 1 / etc)
    //  0.13  (104)  Title ("THE MISSION" etc)
    //  0.30  (240)  L.A. Young portrait center (r=80, spans 160-320)
    //  0.48  (384)  Speaker name
    //  0.52–0.72    Dialogue box
    //  0.78  (624)  LET'S GO! button
    //  0.90–0.97    Band progress icons
    // ============================================================

    // ============================================================
    //  LAYER 0 — Vibrant gradient background
    // ============================================================
    var bg = this.add.graphics();
    bg.fillGradientStyle(theme.grad1, theme.grad1, theme.grad2, theme.grad3);
    bg.fillRect(0, 0, W, H);

    // Radial spotlight glow behind portrait
    var spotlight = this.add.graphics();
    spotlight.fillStyle(theme.glow, 0.08);
    spotlight.fillCircle(cx, H * 0.30, 250);
    spotlight.fillStyle(theme.glow, 0.04);
    spotlight.fillCircle(cx, H * 0.30, 380);

    // ============================================================
    //  LAYER 1 — Sparkle particles + floating music notes
    // ============================================================
    for (var i = 0; i < 18; i++) {
      var s = this.add.image(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(0, H),
        'star'
      ).setAlpha(Phaser.Math.FloatBetween(0.2, 0.7))
       .setScale(Phaser.Math.FloatBetween(0.4, 1.2))
       .setTint(Phaser.Math.RND.pick([0xffd700, 0xffffff, theme.accent, 0x00e5ff]));

      this.tweens.add({
        targets: s,
        y: s.y - Phaser.Math.Between(15, 45),
        alpha: 0.05,
        duration: Phaser.Math.Between(1500, 3500),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
        ease: 'Sine.easeInOut'
      });
    }

    // Rising music notes
    var noteChars = ['\u266A', '\u266B', '\u2669', '\u266C'];
    var noteColors = ['#ffd700', '#00e5ff', '#e84393', '#ff6b6b', '#2ecc71', '#ffffff'];
    for (var n = 0; n < 8; n++) {
      var noteX = Phaser.Math.Between(20, W - 20);
      var noteStartY = H + Phaser.Math.Between(20, 60);
      var noteText = this.add.text(noteX, noteStartY, Phaser.Math.RND.pick(noteChars), {
        fontSize: Phaser.Math.Between(14, 28) + 'px',
        color: Phaser.Math.RND.pick(noteColors)
      }).setOrigin(0.5).setAlpha(0.5);

      this.tweens.add({
        targets: noteText,
        y: -30,
        x: noteX + Phaser.Math.Between(-40, 40),
        alpha: 0,
        angle: Phaser.Math.Between(-20, 20),
        duration: Phaser.Math.Between(6000, 10000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 4000),
        ease: 'Sine.easeOut',
        onRepeat: function (tween, target) {
          target.x = Phaser.Math.Between(20, W - 20);
          target.y = H + 30;
          target.alpha = 0.5;
          target.angle = 0;
        }
      });
    }

    // ============================================================
    //  LAYER 2 — Act badge
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
    //  LAYER 3 — Title (big, bold, with effects)
    // ============================================================
    var titleText = this.add.text(cx, H * 0.12, story.title, {
      fontFamily: GBR.FONTS.display,
      fontSize: '48px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 5,
      shadow: { offsetX: 3, offsetY: 3, color: theme.accentHex, blur: 8, fill: true },
      padding: { left: 12, right: 12, top: 4, bottom: 4 }
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
    //  LAYER 4 — L.A. Young portrait (glowing, prominent)
    // ============================================================
    var photoY = H * 0.30;
    var photoRadius = 80;

    // Pulsing glow rings (themed)
    var glowRing = this.add.circle(cx, photoY, photoRadius + 18, theme.glow, 0.12);
    this.tweens.add({
      targets: glowRing,
      scaleX: 1.15, scaleY: 1.15, alpha: 0.03,
      duration: 1200, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });
    var glowRing2 = this.add.circle(cx, photoY, photoRadius + 10, theme.accent, 0.10);
    this.tweens.add({
      targets: glowRing2,
      scaleX: 1.1, scaleY: 1.1, alpha: 0.02,
      duration: 1500, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut', delay: 400
    });

    // Animated talking face (L.A. Young)
    var face = LAFace.create(this, cx, photoY);

    // Gold + accent double ring around portrait
    var outerRing = this.add.circle(cx, photoY, photoRadius + 5, 0x000000, 0).setStrokeStyle(4, 0xffd700);
    var outerRing2 = this.add.circle(cx, photoY, photoRadius + 9, 0x000000, 0).setStrokeStyle(2, 0xffffff, 0.25);

    // Gentle float for rings (face already floats via LAFace)
    this.tweens.add({
      targets: [glowRing, glowRing2, outerRing, outerRing2],
      y: photoY - 3,
      duration: 2000, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // ============================================================
    //  LAYER 5 — Speaker name
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
    //  LAYER 6 — Dialogue box (stylish speech bubble)
    // ============================================================
    var dialogX = W * 0.08;
    var dialogW = W * 0.84;
    var dialogY = H * 0.51;
    var dialogH = H * 0.21;

    // Gradient-filled dialog background
    var dialogBg = this.add.graphics();
    dialogBg.fillStyle(0x000000, 0.55);
    dialogBg.fillRoundedRect(dialogX, dialogY, dialogW, dialogH, 20);
    // Themed border
    dialogBg.lineStyle(2, theme.glow, 0.5);
    dialogBg.strokeRoundedRect(dialogX, dialogY, dialogW, dialogH, 20);
    // Inner subtle highlight
    dialogBg.lineStyle(1, 0xffffff, 0.08);
    dialogBg.strokeRoundedRect(dialogX + 3, dialogY + 3, dialogW - 6, dialogH - 6, 17);

    // Small speech triangle pointing up toward speaker
    dialogBg.fillStyle(0x000000, 0.55);
    dialogBg.fillTriangle(cx - 10, dialogY, cx + 10, dialogY, cx, dialogY - 12);
    dialogBg.lineStyle(2, theme.glow, 0.5);
    dialogBg.lineBetween(cx - 10, dialogY, cx, dialogY - 12);
    dialogBg.lineBetween(cx, dialogY - 12, cx + 10, dialogY);

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
      color: '#ffffff',
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
    //  LAYER 7 — LET'S GO! MEGA BUTTON (matching intro page style)
    // ============================================================
    var btnY = H * 0.80;

    // Glow behind button
    var btnGlow = this.add.graphics();
    btnGlow.fillStyle(theme.glow, 0.15);
    btnGlow.fillRoundedRect(cx - 140, btnY - 35, 280, 70, 35);

    setTimeout(function () {
      if (!self.scene || !self.scene.isActive()) return;

      // Glow pulse
      self.tweens.add({
        targets: btnGlow,
        alpha: { from: 1, to: 0.25 },
        duration: 800, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Button background
      var goBtn = self.add.image(cx, btnY, 'btn_orange').setScale(1.2);
      var goText = self.add.text(cx, btnY, "\u25B6  LET'S GO!", {
        fontFamily: GBR.FONTS.display,
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: false },
        padding: { left: 8, right: 8 }
      }).setOrigin(0.5);

      goBtn.setInteractive({ useHandCursor: true });

      // Bounce-in entrance
      goBtn.setScale(0);
      goText.setScale(0);
      self.tweens.add({ targets: goBtn, scaleX: 1.2, scaleY: 1.2, duration: 500, ease: 'Back.easeOut' });
      self.tweens.add({ targets: goText, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut' });

      // Continuous pulse
      self.tweens.add({
        targets: [goBtn, goText, btnGlow],
        y: '-=4',
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
    //  LAYER 8 — Band progress (bottom, styled)
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
        var progGlow = this.add.circle(mx, progressY, 22, member.color, 0.15);
        this.tweens.add({
          targets: progGlow,
          alpha: { from: 0.15, to: 0.05 },
          scaleX: { from: 1, to: 1.2 }, scaleY: { from: 1, to: 1.2 },
          duration: 1000, yoyo: true, repeat: -1,
          ease: 'Sine.easeInOut', delay: m * 200
        });
      }

      // Member icon
      var icon = this.add.image(mx, progressY, 'member_' + m)
        .setScale(found ? 0.14 : 0.12)
        .setAlpha(found ? 1 : 0.25);

      // Emoji label below
      this.add.text(mx, progressY + 24, member.emoji, {
        fontSize: '12px'
      }).setOrigin(0.5).setAlpha(found ? 0.8 : 0.2);
    }

    // ============================================================
    //  LAYER 9 — Sparkle emitter around portrait area
    // ============================================================
    if (this.add.particles) {
      try {
        var emitter = this.add.particles(cx, photoY, 'star', {
          speed: { min: 10, max: 40 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.4, end: 0 },
          alpha: { start: 0.6, end: 0 },
          lifespan: 1800,
          frequency: 350,
          tint: [0xffd700, theme.accent, 0xffffff],
          blendMode: 'ADD',
          emitZone: {
            type: 'random',
            source: new Phaser.Geom.Rectangle(-100, -100, 200, 200)
          }
        });
        emitter.setDepth(0);
      } catch (e) { /* fail silently */ }
    }

    // ============================================================
    //  CAMERA — Fade in
    // ============================================================
    TransitionHelper.fadeIn(this, 600);
  }
});
