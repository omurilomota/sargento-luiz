/**
 * Caça ao "Game Over ao chegar no Espaço" (bugs.md, bug conhecido do TODO).
 *
 * Não é para consertar: é para REPRODUZIR. A regra do projeto é que um bug só
 * vira mudança depois de aparecer no navegador — o `onda-proof` existe porque o
 * `fase-proof` usava atalho e parava de cobrir o jogo.
 *
 * O roteiro é o de um jogador comum: começa a partida, salta para o Espaço
 * (índice 7) pela rota de環境 real (`irParaFase` reaproveita a sequência do
 * `startFromSave`), e joga a fase. O `lowGravity` do Espaço é o suspeito
 * declarado: com o jogador flutuando, o `hazard` pode matar sem que o bot
 * perceba.
 *
 * Uso: node tools/espaco-proof.mjs   (requer `npm run build` antes)
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
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.ogg': 'audio/ogg', '.md': 'text/markdown',
};

const servidor = createServer(async (req, res) => {
  const u = (req.url || '/').split('?')[0];
  const p = join(DIST, u === '/' ? 'index.html' : decodeURIComponent(u));
  if (!existsSync(p)) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(await readFile(p));
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const porta = servidor.address().port;

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const erros = [];
page.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') erros.push(`console: ${m.text()}`); });

mkdirSync(SHOTS, { recursive: true });
const f = () => page.evaluate(() => window.__ashfall.fase());
const t = () => page.evaluate(() => window.__ashfall.telemetria());

await page.goto(`http://127.0.0.1:${porta}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.keyboard.press('Enter');
await page.waitForTimeout(1100);
await page.keyboard.press('Backspace');
await page.waitForTimeout(900);
const c = await page.evaluate(() => window.__ashfall.cena());
if (c.ativa) { await page.keyboard.press('Backspace'); await page.waitForTimeout(600); }

console.log('── rota do jogador até o Espaço (índice 7) ──');
await page.evaluate(() => window.__ashfall.irParaFase(7));
await page.waitForTimeout(1000);

const entrada = await f();
console.log(`fase: ${entrada.fase} (índice ${entrada.indice})`);
console.log(`hazard: ${entrada.hazard} · dificuldade: ${entrada.dificuldade}`);
console.log(`objetivo: ${entrada.objetivo} · ondas: ${entrada.ondas}`);
console.log(`vida na entrada: ${entrada.vida}/${entrada.vidaMax}`);

// a cutscene da fase abre aqui e segura o combate. Ela não é o bug, mas
// pulá-la é parte do fluxo real: o jogador avança com um clique.
const cen = await page.evaluate(() => window.__ashfall.cena());
if (cen.ativa) {
  console.log(`cutscene aberta: "${cen.titulo}" — pulando`);
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(700);
}

// joga de verdade: atira, recarrega, anda. Sem dash nem escudo (o jogador
// comum não pode), e sem curar — se o Espaço matar, é o Espaço matando.
const inicio = Date.now();
let morreu = null;
const amostras = [];
while (Date.now() - inicio < 60000) {
  const s = await f();
  const tel = await t();
  if (s.estado !== 'playing') { morreu = { estado: s.estado, ...tel }; break; }

  // a mira é calculada DENTRO da página: `window` não existe no contexto Node
  const telaX = await page.evaluate(() => {
    const alvo = window.__ashfall.inimigoMaisProximo();
    if (!alvo) return 640;
    const cam = window.__ashfall.camera();
    return 640 + Math.max(-300, Math.min(300, alvo.x - (cam.x + 640)));
  });
  await page.mouse.move(telaX, 360);
  await page.keyboard.down('Space');
  await page.waitForTimeout(900);
  await page.keyboard.up('Space');

  amostras.push(`t=${((Date.now() - inicio) / 1000).toFixed(0)}s hp=${tel.hp} onda=${s.onda}/${s.ondas} inim=${s.inimigos}`);
  if (amostras.length <= 3 || s.estado !== 'playing') console.log(`  ${amostras.at(-1)}`);

  // se o campo limpa, segue para a próxima onda como o jogador faria
  if (s.inimigos === 0) { await page.evaluate(() => window.__ashfall.matarTodos()); await page.waitForTimeout(400); }
}

const fim = await f();
await page.screenshot({ path: join(SHOTS, 'espaco-final.png') });
console.log('─'.repeat(46));
console.log(`estado final: ${fim.estado} (${fim.estado === 'gameover' ? 'GAME OVER' : fim.estado})`);
console.log(`onda alcançada: ${fim.onda}/${fim.ondas} · vida ${fim.vida}/${fim.vidaMax}`);
if (morreu) console.log(`morreu com hp=${morreu.hp} na onda ${morreu.onda}, ${morreu.inimigos} inimigos em tela`);

console.log(fim.estado === 'gameover'
  ? '\nREPRODUZIDO: o Espaço derruba o jogador. Agora dá pra caçar a causa.'
  : `\nNÃO reproduzido em ${((Date.now() - inicio) / 1000).toFixed(0)}s — sobreviveu até a onda ${fim.onda}/${fim.ondas}.`);
if (erros.length) { console.log('erros:'); for (const e of [...new Set(erros)]) console.log(`  ${e}`); }
console.log(`screenshot: tools/shots/espaco-final.png`);

await browser.close();
servidor.close();