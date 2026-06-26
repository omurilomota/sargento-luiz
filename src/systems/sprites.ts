/**
 * Sistema de sprites do jogo.
 * Gerencia carregamento e cache de imagens.
 * Carrega automaticamente todos os sprites da pasta assets/sprites/.
 */

/** Cache de sprites carregadas */
const spriteCache: Map<string, HTMLImageElement> = new Map();

/** Se o sistema de sprites está habilitado */
let spritesEnabled = false;

/** Mapeamento de chaves de sprites para caminhos */
const SPRITE_PATHS: Record<string, string> = {
  // Player
  'player': 'assets/sprites/player/player.png',
  
  // Enemies
  'enemy_zombie': 'assets/sprites/enemies/zombie.png',
  'enemy_robot': 'assets/sprites/enemies/robot.png',
  'enemy_hitman': 'assets/sprites/enemies/hitman.png',
  'enemy_blue': 'assets/sprites/enemies/enemy_blue.png',
  'enemy_brown': 'assets/sprites/enemies/enemy_brown.png',
  'enemy_green': 'assets/sprites/enemies/enemy_green.png',
  'enemy_guard': 'assets/sprites/enemies/guard.png',
  'enemy_soldier': 'assets/sprites/enemies/soldier.png',
  'enemy_woman': 'assets/sprites/enemies/woman.png',
  
  // Weapons
  'weapon_pistol': 'assets/sprites/weapons/pistol.png',
  'weapon_machinegun': 'assets/sprites/weapons/machinegun.png',
};

/** Mapeamento de tipos de inimigo para chaves de sprite */
const ENEMY_SPRITE_MAP: Record<string, string> = {
  'grunt': 'enemy_zombie',
  'runner': 'enemy_brown',
  'tank': 'enemy_blue',
  'shooter': 'enemy_hitman',
  'bat': 'enemy_green',
  'robot': 'enemy_robot',
  'drone': 'enemy_robot',
  'slime': 'enemy_green',
  'lavaSlime': 'enemy_green',
  'mosquito': 'enemy_green',
  'knight': 'enemy_guard',
  'archer': 'enemy_hitman',
  'mage': 'enemy_woman',
  'boss': 'enemy_robot',
  'mothership': 'enemy_robot',
  'fireElemental': 'enemy_brown',
  'magmaGolem': 'enemy_blue',
  'inferno': 'enemy_brown',
  'ufo': 'enemy_robot',
  'asteroid': 'enemy_blue',
  'alien': 'enemy_green',
  'frog': 'enemy_green',
  'crystal': 'enemy_blue',
  'spitter': 'enemy_green',
};

/** Mapeamento de fases para ranges de tiles */
const PHASE_TILE_RANGES: Record<string, { start: number; end: number }> = {
  'Floresta': { start: 1, end: 30 },
  'Caverna': { start: 100, end: 130 },
  'Fábrica': { start: 200, end: 230 },
  'Pântano': { start: 50, end: 80 },
  'Castelo': { start: 300, end: 330 },
  'Vulcão': { start: 150, end: 180 },
  'Espaço': { start: 400, end: 430 },
};

/**
 * Retorna os caminhos dos tiles para uma fase.
 * @param phaseName - nome da fase
 * @returns array de caminhos de tiles
 */
export function getPhaseTilePaths(phaseName: string): string[] {
  const range = PHASE_TILE_RANGES[phaseName];
  if (!range) return [];
  const paths: string[] = [];
  for (let i = range.start; i <= range.end; i++) {
    paths.push(`assets/sprites/topdown-shooter/PNG/Tiles/tile_${String(i).padStart(3, '0')}.png`);
  }
  return paths;
}

/**
 * Habilita o sistema de sprites.
 */
export function enableSprites(): void {
  spritesEnabled = true;
}

/**
 * Verifica se sprites estão habilitados.
 */
export function isSpritesEnabled(): boolean {
  return spritesEnabled;
}

/**
 * Carrega uma imagem como sprite.
 * @param key - chave única para o sprite
 * @param url - caminho da imagem
 * @returns Promise que resolve quando carregada
 */
export async function loadSprite(key: string, url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      spriteCache.set(key, img);
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Carrega todos os sprites do jogo.
 * @returns Promise que resolve quando todos carregados
 */
export async function loadAllSprites(): Promise<void> {
  const promises = Object.entries(SPRITE_PATHS).map(([key, path]) => loadSprite(key, path));
  await Promise.all(promises);
  spritesEnabled = spriteCache.size > 0;
  console.log(`Sprites carregados: ${spriteCache.size}/${Object.keys(SPRITE_PATHS).length}`);
}

/**
 * Obtém uma sprite do cache.
 * @param key - chave do sprite
 * @returns imagem ou null se não encontrada
 */
export function getSprite(key: string): HTMLImageElement | null {
  return spriteCache.get(key) || null;
}

/**
 * Obtém a chave de sprite para um tipo de inimigo.
 * @param enemyType - tipo do inimigo
 * @returns chave do sprite ou string vazia
 */
export function getEnemySpriteKey(enemyType: string): string {
  return ENEMY_SPRITE_MAP[enemyType] || '';
}

/**
 * Desenha uma sprite no canvas.
 * @param ctx - contexto 2D
 * @param key - chave do sprite
 * @param x - posição X central
 * @param y - posição Y central
 * @param width - largura
 * @param height - altura
 * @param rotation - rotação em radianos (opcional)
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  key: string,
  x: number, y: number,
  width: number, height: number,
  rotation = 0
): boolean {
  const img = spriteCache.get(key);
  if (!img) return false;
  
  ctx.save();
  ctx.translate(x, y);
  if (rotation) ctx.rotate(rotation);
  ctx.drawImage(img, -width / 2, -height / 2, width, height);
  ctx.restore();
  return true;
}

/**
 * Limpa o cache de sprites.
 */
export function clearSprites(): void {
  spriteCache.clear();
}
