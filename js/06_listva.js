// ---------- ЭТАП 4: ЛАВКА «ЛИСТВА» ----------
// Книжная лавка. Иноагенты, как обычно, с блёрбами, но тут ещё юные читатели:
// бегут за автографом, их бить НЕЛЬЗЯ (минус сердце и скандал). Добежал — Пелевин
// подписывает книгу и на секунду стоит на месте. На заднем плане время от времени
// полиция уводит Савву Федосеева. Босс — Владислав Угольный в костюме горничной:
// бить его тоже нельзя, только поить. Падают «пузыри» (бутылки водки), их надо кидать в него.
// Все персонажи — карикатуры.
let bgListva = null, bgHall = null;
DEATH.fan = ['СКАНДАЛ', 'писатель ударил читателя. это навсегда'];
DEATH.plate = ['РАЗБИТ', 'сервиз был на двенадцать персон'];
DEATH.dust = ['ЗАПЫЛЁН', 'тебя протёрли и поставили на полку'];
DEATH.mop = ['ВЫМЫТ', 'пол блестит. ты лежишь'];

// ---------- юные читатели ----------
const FAN_ASK = ['АВТОГРАФ! ПОЖАЛУЙСТА!', 'Я ВАС С ДЕВЯТОГО КЛАССА ЧИТАЮ!', 'ПОДПИШИТЕ МАМЕ!', 'А ВЫ ТОТ САМЫЙ?', 'МОЖНО АВТОГРАФ? И СЕЛФИ?', 'ПОДПИШИТЕ «ДЛЯ ВАСИ»!', 'Я ПРОГУЛЯЛ ПАРУ РАДИ ВАС!'];
const FAN_THANK = ['СПАСИБО!!!', 'ПОКАЖУ ВСЕМ!', 'ПОВЕШУ НАД КРОВАТЬЮ', 'ЛУЧШИЙ ДЕНЬ!', 'НЕ БУДУ МЫТЬ РУКУ'];
const FAN_CRY = ['ЗА ЧТО?!', 'Я ЖЕ ПРОСТО ЧИТАЮ…', 'НАПИШУ ОТЗЫВ. ПЛОХОЙ', 'МАМА!!!', 'БОЛЬШЕ НЕ ЧИТАЮ!'];
const P_SIGN = ['ДЛЯ ВАСИ. БЕЗ БЛЁРБА', 'ЧИТАЙ ДО КОНЦА', 'ПОДПИСАЛ', 'НЕ ПРОДАВАЙ НА АВИТО', 'ЭТО ТЕБЕ, А НЕ НА ОБЛОЖКУ'];
function mkFan(x, y, line) { return { x, y, v: rint(0, 2), st: 'wait', t: rnd(2), face: -1, bub: null, line, mv: false, dir: 0 }; }
function updateFans(dt) {
  P.signT = Math.max(0, (P.signT || 0) - dt);
  let signing = L.fans.some(f => f.st === 'sign');
  for (let i = L.fans.length - 1; i >= 0; i--) {
    const f = L.fans[i]; f.t += dt; f.mv = false;
    if (f.bub) { f.bub.t -= dt; if (f.bub.t <= 0) f.bub = null; }
    const dx = P.x - f.x, dist = Math.abs(dx), near = Math.abs(P.y - f.y) < 120;
    if (f.st === 'wait') {
      f.face = sign(dx) || -1;
      if (dist < 300 && near) { f.st = 'run'; say(f, f.line || pick(FAN_ASK), 1.8); sfx.squeak(); }
    } else if (f.st === 'run') {
      f.face = sign(dx) || 1;
      const gap = signing ? 64 : 20;
      if (dist > gap && groundBelow(f.x + f.face * 14, f.y)) { f.x += f.face * 165 * dt; f.mv = true; }
      if (!signing && dist <= 26 && P.onGround && Math.abs(P.y - f.y) < 30 && P.hurtT <= 0) {
        f.st = 'sign'; f.t = 0; signing = true;
        P.signT = .9; P.face = sign(f.x - P.x) || 1; P.vx = 0; P.atk = 0; sfx.typewriter(); say(P, pick(P_SIGN), 1.2);
      }
      if (dist > 520) f.st = 'wait';
    } else if (f.st === 'sign') {
      f.face = sign(dx) || 1;
      if (f.t > .9) {
        f.st = 'happy'; f.t = 0; stats.signed++; say(f, pick(FAN_THANK), 1.4); sfx.heal();
        floater('АВТОГРАФ!', f.x, f.y - 86, { color: '#7fe08a', size: 9, t: 1.2 });
        pickups.push({ k: 'copy', x: f.x, y: f.y - 50, vx: 0, vy: -300, t: 0 });
      }
    } else {
      // счастливый или обиженный — убегает
      if (!f.dir) f.dir = sign(f.x - P.x) || 1;
      if (f.t > (f.st === 'happy' ? .6 : .25)) { f.face = f.dir; f.x += f.dir * 210 * dt; f.mv = true; }
      if (f.st === 'cry' && Math.random() < .3) parts.push({ k: 'p', x: f.x + rnd(-6, 6), y: f.y - 58, vx: rnd(-40, 40), vy: -rnd(40, 90), s: 2, c: '#8fdcff', life: .5, g: 400 });
      if (!inView(f.x, 140)) L.fans.splice(i, 1);
    }
  }
}
function fanAttack(x0, x1, y0, y1) {
  for (const f of L.fans) {
    if (f.st === 'cry' || P.atkSet.has(f)) continue;
    if (f.x + 10 > x0 && f.x - 10 < x1 && f.y > y0 && f.y - 56 < y1) { P.atkSet.add(f); fanHurt(f); }
  }
}
function fanHurt(f) {
  f.st = 'cry'; f.t = 0; f.dir = P.face; f.bub = null; say(f, pick(FAN_CRY), 1.6);
  stats.fanHit++; sfx.buzz(); hitstop = .08; shake = Math.max(shake, 8);
  floater('ПИСАТЕЛЬ УДАРИЛ ЧИТАТЕЛЯ!', f.x, f.y - 100, { color: '#ff5b6b', size: 9, t: 2, vy: -20 });
  P.signT = 0; P.inv = 0; hurtPlayer(-P.face, false, 'fan');
}
function drawFans() {
  for (const f of L.fans) {
    if (!inView(f.x, 60)) continue;
    const pre = 'f' + f.v + '_'; let n = 'idle', oy = 0;
    if (f.st === 'sign') n = 'give';
    else if (f.st === 'happy' && f.t < .6) { n = 'happy'; oy = -Math.abs(Math.sin(f.t * 12)) * 8; }
    else if (f.st === 'cry' && f.t < .25) n = 'cry';
    else if (f.mv) { n = (f.t * 9 | 0) % 2 ? 'run0' : 'run1'; oy = -Math.abs(Math.sin(f.t * 16)) * 3; }
    else if (f.st === 'run') n = 'give';
    else { const ph = f.t % 2.2; if (ph < .3) oy = -Math.sin(ph / .3 * Math.PI) * 3; }
    spr(pre + n, f.x, f.y + oy, f.face < 0, { sx: .8 });
    if (f.bub) bubble(f.bub.s, f.x - camR, f.y - 74, { size: 8, max: 17, prio: 1, bg: '#f0fff0', color: '#1f5a30' });
  }
}

