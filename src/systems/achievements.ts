/**
 * Sistema de achievements/badges.
 * Desbloqueia conquistas baseado em ações do jogador.
 */

/** Definição de um achievement */
export interface Achievement {
  /** ID único */
  id: string;
  /** Nome exibido */
  name: string;
  /** Descrição */
  desc: string;
  /** Se foi desbloqueado */
  unlocked: boolean;
}

import { ObjectiveKind } from '../types';
import { sfxAchievement } from './audio';

/**
 * Conquistas. Exportada para o teste poder resetar o estado.
 *
 * Nenhum `id` muda: eles são a chave do save e o gatilho em `checkAchievements`.
 * As descrições dizem só o que o gatilho realmente mede — uma conquista que
 * promete "sem recarregar uma vez" e entrega "chegue à onda 20" é mentira na
 * tela de quem joga.
 */
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_kill', name: 'Primeiro Abate', desc: 'Mate seu primeiro inimigo', unlocked: false },
  { id: 'wave_5', name: 'Sobrevivente', desc: 'Alcance a onda 5', unlocked: false },
  { id: 'wave_10', name: 'Veterano', desc: 'Alcance a onda 10', unlocked: false },
  { id: 'wave_20', name: 'Vinte Ondas', desc: 'Alcance a onda 20', unlocked: false },
  { id: 'kill_100', name: 'Matador', desc: 'Mate 100 inimigos numa partida', unlocked: false },
  { id: 'kill_500', name: 'Exterminador', desc: 'Mate 500 inimigos numa partida', unlocked: false },
  { id: 'score_5000', name: 'Rico', desc: 'Alcance 5000 pontos', unlocked: false },
  { id: 'score_20000', name: 'Milionário', desc: 'Alcance 20000 pontos', unlocked: false },
  { id: 'no_damage_wave', name: 'Onda Limpa', desc: 'Complete uma onda inteira sem tomar dano', unlocked: false },
  { id: 'boss_kill', name: 'Caçador de Chefes', desc: 'Derrote seu primeiro chefe', unlocked: false },
  { id: 'all_weapons', name: 'Colecionador', desc: 'Compre todas as armas', unlocked: false },
  { id: 'combo_10', name: 'Em Combinação', desc: 'Alcance combo x10', unlocked: false },
  { id: 'combo_25', name: 'Imparável', desc: 'Alcance combo x25', unlocked: false },

  // ── lotes 2 e 3 ──
  // Nenhum exige tracking próprio: reusam gatilho e contador que já existem.
  { id: 'kill_1000', name: 'Ceifeiro', desc: 'Mate 1000 inimigos numa partida', unlocked: false },
  { id: 'score_50000', name: 'Fortuna', desc: 'Alcance 50000 pontos', unlocked: false },
  { id: 'boss_5', name: 'Caçador de Titãs', desc: 'Derrote 5 chefes numa partida', unlocked: false },
  { id: 'all_bosses', name: 'Nove Coroas', desc: 'Derrote os 9 chefes numa partida', unlocked: false },
  { id: 'chain_3', name: 'Dominó', desc: 'Derrube 3 caixotes e barris numa explosão só', unlocked: false },
  { id: 'chain_5', name: 'Cascata', desc: 'Derrube 5 caixotes e barris numa explosão só', unlocked: false },
  { id: 'vip_saved', name: 'Escolta', desc: 'Conclua uma fase de proteção com o alvo de pé', unlocked: false },
  { id: 'vip_lost', name: 'Escolta Perdida', desc: 'Deixe cair o alvo numa fase de proteção', unlocked: false },
  { id: 'all_objectives', name: 'Seis Jeitos', desc: 'Conclua uma fase de cada objetivo: limpar, destruir, sobreviver, proteger, chegar e coletar', unlocked: false },
  { id: 'medkit_5', name: 'Primeiros Socorros', desc: 'Use 5 medkits no total', unlocked: false },
  { id: 'medkit_20', name: 'Posto Avançado', desc: 'Use 20 medkits no total', unlocked: false },
  { id: 'chacina', name: 'Chacina', desc: 'Dispare a câmera lenta com 3 ou mais abates em 2 segundos', unlocked: false },
  // M5 (relato de 2026-10-14): a leva pedida — arma, fase limpa, rasante,
  // barril e o traje da fase final.
  { id: 'weapon_10', name: 'Pistoleiro Leal', desc: 'Derrube 10 inimigos com a mesma arma numa partida', unlocked: false },
  { id: 'weapon_50', name: 'Uma Arma Só', desc: 'Derrube 50 inimigos com a mesma arma numa partida', unlocked: false },
  { id: 'no_damage_phase', name: 'Intocável', desc: 'Feche uma fase inteira sem tomar dano', unlocked: false },
  { id: 'graze_20', name: 'Rasante', desc: 'Deixe 20 projéteis inimigos passar rente sem ser tocado', unlocked: false },
  { id: 'barrel_10', name: 'Pirotecnista', desc: 'Derrube 10 inimigos com explosões de barril numa partida', unlocked: false },
  { id: 'traje', name: 'Traje de Contenção', desc: 'Vista o traje que espera na porta do NÚCLEO', unlocked: false },
];

const STORAGE_KEY = 'luiz.achievements';

/** Contadores temporários da partida */
let killsThisRun = 0;
let waveDamageTaken = false;
let bossesThisRun = 0;
let objetivosVistos = new Set<string>();
let medkitsUsados = 0;
// M5: abates por ARMA (índice da arma → abates na partida), rasantes, mortes
// por barril e o flag de dano por FASE (o da onda já existia).
let abatesPorArma = new Map<number, number>();
let rasantesThisRun = 0;
let mortesPorBarril = 0;
let phaseDamageTaken = false;

