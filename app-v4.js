const bpm_div = document.getElementById('bpm-output');
firstTap = 0
oldTap = 0
lastTap = 0 
timesTapped = 0
diff = 0
averageBPM = 120 // Start with default BPM
timeElapsed = 0

// Improved tap tempo calculation with outlier detection and moving average
let tapTimes = [];
const MAX_TAPS = 8;
const MIN_TAPS = 3;
const TIMEOUT_MS = 3000;
const MIN_BPM = 40;
const MAX_BPM = 300;

function calcBPM() {
    const currentTime = performance.now(); // Usar performance.now() para maior precisão
    
    // Feedback visual imediato usando requestAnimationFrame para máxima responsividade
    const tapBtn = document.getElementById('tap-tempo');
    if (tapBtn) {
        // Aplicar transformação imediatamente
        requestAnimationFrame(() => {
            tapBtn.style.transform = 'scale(0.95)';
            tapBtn.style.backgroundColor = 'var(--primary)';
            tapBtn.style.transition = 'all 0.1s ease';
        });
        
        // Reset após um frame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                tapBtn.style.transform = 'scale(1)';
                tapBtn.style.backgroundColor = '';
            });
        });
    }
    
    // Reset if too much time has passed
    if (tapTimes.length > 0 && currentTime - tapTimes[tapTimes.length - 1] > TIMEOUT_MS) {
        tapTimes = [];
    }
    
    // Add new tap
    tapTimes.push(currentTime);
    
    // Keep only the last MAX_TAPS
    if (tapTimes.length > MAX_TAPS) {
        tapTimes.shift();
    }
    
    // Calculate BPM if we have enough taps
    if (tapTimes.length >= MIN_TAPS) {
        const intervals = [];
        for (let i = 1; i < tapTimes.length; i++) {
            intervals.push(tapTimes[i] - tapTimes[i - 1]);
        }
        
        // Filter outliers for more accurate calculation
        const validIntervals = filterOutliers(intervals);
        
        if (validIntervals.length > 0) {
            const avgInterval = validIntervals.reduce((a, b) => a + b) / validIntervals.length;
            const bpm = Math.round(60000 / avgInterval);
            
            // Apply BPM limits
            const clampedBPM = Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));
            averageBPM = clampedBPM;
            bpm_div.innerHTML = averageBPM;
            
            // Feedback visual do BPM calculado
            if (tapBtn) {
                tapBtn.style.color = 'var(--primary)';
                tapBtn.classList.add('bpm-calculated');
                setTimeout(() => {
                    tapBtn.style.color = '';
                    tapBtn.classList.remove('bpm-calculated');
                }, 500);
            }
        }
    }
}

// Filter outliers using statistical analysis
function filterOutliers(intervals) {
    if (intervals.length < 3) return intervals;
    
    // Calculate mean and standard deviation
    const mean = intervals.reduce((a, b) => a + b) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Filter intervals within 2 standard deviations
    const filtered = intervals.filter(interval => {
        const deviation = Math.abs(interval - mean);
        return deviation <= 2 * stdDev;
    });
    
    // If we filtered too much, use at least 3 intervals
    return filtered.length >= 3 ? filtered : intervals.slice(-3);
}
function resetBPM() {
    // Reset tap tempo calculation
    tapTimes = [];
    
    // Reset legacy variables (kept for compatibility)
    firstTap = 0;
    oldTap = 0;
    lastTap = 0; 
    timesTapped = 0;
    diff = 0;
    averageBPM = 120; // Reset to default BPM
    timeElapsed = 0;
    bpm_div.innerHTML = "120"
}

// Manual BPM controls
function increaseBPM() {
    if (averageBPM < 300) {
        averageBPM += 1;
        bpm_div.innerHTML = averageBPM;
        // Update metronome if playing
        if (isPlaying) {
            updateMetronomeBPM();
        }
    }
}

function decreaseBPM() {
    if (averageBPM > 40) { // Minimum 40 BPM to avoid bugs
        averageBPM -= 1;
        bpm_div.innerHTML = averageBPM;
        // Update metronome if playing
        if (isPlaying) {
            updateMetronomeBPM();
        }
    }
}

// Metronome variables
let metronomeInterval = null;
let isPlaying = false;
let currentBeat = 0;
let audioContext = null;
let clickSounds = {};
let clickBuffers = {}; // Pre-loaded audio buffers for instant playback
let nextBeatTime = 0;
let lastBeatTime = 0;
let metronomeVolume = 0.5; // Default volume (50%)
let ambientVolume = 0.5; // Default volume (50%)

// Volume monitoring variables
let metronomeAnalyserNode = null;
let ambientAnalyserNode = null;
let metronomeDataArray = null;
let ambientDataArray = null;
let volumeMonitorInterval = null;
let metronomeIsClipping = false;
let ambientIsClipping = false;

// Global volume control nodes
let metronomeMasterGainNode = null;
let ambientMasterGainNode = null;

let fps = 60;

// Repertório variables
let repertorios = {};
let currentRepertorioId = 'default';
let currentPresetIndex = -1; // Keep for backward compatibility
let currentPresetId = null; // New: unique preset ID
let isLiveMode = true; // Always active

// Ambient pads variables
let ambientAudio = null;
let currentAmbientKey = null;
let ambientGainNode = null;
let ambientSource = null;
let nextAmbientKey = null;
let nextAmbientAudio = null;
let nextAmbientGainNode = null;
let nextAmbientSource = null;
let isTransitioning = false;

// Initialize audio context and load sounds
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Initialize volume analyzers
        metronomeAnalyserNode = audioContext.createAnalyser();
        metronomeAnalyserNode.fftSize = 256;
        metronomeAnalyserNode.smoothingTimeConstant = 0.8;
        metronomeDataArray = new Uint8Array(metronomeAnalyserNode.frequencyBinCount);
        
        ambientAnalyserNode = audioContext.createAnalyser();
        ambientAnalyserNode.fftSize = 256;
        ambientAnalyserNode.smoothingTimeConstant = 0.8;
        ambientDataArray = new Uint8Array(ambientAnalyserNode.frequencyBinCount);
        
        // Create master gain nodes for volume control
        metronomeMasterGainNode = audioContext.createGain();
        ambientMasterGainNode = audioContext.createGain();
        
        // Set initial volumes
        metronomeMasterGainNode.gain.value = metronomeVolume;
        ambientMasterGainNode.gain.value = ambientVolume;
        
        // Connect analyzers to master gain nodes, then to destination
        metronomeAnalyserNode.connect(metronomeMasterGainNode);
        ambientAnalyserNode.connect(ambientMasterGainNode);
        metronomeMasterGainNode.connect(audioContext.destination);
        ambientMasterGainNode.connect(audioContext.destination);
        
        // Start volume monitoring
        startVolumeMonitoring();
        
        // Load click sounds first
        loadClickSounds();
        
        // Pre-load click sound buffers for instant playback
        preloadClickBuffers();
        
        // Tentar ativar o AudioContext imediatamente se possível
        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(console.error);
        }
    }
}

// Pre-load click sound buffers to eliminate playback delay
async function preloadClickBuffers() {
    const soundTypes = ['3000', 'ASRX', 'SP1200', 'Zoom ST'];
    
    for (const soundType of soundTypes) {
        clickBuffers[soundType] = {
            up: null,
            down: null
        };
        
        // Load up sound
        if (clickSounds[soundType] && clickSounds[soundType].up) {
            try {
                const response = await fetch(clickSounds[soundType].up.src);
                const arrayBuffer = await response.arrayBuffer();
                clickBuffers[soundType].up = await audioContext.decodeAudioData(arrayBuffer);
            } catch (e) {
                console.log('Failed to preload up sound for', soundType, e);
            }
        }
        
        // Load down sound
        if (clickSounds[soundType] && clickSounds[soundType].down) {
            try {
                const response = await fetch(clickSounds[soundType].down.src);
                const arrayBuffer = await response.arrayBuffer();
                clickBuffers[soundType].down = await audioContext.decodeAudioData(arrayBuffer);
            } catch (e) {
                console.log('Failed to preload down sound for', soundType, e);
            }
        }
    }
    
    console.log('Click buffers preloaded successfully');
}

// Load all click sounds with correct filenames
function loadClickSounds() {
    const soundTypes = ['ASRX', '3000', 'SP1200', 'Zoom ST'];
    soundTypes.forEach(type => {
        let upFile, downFile;
        
        // Handle special cases for filenames
        // Simplified file names for web compatibility
        if (type === 'Zoom ST') {
            upFile = 'metronomes/zoomst-up.wav';
            downFile = 'metronomes/zoomst-down.wav';
        } else {
            upFile = `metronomes/${type.toLowerCase()}-up.wav`;
            downFile = `metronomes/${type.toLowerCase()}-down.wav`;
        }
        
        clickSounds[type] = {
            up: new Audio(upFile),
            down: new Audio(downFile)
        };
        
        // Preload sounds
        clickSounds[type].up.preload = 'auto';
        clickSounds[type].down.preload = 'auto';
    });
}

// Play click sound with stereo positioning
function playClick(isDownbeat = false) {
    const soundType = document.getElementById('sound-type').value;
    
    if (audioContext && audioContext.state === 'running') {
        // Use pre-loaded buffer for instant playback
        const buffer = isDownbeat ? clickBuffers[soundType]?.down : clickBuffers[soundType]?.up;
        
        if (buffer) {
            // Create buffer source for instant playback
            const source = audioContext.createBufferSource();
            const gainNode = audioContext.createGain();
            const pannerNode = audioContext.createStereoPanner();
            
            // Set buffer and pan to left channel
            source.buffer = buffer;
            pannerNode.pan.value = -1;
            
            // Set volume with immediate response
            gainNode.gain.setValueAtTime(metronomeVolume, audioContext.currentTime);
            
            // Connect the audio graph
            source.connect(pannerNode);
            pannerNode.connect(gainNode);
            gainNode.connect(metronomeAnalyserNode);
            
            // Play immediately with minimal delay
            source.start(audioContext.currentTime);
        } else {
            // Fallback to original method if buffer not loaded
            const originalSound = isDownbeat ? clickSounds[soundType].down : clickSounds[soundType].up;
            if (originalSound) {
                const sound = new Audio(originalSound.src);
                sound.currentTime = 0;
                sound.play().catch(e => console.log('Audio play failed:', e));
            }
        }
    }
}

// Visual feedback - animate BPM number
function showBeat(isDownbeat = false) {
    const bpmNumber = document.getElementById('bpm-output');
    bpmNumber.classList.remove('beat', 'downbeat');
    
    setTimeout(() => {
        if (isDownbeat) {
            bpmNumber.classList.add('downbeat');
        } else {
            bpmNumber.classList.add('beat');
        }
    }, 10);
    
    setTimeout(() => {
        bpmNumber.classList.remove('beat', 'downbeat');
    }, 200);
}

// Metronome tick
function metronomeTick() {
    currentBeat++;
    const timeSignature = document.getElementById('time-signature').value;
    let isDownbeat = false;
    
    if (timeSignature === '4/4') {
        // In 4/4 time, first beat is downbeat
        isDownbeat = (currentBeat % 4 === 1);
    } else if (timeSignature === '1/4') {
        // In 1/4 time, no downbeat (all beats are the same)
        isDownbeat = false;
    }
    
    playClick(isDownbeat);
    showBeat(isDownbeat);
    
    // Update timing for next beat
    lastBeatTime = Date.now();
    const currentInterval = 60000 / averageBPM;
    nextBeatTime = lastBeatTime + currentInterval;
}

// Toggle metronome play/pause
function toggleMetronome() {
    // Atualizar UI imediatamente para feedback visual instantâneo
    if (isPlaying) {
        document.getElementById('play-pause-btn').textContent = '▶ Play';
        document.getElementById('play-pause-btn').classList.remove('secondary');
        document.getElementById('play-pause-btn').classList.add('primary');
    } else {
        document.getElementById('play-pause-btn').textContent = '⏸ Pause';
        document.getElementById('play-pause-btn').classList.add('secondary');
        document.getElementById('play-pause-btn').classList.remove('primary');
    }
    
    if (!audioContext) {
        initAudio();
    }
    
    // Resume audio context if suspended (required for user interaction)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    if (isPlaying) {
        pauseMetronome();
    } else {
        // Garantir que o AudioContext esteja pronto antes de iniciar
        if (audioContext.state === 'running') {
            startMetronome();
        } else {
            // Aguardar o AudioContext estar pronto
            audioContext.resume().then(() => {
                startMetronome();
            });
        }
    }
    
    // Update master button state
    updateMasterButton();
}

