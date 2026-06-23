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
  'enemy_skeleton': 'assets/sprites/enemies/skeleton.png',
  'enemy_alien': 'assets/sprites/enemies/alien.png',
  'enemy_robot': 'assets/sprites/enemies/robot.png',
  'enemy_demon': 'assets/sprites/enemies/demon.png',
  'enemy_slime': 'assets/sprites/enemies/slime.png',
  'enemy_bat': 'assets/sprites/enemies/bat.png',
  'enemy_boss': 'assets/sprites/enemies/boss.png',
  
  // Items
  'item_coin': 'assets/sprites/items/coin.png',
  'item_health': 'assets/sprites/items/health.png',
  'item_shield': 'assets/sprites/items/shield.png',
  'item_sword': 'assets/sprites/items/sword.png',
  
  // Effects
  'fx_explosion': 'assets/sprites/effects/explosion.png',
  'fx_fire': 'assets/sprites/effects/fire.png',
  'fx_lightning': 'assets/sprites/effects/lightning.png',
};

/** Mapeamento de tipos de inimigo para chaves de sprite */
const ENEMY_SPRITE_MAP: Record<string, string> = {
  'zombie': 'enemy_zombie',
  'grunt': 'enemy_zombie',
  'runner': 'enemy_skeleton',
  'skeleton': 'enemy_skeleton',
  'alien': 'enemy_alien',
  'ufo': 'enemy_alien',
  'robot': 'enemy_robot',
  'drone': 'enemy_robot',
  'demon': 'enemy_demon',
  'fireElemental': 'enemy_demon',
  'slime': 'enemy_slime',
  'lavaSlime': 'enemy_slime',
  'bat': 'enemy_bat',
  'mosquito': 'enemy_bat',
  'boss': 'enemy_boss',
  'mothership': 'enemy_boss',
};

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
