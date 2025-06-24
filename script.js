/* ==================== 全局配置和状态管理 ==================== */

// 修复后的设备检测
function detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // iOS设备检测
    const isIOS = /ipad|iphone|ipod/.test(userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Android设备检测
    const isAndroid = /android/.test(userAgent);
    
    // iPad检测（更精确的方法）
    const isIPad = /ipad/.test(userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                   (isIOS && Math.min(screenWidth, screenHeight) >= 768);
    
    // iPhone检测
    const isIPhone = /iphone/.test(userAgent) && !isIPad;
    
    // Android平板检测
    const isAndroidTablet = isAndroid && !/mobile/.test(userAgent) && 
                           Math.min(screenWidth, screenHeight) >= 600;
    
    // 综合平板判断
    const isTablet = isIPad || isAndroidTablet;
    
    // 手机判断（修复后的逻辑）
    const isPhone = (isIPhone || 
                    (isAndroid && /mobile/.test(userAgent)) ||
                    (hasTouch && !isTablet && Math.min(screenWidth, screenHeight) < 768));
    
    // 移动设备总判断
    const isMobile = hasTouch && (isPhone || isTablet);
    
    // 调试信息
    console.log('🔍 详细设备检测:', {
        userAgent: userAgent,
        hasTouch: hasTouch,
        screenSize: `${screenWidth}x${screenHeight}`,
        isIOS: isIOS,
        isAndroid: isAndroid,
        isIPad: isIPad,
        isIPhone: isIPhone,
        isAndroidTablet: isAndroidTablet,
        isTablet: isTablet,
        isPhone: isPhone,
        isMobile: isMobile
    });
    
    return {
        isDesktop: !isMobile,
        isMobile: isMobile,
        isPhone: isPhone,
        isTablet: isTablet,
        isIPad: isIPad,
        isIOS: isIOS,
        isAndroid: isAndroid,
        hasTouch: hasTouch,
        screenWidth: screenWidth,
        screenHeight: screenHeight
    };
}

// 获取设备信息
const deviceInfo = detectDevice();
const IS_MOBILE = deviceInfo.isMobile;
const IS_TABLET = deviceInfo.isTablet;
const IS_IPAD = deviceInfo.isIPad;
const IS_PHONE = deviceInfo.isPhone;

// 打印设备信息用于调试
console.log('🔍 设备检测结果:', deviceInfo);

// 根据设备类型调整游戏参数
function getDeviceSpecificSettings() {
    if (IS_IPAD) {
        return {
            playerSize: 35,
            enemySize: 28,
            bulletSize: 6,
            uiScale: 1.2,
            controlsHeight: 140, // 增加控制区域高度
            joystickSize: 100,   // 增大摇杆
            shootButtonSize: 100 // 增大射击按钮
        };
    } else if (IS_PHONE) {
        return {
            playerSize: 25,
            enemySize: 22,
            bulletSize: 5,
            uiScale: 1.0,
            controlsHeight: 130, // 稍微增加高度
            joystickSize: 85,    // 适中的摇杆大小
            shootButtonSize: 85  // 适中的射击按钮
        };
    } else {
        return {
            playerSize: 30,
            enemySize: 25,
            bulletSize: 6,
            uiScale: 1.0,
            controlsHeight: 0,
            joystickSize: 0,
            shootButtonSize: 0
        };
    }
}

const deviceSettings = getDeviceSpecificSettings();

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

/* ==================== 修固后的难度配置系统 ==================== */

const difficultyConfigs = {
    easy: {
        name: '简单',
        playerSpeed: IS_IPAD ? 3.2 : (IS_PHONE ? 3.0 : 3.5),
        enemySpeedMultiplier: 0.7,
        enemySpawnRate: 0.08,  // 提高生成速率
        maxEnemies: IS_IPAD ? 4 : (IS_PHONE ? 3 : 5),
        enemiesPerWave: 8,     // 设定每波敌人总数
        powerUpRate: 0.25,
        playerLives: 5,
        damageMultiplier: 0.8,
        spawnInterval: 90      // 敌人生成间隔（帧数）
    },
    normal: {
        name: '普通',
        playerSpeed: IS_IPAD ? 2.8 : (IS_PHONE ? 2.5 : 3.0),
        enemySpeedMultiplier: 1.0,
        enemySpawnRate: 0.12,  // 提高生成速率
        maxEnemies: IS_IPAD ? 5 : (IS_PHONE ? 4 : 6),
        enemiesPerWave: 12,    // 设定每波敌人总数
        powerUpRate: 0.15,
        playerLives: 3,
        damageMultiplier: 1.0,
        spawnInterval: 75      // 敌人生成间隔（帧数）
    },
    hard: {
        name: '困难',
        playerSpeed: IS_IPAD ? 2.5 : (IS_PHONE ? 2.2 : 2.8),
        enemySpeedMultiplier: 1.3,
        enemySpawnRate: 0.15,  // 提高生成速率
        maxEnemies: IS_IPAD ? 6 : (IS_PHONE ? 5 : 8),
        enemiesPerWave: 18,    // 设定每波敌人总数
        powerUpRate: 0.10,
        playerLives: 2,
        damageMultiplier: 1.5,
        spawnInterval: 60      // 敌人生成间隔（帧数）
    },
    extreme: {
        name: '极限',
        playerSpeed: IS_IPAD ? 2.3 : (IS_PHONE ? 2.0 : 2.5),
        enemySpeedMultiplier: 1.8,
        enemySpawnRate: 0.20,  // 提高生成速率
        maxEnemies: IS_IPAD ? 8 : (IS_PHONE ? 6 : 10),
        enemiesPerWave: 25,    // 设定每波敌人总数
        powerUpRate: 0.08,
        playerLives: 1,
        damageMultiplier: 2.0,
        spawnInterval: 45      // 敌人生成间隔（帧数）
    }
};

/* ==================== 新增：波次管理系统 ==================== */

// 波次管理状态
let waveManager = {
    enemiesSpawned: 0,     // 当前波次已生成的敌人数量
    enemiesKilled: 0,      // 当前波次已击杀的敌人数量
    lastSpawnTime: 0,      // 上次生成敌人的时间
    waveActive: false,     // 当前波次是否激活
    nextWaveDelay: 0,      // 下一波开始的延迟
    forceSpawnTimer: 0     // 强制生成计时器
};

// 初始化游戏时重置波次管理器
function initializeWaveManager() {
    const config = window.difficultyConfig || difficultyConfigs.normal;
    waveManager = {
        enemiesSpawned: 0,
        enemiesKilled: 0,
        lastSpawnTime: 0,
        waveActive: true,
        nextWaveDelay: 0,
        forceSpawnTimer: 0
    };
    
    gameState.enemiesThisWave = config.enemiesPerWave;
    gameState.enemiesKilled = 0;
    
    console.log(`🌊 波次管理器初始化 - 第${gameState.wave}波需击杀${gameState.enemiesThisWave}个敌人`);
}

// 修改敌人死亡处理（在碰撞检测中调用）
function onEnemyKilled() {
    waveManager.enemiesKilled++;
    gameState.kills++;
    
    console.log(`💀 敌人被击杀 (${waveManager.enemiesKilled}/${gameState.enemiesThisWave})`);
}

// 开始下一波
function startNextWave() {
    gameState.wave++;
    gameState.waveComplete = false;
    
    const config = window.difficultyConfig || difficultyConfigs.normal;
    
    // 计算下一波的敌人数量（每3波增加一些敌人）
    const baseEnemies = config.enemiesPerWave;
    const additionalEnemies = Math.floor((gameState.wave - 1) / 3) * 2;
    gameState.enemiesThisWave = baseEnemies + additionalEnemies;
    
    // 重置波次管理器
    waveManager = {
        enemiesSpawned: 0,
        enemiesKilled: 0,
        lastSpawnTime: Date.now(),
        waveActive: true,
        nextWaveDelay: 0,
        forceSpawnTimer: 0
    };
    
    console.log(`🌊 开始第${gameState.wave}波 - 需击杀 ${gameState.enemiesThisWave} 个敌人`);
    
    // 立即生成第一个敌人
    if (enemies.length === 0) {
        createEnemy();
        waveManager.enemiesSpawned++;
        waveManager.lastSpawnTime = Date.now();
    }
}

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

/* ==================== 修复后的设备界面设置 ==================== */

function setupDeviceInterface() {
    const platformBadge = document.getElementById('platformBadge');
    const mobileControls = document.getElementById('mobileControls');
    const mobileInstructions = document.getElementById('mobileInstructions');
    const desktopControls = document.getElementById('desktopControls');
    
    if (IS_IPAD) {
        platformBadge.textContent = 'iPad版';
        mobileControls.style.display = 'flex';
        mobileInstructions.style.display = 'block';
        desktopControls.style.display = 'none';
        document.body.classList.add('mobile-mode', 'tablet-mode');
        
        // iPad特殊调整
        mobileControls.style.height = deviceSettings.controlsHeight + 'px';
        console.log('🍎 iPad 模式已启用 - 控制高度:', deviceSettings.controlsHeight);
        
    } else if (IS_PHONE) {
        platformBadge.textContent = '手机版';
        mobileControls.style.display = 'flex';
        mobileInstructions.style.display = 'block';
        desktopControls.style.display = 'none';
        document.body.classList.add('mobile-mode', 'phone-mode');
        
        // 手机特殊调整
        mobileControls.style.height = deviceSettings.controlsHeight + 'px';
        console.log('📱 手机模式已启用 - 控制高度:', deviceSettings.controlsHeight);
        
    } else {
        platformBadge.textContent = '电脑版';
        mobileControls.style.display = 'none';
        mobileInstructions.style.display = 'none';
        desktopControls.style.display = 'block';
        console.log('🖥️ 电脑模式已启用');
    }
    
    // 调整摇杆和射击按钮大小
    if (IS_MOBILE) {
        const joystickContainer = document.getElementById('joystickContainer');
        const shootButton = document.getElementById('shootButton');
        
        if (joystickContainer) {
            joystickContainer.style.width = deviceSettings.joystickSize + 'px';
            joystickContainer.style.height = deviceSettings.joystickSize + 'px';
        }
        
        if (shootButton) {
            shootButton.style.width = deviceSettings.shootButtonSize + 'px';
            shootButton.style.height = deviceSettings.shootButtonSize + 'px';
            shootButton.style.fontSize = (deviceSettings.shootButtonSize * 0.3) + 'px';
        }
        
        console.log('📐 控制元素大小已调整:', {
            摇杆: deviceSettings.joystickSize,
            射击按钮: deviceSettings.shootButtonSize,
            控制区高度: deviceSettings.controlsHeight
        });
    }
}

/* ==================== 游戏核心系统 ==================== */

// 画布设置
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    if (IS_MOBILE) {
        const headerHeight = 50;
        const controlsHeight = deviceSettings.controlsHeight;
        const instructionsHeight = IS_MOBILE ? 30 : 0; // 指令文字的高度
        const totalUIHeight = headerHeight + controlsHeight + instructionsHeight;
        const availableHeight = window.innerHeight - totalUIHeight;
        
        canvas.width = window.innerWidth;
        canvas.height = Math.max(availableHeight, 300); // 确保最小高度
        
        console.log('📱 移动端画布调整:', {
            屏幕高度: window.innerHeight,
            头部高度: headerHeight,
            控制高度: controlsHeight,
            指令高度: instructionsHeight,
            可用高度: availableHeight,
            实际画布高度: canvas.height
        });
    } else {
        const maxWidth = Math.min(window.innerWidth, 1200);
        const availableHeight = window.innerHeight - 90;
        
        canvas.width = maxWidth;
        canvas.height = Math.max(availableHeight, 400); // 确保最小高度
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
    centerX: deviceSettings.joystickSize / 2,
    centerY: deviceSettings.joystickSize / 2
};
let touch = { shootButtonPressed: false };

// 触摸ID追踪（修复触摸冲突）
let joystickTouchId = null;
let shootButtonTouchId = null;

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
    width: deviceSettings.playerSize,
    height: deviceSettings.playerSize,
    speed: IS_IPAD ? 2.8 : (IS_PHONE ? 2.5 : 3),
    maxLives: 3,
    shootCooldown: 0,
    angle: 0,
    weapon: {
        type: 'basic',
        damage: 1,
        fireRate: IS_IPAD ? 7 : (IS_PHONE ? 6 : 8),
        bulletSpeed: IS_IPAD ? 7 : (IS_PHONE ? 6 : 8)
    }
};

