import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  rollLootDrop, spawnBossLoot, updateLoot, getLoot, clearLoot, powerupLabel,
} from '../systems/loot';
import { WEAPONS, POWERUP_TYPES } from '../config';
import { initPlayer, getMedkits, addMedkits } from '../entities/player';

vi.mock('../systems/particles', () => ({ spawnParticles: () => {} }));
vi.mock('../systems/audio', () => {
  const noop = () => {};
  return { initAudio: noop, sfxCoin: noop, sfxBuy: noop, sfxError: noop };
});

/**
 * `loot.ts` é o módulo novo do working tree e entrou sem nenhum teste. Ele é a
 * ponte entre "inimigo morre" e "o jogador fica mais forte", então um erro aqui
 * é silencioso: a caixa simplesmente não aparece, ou o medkit some.
 */
// O drop é aleatório (5% no comum, 15% no elite), então um teste que faz
// `rollLootDrop` uma vez e espera uma caixa falha 95% das vezes. Este helper
// fixa o Math.random durante a chamada — o módulo lê o global no momento do
// roll, então basta repor o spy em volta da chamada.
function dropForSure(type: string, x = 0, y = 0): void {
  const spy = vi.spyOn(Math, 'random').mockReturnValue(0.01);
  try {
    rollLootDrop(x, y, type);
  } finally {
    spy.mockRestore();
  }
}

describe('rollLootDrop: quem dropa e com que frequência', () => {
  beforeEach(() => clearLoot());
  afterEach(() => clearLoot());

  it('inimigo comum dropa bem menos que elite', () => {
    const taxa = (type: string) => {
      clearLoot();
      for (let i = 0; i < 4000; i++) rollLootDrop(0, 0, type);
      return getLoot().length / 4000;
    };
    const comum = taxa('grunt');
    const elite = taxa('tank');
    expect(comum).toBeGreaterThan(0);
    expect(elite).toBeGreaterThan(comum);
  });

  it('tipo desconhecido não vira elite (não pode explodir a taxa de drop)', () => {
    clearLoot();
    for (let i = 0; i < 3000; i++) rollLootDrop(0, 0, 'nao_existe');
    const taxa = getLoot().length / 3000;
    expect(taxa).toBeLessThanOrEqual(0.06);
  });

  it('toda caixa dropada tem um tier válido e vida positiva', () => {
    const tiers = new Set(['sucata', 'usavel', 'militar', 'prototipo']);
    for (let i = 0; i < 500; i++) rollLootDrop(0, 0, 'tank');
    for (const b of getLoot()) {
      expect(tiers.has(b.tier), `tier inválido: ${b.tier}`).toBe(true);
      expect(b.life).toBeGreaterThan(0);
      expect(b.especial).toBe(false);
    }
  });
});

describe('updateLoot: coleta por proximidade e expiração', () => {
  beforeEach(() => {
    clearLoot();
    initPlayer(1280, 720);
  });
  afterEach(() => clearLoot());

  it('não coleta quando o jogador está longe', () => {
    dropForSure('tank', 0, 0);
    expect(updateLoot(0.016, 5000, 5000, 10)).toBeNull();
    expect(getLoot().length).toBe(1);
  });

  it('coleta quando o jogador está em cima e remove a caixa', () => {
    for (let i = 0; i < 100; i++) {
      clearLoot();
      rollLootDrop(100, 100, 'tank');
      if (getLoot().length !== 1) continue;
      const r = updateLoot(0.016, 100, 100, 10);
      if (r !== null) {
        expect(getLoot().length).toBe(0);
        return;
      }
    }
    throw new Error('nenhuma coleta em 100 tentativas: o drop está inacessível');
  });

  it('a caixa expira quando o tempo passa', () => {
    dropForSure('tank', 0, 0);
    expect(getLoot().length).toBe(1);
    updateLoot(999, 9999, 9999, 10);
    expect(getLoot().length).toBe(0);
  });

  it('clearLoot esvazia tudo', () => {
    for (let i = 0; i < 20; i++) rollLootDrop(0, 0, 'tank');
    expect(getLoot().length).toBeGreaterThan(0);
    clearLoot();
    expect(getLoot().length).toBe(0);
  });
});

describe('a recompensa de uma caixa é sempre válida', () => {
  beforeEach(() => {
    clearLoot();
    initPlayer(1280, 720);
  });
  afterEach(() => clearLoot());

  it('nunca devolve kind desconhecido nem arma fora do config', () => {
    const kinds = new Set(['powerup', 'weapon', 'medkit']);
    let coletou = 0;
    for (let i = 0; i < 3000; i++) {
      clearLoot();
      rollLootDrop(0, 0, 'tank');
      if (getLoot().length !== 1) continue;
      const r = updateLoot(0.016, 0, 0, 10);
      if (!r) continue;
      coletou++;
      expect(kinds.has(r.kind), `kind inválido: ${r.kind}`).toBe(true);
      if (r.kind === 'weapon') {
        expect(WEAPONS[r.index], `arma inexistente: ${r.index}`).toBeDefined();
        expect(typeof r.quality).toBe('string');
      }
      if (r.kind === 'powerup') {
        expect(POWERUP_TYPES[r.type], `power-up inexistente: ${r.type}`).toBeDefined();
      }
    }
    expect(coletou).toBeGreaterThan(100);
  });

  it('o medkit é raro: aparece, mas não em toda caixa', () => {
    let medkits = 0;
    let total = 0;
    for (let i = 0; i < 4000; i++) {
      clearLoot();
      rollLootDrop(0, 0, 'tank');
      if (getLoot().length !== 1) continue;
      const r = updateLoot(0.016, 0, 0, 10);
      if (!r) continue;
      total++;
      if (r.kind === 'medkit') medkits++;
    }
    expect(total).toBeGreaterThan(0);
    expect(medkits).toBeGreaterThan(0);
    // ~8% das caixas, no máximo 15% com folga de amostra
    expect(medkits / total).toBeLessThan(0.15);
  });
});

describe('a caixa do boss', () => {
  it('sempre é uma arma válida com qualidade, resolvida na hora', () => {
    const b = spawnBossLoot(50, 60);
    expect(b.kind).toBe('weapon');
    expect(WEAPONS[b.index].name).toBeTruthy();
    expect(b.quality).toBeTruthy();
    expect(b.x).toBe(50);
    expect(b.y).toBe(60);
  });

});

describe('powerupLabel', () => {
  it('devolve um rótulo legível para todo power-up do config', () => {
    for (const key of Object.keys(POWERUP_TYPES)) {
      const label = powerupLabel(key);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('não devolve undefined para chave desconhecida', () => {
    expect(typeof powerupLabel('inexistente')).toBe('string');
  });
});
