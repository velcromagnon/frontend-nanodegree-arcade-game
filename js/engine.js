/* Engine.js
 * This file provides the game loop functionality (update entities and render),
 * draws the initial game board on the screen, and then calls the update and
 * render methods on your player and enemy objects (defined in your app.js).
 *
 * A game engine works by drawing the entire game screen over and over, kind of
 * like a flipbook you may have created as a kid. When your player moves across
 * the screen, it may look like just that image/character is moving or being
 * drawn but that is not the case. What's really happening is the entire "scene"
 * is being drawn over and over, presenting the illusion of animation.
 *
 * This engine makes the canvas' context (ctx) object globally available to make
 * writing app.js a little simpler to work with.
 */

let Engine = (function(global) {
  /* Predefine the variables we'll be using within this scope,
   * create the canvas element, grab the 2D context for that canvas
   * set the canvas elements height/width and add it to the DOM.
   */
  var doc = global.document,
      win = global.window,
      canvas = doc.createElement('canvas'),
      ctx = canvas.getContext('2d'),
      lastTime;
  const winsToUnlockMode = 25;
  const levelToUnlockChars = 5;
  const levelToUnlockPowerups = 10;

  canvas.width = 505;
  canvas.height = 606;
  doc.body.appendChild(canvas);

  let char = getLocalStorage('charChosen', 0);
  player.char = parseInt(char);

  /* This function serves as the kickoff point for the game loop itself
   * and handles properly calling the update and render methods.
   */
  function main() {
    /* Get our time delta information which is required if your game
     * requires smooth animation. Because everyone's computer processes
     * instructions at different speeds we need a constant value that
     * would be the same for everyone (regardless of how fast their
     * computer is) - hurray time!
     */
    let now = Date.now(),
      dt = (now - lastTime) / 1000.0;

    /* Call our update/render functions, pass along the time delta to
     * our update function since it may be used for smooth animation.
     */
    update(dt);
    render();

    /* Set our lastTime variable which is used to determine the time delta
     * for the next time this function is called.
     */
    lastTime = now;

    /* Use the browser's requestAnimationFrame function to call this
     * function again as soon as the browser is able to draw another frame.
     */
    win.requestAnimationFrame(main);
  }

  /* This function does some initial setup that should only occur once,
   * particularly setting the lastTime variable that is required for the
   * game loop.
   */
  function init() {
    // Set the gameMode to begin with.
    let mode = localStorage.getItem('gameMode');
    if (mode === null)
      localStorage.setItem('gameMode', 'standard');
    let wins = localStorage.getItem('wins')
    if (wins === null)
      localStorage.setItem('wins', 0);

    reset();
    lastTime = Date.now();
    main();
  }

  /* This function is called by main (our game loop) and itself calls all
   * of the functions which may need to update entity's data. Based on how
   * you implement your collision detection (when two entities occupy the
   * same space, for instance when your character should die), you may find
   * the need to add an additional function call here. For now, we've left
   * it commented out - you may or may not want to implement this
   * functionality this way (you could just implement collision detection
   * on the entities themselves within your app.js file).
   */
  function update(dt) {
    if (requestReset === true) {  // Reset all stats must reset everything.
      reset();
      requestReset = false;
    }
    updateEntities(dt);
    handleCollisions();
    checkWin();
  }

  powerupList = ['heart', 'GemBlue', 'GemGreen', 'GemOrange'];
  powerupScore = [0, 300, 500, 1000];

  // Check if the player has crossed the screen, and update game state accordingly.
  function checkWin()
  {
    if (player.y === 0) {
      player.x = 2;
      player.y = 5;
      let mode = getLocalStorage('gameMode', 'standard');
      if (mode === 'standard') {
        let wins = parseInt(getLocalStorage('wins', 0)); // Only applies in standard mode to unlock things.
        localStorage.setItem('wins', wins + 1);
        if (wins + 1 === winsToUnlockMode)
        {
          if (getLocalStorage('scoringModeUnlocked', '0') === '0') {
            localStorage.setItem('scoringModeUnlocked', 1);
            displayMessage = 'Unlocked scoring mode!';
            displayOpacity = 1.0;
          }
        }
      }
      // Scoring mode.
      else {
        score += 100 * level;
        level += 1;
        let highestLevel = getLocalStorage('highestLevelReached', '0');
        if (level > parseInt(highestLevel))
            localStorage.setItem('highestLevel', level);
        if (level === levelToUnlockChars)
        {
          if (getLocalStorage('charsUnlocked', '0') === '0') {
            localStorage.setItem('charsUnlocked', '1');
            displayMessage = 'Unlocked new characters!';
            displayOpacity = 1.0;
          }
        }
        else if (level === levelToUnlockPowerups)
        {
          if (getLocalStorage('powerupsUnlocked', '0') === '0') {
            localStorage.setItem('powerupsUnlocked', '1');
            displayMessage = 'Unlocked powerups!';
            displayOpacity = 1.0;
          }
        }
        if (level % 10 === 0) // Gain a heart every 10th level.
          hearts += 1;

        // Reset rocks and powerups!
        // Add rocks
        allPowerups = []; // Reset every level!
        if (level > 5) { // Add 0-3 rocks
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
        if (powerupsChosen === '1')
        {
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
        if (level >= 20) // 10% chance of adding a new enemy.
        {
          if (Math.floor(Math.random() * 20) === 0)
            allEnemies.push(newEnemy());
        }
        if (level >= 40)
        {
          directions = 2;
        }
      }
    }
  }

  // Check collisions between player and enemies, as long as the player isn't god or is dead.
  function handleCollisions()
  {
    if (player.godMode) // Nothing can hurt me!
      return;
    let collision = false;
    let delta = 50; // Mostly for the x value, if the current value is within this range.
    for (let i = 0; i < allEnemies.length; i++)
    {
      if (allEnemies[i].collision)
        collision = true;
//      let pixelsY = player.y * 85 - 30;
//      let pixelsX = player.x * 105;
//      if (Math.abs(allEnemies[i].y - pixelsY) < 10 &&
//        Math.abs(allEnemies[i].x - pixelsX) < delta) {
//        collision = true;
    }
    if (collision) {
      let mode = getLocalStorage('gameMode', 'standard');
      player.x = 2;
      player.y = 5;
      player.state = 'dead';
      player.deathTimer = 3.0;
      // In standard mode, just reset the character position and state.
      if (mode === 'scoring') {
        hearts -= 1;
        if (hearts <= 0) {
          // GAME OVER, MAN!
          displayEndGame();
          reset();
        }
        return; // You can be squished only once.
      }
    }
  }

  // Display the end of game stats in scoring mode.
  function displayEndGame() {
    $('.level-reached').text(level);
    $('.score').text(score);
    let prevHighestScore = getLocalStorage('highestScore', '0');
    // Just set a high score!
    if (score > parseInt(prevHighestScore)) {
        $('.high-score-message').text(`You have beat your highest score of ${prevHighestScore}!`);
        localStorage.setItem('highestScore', score);
        $('.highest-score').text(`was ${prevHighestScore}`);
    }
    else { // Didn't set a new score.
      $('.high-score-message').text('');
      $('.highest-score').text(`is ${prevHighestScore}`);
    }

    $('#end-game-modal').modal('toggle');
  }

  /* This is called by the update function and loops through all of the
   * objects within your allEnemies array as defined in app.js and calls
   * their update() methods. It will then call the update function for your
   * player object. These update methods should focus purely on updating
   * the data/properties related to the object. Do your drawing in your
   * render methods.
   */
  function updateEntities(dt) {
    player.update(dt);
    allEnemies.forEach(function(enemy) {
      enemy.update(dt);
    });
    allPowerups.forEach(function(powerup) {
      powerup.update(dt);
    });
  }

  /* This function initially draws the "game level", it will then call
   * the renderEntities function. Remember, this function is called every
   * game tick (or loop of the game engine) because that's how games work -
   * they are flipbooks creating the illusion of animation but in reality
   * they are just drawing the entire screen over and over.
   */
  function render() {
    /* This array holds the relative URL to the image used
     * for that particular row of the game level.
     */
    let rowImages = [
      'images/water-block.png',   // Top row is water
      'images/stone-block.png',   // Row 1 of 3 of stone
      'images/stone-block.png',   // Row 2 of 3 of stone
      'images/stone-block.png',   // Row 3 of 3 of stone
      'images/grass-block.png',   // Row 1 of 2 of grass
      'images/grass-block.png'    // Row 2 of 2 of grass
      ],
    numRows = 6,
    numCols = 5,
    row, col;

    // Before drawing, clear existing canvas
    ctx.clearRect(0,0,canvas.width,canvas.height)

    /* Loop through the number of rows and columns we've defined above
     * and, using the rowImages array, draw the correct image for that
     * portion of the "grid"
     */
    for (row = 0; row < numRows; row++) {
      for (col = 0; col < numCols; col++) {
        /* The drawImage function of the canvas' context element
         * requires 3 parameters: the image to draw, the x coordinate
         * to start drawing and the y coordinate to start drawing.
         * We're using our Resources helpers to refer to our images
         * so that we get the benefits of caching these images, since
         * we're using them over and over.
         */
        ctx.drawImage(Resources.get(rowImages[row]), col * 101, row * 83);
      }
    }

    renderEntities();
  }

  /* This function is called by the render function and is called on each game
   * tick. Its purpose is to then call the render functions you have defined
   * on your enemy and player entities within app.js
   */
  function renderEntities() {
    /* Loop through all of the objects within the allEnemies array and call
     * the render function you have defined.
     */
    // Draw powerups first, as you need to see your enemies.
    allPowerups.forEach(function(powerup) {
      powerup.render();
    });

    allEnemies.forEach(function(enemy) {
      enemy.render();
    });

    player.render();
  }

  /* This function does nothing but it could have been a good place to
   * handle game reset states - maybe a new game menu or a game over screen
   * those sorts of things. It's only called once by the init() method.
   */
  let reset = function() {
    level = 1;
    score = 0;
    hearts = 3;
    directions = 1; // Start out left to right only
    // Reset all enemies, power ups, obstacles to base state.
    allEnemies = [];
    allPowerups = [];
    let numStartingEnemies = 3;
    for (i = 0; i < numStartingEnemies; i++)
    {
      allEnemies.push(newEnemy());
    }
  }

  // Create a new enemy.
  function newEnemy()
  {
    let vert = 1 + Math.floor(Math.random() * 3);
    let y = vert * 85 - 30;
    let x = Math.random() * (105*5);
    let speed = Math.random() * (enemySpeedRange + level * 5) + baseEnemySpeed;
    let enemy = new Enemy(x, y, speed);
    return enemy;
  }

  /* Go ahead and load all of the images we know we're going to need to
   * draw our game level. Then set init as the callback method, so that when
   * all of these images are properly loaded our game will start.
   */
  Resources.load([
    'images/stone-block.png',
    'images/water-block.png',
    'images/grass-block.png',
    'images/enemy-bug.png',
    'images/char-boy.png',
    'images/char-cat-girl.png',
    'images/char-horn-girl.png',
    'images/char-pink-girl.png',
    'images/char-princess-girl.png',
    'images/char-boy-inverted.png',
    'images/char-cat-girl-inverted.png',
    'images/char-horn-girl-inverted.png',
    'images/char-pink-girl-inverted.png',
    'images/char-princess-girl-inverted.png',
    'images/Gem Blue.png',
    'images/Gem Green.png',
    'images/Gem Orange.png',
    'images/Rock.png',
    'images/Heart.png'
  ]);
  Resources.onReady(init);

  /* Assign the canvas' context object to the global variable (the window
   * object when run in a browser) so that developers can use it more easily
   * from within their app.js files.
   */
  global.ctx = ctx;
})(this);