let bullets = [];
let enemies = [];
let powerUps = [];
let particles = [];

// 配置数据
const enemyTypes = [
    { emoji: '👾', speed: IS_IPAD ? 0.9 : (IS_PHONE ? 0.8 : 1.0), points: 10, health: 1, size: deviceSettings.enemySize },
    { emoji: '🤖', speed: IS_IPAD ? 0.7 : (IS_PHONE ? 0.6 : 0.8), points: 20, health: 2, size: deviceSettings.enemySize + 2 },
    { emoji: '👹', speed: IS_IPAD ? 1.1 : (IS_PHONE ? 1.0 : 1.2), points: 15, health: 1, size: deviceSettings.enemySize + 1 },
    { emoji: '🐶', speed: IS_IPAD ? 1.5 : (IS_PHONE ? 1.3 : 1.8), points: 30, health: 1, size: deviceSettings.enemySize - 2 },
    { emoji: '😈', speed: IS_IPAD ? 1.3 : (IS_PHONE ? 1.1 : 1.5), points: 25, health: 1, size: deviceSettings.enemySize - 1 }
];

const weaponTypes = {
    basic: { 
        name: '🔫 基础枪', 
        damage: 1, 
        fireRate: IS_IPAD ? 7 : (IS_PHONE ? 6 : 8), 
        bulletSpeed: IS_IPAD ? 7 : (IS_PHONE ? 6 : 8), 
        color: '#FFD700', 
        type: 'basic' 
    },
    rapid: { 
        name: '⚡ 速射枪', 
        damage: 1, 
        fireRate: 3, 
        bulletSpeed: IS_IPAD ? 9 : (IS_PHONE ? 8 : 10), 
        color: '#00FFFF', 
        type: 'rapid' 
    },
    heavy: { 
        name: '💥 重机枪', 
        damage: 3, 
        fireRate: IS_IPAD ? 11 : (IS_PHONE ? 10 : 12), 
        bulletSpeed: IS_IPAD ? 6 : (IS_PHONE ? 5 : 6), 
        color: '#FF4500', 
        type: 'heavy' 
    },
    spread: { 
        name: '🌟 散弹枪', 
        damage: 2, 
        fireRate: IS_IPAD ? 14 : (IS_PHONE ? 12 : 15), 
        bulletSpeed: IS_IPAD ? 7 : (IS_PHONE ? 6 : 7), 
        color: '#FF69B4', 
        type: 'spread' 
    }
};

