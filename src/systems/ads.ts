/**
 * Sistema de anúncios in-game.
 * Permite ao jogador "assistir" um anúncio simulado para ganhar moedas.
 * Simula um ad real com contagem regressiva e recompensa.
 */

/** Estado do sistema de ads */
let adsWatched = 0;
let cooldownTimer = 0;
let isWatching = false;
let watchProgress = 0;
let watchDuration = 5;
let lastReward = 0;

/** Configurações */
const AD_COOLDOWN = 30;
const AD_REWARD_BASE = 15;
const AD_REWARD_PER_WATCH = 5;
const AD_DURATION = 5;

/**
 * Retorna se um ad está sendo assistido agora.
 */
export function getIsWatchingAd(): boolean {
  return isWatching;
}

/**
 * Retorna o progresso do ad (0-1).
 */
export function getAdProgress(): number {
  return watchProgress / watchDuration;
}

/**
 * Retorna o cooldown restante entre ads.
 */
export function getAdCooldown(): number {
  return cooldownTimer;
}

/**
 * Retorna quantos ads foram assistidos.
 */
export function getAdsWatched(): number {
  return adsWatched;
}

/**
 * Retorna a recompensa do último ad assistido.
 */
export function getLastAdReward(): number {
  return lastReward;
}

/**
 * Retorna se o ad pode ser assistido.
 */
export function canWatchAd(): boolean {
  return !isWatching && cooldownTimer <= 0;
}

/**
 * Retorna a recompensa que o próximo ad dará.
 */
export function getNextAdReward(): number {
  return AD_REWARD_BASE + adsWatched * AD_REWARD_PER_WATCH;
}

/**
 * Inicia a reprodução de um ad simulado.
 * @returns true se o ad começou
 */
export function startWatchingAd(): boolean {
  if (!canWatchAd()) return false;
  isWatching = true;
  watchProgress = 0;
  return true;
}

/**
 * Atualiza o estado do ad.
 * @param dt - delta time em segundos
 * @returns recompensa se o ad terminou, 0 caso contrário
 */
export function updateAd(dt: number): number {
  if (isWatching) {
    watchProgress += dt;
    if (watchProgress >= watchDuration) {
      isWatching = false;
      adsWatched++;
      cooldownTimer = AD_COOLDOWN;
      lastReward = getNextAdReward();
      return lastReward;
    }
  } else if (cooldownTimer > 0) {
    cooldownTimer -= dt;
  }
  return 0;
}

/**
 * Reseta o sistema de ads.
 */
export function resetAds(): void {
  adsWatched = 0;
  cooldownTimer = 0;
  isWatching = false;
  watchProgress = 0;
  lastReward = 0;
}
