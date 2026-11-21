/**
 * A MEDIÇÃO da economia (M3): "economia medida contra o modelo do árbitro
 * (achar a torneira)".
 *
 * O modelo (fonte única: src/systems/economia.ts) já enxergou as duas
 * torneiras que tinha — os TITÃS (3× moedas) e a COLETA da Fábrica — e a
 * escada foi repostta (razão 2,90× no meio da banda). Esta prova é a
 * contraparte EM NAVEGADOR, e mede o lado do SPAWN:
 *
 *   gerado por abate (medido)  ×  modelo por abate (prometido)
 *
 * A primeira versão media a carteira do bot — e o bot de dodge NUNCA volta
 * pra pegar moeda (realizado 0 em 45s): coleta é comportamento do jogador,
 * não torneira. Gerado é o que o modelo descreve, e se normaliza pelos
 * abates: kills × (coinDrop médio da fase × 0,6 × coleta). Banda 0,4-2,5×:
 * a sorte do sorteio de TIPO por vaga é ruído, e o titã multiplica um
 * abate por 3 (o modelo já conta isso na média da fase, com margem).
 *
 * Uso: node tools/m3-economia-proof.mjs  (via `npm run m3economia`)
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase, criarBot } from './bot.mjs';

const FASES_MEDIDAS = [0, 1, 2, 4]; // Cidade, Rodovia, Floresta, Caverna — onde a régua mostra o bot ABATENDO
const SEGUNDOS = 45;
const problemas = [];
const nota = (msg) => { problemas.push(msg); console.log(`  FALHA ${msg}`); };

const { page, erros, fechar } = await abrirJogo({ chromium });

// o Chrome headless não entrega quadros para página parada (arvore-onda)
await page.evaluate(() => {
  window.__quadros = 0;
  const step = () => { window.__quadros++; requestAnimationFrame(step); };
  requestAnimationFrame(step);
});

const cfg = await page.evaluate(() => window.__ashfall.config());
const bot = criarBot(page);

console.log('fase                 abates  gerado  esperado(por abate)  gerado/esperado');
for (const idx of FASES_MEDIDAS) {
  await irParaFase(page, idx);

  const antes = await page.evaluate(() => ({
    moedas: window.__ashfall.moedasGeradas(),
    kills: window.__ashfall.telemetria().kills,
  }));

  await bot.medir(SEGUNDOS);

  const depois = await page.evaluate(() => ({
    moedas: window.__ashfall.moedasGeradas(),
    kills: window.__ashfall.telemetria().kills,
  }));

  const abates = depois.kills - antes.kills;
  const gerado = depois.moedas - antes.moedas;
  // modelo por abate da fase: a renda da fase ÷ vagas (cota de ondas +
  // chefe) — o mesmo número que o árbitro usa, por vaga. O titã e a
  // coleta já estão na renda (fonte única) e diluem na média.
  const modeloFase = cfg.rendaDeAbate[idx];
  const waves = cfg.fases[idx].waves;
  let vagas = 1; // chefe
  for (let w = 0; w < waves; w++) vagas += 4 + w * 2;
  const esperado = (modeloFase / vagas) * abates;
  const razao = esperado > 0 ? (gerado / esperado).toFixed(2) : '—';

  console.log(`${cfg.fases[idx].name.padEnd(20)} ${String(abates).padStart(5)}  ${String(gerado).padStart(6)}  ${esperado.toFixed(1).padStart(18)}  ${String(razao).padStart(12)}×`);

  // As FOLGAS conhecidas do modelo, medidas nesta prova (2026-10-16): o
  // `floor()` da moeda pequena (coinDrop 3 paga 1, não 1,8) e o abate por
  // stomp SEM prêmio (`killEnemy(e, false)` não gera moeda) empurram o
  // gerado para BAIXO do prometido — 0,3×-0,5× é a folga, não vazamento.
  // Abaixo de 0,3× com amostra digna (>=8 abates) há vazamento de verdade;
  // acima de 2,5×, torneira de verdade.
  if (abates < 8) {
    console.log(`    (amostra pequena: ${abates} abates — fase não afirma nada)`);
  } else if (esperado > 0 && (gerado / esperado < 0.3 || gerado / esperado > 2.5)) {
    nota(`${cfg.fases[idx].name}: gerado ${razao}× do esperado com ${abates} abates — torneira (>2,5) ou vazamento (<0,3)`);
  }
}

if (erros.length) nota(`erros de página: ${[...new Set(erros)].join('; ')}`);

console.log(problemas.length === 0
  ? '\nOK — a moeda gerada acompanha o modelo por abate (banda 0,3-2,5× com a folga do floor e do stomp)'
  : `\nFALHA — ${problemas.length} problema(s)`);
await fechar();
process.exit(problemas.length === 0 ? 0 : 1);