/* ==================== 修复后的事件监听器设置 ==================== */

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
        
        // 调试模式：按 'I' 键查看波次信息
        if (e.code === 'KeyI' && currentState === GAME_STATES.PLAYING) {
            console.log('🔍 当前波次状态:');
            console.log(`波次: ${gameState.wave}`);
            console.log(`击杀进度: ${waveManager.enemiesKilled}/${gameState.enemiesThisWave}`);
            console.log(`生成进度: ${waveManager.enemiesSpawned}/${gameState.enemiesThisWave}`);
            console.log(`场上敌人: ${enemies.length}`);
            console.log(`波次激活: ${waveManager.waveActive}`);
        }
        
        // 调试模式：按 'K' 键快速击杀所有敌人（测试用）
        if (e.code === 'KeyK' && currentState === GAME_STATES.PLAYING) {
            enemies.forEach(enemy => {
                gameState.score += enemy.points;
                onEnemyKilled();
                createParticles(enemy.x, enemy.y, '#FF6B6B');
            });
            enemies = [];
            console.log('💀 已清理所有敌人（调试模式）');
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
    // 🔧 修复：只在游戏进行中阻止滚动，菜单中允许正常点击
    setupGameTouchPrevention();
    setupJoystickControls();
    setupTouchControls();
}

