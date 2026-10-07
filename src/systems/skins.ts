/**
 * Sistema de skins do jogador.
 * Permite comprar e equipar visuais diferentes para o personagem.
 */

import { PALETTE } from '../core/palette';

/** Define uma skin disponível */
export interface Skin {
  /** Nome da skin */
  name: string;
  /** Cor principal do corpo */
  bodyColor: string;
  /** Cor da borda/contorno */
  borderColor: string;
  /** Cor do indicador de mira */
  aimColor: string;
  /** Símbolo exibido no centro (emoji ou caractere) */
  symbol: string;
  /** Preço em moedas */
  price: number;
  /** Se a skin foi desbloqueada */
  unlocked: boolean;
  /** Se está equipada */
  equipped: boolean;
}

/** Lista de skins disponíveis */
const skins: Skin[] = [
  { name: 'Padrão', bodyColor: PALETTE.moss, borderColor: '#5a7a4a', aimColor: PALETTE.text, symbol: '', price: 0, unlocked: true, equipped: true },
  { name: 'Fogo', bodyColor: PALETTE.danger, borderColor: '#6b3030', aimColor: PALETTE.terracotta, symbol: '', price: 50, unlocked: false, equipped: false },
  { name: 'Gelo', bodyColor: PALETTE.stone, borderColor: '#4a6270', aimColor: '#ccc', symbol: '', price: 50, unlocked: false, equipped: false },
  { name: 'Sombra', bodyColor: '#2a2a2c', borderColor: '#1a1a1c', aimColor: PALETTE.moss, symbol: '', price: 80, unlocked: false, equipped: false },
  { name: 'Dourado', bodyColor: PALETTE.mustard, borderColor: '#8a6a4a', aimColor: PALETTE.text, symbol: '', price: 120, unlocked: false, equipped: false },
  { name: 'Neon', bodyColor: '#5a7a4a', borderColor: '#4a5a3a', aimColor: PALETTE.moss, symbol: '', price: 100, unlocked: false, equipped: false },
  { name: 'Sangue', bodyColor: PALETTE.danger, borderColor: '#5a3030', aimColor: PALETTE.terracotta, symbol: '', price: 90, unlocked: false, equipped: false },
  { name: 'Raio', bodyColor: PALETTE.terracotta, borderColor: '#7a4a3a', aimColor: PALETTE.mustard, symbol: '', price: 110, unlocked: false, equipped: false },
  { name: 'Fantasma', bodyColor: 'rgba(200,184,144,0.4)', borderColor: 'rgba(200,184,144,0.6)', aimColor: PALETTE.text, symbol: '', price: 200, unlocked: false, equipped: false },
  { name: 'Robô', bodyColor: '#5a5a5a', borderColor: '#6a6a6a', aimColor: PALETTE.stone, symbol: '', price: 150, unlocked: false, equipped: false },
];

/**
 * Retorna todas as skins.
 */
export function getAllSkins(): Skin[] {
  return skins;
}

/**
 * Retorna a skin equipada atualmente.
 */
export function getEquippedSkin(): Skin {
  return skins.find(s => s.equipped) || skins[0];
}

/**
 * Tenta comprar uma skin pelo índice.
 * @returns true se a compra foi bem-sucedida
 */
export function buySkin(index: number, coins: number): { success: boolean; cost: number } {
  const skin = skins[index];
  if (!skin || skin.unlocked) return { success: false, cost: 0 };
  if (coins < skin.price) return { success: false, cost: 0 };
  skin.unlocked = true;
  persistUnlocked();
  return { success: true, cost: skin.price };
}

/**
 * Equipa uma skin pelo índice.
 * @returns true se a skin está desbloqueada e foi equipada
 */
export function equipSkin(index: number): boolean {
  const skin = skins[index];
  if (!skin || !skin.unlocked) return false;
  skins.forEach(s => s.equipped = false);
  skin.equipped = true;
  return true;
}

export function resetSkins(): void {
  skins.forEach(s => s.equipped = false);
  skins[0].equipped = true;
  skins.forEach((s, i) => { s.unlocked = i === 0; });
  try {
    const raw = localStorage.getItem('bubbleShooter_skins_unlocked');
    if (raw) {
      const ids = JSON.parse(raw) as number[];
      for (const idx of ids) if (idx in skins) skins[idx].unlocked = true;
    }
  } catch {}
}

function persistUnlocked(): void {
  try {
    const ids = skins.map((s, i) => (s.unlocked ? i : -1)).filter(i => i >= 0);
    localStorage.setItem('bubbleShooter_skins_unlocked', JSON.stringify(ids));
  } catch {}
}