// ---------- на фоне: Савву Федосеева опять уводят ----------
const SAV_SAY = ['Я ПРОСТО ПРОДАЮ КНИГИ!', 'ЭТО КНИЖНЫЙ МАГАЗИН!', 'ОПЯТЬ?! НА ЭТОЙ НЕДЕЛЕ?', 'ДОКУМЕНТЫ НА КАССЕ!', 'ЧЕК ВАМ ПРОБИТЬ?', 'КНИГИ ЖЕ НЕ ЗАПРЕЩЕНЫ… ИЛИ?', 'КТО ЗАКРОЕТ КАССУ?!'];
const POL_SAY = ['ПРОЙДЁМТЕ.', 'РАЗБЕРЁМСЯ.', 'ЧТО ЗА КНИЖКИ?', 'А ЭТО КТО — БУЛГАКОВ? ТОЖЕ ПРОЙДЁМТЕ', 'ГРАЖДАНИН, НЕ ЧИТАЙТЕ', 'ТАМ ВСЁ РАССКАЖЕТЕ'];
let raid = null, raidT = 10, raidCard = 0, raidSeen = false;
function updateRaid(dt) {
  raidCard = Math.max(0, raidCard - dt);
  if (!raid) {
    raidT -= dt;
    if (raidT <= 0) {
      const d = Math.random() < .5 ? 1 : -1;
      raid = { x: d > 0 ? cam - 90 : cam + W + 90, d, t: 0, bub: null, pb: null, lineT: .6, who: 0 };
      if (!raidSeen) { raidSeen = true; raidCard = 3; }
    }
    return;
  }
  const r = raid; r.t += dt; r.x += r.d * 58 * dt;
  if (r.bub) { r.bub.t -= dt; if (r.bub.t <= 0) r.bub = null; }
  if (r.pb) { r.pb.t -= dt; if (r.pb.t <= 0) r.pb = null; }
  r.lineT -= dt;
  if (r.lineT <= 0 && inView(r.x, -40)) { r.lineT = rnd(1.8, 2.6); r.who = 1 - r.who; r.pb = null; r.bub = null; if (r.who) say(r, pick(SAV_SAY), 1.7); else r.pb = { s: pick(POL_SAY), t: 1.5 }; if (r.who && !P.bub && Math.random() < .25) say(P, pick(['САВВУ ОПЯТЬ ПОВЕЛИ', 'ДЕРЖИСЬ, САВВА', 'КТО ТЕПЕРЬ ПРОБЬЁТ МНЕ ЧЕК?']), 1.6); }
  if (r.t > 3 && ((r.d > 0 && r.x > cam + W + 140) || (r.d < 0 && r.x < cam - 140))) { raid = null; raidT = rnd(22, 34); }
}
function drawRaid() {
  const r = raid; if (!r) return;
  const y = FY - 44, st = (r.t * 6 | 0) % 2, bob = -Math.abs(Math.sin(r.t * 12)) * 2, fl = r.d < 0;
  g.globalAlpha = .82;
  R(r.x - 70, y - 2, 140, 3, 'rgba(0,0,0,.35)');
  spr(st ? 'pol_w0' : 'pol_w1', r.x - r.d * 36, y + bob, fl, { sx: .8 });
  spr(st ? 'sav_w1' : 'sav_w0', r.x, y + bob, fl, { sx: .8 });
  spr(st ? 'pol_w1' : 'pol_w0', r.x + r.d * 36, y + bob, fl, { sx: .8 });
  g.globalAlpha = 1;
  if (r.bub) bubble(r.bub.s, r.x - camR, y - 72, { size: 7, max: 16, prio: 0 });
  if (r.pb) bubble(r.pb.s, r.x + r.d * 36 - camR, y - 72, { size: 7, max: 16, prio: 0, bg: '#dfe6ff', color: '#1b2a6b' });
}
function updateListva(dt) { updateFans(dt); updateRaid(dt); }
function drawListvaBack() { drawRaid(); }
function drawListvaFront() {
  drawFans();
  if (raidCard > 0) OV.push(c => { c.globalAlpha = Math.min(1, raidCard * 2, (3 - raidCard) * 4); c.fillStyle = OUTC; c.fillRect(W / 2 - 170, 52, 340, 50); c.fillStyle = '#26304a'; c.fillRect(W / 2 - 166, 56, 332, 42); c.font = '12px PS2P,monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText('САВВА ФЕДОСЕЕВ', W / 2, 70); c.font = '7px PS2P,monospace'; c.fillStyle = '#bfd0ff'; c.fillText('книготорговец. его опять уводят', W / 2, 88); c.globalAlpha = 1; });
}

// ---------- оформление ----------
const BOOKC = ['#b02a35', '#2f6fa8', '#4d8a4a', '#c9a24a', '#7a4fa0', '#e8e4d0', '#d86a2a', '#2a3550'];
function drawListvaSolid(s, x, y, w) {
  if (s.k === 'f') {
    g.fillStyle = pats.panel; g.fillRect(x, y + 8, w, H - y);
    R(x, y, w, 2, '#c9e8a0'); R(x, y + 2, w, 6, '#2f7a4a'); R(x, y + 3, w, 1, '#4fa86a'); R(x, y + 8, w, 2, '#2a1a10');
    R(x, y, 3, H - y, '#2a1a10'); R(x + w - 3, y, 3, H - y, '#2a1a10');
  } else if (s.k === 'b') {
    // книжный шкаф
    R(x, y, w, s.h, OUTC); R(x + 2, y + 2, w - 4, s.h - 4, '#6a4428');
    for (let yy = 4, k = Math.round(x / 9); yy + 14 < s.h; yy += 18) {
      let bx = x + 4;
      while (bx < x + w - 8) { const bw = 4 + (k * 5) % 4, bh = 14 - (k % 3); R(bx, y + yy + 16 - bh, bw, bh, BOOKC[k % BOOKC.length]); bx += bw + 1; k++; }
      R(x + 2, y + yy + 16, w - 4, 2, '#3a2416');
    }
  } else {
    // полка-доска на кронштейнах
    R(x, y, w, 12, OUTC); R(x + 1, y, w - 2, 3, '#d8b080'); R(x + 1, y + 3, w - 2, 7, '#7a5032'); R(x + 1, y + 9, w - 2, 1, '#5a3a22');
    R(x + 4, y + 12, 3, 6, OUTC); R(x + w - 7, y + 12, 3, 6, OUTC);
    if (s.mv) { R(x + 6, y + 12, 8, 8, OUTC); R(x + w - 14, y + 12, 8, 8, OUTC); R(x + 8, y + 14, 4, 4, '#8a92a8'); R(x + w - 12, y + 14, 4, 4, '#8a92a8'); }
  }
}
function drawListvaGate() {
  const x = L.gateX, o = Math.round(L.gate * 118);
  R(x - 14, FY - 152, 98, 152, OUTC); R(x - 10, FY - 148, 90, 148, '#6a4428'); R(x - 10, FY - 148, 90, 4, '#c9a070');
  R(x, FY - 122, 70, 122, '#0b0712');
  for (let y = 0; y < 122 - o; y += 8) { R(x, FY - 122 + y, 70, 7, '#2f7a4a'); R(x, FY - 122 + y, 70, 2, '#4fa86a'); }
  R(x + 26, FY - 142, 18, 8, '#ffe9a0');
  T('ЗАЛ ВСТРЕЧ', x + 35 - camR, FY - 164, { size: 8, color: '#9fe08a', stroke: OUTC });
}
function shelfArt(x, sx, w, top, bottom) {
  x.fillStyle = OUTC; x.fillRect(sx - 4, top - 4, w + 8, bottom - top + 4);
  x.fillStyle = '#5a3a24'; x.fillRect(sx, top, w, bottom - top);
  for (let y = top + 6, k = sx; y + 32 < bottom; y += 34) {
    let bx = sx + 4;
    while (bx < sx + w - 8) { const bw = 5 + (k * 7) % 6, bh = 20 + (k * 13) % 8; x.fillStyle = BOOKC[k % 8]; x.fillRect(bx, y + 28 - bh, bw, bh); x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(bx + 1, y + 31 - bh, bw - 2, 1); bx += bw + 1; k++; }
    x.fillStyle = '#3a2416'; x.fillRect(sx, y + 28, w, 4);
  }
}
function lampArt(x, lx, len) {
  const gr = x.createRadialGradient(lx, len + 10, 4, lx, len + 10, 90); gr.addColorStop(0, 'rgba(255,220,140,.35)'); gr.addColorStop(1, 'rgba(255,220,140,0)');
  x.fillStyle = gr; x.fillRect(lx - 90, len - 80, 180, 180);
  x.fillStyle = OUTC; x.fillRect(lx - 1, 0, 2, len); x.fillRect(lx - 14, len, 28, 12); x.fillStyle = '#2f7a4a'; x.fillRect(lx - 12, len + 1, 24, 9); x.fillStyle = '#ffe9a0'; x.fillRect(lx - 6, len + 10, 12, 3);
}
function makeListvaBg() {
  const [c, x] = mkCanvas(W, H);
  x.fillStyle = '#2a1e1a'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#30241f'; for (let i = 0; i < W; i += 40) x.fillRect(i, 0, 20, 300);
  shelfArt(x, 18, 206, 70, 300); shelfArt(x, 572, 210, 70, 300);
  // витрина: ночная улица
  x.fillStyle = OUTC; x.fillRect(262, 78, 276, 160); x.fillStyle = '#121a3a'; x.fillRect(268, 84, 264, 148);
  x.fillStyle = '#1c2450'; for (const [bx, bw, bh] of [[272, 50, 90], [330, 70, 120], [410, 44, 70], [460, 66, 110]]) x.fillRect(bx, 232 - bh, bw, bh);
  x.fillStyle = '#f3c93a'; for (let i = 0; i < 26; i++) x.fillRect(276 + (i * 37) % 250, 130 + (i * 23) % 90, 4, 5);
  x.fillStyle = OUTC; x.fillRect(396, 84, 6, 148); x.fillRect(268, 156, 264, 4);
  // вывеска
  x.fillStyle = OUTC; x.fillRect(290, 22, 220, 42); x.fillStyle = '#2f7a4a'; x.fillRect(294, 26, 212, 34); x.fillStyle = '#4fa86a'; x.fillRect(294, 26, 212, 3);
  x.fillStyle = '#9fe08a'; x.beginPath(); x.moveTo(318, 34); x.lineTo(330, 43); x.lineTo(318, 52); x.lineTo(306, 43); x.fill(); x.fillStyle = '#2f7a4a'; x.fillRect(317, 36, 2, 15);
  x.font = '16px PS2P,monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#f4f0e0'; x.fillText('ЛИСТВА', 416, 44);
  for (const lx of [130, 400, 676]) lampArt(x, lx, 40);
  // плакат
  x.fillStyle = OUTC; x.fillRect(240, 248, 92, 40); x.fillStyle = '#e8e4d0'; x.fillRect(243, 251, 86, 34); x.font = '6px PS2P,monospace'; x.fillStyle = '#b02a35'; x.fillText('ВСТРЕЧА', 286, 262); x.fillText('С АВТОРОМ', 286, 274);
  x.fillStyle = '#3a2a1e'; x.fillRect(0, 300, W, H - 300); x.fillStyle = '#20160f'; x.fillRect(0, 300, W, 4);
  x.fillStyle = 'rgba(10,6,20,.32)'; x.fillRect(0, 0, W, H);
  return c;
}
function makeHallBg() {
  const [c, x] = mkCanvas(W, H);
  x.fillStyle = '#2c2026'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#33252c'; for (let i = 0; i < W; i += 40) x.fillRect(i, 0, 20, FYB);
  shelfArt(x, 12, 150, 60, 330); shelfArt(x, 638, 150, 60, 330);
  x.fillStyle = OUTC; x.fillRect(206, 30, 388, 56); x.fillStyle = '#a3111f'; x.fillRect(210, 34, 380, 48); x.fillStyle = '#f3c93a'; x.fillRect(210, 34, 380, 3);
  x.font = '12px PS2P,monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff6e0'; x.fillText('ВСТРЕЧА С ЧИТАТЕЛЯМИ', 400, 52);
  x.font = '7px PS2P,monospace'; x.fillStyle = '#ffd0d6'; x.fillText('лавка «листва». вход свободный', 400, 72);
  for (const lx of [260, 540]) lampArt(x, lx, 100);
  // стол с книгами и табличкой
  x.fillStyle = OUTC; x.fillRect(300, 270, 200, 12); x.fillRect(312, 282, 8, 60); x.fillRect(480, 282, 8, 60);
  x.fillStyle = '#7a5032'; x.fillRect(302, 272, 196, 8);
  for (let i = 0; i < 6; i++) { x.fillStyle = BOOKC[i]; x.fillRect(320 + i * 10, 250 - (i % 2) * 4, 9, 20 + (i % 2) * 4); }
  x.fillStyle = OUTC; x.fillRect(420, 254, 50, 16); x.fillStyle = '#f4f0e0'; x.fillRect(422, 256, 46, 12); x.font = '5px PS2P,monospace'; x.fillStyle = OUTC; x.fillText('ПЕЛЕВИН', 445, 262);
  // ряды стульев
  for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) {
    const cx = 60 + i * 84 + r * 40, cy = 350 + r * 26;
    x.fillStyle = OUTC; x.fillRect(cx, cy - 26, 26, 26 + 18); x.fillStyle = r ? '#5a2a3a' : '#4a2230'; x.fillRect(cx + 2, cy - 24, 22, 16); x.fillRect(cx + 2, cy - 6, 22, 6);
  }
  x.fillStyle = '#4a3222'; x.fillRect(0, FYB, W, H - FYB); x.fillStyle = '#c9a24a'; x.fillRect(0, FYB, W, 3);
  for (let i = 0; i < W; i += 48) { x.fillStyle = '#3a2618'; x.fillRect(i, FYB + 3, 2, H); }
  x.fillStyle = 'rgba(10,6,20,.22)'; x.fillRect(0, 0, W, H);
  return c;
}
function buildListvaArt() { bgListva = makeListvaBg(); bgHall = makeHallBg(); }

// ---------- внешности ----------
const FAN_LOOK = [
  { skin: '#f6d2b0', hair: '#3a2a20', style: 'short', coat: '#e9b616', pants: '#3a5a9a', shoes: '#f4f4f8' },
  { skin: '#f2d0b4', hair: '#c8862e', style: 'long', coat: '#3d8a6a', skirt: '#2a3550', pants: '#2a2a3a', shoes: '#14141a', lips: '#d8806e' },
  { skin: '#e8b890', hair: '#1a1410', style: 'curly', glasses: true, coat: '#7a4fa0', pants: '#2a3550', shoes: '#c2303c' }
];
// Савва: крупный, кудрявый, густая борода, серо-синий пиджак, чёрная водолазка
const SAV_LOOK = { skin: '#f0c8a8', hair: '#5a4232', style: 'curly', beard: '#6a4a32', coat: '#4a5878', shirt: '#16161d', pants: '#2a2e3a', shoes: '#14141a', wide: true, brow: true };
const POL_LOOK = { skin: '#eab894', hair: '#2a2420', style: 'short', cap: '#26304a', coat: '#2e3a5a', pants: '#26304a', shoes: '#101014', brow: true };
// Угольный: худой, короткая стрижка с пробором, бородка с усами. Сегодня — горничная
const UGL_LOOK = { skin: '#f0c8a8', hair: '#6a4a32', style: 'side', stubble: '#a88468', goatee: '#5a3a26', mus: '#5a3a26', coat: '#1c1c26', collar: '#f4f4f8', apron: '#f4f4f8', skirt: '#1c1c26', hem: '#f4f4f8', frill: '#f4f4f8', pants: '#ecebf2', shoes: '#101014' };
function listvaSprites() {
  const out = [];
  FAN_LOOK.forEach((lk, v) => {
    const a = (n, p) => out.push(dollItem('f' + v + '_' + n, lk, p, 2));
    a('idle', { armF: [.3, 5, 1.2, 4], prop: 'book', mouth: 'smile' });
    a('give', { armF: [1.5, 5, 1.6, 5], prop: 'book', lean: 1, mouth: 'o' });
    a('run0', Object.assign({}, RUN[0], { prop: 'book', mouth: 'o' }));
    a('run1', Object.assign({}, RUN[2], { prop: 'book', mouth: 'o' }));
    a('happy', { armF: [2.8, 5, 3, 5], armB: [-2.8, 5, -3, 5], prop: 'bookup', mouth: 'smile', eyes: 'shut' });
    a('cry', { armF: [2.4, 4, 3.1, 4], armB: [-2.4, 4, -3.1, 4], eyes: 'shut', mouth: 'o', dy: 1 });
  });
  const behind = { armB: [-.6, 5, .4, 4], armF: [-.5, 5, .5, 4] };
  out.push(dollItem('sav_w0', SAV_LOOK, Object.assign({}, RUN[0], behind, { lean: .3, mouth: 'o' }), 2));
  out.push(dollItem('sav_w1', SAV_LOOK, Object.assign({}, RUN[2], behind, { lean: .3 }), 2));
  out.push(dollItem('pol_w0', POL_LOOK, Object.assign({}, RUN[0], { armF: [1.1, 5, 1.3, 4], lean: .4 }), 2));
  out.push(dollItem('pol_w1', POL_LOOK, Object.assign({}, RUN[2], { armF: [1.1, 5, 1.3, 4], lean: .4 }), 2));
  const u = (n, p) => out.push(dollItem('u_' + n, UGL_LOOK, p, 3));
  u('stand', { armF: [.5, 5, 1.4, 4], prop: 'duster', armB: [-.2, 5, -.6, 4] });
  u('sweep', { armF: [1.4, 5, 2, 4], prop: 'duster', lean: 1, mouth: 'o' });
  u('wind', { armF: [-2.2, 5, -1.8, 4], prop: 'plate', lean: -.6, brow: true });
  u('throw', { armF: [1.7, 5, 1.5, 5], lean: 1.2, mouth: 'o', legs: [[-.4, 6, -.1, 6.2], [.4, 6, .1, 6.2]] });
  u('mop0', Object.assign({}, RUN[0], { armF: [.7, 5, .3, 5], prop: 'mop', lean: 1.4, mouth: 'o', brow: true }));
  u('mop1', Object.assign({}, RUN[2], { armF: [.7, 5, .3, 5], prop: 'mop', lean: 1.4, mouth: 'o', brow: true }));
  u('drink', { armF: [1.2, 5, 2.9, 4], prop: 'bottle', lean: -.8, mouth: 'o', eyes: 'shut' });
  u('drunk', { armF: [1.9, 5, 2.4, 4], armB: [-1.5, 5, -1, 4], prop: 'duster', lean: -.6, eyes: 'shut', mouth: 'smile' });
  u('curtsy', { armF: [.6, 4, .2, 4], armB: [-.6, 4, -.2, 4], dy: 1.6, legs: [[-.25, 6, .3, 5.6], [.3, 6, -.3, 5.6]], mouth: 'smile', eyes: 'shut' });
  u('goyda', { armF: [2.9, 5, 3.05, 5], armB: [-.4, 5, -.2, 5], mouth: 'o', brow: true, lean: -.3 });
  u('w0', Object.assign({}, RUN[0], { prop: 'duster', lean: .2, eyes: 'shut', mouth: 'smile' }));
  u('w1', Object.assign({}, RUN[2], { prop: 'duster', lean: .2, eyes: 'shut', mouth: 'smile' }));
  // пузырь (бутылка) и тарелка
  const [vc, vx] = mkCanvas(12, 24);
  vx.fillStyle = OUTC; vx.fillRect(4, 0, 4, 7); vx.fillRect(1, 5, 10, 19); vx.fillStyle = '#d81b2a'; vx.fillRect(5, 1, 2, 2);
  vx.fillStyle = '#dff0ff'; vx.fillRect(5, 3, 2, 4); vx.fillRect(2, 6, 8, 17); vx.fillStyle = '#f4f4f8'; vx.fillRect(2, 11, 8, 7); vx.fillStyle = '#d81b2a'; vx.fillRect(3, 13, 6, 1); vx.fillRect(4, 15, 4, 1); vx.fillStyle = '#fff'; vx.fillRect(3, 7, 1, 3);
  out.push({ name: 'vodka', c: vc, w: 12, h: 24, ax: 6, ay: 24 });
  const [pc, px] = mkCanvas(20, 8);
  px.fillStyle = OUTC; px.fillRect(0, 2, 20, 5); px.fillRect(3, 0, 14, 8); px.fillStyle = '#f4f6fa'; px.fillRect(1, 3, 18, 3); px.fillRect(4, 1, 12, 6); px.fillStyle = '#4a8ad0'; px.fillRect(6, 3, 8, 1); px.fillStyle = '#c8d0e0'; px.fillRect(4, 6, 12, 1);
  out.push({ name: 'plate', c: pc, w: 20, h: 8, ax: 10, ay: 4 });
  return out;
}

// ---------- уровень ----------
function buildLevel4() {
  const k = levelKit(6400), l = k.l, { fl, bl, pl, mv, ag, cs } = k;
  l.name = 'ЛАВКА «ЛИСТВА»'; l.theme = 'listva'; l.bgA = bgListva; l.song = 'listva'; l.fans = [];
  const fan = (x, line) => l.fans.push(mkFan(x, FY, line));
  fl(-200, 1500); fl(1600, 2880); fl(3020, 4500); fl(4640, 6600);
  // A: торговый зал
  k.sign(60, 236, ['ЛАВКА «ЛИСТВА»:', 'ЧИТАТЕЛЕЙ НЕ БИТЬ!', 'ДАЖЕ ЕСЛИ ХОЧЕТСЯ'], 220);
  cs(330, FY, 'socks', 0);
  fan(560, 'ВЫ ПЕЛЕВИН?! АВТОГРАФ!!!');
  ag(820, FY, 'sit', 'у меня тут презентация. блёрб?');
  bl(980, 346, 70, 40); ag(1015, 346, 'sit', 'моя книга на полке «иноагенты». блёрб?');
  fan(1250);
  ag(1400, FY, 'give', 'я вам блёрб, вы мне автограф. честно же');
  // B: стеллажи
  k.check(1680);
  bl(1760, 346, 60, 40); bl(1820, 300, 80, 86); pl(1950, 260, 90); pl(2100, 220, 90);
  ag(1860, 300, 'sit', 'сверху виднее: вам нужен блёрб');
  cs(2140, 220, 'heart', 1);
  fan(2300); fan(2380, 'И МНЕ! И МНЕ!');
  ag(2580, FY, 'run', 'А-А! ОН ПОДПИСЫВАЕТ! БЕЗ НАС!');
  pl(2900, 336, 90);
  // C: распродажа, тележки
  k.check(3100);
  k.sign(3150, 240, ['РАСПРОДАЖА:', 'БЛЁРБЫ — ДАРОМ', '(НЕ БЕРИТЕ)'], 170);
  ag(3420, FY, 'sit', 'а мне Савва обещал витрину'); fan(3530, 'ПОДПИШИТЕ «ЕНОТУ»!');
  cs(3620, FY, 'books', 3);
  bl(3800, 346, 70, 40); bl(3870, 300, 70, 86); ag(3905, 300, 'give', 'я уже на форзаце написал. от себя');
  ag(4200, FY, 'sit', 'не бейте детей, бейте нас. то есть не надо');
  mv(4380, 4560, 330, 80, 50);
  // D: очередь в зал встреч
  k.check(4720);
  fan(4900); fan(4960); fan(5020, 'МЫ ВСЕМ КЛАССОМ!');
  ag(5220, FY, 'sit', 'очередь за автографом — там. за блёрбом — тут');
  cs(5360, FY, 'matryoshka', 2);
  bl(5500, 346, 70, 40); bl(5570, 306, 70, 80); l.pot = { x: 5605, y: 306 };
  ag(5800, FY, 'give', 'горничная просила передать: блёрб!');
  cs(5940, FY, 'letter', 4);
  fan(6040, 'ТАМ ГОРНИЧНАЯ… СТРАННАЯ');
  k.sign(6110, 240, ['ЗАЛ ВСТРЕЧ →', 'СЕГОДНЯ УБИРАЕТ:', 'В. УГОЛЬНЫЙ'], 160);
  l.fallX = 4800;
  raid = null; raidT = rnd(8, 12); raidCard = 0;
  return k.done();
}
LEVELS.push({
  name: 'ЛАВКА «ЛИСТВА»', sub: 'босс: ???', build: buildLevel4, boss: true, bossKind: 'ugl', tag: 'ЧИТАТЕЛЕЙ НЕ БИТЬ!',
  endA: 'ВСТРЕЧА СОСТОЯЛАСЬ.', endB: 'Читатели целы. Горничная ушла.',
  extraRows: () => [['АВТОГРАФОВ', stats.signed], ['ЧИТАТЕЛЕЙ ОБИЖЕНО', stats.fanHit]],
  cast: [['АЛЕКСАНДР ПЕЛЕВИН', 'подписывал'], ['ЮНЫЕ ЧИТАТЕЛИ', 'с автографами'], ['ИНОАГЕНТЫ', 'собирательные образы'], ['САВВА ФЕДОСЕЕВ', 'его опять увели'], ['ПОЛИЦИЯ', 'на заднем плане'], ['АНАСТАСИЯ МИРОНОВА', 'с мегафоном'], ['ВЛАДИСЛАВ УГОЛЬНЫЙ', 'горничная. ушёл'], ['ПУЗЫРИ', 'пустые'], ['КНИГА', 'твёрдый переплёт']]
});

// ---------- босс: Владислав Угольный, горничная ----------
const UGL_GREET = ['ДОБРО ПОЖАЛОВАТЬ, ХОЗЯИН.', 'ЧЕГО ИЗВОЛИТЕ? ПЫЛЬ? ТАРЕЛКУ?', 'Я ТУТ ПРИБИРАЮСЬ ПОСЛЕ ЛИБЕРАЛОВ.', 'А ВЫ, ПЕЛЕВИН, НАСЛЕДИЛИ.'];
const UGL_SHOUT = ['ВЫТРИТЕ НОГИ!', 'ТУТ ВСЁ В ИНОАГЕНТАХ!', 'ПЫЛЬ — ЭТО ЗАПАДНОЕ ВЛИЯНИЕ!', 'ПОДАТЬ ЧАЙ? В ЛИЦО?', 'ГЕНЕРАЛЬНАЯ УБОРКА!', 'ТАРЕЛКИ — НА ВЫНОС!', 'НЕ ТОПЧИТЕ, Я ТОЛЬКО ПОМЫЛ!', 'КУШАТЬ ПОДАНО!'];
const UGL_DRUNK = ['ИК!', 'Я НЕ ПЬЯН, Я ВДОХНОВЛЁН', 'ЕЩЁ ПО ОДНОЙ — И ПОЭМУ', 'ПЕЛЕВИН, ТЫ МНЕ КАК БРАТ…', 'ГДЕ МОЙ ФАРТУЧЕК?', 'ПОЛ КАЧАЕТСЯ. ЭТО САНКЦИИ', 'ЗАКУСИТЬ НЕЧЕМ. ОДНИ КНИГИ', 'ДАВАЙТЕ ПЕСНЮ!'];
const UGL_NOHIT = ['ГОРНИЧНЫХ НЕ БЬЮТ!', 'ОН ПРИ ИСПОЛНЕНИИ!', 'ТОЛЬКО ПУЗЫРЁМ!', 'НЕЛЬЗЯ!'];
const UGL_HAM = ['ХАМ!', 'Я ВСЁ НАПИШУ В КАНАЛЕ!', 'ФУ, КАКОЙ НЕВОСПИТАННЫЙ', 'ПЛАТЬЕ ИЗ ПРОКАТА!'];
const UGL_PLATE = ['«ЧАЙ!»', '«СЕРВИЗ»', '«КУШАТЬ ПОДАНО»', '«БЛЮДЕЧКО»', '«ДОБАВКИ?»'];
const UGL_SEQ = [null, ['plates', 'walk', 'dust', 'walk'], ['plates', 'mop', 'dust', 'walk', 'plates'], ['mop', 'plates', 'dust', 'mop', 'plates', 'walk']];
let vods = [], dusts = [], vodCard = 0;
function startUgl() {
  L = buildBossLevel(); L.theme = 'listva'; L.bg = bgHall; L.song = 'maid'; L.name = 'ЗАЛ ВСТРЕЧ';
  cam = 0; look = 0; vods = []; dusts = []; vodCard = 0;
  parts = []; gibs = []; pickups = []; folders = []; floats = []; fxs = []; blurbs = []; words = []; mir = null;
  Object.assign(P, { x: 90, y: FYB, vx: 0, vy: 0, hp: P.maxhp, face: 1, inv: 0, hurtT: 0, atk: 0, onGround: true, idleT: 0, bub: null, clean: 0, crouch: false, h: 76, idleAnim: '', safeX: 90, safeY: FYB, vodka: 0, kefir: 0, signT: 0 });
  boss = { kind: 'ugl', title: 'ВЛАДИСЛАВ УГОЛЬНЫЙ', x: 620, y: FYB, hp: 10, max: 10, phase: 1, state: 'greet', t: 0, n: 0, seq: 0, line: 0, face: -1, inv: 0, fl: 0, bub: null, dead: false, started: false, drink: 0, target: 620, vodT: 1, hicT: 3, mopTo: 0,
    prize: ['ГОРНИЧНАЯ УШЛА', '(в зале чисто. подозрительно чисто)'] };
  mode = 'play'; modeT = 0; scene = 'play'; chain = 0; pendingCele = false; stopSong();
  banner = { s: 'ЗАЛ ВСТРЕЧ', sub: 'тут убирают', t: 2.2 };
}
const uglDrunk = b => 1 - b.hp / b.max;
function uglBegin() { const b = boss; if (b.started) return; b.started = true; banner = null; playSong('maid'); vodCard = 3.6; uglNext(); }
function uglNext() {
  const b = boss, s = UGL_SEQ[b.phase]; b.state = s[b.seq % s.length]; b.seq++; b.t = 0; b.n = 0;
  if (b.state === 'walk') { b.target = P.x < W / 2 ? rnd(470, 690) : rnd(110, 330); }
  if (b.state === 'mop') { b.mopTo = b.x > W / 2 ? 90 : W - 90; b.face = sign(b.mopTo - b.x); say(b, pick(['ГЛЯНЦУЮ ПОЛ!', 'ПОСТОРОНИСЬ!', 'ВЛАЖНАЯ УБОРКА!']), 1.2); }
  else if (!b.bub && Math.random() < .5) say(b, pick(b.hp <= 6 && Math.random() < .5 ? UGL_DRUNK : UGL_SHOUT), 1.5);
}
function uglPlate() {
  const b = boss, x = b.x + b.face * 40, y = b.y - 104, err = uglDrunk(b) * 140, tx = P.x + rnd(-err, err), ty = P.y - 40;
  const dx = tx - x, vx = clamp(Math.abs(dx) / .9, 200, 380) * (sign(dx) || -1), Tt = Math.abs(dx / vx), gr = 520;
  const vy = clamp((ty - y - .5 * gr * Tt * Tt) / Math.max(.3, Tt), -460, 220);
  blurbs.push({ x, y, vx, vy, g: gr, q: pick(UGL_PLATE), from: b, back: false, t: 0, rot: 0, paper: true, spr: 'plate', kind: 'plate', hitTxt: 'ТАРЕЛКОЙ ПО ЛБУ' });
  sfx.whoosh();
}
function uglMelee(x0, x1, y0, y1) {
  const b = boss; if (!b || b.dead || P.atkSet.has(b)) return;
  if (b.x + 22 > x0 && b.x - 22 < x1 && b.y > y0 && b.y - 120 < y1) {
    P.atkSet.add(b); sfx.buzz(); P.vx = -P.face * 220; P.vy = -160; P.onGround = false;
    floater(pick(UGL_NOHIT), b.x, b.y - 150, { color: '#ffd0e8', size: 10, t: .9, vy: -40 });
    if (!b.started) uglBegin();
    if (!b.bub || Math.random() < .6) say(b, pick(UGL_HAM), 1.3);
  }
}
// тарелки, отбитые книгой, он ловит
function uglPapers() {
  const b = boss; if (!b || b.dead) return;
  for (let i = blurbs.length - 1; i >= 0; i--) {
    const r = blurbs[i]; if (!r.back || r.from !== b) continue;
    if (Math.abs(r.x - b.x) < 30 && r.y > b.y - 130 && r.y < b.y) { blurbs.splice(i, 1); sfx.click(); floater(pick(['ПОЙМАЛ. ПОМОЕТ', 'ВЕРНУЛ В СЕРВИЗ', 'СПАСИБО, ХОЗЯИН']), b.x, b.y - 150, { color: '#dff0ff', size: 8, t: 1 }); }
  }
}
function uglThrow() {
  const b = boss, x = P.x + P.face * 10, y = P.y - 70, tx = b.x, ty = b.y - 100;
  const Tt = clamp(Math.abs(tx - x) / 430, .4, .95), gr = 900;
  vods.push({ x, y, vx: (tx - x) / Tt, vy: (ty - y - .5 * gr * Tt * Tt) / Tt, rot: 0 });
  P.vodka--; P.face = sign(tx - x) || 1; sfx.swing(); say(P, pick(['ЗА ЗДОРОВЬЕ!', 'ЛОВИ ПУЗЫРЬ!', 'ВЫПЕЙ, ПОЛЕГЧАЕТ', 'НА ПОСОШОК!']), 1);
}
function uglDrinks() {
  const b = boss; if (b.dead || mode !== 'play') return;
  b.hp--; b.drink = .8; hitstop = .05; shake = Math.max(shake, 5);
  tn('sine', 420, 180, .14, .2); tn('sine', 380, 160, .14, .2, .16); tn('sine', 340, 140, .14, .2, .32);
  floater(pick(['ДО ДНА!', 'ОДНИМ ГЛОТКОМ', 'ПРИНЯЛ НА ГРУДЬ', 'ЗАКУСИЛ ФАРТУКОМ']), b.x, b.y - 160, { color: '#ffe36b', size: 10, t: 1, vy: -40 });
  if (b.hp <= 0) { uglWin(); return; }
  const np = b.hp <= 3 ? 3 : b.hp <= 6 ? 2 : 1;
  if (np !== b.phase) { b.phase = np; b.seq = 0; if (np === 3) pickups.push({ k: 'heart', x: clamp(P.x + rnd(-100, 100), 60, W - 60), y: 40, vx: 0, vy: 0, t: 0 }); }
  say(b, pick(UGL_DRUNK), 1.4);
}
function updateVods(dt) {
  const b = boss;
  for (let i = vods.length - 1; i >= 0; i--) {
    const v = vods[i]; v.vy += 900 * dt; v.x += v.vx * dt; v.y += v.vy * dt; v.rot += dt * 12;
    if (!b.dead && Math.abs(v.x - b.x) < 34 && v.y > b.y - 135 && v.y < b.y - 10) { vods.splice(i, 1); uglDrinks(); continue; }
    if (v.y > FYB || v.x < -30 || v.x > W + 30) { vods.splice(i, 1); burst(v.x, FYB - 2, 12, ['#dff0ff', '#ffffff', '#9fdcff'], 200, .5, 600); sfx.click(); floater('МИМО. РАЗБИЛСЯ', clamp(v.x, 40, W - 40), FYB - 30, { color: '#dff0ff', size: 8, t: .8 }); }
  }
}
function updateUgl(dt) {
  const b = boss; if (!b || b.dead) return;
  b.t += dt; b.drink = Math.max(0, b.drink - dt);
  if (b.bub) { b.bub.t -= dt; if (b.bub.t <= 0) b.bub = null; }
  const ph = b.phase, dr = uglDrunk(b), slowK = 1 - dr * .25;
  if (b.state !== 'mop' && b.state !== 'walk') b.face = P.x < b.x ? -1 : 1;
  switch (b.state) {
    case 'greet':
      if (b.t > .9 && !b.bub) { if (b.line >= UGL_GREET.length) { uglBegin(); break; } say(b, UGL_GREET[b.line++], 2.1); b.t = -1.2; sfx.blip2(); }
      break;
    case 'walk': {
      const d = sign(b.target - b.x); b.face = d; b.x += d * 120 * slowK * dt;
      if ((b.target - b.x) * d <= 0 || b.t > 3) { b.x = clamp(b.x, 80, W - 80); uglNext(); }
      break;
    }
    case 'plates': {
      const cnt = [3, 4, 5][ph - 1], gap = [.75, .6, .5][ph - 1] / slowK;
      if (b.n < cnt && b.t > .4 + gap * b.n) { b.n++; uglPlate(); }
      if (b.t > .4 + gap * cnt + .6) uglNext();
      break;
    }
    case 'dust': {
      const waves = ph === 3 ? 2 : 1;
      if (b.n < waves && b.t > .7 + b.n * .7) { b.n++; dusts.push({ x: b.x + b.face * 40, d: b.face, t: 0 }); sfx.whoosh(); nz(0, .3, .2, 'bandpass', 900, 300, 2); }
      if (b.t > 1.2 + waves * .7) uglNext();
      break;
    }
    case 'mop': {
      if (b.t > .6) {
        const d = sign(b.mopTo - b.x); b.face = d; b.x += d * [300, 340, 380][ph - 1] * slowK * dt;
        if (Math.random() < .5) parts.push({ k: 'p', x: b.x - d * 20, y: FYB - 2, vx: -d * rnd(10, 40), vy: -rnd(10, 40), s: 2, c: '#9fdcff', life: .4, g: 300 });
        const mx = b.x + d * 28;
        if (mode === 'play' && P.inv <= 0 && Math.abs(P.x - mx) < 24 && P.y > FYB - 22) { floater('ПОДСЕЧКА ШВАБРОЙ', P.x, P.y - 110, { color: '#9fdcff', size: 8, t: 1.4 }); hurtPlayer(d, false, 'mop'); }
        if ((b.mopTo - b.x) * d <= 0) { b.x = b.mopTo; uglNext(); }
      }
      break;
    }
  }
  // пыль с метёлки катится по полу: перепрыгнуть
  for (let i = dusts.length - 1; i >= 0; i--) {
    const w = dusts[i]; w.t += dt; w.x += w.d * 250 * dt;
    if (Math.random() < .5) parts.push({ k: 'p', x: w.x + rnd(-14, 14), y: FYB - rnd(4, 30), vx: rnd(-20, 20), vy: -rnd(10, 40), s: 3, c: '#b8b0a8', life: .5, g: -20 });
    if (mode === 'play' && P.inv <= 0 && Math.abs(w.x - P.x) < 20 && P.y > FYB - 34) { floater('ПЫЛЬЮ В ГЛАЗА', P.x, P.y - 110, { color: '#d8d0c8', size: 8, t: 1.4 }); hurtPlayer(w.d, false, 'dust'); }
    if (w.x < -40 || w.x > W + 40) dusts.splice(i, 1);
  }
  // икота
  if (dr > .25) { b.hicT -= dt; if (b.hicT <= 0) { b.hicT = rnd(2.5, 5) / (dr + .3); floater('ИК!', b.x + rnd(-10, 10), b.y - 140, { color: '#ffd0e8', size: 9, t: .7 }); tn('square', 520, 300, .06, .1); } }
  // пузыри падают сверху
  vodCard = Math.max(0, vodCard - dt);
  if (b.started) {
    b.vodT -= dt;
    if (b.vodT <= 0) { b.vodT = 4.5; if ((P.vodka || 0) < 3 && !pickups.some(q => q.k === 'vodka')) { let x = rnd(60, W - 60); if (Math.abs(x - b.x) < 120) x = clamp(x + (x < b.x ? -160 : 160), 60, W - 60); pickups.push({ k: 'vodka', x, y: -20, vx: 0, vy: 0, t: 0 }); floater('ПУЗЫРЬ!', x, 70, { color: '#dff0ff', size: 9, t: 1.2 }); } }
    if (mode === 'play' && P.vodka > 0 && P.hurtT <= 0 && (hit('C') || (down('D') && hit('A')))) uglThrow();
  }
  updateVods(dt);
}
function uglWin() {
  const b = boss; mode = 'bossdeath'; modeT = 0; b.state = 'goyda'; b.bub = null; stopSong();
  blurbs = []; dusts = []; vods = []; P.atk = 0; b.won = 0; b.left = false; b.said = false; b.face = -1;
}
function updateUglDeath(dt) {
  const b = boss; P.vx *= .9; P.vy = Math.min(900, P.vy + GRAV * dt); collide(P, dt);
  if (!b.dead) {
    if (modeT > 1.3 && !b.said) { b.said = true; say(b, 'ГОЙДА', 2.2); sfx.shout(); shake = 10; flash = .3; }
    if (modeT > 3.6) { b.dead = true; memorial.push(['Владислав Угольный', 'сказал «ГОЙДА» и ушёл']); }
  } else if (!b.left) { b.face = 1; b.x += 80 * dt; if (b.x > W + 60) b.left = true; }
  else if (!b.won) { b.won = .001; P.clean = 1; playSong('win'); burst(P.x, P.y - 80, 20, ['#fff', '#ffe36b'], 200, .7); }
  else { b.won += dt; if (b.won > 3.4 && mode === 'bossdeath') { cele.n = 99; startCelebrate(); cele.title = 'ПЕЛЕВИН'; cele.kind = 'dance'; L.after = true; } }
  if (b.bub) { b.bub.t -= dt; if (b.bub.t <= 0) b.bub = null; }
}
function drawUgl() {
  const b = boss;
  for (const w of dusts) for (let i = 0; i < 4; i++) { const r = 8 + i * 3, ox = Math.sin(w.t * 9 + i * 2) * 6; g.globalAlpha = .8; R(w.x - r + ox + (i - 1.5) * 8, FYB - r * 2 - i * 3, r * 2, r * 2, i % 2 ? '#b8b0a8' : '#d8d0c8'); g.globalAlpha = 1; }
  for (const v of vods) spr('vodka', v.x, v.y + 12, false, { rot: v.rot });
  if (b.left) return;
  const dr = uglDrunk(b);
  let n = 'stand', oy = 0, rot = Math.sin(gameT * 2.2) * dr * .12;
  if (b.state === 'goyda') { n = b.dead ? ((gameT * 5 | 0) % 2 ? 'w0' : 'w1') : b.said ? 'goyda' : 'drunk'; rot = b.said && !b.dead ? 0 : Math.sin(gameT * 3) * .15; }
  else if (b.drink > 0) n = 'drink';
  else if (b.state === 'greet') n = b.line > 0 && b.line % 2 ? 'curtsy' : 'stand';
  else if (b.state === 'walk') { n = (b.t * 6 | 0) % 2 ? 'w0' : 'w1'; oy = -Math.abs(Math.sin(b.t * 12)) * 3; }
  else if (b.state === 'plates') n = (b.t - .4) % ([.75, .6, .5][b.phase - 1]) < .25 ? 'throw' : 'wind';
  else if (b.state === 'dust') n = (b.t * 6 | 0) % 2 ? 'sweep' : 'stand';
  else if (b.state === 'mop') { n = b.t < .6 ? 'mop0' : (b.t * 10 | 0) % 2 ? 'mop0' : 'mop1'; rot = 0; }
  else if (dr > .5) n = 'drunk';
  g.globalAlpha = .3; R(b.x - 34, FYB - 2, 68, 5, '#000'); g.globalAlpha = 1;
  spr('u_' + n, b.x, b.y + oy, b.face < 0, { rot });
  if (b.state === 'mop' && b.t < .6 && (gameT * 12 | 0) % 2) R(b.x + b.face * 28 - 14, FYB - 3, 28, 3, '#9fdcff');
  if (b.bub) {
    const big = b.bub.s === 'ГОЙДА';
    bubble(b.bub.s, b.x, b.y - 140, { prio: 5, size: big ? 14 : 10, max: 18, color: big ? '#a3111f' : '#16161d' });
  }
}
function drawUglHud() {
  const b = boss;
  if (b.started && !b.dead && b.state !== 'goyda') { for (let i = 0; i < (P.vodka || 0); i++) spr('vodka', 222 + i * 16, 40, false); if (P.vodka) T('ПУЗЫРИ', 222 + P.vodka * 16 + 4, 26, { size: 7, align: 'left', color: '#dff0ff', stroke: OUTC }); }
  if (vodCard > 0) OV.push(c => { c.globalAlpha = Math.min(1, vodCard * 2, (3.6 - vodCard) * 4); c.fillStyle = OUTC; c.fillRect(W / 2 - 200, 52, 400, 50); c.fillStyle = '#4a2240'; c.fillRect(W / 2 - 196, 56, 392, 42); c.font = '11px PS2P,monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText('БИТЬ НЕЛЬЗЯ. ТОЛЬКО ПОИТЬ', W / 2, 70); c.font = '7px PS2P,monospace'; c.fillStyle = '#ffd0e8'; c.fillText(TOUCH ? 'подбери пузырь, потом ВНИЗ + КНИГА' : 'подбери пузырь, потом C (или ВНИЗ + X)', W / 2, 88); c.globalAlpha = 1; });
  if (b.state === 'goyda' && b.said && !b.dead) T('ГОЙДА', W / 2 + rnd(-2, 2), 96 + rnd(-2, 2), { size: 40, color: '#fff', stroke: '#a3111f', sw: 8 });
  if (!b.started || b.dead || b.state === 'goyda') return;
  T('ВЛАДИСЛАВ УГОЛЬНЫЙ', W / 2, 16, { size: 9, color: '#ffd0e8', stroke: OUTC });
  T('ТРЕЗВОСТЬ', W / 2, 46, { size: 6, color: '#dff0ff', stroke: OUTC });
  OV.push(c => { c.fillStyle = OUTC; c.fillRect(W / 2 - 152, 26, 304, 12); const sw = 300 / b.max; for (let i = 0; i < b.max; i++) { c.fillStyle = i < b.hp ? (b.phase === 3 ? '#ff9ad0' : b.phase === 2 ? '#ffd0e8' : '#dff0ff') : '#2a3350'; c.fillRect(W / 2 - 150 + i * sw, 28, sw - 2, 8); } });
}
// кат-сцена: горничная подметает и делает книксен
function uglIntroTick(dt) {
  const t = sceneT, at = k => t >= k && t - dt < k;
  if (t > .6 && t < 2.2 && ((t - .6) * 12 | 0) !== ((t - dt - .6) * 12 | 0)) sfx.blip();
  if (at(2.4)) sfx.blip2();
  if (at(3.6) || at(4.3)) sfx.stamp();
}
function drawUglIntro() {
  const t = sceneT;
  g.drawImage(bgHall, 0, 0); g.fillStyle = 'rgba(10,6,20,.4)'; g.fillRect(0, 0, W, H);
  spr('p_idle', 170, FYB, false);
  spr(t > 2.4 && t < 4.4 ? 'u_curtsy' : (t * 3 | 0) % 2 ? 'u_sweep' : 'u_stand', 560, FYB, true);
  const nm = 'ВЛАДИСЛАВ УГОЛЬНЫЙ', n = clamp(((t - .6) * 12 | 0), 0, nm.length);
  T(nm.slice(0, n), W / 2, 124, { size: 20, color: '#fff', stroke: '#7a1a4a', sw: 7 });
  if (t > 2) T('писатель. сегодня — горничная', W / 2, 156, { size: 8, color: '#ffd0e8', stroke: OUTC });
  if (t > 2.8) T('почему — не спрашивайте', W / 2, 174, { size: 8, color: '#ffd0e8', stroke: OUTC });
  if (t > 2.4 && t < 4.4) bubble('ЧЕГО ИЗВОЛИТЕ, ХОЗЯИН?', 560, FYB - 140, { prio: 5, size: 10, max: 18 });
  if (t > 3.6) T('БИТЬ НЕЛЬЗЯ.', W / 2, 206, { size: 14, color: '#ff5b6b', stroke: OUTC, sw: 5 });
  if (t > 4.3) T('ПОИТЬ МОЖНО.', W / 2, 230, { size: 14, color: '#7fe08a', stroke: OUTC, sw: 5 });
}
BK.ugl = { start: startUgl, update: updateUgl, death: updateUglDeath, draw: drawUgl, hud: drawUglHud, melee: uglMelee, papers: uglPapers, intro: drawUglIntro, introTick: uglIntroTick, introLen: 6 };
Object.assign(window.__dbg, { ugl() { curLevel = 3; startUgl(); }, uglIntro() { curLevel = 3; startBossIntro(); }, fans: () => L.fans, raid: () => raid, raidNow() { raidT = 0; } });

// ---------- музыка ----------
// лавка: уютно, фа мажор, неспешно
SONGS.listva = {
  bpm: 132, loop: true, tr: [
    { w: 'p25', v: .08, s: seq('F5:2 A5:2 C6:2 A5:2 G5:4 F5:2 E5:2 D5:2 F5:2 A5:2 F5:2 E5:6 -:2 F5:2 A5:2 C6:2 D6:2 C6:4 A5:2 F5:2 G5:2 A5:2 A#5:2 G5:2 F5:8 A#5:4 A5:2 G5:2 A5:4 F5:4 G5:2 F5:2 E5:2 D5:2 C5:8 D5:2 E5:2 F5:2 A5:2 G5:2 F5:2 E5:2 G5:2 F5:6 C5:2 F5:8') },
    { w: 'triangle', v: .22, s: seq(['F2:4 C3:4 F2:4 C3:4', 'D2:4 A2:4 D2:4 A2:4', 'F2:4 C3:4 F2:4 C3:4', 'C2:4 G2:4 C2:4 G2:4', 'A#1:4 F2:4 A#1:4 F2:4', 'C2:4 G2:4 C2:4 G2:4', 'A#1:4 F2:4 C2:4 G2:4', 'F2:4 C3:4 F2:4 C3:4'].join(' ')) }
  ], dr: 'k.h.s.h.'
};
// горничная: быстрый галоп «умпа-умпа», ля минор, в середине — до мажор
SONGS.maid = (() => {
  const lead = ['E5:2 A5:2 A5:1 B5:1 C6:2 B5:2 A5:2 G#5:2 A5:2', 'B5:2 E5:2 E5:1 F5:1 G#5:2 B5:4 -:4', 'E5:2 A5:2 A5:1 B5:1 C6:2 D6:2 E6:2 D6:2 C6:2', 'B5:2 G#5:2 E5:2 B5:2 A5:6 -:2',
    'G5:1 G5:1 C6:2 E6:2 C6:2 D6:1 D6:1 B5:2 G5:4', 'A5:1 A5:1 F5:2 A5:2 C6:2 B5:2 G#5:2 E5:4', 'G5:1 G5:1 C6:2 E6:2 G6:2 F6:2 E6:2 D6:2 C6:2', 'B5:2 D6:2 C6:2 B5:2 A5:4 E5:4'].join(' ');
  const oom = (r, f) => r + ':2 -:2 ' + f + ':2 -:2 ';
  const bar = (r, f, r2, f2) => oom(r, f) + oom(r2 || r, f2 || f);
  const bass = [bar('A2', 'E3'), bar('E2', 'B2'), bar('A2', 'E3'), bar('E2', 'B2', 'A2', 'E3'), bar('C2', 'G2'), bar('F2', 'C3', 'E2', 'B2'), bar('C2', 'G2'), bar('E2', 'B2', 'A2', 'E3')].join(' ');
  const pah = n => ('-:2 ' + n + ':2 ').repeat(4);
  const off = ['C5', 'B4', 'C5', 'B4', 'E5', 'A4', 'E5', 'B4'].map(pah).join(' ');
  return { bpm: 160, loop: true, tr: [{ w: 'p25', v: .09, s: seq(lead) }, { w: 'triangle', v: .26, s: seq(bass) }, { w: 'p12', v: .035, s: seq(off) }], dr: 'k.s.k.s.' };
})();
