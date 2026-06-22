import { Coin } from './types';
import { rand } from './utils';

export const coins: Coin[] = [];
let magnetActive = false;

export function setMagnetActive(active: boolean) { magnetActive = active; }

export function spawnCoins(x: number, y: number, count: number) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const spd = rand(50, 150);
    coins.push({
      x: x + rand(-10, 10),
      y: y + rand(-10, 10),
      value: 1,
      life: 20,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
    });
  }
}

export function updateCoins(dt: number, playerX: number, playerY: number, playerRadius: number, onCollect: (value: number) => void) {
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.life -= dt;
    c.vx *= 0.95;
    c.vy *= 0.95;
    c.x += c.vx * dt;
    c.y += c.vy * dt;

    const dx = playerX - c.x;
    const dy = playerY - c.y;
    const dist = Math.hypot(dx, dy);
    const collectRadius = magnetActive ? 120 : playerRadius + 12;

    if (dist < collectRadius) {
      const speed = magnetActive ? 400 : 200;
      const nx = dx / (dist || 1);
      const ny = dy / (dist || 1);
      c.x += nx * speed * dt;
      c.y += ny * speed * dt;
    }

    if (dist < playerRadius + 8) {
      onCollect(c.value);
      coins.splice(i, 1);
    } else if (c.life <= 0) {
      coins.splice(i, 1);
    }
  }
}

export function drawCoins(ctx: CanvasRenderingContext2D) {
  for (const c of coins) {
    const pulse = 1 + Math.sin(Date.now() / 300 + c.x) * 0.15;
    const alpha = Math.min(1, c.life / 3);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#f1c40f';
    ctx.shadowColor = '#f1c40f';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 7 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#d4ac0d';
    ctx.beginPath();
    ctx.arc(c.x - 1, c.y - 1, 4 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', c.x, c.y + 1);
  }
  ctx.globalAlpha = 1;
}
