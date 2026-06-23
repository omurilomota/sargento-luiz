import { WEAPONS, UPGRADES } from './config';
import { setWeapon, addDamageMultiplier } from './weapons';
import { drawCraftingMenu, handleCraftingClick, resetCrafting } from './crafting';

let shopCoins = 0;
let purchasedWeapons: number[] = [0];
let purchasedUpgrades: string[] = [];

export function setShopCoins(amount: number) { shopCoins = amount; }
export function getShopCoins(): number { return shopCoins; }
export function addShopCoins(amount: number) { shopCoins += amount; }

export function getPurchasedWeapons(): number[] { return purchasedWeapons; }
export function getPurchasedUpgrades(): string[] { return purchasedUpgrades; }

export function buyWeapon(index: number): boolean {
  if (purchasedWeapons.includes(index)) return false;
  if (shopCoins < WEAPONS[index].price) return false;
  shopCoins -= WEAPONS[index].price;
  purchasedWeapons.push(index);
  setWeapon(index);
  return true;
}

export function buyUpgrade(name: string): boolean {
  if (purchasedUpgrades.includes(name)) return false;
  const upgrade = UPGRADES.find(u => u.name === name);
  if (!upgrade) return false;
  if (shopCoins < upgrade.price) return false;
  shopCoins -= upgrade.price;
  purchasedUpgrades.push(name);
  applyUpgrade(upgrade.effect, upgrade.value);
  return true;
}

function applyUpgrade(effect: string, value: number) {
  if (effect === 'damage') addDamageMultiplier(value);
}

export function resetShop() {
  purchasedWeapons = [0];
  purchasedUpgrades = [];
  resetCrafting();
}

export function drawShop(ctx: CanvasRenderingContext2D, width: number, height: number, mouseX?: number, mouseY?: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`LOJA - ${shopCoins} Moedas`, width / 2, 60);

  ctx.font = '20px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText('Armas:', width / 2, 120);

  WEAPONS.forEach((w, i) => {
    const y = 160 + i * 50;
    const owned = purchasedWeapons.includes(i);
    ctx.fillStyle = owned ? '#2ecc71' : '#fff';
    ctx.fillText(`${w.name} - ${owned ? 'COMPRADO' : w.price + ' moedas'}`, width / 2, y);
  });

  ctx.fillStyle = '#fff';
  ctx.fillText('Upgrades:', width / 2, 380);

  UPGRADES.forEach((u, i) => {
    const y = 420 + i * 50;
    const owned = purchasedUpgrades.includes(u.name);
    ctx.fillStyle = owned ? '#2ecc71' : '#fff';
    ctx.fillText(`${u.name} - ${owned ? 'COMPRADO' : u.price + ' moedas'}`, width / 2, y);
  });

  const craftMenuWidth = width - 40;
  const craftMenuHeight = 200;
  const craftMenuX = 20;
  const craftMenuY = height - craftMenuHeight - 50;

  if (mouseX !== undefined && mouseY !== undefined) {
    drawCraftingMenu(ctx, craftMenuX, craftMenuY, craftMenuWidth, craftMenuHeight, mouseX, mouseY);
  }

  ctx.fillStyle = '#2ecc71';
  ctx.fillText('Pressione ENTER para continuar', width / 2, height - 20);
}
