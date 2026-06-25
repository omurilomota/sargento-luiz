/**
 * Sistema de modos de jogo.
 * Campanha, Sobrevivência, Missões, Boss Rush.
 */

/** Tipos de modo de jogo */
export type GameMode = 'campaign' | 'survival' | 'missions' | 'bossrush' | 'competitive' | 'local';

/** Dados de uma missão */
export interface Mission {
  /** Nome da missão */
  name: string;
  /** Descrição do objetivo */
  description: string;
  /** Tipo de objetivo */
  objective: 'survive' | 'kill' | 'surviveNoDamage' | 'reachCheckpoint';
  /** Valor alvo do objetivo */
  target: number;
  /** Recompensa em moedas */
  reward: number;
}

/** Missões disponíveis */
export const MISSIONS: Mission[] = [
  { name: 'Suprimentos', description: 'Proteja o suprimento por 60 segundos', objective: 'survive', target: 60, reward: 50 },
  { name: 'Abate', description: 'Destrua 30 inimigos em 45 segundos', objective: 'kill', target: 30, reward: 75 },
  { name: 'Imparável', description: 'Sobreviva sem tomar dano por 20 segundos', objective: 'surviveNoDamage', target: 20, reward: 100 },
  { name: 'Checkpoint', description: 'Chegue ao checkpoint sem morrer', objective: 'reachCheckpoint', target: 1, reward: 60 },
];

/** Estado do modo atual */
let currentMode: GameMode = 'campaign';
let missionTimer = 0;
let missionKills = 0;
let missionNoDamageTimer = 0;
let currentMission: Mission | null = null;

/**
 * Retorna o modo atual.
 */
export function getCurrentMode(): GameMode {
  return currentMode;
}

/**
 * Define o modo de jogo.
 */
export function setGameMode(mode: GameMode): void {
  currentMode = mode;
}

/**
 * Retorna a missão atual.
 */
export function getCurrentMission(): Mission | null {
  return currentMission;
}

/**
 * Inicia uma missão.
 */
export function startMission(mission: Mission): void {
  currentMission = mission;
  missionTimer = 0;
  missionKills = 0;
  missionNoDamageTimer = 0;
}

/**
 * Registra um kill na missão.
 */
export function registerKill(): void {
  if (currentMission?.objective === 'kill') {
    missionKills++;
  }
}

/**
 * Registra dano tomado.
 */
export function registerDamage(): void {
  if (currentMission?.objective === 'surviveNoDamage') {
    missionNoDamageTimer = 0;
  }
}

/**
 * Atualiza a missão.
 * @returns true se a missão foi completada
 */
export function updateMission(dt: number): boolean {
  if (!currentMission) return false;

  missionTimer += dt;

  if (currentMission.objective === 'surviveNoDamage') {
    missionNoDamageTimer += dt;
    if (missionNoDamageTimer >= currentMission.target) {
      return true;
    }
  }

  if (currentMission.objective === 'survive') {
    if (missionTimer >= currentMission.target) {
      return true;
    }
  }

  if (currentMission.objective === 'kill') {
    if (missionKills >= currentMission.target) {
      return true;
    }
  }

  return false;
}

/**
 * Retorna progresso da missão (0-1).
 */
export function getMissionProgress(): number {
  if (!currentMission) return 0;

  switch (currentMission.objective) {
    case 'survive':
      return Math.min(1, missionTimer / currentMission.target);
    case 'kill':
      return Math.min(1, missionKills / currentMission.target);
    case 'surviveNoDamage':
      return Math.min(1, missionNoDamageTimer / currentMission.target);
    default:
      return 0;
  }
}

/**
 * Reseta o estado das missões.
 */
export function resetMissions(): void {
  missionTimer = 0;
  missionKills = 0;
  missionNoDamageTimer = 0;
  currentMission = null;
}
