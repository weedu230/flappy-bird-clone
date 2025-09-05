//board
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

//bird
let birdWidth = 34; //width/height ratio = 408/228 = 17/12
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

//pipes
let pipeArray = [];
let pipeWidth = 64; //width/height ratio = 384/3072 = 1/8
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

//physics
let velocityX = -2; //pipes moving left speed
let velocityY = 0; //bird jump speed
let gravity = 0.4;

let gameOver = false;
let score = 0;
let showNameInput = false;
let showHighScores = false;
let showLeaderboard = false;
let playerName = "";
let highScores = [];

//audio
let bgMusic;

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //used for drawing on the board

    //load images
    birdImg = new Image();
    birdImg.src = "./flappybird.png";
    birdImg.onload = function() {
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    }

    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";

    //load background music
    bgMusic = new Audio();
    bgMusic.src = "./bgm_mario.mp3";
    bgMusic.loop = true;
    bgMusic.volume = 0.3; //set volume to 30%

    requestAnimationFrame(update);
    setInterval(placePipes, 1500); //every 1.5 seconds
    document.addEventListener("keydown", moveBird);
    document.addEventListener("touchstart", moveBird);
    document.addEventListener("click", moveBird);
    
    // Load high scores from localStorage
    loadHighScores();
}

function loadHighScores() {
    const saved = localStorage.getItem('flappyBirdHighScores');
    if (saved) {
        try {
            highScores = JSON.parse(saved);
        } catch (e) {
            highScores = [];
        }
    } else {
        highScores = [];
    }
}

function saveHighScores() {
    localStorage.setItem('flappyBirdHighScores', JSON.stringify(highScores));
}

function addHighScore(name, score) {
    highScores.push({ name: name, score: score });
    // Sort by score (highest first) and keep only top 10
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10);
    saveHighScores();
}

function update() {
    requestAnimationFrame(update);
    if (showLeaderboard) {
        drawLeaderboardScreen();
        return;
    }
    if (gameOver && showNameInput) {
        drawNameInputScreen();
        return;
    }
    if (gameOver && showHighScores) {
        drawHighScoresScreen();
        return;
    }
    if (gameOver) {
        drawGameOverScreen();
        return;
    }
    
    context.clearRect(0, 0, board.width, board.height);

    //bird
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0); //apply gravity to current bird.y, limit the bird.y to top of the canvas
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    if (bird.y > board.height) {
        gameOver = true;
    }

    //pipes
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5; //0.5 because there are 2 pipes! so 0.5*2 = 1, 1 for each set of pipes
            pipe.passed = true;
        }

        if (detectCollision(bird, pipe)) {
            gameOver = true;
        }
    }

    //clear pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift(); //removes first element from the array
    }

    //score
    context.fillStyle = "white";
    context.font="bold 32px Arial";
    context.strokeStyle = "black";
    context.lineWidth = 3;
    
    // Draw score label
    context.strokeText("SCORE", 10, 35);
    context.fillText("SCORE", 10, 35);
    
    // Draw score value with larger font
    context.font="bold 48px Arial";
    context.strokeText(score, 10, 80);
    context.fillText(score, 10, 80);
    
    // Draw leaderboard button (only when game is active)
    if (!gameOver) {
        drawLeaderboardButton();
    }
}

function drawLeaderboardButton() {
    // Button background with gradient
    let gradient = context.createLinearGradient(boardWidth - 120, 10, boardWidth - 10, 45);
    gradient.addColorStop(0, "#4CAF50");
    gradient.addColorStop(1, "#45a049");
    context.fillStyle = gradient;
    context.fillRect(boardWidth - 120, 10, 110, 35);
    
    // Button border with shadow effect
    context.strokeStyle = "#2E7D32";
    context.lineWidth = 3;
    context.strokeRect(boardWidth - 120, 10, 110, 35);
    
    // Inner highlight
    context.strokeStyle = "rgba(255, 255, 255, 0.3)";
    context.lineWidth = 1;
    context.strokeRect(boardWidth - 118, 12, 106, 31);
    
    // Button text
    context.fillStyle = "white";
    context.font = "bold 12px Arial";
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.strokeText("LEADERBOARD", boardWidth - 115, 30);
    context.fillText("LEADERBOARD", boardWidth - 115, 30);
}

