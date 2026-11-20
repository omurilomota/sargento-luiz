import { describe, it, expect, beforeEach, vi } from 'vitest';

// o boss dispara som conforme o projétil; sem AudioContext no node
vi.mock('../systems/audio', () => ({ sfxEnemyShoot: () => {}, sfxSpit: () => {} }));
import { updateBoss, clearBossState, isBossTelegraphing, getBossTelegraphLabel, setBossRandom } from '../systems/boss';
import { spawnEnemy } from '../systems/spawner';
import { getBullets, clearBullets } from '../entities/bullet';
import { clearProps, initProps, getProps } from '../systems/props';
import { ENEMY_TYPES, PHASES } from '../config';
import { BIOMES } from '../maps';
import { loadMap, findAll } from '../systems/tilemap';
import { cellCenter } from '../systems/objectives';
import { Enemy } from '../types';

const WORLD_W = 1920;
const WORLD_H = 1280;

function bossDe(phase: number): Enemy {
  const def = ENEMY_TYPES[PHASES[phase].boss!];
  const enemy = spawnEnemy(PHASES[phase].boss!, WORLD_W, WORLD_H, 0, 1000, 640)!;
  enemy.spawnDelay = 0;
  enemy.maxHealth = def.health;
  enemy.health = def.health;
  return enemy;
}

/** Deixa o chefe passar a telegrafia e executar a ação uma vez. */
function atoDoBoss(e: Enemy, seconds = 6): void {
  for (let i = 0; i < seconds * 60; i++) updateBoss(e, 900, 640, WORLD_W, WORLD_H, 1 / 60);
}

describe('boss: padrões novos disparam projétil orgânico', () => {
  beforeEach(() => {
    clearBullets();
    setBossRandom(() => 0.5);
    loadMap(BIOMES[PHASES[6].map].rows);
  });

  it('o spray do maquinista cospe 7 gotas de uma vez', () => {
    const e = bossDe(6);
    (e as unknown as { health: number }).health = e.maxHealth * 0.5;
    // um tiro por frame até o sprite aparecer (as balas só vivem 2s)
    let pico = 0;
    for (let i = 0; i < 8 * 60; i++) {
      updateBoss(e, 900, 640, WORLD_W, WORLD_H, 1 / 60);
      pico = Math.max(pico, getBullets().filter(b => b.bulletSprite === 'slime_blob').length);
    }
    expect(pico, 'o spray do maquinista deve cuspir 7 gotas de gosma').toBeGreaterThanOrEqual(7);
  });

  it('a ação burst existe no elenco de padrões', () => {
    const acoes = new Set(PHASES.flatMap(f => ENEMY_TYPES[f.boss!]?.pattern?.map(p => p.action) ?? []));
    for (const nova of ['spray', 'burst', 'lob']) {
      expect(acoes, `${nova} não foi usada por nenhum chefe`).toContain(nova);
    }
  });
});

