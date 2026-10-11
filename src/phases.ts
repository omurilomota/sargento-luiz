/**
 * Sistema de fases e progressão do jogo.
 * Gerencia a fase atual, onda, pontuação, combo e estado do jogo.
 * Controla a transição entre fases e o fluxo de ondas.
 */

import { PHASES } from './config';
import { COMBO_TIMEOUT } from './core/constants';
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
 */
export function getCurrentPhase() { return PHASES[currentPhase]; }

export function getCurrentWave() { return currentWave; }

export function getGameState() { return gameState; }

export function getScore() { return score; }

export function getCombo() { return combo; }

/**
 * Retorna a sequência de abates consecutivos.
 */
export function getKillStreak() { return killStreak; }

/**
 * Total de abates da partida.
 *
 * Distinto de `getKillStreak`: a sequência zera a cada intervalo sem abate, e
 * a tela de fim imprimia a sequência com o rótulo "Abates" — o jogador via
 * "0 abates" ao lado de uma pontuação alta e achava o contador quebrado.
 */
export function getTotalKills() { return totalKills; }

/**
 * Define o estado do jogo.
 */
export function setGameState(state: GameStateType) { gameState = state; }

/**
 * Adiciona pontuação com bônus de combo.
 * Incrementa combo, kill streak e reseta o timer.
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
 * Adiciona pontuação SEM incrementar o combo.
 * Usado para moedas e outros eventos que não são kills.
 */
export function addScoreFlat(amount: number) {
  score += amount;
}

/**
 * Atualiza o timer do combo. Reseta o combo quando o timer expira.
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
 * Retorna o decaimento atual do combo (1 = cheio, 0 = prestes a zerar).
 * O HUD usa isso para a barrinha de combo não parecer estática.
 */
export function getComboDecay(): number {
  if (comboTimer <= 0) return 0;
  return comboTimer / COMBO_TIMEOUT;
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

/** Estado do respiro de fim de fase, no ponto em que a fase decide fechar. */
export interface FimDeFase {
  /**
   * A onda atual acabou de verdade: o spawner zerou a cota dela e o campo está
   * vazio, ou o chefe já nasceu e caiu.
   *
   * Sem este termo o predicado respondia `true` para qualquer onda que não fosse
   * a última, e o bloco que o chama roda todo frame (não só quando a onda
   * fecha). O resultado era a fase pular para a última onda em dois frames e o
   * chefe nascer com o campo vazio — o sintoma "toda fase começa com chefe".
   */
  ondaCompleta: boolean;
  ultimaOnda: boolean;
  respiroArmado: boolean;
  respiroRestante: number;
  chefeVivo: boolean;
  jogadorMorto: boolean;
}

/**
 * A fase fecha quando a onda acabou, o respiro acabou, o chefe caiu e é a última.
 *
 * A morte do jogador tem precedência absoluta: sem este termo, matar o chefe e
 * morrer no mesmo frame abria a loja em vez do game over, porque o bloco de onda
 * roda antes do bloco de morte no update.
 */
export function deveFecharFase(f: FimDeFase): boolean {
  if (f.jogadorMorto) return false;
  if (!f.ondaCompleta) return false;
  if (!f.ultimaOnda) return true;
  return f.respiroArmado && f.respiroRestante <= 0 && !f.chefeVivo;
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
 * Volta para a primeira onda da fase, sem sair dela.
 * Usado quando a fase reinicia porque o sobrevivente do `protect` caiu.
 */
export function resetWave(): void {
  currentWave = 0;
}

/** Salta para uma onda específica da fase. Usado pelo harness de fim de fase. */
export function setCurrentWave(wave: number): void {
  currentWave = Math.max(0, Math.min(wave, PHASES[currentPhase].waves - 1));
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
    gameCompleted = true;
  } else {
    gameState = 'playing';
  }
}

/** Se o jogo foi completado (todas as fases) */
let gameCompleted = false;

/**
 * Verifica se o jogo foi completado com sucesso.
 */
export function wasGameCompleted(): boolean {
  return gameCompleted;
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