// Update metronome BPM smoothly
function updateMetronomeBPM() {
    if (!isPlaying) return;
    
    const now = Date.now();
    const timeSinceLastBeat = now - lastBeatTime;
    const currentInterval = 60000 / averageBPM;
    
    // Calculate when the next beat should occur
    nextBeatTime = lastBeatTime + currentInterval;
    
    // If we're already past the next beat time, schedule it immediately
    if (now >= nextBeatTime) {
        nextBeatTime = now + currentInterval;
    }
    
    // Clear current interval and set new one
    clearInterval(metronomeInterval);
    scheduleNextBeat();
}

// Schedule the next beat with precise timing
function scheduleNextBeat() {
    if (!isPlaying) return;
    
    const now = Date.now();
    const timeUntilNextBeat = nextBeatTime - now;
    
    if (timeUntilNextBeat <= 0) {
        // Execute beat immediately
        metronomeTick();
        scheduleNextBeat();
    } else {
        // Schedule beat for the correct time
        metronomeInterval = setTimeout(() => {
            metronomeTick();
            scheduleNextBeat();
        }, timeUntilNextBeat);
    }
}

// Start metronome
function startMetronome() {
    const bpm = averageBPM; // Use BPM from the calculator card
    const interval = 60000 / bpm; // Convert BPM to milliseconds
    
    isPlaying = true;
    
    // Update UI immediately for better responsiveness
    document.getElementById('play-pause-btn').textContent = '⏸ Pause';
    document.getElementById('play-pause-btn').classList.add('secondary');
    document.getElementById('play-pause-btn').classList.remove('primary');
    
    // Start immediately with the first beat
    currentBeat = 0; // Reset beat counter
    metronomeTick(); // Play first beat immediately
    
    // Set timing for next beats
    lastBeatTime = Date.now();
    nextBeatTime = lastBeatTime + interval;
    
    // Start the scheduling system for subsequent beats
    scheduleNextBeat();
}

// Pause metronome
function pauseMetronome() {
    if (metronomeInterval) {
        clearTimeout(metronomeInterval);
        metronomeInterval = null;
    }
    isPlaying = false;
    
    document.getElementById('play-pause-btn').textContent = '▶ Play';
    document.getElementById('play-pause-btn').classList.add('primary');
    document.getElementById('play-pause-btn').classList.remove('secondary');
}

// Stop metronome
function stopMetronome() {
    pauseMetronome();
    currentBeat = 0;
    
    // Reset visual indicator
    const bpmNumber = document.getElementById('bpm-output');
    bpmNumber.classList.remove('beat', 'downbeat');
}


// Initialize audio when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar áudio imediatamente para melhor responsividade
    initAudio();
    
    // Garantir que o AudioContext esteja pronto
    if (audioContext && audioContext.state === 'suspended') {
        // Tentar ativar o AudioContext em qualquer interação do usuário
        const activateAudio = function() {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        };
        
        // Adicionar listeners para click e touch
        document.addEventListener('click', activateAudio, { once: true });
        document.addEventListener('touchstart', activateAudio, { once: true });
    }
    
    // Otimizar botão de play/pause para touch
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (playPauseBtn) {
        // Adicionar event listeners para touch com prioridade
        playPauseBtn.addEventListener('touchstart', function(e) {
            e.preventDefault(); // Prevenir delay do touch
            toggleMetronome();
        }, { passive: false });
        
        // Manter o click como fallback
        playPauseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleMetronome();
        });
    }
    
    // Otimizar botões de BPM para touch
    const bpmButtons = document.querySelectorAll('.bpm-btn');
    bpmButtons.forEach(btn => {
        btn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (this.textContent === '+') {
                increaseBPM();
            } else if (this.textContent === '-') {
                decreaseBPM();
            }
        }, { passive: false });
    });
    
    // Otimizar botão TAP para touch
    const tapBtn = document.querySelector('button[onclick="calcBPM()"]');
    if (tapBtn) {
        // Remover o onclick do HTML para evitar conflitos
        tapBtn.removeAttribute('onclick');
        
        // Touch events com máxima responsividade
        tapBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            calcBPM();
        }, { passive: false });
        
        // Click como fallback
        tapBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            calcBPM();
        });
        
        // Adicionar feedback tátil se disponível
        tapBtn.addEventListener('touchstart', function() {
            if (navigator.vibrate) {
                navigator.vibrate(50); // Vibração de 50ms
            }
        });
    }
    
    // Otimizar botões de preset para touch
    const presetButtons = document.querySelectorAll('.btn-live');
    presetButtons.forEach(btn => {
        btn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (this.classList.contains('prev')) {
                previousPreset();
            } else if (this.classList.contains('next')) {
                nextPreset();
            }
        }, { passive: false });
    });
    
    // Otimizar pads ambientais para touch
    const padButtons = document.querySelectorAll('.pad');
    padButtons.forEach(pad => {
        pad.addEventListener('touchstart', function(e) {
            e.preventDefault();
            const key = this.getAttribute('data-key');
            if (key) {
                playAmbient(key);
            }
        }, { passive: false });
    });
    
    loadRepertorio();
    
    // Add event listener for sound type changes
    document.getElementById('sound-type').addEventListener('change', function() {
        // Sound will change on next beat
        if (isInSession && !isApplyingSessionState) {
            updateSessionState({ soundType: this.value });
        }
    });
    
    // Add event listener for time signature changes
    document.getElementById('time-signature').addEventListener('change', function() {
        // Time signature will change on next beat
        if (isInSession && !isApplyingSessionState) {
            updateSessionState({ timeSignature: this.value });
        }
    });
});

// Ambient pads functionality
// Force play ambient without toggle logic (for presets)
function forcePlayAmbient(key) {
    console.log('forcePlayAmbient called with key:', key);
    
    // Block if already transitioning
    if (isTransitioning) {
        console.log('Transition in progress, please wait...');
        return;
    }
    
    // Ensure audio context is initialized
    if (!audioContext) {
        console.log('Initializing audio context...');
        initAudio();
    }
    
    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
        console.log('Resuming audio context...');
        audioContext.resume();
    }
    
    // Map keys to file names (simplified names for web compatibility)
    const keyToFile = {
        'C': 'c.wav',
        'C#': 'csharp.wav',
        'D': 'd.wav',
        'D#': 'dsharp.wav',
        'E': 'e.wav',
        'F': 'f.wav',
        'F#': 'fsharp.wav',
        'G': 'g.wav',
        'G#': 'gsharp.wav',
        'A': 'a.wav',
        'A#': 'asharp.wav',
        'B': 'b.wav'
    };
    
    const fileName = keyToFile[key];
    if (!fileName) {
        console.error('Invalid key:', key);
        return;
    }
    
    console.log('Starting new ambient with file:', fileName);
    console.log('About to call startNewAmbient with key:', key, 'fileName:', fileName);
    // Start new ambient
    startNewAmbient(key, fileName);
}

// Variables for seamless looping
let loopAudio1 = null;
let loopAudio2 = null;
let loopSource1 = null;
let loopSource2 = null;
let loopGain1 = null;
let loopGain2 = null;
let currentLoopAudio = 1; // 1 or 2
let isLooping = false;

// Setup seamless looping with crossfade
function setupSeamlessLoop(audioElement) {
    console.log('Setting up seamless loop for:', audioElement.src);
    
    // Create two audio elements for crossfading
    loopAudio1 = new Audio(audioElement.src);
    loopAudio2 = new Audio(audioElement.src);
    
    loopAudio1.crossOrigin = 'anonymous';
    loopAudio2.crossOrigin = 'anonymous';
    
    // Set up the first audio element
    loopAudio1.addEventListener('canplaythrough', () => {
        console.log('Loop audio 1 ready');
        setupLoopAudio(1);
    });
    
    // Set up the second audio element
    loopAudio2.addEventListener('canplaythrough', () => {
        console.log('Loop audio 2 ready');
        setupLoopAudio(2);
    });
    
    // Load both audio elements
    loopAudio1.load();
    loopAudio2.load();
}

function setupLoopAudio(audioNumber) {
    const audio = audioNumber === 1 ? loopAudio1 : loopAudio2;
    const source = audioNumber === 1 ? loopSource1 : loopSource2;
    const gain = audioNumber === 1 ? loopGain1 : loopGain2;
    
    if (source) return; // Already set up
    
    console.log('Setting up loop audio', audioNumber);
    
    // Create audio context nodes
    const newSource = audioContext.createMediaElementSource(audio);
    const newGain = audioContext.createGain();
    const panner = audioContext.createStereoPanner();
    
    // Set pan to right channel
    panner.pan.value = 1;
    
    // Connect audio graph: source -> panner -> gain -> analyzer -> master gain -> destination
    newSource.connect(panner);
    panner.connect(newGain);
    newGain.connect(ambientAnalyserNode); // Connect to analyzer for monitoring
    // Note: ambientAnalyserNode is already connected to ambientMasterGainNode
    
    // Set initial volume
    newGain.gain.value = 0;
    console.log('Setup loop audio', audioNumber, '- gain node created and connected');
    
    // Store references
    if (audioNumber === 1) {
        loopSource1 = newSource;
        loopGain1 = newGain;
    } else {
        loopSource2 = newSource;
        loopGain2 = newGain;
    }
    
    // Set up loop event listener
    audio.addEventListener('ended', () => {
        console.log('Loop audio', audioNumber, 'ended, starting crossfade');
        startLoopCrossfade();
    });
    
    // Start playing if both audios are ready
    if (loopSource1 && loopSource2 && !isLooping) {
        console.log('Both loop audios ready, starting seamless loop');
        startLooping();
        
        // Update UI

        nextAmbientKey = null;
        updatePadUI(currentAmbientKey);
        updateMasterButton();
        console.log('Ambient pad loaded and playing with seamless loop:', currentAmbientKey);
    }
}

function startLooping() {
    if (isLooping) return;
    
    console.log('Starting seamless looping');
    isLooping = true;
    currentLoopAudio = 1;
    
    // Start the first audio
    if (loopAudio1 && loopSource1) {
        console.log('Starting loop audio 1, current ambientVolume:', ambientVolume);
        loopAudio1.currentTime = 0;
        loopAudio1.play().then(() => {
            console.log('Loop audio 1 started successfully');
            // Fade in
            fadeInLoopAudio(1);
        }).catch(e => {
            console.error('Failed to start loop audio 1:', e);
        });
    } else {
        console.error('Cannot start looping - missing loopAudio1 or loopSource1');
        console.log('loopAudio1:', loopAudio1);
        console.log('loopSource1:', loopSource1);
    }
}

function startLoopCrossfade() {
    if (!isLooping) return;
    
    console.log('Starting loop crossfade');
    const currentAudio = currentLoopAudio;
    const nextAudio = currentAudio === 1 ? 2 : 1;
    
    // Start the next audio
    const nextLoopAudio = nextAudio === 1 ? loopAudio1 : loopAudio2;
    const nextLoopGain = nextAudio === 1 ? loopGain1 : loopGain2;
    
    if (nextLoopAudio && nextLoopGain) {
        nextLoopAudio.currentTime = 0;
        nextLoopAudio.play().then(() => {
            console.log('Next loop audio started, crossfading');
            
            // Crossfade over 2 seconds
            const crossfadeTime = 2;
            const now = audioContext.currentTime;
            
            // Fade in next audio
            nextLoopGain.gain.setValueAtTime(0, now);
            nextLoopGain.gain.linearRampToValueAtTime(ambientVolume, now + crossfadeTime);
            
            // Fade out current audio
            const currentLoopGain = currentAudio === 1 ? loopGain1 : loopGain2;
            if (currentLoopGain) {
                currentLoopGain.gain.setValueAtTime(ambientVolume, now);
                currentLoopGain.gain.linearRampToValueAtTime(0, now + crossfadeTime);
            }
            
            // Update current audio reference
            currentLoopAudio = nextAudio;
        });
    }
}

