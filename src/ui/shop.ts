/**
 * Tela de loja.
 *
 * A geometria vem de UMA função (`getShopLayout`) consumida tanto pelo draw
 * quanto pelo hit-test. Antes o draw usava `leftX=40, colW=w/2-60` e o clique
 * usava `leftX=20, colW=w/2-40` — o bug que o histórico diz ter "corrigido"
 * e que continuou aberto: os cliques batiam em outra coluna.
 */

import { WEAPONS, UPGRADES } from '../config';
import { isGameCompleted } from '../systems/saveSystem';
import { setWeapon, addDamageMultiplier, addPierce, addCrit, addReloadSpeed, getCurrentWeapon } from '../weapons';
import { addMaxHealth, addSpeed, addShield, enableRegen, addArmor } from '../entities/player';
import { getUnlockedDiary } from '../systems/diary';
import { enablePermanentMagnet } from '../entities/coin';
import { getAllSkins, buySkin, equipSkin, Skin } from '../systems/skins';
import { canWatchAd, startWatchingAd, getIsWatchingAd, getAdProgress, getAdCooldown, getNextAdReward, getAdsWatched, updateAd } from '../systems/ads';
import { getGameState } from '../phases';
import { sfxBuy, sfxError } from '../systems/audio';
import { PALETTE } from '../core/palette';

/** Saldo atual de moedas do jogador */
let shopCoins = 0;
/** Índices das armas já compradas (começa com a arma padrão) */
let purchasedWeapons: number[] = [0];
/** Nomes dos upgrades já comprados */
let purchasedUpgrades: string[] = [];
/** Aviso temporário (ex: SEM MOEDAS) exibido sobre o conteúdo */
let notice: { text: string; time: number; color: string } | null = null;

export function setShopCoins(amount: number) { shopCoins = amount; }
export function getShopCoins(): number { return shopCoins; }
export function addShopCoins(amount: number) { shopCoins += amount; }
export function getPurchasedWeapons(): number[] { return purchasedWeapons; }
export function getPurchasedUpgrades(): string[] { return purchasedUpgrades; }

/**
 * Tenta comprar uma arma pelo índice. Se já foi comprada, apenas equipa.
 * @param index - índice da arma no array WEAPONS
 * @returns true se a compra/equipamento foi bem-sucedido
 */
export function buyWeapon(index: number): boolean {
  const w = WEAPONS[index];
  if (!w) return false;
  if (purchasedWeapons.includes(index)) {
    setWeapon(index);
    flashNotice('EQUIPADA', PALETTE.moss);
    sfxBuy();
    return true;
  }
  if (shopCoins < w.price) {
    flashNotice('SEM MOEDAS', PALETTE.danger);
    sfxError();
    return false;
  }
  shopCoins -= w.price;
  purchasedWeapons.push(index);
  setWeapon(index);
  flashNotice(`${w.name} ADQUIRIDA`, PALETTE.moss);
  sfxBuy();
  return true;
}

/**
 * Tenta comprar um upgrade pelo nome.
 */
export function buyUpgrade(name: string): boolean {
  if (purchasedUpgrades.includes(name)) return false;
  const upgrade = UPGRADES.find(u => u.name === name);
  if (!upgrade) return false;
  if (shopCoins < upgrade.price) {
    flashNotice('SEM MOEDAS', PALETTE.danger);
    sfxError();
    return false;
  }
  shopCoins -= upgrade.price;
  purchasedUpgrades.push(name);
  applyUpgrade(upgrade.effect, upgrade.value);
  flashNotice(`${upgrade.name} ATIVO`, PALETTE.moss);
  sfxBuy();
  return true;
}

function applyUpgrade(effect: string, value: number) {
  if (effect === 'damage') addDamageMultiplier(value);
  if (effect === 'pierce') addPierce(value);
  if (effect === 'crit') addCrit(value);
  if (effect === 'health') addMaxHealth(value);
  if (effect === 'speed') addSpeed(value);
  if (effect === 'shield') addShield(value);
  if (effect === 'magnet') enablePermanentMagnet();
  if (effect === 'regen') enableRegen(value);
  if (effect === 'reloadSpeed') addReloadSpeed(value);
  if (effect === 'armor') addArmor(value);
}

