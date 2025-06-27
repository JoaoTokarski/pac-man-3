const board = document.getElementById('gameBoard');
const width = 30;
const height = 30;
const totalCells = width * height;
const cells = [];

const layout = Array.from({ length: totalCells }, (_, i) => {
  const row = Math.floor(i / width);
  const col = i % width;
  if (
    row === 0 || row === height - 1 ||
    col === 0 || col === width - 1 ||
    Math.random() < 0.08
  ) return 1; // parede
  return 0; // espaço
});

function createBoard() {
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    if (layout[i] === 1) {
      cell.classList.add('wall');
    } else {
      cell.classList.add('dot');
    }
    board.appendChild(cell);
    cells.push(cell);
  }
}
createBoard();

// Pac-Man
let pacmanIndex = width + 1;
cells[pacmanIndex].classList.remove('dot');
cells[pacmanIndex].classList.add('pacman');

// Movimento do Pac-Man
document.addEventListener('keydown', e => {
  let nextIndex = pacmanIndex;
  switch (e.key) {
    case 'ArrowUp': nextIndex -= width; break;
    case 'ArrowDown': nextIndex += width; break;
    case 'ArrowLeft': nextIndex -= 1; break;
    case 'ArrowRight': nextIndex += 1; break;
    default: return;
  }

  if (
    nextIndex >= 0 &&
    nextIndex < totalCells &&
    !cells[nextIndex].classList.contains('wall')
  ) {
    cells[pacmanIndex].classList.remove('pacman');
    pacmanIndex = nextIndex;

    if (cells[pacmanIndex].classList.contains('dot')) {
      cells[pacmanIndex].classList.remove('dot');
    }

    cells[pacmanIndex].classList.add('pacman');
  }
});

// Fantasmas
const ghostCount = 5;
const ghosts = [];

for (let i = 0; i < ghostCount; i++) {
  let ghostIndex;
  do {
    ghostIndex = Math.floor(Math.random() * totalCells);
  } while (
    layout[ghostIndex] === 1 ||
    ghostIndex === pacmanIndex ||
    ghosts.includes(ghostIndex)
  );
  ghosts.push(ghostIndex);
  cells[ghostIndex].classList.add('ghost');
}

// Movimento dos Fantasmas
function moveGhosts() {
  for (let i = 0; i < ghosts.length; i++) {
    let currentIndex = ghosts[i];
    let bestMove = currentIndex;
    let minDistance = Infinity;
    const directions = [-1, 1, -width, width];

    for (let dir of directions) {
      const next = currentIndex + dir;
      if (
        next >= 0 &&
        next < totalCells &&
        !cells[next].classList.contains('wall') &&
        !cells[next].classList.contains('ghost')
      ) {
        const dx = next % width - pacmanIndex % width;
        const dy = Math.floor(next / width) - Math.floor(pacmanIndex / width);
        const distance = Math.abs(dx) + Math.abs(dy);
        if (distance < minDistance) {
          bestMove = next;
          minDistance = distance;
        }
      }
    }

    cells[currentIndex].classList.remove('ghost');
    ghosts[i] = bestMove;
    cells[bestMove].classList.add('ghost');

    if (bestMove === pacmanIndex) {
      alert("💀 Game Over! Um fantasma pegou você!");
      location.reload();
    }
  }
}

setInterval(moveGhosts, 500);
