/* GroovyBandRush/js/helpers/AudioSynth.js */

var AudioSynth = (function () {
  'use strict';

  var context = null;

  function getContext() {
    if (!context) {
      context = new (window.AudioContext || window.webkitAudioContext)();
    }
    return context;
  }

  /**
   * Play a synthesized tone
   * @param {number} frequency - Hz (e.g., 440 for A4)
   * @param {number} duration - seconds (default 0.4)
   * @param {string} waveType - 'triangle', 'sawtooth', 'square', 'sine' (default 'triangle')
   * @param {number} volume - 0 to 1 (default 0.4)
   */
  function playNote(frequency, duration, waveType, volume) {
    duration = duration || 0.4;
    waveType = waveType || 'triangle';
    volume = volume !== undefined ? volume : 0.4;

    var ctx = getContext();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    // ADSR-like envelope for a nicer sound
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);      // Attack
    gain.gain.linearRampToValueAtTime(volume * 0.7, ctx.currentTime + 0.1); // Decay
    gain.gain.setValueAtTime(volume * 0.7, ctx.currentTime + duration - 0.1); // Sustain
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration); // Release

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  /**
   * Play a drum-like hit sound
   * @param {number} frequency - base frequency
   * @param {number} volume - 0 to 1
   */
  function playDrum(frequency, volume) {
    frequency = frequency || 150;
    volume = volume !== undefined ? volume : 0.5;

    var ctx = getContext();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  /**
   * Play a success jingle (ascending notes)
   */
  function playSuccess() {
    var notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    for (var i = 0; i < notes.length; i++) {
      (function (idx) {
        setTimeout(function () {
          playNote(notes[idx], 0.3, 'triangle', 0.3);
        }, idx * 120);
      })(i);
    }
  }

  /**
   * Play a failure sound (descending)
   */
  function playFail() {
    playNote(300, 0.3, 'sawtooth', 0.3);
    setTimeout(function () {
      playNote(200, 0.4, 'sawtooth', 0.2);
    }, 200);
  }

  /**
   * Play a coin/collect sound
   */
  function playCollect() {
    playNote(880, 0.15, 'square', 0.2);
    setTimeout(function () {
      playNote(1175, 0.15, 'square', 0.15);
    }, 80);
  }

  /**
   * Resume audio context (required after user gesture on mobile)
   */
  function resume() {
    var ctx = getContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  return {
    playNote: playNote,
    playDrum: playDrum,
    playSuccess: playSuccess,
    playFail: playFail,
    playCollect: playCollect,
    resume: resume,
    getContext: getContext
  };
})();
