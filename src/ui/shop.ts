/**
 * Tela de loja.
 *
 * A geometria vem de UMA função (`getShopLayout`) consumida tanto pelo draw
 * quanto pelo hit-test — as duas metades precisam concordar no pixel, senão o
 * clique compra a linha de cima.
 */

import { WEAPONS, QUALITIES, POWERUP_TYPES, rollQuality, WEAPON_DESC, POWERUP_DESC, SUPPORT_LABEL, conditionLabel, conditionTrait } from '../config';
import { isGameCompleted } from '../systems/saveSystem';
import { getEffectiveDps, getCapacityOf, setWeapon, addDamageMultiplier, addPierce, addCrit, addReloadSpeed, getCurrentWeapon, getCurrentWeaponIndex, setWeaponQuality, rerollWeaponQuality, getWeaponQuality, repairCurrentWeapon } from '../weapons';
import { addMaxHealth, addSpeed, addShield, enableRegen, addArmor } from '../entities/player';
import { PERK_LADDER, PERK_LEGADO, ofertaDePerks, ativarEspecialPerk, degrausCompraveis, type PerkTier } from '../systems/perks';
import { applyStat, getStat } from '../core/stats';
import { getUnlockedDiary, unlockDiaryEvent } from '../systems/diary';
import { TALENTOS, buyTalento as gastarPontoTalento, getTalentos as getTalentosComprados, getPontosLivres, getNivel, progressoNoNivel, getXp, restoreTalentos } from '../systems/progress';
import { enablePermanentMagnet } from '../entities/coin';
import { getAllSkins, buySkin, equipSkin, Skin } from '../systems/skins';
import { canWatchAd, startWatchingAd, getIsWatchingAd, getAdProgress, getAdCooldown, getNextAdReward, getAdsWatched, getAdsRemaining, updateAd } from '../systems/ads';
import { openSupportLink } from '../systems/support';
import { getGameState, getCurrentPhase } from '../phases';
import { sfxBuy, sfxError } from '../systems/audio';
import { PALETTE } from '../core/palette';
import { getSprite } from '../systems/sprites';
import { getInventory, getEquipped, equipPiece, unequipPiece, getPieceType, hasPieceSynergy, PIECE_INVENTORY_LIMIT, returnEquippedPieces, sellPieceFromInventory, pieceSellPrice } from '../systems/pieces';

/** Saldo atual de moedas do jogador */
let shopCoins = 0;
/**
 * Armas possuídas como pares (índice, qualidade). Antes era só `number[]`, e
 * receber a Pistola Quebrada da NOVIDADE marcava a Pistola Lendária do estoque
 * como ADQUIRIDA — qualidade conta na posse.
 */
let purchasedWeapons: { index: number; quality: string }[] = [{ index: 0, quality: 'normal' }];
/** Nomes dos upgrades já comprados */
let purchasedUpgrades: string[] = [];
/** Aviso temporário (ex: SEM MOEDAS) exibido sobre o conteúdo */
let notice: { text: string; time: number; color: string } | null = null;

export function setShopCoins(amount: number) { shopCoins = amount; }
export function getShopCoins(): number { return shopCoins; }
export function addShopCoins(amount: number) { shopCoins += amount; }
export function getPurchasedWeapons(): number[] { return purchasedWeapons.map(w => w.index); }
/** Pares (índice, qualidade) possuídos — a loja distingue arma por qualidade. */
export function getPurchasedWeaponPairs(): { index: number; quality: string }[] { return purchasedWeapons.slice(); }
/** true se o par exato (arma + qualidade) já está no inventário. */
export function hasWeaponPair(index: number, quality: string): boolean {
  return purchasedWeapons.some(w => w.index === index && w.quality === quality);
}
export function addPurchasedWeapon(index: number, quality: string): boolean {
  if (hasWeaponPair(index, quality)) return false;
  if (purchasedWeapons.length >= INVENTORY_LIMIT) return false;
  purchasedWeapons.push({ index, quality });
  return true;
}
export function getPurchasedUpgrades(): string[] { return purchasedUpgrades; }

/** Ids de upgrade comprados, para os combos (nunca o nome de exibição). */
export function getPurchasedUpgradeIds(): string[] { return purchasedUpgrades; }

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
  addPurchasedWeapon(r.index, r.quality);
  equiparSeMelhor(r.index, r.quality);
  pendingReveals.splice(i, 1);
  // escolha sobre a caixa (manter/vender) → entrada reativa do diário
  unlockDiaryEvent('shop_choice');
  weaponToast(r.index, r.quality);
  sfxBuy();
  return true;
}

/**
 * Toast de arma para a loja: `keepPendingReveal`/`buyStockWeapon` moram na
 * loja e não enxergam o pushToast do orquestrador. A loja anuncia pelo
 * flashNotice com a cor da raridade — mesmo texto do announceWeapon.
 */
