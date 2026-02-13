/* GroovyBandRush/js/ui/Button.js */

/**
 * Create a kid-friendly interactive button
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {string} label
 * @param {function} callback
 * @param {object} [options]
 * @returns {object} { bg, text, container }
 */
function createButton(scene, x, y, label, callback, options) {
  options = options || {};
  var width = options.width || 240;
  var height = options.height || 64;
  var fontSize = options.fontSize || '28px';
  var bgColor = options.bgColor || 0xe8751a;
  var textColor = options.textColor || '#ffffff';
  var radius = options.radius || 32;

  // Background
  var bg = scene.add.graphics();
  bg.fillStyle(bgColor, 1);
  bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);

  // Hit area
  var hitZone = scene.add.zone(x, y, width, height)
    .setInteractive({ useHandCursor: true });

  // Text
  var text = scene.add.text(x, y, label, {
    fontFamily: GBR.FONTS.display,
    fontSize: fontSize,
    color: textColor,
    stroke: '#000000',
    strokeThickness: 2
  }).setOrigin(0.5);

  // Hover effects
  hitZone.on('pointerover', function () {
    scene.tweens.add({
      targets: [text],
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 100
    });
    bg.clear();
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(x - width / 2 - 4, y - height / 2 - 2, width + 8, height + 4, radius);
    bg.lineStyle(2, 0xffd700, 1);
    bg.strokeRoundedRect(x - width / 2 - 4, y - height / 2 - 2, width + 8, height + 4, radius);
  });

  hitZone.on('pointerout', function () {
    scene.tweens.add({
      targets: [text],
      scaleX: 1,
      scaleY: 1,
      duration: 100
    });
    bg.clear();
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
  });

  hitZone.on('pointerdown', function () {
    AudioSynth.resume();
    AudioSynth.playCollect();
    if (callback) callback();
  });

  return { bg: bg, text: text, hitZone: hitZone };
}
