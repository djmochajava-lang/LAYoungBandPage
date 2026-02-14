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
      { idx: 1, x: width * 0.22, y: stageY - 62, scale: 0.18 },  // Kevin W. back-left
      { idx: 3, x: width * 0.78, y: stageY - 62, scale: 0.18 },  // Jimmy back-right
      { idx: 0, x: width * 0.32, y: stageY - 50, scale: 0.20 },  // Eugene mid-left
      { idx: 2, x: width * 0.68, y: stageY - 50, scale: 0.20 },  // Kevin R. mid-right
      { idx: 4, x: width * 0.50, y: stageY - 42, scale: 0.23 }   // L.A. Young front-center
    ];

    for (var s = 0; s < stagePositions.length; s++) {
      (function (pos, order) {
        var member = GBR.BAND[pos.idx];
        var portrait = self.add.image(pos.x, pos.y, 'member_' + pos.idx).setScale(pos.scale);

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
        var nameText = self.add.text(pos.x, pos.y + 30 + pos.scale * 100, member.name.split(' ')[0], {
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
