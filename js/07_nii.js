// ---------- ЭТАП 5: НИИ ПОКРОВ-17 ----------
// Александр Пелевин попадает в мир, где НИИ Покров-17 — на самом деле фабрика баблоса.
// Вампиры добывают его из исторического страха, 1941 год — самое жирное месторождение.
// Ширлики — низший персонал, Великая Мышь курирует проект из Москвы (звонит по видеосвязи).
// Тихонова сначала хотят укусить, но решают, что журналисты в девяностые и так уже всё сами.
// Босс — Виктор Пелевин. Их путают: во время боя они меняются местами и внешностью.
// Виктор лечится поганками; сбил лечение — выпадает поганка для тебя и можно ударить дважды.
// Все персонажи — карикатуры.
let bgNii = null, bgVoid = null;
DEATH.bite = ['ВЫПИТ', 'из тебя добыли немного баблоса'];
DEATH.void = ['ОПУСТОШЁН', 'ты понял, что тебя нет. ненадолго'];
DEATH.vbook = ['ПРОЧИТАН', 'зачитан до дыр другим пелевиным'];

// ---------- персонал ----------
const SHIR_Q = ['«ПРОПУСК!»', '«НАРЯД №17»', '«РАСПИШИТЕСЬ»', '«СМЕННЫЙ ЖУРНАЛ»', '«ТЕХНИКА БЕЗОПАСНОСТИ»', '«ЗАЯВКА НА БАБЛОС»'];
const shirAs = v => ({ pre: 'h' + v + '_', title: 'Ширлик', name: 'смена №' + rint(1, 17), noMem: true, quotes: SHIR_Q, lastL: ['НА ПЕРЕКУР…', 'СМЕНА КОНЧИЛАСЬ', 'ДОЛОЖУ ЗАВЛАБУ', 'МНЕ ЗА ЭТО НЕ ПЛАТЯТ', 'ШИР…'], relocTxt: 'УШЁЛ НА ПЕРЕКУР' });
const vampAs = v => ({ pre: 'vp' + v + '_', title: 'Вампир', name: v ? 'Иштар' : pick(['Энлиль', 'Мардук', 'Бальдр', 'Локи']), noMem: true, quotes: ['«БАБЛОС»', '«ДИСКУРС»', '«ГЛАМУР»', '«СТРАХ-41»'], lastL: ['ЛЕЧУ ОТСЮДА!', 'ШШШ!', 'ДОЛОЖУ МЫШИ!', 'БАБЛОС НЕ ОТДАМ!'], relocTxt: 'УЛЕТЕЛ ЛЕТУЧЕЙ МЫШЬЮ', bite: 'УКУС! ВЫПИЛИ НЕМНОГО СТРАХА', biteSay: ['ВКУСНО. СОРОК ПЕРВЫЙ', 'НЕ ТОТ ПЕЛЕВИН. НО СОЙДЁТ', 'БАБЛОС!'] });

