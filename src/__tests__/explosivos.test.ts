import { describe, it, expect, beforeEach } from 'vitest';
import { spawnBullet, getBullets, clearBullets, updateBullets, updateMines } from '../entities/bullet';
import { createExplosion, clearExplosions } from '../systems/explosions';
import { BULLET_LIFE, MINE_LIFE, MINE_DETECTION_RADIUS } from '../core/constants';
import { Enemy } from '../types';

function inimigo(x: number, y: number): Enemy {
  return { x, y, radius: 14, health: 20, spawnDelay: 0 } as Enemy;
}

/**
 * Sprint 2 — explosivos.
 *
 * Bug original: a explosão morava dentro do callback de colisão inimigo, então
 * o RPG atravessava parede e caixote e só estourava se acertasse alguém; a
 * mina sumia com o pavio de 2s da bala; e o explosivo que não acertava nada
 * simplesmente desaparecia no fim da vida.
 */
describe('explosivos: detonação em qualquer fim, mina com fuse, pavio', () => {
  beforeEach(() => {
    clearBullets();
    clearExplosions();
  });

  it('mina plantada (explosiva parada) nasce com o pavio da mina, não o da bala', () => {
    spawnBullet(100, 100, 0, 0, 50, false, '#fff', false, true, 140);
    expect(getBullets()[0].life).toBe(MINE_LIFE);
  });

  it('explosivo em voo e bala comum seguem com BULLET_LIFE', () => {
    spawnBullet(100, 100, 400, 0, 50, false, '#fff', false, true, 140);
    expect(getBullets()[0].life).toBe(BULLET_LIFE);
    spawnBullet(100, 100, 300, 0, 10, false, '#fff', false);
    expect(getBullets()[1].life).toBe(BULLET_LIFE);
  });

  it('mina arma o fuse quando inimigo entra no raio e estoura no fim do fuse', () => {
    spawnBullet(100, 100, 0, 0, 50, false, '#fff', false, true, 140);
    const perto = inimigo(100 + MINE_DETECTION_RADIUS - 10, 100);
    expect(updateMines(0.3, [perto])).toHaveLength(0);
    expect(updateMines(0.3, [perto])).toHaveLength(1);
  });

  it('mina não arma fuse com inimigo fora do raio', () => {
    spawnBullet(100, 100, 0, 0, 50, false, '#fff', false, true, 140);
    const longe = inimigo(100 + MINE_DETECTION_RADIUS + 50, 100);
    for (let i = 0; i < 5; i++) {
      expect(updateMines(0.3, [longe])).toHaveLength(0);
    }
  });

  it('mina de inimigo morto ou ainda nascendo não arma o fuse', () => {
    spawnBullet(100, 100, 0, 0, 50, false, '#fff', false, true, 140);
    const morto = inimigo(110, 100);
    morto.health = 0;
    const nascendo = inimigo(110, 100);
    nascendo.spawnDelay = 1;
    expect(updateMines(0.5, [morto, nascendo])).toHaveLength(0);
  });

  it('pavio: updateBullets devolve o explosivo expirado, não a bala comum', () => {
    spawnBullet(100, 100, 10, 0, 50, false, '#fff', false, true, 140);
    spawnBullet(100, 200, 10, 0, 10, false, '#fff', false);
    const expirados = updateBullets(3, 1920, 1280);
    expect(expirados).toHaveLength(1);
    expect(expirados[0].explosive).toBe(true);
    expect(getBullets()).toHaveLength(0);
  });

  it('pavio não devolve explosivo já detonado (sem dupla detonação)', () => {
    spawnBullet(100, 100, 10, 0, 50, false, '#fff', false, true, 140);
    getBullets()[0].detonated = true;
    expect(updateBullets(3, 1920, 1280)).toHaveLength(0);
  });

  it('explosão de arma não fere quem não está na lista de alvos', () => {
    // O jogador nunca entra na lista — createExplosion itera SÓ enemies.
    const naLista = inimigo(120, 100);
    const fora = inimigo(120, 100);
    createExplosion(100, 100, 140, 50, [naLista]);
    expect(naLista.health).toBeLessThan(20);
    expect(fora.health).toBe(20);
  });
});