export function resetShop() {
  purchasedWeapons = [0];
  purchasedUpgrades = [];
  shopScrollOffset = 0;
  notice = null;
}

export function updateShopAds(dt: number) {
  const reward = updateAd(dt);
  if (reward > 0) shopCoins += reward;
  if (notice && notice.time > 0) {
    notice.time -= dt;
    if (notice.time <= 0) notice = null;
  }
}

function flashNotice(text: string, color: string) {
  notice = { text, color, time: 1.2 };
}

// ─── Geometria única ───────────────────────────────────────────

export interface Rect { x: number; y: number; w: number; h: number }

export interface ShopLayout {
  weapons: Rect[];
  upgrades: Rect[];
  skins: Rect[];
  ad: Rect;
  /** Área visível do conteúdo scrolável (define a região de clip) */
  clip: Rect;
  /** Y do topo de cada seção (rótulos) */
  sections: { weapons: number; upgrades: number; skins: number; ads: number; diary: number };
  contentHeight: number;
  maxScroll: number;
}

const ROW_H = 42;
const ROW_TOP = 145;
const SECTION_GAP = 20;
const SKIN_COLS = 5;
const SKIN_SIZE = 44;
const SKIN_GAP = 6;
const SKIN_ROW_H = SKIN_SIZE + SKIN_GAP + 12;

/**
 * Calcula todos os retângulos da loja para uma largura de tela.
 * Única fonte de verdade: o draw e o hit-test consomem exatamente isto.
 * @param width - largura do canvas
 * @param height - altura do canvas
 */
export function getShopLayout(width: number, height: number): ShopLayout {
  const completed = isGameCompleted();
  const leftX = 40;
  const rightX = width / 2 + 20;
  const colW = width / 2 - 60;
  const contentStart = 100;
  const skinsCount = getAllSkins().length;
  const skinRows = Math.ceil(skinsCount / SKIN_COLS);

  const weapons: Rect[] = [];
  for (let i = 0; i < WEAPONS.length; i++) {
    const w = WEAPONS[i];
    const secret = !!w.secret && !completed;
    weapons.push({ x: leftX, y: ROW_TOP + i * ROW_H, w: colW, h: 38, ...(secret ? { secret: true } : {}) } as Rect & { secret?: boolean });
  }

  const upgrades: Rect[] = UPGRADES.map((_, i) => ({
    x: rightX, y: ROW_TOP + i * ROW_H, w: colW, h: 38,
  }));

  const skinsY = ROW_TOP + UPGRADES.length * ROW_H + SECTION_GAP;
  const skins: Rect[] = [];
  for (let i = 0; i < skinsCount; i++) {
    const col = i % SKIN_COLS;
    const row = Math.floor(i / SKIN_COLS);
    skins.push({
      x: leftX + col * (SKIN_SIZE + SKIN_GAP),
      y: skinsY + 20 + row * SKIN_ROW_H,
      w: SKIN_SIZE,
      h: SKIN_SIZE,
    });
  }

  const adsY = skinsY + 20 + skinRows * SKIN_ROW_H + 15;
  const ad: Rect = { x: leftX, y: adsY + 25, w: 280, h: 60 };

  const diaryY = ad.y + ad.h + 45;
  const contentHeight = diaryY + 120 - contentStart;
  const maxScroll = Math.max(0, contentHeight - (height - contentStart - 40));

  return {
    weapons, upgrades, skins, ad,
    clip: { x: 0, y: contentStart, w: width, h: height - contentStart - 40 },
    sections: { weapons: ROW_TOP - 25, upgrades: ROW_TOP - 25, skins: skinsY, ads: adsY, diary: diaryY },
    contentHeight,
    maxScroll,
  };
}

// ─── Desenho ───────────────────────────────────────────────────

let shopScrollOffset = 0;

function onShopWheel(e: WheelEvent) {
  if (getGameState() !== 'shop') return;
  shopScrollOffset = Math.max(0, shopScrollOffset + e.deltaY * 0.5);
}

/**
 * Registra o scroll da loja. Chamado pelo `main.ts` (e não no topo do módulo)
 * para o layout puro continuar testável fora do navegador.
 */
