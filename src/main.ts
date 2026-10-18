/**
 * src/main.ts — Orquestrador principal do jogo
 *
 * Arquitetura:
 * - Canvas 2D com loop via requestAnimationFrame
 * - Input por teclado (WASD/setas) e mouse (mirar + atirar)
 * - Estado global distribuído entre módulos (phases, weapons, player)
 * - Mundo maior que a tela: a câmera aplica UMA translação por frame e todo o
 *   código de entidade trabalha em coordenadas de mundo
 *
 * Fluxo: menu → cutscene → playing → (waves → shop) → ... → gameover
 */

import { normalize, rand } from './utils';
import { PHASES, ENEMY_TYPES, POWERUP_TYPES, WEAPONS, QUALITIES, PIECE_TYPES, NUCLEO_RUSH, SPAWN_PROPRIO, conditionLabel } from './config';
import { PALETTE } from './core/palette';

// Entities
import * as player from './entities/player';
import { applyRegen, resetRegen } from './entities/player';
import { getBullets, spawnBullet, updateBullets, updateMines, clearBullets } from './entities/bullet';
import { getSprite, BULLET_FAMILY, getEnemyCharacter } from './systems/sprites';
import { getCoins, spawnCoins, updateCoins, clearCoins, setMagnetActive, resetPermanentMagnet , getMoedasGeradas, zeraMoedasGeradas } from './entities/coin';
import { PHASE_END_PAUSE, PLAYER_BASE_HEALTH, PERIGO_NAVE_SEGUNDOS, ALCANCE_DO_ATIRADOR, RECUO_DO_ATIRADOR, RAIO_TROCA_DE_ALVO } from './core/constants';
import type { Toast, ToastKind, WeaponSheet } from './ui/hud';
import { updateSupportUrl, drawSupportFallback, hideSupportUrl } from './systems/support';

// Systems
import { spawnParticles, updateParticles, clearParticles, getParticles } from './systems/particles';
import { spawnWaveEnemies, resetSpawner, spawnEnemy, setPhaseDifficulty, setPhaseTime } from './systems/spawner';

/** Tempo decorrido na fase atual (para a escalada de dificuldade temporal) */
let phaseElapsed = 0;

let wasJammed = false;

//Timestamp dos últimos kills, para detectar a chacina que gatilha slow-mo
const killTimes: number[] = [];
import { checkBulletEnemyCollisions, checkEnemyPlayerCollision, checkEnemyBulletPlayerCollision, bulletHitsCircle } from './systems/collision';
import { createExplosion, updateExplosions, clearExplosions, spawnFire, updateFires, clearFires, pisaEmFogo, getFires, FOGO_DPS, FOGO_RAIO } from './systems/explosions';
import { loadMap, colAt, rowAt, charAt, isWall, hasPath, moveCircleBy, rebuildFlowField, rebuildFlowFieldAlvo, sampleFlowDir, sampleFlowDirAlvo, pushOutOfWalls, findAll, segmentHitsWall, findFreeSpotNear, setCellChar, getMap } from './systems/tilemap';
import { initCamera, setViewportSize, setWorldSize, updateCamera, snapCamera, getCamX, getCamY, screenToWorld, drawVoid, isVisible, setShake } from './systems/camera';
import { initProps, getProps, updateProps, damageProp, detonateProp, getBlast, drawProps, clearProps, collapsesOnHit, getRocket, getAnyRocket, igniteBarrel, ROCKET_CONTACT_DPS, Prop, spawnCapsula, consumirCapsula, collectFuelAt } from './systems/props';
import { buildTerrain, drawTerrain, clearTerrain } from './systems/terrain';
import { initObjective, updateObjective, peekObjective, vipDown, markVipDown, registerObjectiveDestroyed, cellCenter, ReachZone, forceObjectiveDone, registerFuelCollected } from './systems/objectives';
import { updateBoss, isBossTelegraphing, getBossTelegraphLabel, clearBossState } from './systems/boss';

import {
  initRenderer, drawMenu, drawCutscene, drawDialogo, drawGameOver, drawVictory, drawFimLocal, drawCredits, drawCoins as renderCoins, drawVoo,
  drawPlayer2 as renderPlayer2,
  drawPowerUps as renderPowerUps, drawParticles as renderParticles, drawBullets as renderBullets, drawFires as drawFiresWorld,
  drawEnemies as renderEnemies, drawPlayer as renderPlayer, drawDamageNumbers, drawPhaseTransition,
  restoreCanvas, drawNPCs, drawBots, drawPause, menuIndexAt, getPauseIndex, movePause, PAUSE_OPTIONS, setPauseIndex, pauseOptionAt, setUiMouse,
  drawSettings, settingsRowAt, settingsButtonAt, isSettingsOpen, openSettings, closeSettings,
  moveSettings, setSettingsIndex, getSettingsIndex, attachSettingsWheelListener, adjustSettingsVolume, SETTINGS_ROWS,
} from './systems/renderer';

// UI
import { initHud, drawHud, drawTabScreen, medirHud, HudData } from './ui/hud';
import { rendaDeAbate } from './systems/economia';
import { resetAmbiente, updateAmbiente, agendaAmbiente } from './systems/ambiente';
import { armarQuedaDaPonte, resetQuedaDaPonte, updateQuedaDaPonte, pausarQueda, quedaAtiva, estadoDaQueda } from './systems/ponte';
import { drawShop, handleShopClick, setShopCoins, getShopCoins, addShopCoins, resetShop, updateShopAds, getPurchasedUpgrades, getPurchasedWeapons, getPurchasedWeaponPairs, attachShopWheelListener, addPurchasedWeapon, pushPendingReveal, consumeShopPowerups, consumeShopServices, restoreUpgrades, applySavedTalentos, buyPerk, buyService, getStockPerks, getShopStock, getShopLayout, medirTextosDaLoja, setShopScroll } from './ui/shop';

// Modules
import { shoot, getCurrentWeapon, resetWeapons, refillAmmo, canShoot, startReload, updateReload, getCurrentAmmo, getIsReloading, getReloadTimer, setWeapon, getEffectiveShootRate, setWeaponQuality, getCurrentWeaponIndex, getWeaponQuality, isJammed, getCurrentCapacity, getReloadTimeOf, getWeaponStats, getWeaponFamily, onReloadStarted } from './weapons';
import { getCurrentPhase, getCurrentWave, getGameState, setGameState, nextWave, nextPhase, resetPhases, resetWave, setCurrentWave, addScore, addScoreFlat, getScore, getCombo, getComboDecay, updateCombo, resetCombo, getKillStreak, getTotalKills, wasGameCompleted, deveFecharFase, proximoDoRushNasce } from './phases';
import { rollLootDrop, spawnBossLoot, updateLoot, getLoot, clearLoot, drawLoot, powerupLabel, ELITE_TYPES } from './systems/loot';
import { addPieceToInventory, getPieceType, resetPieces, getInventorySnapshot, restoreInventory, getEquippedSnapshot, restoreEquipped } from './systems/pieces';
import { powerups, spawnPowerUp, spawnPowerUpDeChefe, spawnPowerUpDeTipo, updatePowerUps, hasPowerUp, activePowerups } from './powerups';

import {
  initAudio, sfxAmbiente, sfxExplosion, sfxBossDeath, sfxPlayerHit, sfxCoin, sfxPowerup, sfxWaveStart, sfxLevelUp,
  sfxGameOver, sfxEnemyShoot, sfxDash, sfxShield, sfxFury, sfxMenuMove, sfxMenuSelect, sfxError, sfxJammed, sfxPiece,
  startMusic, playMusic, setMusicEnabled, setSfxEnabled, isMusicEnabled, isSfxEnabled, unlockAudio,
  getMasterVolume, getMusicVolume, getSfxVolume, WEAPON_SOUNDS,
  sfxReload, sfxCondicao, resetFerrugem, sfxRisada, sfxFerramenta, sfxFogueteLancamento,
} from './systems/audio';
import { getFuryCooldownMult } from './systems/skills';
import { triggerScreenShake, triggerDamageFlash, triggerBossKillFlash, triggerLevelUpFlash, updateFlash, updateSlowMotion, triggerSlowMotion, triggerHitStop, updateHitStop, resetEffects, updateScreenShake, triggerBossZoom, updateBossZoom, triggerVeil, updateVeil } from './systems/effects';

import { useSkill, isSkillActive, updateSkills, resetSkills, getDamageMultiplier, getDamageTakenMultiplier, getSkillCooldown, getSkillMaxCooldown, setMoveDirection, furiaDesbloqueada, desbloquearFuria, restoreFuria, resetFuria } from './systems/skills';
import { toggleNpcFollow } from './systems/npcs';
import { getCurrentClass, setCurrentClass, getClassDamageMult, getClassSpeedMult, getClassReloadMult, getClassHealthPerSecond, loadClass, saveClass, resetClass, ClassId, CLASSES } from './systems/classes';
import { updateEnvironmentEvents, resetEnvironmentEvents, getEnvironmentWarnings , forcarEventoAmbiente, tornadoNoAr , EnvironmentEvent } from './systems/environment';
import { updateCombos, getActiveCombos, getComboDamageBonus, getComboCooldownMult, getComboHealthBonus, resetCombos } from './systems/combos';
import { setComboHealthMultiplier } from './entities/player';
import { resetSkins } from './systems/skins';
import { resetAds, resetAdsPerPhase } from './systems/ads';
import { saveGame, loadGame, hasSave, markGameCompleted, isGameCompleted } from './systems/saveSystem';
import { addLeaderboardEntry } from './systems/leaderboard';
import { loadAchievements, checkAchievements, checkObjectiveAchievement, resetRunCounters , getAllAchievements } from './systems/achievements';
import { loadDiary, unlockDiaryEntry, unlockDiaryEvent, getUnlockedDiary, getDiaryEvents, rollDiaryEvent } from './systems/diary';
import { addXp, resetProgress, restoreTalentos, restoreXp, getNivel, getPontosLivres, getTalentos, buyTalento, getXp, progressoNoNivel, TALENTOS, XP_BONUS_ONDA, XP_BONUS_FASE } from './systems/progress';
import { migrarChavesDeSave } from './systems/migracaoSave';
import { getStat, resetStats } from './core/stats';
import { registrarTiroPerks, tickPerks, acenderInimigo, danoPassoFantasma, checarSegundoFolego, limparDashFantasma, temSortudoAtivo, resetPerks, temIncandescente, temSegundoFolego, temPassoFantasma } from './systems/perks';
import { resetDanoTelemetria, danoPorFonte } from './systems/danoTelemetria';
import { startTutorial, isTutorialActive, getCurrentHint, updateTutorial, advanceHint, endTutorial } from './systems/tutorial';
import { updateBehavior, registerShot, registerHit, getPlayerTendency, resetBehavior } from './systems/dynamicDifficulty';
import { spawnNPC, updateNPCs, getNPCs, resetNPCs, npcBark, isNpcFollowing, consumeNpcDeath, consumeAliadoMorte, getTirosDeAliado } from './systems/npcs';
import { getBots, createBot, updateBots, removeDeadBots, resetBots, addBot, BotDifficulty } from './systems/bots';
import { isEnabled as isLocalEnabled, initLocalMultiplayer, movePlayer2, shootPlayer2, getPlayer2, resetLocalMultiplayer, checkPlayer2EnemyCollision, damagePlayer2, resetPlayer2, getWinner, getPlacarLocal, matarPlayer2 } from './systems/localMultiplayer';
import { showCutscene, showCutsceneAt, cutsceneForPhase, advanceCutscene, setEfeitoDeLinha, skipCutscene, isShowingCutscene, updateCutscene, resetStory, isEpilogueScene, EPILOGUE_CUTSCENE, getCurrentCutscene, getCurrentLine } from './systems/story';
import { dialogoAtivo, avancarDialogo, abrirDialogo, setEfeitoDialogo, resetDialogo, EntradaDialogo } from './systems/dialogo';
import { getCurrentMode, setGameMode, GameMode, GAME_MODES } from './systems/gameModes';
import { BIOMES, CELL_SIZE } from './maps';
import { loadAllSprites, loadSprite } from './systems/sprites';
import { observarTelaCheia, estaEmTelaCheia, sairDaTelaCheia, alternarTelaCheia, estaEmIframe } from './systems/fullscreen';

// ─── Canvas Setup ──────────────────────────────────────────────
const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  setViewportSize(canvas.width, canvas.height);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
// Entrar/sair de tela cheia muda o tamanho do iframe por um caminho que nem
// sempre dispara `resize` a tempo — sem esta escuta o canvas ficava com a
// resolução antiga e o jogo aparecia esticado. É o caso do botão de
// fullscreen do itch.io, que pede fullscreen no iframe que embute o jogo.
observarTelaCheia(resizeCanvas);

initRenderer(canvas, ctx);
initHud(ctx);
attachShopWheelListener();
attachSettingsWheelListener();

// ─── Input ─────────────────────────────────────────────────────

/** Teclas mantidas pressionadas (movimento contínuo). */
const keys: Record<string, boolean> = {};
/**
 * Teclas apertadas NESTE frame (edge).
 *
 * Precisa ser um Set separado de `keys`: um ENTER que fica `true` no estado
 * seguinte faz Game Over → ENTER → menu entrarem na cutscene sozinhos.
 */
let keysPressed = new Set<string>();
const mouse = { x: 0, y: 0, down: false };
/** Clique do mouse dado durante a cutscene (edge, um por frame). */
let cutsceneClick = false;

/** Consome um ENTER pressionado neste frame (edge, com clear do buffer). */
function consumeEnter(): boolean {
  if (!keysPressed.has('enter')) return false;
  keysPressed.delete('enter');
  return true;
}

/** Consome o clique do mouse dado na cutscene neste frame. */
function consumeCutsceneClick(): boolean {
  if (!cutsceneClick) return false;
  cutsceneClick = false;
  return true;
}

/** Consome uma tecla de seta/WASD para a navegação de menus. */
function consumeNav(): number {
  let delta = 0;
  if (keysPressed.has('w') || keysPressed.has('arrowup')) delta -= 1;
  if (keysPressed.has('s') || keysPressed.has('arrowdown')) delta += 1;
  if (delta !== 0) keysPressed.clear();
  return delta;
}

/** Limpa todo o estado de input (toda troca de estado chama isto). */
function resetInput(): void {
  for (const k in keys) keys[k] = false;
  keysPressed.clear();
  mouse.down = false;
  cutsceneClick = false;
}

document.addEventListener('keydown', e => {
  const key = e.key;
  const k = key.toLowerCase();
  const state = getGameState();
  if (!keysPressed.has(k)) keysPressed.add(k);
  // desbloqueia o AudioContext suspenso (autoplay/aba oculta)
  // em qualquer gesto, independente do estado do jogo
  unlockAudio();

  // Tab em página de jogo é da ficha, não do browser: sem preventDefault o
  // Vivaldi tira o foco do jogo para a barra de busca, e as teclas seguintes
  // iam para o navegador. A página só tem o canvas — não há outro elemento
  // focável para o Tab estar fazendo algo útil.
  if (key === 'Tab') e.preventDefault();

  // cutscene: avanço
  if (isShowingCutscene()) {
    if (k === 'backspace' || key === 'ç') {
      // No MENU, pular a cutscene é começar a partida (o prólogo). Em
      // PARTIDA é só fechar a cena da fase e começar o combate — startRun
      // reiniciaria a campanha no meio. E o epílogo pulado também encerra:
      // o fim de campanha não pode depender de o jogador assistir tudo.
      const eraEpilogo = isEpilogueScene();
      if (skipCutscene()) {
        if (getGameState() === 'menu') startRun();
        else if (eraEpilogo) setGameState('gameover');
        else resetInput();
      }
    }
    keys[k] = true;
    return;
  }

  // ─── ESC pausa SEMPRE (playtest 2026-10-16) ─────────────────────
  // A decisão antiga (#111) dava ao ESC em tela cheia a função de SAIR da
  // tela cheia — o jogador pausava e "nada acontecia": a tecla só tinha
  // saído do fullscreen. Uma tecla, duas respostas, e a que o jogador
  // queria (pausar) era a que nunca vinha — a máquina de pause ficava
  // DESSINCRONIZADA por um (o "pausar e voltar não progride" do relato).
  // Agora ESC pausa em qualquer estado; sair da tela cheia é a opção
  // TELA CHEIA no menu de pausa.
  if (key === 'Escape' && estaEmTelaCheia()) {
    setGameState('paused');
    keys[k] = true;
    return;
  }

  // painel de configurações (overlay): o estado subjacente
  // (menu/paused) continua preservado por baixo
  if (isSettingsOpen()) {
    if (key === 'Escape') {
      closeSettings();
      return;
    }
    const nav = consumeNav();
    if (nav !== 0) {
      moveSettings(nav);
      sfxMenuMove();
    }
    if (k === 'a' || k === 'arrowleft') adjustSettingsVolume(getSettingsIndex(), -1);
    if (k === 'd' || k === 'arrowright') adjustSettingsVolume(getSettingsIndex(), 1);
    return;
  }

  if (state === 'menu') {
    // qualquer interação no menu inicializa o áudio e toca a
    // faixa do menu (antes só tocava na cutscene de abertura)
    initAudio();
    startMusic();
    const idx = GAME_MODES.findIndex(m => m.key === key);
    if (idx >= 0) {
      if (selectedMode !== GAME_MODES[idx].mode) sfxMenuMove();
      selectedMode = GAME_MODES[idx].mode;
    }
    // teclas 5-8 selecionam classe
    const classIdx = ['5', '6', '7', '8'].indexOf(key);
    if (classIdx >= 0 && classIdx < CLASSES.length) {
      const newClass = CLASSES[classIdx].id;
      if (newClass !== selectedClass) {
        selectedClass = newClass;
        setCurrentClass(newClass);
        saveClass();
        sfxMenuMove();
      }
    }
    if (k === 'c' && hasSave()) startFromSave();
    if (k === 'v') setGameState('credits');
    // teclas anunciadas no rodapé do menu
    if (k === 'm') setMusicEnabled(!isMusicEnabled());
    if (k === 's') setSfxEnabled(!isSfxEnabled());
    if (k === 'o') openSettings();
    return;
  }

  if (state === 'credits') {
    if (key === 'Escape' || key === 'Enter') setGameState('menu');
    keys[k] = true;
    return;
  }

  if (state === 'paused') {
    if (key === 'Escape') {
      setGameState('playing');
      return;
    }
    const nav = consumeNav();
    if (nav !== 0) {
      movePause(nav);
      sfxMenuMove();
    }
    return;
  }

  if (state !== 'playing') {
    keys[k] = true;
    return;
  }

  keys[k] = true;

  if (key === ' ') { if (useSkill('dash')) { limparDashFantasma(); sfxDash(); } }
  if (k === 'f') { if (useSkill('shield')) sfxShield(); }
  if (k === 'e') {
    // H2: a fúria começa travada — o gate é a história da Fábrica do
    // Rogério. Murilo (2026-10-14): a liberação é SEGREDO — apertar E
    // antes da hora não avisa nada, a tecla é só silêncio. O grito
    // "FÚRIA DESBLOQUEADA" na morte do Rogério é a surpresa inteira.
    if (useSkill('fury')) sfxFury();
  }
  if (k === 'r') startReload();
  if (k === 'j') toggleNpcFollow();
  // H usa medkit do inventário. Não existe "curar por 50 moedas durante o
  // combate": esse ramo era compra ilimitada de 25 HP a cada tecla, e com
  // milhares de moedas no fim da campanha tornava o jogador imortal.
  if (k === 'h') {
    if (player.getMedkits() > 0) {
      player.useMedkit();
      checkAchievements('medkit');
    } else {
      pushToast('SEM MEDKIT', 1.2, 'aviso');
    }
  }
  // 1-9 equipam pares (arma + qualidade) já comprados, sem abrir a loja.
  // Antes lia `getPurchasedWeapons()`, que devolve só índices: com a mesma arma
  // em duas raridades as duas linhas equipavam a mesma.
  if (key >= '1' && key <= '9' && marteloForcado) {
    pushToast('O DESTRUIDOR É A ÚNICA ARMA DESTA FASE', 1.4, 'aviso');
    return;
  }
  if (key >= '1' && key <= '9') {
    const slot = parseInt(key, 10) - 1;
    const pares = getPurchasedWeaponPairs();
    const par = pares[slot];
    if (par && WEAPONS[par.index]) {
      setWeapon(par.index, par.quality);
      announceWeapon(par.index);
      sfxMenuSelect();
    }
  }
  // Q vai para a arma ANTERIOR. E NÃO cicla mais: a tecla tinha duas funções
  // (fúria em :287 e ciclo de arma aqui), e a fúria é a habilidade mais cara do
  // jogo — gastá-la trocando de arma era erro de quem jogou. Decisão do jogador
  // em 2026-10-11: E só fúria, Q só arma anterior, sem ciclo para frente.
  // No NÚCLEO o martelo é a única arma (M2): Q cala como 1-9.
  if (key === 'q' && marteloForcado) {
    pushToast('O DESTRUIDOR É A ÚNICA ARMA DESTA FASE', 1.4, 'aviso');
    return;
  }
  if (key === 'q') {
    const pares = getPurchasedWeaponPairs();
    if (pares.length > 1) {
      const atual = pares.findIndex(p => p.index === getCurrentWeaponIndex() && p.quality === getWeaponQuality());
      const prox = pares[(atual - 1 + pares.length) % pares.length];
      if (prox) {
        setWeapon(prox.index, prox.quality);
        announceWeapon(prox.index);
        sfxMenuSelect();
      }
    }
  }
  // TAB abre a ficha da arma + mapa grande. A tecla não estava ligada em
  // lugar nenhum: o mapa do canto é pequeno demais para ler a sala, e o jogo
  // não mostrava DPS real em nenhuma tela.
  if (key === 'Tab') {
    tabAberto = !tabAberto;
    if (tabAberto) sfxMenuSelect(); else sfxMenuMove();
  }
  if (key === 'Escape') {
    // A tela de fim do versus escreve "ESC menu". Sem este ramo, ESC abria a
    // PAUSA por cima dela (e, no gameover do versus, abria pausa também), e o
    // jogador tinha dois passos pela frente para chegar onde a tela promete.
    if (fimLocal()) {
      resetGame();
      setGameState('menu');
      // crossfade combate → menu, como o caminho do gameover
      startMusic();
      return;
    }
    // as dicas dispensam NO MESMO ESC que pausa: o jogador novo que aperta
    // ESC no primeiro minuto esperava pausa e ganhava "tutorial fechou,
    // nada mais" — a mesma dessincronização da tela cheia (playtest
    // 2026-10-16). Uma tecla, os dois efeitos, na ordem que o jogador lê.
    if (isTutorialActive()) endTutorial();
    setGameState('paused');
  }
});

document.addEventListener('keyup', e => {
  // sempre limpa: antes só limpava em `playing`, e a tecla ficava presa
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  const rect = canvas.getBoundingClientRect();
  setUiMouse(e.clientX - rect.left, e.clientY - rect.top);
});
canvas.addEventListener('mousedown', e => {
  unlockAudio();
  const state = getGameState();
  if (state === 'playing') mouse.down = true;

  // cutscene tem dono próprio: clique avança a fala, sem roubar o tiro nem o
  // menu por baixo. Um clique sem alvo não pode selecionar nada errado —
  // dentro de cutscene o clique só avança a fala.
  if (isShowingCutscene()) {
    cutsceneClick = true;
    e.preventDefault();
    return;
  }
  // painel de configurações: botões [-]/[+] ajustam volume,
  // linha de toggle alterna — antes dos branches menu/pause
  if (isSettingsOpen()) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const btn = settingsButtonAt(mx, my, canvas.width, canvas.height);
    if (btn) {
      adjustSettingsVolume(btn.row, btn.dir);
      sfxMenuMove();
    } else {
      const row = settingsRowAt(mx, my, canvas.width, canvas.height);
      if (row >= 0) {
        setSettingsIndex(row);
        const id = SETTINGS_ROWS[row].id;
        if (id === 'musicOn') {
          setMusicEnabled(!isMusicEnabled());
          sfxMenuSelect();
        } else if (id === 'sfxOn') {
          setSfxEnabled(!isSfxEnabled());
          sfxMenuSelect();
        }
      }
    }
    e.preventDefault();
    return;
  }

  if (state === 'menu') {
    initAudio();
    startMusic();
    const rect = canvas.getBoundingClientRect();
    const idx = menuIndexAt(e.clientX - rect.left, e.clientY - rect.top, canvas.width, canvas.height);
    // o sentinela 200 (configurações) quebra os branches
    // antigos: GAME_MODES[200] e CLASSES[100] dão throw
    if (idx === 200) {
      openSettings();
    } else if (idx >= 100 && idx < 200) {
      // seleção de classe
      const classIdx = idx - 100;
      const newClass = CLASSES[classIdx].id;
      if (newClass !== selectedClass) {
        selectedClass = newClass;
        setCurrentClass(newClass);
        saveClass();
        sfxMenuMove();
      }
    } else if (idx >= 0 && idx < 100) {
      if (GAME_MODES[idx].mode === selectedMode) {
        // segundo clique no modo já selecionado inicia
        initAudio();
        startMusic();
        resetGame();
        showCutscene();
        sfxMenuSelect();
      } else {
        selectedMode = GAME_MODES[idx].mode;
        sfxMenuMove();
      }
    }
  }

  if (state === 'shop') handleShopClick(e.clientX, e.clientY);
  if (state === 'paused') {
    const rect = canvas.getBoundingClientRect();
    const idx = pauseOptionAt(e.clientX - rect.left, e.clientY - rect.top);
    if (idx >= 0) {
      setPauseIndex(idx);
      applyPauseOption();
    }
  }
  e.preventDefault();
});
document.addEventListener('mouseup', () => { mouse.down = false; });
document.addEventListener('contextmenu', e => e.preventDefault());
// segurar o clique na loja e voltar ao jogo não pode dar tiro automático.
// E pausa automática no blur (relato do Murilo, 2026-10-13): alt-tab no meio
// da horda era morte de graça — o mundo seguia rodando atrás da aba. Só em
// combate: loja, menu e tela de fim não têm o que pausar.
window.addEventListener('blur', () => {
  resetInput();
  if (getGameState() === 'playing') setGameState('paused');
});

