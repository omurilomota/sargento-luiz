/**
 * Telemetria de dano por fonte.
 *
 * Existe porque `npm run sessao` é o portão de balanceamento e ele não media
 * nada: o bot morria na onda 1 da Cidade, e sem chegar ao fases finais nenhuma
 * mudança de HP, onda ou economia tinha verificação. Este módulo dá a segunda
 * metade do quebra-cabeça — dizer DE QUEM veio o dano — para que uma mudança de
 * armadura ou de hazard possa ser comparada entre fases.
 *
 * É estado de harness, não de jogo: nada aqui altera HP, dano ou balanceamento.
 * Só observa. Por isso mora em `systems/` (tem o mesmo contrato de reset que
 * qualquer módulo observador) e não em `core/`, que é o registro de stats do
 * jogador.
 */

/**
 * Origem do dano, na resolução que o balanceamento precisa.
 *
 * A primeira versão tinha uma fonte só chamada `ambiente` e ela respondia
 * "ambiente: 110" numa fase em que o bot morria na onda 1 — o que não diz
 * nada para decidir o que mudar. As três causas que compartilham esse nome têm
 *retoques opostos:
 *
 * - `bioma`: o tile de hazard. Corrigir é mexer no dano por segundo.
 * - `barril`: a explosão que o JOGADOR causou. Corrigir é mexer no raio, e
 *   mexer no dano disso não ajuda em nada, porque aqui o problema é o raio.
 * - `evento`: terremoto, relâmpago, tempestade. Corrigir é a frequência.
 *
 * Separar foi o que transformou "o bot morre" em "o bot se mata com o próprio
 * barril 11 vezes", que é um conserto de Balanceamento.
 */
export type FonteDano =
  | 'contato'   // encostar em inimigo corpo a corpo
  | 'projetil'  // tiro de inimigo (atirador ou chefe)
  | 'bioma'     // tile de hazard (lava, espinho, elétrico)
  | 'barril'    // explosão de caixote/barril, inclusive a que o jogador caused
  | 'evento'    // evento ambiental (terremoto, relâmpago, tempestade)
  | 'boss'      // contato com chefe
  | 'bot';      // bot do modo competitivo

const VAZIO: Record<FonteDano, number> = {
  contato: 0, projetil: 0, bioma: 0, barril: 0, evento: 0, boss: 0, bot: 0,
};

let acumulado: Record<FonteDano, number> = { ...VAZIO };
let porTipo: Record<string, number> = {};
let ultimoDano = { fonte: '' as FonteDano | '', tipo: '', valor: 0, t: 0 };

/**
 * Registra um dano recebido.
 *
 * `tipo` é o tipo do inimigo (`grunt`, `ufo`, …) quando houver um; ambiente e
 * bot não têm. É o que permite responder "qual inimigo mata mais no Espaço"
 * em vez de "quanto o Espaço mata".
 */
export function registrarDano(fonte: FonteDano, valor: number, tipo = ''): void {
  if (valor <= 0) return;
  acumulado[fonte] += valor;
  if (tipo) porTipo[tipo] = (porTipo[tipo] ?? 0) + valor;
  ultimoDano = { fonte, tipo, valor, t: Date.now() };
}

/** Foto do acumulado, mais o total. Cópia: o chamador não muta o estado. */
export function danoPorFonte(): {
  porFonte: Record<FonteDano, number>;
  porTipo: Record<string, number>;
  total: number;
  ultimo: { fonte: string; tipo: string; valor: number };
} {
  return {
    porFonte: { ...acumulado },
    porTipo: { ...porTipo },
    total: Object.values(acumulado).reduce((a, b) => a + b, 0),
    ultimo: { fonte: ultimoDano.fonte, tipo: ultimoDano.tipo, valor: ultimoDano.valor },
  };
}

/** Zera o acumulado. Chamar na partida nova, junto do `resetGame`. */
export function resetDanoTelemetria(): void {
  acumulado = { ...VAZIO };
  porTipo = {};
  ultimoDano = { fonte: '', tipo: '', valor: 0, t: 0 };
}