/**
 * Sistema de detecção de colisões.
 *
 * Todas as colisões de projétil usam distância ponto-segmento (swept), não
 * distância ponto-ponto: um Laser a 1200px/s anda 20px por frame contra um
 * raio de hit de ~21px e atravessaria o inimigo sem dano.
 */

import { Bullet, Enemy } from '../types';
import { dist } from '../utils';

/**
 * Calcula o quadrado da distância entre um ponto e um segmento.
 * É o que faz a colisão swept funcionar: o segmento é o caminho do
 * projétil neste frame, o ponto é o centro do alvo.
 */
export function pointSegmentDistSq(pxp: number, pyp: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ox = pxp - ax;
    const oy = pyp - ay;
    return ox * ox + oy * oy;
  }
  let t = ((pxp - ax) * dx + (pyp - ay) * dy) / lenSq;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const cx = ax + dx * t;
  const cy = ay + dy * t;
  const ox = pxp - cx;
  const oy = pyp - cy;
  return ox * ox + oy * oy;
}

/** Posição anterior de um projétil (fallback para projéteis sem histórico). */
function prevX(b: Bullet): number { return b.px ?? b.x; }
function prevY(b: Bullet): number { return b.py ?? b.y; }

/**
 * Verifica se o trajeto do projétil neste frame encosta num alvo circular.
 */
export function bulletHitsCircle(b: Bullet, targetX: number, targetY: number, radius: number): boolean {
  return pointSegmentDistSq(targetX, targetY, prevX(b), prevY(b), b.x, b.y) < radius * radius;
}

/**
 * Verifica colisões entre projéteis do jogador e inimigos.
 * Para cada colisão detectada, chama o callback onHit.
 * Projéteis inimigos são ignorados.
 * @param onHit - callback chamado quando um projétil atinge um inimigo
 */
export function checkBulletEnemyCollisions(
  bullets: Bullet[],
  enemies: Enemy[],
  onHit: (bullet: Bullet, enemy: Enemy) => void
): void {
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    if (b.isEnemy) continue;
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      if (e.health <= 0) continue;
      if (b.hitBy && b.hitBy.has(e)) continue;
      if (bulletHitsCircle(b, e.x, e.y, e.radius + 5)) {
        onHit(b, e);
        b.hitBy?.add(e);
        break;
      }
    }
  }
}

/**
 * Verifica se projéteis inimigos acertam o jogador.
 * Ignora colisões durante período de invencibilidade.
 * @param invincible - tempo restante de invencibilidade (0 = vulnerável)
 * @param onHit - callback chamado quando um projétil inimigo atinge o jogador
 */
export function checkEnemyBulletPlayerCollision(
  bullets: Bullet[],
  playerX: number,
  playerY: number,
  playerRadius: number,
  invincible: number,
  onHit: (bullet: Bullet) => void
): void {
  if (invincible > 0) return;
  for (const b of bullets) {
    if (!b.isEnemy) continue;
    if (bulletHitsCircle(b, playerX, playerY, playerRadius + 5)) {
      onHit(b);
    }
  }
}

/**
 * Verifica colisões entre inimigos e o jogador.
 * Ignora colisões durante período de invincibilidade.
 * @param invincible - tempo restante de invencibilidade (0 = vulnerável)
 * @param onHit - callback chamado quando um inimigo colide com o jogador
 */
export function checkEnemyPlayerCollision(
  enemies: Enemy[],
  playerX: number,
  playerY: number,
  playerRadius: number,
  invincible: number,
  onHit: (enemy: Enemy) => void
): void {
  if (invincible > 0) return;
  for (const e of enemies) {
    if (dist(e, { x: playerX, y: playerY }) < e.radius + playerRadius) {
      onHit(e);
      break;
    }
  }
}
