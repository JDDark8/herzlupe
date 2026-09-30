// Promo director for Herzlabor (9:16): drives the app through window.HL on the virtual clock and draws the ad copy on top.
(() => {
  const HL = window.HL, VW = innerWidth, VH = innerHeight, STEP = 1000 / 30;
  // scene start times come from the renderer (__promoSetup), so picture and music share one timeline
  const T = { B: 3.333, C: 6.667, D: 9.583, E: 12.5 };
  // screen area the heart is framed into: one heart, then healthy and defect side by side
  const FA1 = { w: 500, h: 520, top: 270, dy: -50 }, FA2 = { w: 510, h: 420, top: 330, dy: -35 };
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), ease = x => 1 - (1 - x) ** 3;
  const fa = () => { const A = HL.FA(); Object.assign(A, HL.cmpOn() ? FA2 : FA1); HL.camera.setViewOffset(VW, VH, 0, A.dy, VW, VH); };

  document.head.insertAdjacentHTML('beforeend', `<style>
*{transition:none!important;animation:none!important}
.col,.monitor,.mtabs,.legal,#explain,#exOpen,#tip,#status,#cmp{visibility:hidden!important}
#labels .lab:not(.defect),#labels .leaders,#labels .lab.defect .tx{display:none!important}
#pv{position:fixed;inset:0;z-index:40;pointer-events:none;color:#e9f2ee;font-family:"Barlow",system-ui,sans-serif}
#pv>*{position:absolute}
#pv .shade{inset:0;background:linear-gradient(180deg,rgba(7,24,21,.95) 0%,rgba(7,24,21,.8) 17%,rgba(7,24,21,0) 33%,rgba(7,24,21,0) 72%,rgba(7,24,21,.75) 87%,rgba(7,24,21,.95) 100%)}
#pv .dim{inset:0;opacity:0;background:radial-gradient(90% 60% at 50% 46%,rgba(16,46,41,.96),rgba(5,16,14,.99))}
#pv .grp{left:34px;right:34px;top:92px}
#pv .eye{font:500 14px/1 "IBM Plex Mono",monospace;letter-spacing:.2em;text-transform:uppercase;color:#72f59e}
#pv h1{margin:14px 0 0;font:700 46px/1.03 "Barlow Condensed","Arial Narrow",sans-serif;letter-spacing:.005em}
#pv .soft{display:inline-block;color:#c6d8d1}
#pv .sub{margin:12px 0 0;max-width:440px;font:400 19px/1.38 "Barlow",sans-serif;color:#c6d8d1}
#pv .legend{left:0;right:0;top:744px;display:flex;justify-content:center;gap:24px;font:500 14px/1 "IBM Plex Mono",monospace;letter-spacing:.06em;color:#c6d8d1}
#pv .legend i{display:inline-block;width:10px;height:10px;margin-right:8px;border-radius:50%;vertical-align:-1px}
#pv .legend .b{background:#6d86ff;box-shadow:0 0 10px #6d86ff}
#pv .legend .r{background:#ff4d57;box-shadow:0 0 10px #ff4d57}
#pv .call{left:0;top:0;padding:9px 13px;border-radius:9px;background:rgba(6,20,18,.84);border:1px solid rgba(255,77,87,.6);font:600 15.5px/1.15 "Barlow",sans-serif;white-space:nowrap}
#pv .callLine{inset:0;width:100%;height:100%}
#pv .callLine path{fill:none;stroke:rgba(255,130,136,.85);stroke-width:1.4}
#pv .tag{top:318px;transform:translateX(-50%);padding:7px 12px;border-radius:999px;border:1px solid rgba(214,240,231,.28);background:rgba(6,20,18,.72);font:600 14px/1 "Barlow Condensed",sans-serif;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}
#pv .tag b{margin-right:7px;font:500 11px/1 "IBM Plex Mono",monospace;letter-spacing:.04em;color:#72f59e}
#pv .vdiv{left:50%;top:352px;width:1px;height:360px;background:linear-gradient(transparent,rgba(214,240,231,.32) 15%,rgba(214,240,231,.32) 85%,transparent)}
#pv .chips{left:20px;right:20px;top:712px;text-align:center}
#pv .chips .cl{font:500 12px/1 "IBM Plex Mono",monospace;letter-spacing:.16em;text-transform:uppercase;color:#8db0a6}
#pv .chips .row{margin-top:12px;display:flex;justify-content:center;gap:7px}
#pv .chips b{padding:8px 11px;border-radius:8px;border:1px solid rgba(214,240,231,.26);background:rgba(4,17,15,.76);font:600 17px/1 "Barlow Condensed",sans-serif;letter-spacing:.06em}
#pv .end{left:30px;right:30px;top:352px;text-align:center}
#pv .end svg{width:96px;height:52px}
#pv .end path{fill:none;stroke:#72f59e;stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round}
#pv .end .pv-brand{margin-top:8px;font:700 60px/1 "Barlow Condensed",sans-serif;letter-spacing:.09em}
#pv .end .claim{margin-top:18px;font:500 25px/1.28 "Barlow",sans-serif}
#pv .end .info{margin-top:24px;font:500 12.5px/1.6 "IBM Plex Mono",monospace;letter-spacing:.05em;color:#8db0a6}
#pv .end .disc{margin-top:26px;font:400 13px/1.4 "Barlow",sans-serif;color:#8db0a6}
#pv .ecg{left:0;bottom:70px;width:100%;height:64px}
</style>`);
  document.body.insertAdjacentHTML('beforeend', `<div id="pv">
  <div class="shade"></div>
  <div class="grp"><div class="eye" data-k="eye">Für Eltern &amp; Betroffene</div><h1><span data-k="a1" style="display:inline-block">Ein Herzfehler.</span><br><span class="soft" data-k="a2">Und so viele Fragen.</span></h1></div>
  <div class="grp"><h1 data-k="b1">Herzlabor zeigt es dir.</h1><p class="sub" data-k="b2">Ein Herz in 3D – zum Aufschneiden und Hineinsehen.</p></div>
  <div class="legend" data-k="legend"><span><i class="b"></i>sauerstoffarm</span><span><i class="r"></i>sauerstoffreich</span></div>
  <div class="grp"><h1 data-k="c1">Sieh, wo das Blut anders fließt.</h1></div>
  <svg class="callLine"><path/></svg>
  <div class="call" data-k="call">Loch in der Kammerscheidewand</div>
  <div class="grp"><h1 data-k="d1">Im Vergleich zum gesunden Herzen.</h1></div>
  <div class="vdiv" data-k="vdiv"></div>
  <div class="tag" data-k="tagL" style="left:${VW / 2 - FA2.w / 4}px"><b>01</b>Gesund</div>
  <div class="tag" data-k="tagR" style="left:${VW / 2 + FA2.w / 4}px"><b>02</b>Mit VSD</div>
  <div class="chips"><div class="cl" data-k="chipsL">Sechs der häufigsten Herzfehler</div><div class="row">${['VSD', 'ASD', 'PDA', 'PS', 'ISTA', 'Fallot'].map(c => `<b data-chip>${c}</b>`).join('')}</div></div>
  <canvas class="ecg"></canvas>
  <div class="dim"></div>
  <div class="end"><svg viewBox="0 0 44 24"><path d="M1 14h10l3-7 4 14 5-19 3 12h17"/></svg>
    <div class="pv-brand" data-k="brand">HERZLABOR</div>
    <div class="claim" data-k="claim">Verstehen, was im Herzen passiert.</div>
    <div class="info" data-k="info">Interaktives 3D-Modell · Handy, Tablet, Desktop<br>Deutsch &amp; English · auch offline</div>
    <div class="disc" data-k="disc">Nur zur Aufklärung und Lehre – kein Medizinprodukt,<br>ersetzt keine ärztliche Beratung.</div></div>
</div>`);
  const E = {};
  document.querySelectorAll('#pv [data-k]').forEach(el => { E[el.dataset.k] = el; });
  const chips = [...document.querySelectorAll('#pv [data-chip]')], dim = document.querySelector('#pv .dim');
  const mark = document.querySelector('#pv .end path'), markSvg = document.querySelector('#pv .end svg'), markLen = mark.getTotalLength();
  const callPath = document.querySelector('#pv .callLine path');
  mark.style.strokeDasharray = markLen;

  // fade and rise in at tin, fade out at tout (the individual `translate` property leaves own transforms alone)
  const show = (el, t, tin, tout = 99, rise = 16) => {
    const a = ease(clamp((t - tin) / 0.5, 0, 1)), o = a * clamp((tout - t) / 0.3, 0, 1);
    el.style.opacity = o.toFixed(3);
    el.style.translate = `0 ${((1 - a) * rise).toFixed(1)}px`;
    return o;
  };

  const ecgC = document.querySelector('#pv .ecg'), ecx = ecgC.getContext('2d'), DPR = devicePixelRatio;
  ecgC.width = VW * DPR; ecgC.height = 64 * DPR; ecx.scale(DPR, DPR);
  // the app's own lead II, so the strip matches the monitor (and the VSD's P mitrale once it is on)
  const ecg = f => HL.CY.ecg(HL.cyc(f));
  function drawEcg(beat, alpha) {
    ecx.clearRect(0, 0, VW, 64);
    if (alpha <= 0) return;
    const x0 = 22, x1 = VW - 22, span = 2.6 * 1.2, g = ecx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, 'rgba(114,245,158,0)'); g.addColorStop(0.4, `rgba(114,245,158,${0.5 * alpha})`); g.addColorStop(1, `rgba(114,245,158,${0.95 * alpha})`);
    ecx.strokeStyle = g; ecx.lineWidth = 1.8; ecx.lineJoin = 'round'; ecx.beginPath();
    for (let x = x0; x <= x1; x++) {
      const b = beat - (x1 - x) / (x1 - x0) * span, y = 42 - ecg(b - Math.floor(b)) * 30;
      x === x0 ? ecx.moveTo(x, y) : ecx.lineTo(x, y);
    }
    ecx.stroke();
    ecx.fillStyle = `rgba(200,255,215,${alpha})`; ecx.beginPath(); ecx.arc(x1, 42 - ecg(beat - Math.floor(beat)) * 30, 2.7, 0, 7); ecx.fill();
  }

  // callout box beside the defect ring (placed on the rest anchor, leader to the beating ring)
  function callout(t) {
    const lb = HL.LABELS.find(l => l.defect), o = show(E.call, t, T.C + 1.0, T.D - 0.25, 10);
    if (!lb || !lb.el.classList.contains('show') || o <= 0) { E.call.style.opacity = 0; callPath.setAttribute('d', ''); return; }
    const r = lb.ringR / 2, bw = E.call.offsetWidth, bh = E.call.offsetHeight;
    const bx = clamp(lb.rx + r + 20, 14, VW - bw - 14), by = clamp(lb.ry - r - bh - 30, 280, VH - bh - 220);
    E.call.style.left = `${bx}px`; E.call.style.top = `${by}px`;
    const ex = bx + 12, ey = by + bh, dx = ex - lb.sx, dy = ey - lb.sy, k = (lb.ring / 2 + 3) / (Math.hypot(dx, dy) || 1);
    callPath.setAttribute('d', `M${(lb.sx + dx * k).toFixed(1)} ${(lb.sy + dy * k).toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`);
    callPath.style.opacity = o;
  }

  function overlay(t) {
    const endA = T.E - 0.25;
    show(E.eye, t, 0.15, T.B - 0.3); show(E.a1, t, 0.3, T.B - 0.3); show(E.a2, t, 1.05, T.B - 0.3);
    show(E.b1, t, T.B + 0.2, T.C - 0.3); show(E.b2, t, T.B + 0.6, T.C - 0.3); show(E.legend, t, T.B + 1.3, T.C - 0.3, 10);
    show(E.c1, t, T.C + 0.15, T.D - 0.25);
    callout(t);
    show(E.d1, t, T.D + 0.15, endA); show(E.vdiv, t, T.D + 0.45, endA, 0);
    show(E.tagL, t, T.D + 0.5, endA, 8); show(E.tagR, t, T.D + 0.6, endA, 8);
    show(E.chipsL, t, T.D + 0.7, endA, 8); chips.forEach((c, k) => show(c, t, T.D + 0.8 + k * 0.07, endA, 10));
    dim.style.opacity = ease(clamp((t - T.E) / 0.5, 0, 1)).toFixed(3);
    const p = ease(clamp((t - T.E - 0.1) / 0.6, 0, 1));
    markSvg.style.opacity = p > 0 ? 1 : 0; mark.style.strokeDashoffset = (markLen * (1 - p)).toFixed(2);
    show(E.brand, t, T.E + 0.3); show(E.claim, t, T.E + 0.6); show(E.info, t, T.E + 0.95); show(E.disc, t, T.E + 1.2);
    drawEcg(HL.state.beat, 0.8 * (1 - clamp((t - T.E) / 0.4, 0, 1)));
  }

  const turn = a => HL.heart.quaternion.premultiply(HL.heart.quaternion.clone().setFromAxisAngle(HL.v3(0, 1, 0), a));
  const EVENTS = [
    ['B', () => HL.setView('cut4')],
    ['C', () => {
      // same view, so skip the app's close-and-recut transition: cut through the defect at once, then only zoom
      HL.setSpec('vsd'); fa(); HL.setView('cut4', true);
      // centre between septum and LV so the whole cut heart stays in frame
      const c = HL.lesion().c.clone().addScaledVector(HL.AX, 0.8).addScaledVector(HL.SN, 1.1);
      HL.zoomTo(Math.max(HL.controls.minDistance, HL.fitDistance(HL.VIEWS.cut4) * 0.86), c);
    }],
    ['D', () => { HL.setCompare(true); fa(); const d = HL.VIEWS.cut4; HL.zoomTo(HL.fitDistance(d), d.focus.clone()); }],
  ];

  window.__promoSetup = async times => {
    Object.assign(T, times);
    await document.fonts.ready;
    const st = HL.state;
    Object.assign(st.layers, { flow: true, points: true, labels: false, glass: false });
    // build the VSD specimen up front, so the later cut to it is instant
    HL.setSpec('vsd');
    while (!HL.GEO.vsd) await new Promise(r => setTimeout(r, 50));
    HL.setSpec('normal');
    fa(); HL.setView('front', true);
    for (let k = 0; k < 150; k++) { fa(); window.__vstep(STEP); }
    fa(); HL.setView('front', true); turn(-0.2);
    Object.assign(st, { beat: -0.315, simT: 0, playing: true, slow: false });
    return true;
  };
  let tPrev = -1;
  window.__promoFrame = t => {
    fa();
    for (const [k, fn] of EVENTS) if (tPrev < T[k] && t >= T[k]) fn();
    fa();
    // hook: the heart turns slowly; afterwards a gentle dolly-in whenever no camera move runs
    if (t < T.B) turn(0.14 / 30);
    if (HL.controls.enabled) HL.camera.position.multiplyScalar(1 - 0.012 / 30);
    window.__vstep(STEP);
    overlay(t);
    tPrev = t;
    return { beat: HL.state.beat, vsd: HL.state.spec === 'vsd' };
  };
})();
