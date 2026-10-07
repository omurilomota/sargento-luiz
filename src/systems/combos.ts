/**
 * Sistema de combo builds.
 * Detecta sinergias entre arma atual e upgrades comprados.
 * Ativa bônus especiais quando combinações específicas estão ativas.
 */

import { getCurrentWeapon } from '../weapons';
import { getPurchasedUpgrades } from '../ui/shop';
import { PALETTE } from '../core/palette';

/** Representa um combo ativo */
export interface ActiveCombo {
  /** Nome do combo */
  name: string;
  /** Descrição do efeito */
  description: string;
  /** Cor do indicador */
  color: string;
  /** Multiplicador de dano extra (1 = sem bônus) */
  damageBonus: number;
  /** Multiplicador de velocidade de tiro extra (1 = sem bônus) */
  fireRateBonus: number;
  /** Multiplicador de vida extra (1 = sem bônus) */
  healthBonus: number;
}

/** Lista de definições de combos */
const COMBO_DEFINITIONS: {
  name: string;
  description: string;
  color: string;
  damageBonus: number;
  fireRateBonus: number;
  healthBonus: number;
  check: (weaponName: string, upgrades: string[]) => boolean;
}[] = [
  {
    name: 'Atirador de Elite',
    description: 'Sniper + Crítico: +50% dano crítico',
    color: PALETTE.stone,
    damageBonus: 1.5,
    fireRateBonus: 1,
    healthBonus: 1,
    check: (w, u) => w === 'Sniper' && u.includes('Crítico 2x'),
  },
  {
    name: 'Tempestade de Aço',
    description: 'Metralhadora + Dano: +30% velocidade de tiro',
    color: PALETTE.danger,
    damageBonus: 1,
    fireRateBonus: 0.7,
    healthBonus: 1,
    check: (w, u) => w === 'Metralhadora' && u.includes('Dano +25%'),
  },
  {
    name: 'Guardião',
    description: 'Escudo + Vida: +25% vida máxima',
    color: PALETTE.moss,
    damageBonus: 1,
    fireRateBonus: 1,
    healthBonus: 1.25,
    check: (w, u) => u.includes('Escudo') && (u.includes('Vida +25') || u.includes('Vida +50')),
  },
  {
    name: 'Devastador',
    description: 'RPG/Granada + Dano: +40% dano explosivo',
    color: PALETTE.terracotta,
    damageBonus: 1.4,
    fireRateBonus: 1,
    healthBonus: 1,
    check: (w, u) => (w === 'RPG' || w === 'Granada') && u.includes('Dano +25%'),
  },
  {
    name: 'Raio Mortal',
    description: 'Raios + Pierce: +25% dano',
    color: PALETTE.stone,
    damageBonus: 1.25,
    fireRateBonus: 1,
    healthBonus: 1,
    check: (w, u) => w === 'Raios' && u.includes('Pierce'),
  },
  {
    name: 'Gélido',
    description: 'Gel + Velocidade: +20% dano',
    color: PALETTE.mustard,
    damageBonus: 1.2,
    fireRateBonus: 1,
    healthBonus: 1,
    check: (w, u) => w === 'Gel' && u.includes('Velocidade +15%'),
  },
  {
    name: 'Sobrevivente',
    description: 'Vida + Magnetismo: +30% vida máxima',
    color: PALETTE.mustard,
    damageBonus: 1,
    fireRateBonus: 1,
    healthBonus: 1.3,
    check: (w, u) => u.includes('Magnetismo') && (u.includes('Vida +25') || u.includes('Vida +50')),
  },
  {
    name: 'Frenesi',
    description: 'Shotgun + Crítico: +35% dano',
    color: PALETTE.mustard,
    damageBonus: 1.35,
    fireRateBonus: 1,
    healthBonus: 1,
    check: (w, u) => w === 'Shotgun' && u.includes('Crítico 2x'),
  },
];

/** Combos ativos no momento */
let activeCombos: ActiveCombo[] = [];

/**
 * Verifica e atualiza os combos ativos baseado na arma e upgrades atuais.
 */
export function updateCombos(): void {
  const weapon = getCurrentWeapon();
  const upgrades = getPurchasedUpgrades();
  activeCombos = [];

  for (const def of COMBO_DEFINITIONS) {
    if (def.check(weapon.name, upgrades)) {
      activeCombos.push({
        name: def.name,
        description: def.description,
        color: def.color,
        damageBonus: def.damageBonus,
        fireRateBonus: def.fireRateBonus,
        healthBonus: def.healthBonus,
      });
    }
  }
}

/**
 * Retorna os combos ativos.
 * @returns array de combos ativos
 */
export function getActiveCombos(): ActiveCombo[] {
  return activeCombos;
}

/**
 * Retorna o bônus de dano total dos combos.
 * @returns multiplicador de dano (1 = sem bônus)
 */
export function getComboDamageBonus(): number {
  return activeCombos.reduce((mult, c) => mult * c.damageBonus, 1);
}

/**
 * Retorna o bônus de velocidade de tiro dos combos.
 * @returns multiplicador (menor = mais rápido)
 */
export function getComboFireRateBonus(): number {
  return activeCombos.reduce((mult, c) => mult * c.fireRateBonus, 1);
}

/**
 * Retorna o bônus de vida dos combos.
 * @returns multiplicador de vida
 */
export function getComboHealthBonus(): number {
  return activeCombos.reduce((mult, c) => mult * c.healthBonus, 1);
}

/**
 * Reseta os combos ativos.
 */
export function resetCombos(): void {
  activeCombos = [];
}
