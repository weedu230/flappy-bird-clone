import { saveHighScore as saveToDatabase, getHighScores as getFromDatabase } from './src/database.js';

let gameOver = false;
let gameStarted = false;
let score = 0;
let showNameInput = false;
let showHighScores = false;
let showLeaderboard = false;
let playerName = "";
let highScores = [];
let databaseConnected = false;

let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

// Bird
let birdWidth = 34;
let birdHeight = 24;
let birdX = boardWidth/8;
let birdY = boardHeight/2;
let birdImg;

let bird = {
    x : birdX,
    y : birdY,
    width : birdWidth,
    height : birdHeight
}

// Pipes
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

// Physics (matching pseudocode)
let velocityX = -2;
let velocityY = 0;
let gravity = 1;
let jumpForce = -12;

// Game settings
let pipeSpeed = 2;
let pipeInterval = 1500;

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    // Initialize game state
    bird.x = birdX;
    bird.y = birdY;
    
    // Load high scores from localStorage first
    loadLocalHighScores();
    
    // Try to load from database
    loadDatabaseHighScores();
    
    // Load images with error handling
    birdImg = new Image();
    birdImg.src = "./flappybird.png";
    birdImg.onerror = function() {
        console.warn("Bird image not found, using fallback graphics");
    };

    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";
    topPipeImg.onerror = function() {
        console.warn("Top pipe image not found, using fallback graphics");
    };

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";
    bottomPipeImg.onerror = function() {
        console.warn("Bottom pipe image not found, using fallback graphics");
    };

    // Start the game loop
    requestAnimationFrame(update);
    setInterval(placePipes, pipeInterval);
    
    // Event listeners
    document.addEventListener("keydown", moveBird);
    board.addEventListener("click", moveBird);
    board.addEventListener("touchstart", handleTouch);
    
    // Prevent context menu on right click
    board.addEventListener("contextmenu", function(e) {
        e.preventDefault();
    });
}

function handleTouch(e) {
    e.preventDefault(); // Prevent scrolling and zooming
    moveBird(e);
}

function update() {
    requestAnimationFrame(update);
    
    if (!gameStarted) {
        drawStartScreen();
        return;
    }
    
    if (showLeaderboard) {
        drawLeaderboardScreen();
        return;
    }
    
    if (showNameInput) {
        drawNameInputScreen();
        return;
    }
    
    if (showHighScores) {
        drawHighScoresScreen();
        return;
    }
    
    context.clearRect(0, 0, board.width, board.height);

    // Only update game if not game over
    if (!gameOver) {
        // Bird physics
        velocityY += gravity;
        bird.y = Math.max(bird.y + velocityY, 0);
        
        // Check ground collision
        if (bird.y > board.height - bird.height) {
            gameOver = true;
        }
    }
    
    // Draw bird (with fallback if image not loaded)
    if (birdImg.complete && birdImg.naturalHeight !== 0) {
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    } else {
        // Draw a simple bird shape as fallback
        context.fillStyle = "#FFD700";
        context.fillRect(bird.x, bird.y, bird.width, bird.height);
        // Add simple wing
        context.fillStyle = "#FFA500";
        context.fillRect(bird.x + 5, bird.y + 5, bird.width - 10, bird.height - 10);
    }

    // Pipes
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        
        if (!gameOver) {
            pipe.x += velocityX;
        }
        
        // Draw pipe (with fallback if image not loaded)
        if (pipe.img && pipe.img.complete && pipe.img.naturalHeight !== 0) {
            context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);
        } else {
            // Draw a simple rectangle as fallback
            context.fillStyle = pipe.img === topPipeImg ? "#228B22" : "#32CD32";
            context.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
            // Add pipe highlight
            context.fillStyle = pipe.img === topPipeImg ? "#32CD32" : "#90EE90";
            context.fillRect(pipe.x + 5, pipe.y, 5, pipe.height);
        }

        // Score when passing pipe
        if (!gameOver && !pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5;
            pipe.passed = true;
        }

        // Collision detection
        if (!gameOver && detectCollision(bird, pipe)) {
            gameOver = true;
        }
    }

    // Clear pipes that are off screen
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }

    // Draw score with better styling
    drawScore();
    
    // Draw leaderboard button (only when game is active and not game over)
    if (!gameOver && gameStarted) {
        drawLeaderboardButton();
    }

    // Game over screen
    if (gameOver) {
        drawGameOverScreen();
    }
}

