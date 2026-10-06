/**
 * Tela de loja.
 *
 * A geometria vem de UMA função (`getShopLayout`) consumida tanto pelo draw
 * quanto pelo hit-test. Antes o draw usava `leftX=40, colW=w/2-60` e o clique
 * usava `leftX=20, colW=w/2-40` — o bug que o histórico diz ter "corrigido"
 * e que continuou aberto: os cliques batiam em outra coluna.
 */

import { WEAPONS, UPGRADES, QUALITIES, POWERUP_TYPES, rollQuality, WEAPON_DESC, POWERUP_DESC } from '../config';
import { isGameCompleted } from '../systems/saveSystem';
import { setWeapon, addDamageMultiplier, addPierce, addCrit, addReloadSpeed, getCurrentWeapon, getCurrentWeaponIndex, setWeaponQuality, rerollWeaponQuality, getWeaponQuality, repairCurrentWeapon } from '../weapons';
import { addMaxHealth, addSpeed, addShield, enableRegen, addArmor } from '../entities/player';
import { getUnlockedDiary } from '../systems/diary';
import { enablePermanentMagnet } from '../entities/coin';
import { getAllSkins, buySkin, equipSkin, Skin } from '../systems/skins';
import { canWatchAd, startWatchingAd, getIsWatchingAd, getAdProgress, getAdCooldown, getNextAdReward, getAdsWatched, updateAd } from '../systems/ads';
import { getGameState, getCurrentPhase } from '../phases';
import { sfxBuy, sfxError } from '../systems/audio';
import { PALETTE } from '../core/palette';
import { getSprite } from '../systems/sprites';
import { getInventory, getEquipped, equipPiece, unequipPiece, getPieceType } from '../systems/pieces';

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
export function addPurchasedWeapon(index: number): boolean {
  if (purchasedWeapons.includes(index)) return false;
  if (purchasedWeapons.length >= INVENTORY_LIMIT) return false;
  purchasedWeapons.push(index);
  return true;
}
export function getPurchasedUpgrades(): string[] { return purchasedUpgrades; }

// ─── Revelação de caixas (NOVIDADES) ───────────────────────────

/** Inventário: 3 armas guardadas + a equipada */
export const INVENTORY_LIMIT = 4;

let pendingReveals: { index: number; quality: string }[] = [];

export function pushPendingReveal(index: number, quality: string): void {
  pendingReveals.push({ index, quality });
}

export function getPendingReveals(): { index: number; quality: string }[] { return pendingReveals; }

export function canKeepPending(): boolean { return purchasedWeapons.length < INVENTORY_LIMIT; }

export function keepPendingReveal(i: number): boolean {
  const r = pendingReveals[i];
  if (!r) return false;
  if (!canKeepPending()) {
    flashNotice('INVENTÁRIO CHEIO — VENDA OU USE', PALETTE.danger);
    sfxError();
    return false;
  }
  setWeaponQuality(r.index, r.quality);
  addPurchasedWeapon(r.index);
  setWeapon(r.index);
  pendingReveals.splice(i, 1);
  flashNotice('ADICIONADA AO ARSENAL', PALETTE.moss);
  sfxBuy();
  return true;
}

export function sellPendingReveal(i: number): void {
  const r = pendingReveals[i];
  if (!r) return;
  const q = QUALITIES[r.quality] ?? QUALITIES.normal;
  const price = Math.round(WEAPONS[r.index].price * 0.5 * q.sellMult);
  shopCoins += price;
  pendingReveals.splice(i, 1);
  flashNotice(`VENDIDA POR ${price}`, PALETTE.mustard);
  sfxBuy();
}

// ─── Estoque sorteado ──────────────────────────────────────────



interface StockWeapon { index: number; quality: string; sold: boolean }

let stockKey = '';
let stockSeed = 0;
let stockWeapons: StockWeapon[] = [];
let stockPowerups: { type: string; sold: boolean }[] = [];
let rerolledThisVisit = false;
let nextDiscount = false;

function restock(): void {
  const pool = WEAPONS.map((_, i) => i).filter(i => !WEAPONS[i].secret || isGameCompleted());
  stockWeapons = [];
  while (stockWeapons.length < 3 && pool.length > 0) {
    const idx = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    stockWeapons.push({ index: idx, quality: rollQuality(), sold: false });
  }
  const keys = Object.keys(POWERUP_TYPES).filter(k => k !== 'health' && k !== 'shield');
  stockPowerups = [];
  while (stockPowerups.length < 3 && keys.length > 0) {
    const k = keys.splice(Math.floor(Math.random() * keys.length), 1)[0];
    stockPowerups.push({ type: k, sold: false });
  }
}

