export interface HudData {
  phase: string;
  health: number;
  score: number;
  coins: number;
  wave: number;
  enemies: number;
}

let elements: Record<string, HTMLElement> = {};

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

export function updateHud(data: HudData): void {
  elements.phase.textContent = data.phase;
  elements.health.textContent = String(Math.max(0, Math.ceil(data.health)));
  elements.score.textContent = String(data.score);
  elements.coins.textContent = String(data.coins);
  elements.wave.textContent = String(data.wave + 1);
  elements.enemies.textContent = String(data.enemies);
}
