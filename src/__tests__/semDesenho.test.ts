import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Portão de desenho: `renderer.ts` não desenha arte com código.
 *
 * Regra 15 do AGENTS.md: o visual vem de asset. `arc`/`fillRect`/`ellipse`/
 * gradiente só são legítimos como (a) chrome de UI — painéis, barras, fades —,
 * (b) efeito de feedback — sombra, aura, partícula, rastro — ou (c) FALLBACK
 * de sprite que não carregou, declarado em comentário.
 *
 * A terceira exceção é a que degrada: sem portão, "fallback" vira o visual
 * pretendido e ninguém percebe, porque funciona. Este teste congela o estado
 * auditado: 65 sites, 62 permitidos com porquê, 3 de débito declarado com
 * teto. Débito pode encolher; crescer (ou aparecer função nova desenhando)
 * reprova aqui.
 *
 * O débito encolheu duas vezes: a cena de cutscene (5 sites) virou tile
 * prerenderizado em `terrain.ts` (`buildCutsceneBackdrop`), e moeda e
 * power-up (4 sites) viraram sprite da Kenney Platformer Art Deluxe — os dois
 * ficaram na PERMITIDAS como o que são hoje: fallback atrás de asset.
 * Restam os 3 sites de `drawBots`.
 *
 * O total subiu de 58 para 65 em 2026-11 com `drawFimLocal` (tela de fim do
 * versus local). Os 7 são chrome: fundo e as duas barras de vida lado a lado.
 *
 * Subiu para 67 no mesmo mês com `drawPlayer2`: sombra em elipse (efeito, a
 * mesma do `drawPlayer`) e um círculo que só corre se a sprite do pack não
 * carregar — fallback declarado. O corpo em si é sprite do Kenney, e o rótulo
 * "P2" é texto.
 *
 * Este portão NÃO substitui o olho: os harnesses visuais (`npm run visual`,
 * `npm run sessao`) continuam obrigatórios para mexer em render (regra 16).
 */

const RENDERER = join(__dirname, '..', 'systems', 'renderer.ts');

/**
 * Funções cujas chamadas de desenho são legítimas, com o porquê.
 * Adicionar item aqui é editar o teste — a decisão fica no diff, de propósito.
 */
const PERMITIDAS: Record<string, string> = {
  drawPlayer: 'sombra, fulgor de morte, fallback de sprite e auras de status',
  drawPlayer2: 'sombra em elipse e o círculo de fallback do sprite do P2 — o corpo é sprite do pack',
  drawEnemies: 'sombra em elipse, anel de chefe, flash de dano e barras de vida',
  drawNPCs: 'sombra, fallback de sprite, barra de vida e balão de fala',
  drawCutscene: 'letterbox, painel de escolha e fallback de retrato (comentado no código)',
  drawDialogo: 'chrome da caixa pequena de diálogo da Fábrica (H2): a faixa na base da tela — UI de diálogo, a mesma categoria dos painéis da cutscene; o retrato é o mesmo sprite',
  drawMenu: 'chrome do menu (painéis, foco, botões)',
  drawMenuBackground: 'fundo do menu — chapado + um gradiente, decisão de UI',
  drawSettings: 'chrome do painel de configurações',
  drawSettingsButton: 'chrome do botão de configurações',
  drawPause: 'chrome da pausa',
  drawEndScreen: 'chrome da tela de fim',
  drawFimLocal: 'chrome da tela de fim do versus: fundo e as duas barras de vida, lado a lado. É UI de comparação — a mesma categoria das barras de drawEnemies/drawNPCs, não arte do mundo',
  drawCredits: 'chrome dos créditos',
  drawPhaseTransition: 'véu da transição de fase',
  drawParticles: 'fallback de sprite (o visual é o Kenney Particle Pack)',
  drawBullets: 'rastro na cor da arma e fallback de sprite (comentado)',
  drawEnemyShape: 'função de fallback declarada para sprite ausente',
  drawCoins: 'sprite da moeda; o arc de baixo é o fallback (comentado no código)',
  drawPowerUps: 'sprite da gema + símbolo de UI; o arc é só o fallback',
};

/**
 * Débito conhecido: arte pretendida que ainda é desenhada. Cada um tem teto —
 * o teto existe para o débito não engrossar enquanto ninguém o paga.
 */
const DEBITO: Record<string, { teto: number; motivo: string }> = {
  drawBots: { teto: 3, motivo: 'corpo do bot é círculo — decisão de visual pendente (FUTURO §1.2)' },
};

