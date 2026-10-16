/**
 * src/systems/audio.ts
 *
 * SFX: arquivo real primeiro (`SFX_FILES` → `assets/sfx/*.ogg`,
 * Kenney CC0 + OpenGameArt CC0/CC-BY), procedural como fallback
 * quando o arquivo não existe — o
 * mesmo padrão de `sprites.ts`. A curadoria é incremental: com o diretório
 * vazio o jogo toca 100% procedural, sem silêncio e sem erro no console.
 *
 * A música é real desde sempre: faixas OGG em loop, crossfade de 0.8s,
 * credited em `assets/music/CREDITS.md`.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;

/** Faixas de música disponíveis por contexto de jogo */
export type MusicTrack = 'menu' | 'combat' | 'boss' | 'shop' | 'epilogo';

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
  epilogo: { file: 'assets/music/epilogo.ogg', loopStart: 0, loopEnd: 0 },
};

const CROSSFADE = 0.8;

/**
 * Tenta desbloquear um contexto suspenso. Firefox/Chrome suspendem o
 * AudioContext por política de autoplay (e ao ocultar a aba); só é
 * possível retomar DENTRO de um gesto do usuário — por isso isto
 * deve ser chamado no topo dos handlers de teclado/mouse, em
 * QUALQUER estado do jogo.
 */
