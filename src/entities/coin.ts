/**
 * Entidade de moedas.
 * Gerencia a criação, movimento, coleta e magnetismo de moedas dropadas
 * por inimigos derrotados.
 */

import { Coin } from '../types';
import { rand } from '../utils';
import { COIN_LIFE, COLLECT_RADIUS, MAGNET_RADIUS, MAGNET_SPEED } from '../core/constants';

/** Lista de moedas ativas no campo */
const coinList: Coin[] = [];
/** Indica se o power-up de magnetismo está ativo */
let magnetActive = false;

/**
 * Retorna a lista de moedas ativas para renderização.
 * @returns array de moedas
 */
export function getCoins(): Coin[] { return coinList; }

/**
 * Ativa ou desativa o magnetismo das moedas.
 * @param active - true para ativar magnetismo
 */
export function setMagnetActive(active: boolean): void { magnetActive = active; }

/**
 * Cria moedas em uma posição com velocidades aleatórias.
 * Usado quando um inimigo é derrotado.
 * @param x - posição horizontal de origem
 * @param y - posição vertical de origem
 * @param count - quantidade de moedas a criar
 */
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

/**
 * Atualiza posição, atração e coleta de todas as moedas.
 * Quando magnetismo está ativo, as moedas são atraídas de longe.
 * @param dt - delta time em segundos
 * @param playerX - posição horizontal do jogador
 * @param playerY - posição vertical do jogador
 * @param playerRadius - raio de colisão do jogador
 * @param onCollect - callback chamado quando o jogador coleta uma moeda
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
