/**
 * Sistema de detecção de colisões.
 * Verifica colisões entre projéteis e inimigos, projéteis inimigos e jogador,
 * e inimigos e jogador usando detecção por distância (circulo-circulo).
 */

import { Bullet, Enemy } from '../types';
import { dist } from '../utils';

/**
 * Verifica colisões entre projéteis do jogador e inimigos.
 * Para cada colisão detectada, chama o callback onHit.
 * Projéteis inimigos são ignorados.
 * @param bullets - lista de projéteis ativos
 * @param enemies - lista de inimigos ativos
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
      if (dist(b, e) < e.radius + 5) {
        onHit(b, e);
        break;
      }
    }
  }
}

/**
 * Verifica colisões entre projéteis inimigos e o jogador.
 * Ignora colisões durante período de invincibilidade.
 * @param bullets - lista de projéteis ativos
 * @param playerX - posição horizontal do jogador
 * @param playerY - posição vertical do jogador
 * @param playerRadius - raio de colisão do jogador
 * @param invincible - tempo restante de invincibilidade (0 = vulnerável)
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
  for (const b of bullets) {
    if (!b.isEnemy) continue;
    if (invincible <= 0 && dist(b, { x: playerX, y: playerY }) < playerRadius + 5) {
      onHit(b);
    }
  }
}

/**
 * Verifica colisões entre inimigos e o jogador.
 * Ignora colisões durante período de invincibilidade.
 * @param enemies - lista de inimigos ativos
 * @param playerX - posição horizontal do jogador
 * @param playerY - posição vertical do jogador
 * @param playerRadius - raio de colisão do jogador
 * @param invincible - tempo restante de invincibilidade (0 = vulnerável)
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
