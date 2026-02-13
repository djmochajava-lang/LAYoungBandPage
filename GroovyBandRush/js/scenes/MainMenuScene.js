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
    // Futuristic gradient sky
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x16213e, 0x0f3460);
    bg.fillRect(0, 0, width, height);

    // Animated floating stars
    for (var i = 0; i < 40; i++) {
      var star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height * 0.6),
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

    // Futuristic skyline silhouette
    var skyline = this.add.graphics();
    skyline.fillStyle(0x0a0a0a, 0.8);
    var buildings = [
      { x: 0, w: 35, h: 80 }, { x: 30, w: 25, h: 120 }, { x: 50, w: 30, h: 70 },
      { x: 75, w: 20, h: 140 }, { x: 90, w: 35, h: 90 }, { x: 120, w: 25, h: 130 },
      { x: 140, w: 35, h: 85 }, { x: 170, w: 25, h: 150 }, { x: 190, w: 30, h: 100 },
      { x: 215, w: 25, h: 110 }, { x: 235, w: 30, h: 75 }, { x: 260, w: 25, h: 135 },
      { x: 280, w: 35, h: 95 }, { x: 310, w: 25, h: 125 }, { x: 330, w: 30, h: 80 },
      { x: 355, w: 25, h: 145 }, { x: 375, w: 30, h: 90 }, { x: 400, w: 25, h: 115 },
      { x: 420, w: 35, h: 70 }
    ];
    var skylineY = height * 0.55;
    for (var b = 0; b < buildings.length; b++) {
      var bld = buildings[b];
      skyline.fillRect(bld.x, skylineY - bld.h, bld.w - 3, bld.h + height);
      // Windows
      skyline.fillStyle(0xffd700, 0.12);
      for (var wy = skylineY - bld.h + 10; wy < skylineY; wy += 12) {
        for (var wx = bld.x + 5; wx < bld.x + bld.w - 8; wx += 10) {
          if (Math.random() > 0.4) {
            skyline.fillRect(wx, wy, 5, 6);
          }
        }
      }
      skyline.fillStyle(0x0a0a0a, 0.8);
    }

    // Ground glow
    var groundGlow = this.add.graphics();
    groundGlow.fillStyle(0xe8751a, 0.08);
    groundGlow.fillRect(0, skylineY, width, height - skylineY);

    // --- Title ---
    var badge = this.add.text(width / 2, height * 0.12, 'NEW! FREE TO PLAY', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#e8751a',
      padding: { x: 16, y: 6 }
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

    var title1 = this.add.text(width / 2, height * 0.24, 'GROOVY', {
      fontFamily: GBR.FONTS.display,
      fontSize: '72px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    var title2 = this.add.text(width / 2, height * 0.35, 'BAND RUSH', {
      fontFamily: GBR.FONTS.display,
      fontSize: '64px',
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

    var subtitle = this.add.text(width / 2, height * 0.43, 'Soul in Full Color', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '24px',
      color: '#e8751a'
    }).setOrigin(0.5);

    // --- Van icon ---
    var van = this.add.image(width / 2, height * 0.55, 'van').setScale(2.5);
    this.tweens.add({
      targets: van,
      y: { from: van.y - 5, to: van.y + 5 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // --- Description ---
    this.add.text(width / 2, height * 0.66, 'Help L.A. Young find her band\nfor the big gig!', {
      fontFamily: GBR.FONTS.body,
      fontSize: '18px',
      color: '#cccccc',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5);

    // --- Play button ---
    var playBtn = this.add.image(width / 2, height * 0.80, 'btn_orange').setScale(1.2);
    var playText = this.add.text(width / 2, height * 0.80, 'PLAY NOW', {
      fontFamily: GBR.FONTS.display,
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    playBtn.setInteractive({ useHandCursor: true });

    // Bounce animation
    this.tweens.add({
      targets: [playBtn, playText],
      y: '-=5',
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    playBtn.on('pointerover', function () {
      self.tweens.add({ targets: playBtn, scaleX: 1.3, scaleY: 1.3, duration: 150 });
    });
    playBtn.on('pointerout', function () {
      self.tweens.add({ targets: playBtn, scaleX: 1.2, scaleY: 1.2, duration: 150 });
    });
    playBtn.on('pointerdown', function () {
      AudioSynth.resume();
      TransitionHelper.fadeToScene(self, 'StoryScene', { actNumber: 0, nextScene: 'Act1RunnerScene' });
    });

    // --- Footer ---
    this.add.text(width / 2, height * 0.94, 'L.A. Young | Gold Bottom Entertainment LLC', {
      fontFamily: GBR.FONTS.body,
      fontSize: '12px',
      color: '#666666'
    }).setOrigin(0.5);

    // Fade in
    this.cameras.main.fadeIn(800, 0, 0, 0);
  }
});
