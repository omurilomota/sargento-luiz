import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ESCALA_NEUTRA,
  FATOR_DANO,
  FATOR_VIDA,
  PISO_DANO_CHEFE,
  PISO_DANO_COMUM,
  TETO_DANO_CHEFE,
  TETO_DANO_COMUM,
  TETO_ESCALA_DANO,
  TETO_ESCALA_VIDA,
  danoLimitado,
  dpsDeReferencia,
  getEscalaAmeaca,
  setEscalaAmeaca,
  tetoDeDano,
} from '../systems/ameaca';
import { ENEMY_TYPES, WEAPONS } from '../config';
import { spawnEnemy, resetSpawner, setPhaseDifficulty, setPhaseTime } from '../systems/spawner';

/**
 * A AMEAÇA — o mundo mede o preparo do jogador.
 *
 * Relato do dono (2026-11-07): "depois de upar tudo, o personagem fica
 * imbatível e mata tudo e todos na sua frente sem nenhuma dificuldade".
 *
 * A aritmética do problema (medida na build máxima do jogo):
 *
 *   - o dano do jogador chega a ~4x o da pistola inicial;
 *   - a vida do inimigo cresce ~3x (onda, dificuldade, tempo);
 *   - e o topo da escada de perks é comprável com a renda de UMA fase.
 *
 * Quem compra tudo termina a campanha sem gastar munição e o chefe da fase
 * final cai antes de a luta começar. Este arquivo trava as três réguas que
 * fecham isso:
 *
 *   1. quem não se preparou vê a curva autorada intacta (escala 1,0);
 *   2. a escala cresce com o preparo, mas tem TETO (o mundo não vira parede);
 *   3. um acerto não pode apagar o alvo — e o piso mantém a pistola inicial
 *      fora da regra, porque 13,8 de dano não pode virar 6,3.
 */

describe('ameaça: a curva de quem não se preparou', () => {
  it('sem preparo, a escala é a neutra (a curva autorada intacta)', () => {
    const escala = getEscalaAmeaca(1, 1);
    expect(escala.vida).toBeCloseTo(1);
    expect(escala.dano).toBeCloseTo(1);
    expect(escala.numero).toBeCloseTo(1);
    expect(escala).toEqual(ESCALA_NEUTRA);
  });

  it('a vida do inimigo segue o poder de FOGO e o dano segue o poder de CORPO', () => {
    // só fogo: a vida sobe, o dano não
    const soFogo = getEscalaAmeaca(3, 1);
    expect(soFogo.vida).toBeGreaterThan(1);
    expect(soFogo.dano).toBeCloseTo(1);

    // só corpo: o dano sobe, a vida não
    const soCorpo = getEscalaAmeaca(1, 2);
    expect(soCorpo.vida).toBeCloseTo(1);
    expect(soCorpo.dano).toBeGreaterThan(1);
  });

  it('o número mostrado é o quanto o MUNDO cresceu (o maior dos dois eixos)', () => {
    const escala = getEscalaAmeaca(3, 2.5);
    expect(escala.numero).toBeCloseTo(Math.max(escala.vida, escala.dano));
    // com poder de corpo maior, o eixo do dano é o que manda
    expect(escala.numero).toBeCloseTo(escala.dano);
  });
});

describe('ameaça: retornos decrescentes, com teto', () => {
  it('a escala cresce menos que o preparo (quem se prepara continua mais forte)', () => {
    const escala = getEscalaAmeaca(4, 1);
    // 4x de poder de fogo → menos que 4x de vida de inimigo
    expect(escala.vida).toBeLessThan(4);
    expect(escala.vida).toBeGreaterThan(1);
  });

  it('a vida do inimigo tem teto', () => {
    const escala = getEscalaAmeaca(100, 1);
    expect(escala.vida).toBeCloseTo(TETO_ESCALA_VIDA);
  });

  it('o dano do inimigo tem teto', () => {
    const escala = getEscalaAmeaca(1, 100);
    expect(escala.dano).toBeCloseTo(TETO_ESCALA_DANO);
  });

  it('os fatores são os documentados (a curva é ajustável num lugar só)', () => {
    // poder 2,2: longe dos tetos, para o fator aparecer limpo
    const escala = getEscalaAmeaca(2, 2);
    expect(escala.vida).toBeCloseTo(1 + FATOR_VIDA);
    expect(escala.dano).toBeCloseTo(1 + FATOR_DANO);
  });
});

