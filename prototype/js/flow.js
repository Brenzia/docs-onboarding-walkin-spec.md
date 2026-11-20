/* Walk-in onboarding — flow.
   Scene setup, the 13 beats, form-card wiring, mock API, autoplay and side-panel controls.
   Element ids used here are listed in docs/STYLE-GUIDE.md: keep them when redrawing art. */
/* ---------------- state ---------------- */
let seg = 'nonmygate';
const S = {};
function resetState() {
  Object.assign(S, { phone: '', otpTries: 0, name: '', intent: '', email: '', eTries: 0, busy: false, anim: Promise.resolve() });
}

/* light strip on the gate pillar */
const strip = $('strip'); const segs = [];
for (let i = 0; i < 10; i++) { const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); r.setAttribute('x', 49); r.setAttribute('y', 370 - i * 18); r.setAttribute('width', 12); r.setAttribute('height', 13); r.setAttribute('rx', 2); r.style.transition = 'fill .18s'; strip.appendChild(r); segs.push(r); }
function paintStrip(n, state) { segs.forEach((r, i) => r.style.fill = state === 'bad' ? 'var(--c-strip-error)' : state === 'ok' ? 'var(--c-led-green)' : i < n ? 'var(--c-amber)' : 'var(--c-strip-off)'); }

/* ---------------- scene setup ---------------- */
function setDoor(deg) {
  const c = Math.cos(deg * Math.PI / 180);
  $('kDoor').setAttribute('transform', `translate(120 0) scale(${c} 1) translate(-120 0)`);
  $('kDoorShade').setAttribute('opacity', Math.sin(deg * Math.PI / 180) * .9);
  door.deg = deg; door.edge = 120 + 150 * c;
  $('kInDark').setAttribute('opacity', .55 * (1 - Math.min(1, deg / 60)));
  $('kSpill').setAttribute('opacity', .5 * Math.min(1, Math.max(0, (deg - 20) / 60)));
  $('kFingers').setAttribute('transform', `translate(${door.edge + 2} 0)`);
  drawChain();
}
const door = { deg: 0, edge: 270, chain: 'none', hang: 0 };
function drawChain() {
  const ch = $('kChain');
  if (door.chain === 'none') { ch.setAttribute('d', 'M276 236L276 236'); return; }
  const ax = 276, ay = 236;
  const tx = door.edge - 2, ty = 240;
  const hx = 272, hy = 266;
  const ex = lerp(tx, hx, door.hang), ey = lerp(ty, hy, door.hang);
  const sag = lerp(6, 2, door.hang);
  const mx = (ax + ex) / 2 + lerp(0, -6, door.hang), my = (ay + ey) / 2 + sag;
  ch.setAttribute('d', `M${ax} ${ay}Q${mx} ${my} ${ex} ${ey}`);
}
function setLiftDoors(open) { $('liftDoorL').setAttribute('transform', `translate(${-99 * open} 0)`); $('liftDoorR').setAttribute('transform', `translate(${99 * open} 0)`); }
function setRes(x) { $('kRes').setAttribute('transform', `translate(${x} 0)`); }

function initWorld() {
  runId++;
  hideBubble();
  $('flash').style.opacity = 0;
  for (const k in SETS) resetCam(k);
  show('gate');
  $('gatePanel').setAttribute('transform', '');
  paintStrip(0);
  $('boom').setAttribute('transform', ''); $('glassL').setAttribute('transform', ''); $('glassR').setAttribute('transform', '');
  $('gHead').setAttribute('transform', ''); $('gEyes').setAttribute('transform', ''); $('gArm').style.display = ''; $('gCross').setAttribute('opacity', 0); $('cabinDim').setAttribute('opacity', 0);
  $('gMouth').setAttribute('d', 'M191 235q9 6 18 0');
  setLiftDoors(1); $('liftDisp').textContent = 'G'; $('liftBeyond').setAttribute('opacity', 1); $('liftBeyondCorr').setAttribute('opacity', 0);
  ['lbRent', 'lbBuy'].forEach(i => $(i).style.fill = 'var(--c-lift-button)'); $('liftStripes').setAttribute('opacity', 0);
  door.chain = 'none'; door.hang = 0; setDoor(0); setRes(300); $('kResArm').setAttribute('transform', ''); $('kFingers').setAttribute('opacity', 0);
  $('kPlateClip').setAttribute('width', 0); $('kBellGlow').setAttribute('opacity', 0); $('kBell').style.fill = 'var(--c-unlit)';
  $('kResMouth').setAttribute('d', 'M-8 244q8 7 16 0'); $('kResEyes').setAttribute('transform', '');
}

