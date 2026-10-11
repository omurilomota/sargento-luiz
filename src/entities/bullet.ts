/**
 * Entidade de projéteis.
 * Gerencia a criação, atualização e limpeza de projéteis.
 * Suporta projéteis do jogador e inimigos no mesmo array.
 * Cada projétil guarda a posição anterior (px/py) para permitir
 * colisão swept — sem isso, o Laser (1200px/s) atravessa inimigos.
 */

import { Bullet, Enemy } from '../types';
import { BULLET_LIFE, MINE_LIFE, MINE_DETECTION_RADIUS, MINE_FUSE } from '../core/constants';

/** Lista de projéteis ativos */
const bullets: Bullet[] = [];

/**
 * Retorna a lista de projéteis ativos para renderização e colisão.
 */
export function getBullets(): Bullet[] {
  return bullets;
}

/**
 * Cria um novo projétil e adiciona à lista.
 * @param isEnemy - true se o projétil foi disparado por um inimigo
 * @param pierce - true se atravessa múltiplos alvos
 * @param explosive - true se o projétil é explosivo
 * @param explosionRadius - raio da explosão em pixels
 * @param isCrit - true se o projétil acertou crítico
 */
export function spawnBullet(
  x: number, y: number, vx: number, vy: number,
  damage: number, isEnemy: boolean, color: string, pierce: boolean,
  explosive = false, explosionRadius = 0, isCrit = false,
  bulletSprite = 'small_bullet'
): void {
  // mina plantada (explosiva sem velocidade): pavio longo de mina, não o da bala
  const life = explosive && vx === 0 && vy === 0 ? MINE_LIFE : BULLET_LIFE;
  bullets.push({
    x, y, px: x, py: y, vx, vy, life, damage, isEnemy, color, isCrit,
    pierce, explosive, explosionRadius, bulletSprite,
    hitBy: new Set<Enemy>(),
  });
}

/**
 * Atualiza posição e vida de todos os projéteis.
 * Remove projéteis que expiraram ou saíram dos limites do mundo.
 *
 * Devolve os explosivos que chegaram ao fim da vida útil sem detonar (o
 * pavio): quem detona é o chamador — aqui não existe explosão, só lista.
 * Projétil que saiu do mundo some em silêncio: não tem plateia.
 */
export function updateBullets(dt: number, worldWidth: number, worldHeight: number): Bullet[] {
  for (const b of bullets) {
    b.px = b.x;
    b.py = b.y;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }
  const expiraram: Bullet[] = [];
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (b.life <= 0) {
      if (b.explosive && !b.detonated) expiraram.push(b);
      bullets.splice(i, 1);
    } else if (b.x < -50 || b.x > worldWidth + 50 || b.y < -50 || b.y > worldHeight + 50) {
      bullets.splice(i, 1);
    }
  }
  return expiraram;
}

/**
 * Mina plantada: explosiva parada (vx = vy = 0).
 *
 * Antes a mina só explodia se alguém pisasse em cima (colisão swept de bala)
 * e sumia junto com o pavio de 2s da bala. Agora ela fica no chão, um inimigo
 * a `MINE_DETECTION_RADIUS` arma o fuse e `MINE_FUSE` segundos depois ela
 * estoura — dá tempo de perceber e sair.
 *
 * Devolve as minas cujo fuse acabou; detonar é papel do chamador.
 */
export function updateMines(dt: number, enemies: Enemy[]): Bullet[] {
  const detonadas: Bullet[] = [];
  for (const b of bullets) {
    if (b.life <= 0 || !b.explosive || b.vx !== 0 || b.vy !== 0) continue;
    const perto = enemies.some(e => e.health > 0 && e.spawnDelay <= 0 &&
      Math.hypot(e.x - b.x, e.y - b.y) < MINE_DETECTION_RADIUS + e.radius);
    if (perto) b.fuse = (b.fuse ?? 0) + dt;
    if ((b.fuse ?? 0) >= MINE_FUSE) detonadas.push(b);
  }
  return detonadas;
}

/**
 * Remove todos os projéteis ativos.
 */
export function clearBullets(): void {
  bullets.length = 0;
}