// 🔧 新增：更智能的触摸事件阻止逻辑
function setupGameTouchPrevention() {
    // 只在游戏进行中阻止页面滚动
    document.addEventListener('touchmove', (e) => {
        // 只在游戏进行时阻止滚动
        if (currentState === GAME_STATES.PLAYING) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // 防止双指缩放（但允许单指点击）
    document.addEventListener('touchstart', (e) => {
        // 只阻止多点触摸的缩放，保留单点触摸的按钮点击
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // 只在游戏中防止文本选择
    document.addEventListener('selectstart', (e) => {
        if (currentState === GAME_STATES.PLAYING) {
            e.preventDefault();
        }
    });
    
    console.log('📱 智能触摸事件管理已设置');
}

function setupJoystickControls() {
    const joystickContainer = document.getElementById('joystickContainer');
    const joystickStick = document.getElementById('joystickStick');

    function handleJoystickStart(e) {
        // 只在游戏中处理摇杆
        if (currentState !== GAME_STATES.PLAYING) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // 确保这是摇杆区域的触摸
        const rect = joystickContainer.getBoundingClientRect();
        const touch = e.touches[0];
        
        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            
            joystickTouchId = touch.identifier;
            joystick.active = true;
            joystick.centerX = rect.left + rect.width / 2;
            joystick.centerY = rect.top + rect.height / 2;
            
            console.log('🕹️ 摇杆激活');
        }
    }

    function handleJoystickMove(e) {
        // 只在游戏中阻止事件传播
        if (currentState === GAME_STATES.PLAYING) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        if (!joystick.active || joystickTouchId === null) return;
        
        // 查找对应的触摸点
        let targetTouch = null;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === joystickTouchId) {
                targetTouch = e.touches[i];
                break;
            }
        }
        
        if (!targetTouch) return;
        
        const deltaX = targetTouch.clientX - joystick.centerX;
        const deltaY = targetTouch.clientY - joystick.centerY;
        const maxDistance = 40; // 摇杆最大移动距离
        const distance = Math.min(maxDistance, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
        const angle = Math.atan2(deltaY, deltaX);
        
        joystick.x = Math.cos(angle) * distance / maxDistance;
        joystick.y = Math.sin(angle) * distance / maxDistance;
        
        // 更新摇杆显示位置
        const stickX = 50 + (joystick.x * 20); // 20是可视化偏移量
        const stickY = 50 + (joystick.y * 20);
        joystickStick.style.left = `${stickX}%`;
        joystickStick.style.top = `${stickY}%`;
    }

    function handleJoystickEnd(e) {
        // 只在游戏中处理摇杆结束
        if (currentState !== GAME_STATES.PLAYING) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // 检查是否是摇杆的触摸结束
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joystickTouchId) {
                joystickTouchId = null;
                joystick.active = false;
                joystick.x = 0;
                joystick.y = 0;
                joystickStick.style.left = '50%';
                joystickStick.style.top = '50%';
                console.log('🕹️ 摇杆释放');
                break;
            }
        }
    }

    if (joystickContainer) {
        joystickContainer.addEventListener('touchstart', handleJoystickStart, { passive: false });
        document.addEventListener('touchmove', handleJoystickMove, { passive: false });
        document.addEventListener('touchend', handleJoystickEnd, { passive: false });
        document.addEventListener('touchcancel', handleJoystickEnd, { passive: false });
    }
}