export function unlockAudio(): void {
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

/** Inicializa o sistema de áudio (deve ser chamado após interação do usuário) */
export function initAudio(): void {
  if (ctx) {
    // contexto já existe: se estiver suspenso (política de autoplay,
    // aba em segundo plano ou código antigo), desbloqueia no gesto atual
    if (ctx.state === 'suspended') void ctx.resume();
    return;
  }
  ctx = new AudioContext();
  // política de autoplay: o contexto nasce suspenso e fica silencioso
  // sem erro — resume() o desbloqueia (chamado após interação do usuário)
  void ctx.resume();
  masterGain = ctx.createGain();
  masterGain.gain.value = masterVolume;
  masterGain.connect(ctx.destination);

  musicGain = ctx.createGain();
  // respeita o toggle persistido: antes o ganho nascia não-zero
  // mesmo com a música desligada na pref
  musicGain.gain.value = musicEnabled ? musicVolume : 0;
  musicGain.connect(masterGain);

  sfxGain = ctx.createGain();
  sfxGain.gain.value = sfxEnabled ? sfxVolume : 0;
  sfxGain.connect(masterGain);

  preloadSfx();
}

/** Dispara o carregamento de todos os SFX (fire-and-forget, cacheado). */
function preloadSfx(): void {
  for (const key of Object.keys(SFX_FILES)) void loadSfx(key);
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
  osc.onended = () => {
    gain.disconnect();
    osc.disconnect();
  };
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
  source.onended = () => {
    gain.disconnect();
    source.disconnect();
  };
}

/**
 * Rajada de ruído filtrado — é o "estalo" do disparo. O filtro é o que
 * separa uma sniper de uma metralhadora: a sniper é grave e curta, a
 * metralhadora é fina e alta. `playNoise` sozinho (ruído branco) soa igual
 * para todas as armas.
 */
function playBurst(duration: number, volume: number, filter: BiquadFilterType, freq: number, q = 1): void {
  const ac = ensureCtx();
  if (!sfxGain) return;
  const bufferSize = Math.max(1, Math.floor(ac.sampleRate * duration));
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ac.createBufferSource();
  source.buffer = buffer;
  const biquad = ac.createBiquadFilter();
  biquad.type = filter;
  biquad.frequency.value = freq;
  biquad.Q.value = q;
  const gain = ac.createGain();
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  source.connect(biquad);
  biquad.connect(gain);
  gain.connect(sfxGain);
  source.start(ac.currentTime);
  source.onended = () => {
    gain.disconnect();
    biquad.disconnect();
    source.disconnect();
  };
}

/**
 * Variação de tom. Tiro automático repete 16× por segundo: com a frequência
 * idêntica cada disparo vira um bipe mecânico, e o ouvido identifica a arma
 * pelo padrão, não pela nota. `amount` é a fração (0.08 = ±8%).
 */
function vary(freq: number, amount: number): number {
  return freq * (1 + (Math.random() * 2 - 1) * amount);
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
  osc.onended = () => {
    gain.disconnect();
    osc.disconnect();
  };
}

// ─── SFX em arquivo (freesound, CC0/CC-BY) ──────────────

interface SfxDef {
  file: string;
  /** Ganho do buffer — recordings têm níveis inconsistentes, por isso o
   * ajuste existe por chave; omitido = 1 (nível original da gravação). */
  vol?: number;
  /** Variação de playbackRate (±fração) para sons repetidos — mesmo
   * conceito do `vary()` procedural: a automática repete 16×/s e com o
   * buffer idêntico cada disparo vira bipe mecânico. */
  vary?: number;
}

/**
 * Uma chave por `sfxX()` abaixo. Arquivo ausente não é erro: o jogo
 * toca o procedural equivalente (fallback, mesmo padrão de sprites.ts).
 * Exportado para o teste de existência (`sfxAssets.test.ts`) iterar
 * as chaves sem duplicar a lista.
 */
export const SFX_FILES: Record<string, SfxDef> = {
  pistol:      { file: 'assets/sfx/pistol.ogg',      vary: 0.06 },
  shotgun:     { file: 'assets/sfx/shotgun.ogg' },
  machinegun:  { file: 'assets/sfx/machinegun.ogg',  vary: 0.12 },
  sniper:      { file: 'assets/sfx/sniper.ogg' },
  laser:       { file: 'assets/sfx/laser.ogg',       vary: 0.05 },
  rpg:         { file: 'assets/sfx/rpg.ogg' },
  raios:       { file: 'assets/sfx/raios.ogg',       vary: 0.2 },
  gel:         { file: 'assets/sfx/gel.ogg' },
  granade:     { file: 'assets/sfx/granade.ogg',     vary: 0.1 },
  mina:        { file: 'assets/sfx/mina.ogg' },
  enemyShoot:  { file: 'assets/sfx/enemyShoot.ogg',  vary: 0.08 },
  explosion:   { file: 'assets/sfx/explosion.ogg' },
  bossDeath:   { file: 'assets/sfx/bossDeath.ogg' },
  playerHit:   { file: 'assets/sfx/playerHit.ogg' },
  coin:        { file: 'assets/sfx/coin.ogg' },
  powerup:     { file: 'assets/sfx/powerup.ogg' },
  achievement: { file: 'assets/sfx/achievement.ogg' },
  levelUp:     { file: 'assets/sfx/levelUp.ogg' },
  waveStart:   { file: 'assets/sfx/waveStart.ogg' },
  buy:         { file: 'assets/sfx/buy.ogg' },
  error:       { file: 'assets/sfx/error.ogg' },
  jammed:      { file: 'assets/sfx/jammed.ogg',      vary: 0.1 },
  gameOver:    { file: 'assets/sfx/gameOver.ogg' },
  hitStop:     { file: 'assets/sfx/hitStop.ogg' },
  dash:        { file: 'assets/sfx/dash.ogg' },
  shield:      { file: 'assets/sfx/shield.ogg' },
  fury:        { file: 'assets/sfx/fury.ogg' },
  menuMove:    { file: 'assets/sfx/menuMove.ogg' },
  menuSelect:  { file: 'assets/sfx/menuSelect.ogg' },
  // Recarga por família. O pack de recargas do OpenGameArt (CC0) tem pente de
  // pistola, fuzil de assalto, shotgun e rifle — então cada família continua
  // com o seu timbre, que era o que a síntese fazia e o que um arquivo único
  // perderia.
  reload_pistola:      { file: 'assets/sfx/reload_pistola.ogg',      vary: 0.05 },
  reload_escopeta:     { file: 'assets/sfx/reload_escopeta.ogg',     vary: 0.05 },
  reload_metralhadora: { file: 'assets/sfx/reload_metralhadora.ogg', vary: 0.08 },
  reload_precisao:     { file: 'assets/sfx/reload_precisao.ogg',     vary: 0.05 },
  reload_energia:      { file: 'assets/sfx/reload_energia.ogg',      vary: 0.05 },
  reload_lancador:     { file: 'assets/sfx/reload_lancador.ogg',     vary: 0.04 },
  reload_mina:         { file: 'assets/sfx/reload_mina.ogg',         vary: 0.1 },
  // Estado da arma (qualidade) e peça equipável
  ferrugem:            { file: 'assets/sfx/ferrugem.ogg',            vary: 0.12 },
  piece:               { file: 'assets/sfx/piece.ogg' },
  // Os sons narrativos do H5 (2026-10-14): a risada do Luiz no fim da
  // campanha, a chave de roda do conserto do motor e o lançamento do foguete
  // — o pós-missão do Castelo.
  risada:              { file: 'assets/sfx/risada.ogg' },
  tornado:             { file: 'assets/sfx/tornado.ogg' },
  // AMBIÊNCIA (M1): one-shots periódicos em volume baixo — ver
  // systems/ambiente.ts pelas janelas de cada fase
  vento:               { file: 'assets/sfx/vento.ogg', vol: 0.5 },
  gaivota:             { file: 'assets/sfx/gaivota.ogg', vol: 0.4, vary: 0.08 },
  agua_cais:           { file: 'assets/sfx/agua_cais.ogg', vol: 0.35, vary: 0.12 },
  gotejamento:         { file: 'assets/sfx/gotejamento.ogg', vol: 0.45, vary: 0.15 },
  apito:               { file: 'assets/sfx/apito.ogg', vol: 0.4 },
  maquinario:          { file: 'assets/sfx/maquinario.ogg', vol: 0.35, vary: 0.1 },
  drone_vazio:         { file: 'assets/sfx/drone_vazio.ogg', vol: 0.4 },
  alarme_estacao:      { file: 'assets/sfx/alarme_estacao.ogg', vol: 0.5, vary: 0.06 },
  ferramenta:          { file: 'assets/sfx/ferramenta.ogg' },
  foguete_lancamento:  { file: 'assets/sfx/foguete_lancamento.ogg' },
};

const sfxBuffers = new Map<string, AudioBuffer>();
const sfxLoading = new Set<string>();

/**
 * Carrega o OGG de uma chave (espelho de `loadTrack`). Falha silenciosa:
 * arquivo ausente ou não-decodificável retorna null e o procedural assume.
 */
async function loadSfx(key: string): Promise<AudioBuffer | null> {
  const cached = sfxBuffers.get(key);
  if (cached) return cached;
  if (sfxLoading.has(key)) return null;
  sfxLoading.add(key);
  try {
    const ac = ensureCtx();
    const res = await fetch(SFX_FILES[key].file);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.arrayBuffer();
    const buf = await ac.decodeAudioData(raw);
    sfxBuffers.set(key, buf);
    return buf;
  } catch {
    return null;
  } finally {
    sfxLoading.delete(key);
  }
}

/**
 * Toca o arquivo real no `sfxGain`. Retorna false sem buffer (ausente ou
 * ainda carregando) — quem chamou cai no procedural. Passa por `sfxGain`,
 * então o toggle de efeitos e o volume funcionam igual no procedural.
 */
function playSfxFile(key: string): boolean {
  const def = SFX_FILES[key];
  const buf = sfxBuffers.get(key);
  if (!def || !buf || !ctx || !sfxGain) return false;
  const source = ctx.createBufferSource();
  source.buffer = buf;
  if (def.vary) source.playbackRate.value = 1 + (Math.random() * 2 - 1) * def.vary;
  const gain = ctx.createGain();
  gain.gain.value = def.vol ?? 1;
  source.connect(gain);
  gain.connect(sfxGain);
  source.start();
  // o ganho morre com o som: GainNode conectado é referenciado pelo grafo
  // de áudio e NUNCA é coletado — cada hit/tiro/moeda vazava um nó, e o
  // lag "depois de matar muitos" era o grafo processando centenas deles.
  source.onended = () => {
    gain.disconnect();
    source.disconnect();
  };
  return true;
}

// ─── Sons do Jogo ───────────────────────────────────────────────

// Cada arma tem um par (estalo, corpo) distinto. O `estalo` é o ruído
// filtrado que dá a textura metálica; o `corpo` é a caixa de ressonância que
// dá o peso. Sem a variação de `vary`, as automáticas viram bipe.

export function sfxPistol(): void {
  if (playSfxFile('pistol')) return;
  playBurst(0.05, 0.22, 'bandpass', 1900, 1.2);
  playTone(vary(320, 0.06), 0.05, 'triangle', 0.11);
}

export function sfxShotgun(): void {
  if (playSfxFile('shotgun')) return;
  playBurst(0.16, 0.3, 'lowpass', 900, 0.8);
  playSweep(220, 60, 0.14, 'sawtooth', 0.16);
}

export function sfxMachinegun(): void {
  if (playSfxFile('machinegun')) return;
  playBurst(0.035, 0.17, 'highpass', 1500, 0.9);
  playTone(vary(520, 0.12), 0.03, 'triangle', 0.09);
}

export function sfxSniper(): void {
  if (playSfxFile('sniper')) return;
  // estalo agudo e seco, com a cauda longa embaixo
  playBurst(0.06, 0.3, 'bandpass', 3200, 2.2);
  playSweep(1400, 180, 0.22, 'sawtooth', 0.13);
  playTone(70, 0.24, 'sine', 0.16);
}

export function sfxLaser(): void {
  if (playSfxFile('laser')) return;
  playSweep(vary(1700, 0.05), 380, 0.09, 'sawtooth', 0.09);
  playBurst(0.04, 0.07, 'bandpass', 2600, 3);
}

export function sfxRPG(): void {
  if (playSfxFile('rpg')) return;
  playSweep(90, 300, 0.16, 'sawtooth', 0.2);
  playBurst(0.2, 0.22, 'lowpass', 500, 0.7);
  playTone(60, 0.2, 'sine', 0.14);
}

export function sfxRaios(): void {
  if (playSfxFile('raios')) return;
  // crepitação filtrável em lugar de bipe retro
  for (let i = 0; i < 3; i++) {
    setTimeout(() => playBurst(0.03, 0.18, 'highpass', 1800, 1.6), i * 35);
  }
  playSweep(vary(2200, 0.2), 700, 0.09, 'sawtooth', 0.09);
}

export function sfxGel(): void {
  if (playSfxFile('gel')) return;
  // "gotejando": glissando para cima e morrendo
  playSweep(300, 900, 0.09, 'sine', 0.12);
  playBurst(0.07, 0.08, 'lowpass', 1200, 2);
}

export function sfxGranade(): void {
  if (playSfxFile('granade')) return;
  playBurst(0.06, 0.2, 'bandpass', 800, 1.6);
  playTone(vary(180, 0.1), 0.1, 'triangle', 0.13);
}

export function sfxMina(): void {
  if (playSfxFile('mina')) return;
  playSweep(400, 90, 0.13, 'triangle', 0.13);
  playBurst(0.1, 0.13, 'lowpass', 600, 0.9);
}

export function sfxEnemyShoot(): void {
  if (playSfxFile('enemyShoot')) return;
  playTone(vary(260, 0.08), 0.05, 'triangle', 0.06);
  playBurst(0.03, 0.1, 'bandpass', 900, 0.8);
}

export function sfxExplosion(): void {
  if (playSfxFile('explosion')) return;
  playNoise(0.15, 0.25);
  playTone(150, 0.1, 'sine', 0.15);
  playTone(80, 0.15, 'sine', 0.1);
}

export function sfxBossDeath(): void {
  if (playSfxFile('bossDeath')) return;
  playNoise(0.4, 0.35);
  playTone(100, 0.3, 'sine', 0.2);
  playTone(60, 0.4, 'sine', 0.15);
}

export function sfxPlayerHit(): void {
  if (playSfxFile('playerHit')) return;
  playTone(200, 0.1, 'sawtooth', 0.2);
  playTone(150, 0.15, 'square', 0.15);
}

export function sfxCoin(): void {
  if (playSfxFile('coin')) return;
  playTone(1200, 0.05, 'sine', 0.15);
  playTone(1600, 0.05, 'sine', 0.1);
}

export function sfxPowerup(): void {
  if (playSfxFile('powerup')) return;
  playTone(600, 0.08, 'sine', 0.15);
  playTone(800, 0.08, 'sine', 0.12);
  playTone(1000, 0.1, 'sine', 0.1);
}

export function sfxAchievement(): void {
  if (playSfxFile('achievement')) return;
  const notes = [659, 988, 1319];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.12, 'sine', 0.12), i * 70);
  });
}

