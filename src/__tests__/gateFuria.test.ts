/**
 * O gate da fúria no sorteio de power-up — M2, relato 2026-10-14:
 * "gate da fúria no spawn do powerup".
 *
 * A fúria é SEGREDO de história (H2): a tecla E só existe depois da Fábrica
 * do Rogério. Mas a gema "F" com o rótulo FÚRIA dropava de inimigo comum e
 * era vendida na loja desde a fase 1 — o segredo vazava pelo chão. O gate
 * tem que fechar os TRÊS sorteios (comum, chefe e estoque) até o desbloqueio.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

vi.mock('../systems/audio', () => {
  const noop = () => {};
  return { sfxBuy: noop, sfxError: noop };
});

import { spawnPowerUp, spawnPowerUpDeChefe, powerups, resetPowerUps } from '../powerups';
import { resetFuria, desbloquearFuria } from '../systems/skills';
import { getShopStock, resetShop, setShopCoins } from '../ui/shop';

/** LCG determinístico (DECISIONS #109): probabilidade pede semente fixa. */
function travarRandomEmCiclo(): () => void {
  let semente = 123456789;
  const real = Math.random;
  Math.random = () => {
    semente = (semente * 1103515245 + 12345) % 2147483648;
    return semente / 2147483648;
  };
  return () => { Math.random = real; };
}

function tiposQueCairam(spawner: () => void, rodadas: number): Set<string> {
  const vistos = new Set<string>();
  for (let i = 0; i < rodadas; i++) {
    spawner();
    for (const p of powerups) vistos.add(p.type);
  }
  return vistos;
}

describe('gate da fúria: a gema F não existe antes da Fábrica', () => {
  let restaurar: () => void;

  beforeEach(() => {
    resetPowerUps();
    resetFuria();
    restaurar = travarRandomEmCiclo();
  });
  afterEach(() => restaurar());

  it('enquanto travada, NENHUM drop comum sorteia fúria — e o resto continua caindo', () => {
    const vistos = tiposQueCairam(() => spawnPowerUp(100, 100), 400);
    expect(vistos.has('furia')).toBe(false);
    // o gate não pode esvaziar o sorteio: as outras gemas seguem existindo
    expect(vistos.size).toBeGreaterThan(4);
    expect(vistos.has('invincible')).toBe(false); // SEM_SORTEIO segue valendo
    expect(vistos.has('trajeNucleo')).toBe(false);
  });

  it('depois da Fábrica, a gema FÚRIA volta ao sorteio comum', () => {
    desbloquearFuria();
    const vistos = tiposQueCairam(() => spawnPowerUp(100, 100), 400);
    expect(vistos.has('furia')).toBe(true);
  });

  it('o drop de CHEFE respeita o mesmo gate (e segue podendo dar invincible)', () => {
    const vistos = tiposQueCairam(() => spawnPowerUpDeChefe(100, 100), 400);
    expect(vistos.has('furia')).toBe(false);
    expect(vistos.has('invincible')).toBe(true); // a recompensa do chefe segue íntegra
  });

  it('o ESTOQUE da loja não vende a gema FÚRIA enquanto ela é segredo', () => {
    for (let visita = 0; visita < 60; visita++) {
      resetShop();
      setShopCoins(0); // a prova não compra, só observa o estoque
      const estoque = getShopStock().powerups.map(p => p.type);
      expect(estoque, `visita ${visita} vendeu a gema do segredo`).not.toContain('furia');
    }
  });

  it('depois da Fábrica, a loja volta a vender a gema FÚRIA', () => {
    desbloquearFuria();
    let viFuria = false;
    for (let visita = 0; visita < 200 && !viFuria; visita++) {
      resetShop();
      viFuria = getShopStock().powerups.some(p => p.type === 'furia');
    }
    expect(viFuria).toBe(true);
  });
});
