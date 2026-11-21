/**
 * Sistema de combo builds.
 *
 * Detecta sinergias entre arma atual e os degraus comprados na escada.
 *
 * Os `check` leem ID de DEGRAU da escada (`perks.ts`), nunca nome de exibição e
 * nunca id de compra antiga: `PERK_LADDER` produz `dano_t1`, `mente_t3`,
 * `corpo_t3`… e nada mais. Os 8 combos originais ainda exigiam `crit2`,
 * `dano25`, `pierce`, `vel15`, `magnetismo` — ids do catálogo de 19 upgrades que
 * a escada substituiu — e por isso 7 dos 8 só disparavam em save antigo.
 * `semOrfao.test.ts` e `gear.test.ts` travam isso.
 *
 * Dois combos saíram junto, e é decisão registrada (DECISIONS #127):
 * - Arco Elétrico exigia `pierce` — a escada não tem eixo de perfurante;
 * - Imanência exigia `magnetismo` — a escada não tem eixo de ímã.
 * Nenhum dos dois volta sem o eixo correspondente. Deixá-los com `check: false`
 * seria um combo listado no jogo que nunca dispara.
 *
 * O primeiro combo CRUZADO entre ramos é a "Pólvora Instável" (Sprint 6):
 * exige degrau de DOIS ramos ao mesmo tempo (`exigeTodos`) e o efeito tem
 * troca real — mais dano por menos vida. Combo que só soma não é escolha.
 */

import { getCurrentWeapon } from '../weapons';
import { getPurchasedUpgrades } from '../ui/shop';
import { PALETTE } from '../core/palette';

/** Representa um combo ativo */
export interface ActiveCombo {
  /** Nome do combo */
  name: string;
  /** Descrição do efeito */
  description: string;
  /** Cor do indicador */
  color: string;
  /** Multiplicador de dano extra (1 = sem bônus) */
  damageBonus: number;
  /** Multiplicador de velocidade de tiro extra (1 = sem bônus) */
  cooldownMult: number;
  /** Multiplicador de vida extra (1 = sem bônus) */
  healthBonus: number;
}

/** Lista de definições de combos */
export const COMBO_DEFINITIONS: {
  name: string;
  description: string;
  color: string;
  damageBonus: number;
  cooldownMult: number;
  healthBonus: number;
}[] = [
  {
    name: 'Tiro Longo',
    description: 'Sniper + Dano: +50% dano crítico',
    color: PALETTE.stone,
    damageBonus: 1.5,
    cooldownMult: 1,
    healthBonus: 1,
  },
  {
    name: 'Carvão',
    description: 'Metralhadora + Dano: +43% de cadência',
    color: PALETTE.danger,
    damageBonus: 1,
    cooldownMult: 0.7,
    healthBonus: 1,
  },
  {
    name: 'Couro Duplo',
    description: 'Escudo + Vida: +25% vida máxima',
    color: PALETTE.moss,
    damageBonus: 1,
    cooldownMult: 1,
    healthBonus: 1.25,
  },
  {
    name: 'Rearme Pesado',
    description: 'RPG/Granada + Dano: +40% dano explosivo',
    color: PALETTE.terracotta,
    damageBonus: 1.4,
    cooldownMult: 1,
    healthBonus: 1,
  },
  {
    name: 'Congelante',
    description: 'Gel + Velocidade: +20% dano',
    color: PALETTE.mustard,
    damageBonus: 1.2,
    cooldownMult: 1,
    healthBonus: 1,
  },
  {
    name: 'Pancada',
    description: 'Shotgun + Dano: +35% dano',
    color: PALETTE.mustard,
    damageBonus: 1.35,
    cooldownMult: 1,
    healthBonus: 1,
  },
  {
    name: 'Pólvora Instável',
    description: 'Dano T5 + Mente T4: +30% dano, −10% vida máxima',
    color: PALETTE.danger,
    damageBonus: 1.3,
    cooldownMult: 1,
    healthBonus: 0.9,
  },
];

/**
 * O `check` vem da arma + dos degraus de `COMBO_CHECKS`, na MESMA ordem das
 * definições acima. Uma lista só de verdade: o par (definição, `check`) que se
 * desalinhasse daria um combo com o nome de um e o efeito de outro em silêncio.
 */
export const ARMAS_DO_COMBO: Record<string, string[]> = {
  'Tiro Longo': ['Sniper'],
  'Carvão': ['Metralhadora'],
  'Rearme Pesado': ['RPG', 'Granada'],
  'Congelante': ['Gel'],
  'Pancada': ['Shotgun'],
};

function disparado(def: (typeof COMBO_DEFINITIONS)[number], check: typeof COMBO_CHECKS[number], arma: string, perks: string[]): boolean {
  if (!perks.some(id => check.ids.includes(id))) return false;
  // combo cruzado entre ramos: `exigeTodos` é o AND que o `some` de cima não
  // é — um degrau de cada ramo, comprado ao mesmo tempo
  if (check.exigeTodos && !check.exigeTodos.every(id => perks.includes(id))) return false;
  const armas = ARMAS_DO_COMBO[def.name];
  // sem entrada em ARMAS_DO_COMBO = combo sem exigência de arma (Couro Duplo,
  // Pólvora Instável)
  return !armas || armas.includes(arma);
}

