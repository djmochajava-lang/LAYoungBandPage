/* GroovyBandRush/js/scenes/VictoryScene.js */

var VictoryScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function VictoryScene() {
    Phaser.Scene.call(this, { key: 'VictoryScene' });
  },

  create: function () {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;

    AudioSynth.resume();

    // Stop HUD
    if (this.scene.isActive('HUDScene')) {
      this.scene.stop('HUDScene');
    }

    // Background gradient - celebratory
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2e, 0x0f3460, 0x6c3483, 0x1a1a2e);
    bg.fillRect(0, 0, width, height);

    // Continuous confetti particles
    var confettiColors = [0xffd700, 0xe63946, 0xe8751a, 0xe84393, 0x2ecc71, 0x3498db, 0x9b59b6];

    this.add.particles(width / 2, -20, 'particle', {
      x: { min: -width / 2, max: width / 2 },
      speed: { min: 50, max: 200 },
      angle: { min: 60, max: 120 },
      scale: { start: 1.5, end: 0.3 },
      lifespan: 4000,
      frequency: 80,
      tint: confettiColors,
      rotate: { min: 0, max: 360 }
    });

    // Star particles from sides
    this.add.particles(0, height / 2, 'star', {
      x: { min: 0, max: width },
      y: { min: -height / 2, max: height / 2 },
      speed: { min: 20, max: 80 },
      angle: { min: 250, max: 290 },
      scale: { start: 1, end: 0 },
      lifespan: 3000,
      frequency: 300,
      tint: [0xffd700, 0xffffff]
    });

    // Title
    var youDidIt = this.add.text(width / 2, height * 0.08, 'YOU DID IT!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '56px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Pulsing title
    this.tweens.add({
      targets: youDidIt,
      scaleX: { from: 1, to: 1.08 },
      scaleY: { from: 1, to: 1.08 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(width / 2, height * 0.17, 'The band is together and the show was AMAZING!', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '16px',
      color: '#e8751a'
    }).setOrigin(0.5);

    // Total dollars earned
    var totalDollars = GBR.state.totalDollars;
    this.add.text(width / 2, height * 0.25, 'TOTAL EARNED', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '14px',
      color: '#cccccc'
    }).setOrigin(0.5);

    var dollarDisplay = this.add.text(width / 2, height * 0.31, '$ ' + totalDollars, {
      fontFamily: GBR.FONTS.display,
      fontSize: '42px',
      color: '#32cd32',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Dollar count animation
    var displayAmount = { val: 0 };
    this.tweens.add({
      targets: displayAmount,
      val: totalDollars,
      duration: 2000,
      ease: 'Power2',
      onUpdate: function () {
        dollarDisplay.setText('$ ' + Math.floor(displayAmount.val));
      }
    });

    // === STAGE SETUP ===
    // Draw stage platform
    var stageGfx = this.add.graphics();
    var stageY = height * 0.58;
    // Stage floor
    stageGfx.fillStyle(0x2c1810, 1);
    stageGfx.fillRoundedRect(20, stageY, width - 40, 8, 4);
    // Stage front edge highlight
    stageGfx.fillStyle(0xffd700, 0.3);
    stageGfx.fillRect(20, stageY, width - 40, 2);
    // Spotlight cones from above
    var spotGfx = this.add.graphics();
    spotGfx.fillStyle(0xffd700, 0.04);
    spotGfx.fillTriangle(width / 2, 0, width / 2 - 120, stageY, width / 2 + 120, stageY);
    spotGfx.fillStyle(0x3498db, 0.03);
    spotGfx.fillTriangle(width * 0.25, 0, width * 0.25 - 80, stageY, width * 0.25 + 80, stageY);
    spotGfx.fillStyle(0xe63946, 0.03);
    spotGfx.fillTriangle(width * 0.75, 0, width * 0.75 - 80, stageY, width * 0.75 + 80, stageY);

    // --- Audience silhouettes ---
    var audienceGfx = this.add.graphics();
    // Near row (closest to stage)
    var audienceNearY = stageY + 16;
    audienceGfx.fillStyle(0x080808, 0.6);
    for (var an = 0; an < 22; an++) {
      var anx = (an * (width / 21)) + Phaser.Math.Between(-4, 4);
      var anHeadR = Phaser.Math.Between(4, 7);
      audienceGfx.fillCircle(anx, audienceNearY - 7, anHeadR);
      audienceGfx.fillRoundedRect(anx - 8, audienceNearY - 1, 16, 12, 3);
    }
    // Middle row
    var audienceBackY = stageY + 30;
    audienceGfx.fillStyle(0x0a0a0a, 0.7);
    for (var ab = 0; ab < 20; ab++) {
      var abx = (ab * (width / 19)) + Phaser.Math.Between(-5, 5);
      var abHeadR = Phaser.Math.Between(6, 9);
      audienceGfx.fillCircle(abx, audienceBackY - 10, abHeadR);
      audienceGfx.fillRoundedRect(abx - 10, audienceBackY - 2, 20, 16, 3);
    }
    // Front row
    audienceGfx.fillStyle(0x111111, 0.8);
    var audienceFrontY = stageY + 50;
    for (var af = 0; af < 16; af++) {
      var afx = (af * (width / 15)) + Phaser.Math.Between(-8, 8);
      var afHeadR = Phaser.Math.Between(8, 11);
      audienceGfx.fillCircle(afx, audienceFrontY - 14, afHeadR);
      audienceGfx.fillRoundedRect(afx - 13, audienceFrontY - 4, 26, 20, 4);
    }
    // Fill bottom blend
    audienceGfx.fillStyle(0x080808, 0.9);
    audienceGfx.fillRect(0, stageY + 62, width, height - stageY - 62);

    // Phone flashlights
    for (var ph = 0; ph < 5; ph++) {
      var phoneX = Phaser.Math.Between(40, width - 40);
      var phoneY = Phaser.Math.Between(audienceBackY - 5, audienceFrontY + 5);
      var phoneDot = this.add.circle(phoneX, phoneY, 2, 0xffffff, 0);
      this.tweens.add({
        targets: phoneDot,
        alpha: { from: 0, to: 0.7 },
        duration: Phaser.Math.Between(400, 800),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
        hold: Phaser.Math.Between(500, 2000)
      });
    }

    // "ON STAGE" label
    this.add.text(width / 2, height * 0.37, 'ON STAGE', {
      fontFamily: GBR.FONTS.display,
      fontSize: '22px',
      color: '#ffd700'
    }).setOrigin(0.5);

    // Band formation — staggered rows for depth
    // Back row: Kevin Walker (1, bass) left, Jimmy Carney (3, drums) right
    // Mid row: Eugene Chapman (0, sax) left, Kevin Robinson (2, guitar) right
    // Front center: L.A. Young (4, vocals)
    var stagePositions = [
      { idx: 1, x: width * 0.16, y: stageY - 85, dw: 80, dh: 120 },  // Kevin W. back-left
      { idx: 3, x: width * 0.84, y: stageY - 85, dw: 80, dh: 120 },  // Jimmy back-right
      { idx: 0, x: width * 0.28, y: stageY - 80, dw: 86, dh: 130 },  // Eugene mid-left
      { idx: 2, x: width * 0.72, y: stageY - 80, dw: 86, dh: 130 },  // Kevin R. mid-right
      { idx: 4, x: width * 0.50, y: stageY - 100, dw: 100, dh: 150 }   // L.A. Young front-center (star of show)
    ];

    for (var s = 0; s < stagePositions.length; s++) {
      (function (pos, order) {
        var member = GBR.BAND[pos.idx];
        var portrait = self.add.image(pos.x, pos.y, 'member_' + pos.idx).setDisplaySize(pos.dw, pos.dh);

        // Entrance animation - staggered
        portrait.setAlpha(0);
        portrait.y += 25;
        self.tweens.add({
          targets: portrait,
          alpha: 1,
          y: pos.y,
          duration: 500,
          delay: 500 + order * 250,
          ease: 'Back.easeOut'
        });

        // Gentle sway after entrance
        self.tweens.add({
          targets: portrait,
          y: pos.y - 3,
          duration: 900 + order * 80,
          yoyo: true,
          repeat: -1,
          delay: 2200,
          ease: 'Sine.easeInOut'
        });

        // Name below
        var nameText = self.add.text(pos.x, pos.y + pos.dh / 2 + 6, member.name.split(' ')[0], {
          fontFamily: GBR.FONTS.fun,
          fontSize: '10px',
          color: member.colorHex
        }).setOrigin(0.5).setAlpha(0);

        self.tweens.add({
          targets: nameText,
          alpha: 1,
          delay: 700 + order * 250,
          duration: 300
        });
      })(stagePositions[s], s);
    }

    // Act scores breakdown
    var actsY = height * 0.72;
    var actNames = ['Runner', 'Rhythm', 'Match', 'Drums', 'Piano'];
    var scoreStartX = width / 2 - 180;

    for (var a = 0; a < 5; a++) {
      var actScore = GBR.state.actScores[a] || 0;
      var actX = scoreStartX + a * 90;

      // Star icon
      this.add.text(actX, actsY, '\u2605', {
        fontFamily: GBR.FONTS.display,
        fontSize: '20px',
        color: actScore > 0 ? '#ffd700' : '#444444'
      }).setOrigin(0.5);

      // Act name
      this.add.text(actX, actsY + 22, actNames[a], {
        fontFamily: GBR.FONTS.fun,
        fontSize: '11px',
        color: '#cccccc'
      }).setOrigin(0.5);
    }

    // Buttons (appear after delay) - use setTimeout to avoid throttling
    setTimeout(function () {
      // Play Again button
      createButton(self, width / 2, height * 0.86, 'PLAY AGAIN', function () {
        GBR.resetState();
        TransitionHelper.fadeToScene(self, 'MainMenuScene');
      }, {
        bgColor: 0xe63946,
        width: 200,
        height: 50,
        fontSize: '22px'
      });

      // Visit Band Page button
      createButton(self, width / 2, height * 0.94, 'BAND PAGE', function () {
        window.location.href = '../index.html';
      }, {
        bgColor: 0x3498db,
        width: 200,
        height: 50,
        fontSize: '22px'
      });
    }, 3000);

    // Play celebration sound
    setTimeout(function () {
      AudioSynth.playSuccess();
    }, 200);

    // Fade in
    TransitionHelper.fadeIn(this, 800);
  }
});
