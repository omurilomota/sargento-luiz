/**
 * Entidade de projéteis.
 * Gerencia a criação, atualização e limpeza de projéteis.
 * Suporta projéteis do jogador e inimigos no mesmo array.
 * Cada projétil guarda a posição anterior (px/py) para permitir
 * colisão swept — sem isso, o Laser (1200px/s) atravessa inimigos.
 */

import { Bullet, Enemy } from '../types';
import { BULLET_LIFE } from '../core/constants';

/** Lista de projéteis ativos */
const bullets: Bullet[] = [];

/**
 * Retorna a lista de projéteis ativos para renderização e colisão.
 * @returns array de projéteis
 */
export function getBullets(): Bullet[] {
  return bullets;
}

/**
 * Cria um novo projétil e adiciona à lista.
 * @param x - posição horizontal inicial
 * @param y - posição vertical inicial
 * @param vx - velocidade horizontal
 * @param vy - velocidade vertical
 * @param damage - dano causado ao atingir um alvo
 * @param isEnemy - true se o projétil foi disparado por um inimigo
 * @param color - cor do projétil
 * @param pierce - true se atravessa múltiplos alvos
 * @param explosive - true se o projétil é explosivo
 * @param explosionRadius - raio da explosão em pixels
 * @param isCrit - true se o projétil acertou crítico
 */
export function spawnBullet(
  x: number, y: number, vx: number, vy: number,
  damage: number, isEnemy: boolean, color: string, pierce: boolean,
  explosive = false, explosionRadius = 0, isCrit = false
): void {
  bullets.push({
    x, y, px: x, py: y, vx, vy, life: BULLET_LIFE, damage, isEnemy, color, isCrit,
    pierce, explosive, explosionRadius,
    hitBy: new Set<Enemy>(),
  });
}

/**
 * Atualiza posição e vida de todos os projéteis.
 * Remove projéteis que expiraram ou saíram dos limites do mundo.
 * @param dt - delta time em segundos
 * @param worldWidth - largura do mundo (não da tela)
 * @param worldHeight - altura do mundo (não da tela)
 */
export function updateBullets(dt: number, worldWidth: number, worldHeight: number): void {
  for (const b of bullets) {
    b.px = b.x;
    b.py = b.y;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (b.life <= 0 || b.x < -50 || b.x > worldWidth + 50 || b.y < -50 || b.y > worldHeight + 50) {
      bullets.splice(i, 1);
    }
  }
}

/**
 * Remove todos os projéteis ativos.
 */
export function clearBullets(): void {
  bullets.length = 0;
}
