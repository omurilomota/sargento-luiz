/**
 * Escada de perks (Sprint 5): ramos com degraus sequenciais + um especial cada.
 *
 * Substitui os 19 UPGRADES avulsos, que a loja listava todos de uma vez (a
 * renda da fase 4 comprava tudo). Aqui só o degrau N depois do N-1, e a loja
 * oferece 3 por visita (`ofertaDePerks` abaixo).
 */

import type { StatId } from '../core/stats';

/** Um degrau da escada. `requires` é o id do degrau anterior (`null` = base).
 * `desc` existe só nos especiais: o nome dos degraus comuns já diz o efeito
 * ("Dano +8%"), mas "Pistola Incandescente" não diz NADA — o jogador não
 * sabe se a compra vale, e era o buraco do tutorial de perks. */
export interface PerkTier {
  id: string;
  ram: 'dano' | 'corpo' | 'pernas' | 'mente';
  tier: number;
  name: string;
  price: number;
  statId: StatId | 'health' | 'speed' | 'shield';
  value: number;
  requires: string | null;
  special?: boolean;
  desc?: string;
}

export const PERK_LADDER: PerkTier[] = [
  // DANO — +8% cada, total +40%
  // Os preços dos degraus altos subiram com a campanha de 16 fases
  // (2026-10-14): a renda de abate da campanha quase dobrou (2492 moedas
  // nas 15 fases com loja), e a escada barata virava alvo de UMA campanha —
  // a escada volta a ser alvo de VÁRIAS (o árbitro do economia.test exige
  // 2,5× a 4,5× a renda total).
  { id: 'dano_t1', ram: 'dano', tier: 1, name: 'Dano +8%', price: 60, statId: 'damageMult', value: 0.08, requires: null },
  { id: 'dano_t2', ram: 'dano', tier: 2, name: 'Dano +8%', price: 140, statId: 'damageMult', value: 0.08, requires: 'dano_t1' },
  { id: 'dano_t3', ram: 'dano', tier: 3, name: 'Dano +8%', price: 230, statId: 'damageMult', value: 0.08, requires: 'dano_t2' },
  { id: 'dano_t4', ram: 'dano', tier: 4, name: 'Dano +8%', price: 320, statId: 'damageMult', value: 0.08, requires: 'dano_t3' },
  { id: 'dano_t5', ram: 'dano', tier: 5, name: 'Dano +8%', price: 450, statId: 'damageMult', value: 0.08, requires: 'dano_t4' },
  // M3 (relato 2026-10-14): o efeito vale em QUALQUER arma — sempre valeu, o
// mecanismo conta cada tiro do que estiver na mão. O nome antigo ("Pistola
// Incandescente") prometia menos que o código entrega e o jogador não via
// valor ao trocar de arma. O id fica: é a chave do save.
    { id: 'pistola_incandescente', ram: 'dano', tier: 6, name: 'Munição Incandescente', price: 900, statId: 'damageMult', value: 0, requires: 'dano_t5', special: true, desc: 'a cada 5 tiros, um incendeia — vale para qualquer arma' },
  // CORPO — vida, armadura, escudo e regeneração, terminando no TETO da armadura.
// O T5 levanta o teto (armorMax) em vez de dar mais vida: `armorMax` era lido
// por `applyStat` e escrito por NINGUÉM, então o teto de 0.5 nunca abria. Com a
// armadura valendo também contra projétil (player.ts `damagePlayer`), o degrau
// passa a valer contra a maior parte do dano do jogo.
  { id: 'corpo_t1', ram: 'corpo', tier: 1, name: 'Vida +30', price: 60, statId: 'health', value: 30, requires: null },
  { id: 'corpo_t2', ram: 'corpo', tier: 2, name: 'Armadura +5%', price: 140, statId: 'armor', value: 0.05, requires: 'corpo_t1' },
  { id: 'corpo_t3', ram: 'corpo', tier: 3, name: 'Escudo +1', price: 230, statId: 'shield', value: 1, requires: 'corpo_t2' },
  { id: 'corpo_t4', ram: 'corpo', tier: 4, name: 'Regeneração +1', price: 320, statId: 'regen', value: 1, requires: 'corpo_t3' },
  { id: 'corpo_t5', ram: 'corpo', tier: 5, name: 'Armadura: teto +10%', price: 450, statId: 'armorMax', value: 0.1, requires: 'corpo_t4' },
  { id: 'segundo_folego', ram: 'corpo', tier: 6, name: 'Segundo Fôlego', price: 900, statId: 'health', value: 0, requires: 'corpo_t5', special: true, desc: 'abaixo de 30% de vida: 1,5s invulnerável' },
  // PERNAS — velocidade e recarga do dash
  { id: 'pernas_t1', ram: 'pernas', tier: 1, name: 'Velocidade +8%', price: 60, statId: 'speed', value: 0.08, requires: null },
  { id: 'pernas_t2', ram: 'pernas', tier: 2, name: 'Dash -10%', price: 140, statId: 'dashCooldown', value: -0.1, requires: 'pernas_t1' },
  { id: 'pernas_t3', ram: 'pernas', tier: 3, name: 'Velocidade +8%', price: 230, statId: 'speed', value: 0.08, requires: 'pernas_t2' },
  { id: 'pernas_t4', ram: 'pernas', tier: 4, name: 'Dash -10%', price: 320, statId: 'dashCooldown', value: -0.1, requires: 'pernas_t3' },
  { id: 'pernas_t5', ram: 'pernas', tier: 5, name: 'Velocidade +8%', price: 450, statId: 'speed', value: 0.08, requires: 'pernas_t4' },
  { id: 'passo_fantasma', ram: 'pernas', tier: 6, name: 'Passo Fantasma', price: 900, statId: 'speed', value: 0, requires: 'pernas_t5', special: true, desc: 'o dash fere quem você atravessa' },
  // MENTE — xp, moedas e sorte
  { id: 'mente_t1', ram: 'mente', tier: 1, name: 'XP +15%', price: 60, statId: 'xpMult', value: 0.15, requires: null },
  { id: 'mente_t2', ram: 'mente', tier: 2, name: 'Moedas +15%', price: 140, statId: 'coinMult', value: 0.15, requires: 'mente_t1' },
  { id: 'mente_t3', ram: 'mente', tier: 3, name: 'Sorte +1', price: 230, statId: 'luck', value: 1, requires: 'mente_t2' },
  { id: 'mente_t4', ram: 'mente', tier: 4, name: 'XP +15%', price: 320, statId: 'xpMult', value: 0.15, requires: 'mente_t3' },
  { id: 'mente_t5', ram: 'mente', tier: 5, name: 'Moedas +15%', price: 450, statId: 'coinMult', value: 0.15, requires: 'mente_t4' },
  { id: 'sortudo', ram: 'mente', tier: 6, name: 'Sortudo', price: 900, statId: 'luck', value: 2, requires: 'mente_t5', special: true, desc: 'sorte pesa eventos e drops' },
];