function isClickOnLeaderboardButton(x, y) {
    return x >= boardWidth - 120 && x <= boardWidth - 10 && 
           y >= 10 && y <= 45;
}

function drawLeaderboardScreen() {
    context.clearRect(0, 0, board.width, board.height);
    
    // Gradient background
    let gradient = context.createLinearGradient(0, 0, 0, boardHeight);
    gradient.addColorStop(0, "#1e3c72");
    gradient.addColorStop(1, "#2a5298");
    context.fillStyle = gradient;
    context.fillRect(0, 0, boardWidth, boardHeight);
    
    // Title with trophy
    context.fillStyle = "#FFD700";
    context.font = "bold 28px Arial";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    let titleText = "🏆 LEADERBOARD 🏆";
    let titleWidth = context.measureText(titleText).width;
    let titleX = (boardWidth - titleWidth) / 2;
    context.strokeText(titleText, titleX, 60);
    context.fillText(titleText, titleX, 60);
    
    if (highScores.length === 0) {
        context.fillStyle = "white";
        context.font = "20px Arial";
        let noScoresText = "No scores yet!";
        let noScoresWidth = context.measureText(noScoresText).width;
        let noScoresX = (boardWidth - noScoresWidth) / 2;
        context.fillText(noScoresText, noScoresX, boardHeight/2);
    } else {
        // Display high scores
        context.font = "18px Arial";
        for (let i = 0; i < Math.min(10, highScores.length); i++) {
            // Special styling for top 3
            if (i < 3) {
                context.fillStyle = "#FFD700"; // Gold for top 3
                context.strokeStyle = "black";
                context.lineWidth = 1;
            } else {
                context.fillStyle = "white";
                context.strokeStyle = "black";
                context.lineWidth = 1;
            }
            
            let rank = i + 1;
            let scoreEntry = `#${rank}  ${highScores[i].name}  -  ${highScores[i].score}`;
            let entryWidth = context.measureText(scoreEntry).width;
            let entryX = (boardWidth - entryWidth) / 2;
            let entryY = 120 + (i * 35);
            
            context.strokeText(scoreEntry, entryX, entryY);
            context.fillText(scoreEntry, entryX, entryY);
        }
    }
    
    // Back button
    context.fillStyle = "rgba(255, 255, 255, 0.9)";
    context.fillRect(boardWidth/2 - 60, boardHeight - 80, 120, 40);
    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.strokeRect(boardWidth/2 - 60, boardHeight - 80, 120, 40);
    
    context.fillStyle = "black";
    context.font = "bold 16px Arial";
    let backText = "BACK TO GAME";
    let backWidth = context.measureText(backText).width;
    let backX = (boardWidth - backWidth) / 2;
    context.fillText(backText, backX, boardHeight - 55);
}

