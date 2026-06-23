// src/config.ts
import { Phase, Weapon, Upgrade, EnemyType } from './types';

export const PHASES: Phase[] = [
  { name: 'Floresta', bg: '#1a2e1a', bgColor2: '#0d1a0d', gridColor: 'rgba(34,139,34,0.1)', enemyTypes: ['grunt', 'runner', 'spitter'], waves: 4 },
  { name: 'Caverna', bg: '#1a1a2e', bgColor2: '#0d0d1a', gridColor: 'rgba(100,100,150,0.1)', enemyTypes: ['grunt', 'runner', 'tank', 'bat', 'crystal'], waves: 5 },
  { name: 'Fábrica', bg: '#2e1a1a', bgColor2: '#1a0d0d', gridColor: 'rgba(150,100,100,0.1)', enemyTypes: ['grunt', 'runner', 'tank', 'robot', 'drone'], waves: 5 },
  { name: 'Pântano', bg: '#1a2e2e', bgColor2: '#0d1a1a', gridColor: 'rgba(34,150,150,0.1)', enemyTypes: ['grunt', 'slime', 'mosquito', 'frog'], waves: 6 },
  { name: 'Castelo', bg: '#2e2e1a', bgColor2: '#1a1a0d', gridColor: 'rgba(150,150,100,0.1)', enemyTypes: ['knight', 'archer', 'mage', 'boss'], waves: 6 },
  { name: 'Vulcão', bg: '#2e0d0d', bgColor2: '#1a0505', gridColor: 'rgba(200,50,50,0.1)', enemyTypes: ['fireElemental', 'lavaSlime', 'magmaGolem', 'inferno'], waves: 7 },
  { name: 'Espaço', bg: '#05050d', bgColor2: '#020208', gridColor: 'rgba(100,100,200,0.05)', enemyTypes: ['ufo', 'asteroid', 'alien', 'mothership'], waves: 7 },
];

export const ENEMY_TYPES: Record<string, EnemyType> = {
  grunt: { radius: 16, speed: 80, health: 20, damage: 10, color: '#e74c3c', scoreValue: 10, coinDrop: 2 },
  runner: { radius: 12, speed: 160, health: 10, damage: 8, color: '#e67e22', scoreValue: 15, coinDrop: 3 },
  tank: { radius: 26, speed: 50, health: 80, damage: 20, color: '#8e44ad', scoreValue: 30, coinDrop: 5 },
  shooter: { radius: 14, speed: 60, health: 30, damage: 5, color: '#2980b9', scoreValue: 25, coinDrop: 4, canShoot: true, shootRate: 2.0 },
  bat: { radius: 10, speed: 120, health: 15, damage: 6, color: '#9b59b6', scoreValue: 12, coinDrop: 2 },
  robot: { radius: 18, speed: 70, health: 50, damage: 12, color: '#7f8c8d', scoreValue: 35, coinDrop: 6, canShoot: true, shootRate: 1.5 },
  slime: { radius: 20, speed: 60, health: 25, damage: 8, color: '#1abc9c', scoreValue: 20, coinDrop: 3 },
  boss: { radius: 45, speed: 35, health: 500, damage: 30, color: '#c0392b', scoreValue: 200, coinDrop: 40, canShoot: true, shootRate: 0.8, isBoss: true },
  spitter: { radius: 14, speed: 70, health: 18, damage: 4, color: '#27ae60', scoreValue: 18, coinDrop: 3, canShoot: true, shootRate: 1.5, projectileColor: '#27ae60' },
  crystal: { radius: 22, speed: 40, health: 60, damage: 15, color: '#3498db', scoreValue: 40, coinDrop: 7, canShoot: true, shootRate: 3.0, splitBullet: true },
  drone: { radius: 11, speed: 100, health: 12, damage: 5, color: '#95a5a6', scoreValue: 14, coinDrop: 2 },
  mosquito: { radius: 8, speed: 200, health: 8, damage: 4, color: '#d35400', scoreValue: 8, coinDrop: 1 },
  frog: { radius: 18, speed: 90, health: 22, damage: 10, color: '#2ecc71', scoreValue: 22, coinDrop: 3, canShoot: true, shootRate: 2.5 },
  knight: { radius: 20, speed: 65, health: 45, damage: 18, color: '#bdc3c7', scoreValue: 35, coinDrop: 5, armor: true },
  archer: { radius: 13, speed: 55, health: 20, damage: 8, color: '#e67e22', scoreValue: 28, coinDrop: 4, canShoot: true, shootRate: 1.2 },
  mage: { radius: 15, speed: 50, health: 25, damage: 12, color: '#9b59b6', scoreValue: 45, coinDrop: 8, canShoot: true, shootRate: 2.0 },
  fireElemental: { radius: 17, speed: 85, health: 28, damage: 12, color: '#e74c3c', scoreValue: 30, coinDrop: 4, canShoot: true, shootRate: 1.8, leavesFire: true },
  lavaSlime: { radius: 22, speed: 45, health: 35, damage: 10, color: '#d35400', scoreValue: 25, coinDrop: 4 },
  magmaGolem: { radius: 30, speed: 35, health: 120, damage: 25, color: '#c0392b', scoreValue: 60, coinDrop: 10, armor: true },
  inferno: { radius: 16, speed: 90, health: 30, damage: 8, color: '#f39c12', scoreValue: 35, coinDrop: 5, canShoot: true, shootRate: 0.6, spreadShot: true },
  ufo: { radius: 20, speed: 70, health: 40, damage: 10, color: '#1abc9c', scoreValue: 40, coinDrop: 6, canShoot: true, shootRate: 1.5 },
  asteroid: { radius: 28, speed: 30, health: 100, damage: 30, color: '#7f8c8d', scoreValue: 50, coinDrop: 8 },
  alien: { radius: 14, speed: 110, health: 20, damage: 8, color: '#2ecc71', scoreValue: 25, coinDrop: 4, canShoot: true, shootRate: 1.0 },
  mothership: { radius: 50, speed: 25, health: 800, damage: 40, color: '#8e44ad', scoreValue: 500, coinDrop: 80, canShoot: true, shootRate: 0.5, isBoss: true, summons: true },
};

