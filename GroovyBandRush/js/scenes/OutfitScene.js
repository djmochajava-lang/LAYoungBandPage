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
    this.selectedOutfit = 0; // Default to first outfit
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
    this.add.text(width / 2, height * 0.12, member.name, {
      fontFamily: GBR.FONTS.display,
      fontSize: '36px',
      color: member.colorHex,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.18, member.role, {
      fontFamily: GBR.FONTS.fun,
      fontSize: '18px',
      color: '#e8751a'
    }).setOrigin(0.5);

    // Large character portrait
    var portrait = this.add.image(width / 2, height * 0.34, 'member_' + this.memberIndex)
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
    this.add.text(width / 2, height * 0.51, 'PICK A LOOK FOR THE GIG!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Outfit cards - positioned higher to leave room for button
    var outfitCards = [];
    var outfitBorders = [];
    var cardSpacing = Math.min(140, (width - 60) / 3);
    var cardStartX = width / 2 - cardSpacing;
    var cardY = height * 0.65;

    // Pre-select first outfit border
    for (var i = 0; i < 3; i++) {
      (function (index) {
        var cardX = cardStartX + index * cardSpacing - 60;
        var outfit = GBR.OUTFITS[index];

        // Card background
        var card = self.add.image(cardX + 60, cardY, 'outfit_' + index).setScale(1);

        // Outfit label
        self.add.text(cardX + 60, cardY + 90, outfit.name, {
          fontFamily: GBR.FONTS.fun,
          fontSize: '13px',
          color: '#ffffff'
        }).setOrigin(0.5);

        // Selection border (first one visible by default)
        var border = self.add.graphics();
        border.lineStyle(4, 0xffd700, 1);
        border.strokeRoundedRect(cardX, cardY - 80, 120, 160, 12);
        border.setAlpha(index === 0 ? 1 : 0);
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
        });

        outfitCards.push(card);
      })(i);
    }

    // Tint portrait to default outfit color
    portrait.setTint(GBR.OUTFITS[0].color);

    // =============================================
    // CONTINUE button - ALWAYS created in create()
    // No conditional, no setTimeout, no guard
    // =============================================
    var btn = createButton(this, width / 2, height * 0.88, 'CONTINUE', function () {
      GBR.state.bandMembers[self.memberIndex].outfit = self.selectedOutfit;
      TransitionHelper.fadeToScene(self, self.nextScene, self.nextData);
    }, {
      bgColor: 0x2ecc71,
      width: 220,
      height: 55,
      fontSize: '26px'
    });

    // Ensure button renders above everything
    btn.bg.setDepth(20);
    btn.text.setDepth(21);
    btn.hitZone.setDepth(21);

    // Fade in
    TransitionHelper.fadeIn(this, 600);
  }
});
