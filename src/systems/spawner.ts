/**
 * src/systems/spawner.ts
 *
 * Controle de ondas e criação de inimigos.
 *
 * Com mapa maior que a tela, o spawn não pode ser "fora do canvas": tem que
 * ser numa célula de chão aberta, fora do viewport e longe do jogador — senão
 * o inimigo nasce em cima dele.
 */

import { Enemy } from '../types';
import { ENEMY_TYPES } from '../config';
import { rand } from '../utils';
import { MAX_ENEMIES, WAVE_BASE_ENEMIES, WAVE_ENEMIES_PER_LEVEL, WAVE_BASE_SPAWN_RATE, WAVE_SPAWN_RATE_DECAY, WAVE_MIN_SPAWN_RATE, WAVE_SCALE_PER_LEVEL, WAVE_SPEED_SCALE_PER_LEVEL } from '../core/constants';
import { CELL_SIZE } from '../maps';
import { getMap, isWall } from './tilemap';
import { getSkillPressure } from './dynamicDifficulty';
import { getEscalaAmeacaAtual } from './ameaca';

/** Temporizador acumulado desde o último spawn */
let waveTimer = 0;
/**
 * Multiplicador de stats da fase atual (Phase.difficulty).
 *
 * Vive aqui como estado do módulo em vez de argumento novo em duas assinaturas
 * que já têm 7 e 8 parâmetros: é o mesmo idioma de `resetSpawner`/`initCamera`.
 */
let difficulty = 1;
/** Segundos desde o início da fase: inimigos ficam mais fortes com o tempo */
let phaseTime = 0;
/** Quantidade de inimigos já criados na onda atual */
let enemiesSpawnedThisWave = 0;
/** Quantos dos inimigos já criados na onda atual eram mutantes */
let mutantsSpawnedThisWave = 0;
/** O titã desta onda já nasceu? (T1: 1 por onda, a partir da segunda) */
let eliteSaiuNestaOnda = false;

/**
 * Converte um inimigo comum no TITÃ da onda (T1 — pedido do dono: "mais
 * vida/dano/raio que o tipo comum, visual maior"). O sprite desenha pelo
 * raio, então o corpo cresce de verdade — o que muda aqui é o que ele é:
 * 3× a vida da onda (o valor já vem escalado por onda/dificuldade, o titã
 * multiplica EM CIMA), 1,5× dano, mais lento, e não é chefe: o padrão de
 * ataque segue o do tipo dele.
 */
function comoTita(enemy: Enemy): Enemy {
  enemy.isElite = true;
  enemy.radius = Math.round(enemy.radius * 1.35);
  enemy.health *= 3;
  enemy.maxHealth *= 3;
  enemy.damage = Math.round(enemy.damage * 1.5);
  enemy.speed = Math.max(30, Math.round(enemy.speed * 0.85));
  return enemy;
}

export function setPhaseTime(t: number): void { phaseTime = t; }

/**
 * Define o multiplicador de stats da fase. Chamado ao carregar o mapa.
 * @param value - Phase.difficulty da fase (1 = sem ajuste)
 */
export function setPhaseDifficulty(value: number): void {
  difficulty = value;
}

/**
 * Zera o estado de ONDA — cota, relógio e titã.
 *
 * `difficulty` e `phaseTime` NÃO são daqui: a fase os define em
 * `loadPhaseEnvironment` (`setPhaseDifficulty` + `setPhaseTime`) Toda vez
 * que carrega. Quando esta função zerava os dois também, ela apagava a
 * dificuldade da fase recém-carregada (a Cidade voltava ao 1.0 em toda
 * partida nova) — o contador de onda e o escalonador de fase são donos
 * diferentes e o reset de um não pode pisar no outro.
 */
export function resetSpawner(): void {
  waveTimer = 0;
  enemiesSpawnedThisWave = 0;
  mutantsSpawnedThisWave = 0;
  eliteSaiuNestaOnda = false;
}

/** Distância mínima do jogador para spawnar (px) */
const MIN_SPAWN_DISTANCE = 260;

interface SpawnRect {
  w: number;
  h: number;
  px: number;
  py: number;
  viewW: number;
  viewH: number;
}

/**
 * Sorteia uma posição válida de spawn.
 * Sem mapa, cai no retângulo da tela (fallback). Com mapa, exige célula de
 * chão fora do viewport e a uma distância mínima do jogador.
 */
