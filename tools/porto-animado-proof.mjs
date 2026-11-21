/** Prova visual do cais vivo: sobe até a água e fotografa em 2 instantes. */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(RAIZ, 'dist'), SHOTS = join(RAIZ, 'tools', 'shots');
const MIME = { '.html':'text/html', '.js':'text/javascript', '.png':'image/png', '.ogg':'audio/ogg' };
const s = createServer(async (req,res)=>{ const u=(req.url||'/').split('?')[0]; const p=join(DIST,u==='/'?'index.html':decodeURIComponent(u)); if(!existsSync(p)){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':MIME[extname(p)]||'application/octet-stream'}); res.end(await readFile(p)); });
await new Promise(r=>s.listen(0,'127.0.0.1',r));
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args:['--no-sandbox','--disable-gpu','--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport:{width:1280,height:720} });
const erros=[]; p.on('pageerror',e=>erros.push(e.message));
await p.goto(`http://127.0.0.1:${s.address().port}/`,{waitUntil:'networkidle'});
await p.waitForTimeout(500); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
for(let i=0;i<80;i++){ await p.keyboard.press('Enter'); await p.waitForTimeout(60); const c=await p.evaluate(()=>window.__ashfall.cena()); if(!c?.ativa) break; }
const nomes = await p.evaluate(()=>window.__ashfall.config().fases.map(f=>f.name));
await p.evaluate(i=>window.__ashfall.irParaFase(i), nomes.indexOf('Porto'));
await p.waitForTimeout(1200);
// teleporta para a faixa de agua (topo do mapa, col 15 / row 1)
await p.evaluate(()=>window.__ashfall.teleportar(15*64+32, 1*64+32));
await p.waitForTimeout(600);
await p.screenshot({ path: join(SHOTS,'porto-cais-1.png') });
await p.waitForTimeout(900); // outro instante: barcos/garcas devem ter mudado
await p.screenshot({ path: join(SHOTS,'porto-cais-2.png') });
console.log('2 shots do cais em instantes diferentes');
console.log(erros.length ? `ERROS: ${erros.join(' | ')}` : 'sem pageerror');
await b.close(); s.close();
