# Exploração do Mundo: BubbleGame 2D — Estilo Zombotron Flash

> Documento de worldbuilding para o side-scroller linear
> Baseado em: Zombotron 1, 2, Time Machine (Flash) + história existente do BubbleGame

---

## 1. O QUE É ZOMBOTRON (Flash) — LIÇÕES PRA NOSSO JOGO

### Zombotron 1 (2011)
- **Protagonista:** Bio-robô criado por laboratórios para limpar o planeta
- **Setting:** Planeta alienígena Zombotron, infestado de mutantes
- **Mecânicas-chave:** Física no combate (caixas caem, explosões empurram), missões com objetivos, upgrade de armas entre fases
- **Toon:** Sobrevivência + exploração de laboratórios abandonados

### Zombotron 2 (2012)
- **Evolução:** WASD + mouse, ambientes destrutíveis, mais armas
- **Diferencial:** Inimigos que brigam entre si (não só com o jogador)
- **Física:** Objetos interagem — caixas, barris, plataformas quebradiças

### Zombotron 2: Time Machine (2013)
- **Diferencial:** Set pieces dinâmicos (caminhões, cargas, cordas que quebram)
- **Boss fights:** Chefes com mecânicas únicas
- **Pacing:** Mistura de plataformas + combate + puzzles físicos

### O que pegar de Zombotron pro nosso jogo:
1. **Física como arma** — usar o ambiente pra matar inimigos
2. **Ambientes destrutíveis** — plataformas que quebram, caixas que explodem
3. **Inimigos inteligentes** — brigam entre si, usam armaduras
4. **Set pieces** — momentos cinematográficos com física
5. **Progressão de arsenal** — começar fraco, terminar overpowered
6. **Missões por fase** — objetivo claro além de "chegar ao fim"

---

## 2. O MUNDO DO BUBBLEGAME — MAPA LINEAR

### Cronologia (antes do jogo top-down)

```
2085 — Projeto Genesis começa (BioGen Corp)
2086 — Pandemia começa. 80% da população transformada
2087 — Sargento Rios recebe a missão (Início do jogo)
2087 — Rios atravessa 7 biomas até o Bunker Central
2087 — Rios destrói a Mãe-Nave orbital
2087 — Cura é enviada. Reconstrução começa.
```

### Mapa geográfico (esquerda → direita, como Zombotron)

```
CIDADE EM RUÍNAS (ponto de partida)
    │
    ▼
FLORESTA (norte da cidade — mutantes fracos)
    │
    ▼
CAVERNA DE CRISTAL (subterrâneo — energia pura)
    │
    ▼
FÁBRICA BIOGEN (onde tudo começou — robôs de segurança)
    │
    ▼
PÂNTANO TÓXICO (zona contaminada — slimes, mosquitos)
    │
    ▼
CASTELO DOS MUTANTES (fortaleza — sociedade organizada)
    │
    ▼
ZONA INDUSTRIAL EM CHAMAS (vulcão artificial — elementais)
    │
    ▼
ESTAÇÃO ORBITAL EREBUS (espaço — Mãe-Nave)
    │
    ▼
BUNKER CENTRAL (destino — cura)
```

---

## 3. CADA BIOMA — DESIGN PARA SIDE-SCROLLER

### FASE 1: CIDADE EM RUÍNAS (Tutorial)

**Visual:** Prédios destruídos, carros virados, escombros, fumaça. Céu cinza.
**Inspiração Zombotron:** Níveis iniciais com tutorial integrado

**Mecânicas novas:**
- Aprender a mover (A/D), pular (W/Espaço), atirar (mouse)
- Caixas de madeira destrutíveis (primeira interação com física)
- Elevador que funciona (apertar E pra ativar)
- Primeiro inimigo: zumbi lento, 1 tiro

**Inimigos:** Zumbis lentos (grunt), 2-3 por tela
**Objetivo:** Chegar ao fim da rua. Aprender controles.
**Duração:** 2-3 minutos
**Boss:** Nenhum (tutorial)

**Armas disponíveis:** Pistola (única)
**Moedas:** 20-30 espalhadas
**Segredo:** Escada lateral escondida → vida extra

---

### FASE 2: FLORESTA

**Visual:** Árvores enormes, neblina, trilhas estreitas, rios. Cores verdes mortas.
**Inspiração Zombotron:** Níveis com plataformas naturais + armadilhas

**Mecânicas:**
- Plataformas de galhos que quebram sob peso (2 segundos)
- Rios que empurram o jogador (física de água)
- Caixotes de suprimentos pendurados (atirar pra derrubar em inimigos)
- Primeira arma nova: Shotgun (comprar com moedas)

