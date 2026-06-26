/**
 * Interface do usuário - HUD minimalista.
 * Layout: barra superior (vida, score, fase, combo, moedas, inimigos)
 *         barra inferior (arma, controles).
 */

export interface HudData {
  phase: string;
  health: number;
  maxHealth: number;
  score: number;
  coins: number;
  wave: number;
  maxWave: number;
  enemies: number;
  weapon: string;
  combo: number;
  ammo: number;
  maxAmmo: number;
  reloading: boolean;
}

let els: Record<string, HTMLElement> = {};

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
    hudTop: document.getElementById('hud-top')!,
    hudBottom: document.getElementById('hud-bottom')!,
    scoreDisplay: document.getElementById('score-display')!,
  };
}

export function updateHud(data: HudData): void {
  const healthPercent = Math.max(0, Math.min(100, (data.health / data.maxHealth) * 100));
  els.healthBar.style.width = `${healthPercent}%`;
  els.healthText.textContent = String(Math.ceil(data.health));

  if (healthPercent > 60) {
    els.healthBar.style.background = '#7a9a6a';
  } else if (healthPercent > 30) {
    els.healthBar.style.background = '#a08050';
  } else {
    els.healthBar.style.background = '#8b4040';
  }

  els.score.textContent = String(data.score);
  els.coins.textContent = String(data.coins);
  els.wave.textContent = `${data.wave + 1}/${data.maxWave}`;
  els.phase.textContent = data.phase;
  els.enemies.textContent = String(data.enemies);

  if (data.reloading) {
    els.weapon.textContent = `${data.weapon} [REC...]`;
  } else {
    els.weapon.textContent = `${data.weapon} ${data.ammo}/${data.maxAmmo}`;
  }

  if (data.combo > 1) {
    els.combo.classList.add('active');
    els.comboText.textContent = String(data.combo);
  } else {
    els.combo.classList.remove('active');
  }
}

export function setHudVisible(visible: boolean): void {
  const display = visible ? 'flex' : 'none';
  els.hudTop.style.display = display;
  els.hudBottom.style.display = display;
}
