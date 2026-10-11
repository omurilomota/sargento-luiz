import { describe, it, expect, beforeEach } from 'vitest';
import { POWERUP_TYPES } from '../config';
import { powerups, spawnPowerUp, spawnPowerUpDeChefe, resetPowerUps } from '../powerups';
import { checkEnemyBulletPlayerCollision, checkEnemyPlayerCollision } from '../systems/collision';
import { matarPlayer2, damagePlayer2, getPlayer2, initLocalMultiplayer, resetLocalMultiplayer, getWinner, resetPlayer2 } from '../systems/localMultiplayer';
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