"""Render the 30 s 9:16 promo of Herzlupe from the live app: for parents and people with a congenital heart defect,
and for paediatricians who explain a defect to parents.

Headless Edge runs index.html on a virtual clock (clock.js); overlay30.js directs the scenes through window.HL and draws
the copy. The soundtrack is synthesized; its heart sounds follow the rendered beat frame by frame.

    python render_promo30.py            # -> Herzlupe_Promo_30s_9x16.mp4 + Herzlupe_Promo_30s_Poster.png
    python render_promo30.py --preview  # -> preview30_sheet.png + preview30_audio.wav
"""
import io
import pathlib
import subprocess
import sys
import wave

import imageio_ffmpeg
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
APP = (HERE.parent / "index.html").as_uri() + "?debug&lang=de&age=adult"
FPS, DURATION, VW, VH, DPR, SR = 30, 30.0, 540, 960, 2, 48000
W, H, N = VW * DPR, VH * DPR, int(FPS * DURATION)
TAU = 2 * np.pi
# heart sounds at S1 + k*BEAT (72/min); every scene starts on a bar of the music
BEAT, S1 = 60 / 72, 0.4167
BAR = 4 * BEAT
T_B, T_C, T_D, T_E, T_F, T_F2, T_G, T_H = (k * BAR for k in range(1, 9))
T_FB = T_F + 2 * BEAT
PREVIEW_TIMES = [1.6, 5.4, 8.6, 11.8, 15.4, 17.9, 19.6, 22.0, 25.6, 29.2]


def capture(on_frame, wanted=lambda i: True, frames=N):
    """Run the frames in order (the app state evolves), screenshot the wanted ones, return the beat track."""
    track = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        page = browser.new_page(viewport={"width": VW, "height": VH}, device_scale_factor=DPR)
        page.add_init_script(path=str(HERE / "clock.js"))
        page.goto(APP)
        # rAF belongs to the virtual clock now, so poll on a timer
        page.wait_for_function("document.querySelector('#status')?.classList.contains('done')", polling=250, timeout=300000)
        page.add_script_tag(path=str(HERE / "overlay30.js"))
        page.evaluate("T => __promoSetup(T)", {"B": T_B, "C": T_C, "D": T_D, "E": T_E, "F": T_F, "Fb": T_FB, "F2": T_F2, "G": T_G, "H": T_H})
        for i in range(frames):
            track.append(page.evaluate(f"__promoFrame({i / FPS})"))
            if wanted(i):
                on_frame(i, Image.open(io.BytesIO(page.screenshot(type="png"))).convert("RGB"))
            if i % 60 == 0:
                print(f"frame {i}/{frames}", flush=True)
        browser.close()
    return track


