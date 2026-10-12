/**
 * Fase do NÚCLEO apelona (chefão final):
 *  - `NUCLEO_RUSH`: a fila de chefes do Bunker Central;
 *  - `trajeNucleo`: o traje de contenção que o jogador encontra na fase;
 *  - `Destruidor`: o martelo destruidor de mundos (arma secreta do NÚCLEO).
 *
 * Os três são dados em config com invariantes que o balance e o loot
 * assumem: a fila só tem chefes que existem, o traje é exclusivo (fora do
 * sorteio comum) e o Destruidor é entregue na ENTRADA da fase 9 — nunca
 * sorteado, nem pela caixa de chefe nem pelo pool genérico.
 */
import { describe, it, expect } from 'vitest';
import { PHASES, ENEMY_TYPES, NUCLEO_RUSH, WEAPONS, POWERUP_TYPES, POWERUP_DESC, WEAPON_DESC } from '../config';
import { spawnBossLoot } from '../systems/loot';

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

  it('a caixa de chefe NÃO sorteia o martelo, em nenhuma das 4 saídas', () => {
    // Bug do jogador: o martelo chegava como caixa do NÚCLEO MORTO, ou seja,
    // na LOJA depois da fase — quando já não havia mais o que usar com ele. Ele
    // é entregue na ENTRADA da fase 9 agora.
    //
    // A trava roda o sorteio muitas vezes porque a caixa tem 4 caminhos e o
    // último é o pool genérico: um teste que rodasse uma vez só passaria com
    // 1/16 de chance de pegar o caminho defeituoso.
    for (let i = 0; i < 500; i++) {
      const r = spawnBossLoot(100, 100);
      const nome = WEAPONS[r.index]?.name;
      expect(nome, `a caixa do chefe sorteou ${nome}`).not.toBe('Destruidor');
    }
  });

  it('o martelo é entregável ao jogador na fase 9 (senão ninguém o receberia)', () => {
    // O `secret` o mantém fora de todo sorteio, então a entrega na entrada é a
    // ÚNICA caminho dele existir no jogo. Se `WEAPONS` deixar de tê-lo, o
    // `findIndex` devolve -1 e a entrega vira um par inválido em silêncio.
    expect(martelo).toBeDefined();
    const idx = WEAPONS.findIndex(w => w.name === 'Destruidor');
    expect(idx).toBeGreaterThanOrEqual(0);
    // e é secreto: fora do pool genérico da caixa E fora da loja
    expect(WEAPONS[idx].secret).toBe(true);
  });
});