export function weaponToast(index: number, quality: string): void {
  const w = WEAPONS[index];
  if (!w) return;
  const q = QUALITIES[quality] ?? QUALITIES.normal;
  flashNotice(`ARMANDO: ${w.name.toUpperCase()} · ${q.label.toUpperCase()}`, q.color);
}

export function sellPendingReveal(i: number): void {
  const r = pendingReveals[i];
  if (!r) return;
  const q = QUALITIES[r.quality] ?? QUALITIES.normal;
  const price = Math.round(WEAPONS[r.index].price * 0.5 * q.sellMult);
  shopCoins += price;
  pendingReveals.splice(i, 1);
  unlockDiaryEvent('shop_choice');
  flashNotice(`VENDIDA POR ${price}`, PALETTE.mustard);
  sfxBuy();
}

// ─── Estoque sorteado ──────────────────────────────────────────



interface StockWeapon { index: number; quality: string; sold: boolean }

let stockKey = '';
let stockSeed = 0;
let stockWeapons: StockWeapon[] = [];
let stockPowerups: { type: string; sold: boolean }[] = [];
/** Ids dos 3 perks ofertados nesta visita (sorteados no restock). */
let stockPerks: string[] = [];
let rerolledThisVisit = false;
let nextDiscount = false;

function restock(): void {
  const pool = WEAPONS.map((_, i) => i).filter(i => !WEAPONS[i].secret || isGameCompleted());
  const sorte = Math.round(getStat('luck'));
  stockWeapons = [];
  while (stockWeapons.length < 3 && pool.length > 0) {
    const idx = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    // a sorte empurra a qualidade do estoque: um ponto vale um passo de boost
    stockWeapons.push({ index: idx, quality: rollQuality(0, sorte), sold: false });
  }
  const keys = Object.keys(POWERUP_TYPES).filter(k => k !== 'health' && k !== 'shield');
  stockPowerups = [];
  while (stockPowerups.length < 3 && keys.length > 0) {
    const k = keys.splice(Math.floor(Math.random() * keys.length), 1)[0];
    stockPowerups.push({ type: k, sold: false });
  }
  // 3 perks por visita: a oferta congela no restock, não no draw — senão cada
  // frame sorteava de novo e o clique comprava outra linha.
  stockPerks = ofertaDePerks(getPurchasedUpgradeIds()).map(t => t.id);
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
  if (purchasedWeapons.length >= INVENTORY_LIMIT && !hasWeaponPair(s.index, s.quality)) {
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
  addPurchasedWeapon(s.index, s.quality);
  equiparSeMelhor(s.index, s.quality);
  sfxBuy();
  return true;
}

/**
 * Equipa o par se ele for melhor do que o que está na mão.
 *
 * Antes, toda compra trocava a arma na mão sem comparar: comprar uma Pistola
 * Quebrada do estoque sobrescrevia uma RPG Lendária. O jogador não escolhia
 * trocar, e a troca podia ser pior.
 *
 * @returns true se equipou
 */
function equiparSeMelhor(index: number, quality: string): boolean {
  const dpsNovo = getEffectiveDps(index, quality);
  const dpsAtual = getEffectiveDps(getCurrentWeaponIndex(), getWeaponQuality());
  if (dpsNovo <= dpsAtual) {
    const ganho = dpsAtual - dpsNovo;
    flashNotice(`EQUIPADA: ${WEAPONS[index].name} · ${QUALITIES[quality].label} (DPS ${Math.round(dpsNovo)})`, QUALITIES[quality].color);
    flashNotice(`NA MÃO: DPS ${Math.round(dpsAtual)} — ${Math.round(ganho)} MELHOR`, PALETTE.moss);
    return false;
  }
  setWeapon(index, quality);
  weaponToast(index, quality);
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
  const slot = purchasedWeapons[i];
  if (slot === undefined) return;
  setWeapon(slot.index, slot.quality);
  sfxBuy();
}

/** Vende uma peça da mochila e credita as moedas. */
export function sellPiece(i: number): boolean {
  const peca = getInventory()[i];
  if (!peca) return false;
  const preco = sellPieceFromInventory(i);
  if (preco <= 0) return false;
  shopCoins += preco;
  flashNotice(`PEÇA VENDIDA POR ${preco}`, PALETTE.mustard);
  sfxBuy();
  return true;
}

export function sellInventoryWeapon(i: number): boolean {
  const slot = purchasedWeapons[i];
  if (slot === undefined) return false;
  if (purchasedWeapons.length <= 1) {
    flashNotice('NÃO VENDE A ÚLTIMA ARMA', PALETTE.danger);
    sfxError();
    return false;
  }
  const idx = slot.index;
  // A raridade vem do PAR possuído, não de um mapa por índice: com a mesma
  // arma em duas raridades, a última escrita vencia e as duas linhas vendiam
  // pelo preço errado.
  const q = QUALITIES[slot.quality] ?? QUALITIES.normal;
  const price = Math.round(WEAPONS[idx].price * 0.5 * q.sellMult);
  shopCoins += price;
  // Peças equipadas voltam para a mochila. Sem isso elas ficavam presas num
  // mapa que nenhuma tela lê de novo: o jogador perdia a peça na venda.
  returnEquippedPieces(idx);
  purchasedWeapons.splice(i, 1);
  if (getCurrentWeaponIndex() === idx && purchasedWeapons.length > 0) {
    const prox = purchasedWeapons[0];
    setWeapon(prox.index, prox.quality);
  }
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
      pushPendingReveal(idx, rollQuality(1, Math.round(getStat('luck'))));
      flashNotice('ITEM NO NOVIDADES', PALETTE.mustard);
    } else {
      shopCoins += 70;
      flashNotice('+70 MOEDAS', PALETTE.mustard);
    }
  } else if (id === 'transmute') {
    const q = rerollWeaponQuality();
    flashNotice(`QUALIDADE: ${QUALITIES[q].label.toUpperCase()}`, QUALITIES[q].color);
  } else if (id === 'repair') {
    repairCurrentWeapon();
    flashNotice('ARMA CONSERTADA', PALETTE.moss);
  }
  sfxBuy();
}

