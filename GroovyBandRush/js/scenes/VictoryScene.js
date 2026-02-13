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

    // Band members display
    this.add.text(width / 2, height * 0.40, 'THE BAND', {
      fontFamily: GBR.FONTS.display,
      fontSize: '24px',
      color: '#ffd700'
    }).setOrigin(0.5);

    // Show all 5 band members with their info
    var memberStartX = width / 2 - 160;
    for (var i = 0; i < 5; i++) {
      var member = GBR.BAND[i];
      var memberX = memberStartX + i * 80;
      var memberY = height * 0.52;

      // Member portrait with outfit tint
      var portrait = this.add.image(memberX, memberY, 'member_' + i).setScale(1.5);
      var outfitIndex = GBR.state.bandMembers[i].outfit;
      if (outfitIndex >= 0 && GBR.OUTFITS[outfitIndex]) {
        portrait.setTint(GBR.OUTFITS[outfitIndex].color);
      }

      // Entrance animation - staggered
      portrait.setAlpha(0);
      portrait.y += 30;
      this.tweens.add({
        targets: portrait,
        alpha: 1,
        y: memberY,
        duration: 500,
        delay: 500 + i * 300,
        ease: 'Back.easeOut'
      });

      // Bounce animation after entrance
      this.tweens.add({
        targets: portrait,
        y: memberY - 5,
        duration: 800 + i * 100,
        yoyo: true,
        repeat: -1,
        delay: 2500,
        ease: 'Sine.easeInOut'
      });

      // Name
      var nameText = this.add.text(memberX, memberY + 55, member.name.split(' ')[0], {
        fontFamily: GBR.FONTS.fun,
        fontSize: '11px',
        color: member.colorHex
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: nameText,
        alpha: 1,
        delay: 800 + i * 300,
        duration: 300
      });

      // Role
      var roleText = this.add.text(memberX, memberY + 68, member.role, {
        fontFamily: GBR.FONTS.body,
        fontSize: '9px',
        color: '#999999'
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: roleText,
        alpha: 1,
        delay: 900 + i * 300,
        duration: 300
      });
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

    // Buttons (appear after delay)
    this.time.delayedCall(3000, function () {
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
    });

    // Play celebration sound
    this.time.delayedCall(200, function () {
      AudioSynth.playSuccess();
    });

    // Fade in
    TransitionHelper.fadeIn(this, 800);
  }
});
