/* GroovyBandRush/js/config.js */

// --- Global Namespace ---
window.GBR = window.GBR || {};

// --- Color Palette ---
GBR.COLORS = {
  gold: 0xffd700,
  goldHex: '#ffd700',
  red: 0xe63946,
  redHex: '#e63946',
  orange: 0xe8751a,
  orangeHex: '#e8751a',
  pink: 0xe84393,
  pinkHex: '#e84393',
  purple: 0x6c3483,
  purpleHex: '#6c3483',
  navy: 0x1a1a2e,
  navyHex: '#1a1a2e',
  blue: 0x16213e,
  blueHex: '#16213e',
  dark: 0x0a0a0a,
  darkHex: '#0a0a0a',
  white: 0xffffff,
  whiteHex: '#ffffff',
  green: 0x2ecc71,
  greenHex: '#2ecc71'
};

// --- Fonts ---
GBR.FONTS = {
  display: '"Bangers", "Fredoka One", cursive',
  fun: '"Righteous", "Fredoka One", cursive',
  body: '"Playfair Display", Georgia, serif'
};

// --- Band Members ---
GBR.BAND = [
  { name: 'Eugene Chapman', role: 'Saxophone', emoji: '\uD83C\uDFB7', color: 0x3498db, colorHex: '#3498db' },
  { name: 'Kevin Walker', role: 'Bass', emoji: '\uD83C\uDFB8', color: 0x9b59b6, colorHex: '#9b59b6' },
  { name: 'Kevin Robinson', role: 'Guitar', emoji: '\uD83C\uDFB8', color: 0xe74c3c, colorHex: '#e74c3c' },
  { name: 'Jimmy Carney', role: 'Drums', emoji: '\uD83E\uDD41', color: 0x2ecc71, colorHex: '#2ecc71' },
  { name: 'L.A. Young', role: 'Vocals', emoji: '\uD83C\uDFA4', color: 0xe8751a, colorHex: '#e8751a' }
];

// --- Outfit Options ---
GBR.OUTFITS = [
  { name: 'Funky Fresh', color: 0xe63946 },
  { name: 'Classic Soul', color: 0x3498db },
  { name: 'Wild Style', color: 0x2ecc71 }
];

// --- Story Dialogue ---
GBR.STORIES = [
  {
    title: 'THE MISSION',
    speaker: 'L.A. Young',
    text: "Hey there, little star! I'm L.A. Young and I need YOUR help!\nThe big show is tonight but my band is all over the city!\nHop in the van and let's go find them!",
    nextScene: 'Act1RunnerScene'
  },
  {
    title: 'NICE DRIVING!',
    speaker: 'L.A. Young',
    text: "You found Eugene! He's got the smoothest sax in town!\nNow let's warm up with some music notes!\nCatch the falling notes to make beautiful music!",
    nextScene: 'Act2RhythmScene'
  },
  {
    title: 'WHAT A JAM!',
    speaker: 'L.A. Young',
    text: "That was GROOVY! Now we need to tune our instruments!\nMatch the instruments together to power up!\nGet three in a row to make some magic!",
    nextScene: 'Act3MatchScene'
  },
  {
    title: 'KEEP IT GOING!',
    speaker: 'L.A. Young',
    text: "Almost there! We need a drummer for the beat!\nListen to the drums and repeat the pattern!\nCan you remember all the beats?",
    nextScene: 'Act4SimonScene'
  },
  {
    title: 'SHOWTIME!',
    speaker: 'L.A. Young',
    text: "The whole band is here! Time for the BIG SHOW!\nPlay the piano melody to start the concert!\nLet's make this the best show ever!",
    nextScene: 'Act5PianoScene'
  }
];

// --- Act Tuning Parameters ---
GBR.ACT1 = {
  lanes: 3,
  startSpeed: 2,
  maxSpeed: 6,
  speedRamp: 0.001,
  obstacleRate: 180,       // frames between obstacles (decreases over time)
  minObstacleRate: 70,
  lives: 5,
  dollarValue: 50,
  instrumentValue: 200,
  instrumentsNeeded: 3,    // collect 3 instruments to spawn band member
  invincibilityFrames: 60
};

GBR.ACT2 = {
  lanes: 4,
  fallDuration: 3000,       // ms for note to cross screen (round 1)
  minFallDuration: 2000,    // ms (round 3)
  hitWindowMs: 500,         // generous timing for kids
  rounds: 3,
  notesPerRound: 16,
  correctValue: 100,
  streakBonus: 200,
  streakTarget: 5
};

GBR.ACT3 = {
  rows: 6,
  cols: 6,
  tileTypes: 5,             // 5 instrument types
  wildcardChance: 0.1,      // 10% chance of microphone wildcard
  match3Value: 50,
  match4Value: 150,
  match5Value: 300,
  targetScore: 2000,
  hintDelay: 5000            // ms before auto-hint
};

GBR.ACT4 = {
  drums: 4,
  startPatternLength: 2,
  maxRounds: 6,             // complete round 6 to win (pattern length 7)
  playbackSpeed: 600,       // ms per note during playback
  retriesPerRound: 1,
  roundValue: 100
};

GBR.ACT5 = {
  keys: 8,                  // one octave C4-C5
  rounds: 4,
  startMelodyLength: 3,     // grows by 1 each round
  roundValue: 150,
  genres: ['SOUL', 'FUNK', 'BLUES'],
  finaleDisplayTime: 8000   // ms
};

// --- Note Frequencies (A4 = 440Hz) ---
GBR.NOTES = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25
};

// --- Mutable Game State ---
GBR.state = {
  totalDollars: 0,
  currentAct: 0,
  bandMembers: [
    { found: false, outfit: 0 },
    { found: false, outfit: 0 },
    { found: false, outfit: 0 },
    { found: false, outfit: 0 },
    { found: true, outfit: 0 }   // L.A. Young is always present
  ],
  singerDress: 0,
  songGenre: '',
  actScores: [0, 0, 0, 0, 0]
};

GBR.resetState = function () {
  GBR.state = {
    totalDollars: 0,
    currentAct: 0,
    bandMembers: [
      { found: false, outfit: 0 },
      { found: false, outfit: 0 },
      { found: false, outfit: 0 },
      { found: false, outfit: 0 },
      { found: true, outfit: 0 }
    ],
    singerDress: 0,
    songGenre: '',
    actScores: [0, 0, 0, 0, 0]
  };
};

// --- Phaser Game Configuration ---
// (Created after all scene scripts are loaded)
document.addEventListener('DOMContentLoaded', function () {
  var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a0a',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
      activePointers: 3,
      touch: {
        capture: true
      }
    },
    scene: [
      BootScene,
      MainMenuScene,
      typeof StoryScene !== 'undefined' ? StoryScene : null,
      typeof HUDScene !== 'undefined' ? HUDScene : null,
      typeof Act1RunnerScene !== 'undefined' ? Act1RunnerScene : null,
      typeof Act2RhythmScene !== 'undefined' ? Act2RhythmScene : null,
      typeof Act3MatchScene !== 'undefined' ? Act3MatchScene : null,
      typeof Act4SimonScene !== 'undefined' ? Act4SimonScene : null,
      typeof Act5PianoScene !== 'undefined' ? Act5PianoScene : null,
      typeof OutfitScene !== 'undefined' ? OutfitScene : null,
      typeof VictoryScene !== 'undefined' ? VictoryScene : null
    ].filter(Boolean)
  };

  window.game = new Phaser.Game(config);
});