// ─── Estado ────────────────────────────────────────────────────
import { Enemy, Bullet } from './types';
let enemies: Enemy[] = [];
let damageNumbers: { x: number; y: number; text: string; color: string; life: number; vy: number }[] = [];
let lastTime = 0;
let phaseTransitionTimer = 0;
let achievementNotifications: Toast[] = [];
let playerDied = false;
let bossZoomTriggered = false;
// Botas de Campo (serviço M3): +30% na pilha de velocidade da fase em que
// foram compradas — zerado no load de cada fase e rearmado só quando o
// serviço foi pago na loja anterior.
// O Destruidor forçado na fase do NÚCLEO: as teclas de troca de arma ficam
// caladas (M2). Zerado no load de toda fase — só o leaveShop do NÚCLEO arma.
let marteloForcado = false;
// O anúncio de onda que esperou a caixa de diálogo fechar (M2): no
// Hospital/Fábrica/Castelo a onda 2 nasce JUNTO com um encontro, o som
// tocava debaixo do mundo congelado e o jogador nunca ouvia — a onda
// já estava em andamento quando a caixa fechava.
let anuncioDeOndaPendente = false;
// O VOO (M4): a sequência de decolagem no respiro do Castelo — o mesmo
// relógio do respiro de 5s, no lugar de um countdown nu. Zerado no load.
let vooAtivo = 0;
// M5: o GRITO de entrada do chefe (a barra de boss mostra enquanto conta) e
// o relógio dele. Zerado no load de fase.
let bossGritoTexto = '';
let bossGritoTimer = 0;
// M5: as balas que JÁ deram rasante (uma vez cada; WeakSet morre com a bala)
const balsRasantes = new WeakSet<Bullet>();

/**
 * Arma o respiro de fim de fase — os DOIS caminhos passam daqui: o abate
 * comum que fecha a última onda e a morte do chefe (que não conta na
 * cota). No Castelo o respiro É o voo (M4): o foguete decola no lugar do
 * countdown parado.
 */
function armarRespiro(): void {
  phaseEnding = true;
  phaseEndPause = PHASE_END_PAUSE;
  // M5 "Intocável": fechar a fase SEM dano nenhum — o dano por fase é
  // zerado no load e qualquer toque marca (a Onda Limpa já existia; esta
  // é a fase INTEIRA, ondas + chefe).
  const faseAch = checkAchievements('phase_end');
  if (faseAch) pushToast(faseAch.name, 3.5);
  if (getCurrentPhase()?.name === 'Castelo' && getCurrentMode() === 'campaign') vooAtivo = PHASE_END_PAUSE;
}
// pilha de velocidade do último frame (telemetria da prova de serviços)
let ultimoStackVelocidade = 1;
let currentBossZoom = 1;
let currentFlash: string | null = null;
/** O véu de radiação da cápsula — sustentado, não pisca como o flash. */
let currentVeil: string | null = null;
let currentShake: { x: number; y: number } = { x: 0, y: 0 };
let selectedMode: GameMode = 'campaign';
let selectedClass: ClassId = 'soldado';
let bossSpawned = false;
/** O chefe da fase já foi derrotado nesta fase. Não confundir com `bossSpawned`. */
let bossKilled = false;
/** Posição atual na fila de chefes do NÚCLEO (`NUCLEO_RUSH`). 0 = primeiro. */
let bossRushIndex = 0;
/** Segundos desde a última biomaquina costurada pelo NÚCLEO. */
let biomaquinaTimer = 0;
/**
 * Cota e ritmo da máquina.
 *
 * A cota é dura (nunca mais que 8 na tela): sem ela, a máquina enche o campo
 * e o jogador deixa de enxergar o chefe. O intervalo é generoso de propósito —
 * a biomaquina é pressão de fundo, não a luta.
 */
const MAX_BIOMAQUINA = 8;
const BIOMAQUINA_A_CADA = 4.5;
/** O versus local já anunciou o vencedor (evita repetir o aviso a cada frame). */
let localTerminou = false;

/**
 * Revanche do versus local: mesma fase, mesma onda, os dois de pé.
 *
 * Não chama `resetGame()` porque isso reinicia a campanha inteira — o P1
 * perderia arma, moedas e LEVEL, e o versus passaria a ter progressão, que é
 * outro jogo. Zera só o que é da PARTIDA: vida dos dois, inimigos na tela e o
 * flag de fim.
 */
function revancheLocal(): void {
  const p = player.getPlayer();
  player.healPlayer(p.maxHealth);
  p.invincible = 0;
  resetPlayer2(worldW, worldH, p.x, p.y);
  for (let i = enemies.length - 1; i >= 0; i--) enemies.splice(i, 1);
  clearBullets();
  playerDied = false;
  localTerminou = false;
  setGameState('playing');
  startMusic();
}

/** Quem ganhou a partida local, e o placar dos dois para a tela. */
function fimLocal(): { vencedor: 'p1' | 'p2'; placar: ReturnType<typeof getPlacarLocal> } | null {
  if (!isLocalEnabled()) return null;
  const p = player.getPlayer();
  // O P1 cai e o jogo vai para `gameover`; o P2 cai e a partida segue em
  // `playing`. Os dois casos precisam da MESMA tela — senão o P2 nunca vê que
  // ganhou, porque o ramo 'p2' de `getWinner` era inalcançável na tela.
  const p1Vivo = p.health > 0;
  const p2Vivo = getPlayer2()?.alive ?? false;
  if (p1Vivo === p2Vivo) return null;
  return {
    vencedor: p1Vivo ? 'p1' : 'p2',
    placar: getPlacarLocal(p.health, p.maxHealth),
  };
}
/** Tela de ficha da arma + mapa grande (TAB). */
let tabAberto = false;
/** Congela o update sem abrir nenhuma tela (harness de projéteis). */
let pausaTiros = false;
/**
 * Respiro de fim de fase.
 *
 * Limpar a última onda abre a loja no mesmo frame. Sem esta pausa o loot que
 * acabou de cair fica no chão enquanto a loja toma a tela, e o jogador nunca o
 * vê. É genérico de propósito: vale para qualquer abate que feche a última
 * onda, não só para o chefe.
 *
 * `phaseEnding` é o trava: sem ele o timer seria re-armado todo frame e a
 * fase nunca fecharia.
 */
let phaseEndPause = 0;
let phaseEnding = false;
/**
 * Segundos restantes de "nave em perigo" na entrada do Espaço (H3): a tela
 * vermelha pulsando dos primeiros instantes, que dá peso à fala do Bot #89.
 */
let perigoNave = 0;
/**
 * Tick do dano de fogo no chão (B7): o fogo cobra a cada 0,5s, não a cada
 * frame — 8/s direto no HP seria invisível no HUD e frustraria sem aviso.
 */
let fireTick = 0;
/**
 * Contagem para a próxima ignição ambiente de barril na fase do NÚCLEO (B7:
 * "barril estourando sozinho"). A máquina é instável e o cenário concorda.
 */
let instabilidadeTimer = 0;
const INSTABILIDADE_A_CADA = 11;
/** H2: o Rogério já apareceu nesta passada pela Fábrica? */
let amigoApareceu = false;
/** Textos: o Júlio já chegou nesta passada pelo Castelo? */
let julioApareceu = false;
/** Textos: a fala da morte do Júlio já abriu (ele pode morrer em jogo)? */
let julioMorteAnunciada = false;
/** Textos (Hospital): o doutor Fernando já chegou nesta passada? */
let doutorApareceu = false;
/** Textos (Hospital): o doutor já tomou o Nando-01 (virou o chefe)? */
let doutorVirou = false;
/** H2: o Rogério já virou (o sentinel caiu)? */
let fernandoVirou = false;
/** Segundos que a linha atual da caixa pequena está na tela (auto-avanço). */
let tempoDaLinha = 0;
/** Objetivos já contabilizados na partida, para o toast de conquista sair uma vez só. */
const objectiveCounted = new Set<string>();
let worldW = 1280;
let worldH = 720;
/**paredes do mapa em coordenadas de mundo, para o minimapa */
let wallRects: { x: number; y: number; w: number; h: number }[] = [];
let mapDensity = 0;
let reachZones: ReachZone[] = [];

/**
 * Acha uma célula andável a 8–12 células do spawn, para o sobrevivente do
 * objetivo `protect`.
 *
 * Distância importa: com o NPC colado no jogador, "proteger o sobrevivente" e
 * "proteger a si mesmo" viram literalmente o mesmo objetivo, e o arqueiro
 * caçando o NPC fica indistinguível de qualquer inimigo normal.
 */
function findVipCell(origin: { col: number; row: number }): { col: number; row: number } {
  const direcoes: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const raio of [12, 11, 10, 9, 8]) {
    for (const [dc, dr] of direcoes) {
      const col = origin.col + dc * raio;
      const row = origin.row + dr * raio;
      if (!isWall(col, row) && hasPath(origin.col, origin.row, col, row)) return { col, row };
    }
  }
  return { col: origin.col + 1, row: origin.row };
}

/**
 * Os retângulos de parede do minimapa. Extraído do load: a QUEDA DA PONTE
 * (M3) muta células em runtime e o minimapa conta a história — a ponte
 * sumindo do mapa enquanto ela cai é metade da leitura.
 */
function rebuildWallRects(): void {
  const map = getMap();
  if (!map) return;
  wallRects = [];
  let wallCount = 0;
  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      if (map.cells[row][col] !== '#') continue;
      wallCount++;
      wallRects.push({ x: col * CELL_SIZE, y: row * CELL_SIZE, w: CELL_SIZE, h: CELL_SIZE });
    }
  }
  mapDensity = wallCount / (map.cols * map.rows);
}

function loadPhaseEnvironment(): void {
  const phase = getCurrentPhase();
  const biome = BIOMES[phase.map];
  const map = loadMap(biome.rows);

  // A trava de fim de fase é por fase: sem zerar aqui, a fase seguinte
  // nasceria com a pausa ainda armada e a loja nunca abriria.
  phaseEnding = false;
  phaseEndPause = 0;

  // Estado de ONDA é por fase: sem isto, a cota parcial da última onda da
  // fase anterior vinha junto, e o primeiro frame da nova onda 1 lia
  // "cota cheia + campo vazio" como onda completa — a fase abria na ONDA 2
  // (o "onda 2 na entrada" do relato de 2026-10-14). Vai ANTES do
  // setPhaseDifficulty: o reset não toca mais em difficulty/phaseTime.
  resetSpawner();

  worldW = map.width;
  worldH = map.height;
  setWorldSize(worldW, worldH);

  rebuildWallRects();

  clearProps();
  initProps(map.cells);
  // A cápsula BioGen existe DESDE O INÍCIO da Fábrica (relato do Murilo:
  // "poderia ter a cápsula desde o início da fase"): o Rogério conta a
  // história dela na caixa pequena, ela estoura no meio da conversa e o
  // que estava dentro sai. Nas outras fases não nasce nada.
  if (phase.name === 'Fábrica' && getCurrentMode() === 'campaign') {
    const canto = findFreeSpotNear(worldW * 0.62, worldH * 0.38, CELL_SIZE);
    spawnCapsula(canto.x, canto.y);
  }
  setPhaseDifficulty(phase.difficulty ?? 1);
  setPhaseTime(0);
  phaseElapsed = 0;
  clearTerrain();
  buildTerrain(biome, map.cells);

  reachZones = findAll('R').map(p => ({ ...cellCenter(p.col, p.row), radius: CELL_SIZE }));
  initObjective(phase.objective, phase.objectiveTarget);

  const spawn = findAll('P')[0] ?? { col: 1, row: 1 };
  const pos = cellCenter(spawn.col, spawn.row);

  // O objetivo protect precisa de um alvo determinístico. No Castelo o alvo
  // é o FOGUETE (decisão do dono, 2026-10-12: "as ondas atacam o foguete,
  // não uma escolta") — o prop `F` entra com o mapa. Sem foguete no mapa,
  // cai no sobrevivente legado: nasce do lado do jogador, e o índice 0 é o
  // que o objectives.ts lê.
  resetNPCs();
  if (phase.objective === 'protect' && !getRocket()) {
    const vipCell = findVipCell(spawn);
    const vip = cellCenter(vipCell.col, vipCell.row);
    spawnNPC(vip.x, vip.y, 1);
  }
  // Serviços comprados na loja ANTERIOR aplicam na entrada desta fase. O
  // consumo é o único caminho: quem paga em 'shop' recebe aqui, na ordem
  // natural (leaveShop → loadPhaseEnvironment).
  marteloForcado = false;
  anuncioDeOndaPendente = false;
  vooAtivo = 0;
  bossGritoTexto = '';
  bossGritoTimer = 0;
  checkAchievements('phase_start');
  zeraMoedasGeradas();
  resetAmbiente(phase.name);
  // A QUEDA DA PONTE (M3): só a Ponte atravessa com o chão cedendo — nas
  // outras fases o estado limpa (a run nova não herda a ponte caída)
  if (phase.name === 'Ponte') armarQuedaDaPonte();
  else resetQuedaDaPonte();
  for (const svc of consumeShopServices()) {
    // os dois aliados nascem colados no jogador: ±40px às cegas podia pôr o
    // corpo DENTRO da parede (spawn de borda) — o mesmo resgate do loot
    const postContratado = pushOutOfWalls(pos.x + 40, pos.y, 16);
    const postTorreta = pushOutOfWalls(pos.x - 40, pos.y, 16);
    if (svc === 'hire') {
      // soldado contratado: te segue e atira no inimigo visível mais próximo
      spawnNPC(postContratado.x, postContratado.y, 1, 'soldier', {
        modo: 'contratado', nome: 'Contratado',
        postX: postContratado.x, postY: postContratado.y,
        alcance: 280, dano: 6, intervalo: 0.55, tiroTimer: 0, angulo: 0,
      }, 'gun'); // pose armada (playtest: 'hold' é mãos vazias)
    } else if (svc === 'turret') {
      // torreta de entrada: fixa no posto, atira sozinha com linha de visão
      spawnNPC(postTorreta.x, postTorreta.y, 1, 'soldier', {
        modo: 'torreta', nome: 'Torreta', sprite: 'prop_torreta', vida: 150,
        postX: postTorreta.x, postY: postTorreta.y,
        alcance: 320, dano: 5, intervalo: 0.45, tiroTimer: 0, angulo: 0,
      });
    }
  }
  player.placePlayer(pos.x, pos.y);
  initCamera(worldW, worldH, canvas.width, canvas.height, pos.x, pos.y);
  bossSpawned = false;
  bossKilled = false;
  bossRushIndex = 0;
  biomaquinaTimer = 0;
  instabilidadeTimer = 0;
  amigoApareceu = false;
  fernandoVirou = false;
  julioApareceu = false;
  julioMorteAnunciada = false;
  doutorApareceu = false;
  doutorVirou = false;
  perigoNave = phase.name === 'Espaço' ? PERIGO_NAVE_SEGUNDOS : 0;
  clearFires();
}

function resetGame() {
  resetPhases();
  loadPhaseEnvironment();
  hideSupportUrl();
  player.resetPlayerProgress();
  resetWeapons();
  // a ferrugem só range uma vez por arma por partida: sem isto, pegar a mesma
  // enferrujada de novo na loja não faria som nenhum
  resetFerrugem();
  resetShop();
  resetEffects();
  resetSkills();
  // H2: a fúria começa travada em toda partida nova (decisão do Murilo) e a
  // caixa pequena não vaza estado entre partidas — o continue da Fábrica é o
  // único caminho que abre a fúria de novo.
  resetFuria();
  resetDialogo();
  resetEnvironmentEvents();
  resetPermanentMagnet();
  resetCombos();
  resetBots();
  resetRegen();
  // perks e stats vivem em módulo e o resetShop/resetPlayerProgress não os
  // conhecem: sem isto a run seguinte começa com a escada da anterior e o
  // `damageMult` já multiplicado — o jogador comprou duas vezes o que pagou uma.
  resetPerks();
  resetStats();
  resetSkins();
  resetAds();
  resetNPCs();
  resetStory();
  resetClass();
  resetProgress();
  resetPieces();
  resetDanoTelemetria();
  bossZoomTriggered = false;
  // Timers e flags de módulo: sem reset aqui, um valor residual de uma partida
  // sobrevive à próxima — o respiro segurava a ida à loja e a fase seguinte
  // abria com o overlay de transição ainda no ar.
  playerDied = false;
  phaseEndPause = 0;
  phaseEnding = false;
  phaseTransitionTimer = 0;
  wasJammed = isJammed();
  enemies.length = 0;
  killTimes.length = 0;
  damageNumbers.length = 0;
  achievementNotifications.length = 0;
  clearBullets();
  clearCoins();
  clearParticles();
  clearExplosions();
  clearFires();
  clearLoot();
  resetInput();
}

/** Entra no jogo a partir do save (tecla C no menu). */
function startFromSave() {
  const save = loadGame();
  if (!save) return;
  initAudio();
  startMusic();
  resetGame();
  loadClass();
  setGameMode('campaign');
  // M4: o save resolve a fase por NOME — reordenar a campanha não pode
  // puxar o jogador para outra fase (o índice gravado envelhece a cada
  // reordenação; o nome não). Save antigo sem o nome cai no índice.
  const idxPorNome = PHASES.findIndex(ph => ph.name === save.phaseName);
  const faseAlvo = save.phaseName && idxPorNome >= 0 ? idxPorNome : save.phase;
  for (let i = 0; i < faseAlvo; i++) nextPhase();
  loadPhaseEnvironment();
  setShopCoins(save.coins);
  addScoreFlat(save.score);
  // arma equipada + inventário + upgrades precisam ser reatribuídos — antes o
  // continue caía em resetShop() e o jogador voltava só com a pistola
  restoreSavedWeapons(save.weapons);
  if (save.weapons.length > 0) {
    // a QUALIDADE viaja junto (playtest: "sobreescreveção de uma pistola
    // após continuar"): o save guarda o PAR {index, quality} — equipar
    // só pelo índice devolvia a arma com a qualidade errada
    const par = save.weapons.find(w => w.index === save.weaponIndex);
    setWeapon(save.weaponIndex, par?.quality);
    announceWeapon(save.weaponIndex);
  }
  restoreUpgrades(save.upgrades);
  applySavedTalentos(save.talentos ?? []);
  restoreXp(save.xp ?? 0);
  // peças: sem isto o `resetPieces()` de `resetGame` apagava a mochila e as
  // equipadas, e o jogador voltava da peça que tinha comprado sem ela.
  // Save antigo sem o campo entra vazio.
  restoreInventory(save.pieces ?? []);
  restoreEquipped(save.equippedPieces ?? {});
  // H2: a fúria viaja no save. Save antigo sem o campo entra TRAVADO — a
  // decisão do Murilo: o gate é a história, vale igual para novos e antigos.
  restoreFuria(save.furia === true);
  setGameState('playing');
  // playtest: "quando clico em C, continua a música do menu" — o continue
  // entrava em playing sem trocar a faixa; a música de combate é a do jogo
  void playMusic('combat');
  loadAchievements();
  loadDiary();
  resetRunCounters();
  resetBehavior();
  resetInput();
}

// ─── Update ────────────────────────────────────────────────────