function fadeInLoopAudio(audioNumber) {
    const gain = audioNumber === 1 ? loopGain1 : loopGain2;
    if (!gain) return;
    
    const now = audioContext.currentTime;
    const targetVolume = ambientVolume; // ambientVolume is already 0-1 range
    console.log('fadeInLoopAudio - audioNumber:', audioNumber, 'targetVolume:', targetVolume);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(targetVolume, now + 1);
}

function stopLooping() {
    if (!isLooping) return;
    
    console.log('Stopping seamless looping');
    isLooping = false;
    
    // Stop both audio elements
    if (loopAudio1) {
        loopAudio1.pause();
        loopAudio1 = null;
    }
    if (loopAudio2) {
        loopAudio2.pause();
        loopAudio2 = null;
    }
    
    // Disconnect audio nodes
    if (loopSource1) {
        loopSource1.disconnect();
        loopSource1 = null;
    }
    if (loopSource2) {
        loopSource2.disconnect();
        loopSource2 = null;
    }
    if (loopGain1) {
        loopGain1.disconnect();
        loopGain1 = null;
    }
    if (loopGain2) {
        loopGain2.disconnect();
        loopGain2 = null;
    }
    
    currentLoopAudio = 1;
}

function playAmbient(key, isPresetNavigation = false) {
    console.log('playAmbient called with key:', key, 'isPresetNavigation:', isPresetNavigation);
    console.log('Current ambient key:', currentAmbientKey);
    console.log('Is transitioning:', isTransitioning);
    
    // If clicking the same pad that's already playing, stop it (only for manual clicks, not preset navigation)
    if (currentAmbientKey === key && !isTransitioning && !isPresetNavigation) {
        console.log('Same pad, stopping ambient (manual click)');
        stopAmbient();
        return;
    }
    
    // For preset navigation with same pad, just continue
    if (currentAmbientKey === key && isPresetNavigation) {
        console.log('Same pad in preset navigation, continuing');
        updatePadUI(key);
        return;
    }
    
    // Block if already transitioning
    if (isTransitioning) {
        console.log('Transition in progress, please wait...');
        // Show visual feedback that transition is blocked
        showTransitionBlocked(key);
        return;
    }
    
    // Ensure audio context is initialized
    if (!audioContext) {
        initAudio();
    }
    
    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    // Map keys to file names
    const keyToFile = {
        'C': 'c.wav',
        'C#': 'csharp.wav',
        'D': 'd.wav',
        'D#': 'dsharp.wav',
        'E': 'e.wav',
        'F': 'f.wav',
        'F#': 'fsharp.wav',
        'G': 'g.wav',
        'G#': 'gsharp.wav',
        'A': 'a.wav',
        'A#': 'asharp.wav',
        'B': 'b.wav'
    };
    
    const fileName = keyToFile[key];
    if (!fileName) return;
    
    // If there's already an ambient playing, start crossfade
    if (currentAmbientKey && ambientAudio) {
        // Set transition flag
        isTransitioning = true;
        
        // Set the next ambient key for visual feedback
        nextAmbientKey = key;
        
        // Start visual transition - make next pad blink
        startVisualTransition(key);
        
        // Start crossfade: new ambient starts while current fades out
        startCrossfade(key, fileName);
    } else {
        startNewAmbient(key, fileName);
    }
}

function startCrossfade(key, fileName) {
    // Create new audio element for crossfade
    nextAmbientAudio = new Audio(`ambiences/${fileName}`);
    nextAmbientAudio.loop = true;
    nextAmbientAudio.crossOrigin = 'anonymous';
    
    // Wait for new audio to be ready
    nextAmbientAudio.addEventListener('canplaythrough', () => {
        // Create audio context nodes for new ambient
        nextAmbientSource = audioContext.createMediaElementSource(nextAmbientAudio);
        nextAmbientGainNode = audioContext.createGain();
        const nextAmbientPannerNode = audioContext.createStereoPanner();
        
        // Set pan to right channel (same as original ambient)
        nextAmbientPannerNode.pan.value = 1;
        
        // Set initial volume to 0 for fade in
        nextAmbientGainNode.gain.value = 0;
        
        // Connect audio graph for new ambient
        nextAmbientSource.connect(nextAmbientPannerNode);
        nextAmbientPannerNode.connect(nextAmbientGainNode);
        nextAmbientGainNode.connect(ambientAnalyserNode); // Connect to analyzer for monitoring
        // Note: ambientAnalyserNode is already connected to ambientMasterGainNode
        
        // Start playing new ambient
        nextAmbientAudio.play().then(() => {
            // Start crossfade: fade in new, fade out old
            crossfadeAmbients(key);
        }).catch(e => console.log('Next ambient play failed:', e));
    });
    
    // Load the new audio
    nextAmbientAudio.load();
}

function crossfadeAmbients(key) {
    const fadeTime = 3; // 3 seconds
    const startTime = audioContext.currentTime;
    
    // Fade in new ambient
    if (nextAmbientGainNode) {
        nextAmbientGainNode.gain.setValueAtTime(0, startTime);
        nextAmbientGainNode.gain.linearRampToValueAtTime(ambientVolume, startTime + fadeTime);
    }
    
    // Fade out current ambient
    if (ambientGainNode) {
        const currentGain = ambientGainNode.gain.value;
        ambientGainNode.gain.setValueAtTime(currentGain, startTime);
        ambientGainNode.gain.linearRampToValueAtTime(0, startTime + fadeTime);
    }
    
    // After crossfade, clean up old ambient and switch to new
    setTimeout(() => {
        // Clean up old ambient
        if (ambientAudio) {
            ambientAudio.pause();
            ambientAudio = null;
        }
        if (ambientSource) {
            ambientSource.disconnect();
            ambientSource = null;
        }
        if (ambientGainNode) {
            ambientGainNode.disconnect();
            ambientGainNode = null;
        }
        
        // Switch to new ambient
        ambientAudio = nextAmbientAudio;
        ambientSource = nextAmbientSource;
        ambientGainNode = nextAmbientGainNode;
        
        // Clear next ambient variables
        nextAmbientAudio = null;
        nextAmbientSource = null;
        nextAmbientGainNode = null;
        
        // Update UI
        currentAmbientKey = key;
        nextAmbientKey = null;
        updatePadUI(key);
        
        // Release transition lock
        isTransitioning = false;
    }, fadeTime * 1000 + 100);
}

function startNewAmbient(key, fileName) {
    console.log('startNewAmbient called with key:', key, 'fileName:', fileName);
    
    // Set current ambient key before setup
    currentAmbientKey = key;
    
    // Clean up any existing audio
    if (ambientAudio) {
        console.log('Cleaning up existing ambient audio');
        ambientAudio.pause();
        ambientAudio = null;
    }
    if (ambientSource) {
        ambientSource.disconnect();
        ambientSource = null;
    }
    if (ambientGainNode) {
        ambientGainNode.disconnect();
        ambientGainNode = null;
    }
    
    // Stop any existing seamless loop
    stopLooping();
    
    // Create new audio element with traditional loop
    console.log('Creating new audio element for:', fileName);
    ambientAudio = new Audio(`ambiences/${fileName}`);
    ambientAudio.loop = true;
    ambientAudio.crossOrigin = 'anonymous';
    
    // Wait for audio to be ready
    ambientAudio.addEventListener('canplaythrough', () => {
        console.log('Audio can play through, setting up audio graph');
        // Create audio context nodes for smooth transitions
        ambientSource = audioContext.createMediaElementSource(ambientAudio);
        ambientGainNode = audioContext.createGain();
        const ambientPannerNode = audioContext.createStereoPanner();
        
        // Set pan to right channel (1 = right, 0 = center, -1 = left)
        ambientPannerNode.pan.value = 1;
        
        // Set initial volume to 0 for fade in
        ambientGainNode.gain.value = 0;
        
        // Connect audio graph: source -> panner -> gain -> analyzer -> master gain -> destination
        ambientSource.connect(ambientPannerNode);
        ambientPannerNode.connect(ambientGainNode);
        ambientGainNode.connect(ambientAnalyserNode); // Connect to analyzer for monitoring
        // Note: ambientAnalyserNode is already connected to ambientMasterGainNode
        
        // Start playing
        console.log('Starting audio playback...');
        ambientAudio.play().then(() => {
            console.log('Audio playback started successfully');
            // Fade in over 3 seconds
            fadeInAmbient();
            
            // Update UI
            nextAmbientKey = null;
            updatePadUI(key);
            updateMasterButton();
            console.log('Ambient pad loaded and playing:', key);
        }).catch(e => console.log('Ambient play failed:', e));
    });
    
    // Load the audio
    ambientAudio.load();
}

function stopAmbient() {
    // Stop seamless looping first
    stopLooping();
    
    if (ambientAudio) {
        if (ambientGainNode) {
            // Fade out over 3 seconds
            fadeOutAmbient(() => {
                cleanupAmbient();
                updateMasterButton();
            });
        } else {
            // If no gain node, stop immediately
            cleanupAmbient();
            updateMasterButton();
        }
    }
}

function cleanupAmbient() {
    // Clean up current ambient
    if (ambientAudio) {
        ambientAudio.pause();
        ambientAudio.currentTime = 0;
        ambientAudio = null;
    }
    if (ambientSource) {
        ambientSource.disconnect();
        ambientSource = null;
    }
    if (ambientGainNode) {
        ambientGainNode.disconnect();
        ambientGainNode = null;
    }
    
    // Clean up next ambient if exists
    if (nextAmbientAudio) {
        nextAmbientAudio.pause();
        nextAmbientAudio.currentTime = 0;
        nextAmbientAudio = null;
    }
    if (nextAmbientSource) {
        nextAmbientSource.disconnect();
        nextAmbientSource = null;
    }
    if (nextAmbientGainNode) {
        nextAmbientGainNode.disconnect();
        nextAmbientGainNode = null;
    }
    
    currentAmbientKey = null;
    nextAmbientKey = null;
    isTransitioning = false;
    updatePadUI(null);
}

function fadeInAmbient() {
    if (!ambientGainNode) return;
    
    const fadeTime = 3; // 3 seconds
    const startTime = audioContext.currentTime;
    
    ambientGainNode.gain.setValueAtTime(0, startTime);
    ambientGainNode.gain.linearRampToValueAtTime(ambientVolume, startTime + fadeTime);
}

function fadeOutAmbient(callback) {
    if (!ambientGainNode || !audioContext) {
        if (callback) callback();
        return;
    }
    
    const fadeTime = 3; // 3 seconds
    const startTime = audioContext.currentTime;
    const currentGain = ambientGainNode.gain.value;
    
    // Ensure we have a valid gain value
    if (currentGain <= 0) {
        if (callback) callback();
        return;
    }
    
    ambientGainNode.gain.setValueAtTime(currentGain, startTime);
    ambientGainNode.gain.linearRampToValueAtTime(0, startTime + fadeTime);
    
    // Execute callback after fade out
    setTimeout(() => {
        if (callback) callback();
    }, fadeTime * 1000 + 100); // Add small buffer
}

function startVisualTransition(nextKey) {
    const nextPad = document.querySelector(`[data-key="${nextKey}"]`);
    if (!nextPad) return;
    
    // Add transition class to next pad
    nextPad.classList.add('transitioning');
    
    // Create blinking effect
    let blinkCount = 0;
    const maxBlinks = 6; // 3 seconds of blinking (500ms intervals)
    
    const blinkInterval = setInterval(() => {
        nextPad.classList.toggle('blinking');
        blinkCount++;
        
        if (blinkCount >= maxBlinks) {
            clearInterval(blinkInterval);
            nextPad.classList.remove('blinking', 'transitioning');
        }
    }, 500); // Blink every 500ms
}

function showTransitionBlocked(key) {
    const pad = document.querySelector(`[data-key="${key}"]`);
    if (!pad) return;
    
    // Add blocked class for visual feedback
    pad.classList.add('blocked');
    
    // Remove blocked class after short duration
    setTimeout(() => {
        pad.classList.remove('blocked');
    }, 500);
}