/**
 * Carrega achievements salvos.
 */
export function loadAchievements(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as string[];
      if (!Array.isArray(saved)) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      for (const a of ACHIEVEMENTS) {
        a.unlocked = saved.includes(a.id);
      }
    }
  } catch {
    // Conquistas corrompidas: apagar ou o jogador perde as conquistas em
    // silêncio toda partida. Mesma correção do saveSystem/diary.
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Salva achievements no localStorage.
 */
function saveAchievements(): void {
  try {
    const ids = ACHIEVEMENTS.filter(a => a.unlocked).map(a => a.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

/**
 * Verifica e desbloqueia achievements.
 * Chamar a cada evento relevante.
 */
function unlockById(id: string): { id: string; name: string } | null {
  const a = ACHIEVEMENTS.find(a => a.id === id);
  if (a && !a.unlocked) {
    a.unlocked = true;
    saveAchievements();
    sfxAchievement();
    return { id: a.id, name: a.name };
  }
  return null;
}

export function checkAchievements(event: string, value?: number): { id: string; name: string } | null {
  const unlock = unlockById;

  switch (event) {
    case 'kill':
      killsThisRun++;
      if (killsThisRun >= 100) unlock('kill_100');
      if (killsThisRun >= 500) unlock('kill_500');
      if (killsThisRun >= 1000) unlock('kill_1000');
      if (killsThisRun === 1) return unlock('first_kill');
      break;
    case 'wave':
      if (value && value >= 5) unlock('wave_5');
      if (value && value >= 10) unlock('wave_10');
      if (value && value >= 20) unlock('wave_20');
      // "Onda Limpa" é por onda: o flag precisa ser limpo em toda onda
      // concluída, não só quando estava limpo — senão levar dano uma vez gruda
      // o flag e a conquista não volta mais no resto da partida.
      const ondaLimpa = !waveDamageTaken;
      waveDamageTaken = false;
      if (ondaLimpa) return unlock('no_damage_wave');
      break;
    case 'damage_taken':
      waveDamageTaken = true;
      phaseDamageTaken = true;
      break;
    case 'phase_start':
      // a fase nova começa limpa — o dano da fase anterior não conta
      phaseDamageTaken = false;
      break;
    case 'phase_end':
      if (!phaseDamageTaken) return unlock('no_damage_phase');
      break;
    case 'weapon_kill':
      if (value === undefined) break;
      abatesPorArma.set(value, (abatesPorArma.get(value) ?? 0) + 1);
      if (abatesPorArma.get(value)! >= 10) unlock('weapon_10');
      if (abatesPorArma.get(value)! >= 50) return unlock('weapon_50');
      break;
    case 'graze':
      rasantesThisRun++;
      if (rasantesThisRun >= 20) return unlock('graze_20');
      break;
    case 'barril':
      mortesPorBarril += value ?? 0;
      if (mortesPorBarril >= 10) return unlock('barrel_10');
      break;
    case 'traje':
      return unlock('traje');
    case 'medkit':
      medkitsUsados++;
      if (medkitsUsados >= 5) unlock('medkit_5');
      if (medkitsUsados >= 20) unlock('medkit_20');
      break;
    case 'chacina':
      return unlock('chacina');
    case 'vip_lost':
      return unlock('vip_lost');
    case 'score':
      if (value && value >= 5000) unlock('score_5000');
      if (value && value >= 20000) unlock('score_20000');
      if (value && value >= 50000) unlock('score_50000');
      break;
    case 'boss_kill':
      bossesThisRun++;
      const bossAch = unlock('boss_kill');
      if (bossesThisRun >= 5) unlock('boss_5');
      if (bossesThisRun >= 9) return unlock('all_bosses');
      return bossAch;
    case 'chain':
      // value = quantos props a explosão derrubou, incluindo o próprio barril
      if (value && value >= 3) unlock('chain_3');
      if (value && value >= 5) unlock('chain_5');
      break;
    case 'combo':
      if (value && value >= 10) unlock('combo_10');
      if (value && value >= 25) unlock('combo_25');
      break;
  }
  return null;
}

/**
 * Conta um objetivo de fase concluído.
 * Função própria em vez de um `value` sobrecarregado: o gatilho leva o
 * ObjectiveKind, que é string, e os gatilhos existentes levam número.
 * @param kind - objetivo da fase, como está em Phase.objective
 */
export function checkObjectiveAchievement(kind: ObjectiveKind): { id: string; name: string } | null {
  objetivosVistos.add(kind);
  // 6, não 5: com a Refinaria em `collect` a campanha tem 6 tipos, e a
  // descrição da conquista promete "uma fase de CADA objetivo" — destravar
  // vendo 5 dos 6 seria mentira para quem nunca encheu um tambor.
  if (objetivosVistos.size >= 6) return unlockById('all_objectives');
  if (kind === 'protect') return unlockById('vip_saved');
  return null;
}

/**
 * Reseta contadores da partida.
 */
export function resetRunCounters(): void {
  killsThisRun = 0;
  waveDamageTaken = false;
  bossesThisRun = 0;
  objetivosVistos = new Set<string>();
  abatesPorArma = new Map<number, number>();
  rasantesThisRun = 0;
  mortesPorBarril = 0;
  phaseDamageTaken = false;
}

/**
 * Retorna todos os achievements.
 */
export function getAllAchievements(): Achievement[] {
  return ACHIEVEMENTS;
}
