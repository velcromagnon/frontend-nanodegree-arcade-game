'use strict';

// Game constants
const BASE_ENEMY_SPEED = 100;
const ENEMY_SPEED_RANGE = 300;
// unlocking features constants.
const WINS_TO_UNLOCK_MODE = 25;
const LEVEL_TO_UNLOCK_CHARS = 5;
const LEVEL_TO_UNLOCK_POWERUPS = 10;
// constants for tile sizes and entity placement.
const TILE_WIDTH = 101;
const TILE_HEIGHT = 83;
// Advanced enemies
let directions = 1;
let requestReset = false; // Reset from modal dialog.
// Power up scores and types
const powerupList = ['heart', 'GemBlue', 'GemGreen', 'GemOrange'];
const powerupScore = [0, 300, 500, 1000];

// list of all powerups (plus a rock)
let powerupIcons = {'rock': 'images/Rock.png',
                    'heart': 'images/Heart.png',
                    'GemBlue': 'images/Gem Blue.png',
                    'GemGreen': 'images/Gem Green.png',
                    'GemOrange': 'images/Gem Orange.png'
                   };

// Base class that just stores locations. Not adding update or render since there
// is no commonality.
const ScreenEntity = function(x, y) {
  this.x = x;
  this.y = y;
};

// Includes rocks for simplicity.
const PowerUp = function(x, y, type, score) {
  ScreenEntity.call(this, x, y);
  this.type = type;
  this.score = score;
  this.sprite = powerupIcons[type];
};
PowerUp.prototype = Object.create(ScreenEntity.prototype);
PowerUp.constructor = PowerUp.prototype;

PowerUp.prototype.update = function(dt) {
  // no op
};

// Powerups do not move.
PowerUp.prototype.render = function() {
  ctx.drawImage(Resources.get(this.sprite), this.x * TILE_WIDTH, this.y * TILE_HEIGHT - 15);
};

// Enemies our player must avoid
const Enemy = function() {
  // Use the provided bug for an enemy.
  let vert = 1 + Math.floor(Math.random() * 3);
  let y = vert * TILE_HEIGHT - 24;
  let x = Math.random() * (TILE_WIDTH * 5);
  let speed = Math.random() * (ENEMY_SPEED_RANGE + scores.level * 5) + BASE_ENEMY_SPEED;
  ScreenEntity.call(this, x, y);
  this.speed = speed;
  this.collision = false;
  this.sprite = 'images/enemy-bug.png';
};
Enemy.prototype = Object.create(ScreenEntity.prototype);
Enemy.constructor = Enemy.prototype;

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
  this.x += dt * this.speed;
  let createNewEnemy = false;
  if (this.x > TILE_WIDTH * 5 && this.speed > 0 ||
      this.x < 0 && this.speed < 0) {
    let vert = 1 + Math.floor(Math.random() * 3);
    this.y = vert * TILE_HEIGHT - 24;
    let whichWay = 'right';
    if (directions === 2 && Math.floor(Math.random() * 2) === 0)
      whichWay = 'left';

    // Enemies start from either side at a high enough level.
    if (whichWay === 'right') {
      this.x = -TILE_WIDTH;
      this.speed = Math.random() * (ENEMY_SPEED_RANGE + scores.level * 5) + BASE_ENEMY_SPEED;
      this.sprite = 'images/enemy-bug.png';
    }
    else {
      this.x = TILE_WIDTH * 5;
      this.speed = -1 * (Math.random() * (ENEMY_SPEED_RANGE + scores.level * 5) + BASE_ENEMY_SPEED);
      this.sprite = 'images/enemy-bug-facing-left.png';
    }
  }
  // Save collision status
  this.collision = this.checkCollision(player);
  // You should multiply any movement by the dt parameter
  // which will ensure the game runs at the same speed for
  // all computers.
};

// Determine if enemy collided with player.
Enemy.prototype.checkCollision = function(player) {
  const delta = 50;
  let pixelsY = player.y * TILE_HEIGHT - 30;
  let pixelsX = player.x * TILE_WIDTH;
  let collision = (Math.abs(this.y - pixelsY) < 10 &&
                   Math.abs(this.x - pixelsX) < delta);
  return collision;
};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
  ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.

// All characters the players can choose from.
const playerCharacters = ['images/char-boy.png', 'images/char-cat-girl.png',
                        'images/char-horn-girl.png', 'images/char-pink-girl.png',
                        'images/char-princess-girl.png'];

// Player class
const Player = function(x, y, char) {
  ScreenEntity.call(this, x, y);
  this.char = char;
  this.state = 'alive';
  this.godMode = false;
  // Handle a blink after death.
  this.display = true;
  this.deathTimer = 0;
};
Player.prototype = Object.create(ScreenEntity.prototype);
Player.constructor = Player.prototype;