function pickSpawnPosition(rect: SpawnRect, near = false): { x: number; y: number } {
  const map = getMap();
  if (!map) {
    const side = Math.floor(rand(0, 4));
    const d = 120;
    if (side === 0) return { x: -d, y: rand(0, rect.h) };
    if (side === 1) return { x: rect.w + d, y: rand(0, rect.h) };
    if (side === 2) return { x: rand(0, rect.w), y: -d };
    return { x: rand(0, rect.w), y: rect.h + d };
  }

  // P0-1 (Vulcão): a onda 1 nascia numa célula QUALQUER fora da tela — num
  // mapa 30×20 isso podia ser ~1.500 px de caminhada a 35–90 px/s, e a horda
  // demorava meio minuto para chegar. A primeira onda agora usa a célula
  // válida fora da tela MAIS PRÓXIMA do viewport; da segunda em diante o
  // sorteio continua, porque ali a distância é pressão, não espera.
  if (near) {
    let melhor: { x: number; y: number } | null = null;
    let melhorD = Infinity;
    for (let row = 1; row < map.rows - 1; row++) {
      for (let col = 1; col < map.cols - 1; col++) {
        if (isWall(col, row)) continue;
        const x = col * CELL_SIZE + CELL_SIZE / 2;
        const y = row * CELL_SIZE + CELL_SIZE / 2;
        const onScreen = x > rect.px - 48 && x < rect.px + rect.viewW + 48
          && y > rect.py - 48 && y < rect.py + rect.viewH + 48;
        if (onScreen) continue;
        if (Math.hypot(x - rect.px, y - rect.py) < MIN_SPAWN_DISTANCE) continue;
        // distância até a BORDA do viewport: a célula mais perto da tela é a
        // que o jogador encontra primeiro, não a mais perto do canto
        const dx = Math.max(rect.px - x, 0, x - (rect.px + rect.viewW));
        const dy = Math.max(rect.py - y, 0, y - (rect.py + rect.viewH));
        const d = Math.hypot(dx, dy);
        if (d < melhorD) { melhorD = d; melhor = { x, y }; }
      }
    }
    if (melhor) return melhor;
  }

  const cols = map.cols;
  const rows = map.rows;
  for (let attempt = 0; attempt < 40; attempt++) {
    const col = Math.floor(rand(0, cols));
    const row = Math.floor(rand(0, rows));
    if (isWall(col, row)) continue;
    const x = col * CELL_SIZE + CELL_SIZE / 2;
    const y = row * CELL_SIZE + CELL_SIZE / 2;
    const onScreen = x > rect.px - 48 && x < rect.px + rect.viewW + 48
      && y > rect.py - 48 && y < rect.py + rect.viewH + 48;
    if (onScreen) continue;
    if (Math.hypot(x - rect.px, y - rect.py) < MIN_SPAWN_DISTANCE) continue;
    return { x, y };
  }
  // fallback: primeira célula de chão, nunca parede (o centro do mapa pode ser prédio)
  for (let row = 1; row < map.rows - 1; row++) {
    for (let col = 1; col < map.cols - 1; col++) {
      if (!isWall(col, row)) {
        return { x: col * CELL_SIZE + CELL_SIZE / 2, y: row * CELL_SIZE + CELL_SIZE / 2 };
      }
    }
  }
  return { x: map.width / 2, y: map.height / 2 };
}

/**
 * Cria um inimigo de um tipo específico.
 * @param forceX - X forçado (boss, invocação)
 */
export function spawnEnemy(
  type: string,
  worldWidth: number,
  worldHeight: number,
  currentWave: number,
  forceX?: number,
  forceY?: number,
  rect?: SpawnRect,
  near = false
): Enemy | null {
  const def = ENEMY_TYPES[type];
  if (!def) return null;

  const pos = forceX !== undefined && forceY !== undefined
    ? { x: forceX, y: forceY }
    : pickSpawnPosition(rect ?? { w: worldWidth, h: worldHeight, px: 0, py: 0, viewW: worldWidth, viewH: worldHeight }, near);

  const waveScale = (1 + currentWave * WAVE_SCALE_PER_LEVEL) * difficulty;
  const speedScale = (1 + currentWave * WAVE_SPEED_SCALE_PER_LEVEL) * Math.sqrt(difficulty);
  // A AMEAÇA (o mundo medindo o preparo do jogador) entra aqui, e não em
  // `difficulty`: a dificuldade da fase é do mapa, a ameaça é de quem joga.
  // A vida do inimigo segue o poder de FOGO e o dano dele segue o poder de
  // CORPO — são eixos diferentes (ver systems/ameaca.ts).
  const escala = getEscalaAmeacaAtual();
  const hpScale = waveScale * escala.vida;
  const dmgScale = waveScale * escala.dano;
  // escalada temporal: a cada 90s da fase o inimigo fica ~15% mais forte
  const timeScale = 1 + Math.min(phaseTime / 90, 3) * 0.15;
  const variance = 0.9 + Math.random() * 0.2;

  return {
    x: pos.x, y: pos.y, radius: def.radius, speed: Math.floor(def.speed * speedScale * variance * (0.8 + timeScale * 0.2)),
    health: Math.floor(def.health * hpScale * variance * timeScale), maxHealth: Math.floor(def.health * hpScale * variance * timeScale),
    damage: Math.floor(def.damage * dmgScale * timeScale), color: def.color, scoreValue: def.scoreValue,
    shootTimer: rand(0, def.shootRate || 0), shootRate: def.shootRate || 0,
    canShoot: def.canShoot || false, type, angle: rand(0, Math.PI * 2), stun: 0,
    slideWet: 0, slideWetX: 0, slideWetY: 0,
    attackTimer: 0, summonTimer: 0, spawnDelay: 0.5, hitFlash: 0, bossPhase: 0,
  };
}

