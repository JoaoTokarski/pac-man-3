// Configurações do jogo
const config = {
    tileSize: 20,
    tileCount: 20,
    pacmanSpeed: 5,
    ghostSpeed: 2.5,
    fps: 60
};

// Elementos do DOM
const elements = {
    canvas: document.getElementById('gameCanvas'),
    ctx: document.getElementById('gameCanvas').getContext('2d'),
    scoreDisplay: document.getElementById('score'),
    highScoreDisplay: document.getElementById('high-score'),
    startBtn: document.getElementById('startBtn')
};

// Estado do jogo
const state = {
    score: 0,
    highScore: localStorage.getItem('pacmanHighScore') || 0,
    running: false,
    gameOver: false,
    lastTime: 0,
    frameId: null
};

// Entidades do jogo
const entities = {
    pacman: {
        x: 10,
        y: 15,
        dx: 0,
        dy: 0,
        nextDX: 0,
        nextDY: 0,
        radius: config.tileSize / 2 - 2,
        mouthAngle: 0,
        mouthOpen: true
    },
    ghosts: [
        { x: 9, y: 9, dx: 1, dy: 0, color: 'var(--ghost-red)', speed: config.ghostSpeed },
        { x: 10, y: 9, dx: -1, dy: 0, color: 'var(--ghost-cyan)', speed: config.ghostSpeed * 0.9 }
    ],
    dots: [],
    walls: [],
    powerPellets: [
        { x: 1, y: 1 },
        { x: 18, y: 1 },
        { x: 1, y: 18 },
        { x: 18, y: 18 }
    ]
};

// Labirinto
const maze = [
    "####################",
    "#...#..........#...#",
    "#.###..###..###..###",
    "#..................#",
    "#.###..###..###..###",
    "#...#..........#...#",
    "####################"
];

// Inicializa o canvas
function initCanvas() {
    elements.canvas.width = config.tileSize * config.tileCount;
    elements.canvas.height = config.tileSize * config.tileCount;
}

// Inicializa o jogo
function initGame() {
    initCanvas();
    generateMaze();
    resetEntities();
    state.score = 0;
    state.gameOver = false;
    updateScoreDisplay();
}

// Gera o labirinto
function generateMaze() {
    entities.walls = [];
    entities.dots = [];
    
    for (let y = 0; y < config.tileCount; y++) {
        for (let x = 0; x < config.tileCount; x++) {
            if (maze[y] && maze[y][x] === '#') {
                entities.walls.push({ x, y });
            } else if (x > 0 && x < config.tileCount - 1 && y > 0 && y < config.tileCount - 1) {
                if (!entities.powerPellets.some(p => p.x === x && p.y === y)) {
                    entities.dots.push({ x, y });
                }
            }
        }
    }
}

// Reseta as entidades
function resetEntities() {
    entities.pacman = {
        x: 10,
        y: 15,
        dx: 0,
        dy: 0,
        nextDX: 0,
        nextDY: 0,
        radius: config.tileSize / 2 - 2,
        mouthAngle: 0,
        mouthOpen: true
    };
    
    entities.ghosts = [
        { x: 9, y: 9, dx: 1, dy: 0, color: 'var(--ghost-red)', speed: config.ghostSpeed },
        { x: 10, y: 9, dx: -1, dy: 0, color: 'var(--ghost-cyan)', speed: config.ghostSpeed * 0.9 }
    ];
}

// Atualiza a pontuação
function updateScoreDisplay() {
    elements.scoreDisplay.textContent = state.score;
    elements.highScoreDisplay.textContent = state.highScore;
}

// Loop principal do jogo
function gameLoop(currentTime) {
    if (!state.lastTime) state.lastTime = currentTime;
    const deltaTime = currentTime - state.lastTime;
    
    if (deltaTime > 1000 / config.fps) {
        if (!state.gameOver) {
            updateGame();
        }
        renderGame();
        state.lastTime = currentTime - (deltaTime % (1000 / config.fps));
    }
    
    state.frameId = requestAnimationFrame(gameLoop);
}

// Atualiza o estado do jogo
function updateGame() {
    movePacman();
    moveGhosts();
    checkCollisions();
}

// Renderiza o jogo
function renderGame() {
    elements.ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    drawWalls();
    drawDots();
    drawPowerPellets();
    drawGhosts();
    drawPacman();
    
    if (state.gameOver) {
        drawGameOver();
    }
}

// [Restante das funções de desenho e movimentação...]

// Controles
function setupControls() {
    document.addEventListener('keydown', (e) => {
        if (state.gameOver) return;
        
        switch (e.key) {
            case 'ArrowUp': entities.pacman.nextDY = -1; entities.pacman.nextDX = 0; break;
            case 'ArrowDown': entities.pacman.nextDY = 1; entities.pacman.nextDX = 0; break;
            case 'ArrowLeft': entities.pacman.nextDX = -1; entities.pacman.nextDY = 0; break;
            case 'ArrowRight': entities.pacman.nextDX = 1; entities.pacman.nextDY = 0; break;
        }
    });
}

// Inicialização
function init() {
    initGame();
    setupControls();
    
    elements.startBtn.addEventListener('click', () => {
        if (state.running) {
            cancelAnimationFrame(state.frameId);
        }
        initGame();
        state.running = true;
        state.gameOver = false;
        gameLoop(0);
    });
}

// Inicia o jogo
init();