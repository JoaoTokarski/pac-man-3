// Configurações do jogo
const config = {
    tileSize: 20,
    tileCount: 20,
    pacmanSpeed: 3,  // Velocidade reduzida
    ghostSpeed: 1.8, // Velocidade reduzida
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
        { x: 10, y: 9, dx: -1, dy: 0, color: 'var(--ghost-cyan)', speed: config.ghostSpeed * 0.8 }
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
        { x: 10, y: 9, dx: -1, dy: 0, color: 'var(--ghost-cyan)', speed: config.ghostSpeed * 0.8 }
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

// Funções de desenho
function drawWalls() {
    elements.ctx.fillStyle = 'var(--blue)';
    entities.walls.forEach(wall => {
        elements.ctx.fillRect(
            wall.x * config.tileSize, 
            wall.y * config.tileSize, 
            config.tileSize, 
            config.tileSize
        );
    });
}

function drawDots() {
    elements.ctx.fillStyle = 'var(--white)';
    entities.dots.forEach(dot => {
        elements.ctx.beginPath();
        elements.ctx.arc(
            dot.x * config.tileSize + config.tileSize / 2,
            dot.y * config.tileSize + config.tileSize / 2,
            3,
            0,
            Math.PI * 2
        );
        elements.ctx.fill();
    });
}

function drawPowerPellets() {
    elements.ctx.fillStyle = 'var(--yellow)';
    entities.powerPellets.forEach(pellet => {
        elements.ctx.beginPath();
        elements.ctx.arc(
            pellet.x * config.tileSize + config.tileSize / 2,
            pellet.y * config.tileSize + config.tileSize / 2,
            6,
            0,
            Math.PI * 2
        );
        elements.ctx.fill();
    });
}

function drawGhosts() {
    entities.ghosts.forEach(ghost => {
        elements.ctx.fillStyle = ghost.color;
        
        // Corpo do fantasma
        elements.ctx.beginPath();
        elements.ctx.arc(
            ghost.x * config.tileSize + config.tileSize / 2,
            ghost.y * config.tileSize + config.tileSize / 2 - 5,
            config.tileSize / 2 - 2,
            Math.PI,
            0,
            false
        );
        elements.ctx.lineTo(
            ghost.x * config.tileSize + config.tileSize,
            ghost.y * config.tileSize + config.tileSize / 2 + 5
        );
        
        // Ondas na base
        const waveSize = 5;
        for (let i = 0; i < 3; i++) {
            elements.ctx.lineTo(
                ghost.x * config.tileSize + config.tileSize - (i * config.tileSize / 3),
                ghost.y * config.tileSize + config.tileSize / 2 + 5 + (i % 2 === 0 ? waveSize : -waveSize)
            );
        }
        
        elements.ctx.lineTo(
            ghost.x * config.tileSize,
            ghost.y * config.tileSize + config.tileSize / 2 + 5
        );
        elements.ctx.closePath();
        elements.ctx.fill();
        
        // Olhos
        elements.ctx.fillStyle = 'var(--white)';
        elements.ctx.beginPath();
        elements.ctx.arc(
            ghost.x * config.tileSize + config.tileSize / 2 - 5,
            ghost.y * config.tileSize + config.tileSize / 2 - 5,
            4,
            0,
            Math.PI * 2
        );
        elements.ctx.arc(
            ghost.x * config.tileSize + config.tileSize / 2 + 5,
            ghost.y * config.tileSize + config.tileSize / 2 - 5,
            4,
            0,
            Math.PI * 2
        );
        elements.ctx.fill();
        
        // Pupilas
        elements.ctx.fillStyle = 'var(--dark)';
        elements.ctx.beginPath();
        elements.ctx.arc(
            ghost.x * config.tileSize + config.tileSize / 2 - 5 + (ghost.dx * 2),
            ghost.y * config.tileSize + config.tileSize / 2 - 5 + (ghost.dy * 2),
            2,
            0,
            Math.PI * 2
        );
        elements.ctx.arc(
            ghost.x * config.tileSize + config.tileSize / 2 + 5 + (ghost.dx * 2),
            ghost.y * config.tileSize + config.tileSize / 2 - 5 + (ghost.dy * 2),
            2,
            0,
            Math.PI * 2
        );
        elements.ctx.fill();
    });
}

function drawPacman() {
    elements.ctx.fillStyle = 'var(--yellow)';
    elements.ctx.beginPath();
    
    // Animação da boca
    entities.pacman.mouthAngle += entities.pacman.mouthOpen ? 0.1 : -0.1;
    if (entities.pacman.mouthAngle > 0.5 || entities.pacman.mouthAngle < 0) {
        entities.pacman.mouthOpen = !entities.pacman.mouthOpen;
    }

    let startAngle, endAngle;
    if (entities.pacman.dx === 1) {
        startAngle = 0.2 * Math.PI * entities.pacman.mouthAngle;
        endAngle = 2 * Math.PI - 0.2 * Math.PI * entities.pacman.mouthAngle;
    } else if (entities.pacman.dx === -1) {
        startAngle = Math.PI + 0.2 * Math.PI * entities.pacman.mouthAngle;
        endAngle = Math.PI - 0.2 * Math.PI * entities.pacman.mouthAngle;
    } else if (entities.pacman.dy === 1) {
        startAngle = Math.PI/2 + 0.2 * Math.PI * entities.pacman.mouthAngle;
        endAngle = Math.PI/2 - 0.2 * Math.PI * entities.pacman.mouthAngle;
    } else if (entities.pacman.dy === -1) {
        startAngle = 3*Math.PI/2 + 0.2 * Math.PI * entities.pacman.mouthAngle;
        endAngle = 3*Math.PI/2 - 0.2 * Math.PI * entities.pacman.mouthAngle;
    } else {
        startAngle = 0.2 * Math.PI * entities.pacman.mouthAngle;
        endAngle = 2 * Math.PI - 0.2 * Math.PI * entities.pacman.mouthAngle;
    }

    elements.ctx.arc(
        entities.pacman.x * config.tileSize + config.tileSize / 2,
        entities.pacman.y * config.tileSize + config.tileSize / 2,
        entities.pacman.radius,
        startAngle,
        endAngle
    );
    elements.ctx.lineTo(
        entities.pacman.x * config.tileSize + config.tileSize / 2,
        entities.pacman.y * config.tileSize + config.tileSize / 2
    );
    elements.ctx.fill();
}

function drawGameOver() {
    elements.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    elements.ctx.fillRect(0, 0, elements.canvas.width, elements.canvas.height);
    elements.ctx.fillStyle = 'var(--red)';
    elements.ctx.font = '24px "Press Start 2P"';
    elements.ctx.textAlign = 'center';
    elements.ctx.textBaseline = 'middle';
    elements.ctx.fillText('GAME OVER', elements.canvas.width / 2, elements.canvas.height / 2 - 20);
    
    elements.ctx.fillStyle = 'var(--white)';
    elements.ctx.font = '16px "Press Start 2P"';
    elements.ctx.fillText(`SCORE: ${state.score}`, elements.canvas.width / 2, elements.canvas.height / 2 + 20);
    elements.ctx.fillText(`HIGH SCORE: ${state.highScore}`, elements.canvas.width / 2, elements.canvas.height / 2 + 50);
}

// Movimentação do Pac-Man
function movePacman() {
    // Verifica próxima direção
    const nextX = Math.round(entities.pacman.x + entities.pacman.nextDX);
    const nextY = Math.round(entities.pacman.y + entities.pacman.nextDY);
    
    if (!isWall(nextX, nextY)) {
        entities.pacman.dx = entities.pacman.nextDX;
        entities.pacman.dy = entities.pacman.nextDY;
    }

    // Movimento suave
    const newX = entities.pacman.x + entities.pacman.dx * (config.pacmanSpeed / 10);
    const newY = entities.pacman.y + entities.pacman.dy * (config.pacmanSpeed / 10);

    if (!isWall(Math.round(newX), Math.round(newY))) {
        entities.pacman.x = newX;
        entities.pacman.y = newY;
    }
    
    // Túnel
    if (entities.pacman.x < 0) entities.pacman.x = config.tileCount - 1;
    if (entities.pacman.x >= config.tileCount) entities.pacman.x = 0;
    if (entities.pacman.y < 0) entities.pacman.y = config.tileCount - 1;
    if (entities.pacman.y >= config.tileCount) entities.pacman.y = 0;
}

// Movimentação dos fantasmas
function moveGhosts() {
    entities.ghosts.forEach(ghost => {
        // IA simples
        const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];
        
        // Muda de direção ocasionalmente
        if (Math.random() < 0.02 || isWall(
            Math.round(ghost.x + ghost.dx), 
            Math.round(ghost.y + ghost.dy)
        )) {
            const validDirs = directions.filter(dir => 
                !isWall(
                    Math.round(ghost.x + dir.dx), 
                    Math.round(ghost.y + dir.dy)
                ) && 
                !(dir.dx === -ghost.dx && dir.dy === -ghost.dy)
            );
            
            if (validDirs.length > 0) {
                const newDir = validDirs[Math.floor(Math.random() * validDirs.length)];
                ghost.dx = newDir.dx;
                ghost.dy = newDir.dy;
            }
        }

        // Movimento suave
        ghost.x += ghost.dx * (ghost.speed / 10);
        ghost.y += ghost.dy * (ghost.speed / 10);
        
        // Túnel
        if (ghost.x < 0) ghost.x = config.tileCount - 1;
        if (ghost.x >= config.tileCount) ghost.x = 0;
        if (ghost.y < 0) ghost.y = config.tileCount - 1;
        if (ghost.y >= config.tileCount) ghost.y = 0;
    });
}