function updatePadUI(activeKey) {
    // Remove all classes from all pads
    document.querySelectorAll('.pad').forEach(pad => {
        pad.classList.remove('active', 'transitioning', 'blinking', 'blocked');
    });
    
    // Add active class to current pad
    if (activeKey) {
        const activePad = document.querySelector(`[data-key="${activeKey}"]`);
        if (activePad) {
            activePad.classList.add('active');
        }
    }
}

// Function to convert percentage to dB with safety limit
function percentageToDb(percentage) {
    // If percentage is 0, return 0 for complete mute
    if (percentage == 0) {
        return 0;
    }
    
    // Convert percentage to linear gain (0-1)
    const linearGain = percentage / 100;
    
    // Convert to dB, but limit to -12dB minimum to prevent system overload (more restrictive)
    const db = Math.max(20 * Math.log10(linearGain), -12);
    
    // Convert back to linear gain for Web Audio API
    return Math.pow(10, db / 20);
}

// Volume control functions
function setMetronomeVolume(percentage) {
    metronomeVolume = percentageToDb(percentage);
    document.getElementById('metronome-volume-value').textContent = percentage + '%';
    
    // Update master gain node for immediate volume control
    if (metronomeMasterGainNode && audioContext) {
        metronomeMasterGainNode.gain.setValueAtTime(metronomeVolume, audioContext.currentTime);
    }
    
    console.log('Metronome volume set to:', percentage + '%', 'dB:', metronomeVolume);
}

function setAmbientVolume(percentage) {
    ambientVolume = percentageToDb(percentage);
    document.getElementById('ambient-volume-value').textContent = percentage + '%';
    
    // Update master gain node for immediate volume control
    if (ambientMasterGainNode && audioContext) {
        ambientMasterGainNode.gain.setValueAtTime(ambientVolume, audioContext.currentTime);
    }
    
    console.log('Ambient volume set to:', percentage + '%', 'dB:', ambientVolume);
}

// Volume monitoring functions
function startVolumeMonitoring() {
    if (volumeMonitorInterval) {
        clearInterval(volumeMonitorInterval);
    }
    
    volumeMonitorInterval = setInterval(updateVolumeDisplay, 50); // Update every 50ms
}

function updateVolumeDisplay() {
    
    // Update metronome volume display - combine audio level with controlled volume
    const metronomeSlider = document.getElementById('metronome-volume');
    const metronomePercentage = parseInt(metronomeSlider.value);
    
    let metronomeDisplayDb = -80; // Default to mute
    
    if (metronomePercentage > 0 && metronomeAnalyserNode && metronomeDataArray) {
        // Get actual audio level
        metronomeAnalyserNode.getByteTimeDomainData(metronomeDataArray);
        let metronomeSum = 0;
        for (let i = 0; i < metronomeDataArray.length; i++) {
            const normalized = (metronomeDataArray[i] - 128) / 128;
            metronomeSum += normalized * normalized;
        }
        const metronomeRms = Math.sqrt(metronomeSum / metronomeDataArray.length);
        
        // Convert audio level to dB
        const audioDb = metronomeRms > 0 ? 20 * Math.log10(metronomeRms) : -80;
        
        // Apply volume control (convert percentage to linear gain)
        const volumeGain = metronomePercentage / 100;
        const volumeDb = 20 * Math.log10(volumeGain);
        
        // Combine audio level with volume control
        metronomeDisplayDb = Math.max(audioDb + volumeDb, -80);
    }
    
    // Update metronome volume bar
    const metronomeVolumePercentage = Math.max(0, Math.min(100, ((metronomeDisplayDb + 80) / 80) * 100));
    document.getElementById('metronome-volume-bar').style.height = metronomeVolumePercentage + '%';
    
    // Update metronome dB display
    document.getElementById('metronome-volume-level').textContent = metronomeDisplayDb.toFixed(1) + ' dB';
    
    // Check for metronome clipping
    const clippingThreshold = -6;
    if (metronomeDisplayDb > clippingThreshold && !metronomeIsClipping) {
        metronomeIsClipping = true;
        document.getElementById('metronome-clipping-warning').classList.remove('hidden');
    } else if (metronomeDisplayDb <= clippingThreshold && metronomeIsClipping) {
        metronomeIsClipping = false;
        document.getElementById('metronome-clipping-warning').classList.add('hidden');
    }
    
    // Update ambient volume display - combine audio level with controlled volume
    const ambientSlider = document.getElementById('ambient-volume');
    const ambientPercentage = parseInt(ambientSlider.value);
    
    let ambientDisplayDb = -80; // Default to mute
    
    if (ambientPercentage > 0 && ambientAnalyserNode && ambientDataArray) {
        // Get actual audio level
        ambientAnalyserNode.getByteTimeDomainData(ambientDataArray);
        let ambientSum = 0;
        for (let i = 0; i < ambientDataArray.length; i++) {
            const normalized = (ambientDataArray[i] - 128) / 128;
            ambientSum += normalized * normalized;
        }
        const ambientRms = Math.sqrt(ambientSum / ambientDataArray.length);
        
        // Convert audio level to dB
        const audioDb = ambientRms > 0 ? 20 * Math.log10(ambientRms) : -80;
        
        // Apply volume control (convert percentage to linear gain)
        const volumeGain = ambientPercentage / 100;
        const volumeDb = 20 * Math.log10(volumeGain);
        
        // Combine audio level with volume control
        ambientDisplayDb = Math.max(audioDb + volumeDb, -80);
    }
    
    // Update ambient volume bar
    const ambientVolumePercentage = Math.max(0, Math.min(100, ((ambientDisplayDb + 80) / 80) * 100));
    document.getElementById('ambient-volume-bar').style.height = ambientVolumePercentage + '%';
    
    // Update ambient dB display
    document.getElementById('ambient-volume-level').textContent = ambientDisplayDb.toFixed(1) + ' dB';
    
    // Check for ambient clipping
    if (ambientDisplayDb > clippingThreshold && !ambientIsClipping) {
        ambientIsClipping = true;
        document.getElementById('ambient-clipping-warning').classList.remove('hidden');
    } else if (ambientDisplayDb <= clippingThreshold && ambientIsClipping) {
        ambientIsClipping = false;
        document.getElementById('ambient-clipping-warning').classList.add('hidden');
    }
}


function stopVolumeMonitoring() {
    if (volumeMonitorInterval) {
        clearInterval(volumeMonitorInterval);
        volumeMonitorInterval = null;
    }
}

// ===== MASTER CONTROLS =====

// Master play/stop function
function toggleMasterPlay() {
    const masterBtn = document.getElementById('master-play-btn');
    
    if (isPlaying || currentAmbientKey) {
        // Stop everything
        if (isPlaying) {
            toggleMetronome();
        }
        if (currentAmbientKey) {
            stopAmbient();
        }
        masterBtn.textContent = '▶ PLAY ALL';
        masterBtn.classList.remove('playing');
    } else {
        // Start metronome
        toggleMetronome();
        masterBtn.textContent = '⏸ STOP ALL';
        masterBtn.classList.add('playing');
    }
}

// Update master button state
function updateMasterButton() {
    const masterBtn = document.getElementById('master-play-btn');
    
    if (isPlaying || currentAmbientKey) {
        masterBtn.textContent = '⏸ STOP ALL';
        masterBtn.classList.add('playing');
    } else {
        masterBtn.textContent = '▶ PLAY ALL';
        masterBtn.classList.remove('playing');
    }
}

// ===== REPERTÓRIO FUNCTIONS =====

// Load repertórios from localStorage
function loadRepertorio() {
    console.log('loadRepertorio called');
    const saved = localStorage.getItem('bpm-metronome-repertorios');
    console.log('Saved data from localStorage:', saved);
    
    if (saved) {
        repertorios = JSON.parse(saved);
        console.log('Loaded repertorios:', repertorios);
    } else {
        console.log('No saved data, creating default repertório');
        // Create default repertório
        repertorios = {
            'default': {
                id: 'default',
                name: 'Repertório Padrão',
                presets: []
            }
        };
    }
    renderRepertorioTabs();
    renderRepertorio();
}

// Save repertórios to localStorage
function saveRepertorio() {
    console.log('saveRepertorio called');
    console.log('Saving repertorios:', repertorios);
    console.log('Current repertorio ID:', currentRepertorioId);
    console.log('Current repertorio data:', repertorios[currentRepertorioId]);
    
    // Only create default repertório if it doesn't exist and we're trying to save it
    if (!repertorios[currentRepertorioId] && currentRepertorioId === 'default') {
        console.log('Creating default repertório before save');
        repertorios['default'] = {
            id: 'default',
            name: 'Repertório Padrão',
            presets: []
        };
    }
    
    localStorage.setItem('bpm-metronome-repertorios', JSON.stringify(repertorios));
    console.log('Saved to localStorage');
    
    // Sincronizar repertório na sessão se estiver conectado
    if (isInSession && !isApplyingSessionState) {
        console.log('Sincronizando repertório na sessão...');
        updateSessionState({ 
            repertorios: repertorios,
            currentRepertorioId: currentRepertorioId
        });
    }
}

// Get current repertório
function getCurrentRepertorio() {
    console.log('getCurrentRepertorio called with ID:', currentRepertorioId);
    console.log('Available repertorios:', Object.keys(repertorios));
    
    // If the current repertorio doesn't exist, return default or create it only if it's a valid new ID
    if (!repertorios[currentRepertorioId]) {
        console.log('Current repertorio not found');
        
        // If we're looking for default and it doesn't exist, create it
        if (currentRepertorioId === 'default') {
            console.log('Creating default repertório');
            repertorios['default'] = {
                id: 'default',
                name: 'Repertório Padrão',
                presets: []
            };
        } else {
            // For other IDs, switch to default instead of creating new
            console.log('Switching to default repertório');
            currentRepertorioId = 'default';
            if (!repertorios['default']) {
                repertorios['default'] = {
                    id: 'default',
                    name: 'Repertório Padrão',
                    presets: []
                };
            }
        }
    }
    
    const result = repertorios[currentRepertorioId];
    console.log('Returning repertorio:', result);
    return result;
}

// Render repertório tabs
function renderRepertorioTabs() {
    console.log('renderRepertorioTabs called');
    console.log('Available repertorios:', Object.keys(repertorios));
    console.log('Repertorios data:', repertorios);
    
    const tabsContainer = document.getElementById('repertorio-tabs');
    tabsContainer.innerHTML = '';
    
    Object.entries(repertorios).forEach(([key, repertorio]) => {
        console.log('Rendering tab for repertorio:', key, repertorio.id, repertorio.name);
        const tab = document.createElement('div');
        tab.className = `repertorio-tab ${key === currentRepertorioId ? 'active' : ''}`;
        tab.innerHTML = `
            <div class="tab-content">
                <span class="tab-name">${repertorio.name}</span>
                <div class="tab-actions">
                    ${key !== 'default' ? '<span class="tab-close" onclick="deleteRepertorio(\'' + key + '\')">×</span>' : ''}
                </div>
            </div>
        `;
        tab.onclick = () => switchRepertorio(key);
        tabsContainer.appendChild(tab);
    });
    
    // Add + button for new repertório
    const addTab = document.createElement('div');
    addTab.className = 'repertorio-tab add-tab';
    addTab.innerHTML = '+';
    addTab.onclick = addNewRepertorio;
    addTab.title = 'Adicionar novo repertório';
    tabsContainer.appendChild(addTab);
}

// Switch to different repertório
function switchRepertorio(repertorioId) {
    console.log('switchRepertorio called with ID:', repertorioId);
    console.log('Current preset ID before switch:', currentPresetId);
    console.log('Current repertorio ID before switch:', currentRepertorioId);
    
    currentRepertorioId = repertorioId;
    
    // Don't change the current preset when switching tabs
    // The active preset should remain active regardless of which repertório is being viewed
    console.log('Switching to repertório:', repertorioId, 'keeping preset ID:', currentPresetId);
    
    renderRepertorioTabs();
    renderRepertorio();
    
    // Ensure the display is updated
    updateCurrentPresetDisplay();
    
    // Sincronizar mudança de repertório na sessão
    if (isInSession && !isApplyingSessionState) {
        updateSessionState({ currentRepertorioId: currentRepertorioId });
    }
}

