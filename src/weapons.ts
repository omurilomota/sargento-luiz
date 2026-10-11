/**
 * Sistema de armas e disparo.
 * Gerencia a arma atual, multiplicadores de dano, pierce e crítico.
 * A função shoot() cria os projéteis baseados nas propriedades da arma.
 */

import { Weapon } from './types';
import { WEAPONS, QUALITIES, rollQuality } from './config';
import { PALETTE } from './core/palette';
import { getStat, applyStat, resetStat } from './core/stats';
import { hasPowerUp } from './powerups';
import { getClassReloadMult } from './systems/classes';
import { getPieceModifiers } from './systems/pieces';
import { BULLET_FAMILY } from './systems/sprites';

/**
 * Qualidade da arma EQUIPADA. É do par `{index, quality}`, não do índice:
 * o inventário guarda pares e permite a mesma arma em raridades diferentes,
 * então um `Map` indexado por arma fazia as duas linhas mostrarem e cobrarem a
 * mesma raridade — a última escrita vencia. Quem é dono do inventário é a loja
 * (`purchasedWeapons`), e ela passa a qualidade junto no `setWeapon`.
 */
let currentQuality = 'normal';

export function getWeaponQuality(): string {
  return currentQuality;
}

export function setWeaponQuality(quality: string): void {
  currentQuality = quality;
}

export function rerollWeaponQuality(): string {
  currentQuality = rollQuality();
  return currentQuality;
}

/** Cadência efetiva: base × qualidade × Reflexos (power-up) */
export function getEffectiveShootRate(): number {
  const w = WEAPONS[currentWeaponIndex];
  const q = QUALITIES[currentQuality] ?? QUALITIES.normal;
  let rate = w.shootRate * q.cadenceMult;
  if (hasPowerUp('reflexos')) rate *= 0.5;
  return rate;
}

/** Índice da arma atualmente equipada */
let currentWeaponIndex = 0;
/** Se está recarregando */
let isReloading = false;
/** Timer de recarga restante */
let reloadTimer = 0;

/**
 * Retorna a arma atualmente equipada.
 */
export function getCurrentWeapon(): Weapon {
  return WEAPONS[currentWeaponIndex];
}

export function getCurrentWeaponIndex(): number {
  return currentWeaponIndex;
}

/**
 * Retorna o multiplicador de dano atual.
 */
export function getDamageMultiplier(): number {
  return getStat('damageMult');
}

/**
 * Adiciona ao multiplicador de dano.
 * @param amount - valor a adicionar (ex: 0.25 para +25%)
 */
export function addDamageMultiplier(amount: number) {
  applyStat('damageMult', amount);
}

/**
 * Adiciona cargas de pierce ao total (teto de 3, no registro).
 */
export function addPierce(amount: number) {
  applyStat('pierce', amount);
}

/**
 * Adiciona chance de crítico.
 * @param amount - valor a adicionar (ex: 0.25 para 25% de chance)
 */
export function addCrit(amount: number) {
  applyStat('critChance', amount);
}

/** Multiplicador de velocidade de recarga vive no registro (`reloadSpeed`) */

const JAM_AFTER_SHOTS = 35;
const JAM_REPAIR_TIME = 1.5;

/** Estado de uma arma: munição e encasquilhamento são DA ARMA, não do jogador. */
interface WeaponState {
  ammo: number;
  jammed: boolean;
  jamTimer: number;
  shotsSinceRepair: number;
}

const estadoPorArma = new Map<number, WeaponState>();

/** Capacidade do pente, já com o bônus de peça equipada. */
function capacidadeDe(index: number): number {
  const pieceMods = getPieceModifiers(index);
  return Math.floor(WEAPONS[index].magazineSize * pieceMods.magazineMult);
}

/**
 * Estado da arma no índice, criando com o pente cheio na primeira vez.
 *
 * Antes a munição era UM escalar global e `setWeapon` o reescrevia com
 * `magazineSize`: trocar de arma devolvia o pente inteiro, o que permitia
 * munição infinita alternando duas armas. E `jammed` era global, então trocar
 * de arma também "consertava" a arma quebrada de graça.
 */
function estadoDe(index: number): WeaponState {
  let st = estadoPorArma.get(index);
  if (!st) {
    st = { ammo: capacidadeDe(index), jammed: false, jamTimer: 0, shotsSinceRepair: 0 };
    estadoPorArma.set(index, st);
  }
  return st;
}

/** Aponta para o estado da arma equipada. Nunca chama `capacidadeDe` no tiro. */
let ativa: WeaponState = { ammo: 0, jammed: false, jamTimer: 0, shotsSinceRepair: 0 };

