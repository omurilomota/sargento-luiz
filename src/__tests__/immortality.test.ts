import { describe, it, expect, beforeEach } from 'vitest';
import { POWERUP_TYPES } from '../config';
import { powerups, spawnPowerUp, spawnPowerUpDeChefe, resetPowerUps } from '../powerups';
import { checkEnemyBulletPlayerCollision, checkEnemyPlayerCollision } from '../systems/collision';
import { matarPlayer2, damagePlayer2, getPlayer2, initLocalMultiplayer, resetLocalMultiplayer, getWinner, resetPlayer2, getPlacarLocal } from '../systems/localMultiplayer';
import { PALETTE } from '../core/palette';
import type { Bullet, Enemy } from '../types';

/**
 * O jogador conseguia passar de fase sem morrer de verdade. Três vetores:
 *
 *   1. H sem medkit comprava 25 HP por 50 moedas, quantas vezes coubessem no
 *      bolso, durante o combate. Removido: H só usa medkit do inventário.
 *   2. `invincible` dava 4s de imunidade TOTAL (tiro, contato, hazard), e o
 *      sorteio era uniforme entre 12 tipos — qualquer inimigo comum entregava.
 *   3. A passiva do MÉDICO não tinha guarda de Hardcore, que promete "sem
 *      loja, sem cura".
 *
 * Estes testes travam 2 e 3 pelo comportamento observável. O 1 é ausência de
 * código (o ramo não existe mais), travado pelo teste de tecla abaixo.
 */
function bulletEnemy(x: number, y: number): Bullet {
  return { x, y, px: x, py: y, vx: 0, vy: 0, damage: 20, radius: 4, isEnemy: true } as unknown as Bullet;
}

describe('imortalidade: o power-up invincible não vem de inimigo comum', () => {
  beforeEach(() => { resetPowerUps(); });

  it('o sorteio comum nunca devolve invincible', () => {
    // 400 sorteios cobrem todos os tipos do pool. Se `invincible` voltasse ao
    // pool, sairia com probabilidade ~1/11 e o teste falharia.
    for (let i = 0; i < 400; i++) {
      spawnPowerUp(200, 200);
      const p = powerups[powerups.length - 1];
      expect(p.type, `drop comum sorteou "${p.type}"`).not.toBe('invincible');
    }
  });

  it('o sorteio de chefe ainda pode devolver invincible', () => {
    // A mecânica não foi removida: o chefe continua sendo a recompensa capaz
    // de dar imunidade.
    let achou = false;
    for (let i = 0; i < 400 && !achou; i++) {
      resetPowerUps();
      spawnPowerUpDeChefe(200, 200);
      achou = powerups[0]?.type === 'invincible';
    }
    expect(achou, 'o chefe nunca dropara invincible em 400 sorteios').toBe(true);
  });

  it('o pool comum ainda tem tipos para dropping', () => {
    spawnPowerUp(200, 200);
    const t = powerups[0].type;
    expect(Object.keys(POWERUP_TYPES)).toContain(t);
    expect(t).not.toBe('invincible');
  });
});

describe('imortalidade: i-frame protege, mas não é ninguém intocável', () => {
  it('com i-frame o projétil não passa, mas sem i-frame passa', () => {
    const lista = [bulletEnemy(100, 100)];
    let comIframe = 0;
    checkEnemyBulletPlayerCollision(lista, 100, 100, 16, 0.5, () => { comIframe++; });
    expect(comIframe).toBe(0);

    let semIframe = 0;
    checkEnemyBulletPlayerCollision(lista, 100, 100, 16, 0, () => { semIframe++; });
    expect(semIframe).toBe(1);
  });

  it('o contato com inimigo também respeita i-frame', () => {
    const e = [{ type: 'grunt', x: 100, y: 100, radius: 16 } as unknown as Enemy];
    let comIframe = 0;
    checkEnemyPlayerCollision(e, 100, 100, 16, 0.5, () => { comIframe++; });
    expect(comIframe).toBe(0);
  });
});

