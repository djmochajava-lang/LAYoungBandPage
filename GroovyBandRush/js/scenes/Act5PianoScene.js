/* GroovyBandRush/js/scenes/Act5PianoScene.js */

var Act5PianoScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Act5PianoScene() {
    Phaser.Scene.call(this, { key: 'Act5PianoScene' });
  },

  init: function (data) {
    // When returning from SingerOutfitScene, resume at genre choice
    this.resumeAtGenre = (data && data.resumeAtGenre) || false;
    this.resumeActDollars = (data && data.actDollars) || 0;
  },

  create: function () {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;

    // Launch HUD overlay
    if (!this.scene.isActive('HUDScene')) {
      this.scene.launch('HUDScene');
    }
    this.game.events.emit('hud:refresh');

    // --- Scene state ---
    this.phase = 'pianoIntro';
    this.currentRound = 0;
    this.playerIndex = 0;
    this.pianoInputEnabled = false;
    this.actDollars = this.resumeActDollars || 0;
    this.continueShown = false;
    this.selectedDress = -1;
    this.selectedGenre = '';

    // --- Note name to index mapping ---
    this.noteNames = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
    this.noteFreqs = [
      GBR.NOTES.C4, GBR.NOTES.D4, GBR.NOTES.E4, GBR.NOTES.F4,
      GBR.NOTES.G4, GBR.NOTES.A4, GBR.NOTES.B4, GBR.NOTES.C5
    ];

    // --- Pre-defined melodies (as key indices) ---
    this.melodies = [
      [0, 2, 4],           // C4, E4, G4
      [0, 2, 4, 7],        // C4, E4, G4, C5
      [0, 1, 2, 3, 4],     // C4, D4, E4, F4, G4
      [2, 2, 3, 4, 4, 3]   // E4, E4, F4, G4, G4, F4
    ];

    // --- Key colors ---
    this.keyColors = [0xe63946, 0xe8751a, 0xffd700, 0x2ecc71, 0x3498db, 0x6c3483, 0xe84393, 0xf39c12];
    this.keyIcons = ['\uD83D\uDC31', '\uD83D\uDC36', '\uD83D\uDC26', '\uD83D\uDC1F', '\u2B50', '\uD83C\uDF19', '\u2600', '\u2764'];

    // Resume audio context for mobile
    AudioSynth.resume();

    // --- Background ---
    this.bgGraphics = this.add.graphics();
    this.bgGraphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x0f3460);
    this.bgGraphics.fillRect(0, 0, width, height);

    // --- Container for phase content (so we can clear phases) ---
    this.phaseContainer = this.add.container(0, 0);

    // If resuming from SingerOutfitScene, skip straight to genre choice
    if (this.resumeAtGenre) {
      this.resumeAtGenre = false;
      this.startGenreChoice();
      TransitionHelper.fadeIn(this, 600);
      return; // skip piano setup
    }

    // --- Start Phase A ---
    this.startPianoIntro();

    // --- Keyboard input (1-8 keys) ---
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown', function (event) {
        if (!self.pianoInputEnabled) return;
        var keyNum = parseInt(event.key, 10);
        if (keyNum >= 1 && keyNum <= 8) {
          self.onPianoKeyPress(keyNum - 1);
        }
      });
    }

    // Fade in
    TransitionHelper.fadeIn(this, 600);
  },

  // =========================================================================
  //  PHASE A: Piano Melody Game
  // =========================================================================

  startPianoIntro: function () {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;

    this.phase = 'pianoIntro';
    this.clearPhase();

    // Title
    var title = this.add.text(width / 2, 50, 'PIANO TIME!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '48px',
      color: GBR.COLORS.goldHex,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.phaseContainer.add(title);

    // Bounce the title
    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Round indicator
    this.roundText = this.add.text(width / 2, 95, 'Round 1 of ' + GBR.ACT5.rounds, {
      fontFamily: GBR.FONTS.fun,
      fontSize: '22px',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.phaseContainer.add(this.roundText);

    // Instruction text (changes between phases)
    this.instructionText = this.add.text(width / 2, 135, '', {
      fontFamily: GBR.FONTS.display,
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.phaseContainer.add(this.instructionText);

    // Dollars earned this act
    this.dollarsText = this.add.text(width / 2, height - 20, '$0', {
      fontFamily: GBR.FONTS.display,
      fontSize: '20px',
      color: '#32cd32'
    }).setOrigin(0.5);
    this.phaseContainer.add(this.dollarsText);

    // --- Build piano keys ---
    this.buildPianoKeys();

    // Start first round after brief delay
    this.time.delayedCall(600, function () {
      self.startMelodyPlayback();
    });
  },

  buildPianoKeys: function () {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;
    var keyCount = GBR.ACT5.keys;
    var keyWidth = 48;
    var keySpacing = 4;
    var totalWidth = keyCount * keyWidth + (keyCount - 1) * keySpacing;
    var startX = (width - totalWidth) / 2 + keyWidth / 2;
    var keyY = height - 120;

    this.pianoKeys = [];
    this.pianoKeyImages = [];

    for (var i = 0; i < keyCount; i++) {
      (function (index) {
        var kx = startX + index * (keyWidth + keySpacing);

        // Key image
        var keyImg = self.add.image(kx, keyY, 'pianokey_' + index);
        keyImg.setInteractive({ useHandCursor: true });
        self.phaseContainer.add(keyImg);

        // Animal icon on the key
        var icon = self.add.text(kx, keyY - 20, self.keyIcons[index], {
          fontSize: '28px'
        }).setOrigin(0.5);
        self.phaseContainer.add(icon);

        // Note name label below key
        var label = self.add.text(kx, keyY + 80, self.noteNames[index], {
          fontFamily: GBR.FONTS.fun,
          fontSize: '12px',
          color: '#aaaaaa'
        }).setOrigin(0.5);
        self.phaseContainer.add(label);

        // Number label (for keyboard hint)
        var numLabel = self.add.text(kx, keyY + 55, (index + 1).toString(), {
          fontFamily: GBR.FONTS.fun,
          fontSize: '14px',
          color: '#666666'
        }).setOrigin(0.5);
        self.phaseContainer.add(numLabel);

        // Pointer down handler
        keyImg.on('pointerdown', function () {
          if (!self.pianoInputEnabled) return;
          AudioSynth.resume();
          self.onPianoKeyPress(index);
        });

        self.pianoKeys.push({
          image: keyImg,
          icon: icon,
          label: label,
          numLabel: numLabel,
          x: kx,
          y: keyY
        });
        self.pianoKeyImages.push(keyImg);
      })(i);
    }
  },

  lightKey: function (index, duration) {
    var self = this;
    var key = this.pianoKeys[index];
    if (!key) return;

    duration = duration || 500;

    // Swap to lit texture
    key.image.setTexture('pianokey_' + index + '_lit');

    // Play the note
    AudioSynth.playNote(this.noteFreqs[index], 0.5, 'triangle', 0.5);

    // Scale up slightly
    this.tweens.add({
      targets: key.image,
      scaleY: 1.08,
      scaleX: 1.05,
      duration: 80,
      yoyo: true,
      hold: duration - 160,
      onComplete: function () {
        key.image.setTexture('pianokey_' + index);
      }
    });
  },

  startMelodyPlayback: function () {
    var self = this;
    this.phase = 'pianoPlayback';
    this.pianoInputEnabled = false;
    this.playerIndex = 0;

    var melody = this.melodies[this.currentRound];

    // Show instruction
    this.instructionText.setText('LISTEN AND REPEAT!');
    this.instructionText.setColor('#ffd700');

    // Flash instruction
    this.tweens.add({
      targets: this.instructionText,
      alpha: { from: 0, to: 1 },
      duration: 300
    });

    // Play melody one note at a time
    var noteDelay = 700;
    for (var i = 0; i < melody.length; i++) {
      (function (idx) {
        self.time.delayedCall(800 + idx * noteDelay, function () {
          self.lightKey(melody[idx], 500);
        });
      })(i);
    }

    // After melody finishes, switch to player turn
    var totalPlayTime = 800 + melody.length * noteDelay + 400;
    this.time.delayedCall(totalPlayTime, function () {
      self.startPlayerTurn();
    });
  },

  startPlayerTurn: function () {
    this.phase = 'pianoPlayerTurn';
    this.playerIndex = 0;
    this.pianoInputEnabled = true;

    // Update instruction
    this.instructionText.setText('YOUR TURN!');
    this.instructionText.setColor('#2ecc71');

    // Pulse instruction
    this.tweens.add({
      targets: this.instructionText,
      scaleX: { from: 1.2, to: 1 },
      scaleY: { from: 1.2, to: 1 },
      duration: 300
    });
  },

  onPianoKeyPress: function (keyIndex) {
    if (this.phase !== 'pianoPlayerTurn') return;
    if (!this.pianoInputEnabled) return;

    var self = this;
    var melody = this.melodies[this.currentRound];
    var expectedKey = melody[this.playerIndex];

    if (keyIndex === expectedKey) {
      // Correct!
      this.lightKey(keyIndex, 400);

      // Star burst at key position
      var key = this.pianoKeys[keyIndex];
      var emitter = this.add.particles(key.x, key.y - 40, 'star', {
        speed: { min: 50, max: 120 },
        angle: { min: 220, max: 320 },
        scale: { start: 0.8, end: 0 },
        lifespan: 600,
        quantity: 5,
        tint: [this.keyColors[keyIndex], 0xffd700, 0xffffff]
      });
      this.phaseContainer.add(emitter);

      this.time.delayedCall(700, function () {
        emitter.stop();
      });

      this.playerIndex++;

      // Check if melody is complete
      if (this.playerIndex >= melody.length) {
        this.pianoInputEnabled = false;
        this.onRoundWin();
      }
    } else {
      // Wrong key - gentle feedback
      this.pianoInputEnabled = false;
      var wrongKey = this.pianoKeys[keyIndex];

      // Shake the wrong key
      this.tweens.add({
        targets: wrongKey.image,
        x: wrongKey.x + 6,
        duration: 40,
        yoyo: true,
        repeat: 4,
        onComplete: function () {
          wrongKey.image.x = wrongKey.x;
        }
      });

      // Gentle camera shake
      TransitionHelper.shake(this, 150, 0.005);

      // Show encouragement
      this.instructionText.setText('TRY AGAIN!');
      this.instructionText.setColor('#e8751a');

      // Replay melody after brief pause
      this.time.delayedCall(1200, function () {
        self.startMelodyPlayback();
      });
    }
  },

  onRoundWin: function () {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;

    this.phase = 'pianoRoundWin';

    // Award dollars
    this.actDollars += GBR.ACT5.roundValue;
    GBR.state.totalDollars += GBR.ACT5.roundValue;
    this.game.events.emit('hud:dollars', GBR.state.totalDollars);
    this.dollarsText.setText('$' + this.actDollars);

    // Play success jingle
    AudioSynth.playSuccess();

    // Flash
    TransitionHelper.flash(this, 200);

    // Big "AMAZING!" text
    var amazeText = this.add.text(width / 2, height / 2 - 40, 'AMAZING!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '56px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0).setScale(0.3);
    this.phaseContainer.add(amazeText);

    this.tweens.add({
      targets: amazeText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });

    // Dollar text pop
    var dollarPop = this.add.text(width / 2, height / 2 + 20, '+$' + GBR.ACT5.roundValue, {
      fontFamily: GBR.FONTS.display,
      fontSize: '32px',
      color: '#32cd32',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0);
    this.phaseContainer.add(dollarPop);

    this.tweens.add({
      targets: dollarPop,
      alpha: 1,
      y: dollarPop.y - 30,
      duration: 600,
      ease: 'Power2'
    });

    // Celebration particles across the top
    var celebEmitter = this.add.particles(width / 2, 0, 'star', {
      speed: { min: 80, max: 200 },
      angle: { min: 60, max: 120 },
      scale: { start: 1, end: 0 },
      lifespan: 1200,
      quantity: 3,
      frequency: 60,
      tint: [0xffd700, 0xe63946, 0x3498db, 0x2ecc71],
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Rectangle(0, 0, width, 10)
      }
    });
    celebEmitter.setPosition(0, 0);
    this.phaseContainer.add(celebEmitter);

    // Collect and advance
    AudioSynth.playCollect();

    this.time.delayedCall(800, function () {
      celebEmitter.stop();
    });

    this.currentRound++;

    if (this.currentRound < GBR.ACT5.rounds) {
      // Next round
      this.time.delayedCall(2000, function () {
        if (amazeText && amazeText.scene) amazeText.destroy();
        if (dollarPop && dollarPop.scene) dollarPop.destroy();
        self.roundText.setText('Round ' + (self.currentRound + 1) + ' of ' + GBR.ACT5.rounds);
        self.startMelodyPlayback();
      });
    } else {
      // Piano game complete → transition to SingerOutfitScene for L.A.'s outfit choice
      this.time.delayedCall(2000, function () {
        // Store act score
        GBR.state.actScores[4] = self.actDollars;

        // Stop HUD before leaving — it will relaunch when we return
        self.scene.stop('HUDScene');

        // Go to SingerOutfitScene, then come back here for genre choice
        TransitionHelper.fadeToScene(self, 'SingerOutfitScene', {
          nextScene: 'Act5PianoScene',
          nextData: { resumeAtGenre: true, actDollars: self.actDollars }
        });
      });
    }
  },

  // =========================================================================
  //  Transition to Phase B
  // =========================================================================

  startDressTransition: function () {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;

    this.clearPhase();

    // Big transition text
    var transText = this.add.text(width / 2, height / 2, 'TIME FOR THE\nBIG SHOW!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '52px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);
    this.phaseContainer.add(transText);

    this.tweens.add({
      targets: transText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Back.easeOut'
    });

    // Star burst explosion
    var burstEmitter = this.add.particles(width / 2, height / 2, 'star', {
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      lifespan: 1500,
      quantity: 30,
      tint: [0xffd700, 0xe8751a, 0xe63946, 0x3498db, 0x2ecc71]
    });
    this.phaseContainer.add(burstEmitter);

    this.time.delayedCall(300, function () {
      burstEmitter.stop();
    });

    AudioSynth.playSuccess();
    TransitionHelper.flash(this, 300);

    // Transition to dress choice after display
    this.time.delayedCall(2500, function () {
      self.startDressChoice();
    });
  },

  // =========================================================================
  //  PHASE B: Singer Dress Choice
  // =========================================================================

  startDressChoice: function () {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;

    this.phase = 'dressChoice';
    this.clearPhase();
    this.selectedDress = -1;
    this.continueShown = false;

    // Background refresh
    this.bgGraphics.clear();
    this.bgGraphics.fillGradientStyle(0x1a1a2e, 0x16213e, 0x0f3460, 0x1a1a2e);
    this.bgGraphics.fillRect(0, 0, width, height);

    // Spotlight effect
    var spotlight = this.add.graphics();
    spotlight.fillStyle(0xffd700, 0.06);
    spotlight.fillTriangle(width / 2, 0, width / 2 - 220, height, width / 2 + 220, height);
    this.phaseContainer.add(spotlight);

    // Title
    var title = this.add.text(width / 2, 40, 'PICK A DRESS FOR', {
      fontFamily: GBR.FONTS.display,
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.phaseContainer.add(title);

    var nameTitle = this.add.text(width / 2, 75, 'L.A. YOUNG!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '40px',
      color: GBR.COLORS.orangeHex,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.phaseContainer.add(nameTitle);

    // Pulse the name
    this.tweens.add({
      targets: nameTitle,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // L.A. Young portrait
    this.singerPortrait = this.add.image(width / 2, height * 0.34, 'member_4').setScale(0.45);
    this.phaseContainer.add(this.singerPortrait);

    // Entrance animation
    this.singerPortrait.setAlpha(0);
    this.singerPortrait.setScale(0);
    this.tweens.add({
      targets: this.singerPortrait,
      alpha: 1,
      scaleX: 0.45,
      scaleY: 0.45,
      duration: 600,
      ease: 'Back.easeOut'
    });

    // Celebration particles around portrait
    var celebEmitter = this.add.particles(width / 2, height * 0.3, 'star', {
      speed: { min: 30, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      lifespan: 1200,
      frequency: 250,
      tint: [0xffd700, 0xe8751a, 0xffffff]
    });
    this.phaseContainer.add(celebEmitter);

    this.time.delayedCall(2500, function () {
      celebEmitter.stop();
    });

    // Role label
    var roleLabel = this.add.text(width / 2, height * 0.50, GBR.BAND[4].emoji + ' Lead Vocals ' + GBR.BAND[4].emoji, {
      fontFamily: GBR.FONTS.fun,
      fontSize: '18px',
      color: '#e8751a'
    }).setOrigin(0.5);
    this.phaseContainer.add(roleLabel);

    // --- Outfit cards ---
    var outfitBorders = [];
    var outfitCards = [];
    var cardSpacing = Math.min(160, (width - 60) / 3);
    var cardStartX = width / 2 - cardSpacing;
    var cardY = height * 0.70;

    for (var i = 0; i < 3; i++) {
      (function (index) {
        var cardX = cardStartX + index * cardSpacing - 60;
        var outfit = GBR.OUTFITS[index];

        // Card image
        var card = self.add.image(cardX + 60, cardY, 'outfit_' + index).setScale(0.85);
        self.phaseContainer.add(card);

        // Outfit name
        var labelText = self.add.text(cardX + 60, cardY + 85, outfit.name, {
          fontFamily: GBR.FONTS.fun,
          fontSize: '14px',
          color: '#ffffff'
        }).setOrigin(0.5);
        self.phaseContainer.add(labelText);

        // Selection border (hidden)
        var border = self.add.graphics();
        border.lineStyle(4, 0xffd700, 1);
        border.strokeRoundedRect(cardX, cardY - 68, 120, 136, 12);
        border.setAlpha(0);
        self.phaseContainer.add(border);
        outfitBorders.push(border);

        // Make interactive
        card.setInteractive({ useHandCursor: true });

        card.on('pointerover', function () {
          self.tweens.add({ targets: card, scaleX: 0.95, scaleY: 0.95, duration: 100 });
        });

        card.on('pointerout', function () {
          if (self.selectedDress !== index) {
            self.tweens.add({ targets: card, scaleX: 0.85, scaleY: 0.85, duration: 100 });
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
          self.selectedDress = index;
          border.setAlpha(1);
          self.tweens.add({ targets: card, scaleX: 0.95, scaleY: 0.95, duration: 150 });

          // Tint portrait to match
          self.singerPortrait.setTint(outfit.color);

          // Store selection
          GBR.state.singerDress = index;

          // Show continue if not already
          if (!self.continueShown) {
            self.showDressContinue();
          }
        });

        outfitCards.push(card);
      })(i);
    }
  },

  showDressContinue: function () {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;
    this.continueShown = true;

    var lookingGood = this.add.text(width / 2, height * 0.87, 'LOOKING GOOD!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '22px',
      color: '#ffd700'
    }).setOrigin(0.5).setAlpha(0);
    this.phaseContainer.add(lookingGood);

    this.tweens.add({
      targets: lookingGood,
      alpha: 1,
      duration: 300
    });

    this.time.delayedCall(400, function () {
      var btn = createButton(self, width / 2, height * 0.94, 'CONTINUE', function () {
        self.startGenreChoice();
      }, {
        bgColor: 0x2ecc71,
        width: 200,
        height: 50,
        fontSize: '24px'
      });
      self.phaseContainer.add(btn.bg);
      self.phaseContainer.add(btn.text);
      self.phaseContainer.add(btn.hitZone);
    });
  },

  // =========================================================================
  //  PHASE C: Genre Choice + Finale
  // =========================================================================

  startGenreChoice: function () {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;

    this.phase = 'genreChoice';
    this.clearPhase();

    // Background
    this.bgGraphics.clear();
    this.bgGraphics.fillGradientStyle(0x1a0a2e, 0x1a1a2e, 0x16213e, 0x0f3460);
    this.bgGraphics.fillRect(0, 0, width, height);

    // Title
    var title = this.add.text(width / 2, 60, 'WHAT KIND OF MUSIC?', {
      fontFamily: GBR.FONTS.display,
      fontSize: '42px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.phaseContainer.add(title);

    var subtitle = this.add.text(width / 2, 105, 'Pick the genre for the big show!', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '20px',
      color: '#cccccc'
    }).setOrigin(0.5);
    this.phaseContainer.add(subtitle);

    // Genre buttons
    var genres = GBR.ACT5.genres;
    var genreColors = [0x6c3483, 0xe8751a, 0x3498db]; // SOUL=purple, FUNK=orange, BLUES=blue
    var genreEmojis = ['\uD83D\uDC9C', '\uD83D\uDD25', '\uD83C\uDF0A'];
    var btnY = height * 0.40;
    var btnSpacing = 130;

    for (var i = 0; i < genres.length; i++) {
      (function (index) {
        var bx = width / 2;
        var by = btnY + index * btnSpacing;

        // Large genre button
        var genreBg = self.add.graphics();
        genreBg.fillStyle(genreColors[index], 1);
        genreBg.fillRoundedRect(bx - 160, by - 42, 320, 84, 20);
        genreBg.lineStyle(3, 0xffd700, 0.5);
        genreBg.strokeRoundedRect(bx - 160, by - 42, 320, 84, 20);
        self.phaseContainer.add(genreBg);

        var genreLabel = self.add.text(bx, by, genreEmojis[index] + '  ' + genres[index] + '  ' + genreEmojis[index], {
          fontFamily: GBR.FONTS.display,
          fontSize: '36px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5);
        self.phaseContainer.add(genreLabel);

        var hitZone = self.add.zone(bx, by, 320, 84).setInteractive({ useHandCursor: true });
        self.phaseContainer.add(hitZone);

        hitZone.on('pointerover', function () {
          self.tweens.add({
            targets: genreLabel,
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 100
          });
          genreBg.clear();
          genreBg.fillStyle(genreColors[index], 1);
          genreBg.fillRoundedRect(bx - 168, by - 46, 336, 92, 22);
          genreBg.lineStyle(3, 0xffd700, 1);
          genreBg.strokeRoundedRect(bx - 168, by - 46, 336, 92, 22);
        });

        hitZone.on('pointerout', function () {
          self.tweens.add({
            targets: genreLabel,
            scaleX: 1,
            scaleY: 1,
            duration: 100
          });
          genreBg.clear();
          genreBg.fillStyle(genreColors[index], 1);
          genreBg.fillRoundedRect(bx - 160, by - 42, 320, 84, 20);
          genreBg.lineStyle(3, 0xffd700, 0.5);
          genreBg.strokeRoundedRect(bx - 160, by - 42, 320, 84, 20);
        });

        hitZone.on('pointerdown', function () {
          AudioSynth.resume();
          AudioSynth.playCollect();

          self.selectedGenre = genres[index];
          GBR.state.songGenre = genres[index];

          // Brief flash then start finale
          TransitionHelper.flash(self, 300);

          self.time.delayedCall(500, function () {
            self.startFinale();
          });
        });
      })(i);
    }
  },

  // =========================================================================
  //  FINALE ANIMATION
  // =========================================================================

  startFinale: function () {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;

    this.phase = 'finale';
    this.clearPhase();

    // --- Genre color schemes ---
    var genreSchemes = {
      'SOUL': { primary: 0x6c3483, secondary: 0xffd700, bgTop: 0x2d1b4e, bgBottom: 0x1a0a2e, accent: 0x9b59b6 },
      'FUNK': { primary: 0xe8751a, secondary: 0xe84393, bgTop: 0x4a1a0a, bgBottom: 0x2e0a1a, accent: 0xffd700 },
      'BLUES': { primary: 0x3498db, secondary: 0xffd700, bgTop: 0x0a2e4a, bgBottom: 0x0a1a3e, accent: 0x5dade2 }
    };
    var scheme = genreSchemes[this.selectedGenre] || genreSchemes['SOUL'];

    // --- Draw the stage ---
    this.bgGraphics.clear();

    // Background gradient
    this.bgGraphics.fillGradientStyle(scheme.bgTop, scheme.bgTop, scheme.bgBottom, scheme.bgBottom);
    this.bgGraphics.fillRect(0, 0, width, height);

    // Stage floor
    var stageGfx = this.add.graphics();
    stageGfx.fillStyle(0x333333, 1);
    stageGfx.fillRect(0, height * 0.68, width, height * 0.32);
    stageGfx.fillStyle(0x555555, 1);
    stageGfx.fillRect(0, height * 0.68, width, 6);
    this.phaseContainer.add(stageGfx);

    // Stage floor shine lines
    var floorGfx = this.add.graphics();
    floorGfx.lineStyle(1, scheme.primary, 0.15);
    for (var fl = 0; fl < 20; fl++) {
      var flx = fl * (width / 20);
      floorGfx.lineBetween(flx, height * 0.68, flx + 40, height);
    }
    this.phaseContainer.add(floorGfx);

    // Left curtain
    var curtainLeft = this.add.graphics();
    curtainLeft.fillStyle(scheme.primary, 0.7);
    curtainLeft.fillRect(0, 0, 60, height * 0.70);
    curtainLeft.fillStyle(scheme.primary, 0.4);
    curtainLeft.fillRect(60, 0, 30, height * 0.65);
    this.phaseContainer.add(curtainLeft);

    // Right curtain
    var curtainRight = this.add.graphics();
    curtainRight.fillStyle(scheme.primary, 0.7);
    curtainRight.fillRect(width - 60, 0, 60, height * 0.70);
    curtainRight.fillStyle(scheme.primary, 0.4);
    curtainRight.fillRect(width - 90, 0, 30, height * 0.65);
    this.phaseContainer.add(curtainRight);

    // Top curtain valance
    var curtainTop = this.add.graphics();
    curtainTop.fillStyle(scheme.primary, 0.8);
    curtainTop.fillRect(0, 0, width, 30);
    curtainTop.fillStyle(scheme.secondary, 0.5);
    curtainTop.fillRect(0, 28, width, 4);
    this.phaseContainer.add(curtainTop);

    // --- Spotlights ---
    var spotlightGfx = this.add.graphics();

    // Left spotlight
    spotlightGfx.fillStyle(scheme.secondary, 0.04);
    spotlightGfx.fillTriangle(100, 0, 50, height * 0.7, 350, height * 0.7);

    // Center spotlight
    spotlightGfx.fillStyle(0xffffff, 0.05);
    spotlightGfx.fillTriangle(width / 2, 0, width / 2 - 150, height * 0.7, width / 2 + 150, height * 0.7);

    // Right spotlight
    spotlightGfx.fillStyle(scheme.secondary, 0.04);
    spotlightGfx.fillTriangle(width - 100, 0, width - 350, height * 0.7, width - 50, height * 0.7);
    this.phaseContainer.add(spotlightGfx);

    // Animate spotlights sweeping
    var spotSweep = this.add.graphics();
    this.phaseContainer.add(spotSweep);
    var spotAngle = 0;
    this.spotlightTimer = this.time.addEvent({
      delay: 50,
      loop: true,
      callback: function () {
        spotAngle += 0.03;
        spotSweep.clear();
        var sx = width / 2 + Math.sin(spotAngle) * 200;
        spotSweep.fillStyle(scheme.accent, 0.03);
        spotSweep.fillTriangle(sx, 0, sx - 120, height * 0.7, sx + 120, height * 0.7);
      }
    });

    // --- "LADIES AND GENTLEMEN..." text ---
    var announceLine1 = this.add.text(width / 2, height * 0.20, 'LADIES AND GENTLEMEN...', {
      fontFamily: GBR.FONTS.display,
      fontSize: '32px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);
    this.phaseContainer.add(announceLine1);

    this.tweens.add({
      targets: announceLine1,
      alpha: 1,
      duration: 1000,
      ease: 'Power2'
    });

    // --- Band members walk on stage ---
    var memberPositions = [
      { x: width * 0.15, y: height * 0.58, fromX: -80 },     // Eugene - Sax - from left
      { x: width * 0.35, y: height * 0.60, fromX: -80 },     // Kevin W - Bass - from left
      { x: width * 0.65, y: height * 0.60, fromX: width + 80 }, // Kevin R - Guitar - from right
      { x: width * 0.85, y: height * 0.58, fromX: width + 80 }, // Jimmy - Drums - from right
      { x: width / 2, y: height * 0.52, fromX: width / 2 }     // L.A. Young - center (drops in)
    ];

    this.bandSprites = [];

    for (var m = 0; m < 5; m++) {
      (function (mIdx) {
        var pos = memberPositions[mIdx];
        var delay = 1500 + mIdx * 700;

        self.time.delayedCall(delay, function () {
          var member = GBR.BAND[mIdx];
          var sprite = self.add.image(pos.fromX, pos.y, 'member_' + mIdx).setScale(1.3);
          self.phaseContainer.add(sprite);

          // Apply outfit tint for L.A. Young
          if (mIdx === 4 && self.selectedDress >= 0) {
            sprite.setTint(GBR.OUTFITS[self.selectedDress].color);
          }

          // Walk on tween
          var tweenConfig = {
            targets: sprite,
            x: pos.x,
            duration: 800,
            ease: 'Power2.easeOut',
            onComplete: function () {
              // Bounce in place
              self.tweens.add({
                targets: sprite,
                y: pos.y - 8,
                duration: 400 + mIdx * 50,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
              });

              // Entry particle burst
              var entryEmitter = self.add.particles(pos.x, pos.y, 'star', {
                speed: { min: 40, max: 100 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.8, end: 0 },
                lifespan: 800,
                quantity: 8,
                tint: [member.color, 0xffd700]
              });
              self.phaseContainer.add(entryEmitter);

              self.time.delayedCall(500, function () {
                entryEmitter.stop();
              });
            }
          };

          // L.A. Young drops from above
          if (mIdx === 4) {
            sprite.setPosition(pos.x, -80);
            tweenConfig.x = pos.x;
            tweenConfig.y = pos.y;
            tweenConfig.ease = 'Bounce.easeOut';
            tweenConfig.duration = 1000;
          }

          self.tweens.add(tweenConfig);

          // Play note for entry
          AudioSynth.playNote(self.noteFreqs[mIdx], 0.3, 'triangle', 0.3);

          // Name tag
          self.time.delayedCall(900, function () {
            var nameTag = self.add.text(pos.x, pos.y + 40, member.emoji + ' ' + member.name, {
              fontFamily: GBR.FONTS.fun,
              fontSize: '11px',
              color: member.colorHex,
              stroke: '#000000',
              strokeThickness: 2
            }).setOrigin(0.5).setAlpha(0);
            self.phaseContainer.add(nameTag);

            self.tweens.add({
              targets: nameTag,
              alpha: 1,
              duration: 400
            });
          });

          self.bandSprites.push(sprite);
        });
      })(m);
    }

    // --- After all members are on stage, show the big title ---
    var allMembersDelay = 1500 + 5 * 700 + 1200;

    this.time.delayedCall(allMembersDelay, function () {
      // Fade out announcement line
      self.tweens.add({
        targets: announceLine1,
        alpha: 0,
        duration: 400
      });

      // Play chord progression
      self.playFinaleChord();

      // Big flash
      TransitionHelper.flash(self, 400);

      // "L.A. YOUNG & THE BAND" title
      var bandTitle = self.add.text(width / 2, height * 0.14, 'L.A. YOUNG', {
        fontFamily: GBR.FONTS.display,
        fontSize: '48px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setAlpha(0).setScale(0.3);
      self.phaseContainer.add(bandTitle);

      var bandSubtitle = self.add.text(width / 2, height * 0.24, '& THE BAND', {
        fontFamily: GBR.FONTS.display,
        fontSize: '36px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setAlpha(0).setScale(0.3);
      self.phaseContainer.add(bandSubtitle);

      // Genre badge
      var genreBadge = self.add.text(width / 2, height * 0.32, self.selectedGenre, {
        fontFamily: GBR.FONTS.display,
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#' + scheme.primary.toString(16).padStart(6, '0'),
        padding: { x: 20, y: 8 }
      }).setOrigin(0.5).setAlpha(0);
      self.phaseContainer.add(genreBadge);

      // Animate titles in
      self.tweens.add({
        targets: bandTitle,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 600,
        ease: 'Back.easeOut'
      });

      self.tweens.add({
        targets: bandSubtitle,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 600,
        ease: 'Back.easeOut',
        delay: 200
      });

      self.tweens.add({
        targets: genreBadge,
        alpha: 1,
        duration: 400,
        delay: 500
      });

      // Pulse the title
      self.tweens.add({
        targets: bandTitle,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: 800
      });

      // --- Confetti particles everywhere ---
      var confettiColors = [
        0xffd700,
        scheme.primary,
        scheme.secondary,
        scheme.accent,
        GBR.BAND[0].color,
        GBR.BAND[1].color,
        GBR.BAND[2].color,
        GBR.BAND[3].color,
        GBR.BAND[4].color
      ];

      // Top confetti shower
      var confettiTop = self.add.particles(0, 0, 'particle', {
        x: { min: 0, max: width },
        y: -10,
        speed: { min: 30, max: 100 },
        angle: { min: 80, max: 100 },
        scale: { start: 1, end: 0.3 },
        lifespan: { min: 2000, max: 4000 },
        frequency: 40,
        tint: confettiColors,
        rotate: { min: 0, max: 360 }
      });
      self.phaseContainer.add(confettiTop);

      // Star burst from center
      var starBurst = self.add.particles(width / 2, height * 0.45, 'star', {
        speed: { min: 60, max: 200 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        lifespan: 2000,
        frequency: 80,
        tint: confettiColors
      });
      self.phaseContainer.add(starBurst);

      // Side confetti bursts
      var leftBurst = self.add.particles(0, height * 0.3, 'star', {
        speed: { min: 80, max: 180 },
        angle: { min: -40, max: 40 },
        scale: { start: 0.8, end: 0 },
        lifespan: 1500,
        frequency: 120,
        tint: confettiColors
      });
      self.phaseContainer.add(leftBurst);

      var rightBurst = self.add.particles(width, height * 0.3, 'star', {
        speed: { min: 80, max: 180 },
        angle: { min: 140, max: 220 },
        scale: { start: 0.8, end: 0 },
        lifespan: 1500,
        frequency: 120,
        tint: confettiColors
      });
      self.phaseContainer.add(rightBurst);

      // Dollar display
      var finalDollars = self.add.text(width / 2, height * 0.92, 'EARNED: $' + self.actDollars, {
        fontFamily: GBR.FONTS.display,
        fontSize: '22px',
        color: '#32cd32',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setAlpha(0);
      self.phaseContainer.add(finalDollars);

      self.tweens.add({
        targets: finalDollars,
        alpha: 1,
        duration: 600,
        delay: 800
      });

      // --- After finaleDisplayTime, transition out ---
      // Use setTimeout to avoid Phaser timer throttling in background tabs
      setTimeout(function () {
        // Stop particles
        confettiTop.stop();
        starBurst.stop();
        leftBurst.stop();
        rightBurst.stop();

        if (self.spotlightTimer) {
          self.spotlightTimer.remove();
        }

        // Emit act complete
        self.game.events.emit('hud:actComplete', 4);

        // Stop HUD before transitioning
        self.scene.stop('HUDScene');

        // Transition to VictoryScene (outfit was already chosen before genre)
        TransitionHelper.fadeToScene(self, 'VictoryScene', {
          totalDollars: GBR.state.totalDollars,
          songGenre: self.selectedGenre
        });
      }, GBR.ACT5.finaleDisplayTime);
    });
  },

  playFinaleChord: function () {
    // Play a celebratory chord progression based on genre
    var chords;

    if (this.selectedGenre === 'SOUL') {
      // Soulful minor 7th chord
      chords = [
        { freq: GBR.NOTES.C4, delay: 0, wave: 'triangle' },
        { freq: GBR.NOTES.E4, delay: 50, wave: 'triangle' },
        { freq: GBR.NOTES.G4, delay: 100, wave: 'triangle' },
        { freq: GBR.NOTES.B4, delay: 150, wave: 'sine' },
        { freq: GBR.NOTES.C5, delay: 300, wave: 'triangle' }
      ];
    } else if (this.selectedGenre === 'FUNK') {
      // Funky dominant 7th
      chords = [
        { freq: GBR.NOTES.C4, delay: 0, wave: 'square' },
        { freq: GBR.NOTES.E4, delay: 80, wave: 'square' },
        { freq: GBR.NOTES.G4, delay: 160, wave: 'sawtooth' },
        { freq: GBR.NOTES.A4, delay: 240, wave: 'square' },
        { freq: GBR.NOTES.C5, delay: 400, wave: 'sawtooth' }
      ];
    } else {
      // Blues shuffle feel
      chords = [
        { freq: GBR.NOTES.C4, delay: 0, wave: 'triangle' },
        { freq: GBR.NOTES.E4, delay: 100, wave: 'sine' },
        { freq: GBR.NOTES.G4, delay: 200, wave: 'triangle' },
        { freq: GBR.NOTES.A4, delay: 350, wave: 'sine' },
        { freq: GBR.NOTES.C5, delay: 500, wave: 'triangle' }
      ];
    }

    for (var c = 0; c < chords.length; c++) {
      (function (chord) {
        setTimeout(function () {
          AudioSynth.playNote(chord.freq, 0.8, chord.wave, 0.3);
        }, chord.delay);
      })(chords[c]);
    }

    // Second chord after a beat
    setTimeout(function () {
      AudioSynth.playNote(GBR.NOTES.F4, 0.6, 'triangle', 0.25);
      setTimeout(function () {
        AudioSynth.playNote(GBR.NOTES.A4, 0.6, 'triangle', 0.25);
      }, 60);
      setTimeout(function () {
        AudioSynth.playNote(GBR.NOTES.C5, 0.8, 'triangle', 0.3);
      }, 120);
    }, 1000);

    // Final resolution chord
    setTimeout(function () {
      AudioSynth.playNote(GBR.NOTES.C4, 1.0, 'triangle', 0.3);
      setTimeout(function () {
        AudioSynth.playNote(GBR.NOTES.E4, 1.0, 'triangle', 0.25);
      }, 40);
      setTimeout(function () {
        AudioSynth.playNote(GBR.NOTES.G4, 1.0, 'sine', 0.25);
      }, 80);
      setTimeout(function () {
        AudioSynth.playNote(GBR.NOTES.C5, 1.2, 'triangle', 0.35);
      }, 120);
    }, 2000);
  },

  // =========================================================================
  //  Utility
  // =========================================================================

  clearPhase: function () {
    // Remove all children from the phase container
    this.phaseContainer.removeAll(true);
  },

  update: function () {
    // No per-frame logic needed; all timing handled by tweens and delayed calls
  }
});