/* ---------------- beats ---------------- */
async function beatGateOpen() {
  log('beat 3 · gate opens'); haptic('light');
  const B = MOTION.beats;
  await tween(B.gateOpen.ms, t => $('gatePanel').setAttribute('transform', `translate(${-232 * t} 0)`), B.gateOpen.ease);
  const g = SETS.gate.cam; g.cx = 195; g.cy = 320;
  resetCam('cabin', { z: B.cabinSettle.fromZoom, cy: 240 });
  if (reduced) { SETS.cabin.cam.z = 1; await crossfade('gate', 'cabin'); }
  else {
    await tween(B.gateDolly.ms, t => {
      g.z = lerp(1, B.gateDolly.zoom, t);
      if (t > B.gateDolly.crossfadeAt) { const u = (t - B.gateDolly.crossfadeAt) / (1 - B.gateDolly.crossfadeAt); SETS.gate.op = 1 - u; SETS.cabin.op = u; }
    }, B.gateDolly.ease);
    SETS.gate.op = 0; SETS.cabin.op = 1;
  }
  log('beat 4 · guard waits');
  tween(B.cabinSettle.ms, t => SETS.cabin.cam.z = lerp(B.cabinSettle.fromZoom, 1, t), B.cabinSettle.ease);
  setTimeout(() => bubble('Code please.', 'I sent it to +91 ' + maskPhone(S.phone) + '.', 20, 26), reduced ? 0 : 500);
}
function maskPhone(p) { return p.slice(0, 2) + '••• ••' + p.slice(7); }
function gaze(n) { $('gEyes').setAttribute('transform', `translate(${-4 + n * 1.6} 2)`); }

