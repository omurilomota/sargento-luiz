import { WEAPONS, UPGRADES } from './config';
import { setWeapon, addDamageMultiplier, addPierce, addCrit } from './weapons';

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
  if (effect === 'pierce') addPierce(value);
  if (effect === 'crit') addCrit(value);
}

export function resetShop() {
  purchasedWeapons = [0];
  purchasedUpgrades = [];
}

function drawButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, text: string, color: string, hovered: boolean) {
  ctx.fillStyle = hovered ? color : 'rgba(255,255,255,0.1)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = hovered ? '#fff' : color;
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2);
}

let shopHoverY = 0;
let shopScrollOffset = 0;

export function drawShop(ctx: CanvasRenderingContext2D, width: number, height: number, mouseX: number, mouseY: number) {
  ctx.fillStyle = 'rgba(5,5,15,0.95)';
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 30; i++) {
    const x = (i * 137 + Date.now() / 50) % width;
    const y = (i * 97 + Date.now() / 80) % height;
    ctx.fillStyle = `rgba(241,196,15,${0.1 + Math.sin(Date.now() / 1000 + i) * 0.05})`;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#f1c40f';
  ctx.shadowBlur = 20;
  ctx.fillText(`LOJA`, width / 2, 50);
  ctx.shadowBlur = 0;

  ctx.font = '22px monospace';
  ctx.fillStyle = '#f1c40f';
  ctx.fillText(`${shopCoins} Moedas`, width / 2, 85);

  const colW = width / 2 - 40;
  const leftX = 20;
  const rightX = width / 2 + 20;

  ctx.fillStyle = '#e67e22';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ARMAS', leftX, 125);

  WEAPONS.forEach((w, i) => {
    const y = 145 + i * 42;
    const owned = purchasedWeapons.includes(i);
    const canBuy = !owned && shopCoins >= w.price;
    const hover = mouseX >= leftX && mouseX <= leftX + colW && mouseY >= y && mouseY <= y + 36;
    drawButton(ctx, leftX, y, colW, 36, `${w.name} - ${owned ? '✓' : w.price + '$'}`, owned ? '#2ecc71' : canBuy ? w.color : '#666', hover);
  });

  ctx.fillStyle = '#9b59b6';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('UPGRADES', rightX, 125);

  UPGRADES.forEach((u, i) => {
    const y = 145 + i * 42;
    const owned = purchasedUpgrades.includes(u.name);
    const canBuy = !owned && shopCoins >= u.price;
    const hover = mouseX >= rightX && mouseX <= rightX + colW && mouseY >= y && mouseY <= y + 36;
    drawButton(ctx, rightX, y, colW, 36, `${u.name} - ${owned ? '✓' : u.price + '$'}`, owned ? '#2ecc71' : canBuy ? '#9b59b6' : '#666', hover);
  });

  ctx.fillStyle = '#2ecc71';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Pressione ENTER para continuar', width / 2, height - 30);
}

export function handleShopClick(mouseX: number, mouseY: number) {
  const width = window.innerWidth;
  const colW = width / 2 - 40;
  const leftX = 20;
  const rightX = width / 2 + 20;

  WEAPONS.forEach((w, i) => {
    const y = 145 + i * 42;
    if (mouseX >= leftX && mouseX <= leftX + colW && mouseY >= y && mouseY <= y + 36) {
      buyWeapon(i);
    }
  });

  UPGRADES.forEach((u, i) => {
    const y = 145 + i * 42;
    if (mouseX >= rightX && mouseX <= rightX + colW && mouseY >= y && mouseY <= y + 36) {
      buyUpgrade(u.name);
    }
  });
}
