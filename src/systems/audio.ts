/**
 * src/systems/audio.ts
 *
 * SFX 100% procedurais via Web Audio API (o AGENTS.md pede isso: som distinto
 * e reconhecível por arma/ação, sem arquivos). A música é o oposto — faixas
 * reais em loop, crossfade de 0.8s, credited em `assets/music/CREDITS.md`.
 *
 * E de brinde a música procedural antiga foi removida: `MAIN_MELODY` e
 * `BASS_LINE` eram um piano de 12 notas que tocava igual em todas as fases.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;

/** Faixas de música disponíveis por contexto de jogo */
export type MusicTrack = 'menu' | 'combat' | 'boss' | 'shop';

interface TrackDef {
  file: string;
  /** Início e fim do loop em segundos (trim dos samples) */
  loopStart: number;
  loopEnd: number;
}

const TRACKS: Record<MusicTrack, TrackDef> = {
  menu: { file: 'assets/music/menu.ogg', loopStart: 0, loopEnd: 0 },
  combat: { file: 'assets/music/combat.ogg', loopStart: 0, loopEnd: 0 },
  boss: { file: 'assets/music/boss.ogg', loopStart: 0, loopEnd: 0 },
  shop: { file: 'assets/music/shop.ogg', loopStart: 0, loopEnd: 0 },
};

const CROSSFADE = 0.8;

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
  const bufferSize = Math.floor(ac.sampleRate * duration);
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

/** Varredura de frequência — base das habilidades e da navegação de menu. */
function playSweep(from: number, to: number, duration: number, type: OscillatorType, volume: number): void {
  const ac = ensureCtx();
  if (!sfxGain) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), ac.currentTime + duration);
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration);
}

// ─── Sons do Jogo ───────────────────────────────────────────────

export function sfxPistol(): void {
  playTone(900, 0.04, 'square', 0.15);
  playTone(700, 0.03, 'square', 0.1);
}

export function sfxShotgun(): void {
  playNoise(0.08, 0.2);
  playTone(200, 0.06, 'sawtooth', 0.15);
}

export function sfxMachinegun(): void {
  playTone(500, 0.02, 'square', 0.12);
  playNoise(0.02, 0.08);
}

export function sfxSniper(): void {
  playTone(1200, 0.06, 'sine', 0.2);
  playTone(800, 0.08, 'sine', 0.15);
  playNoise(0.04, 0.1);
}

export function sfxLaser(): void {
  playSweep(1400, 400, 0.08, 'sine', 0.15);
}

export function sfxRPG(): void {
  playTone(150, 0.1, 'sawtooth', 0.2);
  playTone(100, 0.15, 'sine', 0.15);
  playNoise(0.06, 0.12);
}

export function sfxRaios(): void {
  playTone(1000, 0.03, 'sine', 0.15);
  playTone(1200, 0.03, 'sine', 0.12);
  playTone(800, 0.04, 'triangle', 0.1);
}

export function sfxGel(): void {
  playTone(600, 0.05, 'sine', 0.1);
  playTone(500, 0.04, 'triangle', 0.08);
}

export function sfxGranade(): void {
  playTone(200, 0.08, 'sawtooth', 0.15);
  playNoise(0.04, 0.1);
}

export function sfxMina(): void {
  playTone(300, 0.06, 'square', 0.12);
  playTone(250, 0.08, 'sine', 0.1);
}

export function sfxEnemyShoot(): void {
  playTone(400, 0.04, 'sawtooth', 0.08);
}

export function sfxExplosion(): void {
  playNoise(0.15, 0.25);
  playTone(150, 0.1, 'sine', 0.15);
  playTone(80, 0.15, 'sine', 0.1);
}

export function sfxBossDeath(): void {
  playNoise(0.4, 0.35);
  playTone(100, 0.3, 'sine', 0.2);
  playTone(60, 0.4, 'sine', 0.15);
}

export function sfxPlayerHit(): void {
  playTone(200, 0.1, 'sawtooth', 0.2);
  playTone(150, 0.15, 'square', 0.15);
}

export function sfxCoin(): void {
  playTone(1200, 0.05, 'sine', 0.15);
  playTone(1600, 0.05, 'sine', 0.1);
}

export function sfxPowerup(): void {
  playTone(600, 0.08, 'sine', 0.15);
  playTone(800, 0.08, 'sine', 0.12);
  playTone(1000, 0.1, 'sine', 0.1);
}

export function sfxLevelUp(): void {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, 'sine', 0.15), i * 80);
  });
}

export function sfxWaveStart(): void {
  playTone(440, 0.1, 'triangle', 0.1);
  setTimeout(() => playTone(550, 0.1, 'triangle', 0.1), 100);
  setTimeout(() => playTone(660, 0.15, 'triangle', 0.12), 200);
}

export function sfxBuy(): void {
  playTone(800, 0.06, 'sine', 0.12);
  playTone(1000, 0.08, 'sine', 0.1);
}

export function sfxError(): void {
  playTone(200, 0.1, 'square', 0.1);
  playTone(150, 0.15, 'square', 0.08);
}

export function sfxGameOver(): void {
  const notes = [440, 370, 330, 262];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sine', 0.15), i * 200);
  });
}

export function sfxHitStop(): void {
  playNoise(0.03, 0.3);
  playTone(100, 0.05, 'sine', 0.25);
}

// ─── Habilidades (antes as três usavam o mesmo sfxPowerup) ───────