// Update player. In this case, the character comes back to life after 3 seconds.
Player.prototype.update = function(dt) {
  if (this.state === 'dead') {
    this.deathTimer -= dt;
    if (this.deathTimer <= 0)
      this.state = 'alive';
  }
  if (stats.displayOpacity > 0)
    stats.displayOpacity -= 0.2 * dt;
};

// Render the player and score information (score information could be its own class)
Player.prototype.render = function() {
  this.sprite = playerCharacters[this.char];
  if (this.state === 'alive') {
    if (this.godMode === false)
      ctx.drawImage(Resources.get(this.sprite), this.x * TILE_WIDTH, this.y * TILE_HEIGHT - 15);
    else
      ctx.drawImage(Resources.get(this.sprite.replace('.png', '-inverted.png')), this.x * TILE_WIDTH, this.y * TILE_HEIGHT - 15);
  }
  else if (Math.floor(Math.sqrt(300 * this.deathTimer) % 2) === 0)
    ctx.drawImage(Resources.get(this.sprite), this.x * TILE_WIDTH, this.y * TILE_HEIGHT - 15);
  // Draw score
  const mode = getLocalStorage('gameMode', 'standard');
  if (mode === 'standard') // show wins at bottom, nothing else is relevant.
    stats.writeWins(ctx);
  else
    stats.writeScore(ctx);
  if (stats.displayOpacity > 0.0)
    stats.writeUnlockMessage();
};

// Check player for win condition.
Player.prototype.checkWin = function() {
  // Check if the player has crossed the screen, and update game state accordingly.
  if (this.y === 0) {
    this.x = 2;
    this.y = 5;
    let mode = getLocalStorage('gameMode', 'standard');
    if (mode === 'standard') {
      let wins = parseInt(getLocalStorage('wins', 0)); // Only applies in standard mode to unlock things.
      localStorage.setItem('wins', wins + 1);
      if (wins + 1 === WINS_TO_UNLOCK_MODE) {
        if (getLocalStorage('scoringModeUnlocked', '0') === '0') {
          localStorage.setItem('scoringModeUnlocked', 1);
          stats.displayMessage = 'Unlocked scoring mode!';
          stats.displayOpacity = 1.0;
        }
      }
    }
    // Scoring mode.
    else {
      scores.wonLevel();
      let highestLevel = getLocalStorage('highestLevelReached', '0');
      if (scores.level > parseInt(highestLevel))
        localStorage.setItem('highestLevel', scores.level);
      if (scores.level === LEVEL_TO_UNLOCK_CHARS) {
        if (getLocalStorage('charsUnlocked', '0') === '0') {
          localStorage.setItem('charsUnlocked', '1');
          stats.displayMessage = 'Unlocked new characters!';
          stats.displayOpacity = 1.0;
        }
      }
      else if (scores.level === LEVEL_TO_UNLOCK_POWERUPS) {
        if (getLocalStorage('powerupsUnlocked', '0') === '0') {
          localStorage.setItem('powerupsUnlocked', '1');
          stats.displayMessage = 'Unlocked powerups!';
          stats.displayOpacity = 1.0;
        }
      }
      if (scores.level % 10 === 0) // Gain a heart every 10th level.
        scores.hearts += 1;

      // Reset rocks and powerups!
      // Add rocks
      allPowerups = []; // Reset every level!
      if (scores.level > 5) { // Add 0-3 rocks
        let rocks = Math.floor(Math.random() * 4);
        for (let i = 0; i < rocks; i++) {
          // Add element.
          let conflicts = false;
          let x = 0;
          let y = 0;
          do {
            x = Math.floor(Math.random() * 5);
            y = Math.floor(Math.random() * 3 + 1);
            conflicts = false;
            for (let j = 0; j < allPowerups.length; j++) {
              if (allPowerups[j].x === x &&
                  allPowerups[j].y === y)
                conflicts = true;
            }
          } while (conflicts);
          // Must be in a new location.
          allPowerups.push(new PowerUp(x, y, 'rock', 0));
        }
      }
      let powerupsChosen = getLocalStorage('powerupsChosen', 0);
      if (powerupsChosen === '1') {
        // Add between 0 and 2 powerups per level, all randomly generated.
        let powerups = Math.floor(Math.random() * 3);
        for (let i = 0; i < powerups; i++) {
          // Add element.
          let conflicts = false;
          let x = 0;
          let y = 0;
          do {
            x = Math.floor(Math.random() * 5);
            y = Math.floor(Math.random() * 3 + 1);
            conflicts = false;
            for (let j = 0; j < allPowerups.length; j++) {
              if (allPowerups[j].x === x &&
                  allPowerups[j].y === y)
                conflicts = true;
            }
          } while (conflicts);

          // Must be in a new location.
          const type = Math.floor(Math.random() * 4);
          allPowerups.push(new PowerUp(x, y, powerupList[type], powerupScore[type]));
        }
      }
      if (scores.level >= 20) { // 5% chance of adding a new enemy.
        if (Math.floor(Math.random() * 20) === 0)
          allEnemies.push(new Enemy());
      }
      if (scores.level >= 40)
        directions = 2;
    }
  }
};