/**
 * Teto do bônus de vida vindo de combos empilhados (ver getComboHealthBonus).
 *
 * Dois combos hoje não exigem arma — Couro Duplo e Pólvora Instável — e
 * empilham entre si (1.25 × 0.9 = 1.125). O teto é a rede: qualquer combo sem
 * arma que volte a somar vida não pode furar 1.5. E como Pólvora SUBTRAI, o
 * produto pode ser < 1 — o teto corta para cima, nunca empurra para baixo.
 */
const COMBO_HEALTH_CAP = 1.5;
/**
 * Teto de dano e cadência.
 *
 * Só o health tinha teto, porque era o único combo que não exigia arma. Dano e
 * cadência eram "naturalmente" limitados por cada combo exigir uma arma
 * diferente e só uma estar na mão — mas quatro combos agora partilham o mesmo
 * degrau (`dano_t3`), e com a Imanência fora o teto de vida ficou opressor
 * demais: um build normal passava a ser punido. Mantido porque combos por
 * família de peça podem vir simultâneos, e 1.5 × 1.4 × 1.2 passaria de 2.4 sem
 * nenhum limite no meio.
 */
const COMBO_DAMAGE_CAP = 2.2;
const COMBO_COOLDOWN_FLOOR = 0.5;

/**
 * Os ids que cada combo exige, declarados uma vez só e consumidos pelo `check`.
 *
 * O `check` é uma função: um teste que só a chama não prova que ela aponta
 * para a escada — só que "algum combo disparou". Esta é a lista que a trava
 * `gear.test.ts` e a porta `semOrfao` leem, e declará-la aqui impede que o
 * `check` e a trava contem histórias diferentes.
 */
export const COMBO_CHECKS: { nome: string; ids: string[]; exigeArma: boolean; exigeTodos?: string[] }[] = [
  { nome: 'Tiro Longo',    ids: ['dano_t3'],              exigeArma: true },
  { nome: 'Carvão',        ids: ['dano_t3'],              exigeArma: true },
  { nome: 'Couro Duplo',  ids: ['corpo_t3', 'corpo_t1'], exigeArma: false },
  { nome: 'Rearme Pesado', ids: ['dano_t3'],              exigeArma: true },
  { nome: 'Congelante',    ids: ['pernas_t1'],            exigeArma: true },
  { nome: 'Pancada',       ids: ['dano_t3'],              exigeArma: true },
  { nome: 'Pólvora Instável', ids: ['dano_t5'], exigeArma: false, exigeTodos: ['mente_t4'] },
];

/** Combos ativos no momento */
let activeCombos: ActiveCombo[] = [];

/**
 * Verifica e atualiza os combos ativos baseado na arma e nos degraus atuais.
 *
 * `COMBO_DEFINITIONS` e `COMBO_CHECKS` andam na MESMA ordem e pelo mesmo nome —
 * é isso que liga o efeito ao requisito. Um par desalinhado daria um combo com o
 * nome de um e a condição de outro, em silêncio.
 */
export function updateCombos(): void {
  const weapon = getCurrentWeapon();
  const perks = getPurchasedUpgrades();  // ids de degrau, nunca nome de exibição
  activeCombos = [];

  for (const [i, def] of COMBO_DEFINITIONS.entries()) {
    const check = COMBO_CHECKS[i];
    if (check.nome !== def.name) continue;  // listas desencontradas: não dispara nada
    if (disparado(def, check, weapon.name, perks)) {
      activeCombos.push({
        name: def.name,
        description: def.description,
        color: def.color,
        damageBonus: def.damageBonus,
        cooldownMult: def.cooldownMult,
        healthBonus: def.healthBonus,
      });
    }
  }
}

/**
 * Retorna os combos ativos.
 */
export function getActiveCombos(): ActiveCombo[] {
  return activeCombos;
}

/**
 * Retorna o bônus de dano total dos combos, com teto.
 */
export function getComboDamageBonus(): number {
  const bruto = activeCombos.reduce((mult, c) => mult * c.damageBonus, 1);
  return Math.min(COMBO_DAMAGE_CAP, bruto);
}

/**
 * Retorna o multiplicador de cooldown dos combos, com piso.
 *
 * Multiplica o intervalo entre tiros (main.ts), então um valor MENOR que 1
 * dispara mais rápido: 0.7 = 30% de espera a menos = +43% de cadência.
 */
export function getComboCooldownMult(): number {
  const bruto = activeCombos.reduce((mult, c) => mult * c.cooldownMult, 1);
  return Math.max(COMBO_COOLDOWN_FLOOR, bruto);
}

/** Teto de dano. Exportado para o teste travar o limite. */
export const COMBO_LIMITE_DANO = COMBO_DAMAGE_CAP;
/** Piso de cadência. Exportado para o teste travar o limite. */
export const COMBO_LIMITE_CADENCIA = COMBO_COOLDOWN_FLOOR;
/** Teto de vida. Exportado para o teste travar o limite. */
export const COMBO_LIMITE_VIDA = COMBO_HEALTH_CAP;

/**
 * Retorna o bônus de vida dos combos, com teto.
 *
 * Couro Duplo (1.25) era o único sem exigência de arma e empilhava com a
 * Imanência (1.30) em 1.625 — 62% de vida máxima de graça. Com a Imanência fora,
 * o teto está ocioso (1.25 < 1.5) e foi mantido como rede: qualquer combo sem
 * arma que volte precisa bater nele.
 */
export function getComboHealthBonus(): number {
  const bruto = activeCombos.reduce((mult, c) => mult * c.healthBonus, 1);
  return Math.min(COMBO_HEALTH_CAP, bruto);
}

/**
 * Reseta os combos ativos.
 */
export function resetCombos(): void {
  activeCombos = [];
}
