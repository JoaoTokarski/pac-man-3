const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const tileSize = 20;
const rows = 28;
const cols = 28;

const pacman = {
  x: 14,
  y: 23,
  dx: 0,
  dy: 0,
  nextDx: 0,
  nextDy: 0,
};

let score = 0;

const ghosts = [
  { x: 13, y: 11, dx: 0, dy: 1, color: "red" },
  { x: 14, y: 11, dx: 0, dy: 1, color: "pink" },
  { x: 15, y: 11, dx: 0, dy: 1, color: "cyan" },
  { x: 12, y: 11, dx: 0, dy: 1, color: "orange" },
  { x: 16, y: 11, dx: 0, dy: 1, color: "white" },
];

const map = [
  // 28x28 grid: 0 = empty, 1 = wall, 2 = dot
  // Basic map for demo. You can extend with more complexity.
];

function initMap() {
  for (let y = 0; y < rows; y++) {
    map[y] = [];
    for (let x = 0; x < cols; x++) {
      if (
        y === 0 || y === rows - 1 || 
        x === 0 || x === cols - 1 || 
        (x % 4 === 0 && y % 4 === 0)
      ) {
        map[y][x] = 1; // wall
      } else {
        map[y][x] = 2; // dot
      }
    }
    map[pacman.y][pacman.x] = 0;
  }
}
initMap();

function drawMap() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (map[y][x] === 1) {
        ctx.fillStyle = "blue";
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      } else if (map[y][x] === 2) {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(
          x * tileSize + tileSize / 2,
          y * tileSize + tileSize / 2,
          3,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
  }
}

function drawPacman() {
  ctx.fillStyle = "yellow";
  ctx.beginPath();
  ctx.arc(
    pacman.x * tileSize + tileSize / 2,
    pacman.y * tileSize + tileSize / 2,
    tileSize / 2 - 2,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function drawGhosts() {
  for (let ghost of ghosts) {
    ctx.fillStyle = ghost.color;
    ctx.beginPath();
    ctx.arc(
      ghost.x * tileSize + tileSize / 2,
      ghost.y * tileSize + tileSize / 2,
      tileSize / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

function movePacman() {
  if (canMove(pacman.x + pacman.nextDx, pacman.y + pacman.nextDy)) {
    pacman.dx = pacman.nextDx;
    pacman.dy = pacman.nextDy;
  }

  const newX = pacman.x + pacman.dx;
  const newY = pacman.y + pacman.dy;

  if (canMove(newX, newY)) {
    pacman.x = newX;
    pacman.y = newY;

    if (map[pacman.y][pacman.x] === 2) {
      map[pacman.y][pacman.x] = 0;
      score += 10;
    }
  }
}

function moveGhosts() {
  for (let ghost of ghosts) {
    const directions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    const valid = directions.filter(d =>
      canMove(ghost.x + d.dx, ghost.y + d.dy)
    );

    if (valid.length > 0) {
      const move = valid[Math.floor(Math.random() * valid.length)];
      ghost.dx = move.dx;
      ghost.dy = move.dy;
    }

    ghost.x += ghost.dx;
    ghost.y += ghost.dy;
  }
}

function canMove(x, y) {
  return map[y] && map[y][x] !== 1;
}

function checkCollision() {
  for (let ghost of ghosts) {
    if (ghost.x === pacman.x && ghost.y === pacman.y) {
      alert("Game Over! Score: " + score);
      document.location.reload();
    }
  }
}

function drawScore() {
  ctx.fillStyle = "yellow";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, canvas.height - 10);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMap();
  movePacman();
  moveGhosts();
  drawPacman();
  drawGhosts();
  checkCollision();
  drawScore();
}

setInterval(gameLoop, 150);

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") [pacman.nextDx, pacman.nextDy] = [0, -1];
  else if (e.key === "ArrowDown") [pacman.nextDx, pacman.nextDy] = [0, 1];
  else if (e.key === "ArrowLeft") [pacman.nextDx, pacman.nextDy] = [-1, 0];
  else if (e.key === "ArrowRight") [pacman.nextDx, pacman.nextDy] = [1, 0];
});
