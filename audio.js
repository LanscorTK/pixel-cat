// 智能多格式音效管理系统 - audio.js
// 自动检测并支持 .mp3, .wav, .ogg 等多种音频格式

class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.enabled = false;
        this.musicEnabled = false;
        this.volume = 0.7;
        this.musicVolume = 0.3;
        this.initialized = false;
        
        // 支持的音频格式，按优先级排序
        this.supportedFormats = ['.mp3', '.wav', '.ogg', '.m4a'];
        
        // 音效文件配置（不包含扩展名，系统会自动检测格式）
        this.soundFiles = {
            // 游戏音效
            shoot: './sounds/shoot',
            enemyHit: './sounds/enemy_hit',
            enemyDeath: './sounds/enemy_death',
            playerHurt: './sounds/player_hurt',
            powerUp: './sounds/power_up',
            waveComplete: './sounds/wave_complete',
            gameOver: './sounds/game_over',
            
            // UI音效
            buttonClick: './sounds/button_click',
            menuMove: './sounds/menu_move',
            
            // 武器音效
            rapidFire: './sounds/rapid_fire',
            heavyGun: './sounds/heavy_gun',
            spreadGun: './sounds/spread_gun'
        };
        
        // 背景音乐配置（不包含扩展名，系统会自动检测格式）
        this.musicFiles = {
            menu: './music/menu_theme',
            game: './music/battle_theme',
            gameOver: './music/game_over_theme'
        };
        
        this.currentMusicType = null;
        this.loadedFormats = {}; // 记录实际加载的格式
    }
    
    // 检测并获取第一个可用的音频格式
    async detectAudioFormat(basePath, name) {
        for (const format of this.supportedFormats) {
            const url = `${basePath}${format}`;
            try {
                const isAvailable = await this.testAudioUrl(url);
                if (isAvailable) {
                    console.log(`✅ 找到音频文件: ${name}${format}`);
                    this.loadedFormats[name] = format;
                    return url;
                }
            } catch (error) {
                // 继续尝试下一个格式
                continue;
            }
        }
        
        console.warn(`❌ 未找到 ${name} 的任何支持格式 (尝试了: ${this.supportedFormats.join(', ')})`);
        return null;
    }
    
    // 测试音频URL是否可用
    testAudioUrl(url) {
        return new Promise((resolve) => {
            const audio = new Audio();
            
            const timeout = setTimeout(() => {
                resolve(false);
            }, 3000); // 3秒超时
            
            audio.addEventListener('canplaythrough', () => {
                clearTimeout(timeout);
                resolve(true);
            }, { once: true });
            
            audio.addEventListener('error', () => {
                clearTimeout(timeout);
                resolve(false);
            }, { once: true });
            
            // 静音测试，避免播放声音
            audio.volume = 0;
            audio.src = url;
        });
    }
    
    // 初始化音效系统
    async initialize() {
        if (this.initialized) return;
        
        console.log('🎵 初始化智能多格式音效系统...');
        console.log(`📋 支持的格式: ${this.supportedFormats.join(', ')}`);
        
        try {
            await this.preloadSounds();
            await this.preloadMusic();
            this.initialized = true;
            console.log('✅ 音效系统初始化完成');
            
            // 显示加载统计
            const soundCount = Object.keys(this.sounds).length;
            const musicCount = this.music ? Object.keys(this.music).length : 0;
            console.log(`📊 加载统计: ${soundCount} 个音效, ${musicCount} 首背景音乐`);
            
            // 显示使用的格式
            this.showLoadedFormats();
        } catch (error) {
            console.warn('⚠️ 音效初始化失败，将使用静音模式:', error);
            this.enabled = false;
            this.musicEnabled = false;
        }
    }
    
    // 显示加载的音频格式统计
    showLoadedFormats() {
        const formatStats = {};
        Object.values(this.loadedFormats).forEach(format => {
            formatStats[format] = (formatStats[format] || 0) + 1;
        });
        
        console.log('📈 音频格式使用统计:');
        Object.entries(formatStats).forEach(([format, count]) => {
            console.log(`  ${format}: ${count} 个文件`);
        });
    }
    
    // 预加载音效文件
    async preloadSounds() {
        console.log('🔊 开始预加载音效文件...');
        const loadPromises = Object.entries(this.soundFiles).map(async ([key, basePath]) => {
            try {
                const url = await this.detectAudioFormat(basePath, key);
                
                if (url) {
                    const audio = await this.loadAudioFile(url, this.volume);
                    this.sounds[key] = audio;
                    console.log(`✅ 音效加载成功: ${key} (${this.loadedFormats[key]})`);
                } else {
                    // 创建空音效对象，避免错误
                    this.sounds[key] = this.createDummyAudio();
                    console.warn(`⚠️ 音效加载失败: ${key} - 创建静音替代`);
                }
            } catch (error) {
                console.warn(`❌ 音效加载错误: ${key}`, error);
                this.sounds[key] = this.createDummyAudio();
            }
        });
        
        await Promise.all(loadPromises);
        console.log('🔊 音效文件预加载完成');
    }
    
    // 预加载背景音乐
    async preloadMusic() {
        console.log('🎼 开始预加载背景音乐...');
        this.music = {};
        
        const musicPromises = Object.entries(this.musicFiles).map(async ([key, basePath]) => {
            try {
                const url = await this.detectAudioFormat(basePath, key);
                
                if (url) {
                    const audio = await this.loadAudioFile(url, this.musicVolume, true);
                    this.music[key] = audio;
                    console.log(`✅ 背景音乐加载成功: ${key} (${this.loadedFormats[key]})`);
                } else {
                    this.music[key] = this.createDummyAudio();
                    console.warn(`⚠️ 背景音乐加载失败: ${key} - 创建静音替代`);
                }
            } catch (error) {
                console.warn(`❌ 背景音乐加载错误: ${key}`, error);
                this.music[key] = this.createDummyAudio();
            }
        });
        
        await Promise.all(musicPromises);
        console.log('🎼 背景音乐预加载完成');
    }
    
    // 加载单个音频文件
    loadAudioFile(url, volume, isLoop = false) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.volume = volume;
            audio.loop = isLoop;
            
            const timeout = setTimeout(() => {
                reject(new Error(`音频加载超时: ${url}`));
            }, 8000);
            
            audio.addEventListener('canplaythrough', () => {
                clearTimeout(timeout);
                resolve(audio);
            }, { once: true });
            
            audio.addEventListener('error', (e) => {
                clearTimeout(timeout);
                reject(new Error(`音频加载失败: ${url} - ${e.message}`));
            }, { once: true });
            
            audio.src = url;
        });
    }
    
    // 创建静音音频对象
    createDummyAudio() {
        return {
            play: () => Promise.resolve(),
            pause: () => {},
            get currentTime() { return 0; },
            set currentTime(value) {},
            get volume() { return 0; },
            set volume(value) {},
            get loop() { return false; },
            set loop(value) {}
        };
    }
    
    // 播放音效
    playSound(soundName, volume = 1.0) {
        if (!this.enabled || !this.sounds[soundName]) return;
        
        try {
            const sound = this.sounds[soundName];
            if (sound.play) {
                sound.currentTime = 0;
                sound.volume = this.volume * volume;
                sound.play().catch(e => console.warn(`音效播放失败: ${soundName}`, e));
            }
        } catch (error) {
            console.warn(`音效播放错误: ${soundName}`, error);
        }
    }
    
    // 播放背景音乐
    playMusic(musicType) {
        if (!this.musicEnabled || !this.music || !this.music[musicType]) return;
        
        try {
            // 停止当前音乐
            this.stopMusic();
            
            const music = this.music[musicType];
            if (music.play) {
                music.currentTime = 0;
                music.volume = this.musicVolume;
                music.play().catch(e => console.warn(`背景音乐播放失败: ${musicType}`, e));
                this.currentMusicType = musicType;
                console.log(`🎵 开始播放背景音乐: ${musicType} (${this.loadedFormats[musicType] || 'unknown'})`);
            }
        } catch (error) {
            console.warn(`背景音乐播放错误: ${musicType}`, error);
        }
    }
    
    // 停止背景音乐
    stopMusic() {
        if (!this.music || !this.currentMusicType) return;
        
        try {
            const currentMusic = this.music[this.currentMusicType];
            if (currentMusic.pause) {
                currentMusic.pause();
                currentMusic.currentTime = 0;
            }
            console.log(`⏹️ 停止背景音乐: ${this.currentMusicType}`);
            this.currentMusicType = null;
        } catch (error) {
            console.warn('停止音乐错误:', error);
        }
    }
    
    // 暂停/恢复背景音乐
    pauseMusic() {
        if (!this.music || !this.currentMusicType) return;
        
        try {
            const currentMusic = this.music[this.currentMusicType];
            if (currentMusic.pause) {
                currentMusic.pause();
                console.log(`⏸️ 暂停背景音乐: ${this.currentMusicType}`);
            }
        } catch (error) {
            console.warn('暂停音乐错误:', error);
        }
    }
    
    resumeMusic() {
        if (!this.music || !this.currentMusicType) return;
        
        try {
            const currentMusic = this.music[this.currentMusicType];
            if (currentMusic.play) {
                currentMusic.play().catch(e => console.warn('恢复音乐失败:', e));
                console.log(`▶️ 恢复背景音乐: ${this.currentMusicType}`);
            }
        } catch (error) {
            console.warn('恢复音乐错误:', error);
        }
    }
    
    // 设置音效开关
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            // 停止所有正在播放的音效
            Object.values(this.sounds).forEach(sound => {
                if (sound.pause) sound.pause();
            });
        }
        console.log('🔊 音效:', enabled ? '开启' : '关闭');
    }
    
    // 设置背景音乐开关
    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (!enabled) {
            this.stopMusic();
        } else if (this.currentMusicType) {
            this.playMusic(this.currentMusicType);
        }
        console.log('🎼 背景音乐:', enabled ? '开启' : '关闭');
    }
    
    // 设置音效音量
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            if (sound.volume !== undefined) {
                sound.volume = this.volume;
            }
        });
        console.log(`🔊 音效音量设置为: ${Math.round(this.volume * 100)}%`);
    }
    
    // 设置音乐音量
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.music) {
            Object.values(this.music).forEach(music => {
                if (music.volume !== undefined) {
                    music.volume = this.musicVolume;
                }
            });
        }
        console.log(`🎼 背景音乐音量设置为: ${Math.round(this.musicVolume * 100)}%`);
    }
    
    // 添加自定义音效格式优先级
    setFormatPriority(formats) {
        this.supportedFormats = formats;
        console.log(`📋 音频格式优先级已更新: ${formats.join(', ')}`);
    }
    
    // 游戏特定的音效方法
    playShoot(weaponType = 'basic') {
        switch (weaponType) {
            case 'rapid':
                this.playSound('rapidFire', 0.6);
                break;
            case 'heavy':
                this.playSound('heavyGun', 0.8);
                break;
            case 'spread':
                this.playSound('spreadGun', 0.7);
                break;
            default:
                this.playSound('shoot', 0.5);
        }
    }
    
    playEnemyHit() {
        this.playSound('enemyHit', 0.4);
    }
    
    playEnemyDeath() {
        this.playSound('enemyDeath', 0.6);
    }
    
    playPlayerHurt() {
        this.playSound('playerHurt', 0.8);
    }
    
    playPowerUp() {
        this.playSound('powerUp', 0.7);
    }
    
    playWaveComplete() {
        this.playSound('waveComplete', 0.9);
    }
    
    playGameOver() {
        this.playSound('gameOver', 1.0);
    }
    
    playButtonClick() {
        this.playSound('buttonClick', 0.3);
    }
    
    playMenuMove() {
        this.playSound('menuMove', 0.2);
    }
    
    // 开启用户交互后的音频上下文恢复（移动端需要）
    resumeAudioContext() {
        if (typeof AudioContext !== 'undefined') {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log('🎵 音频上下文已恢复');
                });
            }
        }
    }
    
    // 检查音效系统状态
    getStatus() {
        return {
            initialized: this.initialized,
            soundEnabled: this.enabled,
            musicEnabled: this.musicEnabled,
            soundVolume: this.volume,
            musicVolume: this.musicVolume,
            currentMusic: this.currentMusicType,
            loadedSounds: Object.keys(this.sounds).length,
            loadedMusic: this.music ? Object.keys(this.music).length : 0,
            supportedFormats: this.supportedFormats,
            loadedFormats: this.loadedFormats
        };
    }
    
    // 音效系统诊断
    diagnose() {
        console.log('🔍 智能多格式音效系统诊断:');
        const status = this.getStatus();
        console.table(status);
        
        console.log(`📋 支持的格式: ${this.supportedFormats.join(', ')}`);
        console.log('📁 音效文件检测结果:');
        Object.entries(this.soundFiles).forEach(([key, basePath]) => {
            const format = this.loadedFormats[key];
            const loaded = this.sounds[key] && this.sounds[key].play && this.sounds[key].play !== (() => Promise.resolve());
            const status = loaded ? '✅' : '❌';
            const formatInfo = format ? ` (${format})` : ' (未找到)';
            console.log(`${status} ${key}: ${basePath}${formatInfo}`);
        });
        
        console.log('🎵 背景音乐检测结果:');
        Object.entries(this.musicFiles).forEach(([key, basePath]) => {
            const format = this.loadedFormats[key];
            const loaded = this.music && this.music[key] && this.music[key].play && this.music[key].play !== (() => Promise.resolve());
            const status = loaded ? '✅' : '❌';
            const formatInfo = format ? ` (${format})` : ' (未找到)';
            console.log(`${status} ${key}: ${basePath}${formatInfo}`);
        });
        
        this.showLoadedFormats();
    }
    
    // 热重载音效（开发时使用）
    async reloadAudio(type = 'all') {
        console.log(`🔄 重新加载音效: ${type}`);
        
        if (type === 'all' || type === 'sounds') {
            await this.preloadSounds();
        }
        
        if (type === 'all' || type === 'music') {
            await this.preloadMusic();
        }
        
        console.log('✅ 音效重载完成');
    }
}

// 创建全局音效管理器实例
const audioManager = new AudioManager();

// 导出音效管理器
window.audioManager = audioManager;

// 添加调试功能
window.debugAudio = () => audioManager.diagnose();
window.reloadAudio = (type) => audioManager.reloadAudio(type);

// 添加格式优先级设置功能
window.setAudioFormats = (formats) => audioManager.setFormatPriority(formats);