/* ==================== 全局配置和状态管理 ==================== */

// 设备检测
const IS_MOBILE = (('ontouchstart' in window) ||
                  (navigator.maxTouchPoints > 0) ||
                  (navigator.msMaxTouchPoints > 0)) &&
                  window.innerWidth <= 768;

// 游戏状态枚举
const GAME_STATES = {
    MENU: 'menu',
    DIFFICULTY: 'difficulty',
    SETTINGS: 'settings',
    CONTROLS: 'controls',
    ABOUT: 'about',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

// 全局游戏状态
let currentState = GAME_STATES.MENU;
let currentDifficulty = 'normal';

// 游戏设置
let gameSettings = {
    quality: 'medium',
    sound: 'on',
    music: 'on',
    vibrate: 'on',
    showFPS: 'off'
};

// FPS计数器
let fpsCounter = {
    frames: 0,
    lastTime: performance.now(),
    fps: 60
};

/* ==================== 难度配置系统 ==================== */

const difficultyConfigs = {
    easy: {
        name: '简单',
        playerSpeed: IS_MOBILE ? 3.0 : 3.5,
        enemySpeedMultiplier: 0.7,
        enemySpawnRate: 0.012,
        maxEnemies: IS_MOBILE ? 4 : 6,
        enemiesPerWave: 4,
        powerUpRate: 0.25,
        playerLives: 5,
        damageMultiplier: 0.8
    },
    normal: {
        name: '普通',
        playerSpeed: IS_MOBILE ? 2.5 : 3.0,
        enemySpeedMultiplier: 1.0,
        enemySpawnRate: 0.020,
        maxEnemies: IS_MOBILE ? 6 : 8,
        enemiesPerWave: 6,
        powerUpRate: 0.15,
        playerLives: 3,
        damageMultiplier: 1.0
    },
    hard: {
        name: '困难',
        playerSpeed: IS_MOBILE ? 2.2 : 2.8,
        enemySpeedMultiplier: 1.3,
        enemySpawnRate: 0.030,
        maxEnemies: IS_MOBILE ? 8 : 12,
        enemiesPerWave: 8,
        powerUpRate: 0.10,
        playerLives: 2,
        damageMultiplier: 1.5
    },
    extreme: {
        name: '极限',
        playerSpeed: IS_MOBILE ? 2.0 : 2.5,
        enemySpeedMultiplier: 1.8,
        enemySpawnRate: 0.040,
        maxEnemies: IS_MOBILE ? 12 : 18,
        enemiesPerWave: 12,
        powerUpRate: 0.08,
        playerLives: 1,
        damageMultiplier: 2.0
    }
};

/* ==================== 菜单管理系统 ==================== */

function showMainMenu() {
    hideAllMenus();
    document.getElementById('mainMenu').style.display = 'flex';
    currentState = GAME_STATES.MENU;
    
    // 播放菜单音乐
    if (window.audioManager && gameSettings.music === 'on') {
        audioManager.playMusic('menu');
    }
}

function showDifficultySelect() {
    hideAllMenus();
    document.getElementById('difficultyMenu').style.display = 'flex';
    currentState = GAME_STATES.DIFFICULTY;
    
    // 播放按钮音效
    if (window.audioManager) {
        audioManager.playButtonClick();
    }
}

function showSettings() {
    hideAllMenus();
    document.getElementById('settingsMenu').style.display = 'flex';
    currentState = GAME_STATES.SETTINGS;
    loadSettings();
    
    // 播放按钮音效
    if (window.audioManager) {
        audioManager.playButtonClick();
    }
}

function showControls() {
    hideAllMenus();
    document.getElementById('controlsMenu').style.display = 'flex';
    currentState = GAME_STATES.CONTROLS;
    
    // 播放按钮音效
    if (window.audioManager) {
        audioManager.playButtonClick();
    }
    
    // 根据设备显示相应的控制说明
    const desktopSection = document.getElementById('desktopControlsSection');
    const mobileSection = document.getElementById('mobileControlsSection');
    
    if (IS_MOBILE) {
        desktopSection.style.display = 'none';
        mobileSection.style.display = 'block';
    } else {
        desktopSection.style.display = 'block';
        mobileSection.style.display = 'block';
    }
}

function showAbout() {
    hideAllMenus();
    document.getElementById('aboutMenu').style.display = 'flex';
    currentState = GAME_STATES.ABOUT;
    
    // 播放按钮音效
    if (window.audioManager) {
        audioManager.playButtonClick();
    }
}

function hideAllMenus() {
    const menus = ['mainMenu', 'difficultyMenu', 'settingsMenu', 'controlsMenu', 'aboutMenu', 'pauseMenu', 'gameOver'];
    menus.forEach(menuId => {
        document.getElementById(menuId).style.display = 'none';
    });
}

/* ==================== 游戏启动和难度设置 ==================== */

function startGame(difficulty) {
    currentDifficulty = difficulty;
    const config = difficultyConfigs[difficulty];
    
    // 播放按钮音效
    if (window.audioManager) {
        audioManager.playButtonClick();
    }
    
    // 应用难度设置
    applyDifficultySettings(config);
    
    // 切换到游戏界面
    hideAllMenus();
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.style.display = 'flex';
    gameContainer.classList.add('playing');
    document.getElementById('currentDifficulty').textContent = config.name;
    
    // 应用FPS设置
    const fpsCounter = document.getElementById('fpsCounter');
    fpsCounter.style.display = gameSettings.showFPS === 'on' ? 'block' : 'none';
    
    // 播放游戏背景音乐
    if (window.audioManager && gameSettings.music === 'on') {
        audioManager.playMusic('game');
    }
    
    // 初始化游戏
    initializeGame();
    currentState = GAME_STATES.PLAYING;
    
    console.log(`🎮 开始游戏 - ${config.name}难度`);
}

function applyDifficultySettings(config) {
    // 更新玩家设置
    player.speed = config.playerSpeed;
    player.maxLives = config.playerLives;
    
    // 更新游戏状态
    gameState.lives = config.playerLives;
    gameState.enemiesThisWave = config.enemiesPerWave;
    
    // 更新全局配置
    window.difficultyConfig = config;
}

/* ==================== 设置管理系统 ==================== */

function loadSettings() {
    document.getElementById('qualitySelect').value = gameSettings.quality;
    document.getElementById('soundSelect').value = gameSettings.sound;
    document.getElementById('musicSelect').value = gameSettings.music;
    document.getElementById('vibrateSelect').value = gameSettings.vibrate;
    document.getElementById('fpsSelect').value = gameSettings.showFPS;
}

function updateQuality() {
    gameSettings.quality = document.getElementById('qualitySelect').value;
    console.log('画质设置:', gameSettings.quality);
}

function updateSound() {
    gameSettings.sound = document.getElementById('soundSelect').value;
    if (window.audioManager) {
        audioManager.setEnabled(gameSettings.sound === 'on');
    }
    console.log('音效设置:', gameSettings.sound);
}

function updateMusic() {
    gameSettings.music = document.getElementById('musicSelect').value;
    if (window.audioManager) {
        audioManager.setMusicEnabled(gameSettings.music === 'on');
        
        // 根据当前状态播放相应音乐
        if (gameSettings.music === 'on') {
            if (currentState === GAME_STATES.PLAYING) {
                audioManager.playMusic('game');
            } else if (currentState === GAME_STATES.MENU || currentState === GAME_STATES.DIFFICULTY || 
                      currentState === GAME_STATES.SETTINGS || currentState === GAME_STATES.CONTROLS || 
                      currentState === GAME_STATES.ABOUT) {
                audioManager.playMusic('menu');
            }
        }
    }
    console.log('背景音乐:', gameSettings.music);
}

function updateVibrate() {
    gameSettings.vibrate = document.getElementById('vibrateSelect').value;
    console.log('震动设置:', gameSettings.vibrate);
}

function updateFPS() {
    gameSettings.showFPS = document.getElementById('fpsSelect').value;
    const fpsCounter = document.getElementById('fpsCounter');
    if (gameSettings.showFPS === 'on' && currentState === GAME_STATES.PLAYING) {
        fpsCounter.style.display = 'block';
    } else {
        fpsCounter.style.display = 'none';
    }
    console.log('FPS显示:', gameSettings.showFPS);
}

/* ==================== 游戏暂停系统 ==================== */

function pauseGame() {
    if (currentState === GAME_STATES.PLAYING) {
        currentState = GAME_STATES.PAUSED;
        document.getElementById('pauseMenu').style.display = 'flex';
        
        // 暂停背景音乐
        if (window.audioManager) {
            audioManager.pauseMusic();
        }
        
        console.log('⏸️ 游戏暂停');
    }
}

function resumeGame() {
    if (currentState === GAME_STATES.PAUSED) {
        currentState = GAME_STATES.PLAYING;
        document.getElementById('pauseMenu').style.display = 'none';
        
        // 恢复背景音乐
        if (window.audioManager && gameSettings.music === 'on') {
            audioManager.resumeMusic();
        }
        
        console.log('▶️ 游戏继续');
    }
}

function restartCurrentGame() {
    document.getElementById('pauseMenu').style.display = 'none';
    restartGame();
}

function exitToMenu() {
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.style.display = 'none';
    gameContainer.classList.remove('playing');
    document.getElementById('pauseMenu').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    showMainMenu();
    console.log('🏠 返回主菜单');
}

/* ==================== 设备界面设置 ==================== */

function setupDeviceInterface() {
    const platformBadge = document.getElementById('platformBadge');
    const mobileControls = document.getElementById('mobileControls');
    const mobileInstructions = document.getElementById('mobileInstructions');
    const desktopControls = document.getElementById('desktopControls');
    
    if (IS_MOBILE) {
        platformBadge.textContent = '手机版';
        mobileControls.style.display = 'flex';
        mobileInstructions.style.display = 'block';
        desktopControls.style.display = 'none';
        document.body.classList.add('mobile-mode');
    } else {
        platformBadge.textContent = '电脑版';
        mobileControls.style.display = 'none';
        mobileInstructions.style.display = 'none';
        desktopControls.style.display = 'block';
    }
}

/* ==================== 游戏核心系统 ==================== */

// 画布设置
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    if (IS_MOBILE) {
        const headerHeight = 50;
        const controlsHeight = window.innerHeight <= 600 ? 100 : 120;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - headerHeight - controlsHeight;
    } else {
        canvas.width = Math.min(window.innerWidth, 1200);
        canvas.height = window.innerHeight - 90;
    }
    
    if (typeof player !== 'undefined' && player.x) {
        player.x = canvas.width / 2;
        player.y = canvas.height / 2;
    }
    
    // 重新初始化星空背景以适应新尺寸
    if (typeof initStars !== 'undefined') {
        initStars();
    }
}

