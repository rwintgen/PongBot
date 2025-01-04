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
let ballSpeed = 2;

let ball = {
	width: ballWidth,
	height: ballHeight,
	speed: ballSpeed, 
	velocityX: -ballSpeed, // set up first ball behavior
	velocityY: 0, // set up first ball behavior
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

	// Set interval to update opponent's position every 30ms
	setInterval(updateOpponentPosition, 30);
}

function drawPredictedTrajectory() {
	let predictedX = ball.x + ball.width / 2;
	let predictedY = ball.y + ball.height / 2;
	let velocityX = ball.velocityX;
	let velocityY = ball.velocityY;
	const predictionTime = 500000;
	const predictionInterval = 1000;
	const steps = predictionTime / predictionInterval;

	context.strokeStyle = "#ff0000";
	context.lineWidth = 1;
	context.beginPath();
	context.moveTo(predictedX, predictedY);

	for (let i = 0; i < steps; i++) {
		predictedX += velocityX * (predictionInterval / 1000);
		predictedY += velocityY * (predictionInterval / 1000);

		// top and bottom walls
		if (predictedY <= 0 || predictedY + ball.height >= boardHeight) {
			velocityY *= -1;
		}
		// assumed left wall
		if (predictedX <= 25) {
			velocityX *= -1;
		}

		context.lineTo(predictedX, predictedY);

		if (predictedX >= 475) {
			break;
		}
	}

	context.stroke();

	// predicted ball position when hitting opponent's paddle 
	context.fillStyle = "#ff0000";
	context.beginPath();
	context.arc(predictedX, predictedY, ball.width / 2, 0, 2 * Math.PI);
	context.fill();
}

function refreshFrame() {
	requestAnimationFrame(refreshFrame);
	context.clearRect(0, 0, boardWidth, boardHeight);

	context.fillStyle = "#ffffff";
	context.fillRect(player.x, player.y, player.width, player.height);

	context.fillStyle = "#00ff00";
	context.fillRect(opponent.x, opponent.y, opponent.width, opponent.height);

    context.fillStyle = "#00ff00";
    context.beginPath();
    context.arc(ball.x + ball.width / 2, ball.y + ball.height / 2, ball.width / 2, 0, 2 * Math.PI);
    context.fill();

	context.fillStyle = "#ffffff";
	context.font = "20px Arial";
	context.fillText("Player: " + playerScore, 20, 20);
	context.fillText("Opponent: " + opponentScore, boardWidth - 140, 20);

	drawPredictedTrajectory();
	moveBall();
}

function moveBall() {
	ball.x += ball.velocityX;
	ball.y += ball.velocityY;

	if (ball.y <= 0 || ball.y + ball.height >= boardHeight)
		ball.velocityY *= -1;

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

	// check for point
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
	if (e.key == "w" && !isNextOutOfBounds(player, "-"))
		player.y -= player.speed;
	else if (e.key == "s" && !isNextOutOfBounds(player, "+"))
		player.y += player.speed;
	// else if (e.key == "ArrowUp" && !isNextOutOfBounds(opponent, "-"))
	// 	opponent.y -= opponent.speed;
	// else if (e.key == "ArrowDown" && !isNextOutOfBounds(opponent, "+"))
	// 	opponent.y += opponent.speed;
}

function isNextOutOfBounds(paddle, sign) {
	if ((sign == '-' && paddle.y - paddle.speed < 0) ||
		(sign == '+' && paddle.y + paddle.height + paddle.speed > boardHeight))
		return (true);
	return (false);
}

// AI opponent

//	get ball projected position when opponent hits ball/every 1 second 
//	estimate ball position
//	if ball is planned to land far
//		hold key to move to position
//	else if ball is planned to land close
//		repeatedly press key (8x/s)

const KEY_HOLD_DELAY = 30;
const KEY_HOLD_INITIAL_DELAY = 500;
let lastKeyPress = 0;
let lastDirection = 0; // down = 1, up = -1, idle = 0
let directionChangeTime = 0;

function updateOpponentPosition() {
	const currentTime = Date.now();

	const diff = ball.y - (opponent.y + opponent.height / 2);
	let newDirection = diff > 0 ? 1 : diff < 0 ? -1 : 0;

	// check if direction changed
	if (newDirection !== lastDirection) {
		directionChangeTime = currentTime;
		lastDirection = newDirection;

		if (newDirection > 0 && !isNextOutOfBounds(opponent, "+"))
			opponent.y += paddleSpeed;
		else if (newDirection < 0 && !isNextOutOfBounds(opponent, "-"))
			opponent.y -= paddleSpeed;
	}

	// Only move if enough time has passed since last key press and direction change
	if (currentTime - lastKeyPress >= KEY_HOLD_DELAY && currentTime - directionChangeTime >= KEY_HOLD_INITIAL_DELAY) {
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