/**
 * Os serviços da loja (M3) — o contrato é "quem paga, recebe".
 *
 * A rodada de 2026-10-14 vendeu torreta e botas que não faziam NADA no jogo
 * (a porta nº 5 pega export sem chamador; aqui o que se trava é o caminho
 * COMPLETO de compra → consumo → efeito). O cachorro de guarda ficou fora
 * da loja de propósito: sem arte top-down CC0 o sprite seria perspectiva
 * mista (DECISIONS #214).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// a loja toca sfx a cada compra e não há AudioContext no node (DECISIONS #60)
vi.mock('../systems/audio', () => {
  const noop = () => {};
  return { sfxBuy: noop, sfxError: noop };
});

import {
  SHOP_SERVICES, buyService, consumeShopServices, getShopStock,
  isServiceAvailable, resetShop, setShopCoins, getShopCoins,
} from '../ui/shop';
import { spawnBullet, getBullets, clearBullets } from '../entities/bullet';
import { resetNPCs, spawnNPC, updateNPCs, getTirosDeAliado } from '../systems/npcs';
import { initObjective, vipDown } from '../systems/objectives';
import { loadMap } from '../systems/tilemap';
import { nextPhase, resetPhases } from '../phases';

const IDS = () => SHOP_SERVICES.map(s => s.id);

function aliadoDeTorreta(x: number, y: number) {
  spawnNPC(x, y, 1, 'soldier', {
    modo: 'torreta', nome: 'Torreta', sprite: 'prop_torreta', vida: 150,
    postX: x, postY: y, alcance: 320, dano: 5, intervalo: 0.45, tiroTimer: 0, angulo: 0,
  });
}

describe('serviços da loja: quem paga, recebe', () => {
  beforeEach(() => {
    resetShop();
    setShopCoins(2000);
    // a loja "abre" numa fase: o restock por chave de fase arma os flags de visita
    getShopStock();
  });

  it('o cachorro de guarda e as BOTAS não estão à venda', () => {
    expect(IDS()).not.toContain('pardal');
    // botas fora (playtest 2026-10-16): a velocidade default é a ideal
    expect(IDS()).not.toContain('boot');
    expect(IDS()).toContain('hire');
    expect(IDS()).toContain('turret');
  });

  it('comprar a torreta entrega o serviço para a fase (consume)', () => {
    buyService('turret');
    expect(consumeShopServices()).toEqual(['turret']);
    expect(consumeShopServices()).toEqual([]);
  });

  it('contratado e torreta no mesmo pacote: viajam juntos, na ordem', () => {
    buyService('turret');
    buyService('hire');
    expect(consumeShopServices()).toEqual(['turret', 'hire']);
  });

  it('1× por visita: a segunda compra na mesma loja é recusada e devolve as moedas', () => {
    buyService('turret');
    const antes = getShopCoins();
    buyService('turret');
    expect(getShopCoins()).toBe(antes);
    expect(consumeShopServices()).toEqual(['turret']);
  });

  it('sem moedas não compra: o serviço não sai de graça', () => {
    setShopCoins(0);
    buyService('turret');
    expect(consumeShopServices()).toEqual([]);
    expect(getShopCoins()).toBe(0);
  });

  it('a visita seguinte reabre o serviço: "1× por visita" é da visita, não da campanha', () => {
    buyService('turret');
    expect(isServiceAvailable('turret')).toBe(false);
    nextPhase(); // fase nova → chave de estoque nova → flags de visita zeram
    getShopStock();
    expect(isServiceAvailable('turret')).toBe(true);
  });
});

describe('aliados: nascer, atirar e cair sem reiniciar a fase', () => {
  beforeEach(() => {
    resetNPCs();
    clearBullets();
  });

  it('a torreta atira no inimigo visível e o contador registra', () => {
    aliadoDeTorreta(100, 100);
    const inimigo = [{ x: 200, y: 100, radius: 16, health: 20 }];
    updateNPCs(0.1, 0, 0, inimigo, []);
    expect(getTirosDeAliado()).toBe(1);
    expect(getBullets().some(b => !b.isEnemy && b.damage === 5)).toBe(true);
  });

  it('aliado não atira através de parede (linha de visão)', () => {
    loadMap([
      '############',
      '#......#...#',
      '#......#...#',
      '############',
    ]);
    // torreta na célula (1,1), inimigo na (10,1): a coluna 7 é muro
    aliadoDeTorreta(1 * 64 + 32, 1 * 64 + 32);
    const inimigo = [{ x: 10 * 64 + 32, y: 1 * 64 + 32, radius: 16, health: 20 }];
    updateNPCs(0.1, 0, 0, inimigo, []);
    expect(getTirosDeAliado()).toBe(0);
  });

  it('o contador zera a cada fase (resetNPCs)', () => {
    aliadoDeTorreta(100, 100);
    updateNPCs(0.1, 0, 0, [{ x: 200, y: 100, radius: 16, health: 20 }], []);
    expect(getTirosDeAliado()).toBe(1);
    resetNPCs();
    expect(getTirosDeAliado()).toBe(0);
  });

  it('o contratado morre e NÃO marca o alvo do protect — a fase não reinicia', () => {
    initObjective('clear', 0);
    spawnNPC(100, 100, 1, 'soldier', {
      modo: 'contratado', nome: 'Contratado',
      postX: 100, postY: 100, alcance: 280, dano: 6, intervalo: 0.55, tiroTimer: 0, angulo: 0,
    });
    // projétil INIMIGO letal em cima dele
    spawnBullet(100, 100, 0, 0, 999, true, '#fff', false);
    updateNPCs(0.016, 0, 0, [], getBullets());
    expect(vipDown()).toBe(false);
  });
});
