let gameOver = false;
let gameStarted = false;
let score = 0;
let showNameInput = false;
let showHighScores = false;
let showLeaderboard = false;
let playerName = "";
let highScores = JSON.parse(localStorage.getItem('flappyBirdScores')) || [];

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

// Physics
let velocityX = -2;
let velocityY = 0;
let gravity = 0.4;
let jumpForce = -6;

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    // Initialize game state
    bird.x = birdX;
    bird.y = birdY;
    
    // Load images with error handling
    birdImg = new Image();
    birdImg.src = "./flappybird.png";
    birdImg.onerror = function() {
        console.error("Failed to load bird image");
    };

    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";
    topPipeImg.onerror = function() {
        console.error("Failed to load top pipe image");
    };

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";
    bottomPipeImg.onerror = function() {
        console.error("Failed to load bottom pipe image");
    };

    // Start the game loop
    requestAnimationFrame(update);
    setInterval(placePipes, 1500);
    document.addEventListener("keydown", moveBird);
    board.addEventListener("click", moveBird);
    board.addEventListener("touchstart", moveBird);
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

    // Bird
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0);
    
    // Draw bird (with fallback if image not loaded)
    if (birdImg.complete && birdImg.naturalHeight !== 0) {
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    } else {
        // Draw a simple rectangle as fallback
        context.fillStyle = "#FFD700";
        context.fillRect(bird.x, bird.y, bird.width, bird.height);
    }

    if (bird.y > board.height) {
        gameOver = true;
    }

    // Pipes
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        
        // Draw pipe (with fallback if image not loaded)
        if (pipe.img.complete && pipe.img.naturalHeight !== 0) {
            context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);
        } else {
            // Draw a simple rectangle as fallback
            context.fillStyle = pipe.img === topPipeImg ? "#228B22" : "#32CD32";
            context.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
        }

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5;
            pipe.passed = true;
        }

        if (detectCollision(bird, pipe)) {
            gameOver = true;
        }
    }

    // Clear pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }

    // Score
    context.fillStyle = "white";
    context.font = "45px sans-serif";
    context.fillText(score, 10, 45);

    // Game over
    if (gameOver || !gameStarted) {
        context.fillStyle = "red";
        context.font = "45px sans-serif";
        context.fillText("GAME OVER", 50, 90);
        
        // Check if it's a high score
        if (isHighScore(score)) {
            showNameInput = true;
        } else {
            context.fillStyle = "white";
            context.font = "20px sans-serif";
            context.fillText("Press R to restart", 80, 130);
        }
    }
    
    // Draw score
    context.fillStyle = "white";
    context.font = "bold 32px Arial";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.strokeText(score, 10, 50);
    context.fillText(score, 10, 50);
    
    // Draw current score during gameplay
    context.fillStyle = "yellow";
    context.font = "20px Arial";
    context.fillText("Score: " + score, 10, 80);
    
    // Draw leaderboard button (only when game is active)
    if (!gameOver && gameStarted) {
        drawLeaderboardButton();
    }
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
            let name = highScores[i].name;
            let score = highScores[i].score;
            
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
            let scoreText = score.toString();
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
    let scoreText = "Score: " + score;
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
        let name = highScores[i].name;
        let scoreValue = highScores[i].score;
        
        // Highlight current score
        if (scoreValue === score && name === playerName) {
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
                saveHighScore(playerName.trim(), score);
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

        if (gameOver) {
            resetGame();
        }
    }
    
    // Restart game
    if (e.code == "KeyR" && gameOver) {
        resetGame();
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
    return currentScore > highScores[highScores.length - 1].score;
}

function saveHighScore(name, score) {
    highScores.push({name: name, score: score});
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10); // Keep only top 10
    localStorage.setItem('flappyBirdScores', JSON.stringify(highScores));
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