export function attachShopWheelListener(): void {
  document.addEventListener('wheel', onShopWheel);
}

function hit(r: Rect, mx: number, my: number): boolean {
  return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
}

/**
 * Desenha a tela completa da loja usando o mesmo layout do hit-test.
 */
export function drawShop(ctx: CanvasRenderingContext2D, width: number, height: number, mouseX: number, mouseY: number) {
  const L = getShopLayout(width, height);
  shopScrollOffset = Math.min(shopScrollOffset, L.maxScroll);
  const scrollY = mouseY + shopScrollOffset;
  const equipped = getCurrentWeapon().name;

  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, width, height);

  // header fixo
  ctx.fillStyle = PALETTE.mustard;
  ctx.font = 'bold 30px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MERCADOR', width / 2, 44);
  ctx.font = '15px monospace';
  ctx.fillText(`${shopCoins} moedas`, width / 2, 76);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, L.clip.y + 0.5);
  ctx.lineTo(width, L.clip.y + 0.5);
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.rect(L.clip.x, L.clip.y, L.clip.w, L.clip.h);
  ctx.clip();
  ctx.translate(0, -shopScrollOffset);

  // ── ARMAS ──
  sectionLabel(ctx, 'ARMAS', L.weapons[0].x, L.sections.weapons, PALETTE.terracotta);
  L.weapons.forEach((r, i) => {
    const w = WEAPONS[i];
    const secret = (r as Rect & { secret?: boolean }).secret;
    if (secret) {
      // item secreto: antes era um buraco invisível clicável
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      ctx.fillStyle = PALETTE.textOff;
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('???', r.x + 10, r.y + 16);
      ctx.textAlign = 'right';
      ctx.fillStyle = PALETTE.danger;
      ctx.font = '10px monospace';
      ctx.fillText('BLOQUEADO', r.x + r.w - 10, r.y + 16);
      ctx.textAlign = 'left';
      return;
    }

    const owned = purchasedWeapons.includes(i);
    const isEquipped = equipped === w.name;
    const canBuy = !owned && shopCoins >= w.price;
    const hover = hit(r, mouseX, scrollY);

    ctx.fillStyle = hover ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = isEquipped ? PALETTE.moss : owned ? 'rgba(122,154,106,0.45)' : canBuy ? 'rgba(176,112,80,0.4)' : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = isEquipped ? 2 : 1;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

    ctx.fillStyle = isEquipped ? PALETTE.moss : owned ? '#9aae8a' : canBuy ? PALETTE.text : PALETTE.textOff;
    ctx.font = isEquipped ? 'bold 13px monospace' : '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(w.name, r.x + 10, r.y + 16);

    ctx.textAlign = 'right';
    ctx.font = '11px monospace';
    if (isEquipped) {
      ctx.fillStyle = PALETTE.moss;
      ctx.fillText('EQUIPADA', r.x + r.w - 10, r.y + 16);
    } else if (owned) {
      ctx.fillStyle = PALETTE.moss;
      ctx.fillText('ADQUIRIDA', r.x + r.w - 10, r.y + 16);
    } else {
      ctx.fillStyle = canBuy ? PALETTE.mustard : PALETTE.textOff;
      ctx.fillText(`${w.price}`, r.x + r.w - 10, r.y + 16);
    }

    ctx.fillStyle = PALETTE.textOff;
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`DANO ${w.damage} · ${w.shootRate}s · ${w.magazineSize} tiros`, r.x + 10, r.y + 30);
  });

  // ── UPGRADES ──
  sectionLabel(ctx, 'UPGRADES', L.upgrades[0].x, L.sections.upgrades, '#8a7a9a');
  L.upgrades.forEach((r, i) => {
    const u = UPGRADES[i];
    const owned = purchasedUpgrades.includes(u.name);
    const canBuy = !owned && shopCoins >= u.price;
    const hover = hit(r, mouseX, scrollY);

    ctx.fillStyle = hover ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = owned ? PALETTE.moss : canBuy ? 'rgba(138,122,154,0.4)' : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

    ctx.fillStyle = owned ? PALETTE.moss : canBuy ? PALETTE.text : PALETTE.textOff;
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(u.name, r.x + 10, r.y + 16);

    ctx.textAlign = 'right';
    ctx.font = '11px monospace';
    ctx.fillStyle = owned ? PALETTE.moss : canBuy ? PALETTE.mustard : PALETTE.textOff;
    ctx.fillText(owned ? 'ATIVO' : `${u.price}`, r.x + r.w - 10, r.y + 16);

    ctx.fillStyle = PALETTE.textOff;
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(effectText(u.effect, u.value), r.x + 10, r.y + 30);
  });

  // ── SKINS ──
  sectionLabel(ctx, 'SKINS', L.skins.length ? L.skins[0].x : 40, L.sections.skins, PALETTE.stone);
  getAllSkins().forEach((skin, i) => {
    const r = L.skins[i];
    if (!r) return;
    const hover = hit(r, mouseX, scrollY);
    const canBuy = !skin.unlocked && shopCoins >= skin.price;

    ctx.fillStyle = skin.equipped ? 'rgba(122,154,106,0.22)' : hover ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = skin.equipped ? PALETTE.moss : skin.unlocked ? 'rgba(255,255,255,0.1)' : canBuy ? 'rgba(96,128,144,0.3)' : 'rgba(255,255,255,0.04)';
    ctx.lineWidth = skin.equipped ? 2 : 1;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

    ctx.fillStyle = skin.unlocked ? skin.bodyColor : '#222';
    ctx.beginPath();
    ctx.arc(r.x + SKIN_SIZE / 2, r.y + SKIN_SIZE / 2, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = skin.unlocked ? skin.borderColor : '#333';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (!skin.unlocked) {
      ctx.fillStyle = PALETTE.textOff;
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('#', r.x + SKIN_SIZE / 2, r.y + SKIN_SIZE / 2 + 4);
    }

    ctx.fillStyle = skin.unlocked ? PALETTE.textDim : PALETTE.textOff;
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(skin.name, r.x + SKIN_SIZE / 2, r.y + SKIN_SIZE + 11);
    if (!skin.unlocked) {
      ctx.fillStyle = canBuy ? PALETTE.mustard : PALETTE.textOff;
      ctx.fillText(`${skin.price}`, r.x + SKIN_SIZE / 2, r.y + SKIN_SIZE + 20);
    }
  });

  // ── ANÚNCIOS ──
  sectionLabel(ctx, 'ANÚNCIOS', L.ad.x, L.sections.ads, PALETTE.terracotta);
  drawAdButton(ctx, L.ad, hit(L.ad, mouseX, scrollY));

  // ── DIÁRIO ──
  const diaryEntries = getUnlockedDiary();
  if (diaryEntries.length > 0) {
    sectionLabel(ctx, 'DIÁRIO DE BORDO', L.ad.x, L.sections.diary, PALETTE.stone);
    let entryY = L.sections.diary + 25;
    ctx.textAlign = 'left';
    for (const entry of diaryEntries.slice(-3)) {
      ctx.fillStyle = '#888';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(entry.title, L.ad.x, entryY);
      ctx.fillStyle = PALETTE.textOff;
      ctx.font = '10px monospace';
      ctx.fillText(entry.text.substring(0, 80) + '...', L.ad.x, entryY + 14);
      entryY += 32;
    }
  }

  ctx.restore();

  // aviso flutuante: fica logo acima da linha de rodapé, que é a única faixa
  // da tela sem conteúdo de lista (no meio ele cobria as duas colunas)
  if (notice) {
    ctx.globalAlpha = Math.min(1, notice.time);
    ctx.fillStyle = PALETTE.panel;
    ctx.font = 'bold 13px monospace';
    const nw = ctx.measureText(notice.text).width + 28;
    ctx.fillRect(width / 2 - nw / 2, height - 76, nw, 26);
    ctx.fillStyle = notice.color;
    ctx.textAlign = 'center';
    ctx.fillText(notice.text, width / 2, height - 58);
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height - 40);
  ctx.lineTo(width, height - 40);
  ctx.stroke();

  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ENTER para continuar', width / 2, height - 20);
}

function sectionLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + 8);
  ctx.lineTo(x + 200, y + 8);
  ctx.stroke();
}

function drawAdButton(ctx: CanvasRenderingContext2D, r: Rect, hover: boolean) {
  ctx.fillStyle = getIsWatchingAd() ? 'rgba(176,112,80,0.15)' : hover ? 'rgba(176,112,80,0.2)' : 'rgba(255,255,255,0.03)';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = getIsWatchingAd() ? 'rgba(176,112,80,0.4)' : 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.textAlign = 'center';

  if (getIsWatchingAd()) {
    const progress = getAdProgress();
    ctx.fillStyle = PALETTE.terracotta;
    ctx.fillRect(r.x + 8, r.y + 26, (r.w - 16) * progress, 8);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '12px monospace';
    ctx.fillText(`Assistindo... ${Math.floor(progress * 100)}%`, r.x + r.w / 2, r.y + 18);
  } else if (canWatchAd()) {
    ctx.fillStyle = PALETTE.text;
    ctx.font = '13px monospace';
    ctx.fillText('ASSISTIR ANÚNCIO', r.x + r.w / 2, r.y + 20);
    ctx.fillStyle = PALETTE.mustard;
    ctx.font = '11px monospace';
    ctx.fillText(`+${getNextAdReward()}`, r.x + r.w / 2, r.y + 38);
    ctx.fillStyle = PALETTE.textOff;
    ctx.font = '10px monospace';
    ctx.fillText(`Assistidos: ${getAdsWatched()}`, r.x + r.w / 2, r.y + 52);
  } else {
    ctx.fillStyle = PALETTE.textOff;
    ctx.font = '12px monospace';
    ctx.fillText(`Cooldown: ${Math.ceil(getAdCooldown())}s`, r.x + r.w / 2, r.y + 22);
    ctx.fillStyle = PALETTE.textOff;
    ctx.font = '10px monospace';
    ctx.fillText(`+${getNextAdReward()}`, r.x + r.w / 2, r.y + 40);
  }
}

