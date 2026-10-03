/**
 * src/config.ts
 * Arquivo de configuração centralizado do jogo.
 * Contém todos os dados estáticos: fases, tipos de inimigos, armas,
 * upgrades e power-ups. Modificar estes valores altera o balanceamento
 * e a experiência de jogo.
 */
import { Phase, Weapon, Upgrade, EnemyType } from './types';
import { PALETTE } from './core/palette';

/** Lista de fases do jogo, definidas em ordem de progressão */
export const PHASES: Phase[] = [
  {
    name: 'Cidade em Ruínas', bg: '#1c1a18', bgColor2: '#0e0d0c', gridColor: 'rgba(160,128,80,0.06)',
    enemyTypes: ['grunt'], waves: 3, map: 'cidade', hazard: 'debris',
    objective: 'clear', objectiveTarget: 0, boss: 'vigia',
  },
  {
    name: 'Floresta', bg: '#1a2e1a', bgColor2: '#0d1a0d', gridColor: 'rgba(34,139,34,0.1)',
    enemyTypes: ['grunt', 'runner', 'spitter'], waves: 4, map: 'floresta', hazard: 'fog',
    objective: 'clear', objectiveTarget: 0, boss: 'alphaWolf',
  },
  {
    name: 'Caverna', bg: '#1a1a2e', bgColor2: '#0d0d1a', gridColor: 'rgba(100,100,150,0.1)',
    enemyTypes: ['grunt', 'runner', 'tank', 'bat', 'crystal'], waves: 5, map: 'caverna', hazard: 'darkness',
    objective: 'destroy', objectiveTarget: 3, boss: 'crystalQueen',
  },
  {
    name: 'Fábrica', bg: '#2e1a1a', bgColor2: '#1a0d0d', gridColor: 'rgba(150,100,100,0.1)',
    enemyTypes: ['grunt', 'runner', 'tank', 'robot', 'drone'], waves: 5, map: 'fabrica', hazard: 'electric',
    objective: 'survive', objectiveTarget: 45, boss: 'sentinel',
  },
  {
    name: 'Pântano', bg: '#1a2e2e', bgColor2: '#0d1a1a', gridColor: 'rgba(34,150,150,0.1)',
    enemyTypes: ['grunt', 'slime', 'mosquito', 'frog'], waves: 6, map: 'pantano', hazard: 'mud',
    objective: 'clear', objectiveTarget: 0, boss: 'leviathan',
  },
  {
    name: 'Castelo', bg: '#2e2e1a', bgColor2: '#1a1a0d', gridColor: 'rgba(150,150,100,0.1)',
    enemyTypes: ['knight', 'archer', 'mage'], waves: 6, map: 'castelo', hazard: 'spikes',
    objective: 'protect', objectiveTarget: 0, boss: 'reiMutante',
  },
  {
    name: 'Vulcão', bg: '#2e0d0d', bgColor2: '#1a0505', gridColor: 'rgba(200,50,50,0.1)',
    enemyTypes: ['fireElemental', 'lavaSlime', 'magmaGolem', 'inferno'], waves: 7, map: 'vulcao', hazard: 'lava',
    objective: 'reach', objectiveTarget: 0, boss: 'infernoPrime',
  },
  {
    name: 'Espaço', bg: '#05050d', bgColor2: '#020208', gridColor: 'rgba(100,100,200,0.05)',
    enemyTypes: ['ufo', 'asteroid', 'alien', 'drone'], waves: 7, map: 'espaco', hazard: 'lowGravity',
    objective: 'clear', objectiveTarget: 0, boss: 'mothership',
  },
  {
    name: 'Bunker Central', bg: '#15161a', bgColor2: '#0a0b0d', gridColor: 'rgba(160,128,80,0.05)',
    enemyTypes: ['grunt', 'runner', 'tank', 'robot'], waves: 6, map: 'bunker', hazard: 'none',
    objective: 'clear', objectiveTarget: 0, boss: 'nucleo',
  },
];

