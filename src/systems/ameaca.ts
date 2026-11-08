/**
 * AMEAÇA — o mundo mede o preparo do jogador e responde.
 *
 * O relato (2026-11-07): "depois de upar tudo, o personagem fica imbatível e
 * mata tudo e todos na sua frente sem nenhuma dificuldade". A causa é
 * aritmética, não de um número solto:
 *
 *   - o teto do DANO do jogador cresce ~4-5x (perks, talentos, qualidade
 *     lendária, peças de dano, classe);
 *   - o teto da VIDA do inimigo cresce ~3x (onda, dificuldade da fase, tempo);
 *   - e o topo da escada é comprável com a renda de uma fase.
 *
 * Quem compra tudo termina o jogo sem gastar munição, e o chefe da fase final
 * cai antes de a luta começar.
 *
 * A regra aqui: o mundo compara o PODER do jogador com o poder de REFERÊNCIA
 * (a pistola inicial, 100 de vida, nenhum preparo) e escala os inimigos na
 * mesma medida. Quem não se preparou vê a curva autorada intacta; quem se
 * preparou vê inimigos mais duros — e continua mais forte que eles, porque a
 * escala é proporcional e menor que o ganho. Retornos decrescentes, não
 * punição.
 *
 * Dois eixos, porque "dar mais dano" e "aguentar mais" são problemas
 * diferentes:
 *
 *   - VIDA do inimigo escala com o poder de FOGO do jogador (quem dá mais
 *     dano demora mais para derrubar o chefe);
 *   - DANO do inimigo escala com a VIDA EFETIVA do jogador (quem aguenta mais
 *     precisa enfrentar inimigos mais fortes).
 *
 * O número mostrado ao jogador é o maior dos dois: é o quanto o MUNDO cresceu.
 */

import { PLAYER_BASE_HEALTH } from '../core/constants';
import { getStat } from '../core/stats';
import { getPlayer } from '../entities/player';
import { WEAPONS } from '../config';
import { getEffectiveDps } from '../weapons';

/** Índice da arma de referência: a pistola inicial (a primeira da lista). */
const ARMA_REFERENCIA = 0;

/** Fração da vida máxima que UM acerto pode tirar de um inimigo comum. */
export const TETO_DANO_COMUM = 0.35;
/** Mesma regra para chefe — 20% porque a luta com chefe é a régua do jogo. */
export const TETO_DANO_CHEFE = 0.2;
/**
 * Piso absoluto do teto, em dano.
 *
 * A pistola inicial com a classe soldado faz 13,8 por tiro: com o piso em 14,
 * o primeiro capítulo continua exatamente igual ao autoral. O piso existe para
 * que a regra percentual não degrade quem não se preparou.
 */
export const PISO_DANO_COMUM = 14;
export const PISO_DANO_CHEFE = 24;

/** Quanto a vida do inimigo cresce por ponto de poder de fogo além da referência. */
export const FATOR_VIDA = 0.5;
/** Quanto o dano do inimigo cresce por ponto de poder de corpo além da referência. */
export const FATOR_DANO = 0.8;
/** Teto de cada escala (o mundo não vira uma parede). */
export const TETO_ESCALA_VIDA = 4;
export const TETO_ESCALA_DANO = 2.5;
/** Carga de escudo contada como 25 de vida efetiva (o escudo absorve um tiro). */
export const HP_POR_ESCUDO = 25;

/** Como o mundo responde ao preparo. */
export interface EscalaAmeaca {
  /** Multiplicador da vida do inimigo. */
  vida: number;
  /** Multiplicador do dano do inimigo. */
  dano: number;
  /** O número mostrado ao jogador: o quanto o mundo cresceu (o maior dos dois). */
  numero: number;
  /** Poder de fogo contra a referência (1 = pistola inicial, sem preparo). */
  poderDano: number;
  /** Vida efetiva contra a referência (1 = 100 de vida, sem armadura). */
  poderCorpo: number;
}

/** A escala de quem não se preparou: a curva autorada, intacta. */
export const ESCALA_NEUTRA: EscalaAmeaca = {
  vida: 1, dano: 1, numero: 1, poderDano: 1, poderCorpo: 1,
};

/** Par {arma, qualidade} que o jogador possui. */
export interface ParArma { index: number; quality: string }

/**
 * A escala que responde a um poder medido.
 *
 * Pura de propósito: é a função que os testes travam, e a que o dono pode
 * ajustar (os fatores e os tetos) sem tocar em mais nada.
 */
