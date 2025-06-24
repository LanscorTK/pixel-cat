class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.enabled = true; // 默认开启
        this.musicEnabled = true; // 默认开启
        this.volume = 0.7;
        this.musicVolume = 0.3;
        this.initialized = false;
        this.audioContext = null;
        
        // 支持的音频格式，按优先级排序
        this.supportedFormats = ['.mp3', '.wav', '.ogg', '.m4a'];
        
        // 简化的音效文件配置（使用Web Audio API创建）
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
    }
    
    // 初始化音效系统
    async initialize() {
        if (this.initialized) return;
        
        console.log('🎵 初始化智能音效系统...');
        
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建简单的音效
            this.createSimpleSounds();
            
            this.initialized = true;
            console.log('✅ 音效系统初始化完成（使用Web Audio API）');
            
            // 显示状态
            this.updateAudioStatus('音效系统已初始化，使用Web Audio API生成音效');
            
        } catch (error) {
            console.warn('⚠️ 音效初始化失败，将使用静音模式:', error);
            this.enabled = false;
            this.musicEnabled = false;
            this.updateAudioStatus('音效系统初始化失败: ' + error.message);
        }
    }
    
    // 创建简单的音效
    createSimpleSounds() {
        Object.keys(this.soundTypes).forEach(soundName => {
            this.sounds[soundName] = {
                play: () => this.playSimpleSound(soundName),
                pause: () => {},
                currentTime: 0,
                volume: this.volume
            };
        });
    }
    
    // 播放简单音效
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
            console.warn(`音效播放错误: ${soundName}`, error);
        }
    }
    
    // 播放音效
    playSound(soundName, volume = 1.0) {
        if (!this.enabled || !this.sounds[soundName]) return;
        
        try {
            this.sounds[soundName].play();
        } catch (error) {
            console.warn(`音效播放错误: ${soundName}`, error);
        }
    }
    
    // 播放背景音乐（创建简单的循环音调）
    playMusic(musicType) {
        if (!this.musicEnabled || !this.audioContext || !this.userInteracted) return;
        
        try {
            this.stopMusic();
            
            // 创建简单的背景音乐
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
            
            this.currentMusic = { oscillator, gainNode };
            this.currentMusicType = musicType;
            
            console.log(`🎵 开始播放背景音乐: ${musicType}`);
            
        } catch (error) {
            console.warn(`背景音乐播放错误: ${musicType}`, error);
        }
    }
    
    // 停止背景音乐
    stopMusic() {
        if (this.currentMusic) {
            try {
                this.currentMusic.oscillator.stop();
                this.currentMusic = null;
                this.currentMusicType = null;
                console.log('⏹️ 停止背景音乐');
            } catch (error) {
                console.warn('停止音乐错误:', error);
            }
        }
    }
    
    // 暂停/恢复背景音乐
    pauseMusic() {
        if (this.currentMusic) {
            this.currentMusic.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            console.log('⏸️ 暂停背景音乐');
        }
    }
    
    resumeMusic() {
        if (this.currentMusic) {
            this.currentMusic.gainNode.gain.setValueAtTime(this.musicVolume * 0.05, this.audioContext.currentTime);
            console.log('▶️ 恢复背景音乐');
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
        }
        console.log('🎼 背景音乐:', enabled ? '开启' : '关闭');
        this.updateAudioStatus(`背景音乐: ${enabled ? '开启' : '关闭'}`);
    }
    
    // 设置音效音量
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        console.log(`🔊 音效音量设置为: ${Math.round(this.volume * 100)}%`);
    }
    
    // 设置音乐音量
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.gainNode.gain.setValueAtTime(this.musicVolume * 0.05, this.audioContext.currentTime);
        }
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
            audioContextState: this.audioContext ? this.audioContext.state : 'none'
        };
    }
    
    // 音效系统诊断
    diagnose() {
        console.log('🔍 智能音效系统诊断:');
        const status = this.getStatus();
        console.table(status);
        
        this.updateAudioStatus('音频诊断完成，查看控制台获取详细信息');
        
        // 显示详细信息
        let diagnosisText = '音频系统诊断结果:\n';
        diagnosisText += `- 初始化状态: ${status.initialized ? '✅ 成功' : '❌ 失败'}\n`;
        diagnosisText += `- 音效状态: ${status.soundEnabled ? '✅ 开启' : '❌ 关闭'}\n`;
        diagnosisText += `- 音乐状态: ${status.musicEnabled ? '✅ 开启' : '❌ 关闭'}\n`;
        diagnosisText += `- 用户交互: ${status.userInteracted ? '✅ 已激活' : '❌ 未激活'}\n`;
        diagnosisText += `- 音频上下文: ${status.audioContextState}\n`;
        
        alert(diagnosisText);
    }
}

// 创建全局音效管理器实例
const audioManager = new AudioManager();
window.audioManager = audioManager;

// 添加测试功能
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