/**
 * Efeito de um degrau da escada, em UM lugar só.
 *
 * `buyPerk` e `restoreUpgrades` passam por aqui. Se cada um tivesse o seu
 * corpo, o continue devolveria o jogador sem os 4 especiais — que vivem em flag
 * (`ativarEspecialPerk`), não em stat, e uma flag que o restore não liga é um
 * perk que o jogador pagou e não tem.
 */
function aplicarPerk(t: PerkTier): void {
  if (t.special) {
    ativarEspecialPerk(t.id);
    // Sortudo entra no bolso na hora: sorte alta puxa o melhor evento
    if (t.statId === 'luck') applyStat('luck', t.value);
    return;
  }
  if (t.statId === 'health') addMaxHealth(t.value);
  else if (t.statId === 'speed') addSpeed(t.value);
  else if (t.statId === 'shield') addShield(t.value);
  else applyStat(t.statId, t.value);
}

/**
 * Tenta comprar um degrau da escada de perks. Bloqueia o degrau N se o N-1
 * não foi comprado, e aplica especial via `ativarEspecialPerk`.
 */
export function buyPerk(perkId: string): boolean {
  const perk = PERK_LADDER.find(t => t.id === perkId);
  if (!perk) return false;
  if (purchasedUpgrades.includes(perkId)) return false;
  if (perk.requires && !purchasedUpgrades.includes(perk.requires)) {
    flashNotice('COMPRE O DEGRAU ANTERIOR', PALETTE.danger);
    sfxError();
    return false;
  }
  if (shopCoins < perk.price) {
    flashNotice('SEM MOEDAS', PALETTE.danger);
    sfxError();
    return false;
  }
  shopCoins -= perk.price;
  purchasedUpgrades.push(perkId);
  aplicarPerk(perk);
  // a oferta da visita perde o comprado e puxa o próximo degrau do ramo
  stockPerks = stockPerks.filter(id => id !== perkId);
  for (const proximo of degrausCompraveis(purchasedUpgrades)) {
    if (!stockPerks.includes(proximo.id) && stockPerks.length < 3) stockPerks.push(proximo.id);
  }
  flashNotice(`${perk.name.toUpperCase()} ATIVO`, PALETTE.moss);
  sfxBuy();
  return true;
}

/** Perks ofertados nesta visita (os 3 sorteados no restock). */
export function getStockPerks(): string[] { return stockPerks.slice(); }

/**
 * Compra um talento da árvore de progressão. Gasta 1 ponto de nível (não moeda)
 * e aplica o efeito. O ponto vem do XP acumulado em `progress.ts`.
 */
export function buyTalento(id: string): boolean {
  const t = TALENTOS.find(x => x.id === id);
  if (!t) return false;
  if (getPontosLivres() <= 0) {
    flashNotice('SEM PONTO DE TALENTO', PALETTE.danger);
    sfxError();
    return false;
  }
  if (!gastarPontoTalento(id)) {
    flashNotice('JÁ POSSUI ESTE TALENTO', PALETTE.danger);
    sfxError();
    return false;
  }
  applyUpgrade(t.effect, t.value);
  flashNotice(`${t.name.toUpperCase()} ATIVO`, PALETTE.moss);
  sfxBuy();
  return true;
}

/**
 * Reaplica os efeitos de talentos já comprados (continue do save), sem gastar
 * ponto. `restoreTalentos` marca quais existem; aqui só o efeito entra no jogador.
 */
export function applySavedTalentos(ids: string[]): void {
  restoreTalentos(ids);
  for (const id of ids) {
    const t = TALENTOS.find(x => x.id === id);
    if (t) applyUpgrade(t.effect, t.value);
  }
}