export function isJammed(): boolean { return ativa.jammed; }

export function repairCurrentWeapon(): void {
  ativa.jammed = false;
  ativa.jamTimer = 0;
  ativa.shotsSinceRepair = 0;
}
export function getJamTimer(): number { return ativa.jamTimer; }

/** Pente efetivo da arma equipada, já com peça de CAPACIDADE. */
export function getCurrentCapacity(): number {
  return capacidadeDe(currentWeaponIndex);
}

/** Pente efetivo de uma arma qualquer, já com peça de CAPACIDADE. */
export function getCapacityOf(index: number): number {
  return capacidadeDe(index);
}

/** Recarga efetiva em segundos: base × velocidade × classe × peça. */
export function getReloadTimeOf(index: number): number {
  const pieceMods = getPieceModifiers(index);
  return WEAPONS[index].reloadTime * getStat('reloadSpeed') * getClassReloadMult() * pieceMods.reloadMult;
}

/**
 * Família sonora da arma, pelo que ela FAZ e não pelo desenho.
 *
 * O `weaponClass` do config só tem 3 valores ('pistol' | 'machine' | 'silencer')
 * e serve para escolher a pose do personagem. Para som, 3 categorias em 12
 * armas fazem toda arma com a mesma recarga soar igual. Aqui a família vem da
 * munição: cartucho único, cano duplo, tambor, ferrolho longo, energia,
 * foguete e carga estática.
 */
export type WeaponFamily = 'pistol' | 'shotgun' | 'machine' | 'precision' | 'energy' | 'launcher' | 'mine';

const FAMILIA_POR_ARMA: Record<string, WeaponFamily> = {
  Pistola: 'pistol',
  Shotgun: 'shotgun',
  Metralhadora: 'machine',
  Sniper: 'precision',
  Laser: 'energy',
  Raios: 'energy',
  RPG: 'launcher',
  BFG: 'launcher',
  Granada: 'launcher',
  Gel: 'machine',
  Mina: 'mine',
  'M. Quebrada': 'machine',
  Destruidor: 'launcher',
};

/** Tabela arma → família sonora. Exportada para o teste de áudio. */
export const WEAPON_FAMILY: Record<string, WeaponFamily> = FAMILIA_POR_ARMA;

/** Família sonora da arma atual. */
export function getWeaponFamily(): WeaponFamily {
  return FAMILIA_POR_ARMA[getCurrentWeapon().name] ?? 'pistol';
}

/** Ficha completa de uma arma: os números que o painel e a loja mostram. */
export interface WeaponStats {
  name: string;
  quality: string;
  damage: number;
  shootRate: number;
  magazine: number;
  reloadTime: number;
  dps: number;
  pierce: boolean;
  explosive: boolean;
  bulletCount: number;
  spread: number;
}

/**
 * DPS efetivo de um par (arma + qualidade), já contando recarga, peça e a
 * penalidade do pierce.
 *
 * O modelo é o mesmo de `balance.test.ts`: dano do pente inteiro por ciclo,
 * onde o ciclo é `magnitude × intervalo + recarga`. O que o `shoot()` faz com
 * multiplicadores de build (upgrade, combo, classe) é aplicado por cima e
 * muda igual para todas as armas — comparar duas com elas inclinado não muda
 * qual é melhor, então ficam fora daqui.
 */
export function getEffectiveDps(index: number, quality: string): number {
  const w = WEAPONS[index];
  const q = QUALITIES[quality] ?? QUALITIES.normal;
  const pieceMods = getPieceModifiers(index);
  const interval = Math.max(0.01, w.shootRate * q.cadenceMult);
  const magazine = capacidadeDe(index);
  const reload = getReloadTimeOf(index);
  const cycle = magazine * interval + reload;
  const perShot = w.damage * w.bulletCount * q.damageMult * pieceMods.damageMult;
  const piercing = w.pierce || q.pierce;
  const raw = perShot * (piercing ? 0.75 : 1);
  // Falha da Quebrada consome o pente sem dano: o DPS efetivo cai pela chance.
  const expected = 1 - (q.failChance ?? 0);
  return cycle > 0 ? (magazine * raw / cycle) * expected : 0;
}

