/**
 * Sistema de áudio do jogo.
 * Gera sons 8-bit proceduralmente usando Web Audio API.
 * Sons: tiro, explosão, dano, coin, powerup, level up, wave start, shop.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;

/** Inicializa o sistema de áudio (deve ser chamado após interação do usuário) */
export function initAudio(): void {
  if (ctx) return;
  ctx = new AudioContext();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.3;
  masterGain.connect(ctx.destination);

  musicGain = ctx.createGain();
  musicGain.gain.value = 0.15;
  musicGain.connect(masterGain);

  sfxGain = ctx.createGain();
  sfxGain.gain.value = 0.5;
  sfxGain.connect(masterGain);
}

function ensureCtx(): AudioContext {
  if (!ctx) initAudio();
  return ctx!;
}

/** Toca um tom simples */
function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.3): void {
  const ac = ensureCtx();
  if (!sfxGain) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration);
}

/** Toca ruído (para explosões, impactos) */
function playNoise(duration: number, volume = 0.2): void {
  const ac = ensureCtx();
  if (!sfxGain) return;
  const bufferSize = ac.sampleRate * duration;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ac.createBufferSource();
  source.buffer = buffer;
  const gain = ac.createGain();
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  source.connect(gain);
  gain.connect(sfxGain);
  source.start(ac.currentTime);
}

// ─── Sons do Jogo ───────────────────────────────────────────

/** Som de tiro da Pistola */
export function sfxPistol(): void {
  playTone(900, 0.04, 'square', 0.15);
  playTone(700, 0.03, 'square', 0.1);
}

/** Som de tiro da Shotgun */
export function sfxShotgun(): void {
  playNoise(0.08, 0.2);
  playTone(200, 0.06, 'sawtooth', 0.15);
}

/** Som de tiro da Metralhadora */
export function sfxMachinegun(): void {
  playTone(500, 0.02, 'square', 0.12);
  playNoise(0.02, 0.08);
}

/** Som de tiro da Sniper */
export function sfxSniper(): void {
  playTone(1200, 0.06, 'sine', 0.2);
  playTone(800, 0.08, 'sine', 0.15);
  playNoise(0.04, 0.1);
}

/** Som de tiro do Laser */
export function sfxLaser(): void {
  const ac = ensureCtx();
  if (!sfxGain) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1400, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ac.currentTime + 0.08);
  gain.gain.value = 0.15;
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.08);
}

/** Som de tiro do RPG */
export function sfxRPG(): void {
  playTone(150, 0.1, 'sawtooth', 0.2);
  playTone(100, 0.15, 'sine', 0.15);
  playNoise(0.06, 0.12);
}

/** Som de tiro dos Raios */
export function sfxRaios(): void {
  playTone(1000, 0.03, 'sine', 0.15);
  playTone(1200, 0.03, 'sine', 0.12);
  playTone(800, 0.04, 'triangle', 0.1);
}

/** Som de tiro do Gel */
export function sfxGel(): void {
  playTone(600, 0.05, 'sine', 0.1);
  playTone(500, 0.04, 'triangle', 0.08);
}

/** Som de tiro da Granada */
export function sfxGranade(): void {
  playTone(200, 0.08, 'sawtooth', 0.15);
  playNoise(0.04, 0.1);
}

/** Som de tiro da Mina */
export function sfxMina(): void {
  playTone(300, 0.06, 'square', 0.12);
  playTone(250, 0.08, 'sine', 0.1);
}

/** Som de tiro inimigo */
export function sfxEnemyShoot(): void {
  playTone(400, 0.04, 'sawtooth', 0.08);
}

/** Som de explosão (inimigo morre) */
export function sfxExplosion(): void {
  playNoise(0.15, 0.25);
  playTone(150, 0.1, 'sine', 0.15);
  playTone(80, 0.15, 'sine', 0.1);
}

/** Som de explosão de boss */
export function sfxBossDeath(): void {
  playNoise(0.4, 0.35);
  playTone(100, 0.3, 'sine', 0.2);
  playTone(60, 0.4, 'sine', 0.15);
}

/** Som de jogador tomando dano */
export function sfxPlayerHit(): void {
  playTone(200, 0.1, 'sawtooth', 0.2);
  playTone(150, 0.15, 'square', 0.15);
}

/** Som de moeda coletada */
export function sfxCoin(): void {
  playTone(1200, 0.05, 'sine', 0.15);
  playTone(1600, 0.05, 'sine', 0.1);
}

/** Som de powerup coletado */
export function sfxPowerup(): void {
  playTone(600, 0.08, 'sine', 0.15);
  playTone(800, 0.08, 'sine', 0.12);
  playTone(1000, 0.1, 'sine', 0.1);
}

/** Som de level up */
export function sfxLevelUp(): void {
  const ac = ensureCtx();
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, 'sine', 0.15), i * 80);
  });
}

