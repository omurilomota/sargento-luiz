/**
 * Progressão de XP e nível do Sargento Luiz.
 *
 * O spawner já calculava um `threat` por inimigo e jogava fora, e o score
 * existia mas não virava nada. Aqui o XP é o score acumulado: cada nível custa
 * mais que o anterior (curva de patamar) e devolve pontos de talento, gastos na
 * árvore de 3 galhos da loja (Mente/Armas/Movimentação).
 *
 * Estado corre por partida e o total de pontos gastos persiste no save — morrer
 * não devolve os pontos já investidos, mas também não apaga o nível.
 */

/** XP necessário para sair do nível `n` e ir para o `n+1` (1-indexed). */
export function xpParaProximoNivel(nivel: number): number {
  // Curva de patamar: 500, 1000, 1700, 2500... Cada nível pesa ~40% mais.
  return Math.round(500 * Math.pow(1.4, nivel - 1));
}

/** Dado um total de XP, devolve o nível alcançado (1-indexed). */
export function nivelDeXp(xp: number): number {
  let nivel = 1;
  let resto = xp;
  while (resto >= xpParaProximoNivel(nivel)) {
    resto -= xpParaProximoNivel(nivel);
    nivel++;
  }
  return nivel;
}

/** XP restante dentro do nível atual e o XP que o nível atual exige. */
export function progressoNoNivel(xp: number): { atual: number; necessario: number } {
  let nivel = 1;
  let resto = xp;
  while (resto >= xpParaProximoNivel(nivel)) {
    resto -= xpParaProximoNivel(nivel);
    nivel++;
  }
  return { atual: resto, necessario: xpParaProximoNivel(nivel) };
}

/** Os 3 galhos de talento. `efeito` encaixa no `applyUpgrade` já existente. */
export const TALENTOS: { id: string; galho: 'mente' | 'armas' | 'movimento'; name: string; effect: string; value: number; custo: number }[] = [
  { id: 'mente_crit', galho: 'mente', name: 'Mente: Crítico', effect: 'crit', value: 0.2, custo: 1 },
  { id: 'mente_regen', galho: 'mente', name: 'Mente: Regeneração', effect: 'regen', value: 1, custo: 1 },
  { id: 'armas_dano', galho: 'armas', name: 'Armas: Dano', effect: 'damage', value: 0.2, custo: 1 },
  { id: 'armas_pierce', galho: 'armas', name: 'Armas: Perfuração', effect: 'pierce', value: 1, custo: 1 },
  { id: 'mov_vel', galho: 'movimento', name: 'Movimento: Velocidade', effect: 'speed', value: 0.15, custo: 1 },
  { id: 'mov_vida', galho: 'movimento', name: 'Movimento: Vitalidade', effect: 'health', value: 30, custo: 1 },
];

/** Estado da progressão por partida. */
let xpTotal = 0;

/** Bônus de XP ao esvaziar uma onda. */
export const XP_BONUS_ONDA = 40;
/** Bônus de XP ao concluir a fase (antes da loja). */
export const XP_BONUS_FASE = 150;

/** Pontos de talento ganhos por nível e ainda não gastos. */
let pontosLivres = 0;

/** Ids de talento já comprados (persistem via save). */
let talentosComprados: string[] = [];

/** Soma XP (chamado a cada kill, com o valor do score). */
export function addXp(amount: number): number {
  const antes = nivelDeXp(xpTotal);
  xpTotal += amount;
  const depois = nivelDeXp(xpTotal);
  const ganhou = depois - antes;
  if (ganhou > 0) pontosLivres += ganhou;
  return ganhou;
}

export function getXp(): number { return xpTotal; }
export function getNivel(): number { return nivelDeXp(xpTotal); }
export function getPontosLivres(): number { return pontosLivres; }
export function getTalentos(): string[] { return talentosComprados; }

/** Compra um talento se houver ponto livre. @returns true se comprou. */
export function buyTalento(id: string): boolean {
  if (pontosLivres <= 0 || talentosComprados.includes(id)) return false;
  const t = TALENTOS.find((x) => x.id === id);
  if (!t) return false;
  pontosLivres--;
  talentosComprados.push(id);
  return true;
}

/**
 * Vende 1 ponto de talento não gasto (T4 — decisão do dono: por moedas, na
 * loja). O crédito em moedas fica com quem chama; aqui só o ponto sai — o
 * mesmo contrato do `buyTalento`, que não aplica efeito nenhum além do gasto.
 */
export function venderPonto(): boolean {
  if (pontosLivres <= 0) return false;
  pontosLivres--;
  return true;
}

/** Restaura talentos comprados a partir do save (sem gastar de novo). */
export function restoreTalentos(ids: string[]): void {
  talentosComprados = ids.filter((id) => TALENTOS.some((t) => t.id === id));
}

/**
 * Restaura o XP de uma sessão anterior (continue).
 *
 * O nível é recalculado do total, e os pontos livres são a diferença entre
 * níveis e talentos já comprados — o mesmo invariante do addXp/buyTalento
 * durante a partida.
 */
export function restoreXp(xp: number): void {
  xpTotal = Math.max(0, xp);
  pontosLivres = Math.max(0, nivelDeXp(xpTotal) - talentosComprados.length);
}

/** Zera a progressão de uma partida nova. */
export function resetProgress(): void {
  xpTotal = 0;
  pontosLivres = 0;
}
