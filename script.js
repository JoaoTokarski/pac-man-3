const width = 28;
const board = document.getElementById("board");
const scoreDisplay = document.getElementById("score");
let score = 0;

// Layout: 0 = pac-dot, 1 = wall, 2 = ghost-lair, 3 = empty
const layout = [
  // 28x28 grid (784 elements total), preencha com seu layout personalizado
  // Aqui está um exemplo reduzido (substitua por seu layout completo com mais espaço)
];

const squares = [];

function createBoard() {
  for (let i = 0; i < layout.length; i++) {
    const square = document.createElement("div");
    square.classList.add("square");
    board.appendChild(square);
    squares.push(square);

    if (layout[i] === 0) square.classList.add("pac-dot");
    else if (layout[i] === 1) square.classList.add("wall");
  }
}

// Pac-Man
let pacmanCurrentIndex = 490;
squares[pacmanCurrentIndex].classList.add("pacman");

function movePacman(e) {
  squares[pacmanCurrentIndex].classList.remove("pacman");

  switch (e.key) {
    case "ArrowLeft":
      if (
        pacmanCurrentIndex % width !== 0 &&
        !squares[pacmanCurrentIndex - 1].classList.contains("wall")
      )
        pacmanCurrentIndex -= 1;
      break;
    case "ArrowUp":
      if (
        pacmanCurrentIndex - width >= 0 &&
        !squares[pacmanCurrentIndex - width].classList.contains("wall")
      )
        pacmanCurrentIndex -= width;
      break;
    case "ArrowRight":
      if (
        pacmanCurrentIndex % width < width - 1 &&
        !squares[pacmanCurrentIndex + 1].classList.contains("wall")
      )
        pacmanCurrentIndex += 1;
      break;
    case "ArrowDown":
      if (
        pacmanCurrentIndex + width < width * width &&
        !squares[pacmanCurrentIndex + width].classList.contains("wall")
      )
        pacmanCurrentIndex += width;
      break;
  }

  eatDot();
  squares[pacmanCurrentIndex].classList.add("pacman");
}

document.addEventListener("keydown", movePacman);

function eatDot() {
  if (squares[pacmanCurrentIndex].classList.contains("pac-dot")) {
    score++;
    scoreDisplay.textContent = `Pontos: ${score}`;
    squares[pacmanCurrentIndex].classList.remove("pac-dot");
  }
}

// Ghost logic
class Ghost {
  constructor(className, startIndex, speed) {
    this.className = className;
    this.startIndex = startIndex;
    this.speed = speed;
    this.currentIndex = startIndex;
    this.timerId = null;
  }

  move() {
    const directions = [-1, +1, -width, +width];
    this.timerId = setInterval(() => {
      const pacPos = pacmanCurrentIndex;

      // Buscar direção mais próxima do Pac-Man
      let bestMove = this.currentIndex;
      let minDistance = Infinity;

      for (let dir of directions) {
        const nextIndex = this.currentIndex + dir;
        if (
          !squares[nextIndex].classList.contains("wall") &&
          nextIndex >= 0 &&
          nextIndex < squares.length
        ) {
          const dx = (nextIndex % width) - (pacPos % width);
          const dy = Math.floor(nextIndex / width) - Math.floor(pacPos / width);
          const distance = dx * dx + dy * dy;
          if (distance < minDistance) {
            minDistance = distance;
            bestMove = nextIndex;
          }
        }
      }

      squares[this.currentIndex].classList.remove(this.className, "ghost");
      this.currentIndex = bestMove;
      squares[this.currentIndex].classList.add(this.className, "ghost");

      // Colisão com Pac-Man
      if (this.currentIndex === pacmanCurrentIndex) {
        alert("Game Over");
        clearInterval(this.timerId);
        document.removeEventListener("keydown", movePacman);
      }
    }, this.speed);
  }
}

const ghosts = [
  new Ghost("ghost1", 348, 300),
  new Ghost("ghost2", 376, 350),
  new Ghost("ghost3", 351, 400),
  new Ghost("ghost4", 379, 450),
  new Ghost("ghost5", 380, 500),
];

function startGame() {
  createBoard();
  ghosts.forEach((ghost) => {
    squares[ghost.startIndex].classList.add(ghost.className, "ghost");
    ghost.move();
  });
}

startGame();
