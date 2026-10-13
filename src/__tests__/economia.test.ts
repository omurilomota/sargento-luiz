/**
 * O teste de economia — o ÁRBITRO (FUTURO §"a mesa de discussão" nº 2).
 *
 * A pergunta aberta era: "qual é a renda-alvo por fase (moedas ganhas ×
 * custo do que a loja oferece × valor do XP)?" — e a resposta é um
 * CONTRATO medido, não um palpite. O modelo é determinístico de `config`:
 * o valor esperado da renda de abate de cada fase (cota de onda × coinDrop
 * médio dos tipos, mutante com cota própria, chefe no fim) contra os
 * custos das pias da loja (escada de perks, serviços).
 *
 * Fases 0..7: a economia é o que a loja consome, e a última loja fica
 * ANTES do NÚCLEO-CENTRAL — a fase 9 não tem onda comum nem loja depois,
 * fica fora do modelo por construção.
 */
import { describe, it, expect } from 'vitest';
import { PHASES, ENEMY_TYPES, NUCLEO_RUSH, WEAPONS } from '../config';
import { WAVE_BASE_ENEMIES, WAVE_ENEMIES_PER_LEVEL } from '../core/constants';
import { PERK_LADDER } from '../systems/perks';
import { getNextAdReward } from '../systems/ads';
import { Phase } from '../types';

/** Renda esperada de abate de uma fase (valor médio, determinístico). */
function rendaDeAbate(phase: Phase): number {
  const naoMutantes = phase.enemyTypes.filter(t => !ENEMY_TYPES[t]?.isMutant);
  const mediaTipos = naoMutantes.reduce((s, t) => s + (ENEMY_TYPES[t]?.coinDrop ?? 0), 0) / naoMutantes.length;
  const dropMutante = ENEMY_TYPES['mutante']?.coinDrop ?? 0;
  let total = 0;
  for (let wave = 0; wave < phase.waves; wave++) {
    const comuns = WAVE_BASE_ENEMIES + wave * WAVE_ENEMIES_PER_LEVEL;
    const mutantes = Math.min(phase.mutantsPerWave ?? 0, Math.floor(comuns / 2));
    total += comuns * mediaTipos + mutantes * dropMutante;
  }
  total += ENEMY_TYPES[phase.boss ?? '']?.coinDrop ?? 0;
  return Math.floor(total * 0.6);
}

const FASES_COM_LOJA = PHASES.slice(0, PHASES.length - 1);
const rendaTotal = FASES_COM_LOJA.reduce((s, f) => s + rendaDeAbate(f), 0);
const custoEscada = PERK_LADDER.reduce((s, p) => s + p.price, 0);
const armaMaisCara = Math.max(...WEAPONS.map(w => w.price));
const resgatePorFase = 2 * getNextAdReward();

describe('economia: o árbitro da loja × progressão', () => {
  it('o modelo conhece as 8 fases com loja e a fila do rush', () => {
    expect(FASES_COM_LOJA).toHaveLength(8);
    expect(NUCLEO_RUSH).toHaveLength(4);
  });

  it('a escada de perks é alvo de VÁRIAS campanhas: custa 2,5× a 4,5× a renda de abate', () => {
    console.log(`renda de abate (fases 0..7): ${rendaTotal}`);
    console.log(`escada de perks completa: ${custoEscada}`);
    console.log(`arma mais cara: ${armaMaisCara}`);
    const razao = custoEscada / rendaTotal;
    console.log(`escada / renda = ${(razao * 100).toFixed(0)}%`);
    // Roguelite por projeto: o save CONTINUA os degraus entre partidas
    // (restoreUpgrades), então a escada é o alvo de várias runs — a run
    // nova compra ~1/3 dela. Abaixo de 2,5× a loja deixa de ser decisão
    // (era a queixa antiga: "a renda da fase 4 já comprava tudo"); acima
    // de 4,5× os 4 especiais nunca parecem alcançáveis.
    expect(razao).toBeGreaterThan(2.5);
    expect(razao).toBeLessThan(4.5);
  });

  it('cada fase paga pelo menos o PRIMEIRO degrau da escada', () => {
    const primeiroDegrau = PERK_LADDER[0].price;
    for (const fase of FASES_COM_LOJA) {
      const renda = rendaDeAbate(fase);
      console.log(`${fase.name}: renda ${renda} + resgates ${resgatePorFase}`);
      expect(renda + resgatePorFase, `${fase.name} não paga nem 1 degrau`).toBeGreaterThanOrEqual(primeiroDegrau);
    }
  });

  it('o resgate de moedas é renda secundária: no máximo 25% da renda de abate média', () => {
    const media = rendaTotal / FASES_COM_LOJA.length;
    console.log(`resgates por fase: ${resgatePorFase} / média de abate: ${media.toFixed(0)}`);
    // A guarda do Sprint 0 (teto de 2 por fase) é o que permite o T5 subir
    // o valor por resgate sem reabrir a faucet: o limite é o RÁCIO, não o
    // número absoluto.
    expect(resgatePorFase / media).toBeLessThan(0.25);
  });
});
