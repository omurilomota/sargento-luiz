/**
 * Migração das chaves de save para SARGENTO LUIZ.
 *
 * O prefixo das chaves de localStorage já mudou duas vezes: nasceu
 * `ashfall.*` (nome antigo do jogo), virou `rios.*` na troca de marca e é
 * `luiz.*` desde que o protagonista passou a se chamar Luiz (2026-10-14).
 *
 * Sem isto, quem já jogou perde save, conquistas, diário, recordes, skins,
 * classe e preferências de volume. Roda uma vez no boot e é idempotente.
 */

const PREFIXO_NOVO = 'luiz.';

/** As duas gerações de prefixo que ainda podem existir no storage de alguém. */
const PREFIXOS_ANTIGOS = ['rios.', 'ashfall.'];

/** Sufixos das chaves que o jogo usa. */
export const CHAVES_MIGRADAS = [
  'save', 'completed', 'achievements', 'diary', 'leaderboard',
  'skins_unlocked', 'class', 'musicOn', 'sfxOn', 'volMaster', 'volMusic', 'volSfx',
];

/**
 * Copia cada `<antigo>.<chave>` para `luiz.<chave>` e apaga a antiga.
 *
 * @returns quantas chaves foram migradas (0 se não havia nada antigo)
 */
export function migrarChavesDeSave(): number {
  try {
    let movidas = 0;
    for (const sufixo of CHAVES_MIGRADAS) {
      const nova = PREFIXO_NOVO + sufixo;
      for (const antigo of PREFIXOS_ANTIGOS) {
        const antiga = antigo + sufixo;
        const valor = localStorage.getItem(antiga);
        if (valor === null) continue;
        // não sobrescreve um save mais novo que já exista
        if (localStorage.getItem(nova) === null) {
          localStorage.setItem(nova, valor);
        }
        localStorage.removeItem(antiga);
        movidas++;
      }
    }
    return movidas;
  } catch {
    // modo privado / storage bloqueado: o jogo continua, só sem save antigo
    return 0;
  }
}