// 控制系统变量
let mouse = { x: 0, y: 0 };
let keys = {};
let joystick = {
    active: false,
    x: 0,
    y: 0,
    centerX: 40,
    centerY: 40
};
let touch = { shootButtonPressed: false };

// 游戏状态
let gameState = {
    score: 0,
    lives: 3,
    wave: 1,
    kills: 0,
    gameRunning: true,
    enemiesThisWave: 10,
    enemiesKilled: 0,
    waveComplete: false
};

// 游戏对象
const player = {
    x: 0,
    y: 0,
    width: IS_MOBILE ? 25 : 30,
    height: IS_MOBILE ? 25 : 30,
    speed: IS_MOBILE ? 2.5 : 3,
    maxLives: 3,
    shootCooldown: 0,
    angle: 0,
    weapon: {
        type: 'basic',
        damage: 1,
        fireRate: IS_MOBILE ? 6 : 8,
        bulletSpeed: IS_MOBILE ? 6 : 8
    }
};

let bullets = [];
let enemies = [];
let powerUps = [];
let particles = [];

// 配置数据
const enemyTypes = [
    { emoji: '👾', speed: IS_MOBILE ? 0.8 : 1.0, points: 10, health: 1, size: IS_MOBILE ? 22 : 25 },
    { emoji: '🤖', speed: IS_MOBILE ? 0.6 : 0.8, points: 20, health: 2, size: IS_MOBILE ? 26 : 30 },
    { emoji: '👹', speed: IS_MOBILE ? 1.0 : 1.2, points: 15, health: 1, size: IS_MOBILE ? 24 : 28 },
    { emoji: '🐶', speed: IS_MOBILE ? 1.3 : 1.8, points: 30, health: 1, size: IS_MOBILE ? 18 : 20 },
    { emoji: '😈', speed: IS_MOBILE ? 1.1 : 1.5, points: 25, health: 1, size: IS_MOBILE ? 20 : 22 }
];