describe('ameaça: o teto de dano por acerto', () => {
  it('inimigo comum: 35% da vida máxima', () => {
    expect(tetoDeDano(100, false)).toBeCloseTo(35);
    expect(tetoDeDano(200, false)).toBeCloseTo(70);
  });

  it('chefe: 20% da vida máxima (a luta com chefe é a régua do jogo)', () => {
    expect(tetoDeDano(1000, true)).toBeCloseTo(200);
    expect(tetoDeDano(2000, true)).toBeCloseTo(400);
  });

  it('o piso protege quem não se preparou (a pistola continua valendo)', () => {
    // a pistola inicial faz 12 (13,8 com a classe soldado): com a regra
    // percentual ela cairia para 6,3 contra um inimigo de 18 de vida
    const pistola = WEAPONS[0].damage;
    expect(pistola).toBeLessThan(PISO_DANO_COMUM);
    expect(danoLimitado(pistola, 18, false)).toBe(pistola);
  });

  it('dano abaixo do teto passa intacto', () => {
    expect(danoLimitado(10, 100, false)).toBe(10);
    expect(danoLimitado(100, 1000, true)).toBe(100);
  });

  it('dano acima do teto é cortado pela régua', () => {
    expect(danoLimitado(80, 100, false)).toBeCloseTo(35);
    expect(danoLimitado(900, 1000, true)).toBeCloseTo(200);
  });

  it('o teto é proporcional: um alvo grande aceita mais dano por acerto', () => {
    expect(danoLimitado(1000, 1000, false)).toBeCloseTo(350);
    // alvo de 4000 de vida: o teto é 1400, e 1000 de dano passa intacto
    expect(tetoDeDano(4000, false)).toBeCloseTo(1400);
    expect(danoLimitado(1000, 4000, false)).toBe(1000);
    expect(danoLimitado(1500, 4000, false)).toBeCloseTo(1400);
  });

  it('o piso também vale para o chefe', () => {
    expect(tetoDeDano(10, true)).toBe(PISO_DANO_CHEFE);
  });

  it('a pistola NUNCA é cortada, contra alvo de qualquer tamanho', () => {
    // Esta é a espinha determinística de "a campanha de quem não se preparou
    // não muda": o piso de 14 é maior que o dano da pistola (12), então o
    // teto percentual — que só morde acima de 40 de vida — nunca a alcança.
    // O harness `npm run fases` NÃO consegue provar isso (duas execuções da
    // mesma build diferem em 14 das 16 fases: o ruído é do tamanho do sinal),
    // então a prova tem de ser aritmética, não estatística.
    const pistola = WEAPONS[0].damage;
    for (const vidaMax of [10, 20, 40, 60, 100, 300, 1000, 5000]) {
      expect(danoLimitado(pistola, vidaMax, false)).toBe(pistola);
      expect(danoLimitado(pistola, vidaMax, true)).toBe(pistola);
    }
  });
});

describe('ameaça: a referência do mundo', () => {
  it('a referência é a pistola inicial, sem peça e sem preparo', () => {
    const w = WEAPONS[0];
    const esperado = (w.magazineSize * w.damage * w.bulletCount) / (w.magazineSize * w.shootRate + w.reloadTime);
    expect(dpsDeReferencia()).toBeCloseTo(esperado);
  });

  it('a referência é ~25,5 DPS (o número que a análise do relato usou)', () => {
    expect(dpsDeReferencia()).toBeGreaterThan(24);
    expect(dpsDeReferencia()).toBeLessThan(27);
  });
});

describe('ameaça: a escala entra no spawn', () => {
  beforeEach(() => {
    resetSpawner();
    setPhaseDifficulty(1);
    setPhaseTime(0);
    // `variance = 0,9 + random() * 0,2`: com o random travado em 0,5 ela
    // vale 1,0 e o spawn fica determinístico (o sorteio de posição é
    // contornado pelo forceX/forceY).
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setEscalaAmeaca(ESCALA_NEUTRA);
  });

  it('sem preparo, a vida do inimigo é a curva autorada (a escala 1,0 não muda nada)', () => {
    setEscalaAmeaca(ESCALA_NEUTRA);
    const e = spawnEnemy('grunt', 1920, 1280, 0, 100, 100)!;
    // onda 0, dificuldade 1, tempo 0: a curva autorada é a vida do tipo
    expect(e.maxHealth).toBe(ENEMY_TYPES.grunt.health);
    expect(e.damage).toBe(ENEMY_TYPES.grunt.damage);
  });

  it('a ameaça dobra a VIDA do inimigo (eixo de fogo)', () => {
    setEscalaAmeaca({ vida: 2, dano: 1, numero: 2, poderDano: 1, poderCorpo: 1 });
    const e = spawnEnemy('grunt', 1920, 1280, 0, 100, 100)!;
    expect(e.maxHealth).toBe(ENEMY_TYPES.grunt.health * 2);
    expect(e.damage).toBe(ENEMY_TYPES.grunt.damage);
  });

  it('a ameaça dobra o DANO do inimigo (eixo de corpo) sem mexer na vida', () => {
    setEscalaAmeaca({ vida: 1, dano: 2, numero: 2, poderDano: 1, poderCorpo: 1 });
    const e = spawnEnemy('grunt', 1920, 1280, 0, 100, 100)!;
    expect(e.damage).toBe(ENEMY_TYPES.grunt.damage * 2);
    expect(e.maxHealth).toBe(ENEMY_TYPES.grunt.health);
  });

  it('a ameaça também dobra a VIDA do chefe (o alvo do relato)', () => {
    setEscalaAmeaca({ vida: 2, dano: 1, numero: 2, poderDano: 1, poderCorpo: 1 });
    const e = spawnEnemy('nucleo', 1920, 1280, 0, 100, 100)!;
    expect(e.maxHealth).toBe(ENEMY_TYPES.nucleo.health * 2);
  });
});
