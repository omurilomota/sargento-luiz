/**
 * Porta: o corredor de 1 célula do Bunker não vira queijo — os chefes do
 * rush NÃO cabem nele, e TODOS atiram.
 *
 * O §1.9 pedia "medir se o chefe alcança o jogador no corredor de baixo
 * antes de mexer: pode ser arena, raio ou mapa". Medido (2026-10-13):
 *
 * - GEOMETRIA: célula = 64px; corredor de 1 célula = 64px de vão. Os raios
 *   dos 4 chefes do `NUCLEO_RUSH` vão de 46 a 54 — TODOS maiores que a
 *   meia-célula (32) que o `moveCircleBy` precisa para passar. Nenhum chefe
 *   entra em corredor de 1 célula em lugar nenhum do jogo (DECISIONS #158),
 *   e o spawn do chefe já foge disso (`findFreeSpotNear` com o raio real).
 * - PRESSÃO: o corredor de baixo do Bunker é RETO. Um jogador acampado ali
 *   não é alcançado pelo corpo do chefe, mas os 4 atiram (`canShoot`,
 *   balas a 300–340 px/s) e a linha de tiro desce o corredor limpa; a
 *   biomaquina (raio 19) entra e pressiona.
 *
 * O contrato deste teste é o segundo ponto: se um rebalanceamento baixar o
 * raio de um chefe do rush para ≤ 32 (ele passa a espremer em corredor de
 * 1 célula e a geometria do §1.9 muda de novo) ou tirar o tiro dele (o
 * corredor vira abrigo gratuito), esta porta acusa o número, não o olho.
 */
import { describe, it, expect } from 'vitest';
import { ENEMY_TYPES, NUCLEO_RUSH } from '../config';
import { CELL_SIZE } from '../maps';

const MEIA_CELULA = CELL_SIZE / 2;

describe('§1.9: corredor de 1 célula x chefes do rush', () => {
  it('os 4 chefes do rush existem', () => {
    expect(NUCLEO_RUSH).toHaveLength(4);
    for (const tipo of NUCLEO_RUSH) {
      expect(ENEMY_TYPES[tipo], `o tipo '${tipo}' da fila do rush não existe`).toBeTruthy();
    }
  });

  it('nenhum chefe do rush CABE em corredor de 1 célula (raio > meia célula)', () => {
    for (const tipo of NUCLEO_RUSH) {
      const raio = ENEMY_TYPES[tipo].radius;
      expect(raio, `${tipo} com raio ${raio} caberia num corredor de 1 célula — a geometria do §1.9 mudou`).toBeGreaterThan(MEIA_CELULA);
    }
  });

  it('todos atiram: o corredor reto não é abrigo gratuito', () => {
    for (const tipo of NUCLEO_RUSH) {
      expect(ENEMY_TYPES[tipo].canShoot, `${tipo} sem tiro tornaria o corredor de baixo um queijo`).toBe(true);
    }
  });
});