**Inimigos:**
- Grunt (zumbi lento) — 10 HP
- Runner (zumbi rápido) — 5 HP, corre em direção ao jogador
- Spitter (zumbi à distância) — 8 HP, atira ácido

**Objetivo:** Chegar ao acampamento da BioGen no fim da floresta.
**Duração:** 4-5 minutos
**Boss:** ALPHA WOLF — lobo mutante, 150 HP
  - Fase 1: Corre e morde
  - Fase 2 (<50% HP): Começa a pular nas plataformas
  - Mecânica: Derrubar caixotes nele causa dano extra

**Armas disponíveis:** Pistola, Shotgun
**Moedas:** 50-80
**Segredo:** Cachoeira escondida → upgrade de dano

---

### FASE 3: CAVERNA DE CRISTAL

**Visual:** Escuro total, cristais brilhantes (azul/roxo), stalactites, rios subterrâneos.
**Inspiração Zombotron:** Níveis escuros com iluminação limitada + physics

**Mecânicas:**
- Escuro — só vê ao redor do jogador (raio de luz)
- Cristais que explodem quando atingidos (dano em área)
- Plataformas de gelo (deslizam)
- Elevadores com cordas (atirar na corda = derrubar carga)
- Arma nova: Metralhadora

**Inimigos:**
- Bat (morcego) — 8 HP, voa em formação
- Crystal (cristal vivo) — 20 HP, atira projéteis que se dividem
- Runner melhorado — 12 HP, mais rápido

**Objetivo:** Encontrar o laboratório subterrâneo da BioGen.
**Duração:** 5-6 minutos
**Boss:** CRYSTAL QUEEN — formação de cristal gigante, 200 HP
  - Fase 1: Atira cristais em arco
  - Fase 2 (<60% HP): Invoca crystals menores
  - Fase 3 (<30% HP): Plataforma central começa a quebrar
  - Mecânica: Atirar nos cristais das paredes pra derrubar no boss

**Armas disponíveis:** Pistola, Shotgun, Metralhadora
**Moedas:** 80-120
**Segredo:** Sala com cristal raro → upgrade de munição

---

### FASE 4: FÁBRICA BIOGEN

**Visual:** Metal enferrujado, engrenagens, esteiras, robôs de segurança, laboratórios.
**Inspiração Zombotron:** Níveis industriais com robôs + mecânicas de elevador

**Mecânicas:**
- Esteiras transportadoras (mudam direção)
- Robôs de segurança (inimigos + ambientais — esmagam)
- Portas que precisam de chave (E pra abrir)
- Explosivos dinamite (encadeamento — Zombotron puro)
- Encontro com Cabo Fernandes (cutscene)
- Arma nova: Sniper

**Inimigos:**
- Robot (robô de segurança) — 30 HP, atira
- Drone — 10 HP, voa
- Grunt melhorado — 15 HP, armadura leve

**Objetivo:** Pegar os registros do Projeto Genesis no subsolo.
**Duração:** 6-7 minutos
**Boss:** SENTINEL — robô gigante de segurança, 300 HP
  - Fase 1: Tira canhão, atira em arco
  - Fase 2 (<50% HP): Lança minas no chão
  - Fase 3 (<25% HP): Esteira acelera, robôs menores aparecem
  - Mecânica: Derrubar caixotes de explosivos nele com elevador
  - **Morte de Fernandes** — cutscene cinematográfica

**Armas disponíveis:** Pistola, Shotgun, Metralhadora, Sniper
**Moedas:** 120-180
**Segredo:** Sala secreta do fundador → arma especial (flare gun)

---

### FASE 5: PÂNTANO TÓXICO

**Visual:** Lama verde, águas paradas, neblina tóxica, árvores mortas, raízes.
**Inspiração Zombotron:** Níveis com perigos ambientais + plataformas instáveis

**Mecânicas:**
- Lama que afunda (fica mais lento, se ficar muito tempo toma dano)
- Água tóxica (dano por segundo)
- Plataformas de troncos (flutuam, balançam)
- Gas venenoso em bolhas (estourar = dano em área)
- Arma nova: RPG

**Inimigos:**
- Slime — 15 HP, morre e explode em ácido
- Mosquito — 5 HP, muito rápido, difícil de mirar
- Frog — 12 HP, pula e atira veneno

