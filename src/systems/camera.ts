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
/** Deslocamento de screen shake já aplicado no draw; a mira precisa do mesmo. */
let shakeX = 0;
let shakeY = 0;

/** Fator de suavização por frame (independente de framerate via dt) */
const FOLLOW_RATE = 9;

/**
 * Configura a câmera para um novo mundo.
 */
export function initCamera(w: number, h: number, viewWidth: number, viewHeight: number, focusX: number, focusY: number): void {
  worldW = w;
  worldH = h;
  viewW = viewWidth;
  viewH = viewHeight;
  camX = clampAxis(focusX - viewW / 2, worldW, viewW);
  camY = clampAxis(focusY - viewH / 2, worldH, viewH);
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

/**
 * Limita um eixo da câmera aos limites do mundo.
 *
 * Precisa ser por eixo: um clamp único que só conhece `worldW`/`viewW` erra o
 * vertical sempre que a janela é mais alta que o mapa. Numa viewport de
 * 2560x1300 o camY saía -320 em vez de -10 e o mapa aparecia 310px deslocado
 * com vazio em cima e embaixo — em qualquer monitor 1440p ou 4K em fullscreen.
 * E `worldH` ficava declarado e nunca lido, que era o sinal.
 */
function clampAxis(v: number, world: number, view: number): number {
  if (world <= view) return (world - view) / 2;
  return Math.max(0, Math.min(world - view, v));
}

/**
 * Registra o shake que o draw vai aplicar, para a conversão tela→mundo
 * Dessas usar a mesma matriz. Sem isso a mira erra o offset do tremor.
 */
export function setShake(x: number, y: number): void {
  shakeX = x;
  shakeY = y;
}

/**
 * Move a câmera em direção ao alvo com lerp.
 */
export function updateCamera(dt: number, targetX: number, targetY: number): void {
  const t = 1 - Math.exp(-FOLLOW_RATE * dt);
  camX += (clampAxis(targetX - viewW / 2, worldW, viewW) - camX) * t;
  camY += (clampAxis(targetY - viewH / 2, worldH, viewH) - camY) * t;
}

/** Teleporta a câmera para o alvo sem interpolação (troca de fase). */
export function snapCamera(targetX: number, targetY: number): void {
  camX = clampAxis(targetX - viewW / 2, worldW, viewW);
  camY = clampAxis(targetY - viewH / 2, worldH, viewH);
}

export function getCamX(): number { return camX; }

export function getCamY(): number { return camY; }

/**
 * Converte coordenadas de tela para coordenadas de mundo.
 * Sem isso a arma atira na direção errada quando o mapa é maior que a tela.
 * Desconta o shake: o draw aplica `-camX + shake.x`, então o ponto sob o cursor
 * é `tela + camX - shake.x`. Sem o desconto a mira erra o tremor, que chega a
 * 14px em explosão.
 */
export function screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
  return { x: screenX + camX - shakeX, y: screenY + camY - shakeY };
}

/**
 * Verifica se um retângulo em mundo está visível na viewport.
 */
export function isVisible(x: number, y: number, w: number, h: number): boolean {
  return x + w > camX && x < camX + viewW && y + h > camY && y < camY + viewH;
}

/**
 * Desenha o "void" fora dos limites do mapa, para o jogador perceber onde
 * o mundo acaba em vez de ver o fundo vazio.
 */
export function drawVoid(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PALETTE.void;
  ctx.fillRect(camX, camY, viewW, viewH);
}
