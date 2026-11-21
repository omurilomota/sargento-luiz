/**
 * A QUEDA DA PONTE (M3): "Ponte com multi-spawn + timer de quebra" — a
 * coreografia pura, sem mapa (o `aplicaCelula` é injetado, o teste
 * coleta): a frente avança de leste pra oeste, cada passo sela a coluna
 * anterior e abre entulho na nova, a queda acorda dois por passo, o
 * jogador em pé na fatia leva dano — e a frente PARA na coluna 3, porque
 * a zona de extração (coluna 2) não pode cair.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  armarQuedaDaPonte, resetQuedaDaPonte, updateQuedaDaPonte, pausarQueda,
  estadoDaQueda, PONTE_GRACA, PONTE_PASSO, PONTE_COLUNA_MINIMA, PONTE_DANO,
} from '../systems/ponte';

interface Coletor {
  entulho: string[];
  seladas: string[];
}

function coletor(): Coletor {
  const c: Coletor = { entulho: [], seladas: [] };
  return c;
}

/** Roda o relógio até o próximo passo e devolve o resultado dele. */
function avancarUmPasso(coletor: Coletor) {
  for (let i = 0; i < 4000; i++) {
    const r = updateQuedaDaPonte(0.016, 0, 9, (col, row, ch) => {
      (ch === '^' ? coletor.entulho : coletor.seladas).push(`${col},${row},${ch}`);
    });
    if (r.entulho.length > 0) return r;
  }
  throw new Error('a queda nunca deu passo nenhum');
}

describe('ponte: a coreografia da queda', () => {
  beforeEach(() => {
    resetQuedaDaPonte();
    armarQuedaDaPonte();
  });

  it('a graça existe: os primeiros 10s não caem nada', () => {
    const c = coletor();
    let caiu = false;
    for (let i = 0; i < Math.floor((PONTE_GRACA - 0.5) / 0.016); i++) {
      const r = updateQuedaDaPonte(0.016, 0, 9, () => {});
      if (r.entulho.length > 0) caiu = true;
    }
    expect(caiu).toBe(false);
    void c;
  });

  it('o primeiro passo abre entulho na coluna 28 (a borda leste)', () => {
    const c = coletor();
    const r = avancarUmPasso(c);
    expect(r.entulho.length).toBeGreaterThan(0);
    expect(c.entulho.every(e => e.startsWith('28,'))).toBe(true);
    expect(c.seladas).toEqual([]); // no primeiro passo não há coluna anterior
  });

  it('o segundo passo SELA a 28 e abre a 27 — a frente sempre única', () => {
    const c = coletor();
    avancarUmPasso(c);
    const r = avancarUmPasso(c);
    expect(c.seladas.every(e => e.startsWith('28,') && e.endsWith('#'))).toBe(true);
    expect(c.entulho.filter(e => e.startsWith('27,')).every(e => e.endsWith('^'))).toBe(true);
    expect(r.entulho.every(e => e.col === 27)).toBe(true);
  });

  it('cada passo acorda DOIS (o multi-spawn da quebra)', () => {
    const c = coletor();
    const r = avancarUmPasso(c);
    expect(r.acordados).toHaveLength(2);
  });

  it('quem está em pé na fatia que cede leva dano; uma coluna depois, não', () => {
    updateQuedaDaPonte(PONTE_GRACA + 0.01, 28, 9, () => {}); // a frente abriu na 28
    const emPeNaFrente = updateQuedaDaPonte(0.016, 28, 9, () => {});
    const umaColunaDepois = updateQuedaDaPonte(0.016, 26, 9, () => {});
    expect(emPeNaFrente.dano).toBeCloseTo(PONTE_DANO * 0.016, 5);
    expect(umaColunaDepois.dano).toBe(0);
  });

  it('a frente esgota na 3 e a zona de extração (col 2) NUNCA cai', () => {
    const c: Coletor = { entulho: [], seladas: [] };
    for (let passo = 0; passo < 40; passo++) {
      updateQuedaDaPonte(PONTE_PASSO + 0.01, 0, 9, (col, row, ch) => {
        (ch === '^' ? c.entulho : c.seladas).push(`${col},${row},${ch}`);
      });
    }
    // a frente termina EMBAIXO da mínima (colou a 3 e parou): a coluna 2
    // — onde a zona de extração vive — nunca virou entulho nem parede
    expect(estadoDaQueda().frente).toBe(PONTE_COLUNA_MINIMA - 1);
    expect(c.entulho.some(e => e.startsWith('2,'))).toBe(false);
    expect(c.seladas.some(e => e.startsWith('2,'))).toBe(false);
  });

  it('pausada, a queda congela (a extração segura o que sobrou)', () => {
    pausarQueda();
    const r = updateQuedaDaPonte(999, 28, 9, () => {});
    expect(r.entulho).toEqual([]);
    expect(r.resta).toBe(0);
  });
});