const weaponTypes = {
    basic: { name: '🔫 基础枪', damage: 1, fireRate: IS_MOBILE ? 6 : 8, bulletSpeed: IS_MOBILE ? 6 : 8, color: '#FFD700', type: 'basic' },
    rapid: { name: '⚡ 速射枪', damage: 1, fireRate: 3, bulletSpeed: IS_MOBILE ? 8 : 10, color: '#00FFFF', type: 'rapid' },
    heavy: { name: '💥 重机枪', damage: 3, fireRate: IS_MOBILE ? 10 : 12, bulletSpeed: IS_MOBILE ? 5 : 6, color: '#FF4500', type: 'heavy' },
    spread: { name: '🌟 散弹枪', damage: 2, fireRate: IS_MOBILE ? 12 : 15, bulletSpeed: IS_MOBILE ? 6 : 7, color: '#FF69B4', type: 'spread' }
};

/* ==================== 事件监听器设置 ==================== */

function setupEventListeners() {
    if (IS_MOBILE) {
        setupMobileControls();
    } else {
        setupDesktopControls();
    }
    
    window.addEventListener('resize', resizeCanvas);
    
    // ESC键暂停游戏
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Escape' && currentState === GAME_STATES.PLAYING) {
            pauseGame();
        }
    });
}

