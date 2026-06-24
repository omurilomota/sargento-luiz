# Bubble Shooter - Arena de Sobrevivência

![Bubble Shooter](https://img.shields.io/badge/Version-1.0.0-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Canvas](https://img.shields.io/badge/Renderer-Canvas2D-orange)

Um jogo de tiro top-down com mecânicas roguelite, onde você enfrenta ondas infinitas de inimigos em 7 fases temáticas.

## Gameplay

- **Controles:** WASD para mover, Mouse para mirar, Click para atirar
- **Habilidades:** Espaço (Dash), F (Escudo), R (Fúria)
- **Progressão:** Mate inimigos → ganhe XP → suba de nível → escolha habilidades
- **Loja:** Compre armas e upgrades entre fases com moedas coletadas

## Armas

| Arma | Dano | Cadência | Preço | Especial |
|------|------|----------|-------|----------|
| Pistola | 12 | 0.3s | Grátis | - |
| Shotgun | 8 | 0.6s | 50 | 3 projéteis |
| Metralhadora | 6 | 0.12s | 80 | Alta cadência |
| Sniper | 45 | 1.0s | 120 | Pierce |
| Laser | 3 | 0.05s | 150 | Pierce + Alta cadência |
| RPG | 60 | 1.5s | 200 | Explosivo |
| Raios | 18 | 0.2s | 180 | Pierce + 3 projéteis |
| Gel | 8 | 0.15s | 100 | 2 projéteis |
| Granada | 30 | 1.2s | 150 | Explosivo |
| Mina | 45 | 2.5s | 120 | Explosivo + Raio grande |

## Fases

1. **Floresta** - Inimigos básicos (grunt, runner, spitter)
2. **Caverna** - Tanques e morcegos (tank, bat, crystal)
3. **Fábrica** - Robôs e drones (robot, drone)
4. **Pântano** - Slimes e mosquitos (slime, mosquito, frog)
5. **Castelo** - Cavaleiros e magos (knight, archer, mage, boss)
6. **Vulcão** - Elementais de fogo (fireElemental, lavaSlime, magmaGolem)
7. **Espaço** - Alienígenas e naves (ufo, asteroid, alien, mothership)

## Habilidades

- **Dash (Espaço):** Avança rápido na direção do mouse, invencível durante
- **Escudo (F):** Bloqueia 100% do dano por 3 segundos (cooldown 10s)
- **Fúria (R):** Dano x2 por 5 segundos, mas recebe 50% mais dano (cooldown 15s)

## Eventos Ambientais

- **Terremoto:** Treme a tela, causa dano a todos os inimigos
- **Relâmpago:** Atinge inimigo aleatório com dano alto
- **Tempestade:** Dano periódico a todos por 5 segundos

## Tech Stack

- **Motor:** TypeScript + Vite
- **Renderização:** Canvas 2D
- **Áudio:** Web Audio API (sons 8-bit procedural)
- **Assets:** Kenney Top-down Shooter (CC0)

## Estrutura do Projeto

```
src/
├── main.ts              # Orquestrador principal
├── core/                # Sistema de estado e eventos
├── systems/             # Renderer, colisão, partículas, áudio
├── entities/            # Player, bullets, coins
├── ui/                  # HUD, loja, menu
├── config.ts            # Dados do jogo
├── types.ts             # Interfaces TypeScript
└── utils.ts             # Funções utilitárias
```

## Como Rodar

```bash
npm install
npm run dev
```

## Licença

Assets: CC0 (Kenney.nl)
Código: Uso livre
