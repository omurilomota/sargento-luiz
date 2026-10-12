/**
 * src/config.ts
 * Arquivo de configuração centralizado do jogo.
 * Contém todos os dados estáticos: fases, tipos de inimigos, armas e
 * power-ups. Modificar estes valores altera o balanceamento e a experiência
 * de jogo.
 *
 * Os upgrades permanentes NÃO moram aqui: são os degraus de `systems/perks.ts`
 * (PERK_LADDER), com o save anterior traduzido em `PERK_LEGADO`.
 */
import { Phase, Weapon, EnemyType } from './types';
import { PALETTE } from './core/palette';

/** Lista de fases do jogo, definidas em ordem de progressão */
export const PHASES: Phase[] = [
  {
    name: 'Cidade em Ruínas', bg: '#1c1a18', bgColor2: '#0e0d0c', gridColor: 'rgba(160,128,80,0.06)',
    enemyTypes: ['grunt', 'mutante'], waves: 3, map: 'cidade',
    hazard: 'debris', mutantsPerWave: 1,
    difficulty: 0.7, objective: 'clear', objectiveTarget: 0, boss: 'vigia',
  },
  {
    name: 'Floresta', bg: '#1a2e1a', bgColor2: '#0d1a0d', gridColor: 'rgba(34,139,34,0.1)',
    enemyTypes: ['grunt', 'runner', 'spitter', 'mutante'], waves: 4, map: 'floresta',
    hazard: 'fog', mutantsPerWave: 1,
    difficulty: 0.75, objective: 'clear', objectiveTarget: 0, boss: 'alphaWolf',
  },
  {
    name: 'Caverna', bg: '#1a1a2e', bgColor2: '#0d0d1a', gridColor: 'rgba(100,100,150,0.1)',
    enemyTypes: ['grunt', 'runner', 'tank', 'bat', 'crystal'], waves: 5, map: 'caverna', hazard: 'darkness',
    difficulty: 0.81, objective: 'destroy', objectiveTarget: 3, boss: 'crystalQueen',
  },
  {
    name: 'Fábrica', bg: '#2e1a1a', bgColor2: '#1a0d0d', gridColor: 'rgba(150,100,100,0.1)',
    enemyTypes: ['grunt', 'runner', 'tank', 'robot', 'drone'], waves: 5, map: 'fabrica', hazard: 'electric',
    difficulty: 0.93, objective: 'survive', objectiveTarget: 45, boss: 'sentinel',
  },
  {
    name: 'Pântano', bg: '#1a2e2e', bgColor2: '#0d1a1a', gridColor: 'rgba(34,150,150,0.1)',
    enemyTypes: ['grunt', 'slime', 'mosquito', 'frog'], waves: 6, map: 'pantano', hazard: 'mud',
    difficulty: 1.1, objective: 'clear', objectiveTarget: 0, boss: 'leviathan',
  },
  {
    name: 'Castelo', bg: '#2e2e1a', bgColor2: '#1a1a0d', gridColor: 'rgba(150,150,100,0.1)',
    enemyTypes: ['knight', 'archer', 'mage'], waves: 6, map: 'castelo', hazard: 'spikes',
    difficulty: 0.9, objective: 'protect', objectiveTarget: 0, boss: 'reiMutante',
  },
  {
    name: 'Vulcão', bg: '#2e0d0d', bgColor2: '#1a0505', gridColor: 'rgba(200,50,50,0.1)',
    enemyTypes: ['fireElemental', 'lavaSlime', 'magmaGolem', 'inferno'], waves: 7, map: 'vulcao', hazard: 'lava',
    difficulty: 0.74, objective: 'reach', objectiveTarget: 0, boss: 'infernoPrime',
  },
  {
    name: 'Espaço', bg: '#05050d', bgColor2: '#020208', gridColor: 'rgba(100,100,200,0.05)',
    enemyTypes: ['ufo', 'asteroid', 'alien', 'drone'], waves: 7, map: 'espaco', hazard: 'lowGravity',
    // 0.88 não é estético: abaixo disto o custo da fase (HP × dificuldade)
    // cai sob o do Vulcão e o balance.test reprova a rampa da campanha.
    difficulty: 0.88, objective: 'clear', objectiveTarget: 0, boss: 'mothership',
  },
  {
    name: 'Bunker Central', bg: '#15161a', bgColor2: '#0a0b0d', gridColor: 'rgba(160,128,80,0.05)',
    enemyTypes: ['grunt', 'runner', 'tank', 'robot'], waves: 8, map: 'bunker', hazard: 'none',
    difficulty: 0.88, objective: 'clear', objectiveTarget: 0, boss: 'nucleo',
  },
];

