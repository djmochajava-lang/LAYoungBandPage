/* GroovyBandRush/js/scenes/MainMenuScene.js — V2 HIGH-ENERGY KIDS SPLASH */

var MainMenuScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function MainMenuScene() {
    Phaser.Scene.call(this, { key: 'MainMenuScene' });
  },

  create: function () {
    var W = this.cameras.main.width;
    var H = this.cameras.main.height;
    var self = this;
    var cx = W / 2;

    GBR.resetState();

    // ============================================================
    //  LAYOUT MAP (800px height):
    //
    //  0.03  (24)   ⭐ FREE TO PLAY ⭐ badge
    //  0.12  (96)   GROOVY
    //  0.21  (168)  BAND RUSH
    //  0.28  (224)  ✨ Soul in Full Color ✨
    //  0.38  (304)  Headshot center (r=72, spans 232–376)
    //  0.50  (400)  Description text
    //  0.60  (480)  ▶ PLAY NOW! button
    //  0.74  (592)  Stage edge line
    //  0.74–0.90    Band members standing on stage
    //  0.96  (768)  Footer
    // ============================================================

    // ============================================================
    //  LAYER 0 — Vibrant gradient background
    // ============================================================
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x2d1b69, 0x2d1b69, 0xe84393, 0xfd7014);
    bg.fillRect(0, 0, W, H);

    // Radial spotlight glow behind title + headshot area
    var spotlight = this.add.graphics();
    spotlight.fillStyle(0xffd700, 0.07);
    spotlight.fillCircle(cx, H * 0.28, 280);
    spotlight.fillStyle(0xffd700, 0.04);
    spotlight.fillCircle(cx, H * 0.28, 420);

    // ============================================================
    //  LAYER 1 — Animated particles (stars + floating music notes)
    // ============================================================
    for (var i = 0; i < 25; i++) {
      var s = this.add.image(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(0, H),
        'star'
      ).setAlpha(Phaser.Math.FloatBetween(0.3, 0.8))
       .setScale(Phaser.Math.FloatBetween(0.5, 1.4))
       .setTint(Phaser.Math.RND.pick([0xffd700, 0xffffff, 0xe84393, 0x00e5ff]));

      this.tweens.add({
        targets: s,
        y: s.y - Phaser.Math.Between(15, 50),
        alpha: 0.1,
        duration: Phaser.Math.Between(1500, 4000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
        ease: 'Sine.easeInOut'
      });
    }

    // Rising music notes from bottom
    var noteChars = ['\u266A', '\u266B', '\u2669', '\u266C'];
    var noteColors = ['#ffd700', '#00e5ff', '#e84393', '#ff6b6b', '#2ecc71', '#ffffff'];
    for (var n = 0; n < 12; n++) {
      var noteX = Phaser.Math.Between(20, W - 20);
      var noteStartY = H + Phaser.Math.Between(20, 80);
      var noteText = this.add.text(noteX, noteStartY, Phaser.Math.RND.pick(noteChars), {
        fontSize: Phaser.Math.Between(16, 32) + 'px',
        color: Phaser.Math.RND.pick(noteColors)
      }).setOrigin(0.5).setAlpha(0.6);

      this.tweens.add({
        targets: noteText,
        y: -30,
        x: noteX + Phaser.Math.Between(-50, 50),
        alpha: 0,
        angle: Phaser.Math.Between(-25, 25),
        duration: Phaser.Math.Between(6000, 11000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 5000),
        ease: 'Sine.easeOut',
        onRepeat: function (tween, target) {
          target.x = Phaser.Math.Between(20, W - 20);
          target.y = H + 30;
          target.alpha = 0.6;
          target.angle = 0;
        }
      });
    }

    // ============================================================
    //  LAYER 2 — Stage floor at bottom
    // ============================================================
    var stageY = H * 0.73;
    var stage = this.add.graphics();
    // Slightly lighter purple stage so members pop
    stage.fillGradientStyle(0x2d1b69, 0x2d1b69, 0x3a2580, 0x3a2580);
    stage.fillRect(0, stageY, W, H - stageY);
    // Gold stage edge — double line for polish
    stage.lineStyle(2, 0xffd700, 0.9);
    stage.lineBetween(0, stageY, W, stageY);
    stage.lineStyle(1, 0xffd700, 0.3);
    stage.lineBetween(0, stageY + 4, W, stageY + 4);

    // Spotlight pools at each member's feet (stageY + 12 + 300*0.42 ≈ stageY + 138)
    var spotSpacing = Math.min(W / 5, 110);
    var spotFeetY = stageY + 12 + Math.round(300 * 0.42) + 4;
    var spotPositions = [cx - spotSpacing * 1.7, cx - spotSpacing * 0.6, cx + spotSpacing * 0.6, cx + spotSpacing * 1.7];
    for (var sp = 0; sp < 4; sp++) {
      stage.fillStyle(GBR.BAND[sp].color, 0.08);
      stage.fillEllipse(spotPositions[sp], spotFeetY, 90, 18);
      stage.fillStyle(0xffd700, 0.04);
      stage.fillEllipse(spotPositions[sp], spotFeetY, 110, 24);
    }

    // ============================================================
    //  LAYER 3 — Band members ON the stage (bigger, brighter)
    // ============================================================
    var memberTopY = stageY + 12;
    var memberDispW = 84;    // target display size (was 200 * 0.42)
    var memberDispH = 126;   // target display size (was 300 * 0.42)
    var memberPositions = [
      { x: cx - spotSpacing * 1.7, idx: 0 },
      { x: cx - spotSpacing * 0.6, idx: 1 },
      { x: cx + spotSpacing * 0.6, idx: 2 },
      { x: cx + spotSpacing * 1.7, idx: 3 },
    ];

    for (var m = 0; m < 4; m++) {
      var mp = memberPositions[m];
      var bandInfo = GBR.BAND[mp.idx];

      // Character sprite — use setDisplaySize for consistent sizing across different image resolutions
      var member = this.add.image(mp.x, memberTopY, 'member_' + mp.idx)
        .setDisplaySize(memberDispW, memberDispH)
        .setOrigin(0.5, 0);

      // Subtle sway animation
      this.tweens.add({
        targets: member,
        angle: { from: -2, to: 2 },
        duration: Phaser.Math.Between(1200, 2000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: m * 300
      });

      // Instrument label below each member's feet
      var memberBottomY = memberTopY + memberDispH;
      this.add.text(mp.x, memberBottomY + 4, bandInfo.emoji + ' ' + bandInfo.role, {
        fontFamily: GBR.FONTS.fun,
        fontSize: '11px',
        color: bandInfo.colorHex,
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5, 0);
    }

    // ============================================================
    //  LAYER 4 — L.A. Young headshot (center, prominent)
    // ============================================================
    var photoY = H * 0.38;
    var photoRadius = 72;

    // Pulsing glow rings
    var glowRing = this.add.circle(cx, photoY, photoRadius + 18, 0xffd700, 0.12);
    this.tweens.add({
      targets: glowRing,
      scaleX: 1.15, scaleY: 1.15, alpha: 0.03,
      duration: 1200, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });
    var glowRing2 = this.add.circle(cx, photoY, photoRadius + 10, 0xe84393, 0.10);
    this.tweens.add({
      targets: glowRing2,
      scaleX: 1.1, scaleY: 1.1, alpha: 0.02,
      duration: 1500, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut', delay: 400
    });

    // Dark backing circle
    this.add.circle(cx, photoY, photoRadius, 0x1a0a2e, 1);

    // Headshot image — proportional scaling
    var headshot = this.add.image(cx, photoY, 'la_headshot');
    var texW = headshot.width;
    var texH = headshot.height;
    var diam = photoRadius * 2;
    var imgScale = diam / Math.min(texW, texH);
    headshot.setDisplaySize(Math.round(texW * imgScale), Math.round(texH * imgScale));

    // Circular mask
    var maskGfx = this.make.graphics({ x: 0, y: 0, add: false });
    maskGfx.fillCircle(cx, photoY, photoRadius);
    headshot.setMask(maskGfx.createGeometryMask());

    // Gold + accent double ring
    this.add.circle(cx, photoY, photoRadius + 4, 0x000000, 0).setStrokeStyle(4, 0xffd700);
    this.add.circle(cx, photoY, photoRadius + 8, 0x000000, 0).setStrokeStyle(2, 0xffffff, 0.25);

    // Gentle float
    this.tweens.add({
      targets: [headshot, glowRing, glowRing2, maskGfx],
      y: '-=4',
      duration: 2500, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // ============================================================
    //  LAYER 5 — TITLE (big, bold, animated)
    // ============================================================

    // Badge
    var badge = this.add.text(cx, H * 0.03, '\u2B50 FREE TO PLAY \u2B50', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '14px',
      color: '#1a0a2e',
      backgroundColor: '#ffd700',
      padding: { x: 16, y: 5 }
    }).setOrigin(0.5);
    this.tweens.add({
      targets: badge,
      scaleX: { from: 1, to: 1.06 }, scaleY: { from: 1, to: 1.06 },
      duration: 900, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // "GROOVY"
    var groovyText = this.add.text(cx, H * 0.12, 'GROOVY', {
      fontFamily: GBR.FONTS.display,
      fontSize: '74px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#e84393', blur: 8, fill: true },
      padding: { left: 12, right: 12, top: 4, bottom: 4 }
    }).setOrigin(0.5);

    // "BAND RUSH"
    var rushText = this.add.text(cx, H * 0.21, 'BAND RUSH', {
      fontFamily: GBR.FONTS.display,
      fontSize: '58px',
      color: '#ffffff',
      stroke: '#e8751a',
      strokeThickness: 5,
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 6, fill: false },
      padding: { left: 10, right: 10, top: 4, bottom: 4 }
    }).setOrigin(0.5);

    // Pop-in animations
    groovyText.setScale(0);
    rushText.setScale(0);
    this.tweens.add({ targets: groovyText, scaleX: 1, scaleY: 1, duration: 600, ease: 'Back.easeOut', delay: 200 });
    this.tweens.add({ targets: rushText, scaleX: 1, scaleY: 1, duration: 600, ease: 'Back.easeOut', delay: 400 });

    // Title tilt
    this.tweens.add({
      targets: groovyText,
      angle: { from: -1.5, to: 1.5 },
      duration: 2000, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut', delay: 1000
    });

    // Subtitle
    var subtitle = this.add.text(cx, H * 0.28, '\u2728 Soul in Full Color \u2728', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '18px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    subtitle.setScale(0);
    this.tweens.add({ targets: subtitle, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut', delay: 600 });

    // ============================================================
    //  LAYER 6 — Description text
    // ============================================================
    this.add.text(cx, H * 0.52, 'Help L.A. Young find her band\nfor the BIG SHOW tonight!', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 6,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // ============================================================
    //  LAYER 7 — MEGA PLAY BUTTON
    // ============================================================
    var btnY = H * 0.62;

    // Glow behind button
    var btnGlow = this.add.graphics();
    btnGlow.fillStyle(0xffd700, 0.18);
    btnGlow.fillRoundedRect(cx - 150, btnY - 40, 300, 80, 40);
    this.tweens.add({
      targets: btnGlow,
      alpha: { from: 1, to: 0.25 },
      duration: 800, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Button
    var playBtn = this.add.image(cx, btnY, 'btn_orange').setScale(1.25);
    var playText = this.add.text(cx, btnY, '\u25B6  PLAY NOW!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '34px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: false }
    }).setOrigin(0.5);

    playBtn.setInteractive({ useHandCursor: true });

    // Bounce-in entrance
    playBtn.setScale(0);
    playText.setScale(0);
    this.tweens.add({ targets: playBtn, scaleX: 1.25, scaleY: 1.25, duration: 500, ease: 'Back.easeOut', delay: 800 });
    this.tweens.add({ targets: playText, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.easeOut', delay: 800 });

    // Continuous pulse
    this.tweens.add({
      targets: [playBtn, playText, btnGlow],
      y: '-=5',
      duration: 1000, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut', delay: 1300
    });

    playBtn.on('pointerover', function () {
      self.tweens.add({ targets: playBtn, scaleX: 1.4, scaleY: 1.4, duration: 120 });
      self.tweens.add({ targets: playText, scaleX: 1.08, scaleY: 1.08, duration: 120 });
    });
    playBtn.on('pointerout', function () {
      self.tweens.add({ targets: playBtn, scaleX: 1.25, scaleY: 1.25, duration: 120 });
      self.tweens.add({ targets: playText, scaleX: 1, scaleY: 1, duration: 120 });
    });
    playBtn.on('pointerdown', function () {
      AudioSynth.resume();
      TransitionHelper.fadeToScene(self, 'StoryScene', { actNumber: 0, nextScene: 'Act1RunnerScene' });
    });

    // ============================================================
    //  LAYER 8 — Sparkle particle emitter (title area)
    // ============================================================
    if (this.add.particles) {
      try {
        var emitter = this.add.particles(cx, H * 0.17, 'star', {
          speed: { min: 15, max: 60 },
          angle: { min: 0, max: 360 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 0.7, end: 0 },
          lifespan: 2000,
          frequency: 250,
          tint: [0xffd700, 0xe84393, 0x00e5ff, 0xffffff],
          blendMode: 'ADD',
          emitZone: {
            type: 'random',
            source: new Phaser.Geom.Rectangle(-140, -30, 280, 60)
          }
        });
        emitter.setDepth(0);
      } catch (e) { /* fail silently */ }
    }

    // ============================================================
    //  LAYER 9 — Footer
    // ============================================================
    this.add.text(cx, H * 0.97, 'L.A. Young | Gold Bottom Entertainment LLC', {
      fontFamily: GBR.FONTS.body,
      fontSize: '10px',
      color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0.35);

    // ============================================================
    //  CAMERA — Fade in
    // ============================================================
    this.cameras.main.fadeIn(600, 0, 0, 0);
  }
});