function drawNameInputScreen() {
    context.clearRect(0, 0, board.width, board.height);
    
    // Semi-transparent overlay
    context.fillStyle = "rgba(0, 0, 0, 0.8)";
    context.fillRect(0, 0, boardWidth, boardHeight);
    
    // Title
    context.fillStyle = "white";
    context.font = "bold 28px Arial";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    let titleText = "NEW HIGH SCORE!";
    let titleWidth = context.measureText(titleText).width;
    let titleX = (boardWidth - titleWidth) / 2;
    context.strokeText(titleText, titleX, boardHeight/2 - 100);
    context.fillText(titleText, titleX, boardHeight/2 - 100);
    
    // Score display
    context.font = "bold 24px Arial";
    let scoreText = "Score: " + score;
    let scoreWidth = context.measureText(scoreText).width;
    let scoreX = (boardWidth - scoreWidth) / 2;
    context.strokeText(scoreText, scoreX, boardHeight/2 - 60);
    context.fillText(scoreText, scoreX, boardHeight/2 - 60);
    
    // Name prompt
    context.font = "bold 20px Arial";
    let namePromptText = "Enter Your Name:";
    let namePromptWidth = context.measureText(namePromptText).width;
    let namePromptX = (boardWidth - namePromptWidth) / 2;
    context.strokeText(namePromptText, namePromptX, boardHeight/2 - 20);
    context.fillText(namePromptText, namePromptX, boardHeight/2 - 20);
    
    // Input box
    context.strokeStyle = "white";
    context.lineWidth = 2;
    context.strokeRect(boardWidth/2 - 100, boardHeight/2 + 10, 200, 40);
    
    // Current input text
    context.fillStyle = "white";
    context.font = "18px Arial";
    let textX = boardWidth/2 - 95;
    context.fillText(playerName + "|", textX, boardHeight/2 + 35);
    
    // Instructions
    context.font = "16px Arial";
    context.fillStyle = "yellow";
    let instructText = "Press ENTER to save";
    let instructWidth = context.measureText(instructText).width;
    let instructX = (boardWidth - instructWidth) / 2;
    context.fillText(instructText, instructX, boardHeight/2 + 80);
}

function drawHighScoresScreen() {
    context.clearRect(0, 0, board.width, board.height);
    
    // Semi-transparent overlay
    context.fillStyle = "rgba(0, 0, 0, 0.8)";
    context.fillRect(0, 0, boardWidth, boardHeight);
    
    // Title
    context.fillStyle = "white";
    context.font = "bold 28px Arial";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    let titleText = "HIGH SCORES";
    let titleWidth = context.measureText(titleText).width;
    let titleX = (boardWidth - titleWidth) / 2;
    context.strokeText(titleText, titleX, boardHeight/2 - 120);
    context.fillText(titleText, titleX, boardHeight/2 - 120);
    
    // Display high scores
    context.font = "20px Arial";
    for (let i = 0; i < Math.min(8, highScores.length); i++) {
        let scoreEntry = `${i + 1}. ${highScores[i].name}: ${highScores[i].score}`;
        let entryWidth = context.measureText(scoreEntry).width;
        let entryX = (boardWidth - entryWidth) / 2;
        context.strokeText(scoreEntry, entryX, boardHeight/2 - 80 + (i * 30));
        context.fillText(scoreEntry, entryX, boardHeight/2 - 80 + (i * 30));
    }
    
    // Instructions
    context.font = "18px Arial";
    context.fillStyle = "yellow";
    let instructText = "TAP TO PLAY AGAIN";
    let instructWidth = context.measureText(instructText).width;
    let instructX = (boardWidth - instructWidth) / 2;
    context.fillText(instructText, instructX, boardHeight/2 + 120);
}

function drawGameOverScreen() {
    context.clearRect(0, 0, board.width, board.height);
    
    // Game over text
    context.fillStyle = "white";
    context.font="bold 36px Arial";
    context.strokeStyle = "black";
    context.lineWidth = 3;
    let gameOverText = "GAME OVER";
    let textWidth = context.measureText(gameOverText).width;
    let x = (boardWidth - textWidth) / 2;
    
    context.strokeText(gameOverText, x, boardHeight/2 - 80);
    context.fillText(gameOverText, x, boardHeight/2 - 80);
    
    // Final score display
    context.font="bold 24px Arial";
    let finalScoreText = "FINAL SCORE: " + score;
    let finalScoreWidth = context.measureText(finalScoreText).width;
    let finalScoreX = (boardWidth - finalScoreWidth) / 2;
    
    context.strokeText(finalScoreText, finalScoreX, boardHeight/2 - 40);
    context.fillText(finalScoreText, finalScoreX, boardHeight/2 - 40);
    
    // Restart instruction
    context.font="bold 18px Arial";
    let restartText = "TAP TO RESTART";
    let restartWidth = context.measureText(restartText).width;
    let restartX = (boardWidth - restartWidth) / 2;
    
    context.strokeText(restartText, restartX, boardHeight/2);
    context.fillText(restartText, restartX, boardHeight/2);
}

