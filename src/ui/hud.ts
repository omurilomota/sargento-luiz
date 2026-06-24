/**
 * Interface do usuário - HUD minimalista.
 * Exibe informações do jogo de forma limpa e discreta:
 * barra de vida, arma, fase/onda, combo, moedas e inimigos.
 */

/** Dados exibidos no HUD durante o jogo */
export interface HudData {
  /** Nome da fase atual */
  phase: string;
  /** Vida atual do jogador (0-100) */
  health: number;
  /** Vida máxima do jogador */
  maxHealth: number;
  /** Pontuação total */
  score: number;
  /** Moedas acumuladas */
  coins: number;
  /** Número da onda atual (0-indexed) */
  wave: number;
  /** Quantidade de ondas na fase atual */
  maxWave: number;
  /** Quantidade de inimigos ativos na tela */
  enemies: number;
  /** Nome da arma atual */
  weapon: string;
  /** Multiplicador de combo (0 = sem combo) */
  combo: number;
}

/** Referências aos elementos DOM */
let els: Record<string, HTMLElement> = {};

/**
 * Inicializa o HUD obtendo referências aos elementos DOM.
 * Deve ser chamado após o DOM estar pronto.
 */
export function initHud(): void {
  els = {
    healthBar: document.getElementById('health-bar')!,
    healthText: document.getElementById('health-text')!,
    score: document.getElementById('score')!,
    coins: document.getElementById('coins')!,
    wave: document.getElementById('wave')!,
    phase: document.getElementById('phase')!,
    enemies: document.getElementById('enemies')!,
    weapon: document.getElementById('weapon')!,
    combo: document.getElementById('combo')!,
    comboText: document.getElementById('combo-text')!,
    hud: document.getElementById('hud')!,
  };
}

/**
 * Atualiza todos os elementos do HUD com os dados fornecidos.
 * @param data - dados atuais do jogo para exibição
 */
export function updateHud(data: HudData): void {
  // Health bar
  const healthPercent = Math.max(0, Math.min(100, (data.health / data.maxHealth) * 100));
  els.healthBar.style.width = `${healthPercent}%`;
  els.healthText.textContent = String(Math.ceil(data.health));

  // Color based on health
  if (healthPercent > 60) {
    els.healthBar.style.background = 'linear-gradient(90deg, #27ae60, #2ecc71)';
  } else if (healthPercent > 30) {
    els.healthBar.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
  } else {
    els.healthBar.style.background = 'linear-gradient(90deg, #c0392b, #e74c3c)';
  }

  // Score
  els.score.textContent = String(data.score);

  // Coins
  els.coins.textContent = String(data.coins);

  // Wave
  els.wave.textContent = `${data.wave + 1}/${data.maxWave}`;

  // Phase
  els.phase.textContent = data.phase;

  // Enemies
  els.enemies.textContent = String(data.enemies);

  // Weapon
  els.weapon.textContent = data.weapon;

  // Combo
  if (data.combo > 1) {
    els.combo.classList.add('active');
    els.comboText.textContent = String(data.combo);
  } else {
    els.combo.classList.remove('active');
  }
}

/**
 * Mostra ou esconde o HUD baseado no estado do jogo.
 * @param visible - true para mostrar, false para esconder
 */
export function setHudVisible(visible: boolean): void {
  const display = visible ? 'flex' : 'none';
  els.hud.style.display = display;
  document.getElementById('score-display')!.style.display = visible ? 'block' : 'none';
}