// Add new repertório
function addNewRepertorio() {
    const name = prompt('Nome do novo repertório:');
    if (!name) return;
    
    const id = Date.now().toString();
    repertorios[id] = {
        id: id,
        name: name,
        presets: []
    };
    
    saveRepertorio();
    renderRepertorioTabs();
    switchRepertorio(id);
}

// Delete repertório
function deleteRepertorio(repertorioId) {
    console.log('deleteRepertorio called with ID:', repertorioId);
    console.log('Current repertorio ID:', currentRepertorioId);
    console.log('Available repertorios before delete:', Object.keys(repertorios));
    console.log('Repertorio to delete exists?', repertorioId in repertorios);
    
    if (repertorioId === 'default') {
        console.log('Cannot delete default repertório');
        return; // Can't delete default
    }
    
    if (!(repertorioId in repertorios)) {
        console.log('ERROR: Repertório not found in repertorios object');
        console.log('Available repertorios:', Object.keys(repertorios));
        console.log('Looking for:', repertorioId);
        alert('Erro: Repertório não encontrado');
        return;
    }
    
    if (confirm('Tem certeza que deseja deletar este repertório?')) {
        console.log('Deleting repertório:', repertorioId);
        delete repertorios[repertorioId];
        
        if (currentRepertorioId === repertorioId) {
            console.log('Switching to default repertório after delete');
            currentRepertorioId = 'default';
            currentPresetIndex = -1;
        }
        
        console.log('Available repertorios after delete:', Object.keys(repertorios));
        saveRepertorio();
        renderRepertorioTabs();
        renderRepertorio();
    }
}

// Render repertório list
function renderRepertorio() {
    console.log('renderRepertorio called');
    const list = document.getElementById('repertorio-list');
    list.innerHTML = '';
    
    const currentRepertorio = getCurrentRepertorio();
    const presets = currentRepertorio.presets || [];
    
    console.log('Current repertorio in renderRepertorio:', currentRepertorio);
    console.log('Presets to render:', presets);
    console.log('Presets length:', presets.length);
    
    if (presets.length === 0) {
        console.log('No presets found, showing empty message');
        list.innerHTML = '<div style="text-align: center; color: var(--muted-foreground); padding: 2rem;">Nenhum preset salvo</div>';
    } else {
        presets.forEach((preset, index) => {
            console.log(`Rendering preset ${index}:`, preset);
            const isActive = preset.id === currentPresetId;
            const item = document.createElement('div');
            item.className = `preset-item ${isActive ? 'active' : ''}`;
            item.draggable = true;
            item.dataset.index = index;
            item.innerHTML = `
                <div class="preset-order-controls">
                    <button class="btn-move-up" onclick="movePresetUp(${index})" title="Mover para cima">↑</button>
                    <button class="btn-move-down" onclick="movePresetDown(${index})" title="Mover para baixo">↓</button>
                </div>
                <div class="preset-info">
                    <div class="preset-name">${preset.name}</div>
                    <div class="preset-bpm">${preset.bpm} BPM</div>
                    <div class="preset-pad">${preset.pad || 'Nenhum'}</div>
                </div>
                <div class="preset-actions">
                    <button class="btn-play" onclick="loadPreset(${index})" title="Tocar música">▶</button>
                    <button class="btn-edit" onclick="editPreset(${index})" title="Editar preset">✎</button>
                    <button class="btn-delete" onclick="deletePreset(${index})" title="Deletar preset">✕</button>
                </div>
            `;
            
            // Add drag event listeners
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragend', handleDragEnd);
            
            list.appendChild(item);
        });
    }
    
    // Add "Adicionar Música" button after the list (only if it doesn't exist)
    let addMusicContainer = document.querySelector('.repertorio-add-music');
    if (!addMusicContainer) {
        addMusicContainer = document.createElement('div');
        addMusicContainer.className = 'repertorio-add-music';
        list.parentNode.insertBefore(addMusicContainer, list.nextSibling);
    }
    
    addMusicContainer.innerHTML = `
        <div class="add-music-button-container">
            <button class="btn-add-music" onclick="openAddMusicModal()" title="Adicionar nova música">
                + Adicionar Música
            </button>
        </div>
    `;
    
    // Add export/import buttons after the add music button (only if they don't exist)
    let exportImportContainer = document.querySelector('.repertorio-export-import');
    if (!exportImportContainer) {
        exportImportContainer = document.createElement('div');
        exportImportContainer.className = 'repertorio-export-import';
        addMusicContainer.parentNode.insertBefore(exportImportContainer, addMusicContainer.nextSibling);
    }
    
    exportImportContainer.innerHTML = `
        <div class="export-import-buttons">
            <button class="btn-export" onclick="exportSingleRepertorio('${currentRepertorioId}')" title="Exportar este repertório">
                ⬆ Exportar
            </button>
            <button class="btn-import" onclick="importSingleRepertorio('${currentRepertorioId}')" title="Importar para este repertório">
                ⬇ Importar
            </button>
        </div>
    `;
    
    updateCurrentPresetDisplay();
}

// Save current preset (legacy function for keyboard shortcut)
function saveCurrentPreset() {
    openAddMusicModal();
}

// Open add music modal
function openAddMusicModal() {
    // Clear editing state
    window.editingPresetIndex = null;
    
    const modal = document.getElementById('add-music-modal');
    const currentBpmDisplay = document.getElementById('current-bpm-display');
    const currentPadDisplay = document.getElementById('current-pad-display');
    const useCurrentCheckbox = document.getElementById('use-current-settings');
    const modalTitle = modal.querySelector('h3');
    const saveButton = modal.querySelector('.btn-save');
    
    // Reset modal title and button
    modalTitle.textContent = 'Adicionar Nova Música';
    saveButton.textContent = 'Salvar Música';
    
    // Update current settings display
    currentBpmDisplay.textContent = averageBPM;
    currentPadDisplay.textContent = currentAmbientKey || 'Nenhum';
    
    // Check "use current settings" by default
    useCurrentCheckbox.checked = true;
    toggleCurrentSettings();
    
    modal.style.display = 'flex';
    
    // Ensure a pad is selected by default after modal is displayed
    setTimeout(() => {
        if (!document.querySelector('.modal-pad.selected')) {
            selectModalPad('Nenhum');
        }
    }, 100);
    
    // Focus on name input
    setTimeout(() => {
        document.getElementById('music-name').focus();
    }, 100);
}

// Open edit preset modal
function openEditPresetModal(preset) {
    console.log('Opening edit modal for preset:', preset);
    
    const modal = document.getElementById('add-music-modal');
    const nameInput = document.getElementById('music-name');
    const bpmInput = document.getElementById('music-bpm');
    const useCurrentCheckbox = document.getElementById('use-current-settings');
    const modalTitle = modal.querySelector('h3');
    const saveButton = modal.querySelector('.btn-save');
    
    // Update modal title and button
    modalTitle.textContent = 'Editar Música';
    saveButton.textContent = 'Salvar Alterações';
    
    // Fill form with preset data
    nameInput.value = preset.name;
    bpmInput.value = preset.bpm;
    
    // Uncheck use current settings
    useCurrentCheckbox.checked = false;
    
    modal.style.display = 'flex';
    
    // Select the correct pad after modal is displayed
    setTimeout(() => {
        console.log('Selecting pad for edit:', preset.pad || 'Nenhum');
        selectModalPad(preset.pad || 'Nenhum');
    }, 100);
    
    // Focus on name input
    setTimeout(() => {
        nameInput.focus();
    }, 100);
}

// Close add music modal
function closeAddMusicModal() {
    const modal = document.getElementById('add-music-modal');
    modal.style.display = 'none';
    
    // Clear form
    document.getElementById('music-name').value = '';
    document.getElementById('music-bpm').value = '120';
    document.getElementById('use-current-settings').checked = false;
    
    // Clear pad selection and select "Nenhum" by default
    document.querySelectorAll('.modal-pad').forEach(pad => {
        pad.classList.remove('selected');
    });
    selectModalPad('Nenhum');
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('add-music-modal');
    if (e.target === modal) {
        closeAddMusicModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('add-music-modal');
        if (modal.style.display === 'flex') {
            closeAddMusicModal();
        }
    }
});

// Test function to check modal pad state
function testModalPads() {
    console.log('=== TESTING MODAL PADS ===');
    const allPads = document.querySelectorAll('.modal-pad');
    console.log('Total pads found:', allPads.length);
    
    allPads.forEach((pad, index) => {
        const key = pad.getAttribute('data-key');
        const hasSelected = pad.classList.contains('selected');
        console.log(`Pad ${index}: key="${key}", selected=${hasSelected}, classes="${pad.className}"`);
    });
    
    const selectedPad = document.querySelector('.modal-pad.selected');
    console.log('Currently selected pad:', selectedPad ? selectedPad.getAttribute('data-key') : 'none');
    console.log('=== END TEST ===');
}

// Global test function for debugging
window.debugModal = function() {
    console.log('=== MODAL DEBUG ===');
    testModalPads();
    
    const currentRepertorio = getCurrentRepertorio();
    console.log('Current repertorio:', currentRepertorio);
    console.log('Presets:', currentRepertorio.presets);
    
    console.log('=== END DEBUG ===');
};

// Test localStorage directly
window.testLocalStorage = function() {
    console.log('=== LOCALSTORAGE TEST ===');
    const saved = localStorage.getItem('bpm-metronome-repertorios');
    console.log('Raw localStorage data:', saved);
    
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            console.log('Parsed data:', parsed);
        } catch (e) {
            console.error('Error parsing localStorage data:', e);
        }
    } else {
        console.log('No data in localStorage');
    }
    
    console.log('Current repertorios variable:', repertorios);
    console.log('=== END LOCALSTORAGE TEST ===');
};

// Select modal pad
function selectModalPad(key) {
    console.log('selectModalPad called with key:', key);
    
    // Debug: list all available pads
    const allPads = document.querySelectorAll('.modal-pad');
    console.log('Available pads:', Array.from(allPads).map(pad => pad.getAttribute('data-key')));
    
    // Remove selected class from all pads
    allPads.forEach(pad => {
        pad.classList.remove('selected');
    });
    
    // Add selected class to clicked pad
    const targetPad = document.querySelector(`.modal-pad[data-key="${key}"]`);
    if (targetPad) {
        targetPad.classList.add('selected');
        console.log('Selected pad:', key);
        console.log('Target pad classes after selection:', targetPad.className);
    } else {
        console.error('Pad not found for key:', key);
        console.log('Available data-key attributes:', Array.from(allPads).map(pad => pad.getAttribute('data-key')));
    }
    
    // Test the state after selection
    testModalPads();
}

// Toggle current settings
function toggleCurrentSettings() {
    const useCurrent = document.getElementById('use-current-settings').checked;
    const bpmInput = document.getElementById('music-bpm');
    
    if (useCurrent) {
        bpmInput.value = averageBPM;
        // Select current pad in modal
        selectModalPad(currentAmbientKey || 'Nenhum');
    }
    // Always keep BPM input enabled so user can edit it
    bpmInput.disabled = false;
}