/** Degraus que ainda dá para comprar dados os já comprados. */
export function degrausCompraveis(comprados: string[]): PerkTier[] {
  const tem = new Set(comprados);
  return PERK_LADDER.filter(t => !tem.has(t.id) && (t.requires === null || tem.has(t.requires)));
}

// ─── Oferta de 3 por visita ──────────────────────────────────────────
// A loja é curadoria, não loteria: sortear 3 degraus compráveis e garantir
// que 1 deles continua a build atual. Pura para teste — o estoque da loja
// (shop.ts) chama uma vez por visita e renderiza o resultado.

/**
 * Sorteia 3 degraus compráveis, garantindo 1 da build atual.
 * Build atual = ramo com mais degraus comprados (empate: DANO primeiro).
 * Run nova cai no primeiro degrau de DANO.
 */
export function ofertaDePerks(comprados: string[], rand: () => number = Math.random): PerkTier[] {
  const compraveis = degrausCompraveis(comprados);
  if (compraveis.length <= 3) return compraveis;

  const porRamo: Record<string, number> = { dano: 0, corpo: 0, pernas: 0, mente: 0 };
  for (const id of comprados) {
    const t = PERK_LADDER.find(p => p.id === id);
    if (t) porRamo[t.ram]++;
  }
  const ordemRamos: PerkTier['ram'][] = ['dano', 'corpo', 'pernas', 'mente'];
  const ramoAtual = ordemRamos.reduce((a, b) => porRamo[b] > porRamo[a] ? b : a);

  const garantidoPool = compraveis.filter(t => t.ram === ramoAtual);
  const garantido = garantidoPool[Math.floor(rand() * garantidoPool.length)];

  const resto = compraveis.filter(t => t.id !== garantido.id);
  const oferta: PerkTier[] = [garantido];
  while (oferta.length < 3 && resto.length > 0) {
    const i = Math.floor(rand() * resto.length);
    oferta.push(resto.splice(i, 1)[0]);
  }
  return oferta;
}

