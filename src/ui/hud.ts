/**
 * Interface do usuário - HUD (Heads-Up Display).
 * Gerencia os elementos HTML que exibem informações durante o jogo:
 * fase, vida, pontuação, moedas, onda e inimigos restantes.
 */

/** Dados exibidos no HUD durante o jogo */
export interface HudData {
  /** Nome da fase atual */
  phase: string;
  /** Vida atual do jogador */
  health: number;
  /** Pontuação total */
  score: number;
  /** Moedas acumuladas */
  coins: number;
  /** Número da onda atual (0-indexed, exibido como 1-indexed) */
  wave: number;
  /** Quantidade de inimigos ativos na tela */
  enemies: number;
}

/** Mapa de referências aos elementos HTML do HUD */
let elements: Record<string, HTMLElement> = {};

/**
 * Inicializa o HUD obtendo referências aos elementos DOM.
 * Deve ser chamado após o DOM estar pronto.
 */
export function initHud(): void {
  elements = {
    phase: document.getElementById('phase')!,
    health: document.getElementById('health')!,
    score: document.getElementById('score')!,
    coins: document.getElementById('coins')!,
    wave: document.getElementById('wave')!,
    enemies: document.getElementById('enemies')!,
  };
}

/**
 * Atualiza todos os elementos do HUD com os dados fornecidos.
 * @param data - dados atuais do jogo para exibição
 */
export function updateHud(data: HudData): void {
  elements.phase.textContent = data.phase;
  elements.health.textContent = String(Math.max(0, Math.ceil(data.health)));
  elements.score.textContent = String(data.score);
  elements.coins.textContent = String(data.coins);
  elements.wave.textContent = String(data.wave + 1);
  elements.enemies.textContent = String(data.enemies);
}
