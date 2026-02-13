/* GroovyBandRush/js/scenes/OutfitScene.js */

var OutfitScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function OutfitScene() {
    Phaser.Scene.call(this, { key: 'OutfitScene' });
  },

  init: function (data) {
    this.memberIndex = data.memberIndex !== undefined ? data.memberIndex : 0;
    this.nextScene = data.nextScene || 'MainMenuScene';
    this.nextData = data.nextData || {};
    this.selectedOutfit = -1;
  },

  create: function () {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;
    var member = GBR.BAND[this.memberIndex];

    // Background
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x16213e, 0x0f3460, 0x1a1a2e);
    bg.fillRect(0, 0, width, height);

    // Spotlight effect
    var spotlight = this.add.graphics();
    spotlight.fillStyle(0xffd700, 0.05);
    spotlight.fillTriangle(width / 2, 0, width / 2 - 200, height, width / 2 + 200, height);

    // Title
    this.add.text(width / 2, height * 0.06, 'BAND MEMBER FOUND!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '24px',
      color: '#ffd700'
    }).setOrigin(0.5);

    // Member name and role
    this.add.text(width / 2, height * 0.14, member.name, {
      fontFamily: GBR.FONTS.display,
      fontSize: '36px',
      color: member.colorHex,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.20, member.role, {
      fontFamily: GBR.FONTS.fun,
      fontSize: '18px',
      color: '#e8751a'
    }).setOrigin(0.5);

    // Large character portrait
    var portrait = this.add.image(width / 2, height * 0.38, 'member_' + this.memberIndex)
      .setScale(3);

    // Entrance animation
    portrait.setAlpha(0);
    portrait.setScale(0.5);
    this.tweens.add({
      targets: portrait,
      alpha: 1,
      scaleX: 3,
      scaleY: 3,
      duration: 600,
      ease: 'Back.easeOut'
    });

    // Celebration particles
    var emitter = this.add.particles(width / 2, height * 0.3, 'star', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 1500,
      frequency: 200,
      tint: [0xffd700, member.color, 0xffffff]
    });

    // Stop particles after 2 seconds
    this.time.delayedCall(2000, function () {
      emitter.stop();
    });

    // Dress them up label
    this.add.text(width / 2, height * 0.56, 'DRESS ' + member.name.toUpperCase() + ' FOR THE GIG!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '22px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Outfit cards
    var outfitCards = [];
    var outfitBorders = [];
    var cardSpacing = Math.min(140, (width - 60) / 3);
    var cardStartX = width / 2 - cardSpacing;
    var cardY = height * 0.72;

    for (var i = 0; i < 3; i++) {
      (function (index) {
        var cardX = cardStartX + index * cardSpacing - 60;
        var outfit = GBR.OUTFITS[index];

        // Card background
        var card = self.add.image(cardX + 60, cardY, 'outfit_' + index).setScale(1);

        // Outfit label
        var label = self.add.text(cardX + 60, cardY + 95, outfit.name, {
          fontFamily: GBR.FONTS.fun,
          fontSize: '14px',
          color: '#ffffff'
        }).setOrigin(0.5);

        // Selection border (hidden initially)
        var border = self.add.graphics();
        border.lineStyle(4, 0xffd700, 1);
        border.strokeRoundedRect(cardX, cardY - 80, 120, 160, 12);
        border.setAlpha(0);
        outfitBorders.push(border);

        // Make interactive
        card.setInteractive({ useHandCursor: true });

        card.on('pointerover', function () {
          self.tweens.add({ targets: card, scaleX: 1.08, scaleY: 1.08, duration: 100 });
        });

        card.on('pointerout', function () {
          if (self.selectedOutfit !== index) {
            self.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 100 });
          }
        });

        card.on('pointerdown', function () {
          AudioSynth.resume();
          AudioSynth.playCollect();

          // Deselect all
          for (var b = 0; b < outfitBorders.length; b++) {
            outfitBorders[b].setAlpha(0);
          }

          // Select this one
          self.selectedOutfit = index;
          border.setAlpha(1);
          self.tweens.add({ targets: card, scaleX: 1.1, scaleY: 1.1, duration: 150 });

          // Update portrait tint to match outfit color
          portrait.setTint(outfit.color);

          // Show continue button if not already shown
          if (!self.continueShown) {
            self.showContinue();
          }
        });

        outfitCards.push(card);
      })(i);
    }

    // Fade in
    TransitionHelper.fadeIn(this, 600);
  },

  showContinue: function () {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;
    this.continueShown = true;

    // "LOOKING GOOD!" text
    var lookingGood = this.add.text(width / 2, height * 0.88, 'LOOKING GOOD!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '20px',
      color: '#ffd700'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: lookingGood,
      alpha: 1,
      duration: 300
    });

    // Continue button
    this.time.delayedCall(500, function () {
      createButton(self, width / 2, height * 0.95, 'CONTINUE', function () {
        // Save outfit choice
        GBR.state.bandMembers[self.memberIndex].outfit = self.selectedOutfit;
        TransitionHelper.fadeToScene(self, self.nextScene, self.nextData);
      }, {
        bgColor: 0x2ecc71,
        width: 200,
        height: 50,
        fontSize: '24px'
      });
    });
  }
});
