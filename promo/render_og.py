"""Link preview image (WhatsApp, iMessage, ...): python render_og.py [spec] [view] -> ../og.jpg (1200 x 630)
The live app renders the heart without its interface (rendered at 2x, scaled down); brand and line are laid over it."""
import sys
from io import BytesIO
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parent.parent
SPEC = sys.argv[1] if len(sys.argv) > 1 else 'vsd'
VIEW = sys.argv[2] if len(sys.argv) > 2 else 'cut4'
W, H = 1200, 630
CSS = """.col,.monitor,.explain,.ex-open,.legal,.mtabs,#gesture,#status,#labels,#cmp{display:none!important}
#og{position:fixed;left:70px;top:50%;transform:translateY(-50%);z-index:50;max-width:560px}
.og-mark{display:flex;align-items:center;gap:14px;font:700 40px/1 var(--cond);letter-spacing:.07em;color:var(--ink)}
.og-mark svg{width:58px;height:32px}
.og-line{margin-top:30px;font:600 50px/1.06 var(--cond);letter-spacing:.01em;color:var(--ink)}
.og-sub{margin-top:18px;font:400 22px/1.4 var(--body);color:var(--ink2);text-wrap:balance}"""
OVERLAY = """<div class="og-mark"><svg viewBox="0 0 44 24" aria-hidden="true"><path d="M1 14h10l3-7 4 14 5-19 3 12h17" fill="none" stroke="#4fd4e8" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/></svg><span>HERZLUPE</span></div>
<div class="og-line">Angeborene Herzfehler<br>einfach verstehen</div>
<div class="og-sub">Ein Herz in 3D zum Drehen und Aufschneiden –<br>für Eltern und alle, die mit einem Herzfehler leben.</div>"""

with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge', headless=True)
    page = b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=2)
    page.goto((ROOT / 'index.html').as_uri() + '?debug&lang=de&age=adult')
    page.wait_for_selector('#status.done', state='attached', timeout=240000)
    page.add_style_tag(content=CSS)
    page.evaluate("html => { const d = document.createElement('div'); d.id = 'og'; d.innerHTML = html; document.body.append(d); }", OVERLAY)
    page.evaluate(f"() => {{ HL.setSpec('{SPEC}'); HL.setView('{VIEW}'); }}")
    page.wait_for_timeout(5000)
    # the heart moves to the right half, a little larger; then the beat stops at a moment with the valves open
    page.evaluate("""() => { const c = HL.camera; c.setViewOffset(innerWidth, innerHeight, -245, 4, innerWidth, innerHeight); c.position.multiplyScalar(0.77); }""")
    page.wait_for_timeout(1500)
    page.evaluate("() => { HL.state.playing = false; }")
    page.wait_for_timeout(400)
    img = Image.open(BytesIO(page.screenshot())).convert('RGB').resize((W, H), Image.LANCZOS)
    b.close()
out = ROOT / 'og.jpg'
img.save(out, quality=86, optimize=True, progressive=True)
print(out.name, img.size, f'{out.stat().st_size / 1024:.0f} KB')
