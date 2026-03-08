/* GroovyBandRush/js/helpers/MatchEngine.js */
/* Pure logic - no Phaser dependency */

var MatchEngine = (function () {
  'use strict';

  /**
   * Create a grid with no initial matches
   * @param {number} rows
   * @param {number} cols
   * @param {number} types - number of tile types (0 to types-1)
   * @returns {number[][]} grid
   */
  function createGrid(rows, cols, types) {
    var grid = [];
    for (var r = 0; r < rows; r++) {
      grid[r] = [];
      for (var c = 0; c < cols; c++) {
        var available = [];
        for (var t = 0; t < types; t++) {
          available.push(t);
        }
        // Avoid horizontal match
        if (c >= 2 && grid[r][c - 1] === grid[r][c - 2]) {
          var hMatch = grid[r][c - 1];
          available = available.filter(function (v) { return v !== hMatch; });
        }
        // Avoid vertical match
        if (r >= 2 && grid[r - 1][c] === grid[r - 2][c]) {
          var vMatch = grid[r - 1][c];
          available = available.filter(function (v) { return v !== vMatch; });
        }
        grid[r][c] = available[Math.floor(Math.random() * available.length)];
      }
    }
    return grid;
  }

  /**
   * Find all matches of 3+ in a row/column
   * @param {number[][]} grid
   * @param {number} wildcardType - tile type that matches anything (-1 to disable)
   * @returns {Array<{r: number, c: number}[]>} array of match groups
   */
  function findMatches(grid, wildcardType) {
    wildcardType = wildcardType !== undefined ? wildcardType : -1;
    var rows = grid.length;
    var cols = grid[0].length;
    var matched = {};
    var matches = [];

    function key(r, c) { return r + ',' + c; }

    function tilesMatch(a, b) {
      if (a === wildcardType || b === wildcardType) return true;
      return a === b;
    }

    // Horizontal
    for (var r = 0; r < rows; r++) {
      var run = [{ r: r, c: 0 }];
      for (var c = 1; c < cols; c++) {
        if (grid[r][c] !== null && grid[r][c - 1] !== null && tilesMatch(grid[r][c], grid[r][c - 1])) {
          run.push({ r: r, c: c });
        } else {
          if (run.length >= 3) {
            matches.push(run.slice());
            for (var i = 0; i < run.length; i++) matched[key(run[i].r, run[i].c)] = true;
          }
          run = [{ r: r, c: c }];
        }
      }
      if (run.length >= 3) {
        matches.push(run.slice());
        for (var j = 0; j < run.length; j++) matched[key(run[j].r, run[j].c)] = true;
      }
    }

    // Vertical
    for (var c2 = 0; c2 < cols; c2++) {
      var vRun = [{ r: 0, c: c2 }];
      for (var r2 = 1; r2 < rows; r2++) {
        if (grid[r2][c2] !== null && grid[r2 - 1][c2] !== null && tilesMatch(grid[r2][c2], grid[r2 - 1][c2])) {
          vRun.push({ r: r2, c: c2 });
        } else {
          if (vRun.length >= 3) {
            matches.push(vRun.slice());
            for (var k = 0; k < vRun.length; k++) matched[key(vRun[k].r, vRun[k].c)] = true;
          }
          vRun = [{ r: r2, c: c2 }];
        }
      }
      if (vRun.length >= 3) {
        matches.push(vRun.slice());
        for (var m = 0; m < vRun.length; m++) matched[key(vRun[m].r, vRun[m].c)] = true;
      }
    }

    return matches;
  }

  /**
   * Remove matched cells (set to null)
   * @param {number[][]} grid
   * @param {Array<{r: number, c: number}[]>} matches
   */
  function removeMatches(grid, matches) {
    for (var i = 0; i < matches.length; i++) {
      for (var j = 0; j < matches[i].length; j++) {
        var cell = matches[i][j];
        grid[cell.r][cell.c] = null;
      }
    }
  }

  /**
   * Apply gravity - drop tiles down to fill gaps
   * @param {number[][]} grid
   * @returns {Array<{fromR: number, toR: number, c: number}>} list of moves
   */
  function applyGravity(grid) {
    var rows = grid.length;
    var cols = grid[0].length;
    var moves = [];

    for (var c = 0; c < cols; c++) {
      var writePos = rows - 1;
      for (var r = rows - 1; r >= 0; r--) {
        if (grid[r][c] !== null) {
          if (r !== writePos) {
            grid[writePos][c] = grid[r][c];
            grid[r][c] = null;
            moves.push({ fromR: r, toR: writePos, c: c });
          }
          writePos--;
        }
      }
    }

    return moves;
  }

  /**
   * Fill empty (null) cells with new random tiles
   * @param {number[][]} grid
   * @param {number} types
   * @param {number} wildcardType - which type is the wildcard
   * @param {number} wildcardChance - probability of spawning wildcard (0-1)
   * @returns {Array<{r: number, c: number, type: number}>} new tiles
   */
  function fillEmpty(grid, types, wildcardType, wildcardChance) {
    wildcardChance = wildcardChance || 0;
    var rows = grid.length;
    var cols = grid[0].length;
    var newTiles = [];

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (grid[r][c] === null) {
          if (wildcardType >= 0 && Math.random() < wildcardChance) {
            grid[r][c] = wildcardType;
          } else {
            grid[r][c] = Math.floor(Math.random() * types);
          }
          newTiles.push({ r: r, c: c, type: grid[r][c] });
        }
      }
    }

    return newTiles;
  }

  /**
   * Swap two adjacent tiles
   * @param {number[][]} grid
   * @param {number} r1
   * @param {number} c1
   * @param {number} r2
   * @param {number} c2
   */
  function swap(grid, r1, c1, r2, c2) {
    var tmp = grid[r1][c1];
    grid[r1][c1] = grid[r2][c2];
    grid[r2][c2] = tmp;
  }

  /**
   * Check if two cells are adjacent
   */
  function isAdjacent(r1, c1, r2, c2) {
    return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
  }

  /**
   * Check if a swap would create a match
   * @param {number[][]} grid
   * @param {number} r1
   * @param {number} c1
   * @param {number} r2
   * @param {number} c2
   * @param {number} wildcardType
   * @returns {boolean}
   */
  function isValidMove(grid, r1, c1, r2, c2, wildcardType) {
    swap(grid, r1, c1, r2, c2);
    var matches = findMatches(grid, wildcardType);
    swap(grid, r1, c1, r2, c2); // swap back
    return matches.length > 0;
  }

  /**
   * Get all valid moves
   * @param {number[][]} grid
   * @param {number} wildcardType
   * @returns {Array<{r1: number, c1: number, r2: number, c2: number}>}
   */
  function getValidMoves(grid, wildcardType) {
    var rows = grid.length;
    var cols = grid[0].length;
    var moves = [];

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        // Check right
        if (c < cols - 1 && isValidMove(grid, r, c, r, c + 1, wildcardType)) {
          moves.push({ r1: r, c1: c, r2: r, c2: c + 1 });
        }
        // Check down
        if (r < rows - 1 && isValidMove(grid, r, c, r + 1, c, wildcardType)) {
          moves.push({ r1: r, c1: c, r2: r + 1, c2: c });
        }
      }
    }

    return moves;
  }

  return {
    createGrid: createGrid,
    findMatches: findMatches,
    removeMatches: removeMatches,
    applyGravity: applyGravity,
    fillEmpty: fillEmpty,
    swap: swap,
    isAdjacent: isAdjacent,
    isValidMove: isValidMove,
    getValidMoves: getValidMoves
  };
})();