function setupDesktopControls() {
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        if (e.code === 'Space') {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('click', () => {
        if (currentState === GAME_STATES.PLAYING) {
            shoot();
        }
    });
}

function setupMobileControls() {
    setupJoystickControls();
    setupTouchControls();
    
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
}

function setupJoystickControls() {
    const joystickContainer = document.getElementById('joystickContainer');
    const joystickStick = document.getElementById('joystickStick');

    function handleJoystickStart(e) {
        e.preventDefault();
        joystick.active = true;
        const rect = joystickContainer.getBoundingClientRect();
        joystick.centerX = rect.left + rect.width / 2;
        joystick.centerY = rect.top + rect.height / 2;
    }

    function handleJoystickMove(e) {
        if (!joystick.active) return;
        e.preventDefault();
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const deltaX = clientX - joystick.centerX;
        const deltaY = clientY - joystick.centerY;
        const distance = Math.min(35, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
        const angle = Math.atan2(deltaY, deltaX);
        
        joystick.x = Math.cos(angle) * distance / 35;
        joystick.y = Math.sin(angle) * distance / 35;
        
        joystickStick.style.left = `${40 + joystick.x * 20}px`;
        joystickStick.style.top = `${40 + joystick.y * 20}px`;
    }

    function handleJoystickEnd(e) {
        e.preventDefault();
        joystick.active = false;
        joystick.x = 0;
        joystick.y = 0;
        joystickStick.style.left = '50%';
        joystickStick.style.top = '50%';
    }

    joystickContainer.addEventListener('touchstart', handleJoystickStart);
    joystickContainer.addEventListener('touchmove', handleJoystickMove);
    joystickContainer.addEventListener('touchend', handleJoystickEnd);
}

function setupTouchControls() {
    const shootButton = document.getElementById('shootButton');

    shootButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touch.shootButtonPressed = true;
    });

    shootButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        touch.shootButtonPressed = false;
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (currentState === GAME_STATES.PLAYING) {
            const rect = canvas.getBoundingClientRect();
            const touchX = e.touches[0].clientX - rect.left;
            const touchY = e.touches[0].clientY - rect.top;
            shootTowards(touchX, touchY);
        }
    });
}

/* ==================== 工具函数 ==================== */