export function getShopStock(): { weapons: StockWeapon[]; powerups: { type: string; sold: boolean }[]; rerolled: boolean } {
  const key = `${getCurrentPhase()?.name ?? 'menu'}#${stockSeed}`;
  if (key !== stockKey) {
    stockKey = key;
    rerolledThisVisit = false;
    restock();
  }
  return { weapons: stockWeapons, powerups: stockPowerups, rerolled: rerolledThisVisit };
}

let boughtPowerups: string[] = [];

export function consumeShopPowerups(): string[] {
  const out = boughtPowerups;
  boughtPowerups = [];
  return out;
}

function priceOf(base: number): number {
  return nextDiscount ? Math.round(base * 0.7) : base;
}

export function buyStockWeapon(i: number): boolean {
  getShopStock();
  const s = stockWeapons[i];
  if (!s || s.sold) return false;
  if (purchasedWeapons.length >= INVENTORY_LIMIT && !purchasedWeapons.includes(s.index)) {
    flashNotice('INVENTÁRIO CHEIO — VENDA OU USE', PALETTE.danger);
    sfxError();
    return false;
  }
  const price = priceOf(WEAPONS[s.index].price);
  if (shopCoins < price) {
    flashNotice('SEM MOEDAS', PALETTE.danger);
    sfxError();
    return false;
  }
  shopCoins -= price;
  nextDiscount = false;
  s.sold = true;
  addPurchasedWeapon(s.index);
  setWeaponQuality(s.index, s.quality);
  setWeapon(s.index);
  flashNotice(`${WEAPONS[s.index].name.toUpperCase()} · ${QUALITIES[s.quality].label.toUpperCase()}`, QUALITIES[s.quality].color);
  sfxBuy();
  return true;
}

export function buyStockPowerup(i: number): boolean {
  getShopStock();
  const s = stockPowerups[i];
  if (!s || s.sold) return false;
  const price = priceOf(40);
  if (shopCoins < price) {
    flashNotice('SEM MOEDAS', PALETTE.danger);
    sfxError();
    return false;
  }
  shopCoins -= price;
  nextDiscount = false;
  s.sold = true;
  boughtPowerups.push(s.type);
  flashNotice(`${s.type.toUpperCase()} ATIVO`, PALETTE.moss);
  sfxBuy();
  return true;
}

export function equipInventoryWeapon(i: number): void {
  const idx = purchasedWeapons[i];
  if (idx === undefined) return;
  setWeapon(idx);
  sfxBuy();
}

export function sellInventoryWeapon(i: number): boolean {
  const idx = purchasedWeapons[i];
  if (idx === undefined) return false;
  if (purchasedWeapons.length <= 1) {
    flashNotice('NÃO VENDE A ÚLTIMA ARMA', PALETTE.danger);
    sfxError();
    return false;
  }
  const q = QUALITIES[getWeaponQuality(idx)] ?? QUALITIES.normal;
  const price = Math.round(WEAPONS[idx].price * 0.5 * q.sellMult);
  shopCoins += price;
  purchasedWeapons.splice(i, 1);
  if (getCurrentWeaponIndex() === idx && purchasedWeapons.length > 0) setWeapon(purchasedWeapons[0]);
  flashNotice(`VENDIDA POR ${price}`, PALETTE.mustard);
  sfxBuy();
  return true;
}

// ─── Serviços ──────────────────────────────────────────────────

export const SHOP_SERVICES = [
  { id: 'reroll',    name: 'Rerrolar Estoque',    price: 30, desc: 'nova sorteio (1× por visita)' },
  { id: 'discount',  name: 'Bilhete de Desconto', price: 50, desc: '-30% no próximo item' },
  { id: 'surprise',  name: 'Baú Surpresa',        price: 70, desc: 'item aleatório' },
  { id: 'transmute', name: 'Frasco de Transmutação', price: 60, desc: 're-rola a qualidade da arma equipada' },
  { id: 'repair',   name: 'Reparar Arma',         price: 50, desc: 'conserta arma quebrada/encasquilhada' },
];

export function isServiceAvailable(id: string): boolean {
  if (id === 'reroll') return !rerolledThisVisit;
  if (id === 'discount') return !nextDiscount;
  return true;
}