**Objetivo:** Atravessar a zona tóxica até o Castelo.
**Duração:** 5-6 minutos
**Boss:** LEVIATHAN — criatura aquática gigante, 250 HP
  - Fase 1: Surge da água, atira jatos tóxicos
  - Fase 2 (<50% HP): Cria redemoinhos que puxam o jogador
  - Mecânica: Usar gas venenoso a favor (estourar perto do boss)

**Armas disponíveis:** Pistola, Shotgun, Metralhadora, Sniper, RPG
**Moedas:** 100-150
**Segredo:** Ilha no meio do pântano → upgrade de vida

---

### FASE 6: CASTELO DOS MUTANTES

**Visual:** Fortaleza de ossos e pedra, tochas, muralhas, torres.
**Inspiração Zombotron:** Níveis com inimigos mais inteligentes + puzzles

**Mecânicas:**
- Portões que precisam ser destruídos (explosivos)
- Armadilhas de espinhos no chão
- Inimigos que usam escudos (precisa flanquear)
- Elevadores de pedra (ativos por alavancas)
- Arma nova: Granada

**Inimigos:**
- Knight — 25 HP, armadura, escudo
- Archer — 15 HP, atira à distância
- Mage — 18 HP, magia que cura aliados próximos

**Objetivo:** Derrotar o Rei Mutante e abrir caminho pro vulcão.
**Duração:** 6-7 minutos
**Boss:** REI MUTANTE — humanoid gigante, 400 HP
  - Fase 1: Espada + escudo, avança
  - Fase 2 (<60% HP): Arremessa espada, chama reforsços
  - Fase 3 (<30% HP): Fica frenético, ataque rápido
  - Mecânica: Derrubar torre no boss (explosivos na base)

**Armas disponíveis:** Pistola, Shotgun, Metralhadora, Sniper, RPG, Granada
**Moedas:** 150-200
**Segredo:** Sala do trono → armadura especial

---

### FASE 7: ZONA INDUSTRIAL EM CHAMAS

**Visual:** Lava, fogo, metal derretido, fumaça, explosões.
**Inspiração Zombotron:** Time Machine — set pieces dinâmicos, caminhões, cargas

**Mecânicas:**
- Lava (dano por segundo, mata rápido)
- Plataformas de metal que derretem (tempo limitado)
- Explosões em cadeia (barris de combustível)
- Caminhão de carga (montar e atropelar — Zombotron puro!)
- Arma nova: Mina

**Inimigos:**
- Fire Elemental — 18 HP, deixa fogo no chão
- Lava Slime — 20 HP, explode em lava
- Magma Golem — 40 HP, armadura, muito dano
- Inferno — 15 HP, atira em leque

**Objetivo:** Atravessar a zona industrial até a estação de lançamento.
**Duração:** 7-8 minutos
**Boss:** INFERNO PRIME — elemental gigante, 500 HP
  - Fase 1: Arremessa bolas de fogo
  - Fase 2 (<50% HP): Chama chuva de meteoros
  - Fase 3 (<25% HP): Plataforma central colapsa
  - Mecânica: Usar barris de explosivos + lava a favor

**Armas disponíveis:** Todas
**Moedas:** 200-250
**Segredo:** Túnel vulcanico → arma secreta (BFG)

---

### FASE 8: ESTAÇÃO ORBITAL EREBUS (Final)

**Visual:** Espaço, estação orbital, aliens, Mãe-Nave.
**Inspiração Zombotron:** Time Machine — boss final épico + set pieces

**Mecânicas:**
- Gravidade reduzida (pulos mais altos, mais lentos)
- Portas laser (precisa desativar geradores)
- Aliens com tecnologia avançada
- Arma final: BFG (se encontrou o segredo) ou armas existentes

**Inimigos:**
- UFO — 25 HP, voa, atira
- Asteroid — 50 HP, cai do teto
- Alien — 15 HP, rápido, inteligente
- Mothership (mini) — invoca minions

**Objetivo:** Destruir a Mãe-Nave e acabar com a pandemia.
**Duração:** 8-10 minutos
**Boss Final:** MOTHERSHIP — nave gigante, 800 HP
  - Fase 1: Canhões laterais + minions
  - Fase 2 (<50% HP): Escudo protetor (precisa desativar geradores)
  - Fase 3 (<25% HP): Núcleo exposto, ataque frenético
  - Mecânica: Subir na nave (plataformas dinâmicas) + explosivos
  - **Cutscene final:** Nave cai, cura é liberada, reconstrução

**Armas disponíveis:** Todas + BFG (se desbloqueada)
**Moedas:** N/A (fase final)
**Segredo:** Nenhum (é o final)

---

## 4. SISTEMAS REUTILIZADOS DO TOP-DOWN

