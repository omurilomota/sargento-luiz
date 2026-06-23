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

/** Som de tiro do jogador */
export function sfxShoot(): void {
  playTone(800, 0.05, 'square', 0.15);
  playTone(600, 0.03, 'square', 0.1);
}

/** Som de tiro da shotgun */
export function sfxShotgun(): void {
  playNoise(0.08, 0.2);
  playTone(200, 0.06, 'sawtooth', 0.15);
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

/** Inicia música de fundo simples em loop */
export function startMusic(): void {
  const ac = ensureCtx();
  if (!musicGain || musicInterval) return;

  const notes = [262, 294, 330, 349, 392, 349, 330, 294];
  let noteIndex = 0;

  musicInterval = setInterval(() => {
    if (!musicGain) return;
    const freq = notes[noteIndex % notes.length];
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.value = 0.08;
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.4);
    noteIndex++;
  }, 400);
}

/** Para a música de fundo */
export function stopMusic(): void {
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
