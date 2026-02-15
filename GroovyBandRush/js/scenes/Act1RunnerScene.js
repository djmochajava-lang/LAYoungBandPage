/* GroovyBandRush/js/scenes/Act1RunnerScene.js */

var Act1RunnerScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function Act1RunnerScene() {
    Phaser.Scene.call(this, { key: 'Act1RunnerScene' });
  },

  init: function () {
    // Game state
    this.gameState = 'countdown'; // countdown, playing, gameover, win
    this.currentLane = 1;         // 0=left, 1=center, 2=right
    this.speed = GBR.ACT1.startSpeed;
    this.lives = GBR.ACT1.lives;
    this.score = 0;
    this.dollars = GBR.state.totalDollars;
    this.instrumentsCollected = 0;
    this.eugeneSpawned = false;
    this.eugeneCollected = false;
    this.invincibleTimer = 0;
    this.frameCount = 0;
    this.obstacleTimer = 0;
    this.collectibleTimer = 0;
    this.isJumping = false;
    this.canInput = true;
    this.stripeOffset = 0;

    // Groups
    this.obstacles = [];
    this.collectibles = [];
    this.roadStripes = [];
    this.floatingTexts = [];
    this.bgStars = [];
  },

  create: function () {
    var width = this.cameras.main.width;
    var height = this.cameras.main.height;
    var self = this;

    this.W = width;
    this.H = height;

    // Lane X positions (3 lanes centered on road)
    var roadLeft = width * 0.2;
    var roadRight = width * 0.8;
    var roadWidth = roadRight - roadLeft;
    var laneWidth = roadWidth / 3;
    this.laneXPositions = [
      roadLeft + laneWidth * 0.5,
      roadLeft + laneWidth * 1.5,
      roadLeft + laneWidth * 2.5
    ];
    this.roadLeft = roadLeft;
    this.roadRight = roadRight;
    this.laneWidth = laneWidth;

    // Player Y position (near bottom)
    this.playerY = height - 100;

    // --- Draw background layers ---
    this.drawBackground();
    this.drawRoad();

    // --- Player SUV (top-down view, already facing up) ---
    this.player = this.add.image(this.laneXPositions[1], this.playerY, 'van');
    this.player.setDisplaySize(this.laneWidth * 0.85, this.laneWidth * 1.2);
    this.player.setDepth(10);
    // Store base scale for jump animation
    this.playerBaseScaleX = this.player.scaleX;
    this.playerBaseScaleY = this.player.scaleY;

    // Glow effect under player
    this.playerGlow = this.add.graphics();
    this.playerGlow.setDepth(9);
    this.updatePlayerGlow();

    // --- Setup input ---
    this.setupInput();

    // --- Launch HUD ---
    if (!this.scene.isActive('HUDScene')) {
      this.scene.launch('HUDScene');
    }
    this.time.delayedCall(100, function () {
      self.game.events.emit('hud:showLives', self.lives);
      self.game.events.emit('hud:refresh');
    });

    // --- Countdown sequence ---
    this.startCountdown();

    // --- Fade in ---
    TransitionHelper.fadeIn(this, 400);

    // Resume audio
    AudioSynth.resume();
  },

  // =============== BACKGROUND ===============

  drawBackground: function () {
    var width = this.W;
    var height = this.H;

    // Dark sky gradient
    var sky = this.add.graphics();
    sky.setDepth(0);
    sky.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a1a3e, 0x1a1a3e);
    sky.fillRect(0, 0, width, height);

    // Stars in sky
    for (var i = 0; i < 50; i++) {
      var star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height * 0.35),
        Phaser.Math.Between(1, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.3, 0.9)
      );
      star.setDepth(0);
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: 0.1 },
        duration: Phaser.Math.Between(800, 2500),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
      this.bgStars.push(star);
    }

    // Parallax city skyline
    var skylineY = height * 0.30;
    var skyline = this.add.graphics();
    skyline.setDepth(1);

    // Building silhouettes
    skyline.fillStyle(0x0f0f1a, 0.9);
    var buildings = [
      { x: 0, w: 30, h: 65 }, { x: 25, w: 22, h: 100 }, { x: 45, w: 28, h: 55 },
      { x: 70, w: 18, h: 115 }, { x: 85, w: 30, h: 75 }, { x: 110, w: 22, h: 110 },
      { x: 130, w: 30, h: 68 }, { x: 155, w: 22, h: 125 }, { x: 175, w: 28, h: 82 },
      { x: 200, w: 20, h: 95 }, { x: 218, w: 28, h: 60 }, { x: 242, w: 22, h: 115 },
      { x: 262, w: 30, h: 78 }, { x: 290, w: 20, h: 105 }, { x: 308, w: 28, h: 65 },
      { x: 333, w: 24, h: 120 }, { x: 355, w: 28, h: 72 }, { x: 380, w: 22, h: 98 },
      { x: 400, w: 28, h: 58 }, { x: 425, w: 25, h: 112 }
    ];
    for (var b = 0; b < buildings.length; b++) {
      var bld = buildings[b];
      skyline.fillRect(bld.x, skylineY - bld.h, bld.w - 2, bld.h + 20);
    }

    // Neon building windows
    skyline.fillStyle(0xffd700, 0.08);
    for (var bw = 0; bw < buildings.length; bw++) {
      var bl = buildings[bw];
      for (var wy = skylineY - bl.h + 8; wy < skylineY; wy += 10) {
        for (var wx = bl.x + 4; wx < bl.x + bl.w - 6; wx += 8) {
          if (Math.random() > 0.5) {
            skyline.fillRect(wx, wy, 4, 5);
          }
        }
      }
    }

    // Horizon glow
    var glow = this.add.graphics();
    glow.setDepth(1);
    glow.fillStyle(0xe8751a, 0.06);
    glow.fillRect(0, skylineY - 10, width, 30);
    glow.fillStyle(0xffd700, 0.04);
    glow.fillRect(0, skylineY + 10, width, 20);
  },

  drawRoad: function () {
    var width = this.W;
    var height = this.H;

    // Road surface
    this.roadGraphics = this.add.graphics();
    this.roadGraphics.setDepth(2);

    // Dark road
    this.roadGraphics.fillStyle(0x1a1a2e, 1);
    this.roadGraphics.fillRect(this.roadLeft, height * 0.3, this.roadRight - this.roadLeft, height * 0.7);

    // Neon road edges
    this.roadGraphics.lineStyle(3, 0xe8751a, 0.8);
    this.roadGraphics.lineBetween(this.roadLeft, height * 0.3, this.roadLeft, height);
    this.roadGraphics.lineBetween(this.roadRight, height * 0.3, this.roadRight, height);

    // Neon lane dividers (dashed lines will be drawn as sprites for scrolling)
    this.roadGraphics.lineStyle(1, 0xffd700, 0.2);
    var lane1X = this.roadLeft + this.laneWidth;
    var lane2X = this.roadLeft + this.laneWidth * 2;
    this.roadGraphics.lineBetween(lane1X, height * 0.3, lane1X, height);
    this.roadGraphics.lineBetween(lane2X, height * 0.3, lane2X, height);

    // Road side terrain (dark)
    var sideBg = this.add.graphics();
    sideBg.setDepth(1);
    sideBg.fillStyle(0x0a0a12, 1);
    sideBg.fillRect(0, height * 0.3, this.roadLeft, height * 0.7);
    sideBg.fillRect(this.roadRight, height * 0.3, width - this.roadRight, height * 0.7);

    // Side neon strips
    sideBg.fillStyle(0xe8751a, 0.04);
    sideBg.fillRect(this.roadLeft - 8, height * 0.3, 8, height * 0.7);
    sideBg.fillRect(this.roadRight, height * 0.3, 8, height * 0.7);

    // Create scrolling stripe sprites (in each lane divider)
    this.stripeContainer = this.add.group();
    var stripePositions = [lane1X - 4, lane2X - 4];
    for (var s = 0; s < stripePositions.length; s++) {
      for (var sy = height * 0.3; sy < height + 60; sy += 80) {
        var stripe = this.add.image(stripePositions[s], sy, 'road_stripe')
          .setAlpha(0.4)
          .setTint(0xffd700)
          .setDepth(3);
        this.roadStripes.push(stripe);
      }
    }
  },

  // =============== INPUT ===============

  setupInput: function () {
    var self = this;

    // Keyboard
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // --- Touch state tracked for drag detection ---
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.isDragging = false;
    this.dragJumped = false;
    this.pointerWasDown = false;

    // Record where touch starts (for tap vs drag detection on release)
    this.input.on('pointerdown', function (pointer) {
      self.touchStartX = pointer.x;
      self.touchStartY = pointer.y;
      self.touchStartTime = Date.now();
      self.isDragging = false;
      self.dragJumped = false;
      self.pointerWasDown = true;
    });

    // On release: handle tap and swipe-up (drag is handled in update loop)
    this.input.on('pointerup', function (pointer) {
      self.pointerWasDown = false;

      // If we were dragging, just stop
      if (self.isDragging) {
        self.isDragging = false;
        return;
      }

      var diffX = pointer.x - self.touchStartX;
      var diffY = pointer.y - self.touchStartY;
      var elapsed = Date.now() - self.touchStartTime;

      // Swipe up = jump
      if (diffY < -30 && Math.abs(diffY) > Math.abs(diffX)) {
        self.doJump();
      }
      // Quick tap
      else if (elapsed < 300 && Math.abs(diffX) < 20 && Math.abs(diffY) < 20) {
        if (pointer.x < self.W * 0.33) {
          self.moveLeft();
        } else if (pointer.x > self.W * 0.67) {
          self.moveRight();
        } else {
          self.doJump();
        }
      }
    });
  },

  // Poll pointer every frame for reliable drag-to-steer and drag-up-to-jump
  pollTouchDrag: function () {
    var pointer = this.input.activePointer;
    if (!pointer || !pointer.isDown) return;

    var diffX = pointer.x - this.touchStartX;
    var diffY = pointer.y - this.touchStartY;

    // Start dragging after 15px movement in any direction
    if (!this.isDragging && (Math.abs(diffX) > 15 || Math.abs(diffY) > 15)) {
      this.isDragging = true;
    }

    if (!this.isDragging) return;

    // Drag up = jump (once per touch, when finger moves 40px+ upward)
    if (!this.dragJumped && diffY < -40) {
      this.doJump();
      this.dragJumped = true;
    }

    // Find closest lane to finger
    var targetLane = 1;
    var closestDist = Infinity;
    for (var i = 0; i < this.laneXPositions.length; i++) {
      var dist = Math.abs(pointer.x - this.laneXPositions[i]);
      if (dist < closestDist) {
        closestDist = dist;
        targetLane = i;
      }
    }

    // Move van if lane changed
    if (targetLane !== this.currentLane) {
      this.currentLane = targetLane;
      this.animatePlayerToLane();
    }
  },

  moveLeft: function () {
    if (this.gameState !== 'playing' || !this.canInput) return;
    if (this.currentLane > 0) {
      this.currentLane--;
      this.animatePlayerToLane();
    }
  },

  moveRight: function () {
    if (this.gameState !== 'playing' || !this.canInput) return;
    if (this.currentLane < 2) {
      this.currentLane++;
      this.animatePlayerToLane();
    }
  },

  animatePlayerToLane: function () {
    var targetX = this.laneXPositions[this.currentLane];
    this.tweens.add({
      targets: this.player,
      x: targetX,
      duration: 120,
      ease: 'Power2'
    });
    // Move glow too
    this.tweens.add({
      targets: this.playerGlow,
      x: targetX - this.laneXPositions[1],
      duration: 120,
      ease: 'Power2'
    });
  },

  doJump: function () {
    if (this.gameState !== 'playing' || this.isJumping) return;
    var self = this;
    this.isJumping = true;

    // Jump shadow indicator
    var shadow = this.add.ellipse(this.player.x, this.playerY + 20, 50, 12, 0x000000, 0.3)
      .setDepth(9);

    this.tweens.add({
      targets: this.player,
      y: this.playerY - 80,
      duration: 250,
      ease: 'Power2.easeOut',
      yoyo: true,
      onComplete: function () {
        self.isJumping = false;
        self.player.y = self.playerY;
        shadow.destroy();
      }
    });

    // Scale squash and stretch (relative to base size)
    this.tweens.add({
      targets: this.player,
      scaleX: this.playerBaseScaleX * 0.85,
      scaleY: this.playerBaseScaleY * 1.2,
      duration: 250,
      ease: 'Power2.easeOut',
      yoyo: true,
      onComplete: function () {
        self.player.scaleX = self.playerBaseScaleX;
        self.player.scaleY = self.playerBaseScaleY;
      }
    });
  },

  // =============== COUNTDOWN ===============

  startCountdown: function () {
    var self = this;
    var width = this.W;
    var height = this.H;
    var countdownValues = ['3', '2', '1', 'GO!'];
    var countdownColors = ['#e63946', '#e8751a', '#ffd700', '#2ecc71'];

    var index = 0;

    var showNext = function () {
      if (index >= countdownValues.length) {
        self.gameState = 'playing';
        return;
      }

      var txt = self.add.text(width / 2, height / 2, countdownValues[index], {
        fontFamily: GBR.FONTS.display,
        fontSize: index === 3 ? '96px' : '120px',
        color: countdownColors[index],
        stroke: '#000000',
        strokeThickness: 6
      }).setOrigin(0.5).setDepth(50).setAlpha(0).setScale(2);

      self.tweens.add({
        targets: txt,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 300,
        ease: 'Back.easeOut',
        onComplete: function () {
          self.tweens.add({
            targets: txt,
            alpha: 0,
            scaleX: 0.5,
            scaleY: 0.5,
            duration: 300,
            delay: 300,
            onComplete: function () {
              txt.destroy();
            }
          });
        }
      });

      // Play a countdown beep
      if (index < 3) {
        AudioSynth.playNote(440, 0.15, 'square', 0.2);
      } else {
        AudioSynth.playSuccess();
      }

      index++;
      self.time.delayedCall(700, showNext);
    };

    this.time.delayedCall(400, showNext);
  },

  // =============== UPDATE LOOP ===============

  update: function () {
    if (this.gameState === 'countdown') {
      this.scrollRoad();
      return;
    }

    if (this.gameState !== 'playing') return;

    this.frameCount++;

    // Poll touch drag every frame for reliable steering
    this.pollTouchDrag();

    // Keyboard polling
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.keyA)) {
      this.moveLeft();
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.keyD)) {
      this.moveRight();
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keyW) || Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      this.doJump();
    }

    // Speed ramp
    if (this.speed < GBR.ACT1.maxSpeed) {
      this.speed += GBR.ACT1.speedRamp;
    }

    // Scroll road
    this.scrollRoad();

    // Spawn obstacles and collectibles
    this.handleSpawning();

    // Move entities downward
    this.moveEntities();

    // Check collisions
    this.checkCollisions();

    // Invincibility countdown
    if (this.invincibleTimer > 0) {
      this.invincibleTimer--;
      // Blink the player
      this.player.setAlpha(this.invincibleTimer % 6 < 3 ? 0.4 : 1);
      if (this.invincibleTimer === 0) {
        this.player.setAlpha(1);
      }
    }

    // Update player glow position
    this.updatePlayerGlow();

    // Clean up floating texts
    this.cleanupFloatingTexts();
  },

  scrollRoad: function () {
    var scrollSpeed = this.gameState === 'countdown' ? 1.5 : this.speed;

    // Move road stripes down
    for (var i = 0; i < this.roadStripes.length; i++) {
      var stripe = this.roadStripes[i];
      stripe.y += scrollSpeed;
      if (stripe.y > this.H + 40) {
        stripe.y -= (Math.ceil((this.H * 0.7 + 100) / 80)) * 80;
      }
    }
  },

  // =============== SPAWNING ===============

  handleSpawning: function () {
    this.obstacleTimer++;
    this.collectibleTimer++;

    // Dynamic obstacle rate (decreases as speed increases)
    var currentObstacleRate = Math.max(
      GBR.ACT1.minObstacleRate,
      GBR.ACT1.obstacleRate - this.frameCount * 0.05
    );

    // Spawn obstacle
    if (this.obstacleTimer >= currentObstacleRate) {
      this.obstacleTimer = 0;
      this.spawnObstacle();
    }

    // Spawn collectible more frequently than obstacles
    var collectibleRate = currentObstacleRate * 0.6;
    if (this.collectibleTimer >= collectibleRate) {
      this.collectibleTimer = 0;
      this.spawnCollectible();
    }
  },

  spawnObstacle: function () {
    var lane = Phaser.Math.Between(0, 2);
    var x = this.laneXPositions[lane];
    var obstacle = this.add.image(x, -40, 'obstacle').setDepth(8).setScale(1.2);

    // Slight rotation for variety
    obstacle.rotation = Phaser.Math.FloatBetween(-0.3, 0.3);

    // Red glow tint
    obstacle.setTint(0xff4444);

    this.obstacles.push({
      sprite: obstacle,
      lane: lane,
      hitWidth: 28,   // Smaller hitbox for forgiveness
      hitHeight: 28
    });
  },

  spawnCollectible: function () {
    var lane = Phaser.Math.Between(0, 2);
    var x = this.laneXPositions[lane];
    var type;
    var textureKey;
    var value;
    var isEugene = false;

    // Check if Eugene should spawn
    if (this.instrumentsCollected >= GBR.ACT1.instrumentsNeeded && !this.eugeneSpawned) {
      type = 'eugene';
      textureKey = 'member_0';
      value = 0;
      isEugene = true;
      this.eugeneSpawned = true;
    } else if (Math.random() < 0.15 && this.instrumentsCollected < GBR.ACT1.instrumentsNeeded) {
      // Instrument (15% chance, only if we still need them)
      type = 'instrument';
      textureKey = 'instrument';
      value = GBR.ACT1.instrumentValue;
    } else {
      // Dollar (common)
      type = 'dollar';
      textureKey = 'dollar';
      value = GBR.ACT1.dollarValue;
    }

    var yOffset = 0;
    // Some collectibles float higher (require jump)
    if (!isEugene && Math.random() < 0.2) {
      yOffset = -40;
    }

    var sprite = this.add.image(x, -40 + yOffset, textureKey).setDepth(8);

    if (isEugene) {
      sprite.setScale(0.28);
      // Glowing pulse for Eugene
      this.tweens.add({
        targets: sprite,
        scaleX: { from: 0.28, to: 0.35 },
        scaleY: { from: 0.28, to: 0.35 },
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      // Add golden glow circle behind
      var eugeneGlow = this.add.circle(x, -40, 40, 0xffd700, 0.3).setDepth(7);
      this.tweens.add({
        targets: eugeneGlow,
        alpha: { from: 0.3, to: 0.6 },
        scaleX: { from: 1, to: 1.3 },
        scaleY: { from: 1, to: 1.3 },
        duration: 500,
        yoyo: true,
        repeat: -1
      });
      sprite.eugeneGlow = eugeneGlow;
    } else if (type === 'instrument') {
      sprite.setScale(1.1);
      // Golden shimmer
      this.tweens.add({
        targets: sprite,
        alpha: { from: 1, to: 0.6 },
        duration: 300,
        yoyo: true,
        repeat: -1
      });
    } else {
      sprite.setScale(1);
      // Gentle bob
      this.tweens.add({
        targets: sprite,
        angle: { from: -10, to: 10 },
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    this.collectibles.push({
      sprite: sprite,
      lane: lane,
      type: type,
      value: value,
      isEugene: isEugene,
      yOffset: yOffset,
      hitWidth: 44,    // Large hitbox for easy collection
      hitHeight: 44
    });
  },

  // =============== ENTITY MOVEMENT ===============

  moveEntities: function () {
    var self = this;

    // Move obstacles down
    for (var i = this.obstacles.length - 1; i >= 0; i--) {
      var obs = this.obstacles[i];
      obs.sprite.y += this.speed;
      // Remove if off screen
      if (obs.sprite.y > this.H + 60) {
        obs.sprite.destroy();
        this.obstacles.splice(i, 1);
      }
    }

    // Move collectibles down
    for (var c = this.collectibles.length - 1; c >= 0; c--) {
      var col = this.collectibles[c];
      col.sprite.y += this.speed;
      // Move eugene glow too
      if (col.sprite.eugeneGlow) {
        col.sprite.eugeneGlow.y += this.speed;
      }
      // Remove if off screen
      if (col.sprite.y > this.H + 60) {
        if (col.sprite.eugeneGlow) col.sprite.eugeneGlow.destroy();
        col.sprite.destroy();
        this.collectibles.splice(c, 1);
      }
    }
  },

  // =============== COLLISIONS ===============

  checkCollisions: function () {
    var playerX = this.player.x;
    var playerY = this.player.y;
    var playerHalfW = 18;
    var playerHalfH = 24;
    var self = this;

    // Check obstacles
    if (this.invincibleTimer <= 0) {
      for (var i = this.obstacles.length - 1; i >= 0; i--) {
        var obs = this.obstacles[i];
        if (this.rectsOverlap(
          playerX, playerY, playerHalfW, playerHalfH,
          obs.sprite.x, obs.sprite.y, obs.hitWidth / 2, obs.hitHeight / 2
        )) {
          this.hitObstacle(i);
          break;
        }
      }
    }

    // Check collectibles (generous hitbox)
    for (var c = this.collectibles.length - 1; c >= 0; c--) {
      var col = this.collectibles[c];
      if (this.rectsOverlap(
        playerX, playerY, playerHalfW + 10, playerHalfH + 10,
        col.sprite.x, col.sprite.y, col.hitWidth / 2, col.hitHeight / 2
      )) {
        this.collectItem(c);
      }
    }
  },

  rectsOverlap: function (ax, ay, ahw, ahh, bx, by, bhw, bhh) {
    return Math.abs(ax - bx) < (ahw + bhw) && Math.abs(ay - by) < (ahh + bhh);
  },

  // =============== HIT / COLLECT ===============

  hitObstacle: function (index) {
    var obs = this.obstacles[index];

    // Remove obstacle
    obs.sprite.destroy();
    this.obstacles.splice(index, 1);

    // Lose a life
    this.lives--;
    this.invincibleTimer = GBR.ACT1.invincibilityFrames;

    // Effects
    AudioSynth.playFail();
    TransitionHelper.shake(this, 300, 0.015);
    TransitionHelper.flash(this, 150);

    // Red flash overlay
    var flash = this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0xe63946, 0.3)
      .setDepth(40);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: function () { flash.destroy(); }
    });

    // Show "OUCH!" text
    this.showFloatingText(this.player.x, this.player.y - 60, 'OUCH!', '#e63946', '36px');

    // Spawn hit particles
    this.spawnParticles(this.player.x, this.player.y, 0xe63946, 8);

    // Update HUD
    this.game.events.emit('hud:updateLives', this.lives);

    // Check game over
    if (this.lives <= 0) {
      this.gameOver();
    }
  },

  collectItem: function (index) {
    var col = this.collectibles[index];

    // Collect sound
    AudioSynth.playCollect();

    // Particles at collection point
    var particleColor = col.type === 'dollar' ? 0x32cd32 : (col.isEugene ? 0x3498db : 0xffd700);
    this.spawnParticles(col.sprite.x, col.sprite.y, particleColor, 10);

    if (col.isEugene) {
      // WIN!
      if (col.sprite.eugeneGlow) col.sprite.eugeneGlow.destroy();
      col.sprite.destroy();
      this.collectibles.splice(index, 1);
      this.triggerWin();
      return;
    }

    if (col.type === 'instrument') {
      this.instrumentsCollected++;
      this.dollars += col.value;
      this.score += col.value;
      this.showFloatingText(col.sprite.x, col.sprite.y - 20, '+' + col.value, '#ffd700', '28px');

      // Show instrument count feedback
      var instText = this.instrumentsCollected + '/' + GBR.ACT1.instrumentsNeeded;
      if (this.instrumentsCollected >= GBR.ACT1.instrumentsNeeded) {
        instText = 'FIND EUGENE!';
      }
      this.showFloatingText(this.W / 2, this.H * 0.4, instText, '#ffd700', '32px');

      // Flash effect for rare item
      TransitionHelper.flash(this, 100);
    } else {
      // Dollar
      this.dollars += col.value;
      this.score += col.value;
      this.showFloatingText(col.sprite.x, col.sprite.y - 20, '+$' + col.value, '#32cd32', '24px');
    }

    // Update HUD
    this.game.events.emit('hud:dollars', this.dollars);

    // Clean up sprite
    if (col.sprite.eugeneGlow) col.sprite.eugeneGlow.destroy();
    col.sprite.destroy();
    this.collectibles.splice(index, 1);
  },

  // =============== WIN ===============

  triggerWin: function () {
    var self = this;
    this.gameState = 'win';

    // Big celebration!
    AudioSynth.playSuccess();
    TransitionHelper.flash(this, 300);

    // Gold particle burst
    this.spawnParticles(this.player.x, this.player.y, 0xffd700, 20);
    this.spawnParticles(this.W / 2, this.H / 2, 0x3498db, 15);

    // "EUGENE FOUND!" text
    var foundText = this.add.text(this.W / 2, this.H * 0.35, 'EUGENE FOUND!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '52px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(50).setScale(0).setAlpha(0);

    this.tweens.add({
      targets: foundText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Back.easeOut'
    });

    // Eugene portrait flies in
    var eugenePortrait = this.add.image(this.W / 2, this.H * 0.55, 'member_0')
      .setScale(0)
      .setDepth(50);

    this.tweens.add({
      targets: eugenePortrait,
      scaleX: 0.45,
      scaleY: 0.45,
      duration: 800,
      delay: 400,
      ease: 'Back.easeOut'
    });

    // Continuous celebration particles
    var celebTimer = this.time.addEvent({
      delay: 200,
      callback: function () {
        self.spawnParticles(
          Phaser.Math.Between(100, self.W - 100),
          Phaser.Math.Between(100, self.H - 200),
          Phaser.Math.RND.pick([0xffd700, 0x3498db, 0xe8751a, 0x2ecc71]),
          5
        );
      },
      repeat: 8
    });

    // Save score
    GBR.state.actScores[0] = this.score;
    GBR.state.totalDollars = this.dollars;

    // HUD events - use setTimeout to avoid throttling in background tabs
    setTimeout(function () {
      self.game.events.emit('hud:memberFound', 0);
    }, 500);
    setTimeout(function () {
      self.game.events.emit('hud:actComplete', 0);
    }, 1000);

    // Transition after celebration - use setTimeout to avoid throttling in background tabs
    setTimeout(function () {
      self.game.events.emit('hud:hideLives');
      self.scene.stop('HUDScene');
      TransitionHelper.fadeToScene(self, 'OutfitScene', {
        memberIndex: 0,
        nextScene: 'StoryScene',
        nextData: { actNumber: 1, nextScene: 'Act2RhythmScene' }
      });
    }, 2500);
  },

  // =============== GAME OVER ===============

  gameOver: function () {
    var self = this;
    this.gameState = 'gameover';

    // Screen shake
    TransitionHelper.shake(this, 500, 0.02);

    // Darken overlay
    var overlay = this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0)
      .setDepth(40);
    this.tweens.add({
      targets: overlay,
      fillAlpha: 0.7,
      duration: 500
    });

    // "CRASH!" text
    var crashText = this.add.text(this.W / 2, this.H * 0.28, 'CRASH!', {
      fontFamily: GBR.FONTS.display,
      fontSize: '80px',
      color: '#e63946',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(50).setScale(3).setAlpha(0);

    this.tweens.add({
      targets: crashText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });

    // Wobble the crash text
    this.tweens.add({
      targets: crashText,
      angle: { from: -3, to: 3 },
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Score display - use setTimeout to avoid throttling
    setTimeout(function () {
      self.add.text(self.W / 2, self.H * 0.44, 'SCORE: ' + self.score, {
        fontFamily: GBR.FONTS.display,
        fontSize: '32px',
        color: '#ffd700'
      }).setOrigin(0.5).setDepth(50);

      self.add.text(self.W / 2, self.H * 0.52, 'DOLLARS: $' + self.dollars, {
        fontFamily: GBR.FONTS.fun,
        fontSize: '24px',
        color: '#32cd32'
      }).setOrigin(0.5).setDepth(50);

      var instrumentMsg = self.instrumentsCollected + '/' + GBR.ACT1.instrumentsNeeded + ' INSTRUMENTS';
      self.add.text(self.W / 2, self.H * 0.58, instrumentMsg, {
        fontFamily: GBR.FONTS.fun,
        fontSize: '20px',
        color: '#e8751a'
      }).setOrigin(0.5).setDepth(50);
    }, 500);

    // "TRY AGAIN" button - use setTimeout to avoid throttling
    setTimeout(function () {
      var retryBtn = createButton(self, self.W / 2, self.H * 0.72, 'TRY AGAIN!', function () {
        self.scene.stop('HUDScene');
        self.scene.restart();
      }, {
        bgColor: 0xe63946,
        fontSize: '36px',
        width: 260,
        height: 70
      });

      // Ensure button is on top
      retryBtn.bg.setDepth(50);
      retryBtn.text.setDepth(51);
      retryBtn.hitZone.setDepth(51);

      // Pulse the button
      self.tweens.add({
        targets: retryBtn.text,
        scaleX: { from: 1, to: 1.06 },
        scaleY: { from: 1, to: 1.06 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Encouraging message
      self.add.text(self.W / 2, self.H * 0.84, 'You can do it! Try again!', {
        fontFamily: GBR.FONTS.body,
        fontSize: '18px',
        color: '#cccccc'
      }).setOrigin(0.5).setDepth(50);
    }, 1200);
  },

  // =============== VISUAL EFFECTS ===============

  showFloatingText: function (x, y, text, color, fontSize) {
    var txt = this.add.text(x, y, text, {
      fontFamily: GBR.FONTS.display,
      fontSize: fontSize || '24px',
      color: color || '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: txt,
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Power2.easeOut',
      onComplete: function () {
        txt.destroy();
      }
    });

    this.floatingTexts.push({ text: txt, startTime: this.frameCount });
  },

  cleanupFloatingTexts: function () {
    // Safety cleanup for any orphaned floating texts
    for (var i = this.floatingTexts.length - 1; i >= 0; i--) {
      if (this.frameCount - this.floatingTexts[i].startTime > 120) {
        if (this.floatingTexts[i].text && this.floatingTexts[i].text.active) {
          this.floatingTexts[i].text.destroy();
        }
        this.floatingTexts.splice(i, 1);
      }
    }
  },

  spawnParticles: function (x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var p = this.add.circle(
        x + Phaser.Math.Between(-10, 10),
        y + Phaser.Math.Between(-10, 10),
        Phaser.Math.Between(3, 7),
        color,
        1
      ).setDepth(25);

      var angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      var dist = Phaser.Math.Between(40, 120);

      this.tweens.add({
        targets: p,
        x: p.x + Math.cos(angle) * dist,
        y: p.y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: Phaser.Math.Between(400, 800),
        ease: 'Power2.easeOut',
        onComplete: function () {
          p.destroy();
        }
      });
    }
  },

  updatePlayerGlow: function () {
    this.playerGlow.clear();
    if (this.invincibleTimer > 0) {
      // Red glow when invincible
      this.playerGlow.fillStyle(0xe63946, 0.15);
    } else {
      // Orange glow normally
      this.playerGlow.fillStyle(0xe8751a, 0.12);
    }
    this.playerGlow.fillEllipse(this.player.x, this.playerY + 25, 60, 16);
  }
});