export function getEscalaAmeaca(poderDano: number, poderCorpo: number): EscalaAmeaca {
  const vida = 1 + Math.min(TETO_ESCALA_VIDA - 1, FATOR_VIDA * Math.max(0, poderDano - 1));
  const dano = 1 + Math.min(TETO_ESCALA_DANO - 1, FATOR_DANO * Math.max(0, poderCorpo - 1));
  return { vida, dano, numero: Math.max(vida, dano), poderDano, poderCorpo };
}

/**
 * DPS da pistola inicial, sem peça e sem qualidade: a referência do mundo.
 *
 * O modelo é o de `getEffectiveDps` sem a camada de peça — a referência é o
 * jogador que não comprou NADA, então ela não pode carregar a peça que o
 * jogador pendurou na pistola.
 */
export function dpsDeReferencia(): number {
  const w = WEAPONS[ARMA_REFERENCIA];
  const cycle = w.magazineSize * w.shootRate + w.reloadTime;
  return (w.magazineSize * w.damage * w.bulletCount) / cycle;
}

/**
 * O poder do jogador contra a referência.
 *
 * FOGO: o DPS da melhor arma que ele possui (com a peça e a qualidade
 * compradas) vezes o multiplicador de dano do build (perks + talentos),
 * dividido pelo DPS da pistola inicial. A classe NÃO entra: ela é uma
 * escolha do começo, não um preparo — e a referência também não a tem.
 *
 * CORPO: a vida efetiva (vida máxima divided by (1 - armadura), mais as
 * cargas de escudo) contra os 100 de vida do começo.
 */
export function getPoderDoJogador(pares: ParArma[]): { poderDano: number; poderCorpo: number } {
  const lista = pares.length > 0 ? pares : [{ index: ARMA_REFERENCIA, quality: 'normal' }];
  let dps = 0;
  for (const par of lista) {
    const d = getEffectiveDps(par.index, par.quality);
    if (d > dps) dps = d;
  }
  const referencia = dpsDeReferencia();
  const poderDano = referencia > 0 ? (dps * getStat('damageMult')) / referencia : 1;

  const p = getPlayer();
  const vidaEfetiva = p.maxHealth / Math.max(0.05, 1 - getStat('armor')) + p.shield * HP_POR_ESCUDO;
  const poderCorpo = vidaEfetiva / PLAYER_BASE_HEALTH;
  return { poderDano, poderCorpo };
}

/** A escala em vigor na fase que está rodando. */
let escalaAtual: EscalaAmeaca = ESCALA_NEUTRA;

/** Grava a escala que a fase atual vai usar. */
export function setEscalaAmeaca(escala: EscalaAmeaca): void { escalaAtual = escala; }

/** A escala em vigor (a neutra até a fase carregar). */
export function getEscalaAmeacaAtual(): EscalaAmeaca { return escalaAtual; }

/** O número que o jogador vê: quanto o mundo cresceu. */
export function getAmeacaAtual(): number { return escalaAtual.numero; }

/**
 * O número da ameaça como o jogador lê: uma casa e vírgula (2,3).
 *
 * A loja e a pausa mostram a MESMA coisa — formatar em lugares diferentes é
 * a forma garantida de a loja dizer 2,3 e a pausa dizer 2.3.
 */
export function formatarAmeaca(numero: number): string {
  return numero.toFixed(1).replace('.', ',');
}

/**
 * Teto de dano de UM acerto contra um alvo.
 *
 * Comum: 35% da vida máxima. Chefe: 20%. O piso absoluto mantém a pistola
 * inicial fora da regra (13,8 de dano contra o piso de 14).
 */
export function tetoDeDano(vidaMaxima: number, chefe: boolean): number {
  const fracao = chefe ? TETO_DANO_CHEFE : TETO_DANO_COMUM;
  const piso = chefe ? PISO_DANO_CHEFE : PISO_DANO_COMUM;
  return Math.max(piso, vidaMaxima * fracao);
}

/**
 * O dano que entra no alvo depois do teto.
 *
 * É o que impede a build completa de apagar um inimigo comum com um tiro e
 * um chefe com uma carga. Dano abaixo do teto passa intacto — a regra só
 * corta o exagero.
 */
export function danoLimitado(dano: number, vidaMaxima: number, chefe: boolean): number {
  return Math.min(dano, tetoDeDano(vidaMaxima, chefe));
}