function drawScore() {
    // Score background
    context.fillStyle = "rgba(0, 0, 0, 0.5)";
    context.fillRect(5, 5, 100, 50);
    
    // Score text
    context.fillStyle = "white";
    context.font = "bold 32px Arial";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.strokeText(Math.floor(score), 15, 40);
    context.fillText(Math.floor(score), 15, 40);
}

function drawGameOverScreen() {
    // Semi-transparent overlay
    context.fillStyle = "rgba(0, 0, 0, 0.8)";
    context.fillRect(0, 0, boardWidth, boardHeight);
    
    // Game Over title
    context.fillStyle = "#FF4444";
    context.font = "bold 48px Arial";
    context.strokeStyle = "black";
    context.lineWidth = 3;
    let gameOverText = "GAME OVER";
    let gameOverWidth = context.measureText(gameOverText).width;
    let gameOverX = (boardWidth - gameOverWidth) / 2;
    context.strokeText(gameOverText, gameOverX, boardHeight/2 - 80);
    context.fillText(gameOverText, gameOverX, boardHeight/2 - 80);
    
    // Final score
    context.fillStyle = "#FFD700";
    context.font = "bold 32px Arial";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    let scoreText = "Score: " + Math.floor(score);
    let scoreWidth = context.measureText(scoreText).width;
    let scoreX = (boardWidth - scoreWidth) / 2;
    context.strokeText(scoreText, scoreX, boardHeight/2 - 20);
    context.fillText(scoreText, scoreX, boardHeight/2 - 20);
    
    // Check if it's a high score
    if (score > 0 && isHighScore(score)) {
        showNameInput = true;
        return;
    }
    
    // Restart instruction
    context.fillStyle = "white";
    context.font = "bold 20px Arial";
    context.strokeStyle = "black";
    context.lineWidth = 1;
    let restartText = "CLICK TO RESTART";
    let restartWidth = context.measureText(restartText).width;
    let restartX = (boardWidth - restartWidth) / 2;
    context.strokeText(restartText, restartX, boardHeight/2 + 40);
    context.fillText(restartText, restartX, boardHeight/2 + 40);
    
    // Leaderboard button on game over screen
    drawGameOverLeaderboardButton();
}

function drawGameOverLeaderboardButton() {
    // Button background with gradient
    let gradient = context.createLinearGradient(boardWidth/2 - 80, boardHeight/2 + 70, boardWidth/2 + 80, boardHeight/2 + 110);
    gradient.addColorStop(0, "#FF8C00");
    gradient.addColorStop(1, "#FF6347");
    
    context.fillStyle = gradient;
    context.fillRect(boardWidth/2 - 80, boardHeight/2 + 70, 160, 40);
    
    // Button border
    context.strokeStyle = "#CC4125";
    context.lineWidth = 2;
    context.strokeRect(boardWidth/2 - 80, boardHeight/2 + 70, 160, 40);
    
    // Button text
    context.fillStyle = "white";
    context.font = "bold 16px Arial";
    context.strokeStyle = "black";
    context.lineWidth = 1;
    let buttonText = "VIEW LEADERBOARD";
    let buttonWidth = context.measureText(buttonText).width;
    let buttonX = (boardWidth - buttonWidth) / 2;
    context.strokeText(buttonText, buttonX, boardHeight/2 + 95);
    context.fillText(buttonText, buttonX, boardHeight/2 + 95);
}

