/* GroovyBandRush/js/scenes/StoryScene.js */

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
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;
    var story = GBR.STORIES[this.actNumber];

    // Resume audio on interaction
    AudioSynth.resume();

    // Background gradient
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f3460, 0x16213e);
    bg.fillRect(0, 0, width, height);

    // Decorative particles floating
    for (var i = 0; i < 20; i++) {
      var p = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 3),
        0xffd700,
        Phaser.Math.FloatBetween(0.05, 0.2)
      );
      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(30, 80),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 5000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000)
      });
    }

    // Act badge
    var actLabel = this.actNumber === 0 ? 'PROLOGUE' : 'ACT ' + this.actNumber;
    this.add.text(width / 2, height * 0.08, actLabel, {
      fontFamily: GBR.FONTS.fun,
      fontSize: '16px',
      color: '#e8751a',
      backgroundColor: 'rgba(232,117,26,0.15)',
      padding: { x: 20, y: 6 }
    }).setOrigin(0.5);

    // Title
    this.add.text(width / 2, height * 0.18, story.title, {
      fontFamily: GBR.FONTS.display,
      fontSize: '42px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Speaker portrait (band member or L.A. Young)
    var portraitIndex = 4; // L.A. Young default
    var portrait = this.add.image(width / 2, height * 0.38, 'member_' + portraitIndex).setScale(2.5);

    // Bounce portrait
    this.tweens.add({
      targets: portrait,
      y: portrait.y - 6,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Speaker name
    this.add.text(width / 2, height * 0.52, story.speaker, {
      fontFamily: GBR.FONTS.fun,
      fontSize: '20px',
      color: '#e8751a'
    }).setOrigin(0.5).setDepth(10);

    // Dialogue box background
    var dialogBg = this.add.graphics();
    dialogBg.fillStyle(0x000000, 0.5);
    dialogBg.fillRoundedRect(width * 0.1, height * 0.55, width * 0.8, height * 0.22, 16);
    dialogBg.lineStyle(2, 0xffd700, 0.3);
    dialogBg.strokeRoundedRect(width * 0.1, height * 0.55, width * 0.8, height * 0.22, 16);

    // Typewriter text effect
    var dialogText = this.add.text(width * 0.15, height * 0.58, '', {
      fontFamily: GBR.FONTS.body,
      fontSize: '16px',
      color: '#ffffff',
      wordWrap: { width: width * 0.7 },
      lineSpacing: 6
    });

    var fullText = story.text;
    var charIndex = 0;
    var typeTimer = this.time.addEvent({
      delay: 30,
      callback: function () {
        charIndex++;
        dialogText.setText(fullText.substring(0, charIndex));
        if (charIndex >= fullText.length) {
          typeTimer.destroy();
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
      }
    });

    // GO! button (appears after short delay)
    // Use setTimeout instead of this.time.delayedCall to avoid throttling in background tabs
    setTimeout(function () {
      var goBtn = createButton(self, width / 2, height * 0.88, "LET'S GO!", function () {
        GBR.state.currentAct = self.actNumber + 1;
        TransitionHelper.fadeToScene(self, self.nextScene);
      }, {
        bgColor: 0xe63946,
        fontSize: '32px'
      });

      // Pulse the button
      self.tweens.add({
        targets: goBtn.text,
        scaleX: { from: 1, to: 1.05 },
        scaleY: { from: 1, to: 1.05 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }, 1500);

    // Band progress indicator at bottom
    var progressX = width / 2 - 80;
    for (var m = 0; m < 5; m++) {
      var member = GBR.BAND[m];
      var found = GBR.state.bandMembers[m].found;
      var icon = this.add.image(progressX + m * 40, height * 0.97, 'member_' + m)
        .setScale(0.5)
        .setAlpha(found ? 1 : 0.2);
    }

    // Fade in
    TransitionHelper.fadeIn(this, 600);
  }
});
