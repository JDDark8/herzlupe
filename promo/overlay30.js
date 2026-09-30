// Promo director for Herzlupe (30 s, 9:16, for parents and paediatricians): drives the app through window.HL on the virtual clock
// and draws the copy on top.
(() => {
  const HL = window.HL, VW = innerWidth, VH = innerHeight, STEP = 1000 / 30;
  // scene start times come from the renderer (__promoSetup), so picture and music share one timeline
  const T = { B: 3.333, C: 6.667, D: 10, E: 13.333, F: 16.667, Fb: 18.333, F2: 20, G: 23.333, H: 26.667 };
  // screen area the heart is framed into: one heart, healthy and defect side by side, one heart above the specimen chips
  const FA1 = { w: 500, h: 520, top: 270, dy: -50 }, FA2 = { w: 510, h: 420, top: 330, dy: -35 }, FA3 = { w: 470, h: 380, top: 320, dy: -30 };
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), ease = x => 1 - (1 - x) ** 3;
  let tNow = 0;
  const fa = () => {
    const A = HL.FA(); Object.assign(A, HL.cmpOn() ? FA2 : tNow >= T.F && tNow < T.G ? FA3 : FA1);
    HL.camera.setViewOffset(VW, VH, 0, A.dy, VW, VH);
  };

  document.head.insertAdjacentHTML('beforeend', `<style>
*{transition:none!important;animation:none!important}
.col,.monitor,.mtabs,.legal,#explain,#exOpen,#tip,#status,#cmp{visibility:hidden!important}
#labels .lab:not(.defect),#labels .leaders,#labels .lab.defect .tx{display:none!important}
#pv{position:fixed;inset:0;z-index:40;pointer-events:none;color:#e9f0fb;font-family:"Barlow",system-ui,sans-serif}
#pv>*{position:absolute}
#pv .shade{inset:0;background:linear-gradient(180deg,rgba(8,18,38,.95) 0%,rgba(8,18,38,.8) 17%,rgba(8,18,38,0) 33%,rgba(8,18,38,0) 72%,rgba(8,18,38,.75) 87%,rgba(8,18,38,.95) 100%)}
#pv .dim{inset:0;opacity:0;background:radial-gradient(90% 60% at 50% 46%,rgba(22,48,88,.96),rgba(5,12,26,.99))}
#pv .grp{left:34px;right:34px;top:92px}
#pv .eye{margin-bottom:14px;font:500 14px/1 "IBM Plex Mono",monospace;letter-spacing:.2em;text-transform:uppercase;color:#4fd4e8}
#pv h1{margin:0;font:700 46px/1.03 "Barlow Condensed","Arial Narrow",sans-serif;letter-spacing:.005em}
#pv .soft{display:inline-block;color:#c4d3ea}
#pv .sub{margin:12px 0 0;max-width:450px;font:400 19px/1.38 "Barlow",sans-serif;color:#c4d3ea}
#pv .legend{left:0;right:0;top:744px;display:flex;justify-content:center;gap:24px;font:500 14px/1 "IBM Plex Mono",monospace;letter-spacing:.06em;color:#c4d3ea}
#pv .legend i{display:inline-block;width:10px;height:10px;margin-right:8px;border-radius:50%;vertical-align:-1px}
#pv .legend .b{background:#6d86ff;box-shadow:0 0 10px #6d86ff}
#pv .legend .r{background:#ff4d57;box-shadow:0 0 10px #ff4d57}
#pv .call{left:0;top:0;padding:9px 13px;border-radius:9px;background:rgba(7,16,34,.84);border:1px solid rgba(255,77,87,.6);font:600 15.5px/1.15 "Barlow",sans-serif;white-space:nowrap}
/* green = repaired, as the "unremarkable" dot in the app */
#pv .call.op{border-color:rgba(114,245,158,.7)}
#pv .callLine{inset:0;width:100%;height:100%}
#pv .callLine path{fill:none;stroke:rgba(255,130,136,.85);stroke-width:1.4}
#pv .callLine.op path{stroke:rgba(114,245,158,.85)}
#pv .tag{top:318px;transform:translateX(-50%);padding:7px 12px;border-radius:999px;border:1px solid rgba(205,222,255,.28);background:rgba(7,16,34,.72);font:600 14px/1 "Barlow Condensed",sans-serif;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}
#pv .tag b{margin-right:7px;font:500 11px/1 "IBM Plex Mono",monospace;letter-spacing:.04em;color:#4fd4e8}
#pv .tag .st{margin-left:8px;color:#4fd4e8}
#pv .vdiv{left:50%;top:352px;width:1px;height:360px;background:linear-gradient(transparent,rgba(205,222,255,.32) 15%,rgba(205,222,255,.32) 85%,transparent)}
#pv .chips{left:20px;right:20px;top:706px;text-align:center}
#pv .chips .cl{font:500 12px/1 "IBM Plex Mono",monospace;letter-spacing:.16em;text-transform:uppercase;color:#8aa2c6}
#pv .chips .row{margin-top:10px;display:flex;justify-content:center;gap:7px}
#pv .chips b{padding:7px 11px;border-radius:8px;border:1px solid rgba(205,222,255,.26);background:rgba(7,16,34,.76);font:600 16px/1 "Barlow Condensed",sans-serif;letter-spacing:.06em}
#pv .chips b.on{border-color:#4fd4e8;background:#4fd4e8;color:#0a1a33}
#pv .end{left:30px;right:30px;top:318px;text-align:center}
#pv .end svg{width:96px;height:52px}
#pv .end path{fill:none;stroke:#4fd4e8;stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round}
#pv .end .pv-brand{margin-top:8px;font:700 64px/1 "Barlow Condensed",sans-serif;letter-spacing:.09em}
#pv .end .claim{margin-top:18px;font:500 25px/1.28 "Barlow",sans-serif}
#pv .end .info{margin-top:24px;font:500 12.5px/1.7 "IBM Plex Mono",monospace;letter-spacing:.05em;color:#8aa2c6}
#pv .end .mail{margin-top:18px;font:500 17px/1 "IBM Plex Mono",monospace;letter-spacing:.04em;color:#e9f0fb}
#pv .end .disc{margin-top:26px;font:400 13px/1.4 "Barlow",sans-serif;color:#8aa2c6}
#pv .ecg{left:0;bottom:70px;width:100%;height:64px}
</style>`);
  const CHIPS = [['VSD', 'ASD', 'PS', 'ISTA', 'UVH'], ['AVSD', 'Fallot', 'TGA', 'PDA']];
  document.body.insertAdjacentHTML('beforeend', `<div id="pv">
  <div class="shade"></div>
  <div class="grp"><div class="eye" data-k="eye">Für Eltern &amp; Betroffene</div><h1><span data-k="a1" style="display:inline-block">Diagnose: Herzfehler.</span><br><span class="soft" data-k="a2">Und so viele Fragen.</span></h1></div>
  <div class="grp"><h1 data-k="b1">Die Herzlupe zeigt es.</h1><p class="sub" data-k="b2">Ein Herz in 3D – zum Aufschneiden und Hineinsehen.</p></div>
  <div class="legend" data-k="legend"><span><i class="b"></i>sauerstoffarm</span><span><i class="r"></i>sauerstoffreich</span></div>
  <div class="grp"><h1 data-k="c1">Sieh, wo das Blut anders fließt.</h1></div>
  <div class="grp"><h1 data-k="d1">Im Vergleich zum gesunden Herzen.</h1></div>
  <div class="grp"><h1 data-k="e1">Und so sieht es nach der OP aus.</h1></div>
  <svg class="callLine"><path/></svg>
  <div class="call" data-k="call"></div>
  <div class="vdiv" data-k="vdiv"></div>
  <div class="tag" data-k="tagL" style="left:${VW / 2 - FA2.w / 4}px"><b>01</b>Gesund</div>
  <div class="tag" data-k="tagR" style="left:${VW / 2 + FA2.w / 4}px"><b>02</b>Mit VSD</div>
  <div class="grp"><div class="eye" data-k="f0">Für Kinderärztinnen &amp; Kinderärzte</div><h1 data-k="f1">Zeigen statt nur erklären.</h1><p class="sub" data-k="f2">Im Gespräch mit Eltern: den Herzfehler wählen, vorher und nachher zeigen.</p></div>
  <div class="tag" data-k="tagF" style="left:${VW / 2}px;top:298px"></div>
  <div class="chips" data-k="chips"><div class="cl">9 angeborene Herzfehler · vorher &amp; nachher</div>${CHIPS.map(r => `<div class="row">${r.map(c => `<b data-chip="${c}">${c}</b>`).join('')}</div>`).join('')}</div>
  <div class="grp"><h1 data-k="g1">Und zu Hause: in Ruhe nachsehen.</h1><p class="sub" data-k="g2">Mit Rundgang zu jedem Herzfehler – für Säugling, Kind oder Erwachsenen.</p></div>
  <canvas class="ecg"></canvas>
  <div class="dim"></div>
  <div class="end"><svg viewBox="0 0 44 24"><path d="M1 14h10l3-7 4 14 5-19 3 12h17"/></svg>
    <div class="pv-brand" data-k="brand">HERZLUPE</div>
    <div class="claim" data-k="claim">Verstehen, was im Herzen passiert.</div>
    <div class="info" data-k="info">9 Herzfehler in 3D · vorher &amp; nachher · Rundgänge<br>Handy, Tablet, Desktop · auch offline</div>
    <div class="mail" data-k="mail">[Kontakt-E-Mail]</div>
    <div class="disc" data-k="disc">Ausschließlich zur Aufklärung – kein Medizinprodukt,<br>ersetzt keine ärztliche Beratung.</div></div>
</div>`);
  const E = {};
  document.querySelectorAll('#pv [data-k]').forEach(el => { E[el.dataset.k] = el; });
  const chips = [...document.querySelectorAll('#pv [data-chip]')], dim = document.querySelector('#pv .dim');
  const mark = document.querySelector('#pv .end path'), markSvg = document.querySelector('#pv .end svg'), markLen = mark.getTotalLength();
  const callSvg = document.querySelector('#pv .callLine'), callPath = callSvg.querySelector('path');
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
  // the app's own lead II, so the strip follows the specimen on show
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

  // callout box beside the lesion ring (placed on the rest anchor, leader to the beating ring); green once treated
  function callout(t) {
    const op = t >= T.E, o = op ? show(E.call, t, T.E + 1.3, T.F - 0.25, 10) : show(E.call, t, T.C + 1.0, T.D - 0.25, 10);
    const lb = HL.LABELS.find(l => l.defect);
    E.call.textContent = op ? 'Ein Flicken verschließt das Loch' : 'Loch in der Kammerscheidewand';
    E.call.classList.toggle('op', op); callSvg.classList.toggle('op', op);
    if (!lb || !lb.el.classList.contains('show') || o <= 0) { E.call.style.opacity = 0; callPath.setAttribute('d', ''); return; }
    const r = lb.ringR / 2, bw = E.call.offsetWidth, bh = E.call.offsetHeight;
    const bx = clamp(lb.rx + r + 20, 14, VW - bw - 14), by = clamp(lb.ry - r - bh - 30, 280, VH - bh - 220);
    E.call.style.left = `${bx}px`; E.call.style.top = `${by}px`;
    const ex = bx + 12, ey = by + bh, dx = ex - lb.sx, dy = ey - lb.sy, k = (lb.ring / 2 + 3) / (Math.hypot(dx, dy) || 1);
    callPath.setAttribute('d', `M${(lb.sx + dx * k).toFixed(1)} ${(lb.sy + dy * k).toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`);
    callPath.style.opacity = o;
  }

  function overlay(t) {
    const endA = T.H - 0.25;
    show(E.eye, t, 0.15, T.B - 0.3); show(E.a1, t, 0.3, T.B - 0.3); show(E.a2, t, 1.05, T.B - 0.3);
    show(E.b1, t, T.B + 0.2, T.C - 0.3); show(E.b2, t, T.B + 0.6, T.C - 0.3);
    // the colour legend twice: when the heart opens and in glass mode at the close
    if (t < T.G) show(E.legend, t, T.B + 1.3, T.C - 0.3, 10); else show(E.legend, t, T.G + 1.2, endA, 10);
    show(E.c1, t, T.C + 0.15, T.D - 0.25);
    callout(t);
    show(E.d1, t, T.D + 0.15, T.E - 0.25); show(E.vdiv, t, T.D + 0.45, T.E - 0.25, 0);
    show(E.tagL, t, T.D + 0.5, T.E - 0.25, 8); show(E.tagR, t, T.D + 0.6, T.E - 0.25, 8);
    show(E.e1, t, T.E + 0.15, T.F - 0.25);
    show(E.f0, t, T.F + 0.15, T.G - 0.25); show(E.f1, t, T.F + 0.3, T.G - 0.25); show(E.f2, t, T.F + 0.7, T.G - 0.25);
    const asd = t < T.F2;
    E.tagF.innerHTML = asd ? `<b>03</b>ASD<span class="st">${t < T.Fb ? 'vorher' : 'nach Katheter'}</span>` : '<b>08</b>Fallot';
    show(E.tagF, t, T.F + 0.9, T.G - 0.25, 8);
    show(E.chips, t, T.F + 1.0, T.G - 0.25, 10);
    chips.forEach(c => c.classList.toggle('on', c.dataset.chip === (asd ? 'ASD' : 'Fallot')));
    show(E.g1, t, T.G + 0.15, endA); show(E.g2, t, T.G + 0.55, endA);
    dim.style.opacity = ease(clamp((t - T.H) / 0.5, 0, 1)).toFixed(3);
    const p = ease(clamp((t - T.H - 0.1) / 0.6, 0, 1));
    markSvg.style.opacity = p > 0 ? 1 : 0; mark.style.strokeDashoffset = (markLen * (1 - p)).toFixed(2);
    show(E.brand, t, T.H + 0.3); show(E.claim, t, T.H + 0.6); show(E.info, t, T.H + 0.95); show(E.mail, t, T.H + 1.2); show(E.disc, t, T.H + 1.45);
    drawEcg(HL.state.beat, 0.8 * (1 - clamp((t - T.H) / 0.4, 0, 1)));
  }

  const turn = a => HL.heart.quaternion.premultiply(HL.heart.quaternion.clone().setFromAxisAngle(HL.v3(0, 1, 0), a));
  const septum = (c, k) => HL.setView('septum', false, { focus: c.clone(), dist: HL.fitDistance(HL.VIEWS.septum) * k });
  const EVENTS = [
    ['B', () => HL.setView('cut4')],
    ['C', () => {
      // same view, so skip the app's close-and-recut transition: cut through the defect at once, then only zoom
      HL.setSpec('vsd'); fa(); HL.setView('cut4', true);
      const c = HL.lesion().c.clone().addScaledVector(HL.AX, 0.8).addScaledVector(HL.SN, 1.1);
      HL.zoomTo(Math.max(HL.controls.minDistance, HL.fitDistance(HL.VIEWS.cut4) * 0.86), c);
    }],
    ['D', () => { HL.setCompare(true); fa(); const d = HL.VIEWS.cut4; HL.zoomTo(HL.fitDistance(d), d.focus.clone()); }],
    // the patch seen from the right ventricle, where the surgeon sews it on
    ['E', () => { HL.setCompare(false); fa(); HL.setOp(true); septum(HL.lesion().c.clone().addScaledVector(HL.AX, 1.2), 0.74); }],
    ['F', () => { HL.setSpec('asd'); fa(); septum(HL.IAS_C.clone().lerp(HL.VIEWS.septum.focus, 0.35), 0.74); }],
    ['Fb', () => HL.setOp(true)],
    ['F2', () => { HL.setSpec('tof'); fa(); HL.setView('lvot'); }],
    ['G', () => { HL.setSpec('normal'); fa(); HL.setView('front'); document.querySelector('[data-layer=glass]').click(); }],
  ];

  window.__promoSetup = async times => {
    Object.assign(T, times);
    await document.fonts.ready;
    const st = HL.state;
    Object.assign(st.layers, { flow: true, points: true, labels: false, glass: false });
    // build every specimen up front, so the cuts to them are instant
    for (const k of ['vsd', 'asd', 'tof']) { HL.setSpec(k); while (!HL.GEO[k]) await new Promise(r => setTimeout(r, 50)); }
    HL.setSpec('normal');
    fa(); HL.setView('front', true);
    for (let k = 0; k < 150; k++) { fa(); window.__vstep(STEP); }
    fa(); HL.setView('front', true); turn(-0.2);
    Object.assign(st, { beat: -0.315, simT: 0, playing: true, slow: false });
    return true;
  };
  let tPrev = -1;
  window.__promoFrame = t => {
    tNow = t; fa();
    for (const [k, fn] of EVENTS) if (tPrev < T[k] && t >= T[k]) fn();
    fa();
    // hook and closing: the heart turns slowly; otherwise a gentle dolly-in whenever no camera move runs
    if (t < T.B || t >= T.G + 1.4) turn(0.12 / 30);
    else if (HL.controls.enabled) HL.camera.position.multiplyScalar(1 - 0.012 / 30);
    window.__vstep(STEP);
    overlay(t);
    tPrev = t;
    return { beat: HL.state.beat, vsd: HL.state.spec === 'vsd' && !HL.isOp() };
  };
})();
