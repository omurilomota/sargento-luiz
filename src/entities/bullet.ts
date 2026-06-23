import { Bullet } from '../types';
import { BULLET_LIFE } from '../core/constants';

const bullets: Bullet[] = [];

export function getBullets(): Bullet[] {
  return bullets;
}

export function spawnBullet(
  x: number, y: number, vx: number, vy: number,
  damage: number, isEnemy: boolean, color: string, pierce: boolean
): void {
  bullets.push({ x, y, vx, vy, life: BULLET_LIFE, damage, isEnemy, color, pierce });
}

export function updateBullets(dt: number, canvasWidth: number, canvasHeight: number): void {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.x < -50 || b.x > canvasWidth + 50 || b.y < -50 || b.y > canvasHeight + 50) {
      bullets[bullets.length - 1] = b;
      bullets.pop();
    }
  }
}

export function clearBullets(): void {
  bullets.length = 0;
}
