import { Bullet, Enemy } from '../types';
import { dist } from '../utils';

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

export function checkEnemyPlayerCollision(
  enemies: Enemy[],
  playerX: number,
  playerY: number,
  playerRadius: number,
  invincible: number,
  onHit: (enemy: Enemy) => void
): void {
  for (const e of enemies) {
    if (dist(e, { x: playerX, y: playerY }) < e.radius + playerRadius && invincible <= 0) {
      onHit(e);
    }
  }
}
