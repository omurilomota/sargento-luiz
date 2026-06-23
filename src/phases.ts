import { PHASES } from './config';
import { GameStateType } from './types';

let currentPhase = 0;
let currentWave = 0;
let gameState: GameStateType = 'menu';
let score = 0;
let combo = 0;
let comboTimer = 0;
let killStreak = 0;
let totalKills = 0;

export function getCurrentPhase() { return PHASES[currentPhase]; }
export function getCurrentWave() { return currentWave; }
export function getGameState() { return gameState; }
export function getScore() { return score; }
export function getCombo() { return combo; }
export function getKillStreak() { return killStreak; }
export function getTotalKills() { return totalKills; }
export function setGameState(state: GameStateType) { gameState = state; }

export function addScore(amount: number) {
  const multiplier = 1 + combo * 0.1;
  score += Math.floor(amount * multiplier);
  combo++;
  comboTimer = 2;
  killStreak++;
  totalKills++;
}

export function updateCombo(dt: number) {
  if (comboTimer > 0) {
    comboTimer -= dt;
    if (comboTimer <= 0) {
      combo = 0;
    }
  }
}

export function resetCombo() {
  combo = 0;
  comboTimer = 0;
  killStreak = 0;
}

export function nextWave() {
  currentWave++;
  if (currentWave >= PHASES[currentPhase].waves) {
    gameState = 'shop';
  }
}

export function nextPhase() {
  currentPhase++;
  currentWave = 0;
  if (currentPhase >= PHASES.length) {
    gameState = 'gameover';
  } else {
    gameState = 'playing';
  }
}

export function resetPhases() {
  currentPhase = 0;
  currentWave = 0;
  gameState = 'menu';
  score = 0;
  combo = 0;
  comboTimer = 0;
  killStreak = 0;
  totalKills = 0;
}

export function getPhaseBackground(): string {
  return PHASES[currentPhase]?.bg || '#1a1a2e';
}

export function getPhaseBackground2(): string {
  return PHASES[currentPhase]?.bgColor2 || '#0d0d1a';
}

export function getPhaseGridColor(): string {
  return PHASES[currentPhase]?.gridColor || 'rgba(255,255,255,0.03)';
}