/**
 * Total atual auditado. Subir este número é uma decisão consciente.
 *
 * 58 → 65 pela tela de fim do versus local (FUTURO §1.2): fundo + duas barras
 * de vida com a moldura. São 7 sítios de chrome de tela, todos dentro de
 * `drawFimLocal`, e a alternativa seria uma barra desenhada como sprite — que
 * é pior: barra de vida é UI, muda de tamanho com a tela, e sprite para isso é
 *Shapesmith errado.
 *
 * 65 → 67 pelo P2 do versus (FUTURO §1.10): sombra em elipse e o círculo de
 * fallback, os mesmos dois que `drawPlayer` já tem. O corpo continua vindo do
 * pack — o que muda é que agora existe.
 *
 * 67 → 70 pelo TITÃ (T1): anel mostarda no chão (o mesmo vocabulário do anel
 * de chefe, uma escala abaixo) + a barra de vida de 2 fillRect. Sem a barra,
 * 3× a vida da onda é invisível: o jogador não entende por que o corpo grande
 * não cai. Está dentro de `drawEnemies`, cuja permissão já cobre "anel de
 * chefe e barras de vida" — o titã estende o vocabulário, não inventa um.
 *
 * 70 → 72 pela CAIXA DE DIÁLOGO PEQUENA (H2, a Fábrica do Rogério): a
 * faixa na base da tela (fundo + moldura) — UI de diálogo, a mesma
 * categoria dos painéis da cutscene. O retrato é o mesmo sprite das cenas.
 */
const TOTAL_ATUAL = 72;

const METODOS = 'arc|ellipse|fillRect|strokeRect|roundRect|createRadialGradient|createLinearGradient';
const CHAMADA = new RegExp(`\\.(?:${METODOS})\\(`);
const CHAMADA_G = new RegExp(`\\.(?:${METODOS})\\(`, 'g');

interface Site {
  funcao: string;
  linha: number;
  quantidade: number;
}

function extrairSites(fonte: string): { sites: Site[]; funcoes: Set<string> } {
  const linhas = fonte.split('\n');
  const defs: { linha: number; nome: string }[] = [];
  linhas.forEach((l, i) => {
    const m = /^(?:export\s+)?(?:function|const)\s+(\w+)/.exec(l);
    if (m) defs.push({ linha: i + 1, nome: m[1] });
  });

  const funcaoDa = (n: number): string => {
    let atual = '(fora de função)';
    for (const d of defs) {
      if (d.linha <= n) atual = d.nome;
      else break;
    }
    return atual;
  };

  const sites: Site[] = [];
  linhas.forEach((l, i) => {
    // Comentário não desenha: sem isto, um doc que cita `ctx.arc()` para
    // explicar o que o código antigo fazia contava como arte de programador
    // (aconteceu duas vezes, e é por isso que o total caiu de 60 para 58).
    const t = l.trim();
    if (t.startsWith('*') || t.startsWith('//') || t.startsWith('/*')) return;
    const quantidade = (l.match(CHAMADA_G) ?? []).length;
    if (quantidade > 0) sites.push({ funcao: funcaoDa(i + 1), linha: i + 1, quantidade });
  });
  return { sites, funcoes: new Set(defs.map((d) => d.nome)) };
}

const { sites, funcoes } = extrairSites(readFileSync(RENDERER, 'utf8'));
const TOTAL = sites.reduce((s, site) => s + site.quantidade, 0);

describe('semDesenho: renderer não desenha arte com código', () => {
  it('a extração está viva (o teste morde)', () => {
    // Se o regex quebrar, `sites` esvazia e o portão aprovaria tudo em silêncio.
    expect(TOTAL).toBeGreaterThanOrEqual(55);
  });

  it('toda chamada pertence a uma função auditada', () => {
    const desconhecidas = sites
      .filter((s) => !(s.funcao in PERMITIDAS) && !(s.funcao in DEBITO))
      .map((s) => `${s.funcao}:${s.linha}`);
    expect(
      desconhecidas,
      `desenho fora das listas: ${desconhecidas.join(', ')}. ` +
      `Se é arte de verdade, use asset; se é UI/efeito/sombra/fallback, ` +
      `adicione a função à PERMITIDAS com o porquê (este arquivo).`,
    ).toEqual([]);
  });

  it('o débito não cresce (teto por função)', () => {
    for (const [funcao, { teto, motivo }] of Object.entries(DEBITO)) {
      const quantidade = sites.filter((s) => s.funcao === funcao).reduce((s, x) => s + x.quantidade, 0);
      expect(
        quantidade,
        `${funcao} tem ${quantidade} desenhos, acima do teto ${teto} — ${motivo}`,
      ).toBeLessThanOrEqual(teto);
    }
  });

  it('nenhum desenho novo apareceu fora da conta (total congelado)', () => {
    expect(
      TOTAL,
      `total de desenhos subiu para ${TOTAL} (teto ${TOTAL_ATUAL}). ` +
      `Movimento novo entra pela lista com porquê, não somando pontos.`,
    ).toBeLessThanOrEqual(TOTAL_ATUAL);
  });

  it('as listas apontam para funções que existem (renomear não apaga o débito)', () => {
    for (const nome of [...Object.keys(PERMITIDAS), ...Object.keys(DEBITO)]) {
      expect(funcoes.has(nome), `lista cita função que não existe: ${nome}`).toBe(true);
    }
  });
});