function update(dt: number) {
  const state = getGameState();

  // painel de configurações congela o estado subjacente
  if (isSettingsOpen()) {
    if (consumeEnter()) applySettingsSelection();
    return;
  }

  // TAB é uma tela de consulta: o mundo congela atrás dela
  if (tabAberto && state === 'playing') return;
  if (pausaTiros && state === 'playing') return;

  if (state === 'menu') {
    if (isShowingCutscene()) {
      updateCutscene(dt);
      if (consumeEnter() || keys[' '] || consumeCutsceneClick()) {
        const finished = advanceCutscene();
        if (finished) startRun();
      }
    } else if (consumeEnter()) {
      initAudio();
      startMusic();
      resetGame();
      showCutscene();
      sfxMenuSelect();
    }
    return;
  }

  if (state === 'paused') {
    if (consumeEnter()) applyPauseOption();
    return;
  }

  if (state === 'gameover') {
    if (consumeEnter()) {
      // No versus local o ENTER é REVANCHE, não voltar ao menu: o modo promete
      // duas partidas seguidas e mandar o jogador pro menu a cada queda
      // transformava o versus em duas partidas com ida e volta.
      if (isLocalEnabled()) revancheLocal();
      else {
        resetGame();
        setGameState('menu');
        // volta do gameover: sem isto a música de combate loopa
        // para sempre no menu (stopMusic nunca era chamado aqui)
        startMusic();
      }
      resetInput();
    }
    return;
  }

  // A cutscene de fase roda em `playing`, não no menu: `leaveShop()` abre a
  // cena da próxima fase e o combate só começa quando ela acaba. Sem este
  // early-return, o jogador lutava por cima da narração.
  if (state === 'playing' && isShowingCutscene()) {
    updateCutscene(dt);
    if (consumeEnter() || keys[' '] || consumeCutsceneClick()) {
      // "Era o epílogo?" se pergunta ANTES de avançar: o índice depois do fim
      // de uma cena aponta para a SEGUINTE — e a abertura do NÚCLEO-CENTRAL,
      // que antecede o epílogo, termina com o índice EM CIMA do epílogo.
      // Perguntar depois era responder true para a abertura da fase final:
      // o jogador passava a cutscene de entrada e ganhava o fim de campanha
      // — o Game Over "ao entrar no Bunker" que o Murilo reportou duas vezes.
      const eraEpilogo = isEpilogueScene();
      const finished = advanceCutscene();
      if (finished) {
        // o epílogo não abre a fase: ele encerra a campanha
        if (eraEpilogo) setGameState('gameover');
        else resetInput();
      }
    }
    return;
  }

  // A caixa pequena da Fábrica (H2): PAUSADO POR LINHA (decisão do Murilo) —
  // o mundo congela atrás, o ENTER avança. O auto-avanço de 10s existe para
  // quem soltou o teclado (e para os harnesses): a caixa nunca prende, mas
  // os 10s dão leitura tranquila — a caixa é pausada por linha, não um
  // modo sem saída.
  if (state === 'playing' && dialogoAtivo()) {
    tempoDaLinha += dt;
    // O clique do mouse anda junto: o relato do Murilo na Fábrica era o
    // overlay escuro + "espaço + Enter, o que é ruim — poderia ser mouse
    // também". A caixa é a única entrada que não aceitava clique.
    if (consumeEnter() || consumeCutsceneClick() || tempoDaLinha >= 10) {
      tempoDaLinha = 0;
      const fechou = avancarDialogo();
      // M2: a onda que nasceu junto com este diálogo se anuncia AGORA — o
      // mundo voltou a andar, o aviso chega junto com os primeiros passos.
      if (fechou && anuncioDeOndaPendente) {
        anuncioDeOndaPendente = false;
        sfxWaveStart();
      }
    }
    return;
  }

  if (state === 'shop') {
    updateShopAds(dt);
    updateSupportUrl(dt);
    for (const t of consumeShopPowerups()) {
      const pd = player.getPlayer();
      if (t === 'health') player.healPlayer(30);
      else if (t === 'shield') pd.shield += 2;
      activePowerups[t] = POWERUP_TYPES[t]?.duration ?? 0;
      damageNumbers.push({ x: pd.x, y: pd.y - 24, text: powerupLabel(t), color: POWERUP_TYPES[t]?.color ?? '#ccc', life: 1.4, vy: -70 });
    }
    if (consumeEnter()) leaveShop();
    return;
  }

  if (state !== 'playing') return;

  // Fim de partida do versus local: o P2 caiu e a partida CONTINUA em `playing`
  // (só a morte do P1 muda o estado), então é aqui que ela precisa ser travada
  // — e aqui que o ENTER da tela tem que ser lido. Sem este ramo a tela
  // anunciava "ENTER revanche" e nenhuma tecla fazia nada: o único ramo que
  // chama `revancheLocal` mora no `gameover`, que a queda do P2 nunca alcança.
  // Foi o que `local2p-proof.mjs` pegou.
  if (localTerminou && fimLocal()) {
    if (consumeEnter()) revancheLocal();
    return;
  }

  const p = player.getPlayer();
  const phase = getCurrentPhase();
  const hard = getCurrentMode() === 'hardcore';

  if (phaseTransitionTimer > 0) phaseTransitionTimer -= dt;
  if (phaseEndPause > 0) phaseEndPause = Math.max(0, phaseEndPause - dt);
  if (vooAtivo > 0) vooAtivo = Math.max(0, vooAtivo - dt);
  if (bossGritoTimer > 0) bossGritoTimer = Math.max(0, bossGritoTimer - dt);
  if (perigoNave > 0) perigoNave = Math.max(0, perigoNave - dt);
  phaseElapsed += dt;
  setPhaseTime(phaseElapsed);

  const biomasMods = biomeModifiers(phase);
  const phaseDmgMult = biomasMods.dmgMult;
  const phaseSpeedMult = biomasMods.speedMult;

  // ── movimento ──
  let mx = 0;
  let my = 0;
  if (keys['w'] || keys['arrowup']) my -= 1;
  if (keys['s'] || keys['arrowdown']) my += 1;
  if (keys['a'] || keys['arrowleft']) mx -= 1;
  if (keys['d'] || keys['arrowright']) mx += 1;
  setMoveDirection(mx, my);

  // As Botas de Campo da loja (M3) são o MESMO efeito do power-up `botas`,
  // pagas antecipadamente e válidas só na fase em que foram compradas — o
  // flag é zerado no load de cada fase e rearmado pelo consumeShopServices.
  const speedMult = hasPowerUp('speed') ? 1.5 : hasPowerUp('botas') ? 1.3 : hasPowerUp('trajeNucleo') ? 1.3 : 1;
  const classSpeedMult = getClassSpeedMult();
  // lama deixa o jogador lento — é o efeito mecânico do bioma Pântano
  const onMud = phase.hazard === 'mud' && charAt(colAt(p.x), rowAt(p.y)) === '^';
  // A pilha completa de velocidade fica exposta para o piso da bala: quem
  // corre não alcança o próprio tiro (relato do Murilo: "consigo andar mais
  // rápido que as balas" — 320 base vira 744 com perks + power-up + Ponte).
  const stackDeVelocidade = speedMult * (onMud ? 0.55 : 1) * phaseSpeedMult * classSpeedMult;
  ultimoStackVelocidade = stackDeVelocidade;
  player.movePlayer(keys, dt, { w: worldW, h: worldH }, stackDeVelocidade);

  updateSkills(dt, p, { w: worldW, h: worldH });
  // PASSO FANTASMA: o dash fere quem atravessa (25, uma vez por dash).
  if (isSkillActive('dash')) {
    for (const e of enemies) {
      if (e.health <= 0) continue;
      if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius + 6) {
        const dano = danoPassoFantasma(e, true);
        if (dano > 0) {
          e.health -= dano;
          e.hitFlash = 0.2;
          spawnParticles(e.x, e.y, '#c8b890', 8, 200);
        }
      }
    }
  }
  // Uma chamada só: as duas linhas antigas rodam a segunda busca de (x novo,
  // y velho), pois a primeira já tinha escrito p.x — estado meio-migrado que
  // podia re-sediar o resgate num ponto diferente do que o .x sugeria.
  const foraDaParede = pushOutOfWalls(p.x, p.y, p.radius);
  p.x = foraDaParede.x;
  p.y = foraDaParede.y;

  // ── mira: mouse é de tela, mundo é maior ──
  const aim = screenToWorld(mouse.x, mouse.y);
  p.angle = Math.atan2(aim.y - p.y, aim.x - p.x);

  applyRegen(dt);
  // MÉDICO: cura por segundo enquanto há inimigo em campo, em vez de por
  // abate. Contar abates premiava matar cinco inimigos fracos em vez de
  // segurar a linha contra um mutante.
  // A guarda de Hardcore é obrigatória: sem ela a classe curava em Hardcore,
  // que promete "sem loja, sem cura".
  const hpPorSegundo = hard ? 0 : getClassHealthPerSecond();
  if (hpPorSegundo > 0 && enemies.some(e => e.spawnDelay <= 0)) {
    player.healPlayer(hpPorSegundo * dt);
  }
  if (hasPowerUp('invincible')) p.invincible = Math.max(p.invincible, 0.1);

  // ── flow field (IA dos inimigos) ──
  rebuildFlowField(colAt(p.x), rowAt(p.y));
  // O campo do alvo do protect: o foguete é estático e o cache por célula faz
  // isto custar uma comparação depois da primeira chamada da fase.
  const alvoProtect = getRocket();
  if (alvoProtect) rebuildFlowFieldAlvo(alvoProtect.col, alvoProtect.row);

  // ── local 2P ──
  if (isLocalEnabled()) {
    movePlayer2(keys, dt, worldW, worldH);
    const p2 = getPlayer2();
    if (p2 && p2.alive && keys['l']) {
      const bullet = shootPlayer2();
      if (bullet) spawnBullet(bullet.x, bullet.y, bullet.vx, bullet.vy, bullet.damage, false, bullet.color, false, false, 0, false);
    }
    // P2 leva o mesmo dano que P1. Sem isto o versus não tinha perdedor: o P2
    // só matava, nunca morria, e a tela nunca tinha fim.
    for (const b of getBullets()) {
      if (!b.isEnemy || !p2?.alive) continue;
      if (bulletHitsCircle(b, p2.x, p2.y, p2.radius + 5)) {
        damagePlayer2(b.damage);
        b.life = 0;
      }
    }
    for (const e of enemies) {
      if (!p2?.alive) break;
      if (checkPlayer2EnemyCollision(e.x, e.y, e.radius)) damagePlayer2(e.damage);
    }
    // Fim de partida do versus: um caiu e o outro não.
    const vencedor = getWinner();
    if (vencedor && !localTerminou) {
      localTerminou = true;
      pushToast(vencedor === 'p1' ? 'P1 VENCEU' : 'P2 VENCEU', 4, 'equip');
      sfxGameOver();
    }
  }

  // ── eventos ambientais (agora com dimensões do mundo) ──
  const envResult = updateEnvironmentEvents(dt, enemies, p.x, p.y, worldW, worldH, phase.hazard);
  // A AMBIÊNCIA do lugar (M1): one-shots periódicos — gaivota no cais,
  // gotejamento na caverna, apito no pátio, drone no vácuo
  for (const chave of updateAmbiente(dt)) sfxAmbiente(chave);
  // O EMPURRÃO do tornado no jogador (M1): moveCircleBy para não furar
  // parede — ser empurrado PARA DENTRO de um muro não é física de vento.
  if (envResult.playerPush.x !== 0 || envResult.playerPush.y !== 0) {
    const movido = moveCircleBy(p.x, p.y, envResult.playerPush.x, envResult.playerPush.y, p.radius);
    p.x = movido.x;
    p.y = movido.y;
  }
  for (const d of envResult.enemyDamages) {
    damageNumbers.push({ x: d.x + (Math.random() - 0.5) * 16, y: d.y, text: String(Math.floor(d.damage)), color: d.color, life: 0.8, vy: -60 });
  }
  if (envResult.playerDamage > 0 && p.invincible <= 0) {
    const dmg = damageTaken(envResult.playerDamage);
    if (dmg > 0) {
      checkAchievements('damage_taken');
      player.enemyCollisionDamage(dmg, { fonte: 'evento' });
      sfxPlayerHit();
      triggerDamageFlash();
    }
  }

  // ── hazard do bioma ──
  updateBiomeHazard(dt, p);

  // B7: o fogo no chão da fase final fere quem fica em cima — 4 a cada
  // 0,5s, na fonte 'bioma' (hazard do mundo, como espinho e lava). O
  // `invincible` do jogador é respeitado: o escudo/cura tem valor contra
  // o incêndio também.
  fireTick -= dt;
  if (fireTick <= 0) {
    fireTick = 0.5;
    if (pisaEmFogo(p.x, p.y, p.radius) && p.invincible <= 0) {
      const total = damageTaken(4);
      if (total > 0) {
        player.enemyCollisionDamage(total, { fonte: 'bioma' });
        sfxPlayerHit();
        triggerDamageFlash();
      }
    }
  }

  // ── disparo ──
  p.shootCooldown -= dt;
  updateReload(dt);
  if (mouse.down && p.shootCooldown <= 0 && canShoot()) {
    const weapon = getCurrentWeapon();
    p.shootCooldown = getEffectiveShootRate() * getComboCooldownMult() * getFuryCooldownMult();
    const multiShot = hasPowerUp('multiShot');
    // A bala nasce no BICO DO CANO, no mesmo ponto do flash — antes saía do
    // centro do peito, 24px atrás do flash, e o relato do Murilo era
    // exato: "as balas não saem certinhas do bico do cano da arma". O cano
    // da pose desenhada termina perto dos 24px na direção da mira; flash e
    // bala agora concordam.
    const DISTANCIA_DO_CANO = 24;
    const muzzleX = p.x + Math.cos(p.angle) * DISTANCIA_DO_CANO;
    const muzzleY = p.y + Math.sin(p.angle) * DISTANCIA_DO_CANO;
    // A velocidade de quem atira: durante o dash é a do dash (800 px/s —
    // mais rápido que 4 armas), fora dele é a pilha completa de corrida.
    const velocidadeDoAtirador = isSkillActive('dash') ? 800 : p.speed * stackDeVelocidade;
    const fired = shoot(muzzleX, muzzleY, p.angle, multiShot, getDamageMultiplier() * getComboDamageBonus() * phaseDmgMult * getClassDamageMult(), velocidadeDoAtirador);
    for (const b of fired) {
      spawnBullet(b.x, b.y, b.vx, b.vy, b.damage, false, b.color, b.pierce, b.explosive, b.explosionRadius, b.isCrit, b.bulletSprite);
    }
    spawnParticles(muzzleX, muzzleY, weapon.color, 4, 120, 'muzzle');
    playWeaponSound(weapon.name);
    registerShot();
    // PISTOLA INCANDESCENTE: cada 5º tiro acende o inimigo mais próximo do
    // cano (DoT 2/s por 3s, tick em tickPerks abaixo).
    if (registrarTiroPerks()) {
      let alvo: Enemy | null = null;
      let melhor = Infinity;
      for (const e of enemies) {
        if (e.health <= 0) continue;
        const d = Math.hypot(e.x - muzzleX, e.y - muzzleY);
        if (d < melhor) { melhor = d; alvo = e; }
      }
      if (alvo && melhor < 600) {
        acenderInimigo(alvo);
        spawnParticles(alvo.x, alvo.y, '#c46a3a', 8, 120);
      }
    }
    const jammedNow = isJammed();
    if (jammedNow && !wasJammed) sfxJammed();
    wasJammed = jammedNow;
    if (getCurrentAmmo() <= 0) startReload();
  }

  if (p.invincible > 0) p.invincible -= dt;

  // SEGUNDO FÔLEGO: abaixo de 30% da vida máxima, 1,5s invencível (uma vez).
  const folego = checarSegundoFolego(p.health, p.maxHealth);
  if (folego > 0) {
    p.invincible = Math.max(p.invincible, folego);
    spawnParticles(p.x, p.y, PALETTE.moss, 20, 250);
  }

  // Queimadura do Incandescente: o DoT corre aqui, junto dos inimigos.
  for (const t of tickPerks(dt)) {
    const alvo = t.inimigo as Enemy;
    if (alvo.health > 0) {
      alvo.health -= t.dano;
      alvo.hitFlash = 0.1;
    }
  }

  // ── ondas ──
  const rect = { w: worldW, h: worldH, px: getCamX(), py: getCamY(), viewW: canvas.width, viewH: canvas.height };
  const chefeVivo = phase.boss !== undefined && enemies.some(e => ENEMY_TYPES[e.type]?.isBoss);
  // A fase do NÚCLEO não tem onda comum: é a fila de 4 chefes desde a entrada
  // (DECISIONS #169 — o jogador elogiou o ritmo "morre um e vem outro"). Sem
  // isto o spawner joga horda por cima dos chefes e a fase vira duas coisas ao
  // mesmo tempo; com isto, a única coisa que decide quando o próximo chefe
  // nasce é a queda do anterior (`proximoDoRushNasce`).
  const ehRushDoNucleo = phase.boss === 'nucleo' && getCurrentMode() === 'campaign';
  // Durante a luta contra o chefe o spawner não corre: a última onda já foi
  // zerada pelo `waveComplete` e, sem isto, ele reabastecia a cota dela e
  // jogava reforço na tela enquanto o chefe morria.
  const waveComplete = (chefeVivo || ehRushDoNucleo) ? false : spawnWaveEnemies(dt, enemies, getCurrentWave(), phase.enemyTypes, worldW, worldH, rect, phase.mutantsPerWave ?? 0);
  // `clear` libera o chefe na largada; os outros, só quando o objetivo é
  // cumprido. Declarado aqui porque o respiro da última onda (logo abaixo)
  // e o `deveFecharFase` precisam dele: sem o termo, o Vulcão fechava a
  // última onda com o countdown rodado e o chefe nunca nascido (o `reach`
  // pede o jogador dentro da zona de extração) — e `!chefeVivo` é verdade
  // por vacuidade enquanto isso.
  //
  // Lê com `peekObjective` e não com o `objective` do bloco de baixo: aquele
  // é calculado depois deste ponto, e mover o `updateObjective` para cima
  // mudaria a ordem em que o objetivo é avaliado dentro do frame.
  const objetivoLiberouChefe = phase.objective === 'clear'
    // chefe morto É o latch: o chefe só nasce depois do objetivo, então ele
    // ter caído prova que o objetivo foi cumprido. Ler como re-check vivo
    // deixava a fase aberta para sempre se o sobrevivente caísse depois do
    // chefe — o respiro nunca consumia e a quota da última onda seguia
    // spawnando.
    || bossKilled
    || peekObjective(p.x, p.y, enemies.length, reachZones).done;
  // A QUEDA PAUSA quando o objetivo cumpre (M3): a extração segura o que
  // sobrou — quem atravessa rápido luta com espaço, quem demora, apertado
  if (objetivoLiberouChefe && quedaAtiva()) pausarQueda();
  // ── a queda da Ponte: um tabuleiro que cede uma coluna por vez ──
  const queda = updateQuedaDaPonte(dt, colAt(p.x), rowAt(p.y), setCellChar);
  if (queda.entulho.length > 0) {
    // o passo caiu: o terreno re-prerenderiza (o entulho tem tile), o
    // minimapa aprende as paredes novas, o chão treme
    clearTerrain();
    buildTerrain(BIOMES[phase.map], getMap()!.cells);
    rebuildWallRects();
    triggerScreenShake(5, 0.4);
    sfxExplosion();
    pushToast('A PONTE CEDEU', 1.5, 'aviso');
    // multi-spawn: a queda acorda quem aninhava nos cabos
    for (const cai of queda.acordados) {
      const pool = phase.enemyTypes.filter(t => !ENEMY_TYPES[t]?.isBoss && !ENEMY_TYPES[t]?.isMutant);
      const tipo = pool[Math.floor(Math.random() * pool.length)];
      const nascido = spawnEnemy(tipo, worldW, worldH, 0, cai.x, cai.y);
      if (nascido) enemies.push(nascido);
    }
  }
  if (queda.dano > 0 && p.invincible <= 0) {
    const dmg = damageTaken(queda.dano);
    if (dmg > 0) {
      checkAchievements('damage_taken');
      player.enemyCollisionDamage(dmg, { fonte: 'evento' });
      sfxPlayerHit();
      triggerDamageFlash();
    }
  }
  if (waveComplete) {
    ganhaXp(XP_BONUS_ONDA);
    const fechaFase = getCurrentWave() + 1 >= phase.waves;
    // O chefe precisa estar morto antes de fechar a fase. Sem esta guarda o
    // respiro de 5s começava a contar quando a ÚLTIMA ONDA morria, e o chefe
    // nascia dentro dessa janela (main.ts:800 espera `enemies.length === 0`).
    // O jogador ia para a loja com o chefe vivo na tela, e nunca via o
    // countdown que só era desenhado durante o respiro.
    //
    // No rush do NÚCLEO o respiro não arma aqui: armar no primeiro
    // esvaziamento do campo queimava a pausa do clímax — entre um chefe e
    // outro a fila ainda tem nomes. O respiro do rush é o que o ÚLTIMO da
    // fila arma na própria morte (bloco de morte do chefe).
    const ehNucleoRush = phase.boss === 'nucleo' && getCurrentMode() === 'campaign';
    const rushPorAndar = ehNucleoRush && bossRushIndex < NUCLEO_RUSH.length;
    // B3 (Vulcão, relato do dono — "horda 7: o countdown disparou sem
    // chefe, veio outra horda, e matar o último foi direto pra loja"): sem
    // o `objetivoLiberouChefe` aqui, o countdown armava com o objetivo
    // pendente e expirava sozinho; se o jogador entrasse na zona DEPOIS, a
    // fase fechava no primeiro frame liberado — `!chefeVivo` é verdade por
    // vacuidade, porque o chefe só nasce no bloco abaixo do fechamento — e
    // a loja vinha sem a luta que o mapa promete.
    if (fechaFase && !phaseEnding && !rushPorAndar && objetivoLiberouChefe) {
      armarRespiro();
      ganhaXp(XP_BONUS_FASE);
    }
  }

  // O fechamento da fase mora aqui, fora do `if (waveComplete)`: exigir
  // `waveComplete` prendia a fase na limpeza total do campo, e o jogador
  // só passava depois de matar todo reforço que o spawner tinha criado.
  // `playerDied` ainda é false no frame em que a vida zera (o bloco de morte
  // roda depois deste), então a checagem é pela vida: sem ela, matar o chefe e
  // morrer no mesmo frame abria a loja em vez do game over.
  //
  // `ondaConcluida` é o que separa "terminou a onda" de "chegou na última
  // onda". Duas fontes: o spawner zerou a cota (caminho normal) ou o chefe já
  // nasceu e caiu — este último não passa pelo spawner, porque a cota foi zerada
  // no frame em que o campo esvaziou para o chefe nascer.
  const ondaConcluida = waveComplete || (bossSpawned && !chefeVivo);
  // A fase do NÚCLEO não tem onda comum, então `getCurrentWave() + 1 >=
  // phase.waves` nunca vira verdadeiro para ela: o `ultimaOnda` do predicado
  // ficaria false e a fase NUNCA fecharia. O rush se fecha pela fila — é o
  // ÚLTIMO chefe que arma o respiro na própria morte (bloco de morte), então
  // aqui o termo precisa dizer "é o fim" em vez de "é a última onda".
  const ultimaOnda = ehRushDoNucleo ? true : getCurrentWave() + 1 >= phase.waves;
  if (deveFecharFase({
    ondaCompleta: ondaConcluida,
    ultimaOnda,
    respiroArmado: phaseEnding,
    chefeLiberado: objetivoLiberouChefe,
    respiroRestante: phaseEndPause,
    chefeVivo,
    jogadorMorto: playerDied || p.health <= 0,
  })) {
    nextWave();
    if (!hard) player.healOnWaveComplete();
    npcBark();
    // M2: o anúncio de onda espera a caixa de diálogo fechar — os encontros
    // da Fábrica/Hospital/Castelo abrem a caixa na MESMA onda, e o som sob
    // mundo congelado é anúncio que nunca chegou (relato 2026-10-14).
    let caixaAbriuNestaOnda = false;
    // H2: a SEGUNDA onda da Fábrica traz o Rogério — o amigo do relato
    // do Murilo. O NPC nasce do lado do jogador e a caixa pequena conta
    // a cápsula. O mundo congela na hora (a caixa é pausada por linha).
    if (phase.name === 'Fábrica' && getCurrentWave() === 1 && getCurrentMode() === 'campaign' && !amigoApareceu) {
      amigoApareceu = true;
      caixaAbriuNestaOnda = true;
      spawnNPC(p.x + 60, p.y, 0, 'manBrown');
      abrirDialogo(SEQUENCIA_AMIGO);
    }
    // O HOSPITAL (2026-10-14): o doutor Fernando chega em jogo, na primeira
    // onda — o relato do Murilo: "Ei você, eles estão por todas as partes!
    // Cuidado!" A conversa do Zombonic-24 corre na caixa pequena; o Nando-01
    // vem no gatilho do chefe, e o mapa da região (minimapa) no abate dele.
    if (phase.name === 'Hospital de Campanha' && getCurrentWave() === 1 && getCurrentMode() === 'campaign' && !doutorApareceu) {
      doutorApareceu = true;
      caixaAbriuNestaOnda = true;
      spawnNPC(p.x + 60, p.y, 0, 'hitman');
      abrirDialogo(SEQUENCIA_MEDICO);
    }
    // O CASTELO (textos, 2026-10-14): o encontro do JÚLIO é em jogo, na
    // primeira onda, como NPC. Ele é BÔNUS, não alvo: o objetivo `protect`
    // da fase é o foguete. Sobreviver até o fim paga a sala 4B e o nome.
    if (phase.name === 'Castelo' && getCurrentWave() === 1 && getCurrentMode() === 'campaign' && !julioApareceu) {
      julioApareceu = true;
      caixaAbriuNestaOnda = true;
      spawnNPC(p.x + 60, p.y, 0, 'manBlue');
      abrirDialogo(SEQUENCIA_JULIO);
    }
    if (caixaAbriuNestaOnda) anuncioDeOndaPendente = true;
    else sfxWaveStart();
    const waveAch = checkAchievements('wave', getCurrentWave());
    if (waveAch) pushToast(waveAch.name, 3);
    if (getGameState() === 'shop') enterShop();
  }

  updateBehavior(p.x, p.y, enemies.length);

  if (!bossZoomTriggered) {
    for (const e of enemies) {
      if (ENEMY_TYPES[e.type]?.isBoss) {
        bossZoomTriggered = true;
        break;
      }
    }
  }

  updateEnemyAi(dt, p, phase);

  // ── bots (competitivo) ──
  if (getCurrentMode() === 'competitive') updateBotsAndCompetitors(p);
  resolveCollisions(p);

  endOfFrame(dt, p);


  // ── objetivo da fase ──
  // Em fases com objetivo ≠ clear, cumprir o objetivo encerra a fase: é o que
  // tira o "só matar tudo" e dá uso real ao mapa.
  // ── o sobrevivente do protect caiu: a fase reinicia ──
  // Um objetivo de escolta sem consequência não é escolta: o `protect` devolvia
  // `done: false` para sempre, o chefe nunca aparecia e a fase acabava normal
  // como se nada tivesse acontecido. Reiniciar a fase é mais duro que o fim de
  // fase negativo e não exige sistema de retry — reusa o que já existe para
  // carregar o mapa.
  if (vipDown()) {
    triggerScreenShake(12, 0.6);
    triggerDamageFlash();
    sfxError();
    // O espelho da conquista de salvar: deixar o sobrevivente cair também é
    // história — conte a fase vença ou perca de novo.
    const lossAch = checkAchievements('vip_lost');
    if (lossAch) pushToast(lossAch.name, 4);
    if (bossKilled) {
      // O alvo caiu na janela entre a morte do chefe e a loja. Reiniciar
      // uma fase vencida devolvia as ondas com `bossSpawned` ainda true —
      // a wave pós-boss que o dono reportou no Castelo. A fase segue para
      // a loja; a perda fica registrada na conquista.
      pushToast(getAnyRocket() ? 'O FOGUETE CAIU' : 'SOBREVIVENTE PERDIDO', 3, 'aviso');
      return;
    }
    pushToast(
      getAnyRocket() ? 'O FOGUETE CAIU — RECOMEÇANDO A FASE' : 'SOBREVIVENTE PERDIDO — RECOMEÇANDO A FASE',
      4, 'aviso'
    );
    resetWave();
    loadPhaseEnvironment();
    enemies.length = 0;
    clearBullets();
    // A fase renasce inteira: sem zerar o estado de chefe, o reinício herda
    // `bossSpawned` true e o chefe nunca volta a nascer — só as ondas. É o
    // mesmo reset que o `pularParaUltimaOnda` do bridge já fazia.
    bossSpawned = false;
    bossKilled = false;
    bossZoomTriggered = false;
    return;
  }

  const objective = updateObjective(dt, p.x, p.y, enemies.length, reachZones);
  if (objective.done && !objectiveCounted.has(phase.objective)) {
    objectiveCounted.add(phase.objective);
    const objAch = checkObjectiveAchievement(phase.objective);
    if (objAch) pushToast(objAch.name, 3);
    // alvo protegido até o fim → entrada reativa do diário (o foguete tem a
    // dele; o sobrevivente legado mantém a "Um a um")
    if (phase.objective === 'protect') {
      const evt = getAnyRocket() ? 'rocket_saved' : 'npc_saved';
      if (unlockDiaryEvent(evt)) pushToast('NOVA ENTRADA NO DIÁRIO', 3, 'aviso');
    }
  }

  // ── chefe da fase: campo vazio da última onda, e só depois do objetivo ──
  // O objetivo não encerra a fase: ele LIBERA o chefe. Cumprir o objetivo no
  // primeiro instante encerrava a fase (a `protect` morria na onda 0 de 7, sem
  // chefe), então o objetivo virou o pivot e o chefe o clímax: a fase só acaba
  // quando o chefe cai. `reach` também devolve o chefe agora, não encerra direto.
  // reach nao forca ultima onda: sem o `||`, vale a regra comum (ultima onda +
  // objetivo cumprido + campo vazio). O spawn e no centro do mundo, nao no `B`
  // (extracao no topo do Vulcao = "boss pulou pro espaco").
  const isUltimasOndas = getCurrentWave() === phase.waves - 1;
  // Boss rush do NÚCLEO: a fila `NUCLEO_RUSH` entra uma por vez, cada uma só
  // quando o campo esvaziar. `bossSpawned` fica true do primeiro ao último —
  // ele marca que o clímax começou, não que a fila acabou — e `bossKilled` +
  // o índice dizem qual é o próximo. O fechamento da fase é pulado até o
  // último da fila (ver bloco de morte), então a fase não fecha entre chefes.
  const ehNucleoRush = ehRushDoNucleo;
  // `proximoDoRush` é a função pura em `phases.ts`: o predicado de "a fila
  // pode andar" é `semChefeVivo`, nunca o flag `bossKilled` (que é setado na
  // morte de qualquer chefe e nunca é limpo — usá-lo aqui fazia o NÚCLEO
  // renascer a cada frame; o rush-proof mediu 851 inimigos com os 4 chefes
  // vivos). Ver `proximoDoRushNasce`.
  const proximoDoRush = proximoDoRushNasce({
    ehRush: ehNucleoRush,
    rushComecou: bossSpawned,
    chefeVivo,
    proximaPosicao: bossRushIndex,
    tamanhoDaFila: NUCLEO_RUSH.length,
  });
  // A fase do NÚCLEO não espera "última onda": a fila começa na entrada. Nas
  // demais fases a regra é a comum (última onda + objetivo + campo vazio).
  const horaDoChefe = ehNucleoRush ? true : (objetivoLiberouChefe && isUltimasOndas);
  // O próximo chefe do rush espera só o chefe ANTERIOR cair — não o campo
  // ficar vazio. Com a biomaquina nascendo da máquina a fase inteira, o
  // campo nunca esvazia e a fila travava no primeiro chefe para sempre
  // (DECISIONS #170). A fase normal continua esperando o campo vazio: lá é a
  // última onda que define o momento, e não há máquina pulsando.
  const campoLivre = ehNucleoRush ? true : enemies.length === 0;
  if ((!bossSpawned || proximoDoRush) && phase.boss && horaDoChefe && campoLivre) {
    // O HOSPITAL (2026-10-14): o chefe da fase É o doutor Fernando — a
    // virada corre na caixa pequena ("Nando-01, pois afinal, meu nome é
    // Fernando") e o chefe nasce no fechamento dela, no lugar em que ele
    // estava. O padrão é o da Fábrica com o Rogério; a diferença é que aqui
    // não há chefe de onda antes — a última onda limpa o campo e a virada É
    // a luta de chefe.
    if (phase.name === 'Hospital de Campanha' && getCurrentMode() === 'campaign' && !doutorVirou) {
      doutorVirou = true;
      bossSpawned = true; // reserva o gatilho: o chefe entra no fechamento da caixa
      const doutor = getNPCs().find(n => n.alive);
      abrirDialogo(SEQUENCIA_NANDO, () => {
        const nascimento = findFreeSpotNear(doutor ? doutor.x : worldW / 2, doutor ? doutor.y : worldH / 2, 36);
        resetNPCs();
        const fernando = spawnEnemy('cirurgiao', worldW, worldH, 0, nascimento.x, nascimento.y);
        if (fernando) {
          fernando.spawnDelay = 0;
          fernando.health = fernando.maxHealth;
          enemies.push(fernando);
          triggerBossZoom();
          void playMusic('boss');
        }
      });
    } else {
    // célula livre mais próxima do centro: o centro do mapa é parede em 3 dos
    // 9 biomas, e o boss nascia lá dentro
    const livre = findFreeSpotNear(worldW / 2, worldH / 2, 46);
    const tipoChefe = ehNucleoRush ? NUCLEO_RUSH[bossRushIndex] : phase.boss;
    const boss = spawnEnemy(tipoChefe, worldW, worldH, 0, livre.x, livre.y);
    if (boss) {
      boss.spawnDelay = 0;
      boss.health = boss.maxHealth;
      enemies.push(boss);
      bossSpawned = true;
      // M5: o grito de ENTRADA do chefe — o Maquinista chega gritando
      // "YOU SHALL NOT PASS!" na barra de boss, antes da primeira telegrafia.
      const grito = ENEMY_TYPES[tipoChefe]?.entryShout;
      if (grito) {
        bossGritoTexto = grito;
        bossGritoTimer = 2.6;
      }
      // O CASTELO (2026-10-14): o sacrifício fixo do Cabo Fernandes saiu —
      // era ele a causa do "morreu do nada quando o boss apareceu e voltou
      // a fase pra onda 1" do relato do Murilo. O Júlio fica em campo: se
      // os zumbis o derrubarem, a perda custa a recompensa (sala 4B e o
      // diário dele), não a fase.
      if (ehNucleoRush && bossRushIndex > 0) {
        damageNumbers.push({ x: boss.x, y: boss.y - 60, text: `CHEFE ${bossRushIndex + 1}/${NUCLEO_RUSH.length}`, color: PALETTE.terracotta, life: 2.4, vy: -30 });
      }
      triggerBossZoom();
      void playMusic('boss');
    }
    }
  }

  // A máquina pulsa. Enquanto o NÚCLEO estiver vivo, ele costura gente com
  // peça de robô — e a fase não pode acabar enquanto ele fizer isso.
  //
  // A cota é dura (nunca mais que 8 na tela): sem ela, a máquina enche o
  // campo e o jogador não enxerga o chefe. E o intervalo é generoso de
  // propósito — a biomaquina é pressão de fundo, não a luta.
  //
  // Só quando o NÚCLEO entrou: ele é a ÚLTIMA da fila, e é essa a razão de a
  // fase não poder esvaziar (DECISIONS #170). Pulsando nos três primeiros, a
  // máquina seria só pressão comum e o rush perderia o ritmo de "um morre e
  // vem outro" que o jogador elogiou.
  if (ehNucleoRush && bossRushIndex >= NUCLEO_RUSH.length - 1) {
    const nucleo = enemies.find(e => e.type === 'nucleo');
    if (nucleo) {
      // A cota conta por tipo, e o tipo vem de `SPAWN_PROPRIO`: a máquina
      // costura o que a lista diz, não o que este arquivo sabe de cabeça.
      const lotado = SPAWN_PROPRIO.some(t => enemies.filter(e => e.type === t).length >= MAX_BIOMAQUINA);
      if (!lotado) {
        biomaquinaTimer += dt;
        if (biomaquinaTimer >= BIOMAQUINA_A_CADA) {
          biomaquinaTimer = 0;
          const tipo = SPAWN_PROPRIO[0];
          // nasce perto do NÚCLEO (é a máquina que costura, não o jogador) e
          // longe do jogador: nascer em cima dele é o que o spawner evita com
          // MIN_SPAWN_DISTANCE, e o chefe não pode ser a exceção.
          const ponto = findFreeSpotNear(nucleo.x, nucleo.y, 19);
          if (Math.hypot(ponto.x - p.x, ponto.y - p.y) >= 260) {
            const b = spawnEnemy(tipo, worldW, worldH, 0, ponto.x, ponto.y);
            if (b) {
              enemies.push(b);
              // A máquina costura com metal quente: o berço da biomaquina
              // nasce queimando (B7) — a fase esquenta conforme ela pulsa.
              acenderFogoDaFase(ponto.x, ponto.y, 34);
            }
          }
        }
      }
    }
  }

  // B7: "barril estourando sozinho" — a máquina instável acende um barril
  // vivo ao acaso de tempos em tempos, a fase inteira. O pavio de 0,9s é o
  // aviso que já existe, a cadeia faz o resto, e o chão queima onde caiu.
  if (ehRushDoNucleo) {
    instabilidadeTimer += dt;
    if (instabilidadeTimer >= INSTABILIDADE_A_CADA) {
      instabilidadeTimer = 0;
      const barrisVivos = getProps().filter(pr => pr.kind === 'barrel' && pr.health > 0);
      if (barrisVivos.length > 0) {
        igniteBarrel(barrisVivos[Math.floor(rand(0, barrisVivos.length))]);
        triggerScreenShake(3, 0.2);
      }
    }
  }
  if (phase.objective === 'reach' && objective.done && bossSpawned && getGameState() === 'playing'
      && phaseEndPause <= 0 && !enemies.some(e => ENEMY_TYPES[e.type]?.isBoss)
      && p.health > 0) {
    enemies.length = 0;
    clearBullets();
    triggerScreenShake(14, 0.5);
    // `reach` fecha a fase antes da última onda, então não passa por
    // `nextWave()`. Chamar `leaveShop()` aqui pulava a loja inteira: o Vulcão
    // ia direto para o Espaço sem comprar nada. `setGameState` é o que
    // `nextWave()` costuma fazer antes de chamar `enterShop`.
    setGameState('shop');
    enterShop();
    return;
  }

  // ── morte / game over ──
  if (p.health <= 0 && p.deathTimer === 0) {
    playerDied = true;
    p.deathTimer = 1.5;
    addLeaderboardEntry('Jogador', getScore(), getCurrentWave());
    spawnParticles(p.x, p.y, PALETTE.moss, 30, 300, 'smoke');
    spawnParticles(p.x, p.y, PALETTE.title, 15, 200);
    triggerScreenShake(12, 0.6);
    sfxGameOver();
  }
  if (p.deathTimer > 0) {
    p.deathTimer -= dt;
    p.deathAngle += 8 * dt;
    if (p.deathTimer <= 0) {
      setGameState('gameover');
      resetInput();
    }
  }

  if (wasGameCompleted() && !playerDied) {
    markGameCompleted();
    pushToast('FINAL SECRETO: PERFEIÇÃO', 5);
    playerDied = true;
  }

  currentFlash = updateFlash(dt);
  currentVeil = updateVeil(dt);
  currentBossZoom = updateBossZoom(dt);
  currentShake = updateScreenShake(dt);
  setShake(currentShake.x, currentShake.y);
  updateCamera(dt, p.x, p.y);

  // atirar adianta a dica: o jogador já aprendeu a mirar, insistir no texto
  // só atrasa o combate
  if (isTutorialActive() && mouse.down) advanceHint();

  // toasts decaem com dt, não com frame rate
  for (let i = achievementNotifications.length - 1; i >= 0; i--) {
    achievementNotifications[i].time -= dt;
    if (achievementNotifications[i].time <= 0) achievementNotifications.splice(i, 1);
  }
}

