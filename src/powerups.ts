import { PowerUp } from './types';
import { POWERUP_TYPES } from './config';
import { rand } from './utils';

export const powerups: PowerUp[] = [];
export const activePowerups: Record<string, number> = {};

export function spawnPowerUp(x: number, y: number) {
  const types = Object.keys(POWERUP_TYPES);
  const type = types[Math.floor(rand(0, types.length))];
  powerups.push({ x, y, type, life: 12 });
}

export function updatePowerUps(dt: number, playerX: number, playerY: number, playerRadius: number, onCollect: (type: string) => void) {
  for (const key in activePowerups) {
    activePowerups[key] -= dt;
    if (activePowerups[key] <= 0) delete activePowerups[key];
  }

  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.life -= dt;
    const dx = playerX - p.x;
    const dy = playerY - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < playerRadius + 15) {
      onCollect(p.type);
      const def = POWERUP_TYPES[p.type];
      if (def.duration > 0) activePowerups[p.type] = def.duration;
      powerups.splice(i, 1);
    } else if (p.life <= 0) {
      powerups.splice(i, 1);
    }
  }
}

export function hasPowerUp(type: string): boolean {
  return !!activePowerups[type];
}

export function drawPowerUps(ctx: CanvasRenderingContext2D) {
  for (const p of powerups) {
    const def = POWERUP_TYPES[p.type];
    const bob = Math.sin(Date.now() / 200 + p.x) * 3;
    const alpha = Math.min(1, p.life / 2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = def.color;
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.symbol, p.x, p.y + bob);
  }
  ctx.globalAlpha = 1;
}

export function drawActivePowerUps(ctx: CanvasRenderingContext2D, width: number) {
  let x = width - 20;
  for (const key in activePowerups) {
    const def = POWERUP_TYPES[key];
    const remaining = activePowerups[key];
    ctx.fillStyle = def.color;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(x, 30, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.symbol, x, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(remaining.toFixed(1), x, 52);
    x -= 35;
  }
  ctx.globalAlpha = 1;
}