// ─── Efeitos dos 4 especiais (estado vivo, resetado por partida) ─────

let incandescenteAtivo = false;
let tirosIncandescentes = 0;
let segundoFolegoAtivo = false;
let segundoFolegoGasto = false;
let passoFantasmaAtivo = false;
const dashAcertados = new Set<object>();
let sortudoAtivo = false;

/** Dano do Passo Fantasma em quem o dash atravessa. */
export const PASSO_FANTASMA_DANO = 25;
/** Dot do Incandescente: 2 dano/s por 3s a cada 5º tiro. */
export const INCANDESCENTE_DOT = 2;
export const INCANDESCENTE_DURACAO = 3;

/** Queimadura por inimigo: o tick mora em `tickPerks` (main o chama no loop). */
const queimando = new Map<object, number>();

export function temIncandescente(): boolean { return incandescenteAtivo; }
export function temSegundoFolego(): boolean { return segundoFolegoAtivo && !segundoFolegoGasto; }
export function temPassoFantasma(): boolean { return passoFantasmaAtivo; }
/**
 * O SORTUDO está ligado? O `main` deixa de usar isto: com a sorte virando peso
 * (`rollDiaryEvent`), quem decide é `getStat('luck')`, e manter os dois dava
 * duas respostas para a mesma pergunta.
 */
export function temSortudoAtivo(): boolean { return sortudoAtivo; }

/** Cada 5º tiro com o Incandescente acende o inimigo. Conta no disparo. */
export function registrarTiroPerks(): boolean {
  if (!incandescenteAtivo) return false;
  tirosIncandescentes++;
  if (tirosIncandescentes % 5 === 0) return true;
  return false;
}

export function acenderInimigo(inimigo: object): void {
  queimando.set(inimigo, INCANDESCENTE_DURACAO);
}

/** Tick de DoT: devolve pares (inimigo, dano do frame) para o main aplicar. */
export function tickPerks(dt: number): { inimigo: object; dano: number }[] {
  const saidas: { inimigo: object; dano: number }[] = [];
  for (const [inimigo, tempo] of queimando) {
    const restante = tempo - dt;
    if (restante <= 0) queimando.delete(inimigo);
    else {
      queimando.set(inimigo, restante);
      saidas.push({ inimigo, dano: INCANDESCENTE_DOT * dt });
    }
  }
  return saidas;
}

/** Segundo Fôlego: abaixo de 30% da vida máxima, 1,5s de invencibilidade. */
export function checarSegundoFolego(vida: number, vidaMax: number): number {
  if (segundoFolegoAtivo && !segundoFolegoGasto && vidaMax > 0 && vida < vidaMax * 0.3) {
    segundoFolegoGasto = true;
    return 1.5;
  }
  return 0;
}