def heart_events(track):
    """S1/S2 times from the rendered beat phase (S1 at 0.225, S2 at 0.555 of each beat) and whether an open VSD is on."""
    b = np.array([f["beat"] for f in track])
    events = []
    for i in range(1, len(b)):
        for k in range(int(np.floor(b[i - 1])) - 1, int(np.floor(b[i])) + 1):
            for ph, kind in ((0.225, "s1"), (0.555, "s2")):
                x = k + ph
                if b[i - 1] < x <= b[i]:
                    events.append(((i - 1 + (x - b[i - 1]) / (b[i] - b[i - 1])) / FPS, kind, track[i]["vsd"]))
    return sorted(events)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def synth_audio(track, path):
    n = int(SR * DURATION)
    heart, music = np.zeros(n), np.zeros(n)
    rng = np.random.default_rng(3)

    def add(bus, sig, start, amp=1.0):
        i0 = int(round(start * SR))
        if i0 < 0:
            sig, i0 = sig[-i0:], 0
        if i0 < n:
            sig = sig[: n - i0]
            bus[i0:i0 + len(sig)] += amp * sig

    def time(d):
        return np.arange(int(d * SR)) / SR

    def band_noise(d, fc, octaves):
        m = int(d * SR)
        spec = np.fft.rfft(rng.standard_normal(m))
        f = np.fft.rfftfreq(m, 1 / SR)
        spec *= np.exp(-0.5 * (np.log2(np.maximum(f, 1) / fc) / octaves) ** 2)
        x = np.fft.irfft(spec, m)
        return x / (np.std(x) + 1e-12)

    # heart sounds as in the app, with overtones so they carry on phone speakers
    def thump(f0, d, amp):
        t = time(d)
        ph = TAU * np.cumsum(f0 * (1 + 0.4 * np.exp(-t / (0.25 * d)))) / SR
        env = np.minimum(1, t / 0.004) * np.exp(-t / (0.26 * d))
        tone = np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.18 * np.sin(3 * ph)
        return amp * env * (tone + 0.3 * band_noise(d, 5 * f0, 0.8) * np.exp(-t / 0.01))

    for t0, kind, vsd in heart_events(track):
        if kind == "s1":
            add(heart, thump(62, 0.13, 0.9), t0)
            add(heart, thump(92, 0.10, 0.55), t0 + 0.018)
            if vsd:  # holosystolic VSD murmur up to the second sound
                d = 0.33 * BEAT - 0.05
                env = np.minimum(1, time(d) / 0.03) * np.clip((d - time(d)) / 0.04, 0, 1)
                add(heart, band_noise(d, 300, 0.7) * env, t0 + 0.03, 0.10)
        else:
            add(heart, thump(84, 0.09, 0.7), t0)
            add(heart, thump(128, 0.07, 0.4), t0 + 0.012)

    def pad(notes, d, att=0.8, rel=1.0):
        t = time(d + rel)
        env = np.minimum(1, t / att) * np.clip((d + rel - t) / rel, 0, 1)
        sig = np.zeros(len(t))
        for m in notes:
            for det, ph in ((0.9983, 0.0), (1.0017, 1.7)):
                w = TAU * midi(m) * det * t + ph
                sig += np.sin(w) + 0.12 * np.sin(3 * w)
        return env * sig / (2 * len(notes))

    def piano(m, d=1.6):
        t, f = time(d), midi(m)
        env = np.minimum(1, t / 0.004) * np.exp(-t * 3.0)
        return env * (np.sin(TAU * f * t) + 0.4 * np.sin(2 * TAU * f * t) * np.exp(-t * 5) + 0.12 * np.sin(3 * TAU * f * t) * np.exp(-t * 8))

    def bass(m, d):
        t = time(d + 0.8)
        env = np.minimum(1, t / 0.25) * np.clip((d + 0.8 - t) / 0.8, 0, 1)
        return env * (np.sin(TAU * midi(m) * t) + 0.25 * np.sin(2 * TAU * midi(m) * t))

    # D - Bm - G - A twice, then D; one chord per scene, eighth-note piano from the first cut on
    D, BM, G, A = [62, 66, 69, 74, 76], [59, 62, 66, 71, 73], [55, 59, 62, 67, 69], [57, 61, 64, 69, 71]
    aD, aBm, aG, aA = [74, 69, 66, 69, 78, 69, 66, 69], [71, 66, 62, 66, 74, 66, 62, 66], [67, 62, 59, 62, 71, 62, 59, 62], [69, 64, 61, 64, 73, 64, 61, 64]
    sections = [(0.0, T_B, D, 50, None), (T_B, T_C, BM, 47, aBm), (T_C, T_D, G, 43, aG), (T_D, T_E, A, 45, aA),
                (T_E, T_F, D, 50, aD), (T_F, T_F2, BM, 47, aBm), (T_F2, T_G, G, 43, aG), (T_G, T_H, A, 45, aA),
                (T_H, DURATION, [62, 66, 69, 74, 78], 50, None)]
    for a, b, chord, root, arp in sections:
        add(music, pad(chord, b - a), max(0.0, a - 0.15), 0.11)
        add(music, bass(root, b - a), a, 0.07)
        if arp:
            for j, t0 in enumerate(np.arange(a, b - 1e-6, BEAT / 2)):
                add(music, piano(arp[j % 8]), t0, 0.075 if j % 2 == 0 else 0.05)
    for t0, m in ((S1, 78), (S1 + BEAT, 74), (S1 + 2 * BEAT, 76), (S1 + 2.5 * BEAT, 78)):
        add(music, piano(m, 2.0), t0, 0.07)
    for k, m in enumerate((62, 66, 69, 74, 78, 81, 86)):
        add(music, piano(m, 2.6), T_H + 0.1 + k * 0.07, 0.065)

    def reverb(x, seed, seconds=1.6, decay=3.2):
        r, L = np.random.default_rng(seed), int(seconds * SR)
        ir = r.standard_normal(L) * np.exp(-np.arange(L) / SR * decay)
        ir /= np.sqrt(np.sum(ir ** 2))
        size = 1 << int(np.ceil(np.log2(n + L)))
        return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[:n]

    t = np.arange(n) / SR
    heart *= np.interp(t, [0, T_H + 0.3, DURATION - 0.4, DURATION], [1, 1, 0.35, 0.3])
    dry, src = heart + music, music + 0.3 * heart
    left, right = dry + 0.32 * reverb(src, 1), dry + 0.32 * reverb(src, 2)
    fade = np.clip((DURATION - t) / 0.9, 0, 1) * np.minimum(1, t / 0.05)
    mix = np.column_stack([left, right]) * fade[:, None]
    mix /= np.max(np.abs(mix))
    # stereo-linked peak limiter (1.3 ms look-ahead, 80 ms release): the heart sounds peak far above the music
    env, gain, lvl, rel, thr = np.abs(mix).max(axis=1), np.ones(n), 0.0, np.exp(-1 / (0.08 * SR)), 0.6
    for i in range(n):
        lvl = max(env[i], lvl * rel)
        if lvl > thr:
            gain[i] = thr / lvl
    gain = np.lib.stride_tricks.sliding_window_view(np.pad(gain, (0, 63), constant_values=1), 64).min(axis=1)
    gain = np.convolve(gain, np.ones(32) / 32, "same")
    mix *= gain[:, None]
    pcm = (mix / np.max(np.abs(mix)) * 0.89 * 32767).astype("<i2")
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())


