#!/usr/bin/env python3
"""Gera as 4 faixas de música do jogo em OGG Vorbis mono.

As faixas são obra original deste projeto (síntese feita aqui, sem amostra de
terceiros), liberadas em CC0 — por isso `assets/music/CREDITS.md` não cita
nenhum autor externo. O plano previa baixar loops CC0 de itch.io; sem rede
garantida no ambiente de build, sintetizar é a alternativa que não deixa
dívida de licença pendente.

Uso: python3 tools/genmusic.py
"""
import numpy as np
import subprocess
import pathlib
import wave

SR = 22050
OUT = pathlib.Path('assets/music')
OUT.mkdir(parents=True, exist_ok=True)

NOTE = {  # Hz por nota (oitavas 2-5)
    'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23,
    'G4': 392.00, 'Ab4': 415.30, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88, 'C5': 523.25,
    'Ab2': 103.83, 'Bb2': 116.54, 'Db3': 138.59, 'Eb3': 155.56, 'Gb3': 185.00, 'Ab3': 207.65,
    'Bb3': 233.08, 'F#3': 185.00, 'Db4': 277.18,
}


def env(n, attack, decay, sustain=0.0, release=0.0):
    """ADSR em amostras."""
    a = max(1, int(attack * SR))
    d = max(1, int(decay * SR))
    r = max(1, int(release * SR))
    s = max(0, n - a - d - r)
    parts = [
        np.linspace(0, 1, a),
        np.linspace(1, sustain, d),
        np.full(s, sustain),
        np.linspace(sustain, 0, r),
    ]
    e = np.concatenate(parts)
    if len(e) < n:
        e = np.pad(e, (0, n - len(e)))
    return e[:n]


def tone(freq, dur, kind='saw', detune=0.0, amp=0.3, env_args=None, cutoff=0.35):
    n = int(dur * SR)
    t = np.arange(n) / SR
    if kind == 'saw':
        w = 2 * (freq * t + detune * t * 2 * np.pi * 0.001)
        sig = 2 * (w - np.floor(w + 0.5))
    elif kind == 'square':
        sig = np.sign(np.sin(2 * np.pi * freq * t))
    elif kind == 'sine':
        sig = np.sin(2 * np.pi * freq * t)
    elif kind == 'tri':
        sig = 2 * np.abs(2 * ((freq * t) % 1.0) - 1.0) - 1.0
    else:  # noise
        rng = np.random.default_rng(int(freq * 100) % 99991)
        sig = rng.uniform(-1, 1, n)
    # low-pass de um pólo: tira o brilho, mantém o timbre gasto
    alpha = max(0.02, min(0.99, cutoff))
    out = np.empty_like(sig)
    acc = 0.0
    for i, s in enumerate(sig):
        acc += alpha * (s - acc)
        out[i] = acc
    e = env(n, *(env_args or (0.01, dur * 0.4, 0.25, dur * 0.5)))
    return out * e * amp


def place(buf, sig, at):
    i = int(at * SR)
    j = min(len(buf), i + len(sig))
    if i >= len(buf):
        return
    buf[i:j] += sig[: j - i]


def normalize(buf, peak=0.82):
    m = np.max(np.abs(buf))
    return buf * (peak / m) if m > 0 else buf


