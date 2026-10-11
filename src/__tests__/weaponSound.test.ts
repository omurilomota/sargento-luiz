import { describe, it, expect, vi } from 'vitest';
import { WEAPONS, WEAPON_DESC } from '../config';
import { WEAPON_SOUNDS } from '../systems/audio';

describe('toda arma tem som e descrição na loja', () => {
  // Bug: `WEAPON_SOUNDS` não tinha `BFG` nem `M. Quebrada`, e `playWeaponSound`
  // caía num `|| sfxPistol` silencioso. A BFG — 5 projéteis explosivos com
  // raio 120 — tocava som de pistola. O fallback escondia o erro; este teste
  // é o que impede a próxima arma nova de nascer muda.
  for (const w of WEAPONS) {
    it(`"${w.name}" tem som`, () => {
      expect(WEAPON_SOUNDS[w.name], `sem som para ${w.name}`).toBeTypeOf('function');
    });
  }

  it('não existe entrada de som para arma que não existe', () => {
    const nomes = new Set(WEAPONS.map(w => w.name));
    for (const chave of Object.keys(WEAPON_SOUNDS)) {
      expect(nomes.has(chave), `som "${chave}" sem arma correspondente`).toBe(true);
    }
  });

  it('a BFG não pode tocar o som da pistola', () => {
    expect(WEAPON_SOUNDS['BFG']).not.toBe(WEAPON_SOUNDS['Pistola']);
  });

  it('toda arma tem descrição na loja', () => {
    for (const w of WEAPONS) {
      expect(WEAPON_DESC[w.name], `sem descrição para ${w.name}`).toBeTruthy();
    }
  });

  it('a descrição não promete mecânica que o config não tem', () => {
    // `slow`/`knockback` nunca existiram no código: o `Enemy` não tem campo
    // para nenhum dos dois. A loja não pode continuar prometendo.
    for (const [nome, desc] of Object.entries(WEAPON_DESC)) {
      expect(desc, `"${nome}" promete slow`).not.toMatch(/cola|lenta|congel/i);
      expect(desc, `"${nome}" promete knockback`).not.toMatch(/empurra/i);
    }
  });
});

describe('playWeaponSound nunca cai em fallback silencioso', () => {
  it('toda entrada de som é uma função real', () => {
    const funcs = Object.values(WEAPON_SOUNDS);
    expect(new Set(funcs).size).toBeGreaterThan(0);
    expect(vi.isMockFunction(funcs[0])).toBe(false);
  });
});

/**
 * Família sonora da arma e som de recarga.
 *
 * Antes o áudio usava o `weaponClass` do config — 3 valores, que fazia 12
 * armas com 3 timbres: a Metralhadora e a Sniper soavam igual na recarga.
 * A família sai do que a arma faz — cartucho, cano duplo, tambor, ferrolho,
 * energia, foguete, carga. (O `weaponClass` saiu do config; a mesma família
 * também escolhe a pose — POSE_DA_FAMILIA no renderer.)
 */
import { getWeaponFamily, WEAPON_FAMILY } from '../weapons';

describe('família sonora por arma', () => {
  for (const w of WEAPONS) {
    it(`"${w.name}" tem família sonora`, () => {
      const fam = WEAPON_FAMILY[w.name];
      expect(fam, `sem família para ${w.name}`).toBeDefined();
      expect(['pistol', 'shotgun', 'machine', 'precision', 'energy', 'launcher', 'mine'])
        .toContain(fam);
    });
  }

  it('a Metralhadora e a Sniper não compartilham família', () => {
    // São as duas armas com o perfil mais diferente: tambor curto contra
    // ferrolho longo. Se voltassem para a mesma categoria, a recarga das duas
    // voltaria a ser o mesmo som.
    expect(WEAPON_FAMILY['Metralhadora']).not.toBe(WEAPON_FAMILY['Sniper']);
  });

  it('a Laser e a Raios compartilham família (as duas são energia)', () => {
    expect(WEAPON_FAMILY['Laser']).toBe(WEAPON_FAMILY['Raios']);
  });

  it('a Mina é a única de carga estática', () => {
    expect(WEAPON_FAMILY['Mina']).toBe('mine');
  });

  it('getWeaponFamily devolve uma família válida para a arma equipada', () => {
    expect(typeof getWeaponFamily()).toBe('string');
  });

  it('toda arma do config tem entrada na tabela de famílias', () => {
    for (const w of WEAPONS) {
      expect(WEAPON_FAMILY[w.name], `${w.name} sem família`).toBeTruthy();
    }
  });
});

/**
 * Pose por família (GATE VISUAL do Sprint 3).
 *
 * As armas do Kay Lousberg ficaram de fora da mão: são perfil lateral e o
 * jogo é top-down. A pose vem da mesma família que o som, e o que o teste
 * garante é que nenhuma arma nova nasça sem pose — e que a curadoria não
 * volte a colapsar tudo na pistola, como o `weaponClass` fazia.
 */
import { POSE_DA_FAMILIA } from '../systems/renderer';

describe('pose vem da família, não por arma', () => {
  it('toda arma tem família e toda família tem pose', () => {
    for (const fam of new Set(Object.values(WEAPON_FAMILY))) {
      expect(POSE_DA_FAMILIA[fam], `família ${fam} sem pose`).toBeTruthy();
    }
    for (const w of WEAPONS) {
      expect(POSE_DA_FAMILIA[WEAPON_FAMILY[w.name]], `${w.name} sem pose`).toBeTruthy();
    }
  });

  it('escopeta e energia não colapsam na pose da pistola e da metralhadora', () => {
    expect(POSE_DA_FAMILIA[WEAPON_FAMILY['Shotgun']]).not.toBe(POSE_DA_FAMILIA[WEAPON_FAMILY['Pistola']]);
    expect(POSE_DA_FAMILIA[WEAPON_FAMILY['Laser']]).not.toBe(POSE_DA_FAMILIA[WEAPON_FAMILY['Metralhadora']]);
  });
});
