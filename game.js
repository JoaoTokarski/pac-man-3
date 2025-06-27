document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score');
    const highScoreDisplay = document.getElementById('high-score');
    const startBtn = document.getElementById('startBtn');
    
    // Configurações do jogo
    const gridSize = 20;
    const tileCount = 20;
    const tileSize = canvas.width / tileCount;
    
    // Estado do jogo
    let score = 0;
    let highScore = localStorage.getItem('pacmanHighScore') || 0;
    let gameRunning = false;
    let gameOver = false;
    let animationId;
    let lastTime = 0;
    const frameRate = 60;
    const frameInterval = 1000 / frameRate;
    let deltaTime = 0;
    
    // Elementos do jogo
    let pacman = {
        x: 10,
        y: 10,
        speed: 5,
        dx: 0,
        dy: 0,
        nextDX: 0,
        nextDY: 0,
        mouthAngle: 0,
        mouthOpen: true,
        radius: tileSize / 2 - 2
    };
    
    let ghosts = [
        { x: 5, y: 5, dx: 1, dy: 0, color: 'var(--ghost-red)', speed: 0.5 },
        { x: 15, y: 5, dx: -1, dy: 0, color: 'var(--ghost-cyan)', speed: 0.6 },
        { x: 5, y: 15, dx: 0, dy: 1, color: 'var(--ghost-pink)', speed: 0.55 },
        { x: 15, y: 15, dx: 0, dy: -1, color: 'var(--ghost-orange)', speed: 0.45 }
    ];
    
    let dots = [];
    let walls = [];
    let powerPellets = [];
    
    // Inicializa o jogo
    function initGame() {
        // Configura o canvas
        canvas.width = gridSize * tileCount;
        canvas.height = gridSize * tileCount;
        
        // Cria os pontos
        dots = [];
        for (let y = 0; y < tileCount; y++) {
            for (let x = 0; x < tileCount; x++) {
                // Não coloca pontos nas posições iniciais ou onde tem paredes
                if (!(x === 10 && y === 10) && 
                    !ghosts.some(ghost => ghost.x === x && ghost.y === y)) {
                    dots.push({ x, y });
                }
            }
        }
        
        // Cria as paredes (labirinto)
        walls = createMaze();
        
        // Remove pontos que estão em paredes
        dots = dots.filter(dot => !walls.some(wall => wall.x === dot.x && wall.y === dot.y));
        
        // Cria power pellets
        powerPellets = [
            { x: 1, y: 1 },
            { x: 18, y: 1 },
            { x: 1, y: 18 },
            { x: 18, y: 18 }
        ];
        
        // Reinicia o Pac-Man
        pacman = {
            x: 10,
            y: 10,
            speed: 5,
            dx: 0,
            dy: 0,
            nextDX: 0,
            nextDY: 0,
            mouthAngle: 0,
            mouthOpen: true,
            radius: tileSize / 2 - 2
        };
        
        // Reinicia os fantasmas
        ghosts = [
            { x: 5, y: 5, dx: 1, dy: 0, color: 'var(--ghost-red)', speed: 0.5 },
            { x: 15, y: 5, dx: -1, dy: 0, color: 'var(--ghost-cyan)', speed: 0.6 },
            { x: 5, y: 15, dx: 0, dy: 1, color: 'var(--ghost-pink)', speed: 0.55 },
            { x: 15, y: 15, dx: 0, dy: -1, color: 'var(--ghost-orange)', speed: 0.45 }
        ];
        
        score = 0;
        gameOver = false;
        updateScore();
    }
    
    // Cria o labirinto
    function createMaze() {
        const maze = [];
        
        // Paredes externas
        for (let i = 0; i < tileCount; i++) {
            maze.push({ x: i, y: 0 });
            maze.push({ x: i, y: tileCount - 1 });
            if (i > 0 && i < tileCount - 1) {
                maze.push({ x: 0, y: i });
                maze.push({ x: tileCount - 1, y: i });
            }
        }
        
        // Padrão interno do labirinto
        // Bloco central
        for (let x = 7; x <= 13; x++) {
            for (let y = 7; y <= 13; y++) {
                if (x === 10 && y === 10) continue;
                maze.push({ x, y });
            }
        }
        
        // Túneis
        for (let y = 9; y <= 11; y++) {
            maze.push({ x: 0, y });
            maze.push({ x: tileCount - 1, y });
        }
        
        // Outras paredes
        const patterns = [
            { x: 3, y: 3, w: 5, h: 1 },
            { x: 12, y: 3, w: 5, h: 1 },
            { x: 3, y: 16, w: 5, h: 1 },
            { x: 12, y: 16, w: 5, h: 1 },
            { x: 3, y: 5, w: 1, h: 5 },
            { x: 16, y: 5, w: 1, h: 5 },
            { x: 3, y: 10, w: 1, h: 5 },
            { x: 16, y: 10, w: 1, h: 5 }
        ];
        
        patterns.forEach(pattern => {
            for (let x = pattern.x; x < pattern.x + pattern.w; x++) {
                for (let y = pattern.y; y < pattern.y + pattern.h; y++) {
                    maze.push({ x, y });
                }
            }
        });
        
        return maze;
    }
    
    // Atualiza a pontuação
    function updateScore() {
        scoreDisplay.textContent = score;
        highScoreDisplay.textContent = highScore;
    }
    
    // Desenha o jogo
    function draw() {
        // Limpa o canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Desenha as paredes
        drawWalls();
        
        // Desenha os pontos
        drawDots();
        
        // Desenha os power pellets
        drawPowerPellets();
        
        // Desenha os fantasmas
        ghosts.forEach(ghost => drawGhost(ghost));
        
        // Desenha o Pac-Man
        drawPacman();
        
        // Tela de game over
        if (gameOver) {
            drawGameOver();
        }
    }
    
    function drawWalls() {
        ctx.fillStyle = 'var(--wall)';
        walls.forEach(wall => {
            ctx.fillRect(wall.x * tileSize, wall.y * tileSize, tileSize, tileSize);
            
            // Efeito 3D nas paredes
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 2;
            ctx.strokeRect(wall.x * tileSize, wall.y * tileSize, tileSize, tileSize);
        });
    }
    
    function drawDots() {
        ctx.fillStyle = 'var(--dot)';
        dots.forEach(dot => {
            ctx.beginPath();
            ctx.arc(
                dot.x * tileSize + tileSize / 2,
                dot.y * tileSize + tileSize / 2,
                tileSize / 6,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Efeito de brilho
            ctx.shadowColor = 'var(--dot)';
            ctx.shadowBlur = 5;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }
    
    function drawPowerPellets() {
        ctx.fillStyle = 'var(--primary)';
        powerPellets.forEach(pellet => {
            ctx.beginPath();
            ctx.arc(
                pellet.x * tileSize + tileSize / 2,
                pellet.y * tileSize + tileSize / 2,
                tileSize / 3,
                0,
                Math.PI * 2
            );
            
            // Efeito pulsante
            ctx.shadowColor = 'var(--primary)';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }
    
    function drawPacman() {
        ctx.fillStyle = 'var(--primary)';
        ctx.beginPath();
        
        // Animação da boca
        const mouthSpeed = 0.2;
        pacman.mouthAngle += pacman.mouthOpen ? mouthSpeed : -mouthSpeed;
        
        if (pacman.mouthAngle > 0.5 || pacman.mouthAngle < 0) {
            pacman.mouthOpen = !pacman.mouthOpen;
        }
        
        let startAngle, endAngle;
        
        if (pacman.dx === 1) {
            startAngle = 0.25 * Math.PI * pacman.mouthAngle;
            endAngle = 2 * Math.PI - 0.25 * Math.PI * pacman.mouthAngle;
        } else if (pacman.dx === -1) {
            startAngle = Math.PI + 0.25 * Math.PI * pacman.mouthAngle;
            endAngle = Math.PI - 0.25 * Math.PI * pacman.mouthAngle;
        } else if (pacman.dy === 1) {
            startAngle = Math.PI / 2 + 0.25 * Math.PI * pacman.mouthAngle;
            endAngle = Math.PI / 2 - 0.25 * Math.PI * pacman.mouthAngle;
        } else if (pacman.dy === -1) {
            startAngle = 3 * Math.PI / 2 + 0.25 * Math.PI * pacman.mouthAngle;
            endAngle = 3 * Math.PI / 2 - 0.25 * Math.PI * pacman.mouthAngle;
        } else {
            // Direção padrão (direita)
            startAngle = 0.25 * Math.PI * pacman.mouthAngle;
            endAngle = 2 * Math.PI - 0.25 * Math.PI * pacman.mouthAngle;
        }
        
        ctx.arc(
            pacman.x * tileSize + tileSize / 2,
            pacman.y * tileSize + tileSize / 2,
            pacman.radius,
            startAngle,
            endAngle
        );
        ctx.lineTo(
            pacman.x * tileSize + tileSize / 2,
            pacman.y * tileSize + tileSize / 2
        );
        
        // Efeito de brilho
        ctx.shadowColor = 'var(--primary)';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    function drawGhost(ghost) {
        const x = ghost.x * tileSize;
        const y = ghost.y * tileSize;
        const size = tileSize;
        
        // Corpo do fantasma
        ctx.fillStyle = ghost.color;
        ctx.beginPath();
        
        // Parte superior arredondada
        ctx.arc(x + size / 2, y + size / 2, size / 2, Math.PI, 2 * Math.PI);
        
        // Parte inferior com "ondas"
        const waveHeight = size / 6;
        for (let i = 0; i < 4; i++) {
            ctx.lineTo(x + size * (i * 0.25 + 0.125), y + size + (i % 2 === 0 ? -waveHeight : 0));
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Olhos
        const eyeSize = size / 5;
        const leftEyeX = x + size / 3;
        const rightEyeX = x + size * 2/3;
        const eyeY = y + size / 3;
        
        // Parte branca dos olhos
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(leftEyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.arc(rightEyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupilas
        ctx.fillStyle = 'var(--secondary)';
        ctx.beginPath();
        
        // Direção das pupilas baseada no movimento
        const pupilOffsetX = ghost.dx * eyeSize / 3;
        const pupilOffsetY = ghost.dy * eyeSize / 3;
        
        ctx.arc(leftEyeX + pupilOffsetX, eyeY + pupilOffsetY, eyeSize/3, 0, Math.PI * 2);
        ctx.arc(rightEyeX + pupilOffsetX, eyeY + pupilOffsetY, eyeSize/3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'var(--accent)';
        ctx.font = '24px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
        
        ctx.fillStyle = 'white';
        ctx.font = '16px "Press Start 2P"';
        ctx.fillText(`SCORE: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText(`HIGH SCORE: ${highScore}`, canvas.width / 2, canvas.height / 2 + 40);
        
        ctx.fillStyle = 'var(--primary)';
        ctx.font = '14px "Press Start 2P"';
        ctx.fillText('PRESS START TO PLAY AGAIN', canvas.width / 2, canvas.height / 2 + 80);
    }
    
    // Atualiza o estado do jogo
    function update(currentTime) {
        if (!lastTime) {
            lastTime = currentTime;
        }
        
        deltaTime = currentTime - lastTime;
        
        if (deltaTime > frameInterval) {
            if (!gameOver) {
                movePacman();
                checkCollisions();
                moveGhosts();
            }
            
            lastTime = currentTime - (deltaTime % frameInterval);
        }
    }
    
    function movePacman() {
        // Verifica se a próxima direção é possível
        const nextX = Math.round(pacman.x + pacman.nextDX);
        const nextY = Math.round(pacman.y + pacman.nextDY);
        
        if (!isWall(nextX, nextY)) {
            pacman.dx = pacman.nextDX;
            pacman.dy = pacman.nextDY;
        }
        
        // Move o Pac-Man se a direção atual for possível
        const newX = pacman.x + pacman.dx * pacman.speed / 10;
        const newY = pacman.y + pacman.dy * pacman.speed / 10;
        
        if (!isWall(Math.round(newX), Math.round(newY))) {
            pacman.x = newX;
            pacman.y = newY;
        }
        
        // Efeito de túnel
        if (pacman.x < 0) pacman.x = tileCount - 1;
        if (pacman.x >= tileCount) pacman.x = 0;
        if (pacman.y < 0) pacman.y = tileCount - 1;
        if (pacman.y >= tileCount) pacman.y = 0;
    }
    
    function isWall(x, y) {
        return walls.some(wall => Math.round(x) === wall.x && Math.round(y) === wall.y);
    }
    
    function checkCollisions() {
        const pacmanGridX = Math.round(pacman.x);
        const pacmanGridY = Math.round(pacman.y);
        
        // Verifica colisão com pontos
        dots = dots.filter(dot => {
            if (dot.x === pacmanGridX && dot.y === pacmanGridY) {
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
        
        // Verifica colisão com power pellets
        powerPellets = powerPellets.filter(pellet => {
            if (pellet.x === pacmanGridX && pellet.y === pacmanGridY) {
                score += 50;
                updateScore();
                return false;
            }
            return true;
        });
        
        // Verifica se todos os pontos foram coletados
        if (dots.length === 0 && powerPellets.length === 0) {
            // Fase completa - reinicia com mais desafio
            initGame();
            ghosts.push(
                { x: 10, y: 5, dx: 0, dy: 1, color: 'var(--ghost-red)', speed: 0.65 }
            );
        }
        
        // Verifica colisão com fantasmas
        for (const ghost of ghosts) {
            const ghostGridX = Math.round(ghost.x);
            const ghostGridY = Math.round(ghost.y);
            
            if (pacmanGridX === ghostGridX && pacmanGridY === ghostGridY) {
                gameOver = true;
                startBtn.textContent = 'RESTART';
                break;
            }
        }
    }
    
    function moveGhosts() {
        ghosts.forEach(ghost => {
            // IA simples: muda de direção ao bater em parede ou aleatoriamente
            const newX = ghost.x + ghost.dx;
            const newY = ghost.y + ghost.dy;
            
            if (isWall(newX, newY) || Math.random() < 0.03) {
                const directions = [
                    { dx: 1, dy: 0 },
                    { dx: -1, dy: 0 },
                    { dx: 0, dy: 1 },
                    { dx: 0, dy: -1 }
                ];
                
                const validDirections = directions.filter(dir => {
                    return !isWall(ghost.x + dir.dx, ghost.y + dir.dy) && 
                           !(dir.dx === -ghost.dx && dir.dy === -ghost.dy);
                });
                
                if (validDirections.length > 0) {
                    const newDir = validDirections[Math.floor(Math.random() * validDirections.length)];
                    ghost.dx = newDir.dx;
                    ghost.dy = newDir.dy;
                }
            }
            
            ghost.x += ghost.dx * ghost.speed / 10;
            ghost.y += ghost.dy * ghost.speed / 10;
            
            // Efeito de túnel
            if (ghost.x < 0) ghost.x = tileCount - 1;
            if (ghost.x >= tileCount) ghost.x = 0;
            if (ghost.y < 0) ghost.y = tileCount - 1;
            if (ghost.y >= tileCount) ghost.y = 0;
        });
    }
    
    // Loop do jogo
    function gameLoop(currentTime) {
        update(currentTime);
        draw();
        
        if (gameRunning) {
            animationId = requestAnimationFrame(gameLoop);
        }
    }
    
    // Controles
    function handleKeyDown(e) {
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
    }
    
    // Controles móveis
    document.getElementById('upBtn').addEventListener('click', () => {
        pacman.nextDX = 0;
        pacman.nextDY = -1;
    });
    
    document.getElementById('downBtn').addEventListener('click', () => {
        pacman.nextDX = 0;
        pacman.nextDY = 1;
    });
    
    document.getElementById('leftBtn').addEventListener('click', () => {
        pacman.nextDX = -1;
        pacman.nextDY = 0;
    });
    
    document.getElementById('rightBtn').addEventListener('click', () => {
        pacman.nextDX = 1;
        pacman.nextDY = 0;
    });
    
    // Inicia/reinicia o jogo
    startBtn.addEventListener('click', () => {
        if (gameRunning) {
            cancelAnimationFrame(animationId);
        }
        
        initGame();
        gameRunning = true;
        gameOver = false;
        startBtn.textContent = 'RESTART';
        lastTime = 0;
        animationId = requestAnimationFrame(gameLoop);
    });
    
    // Inicializa o jogo
    initGame();
    updateScore();
    document.addEventListener('keydown', handleKeyDown);
    
    // Canvas responsivo
    function resizeCanvas() {
        const container = document.querySelector('.game-container');
        const maxSize = Math.min(container.clientWidth - 40, 500);
        canvas.width = maxSize;
        canvas.height = maxSize;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Inicia o jogo automaticamente
    startBtn.click();
});