/** Mapa de todos os tipos de inimigos disponíveis no jogo */
export const ENEMY_TYPES: Record<string, EnemyType> = {
  grunt: { radius: 16, speed: 80, health: 20, damage: 10, color: '#8b4040', scoreValue: 10, coinDrop: 2 },
  runner: { radius: 12, speed: 160, health: 10, damage: 8, color: '#b07050', scoreValue: 15, coinDrop: 3 },
  tank: { radius: 26, speed: 50, health: 80, damage: 20, color: '#608090', scoreValue: 30, coinDrop: 5 },
  bat: { radius: 10, speed: 120, health: 15, damage: 6, color: '#6a5a4a', scoreValue: 12, coinDrop: 2 },
  robot: { radius: 18, speed: 70, health: 50, damage: 12, color: '#6a6a6a', scoreValue: 35, coinDrop: 6, canShoot: true, shootRate: 1.5, bulletSpeed: 350, projectileColor: PALETTE.terracotta },
  slime: { radius: 20, speed: 60, health: 25, damage: 8, color: '#5a7a5a', scoreValue: 20, coinDrop: 3 },
  spitter: { radius: 14, speed: 70, health: 18, damage: 4, color: '#5a7a5a', scoreValue: 18, coinDrop: 3, canShoot: true, shootRate: 1.5, bulletSpeed: 300, projectileColor: '#5a7a5a' },
  crystal: { radius: 22, speed: 40, health: 60, damage: 15, color: '#608090', scoreValue: 40, coinDrop: 7, canShoot: true, shootRate: 3.0, bulletSpeed: 200, splitBullet: true, projectileColor: PALETTE.stone },
  drone: { radius: 11, speed: 100, health: 12, damage: 5, color: '#6a6a6a', scoreValue: 14, coinDrop: 2 },
  mosquito: { radius: 8, speed: 200, health: 8, damage: 4, color: '#8a6a4a', scoreValue: 8, coinDrop: 1 },
  frog: { radius: 18, speed: 90, health: 22, damage: 10, color: '#5a7a5a', scoreValue: 22, coinDrop: 3, canShoot: true, shootRate: 2.5, bulletSpeed: 300, projectileColor: PALETTE.stone },
  knight: { radius: 20, speed: 65, health: 45, damage: 18, color: '#8a8a7a', scoreValue: 35, coinDrop: 5, armor: true },
  // O arqueiro é o caçador do sobrevivente: passa por você para atirar no NPC.
  // knight e mage continuam caçando o jogador, então a pressão não some — o
  // jogador escolhe entre matar o arqueiro ou servir de escudo.
  archer: { radius: 13, speed: 55, health: 20, damage: 8, color: '#b07050', scoreValue: 28, coinDrop: 4, canShoot: true, huntsNpc: true, shootRate: 1.2, bulletSpeed: 400, projectileColor: PALETTE.terracotta },
  mage: { radius: 15, speed: 50, health: 25, damage: 12, color: '#7a6a8a', scoreValue: 45, coinDrop: 8, canShoot: true, shootRate: 2.0, bulletSpeed: 350, projectileColor: '#7a6a8a' },
  fireElemental: { radius: 17, speed: 85, health: 28, damage: 12, color: '#8b4040', scoreValue: 30, coinDrop: 4, canShoot: true, shootRate: 1.8, bulletSpeed: 300, leavesFire: true, projectileColor: '#c46a3a' },
  lavaSlime: { radius: 22, speed: 45, health: 35, damage: 10, color: '#8a5a3a', scoreValue: 25, coinDrop: 4 },
  magmaGolem: { radius: 30, speed: 35, health: 120, damage: 25, color: '#6a3a2a', scoreValue: 60, coinDrop: 10, armor: true },
  inferno: { radius: 16, speed: 90, health: 30, damage: 8, color: '#a08050', scoreValue: 35, coinDrop: 5, canShoot: true, shootRate: 0.6, bulletSpeed: 350, spreadShot: true, projectileColor: '#c46a3a' },
  ufo: { radius: 20, speed: 70, health: 40, damage: 10, color: '#6a8a6a', scoreValue: 40, coinDrop: 6, canShoot: true, shootRate: 1.5, bulletSpeed: 300, projectileColor: PALETTE.moss },
  asteroid: { radius: 28, speed: 30, health: 100, damage: 30, color: '#6a6a6a', scoreValue: 50, coinDrop: 8 },
  alien: { radius: 14, speed: 110, health: 20, damage: 8, color: '#5a7a5a', scoreValue: 25, coinDrop: 4, canShoot: true, shootRate: 1.0, bulletSpeed: 400, projectileColor: PALETTE.moss },

  // ─── Bosses ────────────────────────────────────────────────
  vigia: {
    radius: 40, speed: 78, health: 520, damage: 18, color: '#8a7a6a', scoreValue: 250, coinDrop: 30,
    canShoot: false, isBoss: true, bossName: 'VIGIA', telegraph: 1.1,
    // Primeira luta do jogo, então o padrão é uma aula: telegrafia longa,
    // uma ação por faixa, e o texto da telegrafia diz o que vai acontecer.
    // A investida é a primeira coisa que o jogador aprende a desviar, e os
    // barris ensinam que o campo é combustível antes da segunda fase.
    pattern: [
      { atHp: 1.0, action: 'charge', telegraph: 'OLHE PARA CÁ' },
      { atHp: 0.55, action: 'mines', telegraph: 'OS BARRIS EXPLODEM' },
      { atHp: 0.25, action: 'summon', telegraph: 'CHAMANDO REFORÇOS' },
    ],
  },
  alphaWolf: {
    radius: 42, speed: 95, health: 900, damage: 26, color: '#7a6a5a', scoreValue: 400, coinDrop: 45,
    canShoot: false, isBoss: true, bossName: 'ALPHA WOLF', telegraph: 0.9,
    pattern: [
      { atHp: 1.0, action: 'charge', telegraph: 'CARREGANDO' },
      { atHp: 0.6, action: 'summon', telegraph: 'CHAMANDO A MATILHA' },
      { atHp: 0.3, action: 'sweep', telegraph: 'VARRENDO' },
    ],
  },
  crystalQueen: {
    radius: 46, speed: 45, health: 1400, damage: 30, color: '#608090', scoreValue: 550, coinDrop: 60,
    canShoot: true, shootRate: 2.4, bulletSpeed: 260, isBoss: true, bossName: 'CRYSTAL QUEEN', telegraph: 1.0,
    projectileColor: PALETTE.stone,
    pattern: [
      { atHp: 1.0, action: 'split', telegraph: 'FRATURANDO' },
      { atHp: 0.65, action: 'ring', telegraph: 'ONDA DE CRISTAL' },
      { atHp: 0.3, action: 'mines', telegraph: 'COLAPSANDO' },
    ],
  },
  sentinel: {
    radius: 48, speed: 38, health: 1900, damage: 34, color: '#6a6a6a', scoreValue: 700, coinDrop: 80,
    canShoot: true, shootRate: 1.8, bulletSpeed: 300, isBoss: true, bossName: 'SENTINEL', telegraph: 0.8,
    projectileColor: PALETTE.terracotta,
    pattern: [
      { atHp: 1.0, action: 'spread', telegraph: 'ALVO IDENTIFICADO' },
      { atHp: 0.7, action: 'mines', telegraph: 'DRONES DE PERSEGUIÇÃO' },
      { atHp: 0.4, action: 'sweep', telegraph: 'LEQUE FECHADO' },
      { atHp: 0.2, action: 'ring', telegraph: 'SOBRECARGA' },
    ],
  },
  leviathan: {
    radius: 50, speed: 60, health: 2200, damage: 36, color: '#5a7a5a', scoreValue: 750, coinDrop: 85,
    canShoot: true, shootRate: 2.0, bulletSpeed: 280, isBoss: true, bossName: 'LEVIATHAN', telegraph: 0.9,
    projectileColor: '#5a7a5a',
    pattern: [
      { atHp: 1.0, action: 'spread', telegraph: 'JATO ABRASIVO' },
      { atHp: 0.5, action: 'sweep', telegraph: 'CAUDA' },
    ],
  },
  reiMutante: {
    radius: 46, speed: 55, health: 2600, damage: 38, color: '#8a8a7a', scoreValue: 800, coinDrop: 90,
    canShoot: true, shootRate: 2.2, bulletSpeed: 320, isBoss: true, bossName: 'REI MUTANTE', telegraph: 0.9,
    projectileColor: PALETTE.terracotta, armor: true,
    pattern: [
      { atHp: 1.0, action: 'ring', telegraph: 'GOLPE REAL' },
      { atHp: 0.6, action: 'summon', telegraph: 'GUARDA' },
      { atHp: 0.25, action: 'charge', telegraph: 'INVESTIDA' },
    ],
  },
  infernoPrime: {
    radius: 48, speed: 62, health: 3000, damage: 40, color: '#c46a3a', scoreValue: 900, coinDrop: 100,
    canShoot: true, shootRate: 1.4, bulletSpeed: 340, isBoss: true, bossName: 'INFERNO PRIME', telegraph: 0.7,
    projectileColor: '#c46a3a',
    pattern: [
      { atHp: 1.0, action: 'spread', telegraph: 'CABRAÇAS' },
      { atHp: 0.55, action: 'mines', telegraph: 'GEISERS' },
      { atHp: 0.25, action: 'ring', telegraph: 'COLAPSO' },
    ],
  },
  mothership: {
    radius: 54, speed: 30, health: 3600, damage: 44, color: '#7a6a8a', scoreValue: 1200, coinDrop: 140,
    canShoot: true, shootRate: 1.2, bulletSpeed: 300, isBoss: true, bossName: 'MOTHERSHIP', telegraph: 0.8,
    projectileColor: '#7a6a8a',
    pattern: [
      { atHp: 1.0, action: 'ring', telegraph: 'ESCUDO EXTERNO' },
      { atHp: 0.7, action: 'summon', telegraph: 'INTERCEPTADORES' },
      { atHp: 0.4, action: 'sweep', telegraph: 'CANHO PRINCIPAL' },
      { atHp: 0.15, action: 'split', telegraph: 'NÚCLEO EXPOSTO' },
    ],
  },
  nucleo: {
    radius: 46, speed: 34, health: 4200, damage: 46, color: '#7a7a8a', scoreValue: 1500, coinDrop: 180,
    canShoot: true, shootRate: 1.0, bulletSpeed: 340, isBoss: true, bossName: 'NÚCLEO', telegraph: 0.7,
    projectileColor: PALETTE.stone, armor: true,
    // O último chefe tira uma opção por faixa, em vez de somar HP: tiro
    // mirado → o salão vira combustível → nenhuma diagonal é segura → nenhuma
    // posição é segura. Sem investida porque a galeria do Bunker é estreita
    // demais para carregar, e sem invocação porque o NÚCLEO não chama reforço:
    // ele executa. É o único chefe com armadura, e o de telegrafia mais curta
    // do jogo — o oposto do VIGIA, que é a primeira coisa que o jogador vê.
    pattern: [
      { atHp: 1.0, action: 'spread', telegraph: 'ALVO REGISTRADO' },
      { atHp: 0.7, action: 'mines', telegraph: 'PURGA' },
      { atHp: 0.45, action: 'sweep', telegraph: 'VARREDURA' },
      { atHp: 0.2, action: 'ring', telegraph: 'SOBRECARGA' },
    ],
  },
};

