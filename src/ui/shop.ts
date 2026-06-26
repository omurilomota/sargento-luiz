/**
 * Tela de loja.
 * Permite ao jogador comprar armas e upgrades entre fases.
 * Renderiza botões interativos e processa cliques para compras.
 */

import { WEAPONS, UPGRADES } from '../config';
import { isGameCompleted } from '../systems/saveSystem';
import { setWeapon, addDamageMultiplier, addPierce, addCrit, addReloadSpeed } from '../weapons';
import { addMaxHealth, addSpeed, addShield, enableRegen, addArmor } from '../entities/player';
import { getUnlockedDiary } from '../systems/diary';
import { enablePermanentMagnet } from '../entities/coin';
import { getAllSkins, buySkin, equipSkin, getEquippedSkin, Skin } from '../systems/skins';
import { canWatchAd, startWatchingAd, getIsWatchingAd, getAdProgress, getAdCooldown, getLastAdReward, getNextAdReward, getAdsWatched, updateAd } from '../systems/ads';
import { getGameState } from '../phases';

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
  if (effect === 'health') addMaxHealth(value);
  if (effect === 'speed') addSpeed(value);
  if (effect === 'shield') addShield(value);
  if (effect === 'magnet') enablePermanentMagnet();
  if (effect === 'regen') enableRegen();
  if (effect === 'reloadSpeed') addReloadSpeed(value);
  if (effect === 'armor') addArmor(value);
}

/**
 * Reseta o estado da loja: arma padrão, sem upgrades, moedas zeradas.
 */
export function resetShop() {
  purchasedWeapons = [0];
  purchasedUpgrades = [];
  shopScrollOffset = 0;
}

/**
 * Atualiza o timer de ads (chamar quando na loja).
 * @param dt - delta time em segundos
 */
