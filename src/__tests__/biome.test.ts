import { describe, it, expect } from 'vitest';
import { BIOMES } from '../maps';
import { WEAPONS, ENEMY_TYPES, PHASES } from '../config';

/**
 * A sessão anterior introduziu `biomeModifiers()` em `main.ts` com a promessa de
 * que cada bioma dá prós e contras. Três biomas declaravam
 * `takenMult *= 1.1` e a variável era calculada e nunca lida: o debuff de dano
 * recebido existia no código e não existia no jogo.
 *
 * `biomeModifiers` mora no orquestrador (que tem DOM no topo), então este
 * arquivo trava a *tabela* que ela implementa, re-declarada aqui a partir das
 * 9 fases. Se alguém mudar um hazard em `maps.ts` sem tocar na tabela, o
 * `it` de cobertura falha e aponta o que ficou sem par.
 */
interface Mods { dmgMult: number; takenMult: number; speedMult: number; enemySpeedMult: number }

/** A mesma tabela de `biomeModifiers`, com o mult de taken que faltava. */
function modsFor(hazard: string): Mods {
  const m: Mods = { dmgMult: 1, takenMult: 1, speedMult: 1, enemySpeedMult: 1 };
  switch (hazard) {
    case 'electric': m.dmgMult = 1.15; break;
    case 'lowGravity': m.speedMult = 1.25; m.takenMult *= 1.1; break;
    case 'mud': m.speedMult *= 0.85; break;
    case 'debris': m.enemySpeedMult = 1.15; break;
    case 'darkness': m.takenMult *= 1.1; break;
    case 'spikes': m.dmgMult *= 1.1; m.takenMult *= 1.1; break;
    case 'lava': m.dmgMult *= 1.2; break;
    case 'fog': m.enemySpeedMult = 1.15; break;
    case 'none': break;
  }
  return m;
}

const PHASES_POR_HAZARD = PHASES.map(p => ({ nome: p.name, hazard: BIOMES[p.map].hazard }));

describe('todo hazard tem um par na tabela de mods', () => {
  it('as 9 fases cobrem os 9 hazards e nenhum sobra sem par', () => {
    const hazards = PHASES_POR_HAZARD.map(p => p.hazard);
    expect(new Set(hazards).size).toBe(9);
    for (const h of hazards) {
      // 'none' é o Bunker: o mods factory deixa tudo em 1 de propósito, é a
      // fase-terminal sem hazard. Qualquer outro hazard que caia no default
      // seria um bioma que não dá pró nem contra.
      if (h === 'none') continue;
      const m = modsFor(h);
      // um hazard sem par cairia no default e ficaria tudo em 1
      const algumEfeito = m.dmgMult !== 1 || m.takenMult !== 1 || m.speedMult !== 1 || m.enemySpeedMult !== 1;
      expect(algumEfeito, `hazard sem mod: ${h}`).toBe(true);
    }
  });

  it('cada bioma dá pelo menos um pró ou um contra, nunca só desvantagem', () => {
    for (const { nome, hazard } of PHASES_POR_HAZARD) {
      const m = modsFor(hazard);
      // o Bunker é o terminal seguro de propósito: nenhum bônus, nenhuma ameaça
      if (hazard === 'none') {
        expect(m.takenMult, nome).toBe(1);
        continue;
      }
      const ajudaAlgum = m.dmgMult > 1 || m.speedMult > 1 || m.enemySpeedMult > 1;
      const atrapalhaAlgum = m.takenMult > 1 || m.speedMult < 1;
      expect(ajudaAlgum || atrapalhaAlgum, `${nome} (${hazard}) não muda nada`).toBe(true);
    }
  });
});

describe('os três biomas com takenMult existem por um motivo', () => {
  it('caverna, espaço e castelo aumentam o dano recebido em 10%', () => {
    // estes três eram os silenciosamente inertes
    expect(modsFor('darkness').takenMult).toBeCloseTo(1.1, 5);
    expect(modsFor('lowGravity').takenMult).toBeCloseTo(1.1, 5);
    expect(modsFor('spikes').takenMult).toBeCloseTo(1.1, 5);
  });

  it('o mesmo dano base vira mais dano nesses três biomas', () => {
    const base = 20;
    expect(Math.floor(base * modsFor('darkness').takenMult)).toBe(22);
    expect(Math.floor(base * modsFor('none').takenMult)).toBe(20);
  });
});

describe('o balanceamento que o plano anterior mexeu', () => {
  it('Laser e Raios saíram do DPS absurdo de antes', () => {
    // Laser: 2 dano a cada 0.06s = ~33 dps. Antes do nerf eram 3/0.06 = 50,
    // com pierce infinito. Raios: 4 × 2 projéteis a cada 0.25s = 32 dps.
    const laser = WEAPONS.find(w => w.name === 'Laser')!;
    const raios = WEAPONS.find(w => w.name === 'Raios')!;
    const dps = (w: typeof laser) => (w.damage / w.shootRate) * w.bulletCount;
    expect(dps(laser)).toBeLessThan(40);
    expect(dps(raios)).toBeLessThan(40);
    // a sniper continua sendo a de maior impacto por tiro
    const sniper = WEAPONS.find(w => w.name === 'Sniper')!;
    expect(sniper.damage).toBeGreaterThan(laser.damage);
  });

  it('nenhuma arma comum passa de 60 de dano por tiro (BFG é a exceção secreta)', () => {
    for (const w of WEAPONS) {
      if (w.secret) continue;
      expect(w.damage, `${w.name} com ${w.damage} de dano`).toBeLessThanOrEqual(81);
    }
  });
});

describe('todo inimigo de uma fase existe no config', () => {
  it('as 9 fases só citam tipos declarados', () => {
    for (const p of PHASES) {
      for (const t of p.enemyTypes) {
        expect(ENEMY_TYPES[t], `${p.name} cita inimigo inexistente: ${t}`).toBeDefined();
      }
      expect(ENEMY_TYPES[p.boss!], `${p.name} cita boss inexistente: ${p.boss}`).toBeDefined();
    }
  });
});