/**
 * Atualiza o sistema de ondas.
 */
export function spawnWaveEnemies(
  dt: number,
  enemies: Enemy[],
  currentWave: number,
  currentPhaseEnemyTypes: string[],
  worldWidth: number,
  worldHeight: number,
  rect?: SpawnRect,
  mutantsPerWave = 0,
  grupo = 1
): boolean {
  waveTimer += dt;
  const totalEnemies = WAVE_BASE_ENEMIES + currentWave * WAVE_ENEMIES_PER_LEVEL;
  const spawnRate = Math.max(WAVE_MIN_SPAWN_RATE, WAVE_BASE_SPAWN_RATE - currentWave * WAVE_SPAWN_RATE_DECAY);

  // O mutante não conta no total da onda: ele SUBSTITUI inimigos comuns. Sortear
  // pelo `enemyTypes` da fase com pesos iguais colocaria metade da onda em
  // mutantes (1 de 2 tipos na Cidade), que é o oposto do que a fase pede.
  const totalMutants = Math.min(mutantsPerWave, Math.floor(totalEnemies / 2));
  const totalDaOnda = totalEnemies + totalMutants;

  // Dinâmica de dificuldade pela acurácia: quem acerta muito sofre ondas mais
  // densas. A banda é estreita de propósito (12% no intervalo de spawn) — o
  // suficiente para o jogo sentir o jogador, sem virar um modo fácil/duro
  // escondido. Antes de 20 tiros não mexe em nada, porque a amostra é ruído.
  const pressure = getSkillPressure();
  const pressureMult = pressure === null ? 1 : 1 - pressure * 0.12;

  if (waveTimer >= spawnRate * pressureMult && enemiesSpawnedThisWave < totalDaOnda && enemies.length < MAX_ENEMIES) {
    waveTimer = 0;
    const querMutante = mutantsSpawnedThisWave < totalMutants;
    const pool = querMutante
      ? currentPhaseEnemyTypes.filter(t => ENEMY_TYPES[t]?.isMutant)
      : currentPhaseEnemyTypes.filter(t => !ENEMY_TYPES[t]?.isMutant);
    // Fase sem tipo mutante (ou toda a cota já saiu) cai no outro lado do pool,
    // senão a onda nunca chega em `totalDaOnda` e a fase trava.
    if (pool.length === 0) return false;
    const type = pool[Math.floor(rand(0, pool.length))];
    // P0-2 (Ponte): o multi-spawn em GRUPO — 2–3 corpos por célula, em vez
    // de um por vez. A cota da onda não muda; o que muda é o ritmo: eles
    // entram juntos e o jogador enfrenta um bloco, não uma fila. Mutante
    // continua sozinho (a cota dele é separada e o corpo é grande demais
    // para dividir célula).
    const noGrupo = ENEMY_TYPES[type]?.isMutant ? 1 : Math.max(1, Math.floor(grupo));
    const cabem = Math.min(noGrupo, totalDaOnda - enemiesSpawnedThisWave, MAX_ENEMIES - enemies.length);
    let base: Enemy | null = null;
    for (let g = 0; g < cabem; g++) {
      let enemy: Enemy | null;
      if (g === 0) {
        enemy = spawnEnemy(type, worldWidth, worldHeight, currentWave, undefined, undefined, rect, currentWave === 0);
      } else {
        // todos na MESMA célula do primeiro: o grupo entra junto e se
        // separa depois, sem nascer espalhado pelo mapa
        const jx = (g % 2 === 1 ? -1 : 1) * CELL_SIZE * 0.18;
        const jy = (g > 1 ? 1 : 0) * CELL_SIZE * 0.18;
        enemy = spawnEnemy(type, worldWidth, worldHeight, currentWave, base!.x + jx, base!.y + jy);
      }
      if (!enemy) break;
      if (!base) base = enemy;
      // T1: o titã ABRE a onda a partir da segunda (currentWave >= 1, que é
      // 0-indexado) — primeiro corpo grande a entrar, pressão visível de
      // longe, exatamente um por onda.
      if (currentWave >= 1 && !eliteSaiuNestaOnda) {
        enemy = comoTita(enemy);
        eliteSaiuNestaOnda = true;
      }
      enemies.push(enemy);
      enemiesSpawnedThisWave++;
      if (ENEMY_TYPES[type]?.isMutant) mutantsSpawnedThisWave++;
    }
  }

  if (enemiesSpawnedThisWave >= totalDaOnda && enemies.length === 0) {
    enemiesSpawnedThisWave = 0;
    mutantsSpawnedThisWave = 0;
    eliteSaiuNestaOnda = false;
    waveTimer = 0;
    return true;
  }
  return false;
}