class Statistics {
  constructor() {
    // Show the user when they have unlocked game features.
    this.displayOpacity = 0.0;
    this.displayMessage = '';
  }

  // Write number of wins in standard mode.
  writeUnlockMessage() {
    ctx.font = "30px Arial";
    ctx.fillStyle = 'rgba(255, 255, 255, ' + this.displayOpacity + ')';
    ctx.fillText(this.displayMessage, 15, 6 * TILE_HEIGHT - 7);
  }

  // Write number of wins in standard mode.
  writeWins() {
    ctx.font = "30px Arial";
    const wins = getLocalStorage('wins', 0);
    ctx.fillStyle = 'white';
    ctx.fillText(`Wins:   ${wins}`, 15, 7 * TILE_HEIGHT - 7);
  }

  // Write score, hearts, and level in scoring mode.
  writeScore() {
    ctx.font = "25px Arial";
    // Level and Score
    ctx.fillStyle = 'white';
    ctx.fillText(`Score: ${scores.score}`, 15, 7 * TILE_HEIGHT - 7);
    ctx.fillText(`Level:  ${scores.level}`, TILE_WIDTH * 3 + 15 , 7 * TILE_HEIGHT - 7);
    ctx.fillStyle = 'red';
    const heartChar = '❤';
    const heartWidth = ctx.measureText(heartChar).width;
    ctx.fillText(heartChar, TILE_WIDTH * 2 + 15, 7 * TILE_HEIGHT - 7);
    ctx.fillStyle = 'white';
    ctx.fillText(`x${scores.hearts}`, TILE_WIDTH * 2 + 15 + heartWidth, 7 * TILE_HEIGHT - 7);
  }
}

Player.prototype.handleCollisions = function() {
  if (this.godMode) // Nothing can hurt me!
    return;
  let collision = false;
  for (let i = 0; i < allEnemies.length; i++) {
    if (allEnemies[i].collision)
      collision = true;
  }
  if (collision) {
    let mode = getLocalStorage('gameMode', 'standard');
    this.x = 2;
    this.y = 5;
    this.state = 'dead';
    this.deathTimer = 3.0;
    // In standard mode, just reset the character position and state.
    if (mode === 'scoring') {
      scores.hearts -= 1;
      if (scores.dead()) {
        // GAME OVER, MAN!
        modals.displayEndGame();
        gameReset();
      }
      return; // You can be squished only once.
    }
  }
};

let gameReset = function() {
  scores.reset();
  directions = 1; // Start out left to right only
  // Reset all enemies, power ups, obstacles to base state.
  allEnemies = [];
  allPowerups = [];
  let numStartingEnemies = 3;
  for (let i = 0; i < numStartingEnemies; i++)
    allEnemies.push(new Enemy());
};

// Handle inputs for player movement, rocks, and powerups.
Player.prototype.handleInput = function(key) {
  if (this.state === 'alive') {
    let newX = this.x;
    let newY = this.y;
    if (key === 'left' && this.x > 0)
      newX = this.x - 1;
    else if (key === 'right' && this.x < 4)
      newX = this.x + 1;
    else if (key === 'down' && this.y < 5)
      newY = this.y + 1;
    else if (key === 'up' && this.y > 0)
      newY = this.y - 1;
    // Check for rocks, disallow movement into one.
    for (let i = 0; i < allPowerups.length; i++) {
      if (allPowerups[i].type === 'rock' &&
          allPowerups[i].x === newX &&
          allPowerups[i].y === newY)
        return;
    }
    // Now check for powerups, don't check if they're enabled as that's done elsewhere
    for (let i = 0; i < allPowerups.length; i++) {
      if (allPowerups[i].type != 'rock' &&
          allPowerups[i].x === newX &&
          allPowerups[i].y === newY) {
        if (allPowerups[i].type === 'heart')
          scores.hearts += 1;
        else
          scores.score += allPowerups[i].score;
        // Remove powerup, now that it's used.
        allPowerups.splice(i, 1); // Should only be 1.
      }
    }
    this.x = newX;
    this.y = newY;
  }
};

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
  const allowedKeys = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };

  player.handleInput(allowedKeys[e.keyCode]);

  // Handle other codes, don't route them to player.
  if (e.keyCode === 72 || e.keyCode === 191) // h key or ?
    modals.displayHelpScreen();
  else if (e.keyCode === 83) // 's'
    modals.displayStatsScreen();
  else if (e.keyCode === 82) // 'r'
    modals.displayResetScreen();
  // Toggle powerups
  else if (e.keyCode === 80) { // 'p'
    if (getLocalStorage('powerupsUnlocked', '0') === '1') {
      const powerupsValue = getLocalStorage('powerupsChosen', '0');
      localStorage.setItem('powerupsChosen', 1 - parseInt(powerupsValue));
    }
  }
  // Switch characters
  else if (e.keyCode === 67 && player.state === 'alive') { // 'c'
    if (getLocalStorage('charsUnlocked', '0') === '1') {
      let charChosen = getLocalStorage('charChosen', '0');
      charChosen = parseInt(charChosen); // Find chosen character
      charChosen = (charChosen + 1) % playerCharacters.length; // Cycle it by one
      localStorage.setItem('charChosen', charChosen); // Store it back for later
      player.char = charChosen;
    }
  }
  // Toggle god mode.
  else if (e.keyCode === 71) { // 'g'
    player.godMode = !player.godMode;
  }
  // Toggle standard vs scoring mode.
  else if (e.keyCode === 77) { // 'm'
    if (getLocalStorage('scoringModeUnlocked', '0') === '1') {
      let currentMode = getLocalStorage('gameMode', 'standard');
      scores.reset();
      if (currentMode === 'standard')
        localStorage.setItem('gameMode', 'scoring');
      else
        localStorage.setItem('gameMode', 'standard');
    }
  }
});

