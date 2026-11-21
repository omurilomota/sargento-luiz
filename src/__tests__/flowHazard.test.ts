/**
 * Porta: o flow field desvia de hazard quando existe rota.
 *
 * A causa raiz do Castelo não era a quantidade de espinho — era o Dijkstra
 * tratar célula de hazard como chão de custo zero. O caminho mais curto do
 * mapa, que todo inimigo segue, atravessava o corredor que fere, e o combate
 * inteiro acontecia em cima do tile: o inimigo andava por dentro, o jogador
 * pagava por fora. Com custo alto, espinho, lava e elétrico viram zona que
 * os dois lados respeitam.
 *
 * O que este arquivo mede é o CONTRATO, em três partes: com rota limpa, a
 * descida não pisa em '^'; sem rota, atravessa (hazard continua chão, não
 * parede); no mapa real do Castelo, a descida chega ao spawn sem tocar nos
 * espinhos que guardam os pilares.
 */
import { describe, it, expect } from 'vitest';
import { CELL_SIZE, BIOMES } from '../maps';
import { loadMap, rebuildFlowField, sampleFlowDir, isReachable } from '../systems/tilemap';

const centro = (col: number, row: number) => ({
  x: col * CELL_SIZE + CELL_SIZE / 2,
  y: row * CELL_SIZE + CELL_SIZE / 2,
});

/**
 * Anda a descida do flow de célula em célula, sempre pelo centro. A direção
 * é constante dentro da célula, então `Math.round(dir)` é exatamente o
 * vizinho (±1) que a descida escolheu — andar em pixels acumula drift do
 * passo diagonal e aterrissa na coluna errada, acusando o flow pelo erro
 * do próprio passeio.
 */
function seguirDescida(col: number, row: number, alvoCol: number, alvoRow: number, maxPassos = 60): string[] {
  const caminho: string[] = [];
  for (let i = 0; i < maxPassos; i++) {
    caminho.push(`${col},${row}`);
    if (col === alvoCol && row === alvoRow) return caminho;
    const c = centro(col, row);
    const dir = sampleFlowDir(c.x, c.y);
    if (dir.x === 0 && dir.y === 0) break;
    col += Math.round(dir.x);
    row += Math.round(dir.y);
  }
  return caminho;
}

describe('flow field: hazard custa caro', () => {
  it('com rota limpa, a descida não pisa no hazard', () => {
    // corredor de cima com espinho no meio, corredor de baixo limpo
    loadMap([
      '#######',
      '#..^..#',
      '#.....#',
      '#######',
    ]);
    rebuildFlowField(5, 1);
    const caminho = seguirDescida(1, 1, 5, 1);
    expect(caminho[caminho.length - 1]).toBe('5,1');
    expect(caminho).not.toContain('3,1');
  });

  it('sem rota, atravessa: hazard continua sendo chão', () => {
    loadMap([
      '#####',
      '#^..#',
      '#####',
    ]);
    rebuildFlowField(3, 1);
    // alcançável pagando o custo, e a descida existe em cima do hazard
    expect(isReachable(1, 1)).toBe(true);
    const c = centro(1, 1);
    const dir = sampleFlowDir(c.x, c.y);
    expect(Math.hypot(dir.x, dir.y)).toBeGreaterThan(0);
  });

  it('no Castelo, a descida da câmara superior chega ao spawn sem tocar espinho', () => {
    loadMap(BIOMES.castelo.rows);
    // alvo: coluna do spawn P (14, 18). Partida: câmara superior cuja linha
    // reta para o alvo cruza os espinhos da linha 7 (col 12/15/18).
    rebuildFlowField(14, 18);
    const caminho = seguirDescida(9, 7, 14, 18, 80);
    expect(caminho[caminho.length - 1]).toBe('14,18');
    expect(caminho).not.toContain('12,7');
    expect(caminho).not.toContain('15,7');
    expect(caminho).not.toContain('18,7');
    expect(caminho).not.toContain('12,12');
    expect(caminho).not.toContain('15,12');
    expect(caminho).not.toContain('18,12');
  });
});
