document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score');
    const highScoreDisplay = document.getElementById('highScore');
    const startBtn = document.getElementById('startBtn');
    
    // Game settings
    const gridSize = 20;
    const tileCount = 20;
    const tileSize = canvas.width / tileCount;
    
    // Game state
    let score = 0;
    let highScore = localStorage.getItem('packmanHighScore') || 0;
    let gameRunning = false;
    let gameOver = false;
    let animationId;
    
    // Initialize game elements
    let packman = {
        x: 10,
        y: 10,
        speed: 5,
        dx: 0,
        dy: 0,
        nextDX: 0,
        nextDY: 0,
        mouthAngle: 0,
        mouthOpen: true
    };
    
    let ghosts = [
        { x: 5, y: 5, dx: 1, dy: 0, color: '#E94560' },
        { x: 15, y: 5, dx: -1, dy: 0, color: '#00B4D8' },
        { x: 5, y: 15, dx: 0, dy: 1, color: '#9C27B0' },
        { x: 15, y: 15, dx: 0, dy: -1, color: '#FF9800' }
    ];
    
    let dots = [];
    let walls = [];
    
    // Initialize game board
    function initGame() {
        // Set canvas size
        canvas.width = gridSize * tileCount;
        canvas.height = gridSize * tileCount;
        
        // Create dots
        dots = [];
        for (let y = 0; y < tileCount; y++) {
            for (let x = 0; x < tileCount; x++) {
                // Leave space for walls and packman/ghosts starting positions
                if (!((x === 10 && y === 10) || 
                      (x === 5 && y === 5) || 
                      (x === 15 && y === 5) || 
                      (x === 5 && y === 15) || 
                      (x === 15 && y === 15))) {
                    dots.push({ x, y });
                }
            }
        }
        
        // Create walls (simple maze pattern)
        walls = [];
        // Border walls
        for (let i = 0; i < tileCount; i++) {
            walls.push({ x: i, y: 0 });
            walls.push({ x: i, y: tileCount - 1 });
            if (i > 0 && i < tileCount - 1) {
                walls.push({ x: 0, y: i });
                walls.push({ x: tileCount - 1, y: i });
            }
        }
        
        // Inner walls
        for (let i = 5; i < 15; i++) {
            if (i !== 10) {
                walls.push({ x: i, y: 5 });
                walls.push({ x: i, y: 15 });
            }
        }
        for (let i = 5; i < 15; i++) {
            if (i !== 10) {
                walls.push({ x: 5, y: i });
                walls.push({ x: 15, y: i });
            }
        }
        
        // Remove dots that are on walls
        dots = dots.filter(dot => !walls.some(wall => wall.x === dot.x && wall.y === dot.y));
        
        // Initialize packman
        packman = {
            x: 10,
            y: 10,
            speed: 5,
            dx: 0,
            dy: 0,
            nextDX: 0,
            nextDY: 0,
            mouthAngle: 0,
            mouthOpen: true
        };
        
        // Initialize ghosts
        ghosts = [
            { x: 5, y: 5, dx: 1, dy: 0, color: '#E94560' },
            { x: 15, y: 5, dx: -1, dy: 0, color: '#00B4D8' },
            { x: 5, y: 15, dx: 0, dy: 1, color: '#9C27B0' },
            { x: 15, y: 15, dx: 0, dy: -1, color: '#FF9800' }
        ];
        
        score = 0;
        gameOver = false;
        updateScore();
    }
    
    // Update score display
    function updateScore() {
        scoreDisplay.textContent = score;
        highScoreDisplay.textContent = highScore;
    }
    
    // Draw game elements
    function draw() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw walls
        ctx.fillStyle = '#16213E';
        walls.forEach(wall => {
            ctx.fillRect(wall.x * tileSize, wall.y * tileSize, tileSize, tileSize);
        });
        
        // Draw dots
        ctx.fillStyle = '#F8F8F8';
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
        });
        
        // Draw packman
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        
        const mouthSpeed = 0.2;
        packman.mouthAngle += packman.mouthOpen ? mouthSpeed : -mouthSpeed;
        
        if (packman.mouthAngle > 0.5 || packman.mouthAngle < 0) {
            packman.mouthOpen = !packman.mouthOpen;
        }
        
        let startAngle, endAngle;
        
        if (packman.dx === 1) {
            startAngle = 0.25 * Math.PI * packman.mouthAngle;
            endAngle = 2 * Math.PI - 0.25 * Math.PI * packman.mouthAngle;
        } else if (packman.dx === -1) {
            startAngle = Math.PI + 0.25 * Math.PI * packman.mouthAngle;
            endAngle = Math.PI - 0.25 * Math.PI * packman.mouthAngle;
        } else if (packman.dy === 1) {
            startAngle = Math.PI / 2 + 0.25 * Math.PI * packman.mouthAngle;
            endAngle = Math.PI / 2 - 0.25 * Math.PI * packman.mouthAngle;
        } else if (packman.dy === -1) {
            startAngle = 3 * Math.PI / 2 + 0.25 * Math.PI * packman.mouthAngle;
            endAngle = 3 * Math.PI / 2 - 0.25 * Math.PI * packman.mouthAngle;
        } else {
            // Default to right-facing when not moving
            startAngle = 0.25 * Math.PI * packman.mouthAngle;
            endAngle = 2 * Math.PI - 0.25 * Math.PI * packman.mouthAngle;
        }
        
        ctx.arc(
            packman.x * tileSize + tileSize / 2,
            packman.y * tileSize + tileSize / 2,
            tileSize / 2 - 2,
            startAngle,
            endAngle
        );
        ctx.lineTo(
            packman.x * tileSize + tileSize / 2,
            packman.y * tileSize + tileSize / 2
        );
        ctx.fill();
        
        // Draw ghosts
        ghosts.forEach(ghost => {
            drawGhost(ghost.x, ghost.y, ghost.color);
        });
        
        // Game over display
        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#E94560';
            ctx.font = '20px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px "Press Start 2P"';
            ctx.fillText(`FINAL SCORE: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
            
            ctx.fillText('PRESS START TO PLAY AGAIN', canvas.width / 2, canvas.height / 2 + 50);
        }
    }
    
    function drawGhost(x, y, color) {
        const ghostSize = tileSize;
        
        // Ghost body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x * ghostSize, y * ghostSize + ghostSize / 2);
        
        // Top curve
        ctx.quadraticCurveTo(
            x * ghostSize + ghostSize / 2,
            y * ghostSize,
            x * ghostSize + ghostSize,
            y * ghostSize + ghostSize / 2
        );
        
        // Bottom waves
        const waveHeight = ghostSize / 6;
        for (let i = 0; i < 3; i++) {
            ctx.quadraticCurveTo(
                x * ghostSize + ghostSize * (0.75 - i * 0.25),
                y * ghostSize + ghostSize + waveHeight,
                x * ghostSize + ghostSize * (0.5 - i * 0.25),
                y * ghostSize + ghostSize
            );
            ctx.quadraticCurveTo(
                x * ghostSize + ghostSize * (0.25 - i * 0.25),
                y * ghostSize + ghostSize - waveHeight,
                x * ghostSize + ghostSize * (0 - i * 0.25),
                y * ghostSize + ghostSize
            );
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Ghost eyes
        const eyeSize = ghostSize / 5;
        const leftEyeX = x * ghostSize + ghostSize / 3;
        const rightEyeX = x * ghostSize + ghostSize * 2/3;
        const eyeY = y * ghostSize + ghostSize / 3;
        
        // White part of eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(leftEyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.arc(rightEyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(leftEyeX - eyeSize/4, eyeY, eyeSize/3, 0, Math.PI * 2);
        ctx.arc(rightEyeX - eyeSize/4, eyeY, eyeSize/3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Update game state
    function update() {
        if (gameOver) return;
        
        // Move packman
        movePackman();
        
        // Check for dot collection
        checkDotCollision();
        
        // Move ghosts
        moveGhosts();
        
        // Check for ghost collisions
        checkGhostCollision();
    }
    
    function movePackman() {
        // Check if next direction is possible
        const nextX = packman.x + packman.nextDX;
        const nextY = packman.y + packman.nextDY;
        
        if (!isWall(nextX, nextY)) {
            packman.dx = packman.nextDX;
            packman.dy = packman.nextDY;
        }
        
        // Move packman if current direction is possible
        const newX = packman.x + packman.dx * packman.speed / 10;
        const newY = packman.y + packman.dy * packman.speed / 10;
        
        if (!isWall(Math.round(newX), Math.round(newY))) {
            packman.x = newX;
            packman.y = newY;
        } else {
            // Stop movement if hitting a wall
            packman.dx = 0;
            packman.dy = 0;
        }
        
        // Wrap around the screen (tunnel effect)
        if (packman.x < 0) packman.x = tileCount - 1;
        if (packman.x >= tileCount) packman.x = 0;
        if (packman.y < 0) packman.y = tileCount - 1;
        if (packman.y >= tileCount) packman.y = 0;
    }
    
    function isWall(x, y) {
        return walls.some(wall => Math.round(x) === wall.x && Math.round(y) === wall.y);
    }
    
    function checkDotCollision() {
        const packmanGridX = Math.round(packman.x);
        const packmanGridY = Math.round(packman.y);
        
        dots = dots.filter(dot => {
            if (dot.x === packmanGridX && dot.y === packmanGridY) {
                score += 10;
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('packmanHighScore', highScore);
                }
                updateScore();
                return false;
            }
            return true;
        });
        
        // Check if all dots are collected
        if (dots.length === 0) {
            // Level complete - reset with more ghosts for challenge
            initGame();
            ghosts.push(
                { x: 10, y: 5, dx: 0, dy: 1, color: '#4CAF50' },
                { x: 10, y: 15, dx: 0, dy: -1, color: '#FF5722' }
            );
        }
    }
    
    function moveGhosts() {
        ghosts.forEach(ghost => {
            // Simple AI: change direction when hitting a wall
            const newX = ghost.x + ghost.dx;
            const newY = ghost.y + ghost.dy;
            
            if (isWall(newX, newY) || Math.random() < 0.05) {
                // Try to find a new direction
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
            
            ghost.x += ghost.dx * 0.5; // Slower than packman
            ghost.y += ghost.dy * 0.5;
            
            // Wrap around the screen (tunnel effect)
            if (ghost.x < 0) ghost.x = tileCount - 1;
            if (ghost.x >= tileCount) ghost.x = 0;
            if (ghost.y < 0) ghost.y = tileCount - 1;
            if (ghost.y >= tileCount) ghost.y = 0;
        });
    }
    
    function checkGhostCollision() {
        const packmanGridX = Math.round(packman.x);
        const packmanGridY = Math.round(packman.y);
        
        for (const ghost of ghosts) {
            const ghostGridX = Math.round(ghost.x);
            const ghostGridY = Math.round(ghost.y);
            
            if (packmanGridX === ghostGridX && packmanGridY === ghostGridY) {
                gameOver = true;
                startBtn.textContent = 'RESTART';
                break;
            }
        }
    }
    
    // Game loop
    function gameLoop() {
        update();
        draw();
        
        if (gameRunning) {
            animationId = requestAnimationFrame(gameLoop);
        }
    }
    
    // Event listeners
    function handleKeyDown(e) {
        if (gameOver) return;
        
        switch (e.key) {
            case 'ArrowUp':
                packman.nextDX = 0;
                packman.nextDY = -1;
                break;
            case 'ArrowDown':
                packman.nextDX = 0;
                packman.nextDY = 1;
                break;
            case 'ArrowLeft':
                packman.nextDX = -1;
                packman.nextDY = 0;
                break;
            case 'ArrowRight':
                packman.nextDX = 1;
                packman.nextDY = 0;
                break;
        }
    }
    
    // Mobile controls
    document.getElementById('upBtn').addEventListener('click', () => {
        packman.nextDX = 0;
        packman.nextDY = -1;
    });
    
    document.getElementById('downBtn').addEventListener('click', () => {
        packman.nextDX = 0;
        packman.nextDY = 1;
    });
    
    document.getElementById('leftBtn').addEventListener('click', () => {
        packman.nextDX = -1;
        packman.nextDY = 0;
    });
    
    document.getElementById('rightBtn').addEventListener('click', () => {
        packman.nextDX = 1;
        packman.nextDY = 0;
    });
    
    // Start/restart game
    startBtn.addEventListener('click', () => {
        if (gameRunning) {
            cancelAnimationFrame(animationId);
        }
        
        initGame();
        gameRunning = true;
        gameOver = false;
        startBtn.textContent = 'RESTART';
        gameLoop();
    });
    
    // Initialize game
    initGame();
    updateScore();
    document.addEventListener('keydown', handleKeyDown);
    
    // Responsive canvas
    function resizeCanvas() {
        const container = document.querySelector('.game-container');
        const maxSize = Math.min(container.clientWidth - 40, 500);
        canvas.style.width = `${maxSize}px`;
        canvas.style.height = `${maxSize}px`;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
});