export function sfxLevelUp(): void {
  if (playSfxFile('levelUp')) return;
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, 'sine', 0.15), i * 80);
  });
}

export function sfxWaveStart(): void {
  if (playSfxFile('waveStart')) return;
  playTone(440, 0.1, 'triangle', 0.1);
  setTimeout(() => playTone(550, 0.1, 'triangle', 0.1), 100);
  setTimeout(() => playTone(660, 0.15, 'triangle', 0.12), 200);
}

export function sfxBuy(): void {
  if (playSfxFile('buy')) return;
  playTone(800, 0.06, 'sine', 0.12);
  playTone(1000, 0.08, 'sine', 0.1);
}

export function sfxError(): void {
  if (playSfxFile('error')) return;
  playTone(200, 0.1, 'square', 0.1);
  playTone(150, 0.15, 'square', 0.08);
}

export function sfxJammed(): void {
  if (playSfxFile('jammed')) return;
  playTone(vary(200, 0.1), 0.07, 'square', 0.1);
  setTimeout(() => playBurst(0.04, 0.25, 'highpass', 4000, 2), 70);
}

/**
 * Recarga, variando por família de arma.
 *
 * Não havia som de recarga nenhum: `startReload` era mudo, e o jogador ficava
 * olhando a barra crescer sem nenhum feedback auditivo de "agora estou armado
 * de novo". A variação por família é o que impede o mesmo clique em 12 armas
 * soar como um único som de UI.
 *
 * Mecânica do som real: magazine cai (clique seco), puxa (varredura grave),
 * encaixa (clique agudo). O intervalo entre as três etapas é maior na Metralhadora
 * (pente de 25) e menor na Pistola (pente de 10).
 */
