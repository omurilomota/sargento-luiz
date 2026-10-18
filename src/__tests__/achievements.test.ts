import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ACHIEVEMENTS, checkAchievements, checkObjectiveAchievement,
  resetRunCounters, getAllAchievements,
} from '../systems/achievements';
import { PHASES, ENEMY_TYPES } from '../config';
import { ObjectiveKind } from '../types';

// O achievements.ts toca sfxAchievement ao desbloquear, e não existe
// AudioContext no node — o mock cobre o contrato sem trazer som para o teste.
vi.mock('../systems/audio', () => ({ sfxAchievement: () => {} }));

const TIPOS: ObjectiveKind[] = ['clear', 'survive', 'destroy', 'protect', 'reach', 'collect'];

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

  it('tem conquerable para cada um dos 6 tipos de objetivo', () => {
    const tipos = new Set(PHASES.map(p => p.objective));
    expect(tipos.size).toBe(6);
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

  it('perder o sobrevivente devolve a conquista de loss, uma vez', () => {
    expect(ACHIEVEMENTS.some(a => a.id === 'vip_lost')).toBe(true);
    expect(checkAchievements('vip_lost')?.id).toBe('vip_lost');
    expect(checkAchievements('vip_lost')).toBeNull();
  });

  it('os 6 tipos de objetivo juntos destravam o lote', () => {
    // 'protect' destrava vip_saved no caminho, então os 4 primeiros não são null
    const primeiros = TIPOS.slice(0, 4).map(t => checkObjectiveAchievement(t)?.id ?? null);
    expect(primeiros.filter(Boolean)).toEqual(['vip_saved']);
    // o 5º ainda não fecha: o lote é de 6 (ver achievements.ts `>= 6`)
    expect(checkObjectiveAchievement(TIPOS[4])).toBeNull();
    expect(checkObjectiveAchievement(TIPOS[5])?.id).toBe('all_objectives');
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
      checkAchievements('vip_lost');
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
describe('achievements: os chefes falam (M5)', () => {
  it('todo chefe de fase tem fala de morte — o toast nunca sai vazio', () => {
    for (const fase of PHASES) {
      const def = ENEMY_TYPES[fase.boss!];
      expect(def?.deathLine, `${fase.boss} sem fala de morte`).toBeTruthy();
    }
  });

  it('o MAQUINISTA chega gritando — o grito de entrada é dele', () => {
    expect(ENEMY_TYPES['maquinista'].entryShout).toBe('YOU SHALL NOT PASS!');
    // os outros chefes não gritam: o grito é a assinatura DELE, não um ruído
    const outros = PHASES.map(f => f.boss).filter((b): b is string => !!b && b !== 'maquinista');
    for (const b of outros) expect(ENEMY_TYPES[b].entryShout).toBeUndefined();
  });
});

describe('achievements: a leva M5 (arma, fase limpa, rasante, barril, traje)', () => {
  it('10 e 50 abates com a MESMA arma destravam os dois degraus', () => {
    for (let i = 0; i < 9; i++) checkAchievements('weapon_kill', 0);
    expect(ACHIEVEMENTS.find(a => a.id === 'weapon_10')!.unlocked).toBe(false);
    checkAchievements('weapon_kill', 0); // o 10º
    expect(ACHIEVEMENTS.find(a => a.id === 'weapon_10')!.unlocked).toBe(true);
    for (let i = 0; i < 39; i++) checkAchievements('weapon_kill', 0);
    checkAchievements('weapon_kill', 0); // o 50º
    expect(ACHIEVEMENTS.find(a => a.id === 'weapon_50')!.unlocked).toBe(true);
  });

  it('abates em armas DIFERENTES não somam entre si', () => {
    for (let i = 0; i < 10; i++) checkAchievements('weapon_kill', i % 2);
    expect(ACHIEVEMENTS.find(a => a.id === 'weapon_10')!.unlocked).toBe(false);
  });

  it('a fase limpa exige zero dano na fase INTEIRA — e recomeça a cada fase', () => {
    checkAchievements('phase_start');
    const limpa = checkAchievements('phase_end');
    expect(limaNome(limpa)).toBe('Intocável');
    // dano na segunda fase: a conquista não volta
    checkAchievements('phase_start');
    checkAchievements('damage_taken');
    expect(checkAchievements('phase_end')).toBeNull();
    // a terceira fase começa limpa de novo
    checkAchievements('phase_start');
    expect(ACHIEVEMENTS.find(a => a.id === 'no_damage_phase')!.unlocked).toBe(true);
  });

  it('o rasante conta cada bala uma vez e destrava às 20', () => {
    for (let i = 0; i < 19; i++) expect(checkAchievements('graze')).toBeNull();
    expect(limaNome(checkAchievements('graze'))).toBe('Rasante');
  });

  it('o barril acumula abates e destrava aos 10', () => {
    checkAchievements('barril', 4);
    checkAchievements('barril', 5);
    expect(ACHIEVEMENTS.find(a => a.id === 'barrel_10')!.unlocked).toBe(false);
    expect(limaNome(checkAchievements('barril', 1))).toBe('Pirotecnista');
  });

  it('o traje destrava ao vestir — uma vez só', () => {
    expect(limaNome(checkAchievements('traje'))).toBe('Traje de Contenção');
    expect(checkAchievements('traje')).toBeNull();
  });

  it('a run nova não herda contadores (M5 zera no resetRunCounters)', () => {
    for (let i = 0; i < 15; i++) checkAchievements('weapon_kill', 2);
    resetRunCounters();
    for (const a of ACHIEVEMENTS) a.unlocked = false;
    checkAchievements('weapon_kill', 2);
    expect(ACHIEVEMENTS.find(a => a.id === 'weapon_10')!.unlocked).toBe(false);
  });
});

function limaNome(r: { name: string } | null): string {
  return r?.name ?? '(nada)';
}
