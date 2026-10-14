/**
 * Porta: o fogo no chão da fase final (B7 — "explosão por todo lado").
 *
 * O contrato em partes: a poça NASCE onde algo explodiu e some sozinha
 * (vida finita); quem fica em cima PISA nela (geometria do meio-raio — fogo
 * na borda não é fogo debaixo do pé); o teto de poças simultâneas segura
 * a tela de virar só fogo; e o clear não vaza estado entre fases.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  spawnFire, getFires, updateFires, clearFires, pisaEmFogo,
  FOGO_VIDA, FOGO_RAIO, FOGO_MAX, FOGO_DPS,
} from '../systems/explosions';

describe('fogo no chão (B7)', () => {
  beforeEach(() => clearFires());

  it('a poça nasce com a vida cheia e some sozinha', () => {
    spawnFire(100, 100);
    expect(getFires()).toHaveLength(1);
    expect(getFires()[0].life).toBe(FOGO_VIDA);
    updateFires(FOGO_VIDA + 0.01);
    expect(getFires()).toHaveLength(0);
  });

  it('pisa na poça pelo meio do pé — fogo na borda não é fogo debaixo', () => {
    spawnFire(0, 0, FOGO_RAIO);
    expect(pisaEmFogo(0, 0, 10)).not.toBeNull();
    expect(pisaEmFogo(FOGO_RAIO + 4, 0, 10)).not.toBeNull(); // meio raio alcança
    expect(pisaEmFogo(FOGO_RAIO + 10, 0, 10)).toBeNull(); // fora de vez
  });

  it('o teto de poças troca a mais antiga, não deixa a tela virar só fogo', () => {
    for (let i = 0; i < FOGO_MAX + 5; i++) spawnFire(i * 10, 0);
    expect(getFires()).toHaveLength(FOGO_MAX);
    expect(getFires()[0].x).toBe(5 * 10); // as 5 primeiras saíram
  });

  it('o DPS é o do hazard do mundo: fere os dois lados, 8/s', () => {
    expect(FOGO_DPS).toBe(8);
  });

  it('clearFires zera o mundo entre fases', () => {
    spawnFire(1, 1);
    clearFires();
    expect(getFires()).toHaveLength(0);
  });
});
