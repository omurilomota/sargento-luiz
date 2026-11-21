/**
 * O TORNADO (M1, relato 2026-10-14: "visual + som + empurrão em jogador e
 * zumbi") — os contratos que dão para provar em Node:
 *
 * 1. o EMPURRÃO é a assinatura do evento: força que cai linearmente até
 *    zero no raio, sempre PARA LONGE do centro — puro (empurraDoTornado);
 * 2. a permissão é do bioma: o tornado só acorda na Cidade (debris) — o
 *    PRÓLOGO já fecha o céu "do lado do mar" e é lá que a promete cumpre.
 *
 * A dinâmica em jogo (vórtice andando, jogador deslocando, inimigos
 * voando) é a prova de navegador `m1-tornado-proof.mjs`.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../systems/audio', () => ({ sfxTornado: () => {} }));

import {
  empurraDoTornado, forcarEventoAmbiente, tornadoNoAr,
  updateEnvironmentEvents, resetEnvironmentEvents, TORNADO_RAIO, TORNADO_EMPURRAO,
} from '../systems/environment';

describe('tornado: o empurrão é a assinatura', () => {
  it('no centro do vórtice a força é máxima e para FORA do centro', () => {
    const emp = empurraDoTornado(10, 0);
    expect(emp.x).toBeGreaterThan(100);
    expect(emp.y).toBe(0);
  });

  it('cai linearmente até zero exatamente no raio', () => {
    const naBorda = empurraDoTornado(TORNADO_RAIO, 0);
    expect(naBorda).toEqual({ x: 0, y: 0 });
    const quase = empurraDoTornado(TORNADO_RAIO - 1, 0);
    expect(quase.x).toBeGreaterThan(0);
    expect(quase.x).toBeLessThan(TORNADO_EMPURRAO / TORNADO_RAIO + 1);
  });

  it('fora do raio não empurra nada', () => {
    expect(empurraDoTornado(TORNADO_RAIO + 1, 0)).toEqual({ x: 0, y: 0 });
  });

  it('a direção é sempre radial: quem está a noroeste voa pra noroeste', () => {
    const emp = empurraDoTornado(-100, -100);
    expect(emp.x).toBeLessThan(0);
    expect(emp.y).toBeLessThan(0);
  });
});

describe('tornado: a permissão é da Cidade', () => {
  beforeEach(() => resetEnvironmentEvents());

  it('forçado com hazard debris, o evento acorda; na fase sem evento, nem isso', () => {
    expect(forcarEventoAmbiente('tornado', 500, 500)).toBe(true);
    expect(tornadoNoAr()).toBe(true);
    // o update mantém vivo com o hazard certo...
    const r1 = updateEnvironmentEvents(0.1, [], 0, 0, 1000, 1000, 'debris');
    expect(tornadoNoAr()).toBe(true);
    expect(r1.playerPush).toBeDefined();
    // ...e MATA na hora em que o bioma não permite o evento
    updateEnvironmentEvents(0.1, [], 0, 0, 1000, 1000, 'none');
    expect(tornadoNoAr()).toBe(false);
  });

  it('o empurrão do jogador vem no resultado do update (o canal novo)', () => {
    // tornado em cima do jogador: 480 px/s radiais
    forcarEventoAmbiente('tornado', 400, 400);
    const antes = { x: 400, y: 400 };
    const r = updateEnvironmentEvents(0.5, [], antes.x, antes.y, 1920, 1280, 'debris');
    const deslocou = Math.hypot(r.playerPush.x, r.playerPush.y);
    expect(deslocadoMaiorQueZero(deslocou)).toBe(true);
    // meio segundo perto do centro: ~100px de empurrão (480 × 0,5 × fator)
    expect(deslocou).toBeGreaterThan(50);
  });
});

function deslocadoMaiorQueZero(v: number): boolean { return v > 0; }
