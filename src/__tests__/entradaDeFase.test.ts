/**
 * A entrada de fase começa na onda 1 — o "onda 2 na entrada" do relato de
 * 2026-10-14.
 *
 * O estado de onda do spawner (cota parcial, relógio, titã da onda) era
 * herdado da fase anterior: a fase terminava no meio de uma onda com a cota
 * pela metade, e o primeiro frame da fase nova lia "cota cheia + campo
 * vazio" como onda completa. `resetSpawner()` entrou no
 * `loadPhaseEnvironment` — e o primeiro lugar onde ele foi posto (no fim,
 * depois do `setPhaseDifficulty`) apagava a dificuldade da fase recém
 * carregada. Estes dois testes travam as duas metades do contrato.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { spawnWaveEnemies, spawnEnemy, resetSpawner, setPhaseDifficulty, setPhaseTime } from '../systems/spawner';
import { resetBehavior } from '../systems/dynamicDifficulty';
import { Enemy } from '../types';

const SEM_INIMIGOS: Enemy[] = [];

describe('entrada de fase: a onda 1 começa do zero', () => {
  beforeEach(() => { resetBehavior(); resetSpawner(); setPhaseDifficulty(1); setPhaseTime(0); });

  /**
   * Roda a onda `wave` até `alvo` inimigos nascerem, sem completar a cota —
   * o estado exato de uma fase que termina no meio da onda (o chefe caiu,
   * foi para a loja, a cota parcial ficou no spawner).
   */
  function encherCotaParcial(wave: number, alvo: number): Enemy[] {
    const enemies: Enemy[] = [];
    for (let i = 0; i < 20000 && enemies.length < alvo; i++) {
      spawnWaveEnemies(1 / 240, enemies, wave, ['grunt'], 1920, 1280);
    }
    expect(enemies.length, `a onda ${wave} não chegou a ${alvo} nascidos`).toBe(alvo);
    return enemies;
  }

  it('sem o reset, a cota herdada avança a onda 1 no primeiro frame — o bug', () => {
    // fase anterior: onda 5 (cota 14) terminou com 7 nascidos
    encherCotaParcial(5, 7);
    // leaveShop zera o campo
    SEM_INIMIGOS.length = 0;
    // SEM resetSpawner: 7 >= cota da onda 1 (4) com campo vazio → "completa"
    expect(spawnWaveEnemies(1 / 240, SEM_INIMIGOS, 0, ['grunt'], 1920, 1280)).toBe(true);
  });

  it('com o reset do loadPhaseEnvironment, a onda 1 nasce de verdade', () => {
    encherCotaParcial(5, 7);
    SEM_INIMIGOS.length = 0;
    resetSpawner();
    // o primeiro tick da fase nova NÃO pode reportar onda completa
    expect(spawnWaveEnemies(1 / 240, SEM_INIMIGOS, 0, ['grunt'], 1920, 1280)).toBe(false);
    // e a onda tem que conseguir nascer
    let nasceu = 0;
    for (let i = 0; i < 4000 && nasceu === 0; i++) {
      if (spawnWaveEnemies(1 / 240, SEM_INIMIGOS, 0, ['grunt'], 1920, 1280)) break;
      nasceu = SEM_INIMIGOS.length;
    }
    expect(nasceu).toBeGreaterThan(0);
  });

  it('o titã não vaza da fase anterior: a onda 1 nova não nasce sem titã', () => {
    // fase anterior: onda 2+ já soltou o titã dela (eliteSaiuNestaOnda true)
    encherCotaParcial(1, 4);
    SEM_INIMIGOS.length = 0;
    resetSpawner();
    // a onda 2 da fase nova precisa soltar o próprio titã
    const enemies: Enemy[] = [];
    for (let i = 0; i < 30000; i++) {
      const completa = spawnWaveEnemies(1 / 240, enemies, 1, ['grunt'], 1920, 1280);
      if (enemies.some(e => e.isElite)) break;
      if (completa) break;
    }
    expect(enemies.some(e => e.isElite)).toBe(true);
  });

  it('resetSpawner não apaga a dificuldade da fase (a Cidade voltava ao 1.0)', () => {
    // loadPhaseEnvironment define a dificuldade da fase; o reset de onda
    // vinha DEPOIS e a pisava de volta ao 1. O contrato agora: quem define
    // a fase é o setPhaseDifficulty, e o reset não o contraria.
    setPhaseDifficulty(0.7);
    resetSpawner();
    const realRandom = Math.random;
    Math.random = () => 0.5; // variance = 0.9 + 0.2×0.5 = 1.0
    try {
      const e = spawnEnemy('grunt', 1920, 1280, 0);
      // grunt 20 de vida × 0.7 de dificuldade = 14; com o clobber era 20
      expect(e?.health).toBe(14);
    } finally {
      Math.random = realRandom;
    }
  });
});