function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function triggerVibration(duration = 100) {
    if (gameSettings.vibrate === 'on' && navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

/* ==================== 射击系统 ==================== */

function shoot() {
    if (player.shootCooldown <= 0) {
        let angle;
        
        if (IS_MOBILE) {
            angle = player.angle;
        } else {
            angle = getAngle(player.x, player.y, mouse.x, mouse.y);
            player.angle = angle;
        }
        
        if (player.weapon.type === 'spread') {
            for (let i = -2; i <= 2; i++) {
                const spreadAngle = angle + (i * 0.3);
                createBullet(player.x, player.y, spreadAngle);
            }
        } else {
            createBullet(player.x, player.y, angle);
        }
        
        // 播放射击音效
        if (window.audioManager) {
            audioManager.playShoot(player.weapon.type);
        }
        
        player.shootCooldown = player.weapon.fireRate;
    }
}

function shootTowards(targetX, targetY) {
    if (player.shootCooldown <= 0) {
        const angle = getAngle(player.x, player.y, targetX, targetY);
        player.angle = angle;
        
        if (player.weapon.type === 'spread') {
            for (let i = -2; i <= 2; i++) {
                const spreadAngle = angle + (i * 0.3);
                createBullet(player.x, player.y, spreadAngle);
            }
        } else {
            createBullet(player.x, player.y, angle);
        }
        
        // 播放射击音效
        if (window.audioManager) {
            audioManager.playShoot(player.weapon.type);
        }
        
        player.shootCooldown = player.weapon.fireRate;
    }
}

function createBullet(x, y, angle) {
    bullets.push({
        x: x,
        y: y,
        width: IS_MOBILE ? 5 : 6,
        height: IS_MOBILE ? 5 : 6,
        speed: player.weapon.bulletSpeed,
        angle: angle,
        damage: player.weapon.damage,
        color: player.weapon.color
    });
}

/* ==================== 游戏对象创建 ==================== */

function createEnemy() {
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const config = window.difficultyConfig || difficultyConfigs.normal;
    let x, y;
    
    const side = Math.floor(Math.random() * 4);
    switch(side) {
        case 0: x = Math.random() * canvas.width; y = -type.size; break;
        case 1: x = canvas.width + type.size; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = canvas.height + type.size; break;
        case 3: x = -type.size; y = Math.random() * canvas.height; break;
    }
    
    enemies.push({
        x: x, y: y,
        width: type.size, height: type.size,
        speed: (type.speed * config.enemySpeedMultiplier) + (gameState.wave - 1) * (IS_MOBILE ? 0.08 : 0.1),
        emoji: type.emoji,
        points: type.points,
        health: Math.ceil(type.health * config.damageMultiplier),
        maxHealth: Math.ceil(type.health * config.damageMultiplier)
    });
}

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
        x: x, y: y,
        width: IS_MOBILE ? 20 : 25,
        height: IS_MOBILE ? 20 : 25,
        type: powerUp.type,
        name: powerUp.name,
        life: IS_MOBILE ? 500 : 600
    });
}

function createParticles(x, y, color, count = IS_MOBILE ? 6 : 8) {
    const maxParticles = gameSettings.quality === 'low' ? count / 2 : 
                        gameSettings.quality === 'high' ? count * 1.5 : count;
    
    for (let i = 0; i < maxParticles; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * (IS_MOBILE ? 6 : 8),
            vy: (Math.random() - 0.5) * (IS_MOBILE ? 6 : 8),
            life: IS_MOBILE ? 25 : 30,
            maxLife: IS_MOBILE ? 25 : 30,
            color: color,
            size: Math.random() * (IS_MOBILE ? 3 : 4) + (IS_MOBILE ? 1 : 2)
        });
    }
}

/* ==================== 游戏逻辑更新 ==================== */

function update() {
    if (currentState !== GAME_STATES.PLAYING || !gameState.gameRunning) return;

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

function updatePlayer() {
    let dx = 0, dy = 0;
    
    if (IS_MOBILE) {
        if (joystick.active || (Math.abs(joystick.x) > 0.1 || Math.abs(joystick.y) > 0.1)) {
            dx = joystick.x;
            dy = joystick.y;
        }
        
        if (touch.shootButtonPressed) {
            let nearestEnemy = null;
            let nearestDistance = Infinity;
            
            enemies.forEach(enemy => {
                const distance = getDistance(player.x, player.y, enemy.x, enemy.y);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestEnemy = enemy;
                }
            });
            
            if (nearestEnemy) {
                shootTowards(nearestEnemy.x, nearestEnemy.y);
            }
        }
    } else {
        if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
        
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        player.angle = getAngle(player.x, player.y, mouse.x, mouse.y);
        
        if (keys['Space']) {
            shoot();
        }
    }
    
    player.x = Math.max(player.width/2, Math.min(canvas.width - player.width/2, player.x + dx * player.speed));
    player.y = Math.max(player.height/2, Math.min(canvas.height - player.height/2, player.y + dy * player.speed));

    if (player.shootCooldown > 0) player.shootCooldown--;
}

