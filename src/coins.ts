import { Coin } from './types';
import { rand } from './utils';

export const coins: Coin[] = [];

export function spawnCoins(x: number, y: number, count: number) {
  for (let i = 0; i < count; i++) {
    coins.push({
      x: x + rand(-20, 20),
      y: y + rand(-20, 20),
      value: 1,
      life: 15,
    });
  }
}

export function updateCoins(dt: number, playerX: number, playerY: number, playerRadius: number, onCollect: (value: number) => void) {
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.life -= dt;
    const dx = playerX - c.x;
    const dy = playerY - c.y;
    const distance = Math.hypot(dx, dy);
    if (distance < playerRadius + 10) {
      onCollect(c.value);
      coins.splice(i, 1);
    } else if (c.life <= 0) {
      coins.splice(i, 1);
    }
  }
}

export function drawCoins(ctx: CanvasRenderingContext2D) {
  for (const c of coins) {
    const alpha = Math.min(1, c.life / 3);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#f1c40f';
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f39c12';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('$', c.x, c.y + 4);
  }
  ctx.globalAlpha = 1;
}