/** Dash: Whoosh curto descendo — leitura de "movimento". */
export function sfxDash(): void {
  playSweep(700, 180, 0.16, 'sawtooth', 0.16);
  playNoise(0.1, 0.08);
}

/** Escudo: sino subindo e sustentando — leitura de "proteção". */
export function sfxShield(): void {
  playTone(330, 0.25, 'triangle', 0.16);
  setTimeout(() => playTone(495, 0.3, 'triangle', 0.12), 60);
}

/** Fúria: rugido grave com ruído — leitura de "perigo". */
export function sfxFury(): void {
  playSweep(220, 60, 0.5, 'sawtooth', 0.2);
  playNoise(0.4, 0.12);
}

/** Navegação de menu: clique seco e curto. */
export function sfxMenuMove(): void {
  playTone(520, 0.035, 'square', 0.08);
}

/** Seleção de menu: dois tons ascendentes. */
export function sfxMenuSelect(): void {
  playTone(560, 0.05, 'square', 0.1);
  setTimeout(() => playTone(840, 0.07, 'square', 0.09), 55);
}

// ─── Música de fundo (arquivos reais, crossfade) ────────────────

let currentTrack: MusicTrack | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentGain: GainNode | null = null;
const buffers = new Map<MusicTrack, AudioBuffer>();
const loading = new Set<MusicTrack>();

/** Chave de persistência das preferências de áudio */
const MUSIC_KEY = 'bubble.musicOn';
const SFX_KEY = 'bubble.sfxOn';

let musicEnabled = readPref(MUSIC_KEY, true);
let sfxEnabled = readPref(SFX_KEY, true);

function readPref(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === '1';
  } catch {
    return fallback;
  }
}

function writePref(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    /* localStorage indisponível (modo privado): segue sem persistir */
  }
}

/** Liga ou desliga a música, persistindo a escolha. */
export function setMusicEnabled(on: boolean): void {
  musicEnabled = on;
  writePref(MUSIC_KEY, on);
  if (!musicGain) return;
  musicGain.gain.value = on ? 0.15 : 0;
  if (!on) stopMusic();
  else if (currentTrack) void playMusic(currentTrack);
}

/** Liga ou desliga os efeitos, persistindo a escolha. */
export function setSfxEnabled(on: boolean): void {
  sfxEnabled = on;
  writePref(SFX_KEY, on);
  if (sfxGain) sfxGain.gain.value = on ? 0.5 : 0;
}

export function isMusicEnabled(): boolean { return musicEnabled; }
export function isSfxEnabled(): boolean { return sfxEnabled; }

/** Faixa atualmente tocando. */
export function getCurrentTrack(): MusicTrack | null { return currentTrack; }

async function loadTrack(track: MusicTrack): Promise<AudioBuffer | null> {
  const cached = buffers.get(track);
  if (cached) return cached;
  if (loading.has(track)) return null;
  loading.add(track);
  try {
    const ac = ensureCtx();
    const res = await fetch(TRACKS[track].file);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.arrayBuffer();
    const buf = await ac.decodeAudioData(raw);
    buffers.set(track, buf);
    return buf;
  } catch {
    // faixa ausente: o jogo continua em silêncio, sem quebrar o loop
    return null;
  } finally {
    loading.delete(track);
  }
}

/**
 * Troca a faixa de música com crossfade de 0.8s.
 * @param track - faixa destino
 */
export async function playMusic(track: MusicTrack): Promise<void> {
  if (!musicEnabled) return;
  if (currentTrack === track && currentSource) return;
  currentTrack = track;

  const ac = ensureCtx();
  if (!musicGain) return;

  const buf = await loadTrack(track);
  if (!buf || currentTrack !== track) return;

  const source = ac.createBufferSource();
  source.buffer = buf;
  source.loop = true;
  const def = TRACKS[track];
  if (def.loopEnd > def.loopStart) {
    source.loopStart = def.loopStart;
    source.loopEnd = def.loopEnd;
  }

  const gain = ac.createGain();
  gain.gain.value = 0;
  source.connect(gain);
  gain.connect(musicGain);

  const oldSource = currentSource;
  const oldGain = currentGain;
  const now = ac.currentTime;

  gain.gain.linearRampToValueAtTime(1, now + CROSSFADE);
  source.start(now);

  currentSource = source;
  currentGain = gain;

  if (oldSource && oldGain) {
    oldGain.gain.cancelScheduledValues(now);
    oldGain.gain.setValueAtTime(oldGain.gain.value, now);
    oldGain.gain.linearRampToValueAtTime(0, now + CROSSFADE);
    oldSource.stop(now + CROSSFADE);
  }
}

/** Inicia a música do menu. */
export function startMusic(): void {
  void playMusic('menu');
}

/** Para a música de fundo. */
export function stopMusic(): void {
  const ac = ctx;
  if (currentSource && ac) {
    try {
      currentSource.stop();
    } catch {
      /* já parado */
    }
  }
  currentSource = null;
  currentGain = null;
  currentTrack = null;
}

export function setMasterVolume(vol: number): void {
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, vol));
}

export function setSfxVolume(vol: number): void {
  if (sfxGain) sfxGain.gain.value = Math.max(0, Math.min(1, vol));
}

export function setMusicVolume(vol: number): void {
  if (musicGain) musicGain.gain.value = Math.max(0, Math.min(1, vol));
}