function drawStartScreen() {
    context.clearRect(0, 0, board.width, board.height);
    
    // Draw background bird (only if image is loaded)
    if (birdImg.complete && birdImg.naturalHeight !== 0) {
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    } else {
        // Draw a simple rectangle as fallback
        context.fillStyle = "#FFD700";
        context.fillRect(bird.x, bird.y, bird.width, bird.height);
    }
    
    // Semi-transparent overlay
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(0, 0, boardWidth, boardHeight);
    
    // Game title
    context.fillStyle = "#FFD700";
    context.font = "bold 48px Arial";
    context.strokeStyle = "black";
    context.lineWidth = 3;
    let titleText = "FLAPPY BIRD";
    let titleWidth = context.measureText(titleText).width;
    let titleX = (boardWidth - titleWidth) / 2;
    context.strokeText(titleText, titleX, boardHeight/2 - 80);
    context.fillText(titleText, titleX, boardHeight/2 - 80);
    
    // Start instruction
    context.fillStyle = "white";
    context.font = "bold 24px Arial";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    let startText = "CLICK ANYWHERE TO START";
    let startWidth = context.measureText(startText).width;
    let startX = (boardWidth - startWidth) / 2;
    context.strokeText(startText, startX, boardHeight/2 + 20);
    context.fillText(startText, startX, boardHeight/2 + 20);
    
    // Instructions
    context.fillStyle = "lightgray";
    context.font = "18px Arial";
    let instructText = "Press SPACE or TAP to fly";
    let instructWidth = context.measureText(instructText).width;
    let instructX = (boardWidth - instructWidth) / 2;
    context.fillText(instructText, instructX, boardHeight/2 + 80);
    
    // Database status
    if (databaseConnected) {
        context.fillStyle = "#4CAF50";
        context.font = "14px Arial";
        context.fillText("🌐 Online Leaderboard", 10, boardHeight - 20);
    } else {
        context.fillStyle = "#FFA500";
        context.font = "14px Arial";
        context.fillText("📱 Local Scores Only", 10, boardHeight - 20);
    }
    
    // Leaderboard button on start screen
    drawLeaderboardButton();
}

function drawLeaderboardButton() {
    // Button background with gradient
    let gradient = context.createLinearGradient(boardWidth - 120, 10, boardWidth - 120, 40);
    gradient.addColorStop(0, "#4CAF50");
    gradient.addColorStop(1, "#45a049");
    
    context.fillStyle = gradient;
    context.fillRect(boardWidth - 120, 10, 110, 30);
    
    // Button border
    context.strokeStyle = "#2E7D32";
    context.lineWidth = 2;
    context.strokeRect(boardWidth - 120, 10, 110, 30);
    
    // Button text
    context.fillStyle = "white";
    context.font = "bold 14px Arial";
    context.textAlign = "center";
    context.fillText("LEADERBOARD", boardWidth - 65, 28);
    context.textAlign = "left"; // Reset alignment
}

function drawLeaderboardScreen() {
    context.clearRect(0, 0, board.width, board.height);
    
    // Background
    context.fillStyle = "rgba(0, 0, 0, 0.9)";
    context.fillRect(0, 0, boardWidth, boardHeight);
    
    // Title
    context.fillStyle = "#FFD700";
    context.font = "bold 36px Arial";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    let titleText = "LEADERBOARD";
    let titleWidth = context.measureText(titleText).width;
    let titleX = (boardWidth - titleWidth) / 2;
    context.strokeText(titleText, titleX, 60);
    context.fillText(titleText, titleX, 60);
    
    // High scores
    context.fillStyle = "white";
    context.font = "20px Arial";
    
    if (highScores.length === 0) {
        let noScoresText = "No scores yet!";
        let noScoresWidth = context.measureText(noScoresText).width;
        let noScoresX = (boardWidth - noScoresWidth) / 2;
        context.fillText(noScoresText, noScoresX, 150);
    } else {
        for (let i = 0; i < Math.min(10, highScores.length); i++) {
            let rank = i + 1;
            let name = highScores[i].player_name || highScores[i].name;
            let scoreValue = highScores[i].score;
            
            // Rank color
            if (rank === 1) context.fillStyle = "#FFD700"; // Gold
            else if (rank === 2) context.fillStyle = "#C0C0C0"; // Silver
            else if (rank === 3) context.fillStyle = "#CD7F32"; // Bronze
            else context.fillStyle = "white";
            
            let rankText = rank + ".";
            context.fillText(rankText, 30, 120 + i * 35);
            
            context.fillStyle = "white";
            context.fillText(name, 60, 120 + i * 35);
            
            // Score aligned to right
            let scoreText = scoreValue.toString();
            let scoreWidth = context.measureText(scoreText).width;
            context.fillText(scoreText, boardWidth - 30 - scoreWidth, 120 + i * 35);
        }
    }
    
    // Back button
    context.fillStyle = "#f44336";
    context.fillRect(boardWidth/2 - 50, boardHeight - 80, 100, 40);
    
    context.strokeStyle = "#d32f2f";
    context.lineWidth = 2;
    context.strokeRect(boardWidth/2 - 50, boardHeight - 80, 100, 40);
    
    context.fillStyle = "white";
    context.font = "bold 16px Arial";
    context.textAlign = "center";
    context.fillText("BACK", boardWidth/2, boardHeight - 55);
    context.textAlign = "left";
}