/** Som de nova wave */
export function sfxWaveStart(): void {
  playTone(440, 0.1, 'triangle', 0.1);
  setTimeout(() => playTone(550, 0.1, 'triangle', 0.1), 100);
  setTimeout(() => playTone(660, 0.15, 'triangle', 0.12), 200);
}

/** Som de compra na loja */
export function sfxBuy(): void {
  playTone(800, 0.06, 'sine', 0.12);
  playTone(1000, 0.08, 'sine', 0.1);
}

/** Som de erro/sem moedas */
export function sfxError(): void {
  playTone(200, 0.1, 'square', 0.1);
  playTone(150, 0.15, 'square', 0.08);
}

/** Som de game over */
export function sfxGameOver(): void {
  const notes = [440, 370, 330, 262];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sine', 0.15), i * 200);
  });
}

/** Som de hit stop (impacto forte) */
export function sfxHitStop(): void {
  playNoise(0.03, 0.3);
  playTone(100, 0.05, 'sine', 0.25);
}

// ─── Música de Fundo ────────────────────────────────────────

let musicOsc1: OscillatorNode | null = null;
let musicOsc2: OscillatorNode | null = null;
let musicInterval: ReturnType<typeof setInterval> | null = null;
let currentMusicSource: AudioBufferSourceNode | null = null;

/** Música de batalha (CC3 - Kevin MacLeod) */
const BATTLE_MUSIC_URL = 'assets/music/battle.mp3';

/** Carrega e toca música de fundo */
export async function loadAndPlayMusic(): Promise<void> {
  const ac = ensureCtx();
  if (!musicGain) return;

  try {
    const response = await fetch(BATTLE_MUSIC_URL);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ac.decodeAudioData(arrayBuffer);
    
    currentMusicSource = ac.createBufferSource();
    currentMusicSource.buffer = audioBuffer;
    currentMusicSource.loop = true;
    currentMusicSource.connect(musicGain);
    currentMusicSource.start();
  } catch (error) {
    console.log('Erro ao carregar música, usando procedural:', error);
    startProceduralMusic();
  }
}

/** Música procedural (fallback) */
const MAIN_MELODY = [
  { note: 330, dur: 0.3 },
  { note: 392, dur: 0.3 },
  { note: 440, dur: 0.5 },
  { note: 392, dur: 0.3 },
  { note: 330, dur: 0.3 },
  { note: 294, dur: 0.5 },
  { note: 330, dur: 0.2 },
  { note: 392, dur: 0.2 },
  { note: 440, dur: 0.2 },
  { note: 523, dur: 0.4 },
  { note: 494, dur: 0.4 },
  { note: 440, dur: 0.6 },
];

const BASS_LINE = [131, 131, 165, 165, 175, 175, 131, 131];

function startProceduralMusic(): void {
  const ac = ensureCtx();
  if (!musicGain || musicInterval) return;

  let melodyIndex = 0;
  let bassIndex = 0;
  let time = ac.currentTime;

  function playNote() {
    if (!musicGain) return;
    const note = MAIN_MELODY[melodyIndex % MAIN_MELODY.length];
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.value = note.note;
    gain.gain.value = 0.12;
    gain.gain.exponentialRampToValueAtTime(0.001, time + note.dur * 0.9);
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(time);
    osc.stop(time + note.dur);
    
    const bassFreq = BASS_LINE[bassIndex % BASS_LINE.length];
    const bassOsc = ac.createOscillator();
    const bassGain = ac.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.value = bassFreq;
    bassGain.gain.value = 0.06;
    bassGain.gain.exponentialRampToValueAtTime(0.001, time + note.dur * 0.8);
    bassOsc.connect(bassGain);
    bassGain.connect(musicGain);
    bassOsc.start(time);
    bassOsc.stop(time + note.dur);
    
    time += note.dur;
    melodyIndex++;
    bassIndex++;
    setTimeout(playNote, note.dur * 1000);
  }

  playNote();
  musicInterval = setInterval(() => {}, 1000);
}

/** Inicia música de fundo */
export function startMusic(): void {
  loadAndPlayMusic();
}

/** Para a música de fundo */
export function stopMusic(): void {
  if (currentMusicSource) {
    currentMusicSource.stop();
    currentMusicSource = null;
  }
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
}

/** Ajusta volume do master */
export function setMasterVolume(vol: number): void {
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, vol));
}

/** Ajusta volume dos efeitos */
export function setSfxVolume(vol: number): void {
  if (sfxGain) sfxGain.gain.value = Math.max(0, Math.min(1, vol));
}

/** Ajusta volume da música */
export function setMusicVolume(vol: number): void {
  if (musicGain) musicGain.gain.value = Math.max(0, Math.min(1, vol));
}