function effectText(effect: string, value: number): string {
  switch (effect) {
    case 'health': return `+${value} de vida`;
    case 'speed': return `+${Math.round(value * 100)}% velocidade`;
    case 'damage': return `+${Math.round(value * 100)}% dano`;
    case 'shield': return `+${value} escudo`;
    case 'magnet': return 'atrai moedas';
    case 'crit': return `+${Math.round(value * 100)}% crítico`;
    case 'pierce': return `+${value} pierce`;
    case 'regen': return `+${value} vida/s`;
    case 'reloadSpeed': return `+${Math.round(value * 100)}% recarga rápida`;
    case 'armor': return `+${Math.round(value * 100)}% resistência`;
    default: return effect;
  }
}

/**
 * Processa cliques na loja usando exatamente o mesmo layout do draw.
 * @param mouseX - X do clique na tela
 * @param mouseY - Y do clique na tela
 */
export function handleShopClick(mouseX: number, mouseY: number) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const L = getShopLayout(width, height);
  const y = mouseY + shopScrollOffset;

  // clique fora da região de clip não compra nada
  if (mouseY < L.clip.y || mouseY > L.clip.y + L.clip.h) return;

  for (let i = 0; i < L.weapons.length; i++) {
    if (hit(L.weapons[i], mouseX, y)) {
      const w = WEAPONS[i];
      if (w.secret && !isGameCompleted()) return;
      buyWeapon(i);
      return;
    }
  }

  for (let i = 0; i < L.upgrades.length; i++) {
    if (hit(L.upgrades[i], mouseX, y)) {
      buyUpgrade(UPGRADES[i].name);
      return;
    }
  }

  for (let i = 0; i < L.skins.length; i++) {
    if (hit(L.skins[i], mouseX, y)) {
      const skin: Skin = getAllSkins()[i];
      if (skin.unlocked) {
        equipSkin(i);
      } else {
        const result = buySkin(i, shopCoins);
        if (result.success) {
          shopCoins -= result.cost;
          equipSkin(i);
          flashNotice(`${skin.name} DESBLOQUEADA`, PALETTE.moss);
          sfxBuy();
        } else {
          flashNotice('SEM MOEDAS', PALETTE.danger);
          sfxError();
        }
      }
      return;
    }
  }

  if (hit(L.ad, mouseX, y) && canWatchAd()) {
    startWatchingAd();
  }
}
