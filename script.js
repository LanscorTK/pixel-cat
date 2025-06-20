// 小猫2D全方向射击游戏 - 主要游戏逻辑

// ==================== 游戏初始化 ====================

// 获取画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 鼠标位置跟踪
let mouse = { x: 0, y: 0 };

// ==================== 游戏状态 ====================

// 主游戏状态对象
let gameState = {
    score: 0,
    lives: 10,
    wave: 1,
    kills: 0,
    gameRunning: true,
    keys: {},
    enemiesThisWave: 10,
    enemiesKilled: 0,
    waveComplete: false
};

// ==================== 游戏对象定义 ====================

// 小猫玩家（俯视角）
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 30,
    height: 30,
    speed: 3, 
    shootCooldown: 0,
    angle: 0,
    weapon: {
        type: 'basic',
        damage: 1,
        fireRate: 8, // 保持较快的射击速度，方便连射
        bulletSpeed: 8
    }
};

// 游戏对象数组
let bullets = [];
let enemies = [];
let powerUps = [];
let particles = [];

// ==================== 配置数据 ====================

// 敌人类型配置（俯视角）
const enemyTypes = [
    { emoji: '👾', speed: 1, points: 10, health: 1, size: 25 },
    { emoji: '🤖', speed: 0.8, points: 20, health: 2, size: 30 },
    { emoji: '👹', speed: 1.2, points: 15, health: 1, size: 28 },
    { emoji: '🦇', speed: 1.8, points: 30, health: 1, size: 20 },
    { emoji: '🕷️', speed: 1.5, points: 25, health: 1, size: 22 }
];

// 武器类型配置（优化连射体验）
const weaponTypes = {
    basic: { name: '🔫 基础枪', damage: 1, fireRate: 8, bulletSpeed: 8, color: '#FFD700', type: 'basic' },
    rapid: { name: '⚡ 速射枪', damage: 1, fireRate: 3, bulletSpeed: 10, color: '#00FFFF', type: 'rapid' },
    heavy: { name: '💥 重机枪', damage: 3, fireRate: 12, bulletSpeed: 6, color: '#FF4500', type: 'heavy' },
    spread: { name: '🌟 散弹枪', damage: 2, fireRate: 15, bulletSpeed: 7, color: '#FF69B4', type: 'spread' }
};

// ==================== 事件监听器 ====================

// 键盘事件
document.addEventListener('keydown', (e) => {
    gameState.keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    gameState.keys[e.code] = false;
});

// 鼠标事件
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('click', () => {
    if (gameState.gameRunning) shoot();
});

// 空格键射击和防止滚动
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
    }
});

// ==================== 工具函数 ====================

// 计算两点间角度
function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

// 获取两点间距离
function getDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// 碰撞检测
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// ==================== 游戏对象创建函数 ====================

// 射击函数 - 恢复鼠标瞄准
function shoot() {
    if (player.shootCooldown <= 0) {
        const angle = getAngle(player.x, player.y, mouse.x, mouse.y); // 恢复鼠标瞄准
        
        if (player.weapon.type === 'spread') {
            // 散弹枪 - 发射多发子弹
            for (let i = -2; i <= 2; i++) {
                const spreadAngle = angle + (i * 0.3);
                createBullet(player.x, player.y, spreadAngle);
            }
        } else {
            createBullet(player.x, player.y, angle);
        }
        
        player.shootCooldown = player.weapon.fireRate;
    }
}

// 创建子弹
function createBullet(x, y, angle) {
    bullets.push({
        x: x,
        y: y,
        width: 6,
        height: 6,
        speed: player.weapon.bulletSpeed,
        angle: angle,
        damage: player.weapon.damage,
        color: player.weapon.color
    });
}

// 从屏幕边缘创建敌人
function createEnemy() {
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    let x, y;
    
    // 随机从四个边生成
    const side = Math.floor(Math.random() * 4);
    switch(side) {
        case 0: // 上边
            x = Math.random() * canvas.width;
            y = -type.size;
            break;
        case 1: // 右边
            x = canvas.width + type.size;
            y = Math.random() * canvas.height;
            break;
        case 2: // 下边
            x = Math.random() * canvas.width;
            y = canvas.height + type.size;
            break;
        case 3: // 左边
            x = -type.size;
            y = Math.random() * canvas.height;
            break;
    }
    
    enemies.push({
        x: x,
        y: y,
        width: type.size,
        height: type.size,
        speed: type.speed + (gameState.wave - 1) * 0.1,
        emoji: type.emoji,
        points: type.points,
        health: type.health,
        maxHealth: type.health,
        angle: 0
    });
}