export function buyService(id: string): void {
  const def = SHOP_SERVICES.find(s => s.id === id);
  if (!def) return;
  if (!isServiceAvailable(id)) {
    flashNotice('INDISPONÍVEL', PALETTE.danger);
    sfxError();
    return;
  }
  const price = priceOf(def.price);
  if (shopCoins < price) {
    flashNotice('SEM MOEDAS', PALETTE.danger);
    sfxError();
    return;
  }
  shopCoins -= price;
  nextDiscount = false;
  if (id === 'reroll') {
    rerolledThisVisit = true;
    stockSeed++;
    stockKey = '';
    getShopStock();
    flashNotice('ESTOQUE NOVO', PALETTE.moss);
  } else if (id === 'discount') {
    nextDiscount = true;
    flashNotice('-30% NO PRÓXIMO ITEM', PALETTE.mustard);
  } else if (id === 'surprise') {
    if (Math.random() < 0.5) {
      const pool = WEAPONS.map((_, i) => i).filter(i => !WEAPONS[i].secret || isGameCompleted());
      const idx = pool[Math.floor(Math.random() * pool.length)];
      pushPendingReveal(idx, rollQuality(1));
      flashNotice('ITEM NO NOVIDADES', PALETTE.mustard);
    } else {
      shopCoins += 70;
      flashNotice('+70 MOEDAS', PALETTE.mustard);
    }
  } else if (id === 'transmute') {
    const q = rerollWeaponQuality(getCurrentWeaponIndex());
    flashNotice(`QUALIDADE: ${QUALITIES[q].label.toUpperCase()}`, QUALITIES[q].color);
  } else if (id === 'repair') {
    repairCurrentWeapon();
    flashNotice('ARMA CONSERTADA', PALETTE.moss);
  }
  sfxBuy();
}

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

/** Valor já contratado por efeito (evita "quem fica é o último") */
const purchasedEffectValues = new Map<string, number>();

export function buyUpgrade(name: string): boolean {
  if (purchasedUpgrades.includes(name)) return false;
  const upgrade = UPGRADES.find(u => u.name === name);
  if (!upgrade) return false;
  const existing = purchasedEffectValues.get(upgrade.effect);
  if (existing !== undefined) {
    if (upgrade.value <= existing) {
      flashNotice('JÁ POSSUI BÔNUS DESTE TIPO', PALETTE.danger);
      sfxError();
      return false;
    }
  }
  if (shopCoins < upgrade.price) {
    flashNotice('SEM MOEDAS', PALETTE.danger);
    sfxError();
    return false;
  }
  shopCoins -= upgrade.price;
  purchasedUpgrades.push(name);
  purchasedEffectValues.set(upgrade.effect, upgrade.value);
  applyUpgrade(upgrade.effect, upgrade.value - (existing ?? 0));
  flashNotice(`${upgrade.name} ATIVO`, PALETTE.moss);
  sfxBuy();
  return true;
}

/**
 * Re-aplica upgrades salvos (delta contra um eventual valor menor do mesmo
 * efeito). Usado ao continuar o jogo salvo.
 */
export function restoreUpgrades(upgrades: string[]): void {
  for (const name of upgrades) {
    const u = UPGRADES.find(up => up.name === name);
    if (!u) continue;
    purchasedUpgrades.push(name);
    const existing = purchasedEffectValues.get(u.effect);
    purchasedEffectValues.set(u.effect, Math.max(existing ?? 0, u.value));
    applyUpgrade(u.effect, u.value - (existing ?? 0));
  }
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
  purchasedEffectValues.clear();
  pendingReveals = [];
  boughtPowerups = [];
  stockSeed = 0;
  stockKey = '';
  rerolledThisVisit = false;
  nextDiscount = false;
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
  sections: {
    weapons: number; upgrades: number; skins: number; ads: number; diary: number;
    powerups: number; novidades: number; services: number; inventory: number;
    equippedPieces: number; pieces: number;
  };
  contentHeight: number;
  maxScroll: number;
  /** Slots do estoque sorteado + novidades + serviços */
  powerups: Rect[];
  novidades: Rect[];
  services: Rect[];
  /** Linhas do inventário do jogador (máximo INVENTORY_LIMIT) */
  inventory: Rect[];
  /** 2 slots de peças equipadas na arma atual */
  equippedPieces: Rect[];
  /** Linhas de peças não equipadas na mochila */
  pieces: Rect[];
}

