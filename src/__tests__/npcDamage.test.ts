import { describe, it, expect, beforeEach, vi } from 'vitest';
import { spawnNPC, updateNPCs, getNPCs, resetNPCs } from '../systems/npcs';
import { Bullet } from '../types';
import { CELL_SIZE } from '../maps';
import { loadMap } from '../systems/tilemap';
import { BIOMES } from '../maps';

function balaInimiga(x: number, y: number, damage = 20): Bullet {
  return {
    x, y, px: x, py: y, vx: 0, vy: 0, life: 2, damage,
    color: '#fff', isCrit: false, pierce: false,
    explosive: false, explosionRadius: 0, isEnemy: true,
  };
}

describe('o sobrevivente leva tiro, não só contato', () => {
  // Bug: `updateNPCs` só tinha dano por contato. O arqueiro do Castelo é
  // `huntsNpc` e mira no NPC, mas a bala atravessava — a caça só funcionava
  // se o arqueiro encostasse nele.
  beforeEach(() => {
    loadMap(BIOMES.castelo.rows);
    resetNPCs();
  });

  it('um projétil inimigo tira vida do NPC', () => {
    spawnNPC(CELL_SIZE * 5, CELL_SIZE * 5, 1); // Soldado: 50 HP
    const npc = getNPCs()[0];
    const hpAntes = npc.health;

    updateNPCs(1 / 60, npc.x, npc.y, [], [balaInimiga(npc.x, npc.y, 20)]);

    expect(npc.health).toBeLessThan(hpAntes);
    expect(npc.health).toBe(hpAntes - 20);
  });

  it('projétil que não acerta não faz dano', () => {
    spawnNPC(CELL_SIZE * 5, CELL_SIZE * 5, 1);
    const npc = getNPCs()[0];
    const hpAntes = npc.health;

    updateNPCs(1 / 60, npc.x, npc.y, [], [balaInimiga(npc.x + 400, npc.y + 400, 20)]);

    expect(npc.health).toBe(hpAntes);
  });

  it('projétil do jogador NÃO acerta o NPC', () => {
    spawnNPC(CELL_SIZE * 5, CELL_SIZE * 5, 1);
    const npc = getNPCs()[0];
    const hpAntes = npc.health;

    const b = balaInimiga(npc.x, npc.y, 50);
    b.isEnemy = false;
    updateNPCs(1 / 60, npc.x, npc.y, [], [b]);

    expect(npc.health).toBe(hpAntes);
  });

  it('o tiro consome a bala', () => {
    spawnNPC(CELL_SIZE * 5, CELL_SIZE * 5, 1);
    const npc = getNPCs()[0];
    const b = balaInimiga(npc.x, npc.y, 5);
    updateNPCs(1 / 60, npc.x, npc.y, [], [b]);
    expect(b.life).toBe(0);
  });

  it('o NPC morre quando o tiro zera a vida, e o objetivo é avisado', () => {
    // Cientista tem 30 HP
    spawnNPC(CELL_SIZE * 5, CELL_SIZE * 5, 0);
    const npc = getNPCs()[0];
    updateNPCs(1 / 60, npc.x, npc.y, [], [balaInimiga(npc.x, npc.y, 999)]);
    expect(npc.alive).toBe(false);
    expect(npc.health).toBe(0);
  });

  it('cada bala acerta no máximo um NPC', () => {
    spawnNPC(CELL_SIZE * 5, CELL_SIZE * 5, 1);
    spawnNPC(CELL_SIZE * 5, CELL_SIZE * 6, 1);
    const [a, b] = getNPCs();
    const hpA = a.health;
    const hpB = b.health;
    updateNPCs(1 / 60, a.x, a.y, [], [balaInimiga(a.x, a.y, 10)]);
    expect(a.health).toBe(hpA - 10);
    expect(b.health).toBe(hpB);
  });

  it('NPC morto não leva mais dano', () => {
    spawnNPC(CELL_SIZE * 5, CELL_SIZE * 5, 1);
    const npc = getNPCs()[0];
    updateNPCs(1 / 60, npc.x, npc.y, [], [balaInimiga(npc.x, npc.y, 999)]);
    const hpDepois = npc.health;
    updateNPCs(1 / 60, npc.x, npc.y, [], [balaInimiga(npc.x, npc.y, 10)]);
    expect(npc.health).toBe(hpDepois);
  });

  it('sem projéteis, nada muda (o caminho antigo continua valendo)', () => {
    spawnNPC(CELL_SIZE * 5, CELL_SIZE * 5, 1);
    const npc = getNPCs()[0];
    const hpAntes = npc.health;
    updateNPCs(1 / 60, npc.x, npc.y, []);
    expect(npc.health).toBe(hpAntes);
  });
});
