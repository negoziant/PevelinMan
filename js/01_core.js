'use strict';
// ПЕЛЕВИН: БЕЗ БЛЁРБА — шуточный платформер, форк «Гали Мен». Один файл, без зависимостей.
const F = {};   // кадры спрайтов: [x, y, w, h, якорь x, якорь y] в атласе, который рисуется при запуске
const W = 800, H = 450, FY = 386, FYB = 398;
const TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
if (TOUCH) document.body.classList.add('touch');

// ---------- utils ----------
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sign = v => v < 0 ? -1 : 1;
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---------- canvases ----------
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const buf = document.createElement('canvas'); buf.width = W; buf.height = H;
const g = buf.getContext('2d'); g.imageSmoothingEnabled = false;
let K = 1;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const portrait = innerHeight > innerWidth;
  const availH = portrait ? innerHeight * 0.6 : innerHeight;
  const s = Math.min(innerWidth / W, availH / H);
  const cw = Math.max(160, Math.floor(W * s)), ch = Math.max(90, Math.floor(H * s));
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
  cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
  K = cv.width / W;
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 250));
resize();

function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }

// ---------- input ----------
const held = {}, pressed = {};
let anyPress = false, zPress = false;
const KEYMAP = {
  ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R',
  ArrowUp: 'J', KeyW: 'J', Space: 'J', KeyZ: 'J',
  KeyX: 'A', KeyJ: 'A', KeyK: 'A', KeyF: 'A', ControlLeft: 'A', ControlRight: 'A',
  ArrowDown: 'D', KeyS: 'D', Enter: 'S', NumpadEnter: 'S', KeyM: 'M', KeyP: 'P', Escape: 'P'
};
function press(k) { if (!held[k]) pressed[k] = true; held[k] = true; if (k !== 'M' && k !== 'P') anyPress = true; audioInit(); }
function release(k) { held[k] = false; }
addEventListener('keydown', e => {
  const k = KEYMAP[e.code];
  if (k) { e.preventDefault(); if (!e.repeat) press(k); }
  if (e.code === 'KeyZ' && !e.repeat) zPress = true; // только Z, не пробел: шанс на «Z! Z! ZZZ!»
});
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) { e.preventDefault(); release(k); } });
addEventListener('blur', () => { for (const k in held) held[k] = false; });
const hit = k => !!pressed[k];
const down = k => !!held[k];

// touch buttons
function bindBtn(el, k) {
  const on = e => { e.preventDefault(); el.classList.add('on'); press(k); };
  const off = e => { e.preventDefault(); el.classList.remove('on'); release(k); };
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
}
bindBtn(document.getElementById('bj'), 'J');
bindBtn(document.getElementById('ba'), 'A');
bindBtn(document.getElementById('bd'), 'D');
(function () {
  const el = document.getElementById('dpad'); let pid = null;
  const set = e => {
    const r = el.getBoundingClientRect(); const left = (e.clientX - r.left) < r.width / 2;
    if (left) { if (!held.L) press('L'); release('R'); } else { if (!held.R) press('R'); release('L'); }
    el.classList.add('on');
  };
  el.addEventListener('pointerdown', e => { e.preventDefault(); pid = e.pointerId; try { el.setPointerCapture(pid); } catch (_) { } set(e); });
  el.addEventListener('pointermove', e => { if (e.pointerId === pid) { e.preventDefault(); set(e); } });
  const end = e => { if (e.pointerId === pid) { pid = null; release('L'); release('R'); el.classList.remove('on'); } };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
})();
document.getElementById('bm').addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); toggleMute(); });
// tap / click on the game itself
let tapX = -1, tapY = -1;
cv.addEventListener('pointerdown', e => {
  e.preventDefault(); audioInit();
  const r = cv.getBoundingClientRect();
  tapX = (e.clientX - r.left) / r.width * W; tapY = (e.clientY - r.top) / r.height * H;
  pressed.T = true; anyPress = true;
  if (e.pointerType === 'mouse') press('A');
});
cv.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') release('A'); });
addEventListener('contextmenu', e => e.preventDefault());

// ---------- audio ----------
let AC = null, master, musG, sfxG, noiseBuf, muted = false, song = null, wantSong = null;
const N2F = {};
['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].forEach((n, i) => { for (let o = 1; o <= 7; o++) N2F[n + o] = 440 * Math.pow(2, (o - 4) + (i - 9) / 12); });
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; return; }
  master = AC.createGain(); master.gain.value = muted ? 0 : 0.55; master.connect(AC.destination);
  musG = AC.createGain(); musG.gain.value = 0.5; musG.connect(master);
  sfxG = AC.createGain(); sfxG.gain.value = 0.9; sfxG.connect(master);
  noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  if (wantSong) { const s = wantSong; wantSong = null; playSong(s); }
}
function toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.55; document.getElementById('bm').style.opacity = muted ? .4 : 1; }
function tn(type, f0, f1, dur, vol, when, dest) {
  if (!AC) return; const t = AC.currentTime + (when || 0);
  const o = AC.createOscillator(), gn = AC.createGain(); o.type = type;
  o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(gn); gn.connect(dest || sfxG); o.start(t); o.stop(t + dur + 0.03);
}
function nz(when, dur, vol, type, f0, f1, q, dest) {
  if (!AC) return; const t = AC.currentTime + (when || 0);
  const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f0, t);
  if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur); fl.Q.value = q || 0.7;
  const gn = AC.createGain(); gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  s.connect(fl); fl.connect(gn); gn.connect(dest || sfxG); s.start(t, Math.random() * 0.8); s.stop(t + dur + 0.03);
}
function wail(dur, f0, f1, vol, vibHz, vibDepth, when) {
  if (!AC) return; const t = AC.currentTime + (when || 0);
  const o = AC.createOscillator(), o2 = AC.createOscillator(), gn = AC.createGain(), lfo = AC.createOscillator(), lg = AC.createGain(), bp = AC.createBiquadFilter();
  o.type = 'sawtooth'; o2.type = 'square';
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  o2.frequency.setValueAtTime(f0 * 1.01, t); o2.frequency.exponentialRampToValueAtTime(f1 * 1.01, t + dur);
  lfo.frequency.value = vibHz; lg.gain.value = vibDepth; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
  bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 0.8;
  gn.gain.setValueAtTime(0.0008, t); gn.gain.linearRampToValueAtTime(vol, t + 0.03);
  gn.gain.setValueAtTime(vol, t + dur * 0.75); gn.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(bp); o2.connect(bp); bp.connect(gn); gn.connect(sfxG);
  o.start(t); o2.start(t); lfo.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
}
const sfx = {
  jump() { tn('square', 280, 640, .13, .1); },
  swing() { nz(0, .13, .22, 'bandpass', 500, 2800, 1.2); },
  bonk() { [523, 1318, 2217].forEach((f, i) => tn('sine', f, f * .985, .34 - i * .08, .2 / (i + 1))); tn('triangle', 190, 90, .1, .3); },
  squeak() { tn('sine', 1700, 2700, .06, .16); tn('sine', 2700, 1250, .11, .16, .06); },
  hat() { tn('square', 988, 988, .07, .09); tn('square', 1319, 1319, .15, .09, .07); },
  hurt() { tn('sawtooth', 430, 100, .3, .2); nz(0, .1, .2, 'lowpass', 1200, 300); },
  blip() { tn('square', 720, 720, .035, .05); },
  blip2() { tn('square', 1100, 1100, .03, .04); },
  click() { nz(0, .03, .3, 'highpass', 3000); tn('square', 620, 930, .09, .1, .02); },
  laugh(n, base, vol) { n = n || 5; base = base || 600; for (let i = 0; i < n; i++) { const f = base - i * 24 + (i % 2) * 40; tn('sawtooth', f, f * .72, .085, vol || .15, i * .105); tn('square', f * 2, f * 1.5, .05, .04, i * .105); } },
  maniac() { for (let i = 0; i < 13; i++) { const f = 420 + Math.sin(i * .9) * 160 + i * 18; tn('sawtooth', f, f * .7, .08, .17, i * .09); tn('square', f * 2.01, f * 1.4, .05, .05, i * .09); } },
  thud() { tn('sine', 115, 38, .26, .55); nz(0, .16, .3, 'lowpass', 420, 90); },
  gate() { nz(0, 1.0, .32, 'lowpass', 320, 110); tn('square', 64, 58, 1.0, .07); },
  heal() { [523, 659, 784, 1047].forEach((f, i) => tn('triangle', f, f, .11, .18, i * .07)); },
  buzz() { tn('square', 112, 100, .32, .16); tn('square', 119, 105, .32, .16); },
  select() { tn('square', 660, 660, .05, .08); },
  ok() { tn('square', 660, 660, .07, .09); tn('square', 990, 990, .14, .09, .07); },
  boom() { nz(0, 1.1, .8, 'lowpass', 2000, 50); tn('sine', 95, 22, .9, .7); nz(.05, .5, .4, 'bandpass', 700, 200, 2); },
  zap() { nz(0, .12, .12, 'highpass', 5000); tn('sawtooth', 1800, 300, .1, .06); },
  paper() { nz(0, .09, .22, 'highpass', 2600, 6000); },
  whoosh() { nz(0, .25, .25, 'bandpass', 400, 2600, 2); },
  stamp() { tn('square', 150, 60, .12, .3); nz(0, .08, .3, 'lowpass', 900, 200); },
  shout() { wail(.32, 760, 560, .17, 24, 50); nz(0, .3, .1, 'bandpass', 1800, 1200, 3); },
  typewriter() { for (let i = 0; i < 4; i++) { nz(i * .07, .02, .25, 'highpass', 3500); } tn('sine', 1800, 1800, .1, .08, .3); }
};