/** Ficha de uma arma equipped ou candidata, para o painel e o comparador. */
export function getWeaponStats(index: number, quality: string): WeaponStats {
  const w = WEAPONS[index];
  const q = QUALITIES[quality] ?? QUALITIES.normal;
  const pieceMods = getPieceModifiers(index);
  return {
    name: w.name,
    quality: q.label,
    damage: Math.round(w.damage * q.damageMult * pieceMods.damageMult * getStat('damageMult')),
    shootRate: Math.round(intervalDe(index, quality) * 100) / 100,
    magazine: capacidadeDe(index),
    reloadTime: Math.round(getReloadTimeOf(index) * 100) / 100,
    dps: Math.round(getEffectiveDps(index, quality)),
    pierce: w.pierce || q.pierce || getStat('pierce') > 0,
    explosive: !!w.explosive,
    bulletCount: w.bulletCount,
    spread: Math.round(w.spread * q.spreadMult * pieceMods.spreadMult * 1000) / 1000,
  };
}

/** Intervalo entre disparos de um par, já com qualidade. */
function intervalDe(index: number, quality: string): number {
  const q = QUALITIES[quality] ?? QUALITIES.normal;
  return Math.max(0.01, WEAPONS[index].shootRate * q.cadenceMult);
}

/**
 * Reduz o tempo de recarga.
 * @param amount - valor a subtrair do multiplicador (ex: 0.3 = 30% mais rápido)
 */
export function addReloadSpeed(amount: number) {
  applyStat('reloadSpeed', -amount);
}

/**
 * Retorna a quantidade de pierce extra.
 */
export function getPierceCount(): number {
  return getStat('pierce');
}

/**
 * Reseta arma e todos os multiplicadores para os valores iniciais.
 * Usado ao reiniciar o jogo.
 */
/**
 * Enche o pente da arma na mão, sem tocar em nada mais.
 *
 * O jogo usava `resetWeapons()` na troca de fase, mas ele zera `damageMult`,
 * `pierce`, `critChance`, `reloadSpeed` e a munição de TODAS as armas — ou seja,
 * devolver o jogador ao estado inicial e estourar a build na troca de fase.
 *
 * Nasceu do bug que o jogador reportou: chegar à horda seguinte com 2/25 no
 * pente e recarregar no meio do melee. "Todas as armas cheias na troca de
 * fase" é a leitura de qualquer jogador — recarregar é decisão dele, não
 * imposto na entrada.
 */
export function refillAmmo(): void {
  // `estadoDe` cria com o pente cheio na primeira vez, então percorrer todos os
  // índices também registra as armas que ainda não foram equipadas — sem isso a
  // metralhadora chegaria na horda com o estado do primeiro disparo.
  for (let i = 0; i < WEAPONS.length; i++) estadoDe(i).ammo = capacidadeDe(i);
  // a recarga é global (`isReloading`/`reloadTimer`), não por arma: recarregar
  // custa tempo e o jogador entra na fase com o pente cheio, sem recarga
  // pendente no meio do combate.
  isReloading = false;
  reloadTimer = 0;
}

export function resetWeapons() {
  currentWeaponIndex = 0;
  resetStat('damageMult');
  resetStat('pierce');
  resetStat('critChance');
  resetStat('reloadSpeed');
  estadoPorArma.clear();
  ativa = estadoDe(0);
  isReloading = false;
  reloadTimer = 0;
}

/**
 * Retorna a munição atual no pente.
 */
export function getCurrentAmmo(): number {
  return ativa.ammo;
}

/**
 * Retorna se a arma está recarregando.
 * @returns true se recarregando
 */
export function getIsReloading(): boolean {
  return isReloading;
}

/**
 * Retorna o timer de recarga restante.
 * @returns segundos restantes de recarga
 */
export function getReloadTimer(): number {
  return reloadTimer;
}

/**
 * Retorna se a arma pode disparar.
 * @returns true se pode disparar (tem munição e não está recarregando)
 */
export function canShoot(): boolean {
  return (ativa.ammo > 0 || hasPowerUp('municaoInfinita')) && !isReloading && !ativa.jammed;
}

/**
 * Consome uma unidade de munição.
 */
export function useAmmo(): void {
  if (ativa.ammo > 0) ativa.ammo--;
}

/**
 * Inicia a recarga da arma atual.
 */
export function startReload(): void {
  if (isReloading || ativa.ammo >= capacidadeDe(currentWeaponIndex)) return;
  const pieceMods = getPieceModifiers(currentWeaponIndex);
  isReloading = true;
  reloadTimer = WEAPONS[currentWeaponIndex].reloadTime * getStat('reloadSpeed') * getClassReloadMult() * pieceMods.reloadMult;
  // O som de recarga sai aqui, no início da recarga — `updateReload` roda todo
  // frame e dispararia o som 60x por segundo.
  reloadHook?.();
}

/**
 * Callback disparado quando uma recarga começa.
 *
 * Fica injetável porque `audio.ts` importa `weapons.ts` (WEAPON_SOUNDS), e não
 * o contrário: sem esta ponte, `startReload` não teria como tocar som sem criar
 * um ciclo de import.
 */