function setupTouchControls() {
    const shootButton = document.getElementById('shootButton');

    function handleShootStart(e) {
        // 只在游戏中处理射击
        if (currentState !== GAME_STATES.PLAYING) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const rect = shootButton.getBoundingClientRect();
        const touch = e.touches[0];
        
        // 确保触摸在射击按钮范围内
        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            
            shootButtonTouchId = touch.identifier;
            touch.shootButtonPressed = true;
            shootButton.classList.add('active');
            
            console.log('🔥 射击按钮激活');
        }
    }

    function handleShootEnd(e) {
        // 只在游戏中处理射击结束
        if (currentState !== GAME_STATES.PLAYING) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // 检查是否是射击按钮的触摸结束
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === shootButtonTouchId) {
                shootButtonTouchId = null;
                touch.shootButtonPressed = false;
                shootButton.classList.remove('active');
                console.log('🔥 射击按钮释放');
                break;
            }
        }
    }

    if (shootButton) {
        shootButton.addEventListener('touchstart', handleShootStart, { passive: false });
        document.addEventListener('touchend', handleShootEnd, { passive: false });
        document.addEventListener('touchcancel', handleShootEnd, { passive: false });
    }

    // 画布点击射击（独立处理）
    if (canvas) {
        canvas.addEventListener('touchstart', (e) => {
            // 只在游戏中处理画布触摸
            if (currentState !== GAME_STATES.PLAYING) return;
            
            e.preventDefault();
            
            // 只处理不是摇杆和射击按钮的触摸
            const touch = e.touches[0];
            const joystickContainer = document.getElementById('joystickContainer');
            const shootButton = document.getElementById('shootButton');
            
            if (joystickContainer && shootButton) {
                const joystickRect = joystickContainer.getBoundingClientRect();
                const shootRect = shootButton.getBoundingClientRect();
                
                const isJoystickTouch = touch.clientX >= joystickRect.left && touch.clientX <= joystickRect.right &&
                                      touch.clientY >= joystickRect.top && touch.clientY <= joystickRect.bottom;
                
                const isShootTouch = touch.clientX >= shootRect.left && touch.clientX <= shootRect.right &&
                                    touch.clientY >= shootRect.top && touch.clientY <= shootRect.bottom;
                
                if (!isJoystickTouch && !isShootTouch) {
                    const rect = canvas.getBoundingClientRect();
                    const touchX = touch.clientX - rect.left;
                    const touchY = touch.clientY - rect.top;
                    shootTowards(touchX, touchY);
                    console.log('🎯 画布点击射击');
                }
            }
        }, { passive: false });
    }
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
        width: deviceSettings.bulletSize,
        height: deviceSettings.bulletSize,
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

