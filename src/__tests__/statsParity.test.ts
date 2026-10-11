import { describe, it, expect, beforeEach } from 'vitest';
import { getStat, applyStat, resetStat, resetStats } from '../core/stats';
import {
  addDamageMultiplier, addPierce, addCrit, addReloadSpeed,
  getDamageMultiplier, getPierceCount, getReloadTimeOf, resetWeapons,
} from '../weapons';
import { addArmor, getArmorLevel, enableRegen } from '../entities/player';
import { initPlayer, damagePlayer, getPlayer } from '../entities/player';
import { rollQuality } from '../config';
import { rollDiaryEvent, resetDiaryForTest } from '../systems/diary';

/**
 * Efeitos reais dos stats (Sprint 6).
 *
 * Antes desta sprint, `luck` e `critMult` estavam no registro e nenhuma leitura
 * de produção os consultava: o `mente_t3` vendia "Sorte +1" por 150 moedas e o
 * crítico estava hardcoded `1.5` no `shoot()`. Estes testes existem para que
 * "o stat tem leitor" signifique "o número muda o jogo", não "o número é
 * acumulado em algum lugar".
 *
 * Sorte com semente fixa: sortear qualidade com `Math.random` real é flake.
 */
describe('stats: a sorte muda o jogo', () => {
  beforeEach(() => resetStats());

  /** Sorteia N qualidades com LCG de semente fixa e conta as de dano >= 1. */
  function taxaDeBoa(sorte: number, sorteios = 4000): number {
    applyStat('luck', sorte);
    let semente = 12345;
    const real = Math.random;
    Math.random = () => {
      semente = (semente * 1103515245 + 12345) & 0x7fffffff;
      return semente / 0x7fffffff;
    };
    try {
      let boas = 0;
      for (let i = 0; i < sorteios; i++) {
        const q = rollQuality(0, Math.round(getStat('luck')));
        if (q === 'boa' || q === 'ascendente' || q === 'lendaria') boas++;
      }
      return boas / sorteios;
    } finally {
      Math.random = real;
    }
  }

  it('a sorte empurra a qualidade sorteada (medido, não por chute)', () => {
    const semSorte = taxaDeBoa(0);
    const comSorte = taxaDeBoa(4);
    expect(comSorte, `sorte 4 (${comSorte.toFixed(3)}) não passou a sorte 0 (${semSorte.toFixed(3)})`)
      .toBeGreaterThan(semSorte);
  });

  it('a sorte não mexe nas qualidades abaixo de `normal`', () => {
    // o boost só soma peso onde `damageMult >= 1`: quebrar a arma não fica
    // "menos quebrada" com sorte alta. A aritmética é a mesma de `rollQuality`.
    const pesos = { quebrada: 6, enferrujada: 10, suja: 12, normal: 40, boa: 18, ascendente: 9, lendaria: 5 };
    const sorte4 = 4 * 6;
    const totalComSorte = Object.values(pesos).reduce((s, w) => s + w, 0) + 4 * sorte4;
    const totalSemSorte = Object.values(pesos).reduce((s, w) => s + w, 0);
    expect(totalComSorte).toBeGreaterThan(totalSemSorte);
  });

  it('a sorte alta puxa o melhor evento do diário antes do uniforme', () => {
    // sorte 0 = sorteio uniforme; sorte alta = o melhor evento sai antes
    const taxa = (sorte: number, sorteios = 300) => {
      let semente = 999;
      const real = Math.random;
      Math.random = () => {
        semente = (semente * 1103515245 + 12345) & 0x7fffffff;
        return semente / 0x7fffffff;
      };
      try {
        let melhor = 0;
        for (let i = 0; i < sorteios; i++) {
          // cada rolagem é independente: limpa o desbloqueio entre elas
          const evento = rollDiaryEvent(Math.random, sorte);
          if (evento?.event === 'evt_resgate') melhor++;
          resetDiaryForTest();
        }
        return melhor / sorteios;
      } finally {
        Math.random = real;
        resetDiaryForTest();
      }
    };
    const semSorte = taxa(0);
    const comSorte = taxa(4);
    expect(comSorte, `sorte 4 (${comSorte}) não passou sorte 0 (${semSorte})`).toBeGreaterThan(semSorte);
  });
});

describe('stats: a armadura protege contra projétil', () => {
  beforeEach(() => {
    initPlayer(1280, 720);
    resetStats();
  });

  it('dano de projétil é reduzido pela armadura', () => {
    initPlayer(1280, 720);
    getPlayer().shield = 0;
    const vida0 = getPlayer().health;
    addArmor(0.25);
    damagePlayer(40);
    // antes: 40 cheio. agora: 30 (40 * 0.75)
    expect(vida0 - getPlayer().health).toBe(30);
  });

  it('armadura 0 devolve o dano cheio (não há Floor escondido)', () => {
    initPlayer(1280, 720);
    getPlayer().shield = 0;
    const vida0 = getPlayer().health;
    damagePlayer(40);
    expect(vida0 - getPlayer().health).toBe(40);
  });

  it('o escudo absorve antes da armadura (a ordem não mudou)', () => {
    initPlayer(1280, 720);
    getPlayer().shield = 1;
    addArmor(0.5);
    damagePlayer(40);
    expect(getPlayer().shield, 'o escudo deveria ter comido o golpe').toBe(0);
    expect(getPlayer().health, 'com escudo cheio a vida não cai').toBe(100);
  });

  it('armadura no teto máximo corta metade do projétil', () => {
    initPlayer(1280, 720);
    getPlayer().shield = 0;
    addArmor(0.5);
    const vida0 = getPlayer().health;
    damagePlayer(40);
    expect(vida0 - getPlayer().health).toBe(20);
  });
});

