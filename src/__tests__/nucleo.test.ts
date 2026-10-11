/**
 * Fase do NÚCLEO apelona (chefão final):
 *  - `NUCLEO_RUSH`: a fila de chefes do Bunker Central;
 *  - `trajeNucleo`: o traje de contenção que o jogador encontra na fase;
 *  - `Destruidor`: o martelo destruidor de mundos (arma secreta do NÚCLEO).
 *
 * Os três são dados em config com invariantes que o balance e o loot
 * assumem: a fila só tem chefes que existem, o traje é exclusivo (fora do
 * sorteio comum) e o Destruidor só existe como segredo do chefão final.
 */
import { describe, it, expect } from 'vitest';
import { PHASES, ENEMY_TYPES, NUCLEO_RUSH, WEAPONS, POWERUP_TYPES, POWERUP_DESC, WEAPON_DESC } from '../config';

describe('NUCLEO_RUSH — fila de chefes do Bunker Central', () => {
  it('termina no NÚCLEO (o chefão é o último, não o primeiro)', () => {
    expect(NUCLEO_RUSH[NUCLEO_RUSH.length - 1]).toBe('nucleo');
  });

  it('todos os tipos da fila existem em ENEMY_TYPES e são chefes', () => {
    for (const tipo of NUCLEO_RUSH) {
      const def = ENEMY_TYPES[tipo];
      expect(def, `tipo desconhecido na fila: ${tipo}`).toBeDefined();
      expect(def.isBoss, `${tipo} na fila mas não é boss`).toBe(true);
    }
  });

  it('sem chefes repetidos na fila', () => {
    expect(new Set(NUCLEO_RUSH).size).toBe(NUCLEO_RUSH.length);
  });

  it('a fase declarada (boss: nucleo) bate com o último da fila', () => {
    const fase = PHASES.find(p => p.boss === 'nucleo');
    expect(fase).toBeDefined();
    expect(NUCLEO_RUSH[NUCLEO_RUSH.length - 1]).toBe(fase!.boss);
  });
});

describe('trajeNucleo — o traje de contenção do Bunker', () => {
  it('existe em POWERUP_TYPES com duração positiva', () => {
    expect(POWERUP_TYPES.trajeNucleo).toBeDefined();
    expect(POWERUP_TYPES.trajeNucleo.duration).toBeGreaterThan(0);
  });

  it('tem descrição na loja (o jogador precisa saber o que faz)', () => {
    expect(POWERUP_DESC.trajeNucleo).toBeTruthy();
  });
});

describe('Destruidor — o martelo destruidor de mundos', () => {
  const martelo = WEAPONS.find(w => w.name === 'Destruidor');

  it('existe, é secreto e explosivo', () => {
    expect(martelo).toBeDefined();
    expect(martelo!.secret).toBe(true);
    expect(martelo!.explosive).toBe(true);
    // o martelo é apelona de propósito: explosão maior que a do RPG (140)
    // e maior que a da BFG (120). É a arma do chefão final.
    expect(martelo!.explosionRadius).toBeGreaterThan(200);
    expect(martelo!.damage).toBeGreaterThan(100);
  });

  it('tem descrição na loja (as outras armas têm)', () => {
    expect(WEAPON_DESC.Destruidor).toBeTruthy();
  });
});