const ROW_H = 48;
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

  // estoque de armas: 3 slots sorteados por visita
  const weapons: Rect[] = [];
  for (let i = 0; i < 3; i++) {
    weapons.push({ x: leftX, y: ROW_TOP + i * ROW_H, w: colW, h: 44 });
  }

  // novidades: itens recolhidos nas caixas, só revelados na loja
  const novidadesY = ROW_TOP + 3 * ROW_H + SECTION_GAP;
  const pendingCount = Math.min(3, pendingReveals.length);
  const novidades: Rect[] = [];
  for (let i = 0; i < pendingCount; i++) {
    novidades.push({ x: leftX, y: novidadesY + 20 + i * ROW_H, w: colW, h: 44 });
  }
  const powerupsY = novidadesY + (pendingCount > 0 ? 20 + pendingCount * ROW_H : 0) + SECTION_GAP;
  const powerups: Rect[] = [];
  for (let i = 0; i < 3; i++) {
    powerups.push({ x: leftX, y: powerupsY + 20 + i * ROW_H, w: colW, h: 44 });
  }

  const upgrades: Rect[] = UPGRADES.map((_, i) => ({
    x: rightX, y: ROW_TOP + i * ROW_H, w: colW, h: 44,
  }));

  const servicesY = ROW_TOP + UPGRADES.length * ROW_H + SECTION_GAP;
  const services: Rect[] = [];
  for (let i = 0; i < SHOP_SERVICES.length; i++) {
    services.push({ x: rightX, y: servicesY + 20 + i * ROW_H, w: colW, h: 44 });
  }

  // inventário do jogador: linhas para equipar/vender
  const inventoryY = powerupsY + (3 > 0 ? 20 + 3 * ROW_H : 0) + SECTION_GAP;
  const shownInventory = purchasedWeapons.slice(0, INVENTORY_LIMIT);
  const inventory: Rect[] = [];
  for (let i = 0; i < shownInventory.length; i++) {
    inventory.push({ x: leftX, y: inventoryY + 20 + i * ROW_H, w: colW, h: 44 });
  }

  // ── peças equipadas na arma atual (2 slots fixos) ──
  const equippedPiecesY = inventoryY + 20 + shownInventory.length * ROW_H + SECTION_GAP;
  const equippedPieces: Rect[] = [];
  for (let i = 0; i < 2; i++) {
    equippedPieces.push({ x: leftX, y: equippedPiecesY + 20 + i * ROW_H, w: colW, h: 44 });
  }
  const equippedPiecesBottom = equippedPiecesY + 20 + 2 * ROW_H;

  // ── mochila de peças ──
  const invPieces = getInventory();
  const piecesY = equippedPiecesBottom + SECTION_GAP;
  const pieces: Rect[] = [];
  for (let i = 0; i < invPieces.length; i++) {
    pieces.push({ x: leftX, y: piecesY + 20 + i * ROW_H, w: colW, h: 44 });
  }
  const piecesBottom = invPieces.length > 0 ? piecesY + 20 + invPieces.length * ROW_H : piecesY;

  // skinsY precisa considerar TODAS as seções da coluna esquerda —
  // antes só considerava powerups e por isso colidia com inventory.
  const leftColumnBottom = Math.max(
    powerupsY + 20 + 3 * ROW_H,
    inventory.length > 0 ? inventoryY + 20 + inventory.length * ROW_H : inventoryY,
    equippedPiecesBottom,
    piecesBottom,
  );
  const skinsY = Math.max(leftColumnBottom, servicesY + 20 + SHOP_SERVICES.length * ROW_H) + SECTION_GAP;
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
    sections: {
      weapons: ROW_TOP - 25, upgrades: ROW_TOP - 25, skins: skinsY, ads: adsY, diary: diaryY,
      powerups: powerupsY, novidades: novidadesY, services: servicesY, inventory: inventoryY,
      equippedPieces: equippedPiecesY, pieces: piecesY,
    },
    contentHeight,
    maxScroll,
    powerups, novidades, services, inventory,
    equippedPieces, pieces,
  };
}

// ─── Botões de ação da linha (primário + VENDER) ─────────

const BTN_W = 96;
const BTN_H = 22;
const BTN_GAP = 8;

/**
 * Geometria dos dois botões de ação de uma linha (inventário / novidades).
 * Única fonte de verdade: o draw e o hit-test consomem exatamente isto —
 * vender só acontece clicando na caixa de venda, não na metade direita.
 */