def preview():
    idx = sorted({round(t * FPS) for t in PREVIEW_TIMES})
    cols, scale = 5, 0.25
    tw, th = int(W * scale), int(H * scale)
    sheet = Image.new("RGB", (cols * tw, -(-len(idx) // cols) * th), "white")

    def on_frame(i, img):
        k = idx.index(i)
        sheet.paste(img.resize((tw, th), Image.LANCZOS), ((k % cols) * tw, (k // cols) * th))
        (HERE / "_frames").mkdir(exist_ok=True)
        img.save(HERE / "_frames" / f"f{i:03d}.png")

    track = capture(on_frame, lambda i: i in idx)
    sheet.save(HERE / "preview30_sheet.png")
    synth_audio(track, HERE / "preview30_audio.wav")
    print(HERE / "preview30_sheet.png")


def render():
    silent, wav, out = HERE / "_video30.mp4", HERE / "_audio30.wav", HERE / "Herzlupe_Promo_30s_9x16.mp4"
    writer = imageio_ffmpeg.write_frames(str(silent), (W, H), fps=FPS, codec="libx264", quality=None,
                                         pix_fmt_out="yuv420p", macro_block_size=8,
                                         output_params=["-crf", "18", "-preset", "slow"])
    writer.send(None)
    poster = int(29.2 * FPS)

    def on_frame(i, img):
        writer.send(img.tobytes())
        if i == poster:
            img.save(HERE / "Herzlupe_Promo_30s_Poster.png")

    track = capture(on_frame)
    writer.close()
    synth_audio(track, wav)
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-i", str(silent), "-i", str(wav),
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(out)],
                   check=True)
    silent.unlink()
    wav.unlink()
    print(out)


if __name__ == "__main__":
    preview() if "--preview" in sys.argv else render()