def save_ogg(name, buf, bitrate='64k'):
    wav = OUT / f'{name}.wav'
    ogg = OUT / f'{name}.ogg'
    data = np.clip(buf, -1, 1)
    pcm = (data * 32767).astype('<i2')
    with wave.open(str(wav), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    subprocess.run(
        ['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav),
         '-c:a', 'libvorbis', '-b:a', bitrate, '-ac', '1', str(ogg)],
        check=True,
    )
    wav.unlink()
    return ogg.stat().st_size


def loopify(buf, bars, seconds_per_bar):
    """Fade cruzado curto para o loop não estalar na emenda."""
    n = int(seconds_per_bar * bars * SR)
    buf = buf[:n]
    fade = int(0.05 * SR)
    head = buf[:fade].copy()
    tail = buf[-fade:].copy()
    blended = np.concatenate([tail, head]) * 0.5
    buf[:fade] = blended[:fade]
    buf[-fade:] = blended[fade:]
    return normalize(buf)


# ── MENU: lento, vazio, com toques esparsos de metal ──
def menu():
    bpm = 60
    spb = 60 / bpm
    bars = 16
    buf = np.zeros(int(bars * 4 * spb * SR) + SR)
    drone = np.zeros(len(buf))
    drone_len = len(buf) / SR
    for f in (NOTE['C2'], NOTE['Ab2'], NOTE['G2']):
        drone += tone(f, drone_len, 'tri', amp=0.16,
                      env_args=(0.9, 2.0, 0.55, drone_len - 3), cutoff=0.12)
    buf += drone

    motif = ['C4', 'Ab4', 'G4', 'Eb4']
    for bar in range(bars):
        for beat in range(4):
            if (bar * 4 + beat) % 3 != 0:
                continue
            f = NOTE[motif[(bar + beat) % len(motif)]]
            place(buf, tone(f, 1.6, 'sine', amp=0.30,
                            env_args=(0.004, 0.5, 0.10, 1.1), cutoff=0.5), bar * 4 * spb + beat * spb)
    for bar in (3, 7, 11, 15):
        place(buf, tone(NOTE['C3'], 2.2, 'saw', amp=0.10,
                        env_args=(0.02, 0.8, 0.06, 1.3), cutoff=0.16), bar * 4 * spb)
    return loopify(buf, bars, spb * 4)


# ── COMBAT: pulso de baixo em colcheias +stab filtrado ──
def combat():
    bpm = 132
    spb = 60 / bpm
    bars = 24
    buf = np.zeros(int(bars * 4 * spb * SR) + SR)
    root = [NOTE['A2'], NOTE['A2'], NOTE['F2'], NOTE['G2']]
    stab = [NOTE['E4'], NOTE['A4'], NOTE['C5'], NOTE['B4']]
    for bar in range(bars):
        r = root[bar % len(root)]
        for eighth in range(8):
            t = bar * 4 * spb + eighth * spb / 2
            amp = 0.34 if eighth % 2 == 0 else 0.20
            place(buf, tone(r, 0.34, 'square', amp=amp,
                            env_args=(0.004, 0.10, 0.35, 0.14), cutoff=0.18), t)
        for beat in range(4):
            t = bar * 4 * spb + beat * spb
            if beat % 2 == 0:
                place(buf, tone(stab[(bar + beat) % len(stab)], 0.5, 'saw', amp=0.16,
                                env_args=(0.003, 0.14, 0.20, 0.22), cutoff=0.30), t)
            else:
                place(buf, tone(1.0, 0.10, 'noise', amp=0.06,
                                env_args=(0.001, 0.05, 0.0, 0.04), cutoff=0.55), t)
    return loopify(buf, bars, spb * 4)


# ── BOSS: baixo pesado, tensão cromática, sem resolução ──
def boss():
    bpm = 148
    spb = 60 / bpm
    bars = 24
    buf = np.zeros(int(bars * 4 * spb * SR) + SR)
    low = NOTE['C2']
    for bar in range(bars):
        for beat in range(4):
            t = bar * 4 * spb + beat * spb
            place(buf, tone(low, 0.55, 'saw', amp=0.34,
                            env_args=(0.006, 0.16, 0.45, 0.18), cutoff=0.14), t)
            place(buf, tone(low * 1.5, 0.5, 'square', amp=0.14,
                            env_args=(0.006, 0.14, 0.35, 0.16), cutoff=0.20), t)
        motif = [NOTE['C4'], NOTE['Db4'], NOTE['Eb4'], NOTE['C4']]
        for beat in (1, 3):
            place(buf, tone(motif[(bar + beat) % 4], 0.42, 'saw', amp=0.20,
                            env_args=(0.003, 0.12, 0.30, 0.18), cutoff=0.34),
                   bar * 4 * spb + beat * spb)
    for bar in range(bars):
        if bar % 4 == 3:
            place(buf, tone(2.0, 0.5, 'noise', amp=0.10,
                            env_args=(0.001, 0.2, 0.05, 0.25), cutoff=0.5), bar * 4 * spb)
    return loopify(buf, bars, spb * 4)


# ── SHOP: acordes quentes, arpejo lento ──
def shop():
    bpm = 72
    spb = 60 / bpm
    bars = 16
    buf = np.zeros(int(bars * 4 * spb * SR) + SR)
    chords = [
        ['C3', 'Eb3', 'G3', 'Bb3'],
        ['Ab2', 'C3', 'Eb3', 'G3'],
        ['F2', 'Ab2', 'C3', 'Eb3'],
        ['G2', 'Bb2', 'D3', 'G3'],
    ]
    for bar in range(bars):
        chord = chords[bar % len(chords)]
        for f in chord:
            place(buf, tone(NOTE[f], 4 * spb, 'tri', amp=0.13,
                            env_args=(0.03, 0.9, 0.45, 4 * spb - 1.4), cutoff=0.22),
                   bar * 4 * spb)
        for beat in range(4):
            f = NOTE[chord[(bar + beat) % 4] ] * 2
            place(buf, tone(f, 1.0, 'sine', amp=0.16,
                            env_args=(0.006, 0.3, 0.16, 0.6), cutoff=0.5),
                   bar * 4 * spb + beat * spb + spb * 0.5)
    return loopify(buf, bars, spb * 4)


TRACKS = [
    ('menu', menu, '72k'),
    ('combat', combat, '72k'),
    ('boss', boss, '80k'),
    ('shop', shop, '64k'),
]

if __name__ == '__main__':
    total = 0
    for name, fn, bitrate in TRACKS:
        data = fn()
        size = save_ogg(name, data, bitrate)
        total += size
        dur = len(data) / SR
        print(f'{name}.ogg  {dur:5.1f}s  {size/1024:7.1f} KB')
    print(f'total: {total/1024:.1f} KB')