/** Passo Fantasma: inimigos atravessados pelo dash levam dano uma vez por dash. */
export function danoPassoFantasma(inimigo: object, dashAtivo: boolean): number {
  if (!passoFantasmaAtivo || !dashAtivo) return 0;
  if (dashAcertados.has(inimigo)) return 0;
  dashAcertados.add(inimigo);
  return PASSO_FANTASMA_DANO;
}

/** Dash novo limpa a lista de já-acertados. Chamado ao ativar o dash. */
export function limparDashFantasma(): void {
  dashAcertados.clear();
}

export function ativarEspecialPerk(id: string): void {
  if (id === 'pistola_incandescente') incandescenteAtivo = true;
  if (id === 'segundo_folego') segundoFolegoAtivo = true;
  if (id === 'passo_fantasma') passoFantasmaAtivo = true;
  if (id === 'sortudo') sortudoAtivo = true;
}

export function resetPerks(): void {
  incandescenteAtivo = false;
  tirosIncandescentes = 0;
  segundoFolegoAtivo = false;
  segundoFolegoGasto = false;
  passoFantasmaAtivo = false;
  dashAcertados.clear();
  sortudoAtivo = false;
  queimando.clear();
}

// ─── Save anterior à escada ───────────────────────────────────────────────
// Os 19 UPGRADES que a loja listava em bloco viraram degraus. Quem jogou antes
// tem esses ids gravados no save, e sem esta tradução o continue devolveria o
// jogador sem as melhorias que ele pagou.
//
// NÃO é catálogo: sem preço, sem nome de exibição e nada compra por aqui — só
// traduz o que já foi comprado. Chaveado por id e por nome de exibição, porque
// o save mais antigo gravava o nome.
//
// O efeito é aplicado direto, sem passar pela escada. Traduzir para degraus
// perderia poder (Dano +50% viraria +40%) e, pior, deixaria os degraus de baixo
// compráveis de novo: o `requires` só olha o degrau anterior.

/** Efeito de uma compra antiga, pelo id que o save gravou. */
export interface CompraLegada {
  /** Id canônico — é ele que volta para o save, mesmo vindo do nome. */
  id: string;
  effect: string;
  value: number;
}

/** [id, nome de exibição, efeito, valor] — a ordem é a do config removido. */
const COMPRAS_LEGADAS: [string, string, string, number][] = [
  ['vida25', 'Vida +25', 'health', 25],
  ['vel15', 'Velocidade +15%', 'speed', 0.15],
  ['dano25', 'Dano +25%', 'damage', 0.25],
  ['escudo', 'Escudo', 'shield', 1],
  ['vida50', 'Vida +50', 'health', 50],
  ['magnetismo', 'Magnetismo', 'magnet', 1],
  ['crit2', 'Crítico 2x', 'crit', 0.25],
  ['pierce', 'Pierce', 'pierce', 1],
  ['armadura', 'Armadura', 'armor', 0.15],
  ['regen', 'Regeneração', 'regen', 1],
  ['vida100', 'Vida +100', 'health', 100],
  ['vel25', 'Velocidade +25%', 'speed', 0.25],
  ['dano50', 'Dano +50%', 'damage', 0.50],
  ['escudo2', 'Escudo Duplo', 'shield', 2],
  ['armadura2', 'Armadura Pesada', 'armor', 0.25],
  ['crit3', 'Crítico 3x', 'crit', 0.40],
  ['pierce2', 'Pierce Duplo', 'pierce', 2],
  ['regen2', 'Regen Avançada', 'regen', 2],
  ['recarga', 'Recarga Rápida', 'reloadSpeed', 0.3],
];

export const PERK_LEGADO: Record<string, CompraLegada> = {};
for (const [id, nome, effect, value] of COMPRAS_LEGADAS) {
  PERK_LEGADO[id] = { id, effect, value };
  PERK_LEGADO[nome] = { id, effect, value };
}