function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.x += Math.cos(bullet.angle) * bullet.speed;
        bullet.y += Math.sin(bullet.angle) * bullet.speed;
        
        return bullet.x > -10 && bullet.x < canvas.width + 10 && 
               bullet.y > -10 && bullet.y < canvas.height + 10;
    });
}

function updateEnemies() {
    enemies.forEach(enemy => {
        const angle = getAngle(enemy.x, enemy.y, player.x, player.y);
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;
    });
}

function updatePowerUps() {
    powerUps = powerUps.filter(powerUp => {
        powerUp.life--;
        return powerUp.life > 0;
    });
}

function updateParticles() {
    particles = particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.96;
        particle.vy *= 0.96;
        particle.life--;
        return particle.life > 0;
    });
}

function handleCollisions() {
    const config = window.difficultyConfig || difficultyConfigs.normal;
    
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (checkCollision(bullet, enemy)) {
                enemy.health -= bullet.damage;
                bullets.splice(bulletIndex, 1);
                
                if (enemy.health <= 0) {
                    gameState.score += enemy.points;
                    gameState.kills++;
                    gameState.enemiesKilled++;
                    createParticles(enemy.x, enemy.y, '#FF6B6B');
                    triggerVibration(50);
                    
                    // 播放敌人死亡音效
                    if (window.audioManager) {
                        audioManager.playEnemyDeath();
                    }
                    
                    if (Math.random() < config.powerUpRate) {
                        createPowerUp(enemy.x, enemy.y);
                    }
                    
                    enemies.splice(enemyIndex, 1);
                } else {
                    createParticles(enemy.x, enemy.y, '#FFA500', IS_MOBILE ? 4 : 6);
                    
                    // 播放敌人受伤音效
                    if (window.audioManager) {
                        audioManager.playEnemyHit();
                    }
                }
            }
        });
    });

    enemies.forEach((enemy, enemyIndex) => {
        if (checkCollision(player, enemy)) {
            gameState.lives--;
            createParticles(player.x, player.y, '#FF0000', IS_MOBILE ? 10 : 15);
            triggerVibration(200);
            
            // 播放玩家受伤音效
            if (window.audioManager) {
                audioManager.playPlayerHurt();
            }
            
            enemies.splice(enemyIndex, 1);
        }
    });

    powerUps.forEach((powerUp, powerUpIndex) => {
        if (checkCollision(player, powerUp)) {
            handlePowerUp(powerUp);
            createParticles(powerUp.x, powerUp.y, '#00FF00', IS_MOBILE ? 6 : 10);
            triggerVibration(30);
            
            // 播放道具收集音效
            if (window.audioManager) {
                audioManager.playPowerUp();
            }
            
            powerUps.splice(powerUpIndex, 1);
        }
    });
}

function handlePowerUp(powerUp) {
    switch (powerUp.type) {
        case '❤️':
            if (gameState.lives < player.maxLives) gameState.lives++;
            break;
        case '⚡':
            player.weapon = { ...weaponTypes.rapid };
            setTimeout(() => player.weapon = { ...weaponTypes.basic }, IS_MOBILE ? 8000 : 10000);
            break;
        case '💥':
            player.weapon = { ...weaponTypes.heavy };
            setTimeout(() => player.weapon = { ...weaponTypes.basic }, IS_MOBILE ? 6000 : 8000);
            break;
        case '🌟':
            player.weapon = { ...weaponTypes.spread };
            setTimeout(() => player.weapon = { ...weaponTypes.basic }, IS_MOBILE ? 10000 : 12000);
            break;
        case '🍖':
            gameState.score += 100;
            break;
    }
}