// ---------- Великая Мышь звонит из Москвы ----------
let mouseCall = null, mouseSeen = false, mouseCard = 0;
function updateCalls(dt) {
  mouseCard = Math.max(0, mouseCard - dt);
  if (!mouseCall) {
    const c = L.calls.find(c => !c.done && P.x > c.x);
    if (c) { c.done = true; mouseCall = { lines: c.lines, i: 0, t: 0 }; sfx.blip2(); tn('square', 880, 880, .08, .08); tn('square', 660, 660, .08, .08, .12); }
    return;
  }
  const m = mouseCall; m.t += dt;
  if (m.t > 2.6) { m.t = 0; m.i++; if (m.i >= m.lines.length) { mouseCall = null; sfx.click(); } else sfx.blip(); }
}
function drawCalls() {
  if (mouseCall) {
    const m = mouseCall, s = m.lines[m.i], ln = wrap(s, 24), on = m.t < .15 ? m.t / .15 : 1;
    OV.push(c => {
      c.save(); c.globalAlpha = on;
      const x = 20, y = 54;
      c.fillStyle = OUTC; c.fillRect(x, y, 112, 96); c.fillStyle = '#0a1410'; c.fillRect(x + 4, y + 4, 104, 88);
      const f = F.mouse; c.drawImage(atlas, f[0], f[1], f[2], f[3], x + 8, y + 8 + ((gameT * 8 | 0) % 7 === 0 ? 1 : 0), f[2], f[3]);
      c.fillStyle = 'rgba(120,255,160,.08)'; for (let i = 0; i < 88; i += 4) c.fillRect(x + 4, y + 4 + i, 104, 1);
      c.fillStyle = (gameT * 2 | 0) % 2 ? '#ff3040' : '#601018'; c.fillRect(x + 96, y + 8, 6, 6);
      c.fillStyle = OUTC; c.fillRect(x + 116, y + 10, 262, 26 + ln.length * 14); c.fillStyle = '#e8f0e8'; c.fillRect(x + 118, y + 12, 258, 22 + ln.length * 14);
      c.font = '7px PS2P,monospace'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = '#5a6a5a'; c.fillText('МОСКВА. ВЕЛИКАЯ МЫШЬ:', x + 126, y + 22);
      c.font = '9px PS2P,monospace'; c.fillStyle = OUTC; ln.forEach((l, i) => c.fillText(l, x + 126, y + 38 + i * 14));
      c.restore();
    });
  }
  if (tikCard > 0) OV.push(c => { c.globalAlpha = Math.min(1, tikCard * 2, (3 - tikCard) * 4); c.fillStyle = OUTC; c.fillRect(W / 2 - 160, 52, 320, 50); c.fillStyle = '#4a3428'; c.fillRect(W / 2 - 156, 56, 312, 42); c.font = '12px PS2P,monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText('ТИХОНОВ', W / 2, 70); c.font = '7px PS2P,monospace'; c.fillStyle = '#ffd8b0'; c.fillText('журналист. из девяностых', W / 2, 88); c.globalAlpha = 1; });
}

// ---------- Тихонов и два вампира ----------
const TIK_LINES = [[0, 'О. ЖУРНАЛИСТ. СВЕЖИЙ'], [1, 'КУСАЕМ?'], [2, 'Я ТИХОНОВ! Я ТОЛЬКО СПРОСИТЬ ПРО НИИ!'], [1, 'ПОСТОЙ. ОН ЖЕ ИЗ ДЕВЯНОСТЫХ'], [0, 'И ЧТО?'], [1, 'ЖУРНАЛИСТЫ В ДЕВЯНОСТЫЕ И ТАК УЖЕ ВСЁ САМИ'], [0, 'А. НУ ДА. ИДИ, ТИХОНОВ'], [2, '…ДАЖЕ ОБИДНО']];
let tikCard = 0;
function updateTik(dt) {
  tikCard = Math.max(0, tikCard - dt);
  const s = L.tik; if (!s || s.st === 'gone') return;
  if (s.st === 'wait') { if (P.x > s.x - 290) { s.st = 'talk'; s.t = 0; s.i = -1; tikCard = 3; } return; }
  s.t += dt;
  if (s.st === 'talk') { const i = Math.floor(s.t / 2.1); if (i !== s.i) { s.i = i; if (i >= TIK_LINES.length) { s.st = 'leave'; s.t = 0; } else (TIK_LINES[i][0] === 2 ? sfx.squeak : sfx.blip)(); } }
  else if (s.t > 6) s.st = 'gone';
}
function drawTik() {
  const s = L.tik; if (!s || s.st === 'gone' || !inView(s.x, 300)) return;
  const lv = s.st === 'leave', t = s.t, st = (gameT * 7 | 0) % 2, bob = lv ? -Math.abs(Math.sin(gameT * 14)) * 3 : 0;
  const tx = lv ? s.x - t * 120 : s.x, v0 = lv ? s.x - 52 + t * 90 : s.x - 52, v1 = lv ? s.x + 52 + t * 90 : s.x + 52;
  const bite = s.st === 'talk' && s.i < 2, scared = s.st === 'talk' && s.i < 6;
  spr(lv ? (st ? 'vp0_run0' : 'vp0_run1') : bite ? 'vp0_give' : 'vp0_idle', v0, FY + bob, false);
  spr(lv ? (st ? 'vp1_run1' : 'vp1_run0') : bite ? 'vp1_give' : 'vp1_idle', v1, FY + bob, !lv);
  spr(lv ? (st ? 'tk_w0' : 'tk_w1') : scared ? 'tk_scared' : 'tk_idle', tx, FY + bob, lv || (s.i >= 0 && s.i < 6 && TIK_LINES[s.i][0] === 0));
  if (s.st === 'talk' && s.i >= 0 && s.i < TIK_LINES.length) {
    const [who, line] = TIK_LINES[s.i], bx = [v0, v1, tx][who];
    bubble(line, bx - camR, FY - 92, who === 2 ? { size: 8, max: 18, prio: 3, bg: '#fff3e0', color: '#5a3018' } : { size: 8, max: 18, prio: 3, bg: '#ffe0e4', color: '#7a0a18' });
  }
}

// ---------- оформление ----------
function drawNiiSolid(s, x, y, w) {
  if (s.k === 'f') {
    R(x, y, w, H - y, '#3a403a'); R(x, y, w, 3, '#a8b8a0'); R(x, y + 3, w, 5, '#5a6a58');
    for (let i = 2; i < w; i += 24) R(x + i, y + 8, 1, H - y, '#2a302a');
    for (let j = y + 20; j < H; j += 12) R(x, j, w, 1, '#2a302a');
    R(x, y, 3, H - y, OUTC); R(x + w - 3, y, 3, H - y, OUTC);
  } else if (s.k === 'b') {
    // ящик с баблосом
    R(x, y, w, s.h, OUTC); R(x + 2, y + 2, w - 4, s.h - 4, '#4a5a48'); R(x + 2, y + 2, w - 4, 3, '#6a7a66');
    for (let yy = 0; yy + 36 <= s.h; yy += 40) { R(x + w / 2 - 18, y + yy + 12, 36, 14, OUTC); R(x + w / 2 - 16, y + yy + 14, 32, 10, '#a3111f'); T('БАБЛОС', x + w / 2 - camR, y + yy + 19, { size: 5, color: '#fff' }); }
  } else {
    R(x, y, w, 12, OUTC); R(x + 1, y, w - 2, 3, '#a8b8a0'); R(x + 1, y + 3, w - 2, 7, '#4a5048');
    for (let i = 4; i < w - 4; i += 6) R(x + i, y + 4, 3, 5, '#2a302a');
    R(x + 4, y + 12, 3, 6, OUTC); R(x + w - 7, y + 12, 3, 6, OUTC);
    if (s.mv) { R(x + w / 2 - 5, y + 12, 10, 4, OUTC); R(x + w / 2 - 3, y + 13, 6, 2, (gameT * 6 | 0) % 2 ? '#ff3040' : '#601018'); }
  }
}
function drawNiiGate() {
  const x = L.gateX, o = Math.round(L.gate * 118);
  R(x - 14, FY - 152, 98, 152, OUTC); R(x - 10, FY - 148, 90, 148, '#4a5048'); g.fillStyle = pats.hz; g.fillRect(x - 10, FY - 148, 90, 8);
  R(x, FY - 122, 70, 122, '#06040c');
  for (let y = 0; y < 122 - o; y += 8) { R(x, FY - 122 + y, 70, 7, '#5a6a58'); R(x, FY - 122 + y, 70, 2, '#7a8a76'); }
  R(x + 28, FY - 140, 14, 8, (gameT * 2 | 0) % 2 ? '#b080ff' : '#402060');
  T('ОТДЕЛ ПУСТОТЫ', x + 35 - camR, FY - 164, { size: 8, color: '#d0b0ff', stroke: OUTC });
}
function vatArt(x, vx, vy, lab) {
  x.fillStyle = OUTC; x.fillRect(vx - 4, vy - 4, 88, 168); x.fillStyle = '#5a6a58'; x.fillRect(vx, vy, 80, 160);
  x.fillStyle = '#0a1410'; x.fillRect(vx + 12, vy + 20, 56, 110); x.fillStyle = '#8a0a18'; x.fillRect(vx + 12, vy + 60, 56, 70); x.fillStyle = '#c8202a'; x.fillRect(vx + 12, vy + 60, 56, 3);
  x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(vx + 16, vy + 24, 6, 100);
  x.fillStyle = '#e8e4d0'; x.fillRect(vx + 10, vy + 136, 60, 16); x.font = '6px PS2P,monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#a3111f'; x.fillText(lab, vx + 40, vy + 144);
}
function makeNiiBg() {
  const [c, x] = mkCanvas(W, H);
  x.fillStyle = '#26302c'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#2e5a48'; x.fillRect(0, 170, W, 130); x.fillStyle = '#244a3a'; for (let i = 0; i < W; i += 16) x.fillRect(i, 170, 1, 130); for (let j = 170; j < 300; j += 12) x.fillRect(0, j, W, 1);
  x.fillStyle = '#1a2420'; x.fillRect(0, 166, W, 4);
  // трубы страха и баблоса
  for (const [py, col] of [[34, '#6a7a66'], [56, '#8a0a18']]) { x.fillStyle = OUTC; x.fillRect(0, py - 2, W, 14); x.fillStyle = col; x.fillRect(0, py, W, 10); x.fillStyle = 'rgba(255,255,255,.15)'; x.fillRect(0, py + 1, W, 2); for (let i = 40; i < W; i += 160) { x.fillStyle = OUTC; x.fillRect(i, py - 4, 8, 18); } }
  vatArt(x, 30, 110, 'БАБЛОС'); vatArt(x, 690, 110, 'БАБЛОС');
  // табло месторождения
  x.fillStyle = OUTC; x.fillRect(180, 90, 220, 110); x.fillStyle = '#e8e4d0'; x.fillRect(184, 94, 212, 102);
  x.font = '8px PS2P,monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = OUTC; x.fillText('МЕСТОРОЖДЕНИЕ', 290, 108);
  x.font = '22px PS2P,monospace'; x.fillStyle = '#a3111f'; x.fillText('1941', 290, 136);
  x.font = '6px PS2P,monospace'; x.fillStyle = '#3a3a3a'; x.fillText('ИСТОРИЧЕСКИЙ СТРАХ:', 290, 162);
  x.fillStyle = OUTC; x.fillRect(200, 172, 180, 12); x.fillStyle = '#c8202a'; x.fillRect(202, 174, 168, 8);
  // вывеска НИИ
  x.fillStyle = OUTC; x.fillRect(430, 84, 230, 40); x.fillStyle = '#1b2a6b'; x.fillRect(434, 88, 222, 32); x.font = '12px PS2P,monospace'; x.fillStyle = '#e8e4d0'; x.fillText('НИИ ПОКРОВ-17', 545, 104);
  x.fillStyle = OUTC; x.fillRect(456, 140, 180, 34); x.fillStyle = '#c9a24a'; x.fillRect(459, 143, 174, 28); x.font = '6px PS2P,monospace'; x.fillStyle = OUTC; x.fillText('ПЛАН ПО БАБЛОСУ: 104%', 546, 152); x.fillText('ВЕЛИКАЯ МЫШЬ ДОВОЛЬНА', 546, 164);
  x.fillStyle = '#2a302a'; x.fillRect(0, 300, W, H - 300);
  x.fillStyle = 'rgba(6,10,8,.35)'; x.fillRect(0, 0, W, H);
  return c;
}
function makeVoidBg() {
  const [c, x] = mkCanvas(W, H);
  const gr = x.createLinearGradient(0, 0, 0, FYB); gr.addColorStop(0, '#0a0614'); gr.addColorStop(1, '#241638'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
  // энсо: круг пустоты
  x.strokeStyle = 'rgba(230,220,255,.35)'; x.lineWidth = 10; x.beginPath(); x.arc(400, 190, 120, .4, Math.PI * 2 - .1); x.stroke();
  x.strokeStyle = 'rgba(230,220,255,.15)'; x.lineWidth = 4; x.beginPath(); x.arc(400, 190, 136, 1, Math.PI * 2 - .6); x.stroke();
  vatArt(x, 20, 200, 'БАБЛОС'); vatArt(x, 700, 200, 'БАБЛОС');
  x.font = '10px PS2P,monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#d0b0ff'; x.fillText('ЛАБОРАТОРИЯ №17. ОТДЕЛ ПУСТОТЫ', 400, 30);
  // поганки по углам
  for (const [mx, s] of [[150, 1], [175, .7], [620, .9], [650, 1.2], [600, .6]]) { x.fillStyle = OUTC; x.fillRect(mx - 3 * s - 1, FYB - 14 * s - 1, 6 * s + 2, 14 * s + 2); x.fillStyle = '#f4f0e0'; x.fillRect(mx - 3 * s, FYB - 14 * s, 6 * s, 14 * s); x.fillStyle = OUTC; x.fillRect(mx - 11 * s, FYB - 20 * s, 22 * s, 9 * s); x.fillStyle = '#d8d8a8'; x.fillRect(mx - 10 * s, FYB - 19 * s, 20 * s, 7 * s); }
  x.fillStyle = '#1a1024'; x.fillRect(0, FYB, W, H - FYB); x.fillStyle = '#b080ff'; x.fillRect(0, FYB, W, 2);
  for (let i = 0; i < W; i += 40) { x.fillStyle = '#120a1c'; x.fillRect(i, FYB + 2, 2, H); }
  return c;
}
function buildNiiArt() { bgNii = makeNiiBg(); bgVoid = makeVoidBg(); buildFeedArt(); }
THEME.nii = { solid: (s, x, y, w) => drawNiiSolid(s, x, y, w), gate: () => drawNiiGate(), update: dt => { updateCalls(dt); updateTik(dt); }, back: () => drawTik(), front: () => drawCalls() };

// ---------- внешности ----------
const SHIR_LOOK = [
  { skin: '#c8ccbc', hair: '#c8ccbc', style: 'bald', blank: true, coat: '#6a6a4a', shirt: '#8a8a6a', pants: '#5a5a40', shoes: '#2a2a20' },
  { skin: '#bcc4c0', hair: '#bcc4c0', style: 'bald', blank: true, cap: '#4a4a36', coat: '#5a5a44', pants: '#4a4a36', shoes: '#2a2a20' }
];
const VAMP_LOOK = [
  { skin: '#ece4ee', hair: '#16161d', style: 'slick', coat: '#1a1a22', shirt: '#f4f4f8', tie: '#a3111f', pants: '#1a1a22', shoes: '#101014', fangs: true, lips: '#a3111f', brow: true },
  { skin: '#f4e8f0', hair: '#2a0a14', style: 'long', coat: '#3a0a18', skirt: '#16161d', pants: '#16161d', shoes: '#101014', fangs: true, lips: '#c8202a' }
];
// Тихонов: кожанка девяностых, усы, диктофон
const TIK_LOOK = { skin: '#eab894', hair: '#3a2a1e', style: 'short', mus: '#3a2a1e', coat: '#3a2a22', shirt: '#c8c8d0', pants: '#3a4a6a', shoes: '#16161d' };
function niiSprites() {
  const out = [];
  const set = (pre, lk, prop) => {
    const a = (n, p) => out.push(dollItem(pre + n, lk, p, 2));
    a('idle', { armF: [.5, 5, 1.2, 4], prop });
    a('give', { armF: [1.4, 5, 1.55, 5], armB: [.9, 5, 1.3, 5], lean: 1.2, mouth: 'o' });
    a('throw', { armF: [2.7, 5, 2.4, 5], lean: -.6, mouth: 'o' });
    a('run0', Object.assign({}, RUN[0], { prop, mouth: 'o' }));
    a('run1', Object.assign({}, RUN[2], { prop, mouth: 'o' }));
    a('ko', { armB: [-2.6, 5, -2.2, 5], armF: [2.7, 5, 2.4, 5], lean: -1.4, mouth: 'o', eyes: 'x' });
    a('scared', { armF: [2.3, 4, 3.1, 4], armB: [-2.3, 4, -3.1, 4], mouth: 'o', dy: 1 });
  };
  SHIR_LOOK.forEach((lk, v) => set('h' + v + '_', lk, 'can'));
  VAMP_LOOK.forEach((lk, v) => set('vp' + v + '_', lk, undefined));
  const tk = (n, p) => out.push(dollItem('tk_' + n, TIK_LOOK, p, 2));
  tk('idle', { armF: [1.2, 5, 1.9, 4], prop: 'phone' });
  tk('scared', { armF: [2.3, 4, 3.1, 4], armB: [-2.3, 4, -3.1, 4], mouth: 'o', dy: 1, lean: -.5 });
  tk('w0', Object.assign({}, RUN[0], { prop: 'phone' })); tk('w1', Object.assign({}, RUN[2], { prop: 'phone' }));
  // Великая Мышь: серая, уши, корона
  const [mc, mx] = mkCanvas(96, 80), r = (a, b, w, h, k) => { mx.fillStyle = k; mx.fillRect(a, b, w, h); };
  r(4, 6, 30, 30, OUTC); r(62, 6, 30, 30, OUTC); r(6, 8, 26, 26, '#8a8a96'); r(64, 8, 26, 26, '#8a8a96'); r(11, 13, 16, 16, '#e8a0b8'); r(69, 13, 16, 16, '#e8a0b8');
  r(18, 22, 60, 54, OUTC); r(20, 24, 56, 50, '#9a9aa6'); r(28, 50, 40, 22, '#b8b8c4');
  r(30, 36, 8, 10, OUTC); r(58, 36, 8, 10, OUTC); r(32, 37, 3, 3, '#fff'); r(60, 37, 3, 3, '#fff');
  r(44, 52, 8, 6, '#e05a7a'); r(46, 52, 3, 2, '#ff9ab8');
  r(10, 56, 26, 1, OUTC); r(8, 61, 28, 1, OUTC); r(60, 56, 26, 1, OUTC); r(60, 61, 28, 1, OUTC);
  r(34, 10, 28, 12, OUTC); r(36, 12, 24, 8, '#e9b616'); r(36, 6, 4, 6, '#e9b616'); r(46, 4, 4, 8, '#e9b616'); r(56, 6, 4, 6, '#e9b616'); r(47, 14, 2, 2, '#c8202a');
  out.push({ name: 'mouse', c: mc, w: 96, h: 80, ax: 48, ay: 80 });
  // книга Виктора и поганка
  const [bc, bx] = mkCanvas(16, 20);
  bx.fillStyle = OUTC; bx.fillRect(0, 0, 16, 20); bx.fillStyle = '#e9b616'; bx.fillRect(1, 1, 13, 18); bx.fillStyle = '#efe6cf'; bx.fillRect(14, 2, 1, 16); bx.fillStyle = OUTC; bx.fillRect(3, 4, 9, 2); bx.fillRect(3, 8, 6, 1); bx.fillStyle = '#5a86c0'; bx.fillRect(3, 13, 9, 3);
  out.push({ name: 'vbook', c: bc, w: 16, h: 20, ax: 8, ay: 10 });
  const [sc, sx] = mkCanvas(16, 16);
  sx.fillStyle = OUTC; sx.fillRect(5, 6, 6, 10); sx.fillRect(0, 2, 16, 7); sx.fillRect(3, 0, 10, 3);
  sx.fillStyle = '#f4f0e0'; sx.fillRect(6, 8, 4, 7); sx.fillStyle = '#d8d8a8'; sx.fillRect(1, 3, 14, 5); sx.fillRect(4, 1, 8, 2); sx.fillStyle = '#e8e8c0'; sx.fillRect(4, 2, 4, 1);
  out.push({ name: 'shroom', c: sc, w: 16, h: 16, ax: 8, ay: 16 });
  return out.concat(feedSprites());
}

// ---------- уровень ----------
function buildLevel5() {
  const k = levelKit(6600), l = k.l, { fl, bl, pl, mv, ag, cs } = k;
  l.name = 'НИИ ПОКРОВ-17'; l.theme = 'nii'; l.bgA = bgNii; l.song = 'nii';
  const shir = (x, y, kind, line, v, o) => ag(x, y, kind, line, Object.assign({ as: shirAs(v || 0) }, o || {}));
  const vamp = (x, line, v) => ag(x, FY, 'give', line, { as: vampAs(v || 0) });
  l.calls = [
    { x: 1150, lines: ['ГОВОРИТ МОСКВА. ВЕЛИКАЯ МЫШЬ.', 'КАК ДОБЫЧА БАБЛОСА?', 'СОРОК ПЕРВЫЙ — САМОЕ ЖИРНОЕ МЕСТОРОЖДЕНИЕ. КАЧАЙТЕ.'] },
    { x: 4420, lines: ['ЭТО ЕЩЁ КТО? ПЕЛЕВИН?', 'НЕ ТОТ? ВСЁ РАВНО НЕ ПУСКАТЬ.', 'ШИРЛИКИ, ВЫ ЧТО, СПИТЕ?'] },
    { x: 6080, lines: ['ДАЛЬШЕ ПУСТЬ ВИКТОР ОЛЕГОВИЧ РАЗБИРАЕТСЯ.', 'ОН ПОЙМЁТ. ОН ВСЕГДА ВСЁ ПОНИМАЕТ.'] }
  ];
  l.tik = { x: 3480, st: 'wait', t: 0, i: -1 };
  fl(-200, 1450); fl(1560, 2800); fl(2920, 4200); fl(4330, 7000);
  // A: проходная
  k.sign(60, 236, ['НИИ ПОКРОВ-17:', 'ПОСТОРОННИМ — НЕТ', 'ПЕЛЕВИНЫМ — ТЕМ БОЛЕЕ'], 220);
  cs(340, FY, 'socks', 0);
  shir(600, FY, 'sit', 'ПРОПУСК ЕСТЬ? А, ПЕЛЕВИН. ВСЁ РАВНО НЕТ', 0);
  shir(900, FY, 'patrol', 'СМЕНА ШИРЛИКОВ. НЕ МЕШАЙТЕ ДОБЫЧЕ', 1, { range: 120 });
  bl(1080, 346, 70, 40); bl(1150, 306, 70, 80); shir(1185, 306, 'sit', 'Я ТУТ ПРОСТО ВЕДРО ДЕРЖУ', 0);
  ag(1350, FY, 'sit', 'меня сюда сослали из Тбилиси. блёрб?');
  // B: цех
  k.check(1640);
  k.zap(1800, 250, 2.6, 0);
  vamp(2000, 'СВЕЖИЙ СТРАХ! ИДИ СЮДА', 0);
  pl(2150, 320, 80); pl(2290, 270, 80); cs(2320, 270, 'heart', 1);
  shir(2500, FY, 'patrol', 'НАРЯД №17: ПЕЛЕВИНА ВЫВЕСТИ', 0, { range: 140 });
  pl(2815, 336, 80);
  // C: месторождение и Тихонов
  k.check(3000);
  k.sign(3080, 236, ['МЕСТОРОЖДЕНИЕ:', '«1941»', 'ДОБЫЧА КРУГЛОСУТОЧНО'], 200);
  cs(3820, FY, 'books', 3);
  vamp(3980, 'ДИСКУРС И ГЛАМУР! КУСЬ!', 1);
  mv(4150, 4270, 330, 70, 45);
  // D: отгрузка баблоса
  k.check(4420);
  shir(4600, FY, 'sit', 'ШИРЛИКИ ВСЕГДА ДЕЖУРЯТ', 1); shir(4660, FY, 'sit', 'И НОЧЬЮ ТОЖЕ', 0);
  k.zap(4800, 230, 2.4, 0); k.zap(4960, 230, 2.4, 1.2);
  cs(5100, FY, 'matryoshka', 2);
  vamp(5300, 'МЫШЬ ВЕЛЕЛА ТЕБЯ ВЫПИТЬ', 0);
  bl(5480, 346, 70, 40); bl(5550, 306, 70, 80); l.pot = { x: 5585, y: 306 };
  ag(5750, FY, 'give', 'в Тбилиси нет баблоса! дайте хоть блёрб');
  cs(5900, FY, 'letter', 4);
  shir(6020, FY, 'patrol', 'ДАЛЬШЕ ВАШ ДВОЙНИК. НЕ ПУТАЙТЕСЬ', 1, { range: 90 });
  k.sign(6200, 240, ['ОТДЕЛ ПУСТОТЫ →', 'В. О. ПЕЛЕВИН', 'НЕ БЕСПОКОИТЬ'], 170);
  l.fallX = 4500;
  mouseCall = null; mouseSeen = false; mouseCard = 0; tikCard = 0;
  return k.done();
}
LEVELS.push({
  name: 'НИИ ПОКРОВ-17', sub: 'босс: ???', build: buildLevel5, boss: true, bossKind: 'vic', tag: 'НЕ ПЕРЕПУТАЙ!',
  endA: 'ПЕЛЕВИН ОСТАЛСЯ ОДИН.', endB: 'Какой — уточняется.', relocLabel: 'РАЗОГНАНО',
  cast: [['АЛЕКСАНДР ПЕЛЕВИН', 'или виктор?'], ['ВИКТОР ПЕЛЕВИН', 'или александр?'], ['ШИРЛИКИ', 'низший персонал'], ['ВАМПИРЫ', 'добывают баблос'], ['ВЕЛИКАЯ МЫШЬ', 'на связи из москвы'], ['ТИХОНОВ', 'не укушен. сам'], ['АНАСТАСИЯ МИРОНОВА', 'с мегафоном'], ['ПОГАНКИ', 'съедены'], ['КНИГА', 'твёрдый переплёт']]
});

// ---------- босс: Виктор Пелевин ----------
const VIC_GREET = ['ТЫ КТО? А, ТЫ ПЕЛЕВИН.', 'Я ТОЖЕ ПЕЛЕВИН. ТОЛЬКО ДРУГОЙ.', 'НАС ПУТАЮТ. ЭТО НЕ ПРОБЛЕМА. ЭТО ДИСКУРС.', 'ДАВАЙ РАЗБЕРЁМСЯ, КТО ИЗ НАС КТО.'];
const VIC_SHOUT = ['ВСЁ — ПУСТОТА. ДАЖЕ ТЫ', 'ЭТО НЕ ТЫ БЬЁШЬ. ЭТО ДИСКУРС', 'БАБЛОС — ЛУЧШИЙ ДРУГ ЧЕЛОВЕКА', 'ОСЕНЬЮ ВЫЙДЕТ РОМАН. ПРО ТЕБЯ', 'Я НЕ ДАЮ ИНТЕРВЬЮ. ДАЖЕ СЕЙЧАС', 'ТЫ ВСЕГО ЛИШЬ ОПЕЧАТКА', 'ТЕБЯ ТОЖЕ НИКТО НЕ ВИДЕЛ?'];
const VIC_HEAL = ['ПОГАНКИ. ДЛЯ ЯСНОСТИ', 'МИНУТКУ. ПРИСЯДУ', 'ГРИБНОЙ ПЕРЕРЫВ', 'ЛЕКАРСТВО. ОТ РЕАЛЬНОСТИ'];
const VIC_HURT = ['ЭТО БЫЛО ЛИШНЕЕ', 'НЕПЛОХО. ДЛЯ ТЁЗКИ', 'ОЙ. РЕАЛЬНОСТЬ', 'ПОРВАЛ МНЕ ДИСКУРС', 'ТАК И ЗАПИШУ В РОМАН'];
const VIC_BOOK = ['«ЧАПАЕВ И ПУСТОТА»', '«GENERATION П»', '«EMPIRE V»', '«ОМОН РА»', '«ЖИЗНЬ НАСЕКОМЫХ»', '«S.N.U.F.F.»', '«t»'];
const SWAP_LINES = ['ВАС ОПЯТЬ ПЕРЕПУТАЛИ', 'ТЕПЕРЬ ТЫ — ВИКТОР', 'А КТО ИЗ ВАС КТО?', 'ИЗДАТЕЛЬ ТОЖЕ НЕ ЗНАЕТ', 'ЧИТАТЕЛИ В ШОКЕ'];
const VIC_SEQ = [null, ['books', 'walk', 'heal', 'void'], ['books', 'void', 'heal', 'walk', 'books'], ['void', 'books', 'heal', 'books', 'void', 'walk']];
let vRings = [], vicCard = 0;
function startVic() {
  L = buildBossLevel(); L.theme = 'nii'; L.bg = bgVoid; L.song = 'vic'; L.name = 'ОТДЕЛ ПУСТОТЫ'; L.swap = false;
  cam = 0; look = 0; vRings = []; vicCard = 0;
  parts = []; gibs = []; pickups = []; folders = []; floats = []; fxs = []; blurbs = []; words = []; mir = null;
  Object.assign(P, { x: 90, y: FYB, vx: 0, vy: 0, hp: P.maxhp, face: 1, inv: 0, hurtT: 0, atk: 0, onGround: true, idleT: 0, bub: null, clean: 0, crouch: false, h: 76, idleAnim: '', safeX: 90, safeY: FYB, vodka: 0, kefir: 0, signT: 0 });
  boss = { kind: 'vic', title: 'ВИКТОР ПЕЛЕВИН', x: 640, y: FYB, hp: 12, max: 12, phase: 1, state: 'greet', t: 0, n: 0, seq: 0, line: 0, face: -1, inv: 0, fl: 0, bub: null, dead: false, started: false, healN: 0, stunHits: 0, swapT: 7, target: 640, fade: 1,
    prize: ['ПОЛУЧЕНО: СВОЁ ИМЯ', '(хотя бы на обложке)'] };
  mode = 'play'; modeT = 0; scene = 'play'; chain = 0; pendingCele = false; stopSong();
  banner = { s: 'ОТДЕЛ ПУСТОТЫ', sub: 'тут сидит другой Пелевин', t: 2.2 };
}
function vicBegin() { const b = boss; if (b.started) return; b.started = true; banner = null; playSong('vic'); vicCard = 3.8; vicNext(); }
function vicNext() {
  const b = boss, s = VIC_SEQ[b.phase];
  do { b.state = s[b.seq % s.length]; b.seq++; } while (b.state === 'heal' && b.hp >= b.max);
  b.t = 0; b.n = 0; b.healN = 0;
  if (b.state === 'walk') b.target = P.x < W / 2 ? rnd(480, 700) : rnd(100, 320);
  if (b.state === 'heal') say(b, pick(VIC_HEAL), 1.6);
  else if (!b.bub && Math.random() < .5) say(b, pick(VIC_SHOUT), 1.6);
}
function vicBook() {
  const b = boss, x = b.x + b.face * 20, y = b.y - 70, tx = P.x, ty = P.y - 40;
  const dx = tx - x, vx = clamp(Math.abs(dx) / .95, 200, 360) * (sign(dx) || -1), Tt = Math.abs(dx / vx), gr = 520;
  const vy = clamp((ty - y - .5 * gr * Tt * Tt) / Math.max(.3, Tt), -460, 220);
  blurbs.push({ x, y, vx, vy, g: gr, q: pick(VIC_BOOK), from: b, back: false, t: 0, rot: 0, paper: true, spr: 'vbook', kind: 'vbook', hitTxt: 'ПРОЧИТАН ДРУГИМ ПЕЛЕВИНЫМ' });
  sfx.paper();
}
function vicDamage(by) {
  const b = boss; if (b.dead || mode !== 'play') return;
  b.hp--; b.fl = .3; hitstop = .07; shake = Math.max(shake, 8); sfx.bonk(); sfx.stamp();
  confetti(b.x, b.y - 60, 5, 160);
  floater(by === 'book' ? pick(['ОТВЕТ ТИТУЛЬНЫМ ЛИСТОМ', 'САМ СЕБЯ ПРОЧИТАЛ', 'ВОЗВРАТ В ИЗДАТЕЛЬСТВО']) : pick(['РАЗ!', 'ДВА!', 'НЕ ПУТАЙ!']), b.x, b.y - 110, { color: '#ffe36b', size: 10, t: .9, vy: -40 });
  if (b.hp <= 0) { vicWin(); return; }
  const np = b.hp <= 4 ? 3 : b.hp <= 8 ? 2 : 1;
  if (np !== b.phase) { b.phase = np; b.seq = 0; if (np === 3) pickups.push({ k: 'heart', x: clamp(P.x + rnd(-100, 100), 60, W - 60), y: 40, vx: 0, vy: 0, t: 0 }); }
  if (!b.bub || Math.random() < .5) say(b, pick(VIC_HURT), 1.3);
}
// сбил лечение: поганка выпадает тебе, Виктор оглушён и пропустит два удара
function vicInterrupt() {
  const b = boss; b.state = 'stun'; b.t = 0; b.stunHits = 2; sfx.stamp(); sfx.bonk(); hitstop = .08; shake = Math.max(shake, 8);
  floater('ЛЕЧЕНИЕ СБИТО!', W / 2, 96, { scr: true, color: '#ffe36b', size: 16, t: 1.4, vy: -10 });
  pickups.push({ k: 'shroom', x: b.x, y: b.y - 60, vx: sign(P.x - b.x || -1) * 140, vy: -320, t: 0 });
  say(b, pick(['МОИ ПОГАНКИ!', 'ЭТО БЫЛО ЛЕКАРСТВО!', 'ТЫ СБИЛ МНЕ САТОРИ']), 1.4);
  if (!P.bub) say(P, pick(['ДВА УДАРА — И В ПУСТОТУ', 'НЕ ЕШЬ ЭТО', 'ПОГАНКИ ТЕПЕРЬ МОИ']), 1.2);
}
function vicMelee(x0, x1, y0, y1) {
  const b = boss; if (!b || b.dead || P.atkSet.has(b)) return;
  if (b.x + 16 > x0 && b.x - 16 < x1 && b.y > y0 && b.y - 76 < y1) {
    P.atkSet.add(b);
    if (!b.started) { vicBegin(); return; }
    if (b.state === 'heal') vicInterrupt();
    else if (b.state === 'stun' && b.stunHits > 0) { b.stunHits--; vicDamage('melee'); }
    else { sfx.whoosh(); floater(pick(['СКВОЗЬ ПУСТОТУ', 'МИМО. ЭТО ИЛЛЮЗИЯ', 'НЕ СЕЙЧАС. ЖДИ ПОГАНОК']), b.x, b.y - 100, { color: '#d0b0ff', size: 9, t: .9, vy: -40 }); }
  }
}
function vicPapers() {
  const b = boss; if (!b || b.dead) return;
  for (let i = blurbs.length - 1; i >= 0; i--) {
    const r = blurbs[i]; if (!r.back || r.from !== b) continue;
    if (Math.abs(r.x - b.x) < 26 && r.y > b.y - 80 && r.y < b.y) { blurbs.splice(i, 1); if (b.state === 'heal') vicInterrupt(); else vicDamage('book'); }
  }
}
function vicSwap() {
  const b = boss, px = P.x;
  P.x = clamp(b.x, 30, W - 30); b.x = clamp(px, 60, W - 60); L.swap = !L.swap;
  P.inv = Math.max(P.inv, .7); flash = Math.max(flash, .5); shake = Math.max(shake, 6); sfx.whoosh(); sfx.ok();
  for (const x of [P.x, b.x]) burst(x, FYB - 40, 18, ['#d0b0ff', '#fff', '#ffe36b'], 220, .6, 0);
  floater(pick(SWAP_LINES), W / 2, 130, { scr: true, color: '#d0b0ff', size: 14, t: 1.6, vy: -10 });
  P.face = sign(b.x - P.x) || 1; b.face = -P.face;
  if (b.state === 'walk') b.target = P.x < W / 2 ? rnd(480, 700) : rnd(100, 320);
  if (Math.random() < .5) say(b, pick(['Я — ЭТО ТЫ?', 'ОПЯТЬ ПЕРЕПУТАЛИ', 'НЕУДОБНО ВЫШЛО']), 1.2);
}
function updateVic(dt) {
  const b = boss; if (!b || b.dead) return;
  b.t += dt; b.fl = Math.max(0, b.fl - dt); vicCard = Math.max(0, vicCard - dt);
  if (b.bub) { b.bub.t -= dt; if (b.bub.t <= 0) b.bub = null; }
  const ph = b.phase;
  if (b.state !== 'walk') b.face = P.x < b.x ? -1 : 1;
  switch (b.state) {
    case 'greet':
      if (b.t > .9 && !b.bub) { if (b.line >= VIC_GREET.length) { vicBegin(); break; } say(b, VIC_GREET[b.line++], 2.1); b.t = -1.2; sfx.blip2(); }
      break;
    case 'walk': {
      const d = sign(b.target - b.x); b.face = d; b.x += d * 150 * dt;
      if ((b.target - b.x) * d <= 0 || b.t > 3) { b.x = clamp(b.x, 60, W - 60); vicNext(); }
      break;
    }
    case 'books': {
      const cnt = [2, 3, 4][ph - 1], gap = [.8, .65, .5][ph - 1];
      if (b.n < cnt && b.t > .3 + gap * b.n) { b.n++; vicBook(); }
      if (b.t > .3 + gap * cnt + .6) vicNext();
      break;
    }
    case 'void': {
      const waves = ph === 3 ? 2 : 1;
      if (b.n < waves && b.t > .7 + b.n * .7) { b.n++; vRings.push({ x: b.x, d: -1, t: 0 }, { x: b.x, d: 1, t: 0 }); sfx.boom(); shake = Math.max(shake, 5); }
      if (b.t > 1.3 + waves * .7) vicNext();
      break;
    }
    case 'heal':
      if (b.healN < 3 && b.t > .7 + b.healN * .8) { b.healN++; if (b.hp < b.max) { b.hp++; sfx.heal(); floater('ПОГАНКА +1', b.x, b.y - 90, { color: '#e8e8c0', size: 9, t: 1 }); } }
      if (b.t > 3) vicNext();
      break;
    case 'stun':
      if (b.t > 2.8 || (b.stunHits <= 0 && b.t > .4)) { if (b.stunHits <= 0) say(b, 'ВСЁ. ХВАТИТ.', 1); vicNext(); }
      break;
  }
  // волны пустоты по полу: перепрыгнуть
  for (let i = vRings.length - 1; i >= 0; i--) {
    const r = vRings[i]; r.t += dt; r.x += r.d * 290 * dt;
    if (mode === 'play' && P.inv <= 0 && Math.abs(r.x - P.x) < 18 && P.y > FYB - 26) { floater('ПУСТОТА', P.x, P.y - 110, { color: '#d0b0ff', size: 9, t: 1.2 }); hurtPlayer(r.d, false, 'void'); }
    if (r.x < -40 || r.x > W + 40) vRings.splice(i, 1);
  }
  // путаница: меняются местами и внешностью
  if (b.started && mode === 'play') { b.swapT -= dt; if (b.swapT <= 0) { b.swapT = [11, 9, 7][ph - 1] + rnd(-1, 1); vicSwap(); } }
}
function vicWin() {
  const b = boss; mode = 'bossdeath'; modeT = 0; b.state = 'leave'; b.bub = null; stopSong();
  blurbs = []; vRings = []; P.atk = 0; b.won = 0; b.left = false; b.n = 0;
  if (L.swap) { L.swap = false; flash = .5; floater('ВСЁ ВСТАЛО НА МЕСТА', W / 2, 130, { scr: true, color: '#fff', size: 12, t: 1.6 }); }
  b.face = P.x < b.x ? -1 : 1;
}
function updateVicDeath(dt) {
  const b = boss; P.vx *= .9; P.vy = Math.min(900, P.vy + GRAV * dt); collide(P, dt);
  if (!b.dead) {
    if (modeT > .8 && b.n === 0) { b.n = 1; say(b, 'ЛАДНО. ПУСТЬ ПУТАЮТ.', 2); }
    if (modeT > 3 && b.n === 1) { b.n = 2; say(b, 'ПОЙДУ. ОСЕНЬЮ — НОВЫЙ РОМАН.', 2); }
    if (modeT > 5.2) { b.fade = Math.max(0, b.fade - dt * .8); if (Math.random() < .6) parts.push({ k: 'p', x: b.x + rnd(-14, 14), y: b.y - rnd(0, 76), vx: rnd(-20, 20), vy: -rnd(30, 80), s: 2, c: '#d0b0ff', life: .8, g: -30 }); }
    if (b.fade <= 0) { b.dead = true; b.left = true; sfx.whoosh(); memorial.push(['Виктор Пелевин', 'ушёл в пустоту. обещал вернуться осенью']); }
  } else if (!b.won) { b.won = .001; P.clean = 1; playSong('win'); burst(P.x, P.y - 80, 20, ['#fff', '#ffe36b'], 200, .7); }
  else { b.won += dt; if (b.won > 3.4 && mode === 'bossdeath') { cele.n = 99; startCelebrate(); cele.title = 'ПЕЛЕВИН'; cele.kind = 'dance'; L.after = true; } }
  if (b.bub) { b.bub.t -= dt; if (b.bub.t <= 0) b.bub = null; }
}
function drawVic() {
  const b = boss;
  for (const r of vRings) { const w = 30 + Math.sin(r.t * 20) * 4; R(r.x - w / 2, FYB - 22, w, 22, 'rgba(176,128,255,.35)'); R(r.x - w / 2 + 4, FYB - 16, w - 8, 16, 'rgba(208,176,255,.55)'); R(r.x - 3, FYB - 26, 6, 26, '#fff'); }
  if (b.dead) return;
  const pre = L.swap ? 'p_' : 'v_';
  let n = 'idle', oy = 0, ox = 0;
  if (b.state === 'walk') { n = 'r' + ((b.t * 10 | 0) % 4); }
  else if (b.state === 'books') n = (b.t - .3) % ([.8, .65, .5][b.phase - 1]) < .2 ? 'toss' : 'idle';
  else if (b.state === 'void') n = 'void';
  else if (b.state === 'heal') { n = 'sit'; oy = (gameT * 4 | 0) % 2 ? -1 : 0; }
  else if (b.state === 'stun') { n = 'hit'; ox = (gameT * 30 | 0) % 2 ? 2 : -2; }
  else if (b.fl > 0) n = 'hit';
  g.globalAlpha = .3 * b.fade; R(b.x - 22, FYB - 2, 44, 5, '#000'); g.globalAlpha = 1;
  spr(pre + n, b.x + ox, b.y + oy, b.face < 0, { a: b.fade });
  if (b.fl > .12) spr(pre + n, b.x + ox, b.y + oy, b.face < 0, { img: atlasW, a: .7 });
  if (b.state === 'heal') for (let i = 0; i < 3; i++) { const a = gameT * 2 + i * 2.1; spr('shroom', b.x + Math.cos(a) * 34, b.y - 50 + Math.sin(a) * 14, false); }
  if (b.state === 'stun') for (let i = 0; i < 3; i++) { const a = gameT * 5 + i * 2.1; T('*', b.x + Math.cos(a) * 18 - camR, b.y - 84 + Math.sin(a) * 5, { size: 8, color: '#ffe36b' }); }
  if (b.bub) bubble(b.bub.s, b.x, b.y - 96, { prio: 5, size: 10, max: 18, shake: b.fl > 0 ? 2 : 0, bg: L.swap ? '#e9f1ff' : '#fff', color: b.fl > 0 ? '#a3111f' : '#16161d' });
}
function drawVicHud() {
  const b = boss;
  if (vicCard > 0) OV.push(c => { c.globalAlpha = Math.min(1, vicCard * 2, (3.8 - vicCard) * 4); c.fillStyle = OUTC; c.fillRect(W / 2 - 200, 56, 400, 50); c.fillStyle = '#2a1840'; c.fillRect(W / 2 - 196, 60, 392, 42); c.font = '11px PS2P,monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText('ВАС БУДУТ ПУТАТЬ', W / 2, 74); c.font = '7px PS2P,monospace'; c.fillStyle = '#d0b0ff'; c.fillText('бей, когда он ест поганки. отбивай его книги', W / 2, 92); c.globalAlpha = 1; });
  if (!b.started || b.dead || b.state === 'leave') return;
  T(L.swap ? 'АЛЕКСАНДР ПЕЛЕВИН (?)' : 'ВИКТОР ПЕЛЕВИН', W / 2, 16, { size: 9, color: '#d0b0ff', stroke: OUTC });
  OV.push(c => { c.fillStyle = OUTC; c.fillRect(W / 2 - 152, 26, 304, 12); const sw = 300 / b.max; for (let i = 0; i < b.max; i++) { c.fillStyle = i < b.hp ? (b.phase === 3 ? '#ff5b6b' : b.phase === 2 ? '#ffb35b' : '#d0b0ff') : '#2a3350'; c.fillRect(W / 2 - 150 + i * sw, 28, sw - 2, 8); } });
  if (b.state === 'heal' && (gameT * 3 | 0) % 2) T('ЕСТ ПОГАНКИ — СБЕЙ!', W / 2, 56, { size: 10, color: '#e8e8c0', stroke: OUTC, sw: 4 });
  if (b.state === 'stun' && b.stunHits > 0) T('БЕЙ! ×' + b.stunHits, W / 2, 56, { size: 12, color: '#ffe36b', stroke: OUTC, sw: 4 });
}
// кат-сцена: Виктор ест поганки, потом их путают
function vicIntroTick(dt) {
  const t = sceneT, at = k => t >= k && t - dt < k;
  if (t > .6 && t < 2 && ((t - .6) * 12 | 0) !== ((t - dt - .6) * 12 | 0)) sfx.blip();
  if (at(2.2) || at(3)) sfx.blip2();
  if (at(4.4)) { sfx.whoosh(); sfx.ok(); flash = .6; }
}
function drawVicIntro() {
  const t = sceneT, sw = t > 4.4;
  g.drawImage(bgVoid, 0, 0); g.fillStyle = 'rgba(6,4,14,.35)'; g.fillRect(0, 0, W, H);
  spr(sw ? 'v_idle' : 'p_idle', 200, FYB, false);
  spr(sw ? 'p_sit' : t < 3.6 ? 'v_sit' : 'v_idle', 580, FYB, true);
  const nm = 'ВИКТОР ПЕЛЕВИН', n = clamp(((t - .6) * 12 | 0), 0, nm.length);
  T(nm.slice(0, n), W / 2, 112, { size: 22, color: '#fff', stroke: '#2a1840', sw: 7 });
  if (t > 2.2) T('тот самый. другой', W / 2, 146, { size: 9, color: '#d0b0ff', stroke: OUTC });
  if (t > 3) T('вас постоянно путают', W / 2, 166, { size: 9, color: '#d0b0ff', stroke: OUTC });
  if (sw) T('…ВОТ, ОПЯТЬ', W / 2, 206, { size: 14, color: '#ffe36b', stroke: OUTC, sw: 5 });
}
BK.vic = { start: startVic, update: updateVic, death: updateVicDeath, draw: drawVic, hud: drawVicHud, melee: vicMelee, papers: vicPapers, intro: drawVicIntro, introTick: vicIntroTick, introLen: 6.4 };
Object.assign(window.__dbg, { vic() { curLevel = 4; startVic(); }, vicIntro() { curLevel = 4; startBossIntro(); }, swap() { vicSwap(); }, tik: () => L.tik, calls: () => mouseCall });

// ---------- музыка ----------
// НИИ: тревожно, ре минор, тритон в басу
SONGS.nii = (() => {
  const pat = (r, f, t) => [r, r, f, r, t, r, f, r].map(n => n + ':2').join(' ');
  const B = { D: ['D2', 'A2', 'G#2'], A: ['A1', 'E2', 'D#2'], F: ['F2', 'C3', 'B2'], Bb: ['A#1', 'F2', 'E2'] };
  const bass = ['D', 'D', 'D', 'A', 'F', 'D', 'Bb', 'A'].map(k => pat(...B[k])).join(' ');
  const lead = 'D5:4 F5:2 A5:2 G#5:6 -:2 G5:2 F5:2 E5:2 F5:2 D5:8 D5:4 F5:2 A5:2 D6:4 C#6:4 A#5:2 A5:2 G5:2 E5:2 A5:8 F5:4 A5:2 C6:2 B5:6 -:2 A5:2 G5:2 F5:2 E5:2 F5:8 D5:2 E5:2 F5:2 G#5:2 A5:4 A#5:4 A5:4 G#5:4 A5:8';
  return { bpm: 116, loop: true, tr: [{ w: 'p12', v: .07, s: seq(lead) }, { w: 'triangle', v: .24, s: seq(bass) }], dr: 'k..hs..hk.k.s..h' };
})();
// Виктор: ми минор с гармоническим вводным тоном, быстро
SONGS.vic = (() => {
  const lead = ['E5:2 G5:2 B5:2 E6:2 D#6:4 B5:4', 'C6:2 B5:2 A5:2 G5:2 F#5:4 D#5:4', 'E5:2 G5:2 B5:2 E6:2 F#6:4 G6:4', 'F#6:2 E6:2 D#6:2 C6:2 B5:8',
    'A5:3 B5:1 C6:4 B5:3 A5:1 G5:4', 'F#5:3 G5:1 A5:4 G5:2 F#5:2 E5:4', 'A5:2 C6:2 E6:2 C6:2 B5:2 D#6:2 F#6:2 D#6:2', 'E6:6 B5:2 E5:8'].join(' ');
  const echo = seq('-:1 ' + lead); echo[echo.length - 1][1] -= 1;
  return { bpm: 152, loop: true, tr: [{ w: 'p25', v: .09, s: seq(lead) }, { w: 'p12', v: .03, s: echo }, { w: 'triangle', v: .26, s: bassLine(['E2', 'B1', 'E2', 'B1', 'A1', 'E2', 'A1', 'E2']) }], dr: 'k.hhs.h.k.hhs.hh' };
})();
