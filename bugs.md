Triagem em 2026-11, com o código na mão. Suas palavras ficaram como estavam;
o que muda é o veredicto e a prova. `[x]` = entregue e com where olhar.

- [x] **"Gostaria de aumentar a história de forma que emocione quem joga, quero
  fugir dos padrões."** — a premissa nova entrou (`docs/PREMISSA-V2.md`) e as 9
  cutscenes + o diário reativo existem. O que FALTA é escolher o arco II–IV
  (`docs/HISTORIA-II-IV.md` tem 3 caminhos escritos) e reescrever o texto
  contra a premissa. Continua em aberto, e é a Fase 5 do plano.
- [ ] **"Quero variedade de armas, ainda mais (mais armas = mais assets)."**
  — 12 armas hoje, com família, som CC0 e sprite de bala próprios. Fase 4.1 do
  plano: 8 novas, aprovadas uma a uma antes de entrar.
- [x] **"Não só de armas, mas de tudo que se possa ter variedade no game."** —
  variado por inimigo (22 tipos × 9 personagens, `VARIACAO_POR_BIOMA`), por
  condição de arma (7, `config.ts`), por classe (4) e por bioma (9 paletas).
  Medido: `npm run variedade` (57% de mudança entre fases vizinhas).
- [ ] **"Precisamos de tilesets para o jogo."** — cada bioma já tem piso/parede
  próprios do pack (`BIOMES`, `terrain.ts`); falta variar o MATERIAL por zona
  dentro do mesmo bioma. Duas entradas no TODO eram a mesma; fundidas.
- [x] **"Precisamos de som de arma enferrujando (no caso da metralhadora) e
  aplicar a mesma lógica para armas com adjetivo negativo tipo suja/quebrada."**
  — `sfxFerrugem` (`audio.ts:505`) + `sfxCondicao` (`:528`), que escolhe o som
  pela condição: enferrujada range, quebrada encasquilha. `semProcedural` com
  débito vazio — tudo atrás de arquivo CC0.
- [x] **"Precisamos variar os adjetivos entre as armas também."** — 7 condições
  com efeito real e distintos: quebrada (−50% dano, 20% de falha), enferrujada
  (−25% dano, +50% dispersão), suja (−10% dano, +20% dispersão), normal, boa
  (+10% dano, +5% crítico), ascendente (+25% dano, cadência mais rápida) e
  lendária (+50% dano, perfura). Cada uma tem cor, preço de venda e peso
  próprios, e o nome do par arma+condição é único ("Metralhadora enferrujada",
  não "Enferrujada" duas vezes).
- [x] **"Estrahamente quando o boss morre e acaba o countdown não acaba a
  partida. Só acaba após matar todos os inimigos."** — eram 3 causas, uma só
  visível: o consumo do respiro pós-boss morava dentro de `if (waveComplete)`,
  que exige campo limpo. Resolvido com `deveFecharFase`. Prova em
  `tools/fase-proof.mjs` e `tools/onda-proof.mjs`.
- [x] **"A falta de insta death permite meu personagem ficar vivo e passar de
  fase, enquanto isso não deveria ser real."** — `damagePlayer` é o gargalo
  único (6 caminhos de dano, todos medi dos) e `immortality.test.ts` trava as
  três fugas: medkit comprado no meio do combate, `invincible` de inimigo
  comum e a passiva do MÉDICO sem guarda de Hardcore.
- [x] **"Perguntar se quando vender vai vender os acessórios juntos."** — vende
  os dois: a arma pela mochila (`sellInventoryWeapon`) e a peça
  (`sellPieceFromInventory`, `pieces.ts:99`), cada uma com seu preço.
- [x] **"Não existe auto equipar no game."** — `equiparSeMelhor()` só troca se o
  DPS novo for maior, e o DPS conta recarga, peça, qualidade e combo.
- [x] **"Variedade de tipos de balas por arma."** — `BULLET_FAMILY`
  (`sprites.ts:136`) mapeia as 12 armas ao projétil que elas de fato usam:
  foguete, feixe de plasma, orbe geloso, feixe concentrado e estilhaço, além dos
  3 cartuchos do pack. Prova em `tools/bullet-family-proof.mjs`. O foguete é o
  único desenhado — nenhum dos dois packs tem um.
- [ ] **"Faltou os assets de armas."** — os 7 sprites do Kay Lousberg estão no
  disco e NÃO são usados: são perfil lateral e o jogo é top-down, então colar
  um no outro mistura perspectiva. Decisão registrada (DECISIONS #91). Kay
  segue nos projéteis.
- [x] **"Barulho de recarregar armas."** — som de recarga por família, não um
  único arquivo: pente de pistola, bomba de shotgun, fuzil, rifle, encaixe de
  lançador, clique de mina.
- [x] **"No Tab eu poderia ver o minimapa agora grande."** — `drawTabScreen`:
  minimapa grande à esquerda, ficha da arma com DPS real à direita.
- [x] **"Variação de sinergia por arma."** — 6 combos arma+perk vivos em
  `combos.ts`, com teto (2 saíram: exigiam `pierce` e `magnetismo`, eixos que a
  escada não tem). Cruzados entre RAMOS ainda não — é o Sprint 6.
- [x] **"Verificação de stats da arma visual."** — a ficha do TAB mostra dano,
  intervalo, pente, recarga, DPS efetivo, dispersão, perfuração e explosiva.