function manageWaves() {
    if (gameState.enemiesKilled >= gameState.enemiesThisWave && enemies.length === 0) {
        gameState.wave++;
        gameState.enemiesKilled = 0;
        
        const config = window.difficultyConfig || difficultyConfigs.normal;
        // 每波只增加1-2个敌人，而不是30%
        gameState.enemiesThisWave += Math.floor(gameState.wave / 3) + 1;
        
        gameState.waveComplete = true;
        setTimeout(() => gameState.waveComplete = false, IS_MOBILE ? 1200 : 1500);
    }
}

function spawnEnemies() {
    const config = window.difficultyConfig || difficultyConfigs.normal;
    const maxEnemies = Math.min(config.maxEnemies + Math.floor(gameState.wave / 3), config.maxEnemies * 2);
    
    if (enemies.length < maxEnemies) {
        if (Math.random() < config.enemySpawnRate + gameState.wave * 0.001) {
            createEnemy();
        }
    }
}

function checkGameOver() {
    if (gameState.lives <= 0) {
        gameState.gameRunning = false;
        currentState = GAME_STATES.GAME_OVER;
        document.getElementById('gameOver').style.display = 'flex';
        document.getElementById('finalScore').textContent = gameState.score;
        document.getElementById('finalKills').textContent = gameState.kills;
        document.getElementById('finalWave').textContent = gameState.wave;
        document.getElementById('finalDifficulty').textContent = difficultyConfigs[currentDifficulty].name;
        console.log('💀 游戏结束');
    }
}

/* ==================== 渲染系统 ==================== */

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    
    if (currentState !== GAME_STATES.PLAYING) return;

    if (gameSettings.quality !== 'low') drawParticles();
    drawBullets();
    drawEnemies();
    drawPowerUps();
    drawPlayer();
    drawWaveComplete();
    updateUI();
    updateFPSCounter();
}

function drawBackground() {
    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0c1445');
    gradient.addColorStop(0.3, '#1e3c72');
    gradient.addColorStop(0.7, '#2a5298');
    gradient.addColorStop(1, '#0c1445');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 添加动态星空效果
    if (gameSettings.quality !== 'low') {
        drawStars();
    }
    
    // 绘制网格（简化版）
    if (gameSettings.quality === 'high') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        const gridSize = IS_MOBILE ? 60 : 50;
        
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    // 添加动态光效
    if (gameSettings.quality === 'high') {
        drawBackgroundEffects();
    }
}

// 星空背景效果
let stars = [];

function initStars() {
    stars = [];
    const starCount = IS_MOBILE ? 30 : 50;
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            brightness: Math.random() * 0.8 + 0.2,
            twinkleSpeed: Math.random() * 0.02 + 0.01
        });
    }
}