/** Hazard do bioma, aplicado sobre o tile onde o jogador está. */
function updateBiomeHazard(dt: number, p: ReturnType<typeof player.getPlayer>): void {
  const phase = getCurrentPhase();
  const ch = charAt(colAt(p.x), rowAt(p.y));
  const onHazard = ch === '^';
  if (!onHazard || phase.hazard === 'none') return;

  const dmg = phase.hazard === 'lava' ? 12 : phase.hazard === 'spikes' ? 8 : phase.hazard === 'electric' ? 14 : 0;
  if (dmg > 0 && p.invincible <= 0) {
    const total = damageTaken(dmg);
    if (total > 0) {
      player.enemyCollisionDamage(total, { fonte: 'bioma' });
      sfxPlayerHit();
      triggerDamageFlash();
    }
  }
  if (phase.hazard === 'mud') {
    // dano por segundo parado na lama
    p.health = Math.max(0, p.health - 4 * dt);
  }
  if (phase.hazard === 'electric') {
    p.invincible = Math.max(p.invincible, 0.35);
    if (Math.random() < dt * 6) spawnParticles(p.x, p.y, '#c8b890', 2, 90, 'smoke');
  }
}

/**
 * Detona os barris cujo pavio acabou de queimar.
 *
 * O pavio é contado em `updateProps`, que devolve quem expirou — esta função
 * só converte isso em explosão.
 */
function updateBarrels(dt: number): void {
  for (const prop of updateProps(dt)) explodeProp(prop);
}

/**
 * B7 (o cenário destrutivo da fase final): na fase do NÚCLEO, o que explode
 * deixa o chão queimando — barril, tiro explosivo, chefe que cai e a
 * biomaquina recém-costurada. Nas outras fases o mundo é o de sempre: o
 * pedido é da fase final, não de uma mecânica global de incêndio.
 */
function acenderFogoDaFase(x: number, y: number, raio: number = FOGO_RAIO): void {
  if (getCurrentPhase().boss === 'nucleo' && getCurrentMode() === 'campaign') {
    spawnFire(x, y, raio);
    spawnParticles(x, y, PALETTE.terracotta, 6, 120, 'smoke');
  }
}

function explodeProp(prop: Prop): void {
  const { radius, damage } = getBlast(prop);
  if (radius > 0) {
    createExplosion(prop.x, prop.y, radius, damage, enemies, PALETTE.terracotta);
    // M5 "Pirotecnista": abates que ESTA explosão causou — contados depois
    // do dano aplicado (health <= 0 dentro do raio), não antes (estimativa
    // com falloff contaria sobrevivente).
    if (prop.kind === 'barrel') {
      const abates = enemies.filter(e => e.health <= 0
        && Math.hypot(e.x - prop.x, e.y - prop.y) < radius).length;
      if (abates > 0) {
        const barrilAch = checkAchievements('barril', abates);
        if (barrilAch) pushToast(barrilAch.name, 3);
      }
    }
    acenderFogoDaFase(prop.x, prop.y);
    spawnParticles(prop.x, prop.y, PALETTE.terracotta, 14, 220);
    sfxExplosion();
    triggerScreenShake(6, 0.25);
  }
  const p = player.getPlayer();
  if (Math.hypot(p.x - prop.x, p.y - prop.y) < radius && p.invincible <= 0) {
    player.enemyCollisionDamage(damageTaken(damage), { fonte: 'barril' });
    sfxPlayerHit();
    triggerDamageFlash();
  }
  const destruidos = detonateProp(prop);
  if (destruidos.length > 1) {
    const chainAch = checkAchievements('chain', destruidos.length);
    if (chainAch) pushToast(chainAch.name, 3);
  }
  for (const destroyed of destruidos) {
    if (destroyed !== prop) {
      spawnParticles(destroyed.x, destroyed.y, PALETTE.mustard, 6, 140);
      if (destroyed.kind === 'crate' && Math.random() < 0.5) {
        spawnCoins(destroyed.x, destroyed.y, 1);
      }
    }
  }
}

/**
 * Detona um projétil explosivo no ponto em que ele está.
 *
 * Antes a explosão morava DENTRO do callback de colisão inimigo
 * (checkBulletEnemyCollisions), então o RPG atravessava parede e caixote e só
 * estourava se acertasse alguém — e, se não acertasse ninguém, voava até o
 * fim da vida e sumia. Agora todo caminho de fim (inimigo, parede, prop,
 * pavio) passa por aqui, e o flag `detonated` impede a dupla.
 */
function detonateBullet(b: Bullet): void {
  if (b.detonated) return;
  b.detonated = true;
  b.life = 0;
  // `createExplosion` itera SÓ os enemies da lista — o jogador nunca toma
  // dano de explosão de arma própria. Barril é exceção proposital em
  // `explodeProp`: é perigo do mundo, não do seu próprio tiro.
  createExplosion(b.x, b.y, b.explosionRadius ?? 0, b.damage, enemies, b.color);
  acenderFogoDaFase(b.x, b.y);
  sfxExplosion();
  triggerScreenShake(5, 0.15);
  spawnParticles(b.x, b.y, b.color, 8, 180, 'smoke');
}

/**
 * Projéteis quebram props, do jogador e do inimigo.
 *
 * Cobertura que não protege é enfeite: quando o tiro dos inimigos atravessava o
 * caixote, os props das 8 fases sem entulho eram só decoração destruível. Cover
 * agora funciona em todo o jogo, e o que decide a rota é onde o prop está.
 *
 * O que continua exclusivo da Cidade é o desmoronamento: entulho não aguenta
 * tiro e cai inteiro com o primeiro. Isso dá à Cidade a identidade de "a
 * cobertura aqui também é perecível", e cria a tensão de o barril explodido pelo
 * tiro do inimigo explodir em cadeia — a cobertura do jogador virando o
 * problema dele.
 */
function updateBulletProps(bullets: ReturnType<typeof getBullets>): void {
  const collapsing = collapsesOnHit(getCurrentPhase().hazard);
  for (const b of bullets) {
    if (b.life <= 0) continue;
    const fromPlayer = !b.isEnemy;
    for (const prop of getProps()) {
      if (prop.health <= 0) continue;
      if (!bulletHitsCircle(b, prop.x, prop.y, prop.radius)) continue;
      // O foguete é cobertura para os DOIS lados, mas só tiro inimigo o fere:
      // errar a própria proteção puniria a mira, não a defesa (a fase já cobra
      // isso com as ondas). Se cair, o protect perdeu o alvo: tranca a fase no
      // mesmo latch do sobrevivente.
      if (prop.kind === 'rocket') {
        spawnParticles(b.x, b.y, PALETTE.mustard, 3, 120);
        if (b.isEnemy && damageProp(prop, b.damage)) markVipDown();
        if (b.explosive && b.explosionRadius) detonateBullet(b);
        if (!b.pierce) b.life = 0;
        break;
      }
      // O CARRO não desmorona (relato do playtest 2026-10-16: "os carros
      // somem com um tiro?"): o caminho do debris derruba QUALQUER prop
      // atingido, e a Rodovia/Cidade são exatamente os biomas dele — a
      // carcaça é cobertura PERMANENTE, a bala morre nela com fagulha.
      if (prop.kind === 'carro' || prop.kind === 'tree') {
        spawnParticles(b.x, b.y, PALETTE.mustard, 3, 120);
        if (b.explosive && b.explosionRadius) detonateBullet(b);
        if (!b.pierce) b.life = 0;
        break;
      }
      // A cápsula é cobertura que não queima: ela abre no roteiro, não no
      // dano — um jogador que atirar nela antes da hora não adianta a
      // história nem estraga a cobertura dos primeiros segundos.
      if (prop.kind === 'capsula') {
        spawnParticles(b.x, b.y, PALETTE.moss, 3, 120);
        if (b.explosive && b.explosionRadius) detonateBullet(b);
        if (!b.pierce) b.life = 0;
        break;
      }
      // O tambo de combustível cobre tiro como caixote mas não quebra: ele é
      // a condição de vitória do `collect`, e um RPG errado nele tornaria a
      // fase impossível de fechar. Só sai do mapa pelo contato do jogador.
      if (prop.kind === 'combustivel') {
        spawnParticles(b.x, b.y, PALETTE.mustard, 3, 120);
        if (b.explosive && b.explosionRadius) detonateBullet(b);
        if (!b.pierce) b.life = 0;
        break;
      }
      let destroyed: boolean;
      if (collapsing) {
        detonateProp(prop);
        destroyed = true;
      } else {
        destroyed = damageProp(prop, b.damage);
      }
      spawnParticles(b.x, b.y, PALETTE.mustard, 3, 120);
      // só o jogador credita ninho e moeda: tiro de inimigo não pode concluir a
      // fase nem encher o bolso do jogador
      if (fromPlayer && destroyed && prop.kind === 'nest') {
        registerObjectiveDestroyed();
        spawnParticles(prop.x, prop.y, PALETTE.terracotta, 26, 320, 'smoke');
        sfxExplosion();
        triggerScreenShake(8, 0.3);
      }
      if (destroyed) {
        if (prop.kind === 'barrel') {
          explodeProp(prop);
        } else if (fromPlayer) {
          spawnParticles(prop.x, prop.y, PALETTE.mustard, 8, 160);
          if (Math.random() < 0.5) spawnCoins(prop.x, prop.y, 1);
          triggerScreenShake(2, 0.08);
        }
      }
      // explosivo detona em prop, não só em inimigo: foguete em caixote
      // estoura no impacto em vez de atravessar
      if (b.explosive && b.explosionRadius) detonateBullet(b);
      if (!b.pierce) b.life = 0;
      break;
    }
  }
}

function updateDamageNumbers(dt: number): void {
  for (const d of damageNumbers) {
    d.y += d.vy * dt;
    d.vy += 100 * dt;
    d.life -= dt;
  }
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    if (damageNumbers[i].life <= 0) damageNumbers.splice(i, 1);
  }
}

function shootEnemyAt(e: Enemy, tx: number, ty: number): void {
  const def = ENEMY_TYPES[e.type];
  const angle = Math.atan2(ty - e.y, tx - e.x);
  const speed = def?.bulletSpeed || 300;
  const color = def?.projectileColor || PALETTE.terracotta;
  e.shootTimer = e.shootRate || 2;
  if (def?.spreadShot) {
    for (let s = -1; s <= 1; s++) {
      const a = angle + s * 0.3;
      spawnBullet(e.x, e.y, Math.cos(a) * speed * 0.83, Math.sin(a) * speed * 0.83, e.damage, true, color, false, false, 0, false, 'small_bullet', e.type);
    }
  } else if (def?.splitBullet) {
    for (let s = 0; s < 4; s++) {
      const a = angle + (s * Math.PI) / 2;
      spawnBullet(e.x, e.y, Math.cos(a) * speed * 0.67, Math.sin(a) * speed * 0.67, e.damage, true, color, false, false, 0, false, 'small_bullet', e.type);
    }
  } else {
    spawnBullet(e.x, e.y, Math.cos(angle) * speed, Math.sin(angle) * speed, e.damage, true, color, false, false, 0, false, 'small_bullet', e.type);
  }
  sfxEnemyShoot();
}

/**
 * Soma XP com o feedback de subida de nível.
 *
 * O toast já existia; o som `levelUp.ogg` e o flash de tela existiam e nenhum
 * dos dois era chamado — os dois órfãos previstos no Sprint 4.
 */
function ganhaXp(amount: number): void {
  if (addXp(amount) > 0) {
    pushToast(`NÍVEL ${getNivel()} — ${getPontosLivres()} PONTO(S) DE TALENTO`, 3.5);
    sfxLevelUp();
    triggerLevelUpFlash();
  }
}

