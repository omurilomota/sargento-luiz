/**
 * Porta: o caçador do alvo do protect CHEGA ao foguete.
 *
 * Medido em 2026-10-13 (sonda isolada do Castelo): o seek direto contra a
 * câmara do meio deslizava na parede para sempre — 2 de 3 amostras
 * terminaram com o foguete intacto 41s a fio e os caçadores vivos do lado
 * de fora. O campo do alvo é o mesmo Dijkstra do jogador (hazard caro,
 * descida por gradiente), apontado para a célula do foguete.
 *
 * O contrato, em partes: a descida chega ao foguete a partir dos quatro
 * cantos por onde os caçadores realmente chegam, sem pisar em hazard; o
 * campo do alvo não é o do jogador (estruturas irmãs — na porta da câmara
 * um aponta para cima e o outro para baixo); e sem campo construído a
 * leitura devolve {0,0}, que o chamador lê como "seek direto legado".
 */
import { describe, it, expect } from 'vitest';
import { CELL_SIZE, BIOMES } from '../maps';
import {
  loadMap, findAll, charAt,
  rebuildFlowField, rebuildFlowFieldAlvo,
  sampleFlowDir, sampleFlowDirAlvo,
} from '../systems/tilemap';

const centro = (col: number, row: number) => ({
  x: col * CELL_SIZE + CELL_SIZE / 2,
  y: row * CELL_SIZE + CELL_SIZE / 2,
});

/**
 * Anda a descida do campo do alvo de célula em célula, sempre pelo centro —
 * o mesmo passeio do `flowHazard.test.ts`: a direção é constante dentro da
 * célula, então `Math.round(dir)` é exatamente o vizinho que a descida
 * escolheu.
 */
function seguirDescida(col: number, row: number, alvoCol: number, alvoRow: number, maxPassos = 80): string[] {
  const caminho: string[] = [];
  for (let i = 0; i < maxPassos; i++) {
    caminho.push(`${col},${row}`);
    if (col === alvoCol && row === alvoRow) return caminho;
    const c = centro(col, row);
    const dir = sampleFlowDirAlvo(c.x, c.y);
    if (dir.x === 0 && dir.y === 0) break;
    col += Math.round(dir.x);
    row += Math.round(dir.y);
  }
  return caminho;
}

describe('flowAlvo: o caçador chega ao foguete', () => {
  // o mapa do Castelo carrega o `F` na câmara do meio — o mesmo do gerador
  loadMap(BIOMES.castelo.rows);
  const foguete = findAll('F')[0];
  expect(foguete, 'o mapa do Castelo precisa do F do foguete').toBeTruthy();
  const fCol = foguete.col;
  const fRow = foguete.row;

  it.each([
    ['corredor sul (spawn)', 14, 18],
    ['faixa oeste', 1, 4],
    ['faixa leste', 26, 4],
    ['região norte', 14, 3],
  ])('%s: a descida chega ao foguete sem pisar em hazard', (_nome, col, row) => {
    rebuildFlowFieldAlvo(fCol, fRow);
    const caminho = seguirDescida(col, row, fCol, fRow);
    const ultimo = caminho[caminho.length - 1];
    expect(ultimo, `a descida parou em ${ultimo} sem chegar ao foguete`).toBe(`${fCol},${fRow}`);
    // hazard continua chão — mas a descida com custo alto não o pisa quando
    // existe rota limpa, e aqui a rota pela porta da coluna 14 é limpa
    for (const passo of caminho) {
      const [c, r] = passo.split(',').map(Number);
      expect(charAt(c, r), `a descida pisou em hazard em ${passo}`).not.toBe('^');
    }
  });

  it('o campo do alvo NÃO é o do jogador: na porta da câmara, um sobe e o outro desce', () => {
    // jogador no spawn, foguete na câmara: quem está na porta sul da câmara
    // deve descer para o jogador e subir para o foguete
    rebuildFlowField(14, 18);
    rebuildFlowFieldAlvo(fCol, fRow);
    const porta = centro(14, 15);
    const dirJogador = sampleFlowDir(porta.x, porta.y);
    const dirAlvo = sampleFlowDirAlvo(porta.x, porta.y);
    expect(dirJogador.y, 'o campo do jogador aponta para baixo (spawn)').toBeGreaterThan(0);
    expect(dirAlvo.y, 'o campo do alvo aponta para cima (foguete)').toBeLessThan(0);
  });

  it('sem campo construído, a leitura devolve 0,0 — o chamador cai no seek direto', () => {
    loadMap(BIOMES.castelo.rows);
    const c = centro(14, 15);
    expect(sampleFlowDirAlvo(c.x, c.y)).toEqual({ x: 0, y: 0 });
  });
});