// Save music from modal
function saveMusicFromModal() {
    console.log('=== saveMusicFromModal CALLED ===');
    
    const name = document.getElementById('music-name').value.trim();
    const bpm = parseInt(document.getElementById('music-bpm').value);
    const selectedPad = document.querySelector('.modal-pad.selected');
    const pad = selectedPad ? selectedPad.getAttribute('data-key') : 'Nenhum';
    
    console.log('Selected pad element found:', selectedPad);
    console.log('Pad value to save:', pad);
    
    console.log('Saving music - Name:', name, 'BPM:', bpm, 'Pad:', pad);
    console.log('Selected pad element:', selectedPad);
    console.log('Editing preset index:', window.editingPresetIndex);
    console.log('Current repertorio ID:', currentRepertorioId);
    console.log('Current repertorios object:', repertorios);
    
    if (!name) {
        alert('Por favor, digite o nome da música');
        return;
    }
    
    if (bpm < 40 || bpm > 300) {
        alert('BPM deve estar entre 40 e 300');
        return;
    }
    
    const currentRepertorio = getCurrentRepertorio();
    console.log('Current repertorio before save:', currentRepertorio);
    
    // Ensure presets array exists
    if (!currentRepertorio.presets) {
        console.log('Creating presets array');
        currentRepertorio.presets = [];
    }
    
    // Check if we're editing an existing preset
    if (window.editingPresetIndex !== null && window.editingPresetIndex !== undefined) {
        // Edit existing preset
        const preset = currentRepertorio.presets[window.editingPresetIndex];
        preset.name = name;
        preset.bpm = bpm;
        preset.pad = pad;
        preset.lastUsed = new Date().toISOString();
        
        console.log('Updated preset:', preset);
    } else {
        // Create new preset
        const preset = {
            id: Date.now().toString(),
            name: name,
            bpm: bpm,
            pad: pad,
            createdAt: new Date().toISOString(),
            lastUsed: new Date().toISOString()
        };
        
        console.log('About to push preset:', preset);
        console.log('Current repertorio presets before push:', currentRepertorio.presets);
        currentRepertorio.presets.push(preset);
        console.log('Current repertorio presets after push:', currentRepertorio.presets);
        console.log('Created new preset:', preset);
    }
    
    // Ensure the repertório is properly saved in the main object
    // Only update if the repertório actually exists
    if (repertorios[currentRepertorioId]) {
        repertorios[currentRepertorioId] = currentRepertorio;
        console.log('Updated repertorios object:', repertorios);
    } else {
        console.log('Warning: Trying to save to non-existent repertório:', currentRepertorioId);
    }
    
    saveRepertorio();
    renderRepertorio();
    closeAddMusicModal();
}

// Load preset
function loadPreset(index) {
    const currentRepertorio = getCurrentRepertorio();
    const presets = currentRepertorio.presets || [];
    
    if (index < 0 || index >= presets.length) return;
    
    const preset = presets[index];
    
    // Update BPM
    averageBPM = preset.bpm;
    document.getElementById('bpm-output').textContent = averageBPM;
    
    // Update pad with smooth transition
    if (preset.pad && preset.pad !== 'Nenhum') {
        console.log('Loading preset pad:', preset.pad);
        console.log('Current ambient key before:', currentAmbientKey);
        console.log('Is different pad?', currentAmbientKey !== preset.pad);
        
        // Always call playAmbient with preset navigation flag
        console.log('Playing preset pad with navigation flag:', preset.pad);
        playAmbient(preset.pad, true); // true = isPresetNavigation
    } else {
        console.log('No pad in preset, stopping ambient');
        // Stop ambient if no pad
        stopAmbient();
    }
    
    // Start metronome if not already playing
    if (!isPlaying) {
        toggleMetronome();
    }
    
    // Update last used
    preset.lastUsed = new Date().toISOString();
    currentPresetIndex = index;
    currentPresetId = preset.id; // Set unique preset ID
    
    console.log('Loaded preset:', preset.name, 'with ID:', preset.id, 'from repertório:', currentRepertorio.name);
    
    saveRepertorio();
    renderRepertorio();
    updateCurrentPresetDisplay();
}

// Edit preset
function editPreset(index) {
    const currentRepertorio = getCurrentRepertorio();
    const presets = currentRepertorio.presets || [];
    
    if (index < 0 || index >= presets.length) return;
    
    const preset = presets[index];
    
    // Store the index for saving
    window.editingPresetIndex = index;
    
    // Open modal with preset data
    openEditPresetModal(preset);
}

// Delete preset
function deletePreset(index) {
    const currentRepertorio = getCurrentRepertorio();
    const presets = currentRepertorio.presets || [];
    
    if (index < 0 || index >= presets.length) return;
    
    if (confirm('Tem certeza que deseja deletar este preset?')) {
        presets.splice(index, 1);
        if (currentPresetIndex === index) {
            currentPresetIndex = -1;
        } else if (currentPresetIndex > index) {
            currentPresetIndex--;
        }
        saveRepertorio();
        renderRepertorio();
    }
}

// Export repertório
function exportRepertorio() {
    const dataStr = JSON.stringify(repertorios, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'repertorios.json';
    link.click();
    URL.revokeObjectURL(url);
}

// Export single repertório
function exportSingleRepertorio(repertorioId) {
    const repertorio = repertorios[repertorioId];
    if (!repertorio) return;
    
    const dataStr = JSON.stringify({[repertorioId]: repertorio}, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `repertorio-${repertorio.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Import repertório
function importRepertorio() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const imported = JSON.parse(e.target.result);
                if (typeof imported === 'object' && imported !== null) {
                    if (confirm('Isso irá substituir todos os repertórios atuais. Continuar?')) {
                        repertorios = imported;
                        currentRepertorioId = 'default';
                        currentPresetIndex = -1;
                        saveRepertorio();
                        renderRepertorioTabs();
                        renderRepertorio();
                    }
                } else {
                    alert('Arquivo inválido');
                }
            } catch (error) {
                alert('Erro ao importar arquivo');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Import single repertório
function importSingleRepertorio(repertorioId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const imported = JSON.parse(e.target.result);
                if (typeof imported === 'object' && imported !== null) {
                    let importedCount = 0;
                    let skippedCount = 0;
                    
                    // Process each repertório in the imported file
                    Object.keys(imported).forEach(key => {
                        const importedRepertorio = imported[key];
                        const importedName = importedRepertorio.name;
                        
                        // Check if a repertório with the same name already exists
                        const existingRepertorio = Object.values(repertorios).find(r => r.name === importedName);
                        
                        if (existingRepertorio) {
                            // Repertório with same name already exists
                            skippedCount++;
                            console.log('Repertório já existe:', importedName);
                        } else {
                            // Create new repertório with unique ID
                            const newId = 'imported_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                            repertorios[newId] = importedRepertorio;
                            importedCount++;
                            console.log('Novo repertório criado:', importedName, 'com ID:', newId);
                        }
                    });
                    
                    if (importedCount > 0 || skippedCount > 0) {
                        saveRepertorio();
                        renderRepertorioTabs();
                        renderRepertorio();
                        
                        let message = '';
                        if (importedCount > 0) {
                            message += `${importedCount} repertório(s) importado(s) com sucesso!`;
                        }
                        if (skippedCount > 0) {
                            message += (message ? '\n' : '') + `${skippedCount} repertório(s) já existiam e foram ignorados.`;
                        }
                        alert(message);
                    } else {
                        alert('Nenhum repertório foi importado. Todos já existem.');
                    }
                }
            } catch (error) {
                alert('Erro ao importar repertório: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Move preset functions for touch devices
function movePresetUp(index) {
    if (index <= 0) return; // Can't move first item up
    
    const currentRepertorio = getCurrentRepertorio();
    const presets = currentRepertorio.presets || [];
    
    if (index >= presets.length) return;
    
    // Swap with previous item
    const temp = presets[index];
    presets[index] = presets[index - 1];
    presets[index - 1] = temp;
    
    // Update current preset index if needed
    if (currentPresetIndex === index) {
        currentPresetIndex = index - 1;
    } else if (currentPresetIndex === index - 1) {
        currentPresetIndex = index;
    }
    
    saveRepertorio();
    renderRepertorio();
    console.log(`Moved preset up from index ${index} to ${index - 1}`);
}

function movePresetDown(index) {
    const currentRepertorio = getCurrentRepertorio();
    const presets = currentRepertorio.presets || [];
    
    if (index >= presets.length - 1) return; // Can't move last item down
    
    // Swap with next item
    const temp = presets[index];
    presets[index] = presets[index + 1];
    presets[index + 1] = temp;
    
    // Update current preset index if needed
    if (currentPresetIndex === index) {
        currentPresetIndex = index + 1;
    } else if (currentPresetIndex === index + 1) {
        currentPresetIndex = index;
    }
    
    saveRepertorio();
    renderRepertorio();
    console.log(`Moved preset down from index ${index} to ${index + 1}`);
}

// Drag & Drop functions (for mouse users)
let draggedElement = null;
let draggedIndex = null;

function handleDragStart(e) {
    draggedElement = e.target;
    draggedIndex = parseInt(e.target.dataset.index);
    e.target.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const afterElement = getDragAfterElement(e.target.closest('.repertorio-list'), e.clientY);
    const dragging = document.querySelector('.dragging');
    
    if (afterElement == null) {
        e.target.closest('.repertorio-list').appendChild(draggedElement);
    } else {
        e.target.closest('.repertorio-list').insertBefore(draggedElement, afterElement);
    }
}

function handleDrop(e) {
    e.preventDefault();
    
    if (draggedElement) {
        draggedElement.style.opacity = '';
        
        // Get new index
        const newIndex = Array.from(e.target.closest('.repertorio-list').children)
            .indexOf(draggedElement);
        
        if (newIndex !== draggedIndex && newIndex >= 0) {
            // Reorder presets
            reorderPresets(draggedIndex, newIndex);
        }
    }
}

function handleDragEnd(e) {
    e.target.style.opacity = '';
    draggedElement = null;
    draggedIndex = null;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.preset-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function reorderPresets(fromIndex, toIndex) {
    const currentRepertorio = getCurrentRepertorio();
    const presets = currentRepertorio.presets || [];
    
    if (fromIndex < 0 || fromIndex >= presets.length || 
        toIndex < 0 || toIndex >= presets.length) {
        return;
    }
    
    // Remove element from old position
    const [movedPreset] = presets.splice(fromIndex, 1);
    
    // Insert at new position
    presets.splice(toIndex, 0, movedPreset);
    
    // Update current preset index if needed
    if (currentPresetIndex === fromIndex) {
        currentPresetIndex = toIndex;
    } else if (currentPresetIndex > fromIndex && currentPresetIndex <= toIndex) {
        currentPresetIndex--;
    } else if (currentPresetIndex < fromIndex && currentPresetIndex >= toIndex) {
        currentPresetIndex++;
    }
    
    // Save and re-render
    saveRepertorio();
    renderRepertorio();
    
    console.log(`Moved preset from index ${fromIndex} to ${toIndex}`);
}

// Live mode functions
// Live mode is now always active - no toggle needed

function nextPreset() {
    const currentRepertorio = getCurrentRepertorio();
    const presets = currentRepertorio.presets || [];
    
    if (presets.length === 0) return;
    
    // Find current preset index in current repertório
    let currentIndex = -1;
    if (currentPresetId) {
        currentIndex = presets.findIndex(p => p.id === currentPresetId);
    }
    
    // Move to next preset
    const nextIndex = (currentIndex + 1) % presets.length;
    loadPreset(nextIndex);
}

function previousPreset() {
    const currentRepertorio = getCurrentRepertorio();
    const presets = currentRepertorio.presets || [];
    
    if (presets.length === 0) return;
    
    // Find current preset index in current repertório
    let currentIndex = -1;
    if (currentPresetId) {
        currentIndex = presets.findIndex(p => p.id === currentPresetId);
    }
    
    // Move to previous preset
    const prevIndex = currentIndex <= 0 ? presets.length - 1 : currentIndex - 1;
    loadPreset(prevIndex);
}

function updateCurrentPresetDisplay() {
    const display = document.getElementById('current-preset-display');
    
    console.log('updateCurrentPresetDisplay - currentPresetId:', currentPresetId);
    
    if (currentPresetId) {
        // Find the active preset by ID in all repertórios
        let activePreset = null;
        let activeRepertorio = null;
        
        for (const [key, repertorio] of Object.entries(repertorios)) {
            const presets = repertorio.presets || [];
            const foundPreset = presets.find(p => p.id === currentPresetId);
            if (foundPreset) {
                activePreset = foundPreset;
                activeRepertorio = repertorio;
                break;
            }
        }
        
        if (activePreset && activeRepertorio) {
            display.textContent = `${activePreset.name} (${activePreset.bpm} BPM) - ${activeRepertorio.name}`;
            console.log('Displaying preset:', activePreset.name, 'with ID:', activePreset.id, 'from repertório:', activeRepertorio.name);
        } else {
            display.textContent = 'Nenhum preset ativo';
            console.log('No preset active - preset with ID not found:', currentPresetId);
        }
    } else {
        display.textContent = 'Nenhum preset ativo';
        console.log('No preset active - currentPresetId is null');
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT') return; // Don't trigger when typing in inputs
    
    switch(e.key.toLowerCase()) {
        case 's':
            e.preventDefault();
            saveCurrentPreset();
            break;
        case 'l':
            e.preventDefault();
            const currentRepertorio = getCurrentRepertorio();
            const presets = currentRepertorio.presets || [];
            if (presets.length > 0) {
                const index = prompt('Índice do preset (0-' + (presets.length - 1) + '):');
                if (index !== null && !isNaN(index)) {
                    loadPreset(parseInt(index));
                }
            }
            break;
        case 'e':
            e.preventDefault();
            if (currentPresetIndex >= 0) {
                editPreset(currentPresetIndex);
            }
            break;
        case 'd':
            e.preventDefault();
            if (currentPresetIndex >= 0) {
                deletePreset(currentPresetIndex);
            }
            break;
        case 'arrowup':
            e.preventDefault();
            previousPreset();
            break;
        case 'arrowdown':
            e.preventDefault();
            nextPreset();
            break;
        case 'enter':
            e.preventDefault();
            if (currentPresetIndex >= 0) {
                loadPreset(currentPresetIndex);
            }
            break;
    }
});

// ===== SESSÃO COLABORATIVA FUNCTIONS =====

// Variáveis da sessão colaborativa
let sessionWebSocket = null;
let sessionId = null;
let clientId = null;
let isHost = false;
let isInSession = false;
let sessionClients = [];
let sessionState = null;
let isApplyingSessionState = false; // Flag para evitar loops

// Conectar ao servidor WebSocket
function connectToSessionServer(serverUrl = null) {
    const defaultUrl = `ws://${window.location.hostname}:3000`;
    const url = serverUrl || defaultUrl;
    
    console.log('Conectando ao servidor de sessão:', url);
    
    try {
        sessionWebSocket = new WebSocket(url);
        
        sessionWebSocket.onopen = function() {
            console.log('Conectado ao servidor de sessão');
            updateSessionStatus('connected', 'Conectado');
        };
        
        sessionWebSocket.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                handleSessionMessage(data);
            } catch (error) {
                console.error('Erro ao processar mensagem da sessão:', error);
            }
        };
        
        sessionWebSocket.onclose = function() {
            console.log('Conexão com servidor de sessão fechada');
            updateSessionStatus('offline', 'Desconectado');
            isInSession = false;
            sessionId = null;
            clientId = null;
            isHost = false;
            sessionClients = [];
            updateSessionUI();
        };
        
        sessionWebSocket.onerror = function(error) {
            console.error('Erro na conexão WebSocket:', error);
            updateSessionStatus('offline', 'Erro de conexão');
        };
        
    } catch (error) {
        console.error('Erro ao conectar ao servidor:', error);
        updateSessionStatus('offline', 'Erro de conexão');
    }
}