function placePipes() {
    if (gameOver) {
        return;
    }

    // Much improved pipe algorithm - ensures gap is ALWAYS passable
    let minGapFromTop = 100; // Minimum distance from top
    let minGapFromBottom = 100; // Minimum distance from bottom
    let gapSize = 180; // Larger gap size that's definitely passable
    
    // Calculate safe range for top pipe
    let maxTopPipeHeight = boardHeight - gapSize - minGapFromBottom;
    let minTopPipeHeight = minGapFromTop;
    
    // Ensure we have a valid range
    if (maxTopPipeHeight <= minTopPipeHeight) {
        // Fallback to center if calculation fails
        let topPipeHeight = boardHeight / 2 - gapSize / 2;
    } else {
        // Random position within safe range
        let topPipeHeight = minTopPipeHeight + Math.random() * (maxTopPipeHeight - minTopPipeHeight);
    }
    
    // Random position within safe range
    let topPipeHeight = minTopPipeHeight + Math.random() * (maxTopPipeHeight - minTopPipeHeight);
    
    // Top pipe (extends from top down)
    let randomPipeY = topPipeHeight - pipeHeight;

    let topPipe = {
        img : topPipeImg,
        x : pipeX,
        y : randomPipeY,
        width : pipeWidth,
        height : pipeHeight,
        passed : false
    }
    pipeArray.push(topPipe);

    // Bottom pipe (starts after the gap)
    let bottomPipe = {
        img : bottomPipeImg,
        x : pipeX,
        y : topPipeHeight + gapSize,
        width : pipeWidth,
        height : pipeHeight,
        passed : false
    }
    pipeArray.push(bottomPipe);
}

function moveBird(e) {
    // Handle leaderboard screen
    if (showLeaderboard) {
        if (e.code == "Space" || e.code == "Escape" || e.type == "touchstart" || e.type == "click") {
            showLeaderboard = false;
        }
        return;
    }
    
    // Handle leaderboard button click during gameplay
    if (!gameOver && (e.type == "click" || e.type == "touchstart")) {
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
    
    // Handle name input when showing name input screen
    if (gameOver && showNameInput) {
        if (e.type === "keydown") {
            if (e.code === "Enter" || e.key === "Enter") {
                if (playerName.trim() !== "") {
                    addHighScore(playerName.trim(), score);
                    playerName = "";
                    showNameInput = false;
                    showHighScores = true;
                }
            } else if (e.code === "Backspace" || e.key === "Backspace") {
                playerName = playerName.slice(0, -1);
            } else if (e.key && e.key.length === 1 && playerName.length < 12) {
                // Only add printable characters
                if (e.key.match(/[a-zA-Z0-9\s]/)) {
                    playerName += e.key;
                }
            }
        }
        return;
    }
    
    // Handle high scores screen
    if (gameOver && showHighScores) {
        if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX" || e.type == "touchstart" || e.type == "click") {
            resetGame();
        }
        return;
    }
    
    if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX" || e.type == "touchstart" || e.type == "click") {
        //start music on first interaction (required by browsers)
        if (bgMusic.paused) {
            bgMusic.play().catch(e => console.log("Audio play failed:", e));
        }
        
        //jump
        velocityY = -6;

        //reset game
        if (gameOver && !showNameInput && !showHighScores) {
            // Check if we should show name input (if score > 0 and not already showing high scores)
            if (score > 0) {
                showNameInput = true;
                return;
            } else if (score === 0) {
                // No score earned, just restart the game
                resetGame();
            }
            return;
        }
    }
    
    // Prevent default behavior for touch events to avoid scrolling
    if (e.type == "touchstart") {
        e.preventDefault();
    }
}

function resetGame() {
    bird.y = birdY;
    pipeArray = [];
    score = 0;
    gameOver = false;
    showNameInput = false;
    showHighScores = false;
    showLeaderboard = false;
    playerName = "";
    velocityY = 0;
    //restart music
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => console.log("Audio play failed:", e));
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
           a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
           a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}