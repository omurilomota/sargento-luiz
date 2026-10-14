/**
 * Prova de narrativa.
 *
 * 62 das 69 linhas de cutscene nunca jogavam: `showCutscene()` era chamado em
 * 2 lugares, ambos no menu, então só o PRÓLOGO aparecia — e com ele os 3 finais
 * do epílogo e a resolução do Genesis ficam inalcançáveis.
 *
 * Este harness entra na partida, avança de fase pulando a loja, e confere que
 * cada fase abre a sua cutscene e que ela realmente avança linha a linha.
 *
 * Uso: node tools/story-proof.mjs
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
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.ogg': 'audio/ogg' };

const s = createServer(async (req, res) => {
  const u = (req.url || '/').split('?')[0];
  const p = join(DIST, u === '/' ? 'index.html' : decodeURIComponent(u));
  if (!existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(await readFile(p));
});
await new Promise((r) => s.listen(0, '127.0.0.1', r));
const porta = s.address().port;

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const erros = [];
page.on('pageerror', (e) => erros.push(e.message));
mkdirSync(SHOTS, { recursive: true });

const resultados = [];
const checar = (nome, ok, detalhe = '') => {
  resultados.push({ nome, ok });
  console.log(`${ok ? 'OK  ' : 'FALHA'} ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
};

const cena = () => page.evaluate(() => window.__ashfall.cena?.() ?? null);

await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.keyboard.press('Enter');
await page.waitForTimeout(1300);

let st = await cena();
checar('o prólogo abre no menu', st?.ativa === true, st ? `título=${st.titulo}` : 'sem hook');

// pula o prólogo
await page.keyboard.press('Backspace');
await page.waitForTimeout(900);

st = await cena();
checar('o prólogo fecha ao pular', st?.ativa === false);

// avança de fase e confirma a cutscene.
//
// A lista é TODAS as fases, não quatro: o harness prometia conferir "cada fase"
// e parava na Fábrica, então Caverna adiante só era conferida por sorte — e o
// fundo de cena novo (tiles em `buildCutsceneBackdrop`) precisa ser visto nas
// nove. A nona pulada sai da última fase e o hook do jogo quebra (bug do
// `pularParaProximaFase` fora de faixa), por isso a lista termina no Bunker, que
// o EPÍLOGO fechar.
const fases = [
  'Floresta', 'Caverna', 'Fábrica', 'Pântano',
  'Castelo', 'Vulcão', 'Espaço', 'NÚCLEO-CENTRAL',
];
let indice = 0;
for (const nome of fases) {
  await page.evaluate(() => window.__ashfall.pularParaProximaFase());
  await page.waitForTimeout(600);
  // H2: a Fábrica abre em CAIXA PEQUENA de diálogo (o pedido do Murilo:
  // "não gigante igual aos outros níveis") — não em cutscene.
  if (nome === 'Fábrica') {
    const dlg = await page.evaluate(() => window.__ashfall.dialogo?.() ?? false);
    checar('a Fábrica abre a caixa pequena de diálogo', dlg === true, `dialogo=${dlg}`);
    await page.screenshot({ path: join(SHOTS, `historia-${indice}-caixa-pequena.png`) });
    indice++;
    for (let i = 0; i < 30; i++) {
      const aberta = await page.evaluate(() => window.__ashfall.dialogo?.() ?? false);
      if (!aberta) break;
      await page.keyboard.press('Enter');
      await page.waitForTimeout(250);
    }
    const fechou = await page.evaluate(() => window.__ashfall.dialogo?.() ?? false);
    checar('a caixa pequena atravessa com ENTER', fechou === false, `dialogo=${fechou}`);
    continue;
  }
  st = await cena();
  checar(`fase abre cutscene (${nome})`, st?.ativa === true, `título="${st?.titulo}" linha=${st?.linha}`);
  if (st?.ativa) {
    await page.screenshot({ path: join(SHOTS, `historia-${indice}-${(st.titulo || '').toLowerCase()}.png`) });
    indice++;
    // avança uma linha e confirma que a cena anda.
    // ENTER só avança quando a linha TERMINOU de digitar (40 chars/s), e a
    // primeira pressada completa o texto em vez de mudar de linha. Por isso
    // duas pressadas com pausa: a primeira completa, a segunda avança.
    const antes = st.linha;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1100);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    const depois = await cena();
    checar(`a cutscene avança (${st.titulo})`, depois?.linha !== antes || depois?.ativa === false,
      `"${antes}" -> "${depois?.linha}"`);
    // pula a cena
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(700);
  }
}

// O diário precisa DEFINIR a entrada do Fernandes. Não basta existir no main:
// se `unlockDiaryEvent('fernandes')` não achar um evento com esse nome, o beat
// mais forte da história não deixa registro nenhum.
const diario = await page.evaluate(() => window.__ashfall.diarioDefinido?.() ?? null);
checar('o diário define a entrada do Fernandes',
  diario?.eventos?.includes('fernandes') === true,
  diario ? `eventos: ${diario.eventos.join(', ')}` : 'sem hook');

await browser.close();
s.close();

const falhas = resultados.filter((r) => !r.ok).length;
console.log(`\n${resultados.length - falhas}/${resultados.length} verificações passaram`);
if (erros.length) {
  console.log('\nerros de console:');
  for (const e of [...new Set(erros)]) console.log(`  ${e}`);
}
if (falhas || erros.length) process.exitCode = 1;