async function guardNod() {
  const h = $('gHead');
  for (let i = 0; i < 2; i++) {
    await tween(MOTION.beats.guardNod.ms / 2, t => h.setAttribute('transform', `translate(0 ${5 * t}) rotate(${-3 * t} 200 246)`), 'out');
    await tween(MOTION.beats.guardNod.ms / 2, t => h.setAttribute('transform', `translate(0 ${5 * (1 - t)}) rotate(${-3 * (1 - t)} 200 246)`), 'inOut');
  }
}
async function guardDeny() {
  haptic('error'); log('beat 5 · wrong OTP');
  const h = $('gHead');
  $('gMouth').setAttribute('d', 'M192 237q8 -3 16 0');
  await tween(MOTION.beats.guardDeny.ms, t => h.setAttribute('transform', `rotate(${-10 * Math.sin(t * Math.PI)} 200 246)`), 'linear');
  $('gMouth').setAttribute('d', 'M191 235q9 6 18 0');
}
async function beatApprove() {
  const B = MOTION.beats;
  log('beat 6 · approved');
  $('gArm').style.display = 'none';
  const lines = { nonmygate: ['First time here?', 'Let me sign you in.'], resident: ['Good to see you, Arjun.', 'Going up to B-1204?'], returning: ['Welcome back, Riya.', 'Straight up you go.'] };
  bubble(lines[seg][0], lines[seg][1], 20, 26);
  await guardNod();
  await sleep(B.lineHold.ms - B.guardNod.ms);
  hideBubble();
  if (seg === 'returning') return whipToDoor();
  if (seg === 'resident') $('inName').value = 'Arjun Mehta';
  panel('lift'); onName(); S.busy = false;            // next field usable while the camera keeps moving
  tween(B.boomLift.ms, t => $('boom').setAttribute('transform', `rotate(${-80 * t} 386 339)`), B.boomLift.ease);
  const c = SETS.cabin.cam;
  await tween(B.panToLobby.ms, t => { c.x = lerp(0, B.panToLobby.dx, t); c.y = lerp(0, -10, t); }, B.panToLobby.ease);
  await tween(B.glassDoors.ms, t => { $('glassL').setAttribute('transform', `translate(${-86 * t} 0)`); $('glassR').setAttribute('transform', `translate(${86 * t} 0)`); }, B.glassDoors.ease);
  resetCam('lift', { z: 1.12 }); setLiftDoors(1);
  c.cx = 195; c.cy = 300;
  if (reduced) { SETS.lift.cam.z = 1; await crossfade('cabin', 'lift'); }
  else {
    await tween(B.lobbyPush.ms, t => {
      c.z = lerp(1, B.lobbyPush.zoom, t);
      if (t > B.lobbyPush.crossfadeAt) { const u = (t - B.lobbyPush.crossfadeAt) / (1 - B.lobbyPush.crossfadeAt); SETS.cabin.op = 1 - u; SETS.lift.op = u; }
    }, B.lobbyPush.ease);
    SETS.cabin.op = 0; SETS.lift.op = 1;
  }
  log('beat 7 · into the lift');
  const l = SETS.lift.cam;
  tween(B.liftDoorsClose.ms, t => l.z = lerp(1.12, 1, t), 'out');
  await tween(B.liftDoorsClose.ms, t => setLiftDoors(1 - t), B.liftDoorsClose.ease);
}
async function whipToDoor() {
  log('returning · whip-pan to the door');
  prepCorridor('Riya');
  resetCam('corr', { x: -160 });
  const c = SETS.cabin.cam;
  if (reduced) { resetCam('corr'); await crossfade('cabin', 'corr'); }
  else {
    await tween(MOTION.beats.whipPan.ms, t => {
      c.x = lerp(0, 500, t);
      if (t > .4) { const u = (t - .4) / .6; SETS.cabin.op = 1 - u; SETS.corr.op = u; SETS.corr.cam.x = lerp(-160, 0, EASE.out(u)); }
    }, 'in');
    SETS.cabin.op = 0; SETS.corr.op = 1;
  }
  await openDoorFully(false, true);
  finish('Welcome home, Riya');
}
function prepCorridor(plate) {
  resetCam('corr', { z: MOTION.beats.corridorSettle.fromZoom, cy: 260 });
  $('kPlate').textContent = plate; $('kPlateClip').setAttribute('width', 0);
  door.chain = 'none'; door.hang = 0; setDoor(0); setRes(300);
}
async function beatAscent() {
  const B = MOTION.beats;
  log('beat 9 · ascent');
  const l = SETS.lift.cam, disp = $('liftDisp');
  $('liftArrow').setAttribute('opacity', 1);
  $('liftBeyond').setAttribute('opacity', 0); $('liftBeyondCorr').setAttribute('opacity', 1);
  const st = $('liftStripes'); st.setAttribute('opacity', .8);
  const name = S.name.trim().split(' ')[0];
  await tween(B.ascent.ms, t => {
    const f = Math.min(B.ascent.floors, Math.floor(t * (B.ascent.floors + 1)));
    disp.textContent = f === 0 ? 'G' : String(f).padStart(2, ' ');
    st.setAttribute('transform', `translate(0 ${(t * 900) % 330})`);
    l.sy = reduced ? 0 : Math.sin(t * 60) * 1.4 * Math.sin(t * Math.PI);
  }, 'inOut');
  l.sy = 0; st.setAttribute('opacity', 0); $('liftArrow').setAttribute('opacity', .35);
  log('ding'); haptic('light');
  const ding = $('liftDing');
  tween(500, t => { ding.setAttribute('r', 20 + 30 * t); ding.setAttribute('opacity', 1 - t); }, 'out');
  disp.textContent = 'Hi, ' + name.slice(0, 7);
  await sleep(200);
  log('beat 10 · corridor');
  await tween(B.liftDoorsOpen.ms, t => setLiftDoors(t), B.liftDoorsOpen.ease);
  prepCorridor(seg === 'resident' ? 'B-1204' : name);
  if (seg !== 'resident') { panel('door'); onEmail(); }
  l.cx = 195; l.cy = 260;
  if (reduced) { SETS.corr.cam.z = 1; await crossfade('lift', 'corr'); }
  else {
    await tween(B.corridorPush.ms, t => {
      l.z = lerp(1, B.corridorPush.zoom, t);
      if (t > B.corridorPush.crossfadeAt) { const u = (t - B.corridorPush.crossfadeAt) / (1 - B.corridorPush.crossfadeAt); SETS.lift.op = 1 - u; SETS.corr.op = u; }
    }, B.corridorPush.ease);
    SETS.lift.op = 0; SETS.corr.op = 1;
  }
  tween(B.corridorSettle.ms, t => SETS.corr.cam.z = lerp(B.corridorSettle.fromZoom, 1, t), B.corridorSettle.ease);
  await tween(B.engrave.ms, t => $('kPlateClip').setAttribute('width', 70 * t), B.engrave.ease);
  if (seg === 'resident') { await sleep(250); await openDoorFully(false); return finish('Welcome home, Arjun'); }
}
async function beatRing() {
  const B = MOTION.beats;
  log('beat 11 · bell, door on the chain');
  const rp = $('kRipple');
  tween(B.bellRing.ms, t => { rp.setAttribute('r', 8 + 26 * t); rp.setAttribute('opacity', 1 - t); }, 'out');
  await sleep(380); haptic('light'); await sleep(160); haptic('light');
  setRes(300); door.chain = 'taut'; door.hang = 0;
  await tween(B.doorAjar.ms, t => setDoor(B.doorAjar.deg * t), B.doorAjar.ease);
  $('kFingers').setAttribute('opacity', 1);
  await tween(B.peek.ms, t => setRes(lerp(296, 268, t)), B.peek.ease);
  bubble('Hi ' + S.name.trim().split(' ')[0] + '! Code please.', "It's in " + maskEmail(S.email), 150, 52, 'br');
}
function maskEmail(e) { const [u, d] = e.split('@'); return u.charAt(0) + '•••@' + d; }
async function emailDeny() {
  haptic('error'); log('beat 12 · wrong email OTP');
  $('kResEyes').setAttribute('transform', 'translate(0 234) scale(1 .45) translate(0 -234)');
  $('kResMouth').setAttribute('d', 'M-6 246q6 -3 12 0');
  await tween(MOTION.beats.emailDeny.ms, t => { door.hang = 0; SETS.corr.cam.sy = 0; $('kChain').setAttribute('transform', `translate(0 ${Math.sin(t * Math.PI * 6) * 2.5})`); }, 'linear');
  $('kChain').setAttribute('transform', '');
  await sleep(500);
  $('kResEyes').setAttribute('transform', ''); $('kResMouth').setAttribute('d', 'M-8 244q8 7 16 0');
}
async function openDoorFully(chained, quick = false) {
  const B = MOTION.beats;
  log('beat 13 · door opens');
  if (chained) {
    hideBubble();
    await tween(B.unchain.ms, t => { door.hang = t; drawChain(); }, B.unchain.ease);
  }
  $('kFingers').setAttribute('opacity', 0);
  haptic('success');
  const from = door.deg;
  await tween(B.doorOpen.ms, t => { setDoor(lerp(from, B.doorOpen.deg, t)); setRes(lerp(chained ? 268 : 300, 214, t)); }, B.doorOpen.ease);
  const arm = $('kResArm');
  (async () => { for (let i = 0; i < 4; i++) { await tween(260, t => arm.setAttribute('transform', `rotate(${-14 + 30 * t} 24 288)`), 'inOut'); await tween(260, t => arm.setAttribute('transform', `rotate(${16 - 30 * t} 24 288)`), 'inOut'); } arm.setAttribute('transform', ''); })();
  if (quick) return;                                   // returning users: no bubble, no push-in
  bubble('Welcome home, ' + (seg === 'resident' ? 'Arjun' : (S.name.trim().split(' ')[0] || 'Riya')) + '.', 'Come on in.', 24, 40);
  await sleep(700);
  hideBubble();
  const c = SETS.corr.cam; c.cx = 190; c.cy = 200;
  await tween(B.homePush.ms, t => { c.z = lerp(1, B.homePush.zoom, t); setRes(lerp(214, 262, t)); $('flash').style.opacity = .3 * t; }, B.homePush.ease);
}
async function finish(text) {
  $('doneText').textContent = text;
  panel('done');
  const d = $('p-done'); d.classList.remove('pop'); void d.offsetWidth; setTimeout(() => d.classList.add('pop'), 120);
  log('done · hold ' + MOTION.beats.doneHold.ms + ' ms');
  await sleep(MOTION.beats.doneHold.ms);
  log('→ app (Home or deep-linked listing)');
  S.busy = false;
}

