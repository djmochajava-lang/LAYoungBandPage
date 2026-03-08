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

    // Perspective road geometry (Pole Position style)
    this.vanishX = width * 0.5;
    this.vanishY = height * 0.30;            // horizon line (matches skyline)
    this.roadBottomLeft = width * 0.12;      // wide at bottom
    this.roadBottomRight = width * 0.88;
    this.roadTopLeft = this.vanishX - width * 0.03;   // narrow at horizon
    this.roadTopRight = this.vanishX + width * 0.03;

    // Lane positions at player Y (bottom of road) — used for player positioning
    var playerRoadLeft = this.getRoadLeftAtY(height - 100);
    var playerRoadRight = this.getRoadRightAtY(height - 100);
    var playerRoadWidth = playerRoadRight - playerRoadLeft;
    var laneWidth = playerRoadWidth / 3;
    this.laneXPositions = [
      playerRoadLeft + laneWidth * 0.5,
      playerRoadLeft + laneWidth * 1.5,
      playerRoadLeft + laneWidth * 2.5
    ];
    this.roadLeft = playerRoadLeft;    // keep for building layout compat
    this.roadRight = playerRoadRight;
    this.laneWidth = laneWidth;

    // Player Y position (near bottom)
    this.playerY = height - 100;

    // --- Draw background layers ---
    this.drawBackground();
    this.drawRoad();

    // --- Player SUV (top-down view, already facing up) ---
    this.player = this.add.image(this.laneXPositions[1], this.playerY, 'van');
    this.player.setDisplaySize(this.laneWidth * 0.55, this.laneWidth * 0.85);
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

  // =============== PERSPECTIVE HELPERS ===============

  getRoadLeftAtY: function (y) {
    var t = Math.max(0, Math.min(1, (y - this.vanishY) / (this.H - this.vanishY)));
    return this.roadTopLeft + (this.roadBottomLeft - this.roadTopLeft) * t;
  },

  getRoadRightAtY: function (y) {
    var t = Math.max(0, Math.min(1, (y - this.vanishY) / (this.H - this.vanishY)));
    return this.roadTopRight + (this.roadBottomRight - this.roadTopRight) * t;
  },

  getLaneXAtY: function (lane, y) {
    var left = this.getRoadLeftAtY(y);
    var right = this.getRoadRightAtY(y);
    var lw = (right - left) / 3;
    return left + lw * (lane + 0.5);
  },

  getScaleAtY: function (y) {
    var t = Math.max(0, Math.min(1, (y - this.vanishY) / (this.H - this.vanishY)));
    // Entities at horizon are 0.25x, at player Y are 1.0x
    return 0.25 + t * 0.75;
  },

  getCarAngleAtY: function (lane, y) {
    // Cars on left/right lanes angle toward vanishing point
    // At horizon (t=0) the angle is strongest, at bottom (t=1) it's nearly straight
    var t = Math.max(0, Math.min(1, (y - this.vanishY) / (this.H - this.vanishY)));
    var maxAngle = 12;  // degrees at horizon
    var angle = maxAngle * (1 - t);  // fades as car approaches
    if (lane === 0) return -angle;   // left lane: angled left (toward vanish)
    if (lane === 2) return angle;    // right lane: angled right
    return 0;                        // center lane: straight
  },

  // =============== BACKGROUND ===============

  drawBackground: function () {
    var width = this.W;
    var height = this.H;
    var self = this;

    // Vibrant night sky — deep purple-to-blue gradient (clean, no warm bleed below)
    var sky = this.add.graphics();
    sky.setDepth(0);
    var skylineY_approx = height * 0.30;  // where the skyline sits
    // Top: deep midnight, Bottom at skyline: rich navy-purple
    sky.fillGradientStyle(0x050518, 0x080520, 0x1a1048, 0x201450);
    sky.fillRect(0, 0, width, skylineY_approx);
    // Below skyline: clean dark navy (no warm tones — buildings/road cover this)
    sky.fillStyle(0x0a0a18);
    sky.fillRect(0, skylineY_approx, width, height - skylineY_approx);

    // City glow — smooth gradient bands ABOVE skyline only (no bleed below)
    var cityGlow = this.add.graphics().setDepth(0);
    // Warm orange wash near skyline (ends AT skyline, not below)
    var glowTop = height * 0.20;
    var glowH = skylineY_approx - glowTop;  // stops at skyline
    cityGlow.fillGradientStyle(0xe8751a, 0xe8751a, 0xe8751a, 0xe8751a, 0.02, 0.02, 0.08, 0.08);
    cityGlow.fillRect(0, glowTop, width, glowH);
    // Purple ambient haze just above skyline
    var hazeTop = height * 0.22;
    var hazeH = skylineY_approx - hazeTop;
    cityGlow.fillGradientStyle(0x6c3483, 0x6c3483, 0x6c3483, 0x6c3483, 0.01, 0.01, 0.06, 0.06);
    cityGlow.fillRect(0, hazeTop, width, hazeH);
    // Gold warm wash just above skyline
    var goldTop = height * 0.24;
    var goldH = skylineY_approx - goldTop;
    cityGlow.fillGradientStyle(0xffd700, 0xffd700, 0xffd700, 0xffd700, 0.0, 0.0, 0.05, 0.05);
    cityGlow.fillRect(0, goldTop, width, goldH);

    // Stars in sky (more, with color variety)
    for (var i = 0; i < 80; i++) {
      var sx = Phaser.Math.Between(0, width);
      var sy = Phaser.Math.Between(0, height * 0.35);
      var sr = Phaser.Math.FloatBetween(0.5, 2.5);
      var sa = Phaser.Math.FloatBetween(0.3, 1.0);
      var star = this.add.circle(sx, sy, sr, 0xffffff, sa);
      star.setDepth(0);
      this.tweens.add({
        targets: star,
        alpha: { from: sa, to: 0.05 },
        duration: Phaser.Math.Between(600, 2200),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
      this.bgStars.push(star);
    }

    // Colored accent stars (more of them, brighter)
    var starTints = [0xffd700, 0x00e5ff, 0xe84393, 0xff6b6b, 0x2ecc71, 0x9b59b6];
    for (var cs = 0; cs < 10; cs++) {
      var cstar = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height * 0.30),
        Phaser.Math.FloatBetween(1.2, 3.0),
        Phaser.Math.RND.pick(starTints),
        Phaser.Math.FloatBetween(0.4, 0.85)
      ).setDepth(0);
      this.tweens.add({
        targets: cstar,
        alpha: 0.08,
        duration: Phaser.Math.Between(800, 2200),
        yoyo: true, repeat: -1,
        delay: Phaser.Math.Between(0, 1500)
      });
    }

    // ===== WASHINGTON DC SKYLINE =====
    var skylineY = height * 0.30;
    var roadL = this.roadLeft;
    var roadR = this.roadRight;
    var skyline = this.add.graphics();
    skyline.setDepth(1);
    var belowH = (height - skylineY) + 20;
    var windowColors = [0xffd700, 0x00e5ff, 0xe84393, 0xffffff, 0xe8751a, 0x3498db];

    // ---------- LEFT SIDE: Washington Monument + Government Buildings ----------

    // Helper: draw a rectangular building with shade
    var drawBuilding = function (gfx, bx, by, bw, bh, shade) {
      gfx.fillStyle(Phaser.Display.Color.GetColor(shade, shade, shade + 8), 0.95);
      gfx.fillRect(bx, by, bw, bh);
    };

    // Helper: draw windows on a building face
    var drawWindows = function (gfx, bx, bw, topY, bottomY, spacing, prob) {
      for (var wy = topY + 5; wy < bottomY - 3; wy += (spacing || 9)) {
        for (var wx = bx + 3; wx < bx + bw - 4; wx += 7) {
          if (Math.random() > (prob || 0.35)) {
            var wc = Phaser.Math.RND.pick(windowColors);
            gfx.fillStyle(wc, Phaser.Math.FloatBetween(0.15, 0.55));
            gfx.fillRect(wx, wy, 3, 4);
          }
        }
      }
    };

    // Helper: draw classical pediment (triangle on top of building)
    var drawPediment = function (gfx, bx, bw, topY, pedH, shade) {
      gfx.fillStyle(Phaser.Display.Color.GetColor(shade + 3, shade + 3, shade + 10), 0.95);
      gfx.beginPath();
      gfx.moveTo(bx + bw / 2, topY - pedH);
      gfx.lineTo(bx - 1, topY);
      gfx.lineTo(bx + bw + 1, topY);
      gfx.closePath();
      gfx.fillPath();
    };

    // Helper: draw columns on a building face
    var drawColumns = function (gfx, bx, bw, topY, colH, count) {
      var spacing = bw / (count + 1);
      gfx.lineStyle(1, 0x222233, 0.4);
      for (var c = 1; c <= count; c++) {
        var cx = bx + spacing * c;
        gfx.lineBetween(cx, topY, cx, topY + colH);
      }
    };

    // ---- Left side buildings (0 to roadL) ----
    var leftZoneW = roadL;

    // Far-left government office
    var lb1x = 0, lb1w = leftZoneW * 0.22, lb1h = 55;
    drawBuilding(skyline, lb1x, skylineY - lb1h, lb1w, lb1h + belowH, 35);
    drawWindows(skyline, lb1x, lb1w, skylineY - lb1h, skylineY, 9, 0.4);

    // Smithsonian-style museum (wider, with pediment)
    var lb2x = lb1w + 3, lb2w = leftZoneW * 0.28, lb2h = 75;
    drawBuilding(skyline, lb2x, skylineY - lb2h, lb2w, lb2h + belowH, 30);
    drawPediment(skyline, lb2x, lb2w, skylineY - lb2h, 10, 30);
    drawColumns(skyline, lb2x, lb2w, skylineY - lb2h, lb2h * 0.6, 4);
    drawWindows(skyline, lb2x, lb2w, skylineY - lb2h + 8, skylineY, 10, 0.45);

    // Another government building
    var lb3x = lb2x + lb2w + 2, lb3w = leftZoneW * 0.18, lb3h = 60;
    drawBuilding(skyline, lb3x, skylineY - lb3h, lb3w, lb3h + belowH, 38);
    drawWindows(skyline, lb3x, lb3w, skylineY - lb3h, skylineY, 9, 0.4);

    // === WASHINGTON MONUMENT (tall obelisk near road edge) ===
    var monW = 14;
    var monH = 190;
    var monX = roadL - monW - 6;
    var monShade = 42;
    // Obelisk shaft
    drawBuilding(skyline, monX, skylineY - monH, monW, monH + belowH, monShade);
    // Pyramidal cap (pointed top)
    skyline.fillStyle(Phaser.Display.Color.GetColor(monShade + 4, monShade + 4, monShade + 12), 0.95);
    skyline.beginPath();
    skyline.moveTo(monX + monW / 2, skylineY - monH - 18);  // pointed tip
    skyline.lineTo(monX - 1, skylineY - monH);
    skyline.lineTo(monX + monW + 1, skylineY - monH);
    skyline.closePath();
    skyline.fillPath();
    // Subtle observation slits near top
    skyline.fillStyle(0xffd700, 0.12);
    skyline.fillRect(monX + 5, skylineY - monH + 8, 4, 3);
    skyline.fillRect(monX + 5, skylineY - monH + 14, 4, 3);
    // Slight highlight on one side (moonlight)
    skyline.fillStyle(0xffffff, 0.03);
    skyline.fillRect(monX + monW - 3, skylineY - monH, 3, monH);

    // Blinking red aviation warning light at the tip
    var monTipX = monX + monW / 2;
    var monTipY = skylineY - monH - 18;
    var redLight = this.add.circle(monTipX, monTipY, 2.5, 0xff0000, 0.9).setDepth(1);
    this.tweens.add({
      targets: redLight,
      alpha: { from: 0.9, to: 0.05 },
      duration: 1500,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });
    // Red glow halo around light
    var redGlow = this.add.circle(monTipX, monTipY, 6, 0xff0000, 0.15).setDepth(1);
    this.tweens.add({
      targets: redGlow,
      alpha: { from: 0.15, to: 0.0 },
      duration: 1500,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Street-level windows on left buildings (below skyline, sparser)
    var leftBuildings = [
      { x: lb1x, w: lb1w }, { x: lb2x, w: lb2w }, { x: lb3x, w: lb3w }
    ];
    for (var li = 0; li < leftBuildings.length; li++) {
      var lb = leftBuildings[li];
      for (var lwy = skylineY + 10; lwy < height - 20; lwy += 18) {
        for (var lwx = lb.x + 3; lwx < lb.x + lb.w - 5; lwx += 9) {
          if (Math.random() > 0.55) {
            skyline.fillStyle(Phaser.Math.RND.pick(windowColors), Phaser.Math.FloatBetween(0.10, 0.35));
            skyline.fillRect(lwx, lwy, 3, 5);
          }
        }
      }
    }

    // ---------- RIGHT SIDE: US Capitol Building (wide & low, prominent dome) ----------

    var rightStart = roadR;
    var rightZoneW = width - roadR;

    // === US CAPITOL BUILDING ===
    // The real Capitol is VERY wide and low — about 3:1 width-to-height ratio
    // It should span the entire right zone and even overflow off-screen to the right
    var capTotalW = rightZoneW * 1.3;  // wider than zone — right side goes off screen
    var capX = rightStart + 4;   // start just past road edge
    var capShade = 42;

    // Wing dimensions — wings are the widest, lowest parts
    var wingH = 40;   // short wings
    var lwingW = capTotalW * 0.30;   // left wing (closer to road, fully visible)
    var rwingW = capTotalW * 0.30;   // right wing (extends off screen)

    // Central body — taller but narrower than wings combined
    var mainBodyW = capTotalW * 0.28;
    var mainBodyH = 55;   // taller than wings but still LOW compared to old version
    var mainBodyX = capX + lwingW - 2;

    // Right wing position
    var rwingX = mainBodyX + mainBodyW - 2;

    // Draw left wing (fully visible, closer to road)
    drawBuilding(skyline, capX, skylineY - wingH, lwingW, wingH + belowH, capShade - 4);
    // Pediment on left wing (triangular classical facade)
    skyline.fillStyle(Phaser.Display.Color.GetColor(capShade, capShade, capShade + 8), 0.9);
    skyline.beginPath();
    skyline.moveTo(capX + lwingW * 0.15, skylineY - wingH);
    skyline.lineTo(capX + lwingW * 0.5, skylineY - wingH - 10);
    skyline.lineTo(capX + lwingW * 0.85, skylineY - wingH);
    skyline.closePath();
    skyline.fillPath();

    // Draw main central body (taller section under dome)
    drawBuilding(skyline, mainBodyX, skylineY - mainBodyH, mainBodyW, mainBodyH + belowH, capShade);

    // Draw right wing (extends off screen — that's fine, it gets clipped)
    drawBuilding(skyline, rwingX, skylineY - wingH, rwingW, wingH + belowH, capShade - 6);
    // Pediment on right wing
    skyline.fillStyle(Phaser.Display.Color.GetColor(capShade - 2, capShade - 2, capShade + 6), 0.9);
    skyline.beginPath();
    skyline.moveTo(rwingX + rwingW * 0.15, skylineY - wingH);
    skyline.lineTo(rwingX + rwingW * 0.5, skylineY - wingH - 10);
    skyline.lineTo(rwingX + rwingW * 0.85, skylineY - wingH);
    skyline.closePath();
    skyline.fillPath();

    // Stepped base between wings and center (connecting terraces)
    var stepH = (mainBodyH - wingH) * 0.4;
    var stepLeftX = capX + lwingW - 8;
    drawBuilding(skyline, stepLeftX, skylineY - wingH - stepH, 12, stepH + wingH + belowH, capShade - 2);
    var stepRightX = rwingX - 4;
    drawBuilding(skyline, stepRightX, skylineY - wingH - stepH, 12, stepH + wingH + belowH, capShade - 2);

    // Dome drum (wide cylindrical base for dome)
    var drumW = mainBodyW * 0.65;
    var drumH = 18;
    var drumX = mainBodyX + (mainBodyW - drumW) / 2;
    var drumY = skylineY - mainBodyH - drumH;
    drawBuilding(skyline, drumX, drumY, drumW, drumH, capShade + 3);
    // Small windows on drum (peristyle)
    skyline.fillStyle(0xffd700, 0.18);
    for (var dw = drumX + 3; dw < drumX + drumW - 3; dw += 4) {
      skyline.fillRect(dw, drumY + 3, 2, 8);
    }

    // Dome (half-ellipse — wider and taller for prominence)
    var domeW = drumW * 1.20;
    var domeRise = 48;   // taller dome for visibility
    var domeCX = drumX + drumW / 2;
    var domeBaseY = drumY;
    skyline.fillStyle(Phaser.Display.Color.GetColor(capShade + 6, capShade + 6, capShade + 14), 0.95);
    skyline.beginPath();
    skyline.moveTo(domeCX - domeW / 2, domeBaseY);
    for (var a = Math.PI; a >= 0; a -= 0.06) {
      var dx = domeCX + (domeW / 2) * Math.cos(a);
      var dy = domeBaseY - domeRise * Math.sin(a);
      skyline.lineTo(dx, dy);
    }
    skyline.lineTo(domeCX + domeW / 2, domeBaseY);
    skyline.closePath();
    skyline.fillPath();

    // Dome ribs (subtle vertical lines on dome)
    skyline.lineStyle(1, Phaser.Display.Color.GetColor(capShade + 12, capShade + 12, capShade + 20), 0.12);
    for (var rib = -2; rib <= 2; rib++) {
      var ribX = domeCX + rib * (domeW / 8);
      skyline.lineBetween(ribX, domeBaseY, ribX, domeBaseY - domeRise * 0.85);
    }

    // Dome highlight (subtle shine on left side from road glow)
    skyline.fillStyle(0xffffff, 0.05);
    skyline.beginPath();
    skyline.moveTo(domeCX - 2, domeBaseY);
    for (var a2 = Math.PI * 0.9; a2 >= Math.PI * 0.45; a2 -= 0.08) {
      var dx2 = domeCX + (domeW / 2 - 3) * Math.cos(a2);
      var dy2 = domeBaseY - (domeRise - 3) * Math.sin(a2);
      skyline.lineTo(dx2, dy2);
    }
    skyline.closePath();
    skyline.fillPath();

    // Cupola / lantern on top of dome
    var cupW = 10;
    var cupH = 14;
    var cupX = domeCX - cupW / 2;
    var cupY = domeBaseY - domeRise - cupH;
    skyline.fillStyle(Phaser.Display.Color.GetColor(capShade + 6, capShade + 6, capShade + 16), 0.95);
    skyline.fillRect(cupX, cupY, cupW, cupH);
    // Tiny dome on cupola
    skyline.beginPath();
    skyline.moveTo(cupX, cupY);
    for (var a3 = Math.PI; a3 >= 0; a3 -= 0.15) {
      skyline.lineTo(cupX + cupW / 2 + (cupW / 2) * Math.cos(a3), cupY - 6 * Math.sin(a3));
    }
    skyline.closePath();
    skyline.fillPath();

    // Statue of Freedom on top (tiny vertical line + dot)
    skyline.lineStyle(1.5, 0xcccccc, 0.6);
    skyline.lineBetween(domeCX, cupY - 6, domeCX, cupY - 14);
    var statueTop = this.add.circle(domeCX, cupY - 15, 2, 0xcccccc, 0.55).setDepth(1);

    // Capitol windows — left wing (tall arched windows, classical)
    drawWindows(skyline, capX, lwingW, skylineY - wingH, skylineY, 8, 0.45);
    // Capitol windows — main body
    drawWindows(skyline, mainBodyX, mainBodyW, skylineY - mainBodyH, skylineY, 8, 0.40);
    // Capitol windows — right wing
    drawWindows(skyline, rwingX, rwingW, skylineY - wingH, skylineY, 8, 0.45);

    // Columns on Capitol main body (prominent)
    drawColumns(skyline, mainBodyX, mainBodyW, skylineY - mainBodyH, mainBodyH * 0.6, 8);
    // Columns on left wing
    drawColumns(skyline, capX + 4, lwingW - 8, skylineY - wingH, wingH * 0.5, 5);

    // Street-level windows on right buildings (below skyline)
    var rightBuildings = [
      { x: capX, w: lwingW },
      { x: mainBodyX, w: mainBodyW },
      { x: rwingX, w: rwingW }
    ];
    for (var ri = 0; ri < rightBuildings.length; ri++) {
      var rb = rightBuildings[ri];
      for (var rwy = skylineY + 10; rwy < height - 20; rwy += 18) {
        for (var rwx = rb.x + 3; rwx < rb.x + rb.w - 5; rwx += 9) {
          if (Math.random() > 0.55) {
            skyline.fillStyle(Phaser.Math.RND.pick(windowColors), Phaser.Math.FloatBetween(0.10, 0.35));
            skyline.fillRect(rwx, rwy, 3, 5);
          }
        }
      }
    }

    // ---------- NEON SIGNS (office buildings only, not landmarks) ----------
    var neonColors = [0xe63946, 0x00e5ff, 0xe84393, 0xffd700, 0x2ecc71];
    var neonGfx = this.add.graphics().setDepth(1);
    var neonTargets = [
      { x: lb1x, w: lb1w, h: 55 },
      { x: lb3x, w: lb3w, h: 60 }
    ];
    for (var ns = 0; ns < neonTargets.length; ns++) {
      if (Math.random() > 0.4) {
        var nt = neonTargets[ns];
        var nc = Phaser.Math.RND.pick(neonColors);
        neonGfx.fillStyle(nc, 0.7);
        neonGfx.fillRect(nt.x + 2, skylineY - nt.h - 4, nt.w - 6, 3);
        neonGfx.fillStyle(nc, 0.10);
        neonGfx.fillRect(nt.x - 2, skylineY - nt.h - 10, nt.w + 2, 10);
      }
    }

    // Animated neon sign pulse
    this.tweens.add({
      targets: neonGfx,
      alpha: { from: 1, to: 0.4 },
      duration: 1200,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Vibrant horizon glow — warm band ABOVE skyline only (no bleed below)
    var glow = this.add.graphics();
    glow.setDepth(1);
    // Orange core glow (centered on skyline, slight bleed below is ok — just 2px)
    glow.fillStyle(0xe8751a, 0.18);
    glow.fillRect(0, skylineY - 8, width, 10);
    // Gold band (right at skyline)
    glow.fillStyle(0xffd700, 0.14);
    glow.fillRect(0, skylineY - 3, width, 5);
    // Pink/magenta accent above
    glow.fillStyle(0xe84393, 0.08);
    glow.fillRect(0, skylineY - 20, width, 14);
    // Wide warm ambient spread (ABOVE skyline only)
    glow.fillStyle(0xe8751a, 0.05);
    glow.fillRect(0, skylineY - 35, width, 35);
    // Red underline at horizon (thin, right at line)
    glow.fillStyle(0xe63946, 0.12);
    glow.fillRect(0, skylineY - 2, width, 3);
    // Animated horizon pulse (above skyline)
    var glowPulse = this.add.graphics().setDepth(1);
    glowPulse.fillStyle(0xffd700, 0.06);
    glowPulse.fillRect(0, skylineY - 12, width, 14);
    this.tweens.add({
      targets: glowPulse,
      alpha: { from: 1, to: 0.3 },
      duration: 2000,
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });
  },

  drawRoad: function () {
    var W = this.W;
    var H = this.H;

    // Road surface — filled perspective trapezoid
    this.roadGraphics = this.add.graphics().setDepth(2);
    this.roadGraphics.fillStyle(0x1a1a2e, 1);
    this.roadGraphics.beginPath();
    this.roadGraphics.moveTo(this.roadTopLeft, this.vanishY);
    this.roadGraphics.lineTo(this.roadTopRight, this.vanishY);
    this.roadGraphics.lineTo(this.roadBottomRight, H);
    this.roadGraphics.lineTo(this.roadBottomLeft, H);
    this.roadGraphics.closePath();
    this.roadGraphics.fillPath();

    // Neon road edges — diagonal lines converging at horizon
    this.roadGraphics.lineStyle(3, 0xe8751a, 0.8);
    this.roadGraphics.lineBetween(this.roadTopLeft, this.vanishY, this.roadBottomLeft, H);
    this.roadGraphics.lineBetween(this.roadTopRight, this.vanishY, this.roadBottomRight, H);

    // Lane dividers — perspective lines converging at vanish point
    var div1TopX = this.roadTopLeft + (this.roadTopRight - this.roadTopLeft) / 3;
    var div1BotX = this.roadBottomLeft + (this.roadBottomRight - this.roadBottomLeft) / 3;
    var div2TopX = this.roadTopLeft + (this.roadTopRight - this.roadTopLeft) * 2 / 3;
    var div2BotX = this.roadBottomLeft + (this.roadBottomRight - this.roadBottomLeft) * 2 / 3;

    // Store divider endpoints for stripe positioning
    this.div1TopX = div1TopX;
    this.div1BotX = div1BotX;
    this.div2TopX = div2TopX;
    this.div2BotX = div2BotX;

    this.roadGraphics.lineStyle(1, 0xffd700, 0.2);
    this.roadGraphics.lineBetween(div1TopX, this.vanishY, div1BotX, H);
    this.roadGraphics.lineBetween(div2TopX, this.vanishY, div2BotX, H);

    // Horizon glow bar — warm orange/gold at vanishing point
    var horizonGfx = this.add.graphics().setDepth(2);
    var hWidth = this.roadTopRight - this.roadTopLeft;
    horizonGfx.fillStyle(0xe8751a, 0.25);
    horizonGfx.fillRect(this.roadTopLeft - 10, this.vanishY - 3, hWidth + 20, 6);
    horizonGfx.fillStyle(0xffd700, 0.15);
    horizonGfx.fillRect(this.roadTopLeft - 20, this.vanishY - 1, hWidth + 40, 3);
    // Wider ambient glow
    horizonGfx.fillStyle(0xe8751a, 0.06);
    horizonGfx.fillRect(this.roadTopLeft - 40, this.vanishY - 8, hWidth + 80, 16);

    // Sidewalk strips — perspective trapezoids flanking the road
    var sideBg = this.add.graphics().setDepth(1);
    sideBg.fillStyle(0x2a2240, 0.85);
    // Left sidewalk
    sideBg.beginPath();
    sideBg.moveTo(this.roadTopLeft - 2, this.vanishY);
    sideBg.lineTo(this.roadTopLeft, this.vanishY);
    sideBg.lineTo(this.roadBottomLeft, H);
    sideBg.lineTo(this.roadBottomLeft - 10, H);
    sideBg.closePath();
    sideBg.fillPath();
    // Right sidewalk
    sideBg.beginPath();
    sideBg.moveTo(this.roadTopRight, this.vanishY);
    sideBg.lineTo(this.roadTopRight + 2, this.vanishY);
    sideBg.lineTo(this.roadBottomRight + 10, H);
    sideBg.lineTo(this.roadBottomRight, H);
    sideBg.closePath();
    sideBg.fillPath();

    // Vibrant neon glow strips along road edges (orange + pink)
    // Orange outer glow — left
    sideBg.fillStyle(0xe8751a, 0.12);
    sideBg.beginPath();
    sideBg.moveTo(this.roadTopLeft - 8, this.vanishY);
    sideBg.lineTo(this.roadTopLeft, this.vanishY);
    sideBg.lineTo(this.roadBottomLeft, H);
    sideBg.lineTo(this.roadBottomLeft - 16, H);
    sideBg.closePath();
    sideBg.fillPath();
    // Orange outer glow — right
    sideBg.beginPath();
    sideBg.moveTo(this.roadTopRight, this.vanishY);
    sideBg.lineTo(this.roadTopRight + 8, this.vanishY);
    sideBg.lineTo(this.roadBottomRight + 16, H);
    sideBg.lineTo(this.roadBottomRight, H);
    sideBg.closePath();
    sideBg.fillPath();
    // Pink ambient wash on sides (further out from road)
    sideBg.fillStyle(0xe84393, 0.05);
    sideBg.beginPath();
    sideBg.moveTo(this.roadTopLeft - 20, this.vanishY);
    sideBg.lineTo(this.roadTopLeft - 8, this.vanishY);
    sideBg.lineTo(this.roadBottomLeft - 16, H);
    sideBg.lineTo(this.roadBottomLeft - 35, H);
    sideBg.closePath();
    sideBg.fillPath();
    sideBg.beginPath();
    sideBg.moveTo(this.roadTopRight + 8, this.vanishY);
    sideBg.lineTo(this.roadTopRight + 20, this.vanishY);
    sideBg.lineTo(this.roadBottomRight + 35, H);
    sideBg.lineTo(this.roadBottomRight + 16, H);
    sideBg.closePath();
    sideBg.fillPath();

    // Create scrolling stripe sprites along lane dividers — positioned by perspective
    this.stripeContainer = this.add.group();
    for (var sy = this.vanishY; sy < H + 60; sy += 50) {
      for (var d = 0; d < 2; d++) {
        var dtX = d === 0 ? div1TopX : div2TopX;
        var dbX = d === 0 ? div1BotX : div2BotX;
        var t = Math.max(0, (sy - this.vanishY) / (H - this.vanishY));
        var sx = dtX + (dbX - dtX) * t;
        var stripe = this.add.image(sx, sy, 'road_stripe')
          .setAlpha(0.1 + t * 0.4)
          .setTint(0xffd700)
          .setDepth(3)
          .setScale(0.3 + t * 0.7);
        stripe.laneDiv = d;
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
    var H = this.H;

    for (var i = 0; i < this.roadStripes.length; i++) {
      var stripe = this.roadStripes[i];
      stripe.y += scrollSpeed;

      // Wrap around to horizon
      if (stripe.y > H + 30) {
        stripe.y = this.vanishY;
      }

      // Recalculate X and scale based on Y (perspective)
      var t = Math.max(0, (stripe.y - this.vanishY) / (H - this.vanishY));
      var divTopX, divBotX;
      if (stripe.laneDiv === 0) {
        divTopX = this.div1TopX;
        divBotX = this.div1BotX;
      } else {
        divTopX = this.div2TopX;
        divBotX = this.div2BotX;
      }
      stripe.x = divTopX + (divBotX - divTopX) * t;
      stripe.setScale(0.3 + t * 0.7);
      stripe.setAlpha(0.1 + t * 0.4);
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
    var spawnY = this.vanishY + 10;
    var x = this.getLaneXAtY(lane, spawnY);

    // Pick a random car variant (5 types: red sedan, orange SUV, grey coupe, yellow taxi, green muscle)
    var carIdx = Phaser.Math.Between(0, 4);
    var obstacle = this.add.image(x, spawnY, 'obstacle_car_' + carIdx).setDepth(8);
    // Flip Y so we see the rear of the car (taillights toward player)
    obstacle.setFlipY(true);
    // Scale to fit lane — perspective-adjusted at spawn point
    var initScale = this.getScaleAtY(spawnY);
    obstacle.setDisplaySize(this.laneWidth * 0.55 * initScale, this.laneWidth * 0.85 * initScale);

    // Angle car toward vanishing point based on lane
    var carAngle = this.getCarAngleAtY(lane, spawnY);
    obstacle.setAngle(carAngle);

    // Taillight glow (red, behind the car driving away)
    var taillight = this.add.graphics().setDepth(7);
    obstacle.headlightGfx = taillight;

    this.obstacles.push({
      sprite: obstacle,
      lane: lane,
      hitWidth: 24,
      hitHeight: 32
    });
  },

  spawnCollectible: function () {
    var lane = Phaser.Math.Between(0, 2);
    var spawnY = this.vanishY + 10;
    var x = this.getLaneXAtY(lane, spawnY);
    var initScale = this.getScaleAtY(spawnY);
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

    var sprite = this.add.image(x, spawnY + yOffset, textureKey).setDepth(8);

    if (isEugene) {
      sprite.setScale(0.28 * initScale);
      // Glowing pulse for Eugene
      this.tweens.add({
        targets: sprite,
        scaleX: { from: 0.28 * initScale, to: 0.35 * initScale },
        scaleY: { from: 0.28 * initScale, to: 0.35 * initScale },
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      // Add golden glow circle behind
      var eugeneGlow = this.add.circle(x, spawnY, 40 * initScale, 0xffd700, 0.3).setDepth(7);
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
      sprite.setScale(1.3 * initScale);
      // Golden shimmer + gentle spin
      this.tweens.add({
        targets: sprite,
        alpha: { from: 1, to: 0.6 },
        angle: { from: -5, to: 5 },
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else {
      sprite.setScale(1.3 * initScale);
      // Dollar bill gentle wobble (do NOT tween y — moveEntities handles y movement)
      this.tweens.add({
        targets: sprite,
        angle: { from: -8, to: 8 },
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

    // Move obstacles down with perspective
    for (var i = this.obstacles.length - 1; i >= 0; i--) {
      var obs = this.obstacles[i];
      obs.sprite.y += this.speed;

      // Update X position to follow lane's perspective line
      obs.sprite.x = this.getLaneXAtY(obs.lane, obs.sprite.y);

      // Scale up as it approaches (perspective)
      var s = this.getScaleAtY(obs.sprite.y);
      obs.sprite.setDisplaySize(this.laneWidth * 0.55 * s, this.laneWidth * 0.85 * s);

      // Update angle to follow road perspective
      obs.sprite.setAngle(this.getCarAngleAtY(obs.lane, obs.sprite.y));

      // Redraw taillight glow (red, behind the car driving away)
      if (obs.sprite.headlightGfx) {
        obs.sprite.headlightGfx.clear();
        obs.sprite.headlightGfx.fillStyle(0xff3333, 0.15 * s);
        obs.sprite.headlightGfx.fillEllipse(obs.sprite.x, obs.sprite.y - 30 * s, 30 * s, 10 * s);
      }

      // Remove if off screen
      if (obs.sprite.y > this.H + 60) {
        if (obs.sprite.headlightGfx) obs.sprite.headlightGfx.destroy();
        obs.sprite.destroy();
        this.obstacles.splice(i, 1);
      }
    }

    // Move collectibles down with perspective
    for (var c = this.collectibles.length - 1; c >= 0; c--) {
      var col = this.collectibles[c];
      col.sprite.y += this.speed;

      // Update X position to follow lane perspective
      col.sprite.x = this.getLaneXAtY(col.lane, col.sprite.y);

      // Scale collectibles with perspective
      var cs = this.getScaleAtY(col.sprite.y);
      // Don't override scale for Eugene (has pulsing tween) — just update X
      if (!col.isEugene) {
        col.sprite.setScale(1.3 * cs);
      }

      // Move eugene glow too
      if (col.sprite.eugeneGlow) {
        col.sprite.eugeneGlow.x = col.sprite.x;
        col.sprite.eugeneGlow.y = col.sprite.y;
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

    // Remove obstacle and headlight
    if (obs.sprite.headlightGfx) obs.sprite.headlightGfx.destroy();
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
