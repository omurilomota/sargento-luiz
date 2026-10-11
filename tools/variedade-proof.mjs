/**
 * Prova da variedade de inimigos por fase (regra 16).
 *
 * A variação de silhueta é perceptual: o teste confirma que `grunt` sai com
 * corpos diferentes em fases diferentes, mas se o `drawEnemies` não receber o
 * índice da fase, a tabela existe e nunca chega na tela — que foi exatamente o
 * primeiro estado desta feature (o sprite foi ligado sem o parâmetro).
 *
 * Esta prova joga uma fase de cada vez, invoca inimigos e tira o print. O
 * `variedade-check.mjs` mede a tabela; este prova que a tela obedece.
 *
 * Uso: node tools/variedad-proof.mjs   (requer `npm run build` antes)
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist');
const SHOTS = join(RAIZ, 'tools', 'shots');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ogg': 'audio/ogg' };

const servidor = createServer(async (req, res) => {
  const u = (req.url || '/').split('?')[0];
  const p = join(DIST, u === '/' ? 'index.html' : decodeURIComponent(u));
  if (!existsSync(p)) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(await readFile(p));
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const porta = servidor.address().port;
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const erros = [];
page.on('pageerror', (e) => erros.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });

await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.keyboard.press('Enter');
await page.waitForTimeout(1000);
await page.keyboard.press('Backspace');
await page.waitForTimeout(600);
const c = await page.evaluate(() => window.__ashfall.cena());
if (c.ativa) { await page.keyboard.press('Backspace'); await page.waitForTimeout(600); }

// 3 fases de biomas bem diferentes: Cidade (zumbi), Caverna (pedra), Espaço (aço).
// O TIPO é o mesmo nas 3 — a prova é sobre a variação do mesmo inimigo por
// fase, que é a promessa da feature.
const FASES = [0, 2, 7];
const TIPO_PROVA = 'grunt';
const vistos = [];

for (const fase of FASES) {
  await page.evaluate((f) => window.__ashfall.irParaFase(f), fase);
  await page.waitForTimeout(700);
  const cen = await page.evaluate(() => window.__ashfall.cena());
  if (cen.ativa) { await page.keyboard.press('Backspace'); await page.waitForTimeout(600); }
  // Inimigo FIXO por fase, para a comparação ser entre o mesmo tipo: deixar o
  // spawner-sortear comparava `grunt` na Cidade contra `drone` no Espaço e o
  // harness acusava "nada variou" com a tabelanakém errada. `spawnarInimigo`
  // é determinístico — a prova mede a tabela, não a sorte do spawner.
  await page.evaluate(() => window.__ashfall.matarTodos());
  await page.evaluate((t) => window.__ashfall.spawnarInimigo(t, 120, 0), TIPO_PROVA);
  await page.waitForTimeout(900);
  const info = await page.evaluate(() => {
    const f = window.__ashfall.fase();
    return { fase: f.fase, indice: f.indice, tipos: f.tipos, inimigos: f.inimigos };
  });
  const personagens = await page.evaluate(() => window.__ashfall.personagensNaTela());
  // o corpo por TIPO é capturado AQUI, durante a visita: leer depois do loop
  // devolveria o estado da ÚLTIMA fase para todas, e o Map veria "grunt sempre
  // manBlue" com a tabela perfeita.
  const corposDaFase = await page.evaluate(() => window.__ashfall.personagensPorTipo());
  // a câmera segue o jogador, e o spawner joga longe: sem travar a câmera no
  // inimigo mais próximo o print sai do campo vazio (foi o primeiro estado
  // desta prova — a variação estava certa e o screenshot não mostrava nada)
  await page.evaluate(() => window.__ashfall.centralizarNoInimigo());
  // o print saía com a vinheta de dano vermelha quando o inimigo encosta (o
  // `centralizarNoInimigo` põe o jogador a 60px dele, e 60px é distância de
  // golpe). Sem curar, a variação estava certa na tela e invisível no PNG.
  await page.evaluate(() => window.__ashfall.curar());
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__ashfall.centralizarNoInimigo());
  await page.waitForTimeout(300);
  vistos.push({ ...info, personagens, corposDaFase });
  await page.screenshot({ path: join(SHOTS, `variedade-fase${info.indice + 1}.png`) });
  console.log(`fase ${info.indice + 1} (${info.fase}): ${info.inimigos} inimigos, tipos [${info.tipos.join(', ')}]`);
  console.log(`  silhuetas em tela: [${personagens.join(', ')}]`);
}

console.log('─'.repeat(56));
const todas = vistos.flatMap(v => v.personagens);
console.log(`silhuetas vistas: [${[...new Set(todas)].join(', ')}]`);

const problemas = [];
if (vistos.some(v => v.personagens.length === 0)) {
  problemas.push('alguma fase ficou sem inimigo na tela — o print não prova nada');
}
// O critério NÃO é "N silhuetas distintas": com 3 fases, o máximo natural é 3 e
// um piso de 4 seria impossível. O que a feature promete é o MESMO tipo com
// corpos diferentes em fases diferentes — é isso que se mede.
// `tipo → Map<fase, corpo>`. A chave é a FASE, não a lista: dois inimigos do
// mesmo tipo na mesma onda usam o mesmo corpo (a variação é por fase, não por
// indivíduo), então uma lista contaria inimigos e não fases.
const porTipoPorFase = new Map();
for (const v of vistos) {
  for (const [tipo, chars] of Object.entries(v.corposDaFase)) {
    if (!porTipoPorFase.has(tipo)) porTipoPorFase.set(tipo, new Map());
    porTipoPorFase.get(tipo).set(v.indice, chars[0]);
  }
}
// Compara só os tipos que apareceram em MAIS DE UMA das fases visitadas: um
// tipo que só existe no Espaço não pode "variar" — ele nunca saiu de lá.
let variou = 0;
const variaram = [];
for (const [tipo, porFase] of porTipoPorFase) {
  if (porFase.size < 2) continue;
  const corpos = new Set(porFase.values());
  if (corpos.size > 1) {
    variou++;
    variaram.push(`${tipo} (${[...porFase.entries()].map(([f, c]) => `F${f + 1}=${c}`).join(', ')})`);
  } else {
    problemas.push(`"${tipo}" saiu com o mesmo corpo (${[...corpos][0]}) nas fases ${[...porFase.keys()].map(f => f + 1).join(', ')}`);
  }
}
if (variou === 0) {
  problemas.push('nenhum tipo mudou de silhueta entre as fases — a tabela não está na tela');
} else {
  console.log(`tipos que mudaram de silhueta entre fases: ${variou}`);
  for (const v of variaram) console.log(`  ${v}`);
}
// a mesma fase não pode produzir dois corpos para o mesmo tipo ao mesmo tempo
for (const v of vistos) {
  const porTipo = await page.evaluate(() => window.__ashfall.personagensPorTipo());
  for (const [tipo, chars] of Object.entries(porTipo)) {
    if (chars.length > 1 && new Set(chars).size > 1) {
      problemas.push(`fase ${v.indice + 1}: "${tipo}" aparece com ${[...new Set(chars)].join(' e ')} ao mesmo tempo`);
    }
  }
}

console.log(problemas.length ? problemas.map(p => `FALHA ${p}`).join('\n') : 'OK — a variação por fase está na tela.');
if (erros.length) { console.log('erros:'); for (const e of [...new Set(erros)]) console.log(`  ${e}`); }
console.log('screenshots: tools/shots/variedade-fase{1,3,8}.png');

await browser.close();
servidor.close();
process.exit(problemas.length === 0 && erros.length === 0 ? 0 : 1);