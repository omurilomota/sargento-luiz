/**
 * Diálogo de fase em CAIXA PEQUENA (H2 — pedido do Murilo: "esse diálogo e o
 * anterior gostaria que fosse em uma caixa de diálogo pequena, não gigante
 * igual aos outros níveis").
 *
 * Diferente da cutscene (tela inteira, cenário, retrato grande), a caixa
 * pequena é uma faixa na base da tela com o mundo CONGELADO atrás — decisão
 * do Murilo: pausado por linha, o ENTER avança. A fila carrega falas e
 * EFEITOS: um efeito dispara no momento em que a linha dele aparece (a
 * explosão da cápsula da Fábrica), e o mundo só volta quando a fila esvazia.
 */

import { Character, getPortraitInfo } from './story';

/** Uma entrada da fila: uma fala, ou um efeito de cena (sem texto). */
export interface EntradaDialogo {
  speaker: Character;
  text: string;
  /** Efeito que dispara quando esta entrada aparece (a explosão da cápsula,
   * a chave de roda do conserto, o lançamento do foguete do Castelo). */
  efeito?: 'explosaoCapsula' | 'ferramenta' | 'lancamentoFoguete';
}

const fila: EntradaDialogo[] = [];
let entradaAtual: EntradaDialogo | null = null;
/** Callback do efeito, ligado pelo main (os efeitos moram lá). */
let aoEfeito: ((efeito: 'explosaoCapsula' | 'ferramenta' | 'lancamentoFoguete') => void) | null = null;

export function dialogoAtivo(): boolean {
  return entradaAtual !== null;
}

/** Fala em exibição (null se nenhuma). */
export function getDialogo(): EntradaDialogo | null {
  return entradaAtual;
}

/** O retrato da caixa é o mesmo das cutscenes — um vocabulário só. */
export function retratoDoDialogo(entrada: EntradaDialogo) {
  return getPortraitInfo(entrada.speaker);
}

/**
 * Enfileira uma sequência. Se a caixa já está na tela, as novas falas
 * entram ATRÁS das atuais — o mundo continua congelado até esvaziar tudo.
 * `fechar` roda quando a fila acabou (a virada do Fernando fecha a caixa
 * e ELE nasce: o efeito mora no chamador, o sistema só conta as linhas).
 */
export function abrirDialogo(entradas: EntradaDialogo[], fechar?: () => void): void {
  if (fechar) aoFechar = fechar;
  fila.push(...entradas.filter(e => e.text.length > 0 || e.efeito));
  if (entradaAtual === null) avancarDialogo();
}

/**
 * Avança uma linha. Devolve true quando isto FECHOU a caixa (a fila
 * acabou) — o main devolve o mundo ao jogo nesse momento.
 */
export function avancarDialogo(): boolean {
  const proxima = fila.shift() ?? null;
  entradaAtual = proxima;
  if (entradaAtual === null) {
    const cb = aoFechar;
    aoFechar = null;
    if (cb) cb();
    return true;
  }
  if (proxima?.efeito && aoEfeito) aoEfeito(proxima.efeito);
  return false;
}

/** Callback de fechamento da sequência atual. */
let aoFechar: (() => void) | null = null;

/** Liga o disparador de efeitos (o main tem os sistemas de mundo). */
export function setEfeitoDialogo(cb: (efeito: 'explosaoCapsula' | 'ferramenta' | 'lancamentoFoguete') => void): void {
  aoEfeito = cb;
}

export function resetDialogo(): void {
  fila.length = 0;
  entradaAtual = null;
  aoFechar = null;
}