// music: tiny step sequencer. note format "A4:2" (len in 16ths), "-" = rest
const seq = s => s.trim().split(/\s+/).map(t => { const p = t.split(':'); return [p[0], +p[1] || 2]; });
const bassLine = roots => seq(roots.map(r => { const up = r[0] + (r.length === 3 ? r[1] : '') + (+r[r.length - 1] + 1); return (r + ':2 ' + up + ':2 ').repeat(4); }).join(' '));
const SONGS = {
  level: {
    bpm: 150, loop: true, tr: [
      { w: 'square', v: .075, s: seq('A4:2 C5:2 E5:2 A5:2 G5:2 E5:2 C5:2 E5:2 F5:6 E5:2 D5:2 C5:2 D5:4 G4:2 B4:2 D5:2 G5:2 F5:2 D5:2 B4:2 D5:2 E5:6 D5:2 C5:2 B4:2 G#4:4 A5:4 E5:4 A5:2 G5:2 E5:4 F5:4 D5:4 F5:2 E5:2 D5:4 C5:2 F5:2 A5:2 C6:2 A5:2 F5:2 C5:2 F5:2 E5:2 G#5:2 B5:2 E6:6 -:4') },
      { w: 'triangle', v: .2, s: bassLine(['A2', 'F2', 'G2', 'E2', 'A2', 'D2', 'F2', 'E2']) }
    ], dr: 'k.h.s.h.k.k.s.h.'
  },
  boss: {
    bpm: 172, loop: true, tr: [
      { w: 'square', v: .075, s: seq('B4:4 E5:4 G5:4 F#5:2 E5:2 C5:4 E5:4 G5:4 E5:2 C5:2 D5:4 F#5:4 A5:4 G5:2 F#5:2 B4:2 D#5:2 F#5:2 B5:6 -:4 E5:2 E5:2 G5:2 E5:2 B5:4 G5:4 C5:2 C5:2 E5:2 C5:2 G5:4 E5:4 D5:2 D5:2 F#5:2 D5:2 A5:4 F#5:4 B5:2 A5:2 G5:2 F#5:2 D#5:4 B4:4') },
      { w: 'sawtooth', v: .07, s: seq(['E2', 'C2', 'D2', 'B1', 'E2', 'C2', 'D2', 'B1'].map(r => (r + ':1 -:1 ' + r + ':1 ' + r + ':1 ').repeat(4)).join(' ')) }
    ], dr: 'k.hhs.h.kkh.s.hh'
  },
  dance: {
    bpm: 168, loop: true, tr: [
      { w: 'square', v: .09, s: seq('A4:1 C5:1 E5:1 C5:1 A4:1 C5:1 E5:2 D5:1 F5:1 A5:1 F5:1 D5:1 F5:1 A5:2 E5:1 G#5:1 B5:1 G#5:1 E5:1 G#5:1 B5:2 A5:2 E5:2 A5:2 -:2') },
      { w: 'triangle', v: .22, s: seq('A2:2 E3:2 A2:2 E3:2 D3:2 A3:2 D3:2 A3:2 E3:2 B3:2 E3:2 B3:2 A2:2 E3:2 A2:2 E3:2') }
    ], dr: 'k.s.k.s.'
  },
  win: {
    bpm: 132, loop: false, tr: [
      { w: 'square', v: .1, s: seq('C5:2 E5:2 G5:2 C6:4 G5:2 C6:2 E6:8') },
      { w: 'triangle', v: .2, s: seq('C3:6 G3:4 C3:2 C4:10') }
    ]
  },
  sad: {
    bpm: 62, loop: true, tr: [
      { w: 'sine', v: .16, dec: 1, s: seq('E5:4 C5:4 A4:4 C5:4 D5:4 B4:4 G4:8 F5:4 D5:4 B4:4 D5:4 C5:4 A4:4 E4:8') },
      { w: 'triangle', v: .12, s: seq('A2:16 G2:16 F2:16 E2:16') }
    ]
  }
};
function playSong(name) {
  if (!AC) { wantSong = name; return; }
  if (song && song.name === name) return;
  stopSong(); if (!name) return;
  const d = SONGS[name], gn = AC.createGain(); gn.connect(musG);
  const t0 = AC.currentTime + 0.06;
  song = { name, d, g: gn, step: 60 / d.bpm / 4, tr: d.tr.map(t => ({ t, i: 0, time: t0 })), dr: d.dr ? { i: 0, time: t0 } : null };
}
function stopSong() {
  wantSong = null;
  if (song && AC) { const o = song; o.g.gain.setTargetAtTime(0, AC.currentTime, 0.03); setTimeout(() => { try { o.g.disconnect(); } catch (e) { } }, 400); }
  song = null;
}
function mnote(type, f, t, dur, v, dest, dec) {
  const o = AC.createOscillator(), gn = AC.createGain(); o.type = type; o.frequency.value = f;
  gn.gain.setValueAtTime(0.0008, t); gn.gain.linearRampToValueAtTime(v, t + 0.008);
  if (dec) gn.gain.exponentialRampToValueAtTime(0.0008, t + dur * 1.6);
  else { gn.gain.setValueAtTime(v, t + Math.max(0.012, dur - 0.025)); gn.gain.linearRampToValueAtTime(0.0008, t + dur); }
  o.connect(gn); gn.connect(dest); o.start(t); o.stop(t + dur * (dec ? 1.7 : 1) + 0.03);
}
function musicTick() {
  if (!AC || !song) return;
  const now = AC.currentTime, ahead = now + 0.22;
  const lag = now - song.tr[0].time;
  if (lag > 0.25) { for (const tr of song.tr) tr.time += lag + 0.05; if (song.dr) song.dr.time += lag + 0.05; }
  for (const tr of song.tr) {
    while (tr.time < ahead) {
      if (tr.i >= tr.t.s.length) { if (song.d.loop) tr.i = 0; else { tr.time = Infinity; break; } }
      const n = tr.t.s[tr.i++], dur = n[1] * song.step;
      if (n[0] !== '-') mnote(tr.t.w, N2F[n[0]], tr.time, dur * 0.92, tr.t.v, song.g, tr.t.dec);
      tr.time += dur;
    }
  }
  const dr = song.dr;
  if (dr) while (dr.time < ahead) {
    const c = song.d.dr[dr.i++ % song.d.dr.length], t = dr.time - now;
    if (c === 'k') tn('sine', 150, 42, .11, .5, t, song.g);
    else if (c === 's') nz(t, .08, .22, 'highpass', 1800, 0, .7, song.g);
    else if (c === 'h') nz(t, .025, .1, 'highpass', 7000, 0, .7, song.g);
    dr.time += song.step;
  }
}