export function rowActionButtons(r: Rect): { primary: Rect; sell: Rect } {
  const sell: Rect = { x: r.x + r.w - BTN_W - 10, y: r.y + (r.h - BTN_H) / 2, w: BTN_W, h: BTN_H };
  const primary: Rect = { x: sell.x - BTN_GAP - BTN_W, y: sell.y, w: BTN_W, h: BTN_H };
  return { primary, sell };
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

  // ── ARMAS (estoque sorteado) ──
  sectionLabel(ctx, 'ARMAS', L.weapons[0].x, L.sections.weapons, PALETTE.terracotta);
  {
    const stock = getShopStock();
    L.weapons.forEach((r, i) => {
      const s = stock.weapons[i];
      if (!s) return;
      const w = WEAPONS[s.index];
      const q = QUALITIES[s.quality];
      const owned = purchasedWeapons.includes(s.index);
      const isEquipped = equipped === w.name;
      const canBuy = !s.sold && !owned && shopCoins >= priceOf(w.price);
      const hover = hit(r, mouseX, scrollY);

      ctx.fillStyle = hover ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = isEquipped ? PALETTE.moss : s.sold ? 'rgba(255,255,255,0.04)' : canBuy ? 'rgba(176,112,80,0.4)' : 'rgba(255,255,255,0.05)';
      ctx.lineWidth = isEquipped ? 2 : 1;
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

      ctx.textAlign = 'left';
      ctx.fillStyle = s.sold ? PALETTE.textOff : q.color;
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`${w.name}`, r.x + 40, r.y + 16);
      {
        ctx.fillStyle = q.color;
        ctx.fillRect(r.x + 6, r.y + 6, 30, 30);
        ctx.fillStyle = '#111';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(w.name.charAt(0), r.x + 6 + 15, r.y + 6 + 20);
        ctx.textAlign = 'left';
      }

      ctx.textAlign = 'right';
      ctx.font = '11px monospace';
      if (s.sold) {
        ctx.fillStyle = PALETTE.textOff;
        ctx.fillText('VENDIDA', r.x + r.w - 10, r.y + 16);
      } else if (owned) {
        ctx.fillStyle = PALETTE.moss;
        ctx.fillText('ADQUIRIDA', r.x + r.w - 10, r.y + 16);
      } else {
        ctx.fillStyle = canBuy ? PALETTE.mustard : PALETTE.textOff;
        ctx.fillText(`${priceOf(w.price)}`, r.x + r.w - 10, r.y + 16);
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = PALETTE.textOff;
      ctx.font = '10px monospace';
      ctx.fillText(`${q.label.toUpperCase()} · DANO ${Math.round(w.damage * q.damageMult)} · ${Math.round(w.shootRate * q.cadenceMult * 100) / 100}s · ${w.magazineSize} tiros`, r.x + 40, r.y + 30);
      ctx.fillText(WEAPON_DESC[w.name] ?? '', r.x + 40, r.y + 42);
    });
  }

  // ── NOVIDADES ──
  if (L.novidades.length > 0) {
    sectionLabel(ctx, 'NOVIDADES', L.novidades[0].x, L.sections.novidades, PALETTE.mustard);
    L.novidades.forEach((r, i) => {
      const p = pendingReveals[i];
      if (!p) return;
      const w = WEAPONS[p.index];
      const q = QUALITIES[p.quality];
      const hover = hit(r, mouseX, scrollY);
      ctx.fillStyle = hover ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = 'rgba(200,184,144,0.4)';
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

      ctx.textAlign = 'left';
      ctx.fillStyle = q.color;
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`${w.name} · ${q.label}`, r.x + 40, r.y + 16);
      {
        ctx.fillStyle = q.color;
        ctx.fillRect(r.x + 6, r.y + 6, 30, 30);
        ctx.fillStyle = '#111';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(w.name.charAt(0), r.x + 6 + 15, r.y + 6 + 20);
        ctx.textAlign = 'left';
      }
      const { primary, sell } = rowActionButtons(r);
      const sellPrice = Math.round(WEAPONS[p.index].price * 0.5 * q.sellMult);
      ctx.fillStyle = PALETTE.textOff;
      ctx.font = '10px monospace';
      ctx.fillText(truncateText(WEAPON_DESC[w.name] ?? '', primary.x - 8 - (r.x + 40), 10), r.x + 40, r.y + 30);
      drawRowActionButton(ctx, primary, hit(primary, mouseX, scrollY), 'MANTER', 'primary', canKeepPending() ? PALETTE.moss : PALETTE.textOff);
      drawRowActionButton(ctx, sell, hit(sell, mouseX, scrollY), `VENDER +${sellPrice}`, 'sell', PALETTE.mustard);
    });
  }

  // ── POWER-UPS ──
  sectionLabel(ctx, 'POWER-UPS', L.powerups[0].x, L.sections.powerups, PALETTE.stone);
  {
    const stock = getShopStock();
    L.powerups.forEach((r, i) => {
      const s = stock.powerups[i];
      if (!s) return;
      const hover = hit(r, mouseX, scrollY);
      const price = priceOf(40);
      ctx.fillStyle = hover ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = s.sold ? 'rgba(255,255,255,0.04)' : 'rgba(128,144,64,0.3)';
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      {
        const meta = POWERUP_TYPES[s.type];
        ctx.fillStyle = meta ? meta.color : PALETTE.textOff;
        ctx.fillRect(r.x + 6, r.y + 6, 30, 30);
        ctx.fillStyle = '#111';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(meta ? meta.symbol : '?', r.x + 6 + 15, r.y + 6 + 20);
        ctx.textAlign = 'left';
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = s.sold ? PALETTE.textOff : PALETTE.text;
      ctx.font = '13px monospace';
      ctx.fillText(s.type.toUpperCase(), r.x + 40, r.y + 16);
      ctx.textAlign = 'right';
      ctx.fillStyle = s.sold ? PALETTE.textOff : PALETTE.mustard;
      ctx.font = '11px monospace';
      ctx.fillText(s.sold ? 'VENDIDO' : `${price}`, r.x + r.w - 10, r.y + 16);
      ctx.textAlign = 'left';
      ctx.fillStyle = PALETTE.textOff;
      ctx.font = '10px monospace';
      ctx.fillText(`${POWERUP_DESC[s.type] ?? ''} · Duração ${POWERUP_TYPES[s.type]?.duration ?? 0}s na próxima fase`, r.x + 40, r.y + 30);
      ctx.fillText(POWERUP_TYPES[s.type] ? '' : '', r.x + 40, r.y + 42);
    });
  }

  // ── SERVIÇOS ──
  sectionLabel(ctx, 'SERVIÇOS', L.services[0].x, L.sections.services, PALETTE.stone);
  L.services.forEach((r, i) => {
    const def = SHOP_SERVICES[i];
    if (!def) return;
    const available = isServiceAvailable(def.id);
    const price = priceOf(def.price);
    const canBuy = available && shopCoins >= price;
    const hover = hit(r, mouseX, scrollY);
    ctx.fillStyle = hover ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = canBuy ? 'rgba(160,128,80,0.4)' : 'rgba(255,255,255,0.05)';
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    {
      const hueMap: Record<string, string> = { reroll: '#a08050', discount: '#7a9a6a', surprise: '#608090', transmute: '#a07050', repair: '#8b4040' };
      ctx.fillStyle = hueMap[def.id] ?? PALETTE.textOff;
      ctx.fillRect(r.x + 6, r.y + 6, 30, 30);
      ctx.fillStyle = '#111';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(def.name.charAt(0), r.x + 6 + 15, r.y + 6 + 20);
      ctx.textAlign = 'left';
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = canBuy ? PALETTE.text : PALETTE.textOff;
    ctx.font = '13px monospace';
    ctx.fillText(def.name, r.x + 40, r.y + 16);
    ctx.textAlign = 'right';
    ctx.font = '11px monospace';
    ctx.fillStyle = canBuy ? PALETTE.mustard : PALETTE.textOff;
    ctx.fillText(`${price}`, r.x + r.w - 10, r.y + 16);
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.textOff;
    ctx.font = '10px monospace';
    ctx.fillText(def.desc, r.x + 40, r.y + 30);
  });

  // ── INVENTÁRIO ──
  if (L.inventory.length > 0) {
    sectionLabel(ctx, 'MEU INVENTÁRIO', L.inventory[0].x, L.sections.inventory, PALETTE.stone);
    L.inventory.forEach((r, i) => {
      const idx = purchasedWeapons[i];
      if (idx === undefined) return;
      const w = WEAPONS[idx];
      const q = QUALITIES[getWeaponQuality(idx)] ?? QUALITIES.normal;
      const isEquipped = getCurrentWeaponIndex() === idx;
      const hover = hit(r, mouseX, scrollY);
      ctx.fillStyle = hover ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = isEquipped ? PALETTE.moss : 'rgba(255,255,255,0.05)';
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      {
        ctx.fillStyle = q.color;
        ctx.fillRect(r.x + 6, r.y + 6, 30, 30);
        ctx.fillStyle = '#111';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(w.name.charAt(0), r.x + 6 + 15, r.y + 6 + 20);
        ctx.textAlign = 'left';
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = isEquipped ? PALETTE.moss : q.color;
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`${w.name} · ${q.label}`, r.x + 40, r.y + 16);
      const { primary, sell } = rowActionButtons(r);
      const sellPrice = Math.round(w.price * 0.5 * q.sellMult);
      const desc = isEquipped ? `${WEAPON_DESC[w.name] ?? ''} — EQUIPADA` : (WEAPON_DESC[w.name] ?? '');
      ctx.fillStyle = PALETTE.textOff;
      ctx.font = '10px monospace';
      ctx.fillText(truncateText(desc, primary.x - 8 - (r.x + 40), 10), r.x + 40, r.y + 30);
      drawRowActionButton(ctx, primary, hit(primary, mouseX, scrollY), 'EQUIPAR', 'primary', PALETTE.moss);
      drawRowActionButton(ctx, sell, hit(sell, mouseX, scrollY), `VENDER +${sellPrice}`, 'sell', PALETTE.mustard);
    });
  }

  // ── PEÇAS EQUIPADAS (arma atual, 2 slots) ──
  {
    const wIdx = getCurrentWeaponIndex();
    const equippedPieces = getEquipped(wIdx);
    const wName = WEAPONS[wIdx]?.name ?? '—';
    sectionLabel(ctx, `PEÇAS · ${wName.toUpperCase()}`, L.equippedPieces[0].x, L.sections.equippedPieces, PALETTE.stone);
    L.equippedPieces.forEach((r, i) => {
      const piece = equippedPieces[i];
      const hover = hit(r, mouseX, scrollY);
      ctx.fillStyle = hover ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = piece ? 'rgba(96,128,144,0.4)' : 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

      if (!piece) {
        ctx.textAlign = 'left';
        ctx.fillStyle = PALETTE.textOff;
        ctx.font = '11px monospace';
        ctx.fillText(`SLOT ${i + 1} · vazio`, r.x + 40, r.y + 26);
        return;
      }
      const def = getPieceType(piece.typeId);
      if (!def) return;
      ctx.fillStyle = def.color;
      ctx.fillRect(r.x + 6, r.y + 6, 30, 30);
      ctx.fillStyle = '#111';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(def.name.charAt(0), r.x + 21, r.y + 26);
      ctx.textAlign = 'left';
      ctx.fillStyle = def.color;
      ctx.font = 'bold 13px monospace';
      ctx.fillText(def.name, r.x + 40, r.y + 16);
      ctx.fillStyle = PALETTE.textOff;
      ctx.font = '10px monospace';
      ctx.fillText(`${def.desc} — clique p/ remover`, r.x + 40, r.y + 30);
    });
  }

  // ── PEÇAS NA MOCHILA ──
  if (L.pieces.length > 0) {
    sectionLabel(ctx, 'PEÇAS NA MOCHILA', L.pieces[0].x, L.sections.pieces, PALETTE.stone);
    const inv = getInventory();
    L.pieces.forEach((r, i) => {
      const piece = inv[i];
      if (!piece) return;
      const def = getPieceType(piece.typeId);
      if (!def) return;
      const hover = hit(r, mouseX, scrollY);
      ctx.fillStyle = hover ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = 'rgba(96,128,144,0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      ctx.fillStyle = def.color;
      ctx.fillRect(r.x + 6, r.y + 6, 30, 30);
      ctx.fillStyle = '#111';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(def.name.charAt(0), r.x + 21, r.y + 26);
      ctx.textAlign = 'left';
      ctx.fillStyle = def.color;
      ctx.font = 'bold 13px monospace';
      ctx.fillText(def.name, r.x + 40, r.y + 16);
      ctx.fillStyle = PALETTE.textOff;
      ctx.font = '10px monospace';
      ctx.fillText(`${def.desc} — clique p/ equipar na arma atual`, r.x + 40, r.y + 30);
    });
  }

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
    {
      const hueMap: Record<string, string> = { health: PALETTE.moss, speed: '#c8b890', damage: PALETTE.terracotta, shield: PALETTE.stone, magnet: '#8a8a9a', crit: '#b07050', pierce: PALETTE.title, regen: '#7a9a6a', reloadSpeed: '#a08050', armor: '#608090' };
      ctx.fillStyle = hueMap[u.effect] ?? PALETTE.textOff;
      ctx.fillRect(r.x + 6, r.y + 6, 30, 30);
      ctx.fillStyle = '#111';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(u.name.charAt(0), r.x + 6 + 15, r.y + 6 + 20);
      ctx.textAlign = 'left';
    }
    ctx.fillStyle = owned ? PALETTE.moss : canBuy ? PALETTE.text : PALETTE.textOff;
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(u.name, r.x + 40, r.y + 16);

    ctx.textAlign = 'right';
    ctx.font = '11px monospace';
    ctx.fillStyle = owned ? PALETTE.moss : canBuy ? PALETTE.mustard : PALETTE.textOff;
    ctx.fillText(owned ? 'ATIVO' : `${u.price}`, r.x + r.w - 10, r.y + 16);

    ctx.fillStyle = PALETTE.textOff;
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(effectText(u.effect, u.value), r.x + 40, r.y + 30);
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
  {
    ctx.fillStyle = PALETTE.terracotta;
    ctx.fillRect(r.x + 6, r.y + 6, 30, 30);
    ctx.fillStyle = '#111';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('A', r.x + 6 + 15, r.y + 6 + 20);
  }
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

/** Desenha uma caixa de ação de linha (EQUIPAR/MANTER ou VENDER) com rótulo centralizado. */
function drawRowActionButton(ctx: CanvasRenderingContext2D, r: Rect, hover: boolean, label: string, kind: 'primary' | 'sell', color: string) {
  ctx.fillStyle = hover
    ? (kind === 'primary' ? 'rgba(122,154,106,0.15)' : 'rgba(160,128,80,0.15)')
    : 'rgba(255,255,255,0.03)';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = kind === 'primary' ? 'rgba(122,154,106,0.4)' : 'rgba(160,128,80,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  ctx.textAlign = 'center';
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = color;
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 4);
  ctx.textAlign = 'left';
}

/** Trunca com … para caber em `maxPx` (monospace: `charW` px por caractere). */
function truncateText(text: string, maxPx: number, charW: number): string {
  const maxChars = Math.floor(maxPx / charW);
  if (text.length <= maxChars) return text;
  return text.slice(0, Math.max(0, maxChars - 1)) + '…';
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
      buyStockWeapon(i);
      return;
    }
  }

  for (let i = 0; i < L.upgrades.length; i++) {
    if (hit(L.upgrades[i], mouseX, y)) {
      buyUpgrade(UPGRADES[i].name);
      return;
    }
  }

  for (let i = 0; i < L.novidades.length; i++) {
    if (hit(L.novidades[i], mouseX, y)) {
      const { sell } = rowActionButtons(L.novidades[i]);
      if (hit(sell, mouseX, y)) sellPendingReveal(i);
      else keepPendingReveal(i);
      return;
    }
  }

  for (let i = 0; i < L.powerups.length; i++) {
    if (hit(L.powerups[i], mouseX, y)) {
      buyStockPowerup(i);
      return;
    }
  }

  for (let i = 0; i < L.services.length; i++) {
    if (hit(L.services[i], mouseX, y)) {
      buyService(SHOP_SERVICES[i].id);
      return;
    }
  }

  for (let i = 0; i < L.inventory.length; i++) {
    if (hit(L.inventory[i], mouseX, y)) {
      const { sell } = rowActionButtons(L.inventory[i]);
      if (hit(sell, mouseX, y)) sellInventoryWeapon(i);
      else equipInventoryWeapon(i);
      return;
    }
  }

  // peças equipadas: clique = desequipar (volta pra mochila)
  for (let i = 0; i < L.equippedPieces.length; i++) {
    if (hit(L.equippedPieces[i], mouseX, y)) {
      if (unequipPiece(getCurrentWeaponIndex(), i)) {
        flashNotice('PEÇA REMOVIDA', PALETTE.stone);
        sfxBuy();
      }
      return;
    }
  }

  // peças na mochila: clique = equipar na arma atual
  // (se os 2 slots estiverem cheios, equipPiece devolve a mais antiga pra mochila)
  for (let i = 0; i < L.pieces.length; i++) {
    if (hit(L.pieces[i], mouseX, y)) {
      if (equipPiece(getCurrentWeaponIndex(), i)) {
        flashNotice('PEÇA EQUIPADA', PALETTE.moss);
        sfxBuy();
      } else {
        flashNotice('SEM ESPAÇO', PALETTE.danger);
        sfxError();
      }
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
