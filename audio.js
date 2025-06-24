class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = {};
        this.currentMusic = null;
        this.enabled = true;
        this.musicEnabled = true;
        this.volume = 0.7;
        this.musicVolume = 0.3;
        this.initialized = false;
        this.audioContext = null;
        
        // 支持的音频格式，按优先级排序
        this.supportedFormats = ['.mp3', '.wav', '.ogg', '.m4a'];
        
        // 音效文件路径配置
        this.soundFiles = {
            shoot: './sounds/shoot.wav',
            enemyHit: './sounds/shoot.wav', // 如果没有专门的击中音效，可以复用
            enemyDeath: './sounds/enemy_death.wav',
            playerHurt: './sounds/player_hurt.wav',
            powerUp: './sounds/power_up.wav',
            waveComplete: './sounds/power_up.wav', // 复用道具音效
            gameOver: './sounds/enemy_death.wav', // 复用死亡音效，音调更低
            buttonClick: './sounds/button_click.wav',
            menuMove: './sounds/button_click.wav' // 复用按钮音效
        };
        
        // 背景音乐文件路径配置
        this.musicFiles = {
            menu: './music/menu_theme.mp3',
            game: './music/battle_theme.mp3',
            gameOver: './music/menu_theme.mp3' // 复用菜单音乐
        };
        
        // 合成音效配置（作为备选方案）
        this.soundTypes = {
            shoot: { freq: 800, type: 'square', duration: 0.1 },
            enemyHit: { freq: 400, type: 'sawtooth', duration: 0.15 },
            enemyDeath: { freq: 200, type: 'triangle', duration: 0.3 },
            playerHurt: { freq: 150, type: 'square', duration: 0.5 },
            powerUp: { freq: 1000, type: 'sine', duration: 0.4 },
            waveComplete: { freq: 600, type: 'sine', duration: 0.8 },
            gameOver: { freq: 100, type: 'square', duration: 1.0 },
            buttonClick: { freq: 1200, type: 'sine', duration: 0.05 },
            menuMove: { freq: 900, type: 'sine', duration: 0.03 }
        };
        
        this.currentMusicType = null;
        this.userInteracted = false;
        this.loadedSounds = 0;
        this.totalSounds = 0;
        this.useRealAudio = true; // 默认尝试使用真实音频
        this.musicLoopCheckInterval = null; // 音乐循环检查定时器
    }
    
    // 初始化音效系统
    async initialize() {
        if (this.initialized) return;
        
        console.log('🎵 初始化智能音效系统...');
        
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 尝试加载真实音频文件
            if (this.useRealAudio) {
                await this.loadRealAudioFiles();
            }
            
            // 如果加载失败或者音频文件不完整，使用合成音效作为备选
            if (this.loadedSounds < this.totalSounds * 0.5) {
                console.log('⚠️ 部分音频文件加载失败，使用合成音效作为备选');
                this.createSimpleSounds();
            }
            
            this.initialized = true;
            console.log('✅ 音效系统初始化完成');
            
            // 显示状态
            this.updateAudioStatus(`音效系统已初始化 (${this.useRealAudio ? '真实音频' : '合成音效'})`);
            
            // 启动音乐循环检查
            this.startMusicLoopMonitoring();
            
        } catch (error) {
            console.warn('⚠️ 音效初始化失败，将使用静音模式:', error);
            this.enabled = false;
            this.musicEnabled = false;
            this.updateAudioStatus('音效系统初始化失败: ' + error.message);
        }
    }
    
    // 加载真实音频文件
    async loadRealAudioFiles() {
        const soundPromises = [];
        const musicPromises = [];
        
        // 计算总音频文件数量
        this.totalSounds = Object.keys(this.soundFiles).length + Object.keys(this.musicFiles).length;
        this.loadedSounds = 0;
        
        // 加载音效文件
        for (const [soundName, filePath] of Object.entries(this.soundFiles)) {
            soundPromises.push(this.loadSoundFile(soundName, filePath));
        }
        
        // 加载背景音乐文件
        for (const [musicName, filePath] of Object.entries(this.musicFiles)) {
            musicPromises.push(this.loadMusicFile(musicName, filePath));
        }
        
        // 等待所有音频文件加载完成（但不阻塞初始化）
        await Promise.allSettled([...soundPromises, ...musicPromises]);
        
        console.log(`📊 音频加载统计: ${this.loadedSounds}/${this.totalSounds} 成功加载`);
    }
    
    // 加载单个音效文件
    async loadSoundFile(soundName, filePath) {
        try {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.volume = this.volume;
            
            return new Promise((resolve, reject) => {
                audio.addEventListener('canplaythrough', () => {
                    this.sounds[soundName] = audio;
                    this.loadedSounds++;
                    console.log(`✅ 音效加载成功: ${soundName}`);
                    resolve();
                });
                
                audio.addEventListener('error', (e) => {
                    console.warn(`❌ 音效加载失败: ${soundName} - ${filePath}`);
                    // 创建合成音效作为备选
                    this.sounds[soundName] = {
                        play: () => this.playSimpleSound(soundName),
                        pause: () => {},
                        currentTime: 0,
                        volume: this.volume
                    };
                    reject(e);
                });
                
                // 设置超时
                setTimeout(() => {
                    if (!this.sounds[soundName]) {
                        console.warn(`⏰ 音效加载超时: ${soundName}`);
                        reject(new Error('加载超时'));
                    }
                }, 5000);
                
                audio.src = filePath;
                audio.load();
            });
        } catch (error) {
            console.warn(`音效加载异常: ${soundName}`, error);
        }
    }
    
    // 加载单个背景音乐文件
    async loadMusicFile(musicName, filePath) {
        try {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.loop = true; // 关键：设置循环播放
            audio.volume = this.musicVolume;
            
            return new Promise((resolve, reject) => {
                audio.addEventListener('canplaythrough', () => {
                    this.music[musicName] = audio;
                    this.loadedSounds++;
                    console.log(`✅ 背景音乐加载成功: ${musicName} (循环: ${audio.loop})`);
                    
                    // 确保循环设置生效
                    this.setupMusicLoopHandlers(audio, musicName);
                    
                    resolve();
                });
                
                audio.addEventListener('error', (e) => {
                    console.warn(`❌ 背景音乐加载失败: ${musicName} - ${filePath}`);
                    reject(e);
                });
                
                // 设置超时
                setTimeout(() => {
                    if (!this.music[musicName]) {
                        console.warn(`⏰ 背景音乐加载超时: ${musicName}`);
                        reject(new Error('加载超时'));
                    }
                }, 10000);
                
                audio.src = filePath;
                audio.load();
            });
        } catch (error) {
            console.warn(`背景音乐加载异常: ${musicName}`, error);
        }
    }
    
    // 设置音乐循环处理器
    setupMusicLoopHandlers(audio, musicName) {
        // 确保循环播放
        audio.loop = true;
        
        // 监听播放结束事件（防止循环失效）
        audio.addEventListener('ended', () => {
            console.log(`🔄 ${musicName} 播放结束，重新开始循环`);
            if (this.currentMusic === audio && this.musicEnabled) {
                audio.currentTime = 0;
                audio.play().catch(e => console.warn('音乐重播失败:', e));
            }
        });
        
        // 监听播放错误
        audio.addEventListener('error', (e) => {
            console.warn(`🎵 ${musicName} 播放错误:`, e);
        });
        
        // 监听暂停事件
        audio.addEventListener('pause', () => {
            console.log(`⏸️ ${musicName} 已暂停`);
        });
        
        // 监听播放事件
        audio.addEventListener('play', () => {
            console.log(`▶️ ${musicName} 开始播放 (循环: ${audio.loop})`);
        });
    }
    
    // 启动音乐循环监控
    startMusicLoopMonitoring() {
        // 清除现有的监控
        if (this.musicLoopCheckInterval) {
            clearInterval(this.musicLoopCheckInterval);
        }
        
        // 每5秒检查一次音乐播放状态
        this.musicLoopCheckInterval = setInterval(() => {
            if (this.currentMusic && this.musicEnabled && this.currentMusicType) {
                // 检查是否还在播放
                if (this.currentMusic.paused && !this.currentMusic.ended) {
                    console.log('🔄 检测到音乐意外暂停，尝试恢复播放...');
                    this.currentMusic.play().catch(e => console.warn('音乐恢复播放失败:', e));
                }
                
                // 确保循环设置仍然有效
                if (this.currentMusic.loop !== true) {
                    console.log('🔄 重新设置音乐循环...');
                    this.currentMusic.loop = true;
                }
            }
        }, 5000);
    }
    
    // 创建简单的合成音效（备选方案）
    createSimpleSounds() {
        Object.keys(this.soundTypes).forEach(soundName => {
            if (!this.sounds[soundName]) {
                this.sounds[soundName] = {
                    play: () => this.playSimpleSound(soundName),
                    pause: () => {},
                    currentTime: 0,
                    volume: this.volume
                };
            }
        });
    }
    
    // 播放合成音效
    playSimpleSound(soundName) {
        if (!this.enabled || !this.audioContext || !this.userInteracted) return;
        
        try {
            const soundConfig = this.soundTypes[soundName];
            if (!soundConfig) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = soundConfig.type;
            oscillator.frequency.setValueAtTime(soundConfig.freq, this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(this.volume * 0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + soundConfig.duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + soundConfig.duration);
            
        } catch (error) {
            console.warn(`合成音效播放错误: ${soundName}`, error);
        }
    }
    
    // 播放音效
    playSound(soundName, volume = 1.0) {
        if (!this.enabled || !this.sounds[soundName]) return;
        
        try {
            const sound = this.sounds[soundName];
            if (sound.play) {
                // 重置音频到开始位置
                if (sound.currentTime !== undefined) {
                    sound.currentTime = 0;
                }
                // 设置音量
                if (sound.volume !== undefined) {
                    sound.volume = this.volume * volume;
                }
                sound.play().catch(e => console.warn(`音效播放失败: ${soundName}`, e));
            }
        } catch (error) {
            console.warn(`音效播放错误: ${soundName}`, error);
        }
    }
    
    // 播放背景音乐
    playMusic(musicType) {
        if (!this.musicEnabled || !this.userInteracted) return;
        
        try {
            // 如果已经在播放相同的音乐，不重复播放
            if (this.currentMusicType === musicType && this.currentMusic && !this.currentMusic.paused) {
                console.log(`🎵 ${musicType} 已在播放中`);
                return;
            }
            
            this.stopMusic();
            
            // 尝试播放真实音乐文件
            if (this.music[musicType]) {
                const musicAudio = this.music[musicType];
                
                // 确保循环设置
                musicAudio.loop = true;
                musicAudio.currentTime = 0;
                musicAudio.volume = this.musicVolume;
                
                // 播放音乐
                musicAudio.play().then(() => {
                    this.currentMusic = musicAudio;
                    this.currentMusicType = musicType;
                    console.log(`🎵 开始播放背景音乐: ${musicType} (循环: ${musicAudio.loop})`);
                }).catch(e => {
                    console.warn(`背景音乐播放失败: ${musicType}`, e);
                    // 如果播放失败，尝试合成音乐
                    this.createSimpleMusic(musicType);
                });
                
                return;
            }
            
            // 如果没有真实音乐文件，创建简单的背景音乐
            if (this.audioContext) {
                this.createSimpleMusic(musicType);
            }
            
        } catch (error) {
            console.warn(`背景音乐播放错误: ${musicType}`, error);
        }
    }
    
    // 创建简单的背景音乐（备选方案）
    createSimpleMusic(musicType) {
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 根据音乐类型设置不同的频率
            const musicFreqs = {
                menu: [440, 523, 659], // A-C-E
                game: [330, 392, 493], // E-G-B
                gameOver: [220, 247, 277] // A-B-C#
            };
            
            const freqs = musicFreqs[musicType] || musicFreqs.menu;
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freqs[0], this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(this.musicVolume * 0.05, this.audioContext.currentTime);
            
            oscillator.start();
            
            this.currentMusic = { oscillator, gainNode, isSimple: true };
            this.currentMusicType = musicType;
            
            console.log(`🎵 开始播放合成背景音乐: ${musicType}`);
        } catch (error) {
            console.warn(`合成背景音乐创建失败: ${musicType}`, error);
        }
    }
    
    // 停止背景音乐
    stopMusic() {
        if (this.currentMusic) {
            try {
                if (this.currentMusic.isSimple) {
                    // 合成音乐
                    this.currentMusic.oscillator.stop();
                } else {
                    // 真实音乐文件
                    this.currentMusic.pause();
                    this.currentMusic.currentTime = 0;
                }
                this.currentMusic = null;
                this.currentMusicType = null;
                console.log('⏹️ 停止背景音乐');
            } catch (error) {
                console.warn('停止音乐错误:', error);
                // 强制清理
                this.currentMusic = null;
                this.currentMusicType = null;
            }
        }
    }
    
    // 暂停/恢复背景音乐
    pauseMusic() {
        if (this.currentMusic) {
            try {
                if (this.currentMusic.isSimple) {
                    this.currentMusic.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                } else {
                    this.currentMusic.pause();
                }
                console.log('⏸️ 暂停背景音乐');
            } catch (error) {
                console.warn('暂停音乐错误:', error);
            }
        }
    }
    
    resumeMusic() {
        if (this.currentMusic) {
            try {
                if (this.currentMusic.isSimple) {
                    this.currentMusic.gainNode.gain.setValueAtTime(this.musicVolume * 0.05, this.audioContext.currentTime);
                } else {
                    // 确保循环设置
                    this.currentMusic.loop = true;
                    this.currentMusic.play().catch(e => console.warn('音乐恢复播放失败:', e));
                }
                console.log('▶️ 恢复背景音乐');
            } catch (error) {
                console.warn('恢复音乐错误:', error);
            }
        }
    }
    
    // 设置音效开关
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log('🔊 音效:', enabled ? '开启' : '关闭');
        this.updateAudioStatus(`音效: ${enabled ? '开启' : '关闭'}`);
    }
    
    // 设置背景音乐开关
    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (!enabled) {
            this.stopMusic();
        } else if (this.currentMusicType) {
            // 如果之前有播放音乐，重新播放
            this.playMusic(this.currentMusicType);
        }
        console.log('🎼 背景音乐:', enabled ? '开启' : '关闭');
        this.updateAudioStatus(`背景音乐: ${enabled ? '开启' : '关闭'}`);
    }
    
    // 设置音效音量
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        // 更新所有音效的音量
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
        
        // 更新当前播放的音乐音量
        if (this.currentMusic) {
            if (this.currentMusic.isSimple) {
                this.currentMusic.gainNode.gain.setValueAtTime(this.musicVolume * 0.05, this.audioContext.currentTime);
            } else {
                this.currentMusic.volume = this.musicVolume;
            }
        }
        
        // 更新所有背景音乐的音量
        Object.values(this.music).forEach(music => {
            music.volume = this.musicVolume;
        });
        
        console.log(`🎼 背景音乐音量设置为: ${Math.round(this.musicVolume * 100)}%`);
    }
    
    // 开启用户交互后的音频上下文恢复
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('🎵 音频上下文已恢复');
                this.userInteracted = true;
                this.updateAudioStatus('音频上下文已激活，可以播放声音');
            });
        } else {
            this.userInteracted = true;
        }
    }
    
    // 更新音频状态显示
    updateAudioStatus(message) {
        const statusElement = document.getElementById('audioStatusText');
        if (statusElement) {
            statusElement.textContent = message;
        }
        console.log(`📢 音频状态: ${message}`);
    }
    
    // 游戏特定的音效方法
    playShoot(weaponType = 'basic') {
        this.playSound('shoot');
    }
    
    playEnemyHit() {
        this.playSound('enemyHit');
    }
    
    playEnemyDeath() {
        this.playSound('enemyDeath');
    }
    
    playPlayerHurt() {
        this.playSound('playerHurt');
    }
    
    playPowerUp() {
        this.playSound('powerUp');
    }
    
    playWaveComplete() {
        this.playSound('waveComplete');
    }
    
    playGameOver() {
        this.playSound('gameOver');
    }
    
    playButtonClick() {
        this.playSound('buttonClick');
    }
    
    playMenuMove() {
        this.playSound('menuMove');
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
            userInteracted: this.userInteracted,
            audioContextState: this.audioContext ? this.audioContext.state : 'none',
            loadedSounds: this.loadedSounds,
            totalSounds: this.totalSounds,
            useRealAudio: this.useRealAudio,
            musicLoop: this.currentMusic ? this.currentMusic.loop : null,
            musicPaused: this.currentMusic ? this.currentMusic.paused : null
        };
    }
    
    // 检查音乐循环状态
    checkMusicLoop() {
        console.log('🔍 音乐循环状态检查:');
        
        if (this.music) {
            Object.keys(this.music).forEach(musicName => {
                const musicElement = this.music[musicName];
                console.log(`🎵 ${musicName}:`, {
                    loop: musicElement.loop,
                    paused: musicElement.paused,
                    currentTime: musicElement.currentTime.toFixed(2),
                    duration: musicElement.duration ? musicElement.duration.toFixed(2) : 'unknown',
                    volume: musicElement.volume
                });
            });
        }
        
        if (this.currentMusic) {
            if (this.currentMusic.loop !== undefined) {
                console.log('🎶 当前播放音乐循环状态:', this.currentMusic.loop);
            } else {
                console.log('🎶 当前播放的是合成音乐（自动循环）');
            }
        } else {
            console.log('🔇 当前没有播放音乐');
        }
    }
    
    // 强制修复循环播放
    fixMusicLoop() {
        console.log('🔧 修复音乐循环播放...');
        
        // 1. 设置所有音乐为循环
        if (this.music) {
            Object.keys(this.music).forEach(musicName => {
                const musicElement = this.music[musicName];
                musicElement.loop = true;
                console.log(`✅ ${musicName} 已设置为循环播放`);
            });
        }
        
        // 2. 如果当前有播放的音乐，也设置循环
        if (this.currentMusic && this.currentMusic.loop !== undefined) {
            this.currentMusic.loop = true;
            console.log('✅ 当前播放音乐已设置为循环');
        }
        
        // 3. 如果当前有音乐播放，重新启动以应用循环设置
        if (this.currentMusicType) {
            const currentType = this.currentMusicType;
            console.log(`🔄 重新启动 ${currentType} 音乐以应用循环设置...`);
            
            this.stopMusic();
            setTimeout(() => {
                this.playMusic(currentType);
                console.log(`✅ ${currentType} 音乐已重新开始播放（循环模式）`);
            }, 100);
        }
        
        console.log('🎵 音乐循环修复完成！');
    }
    
    // 音效系统诊断
    diagnose() {
        console.log('🔍 智能音效系统诊断:');
        const status = this.getStatus();
        console.table(status);
        
        // 检查音乐循环状态
        this.checkMusicLoop();
        
        this.updateAudioStatus('音频诊断完成，查看控制台获取详细信息');
        
        // 显示详细信息
        let diagnosisText = '音频系统诊断结果:\n';
        diagnosisText += `- 初始化状态: ${status.initialized ? '✅ 成功' : '❌ 失败'}\n`;
        diagnosisText += `- 音效状态: ${status.soundEnabled ? '✅ 开启' : '❌ 关闭'}\n`;
        diagnosisText += `- 音乐状态: ${status.musicEnabled ? '✅ 开启' : '❌ 关闭'}\n`;
        diagnosisText += `- 用户交互: ${status.userInteracted ? '✅ 已激活' : '❌ 未激活'}\n`;
        diagnosisText += `- 音频上下文: ${status.audioContextState}\n`;
        diagnosisText += `- 音频加载: ${status.loadedSounds}/${status.totalSounds}\n`;
        diagnosisText += `- 音频类型: ${status.useRealAudio ? '真实音频' : '合成音效'}\n`;
        diagnosisText += `- 音乐循环: ${status.musicLoop ? '✅ 开启' : '❌ 关闭'}\n`;
        diagnosisText += `- 音乐暂停: ${status.musicPaused ? '⏸️ 是' : '▶️ 否'}\n`;
        
        alert(diagnosisText);
    }
    
    // 清理资源
    destroy() {
        console.log('🧹 清理音频资源...');
        
        // 停止音乐
        this.stopMusic();
        
        // 清理监控定时器
        if (this.musicLoopCheckInterval) {
            clearInterval(this.musicLoopCheckInterval);
            this.musicLoopCheckInterval = null;
        }
        
        // 清理音频对象
        Object.values(this.sounds).forEach(sound => {
            if (sound.pause) sound.pause();
        });
        
        Object.values(this.music).forEach(music => {
            music.pause();
            music.src = '';
        });
        
        // 关闭音频上下文
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        console.log('✅ 音频资源清理完成');
    }
}

// 创建全局音效管理器实例
const audioManager = new AudioManager();
window.audioManager = audioManager;

// 添加测试和调试功能
window.testAudio = () => {
    audioManager.resumeAudioContext();
    audioManager.playSound('shoot');
    console.log('🎵 测试音效播放');
};

window.testMusic = () => {
    audioManager.resumeAudioContext();
    audioManager.playMusic('menu');
    console.log('🎼 测试音乐播放');
};

window.diagnoseAudio = () => audioManager.diagnose();

window.checkMusicLoop = () => audioManager.checkMusicLoop();

window.fixMusicLoop = () => audioManager.fixMusicLoop();

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    audioManager.destroy();
});

console.log('🎵 完整音频管理系统已加载！');
console.log('🔧 可用调试命令:');
console.log('- testAudio() - 测试音效');
console.log('- testMusic() - 测试音乐');
console.log('- diagnoseAudio() - 完整诊断');
console.log('- checkMusicLoop() - 检查循环状态');
console.log('- fixMusicLoop() - 修复循环播放');
