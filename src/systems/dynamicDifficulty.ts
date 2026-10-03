/**
 * Sistema de dificuldade progressiva dinâmica.
 * Rastreia padrões do jogador e ajusta comportamento dos inimigos.
 */

/** Dados de comportamento do jogador */
interface PlayerBehavior {
  /** Direção predominante de movimento (-1 esquerda, 0 centro, 1 direita) */
  horizontalTendency: number;
  /** Tendência vertical (-1 cima, 0 centro, 1 baixo) */
  verticalTendency: number;
  /** Distância média dos inimigos */
  avgDistance: number;
  /** Últimas posições para calcular tendência */
  positionHistory: { x: number; y: number; time: number }[];
  /** Tiros disparados vs acertos */
  shotsFired: number;
  shotsHit: number;
}

const behavior: PlayerBehavior = {
  horizontalTendency: 0,
  verticalTendency: 0,
  avgDistance: 300,
  positionHistory: [],
  shotsFired: 0,
  shotsHit: 0,
};

const HISTORY_SIZE = 60;

/**
 * Atualiza o tracking de comportamento do jogador.
 *
 * `dt` e `totalEnemyHealth` saíram da assinatura: o primeiro não era usado (o
 * histórico é marcado com performance.now()) e o segundo chegava sempre 0.
 * @param playerX - X do jogador
 * @param playerY - Y do jogador
 * @param enemyCount - inimigos vivos, para a distância média estimada
 */
export function updateBehavior(playerX: number, playerY: number, enemyCount: number): void {
  behavior.positionHistory.push({ x: playerX, y: playerY, time: performance.now() });
  if (behavior.positionHistory.length > HISTORY_SIZE) {
    behavior.positionHistory.shift();
  }

  // Calculate tendencies from recent positions
  if (behavior.positionHistory.length > 10) {
    const recent = behavior.positionHistory.slice(-10);
    let hSum = 0, vSum = 0;
    for (let i = 1; i < recent.length; i++) {
      hSum += recent[i].x - recent[i - 1].x;
      vSum += recent[i].y - recent[i - 1].y;
    }
    behavior.horizontalTendency = Math.max(-1, Math.min(1, hSum / 500));
    behavior.verticalTendency = Math.max(-1, Math.min(1, vSum / 500));
  }

  // Average distance to enemies (estimated)
  behavior.avgDistance = enemyCount > 0 ? Math.max(100, 500 - enemyCount * 10) : 300;
}

/**
 * Registra um tiro disparado.
 */
export function registerShot(): void {
  behavior.shotsFired++;
}

/**
 * Registra um acerto.
 */
export function registerHit(): void {
  behavior.shotsHit++;
}

/**
 * Retorna a tendência de movimento do jogador.
 * Usado por inimigos para prever posição.
 */
export function getPlayerTendency(): { h: number; v: number } {
  return { h: behavior.horizontalTendency, v: behavior.verticalTendency };
}

/**
 * Retorna a acurácia estimada do jogador.
 *
 * Calculada na hora a partir dos contadores, e não lida de um campo cacheado:
 * `updateBehavior` só roda uma vez por frame, então um getter que dependesse do
 * cache devolveria a acurácia do frame anterior.
 */
export function getPlayerAccuracy(): number {
  return behavior.shotsFired > 0 ? behavior.shotsHit / behavior.shotsFired : 0.5;
}

/** Tiros necessários antes de a acurácia valer como sinal de dificuldade. */
const MIN_SHOTS_FOR_ACCURACY = 20;

/**
 * Pressão que o jogador impõe, de 0 (erra muito) a 1 (acerta quase tudo).
 * `null` enquanto a amostra é pequena demais para significar alguma coisa — sem
 * isso a banda mexeria na dificuldade nos 3 primeiros tiros, que é só ruído.
 *
 * É isto que `getPlayerAccuracy` sempre devolveu e ninguém consumia: o módulo
 * media a acurácia, mantinha `shotsFired`/`shotsHit` atualizados a cada tiro e
 * descartava o resultado. TODO.md já marcava "dificuldade progressiva dinâmica"
 * como entregue, e a posição prevista já funcionava — só a metade de acurácia
 * não tinha consumidor.
 * @returns 0..1, ou null sem amostra suficiente
 */
export function getSkillPressure(): number | null {
  if (behavior.shotsFired < MIN_SHOTS_FOR_ACCURACY) return null;
  return Math.max(0, Math.min(1, (getPlayerAccuracy() - 0.2) / 0.6));
}

/**
 * Reseta o tracking.
 */
export function resetBehavior(): void {
  behavior.horizontalTendency = 0;
  behavior.verticalTendency = 0;
  behavior.avgDistance = 300;
  behavior.positionHistory = [];
  behavior.shotsFired = 0;
  behavior.shotsHit = 0;
}
