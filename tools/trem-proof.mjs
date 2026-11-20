/** Prova: o trem do maquinista aparece e desce a via na investida. */
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
const idx = nomes.indexOf('Pátio de Trens');
await p.evaluate(i=>window.__ashfall.irParaFase(i), idx);
await p.waitForTimeout(1200);
await p.evaluate(()=>window.__ashfall.teleportar(18*64+32, 8*64+32));
await p.waitForTimeout(600);
await p.screenshot({ path: join(SHOTS,'trem-parado.png') });
// invoca o maquinista e espera a investida (telegraph + charge)
await p.evaluate(()=>window.__ashfall.invocarChefe());
await p.waitForTimeout(2600);
const marcha = await p.evaluate(()=>window.__ashfall.marchaTrem?.() ?? -1);
await p.screenshot({ path: join(SHOTS,'trem-marcha.png') });
console.log('marcha do trem:', marcha, marcha>0?'OK (trem andou)':'FALHA');
console.log(erros.length ? `ERROS: ${erros.join(' | ')}` : 'sem pageerror');
await b.close(); s.close();