/**
 * Re-aplica o que o save gravou, sem cobrar nada (continue da partida).
 *
 * Dois caminhos, nesta ordem:
 *  1. id de degrau da escada → `aplicarPerk`, a mesma porta da compra;
 *  2. id OU nome de compra antiga → `PERK_LEGADO`, efeito aplicado direto.
 *
 * Dentro do legado vale a mesma regra da compra: dois upgrades do mesmo efeito
 * não empilham, o maior vence. `vida25` + `vida50` no save antigo valem +50,
 * não +75. O histórico do "quem fica é o último" morava num Map do módulo que
 * só o caminho morto de `buyUpgrade` escrevia; aqui é estado local do restore.
 */
export function restoreUpgrades(ids: string[]): void {
  const maiorPorEfeito = new Map<string, number>();
  for (const id of ids) {
    const perk = PERK_LADDER.find(t => t.id === id);
    if (perk) {
      purchasedUpgrades.push(perk.id);
      aplicarPerk(perk);
      continue;
    }
    const legado = PERK_LEGADO[id];
    if (!legado) continue;
    purchasedUpgrades.push(legado.id);
    const anterior = maiorPorEfeito.get(legado.effect);
    maiorPorEfeito.set(legado.effect, Math.max(anterior ?? 0, legado.value));
    applyUpgrade(legado.effect, legado.value - (anterior ?? 0));
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
  purchasedWeapons = [{ index: 0, quality: 'normal' }];
  purchasedUpgrades = [];
  pendingReveals = [];
  boughtPowerups = [];
  stockSeed = 0;
  stockKey = '';
  // sem isto a run seguinte abre a loja com a oferta da partida anterior
  stockPerks = [];
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
  support: Rect;
  /** Área visível do conteúdo scrolável (define a região de clip) */
  clip: Rect;
  /** Y do topo de cada seção (rótulos) */
  sections: {
    weapons: number; upgrades: number; skins: number; ads: number; diary: number;
    powerups: number; novidades: number; services: number; inventory: number;
    equippedPieces: number; pieces: number; talentos: number;
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
  /** Linhas da árvore de talentos (6 = 3 galhos × 2) */
  talentos: Rect[];
}

const ROW_H = 48;
const ROW_TOP = 145;
const SECTION_GAP = 20;
const SKIN_COLS = 5;
const SKIN_SIZE = 44;
const SKIN_GAP = 6;
// 74 e não 62: cada linha carrega o card (44) + o nome (11px em +11) + o preço
// (11px em +20), ou seja 64px de conteúdo. Com 62 a 2ª linha invadia a seção
// MOEDAS — visível no PNG do `loja-proof.mjs`, onde "Fita Isolante" ficou
// atrás de "RESGATE DE MOEDAS". Os 10px de folga são a folga entre linhas.
const SKIN_ROW_H = SKIN_SIZE + 30;

/**
 * Calcula todos os retângulos da loja para uma largura de tela.
 * Única fonte de verdade: o draw e o hit-test consomem exatamente isto.
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

  // 3 perks por visita — a seção encolheu dos 19 upgrades para 3 linhas, e os
  // serviços sobem junto (servicesY deriva daqui).
  const upgrades: Rect[] = [0, 1, 2].map((_, i) => ({
    x: rightX, y: ROW_TOP + i * ROW_H, w: colW, h: 44,
  }));

  const servicesY = ROW_TOP + 3 * ROW_H + SECTION_GAP;
  const services: Rect[] = [];
  for (let i = 0; i < SHOP_SERVICES.length; i++) {
    services.push({ x: rightX, y: servicesY + 20 + i * ROW_H, w: colW, h: 44 });
  }

  // ── árvore de talentos: 3 galhos × 2 nós, coluna direita, abaixo dos serviços ──
  const talentosY = servicesY + 20 + SHOP_SERVICES.length * ROW_H + SECTION_GAP;
  const talentos: Rect[] = TALENTOS.map((_, i) => ({
    x: rightX, y: talentosY + 20 + i * ROW_H, w: colW, h: 44,
  }));

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
  const skinsY = Math.max(leftColumnBottom, servicesY + 20 + SHOP_SERVICES.length * ROW_H, talentosY + 20 + TALENTOS.length * ROW_H) + SECTION_GAP;
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
  const supportY = ad.y + ad.h + 10;
  const support: Rect = { x: leftX, y: supportY, w: 280, h: 44 };

  const diaryY = support.y + support.h + 30;
  const contentHeight = diaryY + 120 - contentStart;
  const maxScroll = Math.max(0, contentHeight - (height - contentStart - 40));

  return {
    weapons, upgrades, skins, ad, support,
    clip: { x: 0, y: contentStart, w: width, h: height - contentStart - 40 },
    sections: {
      weapons: ROW_TOP - 25, upgrades: ROW_TOP - 25, skins: skinsY, ads: adsY, diary: diaryY,
      powerups: powerupsY, novidades: novidadesY, services: servicesY, inventory: inventoryY,
      equippedPieces: equippedPiecesY, pieces: piecesY, talentos: talentosY,
    },
    contentHeight,
    maxScroll,
    powerups, novidades, services, inventory,
    equippedPieces, pieces, talentos,
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

/** Rola a loja para uma posição absoluta. Usado pelo `loja-proof.mjs`. */
export function setShopScroll(y: number): void {
  shopScrollOffset = Math.max(0, y);
}

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
      const owned = hasWeaponPair(s.index, s.quality);
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
      // DPS real, com o delta contra a arma na mão. O número antigo era
      // `damage × qualidade`: ignorava upgrade, combo, classe e peça, então
      // imprimia "DANO 6" numa build que fazia ~11 e não dizia se valia trocar.
      const dpsNovo = getEffectiveDps(s.index, s.quality);
      const dpsNaMao = getEffectiveDps(getCurrentWeaponIndex(), getWeaponQuality());
      const delta = dpsNovo - dpsNaMao;
      const sinal = delta > 0.5 ? `+${Math.round(delta)}` : `${Math.round(delta)}`;
      ctx.fillStyle = PALETTE.textOff;
      ctx.font = '11px monospace';
      ctx.fillText(
        `${q.label.toUpperCase()} · DPS ${Math.round(dpsNovo)} (${sinal}) · ${Math.round(w.shootRate * q.cadenceMult * 100) / 100}s · ${getCapacityOf(s.index)} tiros`,
        r.x + 40, r.y + 30,
      );
      ctx.fillStyle = delta > 0.5 ? PALETTE.moss : delta < -0.5 ? PALETTE.danger : PALETTE.textDim;
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
      ctx.fillText(`${w.name} · ${conditionLabel(w.name, p.quality)}`, r.x + 40, r.y + 16);
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
      // condição com adjetivo por arma: "Metralhadora · Corroída" diz mais que
      // "Metralhadora · Enferrujada", e o traço explica o que o som faz
      const traco = conditionTrait(w.name, p.quality);
      const descricao = traco ? `${traco} ${WEAPON_DESC[w.name] ?? ''}`.trim() : (WEAPON_DESC[w.name] ?? '');
      ctx.fillStyle = PALETTE.textOff;
      ctx.font = '11px monospace';
      ctx.fillText(truncateText(descricao, primary.x - 8 - (r.x + 40), 10), r.x + 40, r.y + 30);
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
      ctx.font = '11px monospace';
      // A descrição era desenhada inteira numa linha de 44px de altura: o
      // `trajeNucleo` tem 93 caracteres e vazava para fora do card, por cima
      // da seção seguinte. A linha tem `r.w - 50` de largura útil (40 do
      // recuo + 10 da margem) — truncar aqui é o mesmo `truncateText` que as
      // skins usam, e o nome inteiro continua no tooltip do clique.
      const desc = `${POWERUP_DESC[s.type] ?? ''} · ${POWERUP_TYPES[s.type]?.duration ?? 0}s na próxima fase`;
      ctx.fillText(truncateText(desc, r.w - 50), r.x + 40, r.y + 30);
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
    ctx.font = '11px monospace';
    ctx.fillText(def.desc, r.x + 40, r.y + 30);
  });

  // ── ÁRVORE DE TALENTOS ──
  // Gasta ponto de nível (do XP acumulado), não moeda. Mostra nível, XP e os
  // pontos livres no rótulo; o nó comprado fica verde e some da lista de compra.
  {
    const prog = progressoNoNivel(getXp());
    sectionLabel(
      ctx,
      `ÁRVORE DE TALENTOS · NÍVEL ${getNivel()} · ${prog.atual}/${prog.necessario} XP · ${getPontosLivres()} PONTO(S)`,
      L.talentos[0].x, L.sections.talentos, PALETTE.moss,
    );
    const comprados = getTalentosComprados();
    const corGalho: Record<string, string> = { mente: '#608090', armas: '#b07050', movimento: '#7a9a6a' };
    L.talentos.forEach((r, i) => {
      const t = TALENTOS[i];
      if (!t) return;
      const comprado = comprados.includes(t.id);
      const disponivel = !comprado && getPontosLivres() > 0;
      const hover = hit(r, mouseX, scrollY) && disponivel;
      ctx.fillStyle = hover ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = comprado ? PALETTE.moss : (disponivel ? 'rgba(160,128,80,0.5)' : 'rgba(255,255,255,0.05)');
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      ctx.fillStyle = comprado ? PALETTE.moss : corGalho[t.galho];
      ctx.fillRect(r.x + 6, r.y + 6, 30, 30);
      ctx.fillStyle = '#111';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(t.galho.charAt(0).toUpperCase(), r.x + 6 + 15, r.y + 6 + 20);
      ctx.textAlign = 'left';
      ctx.fillStyle = comprado ? PALETTE.moss : (disponivel ? PALETTE.text : PALETTE.textOff);
      ctx.font = 'bold 13px monospace';
      ctx.fillText(t.name, r.x + 40, r.y + 16);
      ctx.textAlign = 'right';
      ctx.font = '11px monospace';
      ctx.fillStyle = comprado ? PALETTE.moss : (disponivel ? PALETTE.mustard : PALETTE.textOff);
      ctx.fillText(comprado ? 'ATIVO' : '1 PT', r.x + r.w - 10, r.y + 16);
      ctx.textAlign = 'left';
    });
  }

  // ── INVENTÁRIO ──
  if (L.inventory.length > 0) {
    sectionLabel(ctx, 'MEU INVENTÁRIO', L.inventory[0].x, L.sections.inventory, PALETTE.stone);
    L.inventory.forEach((r, i) => {
      const slot = purchasedWeapons[i];
      if (slot === undefined) return;
      const idx = slot.index;
      const w = WEAPONS[idx];
      const q = QUALITIES[slot.quality] ?? QUALITIES.normal;
      const isEquipped = getCurrentWeaponIndex() === idx && getWeaponQuality() === slot.quality;
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
      ctx.fillText(`${w.name} · ${conditionLabel(w.name, slot.quality)}`, r.x + 40, r.y + 16);
      const { primary, sell } = rowActionButtons(r);
      const sellPrice = Math.round(w.price * 0.5 * q.sellMult);
      const desc = isEquipped ? `${WEAPON_DESC[w.name] ?? ''} — EQUIPADA` : (WEAPON_DESC[w.name] ?? '');
      ctx.fillStyle = PALETTE.textOff;
      ctx.font = '11px monospace';
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
    const syn = hasPieceSynergy(wIdx) ? ' · SINERGIA +10%' : '';
    sectionLabel(ctx, `PEÇAS · ${wName.toUpperCase()}${syn}`, L.equippedPieces[0].x, L.sections.equippedPieces, hasPieceSynergy(wIdx) ? PALETTE.moss : PALETTE.stone);
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
      ctx.font = '11px monospace';
      ctx.fillText(`${def.desc} — clique p/ remover`, r.x + 40, r.y + 30);
    });
  }

  // ── PEÇAS NA MOCHILA ──
  if (L.pieces.length > 0) {
    sectionLabel(ctx, `PEÇAS NA MOCHILA (${L.pieces.length}/${PIECE_INVENTORY_LIMIT})`, L.pieces[0].x, L.sections.pieces, PALETTE.stone);
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
      ctx.font = '11px monospace';
      ctx.fillText(`${def.desc} — clique p/ equipar`, r.x + 40, r.y + 30);
      const { sell } = rowActionButtons(r);
      drawRowActionButton(ctx, sell, hit(sell, mouseX, scrollY), `VENDER +${pieceSellPrice(piece.typeId)}`, 'sell', PALETTE.mustard);
    });
  }

  // ── PERKS (3 por visita, do restock) ──
  sectionLabel(ctx, 'PERKS', L.upgrades[0].x, L.sections.upgrades, '#8a7a9a');
  L.upgrades.forEach((r, i) => {
    const t = PERK_LADDER.find(p => p.id === stockPerks[i]);
    if (!t) return;
    const owned = purchasedUpgrades.includes(t.id);
    const canBuy = !owned && shopCoins >= t.price;
    const hover = hit(r, mouseX, scrollY);

    ctx.fillStyle = hover ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = owned ? PALETTE.moss : canBuy ? 'rgba(138,122,154,0.4)' : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    {
      const hueMap: Record<string, string> = { dano: PALETTE.terracotta, corpo: PALETTE.moss, pernas: '#c8b890', mente: PALETTE.stone };
      ctx.fillStyle = hueMap[t.ram] ?? PALETTE.textOff;
      ctx.fillRect(r.x + 6, r.y + 6, 30, 30);
      ctx.fillStyle = '#111';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(t.name.charAt(0), r.x + 6 + 15, r.y + 6 + 20);
      ctx.textAlign = 'left';
    }
    ctx.fillStyle = owned ? PALETTE.moss : canBuy ? PALETTE.text : PALETTE.textOff;
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(t.name, r.x + 40, r.y + 16);

    ctx.textAlign = 'right';
    ctx.font = '11px monospace';
    ctx.fillStyle = owned ? PALETTE.moss : canBuy ? PALETTE.mustard : PALETTE.textOff;
    ctx.fillText(owned ? 'ATIVO' : `${t.price}`, r.x + r.w - 10, r.y + 16);

    ctx.fillStyle = PALETTE.textOff;
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`RAMO ${t.ram.toUpperCase()} T${t.tier}`, r.x + 40, r.y + 30);
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
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    // "Fita Isolante" (12) e "Sangue Seco" (11) medem ~79px numa coluna de
    // 44px: vazavam por cima da linha seguinte (visível no PNG). O nome cheio
    // continua no tooltip do clique; aqui cabe o que cabe.
    ctx.fillText(truncateText(skin.name, SKIN_SIZE), r.x + SKIN_SIZE / 2, r.y + SKIN_SIZE + 11);
    if (!skin.unlocked) {
      ctx.fillStyle = canBuy ? PALETTE.mustard : PALETTE.textOff;
      ctx.fillText(`${skin.price}`, r.x + SKIN_SIZE / 2, r.y + SKIN_SIZE + 20);
    }
  });

  // ── ANÚNCIOS ──
  sectionLabel(ctx, 'MOEDAS', L.ad.x, L.sections.ads, PALETTE.terracotta);
  drawAdButton(ctx, L.ad, hit(L.ad, mouseX, scrollY));
  drawSupportButton(ctx, L.support, hit(L.support, mouseX, scrollY));

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
      ctx.font = '11px monospace';
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
    ctx.fillText('M', r.x + 6 + 15, r.y + 6 + 20);
  }
  ctx.textAlign = 'center';

  if (getIsWatchingAd()) {
    const progress = getAdProgress();
    ctx.fillStyle = PALETTE.terracotta;
    ctx.fillRect(r.x + 8, r.y + 26, (r.w - 16) * progress, 8);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '12px monospace';
    ctx.fillText(`Resgatando... ${Math.floor(progress * 100)}%`, r.x + r.w / 2, r.y + 18);
  } else if (canWatchAd()) {
    ctx.fillStyle = PALETTE.text;
    ctx.font = '13px monospace';
    ctx.fillText('RESGATE DE MOEDAS', r.x + r.w / 2, r.y + 20);
    ctx.fillStyle = PALETTE.mustard;
    ctx.font = '11px monospace';
    ctx.fillText(`+${getNextAdReward()}`, r.x + r.w / 2, r.y + 38);
    ctx.fillStyle = PALETTE.textOff;
    ctx.font = '11px monospace';
    ctx.fillText(`Resgatados: ${getAdsWatched()}`, r.x + r.w / 2, r.y + 52);
  } else if (getAdsRemaining() === 0) {
    // Cota da fase esgotada. Sem este ramo o botão mostrava "Volta em 0s"
    // para sempre, que parece bug — e era, porque o cooldown já tinha zerado.
    ctx.fillStyle = PALETTE.textOff;
    ctx.font = '12px monospace';
    ctx.fillText('COTA ESGOTADA NESTA FASE', r.x + r.w / 2, r.y + 22);
    ctx.fillStyle = PALETTE.textOff;
    ctx.font = '11px monospace';
    ctx.fillText(`Resgatados: ${getAdsWatched()}`, r.x + r.w / 2, r.y + 40);
  } else {
    ctx.fillStyle = PALETTE.textOff;
    ctx.font = '12px monospace';
    ctx.fillText(`Volta em ${Math.ceil(getAdCooldown())}s`, r.x + r.w / 2, r.y + 22);
    ctx.fillStyle = PALETTE.textOff;
    ctx.font = '11px monospace';
    ctx.fillText(`+${getNextAdReward()}`, r.x + r.w / 2, r.y + 40);
  }
}

