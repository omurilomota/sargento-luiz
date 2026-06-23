import { Coin } from '../types';
import { rand } from '../utils';
import { COIN_LIFE, COLLECT_RADIUS, MAGNET_RADIUS, MAGNET_SPEED } from '../core/constants';

const coinList: Coin[] = [];
let magnetActive = false;

export function getCoins(): Coin[] { return coinList; }
export function setMagnetActive(active: boolean): void { magnetActive = active; }

export function spawnCoins(x: number, y: number, count: number): void {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const spd = rand(50, 150);
    coinList.push({
      x: x + rand(-10, 10), y: y + rand(-10, 10),
      value: 1, life: COIN_LIFE,
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
    });
  }
}

export function updateCoins(
  dt: number,
  playerX: number,
  playerY: number,
  playerRadius: number,
  onCollect: (value: number) => void
): void {
  for (let i = coinList.length - 1; i >= 0; i--) {
    const c = coinList[i];
    c.life -= dt;
    c.vx *= 0.95;
    c.vy *= 0.95;
    c.x += c.vx * dt;
    c.y += c.vy * dt;

    const dx = playerX - c.x;
    const dy = playerY - c.y;
    const d = Math.hypot(dx, dy);
    const collectRadius = magnetActive ? MAGNET_RADIUS : playerRadius + COLLECT_RADIUS;

    if (d < collectRadius) {
      const speed = magnetActive ? MAGNET_SPEED : 200;
      const nx = dx / (d || 1);
      const ny = dy / (d || 1);
      c.x += nx * speed * dt;
      c.y += ny * speed * dt;
    }

    if (d < playerRadius + 8) {
      onCollect(c.value);
      coinList[coinList.length - 1] = c;
      coinList.pop();
    } else if (c.life <= 0) {
      coinList[coinList.length - 1] = c;
      coinList.pop();
    }
  }
}

export function clearCoins(): void {
  coinList.length = 0;
}
