# Bubble Shooter — Documento de Design

> Onde o jogo quer chegar. O que já está pronto está no
> [`../STATUS.md`](../STATUS.md); o que está por fazer, no
> [`../TODO.md`](../TODO.md). Este documento não é histórico — é direção.

---

## 1. Pitch

Um tiro top-down pós-apocalíptico de sobrevivência com progressão roguelite.
Você não limpa corredores: você luta por **terreno**. Cada fase é um mapa com
paredes, cobertura, barris e hazards que mudam a leitura de cada sala que
entra. Onde você fica é a decisão.

## 2. Por que o jogo era simples, e o que muda

O jogo já tinha 7 fases, 11 armas, 19 upgrades, 3 habilidades, 4 modos, NPCs,
diário, conquistas e achievements. E mesmo assim era chato de jogar, porque:

> **O campo de batalha era um retângulo vazio.**

`collision.ts` só tinha circle-circle. Não existia parede, obstáculo, cobertura
ou hazard em lugar nenhum do código, e todo inimigo fazia seek direto no
jogador. Sem geometria, o jogador nunca decide *onde* ficar — ele só anda em
círculo atirando. Trocar paleta não muda nada nesse campo.

Os 500+ tiles e as 6 poses de personagem que já estavam no disco só importam
quando há geometria para ocuparem. Por isso a ordem de trabalho foi: **criar o
campo primeiro, depois enfeitar**.

### O que a geometria muda, concretamente

| Sem geometria | Com geometria |
|---|---|
| Inimigo persegue direto | Inimigo contorna obstáculo pelo flow field |
| Dash é teletransporte | Dash vira esquiva com direção — precisa de cobertura |
| Granada acerta quem está perto | Granada acerta quem está **atrás da cobertura** |
| Hazard é um número | Lava e lama moldam por onde vale a pena andar |
| Loja é pausa | Loja é decisão de rota: o bioma de baixo é difícil |
| Fase = "mate N" | Fase = "destrua 3 ninhos", "sobreviva 45s", "chegue até lá" |

## 3. O campo de batalha

- **Mundo maior que a tela.** 30×20 células de 64px = 1920×1280. A câmera segue
  o jogador com lerp e clamp; o `draw()` aplica **uma** translação por frame.
- **Chão escuro, parede clara.** Em top-down, o olho lê a massa clara como
  obstáculo. Com chão claro e parede preta o mapa vira uma coleção de buracos.
- **Flow field, não A\* por inimigo.** Dijkstra a partir da célula do jogador:
  600 células custam quase nada, o resultado é o mesmo para todo mundo e de
  brinde o empilhamento some (separação por força, não por path).
- **Props destrutíveis.** Caixote (solta moeda), barril (explode em cadeia),
  ninho (objetivo de fases `destroy`).
- **Hazards por bioma**, com efeito mecânico e não só visual: lama deixa
  lento, lava fere, espinho fere, eletricidade trava a invulnerabilidade,
  escuridão cega fora do cone da lanterna, baixa gravidade multiplica a
  velocidade dos inimigos.

## 4. Os 9 biomas

| # | Bioma | Hazard | Objetivo | Boss |
|---|---|---|---|---|
| 1 | Cidade em Ruínas | detritos | clear | VIGIA |
| 2 | Floresta | névoa | clear | ALPHA WOLF |
| 3 | Caverna | escuridão | destroy (3 ninhos) | CRYSTAL QUEEN |
| 4 | Fábrica | eletricidade | survive (45s) | SENTINEL |
| 5 | Pântano | lama | clear | LEVIATHAN |
| 6 | Castelo | espinhos | clear | REI MUTANTE |
| 7 | Vulcão | lava | clear | INFERNO PRIME |
| 8 | Espaço | baixa gravidade | clear | MOTHERSHIP |
| 9 | Bunker Central | nenhum | clear | NÚCLEO |

