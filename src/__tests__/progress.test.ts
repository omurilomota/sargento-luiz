import { describe, it, expect, beforeEach } from 'vitest';
import {
  xpParaProximoNivel, nivelDeXp, progressoNoNivel, addXp, getNivel,
  getPontosLivres, buyTalento, getTalentos, resetProgress, TALENTOS,
} from '../systems/progress';

describe('curva de nível', () => {
  it('nível 1 com 0 XP', () => {
    expect(nivelDeXp(0)).toBe(1);
  });

  it('o primeiro patamar leva ao nível 2', () => {
    expect(xpParaProximoNivel(1)).toBe(500);
    expect(nivelDeXp(499)).toBe(1);
    expect(nivelDeXp(500)).toBe(2);
  });

  it('cada nível custa mais que o anterior', () => {
    expect(xpParaProximoNivel(2)).toBeGreaterThan(xpParaProximoNivel(1));
    expect(xpParaProximoNivel(3)).toBeGreaterThan(xpParaProximoNivel(2));
  });

  it('progressoNoNivel devolve o resto dentro do nível', () => {
    const p = progressoNoNivel(700); // 700 = 500 (nível 2) + 200
    expect(p.atual).toBe(200);
    expect(p.necessario).toBe(xpParaProximoNivel(2));
  });
});

describe('ganho de XP e pontos', () => {
  beforeEach(() => resetProgress());

  it('subir de nível dá pontos de talento', () => {
    addXp(500);
    expect(getNivel()).toBe(2);
    expect(getPontosLivres()).toBe(1);
  });

  it('dois níveis de uma vez dão dois pontos', () => {
    addXp(500 + xpParaProximoNivel(2));
    expect(getNivel()).toBe(3);
    expect(getPontosLivres()).toBe(2);
  });

  it('XP que não cruza patamar não dá ponto', () => {
    addXp(100);
    expect(getNivel()).toBe(1);
    expect(getPontosLivres()).toBe(0);
  });
});

describe('talentos', () => {
  beforeEach(() => resetProgress());

  it('compra gasta um ponto e registra o talento', () => {
    addXp(500);
    expect(buyTalento('armas_dano')).toBe(true);
    expect(getPontosLivres()).toBe(0);
    expect(getTalentos()).toContain('armas_dano');
  });

  it('sem ponto livre não compra', () => {
    expect(buyTalento('armas_dano')).toBe(false);
  });

  it('não compra o mesmo talento duas vezes', () => {
    addXp(1200); // 500 (nível 2) + 700 (nível 3) = 2 pontos
    expect(getNivel()).toBe(3);
    expect(buyTalento('mente_crit')).toBe(true);
    expect(buyTalento('mente_crit')).toBe(false);
    expect(getPontosLivres()).toBe(1);
  });

  it('os 3 galhos existem', () => {
    const galhos = new Set(TALENTOS.map((t) => t.galho));
    expect(galhos).toEqual(new Set(['mente', 'armas', 'movimento']));
  });
});
