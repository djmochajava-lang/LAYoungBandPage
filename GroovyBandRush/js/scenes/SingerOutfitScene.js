/* GroovyBandRush/js/scenes/SingerOutfitScene.js
 * Clothing choice screen for L.A. Young — shown after the Prologue.
 * Player picks one of three real-photo outfits (full body shown in cards).
 * The preview portrait uses la_talking_head (IMG_3118.jpg).
 * The selection is saved to GBR.state.singerDress (0, 1, or 2).
 */

var SingerOutfitScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function SingerOutfitScene() {
    Phaser.Scene.call(this, { key: 'SingerOutfitScene' });
  },

  init: function (data) {
    this.nextScene = data.nextScene || 'VictoryScene';
    this.nextData = data.nextData || {};
    this.selectedOutfit = 0; // default to first outfit
  },

  create: function () {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;

    // Process all outfit textures (flood-fill gray bg → dark navy)
    for (var t = 0; t < 3; t++) {
      LAFace.processTexture(this.game, 'la_outfit_' + t);
    }
    // Also process the talking head texture
    LAFace.processTexture(this.game, 'la_talking_head');

    // Resume audio
    AudioSynth.resume();

    // ===== BACKGROUND =====
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x16213e, 0x0f3460, 0x1a1a2e);
    bg.fillRect(0, 0, width, height);

    // Spotlight
    var spotlight = this.add.graphics();
    spotlight.fillStyle(0xffd700, 0.05);
    spotlight.fillTriangle(width / 2, 0, width / 2 - 200, height, width / 2 + 200, height);

    // Floating particles
    for (var i = 0; i < 15; i++) {
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

    // ===== TITLE =====
    this.add.text(width / 2, height * 0.04, 'TIME TO GET DRESSED!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '22px',
      color: '#ffd700'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.09, "PICK L.A.'S LOOK FOR THE GIG!", {
      fontFamily: GBR.FONTS.fun,
      fontSize: '16px',
      color: '#e8751a'
    }).setOrigin(0.5);

    // ===== LARGE PREVIEW PORTRAIT (talking head) =====
    var previewW = 170;
    var previewH = 210;
    var previewX = width / 2;
    var previewY = height * 0.29;

    // Talking head tuning: IMG_3118.jpg (811x1202)
    var talkingHeadTuning = { scale: 0.22, xOff: 0, yOff: 20 };

    // Determine talking head texture
    var thTexKey = this.game.textures.exists('la_talking_head') ? 'la_talking_head' : 'la_avatar';
    var thTuning = (thTexKey === 'la_talking_head') ? talkingHeadTuning : { scale: 0.55, xOff: -15, yOff: 265 };

    // Create preview avatar using talking head
    var previewAvatar = this.add.image(0, 0, thTexKey);
    previewAvatar.setScale(thTuning.scale);
    previewAvatar.setX(thTuning.xOff);
    previewAvatar.setY(thTuning.yOff);

    var previewContainer = this.add.container(previewX, previewY, [previewAvatar]);

    // Elliptical mask for preview
    var previewMaskGfx = this.make.graphics({ x: previewX, y: previewY, add: false });
    previewMaskGfx.fillStyle(0xffffff);
    previewMaskGfx.fillEllipse(0, 0, previewW, previewH);
    previewContainer.setMask(previewMaskGfx.createGeometryMask());

    // Gold border around preview
    var previewBorder = this.add.graphics({ x: previewX, y: previewY });
    previewBorder.lineStyle(3, 0xffd700, 0.5);
    previewBorder.strokeEllipse(0, 0, previewW + 6, previewH + 6);
    previewBorder.setDepth(previewContainer.depth + 1);

    // Idle bob for preview
    this.tweens.add({
      targets: [previewContainer, previewMaskGfx, previewBorder],
      y: previewY - 3,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // ===== NAME + OUTFIT LABEL =====
    this.add.text(width / 2, height * 0.455, 'L.A. Young', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '20px',
      color: '#e8751a'
    }).setOrigin(0.5);

    var outfitNames = GBR.OUTFITS[4];
    var outfitLabel = this.add.text(width / 2, height * 0.49, outfitNames[0].name, {
      fontFamily: GBR.FONTS.fun,
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // ===== OUTFIT CARDS (full body photos) =====
    var outfitCards = [];       // card containers (for tweening)
    var outfitBorders = [];     // selection border graphics
    var cardW = 110;
    var cardH = 180;            // taller cards for full body
    var cardSpacing = 130;
    var cardStartX = width / 2 - cardSpacing;
    var cardY = height * 0.66;

    // Per-outfit tuning for FULL BODY in cards
    // Scale each image so full height fits within cardH (180px)
    // Image dimensions: 0=428x640, 1=3024x4032, 2=736x1408
    var cardTuning = [
      // 0: LAPopSinger.jpeg (428x640) — 180/640 = 0.28
      { scale: 0.28, yOff: 0 },
      // 1: LAYoungPink.JPG (3024x4032) — 180/4032 = 0.045
      { scale: 0.045, yOff: 0 },
      // 2: laPowerSister.png (736x1408) — 180/1408 = 0.128
      { scale: 0.128, yOff: 0 }
    ];

    for (var c = 0; c < 3; c++) {
      (function (index) {
        var cardX = cardStartX + index * cardSpacing;
        var ct = cardTuning[index];

        // Dark card background
        var cardBg = self.add.graphics();
        cardBg.fillStyle(0x16213e, 0.9);
        cardBg.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 10);

        // Photo image inside a container — centered (yOff=0 for full body)
        var img = self.add.image(0, ct.yOff, 'la_outfit_' + index);
        img.setScale(ct.scale);

        var cardContainer = self.add.container(cardX, cardY, [img]);

        // Rectangular mask to clip the photo to card bounds
        var cardMaskGfx = self.make.graphics({ x: cardX, y: cardY, add: false });
        cardMaskGfx.fillStyle(0xffffff);
        cardMaskGfx.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
        cardContainer.setMask(cardMaskGfx.createGeometryMask());

        // Outfit name below card
        self.add.text(cardX, cardY + cardH / 2 + 14, outfitNames[index].name, {
          fontFamily: GBR.FONTS.fun,
          fontSize: '12px',
          color: '#ffffff'
        }).setOrigin(0.5);

        // Selection border (gold)
        var border = self.add.graphics();
        border.lineStyle(3, 0xffd700, 1);
        border.strokeRoundedRect(cardX - cardW / 2 - 2, cardY - cardH / 2 - 2, cardW + 4, cardH + 4, 12);
        border.setAlpha(index === 0 ? 1 : 0);
        outfitBorders.push(border);

        // Invisible hit zone for interaction (covers the card area)
        var hitZone = self.add.zone(cardX, cardY, cardW, cardH)
          .setInteractive({ useHandCursor: true });

        hitZone.on('pointerover', function () {
          self.tweens.add({ targets: cardContainer, scaleX: 1.06, scaleY: 1.06, duration: 100 });
        });

        hitZone.on('pointerout', function () {
          if (self.selectedOutfit !== index) {
            self.tweens.add({ targets: cardContainer, scaleX: 1, scaleY: 1, duration: 100 });
          }
        });

        hitZone.on('pointerdown', function () {
          AudioSynth.resume();
          AudioSynth.playCollect();

          // Deselect all
          for (var b = 0; b < outfitBorders.length; b++) {
            outfitBorders[b].setAlpha(0);
          }

          // Select this one
          self.selectedOutfit = index;
          border.setAlpha(1);
          self.tweens.add({ targets: cardContainer, scaleX: 1.08, scaleY: 1.08, duration: 150 });

          // Update label
          outfitLabel.setText(outfitNames[index].name);
        });

        outfitCards.push(cardContainer);
      })(c);
    }

    // ===== CONTINUE BUTTON =====
    var btn = createButton(this, width / 2, height * 0.93, 'CONTINUE', function () {
      GBR.state.singerDress = self.selectedOutfit;
      TransitionHelper.fadeToScene(self, self.nextScene, self.nextData);
    }, {
      bgColor: 0x2ecc71,
      width: 220,
      height: 55,
      fontSize: '26px'
    });

    btn.bg.setDepth(20);
    btn.text.setDepth(21);
    btn.hitZone.setDepth(21);

    // ===== FADE IN =====
    TransitionHelper.fadeIn(this, 600);
  }
});
