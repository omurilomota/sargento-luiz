/**
 * Porta: vender ponto de talento (T4 — decisão do dono: "por moedas").
 *
 * O contrato em três partes: o ponto vendido sai da conta e não volta; sem
 * ponto livre a venda recusa (a moeda fica com quem chama — o shop.ts); e a
 * venda NÃO devolve talentos já comprados — o ponto era a unidade, o
 * talento comprado é permanente (o mesmo invariante do restoreXp).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  addXp, getPontosLivres, buyTalento, getTalentos, venderPonto, resetProgress,
  xpParaProximoNivel, TALENTOS,
} from '../systems/progress';

describe('vender ponto de talento (T4)', () => {
  beforeEach(() => resetProgress());

  it('sem ponto livre, a venda recusa e nada muda', () => {
    expect(venderPonto()).toBe(false);
    expect(getPontosLivres()).toBe(0);
  });

  it('o ponto vendido sai da conta', () => {
    addXp(xpParaProximoNivel(1));
    expect(getPontosLivres()).toBe(1);
    expect(venderPonto()).toBe(true);
    expect(getPontosLivres()).toBe(0);
    expect(venderPonto()).toBe(false);
  });

  it('vender tudo não devolve talento já comprado — talento é permanente', () => {
    addXp(xpParaProximoNivel(1));
    expect(buyTalento(TALENTOS[0].id)).toBe(true);
    expect(venderPonto()).toBe(false); // o ponto virou talento, não sobrou
    expect(getTalentos()).toHaveLength(1);
  });
});
