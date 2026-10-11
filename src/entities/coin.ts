/**
 * Entidade de moedas.
 * Gerencia a criação, movimento, coleta e magnetismo de moedas dropadas
 * por inimigos derrotados.
 */

import { Coin } from '../types';
import { rand } from '../utils';
import { moveCircleBy, pushOutOfWalls } from '../systems/tilemap';
import { COIN_LIFE, COLLECT_RADIUS, MAGNET_RADIUS, MAGNET_SPEED, PICKUP_RADIUS } from '../core/constants';

/** Lista de moedas ativas no campo */
const coinList: Coin[] = [];
/** Indica se o power-up de magnetismo está ativo */
let magnetActive = false;
/** Indica se o magnetismo permanente (upgrade da loja) está ativo */
let permanentMagnet = false;

/**
 * Retorna a lista de moedas ativas para renderização.
 */
export function getCoins(): Coin[] { return coinList; }

/**
 * Ativa ou desativa o magnetismo das moedas.
 */
export function setMagnetActive(active: boolean): void { magnetActive = active; }

/**
 * Ativa o magnetismo permanente (upgrade da loja).
 */
export function enablePermanentMagnet(): void { permanentMagnet = true; }

/**
 * Reseta o magnetismo permanente.
 */
export function resetPermanentMagnet(): void { permanentMagnet = false; }

/**
 * Cria moedas em uma posição com velocidades aleatórias.
 * Usado quando um inimigo é derrotado.
 */
export function spawnCoins(x: number, y: number, count: number): void {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const spd = rand(50, 150);
    const at = pushOutOfWalls(x + rand(-10, 10), y + rand(-10, 10), PICKUP_RADIUS);
    coinList.push({
      x: at.x, y: at.y,
      value: 1, life: COIN_LIFE,
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
    });
  }
}

/**
 * Atualiza posição, atração e coleta de todas as moedas.
 * Quando magnetismo está ativo, as moedas são atraídas de longe.
 */
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

    const magnet = magnetActive || permanentMagnet;
    let stepX = c.vx * dt;
    let stepY = c.vy * dt;

    const dx = playerX - c.x;
    const dy = playerY - c.y;
    const d = Math.hypot(dx, dy);
    const collectRadius = magnet ? MAGNET_RADIUS : playerRadius + COLLECT_RADIUS;

    if (d < collectRadius) {
      const speed = magnet ? MAGNET_SPEED : 200;
      stepX += (dx / (d || 1)) * speed * dt;
      stepY += (dy / (d || 1)) * speed * dt;
    }

    // Deslize por eixo: sem isto a velocidade inicial da moeda a empurrava
    // para dentro da parede e ela morria ali, intocável.
    const moved = moveCircleBy(c.x, c.y, stepX, stepY, PICKUP_RADIUS);
    c.x = moved.x;
    c.y = moved.y;

    if (d < playerRadius + 8) {
      onCollect(c.value);
      coinList.splice(i, 1);
    } else if (c.life <= 0) {
      coinList.splice(i, 1);
    }
  }
}

/**
 * Remove todas as moedas do campo.
 */
export function clearCoins(): void {
  coinList.length = 0;
}
