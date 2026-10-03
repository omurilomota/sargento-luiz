/**
 * Paleta do jogo.
 *
 * O jogo é pós-apocalíptico: nada de neon saturado. Tudo passa por
 * terra, cinza, ferrugem e verde morto. Este arquivo é a única fonte
 * de verdade das cores de UI — módulos de gameplay usam as cores
 * da própria entidade (inimigo, arma, bioma).
 */

export const PALETTE = {
  /** Fundo principal, quase preto e nunca azulado */
  void: '#08080a',
  /** Fundo de menus e telas cheias */
  bg: '#111',
  /** Títulos e números de destaque */
  title: '#c8b890',
  /** Texto principal */
  text: '#ccc',
  /** Texto secundário */
  textDim: '#666',
  /** Texto desabilitado */
  textOff: '#444',
  /** Accent principal: verde musgo (jogador P1) */
  moss: '#7a9a6a',
  /** Accent quente: terracota (dano, perigo quente) */
  terracotta: '#b07050',
  /** Accent neutro: mostarda (moedas, recompensas) */
  mustard: '#a08050',
  /** Accent frio: azul-pedra (jogador P2, gelo, storm) */
  stone: '#608090',
  /** Accent perigo: vermelho desbotado */
  danger: '#8b4040',
  /** Crítico: areia velha, nunca amarelo puro */
  crit: '#c8b890',
  /** Cinzento de painel / moldura */
  panel: 'rgba(0,0,0,0.55)',
  /** Borda de painel */
  panelEdge: 'rgba(200,184,144,0.18)',
} as const;

/** Cores antigas que o AGENTS.md proíbe. Guardadas aqui paramapear migrações. */
export const FORBIDDEN_COLORS: Record<string, string> = {
  '#2ecc71': PALETTE.moss,
  '#e74c3c': PALETTE.danger,
  '#3498db': PALETTE.stone,
  '#f39c12': PALETTE.mustard,
  '#9b59b6': '#7a6a8a',
  '#e67e22': PALETTE.terracotta,
  '#1abc9c': PALETTE.moss,
  '#2c3e50': '#2a2a2c',
  '#27ae60': '#5a7a4a',
  '#2980b9': '#4a6270',
  '#16a085': '#5a7a4a',
  '#c0392b': '#6b3030',
  '#6c3483': '#5a4a6a',
  '#f8c291': '#c8b890',
  '#d4ac0d': PALETTE.mustard,
  '#8e44ad': '#7a6a8a',
};
