/* GroovyBandRush/js/scenes/Act4SimonScene.js */

var Act4SimonScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Act4SimonScene() {
    Phaser.Scene.call(this, { key: 'Act4SimonScene' });
  },

  init: function () {
    this.gameState = 'intro';
    this.currentRound = 0;
    this.score = 0;
    this.engine = null;
    this.drums = [];
    this.drumFrequencies = [150, 200, 250, 300];
    this.drumNames = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
    this.drumColors = [0xe63946, 0x3498db, 0x2ecc71, 0xffd700];
    this.playbackIndex = 0;
    this.inputLocked = false;
    this.retriesUsed = 0;
    this.patternDots = [];
    this.instructionText = null;
    this.roundText = null;
    this.scoreText = null;
    this.drumGlowTweens = [];
  },

  create: function () {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;

    AudioSynth.resume();

    // Launch HUD overlay
    if (!this.scene.isActive('HUDScene')) {
      this.scene.launch('HUDScene');
    }
    this.game.events.emit('hud:refresh');

    // --- Dark background with subtle gradient ---
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a0a, 0x0a0a0a, 0x1a1a2e, 0x16213e);
    bg.fillRect(0, 0, width, height);

    // --- Spotlight cone on the drum area ---
    var spotlight = this.add.graphics();
    spotlight.fillStyle(0xffd700, 0.04);
    spotlight.fillTriangle(width / 2, 20, width / 2 - 250, height - 40, width / 2 + 250, height - 40);

    // --- Floating decorative particles ---
    for (var p = 0; p < 15; p++) {
      var dot = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 3),
        0xffd700,
        Phaser.Math.FloatBetween(0.03, 0.15)
      );
      this.tweens.add({
        targets: dot,
        y: dot.y - Phaser.Math.Between(30, 80),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000)
      });
    }

    // --- Round counter text ---
    this.roundText = this.add.text(width / 2, 36, 'ROUND 1/' + GBR.ACT4.maxRounds, {
      fontFamily: GBR.FONTS.display,
      fontSize: '28px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // --- Score display ---
    this.scoreText = this.add.text(width / 2, 68, 'SCORE: 0', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // --- Pattern length dots container (below score) ---
    this.patternDotsContainer = this.add.container(width / 2, 96);

    // --- Instruction text (center, above drums) ---
    this.instructionText = this.add.text(width / 2, 135, '', {
      fontFamily: GBR.FONTS.display,
      fontSize: '36px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // --- Create 4 drums in a 2x2 grid ---
    var centerX = width / 2;
    var centerY = height / 2 + 30;
    var gridSpacing = 130;

    var drumPositions = [
      { x: centerX - gridSpacing / 2, y: centerY - gridSpacing / 2 },  // 0: top-left (Red)
      { x: centerX + gridSpacing / 2, y: centerY - gridSpacing / 2 },  // 1: top-right (Blue)
      { x: centerX - gridSpacing / 2, y: centerY + gridSpacing / 2 },  // 2: bottom-left (Green)
      { x: centerX + gridSpacing / 2, y: centerY + gridSpacing / 2 }   // 3: bottom-right (Yellow)
    ];

    for (var d = 0; d < GBR.ACT4.drums; d++) {
      (function (index) {
        var pos = drumPositions[index];

        // Glow ring behind drum (for clickable pulse)
        var glowRing = self.add.graphics();
        glowRing.fillStyle(self.drumColors[index], 0.15);
        glowRing.fillCircle(0, 0, 68);
        glowRing.setPosition(pos.x, pos.y);
        glowRing.setAlpha(0);

        // Drum image
        var drum = self.add.image(pos.x, pos.y, 'drum_' + index)
          .setScale(1.4)
          .setInteractive({ useHandCursor: true });

        // Drum label underneath
        var label = self.add.text(pos.x, pos.y + 80, self.drumNames[index], {
          fontFamily: GBR.FONTS.fun,
          fontSize: '14px',
          color: '#aaaaaa'
        }).setOrigin(0.5).setAlpha(0.6);

        drum.on('pointerdown', function () {
          self.onDrumTap(index);
        });

        self.drums.push({
          image: drum,
          glowRing: glowRing,
          label: label,
          x: pos.x,
          y: pos.y
        });
      })(d);
    }

    // --- Jimmy Carney portrait (small, in corner) ---
    var jimmyPortrait = this.add.image(70, height - 60, 'member_3')
      .setScale(1.8)
      .setAlpha(0.7);

    this.add.text(70, height - 20, 'JIMMY', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '12px',
      color: '#2ecc71'
    }).setOrigin(0.5).setAlpha(0.7);

    // Gentle bounce on Jimmy
    this.tweens.add({
      targets: jimmyPortrait,
      y: jimmyPortrait.y - 5,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // --- Keyboard controls ---
    this.input.keyboard.on('keydown', function (event) {
      var keyMap = {
        'ONE': 0, 'TWO': 1, 'THREE': 2, 'FOUR': 3,
        'Q': 0, 'W': 1, 'A': 2, 'S': 3
      };
      var drumIndex = keyMap[event.key.toUpperCase()];
      // Handle number keys by code
      if (drumIndex === undefined) {
        if (event.code === 'Digit1') drumIndex = 0;
        else if (event.code === 'Digit2') drumIndex = 1;
        else if (event.code === 'Digit3') drumIndex = 2;
        else if (event.code === 'Digit4') drumIndex = 3;
      }
      if (drumIndex !== undefined) {
        self.onDrumTap(drumIndex);
      }
    });

    // --- Fade in then start intro ---
    TransitionHelper.fadeIn(this, 600);

    this.time.delayedCall(800, function () {
      self.startIntro();
    });
  },

  // =================== INTRO ===================
  startIntro: function () {
    var self = this;
    this.gameState = 'intro';

    this.showInstruction('WATCH THE DRUMS!', '#ffd700');

    // Pulse the instruction text
    this.tweens.add({
      targets: this.instructionText,
      scaleX: { from: 1, to: 1.15 },
      scaleY: { from: 1, to: 1.15 },
      duration: 500,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onComplete: function () {
        self.initializeGame();
      }
    });
  },

  initializeGame: function () {
    var self = this;

    // Create pattern engine
    this.engine = PatternEngine.create(GBR.ACT4.drums);

    // Build initial pattern with startPatternLength notes
    for (var i = 0; i < GBR.ACT4.startPatternLength; i++) {
      PatternEngine.addToPattern(this.engine);
    }

    this.currentRound = 1;
    this.retriesUsed = 0;
    this.updateRoundDisplay();

    // Brief pause then start first playback
    this.time.delayedCall(800, function () {
      self.startPlayback();
    });
  },

  // =================== PLAYBACK PHASE ===================
  startPlayback: function () {
    var self = this;
    this.gameState = 'playback';
    this.inputLocked = true;
    this.playbackIndex = 0;

    // Reset player input for this attempt
    PatternEngine.resetInput(this.engine);

    this.showInstruction('WATCH!', '#ffd700');

    // Update pattern dots
    this.updatePatternDots();

    // Brief pause before playback starts
    this.time.delayedCall(500, function () {
      self.playNextNote();
    });
  },

  playNextNote: function () {
    var self = this;
    var pattern = PatternEngine.getPattern(this.engine);

    if (this.playbackIndex >= pattern.length) {
      // Playback complete, switch to player turn
      this.time.delayedCall(400, function () {
        self.startPlayerTurn();
      });
      return;
    }

    var drumIndex = pattern[this.playbackIndex];
    this.highlightDrum(drumIndex, true);

    // Play the drum sound
    AudioSynth.playDrum(this.drumFrequencies[drumIndex], 0.6);

    // Highlight the corresponding pattern dot
    this.highlightPatternDot(this.playbackIndex);

    this.playbackIndex++;

    // Schedule next note
    this.time.delayedCall(GBR.ACT4.playbackSpeed, function () {
      self.playNextNote();
    });
  },

  highlightDrum: function (index, isPlayback) {
    var self = this;
    var drum = this.drums[index];
    if (!drum) return;

    // Swap to lit texture
    drum.image.setTexture('drum_' + index + '_lit');

    // Scale up dramatically
    var targetScale = isPlayback ? 1.75 : 1.6;
    this.tweens.add({
      targets: drum.image,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: 120,
      ease: 'Back.easeOut',
      onComplete: function () {
        // Hold briefly then return
        self.tweens.add({
          targets: drum.image,
          scaleX: 1.4,
          scaleY: 1.4,
          duration: 250,
          ease: 'Sine.easeOut',
          onComplete: function () {
            drum.image.setTexture('drum_' + index);
          }
        });
      }
    });

    // Particle burst during playback
    if (isPlayback) {
      var emitter = this.add.particles(drum.x, drum.y, 'particle', {
        speed: { min: 40, max: 120 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.5, end: 0 },
        lifespan: 500,
        quantity: 8,
        tint: [this.drumColors[index], 0xffffff]
      });
      this.time.delayedCall(150, function () {
        emitter.stop();
      });
      this.time.delayedCall(700, function () {
        emitter.destroy();
      });
    }
  },

  // =================== PLAYER TURN ===================
  startPlayerTurn: function () {
    this.gameState = 'playerTurn';
    this.inputLocked = false;
    this.retriesUsed = 0;

    this.showInstruction('YOUR TURN!', '#2ecc71');

    // Pulse instruction
    this.tweens.add({
      targets: this.instructionText,
      scaleX: { from: 1, to: 1.1 },
      scaleY: { from: 1, to: 1.1 },
      duration: 400,
      yoyo: true,
      repeat: 1
    });

    // Start subtle glow pulse on all drums to show they are clickable
    this.startDrumGlow();
  },

  startDrumGlow: function () {
    var self = this;
    // Clear any existing glow tweens
    this.stopDrumGlow();

    for (var i = 0; i < this.drums.length; i++) {
      (function (index) {
        var drum = self.drums[index];
        drum.glowRing.setAlpha(0);

        var tween = self.tweens.add({
          targets: drum.glowRing,
          alpha: { from: 0, to: 0.4 },
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: index * 100
        });
        self.drumGlowTweens.push(tween);
      })(i);
    }
  },

  stopDrumGlow: function () {
    for (var i = 0; i < this.drumGlowTweens.length; i++) {
      this.drumGlowTweens[i].stop();
    }
    this.drumGlowTweens = [];

    for (var j = 0; j < this.drums.length; j++) {
      this.drums[j].glowRing.setAlpha(0);
    }
  },

  onDrumTap: function (index) {
    if (this.gameState !== 'playerTurn' || this.inputLocked) return;
    if (index < 0 || index >= GBR.ACT4.drums) return;

    AudioSynth.resume();

    // Play the drum sound
    AudioSynth.playDrum(this.drumFrequencies[index], 0.6);

    // Check the input
    var correct = PatternEngine.checkInput(this.engine, index);

    if (correct) {
      this.onCorrectTap(index);
    } else {
      this.onWrongTap(index);
    }
  },

  onCorrectTap: function (index) {
    var self = this;

    // Flash green tint on the drum
    this.highlightDrum(index, false);
    this.drums[index].image.setTint(0x00ff00);
    this.time.delayedCall(250, function () {
      self.drums[index].image.clearTint();
    });

    // Small star burst
    var drum = this.drums[index];
    var starEmitter = this.add.particles(drum.x, drum.y, 'star', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 5,
      tint: [0xffd700, 0x2ecc71]
    });
    this.time.delayedCall(100, function () {
      starEmitter.stop();
    });
    this.time.delayedCall(600, function () {
      starEmitter.destroy();
    });

    // Highlight the pattern dot as completed
    var inputPos = this.engine.playerInput.length - 1;
    this.completePatternDot(inputPos);

    // Check if round is complete
    if (PatternEngine.isRoundComplete(this.engine)) {
      this.inputLocked = true;
      this.stopDrumGlow();
      this.time.delayedCall(400, function () {
        self.onRoundWin();
      });
    }
  },

  onWrongTap: function (index) {
    var self = this;
    this.inputLocked = true;
    this.stopDrumGlow();

    // Drum shakes violently + red tint
    var drum = this.drums[index];
    drum.image.setTint(0xff0000);

    this.tweens.add({
      targets: drum.image,
      x: drum.x + 10,
      duration: 40,
      yoyo: true,
      repeat: 5,
      onComplete: function () {
        drum.image.x = drum.x;
        drum.image.clearTint();
      }
    });

    // Camera shake
    TransitionHelper.shake(this, 200, 0.008);

    // Play fail sound
    AudioSynth.playFail();

    // "OOPS!" text
    this.showInstruction('OOPS!', '#e63946');

    // Check retries
    if (this.retriesUsed < GBR.ACT4.retriesPerRound) {
      this.retriesUsed++;

      this.time.delayedCall(800, function () {
        self.showInstruction('TRY AGAIN!', '#e8751a');

        self.time.delayedCall(600, function () {
          self.showInstruction('WATCH!', '#ffd700');
        });

        // Reset input and replay pattern
        PatternEngine.resetInput(self.engine);
        self.resetPatternDots();

        self.time.delayedCall(1200, function () {
          self.startPlayback();
        });
      });
    } else {
      // No retries left -- be very forgiving for kids
      // Just let them continue from where they were (minus the wrong input)
      // Remove the wrong input from the engine
      this.engine.playerInput.pop();

      this.time.delayedCall(800, function () {
        self.showInstruction('KEEP GOING!', '#e8751a');
        self.inputLocked = false;
        self.startDrumGlow();
      });
    }
  },

  // =================== ROUND WIN ===================
  onRoundWin: function () {
    var self = this;
    this.gameState = 'roundWin';

    // Award score
    this.score += GBR.ACT4.roundValue;
    GBR.state.totalDollars += GBR.ACT4.roundValue;
    GBR.state.actScores[3] = this.score;

    // Emit HUD update
    this.game.events.emit('hud:dollars', GBR.state.totalDollars);

    // Update score text
    this.scoreText.setText('SCORE: ' + this.score);

    // Play success jingle
    AudioSynth.playSuccess();

    // Camera flash
    TransitionHelper.flash(this, 300);

    // "YEAH!" text
    this.showInstruction('YEAH!', '#ffd700');

    // Bounce the instruction text
    this.tweens.add({
      targets: this.instructionText,
      scaleX: { from: 1, to: 1.4 },
      scaleY: { from: 1, to: 1.4 },
      duration: 300,
      yoyo: true,
      repeat: 1,
      ease: 'Back.easeOut'
    });

    // Gold star celebration particles
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var celebEmitter = this.add.particles(width / 2, height / 2, 'star', {
      speed: { min: 80, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      lifespan: 1200,
      quantity: 15,
      tint: [0xffd700, 0xe8751a, 0x2ecc71, 0xffffff]
    });
    this.time.delayedCall(500, function () {
      celebEmitter.stop();
    });
    this.time.delayedCall(1800, function () {
      celebEmitter.destroy();
    });

    // "ROUND COMPLETE!" sub-text
    var roundCompleteText = this.add.text(width / 2, height / 2 - 120, 'ROUND COMPLETE!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '24px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: roundCompleteText,
      alpha: 1,
      y: roundCompleteText.y - 20,
      duration: 400,
      ease: 'Back.easeOut'
    });

    // "+100" floating text
    var plusText = this.add.text(width / 2, height / 2 - 80, '+' + GBR.ACT4.roundValue + ' $', {
      fontFamily: GBR.FONTS.display,
      fontSize: '22px',
      color: '#32cd32',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: plusText,
      alpha: 1,
      y: plusText.y - 30,
      duration: 600,
      onComplete: function () {
        self.tweens.add({
          targets: plusText,
          alpha: 0,
          duration: 400,
          delay: 400
        });
      }
    });

    // Check if game is won
    if (this.currentRound >= GBR.ACT4.maxRounds) {
      this.time.delayedCall(1800, function () {
        roundCompleteText.destroy();
        self.onGameWin();
      });
    } else {
      // Advance to next round
      this.time.delayedCall(2000, function () {
        roundCompleteText.destroy();
        self.nextRound();
      });
    }
  },

  nextRound: function () {
    var self = this;
    this.currentRound++;
    this.retriesUsed = 0;

    // Add one more note to the pattern
    PatternEngine.addToPattern(this.engine);
    PatternEngine.resetInput(this.engine);

    // Update round display
    this.updateRoundDisplay();

    this.showInstruction('ROUND ' + this.currentRound + '!', '#ffd700');

    this.time.delayedCall(1000, function () {
      self.showInstruction('WATCH!', '#ffd700');
      self.time.delayedCall(500, function () {
        self.startPlayback();
      });
    });
  },

  // =================== WIN ===================
  onGameWin: function () {
    var self = this;
    this.gameState = 'win';
    this.inputLocked = true;
    this.stopDrumGlow();

    // Disable drum interactivity so they don't block the CONTINUE button
    for (var di = 0; di < this.drums.length; di++) {
      this.drums[di].image.disableInteractive();
    }

    var width = this.cameras.main.width;
    var height = this.cameras.main.height;

    // Big flash
    TransitionHelper.flash(this, 500);

    // "YOU GOT THE BEAT!" text
    this.showInstruction('YOU GOT THE BEAT!', '#ffd700');

    this.tweens.add({
      targets: this.instructionText,
      scaleX: { from: 0.5, to: 1.3 },
      scaleY: { from: 0.5, to: 1.3 },
      duration: 600,
      ease: 'Back.easeOut',
      onComplete: function () {
        // Gentle pulse
        self.tweens.add({
          targets: self.instructionText,
          scaleX: { from: 1.3, to: 1.15 },
          scaleY: { from: 1.3, to: 1.15 },
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });

    // Massive particle explosion from each drum
    for (var d = 0; d < this.drums.length; d++) {
      (function (index) {
        var drum = self.drums[index];
        var bigEmitter = self.add.particles(drum.x, drum.y, 'star', {
          speed: { min: 100, max: 300 },
          angle: { min: 0, max: 360 },
          scale: { start: 2, end: 0 },
          lifespan: 1500,
          quantity: 20,
          tint: [self.drumColors[index], 0xffd700, 0xffffff]
        });
        self.time.delayedCall(800, function () {
          bigEmitter.stop();
        });
        self.time.delayedCall(2500, function () {
          bigEmitter.destroy();
        });
      })(d);
    }

    // Center screen particle shower
    var showerEmitter = this.add.particles(width / 2, 0, 'particle', {
      speed: { min: 30, max: 100 },
      angle: { min: 60, max: 120 },
      scale: { start: 1.5, end: 0 },
      lifespan: 2500,
      frequency: 30,
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-width / 2, 0, width, 10) },
      tint: [0xffd700, 0xe63946, 0x3498db, 0x2ecc71, 0xe8751a]
    });

    this.time.delayedCall(2500, function () {
      showerEmitter.stop();
    });

    // Play success jingle
    AudioSynth.playSuccess();

    // "JIMMY CARNEY FOUND!" text appears
    var foundText = this.add.text(width / 2, height - 140, 'JIMMY CARNEY FOUND!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '28px',
      color: '#2ecc71',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: foundText,
      alpha: 1,
      y: foundText.y - 15,
      duration: 600,
      delay: 800,
      ease: 'Back.easeOut'
    });

    // Emit HUD events for member found and act complete
    // Use setTimeout to avoid throttling in background tabs
    setTimeout(function () {
      if (!self.scene.isActive()) return;
      self.game.events.emit('hud:memberFound', 3);
      self.game.events.emit('hud:actComplete', 3);
    }, 500);

    // Continue button after celebration
    // Use setTimeout instead of this.time.delayedCall to avoid throttling in background tabs
    setTimeout(function () {
      if (!self.scene.isActive()) return;
      var btn = createButton(self, width / 2, height - 55, 'CONTINUE', function () {
        self.scene.stop('HUDScene');
        TransitionHelper.fadeToScene(self, 'OutfitScene', {
          memberIndex: 3,
          nextScene: 'StoryScene',
          nextData: { actNumber: 4, nextScene: 'Act5PianoScene' }
        });
      }, {
        bgColor: 0x2ecc71,
        width: 220,
        height: 54,
        fontSize: '26px'
      });

      // Pulse the button
      self.tweens.add({
        targets: btn.text,
        scaleX: { from: 1, to: 1.08 },
        scaleY: { from: 1, to: 1.08 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }, 2500);
  },

  // =================== UI HELPERS ===================
  showInstruction: function (text, color) {
    if (this.instructionText) {
      this.instructionText.setText(text);
      this.instructionText.setColor(color || '#ffffff');
      // Reset scale in case a tween left it scaled
      this.instructionText.setScale(1);
    }
  },

  updateRoundDisplay: function () {
    if (this.roundText) {
      this.roundText.setText('ROUND ' + this.currentRound + '/' + GBR.ACT4.maxRounds);
    }
    if (this.scoreText) {
      this.scoreText.setText('SCORE: ' + this.score);
    }
  },

  updatePatternDots: function () {
    // Clear existing dots
    this.patternDotsContainer.removeAll(true);
    this.patternDots = [];

    var patternLength = PatternEngine.getPatternLength(this.engine);
    var pattern = PatternEngine.getPattern(this.engine);
    var dotSize = 10;
    var dotSpacing = 26;
    var startX = -((patternLength - 1) * dotSpacing) / 2;

    for (var i = 0; i < patternLength; i++) {
      var drumIdx = pattern[i];
      var dot = this.add.circle(startX + i * dotSpacing, 0, dotSize, this.drumColors[drumIdx], 0.4);
      dot.setStrokeStyle(2, this.drumColors[drumIdx], 0.7);
      this.patternDotsContainer.add(dot);
      this.patternDots.push(dot);
    }
  },

  highlightPatternDot: function (index) {
    if (index < 0 || index >= this.patternDots.length) return;
    var dot = this.patternDots[index];
    var self = this;

    // Briefly make the dot fully bright
    this.tweens.add({
      targets: dot,
      fillAlpha: 1,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: function () {
        dot.setScale(1);
      }
    });
  },

  completePatternDot: function (index) {
    if (index < 0 || index >= this.patternDots.length) return;
    var dot = this.patternDots[index];

    // Mark as completed (full brightness + white stroke)
    dot.setFillStyle(dot.fillColor, 1);
    dot.setStrokeStyle(2, 0xffffff, 1);

    this.tweens.add({
      targets: dot,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 150,
      yoyo: true,
      ease: 'Back.easeOut'
    });
  },

  resetPatternDots: function () {
    // Reset all dots to dim state
    for (var i = 0; i < this.patternDots.length; i++) {
      var dot = this.patternDots[i];
      dot.setFillStyle(dot.fillColor, 0.4);
      dot.setStrokeStyle(2, dot.fillColor, 0.7);
      dot.setScale(1);
    }
  },

  update: function () {
    // No per-frame logic needed; all timing is handled via delayedCall and tweens
  }
});
