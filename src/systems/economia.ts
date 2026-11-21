/**
 * O modelo da economia — a fonte única do ÁRBITRO.
 *
 * Nasceu no teste (economia.test) e viveu lá; a medição em navegador (M3:
 * "economia medida contra o modelo do árbitro") precisou dele fora do
 * ambiente de teste — duplicar a fórmula no bridge seria o drift que já
 * custou bugs de geometria (getShopLayout é o precedente: draw e hit-test
 * na MESMA fonte). O teste importa daqui; o bridge expõe; a fórmula é uma.
 *
 * As torneiras que o modelo antigo não via (achado da medição M3, 2026-10-16):
 * - o TITÃ (T1, 2026-10-13): a partir da segunda onda, exatamente 1 por
 *   onda paga 3× moedas — o modelo antigo não contava ele;
 * - a COLETA da Fábrica (H2, 2026-10-14): moedas ×1,5 na fase inteira.
 * Os dois entraram no jogo DEPOIS do árbitro (2026-10-13) e a renda real
 * foi ficando ~40% acima do modelo sem ninguém ver.
 */
import { ENEMY_TYPES } from '../config';
import { Phase } from '../types';
import { WAVE_BASE_ENEMIES, WAVE_ENEMIES_PER_LEVEL } from '../core/constants';

/**
 * Renda esperada de abate de uma fase (valor médio, determinístico).
 *
 * O ×0,6 acompanha o `spawnCoins` do killEnemy: `floor(coinDrop × mult × 0,6)`
 * — a moeda que nasce no chão, não a do contador imaginário.
 */
export function rendaDeAbate(phase: Phase): number {
  const naoMutantes = phase.enemyTypes.filter(t => !ENEMY_TYPES[t]?.isMutant);
  const mediaTipos = naoMutantes.reduce((s, t) => s + (ENEMY_TYPES[t]?.coinDrop ?? 0), 0) / naoMutantes.length;
  const dropMutante = ENEMY_TYPES['mutante']?.coinDrop ?? 0;
  const coleta = phase.coleta ? 1.5 : 1;
  let total = 0;
  for (let wave = 0; wave < phase.waves; wave++) {
    const comuns = WAVE_BASE_ENEMIES + wave * WAVE_ENEMIES_PER_LEVEL;
    const mutantes = Math.min(phase.mutantsPerWave ?? 0, Math.floor(comuns / 2));
    total += comuns * mediaTipos + mutantes * dropMutante;
    // o titã é UM dos comuns que nasce grande e paga 3×: o extra é 2× o
    // drop do comum que ele substituiria
    if (wave >= 1) total += 2 * mediaTipos;
  }
  total += ENEMY_TYPES[phase.boss ?? '']?.coinDrop ?? 0;
  return Math.floor(total * 0.6 * coleta);
}
