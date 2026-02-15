/* GroovyBandRush/js/ui/LAFace.js
 * Animated portrait for L.A. Young — StoryScene character.
 * Always uses IMG_3118.jpg (la_talking_head) for the portrait bubble.
 * Falls back to la_avatar if la_talking_head isn't loaded.
 *
 * Also exports processTexture() for use by SingerOutfitScene
 * to flood-fill outfit photo backgrounds.
 */

var LAFace = (function () {
  'use strict';

  // Tuning for la_talking_head (IMG_3118.jpg — 811x1202, close-up face)
  var TALKING_HEAD_TUNING = { scale: 0.22, xOff: 0, yOff: 20 };

  // Fallback tuning for la_avatar (the original default)
  var AVATAR_TUNING = { scale: 0.55, xOff: -15, yOff: 265 };

  /**
   * Determine the texture key for the talking head portrait.
   * Always prefers la_talking_head; falls back to la_avatar.
   */
  function getTextureKey(game) {
    if (game.textures.exists('la_talking_head')) return 'la_talking_head';
    return 'la_avatar';
  }

  /**
   * Process a texture once: flood-fill the photo background from corners
   * with dark navy. Only replaces connected background pixels — teeth
   * and eye-whites stay untouched.
   */
  function processTexture(game, texKey) {
    if (!texKey) texKey = getTextureKey(game);
    var tex = game.textures.get(texKey);
    if (!tex || tex._processed) return;

    var source = tex.getSourceImage();
    var w = source.width, h = source.height;
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    ctx.drawImage(source, 0, 0);

    var imageData = ctx.getImageData(0, 0, w, h);
    var data = imageData.data;

    // Target dark colour
    var tR = 26, tG = 26, tB = 46;

    // Helper: is a pixel "gray/light background"?
    // Threshold sat < 90 catches blue-gray studio backdrops (max sat ~82)
    // while preserving pink fabric (sat ~152) and other saturated colours.
    function isBG(idx) {
      var r = data[idx], g = data[idx + 1], b = data[idx + 2];
      var brightness = (r + g + b) / 3;
      var sat = Math.max(r, g, b) - Math.min(r, g, b);
      return sat < 90 && brightness > 100;
    }

    // Flood-fill mask: 1 = background
    var mask = new Uint8Array(w * h);
    var queue = [];
    var x, y;

    // Seed from all four edges
    for (x = 0; x < w; x++) {
      if (isBG(x * 4))                 queue.push(x);
      if (isBG(((h - 1) * w + x) * 4)) queue.push((h - 1) * w + x);
    }
    for (y = 0; y < h; y++) {
      if (isBG(y * w * 4))             queue.push(y * w);
      if (isBG((y * w + w - 1) * 4))   queue.push(y * w + w - 1);
    }

    for (var s = 0; s < queue.length; s++) mask[queue[s]] = 1;

    // BFS
    var head = 0;
    while (head < queue.length) {
      var pos = queue[head++];
      var px = pos % w, py = (pos - px) / w;
      var neighbours = [];
      if (px > 0)     neighbours.push(pos - 1);
      if (px < w - 1) neighbours.push(pos + 1);
      if (py > 0)     neighbours.push(pos - w);
      if (py < h - 1) neighbours.push(pos + w);
      for (var n = 0; n < neighbours.length; n++) {
        var nb = neighbours[n];
        if (!mask[nb] && isBG(nb * 4)) {
          mask[nb] = 1;
          queue.push(nb);
        }
      }
    }

    // Replace background with dark navy
    for (var i = 0; i < mask.length; i++) {
      if (mask[i]) {
        var di = i * 4;
        data[di] = tR; data[di + 1] = tG; data[di + 2] = tB;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    game.textures.remove(texKey);
    game.textures.addCanvas(texKey, c);
    game.textures.get(texKey)._processed = true;
  }

  function create(scene, x, y) {

    // Always use the talking head photo for portraits
    var texKey = getTextureKey(scene.game);

    // Process texture on first use
    processTexture(scene.game, texKey);

    // Get tuning
    var tuning = (texKey === 'la_talking_head') ? TALKING_HEAD_TUNING : AVATAR_TUNING;

    // Mask dimensions — the visible "portrait bubble"
    var maskW = 170;
    var maskH = 200;

    // ========== 1. AVATAR IMAGE ==========
    var avatar = scene.add.image(0, 0, texKey);
    var avatarScale = tuning.scale;
    avatar.setScale(avatarScale);
    avatar.setX(tuning.xOff);
    avatar.setY(tuning.yOff);

    // ========== 2. ELLIPTICAL MASK ==========
    var maskShape = scene.make.graphics({ x: x, y: y, add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillEllipse(0, 0, maskW, maskH);
    var mask = maskShape.createGeometryMask();

    // ========== 3. GOLD BORDER ==========
    var border = scene.add.graphics({ x: x, y: y });
    border.lineStyle(4, 0xffd700, 0.85);
    border.strokeEllipse(0, 0, maskW + 8, maskH + 8);
    // Outer subtle glow ring
    border.lineStyle(2, 0xffffff, 0.12);
    border.strokeEllipse(0, 0, maskW + 14, maskH + 14);

    // ========== ASSEMBLE ==========
    var container = scene.add.container(x, y, [avatar]);
    container.setMask(mask);
    border.setDepth(container.depth + 1);

    // ========== ANIMATIONS ==========
    var isTalking = false;
    var talkTween = null;

    // Idle bob
    scene.tweens.add({
      targets: [container, maskShape, border],
      y: y - 3,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtle pulse while talking
    function startTalking() {
      if (isTalking) return;
      isTalking = true;
      talkTween = scene.tweens.add({
        targets: avatar,
        scaleX: { from: avatarScale, to: avatarScale * 1.02 },
        scaleY: { from: avatarScale, to: avatarScale * 1.02 },
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    function stopTalking() {
      if (!isTalking) return;
      isTalking = false;
      if (talkTween) { talkTween.stop(); talkTween = null; }
      avatar.setScale(avatarScale);
    }

    function setExpression(type) {
      if (!container.scene) return;
      switch (type) {
        case 'excited':
          scene.tweens.add({
            targets: [container, maskShape],
            scaleX: 1.06, scaleY: 1.06,
            duration: 300, yoyo: true, hold: 200,
            ease: 'Back.easeOut'
          });
          break;
        default:
          scene.tweens.add({
            targets: [container, maskShape],
            scaleX: 1, scaleY: 1, duration: 300,
            ease: 'Sine.easeInOut'
          });
      }
    }

    function destroy() {
      stopTalking();
      if (mask) mask.destroy();
      if (maskShape) maskShape.destroy();
      if (border) border.destroy();
    }

    return {
      container: container,
      startTalking: startTalking,
      stopTalking: stopTalking,
      setExpression: setExpression,
      destroy: destroy
    };
  }

  return { create: create, processTexture: processTexture };
})();
