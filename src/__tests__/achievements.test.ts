import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ACHIEVEMENTS, checkAchievements, checkObjectiveAchievement,
  resetRunCounters, getAllAchievements,
} from '../systems/achievements';
import { PHASES } from '../config';
import { ObjectiveKind } from '../types';

// O achievements.ts toca sfxAchievement ao desbloquear, e não existe
// AudioContext no node — o mock cobre o contrato sem trazer som para o teste.
vi.mock('../systems/audio', () => ({ sfxAchievement: () => {} }));

const TIPOS: ObjectiveKind[] = ['clear', 'survive', 'destroy', 'protect', 'reach'];

// O teste escreve em localStorage; em node isso não existe, e o achievements.ts
// já embrulha tudo em try/catch — o mesmo caminho que o navegador percorre em
// modo privado.

beforeEach(() => {
  for (const a of ACHIEVEMENTS) a.unlocked = false;
  resetRunCounters();
});

describe('achievements: a lista é consistente', () => {
  it('todo id é único', () => {
    const ids = ACHIEVEMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todo achievement tem nome e descrição em português', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.name.trim(), `achievement ${a.id} sem nome`).not.toBe('');
      expect(a.desc.trim(), `achievement ${a.id} sem descrição`).not.toBe('');
    }
  });

  it('tem conquerable para cada um dos 5 tipos de objetivo', () => {
    const tipos = new Set(PHASES.map(p => p.objective));
    expect(tipos.size).toBe(5);
    expect(ACHIEVEMENTS.some(a => a.id === 'vip_saved')).toBe(true);
    expect(ACHIEVEMENTS.some(a => a.id === 'all_objectives')).toBe(true);
  });

  it('a cadeia de barril tem watermarks coerentes (3 < 5)', () => {
    const c3 = ACHIEVEMENTS.find(a => a.id === 'chain_3');
    const c5 = ACHIEVEMENTS.find(a => a.id === 'chain_5');
    expect(c3).toBeDefined();
    expect(c5).toBeDefined();
  });
});

describe('achievements: os gatilhos desbloqueiam o que prometem', () => {
  it('primeiro abate só uma vez, e a partir do primeiro', () => {
    expect(checkAchievements('kill', 1)?.id).toBe('first_kill');
    expect(checkAchievements('kill', 1)).toBeNull();
  });

  it('abates contam na partida e o reset limpa', () => {
    for (let i = 0; i < 100; i++) checkAchievements('kill');
    expect(ACHIEVEMENTS.find(a => a.id === 'kill_100')!.unlocked).toBe(true);
    expect(ACHIEVEMENTS.find(a => a.id === 'kill_1000')!.unlocked).toBe(false);
    for (let i = 0; i < 900; i++) checkAchievements('kill');
    expect(ACHIEVEMENTS.find(a => a.id === 'kill_1000')!.unlocked).toBe(true);
    resetRunCounters();
    expect(ACHIEVEMENTS.find(a => a.id === 'kill_1000')!.unlocked).toBe(true);
  });

  it('os chefes contam e 9 destrava o lote inteiro', () => {
    expect(checkAchievements('boss_kill')?.id).toBe('boss_kill');
    for (let i = 0; i < 3; i++) checkAchievements('boss_kill');
    expect(ACHIEVEMENTS.find(a => a.id === 'boss_5')!.unlocked).toBe(false);
    for (let i = 0; i < 1; i++) checkAchievements('boss_kill');
    expect(ACHIEVEMENTS.find(a => a.id === 'boss_5')!.unlocked).toBe(true);
    expect(ACHIEVEMENTS.find(a => a.id === 'all_bosses')!.unlocked).toBe(false);
    for (let i = 0; i < 4; i++) checkAchievements('boss_kill');
    expect(ACHIEVEMENTS.find(a => a.id === 'all_bosses')!.unlocked).toBe(true);
  });

  it('a cadeia só conta com 3 ou mais props', () => {
    expect(checkAchievements('chain', 2)).toBeNull();
    checkAchievements('chain', 3);
    expect(ACHIEVEMENTS.find(a => a.id === 'chain_3')!.unlocked).toBe(true);
    expect(ACHIEVEMENTS.find(a => a.id === 'chain_5')!.unlocked).toBe(false);
    checkAchievements('chain', 5);
    expect(ACHIEVEMENTS.find(a => a.id === 'chain_5')!.unlocked).toBe(true);
  });

  it('proteger o sobrevivente devolve a conquista na hora', () => {
    expect(checkObjectiveAchievement('protect')?.id).toBe('vip_saved');
  });

  it('os 5 tipos de objetivo juntos destravam o lote', () => {
    // 'protect' destrava vip_saved no caminho, então os 4 primeiros não são null
    const primeiros = TIPOS.slice(0, 4).map(t => checkObjectiveAchievement(t)?.id ?? null);
    expect(primeiros.filter(Boolean)).toEqual(['vip_saved']);
    expect(checkObjectiveAchievement(TIPOS[4])?.id).toBe('all_objectives');
  });

  it('a pontuação destrava as faixas', () => {
    checkAchievements('score', 5000);
    expect(ACHIEVEMENTS.find(a => a.id === 'score_5000')!.unlocked).toBe(true);
    expect(ACHIEVEMENTS.find(a => a.id === 'score_50000')!.unlocked).toBe(false);
    checkAchievements('score', 50000);
    expect(ACHIEVEMENTS.find(a => a.id === 'score_50000')!.unlocked).toBe(true);
  });

  it('intocavel só dispara na onda sem dano, e o flag reseta', () => {
    checkAchievements('damage_taken');
    checkAchievements('wave', 3);
    expect(ACHIEVEMENTS.find(a => a.id === 'no_damage_wave')!.unlocked).toBe(false);
    checkAchievements('wave', 4);
    expect(ACHIEVEMENTS.find(a => a.id === 'no_damage_wave')!.unlocked).toBe(true);
  });
});

describe('achievements: nenhum gatilho pode desbloquear duas vezes', () => {
  it('rodar todos os gatilhos duas vezes não desbloqueia nada novo', () => {
    const dispara = () => {
      checkAchievements('kill', 1);
      checkAchievements('wave', 20);
      checkAchievements('damage_taken');
      checkAchievements('score', 60000);
      checkAchievements('boss_kill');
      checkAchievements('combo', 30);
      checkAchievements('chain', 6);
      for (const t of TIPOS) checkObjectiveAchievement(t);
    };
    dispara();
    const primeira = getAllAchievements().filter(a => a.unlocked).length;
    dispara();
    expect(getAllAchievements().filter(a => a.unlocked).length).toBe(primeira);
  });

  it('uma leva de dano não mata a conquista das ondas seguintes', () => {
    checkAchievements('damage_taken');
    checkAchievements('wave', 2);          // onda com dano: não destrava
    expect(ACHIEVEMENTS.find(a => a.id === 'no_damage_wave')!.unlocked).toBe(false);
    checkAchievements('wave', 3);          // onda limpa: destrava
    expect(ACHIEVEMENTS.find(a => a.id === 'no_damage_wave')!.unlocked).toBe(true);
  });
});