// Put all modals together.
class Modals {
  constructor() {
  }

  displayHelpScreen() {
    $('#help-modal').modal('toggle');
  }

  displayResetScreen() {
    $('#reset-modal').modal('toggle');
  }

  // Update stats screen with scoring information.
  displayStatsScreen() {
    // Display wins
    const wins = getLocalStorage('wins', 0);
    $('.games-won').text(wins);

    const highestScore = getLocalStorage('highestScore', '0');
    $('.highest-score').text(highestScore);

    const highestLevel = getLocalStorage('highestLevel', '0');
    $('.highest-level').text(highestLevel);

    const scoringModeUnlocked = getLocalStorage('scoringModeUnlocked', '0');
    if (scoringModeUnlocked === '0')
     $('.scoring-mode-unlocked').text('✘');
     else
      $('.scoring-mode-unlocked').text('✔');

    const charsUnlocked = getLocalStorage('charsUnlocked', '0');
    if (charsUnlocked === '0')
      $('.chars-unlocked').text('✘');
    else
      $('.chars-unlocked').text('✔');

    const powerupsUnlocked = getLocalStorage('powerupsUnlocked', '0');
    if (powerupsUnlocked === '0')
      $('.powerups-unlocked').text('✘');
    else
      $('.powerups-unlocked').text('✔');

    const powerupsChosen = getLocalStorage('powerupsChosen', '0');
    if (powerupsChosen === '0')
      $('.powerups-chosen').text('✘');
    else
      $('.powerups-chosen').text('✔');

    $('#stats-modal').modal('toggle');
  }

  // Display the end of game stats in scoring mode.
  displayEndGame() {
    $('.level-reached').text(scores.level);
    $('.score').text(scores.score);
    let prevHighestScore = getLocalStorage('highestScore', '0');
    // Just set a high score!
    if (scores.score > parseInt(prevHighestScore)) {
        $('.high-score-message').text(`You have beat your highest score of ${prevHighestScore}!`);
        localStorage.setItem('highestScore', scores.score);
        $('.highest-score').text(`was ${prevHighestScore}`);
    }
    else { // Didn't set a new score.
      $('.high-score-message').text('');
      $('.highest-score').text(`is ${prevHighestScore}`);
    }

    $('#end-game-modal').modal('toggle');
  }
}

// Clear all data and request a reset.
function clearStorage() {
  localStorage.clear();
  player.char = 0;
  requestReset = true;
}

// Helper function to deal with boilerplate null value/default code.
function getLocalStorage(name, defaultValue) {
  const value = localStorage.getItem(name);
  return value || defaultValue;
}

class Scores {
  constructor() {
    this.reset();
  }
  reset() {
    this.level = 1;
    this.score = 0;
    this.hearts = 3;
  }
  wonLevel() {
    this.score += 100 * this.level;
    this.level += 1;
  }
  dead() {
    return this.hearts <= 0;
  }
}

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
let allEnemies = [];
// Place the player object in a variable called player
let char = parseInt(getLocalStorage('charChosen', 0));
let player = new Player(2, 5, char);
// Powerups
let allPowerups = [];
// Modal helper class
let modals = new Modals();
// Screen statistics
let stats = new Statistics();
// Scoring stats
let scores = new Scores();