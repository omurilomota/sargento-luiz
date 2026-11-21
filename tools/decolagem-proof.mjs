/** Prova: decolagem do Castelo roda junto com o diálogo (não trava). */
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
await p.evaluate(i=>window.__ashfall.irParaFase(i), nomes.indexOf('Castelo'));
await p.waitForTimeout(1200);
// limpa a caixa de entrada se houver
for(let i=0;i<12;i++){ const d=await p.evaluate(()=>window.__ashfall.dialogo()); if(!d) break; await p.keyboard.press('Enter'); await p.waitForTimeout(150); }
await p.evaluate(()=>{ window.__ashfall.cumprirObjetivo(); window.__ashfall.invocarChefe(); });
await p.waitForTimeout(500);
await p.evaluate(()=>window.__ashfall.matarChefe());
await p.waitForTimeout(400);
// O vôo agora nasce na FALA DO MOTOR, não na morte do chefe. Avança o diálogo
// pós-missão até o efeito `lancamentoFoguete` disparar (cada fala leva dois
// Enter: um completa o texto, outro avança).
for(let i=0;i<10;i++){ await p.keyboard.press('Enter'); await p.waitForTimeout(180); if(await p.evaluate(()=>window.__ashfall.voo())>0) break; }
const v1 = await p.evaluate(()=>window.__ashfall.voo());
const d1 = await p.evaluate(()=>window.__ashfall.dialogo());
await p.screenshot({ path: join(SHOTS,'decolagem-1.png') });
await p.waitForTimeout(1600);
const v2 = await p.evaluate(()=>window.__ashfall.voo());
await p.screenshot({ path: join(SHOTS,'decolagem-2.png') });
console.log('voo inicial:', v1, '-> depois de 1.6s:', v2, (v1>v2)?'OK (decolagem andou com diálogo)':'FALHA');
console.log('diálogo na tela:', !!d1);
console.log(erros.length ? `ERROS: ${erros.join(' | ')}` : 'sem pageerror');
await b.close(); s.close();
