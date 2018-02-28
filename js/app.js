let baseEnemySpeed = 100;
let enemySpeedRange = 300;
// Scoring
let level = 1;
let score = 0;
let hearts = 3;
// Advanced enemies
let directions = 1;
let requestReset = false; // Reset from modal dialog.
// Show the user when they have unlocked game features.
let displayOpacity = 0.0;
let displayMessage = '';

// list of all powerups (plus a rock)
let powerupIcons = {'rock': 'images/Rock.png',
                    'heart': 'images/Heart.png',
                    'GemBlue': 'images/Gem Blue.png',
                    'GemGreen': 'images/Gem Green.png',
                    'GemOrange': 'images/Gem Orange.png'
                   };

// Includes rocks for simplicity.
let PowerUp = function(x, y, type, score)
{
  this.x = x;
  this.y = y;
  this.type = type;
  this.score = score;
  this.sprite = powerupIcons[type];
};

PowerUp.prototype.update = function(dt) {
  // no op
};

// Powerups do not move.
PowerUp.prototype.render = function()
{
  ctx.drawImage(Resources.get(this.sprite), this.x * 101, this.y * 83 - 15);
};

// Enemies our player must avoid
let Enemy = function(x, y, speed) {
  // Variables applied to each of our instances go here,
  // we've provided one for you to get started
  this.x = x;
  this.y = y;
  this.speed = speed;
  this.collision = false;

  // The image/sprite for our enemies, this uses
  // a helper we've provided to easily load images
  this.sprite = 'images/enemy-bug.png';
};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
  this.x += dt * this.speed;
  let createNewEnemy = false;
  if (this.x > 105 * 5 && this.speed > 0 ||
      this.x < 0 && this.speed < 0) {
    let vert = 1 + Math.floor(Math.random() * 3);
    this.y = vert * 85 - 30;
    let whichWay = 'right';
    if (directions === 2 && Math.floor(Math.random() * 2) == 0)
        whichWay = 'left';

    // Enemies start from either side at a high enough level.
    if (whichWay === 'right') {
      this.x = -105;
      this.speed = Math.random() * (enemySpeedRange + level * 5) + baseEnemySpeed;
    }
    else
    {
      this.x = 105 * 5;
      this.speed = -1 * (Math.random() * (enemySpeedRange + level * 5) + baseEnemySpeed);
    }
  }
  // See if this enemy collided with a player.
  let delta = 50; // Mostly for the x value, if the current value is within this range.
  let pixelsY = player.y * 85 - 30;
  let pixelsX = player.x * 105;
  this.collision = (Math.abs(this.y - pixelsY) < 10 &&
               Math.abs(this.x - pixelsX) < delta);
  // You should multiply any movement by the dt parameter
  // which will ensure the game runs at the same speed for
  // all computers.
};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
  ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.

// All characters the players can choose from.
let playerCharacters = ['images/char-boy.png', 'images/char-cat-girl.png',
                        'images/char-horn-girl.png', 'images/char-pink-girl.png',
                        'images/char-princess-girl.png'];

// Player class
let Player = function(x, y, char) {
  this.x = x;
  this.y = y;
  this.char = char;
  this.state = 'alive';
  this.godMode = false;
  // Handle a blink after death.
  this.display = true;
  this.deathTimer = 0;
};

// Update player. In this case, the character comes back to life after 3 seconds.
Player.prototype.update = function(dt) {
  if (this.state === 'dead') {
    this.deathTimer -= dt;
    if (this.deathTimer <= 0)
      this.state = 'alive';
  }
  if (displayOpacity > 0)
    displayOpacity -= 0.2 * dt;
};

