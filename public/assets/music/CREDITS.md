# Créditos de Música

## Licença

**CC0 1.0 Universal (domínio público).** Sem atribuição obrigatória; atribuída
aqui para deixar a origem explícita.

## Origem

As quatro faixas são **obra original deste projeto**, sintetizadas por
`tools/genmusic.py`. Não há amostra, loop ou gravação de terceiros envolvida.

O plano original previa baixar loops CC0 de itch.io (CoMiGo, Not Jam) e
creditá-los. Sem rede garantida no ambiente de build, a alternativa foi sintetizar
as faixas: o resultado é pior que um loop de compositor em qualidade de produção,
mas é licença limpa e reprodutível — `python3 tools/genmusic.py` regenera os
quatro arquivos bit a bit.

## Faixas

| Arquivo | Duração | Bitrate | Conteúdo |
|---|---|---|---|
| `menu.ogg` | 64s | 47 kbps | Drone em Lá menor, toques esparsos de sino a cada 3 tempos |
| `combat.ogg` | 44s | 75 kbps | Pulso de baixo em colcheias + stab filtrado, 132 BPM |
| `boss.ogg` | 39s | 81 kbps | Tríton grave, motivo cromático sem resolução, 148 BPM |
| `shop.ogg` | 53s | 46 kbps | Progressão de acordes quentes com arpejo lento, 72 BPM |

Total: **~1,4 MB** mono OGG Vorbis a 22,05 kHz.

O crossfade de emenda de 0,8s em `loopify()` corta os primeiros e últimos 50 ms
em cruzamento, para o loop não estalar na volta. O crossfade entre faixas
(distinto desse) está em `playMusic()`, em `src/systems/audio.ts`.

## Regenerar

```bash
python3 tools/genmusic.py     # precisa de ffmpeg no PATH
```

A semente é fixa por faixa; o mesmo script produz sempre os mesmos arquivos.