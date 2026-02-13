/* GroovyBandRush/js/scenes/HUDScene.js */

var HUDScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function HUDScene() {
    Phaser.Scene.call(this, { key: 'HUDScene' });
  },

  create: function () {
    var width = this.cameras.main.width;

    // Dollar display (top-left)
    this.dollarIcon = this.add.text(16, 12, '$', {
      fontFamily: GBR.FONTS.display,
      fontSize: '28px',
      color: '#32cd32'
    });

    this.dollarText = this.add.text(40, 14, '0', {
      fontFamily: GBR.FONTS.display,
      fontSize: '24px',
      color: '#ffffff'
    });

    // Act progress stars (top-center)
    this.stars = [];
    var starStartX = width / 2 - 60;
    for (var i = 0; i < 5; i++) {
      var star = this.add.text(starStartX + i * 30, 12, '\u2606', {
        fontFamily: GBR.FONTS.display,
        fontSize: '24px',
        color: '#444444'
      });
      this.stars.push(star);
    }

    // Band member icons (top-right)
    this.memberIcons = [];
    var memberStartX = width - 170;
    for (var m = 0; m < 5; m++) {
      var icon = this.add.image(memberStartX + m * 32, 22, 'member_' + m)
        .setScale(0.4)
        .setAlpha(0.2);
      this.memberIcons.push(icon);
    }

    // Lives display (not always visible - only in acts that have lives)
    this.hearts = [];
    this.heartsVisible = false;

    // Remove any old listeners before adding new ones (prevents accumulation)
    this.removeListeners();

    // Listen for events from game scenes
    this.setupListeners();

    // Clean up listeners when this scene shuts down
    var self = this;
    this.events.once('shutdown', function () {
      self.removeListeners();
    });
    this.events.once('destroy', function () {
      self.removeListeners();
    });
  },

  removeListeners: function () {
    var eventEmitter = this.game.events;
    eventEmitter.off('hud:dollars');
    eventEmitter.off('hud:actComplete');
    eventEmitter.off('hud:memberFound');
    eventEmitter.off('hud:showLives');
    eventEmitter.off('hud:updateLives');
    eventEmitter.off('hud:hideLives');
    eventEmitter.off('hud:refresh');
  },

  setupListeners: function () {
    var self = this;
    var eventEmitter = this.game.events;

    // Update dollars
    eventEmitter.on('hud:dollars', function (amount) {
      GBR.state.totalDollars = amount;
      if (self.dollarText && self.dollarText.scene) {
        self.dollarText.setText(amount.toString());
        self.tweens.add({
          targets: self.dollarText,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 100,
          yoyo: true
        });
      }
    });

    // Update act completion
    eventEmitter.on('hud:actComplete', function (actIndex) {
      if (self.stars[actIndex] && self.stars[actIndex].scene) {
        self.stars[actIndex].setText('\u2605');
        self.stars[actIndex].setColor('#ffd700');
        self.tweens.add({
          targets: self.stars[actIndex],
          scaleX: 1.5,
          scaleY: 1.5,
          duration: 200,
          yoyo: true
        });
      }
    });

    // Update band member found
    eventEmitter.on('hud:memberFound', function (memberIndex) {
      GBR.state.bandMembers[memberIndex].found = true;
      if (self.memberIcons[memberIndex] && self.memberIcons[memberIndex].scene) {
        self.memberIcons[memberIndex].setAlpha(1);
        self.tweens.add({
          targets: self.memberIcons[memberIndex],
          scaleX: 0.7,
          scaleY: 0.7,
          duration: 200,
          yoyo: true
        });
      }
    });

    // Show/hide lives
    eventEmitter.on('hud:showLives', function (count) {
      self.showLives(count);
    });

    eventEmitter.on('hud:updateLives', function (count) {
      self.updateLives(count);
    });

    eventEmitter.on('hud:hideLives', function () {
      self.hideLives();
    });

    // Refresh display
    eventEmitter.on('hud:refresh', function () {
      self.refresh();
    });
  },

  showLives: function (count) {
    this.hideLives();
    var width = this.cameras.main.width;
    this.heartsVisible = true;

    for (var i = 0; i < count; i++) {
      var heart = this.add.image(width / 2 - ((count - 1) * 18) + i * 36, 50, 'heart')
        .setScale(0.8);
      this.hearts.push(heart);
    }
  },

  updateLives: function (count) {
    for (var i = 0; i < this.hearts.length; i++) {
      if (i < count) {
        this.hearts[i].setTexture('heart');
      } else {
        this.hearts[i].setTexture('heart_empty');
        // Shake lost heart
        if (this.hearts[i].texture.key === 'heart_empty') {
          this.tweens.add({
            targets: this.hearts[i],
            x: this.hearts[i].x + 5,
            duration: 50,
            yoyo: true,
            repeat: 3
          });
        }
      }
    }
  },

  hideLives: function () {
    for (var i = 0; i < this.hearts.length; i++) {
      this.hearts[i].destroy();
    }
    this.hearts = [];
    this.heartsVisible = false;
  },

  refresh: function () {
    // Sync display with current game state
    this.dollarText.setText(GBR.state.totalDollars.toString());

    for (var i = 0; i < 5; i++) {
      if (GBR.state.actScores[i] > 0) {
        this.stars[i].setText('\u2605');
        this.stars[i].setColor('#ffd700');
      }
    }

    for (var m = 0; m < 5; m++) {
      this.memberIcons[m].setAlpha(GBR.state.bandMembers[m].found ? 1 : 0.2);
    }
  }
});
