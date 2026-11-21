/**
 * A AMBIÊNCIA (M1): o agendador de one-shots por fase. Os contratos que
 * podem calar o sistema em silêncio — e por isso são os que valem:
 *
 * 1. TODO nome de fase na tabela EXISTE em PHASES (typo = a fase fica
 *    muda para sempre e ninguém vê o porquê);
 * 2. TODA chave agendada existe em SFX_FILES (chave sem arquivo =
 *    playSfxFile devolve false quietinho — o mesmo silêncio);
 * 3. o relógio dispara dentro da janela e re-arma (o lugar respira).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { resetAmbiente, updateAmbiente, agendaAmbiente, AMBIENTE_POR_FASE } from '../systems/ambiente';
import { PHASES } from '../config';
import { SFX_FILES } from '../systems/audio';

describe('ambiente: a tabela não mente', () => {
  it('todo nome de fase na tabela existe em PHASES (typo cala a fase)', () => {
    const nomes = new Set(PHASES.map(p => p.name));
    const armadas = Object.keys(AMBIENTE_POR_FASE);
    for (const nome of armadas) {
      expect(nomes.has(nome), `a fase "${nome}" da ambiência não existe em PHASES`).toBe(true);
    }
  });

  it('toda chave agendada existe em SFX_FILES (chave sem arquivo é silêncio)', () => {
    for (const [nome, sons] of Object.entries(AMBIENTE_POR_FASE)) {
      for (const som of sons) {
        expect(SFX_FILES[som.chave], `${nome} agenda "${som.chave}" sem arquivo em SFX_FILES`).toBeDefined();
      }
    }
  });
});

describe('ambiente: o relógio do lugar', () => {
  beforeEach(() => resetAmbiente('Porto'));

  it('a fase arma os sons dela — o Porto é gaivota e água', () => {
    const chaves = agendaAmbiente().map(a => a.chave).sort();
    expect(chaves).toEqual(['agua_cais', 'gaivota']);
  });

  it('o primeiro disparo vem na janela curta (a ambiência é primeira impressão)', () => {
    for (const a of agendaAmbiente()) {
      expect(a.resta).toBeLessThanOrEqual(7); // min/2..min do gaivota = 3.5..7
      expect(a.resta).toBeGreaterThan(0);
    }
  });

  it('dispara e re-arma dentro da janela declarada', () => {
    // consome até o GAIVOTA disparar (a água tem janela mais curta e
    // dispara antes — o contrato aqui é a janela do gaivota: 7-20s)
    let disparouGaivota = false;
    for (let i = 0; i < 20000 && !disparouGaivota; i++) {
      disparouGaivota = updateAmbiente(0.016).includes('gaivota');
    }
    expect(disparouGaivota).toBe(true);
    const gaivota = agendaAmbiente().find(a => a.chave === 'gaivota')!;
    expect(gaivota.resta).toBeLessThanOrEqual(20);
    expect(gaivota.resta).toBeGreaterThanOrEqual(6.9); // 7 com folga de 0.1
  });

  it('fase sem entrada fica em silêncio — o Hospital não tem mar nem caverna', () => {
    resetAmbiente('Hospital de Campanha');
    expect(agendaAmbiente()).toEqual([]);
    expect(updateAmbiente(999)).toEqual([]);
  });

  it('a fase nova substitui a agenda velha (sem vazamento entre fases)', () => {
    resetAmbiente('Espaço');
    const chaves = agendaAmbiente().map(a => a.chave).sort();
    expect(chaves).toEqual(['alarme_estacao', 'drone_vazio']);
  });
});