export type WeaponFamily = 'pistol' | 'shotgun' | 'machine' | 'precision' | 'energy' | 'launcher' | 'mine';

const RECHARGE_TIMING: Record<WeaponFamily, [number, number, number]> = {
  pistol:    [0, 120, 300],
  shotgun:   [0, 200, 460],
  machine:   [0, 240, 620],
  precision: [0, 320, 780],
  energy:    [0, 180, 420],
  launcher:  [0, 340, 840],
  mine:      [0, 160, 380],
};

/** Corpo do som por família: a metralhadora tem mais chiado, a sniper é seca. */
const RECHARGE_BODY: Record<WeaponFamily, { freq: number; q: number; drop: number }> = {
  pistol:    { freq: 2600, q: 3, drop: 0.05 },
  shotgun:   { freq: 1500, q: 2, drop: 0.07 },
  machine:   { freq: 3200, q: 2, drop: 0.08 },
  precision: { freq: 1900, q: 5, drop: 0.05 },
  energy:    { freq: 4200, q: 6, drop: 0.04 },
  launcher:  { freq: 1200, q: 2, drop: 0.09 },
  mine:      { freq: 1700, q: 3, drop: 0.06 },
};

export function sfxReload(familia: WeaponFamily = 'pistol'): void {
  // Arquivo CC0 por família (pente, bomba de shotgun, fuzil, rifle): a
  // síntese de baixo é o fallback de quem não carregou.
  if (playSfxFile(`reload_${familia}`)) return;
  const [t0, t1, t2] = RECHARGE_TIMING[familia];
  const corpo = RECHARGE_BODY[familia];
  // 1. magazine soltando: clique de bandwidth estreito, quase sem grave
  playBurst(corpo.drop, 0.2, 'bandpass', corpo.freq * 1.6, corpo.q);
  // 2. puxando: varredura pra baixo, que é o que o ouvido lê como "recarregando"
  setTimeout(() => playSweep(corpo.freq * 0.9, corpo.freq * 0.28, 0.16, 'sawtooth', 0.1), t1);
  // 3. encaixando: clique mais agudo e curto que o primeiro
  setTimeout(() => playBurst(0.035, 0.26, 'bandpass', corpo.freq * 2.1, corpo.q), t2);
  void t0;
}