// Processar mensagens do servidor
function handleSessionMessage(data) {
    console.log('Mensagem recebida da sessão:', data.type, data);
    console.log('Cliente recebendo - isHost:', isHost, 'clientId:', clientId);
    
    switch (data.type) {
        case 'session_created':
            handleSessionCreated(data);
            break;
        case 'session_joined':
            handleSessionJoined(data);
            break;
        case 'client_joined':
            handleClientJoined(data);
            break;
        case 'client_left':
            handleClientLeft(data);
            break;
        case 'state_update':
            handleStateUpdate(data);
            break;
        case 'control_action':
            handleControlAction(data);
            break;
        case 'host_transferred':
            handleHostTransferred(data);
            break;
        case 'error':
            handleSessionError(data);
            break;
        case 'sessions_list':
            handleSessionsList(data);
            break;
        default:
            console.log('Tipo de mensagem desconhecido:', data.type);
    }
}

// Criar nova sessão
function createSession() {
    const hostName = document.getElementById('host-name').value.trim();
    const serverUrl = document.getElementById('server-url').value.trim();
    
    if (!hostName) {
        alert('Por favor, digite seu nome');
        return;
    }
    
    if (!sessionWebSocket || sessionWebSocket.readyState !== WebSocket.OPEN) {
        connectToSessionServer(serverUrl || null);
        
        // Aguardar conexão antes de criar sessão
        const checkConnection = setInterval(() => {
            if (sessionWebSocket && sessionWebSocket.readyState === WebSocket.OPEN) {
                clearInterval(checkConnection);
                sendSessionMessage({
                    type: 'create_session',
                    hostName: hostName
                });
            }
        }, 100);
        
        // Timeout após 5 segundos
        setTimeout(() => {
            clearInterval(checkConnection);
            if (!sessionWebSocket || sessionWebSocket.readyState !== WebSocket.OPEN) {
                alert('Erro ao conectar ao servidor. Verifique se o servidor está rodando.');
            }
        }, 5000);
    } else {
        sendSessionMessage({
            type: 'create_session',
            hostName: hostName
        });
    }
    
    closeCreateSessionModal();
}

// Entrar em sessão existente
function joinSession() {
    const clientName = document.getElementById('client-name').value.trim();
    const serverUrl = document.getElementById('join-server-url').value.trim();
    
    if (!clientName) {
        alert('Por favor, digite seu nome');
        return;
    }
    
    if (!selectedSessionId) {
        alert('Por favor, selecione uma sessão da lista');
        return;
    }
    
    if (!sessionWebSocket || sessionWebSocket.readyState !== WebSocket.OPEN) {
        connectToSessionServer(serverUrl || null);
        
        // Aguardar conexão antes de entrar na sessão
        const checkConnection = setInterval(() => {
            if (sessionWebSocket && sessionWebSocket.readyState === WebSocket.OPEN) {
                clearInterval(checkConnection);
                sendSessionMessage({
                    type: 'join_session',
                    sessionId: selectedSessionId,
                    clientName: clientName
                });
            }
        }, 100);
        
        // Timeout após 5 segundos
        setTimeout(() => {
            clearInterval(checkConnection);
            if (!sessionWebSocket || sessionWebSocket.readyState !== WebSocket.OPEN) {
                alert('Erro ao conectar ao servidor. Verifique se o servidor está rodando.');
            }
        }, 5000);
    } else {
        sendSessionMessage({
            type: 'join_session',
            sessionId: selectedSessionId,
            clientName: clientName
        });
    }
    
    closeJoinSessionModal();
}

// Enviar mensagem para o servidor
function sendSessionMessage(message) {
    console.log('sendSessionMessage chamado:', message);
    if (sessionWebSocket && sessionWebSocket.readyState === WebSocket.OPEN) {
        console.log('Enviando mensagem via WebSocket');
        sessionWebSocket.send(JSON.stringify(message));
    } else {
        console.error('WebSocket não está conectado. Estado:', sessionWebSocket ? sessionWebSocket.readyState : 'null');
    }
}

// Sair da sessão
function leaveSession() {
    if (sessionWebSocket && sessionWebSocket.readyState === WebSocket.OPEN) {
        sendSessionMessage({
            type: 'leave_session'
        });
    }
    
    isInSession = false;
    sessionId = null;
    clientId = null;
    isHost = false;
    sessionClients = [];
    updateSessionUI();
}

// Atualizar estado da sessão
function updateSessionState(newState) {
    if (!isInSession) return; // Qualquer cliente pode atualizar o estado
    
    sessionState = { ...sessionState, ...newState };
    
    console.log('Enviando atualização de estado:', sessionState);
    console.log('Cliente enviando - isHost:', isHost, 'clientId:', clientId);
    
    sendSessionMessage({
        type: 'state_update',
        state: sessionState
    });
}

// Enviar ação de controle
function sendControlAction(action, data = {}) {
    if (!isInSession) return; // Qualquer cliente pode enviar ações de controle
    
    sendSessionMessage({
        type: 'control_action',
        action: action,
        data: data
    });
}

// Handlers de mensagens
function handleSessionCreated(data) {
    sessionId = data.sessionId;
    clientId = data.clientId;
    isHost = data.isHost;
    isInSession = true;
    sessionState = data.state;
    
    console.log('Sessão criada:', sessionId);
    console.log('Estado inicial da sessão:', sessionState);
    updateSessionStatus('host', 'Host da Sessão');
    updateSessionUI();
    
    // Inicializar o estado da sessão com o estado atual
    sessionState = {
        bpm: averageBPM,
        isPlaying: isPlaying,
        currentPresetId: currentPresetId,
        currentAmbientKey: currentAmbientKey,
        metronomeVolume: metronomeVolume,
        ambientVolume: ambientVolume,
        soundType: document.getElementById('sound-type').value,
        timeSignature: document.getElementById('time-signature').value,
        repertorios: repertorios,
        currentRepertorioId: currentRepertorioId
    };
    
    console.log('Estado inicial da sessão definido como:', sessionState);
    
    // Mostrar código da sessão
    showSessionCode(sessionId);
}

function handleSessionJoined(data) {
    sessionId = data.sessionId;
    clientId = data.clientId;
    isHost = data.isHost;
    isInSession = true;
    sessionState = data.state;
    sessionClients = data.clients;
    
    console.log('Entrou na sessão:', sessionId);
    console.log('Estado inicial da sessão:', sessionState);
    updateSessionStatus('connected', 'Participante');
    updateSessionUI();
    
    // Aplicar estado da sessão
    applySessionState(sessionState);
}

function handleClientJoined(data) {
    sessionClients.push(data.client);
    updateSessionUI();
    console.log('Cliente entrou:', data.client.name);
}

function handleClientLeft(data) {
    sessionClients = sessionClients.filter(client => client.id !== data.clientId);
    updateSessionUI();
    console.log('Cliente saiu:', data.clientName);
}

function handleStateUpdate(data) {
    console.log('Cliente recebeu atualização de estado:', data.state);
    console.log('Estado atual do cliente - BPM:', averageBPM, 'isPlaying:', isPlaying);
    sessionState = data.state;
    applySessionState(sessionState);
}

function handleControlAction(data) {
    console.log('Executando ação de controle:', data.action, data.data);
    executeControlAction(data.action, data.data);
}

function handleHostTransferred(data) {
    isHost = (data.newHostId === clientId);
    updateSessionStatus(isHost ? 'host' : 'connected', isHost ? 'Host da Sessão' : 'Participante');
    updateSessionUI();
    console.log('Host transferido para:', data.newHostName);
}

function handleSessionError(data) {
    alert('Erro na sessão: ' + data.message);
    console.error('Erro da sessão:', data.message);
}

