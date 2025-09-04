
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
let playerName = "";
let highScores = [];

//audio
let bgMusic;

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //used for drawing on the board

    //draw flappy bird
    // context.fillStyle = "green";
    // context.fillRect(bird.x, bird.y, bird.width, bird.height);

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
    const saved = localStorage.getItem('flappyBirdScores');
    if (saved) {
        highScores = JSON.parse(saved);
    }
}

function saveHighScores() {
    localStorage.setItem('flappyBirdScores', JSON.stringify(highScores));
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
    if (gameOver && !showNameInput) {
        return;
    }
    context.clearRect(0, 0, board.width, board.height);

    //bird
    velocityY += gravity;
    // bird.y += velocityY;
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

    if (gameOver) {
        if (showNameInput) {
            // Show name input screen
            context.fillStyle = "rgba(0, 0, 0, 0.8)";
            context.fillRect(0, 0, boardWidth, boardHeight);
            
            context.fillStyle = "white";
            context.font = "bold 24px Arial";
            let namePromptText = "Enter Your Name:";
            let namePromptWidth = context.measureText(namePromptText).width;
            let namePromptX = (boardWidth - namePromptWidth) / 2;
            context.strokeText(namePromptText, namePromptX, boardHeight/2 - 60);
            context.fillText(namePromptText, namePromptX, boardHeight/2 - 60);
            
            // Draw input box
            context.strokeStyle = "white";
            context.lineWidth = 2;
            context.strokeRect(boardWidth/2 - 80, boardHeight/2 - 30, 160, 40);
            
            // Draw current input text
            context.fillStyle = "white";
            context.font = "20px Arial";
            context.fillText(playerName, boardWidth/2 - 75, boardHeight/2 - 5);
            
            // Instructions
            context.font = "16px Arial";
            let instructText = "Press ENTER to save score";
            let instructWidth = context.measureText(instructText).width;
            let instructX = (boardWidth - instructWidth) / 2;
            context.fillText(instructText, instructX, boardHeight/2 + 60);
            
        } else {
        // Game over text with better positioning
        context.font="bold 36px Arial";
        let gameOverText = "GAME OVER";
        let textWidth = context.measureText(gameOverText).width;
        let x = (boardWidth - textWidth) / 2;
        
        context.strokeText(gameOverText, x, boardHeight/2 - 50);
        context.fillText(gameOverText, x, boardHeight/2 - 50);
        
        // Restart instruction
        context.font="bold 20px Arial";
        let restartText = "TAP TO RESTART";
        let restartWidth = context.measureText(restartText).width;
        let restartX = (boardWidth - restartWidth) / 2;
        
        context.strokeText(restartText, restartX, boardHeight/2);
        context.fillText(restartText, restartX, boardHeight/2);
        
        // Final score display
        context.font="bold 24px Arial";
        let finalScoreText = "FINAL SCORE: " + score;
        let finalScoreWidth = context.measureText(finalScoreText).width;
        let finalScoreX = (boardWidth - finalScoreWidth) / 2;
        
        context.strokeText(finalScoreText, finalScoreX, boardHeight/2 + 40);
        context.fillText(finalScoreText, finalScoreX, boardHeight/2 + 40);
        }
    }
    
    // Display high scores if game is over and not showing name input
    if (gameOver && !showNameInput && highScores.length > 0) {
        context.fillStyle = "white";
        context.font = "bold 18px Arial";
        context.strokeStyle = "black";
        context.lineWidth = 2;
        
        let highScoreTitle = "HIGH SCORES";
        let titleWidth = context.measureText(highScoreTitle).width;
        let titleX = (boardWidth - titleWidth) / 2;
        context.strokeText(highScoreTitle, titleX, boardHeight/2 + 100);
        context.fillText(highScoreTitle, titleX, boardHeight/2 + 100);
        
        context.font = "14px Arial";
        for (let i = 0; i < Math.min(5, highScores.length); i++) {
            let scoreEntry = `${i + 1}. ${highScores[i].name}: ${highScores[i].score}`;
            let entryWidth = context.measureText(scoreEntry).width;
            let entryX = (boardWidth - entryWidth) / 2;
            context.strokeText(scoreEntry, entryX, boardHeight/2 + 130 + (i * 20));
            context.fillText(scoreEntry, entryX, boardHeight/2 + 130 + (i * 20));
        }
    }
}

function placePipes() {
    if (gameOver) {
        return;
    }

    //(0-1) * pipeHeight/2.
    // 0 -> -128 (pipeHeight/4)
    // 1 -> -128 - 256 (pipeHeight/4 - pipeHeight/2) = -3/4 pipeHeight
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
    // Handle name input when game is over
    if (gameOver && showNameInput) {
        if (e.type === "keydown") {
            if (e.code === "Enter") {
                if (playerName.trim() !== "") {
                    addHighScore(playerName.trim(), score);
                    showNameInput = false;
                    playerName = "";
                }
            } else if (e.code === "Backspace") {
                playerName = playerName.slice(0, -1);
            } else if (e.key.length === 1 && playerName.length < 12) {
                playerName += e.key;
            }
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
        if (gameOver) {
            if (!showNameInput && score > 0) {
                showNameInput = true;
                return;
            }
            bird.y = birdY;
            pipeArray = [];
            score = 0;
            gameOver = false;
            showNameInput = false;
            playerName = "";
            //restart music
            bgMusic.currentTime = 0;
            bgMusic.play().catch(e => console.log("Audio play failed:", e));
        }
    }
    
    // Prevent default behavior for touch events to avoid scrolling
    if (e.type == "touchstart") {
        e.preventDefault();
    }
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&   //a's top left corner doesn't reach b's top right corner
           a.x + a.width > b.x &&   //a's top right corner passes b's top left corner
           a.y < b.y + b.height &&  //a's top left corner doesn't reach b's bottom left corner
           a.y + a.height > b.y;    //a's bottom left corner passes b's top left corner
}