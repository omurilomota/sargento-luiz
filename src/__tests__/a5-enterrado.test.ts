/**
 * A REPRO do A5 — "player para de se mover do nada em certos mapas".
 *
 * Hipótese (do cabeçalho original da sessão anterior): o dash entra em parede
 * (escrita direta em x/y, sem colisão — skills.ts) e o `pushOutOfWalls` não
 * consegue sair de paredes GROSSAS. Aí o `moveCircleBy` bloqueia as 4
 * direções e o jogador fica enterrado: para de se mover "do nada".
 *
 * Reproduz no instrumento MENOR (regra do AGENTS): Node importando as
 * funções reais do tilemap e os 16 mapas reais — sem navegador, sem bot.
 *
 * NOTA (atualizada por esta frente): o `pushOutOfWalls` já roda no jogador
 * TODO FRAME (main.ts) e tem o fallback `primeiroChaoLivre`, que varre
 * anéis de célula e "sempre acha chão livre quando existe". Então a
 * hipótese do dash deve ser REFUTADA: nenhum ponto do mapa aprisiona o
 * jogador. Este teste vira a guarda de regressão desse contrato.
 */
import { describe, it, expect } from 'vitest';
import { loadMap, moveCircleBy, pushOutOfWalls, isWall } from '../systems/tilemap';
import { BIOMES, CELL_SIZE } from '../maps';
import { PLAYER_RADIUS } from '../core/constants';

const PASSO = 8; // um passo de frame de movimento

function congeladoEm(x: number, y: number): boolean {
  // moveCircleBy bloqueado nas 4 direções = enterrado
  const passos: [number, number][] = [[PASSO, 0], [-PASSO, 0], [0, PASSO], [0, -PASSO]];
  return passos.every(([dx, dy]) => {
    const r = moveCircleBy(x, y, dx, dy, PLAYER_RADIUS);
    return Math.hypot(r.x - x, r.y - y) < 0.5;
  });
}

describe('A5: o jogador nunca fica enterrado (dash → pushOutOfWalls resgata)', () => {
  it('nenhum ponto de parede grossa aprisiona o jogador nas 16 fases', () => {
    const culpados: string[] = [];
    for (const [chave, mapa] of Object.entries(BIOMES)) {
      loadMap(mapa.rows);
      // amostra o miolo das paredes: células de parede com vizinhos de parede
      // (parede grossa). O dash atravessa até ~2,5 células — testa o miolo.
      let achados = 0;
      for (let row = 1; row < mapa.rows.length - 1; row++) {
        for (let col = 1; col < mapa.rows[row].length - 1; col++) {
          if (!isWall(col, row)) continue;
          // miolo: as 4 vizinhas também são parede (borda fina não conta)
          if (!(isWall(col - 1, row) && isWall(col + 1, row) && isWall(col, row - 1) && isWall(col, row + 1))) continue;
          const x = col * CELL_SIZE + CELL_SIZE / 2;
          const y = row * CELL_SIZE + CELL_SIZE / 2;
          const fugiu = pushOutOfWalls(x, y, PLAYER_RADIUS);
          const escapou = Math.hypot(fugiu.x - x, fugiu.y - y) > 0.5;
          if (!escapou && congeladoEm(x, y)) achados++;
        }
      }
      if (achados > 0) culpados.push(`${chave}: ${achados} pontos`);
    }
    if (culpados.length) {
      console.log('mapas com pontos de aprisionamento:', culpados.join(' · '));
    }
    // O contrato que vale para sempre: o resgate NUNCA falha onde existe
    // chão livre. Se algum dia aparecer ponto preso, este teste reprova e
    // nomeia o mapa.
    expect(culpados.length, `pontos de aprisionamento: ${culpados.join(' · ')}`).toBe(0);
  });

  it('a fuga NÃO falha perto de parede fina (o caso comum está seguro)', () => {
    // o anel de 3 células sempre acha piso quando a parede tem 1 célula:
    // confere que o resgate funciona tanto em parede fina quanto grossa
    const mapa = BIOMES.cidade;
    loadMap(mapa.rows);
    let falhasFina = 0;
    for (let row = 1; row < mapa.rows.length - 1; row++) {
      for (let col = 1; col < mapa.rows[row].length - 1; col++) {
        if (!isWall(col, row)) continue;
        const temVizinhaLivre = !isWall(col - 1, row) || !isWall(col + 1, row) || !isWall(col, row - 1) || !isWall(col, row + 1);
        if (!temVizinhaLivre) continue; // só parede FINA aqui
        const x = col * CELL_SIZE + CELL_SIZE / 2;
        const y = row * CELL_SIZE + CELL_SIZE / 2;
        const fugiu = pushOutOfWalls(x, y, PLAYER_RADIUS);
        if (Math.hypot(fugiu.x - x, fugiu.y - y) <= 0.5) falhasFina++;
      }
    }
    expect(falhasFina, 'paredes finas que não deixam fugir').toBe(0);
  });
});
