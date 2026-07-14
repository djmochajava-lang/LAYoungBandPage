/* GroovyBandRush/js/scenes/MainMenuScene.js */

var MainMenuScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function MainMenuScene() {
    Phaser.Scene.call(this, { key: 'MainMenuScene' });
  },

  create: function () {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;

    // Reset game state when returning to menu
    GBR.resetState();

    // --- Background ---
    // Futuristic gradient sky (top dark purple → bottom dark blue)
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x16213e, 0x0f3460);
    bg.fillRect(0, 0, width, height);

    // Animated floating stars (upper 70% of screen)
    for (var i = 0; i < 40; i++) {
      var star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height * 0.7),
        Phaser.Math.Between(1, 3),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.8)
      );
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: 0.1 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }

    // Futuristic skyline silhouette — pushed to bottom so it doesn't cover the headshot
    var skylineY = height * 0.78;
    var skyline = this.add.graphics();
    skyline.fillStyle(0x0a0a0a, 0.6);
    var buildings = [
      { x: 0, w: 35, h: 60 }, { x: 30, w: 25, h: 90 }, { x: 50, w: 30, h: 50 },
      { x: 75, w: 20, h: 105 }, { x: 90, w: 35, h: 65 }, { x: 120, w: 25, h: 95 },
      { x: 140, w: 35, h: 60 }, { x: 170, w: 25, h: 110 }, { x: 190, w: 30, h: 70 },
      { x: 215, w: 25, h: 80 }, { x: 235, w: 30, h: 55 }, { x: 260, w: 25, h: 100 },
      { x: 280, w: 35, h: 70 }, { x: 310, w: 25, h: 90 }, { x: 330, w: 30, h: 55 },
      { x: 355, w: 25, h: 105 }, { x: 375, w: 30, h: 65 }, { x: 400, w: 25, h: 85 },
      { x: 420, w: 35, h: 50 }, { x: 450, w: 25, h: 95 }, { x: 470, w: 30, h: 60 },
      { x: 495, w: 25, h: 80 }, { x: 515, w: 35, h: 70 }, { x: 545, w: 25, h: 100 },
      { x: 565, w: 30, h: 55 }, { x: 590, w: 25, h: 90 }, { x: 610, w: 35, h: 75 },
      { x: 640, w: 25, h: 105 }, { x: 660, w: 30, h: 60 }, { x: 685, w: 25, h: 85 },
      { x: 710, w: 35, h: 50 }, { x: 740, w: 25, h: 95 }, { x: 760, w: 30, h: 70 },
      { x: 785, w: 25, h: 80 }, { x: 810, w: 35, h: 60 }, { x: 840, w: 25, h: 100 },
      { x: 860, w: 30, h: 55 }, { x: 885, w: 25, h: 90 }
    ];
    for (var b = 0; b < buildings.length; b++) {
      var bld = buildings[b];
      if (bld.x > width) break; // skip buildings off-screen
      skyline.fillRect(bld.x, skylineY - bld.h, bld.w - 3, bld.h + height);
      // Lit windows
      skyline.fillStyle(0xffd700, 0.15);
      for (var wy = skylineY - bld.h + 8; wy < skylineY; wy += 12) {
        for (var wx = bld.x + 4; wx < bld.x + bld.w - 8; wx += 10) {
          if (Math.random() > 0.4) {
            skyline.fillRect(wx, wy, 5, 6);
          }
        }
      }
      skyline.fillStyle(0x0a0a0a, 0.6);
    }

    // Subtle ground glow below skyline
    var groundGlow = this.add.graphics();
    groundGlow.fillStyle(0xe8751a, 0.06);
    groundGlow.fillRect(0, skylineY, width, height - skylineY);

    // =============================================
    //   LAYOUT:  evenly spaced, no overlaps
    //
    //   0.05  badge  "NEW! FREE TO PLAY"
    //   0.16  GROOVY
    //   0.26  BAND RUSH
    //   0.34  Soul in Full Color
    //   0.48  headshot (r=80, spans 0.38–0.58)
    //   0.62  description text
    //   0.74  PLAY NOW button
    //   0.94  footer credit
    // =============================================

    // --- Badge ---
    var badge = this.add.text(width / 2, height * 0.05, 'NEW! FREE TO PLAY', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#e8751a',
      padding: { x: 14, y: 5 }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: badge,
      scaleX: { from: 1, to: 1.05 },
      scaleY: { from: 1, to: 1.05 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // --- Title ---
    var title1 = this.add.text(width / 2, height * 0.15, 'GROOVY', {
      fontFamily: GBR.FONTS.display,
      fontSize: '64px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    var title2 = this.add.text(width / 2, height * 0.24, 'BAND RUSH', {
      fontFamily: GBR.FONTS.display,
      fontSize: '56px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Shimmer effect on title
    this.tweens.add({
      targets: [title1, title2],
      alpha: { from: 1, to: 0.8 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // --- Subtitle ---
    var subtitle = this.add.text(width / 2, height * 0.32, 'Soul in Full Color', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '22px',
      color: '#e8751a'
    }).setOrigin(0.5);

    // --- L.A. Young headshot (circular crop) ---
    var photoY = height * 0.46;
    var photoRadius = 70;
    var headshot = this.add.image(0, 0, 'la_headshot');
    // Scale proportionally so image fills the circle without distortion
    var texW = headshot.width;
    var texH = headshot.height;
    var circleDiameter = photoRadius * 2;
    var imgScale = circleDiameter / Math.min(texW, texH);
    headshot.setDisplaySize(Math.round(texW * imgScale), Math.round(texH * imgScale));
    // Gold ring around photo
    var ring = this.add.circle(0, 0, photoRadius + 3, 0x000000, 0).setStrokeStyle(3, 0xffd700);
    // Dark background circle behind photo to block skyline bleed-through
    var photoBg = this.add.circle(0, 0, photoRadius, 0x0f1128, 1);
    // Group in container so mask + ring float together
    var photoContainer = this.add.container(width / 2, photoY, [photoBg, headshot, ring]);
    // Circular mask (centered on container position)
    var maskGfx = this.make.graphics({ x: 0, y: 0, add: false });
    maskGfx.fillCircle(width / 2, photoY, photoRadius);
    headshot.setMask(maskGfx.createGeometryMask());
    // Gentle float
    this.tweens.add({
      targets: [photoContainer, maskGfx],
      y: '-=4',
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // --- Description ---
    this.add.text(width / 2, height * 0.60, 'Help L.A. Young find her band\nfor the big gig!', {
      fontFamily: GBR.FONTS.body,
      fontSize: '17px',
      color: '#cccccc',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5);

    // --- Play button ---
    var btnY = height * 0.73;
    var playBtn = this.add.image(width / 2, btnY, 'btn_orange').setScale(1.1);
    var playText = this.add.text(width / 2, btnY, 'PLAY NOW', {
      fontFamily: GBR.FONTS.display,
      fontSize: '30px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    playBtn.setInteractive({ useHandCursor: true });

    // Gentle bounce
    this.tweens.add({
      targets: [playBtn, playText],
      y: '-=4',
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    playBtn.on('pointerover', function () {
      self.tweens.add({ targets: playBtn, scaleX: 1.2, scaleY: 1.2, duration: 150 });
    });
    playBtn.on('pointerout', function () {
      self.tweens.add({ targets: playBtn, scaleX: 1.1, scaleY: 1.1, duration: 150 });
    });
    playBtn.on('pointerdown', function () {
      AudioSynth.resume();
      TransitionHelper.fadeToScene(self, 'StoryScene', { actNumber: 0, nextScene: 'Act1RunnerScene' });
    });

    // --- Footer ---
    this.add.text(width / 2, height * 0.94, 'L.A. Young | Gold Bottom Ent. LLC', {
      fontFamily: GBR.FONTS.body,
      fontSize: '11px',
      color: '#555555'
    }).setOrigin(0.5);

    // Fade in
    this.cameras.main.fadeIn(800, 0, 0, 0);
  }
});