export const WEAPONS: Weapon[] = [
  { name: 'Pistola', damage: 15, shootRate: 0.12, bulletSpeed: 600, bulletCount: 1, spread: 0, color: '#2ecc71', price: 0, pierce: false },
  { name: 'Shotgun', damage: 10, shootRate: 0.4, bulletSpeed: 500, bulletCount: 3, spread: 0.3, color: '#f39c12', price: 50, pierce: false },
  { name: 'Metralhadora', damage: 8, shootRate: 0.05, bulletSpeed: 700, bulletCount: 1, spread: 0.1, color: '#e74c3c', price: 80, pierce: false },
  { name: 'Sniper', damage: 60, shootRate: 0.8, bulletSpeed: 1000, bulletCount: 1, spread: 0, color: '#3498db', price: 120, pierce: true },
  { name: 'Laser', damage: 5, shootRate: 0.02, bulletSpeed: 1200, bulletCount: 1, spread: 0, color: '#e74c3c', price: 150, pierce: true },
  { name: 'RPG', damage: 80, shootRate: 1.2, bulletSpeed: 400, bulletCount: 1, spread: 0, color: '#e67e22', price: 200, pierce: false },
  { name: 'Raios', damage: 25, shootRate: 0.15, bulletSpeed: 800, bulletCount: 3, spread: 0.15, color: '#9b59b6', price: 180, pierce: true },
  { name: 'Gel', damage: 12, shootRate: 0.1, bulletSpeed: 550, bulletCount: 2, spread: 0.2, color: '#3498db', price: 100, pierce: false },
];

export const UPGRADES: Upgrade[] = [
  { name: 'Vida +25', effect: 'health', value: 25, price: 30 },
  { name: 'Velocidade +15%', effect: 'speed', value: 0.15, price: 45 },
  { name: 'Dano +25%', effect: 'damage', value: 0.25, price: 70 },
  { name: 'Escudo', effect: 'shield', value: 1, price: 80 },
  { name: 'Vida +50', effect: 'health', value: 50, price: 55 },
  { name: 'Magnetismo', effect: 'magnet', value: 1, price: 60 },
  { name: 'Crítico 2x', effect: 'crit', value: 0.25, price: 100 },
  { name: 'Pierce', effect: 'pierce', value: 1, price: 120 },
];

export const POWERUP_TYPES: Record<string, { color: string; symbol: string; duration: number }> = {
  health: { color: '#2ecc71', symbol: '+', duration: 0 },
  speed: { color: '#f39c12', symbol: '»', duration: 5 },
  damage: { color: '#e74c3c', symbol: '!', duration: 5 },
  shield: { color: '#3498db', symbol: 'O', duration: 0 },
  magnet: { color: '#9b59b6', symbol: 'M', duration: 8 },
  multiShot: { color: '#e67e22', symbol: 'x3', duration: 6 },
  invincible: { color: '#f1c40f', symbol: '*', duration: 4 },
};
