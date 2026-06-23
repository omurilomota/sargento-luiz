/**
 * Sistema de sprites do jogo.
 * Gerencia carregamento e cache de imagens.
 * Permite trocar facilmente por assets reais depois.
 */

/** Cache de sprites carregadas */
const spriteCache: Map<string, HTMLImageElement> = new Map();

/** Se o sistema de sprites está habilitado */
let spritesEnabled = false;

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
export async function loadSprite(key: string, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      spriteCache.set(key, img);
      resolve();
    };
    img.onerror = reject;
    img.src = url;
  });
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
): void {
  const img = spriteCache.get(key);
  if (!img) return;
  
  ctx.save();
  ctx.translate(x, y);
  if (rotation) ctx.rotate(rotation);
  ctx.drawImage(img, -width / 2, -height / 2, width, height);
  ctx.restore();
}

/**
 * Limpa o cache de sprites.
 */
export function clearSprites(): void {
  spriteCache.clear();
}