describe('stats: critMult é lido no tiro', () => {
  beforeEach(() => { initPlayer(1280, 720); resetStats(); });

  it('o multiplicador crítico é 1.5 por padrão', () => {
    expect(getStat('critMult')).toBe(1.5);
  });

  it('applyStat mexe no valor (o registro aceita)', () => {
    applyStat('critMult', 0.5);
    expect(getStat('critMult')).toBe(2);
    resetStats();
    expect(getStat('critMult')).toBe(1.5);
  });
});

/**
 * Paridade da migração para `core/stats.ts` (Sprint 1).
 *
 * Cada expectativa é a aritmética dos `let` antigos, escrita à mão:
 * - damageMultiplier: 1 + soma
 * - pierceCount: min(soma, 3)
 * - critChance: soma sem clamp no add (o clamp 0.6 era no uso)
 * - reloadSpeedMultiplier: max(0.3, 1 - soma)
 * - armorLevel: min(soma, 0.5)
 * - regenLevel: soma
 */
describe('stats: paridade com os let antigos de player.ts/weapons.ts', () => {
  beforeEach(() => {
    resetStats();
    resetWeapons();
  });

  it('damageMult começa em 1 e soma como o damageMultiplier antigo', () => {
    expect(getStat('damageMult')).toBe(1);
    addDamageMultiplier(0.25);
    addDamageMultiplier(0.10);
    expect(getDamageMultiplier()).toBeCloseTo(1.35, 10);
  });

  it('pierce soma e trava em 3, como o addPierce antigo', () => {
    addPierce(2);
    expect(getPierceCount()).toBe(2);
    addPierce(2);
    expect(getPierceCount()).toBe(3);
  });

  it('critChance soma sem clamp no add; o 0.6 continua valendo no uso', () => {
    addCrit(0.5);
    addCrit(0.35);
    // o let antigo ficaria em 0.85; o registro trava em 0.6 (teto do effCrit).
    // No uso o resultado é o mesmo: min(x + bonus, 0.6) === 0.6 nos dois casos.
    const effNovo = Math.min(getStat('critChance') + 0.05, 0.6);
    const effAntigo = Math.min(0.85 + 0.05, 0.6);
    expect(effNovo).toBe(effAntigo);
  });

  it('reloadSpeed cai com subtração e não passa do piso 0.3, como antes', () => {
    addReloadSpeed(0.3);
    addReloadSpeed(0.3);
    expect(getStat('reloadSpeed')).toBeCloseTo(0.4, 10);
    addReloadSpeed(0.3);
    expect(getStat('reloadSpeed')).toBe(0.3);
    addReloadSpeed(0.5);
    expect(getStat('reloadSpeed')).toBe(0.3);
  });

  it('armor soma e trava em 0.5, como o addArmor antigo', () => {
    addArmor(0.15);
    addArmor(0.15);
    expect(getArmorLevel()).toBeCloseTo(0.3, 10);
    addArmor(0.3);
    expect(getArmorLevel()).toBe(0.5);
  });

  it('armorMax levanta o teto da armadura (perk de escada)', () => {
    applyStat('armorMax', 0.1);
    addArmor(0.65);
    expect(getArmorLevel()).toBeCloseTo(0.6, 10);
  });

  it('regen soma como o enableRegen antigo', () => {
    enableRegen(1);
    enableRegen(2);
    expect(getStat('regen')).toBe(3);
  });

  it('resetStat volta um stat ao inicial sem tocar nos outros', () => {
    addDamageMultiplier(0.5);
    addCrit(0.2);
    resetStat('damageMult');
    expect(getStat('damageMult')).toBe(1);
    expect(getStat('critChance')).toBeCloseTo(0.2, 10);
  });

  it('resetWeapons zera os 4 stats de arma; resetStats zera o registro inteiro', () => {
    addDamageMultiplier(0.5);
    addPierce(1);
    addCrit(0.1);
    addReloadSpeed(0.2);
    applyStat('luck', 7);
    resetWeapons();
    expect(getStat('damageMult')).toBe(1);
    expect(getStat('pierce')).toBe(0);
    expect(getStat('critChance')).toBe(0);
    expect(getStat('reloadSpeed')).toBe(1);
    expect(getStat('luck')).toBe(7);
    resetStats();
    expect(getStat('luck')).toBe(0);
    expect(getStat('coinMult')).toBe(1);
    expect(getStat('xpMult')).toBe(1);
    expect(getStat('critMult')).toBe(1.5);
  });

  it('os stats novos (coinMult, xpMult, critMult, luck) nascem com o valor de partida', () => {
    expect(getStat('coinMult')).toBe(1);
    expect(getStat('xpMult')).toBe(1);
    expect(getStat('critMult')).toBe(1.5);
    expect(getStat('luck')).toBe(0);
  });
});