/**
 * Arma enferrujada: o primeiro disparo depois de pegar uma enferrujada range.
 *
 * A qualidade `enferrujada` já existia (0.75 de dano, dispersão 1.5) desde o
 * começo, mas era invisível: o tiro saía igual ao de uma arma nova. Aqui o
 * grunhido metálico roça o disparo na primeira vez e some depois — ferrugem é
 * um estado, não um efeito permanente que cansa.
 */
let ferrugemJaOuvida = new Set<string>();

export function sfxFerrugem(familia: WeaponFamily = 'pistol', arma: string = ''): void {
  // só uma vez por arma por partida: repetir todo tiro vira ruído
  if (arma && ferrugemJaOuvida.has(arma)) return;
  if (arma) ferrugemJaOuvida.add(arma);
  // arquivo CC0 (rangido do RPG Audio do Kenney): a síntese é o fallback
  if (playSfxFile('ferrugem')) return;
  // metal raspando: banda média estreita com Q alta = o "rangido"
  playBurst(0.18, 0.13, 'bandpass', 1400 + RECHARGE_BODY[familia].q * 180, 8);
  setTimeout(() => playBurst(0.11, 0.09, 'bandpass', 900, 10), 55);
}

export function resetFerrugem(): void {
  ferrugemJaOuvida = new Set();
}

