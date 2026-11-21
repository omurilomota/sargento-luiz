/**
 * Botão de apoio ao projeto.
 *
 * O jogo roda dentro de um `iframe` no itch.io, e alguns browsers bloqueiam
 * `window.open` vindo de iframe. Então o fluxo é:
 *
 *   1. tenta abrir a página em nova aba
 *   2. se a aba não abriu (o popup foi barrado), o jogo escreve a URL na tela
 *      com o aviso de copiar — o jogador nunca fica sem caminho
 *
 * A URL fica em `config.ts`. Ela ainda não aponta para lugar nenhum de fato:
 * apontar para o próprio projeto no itch.io é o certo, porque a página dele já
 * tem o botão de doar embutido e oitch trata a.collected por conta própria.
 */

import { PALETTE } from '../core/palette';
import { SUPPORT_URL, SUPPORT_LABEL } from '../config';

let urlVisivel = 0;

export function isSupportUrlVisible(): boolean {
  return urlVisivel > 0;
}

export function hideSupportUrl(): void {
  urlVisivel = 0;
}

export function updateSupportUrl(dt: number): void {
  if (urlVisivel > 0) urlVisivel = Math.max(0, urlVisivel - dt);
}

/**
 * Abre a página de apoio.
 * @returns true se a aba abriu; false se o navegador bloqueou
 */
export function openSupportLink(): boolean {
  let aberto = false;
  try {
    aberto = !!window.open(SUPPORT_URL, '_blank', 'noopener,noreferrer');
  } catch {
    aberto = false;
  }
  if (!aberto) urlVisivel = 6;
  return aberto;
}

/** Faixa de aviso no rodapé quando o popup foi bloqueado. */
export function drawSupportFallback(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  if (!isSupportUrlVisible()) return;
  const y = h - 92;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, y, w, 74);
  ctx.strokeStyle = 'rgba(200,184,144,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, y + 0.5, w - 1, 73);

  ctx.fillStyle = PALETTE.mustard;
  ctx.font = 'bold 12px monospace';
  ctx.fillText(SUPPORT_LABEL, w / 2, y + 22);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 12px monospace';
  ctx.fillText(SUPPORT_URL, w / 2, y + 44);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '11px monospace';
  ctx.fillText('o navegador bloqueou a aba — copie a URL acima', w / 2, y + 62);
  ctx.textAlign = 'left';
}
