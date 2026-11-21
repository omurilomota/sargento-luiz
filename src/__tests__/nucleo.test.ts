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
import { PHASES, ENEMY_TYPES, NUCLEO_RUSH, WEAPONS, POWERUP_TYPES, POWERUP_DESC, WEAPON_DESC, SPAWN_PROPRIO } from '../config';
import { spawnBossLoot } from '../systems/loot';
import { ENEMY_CHARACTER, VARIACAO_POR_BIOMA } from '../systems/sprites';
import { CUTSCENES, cutsceneForPhase } from '../systems/story';

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

describe('o nome da fase final bate com a cutscene que a abre', () => {
  /**
   * A fase final tinha dois nomes: `config.ts` dizia "Bunker Central" e a
   * cutscene dizia Núcleo-Central. A `PREMISSA-V2.md` registra isso como nota
   * pendente — "a tela e o código precisam concordar". Enquanto não
   * concordassem, o jogador via um lugar na transição de fase e outro na
   * cena que abre aquela fase.
   *
   * A trava amarra os dois: `cutsceneForPhase` diz qual cena abre a fase, e o
   * título dessa cena tem que ser o nome da fase. É o contrato que impede a
   * divergência de voltar por qualquer um dos dois lados.
   */
  const FASE_FINAL = PHASES.length - 1;
  const cenaFinal = CUTSCENES[cutsceneForPhase(FASE_FINAL)];

  it('a cena que abre a fase final existe e não é o epílogo', () => {
    expect(cenaFinal).toBeDefined();
    expect(cenaFinal.title).not.toBe('EPÍLOGO');
  });

  it('o nome da fase é o título da cena que a abre', () => {
    expect(PHASES[FASE_FINAL].name).toBe(cenaFinal.title);
  });

  it('o nome bate, ignorando caixa e acento (o nome tem acento na tela)', () => {
    const base = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    expect(base(PHASES[FASE_FINAL].name).replace(/[^a-z]/g, ''))
      .toBe(base(cenaFinal.title).replace(/[^a-z]/g, ''));
  });

  it('nenhuma fase abre uma cena de título diferente — MENOS a Fábrica (caixa pequena, H2)', () => {
    for (let f = 0; f < PHASES.length; f++) {
      const idx = cutsceneForPhase(f);
      // H2: a Fábrica abre em caixa pequena de diálogo (dialogo.ts), não
      // em cutscene — pedido do Murilo. -1 é o contrato dela.
      if (idx === -1) {
        expect(PHASES[f].name, 'só a Fábrica pode não ter cena grande').toBe('Fábrica');
        continue;
      }
      const c = CUTSCENES[idx];
      expect(c, `fase ${f} (${PHASES[f].name}) sem cena`).toBeDefined();
      expect(c.title, `fase ${f}: config diz "${PHASES[f].name}", a cena diz "${c.title}"`).toBeTruthy();
    }
  });
});

describe('biomaquina — a gente costurada que o NÚCLEO faz', () => {
  const bio = ENEMY_TYPES.biomaquina;

  it('existe com os números da decisão do jogador', () => {
    expect(bio).toBeDefined();
    expect(bio.radius).toBe(19);
    expect(bio.speed).toBe(95);
    expect(bio.health).toBe(55);
    expect(bio.damage).toBe(14);
  });

  it('atira — sem isso a fase final vira melee e o traje perde o sentido', () => {
    expect(bio.canShoot).toBe(true);
    expect(bio.shootRate).toBeGreaterThan(0);
    expect(bio.bulletSpeed).toBeGreaterThan(0);
    expect(bio.projectileColor).toBeTruthy();
  });

  it('NÃO é chefe e NÃO entra no pool de onda de fase nenhuma', () => {
    // Se entrasse em `enemyTypes`, o spawner a jogaria na onda — e a decisão
    // do jogador é que ela nasce do NÚCLEO, não da cota da horda.
    expect(bio.isBoss).toBeFalsy();
    for (const fase of PHASES) {
      expect(fase.enemyTypes, `biomaquina entrou no pool de ${fase.name}`).not.toContain('biomaquina');
    }
  });

  it('é um spawn próprio: existe no jogo por máquina, não por onda', () => {
    expect(SPAWN_PROPRIO).toContain('biomaquina');
  });

  it('tem personagem no pack (sem isso cai no fallback zumbi)', () => {
    expect(ENEMY_CHARACTER.biomaquina).toBeTruthy();
    expect(VARIACAO_POR_BIOMA.bunker.biomaquina).toBeTruthy();
  });

  it('é mais forte que o grunt da mesma fase, para a máquina não ser ruído', () => {
    const grunt = ENEMY_TYPES.grunt;
    expect(bio.health).toBeGreaterThan(grunt.health);
    expect(bio.damage).toBeGreaterThan(grunt.damage);
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
