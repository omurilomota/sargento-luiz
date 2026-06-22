import { PHASES } from './config';
import { GameState } from './types';

let currentPhase = 0;
let currentWave = 0;
let gameState: GameState = 'menu';
let score = 0;

export function getCurrentPhase() { return PHASES[currentPhase]; }
export function getCurrentWave() { return currentWave; }
export function getGameState() { return gameState; }
export function getScore() { return score; }
export function setGameState(state: GameState) { gameState = state; }
export function addScore(amount: number) { score += amount; }

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
}

export function getPhaseBackground(): string {
  return PHASES[currentPhase]?.bg || '#1a1a2e';
}

export function getPhaseGridColor(): string {
  return PHASES[currentPhase]?.gridColor || 'rgba(255,255,255,0.03)';
}
