/* GroovyBandRush/js/helpers/PatternEngine.js */

var PatternEngine = (function () {
  'use strict';

  function create(numOptions) {
    return {
      numOptions: numOptions || 4,
      pattern: [],
      playerInput: [],
      retries: 0
    };
  }

  function addToPattern(engine) {
    engine.pattern.push(Math.floor(Math.random() * engine.numOptions));
  }

  function startRound(engine) {
    engine.playerInput = [];
    addToPattern(engine);
  }

  function checkInput(engine, index) {
    var pos = engine.playerInput.length;
    engine.playerInput.push(index);
    return engine.playerInput[pos] === engine.pattern[pos];
  }

  function isRoundComplete(engine) {
    return engine.playerInput.length === engine.pattern.length;
  }

  function getPattern(engine) {
    return engine.pattern.slice();
  }

  function getPatternLength(engine) {
    return engine.pattern.length;
  }

  function resetInput(engine) {
    engine.playerInput = [];
  }

  function reset(engine) {
    engine.pattern = [];
    engine.playerInput = [];
    engine.retries = 0;
  }

  return {
    create: create,
    addToPattern: addToPattern,
    startRound: startRound,
    checkInput: checkInput,
    isRoundComplete: isRoundComplete,
    getPattern: getPattern,
    getPatternLength: getPatternLength,
    resetInput: resetInput,
    reset: reset
  };
})();