/* ==================== 修复后的游戏逻辑更新 ==================== */

function update() {
    if (currentState !== GAME_STATES.PLAYING || !gameState.gameRunning) return;

    updatePlayer();
    updateBullets();
    updateEnemies();
    updatePowerUps();
    updateParticles();
    handleCollisions();
    
    // 使用新的波次管理系统
    manageWaves();
    spawnEnemies();
    
    checkGameOver();
}

function updatePlayer() {
    let dx = 0, dy = 0;
    
    if (IS_MOBILE) {
        // 摇杆控制移动
        if (joystick.active || (Math.abs(joystick.x) > 0.1 || Math.abs(joystick.y) > 0.1)) {
            dx = joystick.x;
            dy = joystick.y;
        }
        
        // 射击按钮自动瞄准
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
        // 电脑版控制保持不变
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
    
    // 应用移动
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

// 修复后的碰撞检测系统
function handleCollisions() {
    const config = window.difficultyConfig || difficultyConfigs.normal;
    
    // 子弹与敌人的碰撞
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (checkCollision(bullet, enemy)) {
                enemy.health -= bullet.damage;
                bullets.splice(bulletIndex, 1);
                
                if (enemy.health <= 0) {
                    gameState.score += enemy.points;
                    onEnemyKilled(); // 调用新的击杀处理函数
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

    // 玩家与敌人的碰撞
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
            // 注意：这里敌人消失但不算击杀，不调用 onEnemyKilled()
        }
    });

    // 玩家与道具的碰撞
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

// 修复后的波次管理函数
function manageWaves() {
    // 检查当前波次是否完成
    const allEnemiesSpawned = waveManager.enemiesSpawned >= gameState.enemiesThisWave;
    const allEnemiesKilled = waveManager.enemiesKilled >= gameState.enemiesThisWave;
    const noEnemiesLeft = enemies.length === 0;
    
    // 波次完成条件：所有应该生成的敌人都已生成，并且都被击杀，场上没有敌人
    if (allEnemiesSpawned && allEnemiesKilled && noEnemiesLeft && waveManager.waveActive) {
        console.log(`🎉 第${gameState.wave}波完成！击杀: ${waveManager.enemiesKilled}/${gameState.enemiesThisWave}`);
        
        // 标记波次完成
        waveManager.waveActive = false;
        gameState.waveComplete = true;
        waveManager.nextWaveDelay = IS_MOBILE ? 120 : 150; // 2-2.5秒延迟
        
        // 播放波次完成音效
        if (window.audioManager) {
            audioManager.playWaveComplete();
        }
        
        // 奖励分数
        gameState.score += gameState.wave * 50;
    }
    
    // 处理下一波开始
    if (!waveManager.waveActive && waveManager.nextWaveDelay > 0) {
        waveManager.nextWaveDelay--;
        
        if (waveManager.nextWaveDelay === 0) {
            startNextWave();
        }
    }
}

// 修复后的敌人生成函数
function spawnEnemies() {
    const config = window.difficultyConfig || difficultyConfigs.normal;
    const currentTime = Date.now();
    
    // 检查是否还需要生成敌人
    const needMoreEnemies = waveManager.enemiesSpawned < gameState.enemiesThisWave;
    const canSpawnMore = enemies.length < config.maxEnemies;
    const timePassed = currentTime - waveManager.lastSpawnTime > (config.spawnInterval * 16.67); // 转换为毫秒
    
    // 强制生成机制：如果太久没有敌人，强制生成
    if (enemies.length === 0 && needMoreEnemies) {
        waveManager.forceSpawnTimer++;
        if (waveManager.forceSpawnTimer > 60) { // 1秒后强制生成
            createEnemy();
            waveManager.enemiesSpawned++;
            waveManager.lastSpawnTime = currentTime;
            waveManager.forceSpawnTimer = 0;
            console.log(`⚡ 强制生成敌人 (${waveManager.enemiesSpawned}/${gameState.enemiesThisWave})`);
            return;
        }
    } else {
        waveManager.forceSpawnTimer = 0;
    }
    
    // 正常生成逻辑
    if (needMoreEnemies && canSpawnMore && timePassed) {
        // 使用更可靠的生成概率
        const spawnChance = config.enemySpawnRate;
        const waveProgress = waveManager.enemiesSpawned / gameState.enemiesThisWave;
        
        // 根据波次进度调整生成概率，前期更容易生成
        let adjustedChance = spawnChance;
        if (waveProgress < 0.3) {
            adjustedChance *= 1.5; // 前30%生成概率提高50%
        } else if (waveProgress > 0.8) {
            adjustedChance *= 2.0; // 后20%生成概率翻倍，加快节奏
        }
        
        if (Math.random() < adjustedChance) {
            createEnemy();
            waveManager.enemiesSpawned++;
            waveManager.lastSpawnTime = currentTime;
            
            console.log(`👾 生成敌人 (${waveManager.enemiesSpawned}/${gameState.enemiesThisWave}) 场上敌人:${enemies.length}`);
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
        const subText = `准备第 ${gameState.wave + 1} 波...`;
        
        ctx.strokeText(text, canvas.width/2, canvas.height/2 - 20);
        ctx.fillText(text, canvas.width/2, canvas.height/2 - 20);
        
        ctx.font = `${fontSize * 0.6}px Arial`;
        ctx.strokeText(subText, canvas.width/2, canvas.height/2 + 20);
        ctx.fillText(subText, canvas.width/2, canvas.height/2 + 20);
    }
}

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('kills').textContent = gameState.kills;
    document.getElementById('lives').textContent = gameState.lives;
    document.getElementById('wave').textContent = gameState.wave;
    
    const weaponName = weaponTypes[player.weapon.type]?.name || player.weapon.name || '🔫 基础枪';
    document.getElementById('weaponType').textContent = weaponName;
    
    // 显示波次进度（当FPS开启时）
    if (waveManager.waveActive && gameSettings.showFPS === 'on') {
        const progressElement = document.getElementById('waveProgress');
        if (progressElement) {
            const killed = waveManager.enemiesKilled;
            const total = gameState.enemiesThisWave;
            const spawned = waveManager.enemiesSpawned;
            const onField = enemies.length;
            
            progressElement.textContent = `第${gameState.wave}波: ${killed}/${total} 击杀 | ${spawned}/${total} 生成 | 场上: ${onField}`;
        }
    }
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
        enemiesThisWave: window.difficultyConfig?.enemiesPerWave || 12,
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
    
    // 初始化波次管理器
    initializeWaveManager();
    
    // 初始化星空背景
    initStars();
    
    // 添加波次进度显示（调试用）
    if (gameSettings.showFPS === 'on' && !document.getElementById('waveProgress')) {
        const progressDiv = document.createElement('div');
        progressDiv.id = 'waveProgress';
        progressDiv.style.position = 'absolute';
        progressDiv.style.top = '110px';
        progressDiv.style.left = '15px';
        progressDiv.style.color = 'white';
        progressDiv.style.background = 'rgba(0, 0, 0, 0.5)';
        progressDiv.style.padding = '5px 10px';
        progressDiv.style.borderRadius = '5px';
        progressDiv.style.fontSize = '0.8rem';
        progressDiv.style.zIndex = '160';
        document.getElementById('gameContainer').appendChild(progressDiv);
    }
    
    console.log('🎮 游戏初始化完成');
    console.log(`🌊 第${gameState.wave}波开始 - 目标击杀: ${gameState.enemiesThisWave}`);
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

/* ==================== 调试功能 ==================== */

// 全局调试函数
window.enableTouchDebug = function() {
    document.body.classList.add('debug-mode');
    console.log('🐛 触摸调试模式已启用');
    
    // 创建调试信息显示
    if (!document.getElementById('debugTouchInfo')) {
        const debugDiv = document.createElement('div');
        debugDiv.id = 'debugTouchInfo';
        debugDiv.className = 'debug-touch-info';
        debugDiv.innerHTML = `
            <div>设备: <span id="debugDevice">-</span></div>
            <div>摇杆: <span id="debugJoystick">-</span></div>
            <div>射击: <span id="debugShoot">-</span></div>
            <div>触摸: <span id="debugTouch">-</span></div>
        `;
        document.body.appendChild(debugDiv);
        
        // 更新调试信息
        setInterval(() => {
            document.getElementById('debugDevice').textContent = IS_IPAD ? 'iPad' : (IS_PHONE ? 'Phone' : 'Desktop');
            document.getElementById('debugJoystick').textContent = `${joystick.x.toFixed(2)}, ${joystick.y.toFixed(2)}`;
            document.getElementById('debugShoot').textContent = touch.shootButtonPressed ? 'ON' : 'OFF';
            document.getElementById('debugTouch').textContent = `IDs: J=${joystickTouchId || 'none'}, S=${shootButtonTouchId || 'none'}`;
        }, 100);
    }
};

window.disableTouchDebug = function() {
    document.body.classList.remove('debug-mode');
    const debugDiv = document.getElementById('debugTouchInfo');
    if (debugDiv) debugDiv.remove();
    console.log('🐛 触摸调试模式已关闭');
};

console.log('🔧 移动端菜单点击问题已修复！');
console.log('✅ 修复内容:');
console.log('- 🎯 智能触摸事件管理，菜单中允许正常点击');
console.log('- 📱 只在游戏中阻止滚动和文本选择');
console.log('- 🕹️ 优化的触摸控制逻辑');
console.log('- 📐 安全的空值检查');
console.log('- 🍎 iPad和手机的完美支持');
console.log('🎮 调试快捷键: I - 查看波次信息, K - 清理敌人');
console.log('🐛 调试命令: enableTouchDebug() / disableTouchDebug()');