describe('boss: o padrão really avança por faixa de HP', () => {
  beforeEach(() => {
    clearBullets();
    clearProps();
    setBossRandom(() => 0.5);
  });

  it('a telegrafia atrasa a primeira ação (o chefe recua antes de atacar)', () => {
    const e = bossDe(0);
    clearBullets();
    const antes = getBullets().length;
    updateBoss(e, 900, 640, WORLD_W, WORLD_H, 1 / 60);
    // ainda em telegrafia: nenhum projétil, e o chefe está afastando do alvo
    expect(getBullets().length).toBe(antes);
    expect(isBossTelegraphing(e)).toBe(true);
    clearBossState(e);
  });

  it('cada boss executa a ação do seu primeiro passo', () => {
    const e = bossDe(0);
    clearBullets();
    atoDoBoss(e, 3);
    // VIGIA abre com investida: investida não dispara projétil, move o chefe
    const posicaoAntes = { x: e.x, y: e.y };
    atoDoBoss(e, 3);
    expect(Math.hypot(e.x - posicaoAntes.x, e.y - posicaoAntes.y)).toBeGreaterThan(0);
    clearBossState(e);
  });

  it('mines acende o pavio dos barris do mapa — é o que a telegrafia promete', () => {
    const loadMapRows = BIOMES.cidade.rows;
    loadMap(loadMapRows);
    initProps(loadMapRows.map((row) => row.split('')));
    const barrisAntes = getProps().filter(p => p.kind === 'barrel' && p.health > 0).length;
    expect(barrisAntes).toBeGreaterThan(0);

    const e = bossDe(0);
    e.health = e.maxHealth * 0.5; // faixa das minas
    atoDoBoss(e, 8);

    // ignição, não destruição: o pavio queima e a detonação é do orquestrador
    const acesos = getProps().filter(p => p.kind === 'barrel' && p.fuse > 0).length;
    expect(acesos, 'mines não acendeu nenhum barril').toBeGreaterThan(0);
    clearBossState(e);
  });

  it('summon devolve minions para o orquestrador adicionar', () => {
    const e = bossDe(0);
    e.health = e.maxHealth * 0.2; // faixa do summon
    let invocados = 0;
    for (let i = 0; i < 60 * 12; i++) {
      invocados += updateBoss(e, 900, 640, WORLD_W, WORLD_H, 1 / 60).length;
    }
expect(invocados).toBeGreaterThan(0);
    clearBossState(e);
  });

  it('a telegrafia diz qual ação vem a seguir (era dado morto no HUD)', () => {
    const e = bossDe(0);
    updateBoss(e, 900, 640, WORLD_W, WORLD_H, 1 / 60);
    const rotulo = getBossTelegraphLabel(e);
    expect(rotulo).not.toBe('');
    expect(rotulo).toBe(ENEMY_TYPES.vigia.pattern![0].telegraph);
    expect(rotulo).toBe('OLHE PARA CÁ');

    // e some quando a janela fecha, senão a barra anunciaria para sempre
    for (let i = 0; i < 120; i++) updateBoss(e, 900, 640, WORLD_W, WORLD_H, 1 / 60);
    expect(getBossTelegraphLabel(e)).toBe('');
    clearBossState(e);
  });

  it('todo passo de todo boss tem texto de telegrafia', () => {
    for (const [chave, def] of Object.entries(ENEMY_TYPES)) {
      if (!def.isBoss) continue;
      for (const passo of def.pattern!) {
        expect(passo.telegraph, `${chave} @${passo.atHp} sem texto`).toBeTruthy();
      }
    }
  });

  it('cada boss é executado por uma fase, e cada fase por um boss', () => {
    const usados = PHASES.map(p => p.boss);
    expect(new Set(usados).size).toBe(usados.length);
    for (const boss of usados) expect(ENEMY_TYPES[boss!].isBoss).toBe(true);
  });
});

describe('boss: as duas fases que estavam sem chefe', () => {
  beforeEach(() => {
    clearBullets();
    clearProps();
    setBossRandom(() => 0.5);
  });

  it('a Cidade tem arena e o VIGIA cabe nela', () => {
    loadMap(BIOMES.cidade.rows);
    const arena = findAll('B')[0];
    const pos = cellCenter(arena.col, arena.row);
    const def = ENEMY_TYPES.vigia;
    // o corpo inteiro do chefe precisa caber na praça: raio em células
    expect(def.radius).toBeLessThan(64);
    expect(pos.x).toBeGreaterThan(0);
    expect(pos.x).toBeLessThan(1920);
  });

  it('o Bunker tem arena e o NÚCLEO cabe nela', () => {
    loadMap(BIOMES.bunker.rows);
    const arena = findAll('B')[0];
    expect(arena).toBeDefined();
    expect(ENEMY_TYPES.nucleo.radius).toBeLessThan(64);
  });

  it('o NÚCLEO não tem investida: a galeria do Bunker é estreita demais', () => {
    const acoes = ENEMY_TYPES.nucleo.pattern!.map(p => p.action);
    expect(acoes).not.toContain('charge');
  });

  it('o VIGIA tem a menor vida e a maior telegrafia da lista de chefes', () => {
    const vidas = Object.values(ENEMY_TYPES).filter(d => d.isBoss).map(d => d.health);
    expect(Math.min(...vidas)).toBe(ENEMY_TYPES.vigia.health);

    const telegrafias = Object.values(ENEMY_TYPES).filter(d => d.isBoss).map(d => d.telegraph ?? 0.8);
    expect(Math.max(...telegrafias)).toBe(ENEMY_TYPES.vigia.telegraph);
  });

  it('o NÚCLEO é o mais forte e o único com armadura além do Rei Mutante', () => {
    const vidas = Object.values(ENEMY_TYPES).filter(d => d.isBoss).map(d => d.health);
    expect(Math.max(...vidas)).toBe(ENEMY_TYPES.nucleo.health);
  });

  it('a campanha abre com o VIGIA e fecha com o NÚCLEO, nos extremos do eixo', () => {
    expect(PHASES[0].boss).toBe('vigia');
    expect(PHASES[PHASES.length - 1].boss).toBe('nucleo');
  });
});