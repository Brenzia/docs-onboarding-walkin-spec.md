/* Walk-in onboarding — engine.
   Tweening, per-set cameras with parallax planes, beat log, speech bubble, form-card panel switching.
   Rarely needs editing when restyling. */
/* ---------------- engine ---------------- */
const EASE = {
  linear: t => t,
  in: t => t * t * t,
  out: t => 1 - Math.pow(1 - t, 3),
  inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
};
const $ = id => document.getElementById(id);
const lerp = (a, b, t) => a + (b - a) * t;
const sleep = ms => new Promise(r => setTimeout(r, reduced ? Math.min(ms, 200) : ms));
let reduced = false;
let runId = 0;
function tween(ms, fn, ease = 'inOut', force = false) {
  const my = runId;
  return new Promise(res => {
    if ((reduced && !force) || ms <= 0) { fn(1); res(); return; }
    const t0 = performance.now(), e = EASE[ease] || EASE.inOut;
    (function f(now) {
      if (my !== runId) return res();
      const p = Math.min(1, (now - t0) / ms);
      fn(e(p));
      p < 1 ? requestAnimationFrame(f) : res();
    })(t0);
  });
}

/* sets, planes and cameras */
const SETS = {};
for (const id of ['gate', 'cabin', 'lift', 'corr']) {
  const el = $('set-' + id);
  SETS[id] = { el, op: 0, cam: { x: 0, y: 0, z: 1, cx: 195, cy: 300, sx: 0, sy: 0 },
    planes: [...el.querySelectorAll(':scope > .pl')].map(p => ({ el: p, f: +p.dataset.f })) };
}
const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
function render() {
  tilt.x += (tilt.tx - tilt.x) * .08; tilt.y += (tilt.ty - tilt.y) * .08;
  for (const s of Object.values(SETS)) {
    s.el.style.opacity = s.op;
    s.el.style.display = s.op > 0.001 ? '' : 'none';
    if (s.op <= 0.001) continue;
    const c = s.cam;
    for (const p of s.planes) {
      const k = 1 + (c.z - 1) * p.f;
      const tx = c.x * p.f - (reduced ? 0 : tilt.x * MOTION.tiltMaxPx * p.f) + c.sx;
      const ty = c.y * p.f - (reduced ? 0 : tilt.y * MOTION.tiltMaxPx * p.f) + c.sy;
      p.el.setAttribute('transform', `translate(${c.cx} ${c.cy}) scale(${k}) translate(${-c.cx - tx} ${-c.cy - ty})`);
    }
  }
  requestAnimationFrame(render);
}
function show(id) { for (const k in SETS) SETS[k].op = k === id ? 1 : 0; }
async function crossfade(from, to, ms) {
  await tween(reduced ? MOTION.beats.reducedFade.ms : ms, t => { SETS[from].op = 1 - t; SETS[to].op = t; }, 'linear', true);
  SETS[from].op = 0; SETS[to].op = 1;
}
function resetCam(id, o = {}) { Object.assign(SETS[id].cam, { x: 0, y: 0, z: 1, cx: 195, cy: 300, sx: 0, sy: 0 }, o); }

/* beat log + haptics */
let t0 = performance.now();
function log(name, cls) { const li = document.createElement('li'); if (cls) li.className = cls; li.innerHTML = `<span>${String(Math.round(performance.now() - t0)).padStart(5, ' ')}</span> ${name}`; $('log').appendChild(li); $('log').scrollTop = 1e6; }
function haptic(kind) { log('haptic · ' + kind, 'h'); try { navigator.vibrate && navigator.vibrate(kind === 'error' ? [30, 40, 30] : kind === 'success' ? [20, 30, 40] : 12); } catch (e) {} }

/* bubble */
function bubble(title, sub, x, y, tail = 'bl') {
  const b = $('bubble'); $('bubT').textContent = title; $('bubS').textContent = sub || '';
  b.style.left = x + 'px'; b.style.top = y + 'px';
  b.style.borderRadius = tail === 'bl' ? '18px 18px 18px 6px' : '18px 18px 6px 18px';
  b.style.transformOrigin = tail === 'bl' ? '15% 100%' : '85% 100%';
  b.classList.add('show');
}
const hideBubble = () => $('bubble').classList.remove('show');

/* card panels */
let stage = 'gate';
function panel(id) {
  const card = $('card');
  const cur = card.querySelector('.panel.on');
  const next = $('p-' + id);
  const h0 = card.offsetHeight;
  if (cur) cur.classList.remove('on', 'enter');
  next.classList.add('on'); next.classList.remove('enter'); void next.offsetWidth; next.classList.add('enter');
  card.style.height = 'auto';
  const h1 = card.offsetHeight;
  card.style.height = h0 + 'px'; void card.offsetWidth; card.style.height = h1 + 'px';
  stage = id;
  const f = next.querySelector('input');
  if (f) setTimeout(() => f.focus({ preventScroll: true }), 300);
}
