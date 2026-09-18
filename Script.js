const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const message = document.getElementById("message");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake;
let food;
let direction;
let nextDirection;
let score = 0;
let highScore = Number(localStorage.getItem("snakeHighScore")) || 0;
let gameLoop = null;
let gameRunning = false;
let gamePaused = false;
let speed = 110;

highScoreElement.textContent = highScore;

function resetGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];

    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };

    score = 0;
    speed = 110;

    scoreElement.textContent = score;
    createFood();
    draw();
}

function createFood() {
    let validPosition = false;

    while (!validPosition) {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };

        validPosition = !snake.some(
            segment => segment.x === food.x && segment.y === food.y
        );
    }
}

function draw() {
    drawBoard();
    drawFood();
    drawSnake();
}

function drawBoard() {
    ctx.fillStyle = "#08110b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= tileCount; i++) {
        const position = i * gridSize;

        ctx.beginPath();
        ctx.moveTo(position, 0);
        ctx.lineTo(position, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, position);
        ctx.lineTo(canvas.width, position);
        ctx.stroke();
    }
}

function drawSnake() {
    snake.forEach((segment, index) => {
        const padding = 2;

        ctx.fillStyle = index === 0 ? "#8bc34a" : "#4caf50";

        ctx.beginPath();
        ctx.roundRect(
            segment.x * gridSize + padding,
            segment.y * gridSize + padding,
            gridSize - padding * 2,
            gridSize - padding * 2,
            5
        );
        ctx.fill();

        if (index === 0) {
            drawEyes(segment);
        }
    });
}

function drawEyes(head) {
    ctx.fillStyle = "#102015";

    let eye1;
    let eye2;

    if (direction.x === 1) {
        eye1 = { x: 15, y: 6 };
        eye2 = { x: 15, y: 14 };
    } else if (direction.x === -1) {
        eye1 = { x: 5, y: 6 };
        eye2 = { x: 5, y: 14 };
    } else if (direction.y === -1) {
        eye1 = { x: 6, y: 5 };
        eye2 = { x: 14, y: 5 };
    } else {
        eye1 = { x: 6, y: 15 };
        eye2 = { x: 14, y: 15 };
    }

    ctx.beginPath();
    ctx.arc(
        head.x * gridSize + eye1.x,
        head.y * gridSize + eye1.y,
        2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
        head.x * gridSize + eye2.x,
        head.y * gridSize + eye2.y,
        2,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

function drawFood() {
    const centerX = food.x * gridSize + gridSize / 2;
    const centerY = food.y * gridSize + gridSize / 2;

    ctx.fillStyle = "#ff5252";

    ctx.beginPath();
    ctx.arc(centerX, centerY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#7cb342";
    ctx.fillRect(centerX + 2, centerY - 9, 5, 3);
}

function update() {
    if (!gameRunning || gamePaused) {
        return;
    }

    direction = nextDirection;

    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    if (checkCollision(head)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.textContent = score;

        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem("snakeHighScore", highScore);
        }

        // Gradually increase difficulty.
        if (speed > 55) {
            speed -= 3;
            restartLoop();
        }

        createFood();
    } else {
        snake.pop();
    }

    draw();
}

function checkCollision(head) {
    // Wall collision.
    if (
        head.x < 0 ||
        head.x >= tileCount ||
        head.y < 0 ||
        head.y >= tileCount
    ) {
        return true;
    }

    // Self collision.
    return snake.some(segment => {
        return segment.x === head.x && segment.y === head.y;
    });
}

function startGame() {
    clearInterval(gameLoop);

    resetGame();

    gameRunning = true;
    gamePaused = false;

    startBtn.textContent = "Restart";
    pauseBtn.textContent = "Pause";

    message.innerHTML = "<h2>Good luck! 🐍</h2><p>Eat the food and grow!</p>";

    gameLoop = setInterval(update, speed);
}

function restartLoop() {
    clearInterval(gameLoop);

    if (gameRunning && !gamePaused) {
        gameLoop = setInterval(update, speed);
    }
}

function togglePause() {
    if (!gameRunning) {
        return;
    }

    gamePaused = !gamePaused;

    if (gamePaused) {
        pauseBtn.textContent = "Resume";
        message.innerHTML = "<h2>Paused</h2><p>Press Resume to continue</p>";
    } else {
        pauseBtn.textContent = "Pause";
        message.innerHTML = "<h2>Keep going! 🐍</h2><p>Don't hit the walls!</p>";
    }

    draw();
}

function gameOver() {
    gameRunning = false;
    gamePaused = false;

    clearInterval(gameLoop);

    message.innerHTML = `
        <h2>Game Over 💥</h2>
        <p>Your score: ${score}</p>
    `;

    startBtn.textContent = "Play Again";
    pauseBtn.textContent = "Pause";

    draw();
}

function changeDirection(newDirection) {
    if (!gameRunning || gamePaused) {
        return;
    }

    // Prevent reversing directly into yourself.
    if (
        newDirection.x === -direction.x &&
        newDirection.y === -direction.y
    ) {
        return;
    }

    nextDirection = newDirection;
}

document.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();

    const directions = {
        arrowup: { x: 0, y: -1 },
        w: { x: 0, y: -1 },

        arrowdown: { x: 0, y: 1 },
        s: { x: 0, y: 1 },

        arrowleft: { x: -1, y: 0 },
        a: { x: -1, y: 0 },

        arrowright: { x: 1, y: 0 },
        d: { x: 1, y: 0 }
    };

    if (directions[key]) {
        event.preventDefault();
        changeDirection(directions[key]);
    }

    if (key === " " || key === "p") {
        event.preventDefault();
        togglePause();
    }

    if (key === "enter" && !gameRunning) {
        startGame();
    }
});

document.querySelectorAll(".mobile-controls button").forEach(button => {
    button.addEventListener("click", () => {
        const directionName = button.dataset.direction;

        const directions = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };

        changeDirection(directions[directionName]);
    });
});

startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);

// Initial screen.
resetGame();
message.innerHTML = "<h2>Snake</h2><p>Press Start to play</p>";
