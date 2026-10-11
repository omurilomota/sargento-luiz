/**
 * Tela cheia.
 *
 * O jogo NÃO pede fullscreen em lugar nenhum: quem pede é o botão do player do
 * itch.io, que chama `requestFullscreen()` no iframe que embute o jogo. Isso
 * funciona, mas deixava três problemas:
 *
 *   1. Sem `fullscreenchange`, qualquer mudança de tamanho da janela fora do
 *      evento `resize` deixava o canvas com a resolução antiga.
 *   2. O ESC é ação dupla: o navegador usa para sair do fullscreen E o jogo
 *      usava para abrir a pausa. Duas respostas para uma tecla.
 *   3. Dentro do iframe não há barra do itch para clicar de volta, então se o
 *      navegador não entregar o ESC o jogador fica sem nenhuma saída.
 *
 * Este módulo deixa o JOGO dono da saída: ESC sempre pede `exitFullscreen()`,
 * e o `fullscreenchange` reajusta o canvas. Se o navegador já estava saindo,
 * a chamada é idempotente e não dá erro.
 */

let aoMudar: (() => void) | null = null;

/**
 * Documento que DETÉM o estado de tela cheia.
 *
 * Este é o ponto que faz o jogo funcionar dentro do itch.io. O botão do
 * player chama `requestFullscreen()` no próprio `<iframe>`, o que significa
 * que o elemento em tela cheia é o IFRAME, no documento do PAI. Dentro do
 * jogo, `document.fullscreenElement` é `null` — o jogo não tem como saber
 * que está em tela cheia pelo caminho normal.
 *
 * O itch entrega `allow-same-origin`, então o jogo enxerga o documento do pai.
 * Se existir um `fullscreenElement` em algum elo da cadeia, esse é o
 * documento que manda.
 */
function documentoDonoDaTelaCheia(): Document | null {
  if (typeof document === 'undefined') return null;
  if (document.fullscreenElement) return document;
  // Sobe a cadeia: se o embed estiver dentro de outra página, segue até o topo
  let atual: Document | null = document;
  for (let i = 0; i < 5 && atual; i++) {
    try {
      const pai: Document | null = atual.defaultView?.parent?.document ?? null;
      if (!pai) break;
      if (pai.fullscreenElement) return pai;
      atual = pai;
    } catch {
      // pai de outra origem (sandbox sem allow-same-origin): para aqui
      break;
    }
  }
  return null;
}

/** true se o jogo — ou o embed que o contém — está em tela cheia. */
export function estaEmTelaCheia(): boolean {
  return documentoDonoDaTelaCheia() !== null;
}

/**
 * Sai da tela cheia.
 *
 * Chamar `document.exitFullscreen()` de dentro do iframe é REJEITADO com
 * TypeError: o elemento em tela cheia pertence ao documento do pai. A saída
 * tem de ser pedida de lá — foi medido no `tools/itch-fullscreen-proof.mjs`.
 */
export async function sairDaTelaCheia(): Promise<void> {
  const dono = documentoDonoDaTelaCheia();
  if (!dono) return;
  try {
    await dono.exitFullscreen();
  } catch {
    // o navegador já saiu sozinho com o mesmo ESC; sair duas vezes não é erro
  }
}

/** Entra em tela cheia. Retorna false se o navegador recusar. */
export async function entrarNaTelaCheia(): Promise<boolean> {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    return !!document.fullscreenElement;
  } catch {
    // iframe sem `allow="fullscreen"`, ou navegador que bloqueia sem gesto
    return false;
  }
}

/** Alterna entre entrar e sair. */
export async function alternarTelaCheia(): Promise<boolean> {
  if (estaEmTelaCheia()) {
    await sairDaTelaCheia();
    return false;
  }
  return entrarNaTelaCheia();
}

/**
 * Liga o `fullscreenchange`.
 *
 * Entrar e sair de tela cheia muda o tamanho do iframe por um caminho que nem
 * sempre dispara `resize` a tempo; sem esta escuta o canvas fica com a
 * resolução antiga e o jogo aparece esticado ou cortado.
 *
 * @param onChange - chamado depois de cada mudança, para reajustar o canvas
 */
export function observarTelaCheia(onChange: () => void): void {
  if (typeof document === 'undefined') return;
  aoMudar = onChange;
  document.addEventListener('fullscreenchange', () => {
    aoMudar?.();
  });
  // Safari antigo e alguns navegadores só avisam pelo prefixo
  document.addEventListener('webkitfullscreenchange', () => {
    aoMudar?.();
  });
}

/** true se o jogo está rodando dentro de um iframe (ou seja, dentro do itch). */
export function estaEmIframe(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    // acesso a window.top bloqueado por sandbox: é iframe, com certeza
    return true;
  }
}