function drawStars() {
    stars.forEach(star => {
        // 闪烁效果
        star.brightness += (Math.random() - 0.5) * star.twinkleSpeed;
        star.brightness = Math.max(0.1, Math.min(1, star.brightness));
        
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加光晕
        if (star.brightness > 0.7) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(star.brightness - 0.7) * 0.3})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawBackgroundEffects() {
    const time = Date.now() * 0.001;
    
    // 动态光束效果
    ctx.save();
    ctx.globalAlpha = 0.1;
    
    for (let i = 0; i < 3; i++) {
        const angle = time * 0.5 + i * Math.PI * 2 / 3;
        const centerX = canvas.width / 2 + Math.cos(angle) * 100;
        const centerY = canvas.height / 2 + Math.sin(angle) * 100;
        
        const lightGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 150);
        lightGradient.addColorStop(0, 'rgba(100, 200, 255, 0.3)');
        lightGradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.1)');
        lightGradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
        
        ctx.fillStyle = lightGradient;
        ctx.fillRect(centerX - 150, centerY - 150, 300, 300);
    }
    
    ctx.restore();
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
        
        if (gameSettings.quality === 'high' && !IS_MOBILE) {
            ctx.shadowColor = bullet.color;
            ctx.shadowBlur = 8;
        }
        
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, IS_MOBILE ? 3 : 4, 0, Math.PI * 2);
        ctx.fill();
        
        if (gameSettings.quality === 'high' && !IS_MOBILE) {
            ctx.shadowBlur = 0;
        }
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.font = `${enemy.width}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.emoji, enemy.x, enemy.y);
        
        if (enemy.health < enemy.maxHealth) {
            const barWidth = enemy.width;
            const barHeight = IS_MOBILE ? 3 : 4;
            const yOffset = IS_MOBILE ? 6 : 8;
            
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.height/2 - yOffset, barWidth, barHeight);
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(enemy.x - barWidth/2, enemy.y - enemy.height/2 - yOffset, 
                        (barWidth * enemy.health) / enemy.maxHealth, barHeight);
        }
    });
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.font = `${IS_MOBILE ? 16 : 20}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const alpha = 0.7 + 0.3 * Math.sin(Date.now() * 0.008);
        ctx.globalAlpha = alpha;
        ctx.fillText(powerUp.type, powerUp.x, powerUp.y);
        ctx.globalAlpha = 1;
    });
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    
    ctx.font = `${IS_MOBILE ? 20 : 25}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐱', 0, 0);
    
    ctx.fillStyle = player.weapon.color;
    const weaponLength = IS_MOBILE ? 6 : 8;
    const weaponWidth = IS_MOBILE ? 2 : 4;
    ctx.fillRect(IS_MOBILE ? 10 : 12, -weaponWidth/2, weaponLength, weaponWidth);
    
    ctx.restore();
}

function drawWaveComplete() {
    if (gameState.waveComplete) {
        const fontSize = IS_MOBILE ? 28 : 40;
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        
        const text = `第 ${gameState.wave} 波完成！`;
        ctx.strokeText(text, canvas.width/2, canvas.height/2);
        ctx.fillText(text, canvas.width/2, canvas.height/2);
    }
}

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('kills').textContent = gameState.kills;
    document.getElementById('lives').textContent = gameState.lives;
    document.getElementById('wave').textContent = gameState.wave;
    
    const weaponName = weaponTypes[player.weapon.type]?.name || player.weapon.name || '🔫 基础枪';
    document.getElementById('weaponType').textContent = weaponName;
}

function updateFPSCounter() {
    if (gameSettings.showFPS === 'on') {
        fpsCounter.frames++;
        const currentTime = performance.now();
        
        if (currentTime >= fpsCounter.lastTime + 1000) {
            fpsCounter.fps = Math.round((fpsCounter.frames * 1000) / (currentTime - fpsCounter.lastTime));
            fpsCounter.frames = 0;
            fpsCounter.lastTime = currentTime;
            document.getElementById('fpsValue').textContent = fpsCounter.fps;
        }
    }
}

/* ==================== 游戏管理函数 ==================== */

function initializeGame() {
    gameState = {
        score: 0,
        lives: window.difficultyConfig?.playerLives || 3,
        wave: 1,
        kills: 0,
        gameRunning: true,
        enemiesThisWave: window.difficultyConfig?.enemiesPerWave || 6,
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
    
    // 初始化星空背景
    initStars();
    
    console.log('🎮 游戏初始化完成');
}

function restartGame() {
    if (currentDifficulty) {
        startGame(currentDifficulty);
    } else {
        showDifficultySelect();
    }
}

/* ==================== 游戏主循环 ==================== */

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

/* ==================== 初始化系统 ==================== */

async function initializeApp() {
    console.log('🚀 初始化小猫战场...');
    
    setupDeviceInterface();
    resizeCanvas();
    setupEventListeners();
    
    // 初始化星空背景
    initStars();
    
    // 初始化音效系统
    if (window.audioManager) {
        await audioManager.initialize();
        
        // 添加用户交互监听以恢复音频上下文（移动端需要）
        document.addEventListener('click', () => {
            audioManager.resumeAudioContext();
        }, { once: true });
        
        document.addEventListener('touchstart', () => {
            audioManager.resumeAudioContext();
        }, { once: true });
    }
    
    // 显示主菜单
    showMainMenu();
    
    console.log(`✅ 初始化完成 - ${IS_MOBILE ? '手机' : '电脑'}模式`);
    console.log(`📱 画布尺寸: ${canvas.width} x ${canvas.height}`);
}

// 页面加载完成后启动
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    gameLoop();
});