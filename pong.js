let board;
let boardWidth = 500;
let boardHeight = 500;
let context;

let paddleWidth = 10;
let paddleHeight = 50;
let paddleSpeed = 5;

let player = {
	width: paddleWidth,
	height: paddleHeight,
	speed: paddleSpeed,
	x: 10,
	y: boardHeight / 2 - paddleHeight / 2
}

let opponent = {
	width: paddleWidth,
	height: paddleHeight,
	speed: paddleSpeed,
	x: boardWidth - paddleWidth - 10,
	y: boardHeight / 2 - paddleHeight / 2
}

let ballWidth = 10;
let ballHeight = 10;
let ballSpeed = 3;

let ball = {
	width: ballWidth,
	height: ballHeight,
	speed: ballSpeed, 
	velocityX: -ballSpeed, // set up first ball behavior
	velocityY: 0,
	x: boardWidth / 2 - ballWidth / 2,
	y: boardHeight / 2 - ballHeight / 2
}

let playerScore = 0;
let opponentScore = 0;

window.onload = function() {
	board = document.getElementById("board");
	board.height = boardHeight;
	board.width = boardWidth;
	context = board.getContext("2d");

	requestAnimationFrame(refreshFrame);
	document.addEventListener("keydown", movePlayer);
}

function refreshFrame() {
	requestAnimationFrame(refreshFrame);
	context.clearRect(0, 0, boardWidth, boardHeight);
	
	context.fillStyle = "#ffffff";
	context.fillRect(player.x, player.y, player.width, player.height);
	
	context.fillStyle = "#00ff00";
	context.fillRect(opponent.x, opponent.y, opponent.width, opponent.height);
	
	context.fillStyle = "#ff0000";
	context.fillRect(ball.x, ball.y, ball.width, ball.height);
	
	context.fillStyle = "#ffffff";
    context.font = "20px Arial";
    context.fillText("Player: " + playerScore, 20, 20);
    context.fillText("Opponent: " + opponentScore, boardWidth - 140, 20);
	
	moveBall();
	updateOpponentPosition();
}

function moveBall() {
	ball.x += ball.velocityX;
	ball.y += ball.velocityY;

	if (ball.y <= 0 || ball.y + ball.height >= boardHeight) {
		ball.velocityY *= -1;
	}

	// player
	if (ball.x <= player.x + player.width && ball.y + ball.height >= player.y && ball.y <= player.y + player.height) {
		let intersectY = ball.y + ball.height / 2 - player.y - player.height / 2;
		let normalizedIntersectY = intersectY / (player.height / 2);
		let bounceAngle = normalizedIntersectY * Math.PI / 4;

		ball.speed += 0.1;
		ball.velocityX = ball.speed * Math.cos(bounceAngle);
		ball.velocityY = ball.speed * Math.sin(bounceAngle);

	}

	// opponent
	if (ball.x + ball.width >= opponent.x && ball.y + ball.height >= opponent.y && ball.y <= opponent.y + opponent.height) {
		let intersectY = ball.y + ball.height / 2 - opponent.y - opponent.height / 2;
		let normalizedIntersectY = intersectY / (opponent.height / 2);
		let bounceAngle = normalizedIntersectY * Math.PI / 4;

		ball.speed += 0.1;
		ball.velocityX = -ball.speed * Math.cos(bounceAngle);
		ball.velocityY = ball.speed * Math.sin(bounceAngle);
	
	}

	// check for lost point
	if (ball.x <= 0) {
		opponentScore++;
		resetGame(false);
	}
	if (ball.x + ball.width >= boardWidth) {
		playerScore++;
		resetGame(true);
	}
}

function resetGame(playerLost) {
	ball.x = boardWidth / 2 - ball.width / 2;
	ball.y = boardHeight / 2 - ball.height / 2;
	ball.speed = ballSpeed;

	if (playerLost)
        ball.velocityX = ballSpeed;
    else
        ball.velocityX = -ballSpeed;
    ball.velocityY = 0;

	player.y = boardHeight / 2 - player.height / 2;
	opponent.y = boardHeight / 2 - opponent.height / 2;

}

function movePlayer(e) {
	if (e.key == "ArrowUp" && !isNextOutOfBounds("-"))
		player.y -= player.speed;
	else if (e.key == "ArrowDown" && !isNextOutOfBounds("+"))
		player.y += player.speed;
}

function isNextOutOfBounds(sign) {
	if ((sign == '-' && player.y - player.speed < 0) ||
		(sign == '+' && player.y + player.height + player.speed > boardHeight))
		return true;
	return false;
}





// AI opponent

const KEY_REPEAT_INTERVAL = 30; // Minimum interval between moves in milliseconds
const DIRECTION_CHANGE_DELAY = 500; // Idle time when changing direction in milliseconds
let lastKeyPress = 0;
let lastDirection = 0; // 1 for down, -1 for up, 0 for no movement
let directionChangeTime = 0;

function updateOpponentPosition() {
    const currentTime = Date.now();

    const diff = ball.y - (opponent.y + opponent.height / 2);
    let newDirection = diff > 0 ? 1 : diff < 0 ? -1 : 0;

    // Check if the direction has changed
    if (newDirection !== lastDirection) {
        directionChangeTime = currentTime;
        lastDirection = newDirection;
    }

    // Only move if enough time has passed since last key press and direction change
    if (currentTime - lastKeyPress >= KEY_REPEAT_INTERVAL && currentTime - directionChangeTime >= DIRECTION_CHANGE_DELAY) {
        if (diff > paddleSpeed) {
            opponent.y += paddleSpeed;
        } else if (diff < -paddleSpeed) {
            opponent.y -= paddleSpeed;
        }
        lastKeyPress = currentTime;
    }

    // Ensure the opponent's paddle stays within boundaries
    opponent.y = Math.max(0, Math.min(opponent.y, boardHeight - opponent.height));
}

// Set interval to update opponent's position every 30ms
setInterval(updateOpponentPosition, KEY_REPEAT_INTERVAL);