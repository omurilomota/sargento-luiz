/**
 * Porta: o TITÃ da onda (T1 — pedido do dono: "flag isElite, mais vida/dano/
 * raio que o tipo comum, visual maior e aparecimento por fase").
 *
 * O contrato: a PRIMEIRA onda não tem titã (o jogador aprende o comum
 * primeiro); de cada onda seguinte sai EXATAMENTE UM, e ele ABRE a onda —
 * pressão visível de longe. O corpo é o tipo da fase ampliado: raio 1,35×
 * (o sprite desenha pelo raio, então o visual maior é de verdade) e vida
 * 3× inteira (o escalão já vem multiplicado por onda — o ×3 do titã é por
 * cima).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { spawnWaveEnemies, resetSpawner, setPhaseDifficulty } from '../systems/spawner';
import { ENEMY_TYPES } from '../config';
import { WAVE_BASE_ENEMIES, WAVE_ENEMIES_PER_LEVEL } from '../core/constants';
import { Enemy } from '../types';

const TIPOS = ['grunt', 'runner'];
const RECT = { w: 1920, h: 1280, px: 0, py: 0, viewW: 1280, viewH: 720 };

/** Roda o spawner até completar a onda atual; devolve o que nasceu nela. */
function jogarOnda(wave: number): Enemy[] {
  const nascidos: Enemy[] = [];
  const mundo: Enemy[] = [];
  // spy no push: o spawner só devolve boolean; os nascidos caem no mundo
  for (let i = 0; i < 200; i++) {
    const antes = mundo.length;
    if (spawnWaveEnemies(1.3, mundo, wave, TIPOS, RECT.w, RECT.h, RECT)) {
      // a onda completou: os inascidos deste tick ainda contam
      if (mundo.length > antes) nascidos.push(...mundo.slice(antes));
      return nascidos;
    }
    if (mundo.length > antes) nascidos.push(...mundo.slice(antes));
  }
  return nascidos;
}

describe('tita (T1): o titã da onda', () => {
  beforeEach(() => {
    resetSpawner();
    setPhaseDifficulty(1);
  });

  it('a PRIMEIRA onda não tem titã — o jogador aprende o comum antes', () => {
    const onda1 = jogarOnda(0);
    expect(onda1.length).toBeGreaterThan(0);
    expect(onda1.every(e => !e.isElite)).toBe(true);
  });

  it('da segunda onda em diante sai EXATAMENTE UM, e ele abre a onda', () => {
    const onda2 = jogarOnda(1);
    const titas = onda2.filter(e => e.isElite);
    expect(titas).toHaveLength(1);
    expect(onda2[0].isElite).toBe(true);
    // o total da onda não mudou: o titã é um dos nascidos, não um extra
    const totalEsperado = WAVE_BASE_ENEMIES + 1 * WAVE_ENEMIES_PER_LEVEL;
    expect(onda2.length).toBe(totalEsperado);
  });

  it('o corpo é o tipo da fase ampliado: raio 1,35× exato e vida 3× inteira', () => {
    const onda2 = jogarOnda(1);
    const tita = onda2.find(e => e.isElite)!;
    expect(tita.radius).toBe(Math.round(ENEMY_TYPES[tita.type].radius * 1.35));
    expect(tita.health).toBe(tita.maxHealth);
    expect(tita.maxHealth % 3).toBe(0);
  });

  it('a onda seguinte recomeça a conta: um titã novo, não dois', () => {
    const onda3 = jogarOnda(2);
    expect(onda3.filter(e => e.isElite)).toHaveLength(1);
  });
});
