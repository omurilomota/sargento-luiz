/**
 * Interface do usuário - HUD (Heads-Up Display).
 * Exibe informações do jogo em estilo RPG Fantasy:
 * corações de vida, arma, fase/onda, combo, moedas e inimigos.
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

/** Mapa de referências aos elementos DOM do HUD */
let els: Record<string, HTMLElement> = {};

/** Último valor de vida para detectar mudanças */
let lastHealth = -1;
/** Timer para animação de dano */
let damageTimer = 0;

/**
 * Inicializa o HUD obtendo referências aos elementos DOM.
 * Deve ser chamado após o DOM estar pronto.
 */
export function initHud(): void {
  els = {
    healthHearts: document.getElementById('health-hearts')!,
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
 * Renderiza os corações de vida baseado no HP atual.
 * Corações cheios (❤) e vazios (🖤) com animação de dano.
 * @param health - vida atual
 * @param maxHealth - vida máxima
 */
function renderHearts(health: number, maxHealth: number): void {
  const totalHearts = Math.ceil(maxHealth / 20);
  const fullHearts = Math.ceil(health / 20);

  let html = '';
  for (let i = 0; i < totalHearts; i++) {
    const isFull = i < fullHearts;
    const isDamage = health < lastHealth && i === fullHearts;
    const cls = isFull ? (isDamage ? 'heart full damage' : 'heart full') : 'heart empty';
    html += `<span class="${cls}">&#9829;</span>`;
  }
  els.healthHearts.innerHTML = html;

  // Trigger damage flash on HUD bar
  if (health < lastHealth) {
    els.hud.classList.remove('damage-flash');
    void els.hud.offsetWidth;
    els.hud.classList.add('damage-flash');
  }

  lastHealth = health;
}

/**
 * Atualiza todos os elementos do HUD com os dados fornecidos.
 * @param data - dados atuais do jogo para exibição
 */
export function updateHud(data: HudData): void {
  // Health hearts
  renderHearts(data.health, data.maxHealth);

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
    els.comboText.textContent = `x${data.combo}`;
  } else {
    els.combo.classList.remove('active');
  }
}