A fase 1 tem um tipo de inimigo só e existe para ensinar a leitura do campo —
por isso o primeiro chefe é uma aula: a telegrafia diz o que vem ("OLHE PARA
CÁ", "OS BARRIS EXPLODEM"), a investida é a primeira coisa a desviar, e a arena
é uma praça com quatro blocos de cobertura. A 9 fecha o jogo com bioma limpo,
porque o desafio final é o jogador, não o mapa — e o NÚCLEO não tem investida:
numa galeria estreita ela seria só o chefe batendo na parede.

## 5. Boss data-driven

Cada boss é um `EnemyType` com uma lista de `pattern`, não um `if` de faixa de
HP dentro do `main.ts`:

```ts
pattern: [
  { atHp: 1.0, action: 'spread',    telegraph: 'ALVO IDENTIFICADO' },
  { atHp: 0.7, action: 'mines',     telegraph: 'DRONES' },
  { atHp: 0.4, action: 'sweep',     telegraph: 'LEQUE FECHADO' },
  { atHp: 0.2, action: 'ring',      telegraph: 'SOBRECARGA' },
]
```

Ações: `spread` · `ring` · `charge` · `summon` · `mines` · `split` · `sweep`.
Trocar de faixa dispara uma **janela de telegrafia** antes da nova ação — é o
que faz um boss parecer "com mecânica" em vez de "com 3 números de HP". A
telemetria aparece na barra de boss.

## 6. Direção visual

O jogo é pós-apocalíptico. Nada de neon. A regra curta:

- **Chão escuro, parede clara** — a geometria vence a decoração.
- **Kenney é dessaturado e tingido por bioma.** O pack é saturado e claro; o
  `multiply` pela cor do bioma dá textura sem brilho.
- **Piso só com tile chapado.** Tile com fiada de tijolo no chão faz o piso
  parecer parede.
- **1 sombra no máximo**, e só em 1–2 elementos-chave.
- **Paleta** em `src/core/palette.ts`. As cores "IA" listadas no AGENTS.md
  (`#2ecc71`, `#3498db`, `#f39c12`…) estão proibidas.

Identidade: **terra, cinza, ferrugem, verde morto**. Um elemento visual
marcante, consistente: granulação e bordas irregulares sobre tudo. Nada de
sparkle.

## 7. Direção de áudio

- **SFX 100% procedurais** (Web Audio API). Cada arma e cada ação tem timbre
  próprio — sem arquivo de SFX no repositório.
- **Música real, 4 faixas OGG** com crossfade de 0,8s. Uma faixa por contexto
  (`menu`, `combat`, `boss`, `shop`). Faixas originais do projeto, CC0.
- **Controle de som no pause**, com toggle persistente.

## 8. Direção de código

- **Geometria única por tela.** Draw e hit-test consomem a *mesma* função de
  layout (`getShopLayout`, `getMenuLayout`). Divergir entre as duas foi a causa
  da loja que comprava a linha de cima.
- **Canvas único.** Não existe HUD em DOM. `index.html` tem só `<canvas>` e 6
  linhas de CSS.
- **Prerender do terreno** num offscreen do tamanho do mapa + tint: 1
  `drawImage` por frame em vez de ~600.
- **Colisão swept** para projétil (ponto-segmento). Sem ela, o Laser atravessa
  inimigos.
- **Assets em `public/`**, não na raiz — senão `vite build` não copia e o jogo
  fica com sprite quebrado só em produção.

## 9. Modos

Só 4, e todos com sistema ligado por trás:

- **Campanha** — história com cutscene, 9 fases, loja entre fases.
- **Competitivo** — contra bots de IA que escalam de dificuldade.
- **Local 2P** — dois jogadores no mesmo teclado.
- **Hardcore** — sem loja, sem cura entre ondas.

Modo morto é pior que modo ausente: faz o menu mentir.

## 10. O que este jogo ainda não é

Coisas que *pareceriam* óbvias e não estão no escopo agora:

- Progressão de item durante a fase (upgrade só entre fases, na loja).
- Geração procedural de mapa (os 9 são autorais).
- Multiplayer online.
- Áudio posicional (tudo é mono estéreo).

Estão fora porque cada uma abre uma conversa de design diferente. Estar no
`TODO.md` é o suficiente até alguém decidir por elas.