/**
 * Tela de loja.
 * Permite ao jogador comprar armas e upgrades entre fases.
 * Renderiza botões interativos e processa cliques para compras.
 */

import { WEAPONS, UPGRADES } from '../config';
import { setWeapon, addDamageMultiplier, addPierce, addCrit } from '../weapons';

/** Saldo atual de moedas do jogador */
let shopCoins = 0;
/** Índices das armas já compradas (começa com a arma padrão) */
let purchasedWeapons: number[] = [0];
/** Nomes dos upgrades já comprados */
let purchasedUpgrades: string[] = [];

/**
 * Define o saldo de moedas do jogador na loja.
 * @param amount - quantidade de moedas
 */
export function setShopCoins(amount: number) { shopCoins = amount; }

/**
 * Retorna o saldo atual de moedas.
 * @returns quantidade de moedas disponíveis
 */
export function getShopCoins(): number { return shopCoins; }

/**
 * Adiciona moedas ao saldo do jogador.
 * @param amount - quantidade a adicionar
 */
export function addShopCoins(amount: number) { shopCoins += amount; }

/**
 * Retorna os índices das armas já compradas.
 * @returns array de índices de armas compradas
 */
export function getPurchasedWeapons(): number[] { return purchasedWeapons; }

/**
 * Retorna os nomes dos upgrades já comprados.
 * @returns array de nomes de upgrades comprados
 */
export function getPurchasedUpgrades(): string[] { return purchasedUpgrades; }

/**
 * Tenta comprar uma arma pelo índice.
 * @param index - índice da arma no array WEAPONS
 * @returns true se a compra foi bem-sucedida
 */
export function buyWeapon(index: number): boolean {
  if (purchasedWeapons.includes(index)) return false;
  if (shopCoins < WEAPONS[index].price) return false;
  shopCoins -= WEAPONS[index].price;
  purchasedWeapons.push(index);
  setWeapon(index);
  return true;
}

/**
 * Tenta comprar um upgrade pelo nome.
 * @param name - nome do upgrade (chave no array UPGRADES)
 * @returns true se a compra foi bem-sucedida
 */
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

/**
 * Aplica o efeito de um upgrade ao sistema correspondente.
 * @param effect - identificador do efeito (damage, pierce, crit)
 * @param value - valor do efeito
 */
function applyUpgrade(effect: string, value: number) {
  if (effect === 'damage') addDamageMultiplier(value);
  if (effect === 'pierce') addPierce(value);
  if (effect === 'crit') addCrit(value);
}

/**
 * Reseta o estado da loja: arma padrão, sem upgrades, moedas zeradas.
 */
export function resetShop() {
  purchasedWeapons = [0];
  purchasedUpgrades = [];
}

/**
 * Desenha um botão retangular com cantos arredondados.
 * @param ctx - contexto 2D do canvas
 * @param x - posição horizontal
 * @param y - posição vertical
 * @param w - largura do botão
 * @param h - altura do botão
 * @param text - texto exibido no botão
 * @param color - cor de destaque
 * @param hovered - true se o mouse está sobre o botão
 */
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

/** Índice Y da loja (para scroll futuro) */
let shopHoverY = 0;
/** Offset de scroll da loja */
let shopScrollOffset = 0;

/**
 * Desenha a tela completa da loja com armas e upgrades.
 * @param ctx - contexto 2D do canvas
 * @param width - largura do canvas
 * @param height - altura do canvas
 * @param mouseX - posição horizontal do mouse
 * @param mouseY - posição vertical do mouse
 */
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

/**
 * Processa cliques do mouse na loja.
 * Verifica se o clique foi em algum botão de arma ou upgrade.
 * @param mouseX - posição horizontal do clique
 * @param mouseY - posição vertical do clique
 */
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
