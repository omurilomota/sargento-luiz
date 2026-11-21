/**
 * A prova da AMBIÊNCIA (M1): o lugar soa como o lugar. O contrato de
 * fiação: cada fase arma exatamente os sons dela — o Porto é gaivota e
 * água, a Caverna goteja, o Espaço é drone e alarme, e o Hospital fica em
 * silêncio (não tem mar, caverna nem estação).
 *
 * O TOCAR de fato (AudioContext headless suspenso) não é o que se prova
 * aqui — o relógio e a agenda são o lado determinístico; o som em si é a
 * hora do jogador ouvir.
 *
 * Uso: node tools/m1-ambiente-proof.mjs  (via `npm run ambiente`)
 */
import { chromium } from 'playwright';
import { abrirJogo, irParaFase } from './bot.mjs';

const problemas = [];
const nota = (msg) => { problemas.push(msg); console.log(`  FALHA ${msg}`); };

const { page, erros, fechar } = await abrirJogo({ chromium });

const CONTRATOS = [
  { idx: 0, fase: 'Cidade em Ruínas', espera: ['vento'] },
  { idx: 12, fase: 'Porto', espera: ['agua_cais', 'gaivota'] },
  { idx: 4, fase: 'Caverna', espera: ['gotejamento'] },
  { idx: 6, fase: 'Pátio de Trens', espera: ['apito', 'maquinario'] },
  { idx: 14, fase: 'Espaço', espera: ['alarme_estacao', 'drone_vazio'] },
  { idx: 3, fase: 'Hospital de Campanha', espera: [] }, // silêncio de projeto
];

for (const { idx, fase, espera } of CONTRATOS) {
  await irParaFase(page, idx);
  const agenda = await page.evaluate(() => window.__ashfall.ambiente());
  const chaves = agenda.map(a => a.chave).sort();
  const rotulo = espera.length === 0 ? 'silêncio' : espera.join(' + ');
  console.log(`${fase.padEnd(20)} agenda: [${chaves.join(', ')}] — esperado: ${rotulo}`);
  if (JSON.stringify(chaves) !== JSON.stringify(espera)) {
    nota(`${fase}: agenda [${chaves}] ≠ esperado [${espera}]`);
  }
  // o primeiro disparo vem na janela curta: ninguém além do gaivota pode
  // demorar mais que ~28s (a janela mínima da tabela)
  for (const a of agenda) {
    if (a.resta < 0 || a.resta > 28) nota(`${fase}: ${a.chave} armado em ${a.resta}s (fora da janela)`);
  }
}

if (erros.length) nota(`erros de página: ${[...new Set(erros)].join('; ')}`);

console.log(problemas.length === 0
  ? '\nOK — cada fase soa como o lugar: o Porto tem gaivota, a Caverna goteja, o Hospital silencia'
  : `\nFALHA — ${problemas.length} problema(s)`);
await fechar();
process.exit(problemas.length === 0 ? 0 : 1);