/** Botão de apoio: abre a página de doação. Sem recompensa, sem cooldown. */
function drawSupportButton(ctx: CanvasRenderingContext2D, r: Rect, hover: boolean): void {
  ctx.fillStyle = hover ? 'rgba(160,128,80,0.18)' : 'rgba(255,255,255,0.03)';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = 'rgba(160,128,80,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

  ctx.fillStyle = PALETTE.mustard;
  ctx.fillRect(r.x + 6, r.y + 7, 30, 30);
  ctx.fillStyle = '#111';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('A', r.x + 6 + 15, r.y + 7 + 20);

  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 12px monospace';
  ctx.fillText(SUPPORT_LABEL, r.x + 46, r.y + 20);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '11px monospace';
  ctx.fillText('o jogo é gratuito e continua assim', r.x + 46, r.y + 35);
  ctx.textAlign = 'left';
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

/**
 * Lista o texto que a loja desenha com a caixa que ele precisa caber.
 *
 * Existe para o `loja-proof.mjs` (regra 16). As duas seções que reclamaram de
 * estouro — nome de skin na coluna de 44px e a descrição do traje no card —
 * ficavam abaixo da dobra: nenhum dos dois harness pegava, e `tsc` nunca pega.
 * A medição é feita com o `measureText` do canvas do jogo, na fonte real.
 */
export function medirTextosDaLoja(ctx: CanvasRenderingContext2D): { textos: { texto: string; largura: number; caixa: number; caixaNome: string; categoria: string }[]; secoes: { esquerda: [string, number, number][]; direita: [string, number, number][] } } {
  const L = getShopLayout(ctx.canvas.width, ctx.canvas.height);
  const textos: { texto: string; largura: number; caixa: number; caixaNome: string; categoria: string }[] = [];
  const medir = (texto: string, fonte: string): number => {
    const anterior = ctx.font;
    ctx.font = fonte;
    const w = ctx.measureText(texto).width;
    ctx.font = anterior;
    return w;
  };

  for (const [i, r] of L.powerups.entries()) {
    const tipo = stockPowerups[i]?.type;
    if (!tipo) continue;
    // mede o que é DESENHADO (o truncado), não o original: medir o original
    // reprovaria toda descrição longa mesmo com o truncado funcionando
    const linha = truncateText(`${POWERUP_DESC[tipo] ?? ''} · ${POWERUP_TYPES[tipo]?.duration ?? 0}s na próxima fase`, r.w - 50);
    textos.push({ texto: linha, largura: medir(linha, '11px monospace'), caixa: r.w - 50, caixaNome: 'card de power-up', categoria: 'powerup' });
  }

  for (const [i, r] of L.skins.entries()) {
    const nome = truncateText(getAllSkins()[i]?.name ?? '', r.w);
    textos.push({ texto: nome, largura: medir(nome, '11px monospace'), caixa: r.w, caixaNome: 'coluna de skin', categoria: 'skin' });
  }

  for (const [i, r] of L.weapons.entries()) {
    const par = purchasedWeapons[i];
    const nome = par ? WEAPONS[par.index]?.name ?? '' : '';
    textos.push({ texto: nome, largura: medir(nome, '13px monospace'), caixa: r.w - 50, caixaNome: 'card de arma', categoria: 'arma' });
  }

  // As seções em Y, por COLUNA. A loja tem duas colunas que andam na mesma
  // altura de propósito (ARMAS à esquerda, PERKS à direita), então comparar Y
  // entre colunas dá falso positivo em metade das seções. Só se compara quem
  // está na mesma coluna.
  const linha = (y: number, n: number) => [y, 20 + n * ROW_H] as const;
  const esq: [string, number, number][] = [
    ['ARMAS', ...linha(L.sections.weapons, 3)],
    ['POWER-UPS', ...linha(L.sections.powerups, 3)],
    ['MEU INVENTARIO', ...linha(L.sections.inventory, purchasedWeapons.length)],
    ['PECAS', ...linha(L.sections.equippedPieces, 2)],
    ['SKINS', L.sections.skins, 20 + Math.ceil(getAllSkins().length / SKIN_COLS) * SKIN_ROW_H],
    ['MOEDAS', L.sections.ads, 60 + 44 + 30],
  ];
  const dir: [string, number, number][] = [
    ['PERKS', ...linha(L.sections.upgrades, 3)],
    ['SERVICOS', ...linha(L.sections.services, SHOP_SERVICES.length)],
    ['TALENTOS', ...linha(L.sections.talentos, TALENTOS.length)],
  ];
  return { textos, secoes: { esquerda: esq, direita: dir } };
}

/**
 * Largura por caractere da fonte 11px monospace do jogo.
 *
 * A conta anterior de todo truncado era 6.6px e errava por ~9%: `Lanterna` (8
 * caracteres) mede **53px** com `measureText` do navegador, ou seja 6.6px de
 * sobra só depois de 8 — e a coluna da skin tem 44px. O nome vazava. Medido
 * pelo `loja-proof.mjs`, que usa o canvas real em vez de constante.
 */
const CHAR_W_11PX = 6.63;

/** Trunca com … para caber em `maxPx` (monospace: `charW` px por caractere). */
function truncateText(text: string, maxPx: number, charW: number = CHAR_W_11PX): string {
  const maxChars = Math.floor(maxPx / charW);
  if (text.length <= maxChars) return text;
  return text.slice(0, Math.max(0, maxChars - 1)) + '…';
}

/**
 * Processa cliques na loja usando exatamente o mesmo layout do draw.
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
      const t = PERK_LADDER.find(p => p.id === stockPerks[i]);
      if (t) buyPerk(t.id);
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

  // árvore de talentos: gasta ponto de nível, não moeda
  for (let i = 0; i < L.talentos.length; i++) {
    if (hit(L.talentos[i], mouseX, y)) {
      buyTalento(TALENTOS[i].id);
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

  // peças na mochila: botão VENDER à direita, resto da linha = equipar
  // (se os 2 slots estiverem cheios, equipPiece devolve a mais antiga pra mochila)
  for (let i = 0; i < L.pieces.length; i++) {
    if (hit(L.pieces[i], mouseX, y)) {
      const { sell } = rowActionButtons(L.pieces[i]);
      if (hit(sell, mouseX, y)) {
        sellPiece(i);
        return;
      }
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

  if (hit(L.support, mouseX, y)) {
    openSupportLink();
    return;
  }

  if (hit(L.ad, mouseX, y) && canWatchAd()) {
    startWatchingAd();
  }
}
