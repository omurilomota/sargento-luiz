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
 * Estilo RPG Fantasy com fundo decorativo e botões temáticos.
 * @param ctx - contexto 2D do canvas
 * @param width - largura do canvas
 * @param height - altura do canvas
 * @param mouseX - posição horizontal do mouse
 * @param mouseY - posição vertical do mouse
 */
export function drawShop(ctx: CanvasRenderingContext2D, width: number, height: number, mouseX: number, mouseY: number) {
  // Fundo decorativo
  ctx.fillStyle = 'rgba(15, 10, 25, 0.98)';
  ctx.fillRect(0, 0, width, height);
  
  // Padrão de textura sutil
  for (let i = 0; i < 50; i++) {
    const x = (i * 137 + Date.now() / 50) % width;
    const y = (i * 97 + Date.now() / 80) % height;
    ctx.fillStyle = `rgba(241, 196, 15, ${0.03 + Math.sin(Date.now() / 1000 + i) * 0.02})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Borda decorativa superior
  ctx.strokeStyle = 'rgba(180, 140, 80, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 70);
  ctx.lineTo(width, 70);
  ctx.stroke();
  
  // Título
  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 48px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#f1c40f';
  ctx.shadowBlur = 25;
  ctx.fillText('MERCADOR', width / 2, 55);
  ctx.shadowBlur = 0;
  
  // Moedas
  ctx.font = '24px "Cinzel", serif';
  ctx.fillStyle = '#f1c40f';
  ctx.fillText(`💰 ${shopCoins} Ouros`, width / 2, 95);
  
  // Layout em 2 colunas
  const colW = width / 2 - 60;
  const leftX = 40;
  const rightX = width / 2 + 20;
  
  // === COLUNA ESQUERDA: ARMAS ===
  ctx.fillStyle = '#e67e22';
  ctx.font = 'bold 20px "Cinzel", serif';
  ctx.textAlign = 'left';
  ctx.shadowColor = '#e67e22';
  ctx.shadowBlur = 10;
  ctx.fillText('⚔ ARMAS', leftX, 135);
  ctx.shadowBlur = 0;
  
  // Separador
  ctx.strokeStyle = 'rgba(230, 126, 34, 0.3)';
  ctx.beginPath();
  ctx.moveTo(leftX, 145);
  ctx.lineTo(leftX + colW, 145);
  ctx.stroke();
  
  WEAPONS.forEach((w, i) => {
    const y = 160 + i * 48;
    const owned = purchasedWeapons.includes(i);
    const canBuy = !owned && shopCoins >= w.price;
    const hover = mouseX >= leftX && mouseX <= leftX + colW && mouseY >= y && mouseY <= y + 42;
    
    // Fundo do item
    ctx.fillStyle = hover ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)';
    ctx.beginPath();
    ctx.roundRect(leftX, y, colW, 42, 6);
    ctx.fill();
    
    // Borda
    ctx.strokeStyle = owned ? '#2ecc71' : canBuy ? w.color : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Nome da arma
    ctx.fillStyle = owned ? '#2ecc71' : canBuy ? '#fff' : '#666';
    ctx.font = '14px "Cinzel", serif';
    ctx.textAlign = 'left';
    ctx.fillText(w.name, leftX + 12, y + 18);
    
    // Preço ou status
    ctx.textAlign = 'right';
    ctx.font = '12px monospace';
    if (owned) {
      ctx.fillStyle = '#2ecc71';
      ctx.fillText('✓ ADQUIRIDA', leftX + colW - 12, y + 18);
    } else {
      ctx.fillStyle = canBuy ? '#f1c40f' : '#666';
      ctx.fillText(`${w.price} 💰`, leftX + colW - 12, y + 18);
    }
    
    // Stats da arma
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`DMG: ${w.damage} | SPD: ${w.shootRate}s`, leftX + 12, y + 35);
  });
  
  // === COLUNA DIREITA: UPGRADES ===
  ctx.fillStyle = '#9b59b6';
  ctx.font = 'bold 20px "Cinzel", serif';
  ctx.textAlign = 'left';
  ctx.shadowColor = '#9b59b6';
  ctx.shadowBlur = 10;
  ctx.fillText('✨ UPGRADES', rightX, 135);
  ctx.shadowBlur = 0;
  
  // Separador
  ctx.strokeStyle = 'rgba(155, 89, 182, 0.3)';
  ctx.beginPath();
  ctx.moveTo(rightX, 145);
  ctx.lineTo(rightX + colW, 145);
  ctx.stroke();
  
  UPGRADES.forEach((u, i) => {
    const y = 160 + i * 48;
    const owned = purchasedUpgrades.includes(u.name);
    const canBuy = !owned && shopCoins >= u.price;
    const hover = mouseX >= rightX && mouseX <= rightX + colW && mouseY >= y && mouseY <= y + 42;
    
    // Fundo do item
    ctx.fillStyle = hover ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)';
    ctx.beginPath();
    ctx.roundRect(rightX, y, colW, 42, 6);
    ctx.fill();
    
    // Borda
    ctx.strokeStyle = owned ? '#2ecc71' : canBuy ? '#9b59b6' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Nome do upgrade
    ctx.fillStyle = owned ? '#2ecc71' : canBuy ? '#fff' : '#666';
    ctx.font = '14px "Cinzel", serif';
    ctx.textAlign = 'left';
    ctx.fillText(u.name, rightX + 12, y + 18);
    
    // Preço ou status
    ctx.textAlign = 'right';
    ctx.font = '12px monospace';
    if (owned) {
      ctx.fillStyle = '#2ecc71';
      ctx.fillText('✓ ATIVO', rightX + colW - 12, y + 18);
    } else {
      ctx.fillStyle = canBuy ? '#f1c40f' : '#666';
      ctx.fillText(`${u.price} 💰`, rightX + colW - 12, y + 18);
    }
    
    // Efeito do upgrade
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    const effectText = u.effect === 'health' ? `+${u.value} Vida` :
      u.effect === 'speed' ? `+${u.value * 100}% Vel` :
      u.effect === 'damage' ? `+${u.value * 100}% Dano` :
      u.effect === 'shield' ? '+1 Escudo' :
      u.effect === 'magnet' ? 'Magnetismo' :
      u.effect === 'crit' ? `+${u.value * 100}% Crítico` :
      u.effect === 'pierce' ? '+1 Pierce' : u.effect;
    ctx.fillText(effectText, rightX + 12, y + 35);
  });
  
  // Borda decorativa inferior
  ctx.strokeStyle = 'rgba(180, 140, 80, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, height - 50);
  ctx.lineTo(width, height - 50);
  ctx.stroke();
  
  // Instrução
  ctx.fillStyle = '#2ecc71';
  ctx.font = '16px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.fillText('Pressione ENTER para continuar', width / 2, height - 25);
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
    const y = 160 + i * 48;
    if (mouseX >= leftX && mouseX <= leftX + colW && mouseY >= y && mouseY <= y + 42) {
      buyWeapon(i);
    }
  });

  UPGRADES.forEach((u, i) => {
    const y = 160 + i * 48;
    if (mouseX >= rightX && mouseX <= rightX + colW && mouseY >= y && mouseY <= y + 42) {
      buyUpgrade(u.name);
    }
  });
}