/** Aplica dano/morte a um inimigo e credita score, moedas e conquistas. */
function killEnemy(e: Enemy, award: boolean): void {
  const def = ENEMY_TYPES[e.type];
  const idx = enemies.indexOf(e);
  if (idx >= 0) enemies.splice(idx, 1);

  if (award) {
    // chacina: 3+ mortes em 2s abre pequena câmera lenta; não mais a cada crit
    const now = performance.now();
    killTimes.push(now);
    while (killTimes.length && now - killTimes[0] > 2000) killTimes.shift();
    if (killTimes.length >= 3) {
      triggerSlowMotion(0.35, 0.4);
      checkAchievements('chacina');
      killTimes.length = 0;
    }
    addScore(e.scoreValue);
    // XP é o score acumulado: cada nível dá um ponto de talento (árvore de 3
    // galhos na loja). O toast só aparece quando o nível sobe, não a cada kill.
    // MENTE T1/T4 levantam o ganho via xpMult (stats.ts).
    ganhaXp(Math.round(e.scoreValue * getStat('xpMult')));
    // O titã (T1) paga 3× moedas e cobra a taxa elite no loot: o corpo
    // grande da onda tem que valer o risco. A COLETA da Fábrica (H2) engrossa
    // os dois — "os zumbis droparão mais coisas e com mais facilidade".
    if (def?.coinDrop) {
      const multMoedas = (e.isElite ? 3 : 1) * (getCurrentPhase().coleta ? 1.5 : 1);
      spawnCoins(e.x, e.y, Math.max(1, Math.floor(def.coinDrop * multMoedas * 0.6)));
    }
    spawnParticles(e.x, e.y, e.color, 20, 300);
    sfxExplosion();
    const killAch = checkAchievements('kill');
    if (killAch) pushToast(killAch.name, 3);
    const scoreAch = checkAchievements('score', getScore());
    if (scoreAch) pushToast(scoreAch.name, 3);
    // M5: a conquista por ARMA conta o abate na arma que estava na mão —
    // "10/50 com arma" é devoção a uma só.
    const armaAch = checkAchievements('weapon_kill', getCurrentWeaponIndex());
    if (armaAch) pushToast(armaAch.name, 3);
  }

  if (def?.isBoss) {
    clearBossState(e);
    bossKilled = true;
    // M5: a última fala flutua ONDE O CHEFE CAIU (número de dano, 3s de
    // leitura) — mais diegético que um toast competindo com a conquista
    // de chefe e a entrada de diário no mesmo segundo.
    if (def.deathLine) {
      damageNumbers.push({ x: e.x, y: e.y - 50, text: def.deathLine, color: PALETTE.title, life: 3.2, vy: -28 });
      triggerSlowMotion(0.3, 0.9);
    }
    // B7: o chefe cai e o chão onde ele caiu queima — na fase do NÚCLEO o
    // próprio campo é o cenário destrutivo que o dono pediu.
    acenderFogoDaFase(e.x, e.y, 64);
    // H2 — o sentinel caiu e a Fábrica tem um SEGUNDO chefe esperando: a
    // caixa pequena conta a virada, e o FECHAMENTO dela nasce o Rogério
    // infectado no lugar do amigo. O respiro do sentinel fica congelado
    // enquanto a caixa está aberta (o timer mora no update), e o chefe novo
    // bloqueia o fechamento até cair.
    if (e.type === 'sentinel' && getCurrentPhase().name === 'Fábrica' && getCurrentMode() === 'campaign' && !fernandoVirou) {
      fernandoVirou = true;
      const amigo = getNPCs().find(n => n.alive);
      abrirDialogo(SEQUENCIA_VIRADA, () => {
        resetNPCs();
        const nascimento = findFreeSpotNear(amigo ? amigo.x : e.x, amigo ? amigo.y : e.y, 30);
        const fernando = spawnEnemy('rogerioInf', worldW, worldH, 0, nascimento.x, nascimento.y);
        if (fernando) {
          fernando.spawnDelay = 0;
          fernando.health = fernando.maxHealth;
          enemies.push(fernando);
          triggerBossZoom();
          void playMusic('boss');
        }
      });
    }
    // H2 — o ROGÉRIO INFECTADO caiu: o fim da Fábrica é a história dele.
    // A recompensa não é caixa: é o luto e a FÚRIA, que desbloqueia aqui —
    // o gate de história que a decisão do Murilo pediu.
    if (e.type === 'rogerioInf') {
      desbloquearFuria();
      pushToast('FÚRIA DESBLOQUEADA — TECLA E', 4);
      abrirDialogo(SEQUENCIA_POS_MORTE);
    }
    const bossAch = checkAchievements('boss_kill');
    if (bossAch) pushToast(bossAch.name, 3);
    // O PÓS-MISSÃO DO CASTELO (textos, 2026-10-14): o REI MUTANTE caiu. Se o
    // Júlio sobreviveu, a recompensa dele vem primeiro (a chave do quarto 4B
    // e o nome, que libera o diário) e a despedida entra no conserto do
    // foguete. Sem ele, o motor é consertado sozinho — "de volta a rolar
    // cabeças" já foi dito na hora da perda.
    if (e.type === 'reiMutante' && getCurrentPhase().name === 'Castelo' && getCurrentMode() === 'campaign') {
      const julioVivo = getNPCs().some(n => n.alive);
      if (julioVivo) {
        abrirDialogo(SEQUENCIA_JULIO_VIVE, () => {
          if (unlockDiaryEvent('julio')) pushToast('DIÁRIO: QUARTO 4B', 4, 'aviso');
          abrirDialogo(SEQUENCIA_POS_MISSAO_CASTELO_COM_JULIO);
        });
      } else {
        abrirDialogo(SEQUENCIA_POS_MISSAO_CASTELO);
      }
    }
    // O HOSPITAL (2026-10-14): o doutor caiu. No bolso do jaleco, o mapa da
    // região — o relato do Murilo: "Temos um mapa aqui, interessante, vou
    // levar comigo". Deste ponto em diante o jogador conhece o caminho: o
    // minimapa libera nas fases seguintes.
    if (e.type === 'cirurgiao' && getCurrentPhase().name === 'Hospital de Campanha' && getCurrentMode() === 'campaign') {
      abrirDialogo(SEQUENCIA_POS_DOUTOR);
    }
    if (unlockDiaryEvent('boss_kill')) pushToast('NOVA ENTRADA NO DIÁRIO', 3, 'aviso');
    // M5: o toast da fala entra por ÚLTIMO de propósito — o cap de 3 comia
    // a fala quando ela vinha antes da conquista, do diário e da onda limpa
    if (def.deathLine) pushToast(def.deathLine, 3.2, 'aviso');
    spawnParticles(e.x, e.y, PALETTE.crit, 50, 400, 'smoke');
    triggerBossKillFlash();
    triggerScreenShake(18, 0.8);
    sfxBossDeath();
    // Rush do NÚCLEO: só o ÚLTIMO da fila fecha a fase e larga a caixa especial.
    // Um chefe intermediário que derrubasse `phaseEnding`/loot encerrava a fase
    // com 2 de 4 chefes vivos — e daria 4 Destruidores por partida.
    const ehNucleoRush = getCurrentPhase().boss === 'nucleo' && getCurrentMode() === 'campaign';
    const ultimoDaFila = !ehNucleoRush || bossRushIndex >= NUCLEO_RUSH.length - 1;
    // a posição consumida não volta mais (inclusive a do último: sem isto o
    // `proximoDoRush` respawnaria o NÚCLEO infinitamente após o fechamento)
    if (ehNucleoRush) bossRushIndex++;
    if (ultimoDaFila) {
    // Última onda limpa e o chefe caiu agora: este é o respiro que o jogador
    // espera ver. O caminho normal (`if (waveComplete)`) não dispara aqui,
    // porque o spawner só reporta a onda completa quando a contagem dele
    // zera — o chefe nunca entrou nessa contagem.
    // Sem a guarda `!phaseEnding`: o respiro já estava armado desde a última
    // onda, e essa guarda tornava o re-arm código morto. O consumo agora é
    // por `deveFecharFase`, que não depende de `waveComplete`.
    //
    // No rush do NÚCLEO não existe "última onda": a fase não tem onda comum
    // (DECISIONS #169). O que marca o fim ali é a fila — `ultimoDaFila` já
    // diz que este era o último dos 4. Com a checagem de onda, o respiro nunca
    // armava e a fase ficava em `playing` para sempre depois do NÚCLEO cair:
    // foi o que o `rush-proof.mjs` pegou ao rodar sem `pularParaUltimaOnda`.
    const ultimaOnda = ehNucleoRush || getCurrentWave() + 1 >= getCurrentPhase().waves;
    // O respiro da Fábrica espera o FERNANDO (playtest: "coletando aparece
    // depois do sentinel E depois de matar o amigo — tem que ser só depois
    // do sentinel" — o relato apontava o BANNER: o sentinel não fecha a
    // Fábrica, ele ABRE a virada; o respiro dele é o da luta do amigo)
    if (ultimaOnda && !(getCurrentPhase().name === 'Fábrica' && getCurrentMode() === 'campaign' && !fernandoVirou)) {
      armarRespiro();
    }
    // O FERNANDO (H2) não cai como chefe padrão: a caixa e o power-up são
    // o vocabulário do chefe de fase — o fim dele é o diálogo, a FÚRIA e o
    // respiro. A caixa da NOVIDADES ficaria girando em cima do luto.
    if (e.type === 'rogerioInf') return;
    spawnPowerUpDeChefe(e.x, e.y);
    spawnPowerUp(e.x - 20, e.y + 20);
    const bossLoot = spawnBossLoot(e.x, e.y - 20);
    // caixa especial vai para a NOVIDADES: o jogador escolhe ativar/ventar,
    // não recebe uma troca forçada de arma
    pushPendingReveal(bossLoot.index, bossLoot.quality);
    damageNumbers.push({ x: e.x, y: e.y - 30, text: 'CAIXA ESPECIAL', color: PALETTE.mustard, life: 2, vy: -50 });
    void playMusic('combat');
    } else {
      // chefe intermediário caiu: dá um power-up de chefe como alívio — o
      // próximo da fila nasce no frame em que o campo esvaziar.
      spawnPowerUpDeChefe(e.x, e.y);
      damageNumbers.push({ x: e.x, y: e.y - 30, text: 'O BUNKER NÃO PARA', color: PALETTE.terracotta, life: 2, vy: -50 });
      void playMusic('combat');
    }
  } else if (award) {
    // A coleta da Fábrica (H2) dobra a chance de loot: "os zumbis droparão
    // mais coisas e com mais facilidade" (relato do Murilo).
    rollLootDrop(e.x, e.y, e.type, e.isElite === true, getCurrentPhase().coleta ? 2 : 1);
    // elites têm 25% de chance de dropar peça/acessório direto no inventário.
    // O TITÃ (T1) entra na mesma conta: ele é o corpo grande da onda, a
    // chance é do tamanho — não do nome do tipo dele.
    if ((ELITE_TYPES.has(e.type) || e.isElite === true) && Math.random() < 0.25) {
      const dropPool = PIECE_TYPES.map(t => t.id);
      const pieceType = dropPool[Math.floor(Math.random() * dropPool.length)];
      const def = getPieceType(pieceType);
      if (addPieceToInventory(pieceType)) {
        sfxPiece();
        damageNumbers.push({ x: e.x, y: e.y - 30, text: 'PEÇA: ' + (def?.name ?? pieceType.toUpperCase()), color: PALETTE.mustard, life: 1.6, vy: -50 });
      } else {
        damageNumbers.push({ x: e.x, y: e.y - 30, text: 'MOCHILA CHEIA', color: PALETTE.stone, life: 1.4, vy: -50 });
      }
    }
    if (Math.random() < 0.08) spawnPowerUp(e.x, e.y);
  }
}

function updateBotsAndCompetitors(p: ReturnType<typeof player.getPlayer>): void {
  const botList = getBots();
  if (botList.length < 3 && Math.random() < 0.5 * (1 / 60)) {
    const difficulties: BotDifficulty[] = ['easy', 'medium', 'hard'];
    addBot(createBot(difficulties[Math.floor(Math.random() * 3)], worldW, worldH));
  }
  const botBullets = updateBots(1 / 60, p.x, p.y, getBullets(), worldW, worldH);
  for (const b of botBullets) {
    spawnBullet(b.x, b.y, b.vx, b.vy, b.damage, true, b.color, false);
  }
  for (const bot of botList) {
    if (Math.hypot(p.x - bot.x, p.y - bot.y) < p.radius + bot.radius && p.invincible <= 0) {
      const dmg = damageTaken(bot.damage);
      if (dmg > 0) {
        player.enemyCollisionDamage(dmg, { fonte: 'bot' });
        sfxPlayerHit();
        triggerDamageFlash();
      }
      bot.health = 0;
      spawnParticles(bot.x, bot.y, bot.color, 12, 200);
    }
  }
  for (const bot of removeDeadBots()) {
    addScore(bot.scoreValue);
    spawnCoins(bot.x, bot.y, bot.coinDrop);
    spawnParticles(bot.x, bot.y, bot.color, 20, 300);
    sfxExplosion();
  }
}


function playWeaponSound(name: string): void {
  WEAPON_SOUNDS[name]();
  // Condição da arma: a `enferrujada` range no primeiro disparo, a `quebrada`
  // falha com som mais seco. Antes a qualidade era invisível em jogo — só o
  // número da loja dizia, e o tiro saía igual ao de uma arma nova.
  const q = getWeaponQuality();
  if (q !== 'normal' && q !== 'boa' && q !== 'ascendente' && q !== 'lendaria') {
    sfxCondicao(q, getWeaponFamily());
  }
}

function pushToast(name: string, time: number, kind: ToastKind = 'achievement'): void {
  // empilha no máximo 3: mais que isso vira parede de texto no canto
  achievementNotifications.push({ name, time, kind });
  while (achievementNotifications.length > 3) achievementNotifications.shift();
}

/**
 * Anuncia a arma equipada: `ARMANDO: <NOME> · <QUALIDADE>` na cor da raridade.
 * Antes trocar de arma era silencioso — o HUD só mostrava o nome no rodapé.
 * Chamado nos 3 call sites (tecla 1-9, keepPendingReveal, resume do save).
 */
function announceWeapon(index: number): void {
  const w = WEAPONS[index];
  if (!w) return;
  const q = QUALITIES[getWeaponQuality()] ?? QUALITIES.normal;
  pushToast(`${w.name.toUpperCase()} · ${q.label.toUpperCase()}`, 2, 'equip');
}

/** Entra na loja: salva, inventa NPC e troca a música. */
// ─── O roteiro da Fábrica do Rogério (H2) ─────────────────────
// O texto é o relato verbatim do Murilo (2026-10-13) e a caixa é a
// PEQUENA (dialogo.ts) — "caixa de diálogo pequena, não gigante igual aos
// outros níveis". O mundo congela por linha (decisão dele), o ENTER avança
// e o auto-avanço de 10s impede a caixa de prender quem soltou o teclado.

const SEQUENCIA_CHEGADA: EntradaDialogo[] = [
  { speaker: 'rios', text: 'Era exatamente aqui onde eles escravizavam o povo.' },
  { speaker: 'rios', text: 'Malditos… Agora eles estão longe daqui…' },
  { speaker: 'narrador', text: 'O chão ainda cheira a remédio. Os zumbis daqui carregam mais coisa que os de fora — catar tudo vale a pena.' },
  { speaker: 'rios', text: 'Vou aproveitar para coletar o máximo de recursos que der!' },
];

const SEQUENCIA_AMIGO: EntradaDialogo[] = [
  { speaker: 'fernando', text: 'Ei você! Me ajude! Eles estão vindo em monte.' },
  { speaker: 'rios', text: 'Quem é você? Está infectado?' },
  { speaker: 'fernando', text: 'N-não… Nunca…' },
  { speaker: 'narrador', text: 'Ele dobra ao meio, tossindo. A frase não termina.' },
  { speaker: 'rios', text: 'Hmm… O que está havendo aqui?' },
  { speaker: 'fernando', text: 'Uma das cápsulas deles acabou de atacar a terra e caiu exatamente aqui e além di-' },
  { speaker: 'rios', text: 'O quê? Que cápsulas são essas? Não foi uma mutação da natureza toda essa infecção?' },
  { speaker: 'fernando', text: 'Não cara, isso é o que eles querem que você acredite. Sabe os trilionários? Eles querem destruir a terra com zumbis pra cobrar pra morar no espaço, no suposto novo planeta deles.' },
  { speaker: 'rios', text: 'Você está bem? Que merda de história de filme é essa?' },
  { speaker: 'narrador', text: 'A cápsula range no subsolo. A tampa cede.', efeito: 'explosaoCapsula' },
  { speaker: 'fernando', text: 'ESSA NÃO, NÓS VAMOS MORRER!' },
  { speaker: 'rios', text: 'Merda!' },
  { speaker: 'narrador', text: 'A radiação cobre o pátio. O corpo do Rogério aceita; o seu recusa. Você não sabe disto ainda.' },
];

const SEQUENCIA_VIRADA: EntradaDialogo[] = [
  { speaker: 'fernando', text: 'Merda mano, corre!' },
  { speaker: 'rios', text: 'Eu não posso te deixar aqui nem a pau!' },
  { speaker: 'fernando', text: 'Quer–o–o-o o seu cerébrO!!!' },
];

const SEQUENCIA_POS_MORTE: EntradaDialogo[] = [
  { speaker: 'rios', text: 'Eu não queria te matar, amigo. Mas esses trilionários vão pagar!' },
  { speaker: 'fernando', text: 'Brains…' },
];

// ─── As sequências do CASTELO (textos, 2026-10-14) ──────────────
// O CASTELO (2026-10-14): o Júlio não é mais o Cabo Fernandes que se
// sacrifica quando o rei levanta — o relato do Murilo: "o antigo cabo
// Fernandes morreu do nada quando o boss apareceu e voltou a fase pra onda
// 1/6". O Júlio novo é um sobrevivente civil que pode viver ou morrer:
// vivo, paga a sala secreta (quarto 4B) e o nome (o diário dele); morto,
// custa a recompensa e a fase segue. As falas são o documento dele, na voz
// dele.

const SEQUENCIA_JULIO: EntradaDialogo[] = [
  { speaker: 'medico', text: 'Finalmente, vida! Cara, descobri que tem uma esperança, e você parece estar muito bem armado para enfrentar ele!' },
  { speaker: 'rios', text: 'Ele quem?' },
  { speaker: 'medico', text: 'O rei mutante! Ele está lá dentro, cara, e o castelo está lotado de zumbis e—' },
  { speaker: 'rios', text: 'Você viu um foguete?' },
  { speaker: 'medico', text: 'Sim, ele está lá dentro, mas ninguém conseguiu acessar desde 2026…' },
  { speaker: 'rios', text: 'Caramba, por quê?' },
  { speaker: 'medico', text: 'O rei fica mais forte a cada ano desde lá.' },
  { speaker: 'medico', text: 'Se você conseguir me salvar, tem uma sala secreta com uma arma magnífica lá. Sei que vai gostar. E bastante ouro.' },
];

const SEQUENCIA_JULIO_MORRE: EntradaDialogo[] = [
  { speaker: 'rios', text: 'NÃO! Merda… Nunca vou saber da sala. E menos um sobrevivente entre nós.' },
  { speaker: 'rios', text: 'De volta a rolar cabeças.' },
];

const SEQUENCIA_JULIO_VIVE: EntradaDialogo[] = [
  { speaker: 'medico', text: 'Ufa! Você é bom em matar zumbis, hein. Como agradecimento e recompensa: a sala fica no segundo andar, e essa chave abre lá. É o quarto 4B.' },
  { speaker: 'rios', text: 'Muito obrigado, jamais te esquecerei. Eu venho do interior, cara. Espero te ver qualquer outro dia. Qual seu nome?' },
  { speaker: 'medico', text: 'Meu nome é Júlio!' },
];

const SEQUENCIA_POS_MISSAO_CASTELO: EntradaDialogo[] = [
  { speaker: 'rios', text: 'Ótimo. Após a review, os danos são mínimos no motor devido aos zumbis. Agora vou consertar.' },
  { speaker: 'narrador', text: 'Ele abre o painel do foguete e vai fundo na chave.', efeito: 'ferramenta' },
  { speaker: 'narrador', text: 'A tela do painel pisca verde. O motor ronca de primeira.', efeito: 'lancamentoFoguete' },
  { speaker: 'rios', text: 'Lá vou eu! Vocês pagam!' },
];

const SEQUENCIA_POS_MISSAO_CASTELO_COM_JULIO: EntradaDialogo[] = [
  { speaker: 'rios', text: 'Ótimo. Após a review, os danos são mínimos no motor devido aos zumbis. Agora vou consertar.' },
  { speaker: 'narrador', text: 'Ele abre o painel do foguete e vai fundo na chave.', efeito: 'ferramenta' },
  { speaker: 'narrador', text: 'A tela do painel pisca verde. O motor ronca de primeira.', efeito: 'lancamentoFoguete' },
  { speaker: 'rios', text: 'Lá vou eu! Vocês pagam! Hasta la vista, Júlio!' },
  { speaker: 'medico', text: 'Boa sorte, mano. Valeu por tudo.' },
];

// O HOSPITAL (2026-10-14): o doutor Fernando, o Zombonic-24 e o Nando-01 —
// as falas do documento do Murilo. A conversa da chegada é a caixa pequena
// da primeira onda; a do Nando-01 abre quando a última onda limpa o campo
// (o doutor vira o chefe da fase); a do abate paga o mapa da região.

const SEQUENCIA_MEDICO: EntradaDialogo[] = [
  { speaker: 'doutor', text: 'Ei, você! Eles estão por todas as partes! Cuidado!' },
  { speaker: 'rios', text: 'Caramba, alguém vivo, finalmente! Mas e aí? O que aconteceu por aqui?' },
  { speaker: 'doutor', text: 'Os pacientes nunca melhoraram de verdade com o remédio Zombonic-24. Eles foram piorando, matando e contaminando os outros.' },
  { speaker: 'doutor', text: 'Eu suspeito que esse reagente apenas potencialize os efeitos do vírus. Aliás, sou cientista, tenho moral pra falar.' },
  { speaker: 'rios', text: 'Cientistas são malucos às vezes.' },
];

const SEQUENCIA_NANDO: EntradaDialogo[] = [
  { speaker: 'doutor', text: 'Esse se chamará Nando-01. Afinal, meu nome é Fernando.' },
  { speaker: 'narrador', text: 'Ele bebe o frasco inteiro, sem pressa. A tosse vem em três tempos.' },
  { speaker: 'doutor', text: 'Calma, é só efeito passageiro. E-e-eu acho.' },
  { speaker: 'narrador', text: 'O jaleco rasga nas costas antes dele terminar a frase.' },
];

const SEQUENCIA_POS_DOUTOR: EntradaDialogo[] = [
  { speaker: 'rios', text: 'Eu não disse que todos os cientistas são loucos?' },
  { speaker: 'narrador', text: 'No bolso do jaleco, um mapa da região dobrado e anotado a caneta.' },
  { speaker: 'rios', text: 'Hmm… Temos um mapa aqui. Interessante, vou levar comigo.' },
];

/**
 * A cápsula explode no meio do diálogo do amigo (o efeito dispara junto com
 * a linha dele). Sem dano — é a radiação da história, que infecta o Rogério
 * e não o jogador (imunidade que o Luiz não sabe que tem). Os efeitos do
 * CASTELO (textos, 2026-10-14): a chave de roda do conserto do motor e o
 * lançamento do foguete — o beat "consertar + voar" do relato do Murilo.
 */
function efeitoDaCapsula(efeito: 'explosaoCapsula' | 'ferramenta' | 'lancamentoFoguete'): void {
  const p = player.getPlayer();
  if (efeito === 'ferramenta') {
    sfxFerramenta();
    triggerScreenShake(2, 0.15);
    return;
  }
  if (efeito === 'lancamentoFoguete') {
    sfxFogueteLancamento();
    triggerDamageFlash();
    triggerScreenShake(10, 1.2);
    return;
  }
  const amigo = getNPCs().find(n => n.alive);
  // A cápsula abre ONDE ELA ESTÁ, não no pé do amigo — ela existe na fase
  // desde o início (relato do Murilo). O que estava dentro sai junto.
  const capsula = consumirCapsula();
  const x = capsula ? capsula.x : amigo ? amigo.x : p.x + 80;
  const y = capsula ? capsula.y : amigo ? amigo.y : p.y;
  createExplosion(x, y, 90, 0, enemies, PALETTE.mustard);
  triggerScreenShake(8, 0.5);
  triggerDamageFlash();
  sfxExplosion();
  spawnParticles(x, y, PALETTE.mustard, 30, 260, 'smoke');
  // A radiação TOMA o mapa por um tempo: "saíra a radiação e ficaria verde
  // durante um tempo o mapa Fábrica" — o véu sustentado, não o flash.
  triggerVeil('rgba(90, 160, 90, 0.24)', 14);
  // "Dentro da cápsula sairiam vários zumbis": cinco, dos tipos da fase,
  // nascidos na borda da explosão. A caixa congela o mundo, então eles
  // acordam quando o jogador fecha o diálogo.
  if (getCurrentPhase()?.name === 'Fábrica') {
    const tipos = getCurrentPhase()!.enemyTypes;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      const nascidos = findFreeSpotNear(x + Math.cos(a) * CELL_SIZE * 1.4, y + Math.sin(a) * CELL_SIZE * 1.4, 18);
      const zumbi = spawnEnemy(tipos[i % tipos.length], worldW, worldH, 0, nascidos.x, nascidos.y);
      if (zumbi) {
        zumbi.spawnDelay = 0.6 + i * 0.25;
        enemies.push(zumbi);
      }
    }
  }
}

