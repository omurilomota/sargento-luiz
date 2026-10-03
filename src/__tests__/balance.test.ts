import { describe, it, expect } from 'vitest';
import { ENEMY_TYPES, PHASES } from '../config';
import {
  WAVE_BASE_ENEMIES, WAVE_ENEMIES_PER_LEVEL, WAVE_SCALE_PER_LEVEL,
} from '../core/constants';

/**
 * Este arquivo existe porque a curva de dificuldade não era uma curva.
 *
 * Medindo com a fórmula real do spawner (inimigos por onda × vida média do tipo ×
 * escala da onda, mais a vida do chefe), a ordem de jogo era:
 *
 *   Cidade 1297 -> Floresta 1916 -> Caverna 4934 -> Fábrica 5185 -> Pântano 4745
 *   -> Castelo 6672 -> Vulcão 12859 -> Espaço 11561 -> Bunker 9630
 *
 * O Pântano era mais barato que a Fábrica, e as três últimas fases ficavam
 * progressivamente MAIS BARATAS — o fim do jogo ficava mais fácil, com o chefe
 * final (NÚCLEO, 4200) sendo o terceiro mais difícil dos nove.
 *
 * A rampa agora é o número de ondas, e `Phase.difficulty` só corrige os tipos
 * que fogem dela. O teste trava a propriedade que importa — a curva cresce —
 * porque espaçamento perfeito não é alcançável com um multiplicador só: o custo
 * base varia 10× entre a primeira e a última fase.
 */

/** Custo de uma fase: tudo que o jogador precisa matar, chefe incluído. */
function phaseCost(phase: (typeof PHASES)[number]): number {
  const mult = phase.difficulty ?? 1;
  const hpMedio = phase.enemyTypes.reduce((s, t) => s + ENEMY_TYPES[t].health, 0)
    / phase.enemyTypes.length;
  let ondas = 0;
  for (let w = 0; w < phase.waves; w++) {
    const inimigos = WAVE_BASE_ENEMIES + w * WAVE_ENEMIES_PER_LEVEL;
    ondas += inimigos * hpMedio * (1 + w * WAVE_SCALE_PER_LEVEL);
  }
  const chefe = ENEMY_TYPES[phase.boss!].health;
  return (ondas + chefe) * mult;
}

const CUSTO = PHASES.map(phaseCost);

describe('balanceamento: a dificuldade cresce ao longo das 9 fases', () => {
  it('cada fase é mais cara que a anterior', () => {
    for (let i = 1; i < PHASES.length; i++) {
      expect(
        CUSTO[i], `${PHASES[i].name} (${CUSTO[i].toFixed(0)}) não é mais cara que ${PHASES[i - 1].name} (${CUSTO[i - 1].toFixed(0)})`,
      ).toBeGreaterThan(CUSTO[i - 1]);
    }
  });

  it('a última fase é a mais cara de todas', () => {
    const maior = Math.max(...CUSTO);
    expect(CUSTO[CUSTO.length - 1]).toBe(maior);
  });

  it('a primeira fase é a mais barata de todas', () => {
    const menor = Math.min(...CUSTO);
    expect(CUSTO[0]).toBe(menor);
  });

  it('a rampa não tem salto absurdo entre fases vizinhas', () => {
    // um pico de +100% de uma fase para a outra é o sintoma do problema antigo;
    // o limite generouso pega a volta do problema sem travar ajustes futuros
    for (let i = 1; i < PHASES.length; i++) {
      const salto = CUSTO[i] / CUSTO[i - 1] - 1;
      expect(salto, `${PHASES[i - 1].name} -> ${PHASES[i].name} salta ${(salto * 100).toFixed(0)}%`)
        .toBeLessThan(1.1);
    }
  });
});

describe('balanceamento: a rampa é feita de ondas, não de multiplicador', () => {
  it('o número de ondas não diminui ao longo do jogo', () => {
    for (let i = 1; i < PHASES.length; i++) {
      expect(PHASES[i].waves, `${PHASES[i].name} tem menos ondas que ${PHASES[i - 1].name}`)
        .toBeGreaterThanOrEqual(PHASES[i - 1].waves);
    }
  });

  it('o multiplicador é um ajuste pequeno, nunca um redesenho', () => {
    for (const fase of PHASES) {
      const d = fase.difficulty ?? 1;
      expect(d, `${fase.name}: multiplicador ${d}`).toBeGreaterThanOrEqual(0.7);
      expect(d, `${fase.name}: multiplicador ${d}`).toBeLessThanOrEqual(1.3);
    }
  });

  it('as fases mais barata e mais cara não usam multiplicador', () => {
    // as pontas da rampa são as âncoras: ajustar por multiplicador nela
    // mostraria que a curva está sendo esculpida em vez de medida
    const maisBarata = PHASES[CUSTO.indexOf(Math.min(...CUSTO))];
    const maisCara = PHASES[CUSTO.indexOf(Math.max(...CUSTO))];
    expect(maisBarata.difficulty ?? 1).toBe(1);
    expect(maisCara.difficulty ?? 1).toBe(1);
  });
});

describe('balanceamento: os multiplicadores só cortam as fases que fugiam da rampa', () => {
  it('as fases ajustadas são as que tinham queda ou pico na curva antiga', () => {
    // Caverna e Fábrica eram um pico logo depois da Floresta, Pântano caía, e
    // Vulcão era o pico final que fazia Espaço e Bunker mais baratos
    const ajustadas = PHASES.filter(f => (f.difficulty ?? 1) !== 1).map(f => f.name);
    expect(ajustadas.sort()).toEqual(['Caverna', 'Fábrica', 'Pântano', 'Vulcão']);
  });

  it('nenhum multiplicador mexe no primeiro nem no último chefe', () => {
    expect(PHASES[0].difficulty ?? 1).toBe(1);
    expect(PHASES[PHASES.length - 1].difficulty ?? 1).toBe(1);
  });
});