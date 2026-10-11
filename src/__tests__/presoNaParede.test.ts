/**
 * Porta: um inimigo que sobrepõe uma parede sempre sai.
 *
 * O sintoma era indireto demais para virar diagnóstico: no Bunker Central a
 * fase "não acabava", o log mostrava 4 hostis e 0 abates, e as três conclusões
 * possíveis — balanceamento, spawner, mapa — estavam erradas. O inimigo estava
 * DENTRO da fileira sólida 19 (y=1264), com `flowDist === -1`, e `moveCircleBy`
 * recusava todo passo porque o círculo já invadia a parede. Congelado para
 * sempre, invencível e fora da tela.
 *
 * Jogador, chefe, loot, moeda e powerup já chamavam `pushOutOfWalls`. Só o
 * inimigo comum ficou de fora, e foi o único que podia travar.
 *
 * O que este arquivo mede é o CONTRATO de `pushOutOfWalls`, não o jogo: dado um
 * corpo que invade parede, a função devolve chão livre. A prova de que o
 * INIMIGO está ligado a ela é `tools/sessao-diagnostico.mjs`, que roda a fase
 * de verdade e conta quantos inimigos estão dentro de parede.
 */
import { describe, it, expect } from 'vitest';
import { BIOMES, CELL_SIZE } from '../maps';
import { loadMap, pushOutOfWalls, circleOverlaps, isWall } from '../systems/tilemap';
import { ENEMY_TYPES, PHASES } from '../config';

const KEYS = Object.keys(BIOMES);

/**
 * Todo raio que `updateEnemyAi` trata: os inimigos COMUNS.
 *
 * Os chefes ficam de fora de propósito, e não porоговорка: eles andam por
 * `boss.ts`, que já aplicava `pushOutOfWalls` antes desta correção, e têm
 * raio de 40 a 54 — diâmetro maior que a célula de 64px, então eles não cabem
 * em corredor de 1 célula em lugar nenhum do mapa. Cobrir os dois aqui daria
 * um teste que reprova por um motivo que não é o do `main.ts`. A pergunta do
 * chefe (cabe um chefe de raio 46 na passagem do Bunker?) é outra e está em
 * `docs/FUTURO.md`.
 */
const RAIOS = [...new Set(
  Object.entries(ENEMY_TYPES)
    .filter(([, t]) => !(t as { isBoss?: boolean }).isBoss)
    .map(([, t]) => (t as { radius: number }).radius),
)];

/**
 * Todo ponto onde um inimigo pode de fato estar: dentro de cada célula LIVRE,
 * em grade fina. Inclui as posições em que o círculo dele invade a parede
 * vizinha — que é exatamente o caso que trava, porque daí em diante todo
 * passo é recusado.
 */
function* posicoesPossiveis() {
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 30; col++) {
      if (isWall(col, row)) continue;
      for (let fx = 2; fx < CELL_SIZE; fx += 16) {
        for (let fy = 2; fy < CELL_SIZE; fy += 16) {
          yield [col * CELL_SIZE + fx, row * CELL_SIZE + fy] as const;
        }
      }
    }
  }
}

describe('pushOutOfWalls: quem invade parede, sai', () => {
  it.each(KEYS)('%s: toda sobreposição possível é resolvida, para todo raio de inimigo', (key) => {
    loadMap(BIOMES[key].rows);
    const preso: string[] = [];

    for (const [x, y] of posicoesPossiveis()) {
      for (const r of RAIOS) {
        if (!circleOverlaps(x, y, r)) continue;
        const out = pushOutOfWalls(x, y, r);
        if (circleOverlaps(out.x, out.y, r)) preso.push(`(${x},${y}) raio ${r}`);
      }
    }
    expect(preso.slice(0, 8), `${key}: ${preso.length} sobreposição(ões) sem saída`).toEqual([]);
  });

  it('não move quem já está em chão livre (roda todo frame, para todo inimigo)', () => {
    // `pushOutOfWalls` roda para todo inimigo todo frame. Se deslocasse quem
    // está bem posicionado, a arena inteira passaria a tremer.
    loadMap(BIOMES.cidade.rows);
    const moveu: string[] = [];
    for (const [x, y] of posicoesPossiveis()) {
      if (circleOverlaps(x, y, 16)) continue;
      const out = pushOutOfWalls(x, y, 16);
      if (out.x !== x || out.y !== y) moveu.push(`(${x},${y})`);
    }
    expect(moveu.slice(0, 8), `${moveu.length} posição(ões) livre(s) foram deslocadas`).toEqual([]);
  });

  it('todo raio de inimigo cabe na passagem de 1 célula do Bunker', () => {
    // O Bunker tem a fileira 17 quase toda parede e a 19 inteiramente parede: a
    // passagem é de 1 célula. Inimigo mais gordo que a passagem trava nela — que
    // é literalmente onde o sintoma apareceu.
    loadMap(BIOMES.bunker.rows);
    const tiposBunker = new Set(
      PHASES.filter((p) => p.map === 'bunker').flatMap((p) => p.enemyTypes),
    );
    const naoCabe: string[] = [];
    for (const tipo of tiposBunker) {
      const def = ENEMY_TYPES[tipo] as { radius: number; isBoss?: boolean };
      if (def.isBoss) continue; // ver RAIOS: chefe tem movimento próprio
      if (def.radius * 2 > CELL_SIZE) naoCabe.push(`${tipo} (diâmetro ${def.radius * 2} > ${CELL_SIZE})`);
    }
    expect(naoCabe).toEqual([]);
  });
});