// Configurações do jogo
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tileSize = 20;
const tileCount = 20;
canvas.width = tileSize * tileCount;
canvas.height = tileSize * tileCount;

// Estado do jogo
let score = 0;
let highScore = localStorage.getItem('pacmanHighScore') || 0;
let gameRunning = false;
let gameOver = false;
let animationId;
let lastTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;
let deltaTime = 0;

// Pac-Man
const pacman = {
    x: 10,
    y: 15,
    dx: 0,
    dy: 0,
    speed: 7,  // Velocidade aumentada
    radius: tileSize / 2 - 2,
    mouthAngle: 0,
    mouthOpen: true
};

// Fantasmas
const ghosts = [
    { x: 9, y: 9, dx: 1, dy: 0, color: '#FF0000', speed: 3.5 },
    { x: 10, y: 9, dx: -1, dy: 0, color: '#00FFFF', speed: 3 },
    { x: 9, y: 10, dx: 0, dy: 1, color: '#FF69B4', speed: 2.8 },
    { x: 10, y: 10, dx: 0, dy: -1, color: '#FFA500', speed: 3.2 }
];

// Elementos do jogo
let dots = [];
const walls = [];
const powerPellets = [
    { x: 1, y: 1 },
    { x: 18, y: 1 },
    { x: 1, y: 18 },
    { x: 18, y: 18 }
];

// Labirinto personalizado
const mazePattern = [
    "####################",
    "#..................#",
    "#.###..###..###..###",
    "#.#......#......#..#",
    "#.#..##..##..##..#.#",
    "#.#..#......#..#..#",
    "#....##....##....#",
    "#.###..####..###.#",
    "#......#..#......#",
    "###.##......##.###",
    "#......#..#......#",
    "#.###..####..###.#",
    "#....##....##....#",
    "#.#..#......#..#..#",
    "#.#..##..##..##..#.#",
    "#.#......#......#..#",
    "#.###..###..###..###",
    "#..................#",
    "####################"
];

// Inicializa o jogo
function initGame() {
    // Limpa arrays
    walls.length = 0;
    dots.length = 0;

    // Cria labirinto
    for (let y = 0; y < tileCount; y++) {
        for (let x = 0; x < tileCount; x++) {
            if (mazePattern[y] && mazePattern[y][x] === '#') {
                walls.push({ x, y });
            } else if (x > 0 && x < tileCount - 1 && y > 0 && y < tileCount - 1) {
                dots.push({ x, y });
            }
        }
    }

    // Remove pontos onde tem power pellets
    dots = dots.filter(dot => 
        !powerPellets.some(pellet => pellet.x === dot.x && pellet.y === dot.y)
    );

    // Reseta posições
    pacman.x = 10;
    pacman.y = 15;
    pacman.dx = 0;
    pacman.dy = 0;

    // Reseta fantasmas
    ghosts[0] = { x: 9, y: 9, dx: 1, dy: 0, color: '#FF0000', speed: 3.5 };
    ghosts[1] = { x: 10, y: 9, dx: -1, dy: 0, color: '#00FFFF', speed: 3 };
    ghosts[2] = { x: 9, y: 10, dx: 0, dy: 1, color: '#FF69B4', speed: 2.8 };
    ghosts[3] = { x: 10, y: 10, dx: 0, dy: -1, color: '#FFA500', speed: 3.2 };

    score = 0;
    gameOver = false;
    updateScore();
}

// Atualiza pontuação
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('high-score').textContent = highScore;
}