// ---------- hi-res overlay (text, bubbles) ----------
const OV = [];
function T(s, x, y, o) {
  o = o || {};
  OV.push(c => {
    c.save();
    if (o.rot) { c.translate(x, y); c.rotate(o.rot); c.translate(-x, -y); }
    if (o.a !== undefined) c.globalAlpha = clamp(o.a, 0, 1);
    c.font = (o.size || 10) + 'px PS2P,monospace'; c.textAlign = o.align || 'center'; c.textBaseline = 'middle';
    if (o.stroke) { c.lineJoin = 'round'; c.lineWidth = o.sw || 3; c.strokeStyle = o.stroke; c.strokeText(s, x, y); }
    if (o.shadow) { c.fillStyle = o.shadow; c.fillText(s, x + (o.sd || 2), y + (o.sd || 2)); }
    c.fillStyle = o.color || '#fff'; c.fillText(s, x, y);
    c.restore();
  });
}
function wrap(s, max) {
  const out = []; let cur = '';
  for (const w of String(s).split(' ')) {
    if (cur && (cur + ' ' + w).length > max) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) out.push(cur); return out;
}
// Реплики сначала копятся, потом раскладываются разом: важные первыми, остальные сдвигаются
// вверх, чтобы не перекрывать друг друга. Если места нет, реплика кролика просто не показывается.
const BUBS = [];
function bubble(s, x, y, o) { BUBS.push({ s, x, y, o: o || {} }); }
function flushBubbles(px) {
  BUBS.sort((a, b) => ((b.o.prio || 0) - (a.o.prio || 0)) || (Math.abs(a.x - px) - Math.abs(b.x - px)));
  const placed = []; let small = 0;
  for (const B of BUBS) {
    const o = B.o, size = o.size || 9, lines = wrap(B.s, o.max || 18), low = (o.prio || 0) <= 1;
    const wdt = Math.max.apply(null, lines.map(l => l.length)) * size + 14, hgt = lines.length * (size + 4) + 8;
    let bx = clamp(B.x - wdt / 2, 4, W - wdt - 4), by = Math.max(4, B.y - hgt - 9), ok = false;
    if (low && small >= 3) continue;
    for (let k = 0; k < 7; k++) {
      const hit = placed.find(p => bx < p[0] + p[2] + 6 && bx + wdt + 6 > p[0] && by < p[1] + p[3] + 6 && by + hgt + 6 > p[1]);
      if (!hit) { ok = true; break; }
      by = hit[1] - hgt - 12;
      if (by < 40) break;
    }
    if (!ok) { if (low || (o.prio || 0) < 4) continue; by = Math.max(4, B.y - hgt - 9); }
    placed.push([bx, by, wdt, hgt]); if (low) small++;
    const tipY = Math.max(by + hgt + 10, B.y + 1);
    if (o.shake) { bx += rnd(-o.shake, o.shake); by += rnd(-o.shake, o.shake); }
    const tx = clamp(B.x, bx + 9, bx + wdt - 9), bg = o.bg || '#fff', fg = o.color || '#16161d';
    OV.push(c => {
      c.fillStyle = '#16161d'; c.fillRect(bx - 2, by - 2, wdt + 4, hgt + 4);
      c.beginPath(); c.moveTo(tx - 7, by + hgt + 1); c.lineTo(tx + 7, by + hgt + 1); c.lineTo(tx, tipY); c.fill();
      c.fillStyle = bg; c.fillRect(bx, by, wdt, hgt);
      c.beginPath(); c.moveTo(tx - 4, by + hgt - 1); c.lineTo(tx + 4, by + hgt - 1); c.lineTo(tx, tipY - 5); c.fill();
      c.font = size + 'px PS2P,monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = fg;
      lines.forEach((l, i) => c.fillText(l, bx + wdt / 2, by + 5 + (size + 4) * (i + .5)));
    });
  }
  BUBS.length = 0;
}

// ---------- sprites ----------
let atlas, atlasW, bg2, bgA, bgB;
function spr(name, x, y, flip, o) {
  const f = F[name], img = (o && o.img) || atlas;
  x = Math.round(x); y = Math.round(y);
  const sx = (o && o.sx) || 1, sy = (o && o.sy) || sx, rot = (o && o.rot) || 0;
  if (o && o.a !== undefined) g.globalAlpha = o.a;
  if (!flip && sx === 1 && sy === 1 && !rot) g.drawImage(img, f[0], f[1], f[2], f[3], x - f[4], y - f[5], f[2], f[3]);
  else {
    g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.scale(flip ? -sx : sx, sy);
    g.drawImage(img, f[0], f[1], f[2], f[3], -f[4], -f[5], f[2], f[3]); g.restore();
  }
  if (o && o.a !== undefined) g.globalAlpha = 1;
}
const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