/** Lista de armas disponíveis, ordenadas por desbloqueio */
export const WEAPONS: Weapon[] = [
  { name: 'Pistola', damage: 10, shootRate: 0.35, bulletSpeed: 600, bulletCount: 1, spread: 0, color: PALETTE.moss, price: 0, pierce: false, magazineSize: 10, reloadTime: 1.2, weaponClass: 'pistol' },
  { name: 'Shotgun', damage: 7, shootRate: 0.6, bulletSpeed: 500, bulletCount: 3, spread: 0.3, color: PALETTE.terracotta, price: 80, pierce: false, magazineSize: 8, reloadTime: 1.3, weaponClass: 'pistol' },
  { name: 'Metralhadora', damage: 5, shootRate: 0.14, bulletSpeed: 700, bulletCount: 1, spread: 0.1, color: '#a05a4a', price: 150, pierce: false, magazineSize: 25, reloadTime: 2.0, weaponClass: 'machine' },
  { name: 'Sniper', damage: 40, shootRate: 1.2, bulletSpeed: 1000, bulletCount: 1, spread: 0, color: PALETTE.stone, price: 200, pierce: true, magazineSize: 4, reloadTime: 2.5, weaponClass: 'silencer' },
  { name: 'Laser', damage: 3, shootRate: 0.06, bulletSpeed: 1200, bulletCount: 1, spread: 0, color: PALETTE.mustard, price: 250, pierce: true, magazineSize: 40, reloadTime: 1.5, weaponClass: 'machine' },
  { name: 'RPG', damage: 65, shootRate: 1.8, bulletSpeed: 400, bulletCount: 1, spread: 0, color: PALETTE.terracotta, price: 350, pierce: false, magazineSize: 2, reloadTime: 2.5, weaponClass: 'machine' },
  { name: 'Raios', damage: 6, shootRate: 0.25, bulletSpeed: 800, bulletCount: 2, spread: 0.2, color: PALETTE.stone, price: 300, pierce: true, magazineSize: 15, reloadTime: 2.0, weaponClass: 'machine' },
  { name: 'Gel', damage: 6, shootRate: 0.28, bulletSpeed: 550, bulletCount: 2, spread: 0.2, color: '#7a9aa8', price: 180, pierce: false, magazineSize: 20, reloadTime: 1.5, weaponClass: 'pistol' },
  { name: 'Granada', damage: 40, shootRate: 1.4, bulletSpeed: 350, bulletCount: 1, spread: 0, color: '#a05a4a', price: 250, pierce: false, explosive: true, explosionRadius: 110, magazineSize: 3, reloadTime: 2.5, weaponClass: 'pistol' },
  { name: 'Mina', damage: 40, shootRate: 2.8, bulletSpeed: 0, bulletCount: 1, spread: 0, color: PALETTE.mustard, price: 200, pierce: false, explosive: true, explosionRadius: 140, magazineSize: 2, reloadTime: 2.5, weaponClass: 'pistol' },
  { name: 'BFG', damage: 80, shootRate: 2.0, bulletSpeed: 500, bulletCount: 5, spread: 0.4, color: PALETTE.title, price: 999, pierce: true, explosive: true, explosionRadius: 120, magazineSize: 1, reloadTime: 3.5, weaponClass: 'machine', secret: true },
];