let reloadHook: (() => void) | null = null;

export function onReloadStarted(fn: () => void): void {
  reloadHook = fn;
}

/**
 * Atualiza o timer de recarga.
 */
export function updateReload(dt: number): void {
  if (ativa.jammed) {
    ativa.jamTimer -= dt;
    if (ativa.jamTimer <= 0) {
      ativa.jammed = false;
      ativa.jamTimer = 0;
      ativa.shotsSinceRepair = 0;
    }
    return;
  }
  if (!isReloading) return;
  reloadTimer -= dt;
  if (reloadTimer <= 0) {
    isReloading = false;
    ativa.ammo = capacidadeDe(currentWeaponIndex);
    reloadTimer = 0;
  }
}

/**
 * Define a arma equipada e recarrega.
 * @param index - índice da arma no array WEAPONS
 * @param quality - raridade do par que está sendo equipado
 */
export function setWeapon(index: number, quality?: string) {
  currentWeaponIndex = index;
  if (quality) currentQuality = quality;
  ativa = estadoDe(index);
  // Recarga em andamento é da arma que estava na mão: trocar cancela, mas a
  // munição e o encasquilhamento ficam guardados para quando ela voltar.
  isReloading = false;
  reloadTimer = 0;
}

/**
 * Cria projéteis a partir da arma atual.
 * Calcula dispersão, dano com crítico e cor diferenciada para acertos críticos.
 * @param angle - ângulo de disparo em radianos
 * @param multiShot - se true, duplica a quantidade de projéteis
 * @returns array de objetos de projétil a serem adicionados ao sistema
 */
export function shoot(x: number, y: number, angle: number, multiShot: boolean, skillDamageMult = 1): { x: number; y: number; vx: number; vy: number; damage: number; color: string; isCrit: boolean; pierce: boolean; explosive: boolean; explosionRadius: number; bulletSprite: string }[] {
  const weapon = WEAPONS[currentWeaponIndex];
  const qualityKey = currentQuality;
  const q = QUALITIES[qualityKey] ?? QUALITIES.normal;
  const effCrit = getStat('critChance') + q.critBonus;
  const count = multiShot ? weapon.bulletCount * 2 : weapon.bulletCount;
  const newBullets: ReturnType<typeof shoot> = [];
  // qualidade Quebrada: 20% de chance de a arma falhar no disparo
  if (q.failChance > 0 && Math.random() < q.failChance) {
    ativa.ammo = Math.max(0, ativa.ammo - 1);
    return [];
  }
  for (let i = 0; i < count; i++) {
    const pieceMods = getPieceModifiers(currentWeaponIndex);
    const spread = count > 1 ? (i - (count - 1) / 2) * weapon.spread * pieceMods.spreadMult : 0;
    const a = angle + spread * q.spreadMult;
    const isCrit = Math.random() < Math.min(effCrit, 0.6);
    // `critMult` (e não 1.5 na mão): um combo que mexe no crítico tem de ter
  // efeito. Com o número hardcoded, mexer no stat era inócuo em silêncio.
  const dmg = weapon.damage * getStat('damageMult') * skillDamageMult * q.damageMult * (isCrit ? getStat('critMult') : 1) * pieceMods.damageMult;
    // pierce sempre custa dano: -25% no tiro perfurante
    const piercing = weapon.pierce || getStat('pierce') > 0 || q.pierce;
    const effDmg = piercing ? dmg * 0.75 : dmg;
    newBullets.push({
      x, y,
      vx: Math.cos(a) * weapon.bulletSpeed,
      vy: Math.sin(a) * weapon.bulletSpeed,
      damage: effDmg,
      color: isCrit ? PALETTE.crit : weapon.color,
      isCrit,
      pierce: piercing,
      explosive: weapon.explosive || false,
      explosionRadius: weapon.explosionRadius || 0,
      bulletSprite: BULLET_FAMILY[weapon.name] ?? 'small_bullet',
    });
  }
  ativa.ammo = Math.max(0, ativa.ammo - (hasPowerUp('municaoInfinita') ? 0 : 1));
  // arma quebrada encasquilha depois de N disparos — o dono precisa consertar
  if (WEAPONS[currentWeaponIndex].broken || qualityKey === 'quebrada') {
    ativa.shotsSinceRepair++;
    if (ativa.shotsSinceRepair >= JAM_AFTER_SHOTS) {
      ativa.jammed = true;
      ativa.jamTimer = JAM_REPAIR_TIME;
    }
  }
  return newBullets;
}