/**
 * Condição da arma no disparo: enferrujada range, quebrada falha mais alto,
 * suja só encarece o ruído de fundo.
 *
 * `quebrada` tem 20% de falha (o tiro some) — o som precisa concordar com o
 * que aconteceu, senão o jogador ouve um tiro normal e não entende por que a
 * bala não saiu.
 */
export function sfxCondicao(qualidade: string, familia: WeaponFamily = 'pistol'): void {
  if (qualidade === 'enferrujada') {
    sfxFerrugem(familia);
  } else if (qualidade === 'quebrada') {
    // o encasquilho já tem som próprio no banco (jammed, do Kenney)
    if (playSfxFile('jammed')) return;
    playBurst(0.05, 0.3, 'highpass', 3200, 1.5);
    setTimeout(() => playTone(vary(140, 0.12), 0.05, 'square', 0.1), 40);
  } else if (qualidade === 'suja') {
    playBurst(0.035, 0.1, 'lowpass', 900, 1);
  }
}

export function sfxGameOver(): void {
  if (playSfxFile('gameOver')) return;
  const notes = [440, 370, 330, 262];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sine', 0.15), i * 200);
  });
}

// O hit stop não tem som: o congelamento de 15ms é sentindo, não ouvido, e um
// estalo por abate somava ruído no meio do combate. `triggerHitStop`
// (`effects.ts`) é o que roda; este `sfx*` órfão só ocupava espaço na lista de
// débitos do `semProcedural`.

// ─── Habilidades (antes as três usavam o mesmo sfxPowerup) ───────