// Verifica colisões
function checkCollisions() {
    const pacX = Math.round(entities.pacman.x);
    const pacY = Math.round(entities.pacman.y);

    // Pontos
    entities.dots = entities.dots.filter(dot => {
        if (pacX === dot.x && pacY === dot.y) {
            state.score += 10;
            if (state.score > state.highScore) {
                state.highScore = state.score;
                localStorage.setItem('pacmanHighScore', state.highScore);
            }
            updateScoreDisplay();
            return false;
        }
        return true;
    });

    // Power pellets
    entities.powerPellets.forEach((pellet, index) => {
        if (pacX === pellet.x && pacY === pellet.y) {
            state.score += 50;
            entities.powerPellets.splice(index, 1);
            updateScoreDisplay();
        }
    });

    // Fantasmas
    entities.ghosts.forEach(ghost => {
        if (pacX === Math.round(ghost.x) && pacY === Math.round(ghost.y)) {
            state.gameOver = true;
            elements.startBtn.textContent = 'RESTART';
        }
    });

    // Vitória
    if (entities.dots.length === 0 && entities.powerPellets.length === 0) {
        initGame();
    }
}

// Verifica se é parede
function isWall(x, y) {
    return entities.walls.some(wall => wall.x === x && wall.y === y);
}

// Configura controles
function setupControls() {
    document.addEventListener('keydown', (e) => {
        if (state.gameOver) return;
        
        switch (e.key) {
            case 'ArrowUp': 
                entities.pacman.nextDX = 0; 
                entities.pacman.nextDY = -1; 
                break;
            case 'ArrowDown': 
                entities.pacman.nextDX = 0; 
                entities.pacman.nextDY = 1; 
                break;
            case 'ArrowLeft': 
                entities.pacman.nextDX = -1; 
                entities.pacman.nextDY = 0; 
                break;
            case 'ArrowRight': 
                entities.pacman.nextDX = 1; 
                entities.pacman.nextDY = 0; 
                break;
        }
    });
}

// Inicialização do jogo
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