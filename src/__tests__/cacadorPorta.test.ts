/**
 * Porta: o caçador ATRAVESSA portas de 1 célula — o pipeline do jogo, com
 * as funções reais, sem navegador.
 *
 * Reproduzido em 2026-10-13: com o vetor cru do flow field, um archer ficou
 * 1800/1800 frames parado na lateral da porta norte do Castelo (896,371) —
 * a descida apontava reto para o vão, mas o corpo deslocado do centro não
 * tinha componente lateral para deslizar. No corredor sul, outro ficou
 * espetado no canto da parede (994 frames travados). O vetor por célula
 * não carrega o alinhamento sub-célula que o vão exige.
 *
 * O contrato: o passo mira no CENTRO da próxima célula da descida
 * (`passoDeCelula`), e o caçador chega à vizinhança do foguete a partir das
 * duas posições que congelaram.
 */
import { describe, it, expect } from 'vitest';
import { CELL_SIZE, BIOMES } from '../maps';
import {
  loadMap, rebuildFlowFieldAlvo, sampleFlowDirAlvo,
  moveCircleBy, pushOutOfWalls, colAt, rowAt,
} from '../systems/tilemap';
import { normalize } from '../utils';

const centro = (col: number, row: number) => ({
  x: col * CELL_SIZE + CELL_SIZE / 2,
  y: row * CELL_SIZE + CELL_SIZE / 2,
});

/** O passo do jogo: centro da próxima célula da descida (ver passoDeCelula). */
function passoDeCelula(x: number, y: number, dir: { x: number; y: number }) {
  const proxima = centro(colAt(x) + Math.round(dir.x), rowAt(y) + Math.round(dir.y));
  return normalize({ x: proxima.x - x, y: proxima.y - y });
}

function simular(x0: number, y0: number, raio: number, spdBase: number, segundos: number) {
  loadMap(BIOMES.castelo.rows);
  rebuildFlowFieldAlvo(13, 10);
  const foguete = centro(13, 10);
  let x = x0;
  let y = y0;
  let travados = 0;
  const dt = 1 / 60;
  for (let i = 0; i < 60 * segundos; i++) {
    const dir = sampleFlowDirAlvo(x, y);
    const dist = Math.hypot(foguete.x - x, foguete.y - y);
    let sx: number;
    let sy: number;
    if (dist >= 140 && (dir.x !== 0 || dir.y !== 0)) {
      const passo = passoDeCelula(x, y, dir);
      sx = passo.x; sy = passo.y;
    } else {
      const len = Math.hypot(foguete.x - x, foguete.y - y) || 1;
      sx = (foguete.x - x) / len; sy = (foguete.y - y) / len;
    }
    const next = moveCircleBy(x, y, sx * spdBase * dt, sy * spdBase * dt, raio);
    const fora = pushOutOfWalls(next.x, next.y, raio);
    if (fora.x === x && fora.y === y) travados++;
    x = fora.x; y = fora.y;
  }
  return { x, y, distFinal: Math.hypot(foguete.x - x, foguete.y - y), travados, total: Math.round(60 * segundos) };
}

describe('cacadorPorta: o caçador atravessa porta de 1 célula', () => {
  it('da lateral da porta norte (896,371) — o congelado de 1800/1800 frames', () => {
    const r = simular(896, 371, 13, 52, 20);
    console.log(`(896,371) -> (${r.x.toFixed(0)},${r.y.toFixed(0)}) dist ${r.distFinal.toFixed(0)} travados ${r.travados}/${r.total}`);
    expect(r.distFinal, 'chegou à vizinhança do foguete').toBeLessThan(140);
    expect(r.travados / r.total, 'a travadia sumiu').toBeLessThan(0.1);
  });

  it('do fundo da faixa leste (1824,480) — o espetado no canto da parede', () => {
    const r = simular(1824, 480, 13, 52, 45);
    console.log(`(1824,480) -> (${r.x.toFixed(0)},${r.y.toFixed(0)}) dist ${r.distFinal.toFixed(0)} travados ${r.travados}/${r.total}`);
    expect(r.distFinal, 'chegou à vizinhança do foguete').toBeLessThan(140);
    expect(r.travados / r.total, 'a travadia sumiu').toBeLessThan(0.1);
  });
});