export function updateShopAds(dt: number) {
  const reward = updateAd(dt);
  if (reward > 0) {
    shopCoins += reward;
  }
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

/** Offset de scroll da loja */
let shopScrollOffset = 0;

/** Handler do wheel para scroll na loja */
function onShopWheel(e: WheelEvent) {
  if (getGameState() !== 'shop') return;
  shopScrollOffset = Math.max(0, shopScrollOffset + e.deltaY * 0.5);
}
document.addEventListener('wheel', onShopWheel);

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
  // Calcular altura total do conteúdo scrollável
  const colW = width / 2 - 60;
  const leftX = 40;
  const contentStart = 100;
  const allSkins = getAllSkins();
  const skinCols = 5;
  const skinSize = 44;
  const skinGap = 6;
  const skinsBlockH = Math.ceil(allSkins.length / skinCols) * (skinSize + skinGap + 12);
  const totalContentH = Math.max(WEAPONS.length, UPGRADES.length) * 42 + 20 + skinsBlockH + 100;
  const maxScroll = Math.max(0, totalContentH - (height - contentStart - 40));
  shopScrollOffset = Math.min(shopScrollOffset, maxScroll);

  // Fundo
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, width, height);

  // Header fixo (não rola)
  ctx.fillStyle = '#a08050';
  ctx.font = 'bold 32px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MERCADOR', width / 2, 45);
  ctx.font = '16px monospace';
  ctx.fillText(`${shopCoins} moedas`, width / 2, 82);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, contentStart);
  ctx.lineTo(width, contentStart);
  ctx.stroke();

  // Clip e scroll para conteúdo
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, contentStart, width, height - contentStart - 40);
  ctx.clip();
  ctx.translate(0, -shopScrollOffset);

  const rightX = width / 2 + 20;

  // === ARMAS ===
  ctx.fillStyle = '#b07050';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ARMAS', leftX, 120);
  ctx.strokeStyle = 'rgba(176,112,80,0.2)';
  ctx.beginPath();
  ctx.moveTo(leftX, 130);
  ctx.lineTo(leftX + colW, 130);
  ctx.stroke();

  WEAPONS.forEach((w, i) => {
    if (w.secret && !isGameCompleted()) return;
    const y = 145 + i * 42;
    const owned = purchasedWeapons.includes(i);
    const canBuy = !owned && shopCoins >= w.price;
    const hover = mouseX >= leftX && mouseX <= leftX + colW && mouseY + shopScrollOffset >= y && mouseY + shopScrollOffset <= y + 38;

    ctx.fillStyle = hover ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)';
    ctx.beginPath();
    ctx.roundRect(leftX, y, colW, 38, 4);
    ctx.fill();
    ctx.strokeStyle = owned ? '#7a9a6a' : canBuy ? 'rgba(176,112,80,0.4)' : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = owned ? '#7a9a6a' : canBuy ? '#ccc' : '#555';
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(w.name, leftX + 10, y + 16);

    ctx.textAlign = 'right';
    ctx.font = '11px monospace';
    if (owned) {
      ctx.fillStyle = '#7a9a6a';
      ctx.fillText('ADQUIRIDA', leftX + colW - 10, y + 16);
    } else {
      ctx.fillStyle = canBuy ? '#a08050' : '#444';
      ctx.fillText(`${w.price}`, leftX + colW - 10, y + 16);
    }

    ctx.fillStyle = '#555';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`DMG:${w.damage} SPD:${w.shootRate}s`, leftX + 10, y + 30);
  });

  // === COLUNA DIREITA: UPGRADES ===
  ctx.fillStyle = '#8070a0';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('UPGRADES', rightX, 120);

  // Separador
  ctx.strokeStyle = 'rgba(128,112,160,0.2)';
  ctx.beginPath();
  ctx.moveTo(rightX, 130);
  ctx.lineTo(rightX + colW, 130);
  ctx.stroke();

  UPGRADES.forEach((u, i) => {
    const y = 145 + i * 42;
    const owned = purchasedUpgrades.includes(u.name);
    const canBuy = !owned && shopCoins >= u.price;
    const hover = mouseX >= rightX && mouseX <= rightX + colW && mouseY + shopScrollOffset >= y && mouseY + shopScrollOffset <= y + 38;

    ctx.fillStyle = hover ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)';
    ctx.beginPath();
    ctx.roundRect(rightX, y, colW, 38, 4);
    ctx.fill();
    ctx.strokeStyle = owned ? '#7a9a6a' : canBuy ? 'rgba(128,112,160,0.4)' : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Nome do upgrade
    ctx.fillStyle = owned ? '#7a9a6a' : canBuy ? '#ccc' : '#555';
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(u.name, rightX + 10, y + 16);

    // Preço ou status
    ctx.textAlign = 'right';
    ctx.font = '11px monospace';
    if (owned) {
      ctx.fillStyle = '#7a9a6a';
      ctx.fillText('ATIVO', rightX + colW - 10, y + 16);
    } else {
      ctx.fillStyle = canBuy ? '#a08050' : '#444';
      ctx.fillText(`${u.price}`, rightX + colW - 10, y + 16);
    }

    // Efeito do upgrade
    ctx.fillStyle = '#555';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    const effectText = u.effect === 'health' ? `+${u.value} Vida` :
      u.effect === 'speed' ? `+${u.value * 100}% Vel` :
      u.effect === 'damage' ? `+${u.value * 100}% Dano` :
      u.effect === 'shield' ? '+1 Escudo' :
      u.effect === 'magnet' ? 'Magnetismo' :
      u.effect === 'crit' ? `+${u.value * 100}% Crit` :
      u.effect === 'pierce' ? '+1 Pierce' :
      u.effect === 'regen' ? 'Regeneracao' :
      u.effect === 'reloadSpeed' ? `+${Math.round(u.value * 100)}% Recarga` : u.effect;
    ctx.fillText(effectText, rightX + 10, y + 30);
  });

  // === SKINS SECTION ===
  const skinsY = 145 + UPGRADES.length * 42 + 20;

  ctx.fillStyle = '#608090';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SKINS', leftX, skinsY);

  ctx.strokeStyle = 'rgba(96,128,144,0.2)';
  ctx.beginPath();
  ctx.moveTo(leftX, skinsY + 10);
  ctx.lineTo(leftX + colW, skinsY + 10);
  ctx.stroke();

  const skinStartX = leftX;
  const skinStartY = skinsY + 20;

  allSkins.forEach((skin, i) => {
    const col = i % skinCols;
    const row = Math.floor(i / skinCols);
    const x = skinStartX + col * (skinSize + skinGap);
    const y = skinStartY + row * (skinSize + skinGap + 12);
    const equipped = skin.equipped;
    const unlocked = skin.unlocked;
    const canBuy = !unlocked && shopCoins >= skin.price;
    const skinHover = mouseX >= x && mouseX <= x + skinSize && mouseY + shopScrollOffset >= y && mouseY + shopScrollOffset <= y + skinSize;

    // Background
    ctx.fillStyle = equipped ? 'rgba(122,154,106,0.2)' : skinHover ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)';
    ctx.beginPath();
    ctx.roundRect(x, y, skinSize, skinSize, 4);
    ctx.fill();

    // Border
    ctx.strokeStyle = equipped ? '#7a9a6a' : unlocked ? 'rgba(255,255,255,0.1)' : canBuy ? 'rgba(96,128,144,0.3)' : 'rgba(255,255,255,0.04)';
    ctx.lineWidth = equipped ? 2 : 1;
    ctx.stroke();

    // Skin preview (circle)
    ctx.fillStyle = unlocked ? skin.bodyColor : '#222';
    ctx.beginPath();
    ctx.arc(x + skinSize / 2, y + skinSize / 2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = unlocked ? skin.borderColor : '#333';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Lock icon
    if (!unlocked) {
      ctx.fillStyle = '#444';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('#', x + skinSize / 2, y + skinSize / 2 + 4);
    }

    // Name below
    ctx.fillStyle = unlocked ? '#999' : '#444';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(skin.name, x + skinSize / 2, y + skinSize + 11);

    // Price or equipped status
    if (!unlocked) {
      ctx.fillStyle = canBuy ? '#a08050' : '#333';
      ctx.font = '9px monospace';
      ctx.fillText(`${skin.price}`, x + skinSize / 2, y + skinSize + 20);
    }
  });

  // === ADS SECTION ===
  const adsY = skinStartY + Math.ceil(allSkins.length / skinCols) * (skinSize + skinGap + 12) + 15;

  ctx.fillStyle = '#b07050';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ANUNCIOS', leftX, adsY);

  ctx.strokeStyle = 'rgba(176,112,80,0.2)';
  ctx.beginPath();
  ctx.moveTo(leftX, adsY + 10);
  ctx.lineTo(leftX + colW, adsY + 10);
  ctx.stroke();

  const adBtnX = leftX;
  const adBtnY = adsY + 25;
  const adBtnW = 280;
  const adBtnH = 60;
  const adHover = mouseX >= adBtnX && mouseX <= adBtnX + adBtnW && mouseY >= adBtnY && mouseY <= adBtnY + adBtnH;

  if (getIsWatchingAd()) {
    // Watching ad - show progress
    ctx.fillStyle = 'rgba(176,112,80,0.15)';
    ctx.beginPath();
    ctx.roundRect(adBtnX, adBtnY, adBtnW, adBtnH, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(176,112,80,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Progress bar
    const progress = getAdProgress();
    ctx.fillStyle = '#b07050';
    ctx.fillRect(adBtnX + 8, adBtnY + 22, (adBtnW - 16) * progress, 8);

    ctx.fillStyle = '#ccc';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Assistindo... ${Math.floor(progress * 100)}%`, adBtnX + adBtnW / 2, adBtnY + 16);

    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.fillText(`+${getNextAdReward()}`, adBtnX + adBtnW / 2, adBtnY + 45);
  } else if (canWatchAd()) {
    // Can watch - show button
    ctx.fillStyle = adHover ? 'rgba(176,112,80,0.2)' : 'rgba(255,255,255,0.03)';
    ctx.beginPath();
    ctx.roundRect(adBtnX, adBtnY, adBtnW, adBtnH, 4);
    ctx.fill();
    ctx.strokeStyle = adHover ? 'rgba(176,112,80,0.4)' : 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ccc';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ASSISTIR ANUNCIO', adBtnX + adBtnW / 2, adBtnY + 20);

    ctx.fillStyle = '#a08050';
    ctx.font = '11px monospace';
    ctx.fillText(`+${getNextAdReward()}`, adBtnX + adBtnW / 2, adBtnY + 38);

    ctx.fillStyle = '#555';
    ctx.font = '10px monospace';
    ctx.fillText(`Assistidos: ${getAdsWatched()}`, adBtnX + adBtnW / 2, adBtnY + 52);
  } else {
    // Cooldown
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.beginPath();
    ctx.roundRect(adBtnX, adBtnY, adBtnW, adBtnH, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#555';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Cooldown: ${Math.ceil(getAdCooldown())}s`, adBtnX + adBtnW / 2, adBtnY + 22);

    ctx.fillStyle = '#444';
    ctx.font = '10px monospace';
    ctx.fillText(`+${getNextAdReward()}`, adBtnX + adBtnW / 2, adBtnY + 40);
  }

  // === DIÁRIO ===
  const diaryEntries = getUnlockedDiary();
  if (diaryEntries.length > 0) {
    const diaryY = adsY + 90;
    ctx.fillStyle = '#608090';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('DIÁRIO DE BORDO', leftX, diaryY);

    ctx.strokeStyle = 'rgba(96,128,144,0.2)';
    ctx.beginPath();
    ctx.moveTo(leftX, diaryY + 10);
    ctx.lineTo(leftX + colW, diaryY + 10);
    ctx.stroke();

    let entryY = diaryY + 25;
    for (const entry of diaryEntries.slice(-3)) {
      ctx.fillStyle = '#888';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(entry.title, leftX, entryY);
      ctx.fillStyle = '#555';
      ctx.font = '10px monospace';
      const preview = entry.text.substring(0, 80) + '...';
      ctx.fillText(preview, leftX, entryY + 14);
      entryY += 32;
    }
  }

  ctx.restore();

  // Linha inferior
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height - 40);
  ctx.lineTo(width, height - 40);
  ctx.stroke();

  // Instrução
  ctx.fillStyle = '#666';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ENTER para continuar', width / 2, height - 20);
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
  const scrollY = mouseY + shopScrollOffset;

  WEAPONS.forEach((w, i) => {
    const y = 145 + i * 42;
    if (mouseX >= leftX && mouseX <= leftX + colW && scrollY >= y && scrollY <= y + 38) {
      buyWeapon(i);
    }
  });

  UPGRADES.forEach((u, i) => {
    const y = 145 + i * 42;
    if (mouseX >= rightX && mouseX <= rightX + colW && scrollY >= y && scrollY <= y + 38) {
      buyUpgrade(u.name);
    }
  });

  // Skin clicks
  const allSkins = getAllSkins();
  const skinsY = 145 + UPGRADES.length * 42 + 20;
  const skinSize = 44;
  const skinGap = 6;
  const skinStartX = leftX;
  const skinStartY = skinsY + 20;
  const skinCols = 5;

  allSkins.forEach((skin, i) => {
    const col = i % skinCols;
    const row = Math.floor(i / skinCols);
    const x = skinStartX + col * (skinSize + skinGap);
    const y = skinStartY + row * (skinSize + skinGap + 12);

    if (mouseX >= x && mouseX <= x + skinSize && scrollY >= y && scrollY <= y + skinSize) {
      if (skin.unlocked) {
        equipSkin(i);
      } else {
        const result = buySkin(i, shopCoins);
        if (result.success) {
          shopCoins -= result.cost;
          equipSkin(i);
        }
      }
    }
  });

  // Ad button click
  const adsY = skinStartY + Math.ceil(allSkins.length / skinCols) * (skinSize + skinGap + 12) + 15;
  const adBtnX = leftX;
  const adBtnY = adsY + 25;
  const adBtnW = 280;
  const adBtnH = 60;

  if (mouseX >= adBtnX && mouseX <= adBtnX + adBtnW && scrollY >= adBtnY && scrollY <= adBtnY + adBtnH) {
    if (canWatchAd()) {
      startWatchingAd();
    }
  }
}