// Desenha o jogo
function draw() {
    // Fundo
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Paredes
    ctx.fillStyle = '#1E90FF';
    walls.forEach(wall => {
        ctx.fillRect(wall.x * tileSize, wall.y * tileSize, tileSize, tileSize);
    });

    // Pontos
    ctx.fillStyle = '#FFF';
    dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x * tileSize + tileSize/2, dot.y * tileSize + tileSize/2, 3, 0, Math.PI*2);
        ctx.fill();
    });

    // Power pellets
    ctx.fillStyle = '#FFD700';
    powerPellets.forEach(pellet => {
        ctx.beginPath();
        ctx.arc(pellet.x * tileSize + tileSize/2, pellet.y * tileSize + tileSize/2, 6, 0, Math.PI*2);
        ctx.fill();
    });

    // Fantasmas
    ghosts.forEach(ghost => {
        // Corpo
        ctx.fillStyle = ghost.color;
        ctx.beginPath();
        ctx.arc(ghost.x * tileSize + tileSize/2, ghost.y * tileSize + tileSize/2, tileSize/2, Math.PI, Math.PI*2);
        ctx.lineTo(ghost.x * tileSize + tileSize, ghost.y * tileSize + tileSize);
        ctx.lineTo(ghost.x * tileSize, ghost.y * tileSize + tileSize);
        ctx.fill();
        
        // Olhos
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(ghost.x * tileSize + tileSize/2 - 5, ghost.y * tileSize + tileSize/2 - 3, 4, 0, Math.PI*2);
        ctx.arc(ghost.x * tileSize + tileSize/2 + 5, ghost.y * tileSize + tileSize/2 - 3, 4, 0, Math.PI*2);
        ctx.fill();
        
        // Pupilas
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ghost.x * tileSize + tileSize/2 - 5 + (ghost.dx * 2), ghost.y * tileSize + tileSize/2 - 3 + (ghost.dy * 2), 2, 0, Math.PI*2);
        ctx.arc(ghost.x * tileSize + tileSize/2 + 5 + (ghost.dx * 2), ghost.y * tileSize + tileSize/2 - 3 + (ghost.dy * 2), 2, 0, Math.PI*2);
        ctx.fill();
    });

    // Pac-Man
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    
    // Animação da boca
    pacman.mouthAngle += pacman.mouthOpen ? 0.1 : -0.1;
    if (pacman.mouthAngle > 0.5 || pacman.mouthAngle < 0) {
        pacman.mouthOpen = !pacman.mouthOpen;
    }

    let startAngle, endAngle;
    if (pacman.dx === 1) {
        startAngle = 0.2 * Math.PI * pacman.mouthAngle;
        endAngle = 2 * Math.PI - 0.2 * Math.PI * pacman.mouthAngle;
    } else if (pacman.dx === -1) {
        startAngle = Math.PI + 0.2 * Math.PI * pacman.mouthAngle;
        endAngle = Math.PI - 0.2 * Math.PI * pacman.mouthAngle;
    } else if (pacman.dy === 1) {
        startAngle = Math.PI/2 + 0.2 * Math.PI * pacman.mouthAngle;
        endAngle = Math.PI/2 - 0.2 * Math.PI * pacman.mouthAngle;
    } else if (pacman.dy === -1) {
        startAngle = 3*Math.PI/2 + 0.2 * Math.PI * pacman.mouthAngle;
        endAngle = 3*Math.PI/2 - 0.2 * Math.PI * pacman.mouthAngle;
    } else {
        startAngle = 0.2 * Math.PI * pacman.mouthAngle;
        endAngle = 2 * Math.PI - 0.2 * Math.PI * pacman.mouthAngle;
    }

    ctx.arc(
        pacman.x * tileSize + tileSize/2,
        pacman.y * tileSize + tileSize/2,
        pacman.radius,
        startAngle,
        endAngle
    );
    ctx.lineTo(pacman.x * tileSize + tileSize/2, pacman.y * tileSize + tileSize/2);
    ctx.fill();

    // Game Over
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FF0000';
        ctx.font = '24px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 20);
        ctx.fillStyle = '#FFF';
        ctx.font = '16px "Press Start 2P"';
        ctx.fillText(`SCORE: ${score}`, canvas.width/2, canvas.height/2 + 20);
    }
}

// Atualiza o jogo
function update(currentTime) {
    if (!lastTime) lastTime = currentTime;
    deltaTime = currentTime - lastTime;

    if (deltaTime > frameInterval) {
        if (!gameOver) {
            movePacman();
            moveGhosts();
            checkCollisions();
        }
        lastTime = currentTime - (deltaTime % frameInterval);
    }
}

