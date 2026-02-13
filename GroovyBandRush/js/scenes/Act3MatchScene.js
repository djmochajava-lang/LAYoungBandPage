/* GroovyBandRush/js/scenes/Act3MatchScene.js */

var Act3MatchScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Act3MatchScene() {
    Phaser.Scene.call(this, { key: 'Act3MatchScene' });
  },

  create: function () {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;
    var cfg = GBR.ACT3;

    // --- State ---
    this.grid = null;           // 2D array of tile types (numbers)
    this.tiles = null;          // 2D array of Phaser sprites
    this.selectedTile = null;   // { r, c } of currently selected tile
    this.selectBorder = null;   // graphics object for selection highlight
    this.isAnimating = false;   // lock input during animations
    this.actScore = 0;          // score earned in this act
    this.comboCount = 0;        // consecutive cascade rounds in one chain
    this.lastInputTime = 0;     // timestamp for hint timer
    this.hintTween = null;      // active hint tween (to cancel)
    this.hintSparkle = null;    // active hint emitter
    this.won = false;           // prevent double-win

    // --- Grid layout ---
    this.tileSize = Math.min(70, Math.floor((width - 40) / cfg.cols) - 2);
    this.tileSpacing = 2;
    this.cellSize = this.tileSize + this.tileSpacing;
    this.gridWidth = cfg.cols * this.cellSize;
    this.gridHeight = cfg.rows * this.cellSize;
    this.gridOffsetX = Math.round((width - this.gridWidth) / 2) + Math.round(this.cellSize / 2);
    this.gridOffsetY = Math.round((height - this.gridHeight) / 2) + Math.round(this.cellSize / 2) + 30;

    // Tile color tints for particles
    this.tileParticleColors = [0xe63946, 0x3498db, 0x2ecc71, 0x9b59b6, 0xe8751a, 0xffd700];
    // Instrument labels for tiles
    this.tileLabels = ['G', 'S', 'D', 'B', 'P', 'M'];

    // Resume audio
    AudioSynth.resume();

    // --- Background ---
    this.drawBackground(width, height);

    // --- Grid border ---
    this.drawGridBorder(width);

    // --- Score display ---
    this.createScoreDisplay(width);

    // --- Create the logical grid and sprites ---
    this.grid = MatchEngine.createGrid(cfg.rows, cfg.cols, cfg.tileTypes);
    this.tiles = [];
    for (var r = 0; r < cfg.rows; r++) {
      this.tiles[r] = [];
      for (var c = 0; c < cfg.cols; c++) {
        var sprite = this.createTileSprite(r, c, this.grid[r][c]);
        this.tiles[r][c] = sprite;
      }
    }

    // --- Selection highlight border ---
    this.selectBorder = this.add.graphics();
    this.selectBorder.setDepth(10);

    // --- Combo text (hidden until needed) ---
    this.comboText = this.add.text(width / 2, this.gridOffsetY - this.gridHeight / 2 - 10, '', {
      fontFamily: GBR.FONTS.display,
      fontSize: '36px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0).setDepth(20);

    // --- Input ---
    this.input.on('pointerdown', function (pointer) {
      if (self.isAnimating || self.won) return;
      AudioSynth.resume();
      self.resetHintTimer();
      self.handleTileClick(pointer);
    });

    // --- Hint timer ---
    this.lastInputTime = this.time.now;

    // --- HUD ---
    if (!this.scene.isActive('HUDScene')) {
      this.scene.launch('HUDScene');
    }
    this.game.events.emit('hud:refresh');
    this.game.events.emit('hud:dollars', GBR.state.totalDollars);

    // --- Fade in ---
    TransitionHelper.fadeIn(this, 600);
  },

  update: function () {
    if (this.isAnimating || this.won) return;

    // Auto-hint after idle
    var elapsed = this.time.now - this.lastInputTime;
    if (elapsed > GBR.ACT3.hintDelay && !this.hintTween) {
      this.showHint();
    }
  },

  // =============================================
  //  DRAWING HELPERS
  // =============================================

  drawBackground: function (width, height) {
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a1a3e, 0x16213e);
    bg.fillRect(0, 0, width, height);

    // Floating decorative particles
    for (var i = 0; i < 25; i++) {
      var p = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 3),
        0xffd700,
        Phaser.Math.FloatBetween(0.03, 0.12)
      );
      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(40, 100),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 7000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 4000)
      });
    }
  },

  drawGridBorder: function (width) {
    var borderPad = 12;
    var borderX = this.gridOffsetX - this.cellSize / 2 - borderPad;
    var borderY = this.gridOffsetY - this.cellSize / 2 - borderPad;
    var borderW = this.gridWidth + borderPad * 2;
    var borderH = this.gridHeight + borderPad * 2;

    var gridBg = this.add.graphics();
    gridBg.fillStyle(0x000000, 0.35);
    gridBg.fillRoundedRect(borderX, borderY, borderW, borderH, 16);
    gridBg.lineStyle(2, 0xffd700, 0.25);
    gridBg.strokeRoundedRect(borderX, borderY, borderW, borderH, 16);
  },

  createScoreDisplay: function (width) {
    var cfg = GBR.ACT3;
    var scoreY = 50;

    // Act label
    this.add.text(width / 2, 16, 'ACT 3 - INSTRUMENT MATCH', {
      fontFamily: GBR.FONTS.fun,
      fontSize: '14px',
      color: '#e8751a'
    }).setOrigin(0.5);

    // Score text
    this.scoreText = this.add.text(width / 2, scoreY, '$0', {
      fontFamily: GBR.FONTS.display,
      fontSize: '40px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Target label
    this.add.text(width / 2, scoreY + 28, 'TARGET: $' + cfg.targetScore, {
      fontFamily: GBR.FONTS.fun,
      fontSize: '12px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    // Progress bar background
    var barWidth = 300;
    var barHeight = 10;
    var barX = width / 2 - barWidth / 2;
    var barY = scoreY + 46;

    this.progressBarBg = this.add.graphics();
    this.progressBarBg.fillStyle(0x333333, 0.8);
    this.progressBarBg.fillRoundedRect(barX, barY, barWidth, barHeight, 5);
    this.progressBarBg.lineStyle(1, 0x555555, 0.5);
    this.progressBarBg.strokeRoundedRect(barX, barY, barWidth, barHeight, 5);

    // Progress bar fill
    this.progressBar = this.add.graphics();
    this.progressBarX = barX;
    this.progressBarY = barY;
    this.progressBarWidth = barWidth;
    this.progressBarHeight = barHeight;

    this.updateProgressBar();
  },

  updateProgressBar: function () {
    var cfg = GBR.ACT3;
    var pct = Math.min(this.actScore / cfg.targetScore, 1);

    this.progressBar.clear();
    if (pct > 0) {
      var fillW = Math.max(this.progressBarWidth * pct, 6);
      // Gradient from orange to gold as you approach target
      var fillColor = pct < 0.5 ? 0xe8751a : (pct < 1 ? 0xffd700 : 0x2ecc71);
      this.progressBar.fillStyle(fillColor, 1);
      this.progressBar.fillRoundedRect(this.progressBarX, this.progressBarY, fillW, this.progressBarHeight, 5);
    }
  },

  // =============================================
  //  TILE SPRITE HELPERS
  // =============================================

  gridToScreen: function (r, c) {
    return {
      x: this.gridOffsetX + c * this.cellSize,
      y: this.gridOffsetY + r * this.cellSize
    };
  },

  screenToGrid: function (px, py) {
    var c = Math.round((px - this.gridOffsetX) / this.cellSize);
    var r = Math.round((py - this.gridOffsetY) / this.cellSize);
    if (r >= 0 && r < GBR.ACT3.rows && c >= 0 && c < GBR.ACT3.cols) {
      return { r: r, c: c };
    }
    return null;
  },

  createTileSprite: function (r, c, type) {
    var pos = this.gridToScreen(r, c);
    var sprite = this.add.image(pos.x, pos.y, 'tile_' + type);
    sprite.setDisplaySize(this.tileSize, this.tileSize);
    sprite.setData('row', r);
    sprite.setData('col', c);
    sprite.setData('type', type);
    sprite.setDepth(5);
    sprite.setInteractive();

    // Add instrument letter label on top of tile
    var label = this.add.text(pos.x, pos.y, this.tileLabels[type], {
      fontFamily: GBR.FONTS.display,
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(6);

    sprite.setData('label', label);

    return sprite;
  },

  destroyTileSprite: function (r, c) {
    var sprite = this.tiles[r][c];
    if (sprite) {
      var label = sprite.getData('label');
      if (label) label.destroy();
      sprite.destroy();
      this.tiles[r][c] = null;
    }
  },

  updateTileSpritePosition: function (sprite, r, c) {
    sprite.setData('row', r);
    sprite.setData('col', c);
    var pos = this.gridToScreen(r, c);
    sprite.setPosition(pos.x, pos.y);
    var label = sprite.getData('label');
    if (label) {
      label.setPosition(pos.x, pos.y);
    }
  },

  // =============================================
  //  SELECTION & INPUT
  // =============================================

  handleTileClick: function (pointer) {
    var cell = this.screenToGrid(pointer.x, pointer.y);
    if (!cell) {
      this.deselectTile();
      return;
    }

    var r = cell.r;
    var c = cell.c;

    if (!this.selectedTile) {
      // Nothing selected - select this tile
      this.selectTile(r, c);
    } else if (this.selectedTile.r === r && this.selectedTile.c === c) {
      // Tapped same tile - deselect
      this.deselectTile();
    } else if (MatchEngine.isAdjacent(this.selectedTile.r, this.selectedTile.c, r, c)) {
      // Adjacent tile - attempt swap
      this.attemptSwap(this.selectedTile.r, this.selectedTile.c, r, c);
    } else {
      // Non-adjacent - select new tile
      this.deselectTile();
      this.selectTile(r, c);
    }
  },

  selectTile: function (r, c) {
    this.selectedTile = { r: r, c: c };
    this.drawSelectionBorder(r, c);

    // Subtle pulse on the selected tile
    var sprite = this.tiles[r][c];
    if (sprite) {
      this.tweens.add({
        targets: sprite,
        scaleX: { from: sprite.scaleX, to: sprite.scaleX * 1.1 },
        scaleY: { from: sprite.scaleY, to: sprite.scaleY * 1.1 },
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  },

  deselectTile: function () {
    if (this.selectedTile) {
      var sprite = this.tiles[this.selectedTile.r][this.selectedTile.c];
      if (sprite) {
        this.tweens.killTweensOf(sprite);
        var displayScale = this.tileSize / 64; // tile_N textures are 64x64
        sprite.setScale(displayScale);
      }
    }
    this.selectedTile = null;
    this.selectBorder.clear();
  },

  drawSelectionBorder: function (r, c) {
    var pos = this.gridToScreen(r, c);
    var half = this.tileSize / 2 + 4;
    this.selectBorder.clear();

    // Outer gold glow
    this.selectBorder.lineStyle(4, 0xffd700, 0.9);
    this.selectBorder.strokeRoundedRect(pos.x - half, pos.y - half, half * 2, half * 2, 10);

    // Inner white glow
    this.selectBorder.lineStyle(2, 0xffffff, 0.5);
    this.selectBorder.strokeRoundedRect(pos.x - half + 2, pos.y - half + 2, half * 2 - 4, half * 2 - 4, 8);
  },

  // =============================================
  //  SWAP LOGIC
  // =============================================

  attemptSwap: function (r1, c1, r2, c2) {
    var self = this;
    this.isAnimating = true;
    this.deselectTile();
    this.clearHint();

    var isValid = MatchEngine.isValidMove(this.grid, r1, c1, r2, c2, 5);

    // Animate the swap visually first
    this.animateSwap(r1, c1, r2, c2, function () {
      if (isValid) {
        // Commit the swap in the data grid
        MatchEngine.swap(self.grid, r1, c1, r2, c2);

        // Swap the sprite references
        var tmp = self.tiles[r1][c1];
        self.tiles[r1][c1] = self.tiles[r2][c2];
        self.tiles[r2][c2] = tmp;

        // Update sprite data
        self.updateTileSpritePosition(self.tiles[r1][c1], r1, c1);
        self.updateTileSpritePosition(self.tiles[r2][c2], r2, c2);

        AudioSynth.playCollect();

        // Start the match processing chain
        self.comboCount = 0;
        self.processMatches();
      } else {
        // Invalid move - shake and swap back
        AudioSynth.playFail();
        TransitionHelper.shake(self, 150, 0.005);

        self.animateSwap(r1, c1, r2, c2, function () {
          self.isAnimating = false;
        });
      }
    });
  },

  animateSwap: function (r1, c1, r2, c2, onComplete) {
    var self = this;
    var sprite1 = this.tiles[r1][c1];
    var sprite2 = this.tiles[r2][c2];
    var pos1 = this.gridToScreen(r1, c1);
    var pos2 = this.gridToScreen(r2, c2);
    var label1 = sprite1 ? sprite1.getData('label') : null;
    var label2 = sprite2 ? sprite2.getData('label') : null;

    var duration = 180;
    var completed = 0;
    var total = 2;

    function checkDone() {
      completed++;
      if (completed >= total && onComplete) onComplete();
    }

    // Animate sprite 1 to position 2
    if (sprite1) {
      self.tweens.add({
        targets: label1 ? [sprite1, label1] : [sprite1],
        x: pos2.x,
        y: pos2.y,
        duration: duration,
        ease: 'Power2',
        onComplete: checkDone
      });
    } else {
      checkDone();
    }

    // Animate sprite 2 to position 1
    if (sprite2) {
      self.tweens.add({
        targets: label2 ? [sprite2, label2] : [sprite2],
        x: pos1.x,
        y: pos1.y,
        duration: duration,
        ease: 'Power2',
        onComplete: checkDone
      });
    } else {
      checkDone();
    }
  },

  // =============================================
  //  MATCH PROCESSING CHAIN
  // =============================================

  processMatches: function () {
    var self = this;
    var cfg = GBR.ACT3;
    var matches = MatchEngine.findMatches(this.grid, 5);

    if (matches.length === 0) {
      // No more matches - chain done
      this.isAnimating = false;
      this.lastInputTime = this.time.now;

      // Check for available moves; if none, reshuffle
      var validMoves = MatchEngine.getValidMoves(this.grid, 5);
      if (validMoves.length === 0) {
        this.reshuffleGrid();
      }
      return;
    }

    this.comboCount++;

    // Show combo text for cascades
    if (this.comboCount >= 2) {
      this.showComboText(this.comboCount);
    }

    // Calculate score for this round of matches
    var roundScore = 0;
    for (var m = 0; m < matches.length; m++) {
      var len = matches[m].length;
      if (len >= 5) {
        roundScore += cfg.match5Value;
      } else if (len === 4) {
        roundScore += cfg.match4Value;
      } else {
        roundScore += cfg.match3Value;
      }
    }

    // Multiply score by combo for cascades
    if (this.comboCount >= 2) {
      roundScore = Math.round(roundScore * (1 + (this.comboCount - 1) * 0.5));
    }

    // Step 1 & 2: Animate matched tiles out with particles
    this.animateMatchRemoval(matches, function () {
      // Step 3: Add score
      self.addScore(roundScore);

      // Step 4: Remove from data grid
      MatchEngine.removeMatches(self.grid, matches);

      // Step 5: Apply gravity
      var gravityMoves = MatchEngine.applyGravity(self.grid);

      self.animateGravity(gravityMoves, function () {
        // Step 6: Fill empty cells
        var newTiles = MatchEngine.fillEmpty(self.grid, cfg.tileTypes, 5, cfg.wildcardChance);

        self.animateFillIn(newTiles, function () {
          // Step 7: Check for cascading matches
          self.processMatches();
        });
      });
    });
  },

  // =============================================
  //  MATCH REMOVAL ANIMATION
  // =============================================

  animateMatchRemoval: function (matches, onComplete) {
    var self = this;
    var allCells = {};
    var cells = [];

    // Flatten matches into unique cells
    for (var m = 0; m < matches.length; m++) {
      for (var i = 0; i < matches[m].length; i++) {
        var cell = matches[m][i];
        var key = cell.r + ',' + cell.c;
        if (!allCells[key]) {
          allCells[key] = true;
          cells.push(cell);
        }
      }
    }

    var completed = 0;
    var total = cells.length;

    if (total === 0) {
      if (onComplete) onComplete();
      return;
    }

    for (var j = 0; j < cells.length; j++) {
      (function (cell) {
        var sprite = self.tiles[cell.r][cell.c];
        if (!sprite) {
          completed++;
          if (completed >= total && onComplete) onComplete();
          return;
        }

        var tileType = sprite.getData('type');
        var pos = self.gridToScreen(cell.r, cell.c);

        // Burst particles at the tile position
        self.spawnMatchParticles(pos.x, pos.y, tileType);

        // Floating score text at match position (small)
        var matchLen = 0;
        for (var mm = 0; mm < matches.length; mm++) {
          for (var ii = 0; ii < matches[mm].length; ii++) {
            if (matches[mm][ii].r === cell.r && matches[mm][ii].c === cell.c) {
              matchLen = matches[mm].length;
            }
          }
        }

        var label = sprite.getData('label');

        // Shrink and fade out
        self.tweens.add({
          targets: sprite,
          scaleX: 0,
          scaleY: 0,
          alpha: 0,
          duration: 200,
          ease: 'Back.easeIn',
          onComplete: function () {
            if (label) label.destroy();
            sprite.destroy();
            self.tiles[cell.r][cell.c] = null;
            completed++;
            if (completed >= total && onComplete) onComplete();
          }
        });

        // Also shrink the label
        if (label) {
          self.tweens.add({
            targets: label,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 200,
            ease: 'Back.easeIn'
          });
        }
      })(cells[j]);
    }
  },

  spawnMatchParticles: function (x, y, tileType) {
    var color = this.tileParticleColors[tileType] || 0xffffff;

    // Star burst
    var starEmitter = this.add.particles(x, y, 'star', {
      speed: { min: 80, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      lifespan: 500,
      quantity: 6,
      tint: [color, 0xffd700, 0xffffff],
      emitting: false
    });
    starEmitter.setDepth(15);
    starEmitter.explode(6);

    // Colored dot burst
    var dotEmitter = this.add.particles(x, y, 'particle', {
      speed: { min: 40, max: 160 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      lifespan: 400,
      quantity: 10,
      tint: [color, Phaser.Display.Color.GetColor(
        Math.min(255, ((color >> 16) & 0xff) + 60),
        Math.min(255, ((color >> 8) & 0xff) + 60),
        Math.min(255, (color & 0xff) + 60)
      )],
      emitting: false
    });
    dotEmitter.setDepth(15);
    dotEmitter.explode(10);

    // Clean up emitters after particles die
    var self = this;
    this.time.delayedCall(600, function () {
      starEmitter.destroy();
      dotEmitter.destroy();
    });
  },

  // =============================================
  //  GRAVITY ANIMATION
  // =============================================

  animateGravity: function (moves, onComplete) {
    var self = this;

    if (moves.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    var completed = 0;
    var total = moves.length;

    for (var i = 0; i < moves.length; i++) {
      (function (move) {
        var sprite = self.tiles[move.fromR][move.c];

        // The data grid already has the tile at toR after applyGravity.
        // We need to move the sprite reference.
        self.tiles[move.toR][move.c] = sprite;
        self.tiles[move.fromR][move.c] = null;

        if (!sprite) {
          completed++;
          if (completed >= total && onComplete) onComplete();
          return;
        }

        // Update sprite data to new row
        sprite.setData('row', move.toR);
        sprite.setData('col', move.c);

        var targetPos = self.gridToScreen(move.toR, move.c);
        var label = sprite.getData('label');

        self.tweens.add({
          targets: label ? [sprite, label] : [sprite],
          y: targetPos.y,
          duration: 300,
          ease: 'Bounce.easeOut',
          onComplete: function () {
            completed++;
            if (completed >= total && onComplete) onComplete();
          }
        });
      })(moves[i]);
    }
  },

  // =============================================
  //  FILL-IN ANIMATION
  // =============================================

  animateFillIn: function (newTiles, onComplete) {
    var self = this;

    if (newTiles.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    var completed = 0;
    var total = newTiles.length;

    for (var i = 0; i < newTiles.length; i++) {
      (function (tile) {
        var pos = self.gridToScreen(tile.r, tile.c);
        // Create sprite above the grid (fall-in position)
        var startY = self.gridOffsetY - self.gridHeight / 2 - self.cellSize;

        var sprite = self.createTileSprite(tile.r, tile.c, tile.type);
        sprite.setPosition(pos.x, startY);
        sprite.setAlpha(0.5);
        sprite.setScale(0);

        var label = sprite.getData('label');
        if (label) {
          label.setPosition(pos.x, startY);
          label.setAlpha(0.5);
          label.setScale(0);
        }

        self.tiles[tile.r][tile.c] = sprite;

        var displayScale = self.tileSize / 64;

        // Animate falling in
        self.tweens.add({
          targets: label ? [sprite, label] : [sprite],
          y: pos.y,
          alpha: 1,
          scaleX: displayScale,
          scaleY: displayScale,
          duration: 400,
          ease: 'Bounce.easeOut',
          delay: (tile.c * 30), // slight column-based stagger
          onComplete: function () {
            // Ensure label scale matches for text
            if (label) {
              label.setScale(1);
            }
            sprite.setScale(displayScale);
            completed++;
            if (completed >= total && onComplete) onComplete();
          }
        });
      })(newTiles[i]);
    }
  },

  // =============================================
  //  SCORING
  // =============================================

  addScore: function (amount) {
    this.actScore += amount;
    GBR.state.totalDollars += amount;
    GBR.state.actScores[2] = this.actScore;

    // Update score display
    this.scoreText.setText('$' + this.actScore);
    this.updateProgressBar();

    // Pop animation on score
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true
    });

    // Emit HUD events
    this.game.events.emit('hud:dollars', GBR.state.totalDollars);

    // Floating score text
    var width = this.cameras.main.width;
    var floatText = this.add.text(width / 2, 120, '+$' + amount, {
      fontFamily: GBR.FONTS.display,
      fontSize: '24px',
      color: this.comboCount >= 2 ? '#ff6b6b' : '#2ecc71',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(25);

    this.tweens.add({
      targets: floatText,
      y: floatText.y - 40,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: function () { floatText.destroy(); }
    });

    // Check win condition
    if (this.actScore >= GBR.ACT3.targetScore && !this.won) {
      this.won = true;
      // Delay slightly so the last animations finish
      var self = this;
      this.time.delayedCall(600, function () {
        self.triggerWin();
      });
    }
  },

  showComboText: function (combo) {
    var labels = ['', '', 'COMBO!', 'SUPER COMBO!', 'MEGA COMBO!', 'ULTRA COMBO!'];
    var text = combo < labels.length ? labels[combo] : 'ULTRA COMBO x' + combo + '!';

    this.comboText.setText(text);
    this.comboText.setAlpha(1);
    this.comboText.setScale(0.5);

    this.tweens.add({
      targets: this.comboText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 300,
      onComplete: function () {
        // Stays visible during chain
      }
    });

    // Flash camera on combos
    TransitionHelper.flash(this, 150);

    // Combo sparkles around the text
    var width = this.cameras.main.width;
    var comboEmitter = this.add.particles(width / 2, this.comboText.y, 'star', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      lifespan: 600,
      quantity: 8,
      tint: [0xffd700, 0xff6b6b, 0xffffff],
      emitting: false
    });
    comboEmitter.setDepth(21);
    comboEmitter.explode(8);

    var self = this;
    this.time.delayedCall(700, function () {
      comboEmitter.destroy();
    });
  },

  // =============================================
  //  HINT SYSTEM
  // =============================================

  resetHintTimer: function () {
    this.lastInputTime = this.time.now;
    this.clearHint();
  },

  clearHint: function () {
    if (this.hintTween) {
      this.hintTween.stop();
      this.hintTween = null;
    }
    if (this.hintSparkle) {
      this.hintSparkle.destroy();
      this.hintSparkle = null;
    }
  },

  showHint: function () {
    var validMoves = MatchEngine.getValidMoves(this.grid, 5);
    if (validMoves.length === 0) return;

    var move = validMoves[0];
    var pos = this.gridToScreen(move.r1, move.c1);

    // Sparkle emitter on the hinted tile
    this.hintSparkle = this.add.particles(pos.x, pos.y, 'star', {
      speed: { min: 20, max: 50 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      lifespan: 800,
      frequency: 150,
      tint: [0xffd700, 0xffffff],
      quantity: 2
    });
    this.hintSparkle.setDepth(12);

    // Gentle pulse on the tile
    var sprite = this.tiles[move.r1][move.c1];
    if (sprite) {
      var displayScale = this.tileSize / 64;
      this.hintTween = this.tweens.add({
        targets: sprite,
        scaleX: displayScale * 1.15,
        scaleY: displayScale * 1.15,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  },

  // =============================================
  //  GRID RESHUFFLE
  // =============================================

  reshuffleGrid: function () {
    var self = this;
    var cfg = GBR.ACT3;
    this.isAnimating = true;

    // Show reshuffle text
    var width = this.cameras.main.width;
    var reshuffleText = this.add.text(width / 2, this.cameras.main.height / 2, 'RESHUFFLING...', {
      fontFamily: GBR.FONTS.display,
      fontSize: '32px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(30);

    // Shake all tiles, then regenerate
    TransitionHelper.shake(this, 300, 0.008);

    this.time.delayedCall(500, function () {
      // Destroy all existing tile sprites
      for (var r = 0; r < cfg.rows; r++) {
        for (var c = 0; c < cfg.cols; c++) {
          self.destroyTileSprite(r, c);
        }
      }

      // Generate a new grid
      self.grid = MatchEngine.createGrid(cfg.rows, cfg.cols, cfg.tileTypes);

      // Ensure there are valid moves
      var attempts = 0;
      while (MatchEngine.getValidMoves(self.grid, 5).length === 0 && attempts < 20) {
        self.grid = MatchEngine.createGrid(cfg.rows, cfg.cols, cfg.tileTypes);
        attempts++;
      }

      // Create new sprites with bounce-in
      self.tiles = [];
      for (var r2 = 0; r2 < cfg.rows; r2++) {
        self.tiles[r2] = [];
        for (var c2 = 0; c2 < cfg.cols; c2++) {
          var sprite = self.createTileSprite(r2, c2, self.grid[r2][c2]);
          sprite.setScale(0);
          sprite.setAlpha(0);

          var displayScale = self.tileSize / 64;
          self.tweens.add({
            targets: sprite,
            scaleX: displayScale,
            scaleY: displayScale,
            alpha: 1,
            duration: 400,
            ease: 'Back.easeOut',
            delay: (r2 * cfg.cols + c2) * 20
          });

          var label = sprite.getData('label');
          if (label) {
            label.setScale(0);
            label.setAlpha(0);
            self.tweens.add({
              targets: label,
              scaleX: 1,
              scaleY: 1,
              alpha: 1,
              duration: 400,
              ease: 'Back.easeOut',
              delay: (r2 * cfg.cols + c2) * 20
            });
          }

          self.tiles[r2][c2] = sprite;
        }
      }

      // Remove reshuffle text and unlock input
      self.time.delayedCall(800, function () {
        reshuffleText.destroy();
        self.isAnimating = false;
        self.lastInputTime = self.time.now;
      });
    });
  },

  // =============================================
  //  WIN CONDITION
  // =============================================

  triggerWin: function () {
    var self = this;
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    this.isAnimating = true;

    // Disable all tile interactivity so they don't block the CONTINUE button
    if (this.tiles) {
      for (var r = 0; r < this.tiles.length; r++) {
        for (var c = 0; c < this.tiles[r].length; c++) {
          if (this.tiles[r][c]) {
            this.tiles[r][c].disableInteractive();
          }
        }
      }
    }

    // Mark act complete
    this.game.events.emit('hud:actComplete', 2);

    // Success sound
    AudioSynth.playSuccess();

    // Flash
    TransitionHelper.flash(this, 300);

    // Big celebration particles across the screen
    var celebEmitter = this.add.particles(width / 2, height / 2, 'star', {
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      lifespan: 2000,
      frequency: 30,
      tint: [0xffd700, 0xe63946, 0x3498db, 0x2ecc71, 0xe8751a, 0x9b59b6],
      quantity: 4
    });
    celebEmitter.setDepth(25);

    var celebDots = this.add.particles(width / 2, height / 2, 'particle', {
      speed: { min: 50, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 2, end: 0 },
      lifespan: 1500,
      frequency: 50,
      tint: [0xffd700, 0xffffff],
      quantity: 3
    });
    celebDots.setDepth(25);

    // Overlay
    var overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(20);

    this.tweens.add({
      targets: overlay,
      alpha: 0.6,
      duration: 800
    });

    // Victory text
    var victoryText = this.add.text(width / 2, height * 0.25, 'TARGET REACHED!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '48px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(30).setAlpha(0).setScale(0.3);

    this.tweens.add({
      targets: victoryText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });

    // Score summary
    this.time.delayedCall(600, function () {
      self.add.text(width / 2, height * 0.36, '$' + self.actScore + ' EARNED!', {
        fontFamily: GBR.FONTS.display,
        fontSize: '32px',
        color: '#2ecc71',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(30);
    });

    // Member found text
    this.time.delayedCall(1000, function () {
      var member = GBR.BAND[2];
      var foundText = self.add.text(width / 2, height * 0.48, member.name.toUpperCase() + ' FOUND!', {
        fontFamily: GBR.FONTS.display,
        fontSize: '28px',
        color: member.colorHex,
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(30).setAlpha(0);

      self.tweens.add({
        targets: foundText,
        alpha: 1,
        duration: 400
      });

      // Show the member portrait
      var portrait = self.add.image(width / 2, height * 0.62, 'member_2')
        .setScale(0)
        .setDepth(30);

      self.tweens.add({
        targets: portrait,
        scaleX: 3,
        scaleY: 3,
        duration: 600,
        ease: 'Back.easeOut'
      });

      // Emit member found
      self.game.events.emit('hud:memberFound', 2);
    });

    // Continue button after delay
    this.time.delayedCall(2500, function () {
      celebEmitter.stop();
      celebDots.stop();

      createButton(self, width / 2, height * 0.85, 'CONTINUE', function () {
        self.scene.stop('HUDScene');
        TransitionHelper.fadeToScene(self, 'OutfitScene', {
          memberIndex: 2,
          nextScene: 'StoryScene',
          nextData: { actNumber: 3, nextScene: 'Act4SimonScene' }
        });
      }, {
        bgColor: 0x2ecc71,
        fontSize: '32px',
        width: 260,
        height: 60
      });
    });
  }
});
