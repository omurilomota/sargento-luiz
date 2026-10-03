/**
 * src/systems/camera.ts
 *
 * Câmera que segue o jogador com lerp e clamp nos limites do mapa.
 * A transformação é aplicada uma única vez por frame no `draw()`, e o
 * deslocamento do screen shake entra na mesma matriz.
 */

import { PALETTE } from '../core/palette';

let camX = 0;
let camY = 0;
let viewW = 0;
let viewH = 0;
let worldW = 0;
let worldH = 0;

/** Fator de suavização por frame (independente de framerate via dt) */
const FOLLOW_RATE = 9;

/**
 * Configura a câmera para um novo mundo.
 * @param w - largura do mundo em pixels
 * @param h - altura do mundo em pixels
 * @param viewWidth - largura da viewport em pixels
 * @param viewHeight - altura da viewport em pixels
 * @param focusX - X inicial da câmera
 * @param focusY - Y inicial da câmera
 */
export function initCamera(w: number, h: number, viewWidth: number, viewHeight: number, focusX: number, focusY: number): void {
  worldW = w;
  worldH = h;
  viewW = viewWidth;
  viewH = viewHeight;
  camX = clampToWorld(focusX - viewW / 2);
  camY = clampToWorld(focusY - viewH / 2);
}

/** Atualiza as dimensões do mundo (troca de fase/mapa). */
export function setWorldSize(w: number, h: number): void {
  worldW = w;
  worldH = h;
}

/** Atualiza o tamanho da viewport (resize da janela). */
export function setViewportSize(w: number, h: number): void {
  viewW = w;
  viewH = h;
}

function clampToWorld(v: number): number {
  if (worldW <= viewW) return (worldW - viewW) / 2;
  return Math.max(0, Math.min(worldW - viewW, v));
}

/**
 * Move a câmera em direção ao alvo com lerp.
 * @param dt - delta time em segundos
 * @param targetX - X do alvo
 * @param targetY - Y do alvo
 */
export function updateCamera(dt: number, targetX: number, targetY: number): void {
  const t = 1 - Math.exp(-FOLLOW_RATE * dt);
  camX += (clampToWorld(targetX - viewW / 2) - camX) * t;
  camY += (clampToWorld(targetY - viewH / 2) - camY) * t;
}

/** Teleporta a câmera para o alvo sem interpolação (troca de fase). */
export function snapCamera(targetX: number, targetY: number): void {
  camX = clampToWorld(targetX - viewW / 2);
  camY = clampToWorld(targetY - viewH / 2);
}

/** Deslocamento X atual da câmera. */
export function getCamX(): number { return camX; }

/** Deslocamento Y atual da câmera. */
export function getCamY(): number { return camY; }

/**
 * Converte coordenadas de tela para coordenadas de mundo.
 * Sem isso a arma atira na direção errada quando o mapa é maior que a tela.
 * @param screenX - X do mouse na tela
 * @param screenY - Y do mouse na tela
 */
export function screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
  return { x: screenX + camX, y: screenY + camY };
}

/**
 * Verifica se um retângulo em mundo está visível na viewport.
 * @param x - X do canto
 * @param y - Y do canto
 * @param w - largura
 * @param h - altura
 */
export function isVisible(x: number, y: number, w: number, h: number): boolean {
  return x + w > camX && x < camX + viewW && y + h > camY && y < camY + viewH;
}

/**
 * Desenha o "void" fora dos limites do mapa, para o jogador perceber onde
 * o mundo acaba em vez de ver o fundo vazio.
 * @param ctx - contexto 2D
 */
export function drawVoid(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PALETTE.void;
  ctx.fillRect(camX, camY, viewW, viewH);
}