function enterShop(): void {
  if (getCurrentMode() === 'hardcore') {
    leaveShop();
    return;
  }
  const phaseIdx = PHASES.indexOf(getCurrentPhase());
  unlockDiaryEntry(Math.max(0, phaseIdx));
  // Evento aleatório de fase (resgate / casa / sorte / azar): um sorteado que
  // ainda não jogou, com efeito no bolso. Substitui o sorteio de NPC solto —
  // agora o encontro tem nome, entrada no diário e consequência.
  // A sorte (MENTE T3 + SORTUDO) pesa o sorteio do evento: cada ponto dobra a
  // chance do melhor. Ver `rollDiaryEvent`.
  const evento = rollDiaryEvent(Math.random, getStat('luck'));
  if (evento) {
    addShopCoins(evento.moedas);
    const nome = getUnlockedDiary().find((e) => e.event === evento.event)?.title ?? 'EVENTO';
    pushToast(`${evento.moedas >= 0 ? '+' : ''}${evento.moedas} MOEDAS · ${nome}`, 3.5);
  }
  saveGame(
    phaseIdx,
    0,
    getCurrentWeaponIndex(),
    getShopCoins(),
    getScore(),
    getPurchasedUpgrades(),
    getPurchasedWeaponPairs(),
    getCurrentPhase()?.name || '',
    // peças: mochila e equipadas. Gravei `[]`/`{}` aqui até a porta nº 5
    // (`semOrfao`) acusar que os dois snapshots de `pieces.ts` não tinham
    // chamador: o save tinha o campo e nunca era preenchido, então a peça que
    // o jogador comprou e equipava sumia no continue.
    getInventorySnapshot(),
    getEquippedSnapshot(),
    getTalentos(),
    getXp(),
    furiaDesbloqueada(),
  );
  void playMusic('shop');
}

/**
 * Inventário salvo como pares (index, quality) → pares da loja.
 * Guardar só o índice perde a qualidade no continue.
 */
function restoreSavedWeapons(weapons: { index: number; quality: string }[]): void {
  for (const w of weapons) {
    addPurchasedWeapon(w.index, w.quality);
  }
}

function leaveShop(): void {
  nextPhase();
  // A cota de resgates é por fase: sem isto o jogador fazia 30 resgates numa
  // partida e tirava 78% da renda da campanha de graça.
  resetAdsPerPhase();
  // fase final → gameover: getCurrentPhase() seria undefined logo depois
  // `nextPhase()` passou da última fase: a campanha acabou. O epílogo roda
  // ANTES do gameover, senão os 3 finais e a resolução do Genesis ficam
  // inalcançáveis — eram 62 das 69 linhas de cena, todas nunca chamadas.
  // O estado vai para `playing` de propósito: o update trata a cutscene em
  // `playing`, e é de lá que o epílogo chama `setGameState('gameover')`.
  if (getGameState() !== 'playing') {
    resetShop();
    if (wasGameCompleted()) {
      // A vitória entra no save AQUI, no caminho natural de encerramento —
      // antes só o FINAL SECRETO "PERFEIÇÃO" chamava markGameCompleted, e
      // quem zerou morrendo no caminho via GAME OVER no fim da campanha
      // vencida (relato 2026-10-14: "tela de vitória no lugar do game over
      // final"). O save é o que a tela de fim e as armas secretas leem.
      markGameCompleted();
      setGameState('playing');
      showCutsceneAt(EPILOGUE_CUTSCENE);
      // A música nostálgica da reescrita (DECISIONS #174): Autumn Changes,
      // de Eric Matyas — a mesma fonte das 4 faixas. Ela segue tocando sob a
      // tela de fim; o menu troca para a faixa dele quando o jogador volta.
      // A RISADA (textos, 2026-10-14): o dono corrigiu a autoria — o
      // "HAHAHAHA!" do fim é do RIOS, não do painel da máquina. O som
      // (risada.ogg, H5) entra junto com a música: é o grito de quem
      // terminou a primeira parte.
      void playMusic('epilogo');
    }
    return;
  }
  loadPhaseEnvironment();
  // Fase do NÚCLEO: o traje de contenção e o martelo esperam o Luiz na entrada
  // do Bunker. É a recompensa da campanha — o traje dá +100% dano, +30%
  // velocidade, +3 escudo e metade do dano recebido por 20s; o martelo é a arma
  // que ele tira do coração da máquina.
  //
  // O martelo vem FORÇADO para a mão no NÚCLEO (M2, relato 2026-10-14:
  // "martelo forçado no NÚCLEO — única arma da fase"). A entrega anterior
  // ia para a mochila para não trocar a build do jogador sem querer — mas a
  // fase final é o desfile do Destruidor: o martelo na mão e as teclas 1-9
  // e Q caladas até o fim são o poder fantasia que a fase promete.
  if (getGameState() === 'playing' && getCurrentMode() === 'campaign' && getCurrentPhase()?.boss === 'nucleo') {
    const pp = player.getPlayer();
    spawnPowerUpDeTipo(pp.x + 60, pp.y, 'trajeNucleo');
    damageNumbers.push({ x: pp.x, y: pp.y - 40, text: 'TRAJE DE CONTENÇÃO', color: PALETTE.terracotta, life: 2.4, vy: -40 });
    const martelo = WEAPONS.findIndex(w => w.name === 'Destruidor');
    addPurchasedWeapon(martelo, 'ascendente');
    setWeapon(martelo, 'ascendente');
    marteloForcado = true;
    damageNumbers.push({ x: pp.x, y: pp.y - 70, text: 'O DESTRUIDOR É SUA ÚNICA ARMA AQUI', color: PALETTE.mustard, life: 2.6, vy: -40 });
  }
  enemies.length = 0;
  clearBullets();
  clearCoins();
  clearParticles();
  damageNumbers.length = 0;
  resetCombo();
  // pente cheio na troca de fase: sem isto o jogador chegava na horda com
  // 2/25 e recarregava no meio do melee. `resetWeapons` resolveria, mas ele
  // zera dano/pierce/crítico e a build inteira — por isso o refill puro.
  refillAmmo();
  // resetNPCs fica em loadPhaseEnvironment: ele monta o estado por fase (props,
  // terreno, objetivo, NPC). Resetar aqui depois apagaria o sobrevivente que o
  // objetivo protect acabou de criar.
  bossZoomTriggered = false;
  phaseTransitionTimer = 2.0;
  resetInput();
  if (getGameState() === 'playing') void playMusic('combat');
  // A cutscene da fase abre ANTES do combate. Sem isto, `showCutscene()` só era
  // chamado no menu e 62 das 69 linhas escritas nunca jogavam — incluindo a
  // morte do Fernandes e os 3 finais do epílogo. `nextPhase()` já rodou acima,
  // então a fase atual é a que acabou de começar.
  if (getGameState() === 'playing' && getCurrentMode() === 'campaign') {
    const fase = PHASES.indexOf(getCurrentPhase());
    const cena = cutsceneForPhase(fase);
    if (cena >= 0) showCutsceneAt(cena);
    // A Fábrica do Rogério (H2): a chegada corre na CAIXA PEQUENA, não na
    // cutscene — pedido do Murilo. As próximas sequências (o amigo na onda
    // 2, a virada pós-sentinel) disparam pelos gatilhos da fase.
    else if (fase === 3) abrirDialogo(SEQUENCIA_CHEGADA);
  }
}

function startRun(): void {
  setGameMode(selectedMode);
  loadAchievements();
  loadDiary();
  resetRunCounters();
  resetBehavior();
  playerDied = false;
  if (selectedMode === 'campaign') startTutorial();
  // O 2P local precisa ser desligado explicitamente: `enabled` só voltava a
  // false em resetLocalMultiplayer(), que não era chamada em lugar nenhum. Então
  // jogar uma partida local e depois iniciar uma campanha deixava o P2 fantasma
  // ativo — e ele mata qualquer inimigo que encoste nele.
  if (selectedMode === 'local') {
    const p = player.getPlayer();
    initLocalMultiplayer(worldW, worldH, p.x, p.y);
  }
  else resetLocalMultiplayer();
  localTerminou = false;
  tabAberto = false;
  resetInput();
  setGameState('playing');
  void playMusic('combat');
}

function applyPauseOption(): void {
  switch (PAUSE_OPTIONS[getPauseIndex()].id) {
    case 'resume':
      setGameState('playing');
      break;
    case 'music':
      setMusicEnabled(!isMusicEnabled());
      break;
    case 'sfx':
      setSfxEnabled(!isSfxEnabled());
      break;
    case 'fullscreen':
      // o toggle é async mas o estado fica 'paused': o jogador escolhe no
      // menu e o jogo continua pausado por baixo
      void alternarTelaCheia();
      break;
    case 'config':
      // estado continua 'paused' por baixo do overlay
      openSettings();
      break;
    case 'menu':
      resetGame();
      setGameState('menu');
      // crossfade combat→menu ao sair da pause para o menu
      startMusic();
      break;
  }
  sfxMenuSelect();
  resetInput();
}

/** ENTER no painel: alterna o toggle da linha selecionada
 * (linha de volume não faz nada — ajuste é A/D, roda e botões). */
function applySettingsSelection(): void {
  const id = SETTINGS_ROWS[getSettingsIndex()].id;
  if (id === 'musicOn') {
    setMusicEnabled(!isMusicEnabled());
    sfxMenuSelect();
  } else if (id === 'sfxOn') {
    setSfxEnabled(!isSfxEnabled());
    sfxMenuSelect();
  }
}

// ─── Draw ──────────────────────────────────────────────────────