function drawNameInputScreen() {
    context.clearRect(0, 0, board.width, board.height);
    
    // Background
    context.fillStyle = "rgba(0, 0, 0, 0.9)";
    context.fillRect(0, 0, boardWidth, boardHeight);
    
    // Congratulations message
    context.fillStyle = "#FFD700";
    context.font = "bold 32px Arial";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    let congrats = "NEW HIGH SCORE!";
    let congratsWidth = context.measureText(congrats).width;
    let congratsX = (boardWidth - congratsWidth) / 2;
    context.strokeText(congrats, congratsX, 150);
    context.fillText(congrats, congratsX, 150);
    
    // Score display
    context.fillStyle = "white";
    context.font = "24px Arial";
    let scoreText = "Score: " + Math.floor(score);
    let scoreWidth = context.measureText(scoreText).width;
    let scoreX = (boardWidth - scoreWidth) / 2;
    context.fillText(scoreText, scoreX, 200);
    
    // Name input prompt
    context.fillStyle = "lightblue";
    context.font = "20px Arial";
    let promptText = "Enter your name:";
    let promptWidth = context.measureText(promptText).width;
    let promptX = (boardWidth - promptWidth) / 2;
    context.fillText(promptText, promptX, 280);
    
    // Input box
    context.fillStyle = "white";
    context.fillRect(50, 300, boardWidth - 100, 40);
    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.strokeRect(50, 300, boardWidth - 100, 40);
    
    // Current name text
    context.fillStyle = "black";
    context.font = "18px Arial";
    context.fillText(playerName + "_", 60, 325);
    
    // Instructions
    context.fillStyle = "lightgray";
    context.font = "16px Arial";
    let instructText = "Type your name and press ENTER";
    let instructWidth = context.measureText(instructText).width;
    let instructX = (boardWidth - instructWidth) / 2;
    context.fillText(instructText, instructX, 380);
}

function drawHighScoresScreen() {
    context.clearRect(0, 0, board.width, board.height);
    
    // Background
    context.fillStyle = "rgba(0, 0, 0, 0.9)";
    context.fillRect(0, 0, boardWidth, boardHeight);
    
    // Title
    context.fillStyle = "#FFD700";
    context.font = "bold 36px Arial";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    let titleText = "HIGH SCORES";
    let titleWidth = context.measureText(titleText).width;
    let titleX = (boardWidth - titleWidth) / 2;
    context.strokeText(titleText, titleX, 80);
    context.fillText(titleText, titleX, 80);
    
    // Display scores
    context.fillStyle = "white";
    context.font = "18px Arial";
    
    for (let i = 0; i < Math.min(10, highScores.length); i++) {
        let rank = i + 1;
        let name = highScores[i].player_name || highScores[i].name;
        let scoreValue = highScores[i].score;
        
        // Highlight current score
        if (scoreValue === Math.floor(score) && name === playerName) {
            context.fillStyle = "#FFD700";
        } else {
            context.fillStyle = "white";
        }
        
        let rankText = rank + ". " + name + " - " + scoreValue;
        context.fillText(rankText, 50, 130 + i * 30);
    }
    
    // Continue button
    context.fillStyle = "#4CAF50";
    context.fillRect(boardWidth/2 - 60, boardHeight - 100, 120, 40);
    
    context.strokeStyle = "#45a049";
    context.lineWidth = 2;
    context.strokeRect(boardWidth/2 - 60, boardHeight - 100, 120, 40);
    
    context.fillStyle = "white";
    context.font = "bold 16px Arial";
    context.textAlign = "center";
    context.fillText("CONTINUE", boardWidth/2, boardHeight - 75);
    context.textAlign = "left";
}