/* ---------------- card wiring ---------------- */
const api = (ms = 450) => sleep(ms);
function setBusy(btn, on) { btn.classList.toggle('busy', on); btn.disabled = on || btn.dataset.ok !== '1'; }

$('inPhone').addEventListener('input', onPhone);
function onPhone() {
  let v = $('inPhone').value.replace(/\D/g, ''); if (v.length > 10) v = v.slice(-10);
  S.phone = v;
  $('inPhone').value = v.length > 5 ? v.slice(0, 5) + ' ' + v.slice(5) : v;
  $('mPhone').textContent = ''; $('fPhone').className = 'field' + (v.length === 10 ? ' ok' : '');
  paintStrip(v.length, v.length === 10 ? 'ok' : '');
  SETS.gate.cam.z = 1 + v.length * 0.01 * (reduced ? 0 : 1); SETS.gate.cam.cy = 320;
  const b = $('bGate'); b.dataset.ok = v.length === 10 ? '1' : '0'; b.disabled = v.length !== 10;
}
$('bGate').addEventListener('click', async () => {
  if (S.busy) return;
  if (!/^[6-9]/.test(S.phone)) {
    $('mPhone').textContent = 'Enter a valid 10-digit mobile number.'; $('fPhone').className = 'field bad'; paintStrip(10, 'bad'); haptic('error');
    const gp = $('gatePanel'); await tween(400, t => gp.setAttribute('transform', `translate(${Math.sin(t * Math.PI * 5) * 6 * (1 - t)} 0)`), 'linear'); gp.setAttribute('transform', '');
    return;
  }
  S.busy = true; setBusy($('bGate'), true); log('send-otp');
  await api();
  setBusy($('bGate'), false);
  $('sPhone').textContent = '+91 ' + S.phone.slice(0, 5) + ' ' + S.phone.slice(5);
  S.anim = beatGateOpen();
  setTimeout(() => { panel('guard'); renderOtp('oOtp', ''); gaze(0); }, reduced ? 0 : 700);
  S.busy = false; await S.anim;
});
function renderOtp(id, v, state) {
  const o = $(id); o.classList.remove('ok', 'bad'); if (state) o.classList.add(state);
  o.querySelectorAll('.bx').forEach((b, i) => { b.textContent = v.charAt(i); b.classList.toggle('cur', !state && i === v.length); });
}
$('inOtp').addEventListener('input', async () => {
  const el = $('inOtp'); const v = el.value.replace(/\D/g, '').slice(0, 6); el.value = v;
  renderOtp('oOtp', v); gaze(v.length);
  if (v.length < 6 || S.busy) return;
  S.busy = true; log('verify-otp'); await S.anim;
  $('gHead').setAttribute('transform', 'rotate(4 200 246)');
  await api(500);
  $('gHead').setAttribute('transform', '');
  if (v === '000000') {
    S.otpTries++;
    renderOtp('oOtp', v, 'bad'); $('oOtp').classList.add('shake');
    await guardDeny();
    $('oOtp').classList.remove('shake'); el.value = ''; renderOtp('oOtp', ''); gaze(0);
    if (S.otpTries >= 3) {
      log('lockout'); $('gArm').style.display = 'none'; $('gCross').setAttribute('opacity', 1); $('cabinDim').setAttribute('opacity', .35);
      bubble('Too many tries.', 'Wait a moment, then try again.', 20, 26);
      let s = 30; $('mOtp').className = 'msg err'; el.disabled = true;
      const iv = setInterval(() => { s--; $('mOtp').textContent = 'Too many attempts. Try again in 0:' + String(s).padStart(2, '0'); if (s <= 0 || stage !== 'guard') { clearInterval(iv); el.disabled = false; S.otpTries = 0; $('mOtp').className = 'msg mut'; $('mOtp').textContent = 'Resend code'; $('gCross').setAttribute('opacity', 0); $('gArm').style.display = ''; $('cabinDim').setAttribute('opacity', 0); hideBubble(); } }, reduced ? 50 : 1000);
      $('mOtp').textContent = 'Too many attempts. Try again in 0:30';
    } else { $('mOtp').className = 'msg err'; const left = 3 - S.otpTries; $('mOtp').textContent = "That code doesn't match. " + left + (left === 1 ? ' try left.' : ' tries left.'); }
    S.busy = false; return;
  }
  renderOtp('oOtp', v, 'ok'); $('mOtp').className = 'msg ok'; $('mOtp').textContent = 'Number verified';
  await S.anim;
  S.anim = beatApprove(); await S.anim;
});
$('bChangeNum').addEventListener('click', async () => {
  if (S.busy) return; S.busy = true; await S.anim; hideBubble(); log('back · to the gate');
  resetCam('gate', { z: 1.6, cy: 320 }); $('gatePanel').setAttribute('transform', '');
  await tween(MOTION.beats.back.ms, t => { SETS.cabin.op = 1 - t; SETS.gate.op = t; SETS.gate.cam.z = lerp(1.6, 1, t); }, 'out');
  SETS.cabin.op = 0; panel('gate'); S.busy = false;
});
$('inName').addEventListener('input', onName);
function onName() {
  const v = $('inName').value; S.name = v;
  const c = v.trim(); const ok = c.length >= 2 && c.length <= 50 && /^[A-Za-z .'-]+$/.test(c);
  $('fName').className = 'field' + (v && !ok ? ' bad' : '');
  $('liftDisp').textContent = ok ? ('Hi, ' + c.split(' ')[0]).slice(0, 11) : 'G';
  S.nameOk = ok; liftReady();
}
document.querySelectorAll('.intent').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.intent').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
  S.intent = b.dataset.i;
  ['lbRent', 'lbBuy'].forEach(i => $(i).style.fill = 'var(--c-lift-button)');
  $({ rent: 'lbRent', buy: 'lbBuy' }[S.intent]).style.fill = 'var(--c-amber)';
  log('intent · ' + S.intent); liftReady();
}));
function liftReady() { const b = $('bLift'); const ok = S.nameOk && !!S.intent; b.dataset.ok = ok ? '1' : '0'; b.disabled = !ok; }
$('bLift').addEventListener('click', async () => {
  if (S.busy) return; S.busy = true; setBusy($('bLift'), true); log('PATCH profile');
  await api(); await S.anim; setBusy($('bLift'), false);
  S.anim = beatAscent(); S.busy = false; await S.anim;
});
$('inEmail').addEventListener('input', onEmail);
const PERSONAL = ['gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'rediffmail.com', 'proton.me', 'protonmail.com', 'aol.com', 'zoho.com'];
const BLOCKED = ['housing.com', 'magicbricks.com', '99acres.com', 'nobroker.in', 'squareyards.com', 'proptiger.com'];
function onEmail() {
  const v = $('inEmail').value.trim().toLowerCase(); S.email = v;
  const m = /^[^\s@]+@([^\s@]+\.[^\s@]{2,})$/.exec(v);
  let verdict = 'NONE';
  if (m) { const d = m[1]; verdict = PERSONAL.includes(d) ? 'PERSONAL' : BLOCKED.some(b => d === b || d.endsWith('.' + b)) ? 'BLOCKED' : 'ALLOW'; }
  const msg = $('mEmail');
  msg.className = 'msg ' + (verdict === 'ALLOW' ? 'ok' : verdict === 'NONE' ? '' : 'err');
  msg.textContent = verdict === 'ALLOW' ? 'Work email recognised' : verdict === 'PERSONAL' ? 'That looks like a personal email. Use the one you use at work.' : verdict === 'BLOCKED' ? "We can't accept this email domain." : '';
  $('fEmail').className = 'field' + (verdict === 'ALLOW' ? ' ok' : verdict === 'NONE' ? '' : ' bad');
  const glow = verdict === 'ALLOW';
  $('kBellGlow').setAttribute('opacity', glow ? .9 : 0); $('kBell').style.fill = glow ? 'var(--c-lamp-bulb)' : 'var(--c-unlit)';
  const b = $('bRing'); b.dataset.ok = glow ? '1' : '0'; b.disabled = !glow;
}
$('bRing').addEventListener('click', async () => {
  if (S.busy) return; S.busy = true; setBusy($('bRing'), true); log('send-email-otp');
  await api(); await S.anim; setBusy($('bRing'), false);
  $('sEmail').textContent = maskEmail(S.email);
  S.anim = beatRing();
  setTimeout(() => { panel('dotp'); renderOtp('oEotp', ''); }, reduced ? 0 : 900);
  S.busy = false; await S.anim;
});
$('inEotp').addEventListener('input', async () => {
  const el = $('inEotp'); const v = el.value.replace(/\D/g, '').slice(0, 6); el.value = v;
  renderOtp('oEotp', v);
  $('kResEyes').setAttribute('transform', `translate(${-2 + v.length * .7} 1)`);
  if (v.length < 6 || S.busy) return;
  S.busy = true; log('verify-email-otp');
  await api(500); await S.anim;
  if (v === '000000') {
    S.eTries++;
    renderOtp('oEotp', v, 'bad'); $('oEotp').classList.add('shake');
    await emailDeny();
    $('oEotp').classList.remove('shake'); el.value = ''; renderOtp('oEotp', '');
    $('mEotp').className = 'msg err'; const el2 = Math.max(0, 3 - S.eTries); $('mEotp').innerHTML = "That code doesn't match. " + el2 + (el2 === 1 ? ' try left.' : ' tries left.') + ' · <button class="link" id="bChangeEmail">Change email</button>';
    S.busy = false; return;
  }
  renderOtp('oEotp', v, 'ok');
  await openDoorFully(true);
  await finish('Your work email is verified');
});
document.addEventListener('click', async e => {
  if (e.target.id !== 'bChangeEmail' || S.busy) return;
  S.busy = true; await S.anim; hideBubble(); log('back · change email');
  await tween(MOTION.beats.back.ms, t => setDoor(MOTION.beats.doorAjar.deg * (1 - t)), 'inOut');
  door.chain = 'none'; setDoor(0); setRes(300); $('kFingers').setAttribute('opacity', 0);
  $('inEotp').value = ''; panel('door'); S.busy = false;
});

/* ---------------- run control ---------------- */
function start() {
  t0 = performance.now(); $('log').innerHTML = '';
  resetState(); initWorld();
  ['inPhone', 'inOtp', 'inName', 'inEmail', 'inEotp'].forEach(i => { $(i).value = ''; $(i).disabled = false; });
  document.querySelectorAll('.intent').forEach(x => x.setAttribute('aria-pressed', 'false'));
  ['mPhone', 'mEmail'].forEach(i => $(i).textContent = '');
  $('mOtp').className = 'msg mut'; $('mOtp').textContent = 'Resend code in 0:30';
  $('mEotp').className = 'msg mut'; $('mEotp').innerHTML = 'Resend in 0:30 · <button class="link" id="bChangeEmail">Change email</button>';
  onPhone(); S.nameOk = false; liftReady();
  const card = $('card'); card.style.height = '';
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('on', 'enter'));
  panel('gate'); card.style.height = '';
  log('beat 1 · arrival (idle)');
}
async function typeInto(id, text, gap = 85) { const el = $(id); el.focus({ preventScroll: true }); for (const ch of text) { if (autoRun !== myAuto) return; el.value += ch; el.dispatchEvent(new Event('input')); await new Promise(r => setTimeout(r, reduced ? 10 : gap)); } }
const waitStage = s => new Promise(r => { const iv = setInterval(() => { if (stage === s && !S.busy) { clearInterval(iv); r(); } }, 80); });
let autoRun = 0, myAuto = 0;
async function autoplay() {
  start(); myAuto = ++autoRun;
  await new Promise(r => setTimeout(r, 900));
  await typeInto('inPhone', '9876543210'); await new Promise(r => setTimeout(r, 300)); if (autoRun !== myAuto) return;
  $('bGate').click();
  await waitStage('guard'); await new Promise(r => setTimeout(r, 600));
  await typeInto('inOtp', '482913', 140);
  if (seg === 'returning') return;
  await waitStage('lift'); await new Promise(r => setTimeout(r, 400));
  if (seg !== 'resident') await typeInto('inName', 'Riya Kapoor', 70);
  await new Promise(r => setTimeout(r, 300)); document.querySelector('.intent[data-i="rent"]').click();
  await new Promise(r => setTimeout(r, 500)); if (autoRun !== myAuto) return; $('bLift').click();
  if (seg === 'resident') return;
  await waitStage('door'); await new Promise(r => setTimeout(r, 400));
  await typeInto('inEmail', 'riya@acme.com', 70); await new Promise(r => setTimeout(r, 500)); if (autoRun !== myAuto) return;
  $('bRing').click();
  await waitStage('dotp'); await new Promise(r => setTimeout(r, 900));
  await typeInto('inEotp', '305718', 140);
}
document.querySelectorAll('input[name=seg]').forEach(r => r.addEventListener('change', () => { seg = r.value; autoRun++; start(); }));
$('bReplay').addEventListener('click', () => { autoRun++; start(); });
$('bAuto').addEventListener('click', autoplay);
$('cReduced').addEventListener('change', e => { reduced = e.target.checked; document.body.classList.toggle('reduced', reduced); autoRun++; start(); });
$('phone').addEventListener('pointermove', e => { const r = $('phone').getBoundingClientRect(); tilt.tx = ((e.clientX - r.left) / r.width - .5) * 2; tilt.ty = ((e.clientY - r.top) / r.height - .5) * 2; });
$('phone').addEventListener('pointerleave', () => { tilt.tx = 0; tilt.ty = 0; });
try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) { reduced = true; $('cReduced').checked = true; document.body.classList.add('reduced'); } } catch (e) {}
function fit() { const s = Math.min(1, (innerHeight - 48) / 844, (innerWidth - 32) / 390); document.documentElement.style.setProperty('--s', Math.max(.5, s)); }
addEventListener('resize', fit); fit();
start(); requestAnimationFrame(render);
