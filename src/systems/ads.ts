/**
 * Monetização: resgate de moedas e apoio ao projeto.
 *
 * ANTES este módulo se chamava "ad" e o botão dizia `ASSISTIR ANÚNCIO` sem
 * existir anúncio nenhum — só uma barra de 5 segundos que dava moedas. A
 * diretriz de qualidade do itch.io proíbe anúncio enganoso, e isso é um
 * anúncio que não existe. Então o rótulo virou `RESGATE DE MOEDAS`: é uma
 * faucet de moeda com cooldown, e é honesto dizer que é isso.
 *
 * A recompensa e o cooldown continuam exatamente os mesmos de antes — quem
 * conhece o ritmo do botão não sente nada. O que muda é o texto.
 *
 * O gancho continua sendo o ponto de extensão: num portal que pague
 * impressions (CrazyGames, Poki), é aqui que entra o SDK — `updateAd` passa a
 * consultar o anúncio real e o `canWatchAd` vira "o anúncio carregou". A
 * assinatura não precisa mudar.
 */

/** Estado do resgate */
let adsWatched = 0;
let cooldownTimer = 0;
let isWatching = false;
let watchProgress = 0;
const watchDuration = 5;
let lastReward = 0;

const AD_COOLDOWN = 30;
const AD_REWARD_BASE = 15;

/**
 * Resgates por fase.
 *
 * A recompensa crescia +5 por visualização e só era zerada no `resetGame`, o
 * que dava um faucet sem teto: 30 resgates numa partida = 2625 moedas de graça,
 * ou 78% de toda a renda da campanha sem o jogador matar nada. Agora o resgate
 * é um income menor e previsível, e a moeda que importa vem de abate.
 */
const AD_MAX_PER_PHASE = 2;

export function getIsWatchingAd(): boolean {
  return isWatching;
}

export function getAdProgress(): number {
  return watchProgress / watchDuration;
}

export function getAdCooldown(): number {
  return cooldownTimer;
}

export function getAdsWatched(): number {
  return adsWatched;
}

export function canWatchAd(): boolean {
  return !isWatching && cooldownTimer <= 0 && adsWatched < AD_MAX_PER_PHASE;
}

export function getNextAdReward(): number {
  return AD_REWARD_BASE;
}

/** Resgates restantes na fase — a loja desabilita o botão quando é 0. */
export function getAdsRemaining(): number {
  return Math.max(0, AD_MAX_PER_PHASE - adsWatched);
}

/** Zera a cota ao trocar de fase; o cooldown curto sozinho não limitava nada. */
export function resetAdsPerPhase(): void {
  adsWatched = 0;
  cooldownTimer = 0;
}

export function startWatchingAd(): boolean {
  if (!canWatchAd()) return false;
  isWatching = true;
  watchProgress = 0;
  return true;
}

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

export function resetAds(): void {
  adsWatched = 0;
  cooldownTimer = 0;
  isWatching = false;
  watchProgress = 0;
  lastReward = 0;
}