function placePipes() {
    if (gameOver || !gameStarted) {
        return;
    }

    // Simple pipe algorithm (matching pseudocode)
    let randomPipeY = pipeY - pipeHeight/4 - Math.random()*(pipeHeight/2);
    let openingSpace = board.height/4;

    let topPipe = {
        img : topPipeImg,
        x : pipeX,
        y : randomPipeY,
        width : pipeWidth,
        height : pipeHeight,
        passed : false
    }
    pipeArray.push(topPipe);

    let bottomPipe = {
        img : bottomPipeImg,
        x : pipeX,
        y : randomPipeY + pipeHeight + openingSpace,
        width : pipeWidth,
        height : pipeHeight,
        passed : false
    }
    pipeArray.push(bottomPipe);
}

function moveBird(e) {
    // Handle start screen
    if (!gameStarted) {
        // Check if clicking leaderboard button
        if (e.type == "click" || e.type == "touchstart") {
            let rect = board.getBoundingClientRect();
            let clickX = (e.clientX || e.touches[0].clientX) - rect.left;
            let clickY = (e.clientY || e.touches[0].clientY) - rect.top;
            
            // Scale coordinates to canvas size
            clickX = clickX * (boardWidth / rect.width);
            clickY = clickY * (boardHeight / rect.height);
            
            if (isClickOnLeaderboardButton(clickX, clickY)) {
                showLeaderboard = true;
                return;
            }
        }
        
        // Start the game on any click/key press
        gameStarted = true;
        velocityY = jumpForce; // Give initial jump
        return;
    }
    
    // Handle leaderboard screen
    if (showLeaderboard) {
        if (e.type == "click" || e.type == "touchstart") {
            let rect = board.getBoundingClientRect();
            let clickX = (e.clientX || e.touches[0].clientX) - rect.left;
            let clickY = (e.clientY || e.touches[0].clientY) - rect.top;
            
            // Scale coordinates to canvas size
            clickX = clickX * (boardWidth / rect.width);
            clickY = clickY * (boardHeight / rect.height);
            
            // Check if clicking back button
            if (clickX >= boardWidth/2 - 50 && clickX <= boardWidth/2 + 50 &&
                clickY >= boardHeight - 80 && clickY <= boardHeight - 40) {
                showLeaderboard = false;
                return;
            }
        }
        
        if (e.code == "Escape" || e.code == "Backspace") {
            showLeaderboard = false;
        }
        return;
    }
    
    // Handle name input screen
    if (showNameInput) {
        if (e.type == "keydown") {
            if (e.code == "Enter" && playerName.trim() !== "") {
                saveHighScoreToAll(playerName.trim(), Math.floor(score));
                showNameInput = false;
                showHighScores = true;
                return;
            } else if (e.code == "Backspace") {
                playerName = playerName.slice(0, -1);
                return;
            } else if (e.key.length === 1 && playerName.length < 15) {
                playerName += e.key;
                return;
            }
        }
        return;
    }
    
    // Handle high scores screen
    if (showHighScores) {
        if (e.type == "click" || e.type == "touchstart") {
            let rect = board.getBoundingClientRect();
            let clickX = (e.clientX || e.touches[0].clientX) - rect.left;
            let clickY = (e.clientY || e.touches[0].clientY) - rect.top;
            
            // Scale coordinates to canvas size
            clickX = clickX * (boardWidth / rect.width);
            clickY = clickY * (boardHeight / rect.height);
            
            // Check if clicking continue button
            if (clickX >= boardWidth/2 - 60 && clickX <= boardWidth/2 + 60 &&
                clickY >= boardHeight - 100 && clickY <= boardHeight - 60) {
                showHighScores = false;
                resetGame();
                return;
            }
        }
        
        if (e.code == "Enter" || e.code == "Space") {
            showHighScores = false;
            resetGame();
        }
        return;
    }
    
    // Handle game over screen
    if (gameOver) {
        if (e.type == "click" || e.type == "touchstart") {
            let rect = board.getBoundingClientRect();
            let clickX = (e.clientX || e.touches[0].clientX) - rect.left;
            let clickY = (e.clientY || e.touches[0].clientY) - rect.top;
            
            // Scale coordinates to canvas size
            clickX = clickX * (boardWidth / rect.width);
            clickY = clickY * (boardHeight / rect.height);
            
            // Check if clicking leaderboard button on game over screen
            if (clickX >= boardWidth/2 - 80 && clickX <= boardWidth/2 + 80 &&
                clickY >= boardHeight/2 + 70 && clickY <= boardHeight/2 + 110) {
                showLeaderboard = true;
                return;
            }
        }
        
        // Restart game
        if (e.code == "Space" || e.code == "Enter" || e.type == "click" || e.type == "touchstart") {
            resetGame();
        }
        return;
    }
    
    // Handle leaderboard button click during gameplay
    if (!gameOver && gameStarted && (e.type == "click" || e.type == "touchstart")) {
        let rect = board.getBoundingClientRect();
        let clickX = (e.clientX || e.touches[0].clientX) - rect.left;
        let clickY = (e.clientY || e.touches[0].clientY) - rect.top;
        
        // Scale coordinates to canvas size
        clickX = clickX * (boardWidth / rect.width);
        clickY = clickY * (boardHeight / rect.height);
        
        if (isClickOnLeaderboardButton(clickX, clickY)) {
            showLeaderboard = true;
            return;
        }
    }
    
    // Normal game controls
    if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX" || e.type == "click" || e.type == "touchstart") {
        velocityY = jumpForce;
    }
}