function draw() {
  const state = getGameState();

  // overlay de configurações: frame subjacente + painel
  // (pause desenha o mundo congelado, sem o drawPause)
  if (isSettingsOpen()) {
    if (state === 'menu') {
      if (isShowingCutscene()) drawCutscene();
      else drawMenu(selectedMode, selectedClass);
    } else if (state === 'paused') {
      drawFrozenWorld();
    }
    drawSettings(getMasterVolume(), getMusicVolume(), getSfxVolume(), isMusicEnabled(), isSfxEnabled());
    return;
  }

  if (state === 'menu') {
    if (isShowingCutscene()) drawCutscene();
    else drawMenu(selectedMode, selectedClass);
    return;
  }
  if (state === 'shop') {
    drawShop(ctx, canvas.width, canvas.height, mouse.x, mouse.y);
    drawSupportFallback(ctx, canvas.width, canvas.height);
    return;
  }

  // Cutscene de fase: a tela inteira, e o HUD escondido. Sem este early-return
  // a cena era desenhada e logo coberta pelo mundo, porque `drawCutscene`
  // desenha o fundo opaco mas o `drawWorld` vinha depois.
  if (state === 'playing' && isShowingCutscene()) {
    drawCutscene();
    return;
  }
  if (state === 'gameover') {
    // versus local tem tela própria: o `getWinner` sabia quem caiu desde sempre,
    // mas o desenho era o GAME OVER genérico com recordes de campanha — o P2
    // que ganhou via pelo `GAME OVER` do P1.
    const local = fimLocal();
    if (local) {
      drawFimLocal(local.vencedor, local.placar, getCurrentWave() + 1);
      return;
    }
    // vitoria e derrota leem diferente: zerar o jogo nao e GAME OVER
    // `getTotalKills`, não `getKillStreak`: a sequência zera a cada intervalo sem
    // abate, e a tela imprimia "Abates: 0" ao lado de uma pontuação alta. O
    // jogador reliu isso como contador quebrado (relato de 2026-10-11).
    if (isGameCompleted()) drawVictory(getScore(), getTotalKills());
    else drawGameOver(getScore(), getTotalKills());
    return;
  }
  if (state === 'credits') {
    drawCredits();
    return;
  }
  if (state === 'paused') {
    drawFrozenWorld();
    drawPause(isMusicEnabled(), isSfxEnabled());
    return;
  }

  // Versus local: o P2 caiu e a partida continua em `playing`, então a tela de
  // fim entra aqui. Sem este early-return o jogador ficava atirando num campo
  // vazio com um toast de 4 segundos no canto, e o P2 nunca soube que perdeu.
  if (localTerminou) {
    const fim = fimLocal();
    if (fim) {
      drawWorld();
      drawFimLocal(fim.vencedor, fim.placar, getCurrentWave() + 1);
      return;
    }
    // os dois de pé de novo (a revanche andou antes do desenho): flag morta
    localTerminou = false;
  }

  drawWorld();

  // Remorso++: a tela vermelha de ódio enquanto a FÚRIA está ativa. É a cor do
  // chefão final encontrando a fúria que o jogo já tinha — o jogador SENTE o
  // modo antes de ler o HUD. Vinheta nas bordas (gradiente radial), pulsando
  // devagar; nada de flash chapado, que lavaria o mundo.
  if (isSkillActive('fury')) {
    const W = canvas.width, H = canvas.height;
    const pulso = 0.5 + 0.5 * Math.sin(Date.now() / 220);
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.72);
    g.addColorStop(0, 'rgba(90,10,10,0)');
    g.addColorStop(1, `rgba(120,16,16,${0.32 + pulso * 0.16})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // H3 (relato do dono): a nave em perigo — a tela vermelha dos primeiros
  // segundos do Espaço. Pulso mais rápido que o da fúria: é alarme, não
  // ódio. Dá peso à cena de entrada ("INIMIGO DETECTADO!" do Bot #89) e
  // some sozinha — quem chega atrasado na fase não vê nada.
  if (perigoNave > 0) {
    const W = canvas.width, H = canvas.height;
    const pulso = 0.5 + 0.5 * Math.sin(Date.now() / 90);
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.30, W / 2, H / 2, Math.max(W, H) * 0.70);
    g.addColorStop(0, 'rgba(90,10,10,0)');
    g.addColorStop(1, `rgba(120,16,16,${0.26 + pulso * 0.14})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // O flash/véu ANTES da caixa (playtest: "a explosão causa uma faixa
  // branca... nas fases que tem amigo, fica zuado de ler as mensagens"):
  // o pós-morte abre caixa no mesmo frame do flash do chefe — com o flash
  // por cima, o texto morria. Agora o feedback cobre o mundo, nunca a fala.
  if (currentVeil) {
    ctx.fillStyle = currentVeil;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (currentFlash) {
    ctx.fillStyle = currentFlash;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // A caixa pequena da Fábrica por cima do mundo congelado (H2)
  drawDialogo();

  if (phaseTransitionTimer > 0) {
    drawPhaseTransition(phaseTransitionTimer, getCurrentWave(), getCurrentPhase()?.name);
  }
  const hudData = buildHudData();
  drawHud(hudData);
  if (tabAberto) drawTabScreen(hudData, canvas.width, canvas.height);
  if (estaEmTelaCheia()) drawFullscreenHint(canvas.width, canvas.height);
  if (vooAtivo > 0) drawVoo(vooAtivo / PHASE_END_PAUSE, canvas.width, canvas.height);
}

/**
 * Aviso de tela cheia, sempre visível enquanto o jogo estiver nela.
 *
 * Dentro do iframe do itch.io a barra do jogador some, então não existe botão
 * para voltar. Sem este aviso o jogador que entrou em fullscreen por engano
 * fica sem nenhuma pista de como sair.
 */
function drawFullscreenHint(W: number, H: number): void {
  // o texto antigo ("ESC: sair da tela cheia") mentia desde a mudança do
  // ESC — agora a saída é opção do menu de pausa, e o aviso diz o caminho
  const texto = 'em tela cheia · pause: opção TELA CHEIA para sair';
  ctx.save();
  ctx.font = '11px monospace';
  const largura = ctx.measureText(texto).width + 20;
  const x = W / 2 - largura / 2;
  const y = H - 14;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x, y - 12, largura, 18);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y - 11.5, largura - 1, 17);
  ctx.fillStyle = PALETTE.textDim;
  ctx.textAlign = 'center';
  ctx.fillText(texto, W / 2, y);
  ctx.restore();
}

/** Desenha o mundo dentro da translação da câmera (uma vez por frame). */
function drawWorld(): void {
  const shake = currentShake;
  const camX = getCamX();
  const camY = getCamY();
  const phase = getCurrentPhase();
  const p = player.getPlayer();

  ctx.save();
  if (currentBossZoom !== 1) {
    ctx.translate(camX + canvas.width / 2, camY + canvas.height / 2);
    ctx.scale(currentBossZoom, currentBossZoom);
    ctx.translate(-(camX + canvas.width / 2), -(camY + canvas.height / 2));
  }
  ctx.translate(-camX + shake.x, -camY + shake.y);

  drawVoid(ctx);
  drawTerrain(ctx);
  drawFiresWorld(getFires());
  drawProps(
    ctx,
    (x, y, r) => isVisible(x, y, r, r),
    { crate: BIOMES[phase.map].propCrate, barrel: BIOMES[phase.map].propBarrel },
  );
  renderCoins(getCoins());
  renderPowerUps(powerups);
  drawLoot(getLoot(), ctx, (x, y, r) => isVisible(x, y, r, r));
  renderParticles(getParticles());
  // o índice da fase escolhe o personagem do bioma — sem ele, a tabela de
  // variação existia mas todo inimigo voltava ao mapa geral (9 silhuetas).
  renderEnemies(enemies, p.x, p.y, (e) => Math.atan2(p.y - e.y, p.x - e.x), PHASES.indexOf(getCurrentPhase()));
  drawNPCs(getNPCs());
  if (getCurrentMode() === 'competitive') drawBots(getBots());
  renderBullets(getBullets());
  renderPlayer(p);
  // o P2 do versus local: sem esta linha o modo anunciava "mesmo teclado" com
  // um jogador que existia no estado e não aparecia em tela (FUTURO §1.10)
  const p2 = isLocalEnabled() ? getPlayer2() : null;
  if (p2) renderPlayer2(p2);
  drawDamageNumbers(damageNumbers);
  if (phase.hazard === 'darkness') {
    // caverna escura: overlay com um furo em volta do jogador, recortado com
    // fill 'evenodd' — um retângulo chapado de 85% esconderia o jogador junto
    const camX = getCamX();
    const camY = getCamY();
    ctx.save();
    ctx.beginPath();
    ctx.rect(camX, camY, canvas.width, canvas.height);
    ctx.arc(p.x, p.y, 190, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(4,4,8,0.60)';
    ctx.fill('evenodd');
    ctx.restore();
  }
  // fog removido: era um radial verde escuro chapado que deixava tudo cafona

  restoreCanvas();
}

/** Cena congelada durante a pausa. */
function drawFrozenWorld(): void {
  drawWorld();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/** Ficha da arma equipada para a tela TAB, com a cor da raridade. */
function buildWeaponSheet(): WeaponSheet | null {
  const idx = getCurrentWeaponIndex();
  const quality = getWeaponQuality();
  const st = getWeaponStats(idx, quality);
  return {
    ...st,
    qualityColor: QUALITIES[quality]?.color ?? PALETTE.textDim,
  };
}

function buildHudData(): HudData {
  const p = player.getPlayer();
  const phase = getCurrentPhase();
  const weapon = getCurrentWeapon();
  const effectiveReload = getReloadTimeOf(getCurrentWeaponIndex());

  const boss = enemies.find(e => ENEMY_TYPES[e.type]?.isBoss);

  return {
    phase: phase.name,
    health: p.health,
    maxHealth: p.maxHealth,
    shield: p.shield,
    nivel: getNivel(),
    xpAtual: progressoNoNivel(getXp()).atual,
    xpNecessario: progressoNoNivel(getXp()).necessario,
    score: getScore(),
    coins: getShopCoins(),
    wave: getCurrentWave(),
    maxWave: phase.waves,
    // M3: o relógio da queda da Ponte — desenhado sob o objetivo
    quedaPonte: quedaAtiva() ? estadoDaQueda().proximoPasso : 0,
    enemies: enemies.length,
    weapon: weapon.name,
    slotsDeArma: getPurchasedWeaponPairs().length,
    // A condição é do PAR equipado, e o adjetivo é o da arma: "Corroída" numa
    // Metralhadora, "Fosca" numa Sniper. Toda qualidade EXCETO normal aparece
    // — a LENDÁRIA jogava invisível: só as negativas tinham adjetivo, e o
    // dono não via o que a loja vendeu caro (item "cores de condição").
    weaponCondition: getWeaponQuality() !== 'normal' ? conditionLabel(weapon.name, getWeaponQuality()).toUpperCase() : '',
    weaponConditionColor: QUALITIES[getWeaponQuality()]?.color ?? PALETTE.textDim,
    ammo: getCurrentAmmo(),
    // Pente EFETIVO: com a peça CAPACIDADE o jogador tem 15 balas, e a barra
    // desenhava 10 células. O mesmo para o progresso da recarga, que dividia
    // pelo tempo base e ignorava velocidade, classe e peça — a barra nunca
    // chegava a zero.
    maxAmmo: getCurrentCapacity(),
    reloading: getIsReloading(),
    reloadProgress: effectiveReload > 0 ? 1 - Math.max(0, getReloadTimer()) / effectiveReload : 1,
    weaponStats: buildWeaponSheet(),
    combo: getCombo(),
    comboDecay: getComboDecay(),
    // Murilo (2026-10-14): a fúria é SEGREDO até a Fábrica — enquanto
    // travada, ela não existe no HUD (nem a caixa, nem o rótulo). O
    // "FÚRIA DESBLOQUEADA" na morte do Rogério é a primeira vez que o
    // jogador vê que ela existe.
    skills: [
      { key: 'SPC', name: 'Dash', cooldown: getSkillCooldown('dash'), maxCooldown: getSkillMaxCooldown('dash'), active: isSkillActive('dash') },
      { key: 'F', name: 'Escudo', cooldown: getSkillCooldown('shield'), maxCooldown: getSkillMaxCooldown('shield'), active: isSkillActive('shield') },
      ...(furiaDesbloqueada() ? [{ key: 'E', name: 'Furia', cooldown: getSkillCooldown('fury'), maxCooldown: getSkillMaxCooldown('fury'), active: isSkillActive('fury') }] : []),
    ],
    activePowerups,
    powerupMeta: Object.fromEntries(Object.entries(POWERUP_TYPES).map(([k, v]) => [k, { color: v.color, symbol: v.symbol }])),
    worldSize: { w: worldW, h: worldH },
    minimap: { walls: wallRects, density: mapDensity },
    player: { x: p.x, y: p.y },
    enemyDots: enemies.map(e => ({ x: e.x, y: e.y, boss: !!ENEMY_TYPES[e.type]?.isBoss })),
    propDots: getProps().filter(pr => pr.health > 0).map(pr => ({ x: pr.x, y: pr.y, barrel: pr.kind === 'barrel', fuel: pr.kind === 'combustivel' })),
    boss: boss && ENEMY_TYPES[boss.type]?.bossName
      ? {
        name: ENEMY_TYPES[boss.type]!.bossName!,
        health: boss.health,
        maxHealth: boss.maxHealth,
        telegraphing: isBossTelegraphing(boss),
        // M5: o GRITO de entrada tem precedência enquanto conta — a
        // primeira telegrafia dele vem logo depois
        telegraphLabel: bossGritoTimer > 0 && bossGritoTexto ? bossGritoTexto : getBossTelegraphLabel(boss),
      }
      : null,
    objective: peekObjective(p.x, p.y, enemies.length, reachZones),
    warnings: getEnvironmentWarnings(),
    combos: getActiveCombos().map(c => ({ name: c.name, description: c.description, color: c.color })),
    hint: isTutorialActive() ? getCurrentHint() : null,
    toasts: achievementNotifications,
    phaseEndSeconds: phaseEndPause,
    medkits: player.getMedkits(),
    hasNpc: getNPCs().some(n => n.alive),
    npcFollowing: isNpcFollowing(),
  };
}

// ─── Game Loop ─────────────────────────────────────────────────

function loop(time: number) {
  const rawDt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  if (!updateHitStop(rawDt)) {
    const dt = updateSlowMotion(rawDt);
    update(dt);
  }

  // o screen shake é consumido dentro do draw (uma vez por frame)
  draw();
  keysPressed.clear();
  requestAnimationFrame(loop);
}

// ─── Boot ──────────────────────────────────────────────────────

// H2: o efeito da cápsula (a explosão da radiação no diálogo do amigo) liga
// aqui — os sistemas de mundo moram no main, o dialogo só conta as linhas.
setEfeitoDialogo(efeitoDaCapsula);
// A risada do epílogo dispara NA LINHA do riso (story.ts conta as linhas —
// playtest: "risada na hora errada", duas vezes)
setEfeitoDeLinha((efeito) => { if (efeito === 'risada') sfxRisada(); });

async function init() {
  // o jogo foi publicado como ASHFALL e as 12 chaves de localStorage mudaram
  // de prefixo. Sem isto, quem já jogou perde save, conquistas e recordes.
  migrarChavesDeSave();
  await loadAllSprites();
  // A torreta da loja (serviço M3) registra AQUI, pela API pública de
  // `loadSprite`, em vez da tabela PROP_EXTRA: o `sprites.ts` é o arquivo
  // compartilhado com a frente visual (tileset) e a fila de tiles em voo
  // não pode esperar por um registro de 1 linha. Mesma chave que o aliado
  // lê (`sprite: 'prop_torreta'`); se o arquivo faltar, o NPC cai no
  // fallback declarado — nunca em desenho novo.
  await loadSprite('prop_torreta', 'assets/sprites/props/torreta.png');
  // som de recarga por família de arma: `audio.ts` importa `weapons.ts`, então
  // a direção do hook é weapons -> main -> audio, sem ciclo
  onReloadStarted(() => sfxReload(getWeaponFamily()));
  const phase = PHASES[0];
  loadPhaseEnvironment();
  initCamera(worldW, worldH, canvas.width, canvas.height, player.getPlayer().x, player.getPlayer().y);
  snapCamera(player.getPlayer().x, player.getPlayer().y);
  initObjective(phase.objective, phase.objectiveTarget);
  requestAnimationFrame((time) => {
    lastTime = time;
    loop(time);
  });
}

init();


/**
 * IA dos inimigos: flow field para o caminho, seek direto perto do jogador, e
 * separação para desempilhar sem custo de pathfinding.
 *
 * Saiu de `update` para o orquestrador ler como uma lista de passos. A lógica é
 * a mesma; mudou o nome e o receiver explícito.
 */
function biomeModifiers(phase: ReturnType<typeof getCurrentPhase>) {
  const mods = { dmgMult: 1, takenMult: 1, speedMult: 1, enemySpeedMult: 1 };
  switch (phase?.hazard) {
    case 'electric': mods.dmgMult = 1.15; break;
    case 'lowGravity': mods.speedMult = 1.25; mods.takenMult *= 1.1; break;
    case 'mud': mods.speedMult *= 0.85; break;
    case 'debris': mods.enemySpeedMult = 1.15; break;
    case 'darkness': mods.takenMult *= 1.1; break;
    case 'spikes': mods.dmgMult *= 1.1; mods.takenMult *= 1.1; break;
    case 'lava': mods.dmgMult *= 1.2; break;
    case 'fog': mods.enemySpeedMult = 1.15; break;
    case 'none': break;
  }
  return mods;
}

/**
 * Dano que o jogador realmente leva: habilidade (fúria, escudo, pele de
 * pedra) e bioma. Fica num helper só porque os 6 call sites esqueceram o
 * multiplicador do bioma — `lowGravity`, `darkness` e `spikes` anunciavam
 * +10% de dano recebido no código, mas nada aplicava.
 */
function damageTaken(raw: number): number {
  return Math.floor(raw * getDamageTakenMultiplier() * biomeModifiers(getCurrentPhase()).takenMult);
}

/**
 * Passo de célula: o vetor de descida do flow field diz a DIREÇÃO média da
 * célula, mas porta de 1 célula exige alinhamento que o vetor não carrega.
 * Um corpo deslocado do centro chega na lateral do vão, o deslize por eixo
 * não tem componente para corrigir e o inimigo trava — reproduzido com as
 * funções reais (1800/1800 frames parado na porta norte do Castelo, e 994
 * travados espetados no canto da parede do corredor sul). Mirar no CENTRO
 * da próxima célula da descida realinha o corpo com o vão antes de
 * atravessá-lo — o mesmo passeio célula a célula que os testes de flow
 * fazem, e por isso os testes chegavam onde o jogo travava.
 */
function passoDeCelula(x: number, y: number, dir: { x: number; y: number }) {
  const proxima = cellCenter(colAt(x) + Math.round(dir.x), rowAt(y) + Math.round(dir.y));
  return normalize({ x: proxima.x - x, y: proxima.y - y });
}

function updateEnemyAi(dt: number, p: ReturnType<typeof player.getPlayer>, phase: ReturnType<typeof getCurrentPhase>): void {
// ── IA dos inimigos: flow field + separação ──
const tendency = getPlayerTendency();
const aiMods = biomeModifiers(phase);
for (const e of enemies) {
  if (e.spawnDelay > 0) {
    e.spawnDelay -= dt;
    continue;
  }
  if (e.hitFlash > 0) e.hitFlash -= dt;

  const def = ENEMY_TYPES[e.type];
  if (def?.isBoss) {
    for (const minion of updateBoss(e, p.x, p.y, worldW, worldH, dt)) {
      // cap para não afogar a tela com minions quando o boss faz summons
      if (enemies.length < 6) enemies.push(minion);
    }
    // boss não entra no empilhamento
    if (e.hitFlash > 0) continue;
  } else {
    // O caçador do alvo (huntsNpc, ou todo mundo na fase de protect) persegue
    // o alvo — o foguete quando o mapa tem um, senão o sobrevivente. Sem
    // isso o objetivo protect é só "não deixe o alvo morrer" contra inimigos
    // que nem procuram nele. Longe do FOGUETE segue o flow field dele (o do
    // jogador aponta para outra fonte); perto, seek direto — o gradiente é
    // ruidoso na célula-fonte, o mesmo critério do campo do jogador. O NPC
    // legado não tem campo: ele se MEXE, um campo estático apontaria para
    // onde ele não está mais.
    const fogueteNoMapa = phase.objective === 'protect' ? getRocket() : undefined;
    // ressentimento (relato do Murilo: caçador "me ignorando inclusive nas
    // balas"): enquanto o aggro dura, o caçador persegue QUEM ATIROU nele.
    if (e.aggroTimer !== undefined && e.aggroTimer > 0) e.aggroTimer -= dt;
    const flow = sampleFlowDir(e.x, e.y);
    // perto do jogador o flow field é ruidoso: aí vai o seek direto
    const distToPlayer = Math.hypot(p.x - e.x, p.y - e.y);
    // M3 ("encostou, vira alvo", relato 2026-10-14): o caçador que chega
    // no jogador troca o alvo por uns segundos — ficar na frente dele é a
    // defesa do protect, e o caçador que ignora a ameaça a pé lê como
    // burro. O mesmo aggro de quem leva tiro, agora por proximidade: enquanto
    // está perto, o jogador é o alvo; 4s depois de sair, volta ao foguete.
    if ((fogueteNoMapa ?? ((def?.huntsNpc || phase.objective === 'protect') ? getNPCs().find(n => n.alive) : undefined))
      && distToPlayer < RAIO_TROCA_DE_ALVO) {
      e.aggroTimer = 4;
    }
    const comAggro = (e.aggroTimer ?? 0) > 0;
    const prey = !comAggro
      ? (fogueteNoMapa ?? ((def?.huntsNpc || phase.objective === 'protect') ? getNPCs().find(n => n.alive) : undefined))
      : undefined;
    // atirador comum: sabe onde o jogador está, não faz sentido encostar
    const atiradorComum = def?.canShoot === true && !def?.isBoss;
    let seekX: number;
    let seekY: number;
    if (prey) {
      const distAoAlvo = Math.hypot(prey.x - e.x, prey.y - e.y);
      const flowAlvo = fogueteNoMapa ? sampleFlowDirAlvo(e.x, e.y) : null;
      if (flowAlvo && distAoAlvo >= 140 && (flowAlvo.x !== 0 || flowAlvo.y !== 0)) {
        const passo = passoDeCelula(e.x, e.y, flowAlvo);
        seekX = passo.x;
        seekY = passo.y;
      } else {
        const caça = normalize({ x: prey.x - e.x, y: prey.y - e.y });
        seekX = caça.x;
        seekY = caça.y;
      }
    } else if (atiradorComum) {
      // Relato do Murilo (2026-10-13): atirador não aproxima de quem já
      // sabe onde está. Segura o alcance do tiro: aproxima até
      // ALCANCE_DO_ATIRADOR, recua quando o jogador fecha, e fica parado na
      // faixa — só a separação age. A bala dele leva ~1s para chegar de
      // longe, que é a janela de esquiva do jogo.
      seekX = 0;
      seekY = 0;
      if (distToPlayer > ALCANCE_DO_ATIRADOR + 40) {
        const passo = passoDeCelula(e.x, e.y, flow);
        seekX = passo.x;
        seekY = passo.y;
      } else if (distToPlayer < RECUO_DO_ATIRADOR) {
        const recuo = normalize({ x: e.x - p.x, y: e.y - p.y });
        seekX = recuo.x;
        seekY = recuo.y;
      }
    } else if (distToPlayer < 140) {
      const direct = normalize({ x: p.x + tendency.h * 60 - e.x, y: p.y + tendency.v * 60 - e.y });
      seekX = direct.x;
      seekY = direct.y;
    } else if (flow.x !== 0 || flow.y !== 0) {
      const passo = passoDeCelula(e.x, e.y, flow);
      seekX = passo.x;
      seekY = passo.y;
    } else {
      const direct = normalize({ x: p.x - e.x, y: p.y - e.y });
      seekX = direct.x;
      seekY = direct.y;
    }

    // separação: resolve o empilhamento sem custo de pathfinding
    let sepX = 0;
    let sepY = 0;
    for (const other of enemies) {
      if (other === e) continue;
      const d = Math.hypot(other.x - e.x, other.y - e.y);
      const minDist = e.radius + other.radius;
      if (d > 0.001 && d < minDist) {
        const push = (minDist - d) / minDist;
        sepX -= ((other.x - e.x) / d) * push;
        sepY -= ((other.y - e.y) / d) * push;
      }
    }

    const spd = (e.type === 'mosquito' ? e.speed * 1.3 : e.speed) * aiMods.enemySpeedMult;
    const gravityPush = phase.hazard === 'lowGravity' ? 1.35 : 1;
    const next = moveCircleBy(
      e.x, e.y,
      (seekX + sepX * 1.6) * spd * dt * gravityPush,
      (seekY + sepY * 1.6) * spd * dt * gravityPush,
      e.radius
    );
    e.x = next.x;
    e.y = next.y;

    // Tira da parede quem entrou nela. `moveCircleBy` só impede ENTRAR: um
    // inimigo que já sobrepõe uma parede fica com `flowDist === -1`, o
    // `sampleFlowDir` devolve 0,0, o seek direto aponta para o jogador e
    // `moveCircleBy` recusa TODOS os passos porque o círculo já está dentro.
    // O inimigo fica parado para sempre, a onda nunca fecha e o jogo trava
    // numa fase que o jogador não consegue matar nem ver.
    //
    // Foi medido no Bunker (`npm run fases`): a fase que tem a fileira 17
    // quase toda parede e a 19 totalmente parede deixava inimigos parados
    // dentro do mapa, e o `session.mjs` gastava 60s com 4 hostis na tela e
    // zero abates. Jogador, chefe, loot, moeda e powerup já usavam
    // `pushOutOfWalls`; só o inimigo comum ficou de fora.
    const fora = pushOutOfWalls(e.x, e.y, e.radius);
    e.x = fora.x;
    e.y = fora.y;
  }

  if (e.canShoot && !ENEMY_TYPES[e.type]?.isBoss) {
    e.shootTimer -= dt;
    // o caçador atira no alvo do protect (foguete primeiro), não no jogador
    const fogueteAqui = phase.objective === 'protect' ? getRocket() : undefined;
    const preyAlvo = fogueteAqui ?? ((def?.huntsNpc || phase.objective === 'protect') ? getNPCs().find(n => n.alive) : undefined);
    const alvoX = preyAlvo ? preyAlvo.x : p.x;
    const alvoY = preyAlvo ? preyAlvo.y : p.y;
    // Linha de visão (relato do Murilo, 2026-10-13): "não conta atirar sem me
    // ver se tem parede na frente". O projétil do inimigo já morria na
    // parede — o tiro nascia, gastava o cooldown e o som e não chegava em
    // nada. Sem bala saindo da parede, o atirador fica calado até ter visão.
    if (e.shootTimer <= 0 && !segmentHitsWall(e.x, e.y, alvoX, alvoY)) {
      shootEnemyAt(e, alvoX, alvoY);
    }
  }

  if (ENEMY_TYPES[e.type]?.leavesFire) {
    e.attackTimer += dt;
    if (e.attackTimer >= 0.5) {
      e.attackTimer = 0;
      spawnParticles(e.x, e.y + e.radius, '#c46a3a', 3, 50, 'smoke');
    }
  }
}

}

/**
 * Colisões do frame: inimigo contra jogador, projétil contra jogador e
 * projétil contra prop.
 */
function resolveCollisions(p: ReturnType<typeof player.getPlayer>): void {

// ── colisões ──
const activeEnemies = enemies.filter(e => e.spawnDelay <= 0);
checkEnemyPlayerCollision(activeEnemies, p.x, p.y, p.radius, p.invincible, (e) => {
  const baseDmg = hasPowerUp('invincible') ? 0 : e.damage;
  const dmg = damageTaken(baseDmg);
  if (dmg > 0) {
    checkAchievements('damage_taken');
    player.enemyCollisionDamage(dmg, {
      fonte: ENEMY_TYPES[e.type]?.isBoss ? 'boss' : 'contato',
      tipo: e.type,
    });
    sfxPlayerHit();
    triggerDamageFlash();
  }
  // Encostar NÃO mata melee: quem não atira briga de perto. Inimigos de curto
  // alcance apanham o mesmo dano que dão e continuam de pé — investing num
  // zumbi funciona, mas encostar num melee é briga dos dois. Atiradores e
  // chefes seguem morríveis por stomp: chefes nunca, porque VIGIA, ALPHA WOLF
  // e REI MUTANTE abrem o padrão com investida e morreriam no contato.
  let toughContact = false;
  if (!ENEMY_TYPES[e.type]?.isBoss && !ENEMY_TYPES[e.type]?.canShoot) {
    e.health -= Math.floor(e.damage / 2);
    e.hitFlash = 0.1;
    toughContact = true;
  }
  if (!toughContact && !ENEMY_TYPES[e.type]?.isBoss) killEnemy(e, false);
});

const bullets = getBullets();

// M5 "Rasante": a bala inimiga que passa RENTE sem tocar (a faixa entre o
// corpo e 30px) é o dodge no seu limite — conta uma vez por bala. Se ela
// acertar em seguida, o dano cobra o preço do show-off.
for (const b of bullets) {
  if (!b.isEnemy || b.life <= 0 || balsRasantes.has(b)) continue;
  const d = Math.hypot(b.x - p.x, b.y - p.y);
  if (d < p.radius + 30 && d > p.radius + 6) {
    balsRasantes.add(b);
    const grazeAch = checkAchievements('graze');
    if (grazeAch) pushToast(grazeAch.name, 3);
  }
}

checkEnemyBulletPlayerCollision(bullets, p.x, p.y, p.radius, p.invincible, (b) => {
  const dmg = damageTaken(b.damage);
  if (dmg > 0) {
    checkAchievements('damage_taken');
    player.damagePlayer(dmg, { tipo: b.orcador });
    sfxPlayerHit();
    triggerDamageFlash();
  }
  b.life = 0;
  spawnParticles(b.x, b.y, b.color, 3, 100);
});

// projétil vs prop (a bala quebra o que estiver no caminho)
updateBulletProps(bullets);

checkBulletEnemyCollisions(bullets, enemies, (b, e) => {
  e.hitFlash = 0.15;
  registerHit();
  // Relato do Murilo (2026-10-13): os caçadores do foguete "me ignoram
  // inclusive nas balas". Quem leva tiro do jogador troca de alvo por uns
  // segundos — a invasão do Castelo não pode ser indiferente a quem está
  // atirando nela. Depois do ressentimento, volta pro foguete.
  e.aggroTimer = 4;
  // crítico vem do flag, não de comparar string de cor
  const isCrit = b.isCrit;
  if (b.explosive && b.explosionRadius) {
    detonateBullet(b);
  } else {
    e.health -= b.damage;
    damageNumbers.push({
      x: e.x + (Math.random() - 0.5) * 20,
      y: e.y - 20,
      text: isCrit ? `${Math.floor(b.damage)}!` : String(Math.floor(b.damage)),
      color: isCrit ? PALETTE.crit : PALETTE.text,
      life: 1,
      vy: -80,
    });
  }
  if (isCrit) {
    spawnParticles(b.x, b.y, PALETTE.crit, 8, 200);
  }
  if (!b.pierce) b.life = 0;
  spawnParticles(b.x, b.y, b.color, 3, 150);
  triggerHitStop(0.015);
});

if (getCurrentMode() === 'competitive') {
  for (const b of bullets) {
    if (b.isEnemy || b.life <= 0) continue;
    for (const bot of getBots()) {
      if (b.life <= 0) break;
      if (bulletHitsCircle(b, bot.x, bot.y, bot.radius + 5)) {
        bot.health -= b.damage;
        damageNumbers.push({
          x: bot.x + (Math.random() - 0.5) * 20,
          y: bot.y - 20,
          text: b.isCrit ? `${Math.floor(b.damage)}!` : String(Math.floor(b.damage)),
          color: b.isCrit ? PALETTE.crit : PALETTE.text,
          life: 1,
          vy: -80,
        });
        if (!b.pierce) b.life = 0;
        spawnParticles(b.x, b.y, b.color, 3, 150);
      }
    }
  }
}

}

/**
 * Fim do frame: mata o que sobrou sem vida e roda os sistemas de tick (projéteis,
 * partículas, explosões, barris, combo, moedas, power-ups, NPCs).
 */
function endOfFrame(dt: number, p: ReturnType<typeof player.getPlayer>): void {
// ── limpeza dos mortos ──
for (let i = enemies.length - 1; i >= 0; i--) {
  if (enemies[i].health <= 0) killEnemy(enemies[i], true);
}

// mina com inimigo no raio armeia o fuse; fuse estourado explode
for (const m of updateMines(dt, enemies)) detonateBullet(m);
// pavio: explosivo que chegou ao fim da vida útil explode em vez de sumir
for (const b of updateBullets(dt, worldW, worldH)) detonateBullet(b);
// bala não atravessa parede: morre no cruzamento com fagulha; explosivo
// detona no impacto (o RPG parava de atravessar o mapa inteiro)
for (const b of getBullets()) {
  if (b.life <= 0) continue;
  if (segmentHitsWall(b.px, b.py, b.x, b.y)) {
    if (b.explosive && b.explosionRadius) detonateBullet(b);
    else {
      b.life = 0;
      spawnParticles(b.x, b.y, b.color, 3, 100);
    }
  }
}
updateParticles(dt);
updateExplosions(dt);
updateFires(dt);
// B7: o fogo é do mundo — fere os dois lados. O inimigo que fica em cima
// da poça paga 8/s; a coleta do health <= 0 é a do loop de mortes.
for (const e of enemies) {
  if (e.spawnDelay > 0) continue;
  if (pisaEmFogo(e.x, e.y, e.radius)) e.health -= FOGO_DPS * dt;
}
updateBarrels(dt);
updateDamageNumbers(dt);

updateCombo(dt);
updateCombos();
setComboHealthMultiplier(getComboHealthBonus());
updateTutorial(dt);
setMagnetActive(hasPowerUp('magnet'));

// `getPlayer2` não tem guard de `enabled` por dentro, então o modo é conferido
// antes de puxar o objeto — senão o código lia estado de uma sessão local
// anterior mesmo estando em campanha.
const p2 = isLocalEnabled() ? getPlayer2() : null;
if (p2) {
  for (const e of enemies) {
    if (e.health > 0 && checkPlayer2EnemyCollision(e.x, e.y, e.radius)) {
      e.health = 0;
      spawnParticles(e.x, e.y, e.color, 12, 200);
    }
  }
}

updateCoins(dt, p.x, p.y, p.radius, (v) => {
  // MENTE T2/T5 levantam cada moeda via coinMult; MENTE T3 e o SORTUDO pesam
  // aqui (+5% por ponto de sorte). O piso de 1 mantém a moeda de 1 valor em 1.
  const sorte = 1 + getStat('luck') * 0.05;
  const comBonus = Math.max(1, Math.round(v * getStat('coinMult') * sorte));
  addScoreFlat(comBonus);
  addShopCoins(comBonus);
  sfxCoin();
});
updatePowerUps(dt, p.x, p.y, p.radius, (type) => {
  if (type === 'health') player.healPlayer(30);
  if (type === 'shield') p.shield += 2;
  if (type === 'trajeNucleo') {
    p.shield += 3;
    // M5: vestir o traje da fase final é conquista própria
    const trajeAch = checkAchievements('traje');
    if (trajeAch) pushToast(trajeAch.name, 3);
  }
  spawnParticles(p.x, p.y, POWERUP_TYPES[type].color, 15, 200, 'muzzle');
  sfxPowerup();
});

// ── encher os tambores da Refinaria (objetivo `collect`) ──
// Coleta por PROXIMIDADE, como a moeda: o beat da fase é "Rios enche
// tambores de combustível" (PREMISSA-V2), e encher não é destruir — o tiro
// só cobre o tambor sem tirá-lo do mapa. O último tambor é o que libera o
// chefe (`objetivoLiberouChefe` em `peekObjective().done`).
for (let tambo = collectFuelAt(p.x, p.y, p.radius); tambo; tambo = collectFuelAt(p.x, p.y, p.radius)) {
  registerFuelCollected();
  spawnParticles(tambo.x, tambo.y, PALETTE.mustard, 12, 160, 'muzzle');
  damageNumbers.push({
    x: tambo.x, y: tambo.y - 26,
    text: 'COMBUSTÍVEL', color: PALETTE.mustard, life: 1.4, vy: -46,
  });
  sfxFerramenta();
  triggerScreenShake(2, 0.1);
}

updateNPCs(dt, p.x, p.y, enemies, getBullets());

// ── a morte do Júlio em jogo (Castelo, 2026-10-14) ──
// A fase continua sem ele: o custo é a recompensa (sala 4B + diário). O
// consume é por frame — o corpo sai da lista 3s depois da mensagem, então
// polling do array perderia a morte.
// O ALIADO PAGO CAIU (playtest: "maior atenção + aviso")
if (consumeAliadoMorte()) {
  pushToast('O CONTRATADO CAIU', 3.5, 'aviso');
  triggerDamageFlash();
  sfxError();
}
if (consumeNpcDeath()) {
  if (getCurrentPhase().name === 'Castelo' && getCurrentMode() === 'campaign'
      && julioApareceu && !julioMorteAnunciada && getGameState() === 'playing') {
    julioMorteAnunciada = true;
    abrirDialogo(SEQUENCIA_JULIO_MORRE);
  }
}

// ── o foguete do protect apanha de quem encosta ──
// O alvo do Castelo é um objeto parado: cada inimigo que alcança a base tira
// ROCKET_CONTACT_DPS por segundo. 300 HP dá janela de chegar limpando; a barra
// do HUD lê o HP em tempo real (contrato do B3, vale para prop e NPC igual).
{
  const alvoFoguete = getRocket();
  if (alvoFoguete) {
    let tocando = 0;
    for (const e of enemies) {
      if (e.health <= 0 || e.spawnDelay > 0) continue;
      if (Math.hypot(e.x - alvoFoguete.x, e.y - alvoFoguete.y) < alvoFoguete.radius + e.radius) tocando++;
    }
    if (tocando > 0 && damageProp(alvoFoguete, ROCKET_CONTACT_DPS * tocando * dt)) {
      markVipDown();
    }
  }
}

const lootReward = updateLoot(dt, p.x, p.y, p.radius);
if (lootReward) {
  if (lootReward.kind === 'powerup') {
    const t = lootReward.type;
    if (t === 'health') player.healPlayer(30);
    else if (t === 'shield') p.shield += 2;
    activePowerups[t] = POWERUP_TYPES[t]?.duration ?? 0;
    damageNumbers.push({ x: p.x, y: p.y - 24, text: powerupLabel(t), color: POWERUP_TYPES[t]?.color ?? '#ccc', life: 1.4, vy: -70 });
    sfxCoin();
  } else if (lootReward.kind === 'medkit') {
    player.addMedkits(1);
    damageNumbers.push({ x: p.x, y: p.y - 24, text: '+1 MEDKIT (H)', color: PALETTE.moss, life: 1.6, vy: -60 });
    sfxCoin();
  } else {
    pushPendingReveal(lootReward.index, lootReward.quality);
    damageNumbers.push({ x: p.x, y: p.y - 24, text: 'ITEM DESCONHECIDO', color: PALETTE.mustard, life: 1.6, vy: -60 });
    sfxCoin();
  }
}
}

// ─── Gancho de inspeção (harness visual) ─────────────────────
// `tools/bullet-proof.mjs` precisa injetar projéteis com velocidade conhecida
// para provar a orientação da sprite. Sem isto, a única forma de ver se a bala
// está deitada é jogar e rezar — foi exatamente assim que uma bala girada 90°
// passou por build e teste.
declare global {
  interface Window { __ashfall?: unknown }
}
window.__ashfall = {
  canvas, ctx, spawnBullet, getBullets, clearBullets,
  spriteFor: (k: string) => getSprite(k),
  camera: () => ({ x: getCamX(), y: getCamY() }),
  // posição do jogador ao vivo — a prova do A5 ("player para de se mover")
  // amostra a posição por segundo para achar travadas; o hospital-proof
  // usa para ler o piso ao lado do corpo
  player: () => {
    const p = player.getPlayer();
    return { x: p.x, y: p.y, hp: p.health };
  },
  inimigoMaisProximo: () => {
    const p = player.getPlayer();
    let melhor: { x: number; y: number; type: string; health: number; dist: number } | null = null;
    for (const e of enemies) {
      if (e.spawnDelay > 0) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (!melhor || d < melhor.dist) {
        melhor = { x: e.x, y: e.y, type: e.type, health: e.health, dist: d };
      }
    }
    return melhor;
  },
  /**
   * A ameaça mais próxima que MATA: inimigo ou barril aceso.
   *
   * Existe porque `npm run sessao`-media "o bot morre na onda 1" e a telemetria
   * respondeu `barril: 90` de 115 de dano: o bot não estava morrendo de inimigo,
   * estava morrendo dos próprios caixotes, que ele não desvia porque só olhava
   * para `inimigoMaisProximo`. Devolve também `raio`, a distância em que aquela
   * ameaça começa a doer, para o bot não precisar saber número de balanceamento.
   */
  ameacaMaisProxima: () => {
    const p = player.getPlayer();
    let melhor: { dx: number; dy: number; dist: number; tipo: string; origem: string; raio: number } | null = null;
    const considerar = (x: number, y: number, tipo: string, origem: string, raio: number) => {
      const dx = x - p.x;
      const dy = y - p.y;
      const dist = Math.hypot(dx, dy);
      // o raio entra no critério: um barril a 200px com raio 96 não é ameaça
      // mais próxima que um inimigo a 40px, mesmo estando mais perto no mapa
      const peso = dist - raio;
      if (!melhor || peso < melhor.dist - melhor.raio) {
        melhor = { dx, dy, dist, tipo, origem, raio };
      }
    };
    for (const e of enemies) {
      if (e.spawnDelay > 0) continue;
      considerar(e.x, e.y, e.type, 'inimigo', p.radius + e.radius);
    }
    for (const pr of getProps()) {
      if (pr.kind !== 'barrel') continue;
      considerar(pr.x, pr.y, 'barril', 'barril', getBlast(pr).radius);
    }
    return melhor;
  },
  telemetria: () => {
    const p = player.getPlayer();
    return {
      hp: Math.round(p.health),
      maxHp: p.maxHealth,
      onda: getCurrentWave() + 1,
      inimigos: enemies.length,
      balas: getBullets().length,
      // total, não sequência: `getKillStreak()` zera a cada intervalo sem
      // abate e a linha do log mostrava `kills` congelado enquanto os abates
      // aconteciam. É o mesmo bug que a tela de fim tinha com "Abates".
      kills: getTotalKills(),
      estado: getGameState(),
      moedas: getShopCoins(),
      escudo: p.shield,
      invicivel: Number(p.invincible.toFixed(2)),
      dano: danoPorFonte(),
      velocidade: Number(ultimoStackVelocidade.toFixed(3)),
    };
  },
  // Estado de fim de fase: o harness precisa disto para provar que matar o
  // chefe fecha a fase sem depender de matar todo o resto do campo.
  // Config crua: o `campanha-proof.mjs` calcula o dano na entrada de cada fase
  // aplicando a fórmula real do spawner. Ele lia `config.ts` por regex, e regex
  // em dado de config erra sem aviso — pegou 7 das 9 fases numa primeira
  // versão. Estalar o dado aqui elimina a fonte de drift.
  config: () => ({
    fases: PHASES.map((f) => ({
      name: f.name, waves: f.waves, hazard: f.hazard,
      difficulty: f.difficulty ?? null,
      objective: f.objective, enemyTypes: f.enemyTypes, boss: f.boss ?? null,
    })),
    inimigos: Object.fromEntries(
      Object.entries(ENEMY_TYPES).map(([k, v]) => [k, { damage: v.damage, health: v.health, speed: v.speed }]),
    ),
    // a fila do rush vem daqui: o `rush-proof.mjs` compara com o que entrou
    // em tela e não repete a fonte de verdade em outro arquivo.
    nucleoRush: NUCLEO_RUSH,
    // M3: a renda esperada de cada fase pela FONTE ÚNICA do árbitro — a
    // medição em navegador (m3-economia-proof) compara o que o bot GANHOU
    // contra o que o modelo PROMETE, por fase
    rendaDeAbate: PHASES.map(f => rendaDeAbate(f)),
    vidaBase: PLAYER_BASE_HEALTH,
  }),
  fase: () => {
    // Depois da última fase `getCurrentPhase()` é undefined — o `campanha-proof`
    // chama isto na transição do epílogo e derrubava o processo inteiro. O
    // harness precisa de um estado para ler, não de uma exceção.
    const fase = getCurrentPhase();
    const p = player.getPlayer();
    if (!fase) {
      return {
        fase: '(fim da campanha)', indice: PHASES.length, dificuldade: null, objetivo: null,
        onda: 0, ondas: 0, vida: Math.round(p.health), vidaMax: p.maxHealth,
        inimigos: 0, tipos: [], chefeVivo: false, chefeDerrotado: false,
        respiroRestante: 0, respiroArmado: false, jogadorMorto: playerDied,
        estado: getGameState(),
      };
    }
    return {
    fase: fase.name,
    // índice e dificuldade: o `campanha-proof.mjs` precisa provar a ORDEM das
    // 9 fases (o Bunker Central abrir o EPÍLOGO e as fases sem `difficulty`
    // declarada só aparecem olhando estes dois campos).
    indice: PHASES.indexOf(fase),
    dificuldade: fase.difficulty ?? null,
    objetivo: fase.objective,
    onda: getCurrentWave() + 1,
    ondas: fase.waves,
    vida: Math.round(p.health),
    vidaMax: p.maxHealth,
    inimigos: enemies.length,
    // quais tipos estão na tela: prova se o `asteroid` realmente entra no
    // sorteio do Espaço em vez de só existir no config.
    tipos: [...new Set(enemies.map(e => e.type))].sort(),
    // O objetivo lido agora: o `objetivo` acima é o TIPO ('reach'), que é dado
    // do config. O estado do objetivo — se foi cumprido, quanto falta — é o que
    // decide se o chefe nasce (DECISIONS #170: o objetivo libera o chefe).
    objetivoAtual: peekObjective(p.x, p.y, enemies.length, reachZones),
    chefeVivo: enemies.some(e => ENEMY_TYPES[e.type]?.isBoss),
    chefeDerrotado: bossKilled,
    respiroRestante: phaseEndPause,
    respiroArmado: phaseEnding,
    jogadorMorto: playerDied,
    estado: getGameState(),
    };
  },
  pularParaUltimaOnda: () => {
    // `resetWave` aqui desfaria o `setCurrentWave`: a ordem importa.
    setCurrentWave(getCurrentPhase().waves - 1);
    bossSpawned = false;
    bossKilled = false;
    bossRushIndex = 0;
    phaseEnding = false;
    phaseEndPause = 0;
    for (let i = enemies.length - 1; i >= 0; i--) killEnemy(enemies[i], false);
    return getCurrentWave();
  },
  // Salta para a fase `i` no meio da partida, sem jogar as anteriores: mesma
  // sequência do `startFromSave` (nextPhase N vezes + ambiente). O
  // `rush-proof.mjs` precisa disto para chegar ao Bunker Central sem rodar
  // as 8 fases anteriores a cada execução.
  irParaFase: (i: number) => {
    // Limpa o mundo ANTES de trocar. Sem isto, `fases-todas.mjs` mede a fase
    // errada: os inimigos da fase anterior sobrevivem ao salto e continuam
    // perseguindo, então a Cidade aparecia no Espaço com o `mutante` dela
    // batendo. A tabela inteira saiu idêntica nas 9 fases — e o sintoma era
    // "todo mundo morre igual", não "todo mundo é igual".
    for (let k = enemies.length - 1; k >= 0; k--) enemies.splice(k, 1);
    clearBullets();
    clearParticles();
    damageNumbers.length = 0;
    resetDanoTelemetria();
    playerDied = false;
    bossKilled = false;
    bossSpawned = false;
    bossRushIndex = 0;
    biomaquinaTimer = 0;
    phaseEnding = false;
    phaseEndPause = 0;

    resetPhases();
    setGameState('playing');
    for (let k = 0; k < i; k++) nextPhase();
    loadPhaseEnvironment();
    return PHASES.indexOf(getCurrentPhase());
  },
  // Invoca o chefe na hora. O spawn natural depende de `enemies.length === 0`
  // numa janela de frame específica e o spawner reabastece a cota da onda antes
  // disso; o harness não pode depender dessa corrida.
  invocarChefe: () => {
    const faseAtual = getCurrentPhase();
    if (!faseAtual.boss) return false;
    const livre = findFreeSpotNear(worldW / 2, worldH / 2, 46);
    const b = spawnEnemy(faseAtual.boss, worldW, worldH, 0, livre.x, livre.y);
    if (!b) return false;
    b.spawnDelay = 0;
    b.health = b.maxHealth;
    enemies.push(b);
    bossSpawned = true;
    // M5: o grito de entrada vale no atalho da prova também — senão o
    // harness nunca exercitaria o que o jogador vê no caminho natural.
    const grito = ENEMY_TYPES[faseAtual.boss]?.entryShout;
    if (grito) {
      bossGritoTexto = grito;
      bossGritoTimer = 2.6;
    }
    return true;
  },
  /**
   * Inimigo de tipo e posição fixos.
   *
   * O `variedade-proof.mjs` precisa comparar o MESMO tipo entre fases: deixar o
   * spawner-sortear comparava `grunt` na Cidade contra `drone` no Espaço, e o
   * harness acusava "a variação não está na tela" com a tabela perfeita.
   */
  spawnarInimigo: (tipo: string, dist = 120, angulo = 0) => {
    const p = player.getPlayer();
    const e = spawnEnemy(tipo, worldW, worldH, 0, p.x + Math.cos(angulo) * dist, p.y + Math.sin(angulo) * dist);
    if (!e) return null;
    e.spawnDelay = 0;
    enemies.push(e);
    return { tipo, x: e.x, y: e.y };
  },
  spawnarReforco: (n: number) => {
    const tipos = getCurrentPhase().enemyTypes;
    for (let i = 0; i < n; i++) {
      const livre = findFreeSpotNear(worldW / 2 + (i - 1) * 80, worldH / 2, 16);
      const e = spawnEnemy(tipos[i % tipos.length], worldW, worldH, 0, livre.x, livre.y);
      if (e) { e.spawnDelay = 0; enemies.push(e); }
    }
    return enemies.length;
  },
  matarChefe: () => {
    const b = enemies.find(e => ENEMY_TYPES[e.type]?.isBoss);
    if (!b) return false;
    b.health = 0;
    killEnemy(b, true);
    return true;
  },
  matarTodos: () => {
    for (let i = enemies.length - 1; i >= 0; i--) killEnemy(enemies[i], true);
    return enemies.length;
  },
  /** Marca o sobrevivente como caído sem esperar o dano (prova do Castelo). */
  matarVip: () => { markVipDown(); },
  zerarVida: () => { player.getPlayer().health = 0; return player.getPlayer().health; },
  /** Teleporta para a zona de extração: cumpre o objetivo `reach`. */
  irParaZona: () => {
    const z = reachZones[0];
    if (!z) return false;
    const p = player.getPlayer();
    p.x = z.x;
    p.y = z.y;
    return true;
  },
  /**
   * Teleporta para perto de um tambo de combustível: é o `irParaZona` do
   * objetivo `collect`. `distancia` em px é a folga até o tambor — 0 encosta
   * (coleta no frame seguinte), 90 deixa o tambor ao lado do jogador para a
   * prova fotografá-lo antes de sumir do mapa.
   *
   * Devolve a posição MUNDO do tambor (ou null): a câmera trava no clamp da
   * borda do mapa, então perto da parede o jogador não fica centrado e a
   * prova não pode supor o centro da tela para enquadrar o objeto.
   */
  irParaTambo: (distancia = 0) => {
    const tambo = getProps().find(pr => pr.kind === 'combustivel');
    if (!tambo) return null;
    const p = player.getPlayer();
    p.x = tambo.x + distancia;
    p.y = tambo.y;
    return { x: tambo.x, y: tambo.y };
  },
  /** Cumpre o objetivo da fase sem jogá-lo (harness: o fim exige objetivo). */
  cumprirObjetivo: () => { forceObjectiveDone(); },
  /** Recomeça a campanha do zero (pula o menu e a cutscene). */
  novaPartida: () => {
    resetPhases();
    startRun();
    skipCutscene();
    setGameState('playing');
    return getCurrentPhase()?.name ?? 'FIM';
  },
  /** Avança para a fase seguinte pulando a loja, como o ENTER faria. */
  proximaFase: () => {
    setGameState('shop');
    leaveShop();
    skipCutscene();
    // `nextPhase` passou da última fase: `getCurrentPhase()` é undefined.
    return getCurrentPhase()?.name ?? 'FIM';
  },
  curar: () => { const p = player.getPlayer(); p.health = p.maxHealth; return p.health; },
  // equipa um par com condição específica, para o harness ver o rótulo no HUD
  equiparCondicao: (nome: string, qualidade: string) => {
    const idx = WEAPONS.findIndex(w => w.name === nome);
    if (idx < 0) return null;
    addPurchasedWeapon(idx, qualidade);
    setWeapon(idx, qualidade);
    return getWeaponQuality();
  },
  // congela o update sem abrir o TAB, para o harness segurar os projéteis no lugar
  pausarTiros: (v: boolean) => { pausaTiros = v; return v; },
  // estado da cutscene, para o harness de narrativa
  cena: () => ({
    ativa: isShowingCutscene(),
    titulo: getCurrentCutscene().title,
    linha: getCurrentLine().text.slice(0, 40),
  }),
  /** H2: a caixa pequena de diálogo — os harnesses (bot/provas) precisam
   * atravessá-la com ENTER, senão a Fábrica congela a medição. */
  dialogo: () => dialogoAtivo(),
  // avança de fase direto, sem passar pela loja (harness de narrativa)
  pularParaProximaFase: () => { leaveShop(); return getCurrentPhase().name; },
  // entra na loja e dá XP de uma vez, para o harness de progressão tirar o
  // screenshot da árvore de talentos com pontos disponíveis (regra 16).
  entrarLoja: (xp = 0) => { setGameState('shop'); enterShop(); if (xp > 0) addXp(xp); return getNivel(); },
  // ativa a fúria na hora (tecla E), para o harness tirar o print da tela
  // vermelha de remorso sem esperar o cooldown (regra 16).
  ativarFuria: () => { useSkill('fury'); return isSkillActive('fury'); },
  talentos: () => ({ nivel: getNivel(), xp: getXp(), pontos: getPontosLivres(), comprados: getTalentos() }),
  // Estado da escada de perks. O `perks-proof.mjs` usa para provar que os 3
  // slots da loja são os degraus ofertados e que comprar um special o deixa
  // ativo — nenhum dos dois se vê pelo nome desenhado na tela.
  perks: () => ({
    oferta: getStockPerks(),
    comprados: getPurchasedUpgrades(),
    especiais: {
      incandescente: temIncandescente(),
      folego: temSegundoFolego(),
      fantasma: temPassoFantasma(),
      sortudo: temSortudoAtivo(),
    },
  }),
  comprarPerk: (id: string) => buyPerk(id),
  // prova de serviços (M3): compra de verdade, pelo mesmo caminho do clique
  comprarServico: (id: string) => buyService(id),
  // estado dos aliados pagos: quem vive, quantos tiros deu nesta fase
  aliados: () => getNPCs()
    .filter(n => n.aliado)
    .map(n => ({ modo: n.aliado!.modo, nome: n.name, vivo: n.alive, hp: Math.round(n.health) })),
  tirosDeAliado: () => getTirosDeAliado(),
  // prova M2 #1: o anúncio de onda diferido (caixa de diálogo do Hospital)
  ondaPendente: () => anuncioDeOndaPendente,
  // prova M2 #4: o Destruidor forçado na fase do NÚCLEO
  armaAtual: () => WEAPONS[getCurrentWeaponIndex()]?.name ?? '',
  // prova M2 #3: qual tela de fim o jogo desenhou (vitoria | gameover | local)
  telaDeFim: () => (fimLocal() ? 'local' : isGameCompleted() ? 'vitoria' : 'gameover'),
  // prova M4: o relógio do voo (segundos restantes de decolagem no Castelo)
  voo: () => vooAtivo,
  // prova M5: o grito de entrada do chefe e o último toast (a fala de morte)
  bossGrito: () => ({ texto: bossGritoTexto, timer: Number(bossGritoTimer.toFixed(2)) }),
  // a pilha inteira (máx. 3): a fala de morte pode ser coberta pelo toast
  // da onda que fecha junto — o contrato é "chegou ao jogador", não "foi a última"
  toasts: () => achievementNotifications.map(t => t.name),
  temConquista: (id: string) => getAllAchievements().some(a => a.id === id && a.unlocked),
  // M3: a moeda GERADA desde o load da fase — o lado do spawn que a
  // medição da economia compara contra o modelo (coletar é do jogador)
  moedasGeradas: () => getMoedasGeradas(),
  // prova M1: força um evento ambiente AGORA (o tornado nasce perto do
  // ponto dado — determinismo; fora do bioma permitido não faz nada) e
  // lê se o tornado está na tela
  forcarEvento: (type: EnvironmentEvent, x?: number, y?: number) => forcarEventoAmbiente(type, x, y),
  tornadoAtivo: () => tornadoNoAr(),
  // prova M1: a agenda da ambiência da fase atual (chave + quanto falta)
  ambiente: () => agendaAmbiente(),
  // prova M3: o estado da queda da Ponte (frente, colunas caídas, próximo passo)
  queda: () => estadoDaQueda(),
  // devolve o estado da run nova depois do `resetGame`: o `perks-proof` compara
  // com a run anterior para provar que perks e stats não sobreviveram.
  resetarPartida: () => { resetGame(); return true; },
  // o `perks-proof` precisa montar a loja com moedas e uma oferta conhecida
  // para comparar a geometria desenhada com a que o estado diz que existe
  __setShopCoins: (n: number) => { setShopCoins(n); return getShopCoins(); },
  __lojaPronta: (moedas: number) => {
    setGameState('shop');
    enterShop();
    setShopCoins(moedas);
    getShopStock();
    return getStockPerks();
  },
  __shopLayout: (w: number, h: number) => getShopLayout(w, h),
  // o `loja-proof.mjs` mede o texto DEPOIS de desenhado: as seções que
  // reclamaram de estouro (skins, card do traje) ficavam abaixo da dobra, e
  // nenhum harness pegava. `measureText` do canvas real, na fonte real.
  lojaMedir: () => medirTextosDaLoja(ctx),
  /**
   * As silhuetas de inimigo EM TELA, por fase.
   *
   * O `variedade.test.ts` prova que a tabela varia; este prova que a tela
   * obedece — o `drawEnemies` recebe `PHASES.indexOf(fase)`, e sem esse
   * parâmetro a variação existia no código e nunca aparecia (foi o primeiro
   * estado desta feature).
   */
  personagensNaTela: () => enemies.map(e => getEnemyCharacter(e.type, PHASES.indexOf(getCurrentPhase()))),
  /** Mesmo dado, agrupado por tipo: dois corpos para o mesmo tipo = incoerente. */
  personagensPorTipo: () => {
    const fase = PHASES.indexOf(getCurrentPhase());
    const porTipo: Record<string, string[]> = {};
    for (const e of enemies) {
      (porTipo[e.type] ??= []).push(getEnemyCharacter(e.type, fase));
    }
    return porTipo;
  },
  /** O corpo de UM tipo, ou null se ele não está em tela. */
  personagemDoTipo: (tipo: string) => {
    const fase = PHASES.indexOf(getCurrentPhase());
    return enemies.some(e => e.type === tipo) ? getEnemyCharacter(tipo, fase) : null;
  },
  /**
   * Todo inimigo vivo com o veredito de "está dentro da parede".
   *
   * Existe para o `sessao-diagnostico.mjs` poder dizer, com número, que
   * nenhum inimigo travou. O sintoma sem isto era indireto demais: a fase
   * "não acaba", o log mostra 4 hostis e 0 abates, e dá para culpar o
   * balanceamento, o spawner ou o mapa — todos innocentados, porque a causa é o
   * inimigo estar dentro de uma parede que ele não consegue sair.
   */
  diagnosticoInimigos: () => enemies.map((e) => ({
    tipo: e.type,
    x: Math.round(e.x),
    y: Math.round(e.y),
    raio: e.radius,
    celula: [colAt(e.x), rowAt(e.y)],
    dentroDaParede: isWall(colAt(e.x), rowAt(e.y)),
    // `spawnDelay > 0` significa que ele AINDA não anda: medir "parado" sem
    // isto acusava inimigo recém-nascido como travado, e o `sessao-diagnostico`
    // acusava 6 fases com problema quando não havia nenhum.
    spawnDelay: Number(e.spawnDelay.toFixed(2)),
  })),
  /** Abaixa o P2, para o harness de versus poder fechar a partida. */
  abaterP2: () => matarPlayer2(),
  /** Placar dos dois, como a tela de fim do versus lê. */
  placarLocal: () => {
    const p = player.getPlayer();
    return getPlacarLocal(p.health, p.maxHealth);
  },
  /** Quem a tela de fim do versus está mostrando agora (null se não acabou). */
  fimLocal: () => fimLocal(),
  /**
   * O P2 em relação à câmera e ao P1.
   *
   * Existe porque "mesmo teclado" quer dizer os dois na MESMA tela, e o P2
   * nascia em `worldW * 0.75` — longe da câmera, que segue o P1. A prova do
   * versus precisa medir isso, não concluir pelo spawn: `pushOutOfWalls` move
   * o ponto se ele cair em parede, e aí a distância muda.
   */
  p2NaTela: () => {
    const p2v = getPlayer2();
    if (!p2v) return null;
    const p = player.getPlayer();
    return {
      x: Math.round(p2v.x),
      y: Math.round(p2v.y),
      dx: Math.round(p2v.x - p.x),
      dy: Math.round(p2v.y - p.y),
      dentro: isVisible(p2v.x, p2v.y, p2v.radius, p2v.radius),
    };
  },
  /** Posição do jogador em coordenadas de mundo — o dodge do `session.mjs` precisa. */
  playerPos: () => {
    const p = player.getPlayer();
    return { x: p.x, y: p.y, raio: p.radius };
  },
  /**
   * Trava a câmera no inimigo mais próximo.
   *
   * A câmera segue o jogador e o spawner joga longe da tela: o `variedade-proof`
   * tirava print do campo vazio com a variação certa nos dados. O harness
   * precisa de um jeito de olhar para onde o inimigo está.
   */
  centralizarNoInimigo: () => {
    const p = player.getPlayer();
    const vivos = enemies.filter(e => e.spawnDelay <= 0);
    if (vivos.length === 0) return null;
    // o mais próximo do jogador, para não teleportar a câmera para o outro
    // lado do mapa (o `initCamera` centraliza, então um inimigo distante
    // punha a câmera fora de qualquer coisa)
    const alvo = vivos
      .slice()
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    // o jogador vai para PERTO do inimigo, não sobre ele. 60px era distância de
    // golpe (o print saía com a vinheta de dano) e sobrepunha as duas sprites;
    // 130px deixa os dois corpos visíveis e longe do contato.
    const dx = alvo.x - p.x, dy = alvo.y - p.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    p.x = alvo.x - (dx / d) * 130;
    p.y = alvo.y - (dy / d) * 130;
    initCamera(worldW, worldH, canvas.width, canvas.height, alvo.x, alvo.y);
    return { x: alvo.x, y: alvo.y, tipo: alvo.type, dist: d };
  },
  __lojaScroll: (y: number) => setShopScroll(y),
  /**
   * Mede o HUD em pixels de verdade, para o `hud-proof.mjs`.
   *
   * O teste de geometria prova que as caixas não se sobrepõem entre si; não
   * prova que o TEXTO cabe dentro delas. Fonte monospace de 11px mede ~6.6px
   * por caractere, e um rótulo 3px mais largo que a coluna invade a layer
   * vizinha sem nenhum `expect` accusing. A medição é feita com o próprio
   * `measureText` do canvas do jogo, na resolução real da tela.
   */
  hudMedir: () => medirHud(buildHudData()),
  diario: () => getUnlockedDiary(),
  diarioDefinido: () => ({ eventos: getDiaryEvents() }),
  // spawna um projétil de uma arma específica, para o harness de projéteis.
    // `screenToWorld` define a convenção do projeto: mundo = tela + câmera (a
    // câmera é o canto superior esquerdo visível, não o centro), então a
    // inversão é somar, não somar menos a metade da viewport.
    tiroDe: (nome: string, telaX = 640, telaY = 360) => {
      const idx = WEAPONS.findIndex(w => w.name === nome);
      if (idx < 0) return null;
      const w = WEAPONS[idx];
      const x = getCamX() + telaX;
      const y = getCamY() + telaY;
      spawnBullet(x, y, 0, 0, w.damage, false, w.color, w.pierce, !!w.explosive, w.explosionRadius ?? 0, false, BULLET_FAMILY[nome]);
      const b = getBullets()[getBullets().length - 1];
      return b ? { bulletSprite: b.bulletSprite, dano: b.damage } : null;
    },
};