describe('imortalidade: o jogador 2 leva dano', () => {
  it('o P2 tem vida e recebe dano', () => {
    // A tela de "LOCAL 2P" só pode anunciar versus com P2 que morre. O módulo
    // tinha `damagePlayer2` e `getWinner` e os dois foram removidos como
    // código morto; aqui eles voltam ligados.
    initLocalMultiplayer(1280, 720);
    const cheia = getPlayer2()!.health;
    damagePlayer2(25);
    expect(getPlayer2()!.health).toBe(cheia - 25);
    expect(getWinner(), 'P2 vivo, sem vencedor').toBe(null);
    matarPlayer2();
    expect(getWinner()).toBe('p1');
    resetLocalMultiplayer();
  });

  it('a vitória é do último em pé, e null enquanto os dois vivem', () => {
    initLocalMultiplayer(1280, 720);
    expect(getWinner(), 'os dois de pé não tem vencedor').toBe(null);

    matarPlayer2();
    expect(getWinner(), 'P2 caído com P1 de pé').toBe('p1');

    // o reset devolve o P2 à partida — o vencedor anterior não pode sobrar
    resetPlayer2(1280, 720);
    expect(getWinner(), 'ambos vivos de novo').toBe(null);
    resetLocalMultiplayer();
  });

  it('o P2 respeita i-frame: dano seguido não acumula', () => {
    initLocalMultiplayer(1280, 720);
    const cheia = getPlayer2()!.health;
    damagePlayer2(20);
    const depois = getPlayer2()!.health;
    damagePlayer2(20);
    expect(getPlayer2()!.health, 'segundo dano furou o i-frame').toBe(depois);
    resetLocalMultiplayer();
  });
});

describe('fim de partida local: o placar que a tela mostra', () => {
  // A tela de fim é a primeira peça do versus que não existia: `getWinner`
  // sabia quem caiu e nada desenhava. Estes testes travam o CONTRATO do placar —
  // de quem vem cada vida e o que "caído" significa — porque a tela é desenhada
  // por `drawFimLocal(vencedor, placar)`, e placar errado aparece como barra
  // cheia ao lado de um perdedor.

  it('os dois de pé: vidas cheias, nas cores de cada um', () => {
    initLocalMultiplayer(1280, 720);
    const placar = getPlacarLocal(100, 100);
    expect(placar).toHaveLength(2);
    expect(placar[0]).toMatchObject({ nome: 'P1', vida: 100, vidaMax: 100, vivo: true, cor: PALETTE.moss });
    expect(placar[1]).toMatchObject({ nome: 'P2', vida: 100, vidaMax: 100, vivo: true, cor: PALETTE.stone });
    resetLocalMultiplayer();
  });

  it('a vida do P1 vem de quem a carrega: este módulo só conhece a do P2', () => {
    initLocalMultiplayer(1280, 720);
    // 62.4 -> 62: a barra divide pela vida máxima, e casa decimal no meio
    // apareceria como "62 / 100" na tela de fim.
    const placar = getPlacarLocal(62.4, 100);
    expect(placar[0].vida).toBe(62);
    expect(placar[0].vivo).toBe(true);
    expect(placar[1].vida, 'a vida do P2 não é afetada pela do P1').toBe(100);
    resetLocalMultiplayer();
  });

  it('P2 caído: placar mostra 0 e caído, e o P1 continua em pé', () => {
    initLocalMultiplayer(1280, 720);
    matarPlayer2();
    const placar = getPlacarLocal(38, 100);
    expect(placar[1]).toMatchObject({ vida: 0, vivo: false });
    // o P2 mantém a própria vida máxima: a barra dele mede contra 100 dele,
    // não contra o resto de vida do vencedor
    expect(placar[1].vidaMax).toBe(100);
    expect(placar[0].vivo, 'quem ganhou aparece em pé').toBe(true);
    expect(getWinner(), 'o placar e o vencedor dizem a mesma coisa').toBe('p1');
    resetLocalMultiplayer();
  });

  it('P1 caído: o placar mostra o P1 em 0 — o ramo p2 do vencedor é legítimo', () => {
    initLocalMultiplayer(1280, 720);
    const placar = getPlacarLocal(0, 100);
    expect(placar[0]).toMatchObject({ vida: 0, vivo: false });
    expect(placar[1].vivo, 'o P2 segue em pé').toBe(true);
    resetLocalMultiplayer();
  });

  it('a revanche devolve o placar cheio: nada da partida anterior sobra na tela', () => {
    initLocalMultiplayer(1280, 720);
    matarPlayer2();
    expect(getPlacarLocal(100, 100)[1].vivo).toBe(false);

    // é o que a revanche chama, e a tela lê o placar no quadro seguinte
    resetPlayer2(1280, 720);
    const depois = getPlacarLocal(100, 100);
    expect(depois[1]).toMatchObject({ vida: 100, vivo: true });
    expect(getWinner(), 'vencedor velho não pode sobreviver à revanche').toBe(null);
    resetLocalMultiplayer();
  });
});