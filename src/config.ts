import { Phase, Weapon, Upgrade, Material, CraftingRecipe, Hazard, Element } from './types';

export const PHASES: Phase[] = [
  { name: 'Floresta', bg: '#1a2e1a', gridColor: 'rgba(34,139,34,0.1)', enemyTypes: ['grunt', 'runner'], waves: 3 },
  { name: 'Caverna', bg: '#1a1a2e', gridColor: 'rgba(100,100,150,0.1)', enemyTypes: ['grunt', 'runner', 'tank', 'bat'], waves: 4 },
  { name: 'Fábrica', bg: '#2e1a1a', gridColor: 'rgba(150,100,100,0.1)', enemyTypes: ['grunt', 'runner', 'tank', 'robot'], waves: 4 },
  { name: 'Pântano', bg: '#1a2e2e', gridColor: 'rgba(34,150,150,0.1)', enemyTypes: ['grunt', 'runner', 'slime'], waves: 5 },
  { name: 'Castelo', bg: '#2e2e1a', gridColor: 'rgba(150,150,100,0.1)', enemyTypes: ['grunt', 'runner', 'tank', 'shooter', 'boss'], waves: 5 },
];

export const ENEMY_TYPES: Record<string, any> = {
  grunt: { radius: 16, speed: 80, health: 20, damage: 10, color: '#e74c3c', scoreValue: 10, coinDrop: 2, canShoot: false },
  runner: { radius: 12, speed: 160, health: 10, damage: 8, color: '#e67e22', scoreValue: 15, coinDrop: 3, canShoot: false },
  tank: { radius: 26, speed: 50, health: 80, damage: 20, color: '#8e44ad', scoreValue: 30, coinDrop: 5, canShoot: false },
  shooter: { radius: 14, speed: 60, health: 30, damage: 5, color: '#2980b9', scoreValue: 25, coinDrop: 4, canShoot: true, shootRate: 2.0 },
  bat: { radius: 10, speed: 120, health: 15, damage: 6, color: '#9b59b6', scoreValue: 12, coinDrop: 2, canShoot: false },
  robot: { radius: 18, speed: 70, health: 50, damage: 12, color: '#7f8c8d', scoreValue: 35, coinDrop: 6, canShoot: true, shootRate: 1.5 },
  slime: { radius: 20, speed: 60, health: 25, damage: 8, color: '#1abc9c', scoreValue: 20, coinDrop: 3, splits: true },
  boss: { radius: 40, speed: 40, health: 300, damage: 30, color: '#c0392b', scoreValue: 100, coinDrop: 25, canShoot: true, shootRate: 1.0 },
};

export const WEAPONS: Weapon[] = [
  { name: 'Pistola', damage: 15, shootRate: 0.12, bulletSpeed: 600, bulletCount: 1, spread: 0, color: '#2ecc71', price: 0 },
  { name: 'Shotgun', damage: 10, shootRate: 0.4, bulletSpeed: 500, bulletCount: 3, spread: 0.3, color: '#f39c12', price: 50 },
  { name: 'Metralhadora', damage: 8, shootRate: 0.05, bulletSpeed: 700, bulletCount: 1, spread: 0.1, color: '#e74c3c', price: 80 },
  { name: 'Sniper', damage: 50, shootRate: 0.8, bulletSpeed: 900, bulletCount: 1, spread: 0, color: '#3498db', price: 100 },
];

export const UPGRADES: Upgrade[] = [
  { name: 'Vida +25', effect: 'health', value: 25, price: 30 },
  { name: 'Velocidade +10%', effect: 'speed', value: 0.1, price: 40 },
  { name: 'Dano +20%', effect: 'damage', value: 0.2, price: 60 },
  { name: 'Escudo', effect: 'shield', value: 1, price: 70 },
];

export const MATERIALS: Material[] = [
  { type: 'iron', name: 'Ferro', color: '#95a5a6', dropRate: 0.3 },
  { type: 'crystal', name: 'Cristal', color: '#3498db', dropRate: 0.2 },
  { type: 'fire', name: 'Fogo', color: '#e74c3c', dropRate: 0.25 },
];

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  { materials: ['iron', 'weapon'], result: 'weapon_upgrade', resultType: 'weapon' },
  { materials: ['crystal', 'fire'], result: 'element', resultType: 'element' },
  { materials: ['iron', 'iron', 'iron'], result: 'random_upgrade', resultType: 'upgrade' },
];

export const ELEMENTS: Element[] = [
  { type: 'fire', name: 'Fogo', color: '#e74c3c', effect: 'burn', duration: 2, damage: 5 },
  { type: 'ice', name: 'Gelo', color: '#3498db', effect: 'slow', duration: 2, damage: 0 },
  { type: 'lightning', name: 'Raio', color: '#9b59b6', effect: 'stun', duration: 0.5, damage: 0 },
];

export const HAZARD_TYPES: Record<string, Partial<Hazard>> = {
  lava: { radius: 40, damage: 5, effect: 'burn', duration: 1 },
  ice_trap: { radius: 30, damage: 0, effect: 'stun', duration: 1 },
};