// 创建道具
function createPowerUp(x, y) {
    const powerUpTypes = [
        { type: '❤️', name: '生命' },
        { type: '⚡', name: '速射' },
        { type: '💥', name: '重机枪' },
        { type: '🌟', name: '散弹' },
        { type: '🍖', name: '分数' }
    ];
    
    const powerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    powerUps.push({
        x: x,
        y: y,
        width: 25,
        height: 25,
        type: powerUp.type,
        name: powerUp.name,
        life: 300 // 5秒后消失
    });
}

// 创建粒子效果
function createParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 30,
            maxLife: 30,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

// ==================== 游戏逻辑更新 ====================

// 主更新函数
function update() {
    if (!gameState.gameRunning) return;

    updatePlayer();
    updateBullets();
    updateEnemies();
    updatePowerUps();
    updateParticles();
    handleCollisions();
    manageWaves();
    spawnEnemies();
    checkGameOver();
}

// 更新玩家
function updatePlayer() {
    // 玩家移动（八方向）
    let dx = 0, dy = 0;
    
    if (gameState.keys['KeyW'] || gameState.keys['ArrowUp']) dy -= 1;
    if (gameState.keys['KeyS'] || gameState.keys['ArrowDown']) dy += 1;
    if (gameState.keys['KeyA'] || gameState.keys['ArrowLeft']) dx -= 1;
    if (gameState.keys['KeyD'] || gameState.keys['ArrowRight']) dx += 1;
    
    // 归一化对角线移动（防止对角线移动过快）
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707; // √2/2 ≈ 0.707
        dy *= 0.707;
    }
    
    // 应用移动并限制在画布内
    player.x = Math.max(player.width/2, Math.min(canvas.width - player.width/2, player.x + dx * player.speed));
    player.y = Math.max(player.height/2, Math.min(canvas.height - player.height/2, player.y + dy * player.speed));

    // 玩家朝向鼠标（恢复鼠标瞄准）
    player.angle = getAngle(player.x, player.y, mouse.x, mouse.y);

    // 连射功能 - 按住空格键连续射击（保留这个好用的功能）
    if (gameState.keys['Space']) {
        shoot();
    }

    // 射击冷却
    if (player.shootCooldown > 0) player.shootCooldown--;
}

// 更新子弹
function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.x += Math.cos(bullet.angle) * bullet.speed;
        bullet.y += Math.sin(bullet.angle) * bullet.speed;
        
        // 移除超出屏幕的子弹
        return bullet.x > -10 && bullet.x < canvas.width + 10 && 
               bullet.y > -10 && bullet.y < canvas.height + 10;
    });
}

// 更新敌人（AI追踪）
function updateEnemies() {
    enemies.forEach(enemy => {
        const angle = getAngle(enemy.x, enemy.y, player.x, player.y);
        enemy.angle = angle;
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;
    });
}

// 更新道具
function updatePowerUps() {
    powerUps = powerUps.filter(powerUp => {
        powerUp.life--;
        return powerUp.life > 0;
    });
}

// 更新粒子
function updateParticles() {
    particles = particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.98; // 阻力
        particle.vy *= 0.98;
        particle.life--;
        return particle.life > 0;
    });
}

// ==================== 碰撞处理 ====================

function handleCollisions() {
    // 子弹击中敌人
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (checkCollision(bullet, enemy)) {
                enemy.health -= bullet.damage;
                bullets.splice(bulletIndex, 1);
                
                if (enemy.health <= 0) {
                    gameState.score += enemy.points;
                    gameState.kills++;
                    gameState.enemiesKilled++;
                    createParticles(enemy.x, enemy.y, '#FF6B6B', 12);
                    
                    // 随机掉落道具
                    if (Math.random() < 0.15) {
                        createPowerUp(enemy.x, enemy.y);
                    }
                    
                    enemies.splice(enemyIndex, 1);
                } else {
                    createParticles(enemy.x, enemy.y, '#FFA500', 6);
                }
            }
        });
    });

    // 玩家碰到敌人
    enemies.forEach((enemy, enemyIndex) => {
        if (checkCollision(player, enemy)) {
            gameState.lives--;
            createParticles(player.x, player.y, '#FF0000', 15);
            enemies.splice(enemyIndex, 1);
        }
    });

    // 玩家收集道具
    powerUps.forEach((powerUp, powerUpIndex) => {
        if (checkCollision(player, powerUp)) {
            handlePowerUp(powerUp);
            createParticles(powerUp.x, powerUp.y, '#00FF00', 10);
            powerUps.splice(powerUpIndex, 1);
        }
    });
}