// Movimenta o Pac-Man
function movePacman() {
    // Verifica próxima direção
    const nextX = Math.round(pacman.x + pacman.nextDX);
    const nextY = Math.round(pacman.y + pacman.nextDY);
    
    if (!isWall(nextX, nextY)) {
        pacman.dx = pacman.nextDX;
        pacman.dy = pacman.nextDY;
    }

    // Movimento
    const newX = pacman.x + pacman.dx * pacman.speed / 10;
    const newY = pacman.y + pacman.dy * pacman.speed / 10;

    if (!isWall(Math.round(newX), Math.round(newY))) {
        pacman.x = newX;
        pacman.y = newY;
    }

    // Túnel
    if (pacman.x < 0) pacman.x = tileCount - 1;
    if (pacman.x >= tileCount) pacman.x = 0;
    if (pacman.y < 0) pacman.y = tileCount - 1;
    if (pacman.y >= tileCount) pacman.y = 0;
}

// Movimenta fantasmas
function moveGhosts() {
    ghosts.forEach(ghost => {
        // IA melhorada
        const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];

        // Tenta perseguir o Pac-Man
        if (Math.random() < 0.3) {
            if (Math.abs(ghost.x - pacman.x) > Math.abs(ghost.y - pacman.y)) {
                ghost.dx = ghost.x < pacman.x ? 1 : -1;
                ghost.dy = 0;
            } else {
                ghost.dy = ghost.y < pacman.y ? 1 : -1;
                ghost.dx = 0;
            }
        }

        // Verifica se pode mover na direção atual
        const newX = ghost.x + ghost.dx * ghost.speed / 10;
        const newY = ghost.y + ghost.dy * ghost.speed / 10;

        if (isWall(Math.round(newX), Math.round(newY)) || Math.random() < 0.1) {
            // Escolhe nova direção aleatória
            const validDirs = directions.filter(dir => 
                !isWall(Math.round(ghost.x + dir.dx), Math.round(ghost.y + dir.dy))
            );
            
            if (validDirs.length > 0) {
                const newDir = validDirs[Math.floor(Math.random() * validDirs.length)];
                ghost.dx = newDir.dx;
                ghost.dy = newDir.dy;
            }
        }

        ghost.x += ghost.dx * ghost.speed / 10;
        ghost.y += ghost.dy * ghost.speed / 10;

        // Túnel
        if (ghost.x < 0) ghost.x = tileCount - 1;
        if (ghost.x >= tileCount) ghost.x = 0;
        if (ghost.y < 0) ghost.y = tileCount - 1;
        if (ghost.y >= tileCount) ghost.y = 0;
    });
}

// Verifica colisões
function checkCollisions() {
    const pacX = Math.round(pacman.x);
    const pacY = Math.round(pacman.y);

    // Pontos
    dots = dots.filter(dot => {
        if (pacX === dot.x && pacY === dot.y) {
            score += 10;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('pacmanHighScore', highScore);
            }
            updateScore();
            return false;
        }
        return true;
    });

    // Power pellets
    powerPellets.forEach((pellet, index) => {
        if (pacX === pellet.x && pacY === pellet.y) {
            score += 50;
            powerPellets.splice(index, 1);
            updateScore();
        }
    });

    // Fantasmas
    ghosts.forEach(ghost => {
        if (pacX === Math.round(ghost.x) && pacY === Math.round(ghost.y)) {
            gameOver = true;
            document.getElementById('startBtn').textContent = 'RESTART';
        }
    });

    // Vitória
    if (dots.length === 0 && powerPellets.length === 0) {
        initGame();
    }
}

// Verifica se é parede
function isWall(x, y) {
    return walls.some(wall => wall.x === x && wall.y === y);
}

// Controles
document.addEventListener('keydown', e => {
    if (gameOver) return;

    switch (e.key) {
        case 'ArrowUp':
            pacman.nextDX = 0;
            pacman.nextDY = -1;
            break;
        case 'ArrowDown':
            pacman.nextDX = 0;
            pacman.nextDY = 1;
            break;
        case 'ArrowLeft':
            pacman.nextDX = -1;
            pacman.nextDY = 0;
            break;
        case 'ArrowRight':
            pacman.nextDX = 1;
            pacman.nextDY = 0;
            break;
    }
});

// Botão Start
document.getElementById('startBtn').addEventListener('click', () => {
    if (gameRunning) cancelAnimationFrame(animationId);
    initGame();
    gameRunning = true;
    gameOver = false;
    lastTime = 0;
    animationId = requestAnimationFrame(gameLoop);
});

// Loop do jogo
function gameLoop(currentTime) {
    update(currentTime);
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

// Inicia automaticamente
initGame();
document.getElementById('startBtn').click();