/** Lista de upgrades permanentes disponíveis na loja */
export const UPGRADES: Upgrade[] = [
  { name: 'Vida +25', effect: 'health', value: 25, price: 60 },
  { name: 'Velocidade +15%', effect: 'speed', value: 0.15, price: 80 },
  { name: 'Dano +25%', effect: 'damage', value: 0.25, price: 120 },
  { name: 'Escudo', effect: 'shield', value: 1, price: 150 },
  { name: 'Vida +50', effect: 'health', value: 50, price: 100 },
  { name: 'Magnetismo', effect: 'magnet', value: 1, price: 100 },
  { name: 'Crítico 2x', effect: 'crit', value: 0.25, price: 180 },
  { name: 'Pierce', effect: 'pierce', value: 1, price: 200 },
  { name: 'Armadura', effect: 'armor', value: 0.15, price: 250 },
  { name: 'Regeneração', effect: 'regen', value: 1, price: 200 },
  { name: 'Vida +100', effect: 'health', value: 100, price: 180 },
  { name: 'Velocidade +25%', effect: 'speed', value: 0.25, price: 150 },
  { name: 'Dano +50%', effect: 'damage', value: 0.50, price: 280 },
  { name: 'Escudo Duplo', effect: 'shield', value: 2, price: 280 },
  { name: 'Armadura Pesada', effect: 'armor', value: 0.25, price: 400 },
  { name: 'Crítico 3x', effect: 'crit', value: 0.40, price: 300 },
  { name: 'Pierce Duplo', effect: 'pierce', value: 2, price: 350 },
  { name: 'Regen Avançada', effect: 'regen', value: 2, price: 350 },
  { name: 'Recarga Rápida', effect: 'reloadSpeed', value: 0.3, price: 160 },
];

/** Mapa de tipos de power-ups com suas propriedades visuais e de duração */
export const POWERUP_TYPES: Record<string, { color: string; symbol: string; duration: number }> = {
  health: { color: '#7a9a6a', symbol: '+', duration: 0 },
  speed: { color: '#c8b890', symbol: '»', duration: 5 },
  damage: { color: '#b07050', symbol: '!', duration: 5 },
  shield: { color: '#608090', symbol: 'O', duration: 0 },
  magnet: { color: '#8a8a9a', symbol: 'M', duration: 8 },
  multiShot: { color: '#a08050', symbol: 'x3', duration: 6 },
  invincible: { color: '#c8b890', symbol: '*', duration: 4 },
};
