/**
 * Sistema de skins do jogador.
 * Permite comprar e equipar visuais diferentes para o personagem.
 */

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
  { name: 'Padrão', bodyColor: '#2ecc71', borderColor: '#27ae60', aimColor: '#fff', symbol: '', price: 0, unlocked: true, equipped: true },
  { name: 'Fogo', bodyColor: '#e74c3c', borderColor: '#c0392b', aimColor: '#f39c12', symbol: '', price: 50, unlocked: false, equipped: false },
  { name: 'Gelo', bodyColor: '#3498db', borderColor: '#2980b9', aimColor: '#ecf0f1', symbol: '', price: 50, unlocked: false, equipped: false },
  { name: 'Sombra', bodyColor: '#2c3e50', borderColor: '#1a252f', aimColor: '#9b59b6', symbol: '', price: 80, unlocked: false, equipped: false },
  { name: 'Dourado', bodyColor: '#f1c40f', borderColor: '#f39c12', aimColor: '#fff', symbol: '', price: 120, unlocked: false, equipped: false },
  { name: 'Neon', bodyColor: '#1abc9c', borderColor: '#16a085', aimColor: '#2ecc71', symbol: '', price: 100, unlocked: false, equipped: false },
  { name: 'Sangue', bodyColor: '#8e44ad', borderColor: '#6c3483', aimColor: '#e74c3c', symbol: '', price: 90, unlocked: false, equipped: false },
  { name: 'Raio', bodyColor: '#f39c12', borderColor: '#e67e22', aimColor: '#f1c40f', symbol: '', price: 110, unlocked: false, equipped: false },
  { name: 'Fantasma', bodyColor: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.6)', aimColor: '#fff', symbol: '', price: 200, unlocked: false, equipped: false },
  { name: 'Robô', bodyColor: '#7f8c8d', borderColor: '#95a5a6', aimColor: '#3498db', symbol: '', price: 150, unlocked: false, equipped: false },
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