/** Dash: Whoosh curto descendo — leitura de "movimento". */
export function sfxDash(): void {
  if (playSfxFile('dash')) return;
  playSweep(700, 180, 0.16, 'sawtooth', 0.16);
  playNoise(0.1, 0.08);
}

/** Escudo: sino subindo e sustentando — leitura de "proteção". */
export function sfxShield(): void {
  if (playSfxFile('shield')) return;
  playTone(330, 0.25, 'triangle', 0.16);
  setTimeout(() => playTone(495, 0.3, 'triangle', 0.12), 60);
}

/** Fúria: rugido grave com ruído — leitura de "perigo". */
export function sfxFury(): void {
  if (playSfxFile('fury')) return;
  playSweep(220, 60, 0.5, 'sawtooth', 0.2);
  playNoise(0.4, 0.12);
}

/** Navegação de menu: clique seco e curto. */
export function sfxMenuMove(): void {
  if (playSfxFile('menuMove')) return;
  playTone(520, 0.035, 'square', 0.08);
}

/** Seleção de menu: dois tons ascendentes. */
export function sfxMenuSelect(): void {
  if (playSfxFile('menuSelect')) return;
  playTone(560, 0.05, 'square', 0.1);
  setTimeout(() => playTone(840, 0.07, 'square', 0.09), 55);
}

/** Coleta de peça (Faixa C §8): clique metálico + sino — distinto do coin/powerup. */
export function sfxPiece(): void {
  if (playSfxFile('piece')) return;
  playBurst(0.04, 0.2, 'highpass', 3000, 1.4);
  setTimeout(() => playTone(1180, 0.09, 'triangle', 0.12), 40);
}

// ─── Sons narrativos do H5 (arquivos; a síntese é fallback que não roda) ──

/** A risada do Luiz no fim da campanha — "acabei com você, maldição". */
export function sfxRisada(): void {
  if (playSfxFile('risada')) return;
  playTone(220, 0.15, 'square', 0.1);
}

/**
 * A porta da AMBIÊNCIA: dispara o one-shot da chave dada. Sem fallback —
 * som de ambiente que não carregou é silêncio (o lugar continua lá), não
 * síntese tentando imitar gaivota.
 */
export function sfxAmbiente(chave: string): void {
  playSfxFile(chave);
}

/**
 * O uivo do TORNADO (M1): 7s de vendaval real — "Storm Arwen 2022", de
 * Tsorthan Grove (CC-BY 4.0), gravação de campo da tempestade que bateu
 * recorde de vento no Reino Unido. Toca uma vez por evento; o fallback
 * sintetizado é ruído filtrado sozinho no escuro.
 */
export function sfxTornado(): void {
  if (playSfxFile('tornado')) return;
  playBurst(0.3, 7, 'highpass', 200, 0.6);
}

/** A chave de roda no motor do foguete (pós-missão do Castelo). */
export function sfxFerramenta(): void {
  if (playSfxFile('ferramenta')) return;
  playBurst(0.05, 0.2, 'highpass', 2500, 1.2);
}

/** O lançamento do foguete do Castelo — "Lá vou eu!". */
export function sfxFogueteLancamento(): void {
  if (playSfxFile('foguete_lancamento')) return;
  playBurst(0.5, 1.2, 'lowpass', 400, 0.8);
}

// ─── Música de fundo (arquivos reais, crossfade) ────────────────

let currentTrack: MusicTrack | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentGain: GainNode | null = null;
const buffers = new Map<MusicTrack, AudioBuffer>();
const loading = new Set<MusicTrack>();

/** Chave de persistência das preferências de áudio */
const MUSIC_KEY = 'luiz.musicOn';
const SFX_KEY = 'luiz.sfxOn';
const VOL_MASTER_KEY = 'luiz.volMaster';
const VOL_MUSIC_KEY = 'luiz.volMusic';
const VOL_SFX_KEY = 'luiz.volSfx';

let musicEnabled = readPref(MUSIC_KEY, true);
let sfxEnabled = readPref(SFX_KEY, true);