function isClickOnLeaderboardButton(x, y) {
    return x >= boardWidth - 120 && x <= boardWidth - 10 && y >= 10 && y <= 40;
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function isHighScore(currentScore) {
    if (highScores.length < 10) {
        return true;
    }
    return Math.floor(currentScore) > highScores[highScores.length - 1].score;
}

function loadLocalHighScores() {
    try {
        const localScores = localStorage.getItem('flappyBirdScores');
        if (localScores) {
            highScores = JSON.parse(localScores);
        }
    } catch (error) {
        console.warn("Failed to load local high scores:", error);
        highScores = [];
    }
}

async function loadDatabaseHighScores() {
    try {
        const dbScores = await getFromDatabase(10);
        if (dbScores && dbScores.length > 0) {
            highScores = dbScores;
            databaseConnected = true;
        }
    } catch (error) {
        console.warn("Database not available, using local storage:", error);
        databaseConnected = false;
    }
}

async function saveHighScoreToAll(name, score) {
    // Save to local storage
    const localScore = { name: name, score: score };
    highScores.push(localScore);
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10);
    localStorage.setItem('flappyBirdScores', JSON.stringify(highScores));
    
    // Try to save to database
    try {
        await saveToDatabase(name, score);
        // Reload from database to get updated list
        await loadDatabaseHighScores();
    } catch (error) {
        console.warn("Failed to save to database:", error);
    }
}

function resetGame() {
    bird.y = birdY;
    pipeArray = [];
    score = 0;
    gameOver = false;
    gameStarted = true; // Keep game started after reset
    showNameInput = false;
    showHighScores = false;
    showLeaderboard = false;
    playerName = "";
    velocityY = 0;
}