// generated art -------------------------------------------------------
// Все люди в игре нарисованы кодом: «кукла» из прямоугольников + поза.
// Картинок с лицами нет, это карикатуры по мотивам, а не портреты.
const OUTC = '#16161d';
const CASE_COL = [['#9a5a2c', '#6e3d1c', '#c98445'], ['#b02a35', '#7c1a25', '#e0525c'], ['#2f6fa8', '#1f4a74', '#58a0d8'], ['#4d8a4a', '#2f5c30', '#7fbf6d'], ['#7a4fa0', '#50306e', '#a67fd0']];
let caseSpr = [], pats = {};
function dk(hex, f) {
  const n = parseInt(hex.slice(1), 16), c = v => clamp(Math.round(v * f), 0, 255);
  return '#' + [c(n >> 16), c((n >> 8) & 255), c(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('');
}
function makeCase(ci, open) {
  const [c, x] = mkCanvas(32, 36), col = CASE_COL[ci], O = '#1a1016';
  const r = (a, b, w, h, k) => { x.fillStyle = k; x.fillRect(a, b, w, h); };
  if (!open) {
    r(11, 8, 10, 2, O); r(11, 8, 2, 5, O); r(19, 8, 2, 5, O);
    r(0, 12, 32, 24, O); r(2, 14, 28, 20, col[0]); r(2, 26, 28, 8, col[1]); r(2, 14, 28, 2, col[2]);
    r(6, 14, 3, 20, col[1]); r(23, 14, 3, 20, col[1]); r(6, 14, 3, 2, O); r(23, 14, 3, 2, O);
    r(2, 14, 3, 3, '#d9d2b0'); r(27, 14, 3, 3, '#d9d2b0'); r(2, 31, 3, 3, '#d9d2b0'); r(27, 31, 3, 3, '#d9d2b0');
    r(14, 21, 4, 4, '#f3c93a'); r(15, 22, 2, 2, O);
    if (ci % 2 === 0) { r(11, 28, 5, 4, '#e8e4d0'); r(12, 29, 3, 2, '#d84a4a'); }
    if (ci % 3 === 1) { r(18, 17, 4, 3, '#f0e060'); }
  } else {
    r(0, 0, 32, 14, O); r(2, 2, 28, 10, col[1]); r(4, 4, 24, 6, '#2a1c22'); r(2, 2, 28, 2, col[2]);
    r(0, 20, 32, 16, O); r(2, 22, 28, 12, col[0]); r(2, 28, 28, 6, col[1]); r(4, 20, 24, 4, '#2a1c22');
    r(2, 12, 2, 10, O); r(28, 12, 2, 10, O);
    r(2, 31, 3, 3, '#d9d2b0'); r(27, 31, 3, 3, '#d9d2b0');
  }
  return c;
}

// ---- кукла ----
// Поза: углы рук и ног в радианах от «вниз», плюс — вперёд (персонаж смотрит вправо).
// Конечность = [угол бедра/плеча, длина, угол голени/предплечья, длина].
const DFW = 30, DFH = 42;
function drawDoll(c, U, cfg, p) {
  const cx = 15;
  const Rr = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x * U), Math.round(y * U), Math.max(1, Math.round(w * U)), Math.max(1, Math.round(h * U))); };
  const seg = (x, y, a, len, th, col) => { const n = Math.max(2, Math.ceil(len * 2)); for (let i = 0; i <= n; i++) { const t = len * i / n; Rr(x + Math.sin(a) * t - th / 2, y + Math.cos(a) * t - th / 2, th, th, col); } return [x + Math.sin(a) * len, y + Math.cos(a) * len]; };
  const limb = (x, y, Lm, th, col) => { const k = seg(x, y, Lm[0], Lm[1], th, col); return seg(k[0], k[1], Lm[2], Lm[3], th, col); };
  const dy = p.dy || 0, lean = p.lean || 0, tl = lean * .5;
  const hipY = 29 + dy, ty = 16 + dy, hy = 6 + dy, hx0 = cx - 4 + lean;
  const legs = p.legs || [[-.06, 6, 0, 6.2], [.06, 6, 0, 6.2]];
  const armB = p.armB || [-.12, 5, .02, 5], armF = p.armF || [.12, 5, .02, 5];
  const coatB = dk(cfg.coat, .72), pantsB = dk(cfg.pants, .72);
  const foot = (e, col) => Rr(e[0] - 1.6, e[1] - 1.4, 4.4, 2, col);
  const hand = (e) => Rr(e[0] - 1.2, e[1] - 1.2, 2.4, 2.4, cfg.skin);
  // задняя рука
  const bh = limb(cx - 2 + tl, ty + 1.5, armB, 3, coatB); hand(bh);
  if (p.propB) drawProp(p.propB, bh);
  if (cfg.hair && cfg.style === 'long') Rr(hx0 - 1.5, hy + 1, 4.5, 14, dk(cfg.hair, .85));
  // ноги
  foot(limb(cx - 1 + tl * .3, hipY, legs[0], 3.4, pantsB), dk(cfg.shoes, .8));
  foot(limb(cx + 1 + tl * .3, hipY, legs[1], 3.4, cfg.pants), cfg.shoes);
  // туловище
  Rr(cx - 1.5 + lean * .7, hy + 9, 3, 2, dk(cfg.skin, .85));
  const bw = cfg.wide ? 1 : 0;
  Rr(cx - 5 - bw + tl, ty, 10 + bw * 2, 13.6, cfg.coat);
  Rr(cx - 5 - bw + tl, ty, 10 + bw * 2, 1, dk(cfg.coat, 1.25));
  const sx0 = cfg.tie ? cx - 2.4 + tl : cx + 1.2 + tl;
  if (cfg.shirt) { Rr(sx0, ty, cfg.tie ? 4.6 : 3, 5.5, cfg.shirt); if (cfg.tie) Rr(sx0 + .8, ty + 5.5, 3, 2.5, cfg.shirt); }
  if (cfg.tie) { const tx = sx0 + 1.4; Rr(tx, ty + .3, 1.8, 8.4, cfg.tie); Rr(tx - .3, ty + .3, 2.4, 1.2, cfg.tie); if (cfg.tieStripe) for (let i = 0; i < 4; i++) Rr(tx, ty + 2 + i * 1.7, 1.8, .5, cfg.tieStripe); }
  if (cfg.scarf) { Rr(cx - 4 + tl, ty - .4, 8.5, 2.2, cfg.scarf); Rr(cx + 2 + tl, ty + 1, 2, 6, cfg.scarf); }
  if (cfg.knit) for (let r = 0; r < 6; r++) for (let k = 0; k < 4; k++) if ((r + k) % 2 === 0) Rr(cx - 4.4 + tl + k * 2.5 + (r % 2) * .6, ty + 1.6 + r * 2, 1.2, 1, cfg.knit);
  if (cfg.knit) Rr(cx - 5 + tl, ty + 12.6, 10, 1, cfg.knit);
  if (cfg.long) Rr(cx - 5.2 + tl, ty + 13, 10.4, 5, cfg.coat);
  if (cfg.skirt) Rr(cx - 5.6 + tl, ty + 12, 11.2, 6, cfg.skirt);
  if (cfg.belt) Rr(cx - 5 + tl, ty + 11, 10, 1.2, cfg.belt);
  // голова
  Rr(hx0, hy, 8, 10, cfg.skin);
  if (cfg.wide) Rr(hx0 - .8, hy + 4, 9, 6.6, cfg.skin);
  Rr(hx0 + 8, hy + 4.4, 1, 2, dk(cfg.skin, .82));
  const hc = cfg.hair;
  if (cfg.style === 'short') { Rr(hx0 - .5, hy - 1, 9, 3, hc); Rr(hx0 - .5, hy, 3, 6, hc); }
  else if (cfg.style === 'long') { Rr(hx0 - .8, hy - 1.2, 9.4, 3.2, hc); Rr(hx0 - 1.5, hy, 3.6, 13, hc); Rr(hx0 + 5, hy + 1, 3.2, 1.6, hc); }
  else if (cfg.style === 'bald') { Rr(hx0 - .5, hy + 2, 2.5, 5, hc); Rr(hx0 + 3, hy + .6, 2.4, 1, dk(cfg.skin, 1.15)); }
  else if (cfg.style === 'slick') { Rr(hx0 - .5, hy - 1, 9, 2.4, hc); Rr(hx0 - .5, hy, 2.6, 4, hc); Rr(hx0 + 4, hy - 1.6, 4, 1.2, hc); }
  else if (cfg.style === 'undercut') {
    Rr(hx0 + .4, hy + .2, 3.6, 4.6, dk(cfg.skin, .84));   // выбритый висок
    Rr(hx0 - 1, hy - 2.6, 9.2, 3.2, hc); Rr(hx0 + 1.2, hy - 3.8, 6.4, 1.4, hc); Rr(hx0 + 5.6, hy - 3.4, 3.2, 1.6, hc);   // зачёс вверх
    Rr(hx0 - 1.4, hy - 1.4, 2.4, 4.6, hc); Rr(hx0 + 2.4, hy - 4.4, 3.2, .8, dk(hc, 1.5));
    Rr(hx0 + 2.6, hy + 3.6, 1.2, 2.2, dk(cfg.skin, .82));   // ухо
  }
  else if (cfg.style === 'wavy') { Rr(hx0 - 1.2, hy - 2, 9.8, 3.8, hc); Rr(hx0 + .6, hy - 2.9, 2.6, 1.2, hc); Rr(hx0 + 4.2, hy - 2.7, 2.8, 1.2, hc); Rr(hx0 - 1.4, hy, 3.6, 6.4, hc); Rr(hx0 + 6.2, hy + 1, 2.2, 1.6, hc); }
  else if (cfg.style === 'side') { Rr(hx0 - .8, hy - 1.5, 9.2, 2.9, hc); Rr(hx0 - .8, hy, 2.8, 5, hc); Rr(hx0 + 4.6, hy - 2.1, 3.8, 1.3, hc); Rr(hx0 + 2.6, hy - 1.5, .6, 1, dk(hc, 1.6)); }
  else if (cfg.style === 'curly') { for (let i = 0; i < 5; i++) Rr(hx0 - 1 + i * 2, hy - 2 + (i % 2), 2.6, 2.6, hc); Rr(hx0 - 1.2, hy, 3.4, 6, hc); }
  if (cfg.beret) { Rr(hx0 - 1.6, hy - 2.4, 10.2, 2.6, cfg.beret); Rr(hx0 + 3.5, hy - 3.3, 1.2, 1.2, cfg.beret); }
  if (cfg.stubble) { Rr(hx0 + .3, hy + 6.4, 8.2, 3.8, cfg.stubble); Rr(hx0 + 2.2, hy + 10, 5.2, .8, cfg.stubble); }
  if (cfg.goatee) { Rr(hx0 + 4.4, hy + 6.4, 3.6, .8, cfg.goatee); Rr(hx0 + 3.8, hy + 8.7, 4.4, 1.9, cfg.goatee); Rr(hx0 + 4.4, hy + 10.4, 3.2, 1, cfg.goatee); }
  if (cfg.beard) { Rr(hx0 + .4, hy + 6, 8, 4.6, cfg.beard); Rr(hx0 + 2, hy + 10, 5.6, 1.6, cfg.beard); Rr(hx0 + .4, hy + 3, 1.6, 4, cfg.beard); }
  if (p.mouth === 'o') { Rr(hx0 + 5, hy + 6.8, 2.6, 2.6, '#5a1018'); Rr(hx0 + 5.4, hy + 8.4, 1.8, .8, '#e0525c'); }
  else if (p.mouth === 'smile') { Rr(hx0 + 4.6, hy + 7.3, 3, .8, OUTC); Rr(hx0 + 4.2, hy + 6.7, .8, .8, OUTC); }
  else if (!cfg.beard || cfg.lips) Rr(hx0 + 5, hy + 7.6, 2.2, .7, cfg.lips || OUTC);
  if (cfg.glasses === true) { Rr(hx0 + 3.7, hy + 3.1, 3.8, 2.9, OUTC); Rr(hx0 + 4.2, hy + 3.6, 2.8, 1.9, '#cfe8ff'); Rr(hx0 + 1, hy + 3.6, 3, .6, OUTC); }
  if (p.eyes === 'x') { Rr(hx0 + 4.6, hy + 3.4, .8, .8, OUTC); Rr(hx0 + 6, hy + 3.4, .8, .8, OUTC); Rr(hx0 + 5.3, hy + 4.1, .8, .8, OUTC); Rr(hx0 + 4.6, hy + 4.8, .8, .8, OUTC); Rr(hx0 + 6, hy + 4.8, .8, .8, OUTC); }
  else if (p.eyes === 'shut') Rr(hx0 + 4.8, hy + 4.4, 2, .7, OUTC);
  else Rr(hx0 + 5.2, hy + 3.9, 1.2, 1.5, OUTC);
  if (cfg.glasses === 'aviator') {
    Rr(hx0 + .6, hy + 3.4, 3.4, .6, OUTC); Rr(hx0 + 3.4, hy + 3, 4.8, 3.2, OUTC); Rr(hx0 + 3.8, hy + 3.4, 4, 2.2, '#2b2f3e'); Rr(hx0 + 4.4, hy + 5.6, 2.8, .8, '#2b2f3e');
    Rr(hx0 + 4.2, hy + 3.7, 1, .6, '#9fb4d8');
    if (p.eyes === 'x') { Rr(hx0 + 4.6, hy + 3.8, .7, .7, '#fff'); Rr(hx0 + 6.2, hy + 3.8, .7, .7, '#fff'); Rr(hx0 + 5.4, hy + 4.5, .7, .7, '#fff'); }
  }
  if (p.brow || cfg.brow) Rr(hx0 + 4.4, hy + 2.6, 2.8, .7, cfg.style === 'bald' ? OUTC : (hc || OUTC));
  // передняя рука
  const fh = limb(cx + 2 + tl, ty + 1.5, armF, 3, cfg.coat); hand(fh);
  if (p.prop) drawProp(p.prop, fh);
  function drawProp(k, e) {
    const [x, y] = e;
    if (k === 'book') { Rr(x - 1.5, y - 5.5, 5.4, 7, '#b02a35'); Rr(x - 1, y - 4.6, 4.4, .9, '#f3c93a'); Rr(x - 1, y - 2.8, 3, .6, '#f3c93a'); Rr(x + 3.4, y - 5.5, .7, 7, '#efe6cf'); hand(e); }
    else if (k === 'bookup') { Rr(x - 3, y - 8, 7, 6, '#b02a35'); Rr(x - 2.4, y - 7.2, 5.6, .9, '#f3c93a'); Rr(x - 3, y - 2.6, 7, .8, '#efe6cf'); hand(e); }
    else if (k === 'paper') { Rr(x - 1.5, y - 6.5, 5.2, 7, '#f4f0e0'); for (let i = 0; i < 3; i++) Rr(x - .8, y - 5.4 + i * 1.6, 3.6, .5, '#8a8a9a'); hand(e); }
    else if (k === 'blurb') { Rr(x - 1, y - 6.5, 6, 5, '#fffbe0'); Rr(x - .4, y - 5.6, 4.6, .6, '#d84a4a'); Rr(x - .4, y - 4.2, 3.4, .6, '#d84a4a'); hand(e); }
    else if (k === 'phone') { Rr(x - .6, y - 4, 2.2, 3.8, '#2a2a3a'); Rr(x - .2, y - 3.6, 1.4, 2.8, '#7fd8ff'); hand(e); }
    else if (k === 'mega') { Rr(x - .5, y - 2, 3, 3, '#c9ccd6'); Rr(x + 2.3, y - 3, 2.2, 5, '#e8eaf0'); Rr(x + 4.3, y - 4.2, 1.6, 7.4, '#fff'); Rr(x + 2.3, y - 1, 2.2, .9, '#d81b2a'); hand(e); }
    else if (k === 'folder') { Rr(x - 2, y - 6, 6.5, 7.5, '#3a6ab0'); Rr(x - 2, y - 6, 6.5, 1, '#6fa0e0'); Rr(x - .5, y - 3.5, 3.5, 1.5, '#f4f0e0'); hand(e); }
    else if (k === 'suitcase') { Rr(x - 1, y - .4, 2.4, 1.6, OUTC); Rr(x - 3.6, y + 1, 7.6, 6.4, cfg.case || '#7a4fa0'); Rr(x - 3.6, y + 1, 7.6, .9, dk(cfg.case || '#7a4fa0', 1.35)); Rr(x - .5, y + 3, 1.4, 1.2, '#f3c93a'); }
    else if (k === 'pen') { Rr(x + .6, y - 4, .9, 4, '#2a4aa0'); hand(e); }
  }
}
function outline(c, w, h) {
  const im = c.getImageData(0, 0, w, h), d = im.data, src = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) src[i] = d[i * 4 + 3] > 0 ? 1 : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (src[i]) continue;
    if ((x > 0 && src[i - 1]) || (x < w - 1 && src[i + 1]) || (y > 0 && src[i - w]) || (y < h - 1 && src[i + w])) { d[i * 4] = 22; d[i * 4 + 1] = 22; d[i * 4 + 2] = 29; d[i * 4 + 3] = 255; }
  }
  c.putImageData(im, 0, 0);
}
// Внешности. Это собирательные карикатуры.
const LOOK = {
  // Пелевин: пышные тёмные волосы, авиаторы, щетина, футболка под курткой
  pel: { skin: '#ecc3a0', hair: '#231a14', style: 'wavy', glasses: 'aviator', stubble: '#c69c7e', coat: '#2b2f3a', shirt: '#a8a8b4', pants: '#23232e', shoes: '#14141a' },
  a0: { skin: '#f0c9a0', hair: '#9a9aa6', style: 'short', beret: '#3a3a52', beard: '#b8b8c4', glasses: true, coat: '#5a6b8a', scarf: '#c2303c', pants: '#3a3a4a', shoes: '#2a1c14', long: true, case: '#7a4fa0' },
  a1: { skin: '#f6d2b0', hair: '#b8462e', style: 'long', glasses: true, coat: '#7a3a5a', skirt: '#3a2a4a', pants: '#2a2030', shoes: '#14141a', lips: '#c2303c', case: '#2f6fa8' },
  a2: { skin: '#e8b890', hair: '#8a8a94', style: 'bald', beard: '#a8a8b4', coat: '#7a6a4a', shirt: '#e8e4d0', pants: '#4a3a2a', shoes: '#2a1c14', case: '#9a5a2c' },
  a3: { skin: '#f0c9a0', hair: '#2a2420', style: 'curly', coat: '#3d8a6a', pants: '#2a3550', shoes: '#e8e8f0', case: '#4d8a4a' },
  // Миронова: тёмный зачёс вверх, выбритый висок, бледная, вязаный свитер с узором
  mir: { skin: '#f2dccb', hair: '#2a2228', style: 'undercut', coat: '#e6e2d8', knit: '#2a3550', pants: '#2a3550', shoes: '#14141a', lips: '#d8806e', brow: true },
  // Бородин: тёмный пробор, бородка с усами, синий костюм, красный галстук в полоску, плотный
  bor: { skin: '#eab894', hair: '#3a2a1e', style: 'side', goatee: '#3a2a1e', stubble: '#c99a7a', coat: '#23418c', shirt: '#f4f4f8', tie: '#d0283a', tieStripe: '#f4f4f8', pants: '#1c3270', shoes: '#101016', brow: true, wide: true }
};
const ST = [[-.06, 6, 0, 6.2], [.06, 6, 0, 6.2]];
const RUN = [
  { legs: [[-.5, 6, -.25, 6.2], [.55, 6, .1, 6.2]], armB: [.6, 5, 1.1, 5], armF: [-.5, 5, -.2, 5], lean: 1 },
  { legs: [[.15, 6, -1, 5.6], [0, 6, 0, 6.2]], armB: [.1, 5, .5, 5], armF: [-.1, 5, .3, 5], lean: 1, dy: -.6 },
  { legs: [[.55, 6, .1, 6.2], [-.5, 6, -.25, 6.2]], armB: [-.5, 5, -.2, 5], armF: [.6, 5, 1.1, 5], lean: 1 },
  { legs: [[0, 6, 0, 6.2], [.15, 6, -1, 5.6]], armB: [-.1, 5, .3, 5], armF: [.1, 5, .5, 5], lean: 1, dy: -.6 }
];
const CROUCH = [[1.15, 5.5, -.1, 4.2], [1.35, 5.5, .05, 4]];
function dollList() {
  const S = [];
  const add = (name, look, pose, U) => S.push({ name, look, pose, U: U || 2 });
  // Пелевин
  const pel = (n, p) => add('p_' + n, 'pel', p);
  pel('idle', { armF: [.25, 5, .9, 4.4], prop: 'book' });
  RUN.forEach((r, i) => pel('r' + i, Object.assign({}, r, { prop: 'book' })));
  pel('jump', { legs: [[.3, 5.5, -.7, 5.5], [1.1, 5.5, .15, 5.5]], armB: [-2.3, 5, -2.6, 5], armF: [2.2, 5, 2.6, 4.5], prop: 'book' });
  pel('wind', { armF: [-2.4, 5, -2.0, 4.6], prop: 'book', lean: -.5, brow: true });
  pel('smash', { armF: [1.35, 5, 1.6, 5], armB: [-.6, 5, -.3, 5], prop: 'bookup', lean: 1.5, brow: true, mouth: 'o', legs: [[-.4, 6, -.1, 6.2], [.4, 6, .1, 6.2]] });
  pel('hit', { armB: [-2.7, 5, -2.3, 5], armF: [2.8, 5, 2.5, 5], lean: -1.6, mouth: 'o', eyes: 'x', prop: 'book' });
  pel('crouch', { dy: 8, legs: CROUCH, armF: [.9, 5, 1.6, 4], prop: 'book', lean: 1 });
  pel('crouch2', { dy: 8, legs: [[1.35, 5.5, .05, 4], [1.15, 5.5, -.1, 4.2]], armF: [.9, 5, 1.6, 4], prop: 'book', lean: 1.2 });
  pel('phone', { armF: [.35, 5, 2.7, 4], prop: 'phone', armB: [-.1, 5, .7, 4], propB: 'book' });
  pel('write', { armF: [.9, 5, 1.8, 4], prop: 'pen', armB: [.6, 5, 1.6, 4], propB: 'paper', lean: .6 });
  pel('laugh1', { armF: [.25, 5, .9, 4.4], prop: 'book', mouth: 'o', eyes: 'shut', lean: -1 });
  pel('laugh2', { armF: [.25, 5, .9, 4.4], prop: 'book', mouth: 'smile', eyes: 'shut', lean: -.6, dy: .5 });
  pel('dance1', { legs: [[-.4, 6, -.1, 6.2], [.4, 6, .1, 6.2]], armB: [-2.5, 5, -2.9, 5], armF: [2.5, 5, 2.9, 5], prop: 'bookup', mouth: 'smile' });
  pel('dance2', { legs: [[-.1, 6, 0, 6.2], [1.3, 6, 1, 5.6]], armB: [-.9, 5, -1.6, 4.4], armF: [2.7, 5, 3, 5], prop: 'bookup', mouth: 'o', lean: -.8 });
  pel('proud', { armF: [2.6, 5, 2.9, 5], prop: 'bookup', mouth: 'smile' });
  // иноагенты, четыре внешности
  for (let v = 0; v < 4; v++) {
    const a = (n, p) => add('a' + v + '_' + n, 'a' + v, p);
    a('idle', { propB: 'suitcase', armF: [.5, 5, 1.2, 4], prop: 'blurb', mouth: 'smile' });
    a('give', { propB: 'suitcase', armF: [1.4, 5, 1.55, 5], prop: 'blurb', lean: 1.2, mouth: 'o' });
    a('throw', { propB: 'suitcase', armF: [2.7, 5, 2.4, 5], lean: -.6, mouth: 'o', brow: true });
    a('run0', Object.assign({}, RUN[0], { propB: 'suitcase', prop: 'blurb', mouth: 'o' }));
    a('run1', Object.assign({}, RUN[2], { propB: 'suitcase', prop: 'blurb', mouth: 'o' }));
    a('ko', { armB: [-2.6, 5, -2.2, 5], armF: [2.7, 5, 2.4, 5], lean: -1.4, mouth: 'o', eyes: 'x' });
    a('scared', { armF: [2.3, 4, 3.1, 4], armB: [-2.3, 4, -3.1, 4], propB: 'suitcase', mouth: 'o', dy: 1 });
  }
  // Миронова
  add('m_w0', 'mir', Object.assign({}, RUN[0], { prop: 'mega', brow: true }));
  add('m_w1', 'mir', Object.assign({}, RUN[2], { prop: 'mega', brow: true }));
  add('m_shout', 'mir', { armF: [1.9, 4, 2.9, 3.4], prop: 'mega', lean: 1, mouth: 'o', brow: true, legs: [[-.35, 6, -.1, 6.2], [.35, 6, .1, 6.2]], armB: [-.9, 5, -1.9, 4] });
  add('m_shout2', 'mir', { armF: [1.9, 4, 2.9, 3.4], prop: 'mega', lean: 1.8, mouth: 'o', brow: true, legs: [[-.45, 6, -.1, 6.2], [.45, 6, .1, 6.2]], armB: [-2.6, 5, -2.2, 5], dy: .4 });
  add('m_huff', 'mir', { armF: [-.3, 4, 1.4, 4], prop: 'mega', armB: [.6, 4, -1.2, 4], brow: true, lean: -.4 });
  // Бородин (крупнее)
  const b = (n, p) => add('b_' + n, 'bor', p, 3);
  b('stand', { armF: [.4, 5, 1.3, 4], prop: 'folder' });
  b('point', { armF: [1.5, 5, 1.55, 5], armB: [.2, 5, .9, 4], propB: 'folder', mouth: 'o', lean: 1 });
  b('raise', { armF: [2.9, 5, 3.0, 5], prop: 'paper', armB: [.2, 5, .9, 4], propB: 'folder', mouth: 'o', lean: -.6 });
  b('throw', { armF: [1.9, 5, 1.6, 5], armB: [-.6, 5, -.2, 5], mouth: 'o', lean: 1.4, legs: [[-.4, 6, -.1, 6.2], [.4, 6, .1, 6.2]] });
  b('write', { armF: [1.0, 5, 1.9, 4], prop: 'pen', armB: [.8, 5, 1.7, 4], propB: 'paper', lean: 1.2, dy: 1.5, legs: [[-.2, 6, .2, 6], [.3, 6, -.2, 6]] });
  b('hurt', { armB: [-2.6, 5, -2.2, 5], armF: [2.7, 5, 2.4, 5], lean: -1.6, mouth: 'o', eyes: 'x' });
  b('walk0', Object.assign({}, RUN[0], { prop: 'folder', lean: .5 }));
  b('walk1', Object.assign({}, RUN[2], { prop: 'folder', lean: .5 }));
  return S;
}
// мелкие картинки: книжка-экземпляр, листки
function iconList() {
  return [
    ['copy', 16, 20, (x) => { x.fillStyle = OUTC; x.fillRect(0, 0, 16, 20); x.fillStyle = '#b02a35'; x.fillRect(1, 1, 13, 18); x.fillStyle = '#efe6cf'; x.fillRect(14, 2, 1, 16); x.fillStyle = '#f3c93a'; x.fillRect(3, 4, 9, 2); x.fillRect(3, 8, 6, 1); x.fillStyle = '#ffd0d6'; x.fillRect(3, 14, 8, 1); }],
    ['copy_s', 12, 15, (x) => { x.fillStyle = OUTC; x.fillRect(0, 0, 12, 15); x.fillStyle = '#b02a35'; x.fillRect(1, 1, 9, 13); x.fillStyle = '#efe6cf'; x.fillRect(10, 2, 1, 11); x.fillStyle = '#f3c93a'; x.fillRect(2, 3, 7, 2); }],
    ['sheet', 14, 18, (x) => { x.fillStyle = OUTC; x.fillRect(0, 0, 14, 18); x.fillStyle = '#f4f0e0'; x.fillRect(1, 1, 12, 16); x.fillStyle = '#8a8a9a'; for (let i = 0; i < 5; i++) x.fillRect(3, 4 + i * 3, i === 4 ? 4 : 8, 1); x.fillStyle = '#3a6ab0'; x.fillRect(8, 13, 3, 3); }],
    ['blurbp', 18, 13, (x) => { x.fillStyle = OUTC; x.fillRect(0, 0, 18, 13); x.fillStyle = '#fffbe0'; x.fillRect(1, 1, 16, 11); x.fillStyle = '#d84a4a'; x.fillRect(3, 3, 2, 2); x.fillRect(13, 8, 2, 2); x.fillStyle = '#16161d'; x.fillRect(6, 4, 7, 1); x.fillRect(5, 7, 6, 1); }],
    ['heart', 18, 16, (x) => heartIcon(x)],
    ['heart_s', 18, 16, (x) => heartIcon(x)],
    ['money', 26, 16, (x) => { x.fillStyle = OUTC; x.fillRect(0, 0, 26, 16); x.fillStyle = '#5fae5a'; x.fillRect(1, 1, 24, 14); x.fillStyle = '#3d7f3a'; x.fillRect(3, 3, 20, 10); x.fillStyle = '#9fe08a'; x.fillRect(10, 5, 6, 6); x.fillStyle = '#2f5c30'; x.fillRect(12, 6, 2, 4); x.fillStyle = '#f3c93a'; x.fillRect(11, 0, 4, 16); }],
    ['folderp', 26, 20, (x) => { x.fillStyle = OUTC; x.fillRect(0, 2, 26, 18); x.fillRect(2, 0, 10, 3); x.fillStyle = '#c9a24a'; x.fillRect(1, 3, 24, 16); x.fillRect(3, 1, 8, 2); x.fillStyle = '#e8c86a'; x.fillRect(1, 3, 24, 2); x.fillStyle = '#16161d'; x.fillRect(5, 11, 16, 1); x.fillRect(5, 14, 11, 1); }]
  ];
}
function heartIcon(x) {
  const rows = ['.##...##.', '####.####', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'];
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') { x.fillStyle = (j === 1 && i > 0 && i < 3) ? '#ff9aa4' : '#e2283a'; x.fillRect(i * 2, j * 2, 2, 2); } }));
  outline(x, 18, 16);
}
function buildDolls() {
  const items = dollList().map(s => { const w = DFW * s.U, h = DFH * s.U; const [c, x] = mkCanvas(w, h); drawDoll(x, s.U, LOOK[s.look], s.pose); outline(x, w, h); return { name: s.name, c, w, h, ax: 15 * s.U, ay: DFH * s.U }; });
  iconList().forEach(([name, w, h, fn]) => { const [c, x] = mkCanvas(w, h); fn(x); items.push({ name, c, w, h, ax: w / 2, ay: h }); });
  const MAXW = 1024; let px = 0, py = 0, rowH = 0; const pos = [];
  for (const it of items) { if (px + it.w > MAXW) { px = 0; py += rowH + 2; rowH = 0; } pos.push([px, py]); px += it.w + 2; rowH = Math.max(rowH, it.h); }
  const packH = py + rowH + 2;
  const [c, x] = mkCanvas(MAXW, packH);
  items.forEach((it, i) => { const [ix, iy] = pos[i]; x.drawImage(it.c, ix, iy); F[it.name] = [ix, iy, it.w, it.h, it.ax, it.ay]; });
  atlas = c;
}
// ---- фоны ----
function makeCityBg() {
  const [c, x] = mkCanvas(W, H);
  const gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0b0f2a'); gr.addColorStop(.6, '#25184a'); gr.addColorStop(1, '#4a2050');
  x.fillStyle = gr; x.fillRect(0, 0, W, H);
  let seed = 11; const sr = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 70; i++) { x.fillStyle = sr() < .2 ? '#fff6c8' : '#8f9ad0'; x.fillRect(Math.floor(sr() * W), Math.floor(sr() * 200), 2, 2); }
  // дома рисуются с заворотом, чтобы фон склеивался сам с собой без шва
  const house = (hx, w, h, col, win) => {
    for (const off of [0, -W, W]) {
      const bx = hx + off; x.fillStyle = col; x.fillRect(bx, H - 60 - h, w, h + 60);
      for (let wy = H - 50 - h; wy < H - 70; wy += 14) for (let wx = bx + 6; wx < bx + w - 8; wx += 12) if (sr() < win) { x.fillStyle = sr() < .7 ? '#f3c93a' : '#ffe9a0'; x.fillRect(wx, wy, 5, 7); }
    }
  };
  for (let i = 0; i < 9; i++) house(Math.floor(sr() * W), 60 + Math.floor(sr() * 70), 120 + Math.floor(sr() * 140), '#1a1838', .25);
  for (let i = 0; i < 8; i++) house(Math.floor(sr() * W), 70 + Math.floor(sr() * 80), 60 + Math.floor(sr() * 110), '#241f48', .35);
  // растяжка ярмарки
  const bx = 250, by = 150; x.fillStyle = '#16161d'; x.fillRect(bx - 4, by - 4, 308, 44); x.fillRect(bx + 10, by + 40, 4, 200); x.fillRect(bx + 286, by + 40, 4, 200);
  x.fillStyle = '#a3111f'; x.fillRect(bx, by, 300, 36); x.fillStyle = '#f3c93a'; x.fillRect(bx, by, 300, 3);
  x.font = '12px PS2P,monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff6e0'; x.fillText('КНИЖНАЯ ЯРМАРКА', bx + 150, by + 19);
  x.fillStyle = 'rgba(6,8,26,.42)'; x.fillRect(0, 0, W, H);
  return c;
}
function makeOfficeBg() {
  const [c, x] = mkCanvas(W, H);
  x.fillStyle = '#3b4a3a'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#334232'; for (let i = 0; i < W; i += 24) x.fillRect(i, 0, 12, 260);
  x.fillStyle = '#5a4630'; x.fillRect(0, 260, W, H - 260); x.fillStyle = '#4a3826'; for (let i = 0; i < W; i += 40) x.fillRect(i, 260, 3, H - 260);
  x.fillStyle = '#16161d'; x.fillRect(0, 256, W, 6);
  // окно с решёткой
  x.fillStyle = '#16161d'; x.fillRect(96, 60, 150, 120); x.fillStyle = '#1d2a5a'; x.fillRect(102, 66, 138, 108);
  x.fillStyle = '#fff6c8'; x.fillRect(200, 84, 14, 14);
  x.fillStyle = '#16161d'; for (let i = 0; i < 5; i++) x.fillRect(110 + i * 28, 66, 4, 108); x.fillRect(102, 116, 138, 4);
  // портрет в рамке (пустой: портреты меняются)
  x.fillStyle = '#16161d'; x.fillRect(368, 54, 76, 92); x.fillStyle = '#c9a24a'; x.fillRect(372, 58, 68, 84); x.fillStyle = '#e8e4d0'; x.fillRect(380, 66, 52, 68);
  x.font = '7px PS2P,monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#5a4a3a'; x.fillText('ЗДЕСЬ', 406, 92); x.fillText('БУДЕТ', 406, 104); x.fillText('ВАШ', 406, 116);
  // шкафы с папками
  for (const sx of [520, 640]) {
    x.fillStyle = '#16161d'; x.fillRect(sx, 120, 104, 140); x.fillStyle = '#6e4a2a'; x.fillRect(sx + 4, 124, 96, 132);
    for (let r = 0; r < 4; r++) { x.fillStyle = '#16161d'; x.fillRect(sx + 4, 152 + r * 30, 96, 3); for (let k = 0; k < 7; k++) { x.fillStyle = ['#c9a24a', '#3a6ab0', '#b02a35', '#e8e4d0'][(k + r) % 4]; x.fillRect(sx + 8 + k * 13, 130 + r * 30, 10, 22); } }
  }
  x.fillStyle = '#16161d'; x.fillRect(250, 196, 300, 34); x.fillStyle = '#1b2a6b'; x.fillRect(254, 200, 292, 26);
  x.font = '10px PS2P,monospace'; x.fillStyle = '#ffe36b'; x.fillText('ОБЩЕСТВЕННАЯ ПРИЁМНАЯ', 400, 214);
  x.fillStyle = 'rgba(6,8,26,.25)'; x.fillRect(0, 0, W, H);
  return c;
}
function buildArt() {
  buildDolls();
  let c, x;
  [c, x] = mkCanvas(atlas.width, atlas.height); x.drawImage(atlas, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); atlasW = c;
  bgA = makeCityBg(); bgB = bgA; bg2 = makeOfficeBg();
  for (let i = 0; i < CASE_COL.length; i++) caseSpr.push([makeCase(i, false), makeCase(i, true)]);
  [c, x] = mkCanvas(16, 6); x.fillStyle = '#e9b616'; x.fillRect(0, 0, 16, 6); x.fillStyle = '#17171f';
  for (let i = -6; i < 16; i += 8) for (let r = 0; r < 6; r++) x.fillRect(i + r, 5 - r, 4, 1);
  pats.hz = g.createPattern(c, 'repeat');
  // пол ярмарки: паркет
  [c, x] = mkCanvas(48, 48); x.fillStyle = '#6e4a2a'; x.fillRect(0, 0, 48, 48);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) { const ox = (r % 2) * 12 + k * 24; x.fillStyle = (r + k) % 2 ? '#5e3e22' : '#7a5432'; x.fillRect(ox % 48, r * 12, 24, 11); x.fillStyle = '#4a3018'; x.fillRect(ox % 48, r * 12 + 11, 24, 1); x.fillRect(ox % 48, r * 12, 1, 12); }
  pats.panel = g.createPattern(c, 'repeat');
}
