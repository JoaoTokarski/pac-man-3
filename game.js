// Configurações do jogo
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tileSize = 20;
const tileCount = 20;
canvas.width = tileSize * tileCount;
canvas.height = tileSize * tileCount;

// Variáveis do jogo
let score = 0;
let highScore = localStorage.getItem('pacmanHighScore') || 0;
let gameRunning = false;
let gameOver = false;
let animationId;

// Pac-Man
const pacman = {
    x: 10,
    y: 15,
    dx: 0,
    dy: 0,
    speed: 5,
    radius: tileSize / 2 - 2,
    mouthAngle: 0,
    mouthOpen: true
};

// Fantasmas
const ghosts = [
    { x: 9, y: 9, dx: 1, dy: 0, color: '#FF0000', speed: 2 },
    { x: 10, y: 9, dx: -1, dy: 0, color: '#00FFFF', speed: 1.5 }
];

// Pontos e paredes
let dots = [];
const walls = [];

// Inicializa o jogo
function initGame() {
    // Limpa paredes e pontos
    walls.length = 0;
    dots.length = 0;

    // Cria paredes (bordas)
    for (let i = 0; i < tileCount; i++) {
        walls.push({ x: i, y: 0 });
        walls.push({ x: i, y: tileCount - 1 });
        if (i > 0 && i < tileCount - 1) {
            walls.push({ x: 0, y: i });
            walls.push({ x: tileCount - 1, y: i });
        }
    }

    // Cria pontos
    for (let y = 1; y < tileCount - 1; y++) {
        for (let x = 1; x < tileCount - 1; x++) {
            if (!walls.some(wall => wall.x === x && wall.y === y)) {
                dots.push({ x, y });
            }
        }
    }

    // Reseta posições
    pacman.x = 10;
    pacman.y = 15;
    pacman.dx = 0;
    pacman.dy = 0;

    ghosts[0].x = 9;
    ghosts[0].y = 9;
    ghosts[1].x = 10;
    ghosts[1].y = 9;

    score = 0;
    gameOver = false;
    updateScore();
}

// Atualiza a pontuação
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
        ctx.arc(dot.x * tileSize + tileSize / 2, dot.y * tileSize + tileSize / 2, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    // Fantasmas
    ghosts.forEach(ghost => {
        ctx.fillStyle = ghost.color;
        ctx.beginPath();
        ctx.arc(ghost.x * tileSize + tileSize / 2, ghost.y * tileSize + tileSize / 2, tileSize / 2, 0, Math.PI * 2);
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
        startAngle = Math.PI / 2 + 0.2 * Math.PI * pacman.mouthAngle;
        endAngle = Math.PI / 2 - 0.2 * Math.PI * pacman.mouthAngle;
    } else if (pacman.dy === -1) {
        startAngle = 3 * Math.PI / 2 + 0.2 * Math.PI * pacman.mouthAngle;
        endAngle = 3 * Math.PI / 2 - 0.2 * Math.PI * pacman.mouthAngle;
    } else {
        startAngle = 0.2 * Math.PI * pacman.mouthAngle;
        endAngle = 2 * Math.PI - 0.2 * Math.PI * pacman.mouthAngle;
    }

    ctx.arc(
        pacman.x * tileSize + tileSize / 2,
        pacman.y * tileSize + tileSize / 2,
        pacman.radius,
        startAngle,
        endAngle
    );
    ctx.lineTo(pacman.x * tileSize + tileSize / 2, pacman.y * tileSize + tileSize / 2);
    ctx.fill();

    // Game Over
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FF0000';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    }
}

// Atualiza o estado do jogo
function update() {
    if (gameOver) return;

    // Move Pac-Man
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

    // Move fantasmas
    ghosts.forEach(ghost => {
        const newGhostX = ghost.x + ghost.dx * ghost.speed / 10;
        const newGhostY = ghost.y + ghost.dy * ghost.speed / 10;

        if (!isWall(Math.round(newGhostX), Math.round(newGhostY))) {
            ghost.x = newGhostX;
            ghost.y = newGhostY;
        } else {
            // Muda direção aleatoriamente
            const directions = [
                { dx: 1, dy: 0 },
                { dx: -1, dy: 0 },
                { dx: 0, dy: 1 },
                { dx: 0, dy: -1 }
            ];
            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            ghost.dx = randomDir.dx;
            ghost.dy = randomDir.dy;
        }

        // Túnel para fantasmas
        if (ghost.x < 0) ghost.x = tileCount - 1;
        if (ghost.x >= tileCount) ghost.x = 0;
        if (ghost.y < 0) ghost.y = tileCount - 1;
        if (ghost.y >= tileCount) ghost.y = 0;
    });

    // Verifica colisão com pontos
    dots = dots.filter(dot => {
        if (Math.round(pacman.x) === dot.x && Math.round(pacman.y) === dot.y) {
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

    // Verifica colisão com fantasmas
    ghosts.forEach(ghost => {
        if (Math.round(pacman.x) === Math.round(ghost.x) && 
            Math.round(pacman.y) === Math.round(ghost.y)) {
            gameOver = true;
            document.getElementById('startBtn').textContent = 'RESTART';
        }
    });

    // Vitória (coletou todos os pontos)
    if (dots.length === 0) {
        initGame(); // Reinicia o jogo
        ghosts.push({ // Adiciona um novo fantasma
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount),
            dx: [-1, 1][Math.floor(Math.random() * 2)],
            dy: 0,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            speed: Math.random() * 2 + 1
        });
    }
}

// Verifica se é parede
function isWall(x, y) {
    return walls.some(wall => wall.x === x && wall.y === y);
}

// Controles (teclado)
document.addEventListener('keydown', e => {
    if (gameOver) return;

    switch (e.key) {
        case 'ArrowUp':
            if (!isWall(Math.round(pacman.x), Math.round(pacman.y) - 1)) {
                pacman.dx = 0;
                pacman.dy = -1;
            }
            break;
        case 'ArrowDown':
            if (!isWall(Math.round(pacman.x), Math.round(pacman.y) + 1)) {
                pacman.dx = 0;
                pacman.dy = 1;
            }
            break;
        case 'ArrowLeft':
            if (!isWall(Math.round(pacman.x) - 1, Math.round(pacman.y))) {
                pacman.dx = -1;
                pacman.dy = 0;
            }
            break;
        case 'ArrowRight':
            if (!isWall(Math.round(pacman.x) + 1, Math.round(pacman.y))) {
                pacman.dx = 1;
                pacman.dy = 0;
            }
            break;
    }
});

// Botão Start/Restart
document.getElementById('startBtn').addEventListener('click', () => {
    if (gameRunning) {
        cancelAnimationFrame(animationId);
    }
    initGame();
    gameRunning = true;
    gameOver = false;
    document.getElementById('startBtn').textContent = 'RESTART';
    gameLoop();
});

// Loop do jogo
function gameLoop() {
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

// Inicia o jogo automaticamente
initGame();
document.getElementById('startBtn').click();