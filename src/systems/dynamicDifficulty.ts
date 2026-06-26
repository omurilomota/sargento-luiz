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
  /** Taxa de acerto estimada */
  accuracy: number;
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
  accuracy: 0.5,
  positionHistory: [],
  shotsFired: 0,
  shotsHit: 0,
};

const HISTORY_SIZE = 60;

/**
 * Atualiza o tracking de comportamento do jogador.
 */
export function updateBehavior(
  playerX: number, playerY: number, dt: number,
  enemyCount: number, totalEnemyHealth: number
): void {
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

  // Accuracy
  if (behavior.shotsFired > 0) {
    behavior.accuracy = behavior.shotsHit / behavior.shotsFired;
  }
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
 * Usado para ajustar dificuldade.
 */
export function getPlayerAccuracy(): number {
  return behavior.accuracy;
}

/**
 * Reseta o tracking.
 */
export function resetBehavior(): void {
  behavior.horizontalTendency = 0;
  behavior.verticalTendency = 0;
  behavior.avgDistance = 300;
  behavior.accuracy = 0.5;
  behavior.positionHistory = [];
  behavior.shotsFired = 0;
  behavior.shotsHit = 0;
}
