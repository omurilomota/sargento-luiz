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

/** Lista de achievements. Exportada para o teste poder resetar o estado. */
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_kill', name: 'Primeiro Abate', desc: 'Mate seu primeiro inimigo', unlocked: false },
  { id: 'wave_5', name: 'Sobrevivente', desc: 'Alcance a onda 5', unlocked: false },
  { id: 'wave_10', name: 'Veterano', desc: 'Alcance a onda 10', unlocked: false },
  { id: 'wave_20', name: 'Lenda', desc: 'Alcance a onda 20', unlocked: false },
  { id: 'kill_100', name: 'Matador', desc: 'Mate 100 inimigos em uma partida', unlocked: false },
  { id: 'kill_500', name: 'Exterminador', desc: 'Mate 500 inimigos em uma partida', unlocked: false },
  { id: 'score_5000', name: 'Rico', desc: 'Alcance 5000 pontos', unlocked: false },
  { id: 'score_20000', name: 'Milionario', desc: 'Alcance 20000 pontos', unlocked: false },
  { id: 'no_damage_wave', name: 'Intocavel', desc: 'Complete uma onda sem tomar dano', unlocked: false },
  { id: 'boss_kill', name: 'Caçador de Chefes', desc: 'Derrote seu primeiro boss', unlocked: false },
  { id: 'all_weapons', name: 'Colecionador', desc: 'Compre todas as armas', unlocked: false },
  { id: 'combo_10', name: 'Em Combinação', desc: 'Alcance combo x10', unlocked: false },
  { id: 'combo_25', name: 'Imparável', desc: 'Alcance combo x25', unlocked: false },

  // ── lotes 2 e 3 ──
  // Todos reusam gatilho e contador que já existem, ou um contador novo só.
  // Nenhum exige um sistema de tracking próprio: a regra do projeto é que
  // feature se conecte a pelo menos 2 outras coisas.
  { id: 'kill_1000', name: 'Ceifeiro', desc: 'Mate 1000 inimigos em uma partida', unlocked: false },
  { id: 'score_50000', name: 'Fortuna', desc: 'Alcance 50000 pontos', unlocked: false },
  { id: 'boss_5', name: 'Caçador de Titãs', desc: 'Derrote 5 chefes numa partida', unlocked: false },
  { id: 'all_bosses', name: 'Cacador de Rei', desc: 'Derrote os 9 chefes numa partida', unlocked: false },
  { id: 'chain_3', name: 'Dominó', desc: 'Derrube 3 props numa explosão só', unlocked: false },
  { id: 'chain_5', name: 'Rebaixo', desc: 'Derrube 5 props numa explosão só', unlocked: false },
  { id: 'vip_saved', name: 'Escolta', desc: 'Conclua uma fase protegendo o sobrevivente', unlocked: false },
  { id: 'all_objectives', name: 'General', desc: 'Conclua os 5 tipos de objetivo', unlocked: false },
];

const STORAGE_KEY = 'bubbleShooter_achievements';

/** Contadores temporários da partida */
let killsThisRun = 0;
let waveDamageTaken = false;
let bossesThisRun = 0;
let objetivosVistos = new Set<string>();

/**
 * Carrega achievements salvos.
 */
export function loadAchievements(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as string[];
      for (const a of ACHIEVEMENTS) {
        a.unlocked = saved.includes(a.id);
      }
    }
  } catch {}
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
      // O flag é limpo em TODA onda concluída, não só quando estava limpo: ele
      // só era zerado dentro do `if (!waveDamageTaken)`, então levar dano uma
      // vez grudava o flag para o resto da partida e a conquista não voltava
      // nunca mais. "Intocável" é por onda, como a descrição diz.
      const ondaLimpa = !waveDamageTaken;
      waveDamageTaken = false;
      if (ondaLimpa) return unlock('no_damage_wave');
      break;
    case 'damage_taken':
      waveDamageTaken = true;
      break;
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
  if (objetivosVistos.size >= 5) return unlockById('all_objectives');
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
}

/**
 * Retorna todos os achievements.
 */
export function getAllAchievements(): Achievement[] {
  return ACHIEVEMENTS;
}