/**
 * Fila do chefão final (fase do NÚCLEO). Em vez de um único boss, o Bunker
 * Central é um desfile: os três chefes mais fortes do jogo entram em sequência
 * e o NÚCLEO fecha. Cada um só nasce quando o anterior cai, então é um rush de
 * resistência, não uma confusão — e o NÚCLEO (último) ainda vale o loot e o
 * Destruidor de Mundos. Fora desta fase a fila é ignorada.
 */
export const NUCLEO_RUSH: string[] = ['infernoPrime', 'reiMutante', 'mothership', 'nucleo'];

/**
 * Tipos que existem no jogo sem entrar no pool de onda de nenhuma fase.
 *
 * A biomaquina é costurada pelo NÚCLEO enquanto ele estiver vivo (ver
 * `updateBiomaquina` no main.ts), não no ritmo da cota da onda. Sem esta
 * lista, o teste de órfão só teria duas saídas: deixar o tipo definido sem
 * consumidor, ou pô-lo em `enemyTypes` e deixar o spawner jogá-lo na onda —
 * que é o contrário do que a decisão do jogador pediu.
 */
export const SPAWN_PROPRIO: string[] = ['biomaquina'];

/** Mapa de todos os tipos de inimigos disponíveis no jogo */
export const ENEMY_TYPES: Record<string, EnemyType> = {
  grunt: { radius: 16, speed: 80, health: 20, damage: 10, color: '#8b4040', scoreValue: 10, coinDrop: 2 },
  // O mutante substitui densidade por ameaça. Um mutante vale ~3 grunts em
  // tempo-para-abater, mas o jogador mira em UM corpo só em vez de rastrear
  // seis ao mesmo tempo, e ele não persegue rápido o bastante para o jogador
  // simplesmente ignorar. Lento de propósito: a resposta é desviar e recarregar,
  // não correr. O dano fica em 18 (1.8x o grunt) porque o dano por i-frame é o
  // que mata: a 25 base, um mutante encostando tirava 17 de 100 HP por toque na
  // Cidade, e seis toques matavam antes de a pistola resolver o resto.
  mutante: { radius: 26, speed: 62, health: 80, damage: 18, color: '#6a5a7a', scoreValue: 45, coinDrop: 12, isMutant: true },
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
  // O asteroid não desvia (speed 30), então o dano é o que decide a morte no
  // Espaço: a 30 ele tirava 28 do jogador (4 toques, mais letal que todas as
  // fases). A 21 tira 19 — 6 toques, na faixa do resto da campanha — e ainda é
  // o golpe mais forte entre os inimigos comuns (19 × 18 do magmaGolem).
  asteroid: { radius: 28, speed: 30, health: 100, damage: 21, color: '#6a6a6a', scoreValue: 50, coinDrop: 8 },
  alien: { radius: 14, speed: 110, health: 20, damage: 8, color: '#5a7a5a', scoreValue: 25, coinDrop: 4, canShoot: true, shootRate: 1.0, bulletSpeed: 400, projectileColor: PALETTE.moss },

  // A biomaquina: gente costurada com peça de robô, feita pela máquina.
  // Só aparece na fase 9 e não conta na cota da onda — ela nasce do NÚCLEO
  // enquanto ele estiver vivo (ver `updateBiomaquina`), então o `health` alto
  // é o que segura o jogador enquanto a fila de chefes anda. Atira, senão a
  // fase final vira melee puro e o traje de contenção perde o sentido.
  biomaquina: { radius: 19, speed: 95, health: 55, damage: 14, color: '#6a5a5a', scoreValue: 30, coinDrop: 4, canShoot: true, shootRate: 1.5, bulletSpeed: 320, projectileColor: PALETTE.stone },

  // ─── Bosses ────────────────────────────────────────────────
  vigia: {
    radius: 40, speed: 78, health: 290, damage: 18, color: '#8a7a6a', scoreValue: 250, coinDrop: 30,
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
    radius: 42, speed: 95, health: 380, damage: 26, color: '#7a6a5a', scoreValue: 400, coinDrop: 45,
    canShoot: false, isBoss: true, bossName: 'ALPHA WOLF', telegraph: 0.9,
    pattern: [
      { atHp: 1.0, action: 'charge', telegraph: 'CARREGANDO' },
      { atHp: 0.6, action: 'summon', telegraph: 'CHAMANDO A MATILHA' },
      { atHp: 0.3, action: 'sweep', telegraph: 'VARRENDO' },
    ],
  },
  crystalQueen: {
    radius: 46, speed: 45, health: 550, damage: 30, color: '#608090', scoreValue: 550, coinDrop: 60,
    canShoot: true, shootRate: 2.4, bulletSpeed: 260, isBoss: true, bossName: 'CRYSTAL QUEEN', telegraph: 1.0,
    projectileColor: PALETTE.stone,
    pattern: [
      { atHp: 1.0, action: 'split', telegraph: 'FRATURANDO' },
      { atHp: 0.65, action: 'ring', telegraph: 'ONDA DE CRISTAL' },
      { atHp: 0.3, action: 'mines', telegraph: 'COLAPSANDO' },
    ],
  },
  sentinel: {
    radius: 48, speed: 38, health: 360, damage: 34, color: '#6a6a6a', scoreValue: 700, coinDrop: 80,
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
    radius: 50, speed: 60, health: 420, damage: 36, color: '#5a7a5a', scoreValue: 750, coinDrop: 85,
    canShoot: true, shootRate: 2.0, bulletSpeed: 280, isBoss: true, bossName: 'LEVIATHAN', telegraph: 0.9,
    projectileColor: '#5a7a5a',
    pattern: [
      { atHp: 1.0, action: 'spread', telegraph: 'JATO ABRASIVO' },
      { atHp: 0.5, action: 'sweep', telegraph: 'CAUDA' },
    ],
  },
  reiMutante: {
    radius: 46, speed: 55, health: 630, damage: 38, color: '#8a8a7a', scoreValue: 800, coinDrop: 90,
    canShoot: true, shootRate: 2.2, bulletSpeed: 320, isBoss: true, bossName: 'REI MUTANTE', telegraph: 0.9,
    projectileColor: PALETTE.terracotta, armor: true,
    pattern: [
      { atHp: 1.0, action: 'ring', telegraph: 'GOLPE REAL' },
      { atHp: 0.6, action: 'summon', telegraph: 'GUARDA' },
      { atHp: 0.25, action: 'charge', telegraph: 'INVESTIDA' },
    ],
  },
  infernoPrime: {
    radius: 48, speed: 62, health: 830, damage: 40, color: '#c46a3a', scoreValue: 900, coinDrop: 100,
    canShoot: true, shootRate: 1.4, bulletSpeed: 340, isBoss: true, bossName: 'INFERNO PRIME', telegraph: 0.7,
    projectileColor: '#c46a3a',
    pattern: [
      { atHp: 1.0, action: 'spread', telegraph: 'CABRAÇAS' },
      { atHp: 0.55, action: 'mines', telegraph: 'GEISERS' },
      { atHp: 0.25, action: 'ring', telegraph: 'COLAPSO' },
    ],
  },
  mothership: {
    radius: 54, speed: 30, health: 980, damage: 44, color: '#7a6a8a', scoreValue: 1200, coinDrop: 140,
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
    radius: 46, speed: 34, health: 1060, damage: 46, color: '#7a7a8a', scoreValue: 1500, coinDrop: 180,
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
  { name: 'Pistola', damage: 12, shootRate: 0.35, bulletSpeed: 600, bulletCount: 1, spread: 0, color: PALETTE.moss, price: 0, pierce: false, magazineSize: 10, reloadTime: 1.2 },
  { name: 'Shotgun', damage: 9, shootRate: 0.6, bulletSpeed: 500, bulletCount: 3, spread: 0.3, color: PALETTE.terracotta, price: 80, pierce: false, magazineSize: 8, reloadTime: 1.3 },
  { name: 'Metralhadora', damage: 6, shootRate: 0.14, bulletSpeed: 700, bulletCount: 1, spread: 0.1, color: '#a05a4a', price: 150, pierce: false, magazineSize: 25, reloadTime: 2.0 },
  { name: 'Sniper', damage: 50, shootRate: 1.2, bulletSpeed: 1000, bulletCount: 1, spread: 0, color: PALETTE.stone, price: 200, pierce: true, magazineSize: 4, reloadTime: 2.5 },
  { name: 'Laser', damage: 2, shootRate: 0.06, bulletSpeed: 1200, bulletCount: 1, spread: 0, color: PALETTE.mustard, price: 250, pierce: true, magazineSize: 40, reloadTime: 1.5 },
  { name: 'RPG', damage: 81, shootRate: 1.8, bulletSpeed: 400, bulletCount: 1, spread: 0, color: PALETTE.terracotta, price: 350, pierce: false, explosive: true, explosionRadius: 140, magazineSize: 2, reloadTime: 2.5 },
  { name: 'Raios', damage: 4, shootRate: 0.25, bulletSpeed: 800, bulletCount: 2, spread: 0.2, color: PALETTE.stone, price: 300, pierce: true, magazineSize: 15, reloadTime: 2.0 },
  { name: 'Gel', damage: 8, shootRate: 0.28, bulletSpeed: 550, bulletCount: 2, spread: 0.2, color: '#7a9aa8', price: 180, pierce: false, magazineSize: 20, reloadTime: 1.5 },
  { name: 'Granada', damage: 50, shootRate: 1.4, bulletSpeed: 350, bulletCount: 1, spread: 0, color: '#a05a4a', price: 250, pierce: false, explosive: true, explosionRadius: 110, magazineSize: 3, reloadTime: 2.5 },
  { name: 'Mina', damage: 50, shootRate: 2.8, bulletSpeed: 0, bulletCount: 1, spread: 0, color: PALETTE.mustard, price: 200, pierce: false, explosive: true, explosionRadius: 140, magazineSize: 2, reloadTime: 2.5 },
  { name: 'BFG', damage: 100, shootRate: 2.0, bulletSpeed: 500, bulletCount: 5, spread: 0.4, color: PALETTE.title, price: 999, pierce: true, explosive: true, explosionRadius: 120, magazineSize: 1, reloadTime: 3.5, secret: true },
  // índice 11 — só vem da caixa especial do boss
  { name: 'M. Quebrada', damage: 5, shootRate: 0.3, bulletSpeed: 650, bulletCount: 1, spread: 0.18, color: '#a08050', price: 0, pierce: false, magazineSize: 30, reloadTime: 1.6, broken: true },
  // índice 12 — o martelo do Sargento Rios. Destruidor de mundos: tiro único,
  // explosão enorme, cadência lenta de propósito (o peso do golpe). Não é
  // comprável: só aparece na caixa especial do boss NÚCLEO. O dano baixo por
  // tiro engana — a explosão em área de 260px é o que limpa a fase apelona.
  { name: 'Destruidor', damage: 120, shootRate: 1.6, bulletSpeed: 460, bulletCount: 1, spread: 0, color: PALETTE.terracotta, price: 0, pierce: false, explosive: true, explosionRadius: 260, magazineSize: 3, reloadTime: 3.0, secret: true },
];

/** Qualidades sorteáveis de armas: modificam dano, cadência, spread, crítico e pierce. */
export interface WeaponQualityDef {
  label: string;
  color: string;
  damageMult: number;
  cadenceMult: number;
  spreadMult: number;
  critBonus: number;
  failChance: number;
  pierce: boolean;
  sellMult: number;
  weight: number;
}

export const QUALITIES: Record<string, WeaponQualityDef> = {
  quebrada:    { label: 'Quebrada',    color: '#8b4040', damageMult: 0.5,  cadenceMult: 1,   spreadMult: 1,   critBonus: 0,    failChance: 0.2, pierce: false, sellMult: 0.5, weight: 6 },
  enferrujada: { label: 'Enferrujada', color: '#8a6a4a', damageMult: 0.75, cadenceMult: 1,   spreadMult: 1.5, critBonus: 0,    failChance: 0,   pierce: false, sellMult: 0.6, weight: 10 },
  suja:        { label: 'Suja',        color: '#8a8a7a', damageMult: 0.9,  cadenceMult: 1,   spreadMult: 1.2, critBonus: 0,    failChance: 0,   pierce: false, sellMult: 0.7, weight: 12 },
  normal:      { label: 'Normal',      color: '#cccccc', damageMult: 1,    cadenceMult: 1,   spreadMult: 1,   critBonus: 0,    failChance: 0,   pierce: false, sellMult: 1,   weight: 40 },
  boa:         { label: 'Boa',         color: '#7a9a6a', damageMult: 1.1,  cadenceMult: 1,   spreadMult: 1,   critBonus: 0.05, failChance: 0,   pierce: false, sellMult: 1.3, weight: 18 },
  ascendente:  { label: 'Ascendente',  color: '#608090', damageMult: 1.25, cadenceMult: 0.9, spreadMult: 1,   critBonus: 0,    failChance: 0,   pierce: false, sellMult: 1.8, weight: 9 },
  lendaria:    { label: 'Lendária',    color: '#c8b890', damageMult: 1.5,  cadenceMult: 1,   spreadMult: 1,   critBonus: 0,    failChance: 0,   pierce: true,  sellMult: 2.5, weight: 5 },
};

/**
 * Adjetivo de condição por arma.
 *
 * "M. Quebrada" era o nome da arma quebrada, não da condição: uma Metralhadora
 * enferrujada e uma Sniper enferrujada saíam ambas rotuladas "Enferrujada", e
 * a palavra sozinha não diz nada do objeto. Aqui o adjetivo diz o que a arma
 * está Sofrendo — e o `traço` é a linha de ruído que o som acrescenta.
 *
 * A chave é o NOME da arma, como em `WEAPON_ICON` e `BULLET_FAMILY`.
 */
export interface ConditionWord {
  label: string;
  /** Como o defeito se manifesta quando a arma é deste tipo. */
  traco: string;
}

const RANGIDO = 'O cano range a cada disparo.';
const TRAVA = 'O ferrolho emperra entre dois tiros.';
const FUMEGA = 'A fumaça sai com a bang.';
const GOTEJA = 'Goteja antes de sair.';
const RANGE = 'O mecanismo raspa no ferrolho.';
const ZUMBIDO = 'Um zumbido de mola frouxa.';
const ARREIA = 'Engasga no primeiro cartucho.';
const ESTALA = 'Estala ao destravar.';

/** Adjetivo por arma para cada condição negativa. */
export const CONDITION_WORDS: Record<string, Partial<Record<'quebrada' | 'enferrujada' | 'suja', ConditionWord>>> = {
  Pistola:      { quebrada: { label: 'Emperrada', traco: TRAVA },   enferrujada: { label: 'Oxidada',   traco: RANGIDO },  suja: { label: 'Suja', traco: FUMEGA } },
  Shotgun:      { quebrada: { label: 'Escangalhada', traco: ARREIA }, enferrujada: { label: 'Encrostada', traco: RANGIDO }, suja: { label: 'Empoeirada', traco: FUMEGA } },
  Metralhadora: { quebrada: { label: 'Com ferragem', traco: ARREIA }, enferrujada: { label: 'Corroída', traco: ZUMBIDO }, suja: { label: 'Prenhe de graxa', traco: GOTEJA } },
  Sniper:       { quebrada: { label: 'De tubo torto', traco: TRAVA }, enferrujada: { label: 'Fosca', traco: RANGIDO }, suja: { label: 'Suja de graxa', traco: GOTEJA } },
  Laser:        { quebrada: { label: 'Em curto', traco: ESTALA },  enferrujada: { label: 'Fosca', traco: RANGE },   suja: { label: 'Suja', traco: GOTEJA } },
  RPG:          { quebrada: { label: 'De lançamento emperrado', traco: TRAVA }, enferrujada: { label: 'Corroída', traco: RANGIDO }, suja: { label: 'Suja', traco: FUMEGA } },
  Raios:        { quebrada: { label: 'Em curto', traco: ESTALA },  enferrujada: { label: 'Oxidada', traco: ZUMBIDO }, suja: { label: 'Suja', traco: GOTEJA } },
  Gel:          { quebrada: { label: 'Vazando', traco: GOTEJA },  enferrujada: { label: 'Corroída', traco: RANGIDO }, suja: { label: 'Resinosa', traco: GOTEJA } },
  Granada:      { quebrada: { label: 'De baseball falho', traco: ARREIA }, enferrujada: { label: 'Oxidada', traco: RANGIDO }, suja: { label: 'Suja', traco: FUMEGA } },
  Mina:         { quebrada: { label: 'Sem pino', traco: TRAVA },   enferrujada: { label: 'Oxidada', traco: RANGE },   suja: { label: 'Empanada', traco: GOTEJA } },
  BFG:          { quebrada: { label: 'De tubo partido', traco: ARREIA }, enferrujada: { label: 'Corroída', traco: RANGIDO }, suja: { label: 'Suja', traco: FUMEGA } },
  'M. Quebrada': { quebrada: { label: 'Feita de restos', traco: ARREIA }, enferrujada: { label: 'Ferrugenta', traco: RANGIDO }, suja: { label: 'Imunda', traco: GOTEJA } },
};

/** true quando a qualidade é uma das três condições negativas. */
export function ehNegativa(qualidade: string): boolean {
  return qualidade === 'quebrada' || qualidade === 'enferrujada' || qualidade === 'suja';
}

/** Rótulo da condição para uma arma. Cai no rótulo genérico da qualidade. */
export function conditionLabel(arma: string, qualidade: string): string {
  return CONDITION_WORDS[arma]?.[qualidade as 'quebrada' | 'enferrujada' | 'suja']?.label
    ?? QUALITIES[qualidade]?.label
    ?? qualidade;
}

/** Traço de ruído que a condição acrescenta. Vazio para condição boa. */
export function conditionTrait(arma: string, qualidade: string): string {
  return CONDITION_WORDS[arma]?.[qualidade as 'quebrada' | 'enferrujada' | 'suja']?.traco ?? '';
}

/**
 * Sorteia uma qualidade com peso. `boost` sobe as melhores (pra caixas raras).
 *
 * A sorte (MENTE T3 e o SORTUDO) entra somada ao `boost`: é o mesmo eixo, então
 * um ponto de sorte vale o mesmo que um passo de caixa. Sem isso `luck` era um
 * stat escrito e nunca lido — o jogador pagava 150 moedas por nada.
 */
export function rollQuality(boost = 0, sorte = 0): string {
  const peso = boost + sorte;
  const entries = Object.entries(QUALITIES);
  const total = entries.reduce((s, [, q]) => s + q.weight + (q.damageMult >= 1 ? peso * 6 : 0), 0);
  let r = Math.random() * total;
  for (const [key, q] of entries) {
    const w = q.weight + (q.damageMult >= 1 ? peso * 6 : 0);
    if (r < w) return key;
    r -= w;
  }
  return 'normal';
}

/** Mapa de tipos de power-ups com suas propriedades visuais e de duração */
export const POWERUP_TYPES: Record<string, { color: string; symbol: string; duration: number }> = {
  health: { color: '#7a9a6a', symbol: '+', duration: 0 },
  speed: { color: '#c8b890', symbol: '»', duration: 5 },
  damage: { color: '#b07050', symbol: '!', duration: 5 },
  shield: { color: '#608090', symbol: 'O', duration: 0 },
  magnet: { color: '#8a8a9a', symbol: 'M', duration: 8 },
  multiShot: { color: '#a08050', symbol: 'x3', duration: 6 },
  invincible: { color: '#c8b890', symbol: '*', duration: 4 },
  furia: { color: '#b07050', symbol: 'F', duration: 8 },
  peleDePedra: { color: '#608090', symbol: 'P', duration: 8 },
  botas: { color: '#c8b890', symbol: 'B', duration: 8 },
  municaoInfinita: { color: '#a08050', symbol: 'M', duration: 8 },
  reflexos: { color: '#c8b890', symbol: 'R', duration: 8 },
  // trajeNucleo: o traje de contenção que o Rios veste no Bunker. É o power-up
  // mais forte do jogo e só existe na fase do NÚCLEO — o jogador o encontra lá,
  // não dropeia de inimigo comum (fora do sorteio). Combina dano dobrado com
  // resistência e escudo, e dura 20s: é o kit da vingança, não um buff casual.
  trajeNucleo: { color: '#b07050', symbol: 'T', duration: 20 },
};

/** Descrição curta de uso por arma na loja */
export const WEAPON_DESC: Record<string, string> = {
  'Pistola': '10 tiros por pente, recarga em 1.2s',
  'Shotgun': 'Cone curto, 3 projéteis por tiro',
  'Metralhadora': '25 no pente, dispersão leve',
  'Sniper': '4 no pente, atravessa o primeiro alvo',
  'Laser': 'Cadência altíssima, dano baixo, pente de 40',
  'RPG': '2 no pente, explosão de raio 140',
  'Raios': '2 raios por tiro, cada um atravessa',
  'Gel': '2 projéteis, dano alto, sem pierce',
  'Granada': 'Explosão menor que a da RPG, 3 por pente',
  'Mina': 'Explosão de raio 140 ao pisar em cima',
  'BFG': '5 projéteis explosivos, 1 por recarga',
  'M. Quebrada': 'Alta cadência, encasquilha após 35 tiros — Reparar conserta',
  'Destruidor': 'O martelo do Rios: 1 golpe, explosão de raio 260, 3 por recarga',
};

/** Descrição curta por power-up na loja */
export const POWERUP_DESC: Record<string, string> = {
  'health': 'Cura 30 HP',
  'speed': '+50% velocidade por 5s',
  'damage': '+50% dano por 5s',
  'shield': '+2 escudo',
  'magnet': 'Atrai moedas por 8s',
  'multiShot': 'Dispara 2x por 6s',
  'invincible': 'Intocável por 4s',
  'furia': '+30% dano por 8s',
  'peleDePedra': 'Reduz dano recebido em 50% por 8s',
  'botas': '+30% velocidade por 8s',
  'municaoInfinita': 'Munição infinita por 8s',
  'reflexos': '+50% cadência por 8s',
  'trajeNucleo': 'Traje de contenção: +100% dano, +30% velocidade, +3 escudo e metade do dano recebido por 20s',
};

/** Tipos de peça de arma (upgrades modulares) */
export interface PieceType {
  id: string;
  name: string;
  desc: string;
  color: string;
  damageMult: number;
  reloadMult: number;
  magazineMult: number;
  spreadMult: number;
}

export const PIECE_TYPES: PieceType[] = [
  { id: 'dano', name: 'DANO', desc: '+30% dano', color: '#b07050', damageMult: 1.3, reloadMult: 1, magazineMult: 1, spreadMult: 1 },
  { id: 'cadencia', name: 'CADÊNCIA', desc: '-25% recarga', color: '#7a9a6a', damageMult: 1, reloadMult: 0.75, magazineMult: 1, spreadMult: 1 },
  { id: 'capacidade', name: 'CAPACIDADE', desc: '+50% pente', color: '#608090', damageMult: 1, reloadMult: 1, magazineMult: 1.5, spreadMult: 1 },
  { id: 'precisao', name: 'PRECISÃO', desc: '-40% dispersão', color: '#a08050', damageMult: 1, reloadMult: 1, magazineMult: 1, spreadMult: 0.6 },
  // acessórios (Faixa C §8): mesma forma de PieceType, série própria para a sinergia
  { id: 'otica', name: 'ÓTICA', desc: '+15% dano, -20% dispersão', color: '#8a8a9a', damageMult: 1.15, reloadMult: 1, magazineMult: 1, spreadMult: 0.8 },
  { id: 'supressor', name: 'SUPRESSOR', desc: '-30% dispersão, -10% recarga', color: '#6a6a6a', damageMult: 1, reloadMult: 0.9, magazineMult: 1, spreadMult: 0.7 },
  { id: 'carregador', name: 'CARREGADOR', desc: '+40% pente, -10% recarga', color: '#c8b890', damageMult: 1, reloadMult: 0.9, magazineMult: 1.4, spreadMult: 1 },
];

/**
 * Onde o botão de apoio aponta.
 *
 * Placeholder: trocar pela URL real do projeto no itch.io (ou Ko-fi) antes de
 * publicar. Vazio faria o botão não abrir nada, então a loja mostra o aviso
 * de "copie a URL" — que é exatamente o fallback do popup bloqueado.
 */
export const SUPPORT_URL = 'https://omurilomota.itch.io/sargento-rios';
export const SUPPORT_LABEL = 'APOIE O PROJETO';