| Sistema | Como adaptar pra 2D |
|---------|-------------------|
| **Armas** | Mesmos tipos, novos valores de dano/velocidade |
| **Munição** | Mesmo sistema, balas visuais 2D |
| **Power-ups** | Mesmos tipos: vida, escudo, dano, velocidade |
| **Upgrades** | Loja entre fases (mesmo sistema) |
| **Moedas** | Coletáveis no chão, magnetismo |
| **Cutscenes** | Mesmo sistema de typewriter + retratos |
| **Áudio** | Procedural, novos SFX |
| **Save/load** | localStorage, auto-save entre fases |
| **Achievements** | Expandir com conquistas de 2D |

---

## 5. INSPIRAÇÃO ZOMBOTRON — MECÂNICAS ESPECÍFICAS

### Física como arma (Zombotron 1)
- Caixas de madeira caem e esmagam zumbis
- Dinamite em cadeia — 1 baril explode e derruba os outros
- Elevadores com carga — soltar carga no inimigo

### Ambientes destrutíveis (Zombotron 2)
- Plataformas de madeira que quebram após X segundos
- Portas que precisam ser destruídas
- Barris explosivos que o inimigo pode acidentalmente atingir

### Inimigos inteligentes (Zombotron 2)
- Zumbis atiram uns nos outros por acidente
- Robôs usam escudos
- Mage cura aliados

### Set pieces (Time Machine)
- Caminhão que o jogador pode dirigir e atropelar
- Carga pendurada por corda — atirar na corda = derrubar
- Elevador que sobe e desce durante o boss fight

---

## 6. PROTAGONISTA — SARGENTO RIOS

**Antes do jogo (top-down):** Rios é humano, soldado, sobrevivente
**No jogo 2D:** Mesmo personagem, mesma história

**Aparência (híbrida):**
- Corpo humano com armadura militar
- Cor principal: verde musgo (#7a9a6a)
- Olhos brilhantes (visor da máscara)
- Silhueta reconhecível (ombros largos, capacete)

**Movimentos:**
- Correr (A/D)
- Pular (W/Espaço) + Duplo Pulo
- Dash (Shift) — invencível 0.3s
- Mirar (mouse) — 360 graus
- Atirar (click)
- Trocar arma (Q)
- Recarregar (R)
- Ação (E) — abrir portas, ativar elevadores, pegar itens
- Granada (G)
- Grapple (F) — gancho em pontos marcados

---

## 7. ESTRUTURA DE MISSÕES (estilo Zombotron)

Cada fase tem **objetivo principal + objetivos secundários:**

| Fase | Objetivo Principal | Secundários |
|------|-------------------|-------------|
| Cidade | Chegar ao fim da rua | Matar 5 zumbis, Coletar 20 moedas |
| Floresta | Chegar ao acampamento | Matar Alpha Wolf, Encontrar segredo |
| Caverna | Encontrar laboratório | Derrotar Crystal Queen, Sem tomar dano 30s |
| Fábrica | Pegar registros | Salvar Fernantes (impossível), Explodir 3 robôs |
| Pântano | Atravessar zona tóxica | Derrotar Leviathan, Coletar 100 moedas |
| Castelo | Derrotar o Rei | Destruir 2 torres, Matar 20 inimigos |
| Vulcão | Chegar à estação | Derrotar Inferno Prime, Usar caminhão 1x |
| Espaço | Destruir Mãe-Nave | Todos os geradores, Tempo < 10min |

---

## 8. ECONOMIA

| Item | Preço | Efeito |
|------|-------|--------|
| Shotgun | 80 | Nova arma |
| Metralhadora | 150 | Nova arma |
| Sniper | 200 | Nova arma |
| RPG | 350 | Nova arma |
| Granada | 250 | Nova arma |
| Mina | 200 | Nova arma |
| Vida +25 | 60 | Max HP +25 |
| Vida +50 | 100 | Max HP +50 |
| Dano +25% | 120 | Dano permanente |
| Escudo | 150 | 1 carga de escudo |
| Armadura | 250 | -15% dano recebido |
| Regen | 200 | +1 HP/s |
| Magnetismo | 100 | Raio de coleta +50% |
| Crítico | 180 | 25% chance de 2x dano |

---

## 9. PRÓXIMOS PASSOS

1. **Validar** este documento com o usuário
2. **Definir** tileset visual (16x16, paleta pós-apocalíptica)
3. **Criar** protótipo da Fase 1 (Cidade)
4. **Testar** física + controles
5. **Iterar** até feeling estar certo