/**
 * Volumes padrão. Subiram de 0.3/0.28/0.72 porque o jogo estava baixo demais
 * no padrão — o jogador tinha de mexer nas configurações para ouvir o tiro da
 * própria arma. Só o default mudou: quem já ajustou mantém o valor salvo.
 */
let masterVolume = readPrefNum(VOL_MASTER_KEY, 0.5);
let musicVolume = readPrefNum(VOL_MUSIC_KEY, 0.4);
let sfxVolume = readPrefNum(VOL_SFX_KEY, 0.85);

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

function readPrefNum(key: string, fallback: number): number {
  try {
    const v = parseFloat(localStorage.getItem(key) ?? '');
    return Number.isNaN(v) ? fallback : v;
  } catch {
    return fallback;
  }
}

function writePrefNum(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* localStorage indisponível (modo privado): segue sem persistir */
  }
}

/** Liga ou desliga a música, persistindo a escolha. */
export function setMusicEnabled(on: boolean): void {
  musicEnabled = on;
  writePref(MUSIC_KEY, on);
  if (!musicGain) return;
  musicGain.gain.value = on ? musicVolume : 0;
  if (!on) stopMusic();
  else if (currentTrack) void playMusic(currentTrack);
}

/** Liga ou desliga os efeitos, persistindo a escolha. */
export function setSfxEnabled(on: boolean): void {
  sfxEnabled = on;
  writePref(SFX_KEY, on);
  if (sfxGain) sfxGain.gain.value = on ? sfxVolume : 0;
}

export function isMusicEnabled(): boolean { return musicEnabled; }
export function isSfxEnabled(): boolean { return sfxEnabled; }

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
    // o crossfade de música vazava 1 ganho por troca de faixa — menos que
    // o SFX, mas o mesmo buraco (nó conectado nunca é coletado)
    oldSource.onended = () => {
      oldGain.disconnect();
      oldSource.disconnect();
    };
  }
}

/** Inicia a música do menu. */
export function startMusic(): void {
  void playMusic('menu');
}

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

export function getMasterVolume(): number { return masterVolume; }
export function getMusicVolume(): number { return musicVolume; }
export function getSfxVolume(): number { return sfxVolume; }

function clampVolume(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function setMasterVolume(vol: number): void {
  masterVolume = clampVolume(vol);
  writePrefNum(VOL_MASTER_KEY, masterVolume);
  if (masterGain) masterGain.gain.value = masterVolume;
}

export function setSfxVolume(vol: number): void {
  sfxVolume = clampVolume(vol);
  writePrefNum(VOL_SFX_KEY, sfxVolume);
  if (sfxGain) sfxGain.gain.value = sfxEnabled ? sfxVolume : 0;
}

export function setMusicVolume(vol: number): void {
  musicVolume = clampVolume(vol);
  writePrefNum(VOL_MUSIC_KEY, musicVolume);
  if (musicGain) musicGain.gain.value = musicEnabled ? musicVolume : 0;
}

/**
 * Qual som cada arma toca.
 *
 * Fica aqui, e não no `main.ts`, porque é dado de áudio e precisa ser testável:
 * a BFG estava ausente e caía num fallback silencioso para `sfxPistol` — uma
 * explosão de 5 projéteis com som de pistola. `weaponSound.test.ts` trava que
 * toda arma de `WEAPONS` tem entrada aqui.
 */
export const WEAPON_SOUNDS: Record<string, () => void> = {
  'Pistola': sfxPistol,
  'Shotgun': sfxShotgun,
  'Metralhadora': sfxMachinegun,
  'Sniper': sfxSniper,
  'Laser': sfxLaser,
  'RPG': sfxRPG,
  'Raios': sfxRaios,
  'Gel': sfxGel,
  'Granada': sfxGranade,
  'Mina': sfxMina,
  'BFG': sfxRPG,
  'M. Quebrada': sfxMachinegun,
  'Destruidor': sfxRPG,
};