// Render the player and score information (score information could be its own class)
Player.prototype.render = function() {
  this.sprite = playerCharacters[this.char];
  if (this.state === 'alive') {
    if (player.godMode == false)
      ctx.drawImage(Resources.get(this.sprite), this.x * 101, this.y * 83 - 15);
    else
      ctx.drawImage(Resources.get(this.sprite.replace('.png', '-inverted.png')), this.x * 101, this.y * 83 - 15);
  }
  else if (Math.floor(Math.sqrt(300 * this.deathTimer) % 2) === 0)
  {
    ctx.drawImage(Resources.get(this.sprite), this.x * 101, this.y * 83 - 15);
  }
  // Draw score
  mode = getLocalStorage('gameMode', 'standard');
  if (mode === 'standard') // show wins at bottom, nothing else is relevant.
    writeWins(ctx);
  else
    writeScore(ctx);
  if (displayOpacity > 0.0)
    writeUnlockMessage(displayMessage);
};

// Write number of wins in standard mode.
function writeUnlockMessage(message) {
  ctx.font = "30px Arial";
  wins = getLocalStorage('wins', 0);
  ctx.fillStyle = 'rgba(255, 255, 255, ' + displayOpacity + ')'
  ctx.fillText(message, 15, 6 * 83 - 7);
}

// Write number of wins in standard mode.
function writeWins() {
  ctx.font = "30px Arial";
  wins = getLocalStorage('wins', 0);
  ctx.fillStyle = 'white';
  ctx.fillText(`Wins:   ${wins}`, 15, 7 * 83 - 7);
}

// Write score, hearts, and level in scoring mode.
function writeScore() {
  ctx.font = "25px Arial";
  // Level and Score
  ctx.fillStyle = 'white';
  ctx.fillText(`Score: ${score}`, 15, 7 * 83 - 7);
  ctx.fillText(`Level:  ${level}`, 101 * 3 + 15 , 7 * 83 - 7);
  ctx.fillStyle = 'red';
  const heartChar = '❤';
  const heartWidth = ctx.measureText(heartChar).width;
  ctx.fillText(heartChar, 101 * 2 + 15, 7 * 83 - 7);
  ctx.fillStyle = 'white';
  ctx.fillText(`x${hearts}`, 101 * 2 + 15 + heartWidth, 7 * 83 - 7);
}

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
          allPowerups[i].y === newY)
      {
        if (allPowerups[i].type === 'heart')
          hearts += 1;
        else
          score += allPowerups[i].score;
        // Remove powerup, now that it's used.
        allPowerups.splice(i, 1); // Should only be 1.
      }
    }
    this.x = newX;
    this.y = newY;
  }
};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
let allEnemies = [];
// Place the player object in a variable called player
let player = new Player(2, 5, '0');
// Powerups
let allPowerups = [];

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
    displayHelpScreen();
  else if (e.keyCode === 83) // 's'
    displayStatsScreen();
  else if (e.keyCode === 82) // 'r'
    displayResetScreen();
  // Toggle powerups
  else if (e.keyCode === 80) { // 'p'
    if (localStorage["powerupsUnlocked"] === '1') {
      powerupsValue = getLocalStorage('powerupsChosen', 0);
      localStorage.setItem("powerupsChosen", 1 - parseInt(powerupsValue));
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
    if (localStorage['scoringModeUnlocked'] === '1') {
      let currentMode = getLocalStorage('gameMode', 'standard');
      level = 1;
      score = 0;
      hearts = 3;
      if (mode === 'standard')
        localStorage.setItem('gameMode', 'scoring');
      else
        localStorage.setItem('gameMode', 'standard');
    }
  }
});

function displayHelpScreen() {
  $('#help-modal').modal('toggle');
}

function displayResetScreen() {
  $('#reset-modal').modal('toggle');
}

// Update stats screen with scoring information.
function displayStatsScreen() {
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

// Clear all data and request a reset.
function clearStorage() {
  localStorage.clear();
  player.char = 0;
  requestReset = true;
}

// Helper function to deal with boilerplate null value/default code.
function getLocalStorage(name, defaultValue) {
  value = localStorage.getItem(name);
  return value || defaultValue;
}