// ==================== 道具效果处理 ====================

function handlePowerUp(powerUp) {
    switch (powerUp.type) {
        case '❤️':
            if (gameState.lives < 5) gameState.lives++;
            break;
        case '⚡':
            player.weapon = { ...weaponTypes.rapid };
            setTimeout(() => player.weapon = { ...weaponTypes.basic }, 10000);
            break;
        case '💥':
            player.weapon = { ...weaponTypes.heavy };
            setTimeout(() => player.weapon = { ...weaponTypes.basic }, 8000);
            break;
        case '🌟':
            player.weapon = { ...weaponTypes.spread };
            setTimeout(() => player.weapon = { ...weaponTypes.basic }, 12000);
            break;
        case '🍖':
            gameState.score += 100;
            break;
    }
}

// ==================== 波次管理 ====================

function manageWaves() {
    if (gameState.enemiesKilled >= gameState.enemiesThisWave && enemies.length === 0) {
        gameState.wave++;
        gameState.enemiesKilled = 0;
        gameState.enemiesThisWave += 5;
        gameState.waveComplete = true;
        setTimeout(() => gameState.waveComplete = false, 2000);
    }
}

function spawnEnemies() {
    if (enemies.length < Math.min(8 + gameState.wave, 15)) {
        if (Math.random() < 0.02 + gameState.wave * 0.002) {
            createEnemy();
        }
    }
}

function checkGameOver() {
    if (gameState.lives <= 0) {
        gameState.gameRunning = false;
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('finalScore').textContent = gameState.score;
        document.getElementById('finalKills').textContent = gameState.kills;
        document.getElementById('finalWave').textContent = gameState.wave;
    }
}

// ==================== 渲染函数 ====================

function draw() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawParticles();
    drawBullets();
    drawEnemies();
    drawPowerUps();
    drawPlayer();
    drawWaveComplete();
    updateUI();
}

function drawBackground() {
    // 绘制网格背景
    ctx.strokeStyle = '#1a4a1a';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawParticles() {
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / particle.maxLife;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.font = `${enemy.width}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.emoji, enemy.x, enemy.y);
        
        // 血条（如果受伤）
        if (enemy.health < enemy.maxHealth) {
            const barWidth = enemy.width;
            const barHeight = 4;
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.height/2 - 8, barWidth, barHeight);
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.height/2 - 8, 
                       (barWidth * enemy.health) / enemy.maxHealth, barHeight);
        }
    });
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 闪烁效果
        const alpha = 0.7 + 0.3 * Math.sin(Date.now() * 0.01);
        ctx.globalAlpha = alpha;
        ctx.fillText(powerUp.type, powerUp.x, powerUp.y);
        ctx.globalAlpha = 1;
    });
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    
    // 小猫身体
    ctx.font = '25px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐱', 0, 0);
    
    // 武器指示器
    ctx.fillStyle = player.weapon.color;
    ctx.fillRect(12, -2, 8, 4);
    
    ctx.restore();
}

function drawWaveComplete() {
    if (gameState.waveComplete) {
        ctx.font = '40px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText(`第 ${gameState.wave} 波完成！`, canvas.width/2, canvas.height/2);
    }
}

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('kills').textContent = gameState.kills;
    document.getElementById('lives').textContent = '❤️'.repeat(gameState.lives);
    document.getElementById('wave').textContent = gameState.wave;
    document.getElementById('weaponType').textContent = weaponTypes[player.weapon.type]?.name || player.weapon.name || '🔫 基础枪';
}

// ==================== 游戏控制 ====================

// 游戏循环
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 重新开始游戏
function restartGame() {
    gameState = {
        score: 0,
        lives: 3,
        wave: 1,
        kills: 0,
        gameRunning: true,
        keys: {},
        enemiesThisWave: 10,
        enemiesKilled: 0,
        waveComplete: false
    };
    
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.weapon = { ...weaponTypes.basic };
    player.shootCooldown = 0;
    
    bullets = [];
    enemies = [];
    powerUps = [];
    particles = [];
    
    document.getElementById('gameOver').style.display = 'none';
}

// ==================== 游戏启动 ====================

// 启动游戏
gameLoop();