// Aplicar estado da sessão
function applySessionState(state) {
    if (!state) return;
    
    if (isApplyingSessionState) {
        console.log('Evitando loop - já aplicando estado da sessão');
        return;
    }
    
    isApplyingSessionState = true;
    console.log('Aplicando estado da sessão:', state);
    
    // Atualizar BPM
    if (state.bpm && state.bpm !== averageBPM) {
        console.log('Atualizando BPM de', averageBPM, 'para', state.bpm);
        averageBPM = state.bpm;
        document.getElementById('bpm-output').textContent = averageBPM;
        console.log('BPM atualizado no DOM para:', averageBPM);
        
        // Se o metrônomo estiver tocando, atualizar o BPM em tempo real
        if (isPlaying) {
            console.log('Metrônomo está tocando, atualizando BPM em tempo real');
            updateMetronomeBPM();
        }
    } else if (state.bpm) {
        console.log('BPM não mudou - estado:', state.bpm, 'atual:', averageBPM);
    }
    
    // Atualizar metronome - CORREÇÃO PRINCIPAL
    if (state.isPlaying !== undefined && state.isPlaying !== isPlaying) {
        console.log('Atualizando estado do metrônomo de', isPlaying, 'para', state.isPlaying);
        
        if (state.isPlaying && !isPlaying) {
            // Iniciar metrônomo
            console.log('Iniciando metrônomo via sessão...');
            if (!audioContext) {
                console.log('Inicializando AudioContext...');
                initAudio();
            }
            if (audioContext.state === 'suspended') {
                console.log('Resumindo AudioContext...');
                audioContext.resume();
            }
            startMetronome();
        } else if (!state.isPlaying && isPlaying) {
            // Parar metrônomo
            console.log('Parando metrônomo via sessão...');
            pauseMetronome();
        }
    }
    
    // Atualizar preset
    if (state.currentPresetId !== currentPresetId) {
        console.log('Atualizando preset de', currentPresetId, 'para', state.currentPresetId);
        currentPresetId = state.currentPresetId;
        updateCurrentPresetDisplay();
    }
    
    // Atualizar pad ambiental
    if (state.currentAmbientKey !== undefined) {
        console.log('Atualizando pad ambiental de', currentAmbientKey, 'para', state.currentAmbientKey);
        if (state.currentAmbientKey && state.currentAmbientKey !== 'Nenhum') {
            playAmbient(state.currentAmbientKey, true);
        } else {
            stopAmbient();
        }
    }
    
    // Atualizar volumes
    if (state.metronomeVolume !== undefined) {
        const percentage = Math.round(state.metronomeVolume * 100);
        console.log('Atualizando volume do metrônomo para', percentage + '%');
        document.getElementById('metronome-volume').value = percentage;
        document.getElementById('metronome-volume-value').textContent = percentage + '%';
        setMetronomeVolume(percentage);
    }
    
    if (state.ambientVolume !== undefined) {
        const percentage = Math.round(state.ambientVolume * 100);
        console.log('Atualizando volume ambiental para', percentage + '%');
        document.getElementById('ambient-volume').value = percentage;
        document.getElementById('ambient-volume-value').textContent = percentage + '%';
        setAmbientVolume(percentage);
    }
    
    // Atualizar tipo de som
    if (state.soundType) {
        console.log('Atualizando tipo de som para', state.soundType);
        document.getElementById('sound-type').value = state.soundType;
    }
    
    // Atualizar assinatura de tempo
    if (state.timeSignature) {
        console.log('Atualizando assinatura de tempo para', state.timeSignature);
        document.getElementById('time-signature').value = state.timeSignature;
    }
    
    // Atualizar repertório
    if (state.repertorios && Object.keys(state.repertorios).length > 0) {
        console.log('Atualizando repertórios via sessão:', state.repertorios);
        repertorios = state.repertorios;
        localStorage.setItem('bpm-metronome-repertorios', JSON.stringify(repertorios));
        renderRepertorioTabs();
        renderRepertorio();
    }
    
    // Atualizar repertório ativo
    if (state.currentRepertorioId && state.currentRepertorioId !== currentRepertorioId) {
        console.log('Mudando repertório ativo para', state.currentRepertorioId);
        currentRepertorioId = state.currentRepertorioId;
        renderRepertorioTabs();
        renderRepertorio();
    }
    
    // Reset da flag para permitir próximas aplicações
    isApplyingSessionState = false;
}

// Executar ação de controle
function executeControlAction(action, data) {
    switch (action) {
        case 'play_preset':
            if (data.presetIndex !== undefined) {
                loadPreset(data.presetIndex);
            }
            break;
        case 'next_preset':
            nextPreset();
            break;
        case 'previous_preset':
            previousPreset();
            break;
        case 'toggle_metronome':
            toggleMetronome();
            break;
        case 'stop_metronome':
            stopMetronome();
            break;
        case 'play_ambient':
            if (data.key) {
                playAmbient(data.key, true);
            }
            break;
        case 'stop_ambient':
            stopAmbient();
            break;
        default:
            console.log('Ação de controle desconhecida:', action);
    }
}

// Atualizar status da sessão
function updateSessionStatus(status, text) {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    statusIndicator.className = `status-indicator ${status}`;
    statusText.textContent = text;
}

// Atualizar UI da sessão
function updateSessionUI() {
    const sessionControls = document.getElementById('session-controls');
    const connectedClients = document.getElementById('connected-clients');
    const clientsList = document.getElementById('clients-list');
    
    if (isInSession) {
        sessionControls.style.display = 'none';
        connectedClients.style.display = 'block';
        
        // Atualizar lista de clientes
        clientsList.innerHTML = '';
        sessionClients.forEach(client => {
            const clientItem = document.createElement('div');
            clientItem.className = 'client-item';
            clientItem.innerHTML = `
                <div class="client-info">
                    <div class="client-avatar">${client.name.charAt(0).toUpperCase()}</div>
                    <div class="client-details">
                        <div class="client-name">${client.name}</div>
                        <div class="client-role">${client.isHost ? 'Host' : 'Participante'}</div>
                    </div>
                </div>
                <div class="client-status">
                    <div class="client-status-indicator"></div>
                </div>
            `;
            clientsList.appendChild(clientItem);
        });
        
        // Adicionar botão para sair da sessão
        if (!document.getElementById('leave-session-btn')) {
            const leaveBtn = document.createElement('button');
            leaveBtn.id = 'leave-session-btn';
            leaveBtn.className = 'button secondary';
            leaveBtn.textContent = 'Sair da Sessão';
            leaveBtn.onclick = leaveSession;
            sessionControls.appendChild(leaveBtn);
        }
    } else {
        sessionControls.style.display = 'block';
        connectedClients.style.display = 'none';
        
        // Remover botão de sair se existir
        const leaveBtn = document.getElementById('leave-session-btn');
        if (leaveBtn) {
            leaveBtn.remove();
        }
    }
}

// Mostrar código da sessão
function showSessionCode(code) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>🎯 Sessão Criada!</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="session-code-display">
                    <h4>Código da Sessão:</h4>
                    <div class="session-code">${code}</div>
                    <div class="session-code-copy">
                        Compartilhe este código com outros dispositivos para que possam entrar na sessão
                    </div>
                </div>
                <div class="session-info">
                    <h4>Como compartilhar:</h4>
                    <ul>
                        <li>Outros dispositivos devem estar na mesma rede</li>
                        <li>Eles devem usar o mesmo servidor (ou deixar vazio para padrão)</li>
                        <li>Digite este código no campo "Código da Sessão"</li>
                        <li>Você controla tudo, eles apenas observam</li>
                    </ul>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-save" onclick="this.closest('.modal-overlay').remove()">Entendi!</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Funções dos modais
function openCreateSessionModal() {
    document.getElementById('create-session-modal').style.display = 'flex';
    document.getElementById('host-name').focus();
}

function closeCreateSessionModal() {
    document.getElementById('create-session-modal').style.display = 'none';
}

function openJoinSessionModal() {
    console.log('Abrindo modal de entrar em sessão...');
    document.getElementById('join-session-modal').style.display = 'flex';
    document.getElementById('client-name').focus();
    
    // Carregar sessões disponíveis quando abrir o modal
    console.log('Chamando refreshSessions...');
    refreshSessions();
}

function closeJoinSessionModal() {
    document.getElementById('join-session-modal').style.display = 'none';
}

// Gerenciar lista de sessões
let selectedSessionId = null;

function refreshSessions() {
    const container = document.getElementById('sessions-container');
    container.innerHTML = '<div class="loading-sessions">Conectando ao servidor...</div>';
    
    if (!sessionWebSocket || sessionWebSocket.readyState !== WebSocket.OPEN) {
        console.log('WebSocket não conectado, tentando conectar...');
        connectToSessionServer();
        
        // Tentar novamente após 2 segundos
        setTimeout(() => {
            if (sessionWebSocket && sessionWebSocket.readyState === WebSocket.OPEN) {
                console.log('Solicitando lista de sessões...');
                sendSessionMessage({ type: 'get_sessions' });
            } else {
                container.innerHTML = '<div class="no-sessions">Erro ao conectar ao servidor. Verifique se o servidor está rodando.</div>';
            }
        }, 2000);
        return;
    }
    
    console.log('Solicitando lista de sessões...');
    sendSessionMessage({ type: 'get_sessions' });
}

function handleSessionsList(data) {
    console.log('Lista de sessões recebida:', data.sessions);
    const container = document.getElementById('sessions-container');
    
    if (!container) {
        console.error('Container de sessões não encontrado!');
        return;
    }
    
    if (!data.sessions || data.sessions.length === 0) {
        console.log('Nenhuma sessão encontrada');
        container.innerHTML = '<div class="no-sessions">Nenhuma sessão encontrada na rede local</div>';
        return;
    }
    
    console.log('Renderizando', data.sessions.length, 'sessões');
    
    container.innerHTML = '';
    data.sessions.forEach(session => {
        const sessionItem = document.createElement('div');
        sessionItem.className = 'session-item';
        sessionItem.onclick = () => selectSession(session.id, sessionItem);
        
        sessionItem.innerHTML = `
            <div>
                <div class="session-name">${session.name}</div>
                <div class="session-details">
                    <span>👥 ${session.clientCount} dispositivo(s)</span>
                    <span>🕒 ${new Date(session.createdAt).toLocaleTimeString()}</span>
                </div>
            </div>
        `;
        
        container.appendChild(sessionItem);
    });
}

function selectSession(sessionId, element) {
    // Remover seleção anterior
    document.querySelectorAll('.session-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Selecionar nova sessão
    element.classList.add('selected');
    selectedSessionId = sessionId;
    
    console.log('Sessão selecionada:', sessionId);
}

// Interceptar mudanças de estado para sincronizar
const originalToggleMetronome = toggleMetronome;
toggleMetronome = function() {
    originalToggleMetronome();
    if (isInSession && !isApplyingSessionState) {
        updateSessionState({ isPlaying: isPlaying });
    }
};

const originalIncreaseBPM = increaseBPM;
increaseBPM = function() {
    originalIncreaseBPM();
    if (isInSession && !isApplyingSessionState) {
        updateSessionState({ bpm: averageBPM });
    }
};

const originalDecreaseBPM = decreaseBPM;
decreaseBPM = function() {
    originalDecreaseBPM();
    if (isInSession && !isApplyingSessionState) {
        updateSessionState({ bpm: averageBPM });
    }
};

const originalSetMetronomeVolume = setMetronomeVolume;
setMetronomeVolume = function(percentage) {
    originalSetMetronomeVolume(percentage);
    if (isInSession && !isApplyingSessionState) {
        updateSessionState({ metronomeVolume: metronomeVolume });
    }
};

const originalSetAmbientVolume = setAmbientVolume;
setAmbientVolume = function(percentage) {
    originalSetAmbientVolume(percentage);
    if (isInSession && !isApplyingSessionState) {
        updateSessionState({ ambientVolume: ambientVolume });
    }
};

const originalPlayAmbient = playAmbient;
playAmbient = function(key, isPresetNavigation = false) {
    originalPlayAmbient(key, isPresetNavigation);
    if (isInSession && !isPresetNavigation && !isApplyingSessionState) {
        updateSessionState({ currentAmbientKey: currentAmbientKey });
    }
};

const originalStopAmbient = stopAmbient;
stopAmbient = function() {
    originalStopAmbient();
    if (isInSession && !isApplyingSessionState) {
        updateSessionState({ currentAmbientKey: null });
    }
};

const originalLoadPreset = loadPreset;
loadPreset = function(index) {
    originalLoadPreset(index);
    if (isInSession && !isApplyingSessionState) {
        updateSessionState({ currentPresetId: currentPresetId });
    }
};

// Interceptar navegação de presets
const originalNextPreset = nextPreset;
nextPreset = function() {
    originalNextPreset();
    if (isInSession && !isApplyingSessionState) {
        updateSessionState({ currentPresetId: currentPresetId });
    }
};

const originalPreviousPreset = previousPreset;
previousPreset = function() {
    originalPreviousPreset();
    if (isInSession && !isApplyingSessionState) {
        updateSessionState({ currentPresetId: currentPresetId });
    }
};

// Interceptar função de tap tempo
const originalCalcBPM = calcBPM;
calcBPM = function() {
    console.log('calcBPM chamado - BPM antes:', averageBPM);
    originalCalcBPM();
    console.log('calcBPM executado - BPM depois:', averageBPM);
    if (isInSession && !isApplyingSessionState) {
        console.log('Enviando atualização de BPM para sessão:', averageBPM);
        updateSessionState({ bpm: averageBPM });
    }
};

// Prevenir zoom duplo toque no mobile
document.addEventListener('DOMContentLoaded', function() {
    // Prevenir zoom duplo toque
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Prevenir zoom com gestos de pinça
    document.addEventListener('gesturestart', function (event) {
        event.preventDefault();
    });
    
    // Prevenir zoom com Ctrl + scroll
    document.addEventListener('wheel', function (event) {
        if (event.ctrlKey) {
            event.preventDefault();
        }
    }, { passive: false });
    
    // Tentar conectar ao servidor local - TEMPORARIAMENTE DESABILITADO
    // setTimeout(() => {
    //     connectToSessionServer();
    // }, 1000);
});