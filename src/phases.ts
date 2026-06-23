/**
 * Sistema de fases e progressão do jogo.
 * Gerencia a fase atual, onda, pontuação, combo e estado do jogo.
 * Controla a transição entre fases e o fluxo de ondas.
 */

import { PHASES } from './config';
import { GameStateType } from './types';

/** Índice da fase atual (0-indexado) */
let currentPhase = 0;
/** Número da onda atual dentro da fase (0-indexado) */
let currentWave = 0;
/** Estado atual do jogo */
let gameState: GameStateType = 'menu';
/** Pontuação total acumulada */
let score = 0;
/** Multiplicador de combo atual (reseta com tempo sem abates) */
let combo = 0;
/** Timer para reset do combo */
let comboTimer = 0;
/** Sequência de abates consecutivos (reseta ao completar onda) */
let killStreak = 0;
/** Total de inimigos derrotados na partida */
let totalKills = 0;

/**
 * Retorna a fase atual com todas suas configurações.
 * @returns objeto Phase com nome, cores e tipos de inimigos
 */
export function getCurrentPhase() { return PHASES[currentPhase]; }

/**
 * Retorna o número da onda atual.
 * @returns índice da onda (0-indexado)
 */
export function getCurrentWave() { return currentWave; }

/**
 * Retorna o estado atual do jogo.
 * @returns GameStateType atual
 */
export function getGameState() { return gameState; }

/**
 * Retorna a pontuação total acumulada.
 * @returns pontuação
 */
export function getScore() { return score; }

/**
 * Retorna o multiplicador de combo atual.
 * @returns valor do combo
 */
export function getCombo() { return combo; }

/**
 * Retorna a sequência de abates consecutivos.
 * @returns número de kills sem morrer
 */
export function getKillStreak() { return killStreak; }

/**
 * Retorna o total de inimigos derrotados na partida.
 * @returns quantidade total de kills
 */
export function getTotalKills() { return totalKills; }

/**
 * Define o estado do jogo.
 * @param state - novo estado a ser aplicado
 */
export function setGameState(state: GameStateType) { gameState = state; }

/**
 * Adiciona pontuação com bônus de combo.
 * Incrementa combo, kill streak e reseta o timer.
 * @param amount - pontos base a adicionar
 */
export function addScore(amount: number) {
  const multiplier = 1 + combo * 0.1;
  score += Math.floor(amount * multiplier);
  combo++;
  comboTimer = 2;
  killStreak++;
  totalKills++;
}

/**
 * Atualiza o timer do combo. Reseta o combo quando o timer expira.
 * @param dt - delta time em segundos
 */
export function updateCombo(dt: number) {
  if (comboTimer > 0) {
    comboTimer -= dt;
    if (comboTimer <= 0) {
      combo = 0;
    }
  }
}

/**
 * Reseta combo, timer e kill streak.
 * Usado ao mudar de fase.
 */
export function resetCombo() {
  combo = 0;
  comboTimer = 0;
  killStreak = 0;
}

/**
 * Avança para a próxima onda.
 * Se todas as ondas da fase foram completadas, vai para a loja.
 */
export function nextWave() {
  currentWave++;
  if (currentWave >= PHASES[currentPhase].waves) {
    gameState = 'shop';
  }
}

/**
 * Avança para a próxima fase.
 * Se todas as fases foram completadas, vai para game over.
 */
export function nextPhase() {
  currentPhase++;
  currentWave = 0;
  if (currentPhase >= PHASES.length) {
    gameState = 'gameover';
  } else {
    gameState = 'playing';
  }
}

/**
 * Reseta toda a progressão: fase, onda, pontuação, combo e kills.
 * Usado ao reiniciar o jogo.
 */
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

/**
 * Retorna a cor de fundo da fase atual.
 * @returns string de cor hex ou rgba
 */
export function getPhaseBackground(): string {
  return PHASES[currentPhase]?.bg || '#1a1a2e';
}

/**
 * Retorna a cor de fundo secundária da fase atual.
 * @returns string de cor hex
 */
export function getPhaseBackground2(): string {
  return PHASES[currentPhase]?.bgColor2 || '#0d0d1a';
}

/**
 * Retorna a cor da grade da fase atual.
 * @returns string de cor rgba
 */
export function getPhaseGridColor(): string {
  return PHASES[currentPhase]?.gridColor || 'rgba(255,255,255,0.03)';
}
