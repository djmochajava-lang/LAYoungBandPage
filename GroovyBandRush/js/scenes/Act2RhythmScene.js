/* GroovyBandRush/js/scenes/Act2RhythmScene.js */

var Act2RhythmScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Act2RhythmScene() {
    Phaser.Scene.call(this, { key: 'Act2RhythmScene' });
  },

  create: function () {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;
    var cfg = GBR.ACT2;

    // Resume audio context for mobile
    AudioSynth.resume();

    // Launch HUD overlay
    if (!this.scene.isActive('HUDScene')) {
      this.scene.launch('HUDScene');
    }
    this.game.events.emit('hud:refresh');

    // --- State ---
    this.gameState = 'intro';  // intro | playing | roundComplete | win
    this.currentRound = 0;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.activeNotes = [];      // notes currently falling
    this.noteIndex = 0;         // index into current round's sequence
    this.spawnTimers = [];      // delayed calls for spawning notes
    this.inputLocked = false;

    // --- Lane Configuration ---
    // 4 lanes evenly spread across center of the screen
    this.laneColors = [0xe63946, 0x3498db, 0x2ecc71, 0xffd700];  // red, blue, green, yellow
    this.laneColorHex = ['#e63946', '#3498db', '#2ecc71', '#ffd700'];
    this.laneKeys = ['\u2190', '\u2193', '\u2191', '\u2192'];  // Arrow key symbols
    this.laneNotes = [GBR.NOTES.C4, GBR.NOTES.E4, GBR.NOTES.G4, GBR.NOTES.B4];
    this.laneWidth = Math.min(100, Math.floor((width - 40) / cfg.lanes));
    this.laneSpacing = Math.min(120, Math.floor((width - 20) / cfg.lanes));
    this.laneStartX = (width - (cfg.lanes - 1) * this.laneSpacing) / 2;

    // Hit zone dimensions (generous for kids)
    this.hitZoneY = height - 100;
    this.hitZoneHeight = 80;
    this.hitZoneTop = this.hitZoneY - this.hitZoneHeight / 2;
    this.hitZoneBottom = this.hitZoneY + this.hitZoneHeight / 2;

    // --- Pre-defined Note Sequences ---
    this.roundSequences = this.buildRoundSequences();
    this.roundFallDurations = [3000, 2500, 2000];

    // --- Draw Background ---
    this.drawBackground(width, height);

    // --- Draw Lanes ---
    this.laneGraphics = [];
    this.hitZoneGraphics = [];
    this.hitZoneGlows = [];
    this.laneLabels = [];

    for (var i = 0; i < cfg.lanes; i++) {
      var laneX = this.laneStartX + i * this.laneSpacing;

      // Lane column background strip
      var laneStrip = this.add.graphics();
      laneStrip.fillStyle(this.laneColors[i], 0.08);
      laneStrip.fillRect(laneX - this.laneWidth / 2, 0, this.laneWidth, height);
      this.laneGraphics.push(laneStrip);

      // Lane divider lines (subtle neon)
      var laneLine = this.add.graphics();
      laneLine.lineStyle(1, this.laneColors[i], 0.2);
      laneLine.strokeRect(laneX - this.laneWidth / 2, 0, this.laneWidth, height);

      // Hit zone glow (pulsing aura behind hit zone)
      var glow = this.add.graphics();
      glow.fillStyle(this.laneColors[i], 0.15);
      glow.fillRoundedRect(
        laneX - this.laneWidth / 2 - 4,
        this.hitZoneTop - 4,
        this.laneWidth + 8,
        this.hitZoneHeight + 8,
        12
      );
      this.hitZoneGlows.push(glow);

      // Hit zone rectangle
      var hitZone = this.add.graphics();
      hitZone.fillStyle(this.laneColors[i], 0.3);
      hitZone.fillRoundedRect(
        laneX - this.laneWidth / 2,
        this.hitZoneTop,
        this.laneWidth,
        this.hitZoneHeight,
        8
      );
      hitZone.lineStyle(3, this.laneColors[i], 0.8);
      hitZone.strokeRoundedRect(
        laneX - this.laneWidth / 2,
        this.hitZoneTop,
        this.laneWidth,
        this.hitZoneHeight,
        8
      );
      this.hitZoneGraphics.push(hitZone);

      // Key label below hit zone
      var keyLabel = this.add.text(laneX, this.hitZoneBottom + 16, this.laneKeys[i], {
        fontFamily: GBR.FONTS.display,
        fontSize: '24px',
        color: this.laneColorHex[i],
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      this.laneLabels.push(keyLabel);
    }

    // Pulse animation on hit zone glows
    this.tweens.add({
      targets: this.hitZoneGlows,
      alpha: { from: 0.6, to: 1.0 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // --- Score display ---
    this.scoreText = this.add.text(width / 2, 20, '$0', {
      fontFamily: GBR.FONTS.display,
      fontSize: '32px',
      color: '#32cd32',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // --- Round display ---
    this.roundText = this.add.text(width / 2, 52, 'ROUND 1 / 3', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '16px',
      color: '#ffd700'
    }).setOrigin(0.5);

    // --- Streak display ---
    this.streakText = this.add.text(width - 20, 20, '', {
      fontFamily: GBR.FONTS.display,
      fontSize: '20px',
      color: '#e84393',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 0);

    // --- Global pointer input - detect which lane was tapped ---
    // Uses scene-level pointerdown so nothing can block it
    this.touchZones = [];  // keep empty array for win-state disable compatibility
    this.input.on('pointerdown', function (pointer) {
      AudioSynth.resume();
      // Convert pointer position to lane index
      var px = pointer.x;
      var bestLane = 0;
      var bestDist = Infinity;
      for (var li = 0; li < cfg.lanes; li++) {
        var laneX = self.laneStartX + li * self.laneSpacing;
        var d = Math.abs(px - laneX);
        if (d < bestDist) {
          bestDist = d;
          bestLane = li;
        }
      }
      self.onLaneTap(bestLane);
    });

    // --- Keyboard Input (only if keyboard is available - not on mobile) ---
    if (this.input.keyboard) {
      var keyMap = [
        { code: 'D', lane: 0 }, { code: 'F', lane: 1 },
        { code: 'J', lane: 2 }, { code: 'K', lane: 3 },
        { code: 'ONE', lane: 0 }, { code: 'TWO', lane: 1 },
        { code: 'THREE', lane: 2 }, { code: 'FOUR', lane: 3 },
        { code: 'LEFT', lane: 0 }, { code: 'DOWN', lane: 1 },
        { code: 'UP', lane: 2 }, { code: 'RIGHT', lane: 3 },
        { code: 'A', lane: 0 }, { code: 'S', lane: 1 },
        { code: 'L', lane: 3 }
      ];
      for (var km = 0; km < keyMap.length; km++) {
        (function (mapping) {
          var keyCode = Phaser.Input.Keyboard.KeyCodes[mapping.code];
          if (keyCode !== undefined) {
            var key = self.input.keyboard.addKey(keyCode);
            key.on('down', function () { self.onLaneTap(mapping.lane); });
          }
        })(keyMap[km]);
      }
    }

    // --- Fade In ---
    TransitionHelper.fadeIn(this, 500);

    // --- Start Intro Countdown ---
    this.startIntro(width, height);
  },

  /* =========================================================
     BACKGROUND
     ========================================================= */
  drawBackground: function (width, height) {
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a1a3e, 0x1a1a3e);
    bg.fillRect(0, 0, width, height);

    // Subtle grid lines for futuristic feel
    var gridLines = this.add.graphics();
    gridLines.lineStyle(1, 0x3333aa, 0.06);
    for (var gy = 0; gy < height; gy += 40) {
      gridLines.lineBetween(0, gy, width, gy);
    }
    for (var gx = 0; gx < width; gx += 40) {
      gridLines.lineBetween(gx, 0, gx, height);
    }

    // Decorative top bar
    var topBar = this.add.graphics();
    topBar.fillStyle(0xffd700, 0.1);
    topBar.fillRect(0, 0, width, 4);
  },

  /* =========================================================
     ROUND SEQUENCES
     ========================================================= */
  buildRoundSequences: function () {
    // Round 1: Simple single notes, well-spaced
    var round1 = [
      { lane: 0, delay: 0 },
      { lane: 1, delay: 600 },
      { lane: 2, delay: 600 },
      { lane: 3, delay: 600 },
      { lane: 1, delay: 700 },
      { lane: 0, delay: 700 },
      { lane: 3, delay: 600 },
      { lane: 2, delay: 600 },
      { lane: 0, delay: 800 },
      { lane: 2, delay: 700 },
      { lane: 1, delay: 600 },
      { lane: 3, delay: 700 },
      { lane: 0, delay: 600 },
      { lane: 1, delay: 700 },
      { lane: 2, delay: 600 },
      { lane: 3, delay: 600 }
    ];

    // Round 2: Some simultaneous notes (delay=0 means same time as previous)
    var round2 = [
      { lane: 0, delay: 0 },
      { lane: 2, delay: 0 },     // simultaneous with lane 0
      { lane: 1, delay: 600 },
      { lane: 3, delay: 500 },
      { lane: 0, delay: 600 },
      { lane: 1, delay: 0 },     // simultaneous
      { lane: 2, delay: 500 },
      { lane: 3, delay: 500 },
      { lane: 0, delay: 600 },
      { lane: 3, delay: 0 },     // simultaneous
      { lane: 1, delay: 500 },
      { lane: 2, delay: 500 },
      { lane: 0, delay: 500 },
      { lane: 1, delay: 500 },
      { lane: 2, delay: 0 },     // simultaneous
      { lane: 3, delay: 500 }
    ];

    // Round 3: Faster, denser patterns
    var round3 = [
      { lane: 0, delay: 0 },
      { lane: 1, delay: 400 },
      { lane: 2, delay: 400 },
      { lane: 3, delay: 400 },
      { lane: 1, delay: 350 },
      { lane: 0, delay: 0 },     // simultaneous
      { lane: 3, delay: 350 },
      { lane: 2, delay: 0 },     // simultaneous
      { lane: 0, delay: 400 },
      { lane: 1, delay: 350 },
      { lane: 2, delay: 350 },
      { lane: 3, delay: 350 },
      { lane: 0, delay: 0 },     // simultaneous
      { lane: 2, delay: 0 },     // triple!
      { lane: 1, delay: 400 },
      { lane: 3, delay: 400 }
    ];

    return [round1, round2, round3];
  },

  /* =========================================================
     INTRO COUNTDOWN
     ========================================================= */
  startIntro: function (width, height) {
    var self = this;
    var countTexts = ['3', '2', '1', 'GO!'];
    var countColors = ['#e63946', '#ffd700', '#2ecc71', '#ffffff'];
    var delay = 0;

    for (var c = 0; c < countTexts.length; c++) {
      (function (idx) {
        self.time.delayedCall(delay + idx * 800, function () {
          var countText = self.add.text(width / 2, height / 2 - 40, countTexts[idx], {
            fontFamily: GBR.FONTS.display,
            fontSize: idx === 3 ? '72px' : '80px',
            color: countColors[idx],
            stroke: '#000000',
            strokeThickness: 4
          }).setOrigin(0.5).setAlpha(0).setScale(2);

          self.tweens.add({
            targets: countText,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: function () {
              self.tweens.add({
                targets: countText,
                alpha: 0,
                scaleX: 0.5,
                scaleY: 0.5,
                duration: 300,
                delay: 200,
                onComplete: function () {
                  countText.destroy();
                }
              });
            }
          });

          // Play a beep for each count
          if (idx < 3) {
            AudioSynth.playNote(440, 0.15, 'square', 0.2);
          } else {
            AudioSynth.playNote(880, 0.3, 'square', 0.3);
          }
        });
      })(c);
    }

    // Show instruction text during countdown
    var instructionText = this.add.text(width / 2, height / 2 + 40, 'TAP the colored lanes!', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '20px',
      color: '#e8751a',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: instructionText,
      alpha: 1,
      duration: 400,
      delay: 600
    });

    // After countdown, start playing
    this.time.delayedCall(countTexts.length * 800 + 200, function () {
      // Fade out instruction
      self.tweens.add({
        targets: instructionText,
        alpha: 0,
        duration: 400,
        onComplete: function () { instructionText.destroy(); }
      });
      self.gameState = 'playing';
      self.startRound(0);
    });
  },

  /* =========================================================
     ROUND MANAGEMENT
     ========================================================= */
  startRound: function (roundIndex) {
    var self = this;
    var width = this.cameras.main.width;
    this.currentRound = roundIndex;
    this.noteIndex = 0;

    // Update round display
    this.roundText.setText('ROUND ' + (roundIndex + 1) + ' / 3');

    // Brief round announcement
    var roundAnnounce = this.add.text(width / 2, 120, 'ROUND ' + (roundIndex + 1), {
      fontFamily: GBR.FONTS.display,
      fontSize: '48px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: roundAnnounce,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: function () {
        self.tweens.add({
          targets: roundAnnounce,
          alpha: 0,
          y: 80,
          duration: 600,
          delay: 400,
          onComplete: function () {
            roundAnnounce.destroy();
          }
        });
      }
    });

    // Schedule all notes for this round
    var sequence = this.roundSequences[roundIndex];
    var cumulativeDelay = 800; // initial delay after round announcement

    for (var n = 0; n < sequence.length; n++) {
      cumulativeDelay += sequence[n].delay;
      (function (noteData, spawnDelay) {
        var timer = self.time.delayedCall(spawnDelay, function () {
          if (self.gameState === 'playing') {
            self.spawnNote(noteData.lane);
          }
        });
        self.spawnTimers.push(timer);
      })(sequence[n], cumulativeDelay);
    }

    // After all notes have been spawned + enough time for them to fall,
    // check if round is complete
    var fallDur = this.roundFallDurations[roundIndex];
    var totalSpawnTime = cumulativeDelay + fallDur + 500;
    this.time.delayedCall(totalSpawnTime, function () {
      if (self.gameState === 'playing') {
        self.onRoundComplete();
      }
    });
  },

  /* =========================================================
     NOTE SPAWNING
     ========================================================= */
  spawnNote: function (laneIndex) {
    var self = this;
    var laneX = this.laneStartX + laneIndex * this.laneSpacing;
    var fallDuration = this.roundFallDurations[this.currentRound];
    var startY = -30;
    var endY = this.cameras.main.height + 40;

    // Create note container
    var noteSprite = this.add.image(laneX, startY, 'note')
      .setTint(this.laneColors[laneIndex])
      .setScale(1.2);

    // Add a music note symbol on top
    var noteSymbol = this.add.text(laneX, startY, '\u266A', {
      fontFamily: GBR.FONTS.display,
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);

    // Small glow behind the note
    var noteGlow = this.add.graphics();
    noteGlow.fillStyle(this.laneColors[laneIndex], 0.3);
    noteGlow.fillCircle(0, 0, 30);
    noteGlow.setPosition(laneX, startY);

    // Note data object
    var noteObj = {
      sprite: noteSprite,
      symbol: noteSymbol,
      glow: noteGlow,
      lane: laneIndex,
      hit: false,
      missed: false
    };

    this.activeNotes.push(noteObj);

    // Tween the note falling - only target the sprite, sync others manually
    var fallTween = this.tweens.add({
      targets: noteSprite,
      y: endY,
      duration: fallDuration,
      ease: 'Linear',
      onUpdate: function () {
        if (noteObj.destroyed) return;

        // Keep symbol and glow in sync with sprite position
        if (noteSymbol && noteSymbol.scene) {
          noteSymbol.y = noteSprite.y;
        }
        if (noteGlow && noteGlow.scene) {
          noteGlow.setPosition(noteSprite.x, noteSprite.y);
        }

        // Check if note passed the hit zone without being hit
        if (!noteObj.hit && !noteObj.missed && noteSprite.y > self.hitZoneBottom + 20) {
          noteObj.missed = true;
          self.onNoteMiss(noteObj);
        }
      },
      onComplete: function () {
        self.destroyNote(noteObj);
      }
    });

    noteObj.tween = fallTween;

    // Gentle pulse on the note
    this.tweens.add({
      targets: noteSprite,
      scaleX: { from: 1.2, to: 1.35 },
      scaleY: { from: 1.2, to: 1.35 },
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  },

  /* =========================================================
     INPUT HANDLING
     ========================================================= */
  onLaneTap: function (laneIndex) {
    if (this.gameState !== 'playing' || this.inputLocked) return;

    AudioSynth.resume();

    // Flash the hit zone to show the tap registered
    this.flashHitZone(laneIndex);

    // Find the closest visible note in this lane (anywhere on screen)
    // Kid-friendly: any tap on the right lane counts as a hit
    var bestNote = null;
    var bestDist = Infinity;

    for (var i = 0; i < this.activeNotes.length; i++) {
      var note = this.activeNotes[i];
      if (note.lane === laneIndex && !note.hit && !note.missed && !note.destroyed) {
        if (note.sprite && note.sprite.scene) {
          var noteY = note.sprite.y;
          // Accept any note that has appeared on screen (y > 0)
          if (noteY > 0) {
            var dist = Math.abs(noteY - this.hitZoneY);
            if (dist < bestDist) {
              bestDist = dist;
              bestNote = note;
            }
          }
        }
      }
    }

    if (bestNote) {
      this.onNoteHit(bestNote, laneIndex);
    } else {
      // No note in range - show visual "miss" feedback so player knows tap registered
      AudioSynth.playNote(this.laneNotes[laneIndex], 0.1, 'sine', 0.1);
      // Show a small "X" at the hit zone to confirm tap was detected
      var laneX = this.laneStartX + laneIndex * this.laneSpacing;
      var missText = this.add.text(laneX, this.hitZoneY, 'X', {
        fontFamily: GBR.FONTS.display,
        fontSize: '24px',
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      this.tweens.add({
        targets: missText,
        alpha: 0,
        y: this.hitZoneY - 30,
        duration: 400,
        onComplete: function () { missText.destroy(); }
      });
    }
  },

  /* =========================================================
     HIT / MISS HANDLERS
     ========================================================= */
  onNoteHit: function (noteObj, laneIndex) {
    if (noteObj.destroyed || noteObj.hit) return;
    var self = this;
    var cfg = GBR.ACT2;
    noteObj.hit = true;

    // Play the lane's musical note
    AudioSynth.playNote(this.laneNotes[laneIndex], 0.3, 'triangle', 0.4);

    // Award score
    this.score += cfg.correctValue;
    GBR.state.totalDollars += cfg.correctValue;
    this.game.events.emit('hud:dollars', GBR.state.totalDollars);
    this.updateScoreDisplay();

    // Streak
    this.streak++;
    if (this.streak > this.bestStreak) {
      this.bestStreak = this.streak;
    }

    // Show floating "GREAT!" text
    var hitX = noteObj.sprite.x;
    var hitY = noteObj.sprite.y;

    var hitLabel = 'GREAT!';
    var hitColor = '#2ecc71';
    var hitFontSize = '28px';

    // Check for streak bonus
    if (this.streak > 0 && this.streak % cfg.streakTarget === 0) {
      this.score += cfg.streakBonus;
      GBR.state.totalDollars += cfg.streakBonus;
      this.game.events.emit('hud:dollars', GBR.state.totalDollars);
      this.updateScoreDisplay();

      hitLabel = 'COMBO! +$' + cfg.streakBonus;
      hitColor = '#e84393';
      hitFontSize = '32px';

      // Extra celebration flash
      TransitionHelper.flash(this, 150);
      AudioSynth.playCollect();
    }

    // Streak counter display
    if (this.streak >= 2) {
      this.streakText.setText(this.streak + 'x STREAK!');
      this.tweens.add({
        targets: this.streakText,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 100,
        yoyo: true
      });
    }

    // Floating hit text
    var floatText = this.add.text(hitX, hitY - 20, hitLabel, {
      fontFamily: GBR.FONTS.display,
      fontSize: hitFontSize,
      color: hitColor,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: floatText,
      y: hitY - 80,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 800,
      ease: 'Power2',
      onComplete: function () {
        floatText.destroy();
      }
    });

    // --- Explode the note visually before destroying ---
    // Stop the fall tween so note freezes in place
    if (noteObj.tween) {
      noteObj.tween.stop();
      noteObj.tween = null;
    }

    // Scale up + fade out the note sprite for a "pop" effect
    if (noteObj.sprite && noteObj.sprite.scene) {
      this.tweens.add({
        targets: noteObj.sprite,
        scaleX: 2.5,
        scaleY: 2.5,
        alpha: 0,
        duration: 250,
        ease: 'Power2'
      });
    }
    if (noteObj.symbol && noteObj.symbol.scene) {
      this.tweens.add({
        targets: noteObj.symbol,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 250,
        ease: 'Power2'
      });
    }
    if (noteObj.glow && noteObj.glow.scene) {
      this.tweens.add({
        targets: noteObj.glow,
        alpha: 0,
        duration: 150
      });
    }

    // Big bright flash circle at hit point
    var flashCircle = this.add.circle(hitX, hitY, 20, this.laneColors[laneIndex], 1);
    this.tweens.add({
      targets: flashCircle,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 350,
      ease: 'Power2',
      onComplete: function () { flashCircle.destroy(); }
    });

    // Particle explosion at the note's position (bigger and more visible)
    var emitter = this.add.particles(hitX, hitY, 'particle', {
      speed: { min: 120, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 2.5, end: 0 },
      lifespan: 700,
      quantity: 18,
      tint: [this.laneColors[laneIndex], 0xffd700, 0xffffff],
      emitting: false
    });
    emitter.explode(18);

    // Star burst
    var starEmitter = this.add.particles(hitX, hitY, 'star', {
      speed: { min: 60, max: 180 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      lifespan: 900,
      quantity: 10,
      tint: [0xffd700, this.laneColors[laneIndex]],
      emitting: false
    });
    starEmitter.explode(10);

    // Clean up emitters after they're done
    this.time.delayedCall(1200, function () {
      emitter.destroy();
      starEmitter.destroy();
    });

    // Dollar float text
    var dollarFloat = this.add.text(hitX + 25, hitY, '+$' + cfg.correctValue, {
      fontFamily: GBR.FONTS.display,
      fontSize: '20px',
      color: '#32cd32',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: dollarFloat,
      y: hitY - 60,
      alpha: 0,
      duration: 700,
      onComplete: function () {
        dollarFloat.destroy();
      }
    });

    // Destroy the note data after the pop animation finishes
    this.time.delayedCall(300, function () {
      self.destroyNote(noteObj);
    });
  },

  onNoteMiss: function (noteObj) {
    // No penalty (kid-friendly!) - just fade out the note
    var self = this;

    // Reset streak silently
    this.streak = 0;
    this.streakText.setText('');

    // Fade out the note gently
    if (noteObj.sprite && noteObj.sprite.scene) {
      this.tweens.add({
        targets: noteObj.sprite,
        alpha: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 300
      });
    }

    if (noteObj.symbol && noteObj.symbol.scene) {
      this.tweens.add({
        targets: noteObj.symbol,
        alpha: 0,
        duration: 300
      });
    }

    if (noteObj.glow && noteObj.glow.scene) {
      this.tweens.add({
        targets: noteObj.glow,
        alpha: 0,
        duration: 300
      });
    }

    // Destroy after fade completes
    this.time.delayedCall(350, function () {
      self.destroyNote(noteObj);
    });
  },

  /* =========================================================
     NOTE CLEANUP
     ========================================================= */
  destroyNote: function (noteObj) {
    // Guard against double-destroy
    if (noteObj.destroyed) return;
    noteObj.destroyed = true;

    if (noteObj.tween) {
      noteObj.tween.stop();
      noteObj.tween = null;
    }
    if (noteObj.sprite && noteObj.sprite.scene) {
      noteObj.sprite.destroy();
    }
    if (noteObj.symbol && noteObj.symbol.scene) {
      noteObj.symbol.destroy();
    }
    if (noteObj.glow && noteObj.glow.scene) {
      noteObj.glow.destroy();
    }

    // Remove from active notes array
    var idx = this.activeNotes.indexOf(noteObj);
    if (idx !== -1) {
      this.activeNotes.splice(idx, 1);
    }
  },

  /* =========================================================
     HIT ZONE FLASH
     ========================================================= */
  flashHitZone: function (laneIndex) {
    var laneX = this.laneStartX + laneIndex * this.laneSpacing;
    var flash = this.add.graphics();
    flash.fillStyle(this.laneColors[laneIndex], 0.5);
    flash.fillRoundedRect(
      laneX - this.laneWidth / 2,
      this.hitZoneTop,
      this.laneWidth,
      this.hitZoneHeight,
      8
    );

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: function () {
        flash.destroy();
      }
    });
  },

  /* =========================================================
     SCORE DISPLAY
     ========================================================= */
  updateScoreDisplay: function () {
    this.scoreText.setText('$' + this.score);
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true
    });
  },

  /* =========================================================
     ROUND COMPLETE
     ========================================================= */
  onRoundComplete: function () {
    var self = this;
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;

    // Clean up any remaining notes
    var remaining = this.activeNotes.slice();
    for (var r = 0; r < remaining.length; r++) {
      this.destroyNote(remaining[r]);
    }
    this.activeNotes = [];

    // Clear any pending spawn timers
    for (var t = 0; t < this.spawnTimers.length; t++) {
      if (this.spawnTimers[t]) {
        this.spawnTimers[t].remove(false);
      }
    }
    this.spawnTimers = [];

    if (this.currentRound < 2) {
      // More rounds to go
      this.gameState = 'roundComplete';

      var completeText = this.add.text(width / 2, height / 2 - 40, 'ROUND ' + (this.currentRound + 1) + ' COMPLETE!', {
        fontFamily: GBR.FONTS.display,
        fontSize: '42px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setAlpha(0).setScale(0.5);

      this.tweens.add({
        targets: completeText,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 500,
        ease: 'Back.easeOut'
      });

      AudioSynth.playSuccess();
      TransitionHelper.flash(this, 200);

      // Brief pause then start next round
      this.time.delayedCall(2000, function () {
        self.tweens.add({
          targets: completeText,
          alpha: 0,
          duration: 300,
          onComplete: function () {
            completeText.destroy();
          }
        });

        self.gameState = 'playing';
        self.startRound(self.currentRound + 1);
      });
    } else {
      // All 3 rounds complete - WIN!
      this.onWin();
    }
  },

  /* =========================================================
     WIN CELEBRATION
     ========================================================= */
  onWin: function () {
    var self = this;
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    this.gameState = 'win';

    // Remove global pointer handler so it doesn't interfere with CONTINUE button
    this.input.off('pointerdown');

    // Save act score
    GBR.state.actScores[1] = this.score;

    // Emit HUD events
    this.game.events.emit('hud:dollars', GBR.state.totalDollars);
    this.game.events.emit('hud:memberFound', 1);
    this.game.events.emit('hud:actComplete', 1);

    AudioSynth.playSuccess();
    TransitionHelper.flash(this, 300);

    // Big celebration text
    var winText = this.add.text(width / 2, height * 0.25, 'AMAZING!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '64px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setAlpha(0).setScale(0.3);

    this.tweens.add({
      targets: winText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Back.easeOut'
    });

    // Score summary
    var summaryText = this.add.text(width / 2, height * 0.38, 'You earned $' + this.score + '!', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '24px',
      color: '#2ecc71',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: summaryText,
      alpha: 1,
      duration: 400,
      delay: 400
    });

    // Kevin Walker (bassist) appears!
    var member = GBR.BAND[1]; // Kevin Walker
    var portrait = this.add.image(width / 2, height * 0.55, 'member_1')
      .setScale(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: portrait,
      alpha: 1,
      scaleX: 3,
      scaleY: 3,
      duration: 600,
      delay: 800,
      ease: 'Back.easeOut'
    });

    var memberNameText = this.add.text(width / 2, height * 0.68, member.name + ' - ' + member.role, {
      fontFamily: GBR.FONTS.display,
      fontSize: '22px',
      color: member.colorHex,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: memberNameText,
      alpha: 1,
      duration: 400,
      delay: 1200
    });

    var foundText = this.add.text(width / 2, height * 0.73, 'BAND MEMBER FOUND!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '18px',
      color: '#ffd700'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: foundText,
      alpha: 1,
      duration: 400,
      delay: 1400
    });

    // Celebration particles
    var celebEmitter = this.add.particles(width / 2, height * 0.5, 'star', {
      speed: { min: 50, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      lifespan: 1500,
      frequency: 100,
      tint: [0xffd700, member.color, 0xe84393, 0x2ecc71, 0xffffff]
    });

    this.time.delayedCall(3000, function () {
      celebEmitter.stop();
    });

    // Continue button after a moment
    // Use setTimeout instead of this.time.delayedCall to avoid throttling in background tabs
    setTimeout(function () {
      if (!self.scene.isActive()) return;
      createButton(self, width / 2, height * 0.88, 'CONTINUE', function () {
        self.scene.stop('HUDScene');
        TransitionHelper.fadeToScene(self, 'OutfitScene', {
          memberIndex: 1,
          nextScene: 'StoryScene',
          nextData: { actNumber: 2, nextScene: 'Act3MatchScene' }
        });
      }, {
        bgColor: 0x2ecc71,
        width: 220,
        height: 56,
        fontSize: '28px'
      });

      // Also allow pressing any key to continue
      if (self.input.keyboard) {
        self.input.keyboard.once('keydown', function () {
          self.scene.stop('HUDScene');
          TransitionHelper.fadeToScene(self, 'OutfitScene', {
            memberIndex: 1,
            nextScene: 'StoryScene',
            nextData: { actNumber: 2, nextScene: 'Act3MatchScene' }
          });
        });
      }
    }, 2000);
  },

  /* =========================================================
     UPDATE LOOP
     ========================================================= */
  update: function () {
    // The game mostly runs on tweens and events.
    // The update loop is kept minimal for performance.
  }
});
