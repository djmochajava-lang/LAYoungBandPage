/* GroovyBandRush/js/ui/TransitionHelper.js */

var TransitionHelper = {
  /**
   * Fade out then start a new scene
   * @param {Phaser.Scene} scene - current scene
   * @param {string} targetScene - scene key to start
   * @param {object} [data] - data to pass to target scene
   * @param {number} [duration] - fade duration in ms (default 500)
   */
  fadeToScene: function (scene, targetScene, data, duration) {
    duration = duration || 500;
    var sceneKey = scene.scene.key;
    var gameRef = scene.game;
    scene.cameras.main.fadeOut(duration, 0, 0, 0);
    // Use native setTimeout - Phaser scene timers can be unreliable during transitions
    setTimeout(function () {
      gameRef.scene.stop(sceneKey);
      gameRef.scene.start(targetScene, data || {});
    }, duration + 50);
  },

  /**
   * Fade in the current scene
   * @param {Phaser.Scene} scene
   * @param {number} [duration] - fade duration in ms (default 500)
   */
  fadeIn: function (scene, duration) {
    duration = duration || 500;
    scene.cameras.main.fadeIn(duration, 0, 0, 0);
  },

  /**
   * Flash the camera (white flash for impacts/celebrations)
   * @param {Phaser.Scene} scene
   * @param {number} [duration]
   */
  flash: function (scene, duration) {
    duration = duration || 200;
    scene.cameras.main.flash(duration, 255, 255, 255);
  },

  /**
   * Shake the camera (for hits/errors)
   * @param {Phaser.Scene} scene
   * @param {number} [duration]
   * @param {number} [intensity]
   */
  shake: function (scene, duration, intensity) {
    duration = duration || 200;
    intensity = intensity || 0.01;
    scene.cameras.main.shake(duration, intensity);
  }
};
