/**
 * Prova das seções baixas da loja: SKINS, DIÁRIO e NOVIDADES.
 *
 * O `perks-proof.mjs` fotografa o TOPO da loja — que é onde a escada de perks
 * mora. As seções que o jogador reclamou (nome de skin vazando na coluna de
 * 44px, texto do traje estourando o card) ficam abaixo da dobra, então nenhum
 * dos dois harness pegava. Aqui a tela rola até cada uma e mede o texto
 * DEPOIS de desenhado: `truncateText` usa uma constante de 6.6px por caractere,
 * e a fonte real do navegador é a que vale.
 *
 * Uso: node tools/loja-proof.mjs   (requer `npm run build` antes)
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
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
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
await page.waitForTimeout(500);
const c = await page.evaluate(() => window.__ashfall.cena());
if (c.ativa) { await page.keyboard.press('Backspace'); await page.waitForTimeout(600); }

// loja com moedas e com a estoque e a mochila cheias: o pior caso de layout
await page.evaluate(() => window.__ashfall.__lojaPronta(99999));
await page.waitForTimeout(500);

// mede CADA texto desenhado na loja e compara com a caixa da sua seção
const medir = async (label) => await page.evaluate(() => window.__ashfall.lojaMedir());

const problemas = [];
let maiorNome = { texto: '', largura: 0, caixa: 0 };
let maiorDesc = { texto: '', largura: 0, caixa: 0 };

for (const [nome, voltas] of [['topo', 0], ['meio', 9], ['fundo', 26]]) {
  if (voltas === 0) {
    await page.evaluate(() => window.__ashfall.__lojaScroll(0));
  } else {
    for (let i = 0; i < 9; i++) {
      await page.mouse.move(640, 400);
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(50);
    }
  }
  await page.waitForTimeout(300);
  const m = await medir();
  for (const item of m.textos) {
    if (item.largura > item.caixa + 0.5) {
      problemas.push(`${nome}: "${item.texto.slice(0, 42)}" mede ${Math.round(item.largura)}px numa caixa de ${item.caixa}px (${item.caixaNome})`);
    }
    if (item.categoria === 'skin' && item.largura > maiorNome.largura) maiorNome = item;
    if (item.categoria === 'powerup' && item.largura > maiorDesc.largura) maiorDesc = item;
  }
  // As seções não podem se sobrepor DENTRO da mesma coluna. Foi a 2ª linha de
  // skins invadindo MOEDAS, com "Fita Isolante" atrás do card do anúncio.
  // Entre colunas o Y repetido é de projeto (ARMAS x PERKS), então comparar
  // esquerda com direita dá falso positivo.
  const porColuna = { esquerda: m.secoes.esquerda, direita: m.secoes.direita };
  for (const [coluna, lista] of Object.entries(porColuna)) {
    for (const [a, ay, ah] of lista) {
      for (const [b, by, bh] of lista) {
        if (a === b || ay >= by + bh || by >= ay + ah) continue;
        problemas.push(`${nome}/${coluna}: "${a}" (y=${Math.round(ay)}..${Math.round(ay + ah)}) cobre "${b}" (y=${Math.round(by)}..${Math.round(by + bh)})`);
      }
    }
  }
  await page.screenshot({ path: join(SHOTS, `loja-${nome}.png`) });
  const meus = problemas.filter(p => p.startsWith(`${nome}/`) || p.startsWith(`${nome}:`));
  console.log(`${nome}: ${m.textos.length} textos, ${m.secoes.esquerda.length + m.secoes.direita.length} seções, ${meus.length} problema(s)`);
}

console.log('─'.repeat(52));
console.log(`nome de skin mais largo: "${maiorNome.texto}" ${Math.round(maiorNome.largura)}px / ${maiorNome.caixa}px`);
console.log(`descrição mais larga:    "${maiorDesc.texto?.slice(0, 46)}…" ${Math.round(maiorDesc.largura)}px / ${maiorDesc.caixa}px`);
if (problemas.length === 0) console.log('OK — nenhum texto da loja passa da sua caixa.');
else for (const p of problemas) console.log(`FALHA ${p}`);
if (erros.length) { console.log('erros:'); for (const e of [...new Set(erros)]) console.log(`  ${e}`); }
console.log('screenshots: tools/shots/loja-{topo,meio,fundo}.png');

await browser.close();
servidor.close();
process.exit(problemas.length === 0 && erros.length === 0 ? 0 : 1);