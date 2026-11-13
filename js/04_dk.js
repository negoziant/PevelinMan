// ---------- ЭТАП 2: СТАРЫЙ ДК ----------
// Свет горит 10 секунд и гаснет на 5. За секунду до темноты лампы мигают.
// В темноте из портретов поэтов вылетают призраки либералов (карикатуры).
// Призрак медленно плывёт к Пелевину, потом замирает (дрожит и мигает) и делает рывок
// туда, где была голова: можно отпрыгнуть, присесть, убежать или ударить книгой.
// Включился свет — призраки улетают обратно в портреты.
// Босс — огромная голова Марии Дегтеревой. Видна и уязвима только в темноте.
const LIGHT_ON = 10, LIGHT_OFF = 5, WARN = 1.1;
const lite = { t: 0, on: false, a: 0, warn: false, fl: false, flT: 0, n: 0, card: 0, seen: false, exiled: {} };
let ghosts = [], envs = [], darkC = null, bgDK = null, bgStage = null;
const isDark = () => !!(L && L.dark && lite.on);
function dkReset() {
  lite.t = 0; lite.on = false; lite.a = 0; lite.manual = false; lite.warn = false; lite.fl = false; ghosts = []; envs = [];
  if (L && L.portraits) for (const p of L.portraits) p.empty = 0;
}

DEATH.ghost = ['ЗАЦИТИРОВАН', 'призраки прочли тебе всё. дважды'];
DEATH.donos = ['ДОНОС ПРИНЯТ', 'ожидайте, вам позвонят'];
DEATH.zhal = ['ЖАЛОБА УДОВЛЕТВОРЕНА', 'Шаша доигрался'];

// Призраки: собирательные карикатуры, реплики — пародия на публичный образ.
const GH = {
  pol: {
    tag: 'ПОЛОЗКОВА', hit: 'СТИХ НА ОБЛОЖКЕ',
    lines: ['САША, Я ПОСВЯЩУ ТЕБЕ СТИХ!', 'ПРИХОДИ НА КВАРТИРНИК!', 'ОБНИМУ ТЕБЯ ВЕРЛИБРОМ!', 'ТЫ ТОЖЕ КОСМОС, САША!', 'ДАЙ НАПИШУ ПРЕДИСЛОВИЕ!'],
    bye: ['УЛЕТАЮ НА КВАРТИРНИК', 'ЭТО БЫЛ ВЕРЛИБР…', 'ДОЧИТАЮ ИЗДАЛЕКА'], epi: 'вернулась в портрет. читает стихи там'
  },
  byk: {
    tag: 'БЫКОВ', hit: 'ЛЕКЦИЯ ПРОСЛУШАНА',
    lines: ['ЩАС ПРОЧТУ ЛЕКЦИЮ! ЧЕТЫРЕ ЧАСА!', 'ЭТО ВСЁ ЕСТЬ У ПАСТЕРНАКА!', 'Я НАПИСАЛ О ТЕБЕ РОМАН! ВЧЕРА!', 'ГРАЖДАНИН ПОЭТ ВЫЗЫВАЕТ!', 'ДАЙ ПРЕДИСЛОВИЕ НАПИСАТЬ!'],
    bye: ['ДОЧИТАЮ ЛЕКЦИЮ ПОТОМ', 'ЭТО ТОЖЕ ЕСТЬ У ПАСТЕРНАКА', 'ВЕРНУСЬ С НОВЫМ ТОМОМ'], epi: 'вернулся в портрет. читает там лекцию'
  },
  aku: {
    tag: 'АКУНИН', hit: 'ПОПАЛ В ДЕТЕКТИВ',
    lines: ['ФАНДОРИН УЖЕ ВЫЕХАЛ!', 'ЭТО ДЕЛО Я РАССЛЕДУЮ!', 'НАПИШУ О ТЕБЕ ПОД ПСЕВДОНИМОМ!', 'АЗАЗЕЛЬ!', 'ТЫ — ПЕРСОНАЖ, САША!'],
    bye: ['ДЕЛО ЗАКРЫТО', 'ПРОДОЛЖЕНИЕ В СЛЕДУЮЩЕМ ТОМЕ', 'УХОЖУ ПОД ПСЕВДОНИМ'], epi: 'вернулся в портрет. под псевдонимом'
  }
};
const GHOSTS = ['pol', 'byk', 'aku'];

// ---------- свет ----------
function lightsOff() {
  sfx.off(); lite.n++;
  if (!lite.seen && !L.boss) { lite.seen = true; lite.card = 3.2; }
  if (L.boss) {
    if (boss && boss.phase === 3) ghosts.push(mkGhost(GHOSTS[lite.n % 3], rnd(220, 580), 30, null, .5));
    return;
  }
  const n = P.x > L.w * .5 ? 3 : 2;
  const ps = L.portraits.filter(p => p.x > cam + 10 && p.x < cam + W - 10 && Math.abs(p.x - P.x) > 110).sort(() => Math.random() - .5);
  for (let i = 0; i < n; i++) {
    const p = ps[i] || null;
    const x = p ? p.x : (i % 2 ? cam - 30 : cam + W + 30), y = p ? p.y + 40 : 140;
    ghosts.push(mkGhost(GHOSTS[(lite.n + i) % 3], x, y, p, i * .8));
  }
}
function lightsOn() {
  sfx.on();
  for (let i = ghosts.length - 1; i >= 0; i--) {
    const q = ghosts[i];
    if (q.st === 'wait') { ghosts.splice(i, 1); continue; }
    if (q.st !== 'poof') { q.st = 'back'; q.t = 0; if (Math.random() < .4) say(q, pick(['СВЕТ!', 'ОЙ, СВЕТ', 'Я ЕЩЁ ВЕРНУСЬ']), 1); }
  }
}
function updateDk(dt) {
  if (!L.dark) return;
  lite.card = Math.max(0, lite.card - dt);
  if (!L.boss && mode === 'play') {
    lite.t += dt;
    const ph = lite.t % (LIGHT_ON + LIGHT_OFF), on = ph >= LIGHT_ON;
    lite.warn = !on && ph > LIGHT_ON - WARN;
    if (on && !lite.on) { lite.on = true; lightsOff(); }
    else if (!on && lite.on) { lite.on = false; lightsOn(); }
  }
  if (mode === 'play') updateGhosts(dt);
  if (lite.manual) return;
  lite.flT -= dt;
  if (lite.flT <= 0) { lite.flT = .07; const was = lite.fl; lite.fl = lite.warn && Math.random() < .4; if (lite.fl && !was) sfx.flick(); }
  const tgt = lite.on ? 1 : lite.fl ? .75 : 0;
  lite.a += (tgt - lite.a) * Math.min(1, dt * (lite.fl ? 30 : lite.on ? 6 : 8));
}

// ---------- призраки ----------
function mkGhost(k, x, y, p, delay) { return { k, x, y, p, st: 'wait', t: -delay, vx: 0, vy: 0, tx: 0, ty: 0, a: 0, face: -1, bub: null, ph: rnd(6), nextDash: rnd(1.1, 1.7), dashMax: 0 }; }
function updateGhosts(dt) {
  const floorY = L.fy;
  for (let i = ghosts.length - 1; i >= 0; i--) {
    const q = ghosts[i]; q.t += dt;
    if (q.bub) { q.bub.t -= dt; if (q.bub.t <= 0) q.bub = null; }
    if (q.st === 'wait') { if (q.t >= 0) { q.st = 'out'; q.t = 0; if (q.p) q.p.empty = 1; sfx.ghost(); } continue; }
    if (q.st === 'out') { q.a = Math.min(1, q.t / .6); q.face = sign(P.x - q.x); if (q.t > .6) { q.st = 'hunt'; q.t = 0; if (Math.random() < .7) say(q, pick(GH[q.k].lines), 1.8); } continue; }
    if (q.st === 'poof') { if (q.t > .5) ghosts.splice(i, 1); continue; }
    if (q.st === 'back') {
      const tx = q.p ? q.p.x : q.x, ty = q.p ? q.p.y + 40 : -80;
      q.x += (tx - q.x) * Math.min(1, dt * 5); q.y += (ty - q.y) * Math.min(1, dt * 5); q.a -= dt * 1.8;
      if (q.a <= 0) { if (q.p) q.p.empty = 0; ghosts.splice(i, 1); }
      continue;
    }
    // целится в голову стоящего Пелевина: присевшего рывок проносит над ним
    const hx = P.x, hy = P.y - 66;
    if (q.st === 'hunt') {
      q.face = sign(hx - q.x);
      const dx = hx - q.x, dy = hy - q.y, d = Math.hypot(dx, dy) || 1, sp = 64;
      q.vx += (dx / d * sp - q.vx) * Math.min(1, dt * 2); q.vy += (dy / d * sp - q.vy) * Math.min(1, dt * 2);
      q.x += q.vx * dt; q.y += (q.vy + Math.sin(q.t * 3 + q.ph) * 36) * dt;
      if (q.t > q.nextDash && d < 340 && mode === 'play') { q.st = 'wind'; q.t = 0; q.tx = hx; q.ty = hy; sfx.ghost2(); }
    } else if (q.st === 'wind') {
      if (q.t > .55) {
        q.st = 'dash'; q.t = 0;
        const dx = q.tx - q.x, dy = q.ty - q.y, d = Math.hypot(dx, dy) || 1;
        q.vx = dx / d * 380; q.vy = dy / d * 380; q.dashMax = Math.min(1, d / 380 + .3); q.face = sign(dx);
      }
    } else if (q.st === 'dash') {
      q.x += q.vx * dt; q.y += q.vy * dt;
      if (Math.random() < .5) parts.push({ k: 'p', x: q.x + rnd(-8, 8), y: q.y + rnd(-6, 10), vx: 0, vy: -20, s: 2, c: '#9fe8ff', life: .35, g: 0 });
      if (q.t > q.dashMax) { q.st = 'hunt'; q.t = 0; q.nextDash = rnd(1.3, 2.1); q.vx *= .15; q.vy *= .15; }
    }
    q.y = clamp(q.y, 40, floorY - 24);
    if (mode === 'play' && P.inv <= 0 && Math.abs(q.x - P.x) < 22 && q.y + 14 > P.y - P.h && q.y - 14 < P.y) {
      floater(GH[q.k].hit, P.x, P.y - 110, { color: '#bff7ee', size: 8, t: 1.8, vy: -18 });
      hurtPlayer(sign(P.x - q.x), false, 'ghost'); say(q, pick(GH[q.k].lines), 1.4);
      q.st = 'hunt'; q.t = 0; q.nextDash = rnd(1.6, 2.4); q.vx = -sign(P.x - q.x) * 120; q.vy = -90;
    }
  }
}
// удар книгой развеивает призрака
function dkAttack(x0, x1, y0, y1) {
  for (const q of ghosts) {
    if (!(q.st === 'out' || q.st === 'hunt' || q.st === 'wind' || q.st === 'dash') || P.atkSet.has(q)) continue;
    if (q.x + 16 > x0 && q.x - 16 < x1 && q.y + 20 > y0 && q.y - 30 < y1) {
      P.atkSet.add(q); q.st = 'poof'; q.t = 0; stats.ghosts++; hitstop = .05; sfx.bonk(); sfx.ghost2();
      burst(q.x, q.y - 10, 18, ['#dff8ff', '#9fe8ff', '#fff'], 220, .6, 0);
      floater(pick(GH[q.k].bye), q.x, q.y - 60, { color: '#bff7ee', size: 8, t: 1.4, vy: -30 });
      floater(pick(['ИЗЫДИ!', 'НЕ НАДО СТИХОВ!', 'В ПОРТРЕТ!', 'ОТКАЗ!']), q.x + P.face * 10, q.y - 30, { color: '#ffe36b', size: 12, t: .55, vy: -60 });
      if (q.p) q.p.empty = 0;
      if (!lite.exiled[q.k]) { lite.exiled[q.k] = true; memorial.push(['Призрак: ' + GH[q.k].tag.charAt(0) + GH[q.k].tag.slice(1).toLowerCase(), GH[q.k].epi]); }
    }
  }
}

// ---------- рисование уровня ----------
function drawPortrait(p) {
  spr('por_' + p.ci, p.x, p.y, false);
  if (p.empty > 0) {
    R(p.x - 28, p.y + 8, 56, 60, '#06040c');
    for (let i = 0; i < 4; i++) R(p.x - 4 + Math.sin(gameT * 4 + i * 1.7) * 16, p.y + 22 + i * 11, 8, 3, i % 2 ? '#2a6a8a' : '#1a3a5a');
  }
}
function drawLamp(lp) {
  const lit = !lite.on && !lite.fl;
  if (lit) {
    g.globalAlpha = .13; g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(lp.x, lp.y, 34, 0, 6.29); g.fill();
    g.globalAlpha = .22; g.beginPath(); g.arc(lp.x, lp.y, 17, 0, 6.29); g.fill(); g.globalAlpha = 1;
  }
  R(lp.x - 2, lp.y + 4, 4, 14, OUTC); R(lp.x - 8, lp.y + 16, 16, 4, OUTC); R(lp.x - 7, lp.y + 17, 14, 2, '#c9a24a');
  R(lp.x - 6, lp.y - 7, 12, 13, OUTC); R(lp.x - 5, lp.y - 6, 10, 11, lit ? '#fff6c8' : '#4a4436');
  if (lit) R(lp.x - 3, lp.y - 4, 3, 4, '#fff');
  R(lp.x - 7, lp.y + 4, 14, 3, '#c9a24a');
}
function drawDkWorld() {
  for (const p of L.portraits) if (inView(p.x, 60)) drawPortrait(p);
  for (const lp of L.lamps) if (inView(lp.x, 40)) drawLamp(lp);
}
function drawDkGate() {
  const x = L.gateX, y = L.gateY || FY, dw = Math.max(2, 35 - L.gate * 33);
  R(x - 14, y - 140, 98, 140, OUTC); R(x - 10, y - 136, 90, 136, '#6a4628'); R(x - 10, y - 136, 90, 3, '#c9a24a');
  R(x, y - 118, 70, 118, '#140a06');
  if (L.gate > 0) { g.globalAlpha = .35 * L.gate; R(x + 4, y - 114, 62, 114, '#ffe9a0'); g.globalAlpha = 1; }
  for (const [dx, w] of [[0, dw], [70 - dw, dw]]) { R(x + dx, y - 118, w, 118, '#8a1420'); R(x + dx, y - 118, w, 2, '#c2303c'); for (let i = 8; i < 118; i += 14) R(x + dx + w / 2 - 1, y - 118 + i, 2, 2, '#c9a24a'); }
  R(x - 6, y - 160, 82, 18, OUTC); R(x - 4, y - 158, 78, 14, (gameT * 2 | 0) % 2 ? '#d81b2a' : '#a3111f');
  T('ЗАЛ', x + 35 - camR, y - 151, { size: 8, color: '#fff' });
}
function drawDark(cx) {
  if (lite.a <= .01) return;
  if (!darkC) darkC = mkCanvas(W, H);
  const [c, x] = darkC;
  x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H);
  x.fillStyle = 'rgba(3,2,12,' + (.9 * lite.a).toFixed(3) + ')'; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'destination-out';
  const hole = (hx, hy, r, s) => { const gr = x.createRadialGradient(hx, hy, 0, hx, hy, r); gr.addColorStop(0, 'rgba(0,0,0,' + s + ')'); gr.addColorStop(.55, 'rgba(0,0,0,' + (s * .75) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(hx - r, hy - r, r * 2, r * 2); };
  // Пелевин светит себе телефоном
  hole(P.x - cx + P.face * 10, P.y - 44, 125, .95);
  for (const q of ghosts) if (q.a > 0) hole(q.x - cx, q.y, 64, .5 * q.a);
  if (boss && boss.kind === 'deg' && L.boss && boss.vis > 0) hole(boss.x, boss.y - 80, 140, .5 * boss.vis);
  for (const b of blurbs) hole(b.x - cx, b.y, 30, .6);
  g.drawImage(c, cx, 0);
}
function drawGhost(q) {
  if (q.st === 'wait' || q.a <= 0 || !inView(q.x, 60)) return;
  const bob = Math.sin(gameT * 3 + q.ph) * 3, poof = q.st === 'poof';
  const a = poof ? Math.max(0, 1 - q.t * 2) : q.a * (.85 + Math.sin(gameT * 9 + q.ph) * .1);
  const sc = q.st === 'out' ? .4 + .6 * q.a : poof ? 1 + q.t * 1.5 : 1;
  g.globalAlpha = .16 * a; g.fillStyle = q.st === 'wind' ? '#ffb0c0' : '#9fe8ff'; g.beginPath(); g.arc(q.x, q.y + bob - 12, 36, 0, 6.29); g.fill(); g.globalAlpha = 1;
  const ox = q.st === 'wind' ? Math.sin(q.t * 70) * 2 : 0;
  spr('g_' + q.k, q.x + ox, q.y + bob, q.face < 0, { a, sx: sc });
  if (q.st === 'wind' && (gameT * 20 | 0) % 2) spr('g_' + q.k, q.x + ox, q.y + bob, q.face < 0, { img: atlasW, a: .55 });
  if (!poof && q.st !== 'back') T(GH[q.k].tag, q.x - camR, q.y + bob - 56, { size: 6, color: '#bff7ee', stroke: OUTC, a });
  if (q.bub) bubble(q.bub.s, q.x - camR, q.y - 62, { prio: 2, size: 8, max: 16, bg: '#dff8ff', color: '#1a4a6a' });
}
// темнота и всё, что светится в ней сам: призраки, голова, конверты
function drawDkTop(cx) {
  drawDark(cx);
  for (const q of ghosts) drawGhost(q);
  if (L.boss && boss && boss.kind === 'deg') drawDeg();
  if (L.boss && boss && boss.kind === 'yak') drawYak();
}
function drawDkHud() {
  if (!L.dark || lite.card <= 0) return;
  const lvl = !L.boss, t = lite.card;
  OV.push(c => {
    c.globalAlpha = Math.min(1, t * 2, (3.2 - t) * 4); c.fillStyle = OUTC; c.fillRect(W / 2 - 180, 52, 360, 50); c.fillStyle = lvl ? '#1a3a5a' : '#4a1030'; c.fillRect(W / 2 - 176, 56, 352, 42);
    c.font = '12px PS2P,monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
    c.fillText(lvl ? 'ПРИЗРАКИ ЛИБЕРАЛОВ' : 'БЕЙ, ПОКА ТЕМНО', W / 2, 70);
    c.font = '7px PS2P,monospace'; c.fillStyle = lvl ? '#bff7ee' : '#ffd0e8';
    c.fillText(lvl ? 'прыгай, садись, убегай или бей книгой' : 'при свете она исчезает. жалобы отбивай', W / 2, 88); c.globalAlpha = 1;
  });
}

// ---------- уровень ----------
function buildLevel2() {
  const k = levelKit(6400), l = k.l, { fl, bl, pl, ag, cs } = k;
  l.name = 'СТАРЫЙ ДК'; l.theme = 'dk'; l.dark = true; l.bgA = bgDK; l.song = 'dk';
  l.portraits = []; l.lamps = [];
  fl(-200, 1500); fl(1600, 2600); fl(2720, 4300); fl(4480, 6600);
  // A: фойе
  k.sign(60, 240, ['СТАРЫЙ ДК:', 'СВЕТ ГАСНЕТ', 'КАЖДЫЕ 10 СЕКУНД'], 200);
  cs(330, FY, 'socks', 0);
  ag(560, FY, 'sit', 'Саша! Я из кружка «Перо». Блёрб?');
  bl(760, 346, 70, 40); ag(795, 346, 'sit', 'я тут вёл литстудию. до отъезда');
  ag(1000, FY, 'give', 'блёрб к выступлению! бесплатно!');
  k.sign(1110, 250, ['ГАРДЕРОБ', 'НОМЕРКОВ НЕТ'], 130);
  ag(1330, FY, 'run', 'ОН ПРИШЁЛ ВЫСТУПАТЬ!');
  // B: коридор
  k.check(1700);
  bl(1850, 346, 60, 40); bl(1910, 306, 80, 80); ag(1950, 306, 'sit', 'я писал вам в 2019-м. ответьте блёрбом');
  k.spikes(2040, 50);
  ag(2250, FY, 'sit', 'мы бывшие кружковцы. теперь в Риге');
  cs(2420, FY, 'heart', 1);
  pl(2615, 340, 90);
  // C: за кулисами
  ag(2880, FY, 'give', 'номерок или блёрб?');
  k.check(3020);
  pl(3150, 320, 80); pl(3290, 262, 80); cs(3330, 262, 'books', 3);
  k.sign(3420, 240, ['ХОР «РАССВЕТ»:', 'РЕПЕТИЦИЯ', 'ОТМЕНЕНА'], 150);
  ag(3620, FY, 'sit', 'блёрб из-за кулис!'); ag(3676, FY, 'sit', 'и от меня! я суфлёр');
  k.zap(3860, 220, 2.6, 0);
  ag(4100, FY, 'run', 'кто выключил свет?!');
  pl(4345, 336, 90);
  // D: лестница в зал. Дверь наверху, на балконе
  k.check(4600);
  l.fallX = 4750;
  ag(5000, FY, 'sit', 'лекторий закрыт. блёрбы — открыты');
  cs(5180, FY, 'matryoshka', 2);
  ag(5380, FY, 'give', 'подпишу блёрб прямо на афише!');
  k.sign(5440, 236, ['ЗРИТЕЛЬНЫЙ ЗАЛ:', 'НАВЕРХ', 'ПО ЛЕСТНИЦЕ'], 150);
  pl(5620, 326, 84); pl(5740, 268, 84); pl(5860, 212, 84);
  l.solids.push({ x: 5960, y: 190, w: 440, h: 22, k: 'b', st: 'bal' });
  ag(6040, 190, 'give', 'последний шанс! блёрб у входа!');
  l.pot = { x: 6130, y: 190 };
  ag(6150, FY, 'sit', 'зал наверху. а блёрб — здесь');
  cs(6320, FY, 'letter', 4);
  l.gateX = 6260; l.gateY = 190;
  // портреты на стене и бра между ними
  for (let i = 0, x = 240; x < 5900; i++, x += 330) { l.portraits.push({ x, y: 92, ci: i % POETS.length, empty: 0 }); l.lamps.push({ x: x + 165, y: 132 }); }
  l.lamps.push({ x: 6180, y: 80 });
  return k.done();
}
LEVELS.push({
  name: 'СТАРЫЙ ДК', sub: 'босс: ???', build: buildLevel2, boss: true, bossKind: 'deg', tag: 'НЕ БОЙСЯ ТЕМНОТЫ!',
  endA: 'ВЕЧЕР СОСТОЯЛСЯ.', endB: 'Свет больше не гасили.',
  cast: [['АЛЕКСАНДР ПЕЛЕВИН', 'выступил'], ['ИНОАГЕНТЫ', 'собирательные образы'], ['ПРИЗРАКИ ЛИБЕРАЛОВ', 'карикатуры из портретов'], ['АНАСТАСИЯ МИРОНОВА', 'с мегафоном'], ['МАРИЯ ДЕГТЕРЕВА', 'боится света'], ['ПОРТРЕТЫ КЛАССИКОВ', 'ни при чём'], ['КНИГА', 'твёрдый переплёт']]
});

// ---------- босс: Мария Дегтерева ----------
const DEG_GREET = ['ШАША…', 'ШАША, ТЫ ДУМАЛ, Я НЕ ПРИДУ?', 'Я ЖДАЛА ТЕБЯ В ТЕМНОТЕ', 'ШАС ТЫ ПОЛУЧИШ.'];
const DEG_SHOUT = ['ШАША, ШАС ТЫ ПОЛУЧИШ!', 'ШАША, ТЫ ДОИГРАЛСЯ!', 'НАЦИСТ! НАЦИСТ!', 'ШАША, Я ВШЁ ВИЖУ!', 'ЗАЯВЛЕНИЕ УЖЕ В ФШБ!', 'ШКРИНЫ ШДЕЛАНЫ!', 'НАЦИСТ!!!', 'ШАША, ЭТО ЭКШТРЕМИЖМ!', 'ШАША, ТЫ ДОИГРАЛШЯ!'];
const DEG_HURT = ['АЙ! ЭТО НАПАДЕНИЕ!', 'ВШЁ ЗАПИШАНО!', 'ШАША!!!', 'НАЦИСТ ДЕРЁТСЯ!', 'ПИШУ ЗАЯВЛЕНИЕ!', 'ЭТО ТОЖЕ В ФШБ!'];
const DEG_LIGHT = ['ШВЕТ! ВЫКЛЮЧИТЕ ШВЕТ!', 'Я ЕЩЁ ВЕРНУШЬ!', 'ШШШ…', 'ТЕМНОТА, ВЕРНИШЬ!'];
const DEG_PAPER = ['ЖАЛОБА В ФСБ', 'ЖАЛОБА В СК', 'ЖАЛОБА В ПРОКУРАТУРУ', 'ЗАЯВЛЕНИЕ В ЦЕНТР «Э»', 'ЖАЛОБА В РКН', 'ДОНОС В ФСБ'];
// где появляется голова: слева у пола, справа у пола, в большой раме по центру
const DEG_SPOTS = [[150, FYB], [650, FYB], [400, 250]];
function startDeg() {
  L = buildBossLevel(); L.theme = 'dk'; L.dark = true; L.bg = bgStage; L.name = 'СЦЕНА'; L.song = 'boss';
  cam = 0; look = 0;
  parts = []; gibs = []; pickups = []; folders = []; floats = []; fxs = []; blurbs = []; words = []; mir = null; dkReset();
  Object.assign(P, { x: 400, y: FYB, vx: 0, vy: 0, hp: P.maxhp, face: 1, inv: 0, hurtT: 0, atk: 0, onGround: true, idleT: 0, bub: null, clean: 0, crouch: false, h: 76, idleAnim: '', safeX: 400, safeY: FYB });
  boss = { kind: 'deg', title: 'МАРИЯ ДЕГТЕРЕВА', x: 400, y: 250, hp: 14, max: 14, phase: 1, state: 'wait', t: 0, dk: 0, spot: 2, vis: 0, inv: 0, fl: 0, bub: null, line: 0, dead: false, started: false, shotT: 1, shoutT: 1, shoutA: 0, hopped: false, hopDone: false,
    prize: ['ВЫСТУПЛЕНИЕ СОСТОЯЛОСЬ', '(зал аплодирует)'] };
  mode = 'play'; modeT = 0; scene = 'play'; chain = 0; pendingCele = false; stopSong();
  banner = { s: 'СЦЕНА ДК', sub: 'свет сейчас погаснет', t: 2.2 };
}
function degPlace(i) { const b = boss; b.spot = i; b.x = DEG_SPOTS[i][0]; b.y = DEG_SPOTS[i][1]; }
function degNextSpot() {
  const c = [0, 1, 2].filter(i => i !== boss.spot && !(i < 2 && Math.abs(P.x - DEG_SPOTS[i][0]) < 120));
  return c.length ? pick(c) : 2;
}
function degBegin() { const b = boss; if (b.started) return; b.started = true; playSong('boss'); banner = null; b.state = 'dark'; b.t = 0; b.dk = 0; b.shotT = .6; lite.card = 3.2; }
function degOpen() { const b = boss; return b && !b.dead && b.vis > .6 && (b.state === 'dark' || b.state === 'greet' || b.state === 'hop'); }
function degBox() { const b = boss; return [b.x - 58, b.y - 150, b.x + 58, b.y - 8]; }
function degMelee(x0, x1, y0, y1) {
  if (!degOpen() || P.atkSet.has(boss)) return;
  const [a, bt, c, d] = degBox();
  if (x1 > a && x0 < c && y1 > bt && y0 < d) { P.atkSet.add(boss); damageDeg('book'); }
}
function degPaperHits() {
  if (!degOpen()) return;
  const [a, bt, c, d] = degBox();
  for (let i = blurbs.length - 1; i >= 0; i--) { const p = blurbs[i]; if (p.back && p.x > a && p.x < c && p.y > bt && p.y < d) { blurbs.splice(i, 1); damageDeg('paper'); } }
}
function damageDeg(by) {
  const b = boss; if (b.dead || b.inv > 0 || mode !== 'play') return;
  if (!b.started) degBegin();
  b.hp--; b.inv = .35; b.fl = .25; hitstop = .07; shake = Math.max(shake, 8); sfx.bonk(); sfx.stamp();
  confetti(b.x, b.y - 90, 6, 180);
  floater(by === 'paper' ? pick(['ВОЗВРАЩЕНО ОТПРАВИТЕЛЮ', 'ЖАЛОБА НА ЖАЛОБУ', 'НЕ ПО АДРЕСУ']) : pick(['ОТКАЗ!', 'ИЗЫДИ!', 'НЕ ПРИНЯТО!']), b.x, b.y - 170, { color: '#ffe36b', size: 10, t: .9, vy: -40 });
  if (b.hp <= 0) { degDeath(); return; }
  b.phase = b.hp <= 4 ? 3 : b.hp <= 9 ? 2 : 1;
  if (!b.bub || Math.random() < .5) { say(b, pick(DEG_HURT), 1.3); b.shoutA = .4; }
}
function degShoot() {
  const b = boss, d = sign(P.x - b.x), low = b.spot < 2;
  if (low && Math.random() < .45) {
    const hi = Math.random() < .5;
    envs.push({ x: b.x + d * 52, y: FYB - (hi ? 70 : 14), vx: d * (b.phase === 1 ? 250 : 290), t: 0 });
    sfx.paper();
  } else {
    const n = !low && b.phase >= 2 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const x = b.x + d * 30, y = b.y - 50, tx = P.x + (i ? rnd(-140, 140) : 0), ty = P.y - 40;
      const dx = tx - x, vx = clamp(Math.abs(dx), 170, 340) * sign(dx || d), T = Math.abs(dx / vx), gr = 480;
      const vy = clamp((ty - y - .5 * gr * T * T) / Math.max(.3, T), -460, 260);
      blurbs.push({ x, y, vx, vy, g: gr, q: pick(DEG_PAPER), from: b, back: false, t: 0, rot: 0, paper: true, hitTxt: 'ЖАЛОБА НА ВАС', kind: 'zhal' });
    }
    sfx.paper();
  }
  b.shoutA = Math.max(b.shoutA, .25);
}
function updateDeg(dt) {
  const b = boss; if (!b || b.dead) return;
  b.t += dt; b.inv = Math.max(0, b.inv - dt); b.fl = Math.max(0, b.fl - dt); b.shoutA = Math.max(0, b.shoutA - dt);
  if (b.bub) { b.bub.t -= dt; if (b.bub.t <= 0) b.bub = null; }
  const ph = b.phase, LIT = [3.4, 2.8, 2.2][ph - 1];
  switch (b.state) {
    case 'wait':
      lite.warn = b.t > 1.4;
      if (b.t > 2.4) { b.state = 'greet'; b.t = 0; degPlace(2); lite.on = true; lite.warn = false; lightsOff(); }
      break;
    case 'greet':
      b.vis = Math.min(1, b.vis + dt * 1.5);
      if (b.t > .9 && !b.bub) { if (b.line >= DEG_GREET.length) { degBegin(); break; } say(b, DEG_GREET[b.line++], 1.8); b.t = -.6; b.shoutA = .4; sfx.degShout(); }
      break;
    case 'dark':
    case 'hop':
      b.dk += dt;
      if (b.state === 'hop') {
        if (b.t < .3) b.vis = Math.max(0, b.vis - dt * 4);
        else if (!b.hopDone) { b.hopDone = true; degPlace(degNextSpot()); sfx.hiss(); }
        else b.vis = Math.min(1, b.vis + dt * 4);
        if (b.t > .65) { b.state = 'dark'; b.t = 0; }
      } else {
        b.vis = Math.min(1, b.vis + dt * 2.2);
        if (b.vis > .8) {
          b.shotT -= dt; if (b.shotT <= 0) { b.shotT = [1.05, .85, .68][ph - 1]; degShoot(); }
          b.shoutT -= dt; if (b.shoutT <= 0) { b.shoutT = rnd(1.5, 2.3); say(b, pick(DEG_SHOUT), 1.4); b.shoutA = .45; sfx.degShout(); }
        }
        if (ph === 3 && !b.hopped && b.dk > 2.3) { b.hopped = true; b.hopDone = false; b.state = 'hop'; b.t = 0; }
      }
      if (b.dk > LIGHT_OFF && b.state === 'dark') { b.state = 'light'; b.t = 0; lite.on = false; lightsOn(); say(b, pick(DEG_LIGHT), 1.4); sfx.hiss(); }
      break;
    case 'light':
      b.vis = Math.max(0, b.vis - dt * 3);
      lite.warn = b.t > LIT - 1;
      if (b.t > LIT) { b.state = 'dark'; b.t = 0; b.dk = 0; b.hopped = false; degPlace(degNextSpot()); lite.on = true; lite.warn = false; lightsOff(); b.shotT = .9; b.shoutT = .3; }
      break;
  }
  // у пола голову не пройти насквозь
  if (b.vis > .3 && b.spot < 2 && Math.abs(P.x - b.x) < 62 && P.y > b.y - 140) { P.x = clamp(b.x + (P.x < b.x ? -62 : 62), 22, W - 22); if (sign(P.vx) === sign(b.x - P.x)) P.vx = 0; }
  // доносы летят по прямой: низкие перепрыгивать, высокие пропускать сидя
  for (let i = envs.length - 1; i >= 0; i--) {
    const e = envs[i]; e.x += e.vx * dt; e.t += dt;
    if (mode === 'play' && P.inv <= 0 && Math.abs(e.x - P.x) < 18 && e.y + 6 > P.y - P.h && e.y - 6 < P.y) {
      floater('ДОНОС ПРИНЯТ', P.x, P.y - 110, { color: '#ffd0e8', size: 8, t: 1.6 }); hurtPlayer(sign(e.vx), false, 'donos'); envs.splice(i, 1); continue;
    }
    if (e.x < -40 || e.x > W + 40) envs.splice(i, 1);
  }
}
function degDeath() {
  const b = boss; mode = 'bossdeath'; modeT = 0; b.state = 'dying'; b.bub = null; stopSong(); blurbs = []; envs = []; P.atk = 0;
  for (const q of ghosts) { q.st = 'poof'; q.t = 0; }
  b.vis = 1; b.won = 0; b.gone = false; sfx.degShout();
}
function updateDegDeath(dt) {
  const b = boss; P.vx *= .9; P.vy = Math.min(900, P.vy + GRAV * dt); collide(P, dt);
  updateGhosts(dt);
  if (!b.gone) {
    // свет мигает и включается: голова тает
    lite.on = modeT < 2.6 && (modeT * 7 | 0) % 3 !== 0; lite.warn = false;
    b.vis = lite.on ? 1 : .55; shake = Math.max(shake, 2 + modeT * 2);
    if ((modeT * 8 | 0) !== ((modeT - dt) * 8 | 0)) { confetti(b.x + rnd(-40, 40), b.y - rnd(40, 140), 2, 120); sfx.paper(); }
    if (modeT > 2.6) {
      b.gone = true; b.dead = true; b.vis = 0; lite.on = false; confetti(b.x, b.y - 80, 70, 360); shake = 16; flash = .8; sfx.boom();
      memorial.push(['Мария Дегтерева', 'растаяла при свете. донос не дописан']);
    }
  } else if (!b.won) {
    if (modeT > 3.8) { b.won = .001; P.clean = 1; playSong('win'); sfx.applause(); burst(P.x, P.y - 80, 20, ['#fff', '#ffe36b'], 200, .7); }
  } else {
    b.won += dt;
    if (b.won > 3.4 && mode === 'bossdeath') { cele.n = 99; startCelebrate(); cele.title = 'ПЕЛЕВИН'; cele.kind = 'dance'; L.after = true; }
  }
}
function drawDeg() {
  const b = boss;
  for (const e of envs) { spr('env', e.x, e.y + 7, e.vx < 0); T('ДОНОС', e.x - camR, e.y - 14, { size: 7, color: '#ffd0e8', stroke: OUTC }); }
  if (b.vis > .01 && !b.dead) {
    const name = b.state === 'dying' ? 'deg_shout' : b.fl > 0 ? 'deg_hurt' : b.shoutA > 0 ? 'deg_shout' : 'deg_idle';
    const bob = b.spot === 2 ? Math.sin(gameT * 2.2) * 4 : 0, ox = (b.fl > 0 || b.state === 'dying') ? rnd(-3, 3) : 0;
    g.globalAlpha = .2 * b.vis; g.fillStyle = '#c08aff'; g.beginPath(); g.arc(b.x, b.y - 80 + bob, 92, 0, 6.29); g.fill(); g.globalAlpha = 1;
    spr(name, b.x + ox, b.y + bob, b.spot === 1, { a: b.vis });
    if (b.fl > .12) spr(name, b.x + ox, b.y + bob, b.spot === 1, { img: atlasW, a: .7 * b.vis });
    if (b.bub && b.vis > .3) bubble(b.bub.s, b.x, b.y - 166 + bob, { prio: 5, size: 10, max: 16, bg: '#2a0a1e', color: '#ffd0e8', shake: b.shoutA > 0 ? 1.5 : 0 });
  }
  if (b.state === 'dying' && !b.gone) {
    const s = 'ШВЕТ!!! ВЫКЛЮЧИТЕ ШВЕТ!!!', n = Math.min(s.length, (modeT * 12 | 0));
    T(s.slice(0, n), W / 2 + rnd(-2, 2), 70 + rnd(-2, 2), { size: 16 + modeT * 2, color: '#fff', stroke: '#4a1030', sw: 6 });
  }
}
function drawDegHud() {
  const b = boss; if (!b.started || b.dead) return;
  T(b.title, W / 2, 16, { size: 9, color: '#ffb0d0', stroke: OUTC });
  OV.push(c => { c.fillStyle = OUTC; c.fillRect(W / 2 - 152, 26, 304, 12); const sw = 300 / b.max; for (let i = 0; i < b.max; i++) { c.fillStyle = i < b.hp ? (b.phase === 3 ? '#ff5b6b' : b.phase === 2 ? '#ff8ad0' : '#c08aff') : '#2a3350'; c.fillRect(W / 2 - 150 + i * sw, 28, sw - 2, 8); } });
}
function drawDegIntro() {
  const t = sceneT;
  R(0, 0, W, H, '#0c0614'); for (let i = 0; i < 12; i++) { const y = ((i * 44 + t * 200) % (H + 44)) - 44; R(0, y, W, 16, i % 2 ? '#1a0c22' : '#140a1c'); }
  R(0, 150, W, 150, '#05020a'); R(0, 150, W, 3, '#c2303c'); R(0, 297, W, 3, '#c2303c');
  const a = clamp((t - .2) / .8, 0, 1);
  if (!(t > .2 && t < 1 && Math.random() < .4)) spr(t > 1.2 && (t * 2 | 0) % 2 ? 'deg_shout' : 'deg_idle', 200, 298, false, { a });
  const nm = 'МАРИЯ ДЕГТЕРЕВА', n = clamp(((t - .9) * 12 | 0), 0, nm.length);
  T(nm.slice(0, n), 320, 192, { size: 20, color: '#fff', align: 'left', stroke: OUTC, sw: 6 });
  if (t > 2) T('пишет. в органы', 322, 226, { size: 8, color: '#ffb0d0', align: 'left' });
  if (t > 2.5) T('ЖАЛОБ ОТПРАВЛЕНО: 9999+', 322, 248, { size: 8, color: '#ffe36b', align: 'left' });
  if (t > 2.9) T('ВИДНА: ТОЛЬКО В ТЕМНОТЕ', 322, 264, { size: 8, color: '#ffe36b', align: 'left' });
  if (t > 3.3) T('ШАША, ШАС ТЫ ПОЛУЧИШ', 322, 280, { size: 8, color: '#ff8a94', align: 'left' });
}

// ---------- звук и музыка ----------
Object.assign(sfx, {
  off() { tn('square', 140, 40, .45, .12); nz(0, .18, .4, 'lowpass', 900, 100); },
  on() { nz(0, .04, .3, 'highpass', 3000); tn('square', 90, 180, .14, .1); },
  flick() { nz(0, .03, .12, 'highpass', 3500); tn('square', 60, 60, .04, .05); },
  ghost() { wail(.9, 330, 560, .06, 6, 30); },
  ghost2() { tn('sine', 980, 380, .4, .08); tn('sine', 990, 390, .4, .05, .02); },
  hiss() { nz(0, .5, .22, 'highpass', 4000, 7000); },
  degShout() { wail(.34, 980, 700, .13, 30, 60); },
  applause() { for (let i = 0; i < 46; i++) nz(i * .045 + rnd(.03), .05, .14 * rnd(.4, 1), 'bandpass', rnd(1800, 3200), 0, 1.5); }
});
// вальс старого ДК
SONGS.dk = {
  bpm: 132, loop: true, tr: [
    { w: 'square', v: .065, s: seq('D5:4 F5:2 A5:2 G5:4 F5:2 E5:2 F5:4 D5:2 A4:2 C#5:8 D5:4 F5:2 A5:2 A#5:4 A5:2 G5:2 F5:2 E5:2 D5:2 C#5:2 D5:8 A5:2 A#5:2 A5:2 G5:2 F5:4 G5:2 A5:2 E5:4 F5:2 G5:2 C#5:4 E5:4 D5:2 E5:2 F5:2 G5:2 A5:2 G5:2 F5:2 E5:2 D5:8 -:4 A4:4') },
    { w: 'triangle', v: .2, s: bassLine(['D2', 'A#1', 'A1', 'A1', 'D2', 'G1', 'A1', 'D2']) }
  ], dr: 'k...h.s...h.k.h.'
};

// ---------- графика этапа ----------
const POETS = [
  ['ПУШКИН', { skin: '#e2b088', hair: '#1e1410', style: 'curly', coat: '#2a2a3a', shirt: '#f4f0e0', pants: '#222', shoes: '#111' }, (r, h) => { r(11.4, 10, 2, 6, h); r(13.2, 13, 2, 3, h); }],
  ['ЛЕРМОНТОВ', { skin: '#ecc3a0', hair: '#231a14', style: 'side', coat: '#24382a', shirt: '#b02a2a', pants: '#222', shoes: '#111' }, (r, h) => r(15.6, 12.8, 3.4, .9, h)],
  ['МАЯКОВСКИЙ', { skin: '#e8b890', hair: '#2a2420', style: 'short', coat: '#26262c', shirt: '#e8e4d0', tie: '#a02020', pants: '#222', shoes: '#111', wide: true, brow: true }],
  ['ЕСЕНИН', { skin: '#f0c9a0', hair: '#e8c060', style: 'wavy', coat: '#4a5a7a', shirt: '#fff', pants: '#222', shoes: '#111' }],
  ['АХМАТОВА', { skin: '#efd2bc', hair: '#1a1418', style: 'long', coat: '#2a2030', scarf: '#6a3a7a', pants: '#222', shoes: '#111', lips: '#a04050' }, (r, h) => r(12, 5, 7.5, 3, h)],
  ['БЛОК', { skin: '#ecc3a0', hair: '#7a5a3a', style: 'curly', coat: '#2a2a2a', shirt: '#fff', pants: '#222', shoes: '#111' }]
];
const GHOST_LOOK = {
  pol: [{ skin: '#f0c8a8', hair: '#2a1c18', style: 'curly', coat: '#1e1e28', skirt: '#1e1e28', pants: '#1e1e28', shoes: '#111', wide: true, lips: '#c2303c' }, 'paper'],
  byk: [{ skin: '#eab894', hair: '#3a3438', style: 'curly', glasses: true, coat: '#4a4a5a', shirt: '#d8d8e0', pants: '#333', shoes: '#111', wide: true, stubble: '#cfa48c' }, 'book'],
  aku: [{ skin: '#f0c9a0', hair: '#c8c8d0', style: 'bald', glasses: true, coat: '#3a3a48', shirt: '#e8e8f0', tie: '#5a2a2a', pants: '#333', shoes: '#111' }, 'pen']
};
function makePortrait(name, look, extra) {
  const U = 2, [dc, dx] = mkCanvas(DFW * U, DFH * U);
  drawDoll(dx, U, look, { armF: [.15, 5, .3, 5], armB: [-.15, 5, -.1, 5] });
  if (extra) extra((a, b, w, h, col) => { dx.fillStyle = col || look.hair; dx.fillRect(Math.round(a * U), Math.round(b * U), Math.round(w * U), Math.round(h * U)); }, look.hair);
  outline(dx, DFW * U, DFH * U);
  const [c, x] = mkCanvas(72, 92);
  x.fillStyle = OUTC; x.fillRect(0, 0, 72, 76);
  x.fillStyle = '#a07a2a'; x.fillRect(2, 2, 68, 72); x.fillStyle = '#e0b84a'; x.fillRect(2, 2, 68, 2); x.fillRect(2, 2, 2, 72);
  x.fillStyle = '#6a4a14'; x.fillRect(4, 70, 66, 4); x.fillRect(66, 4, 4, 70);
  x.fillStyle = '#f3d27a'; for (let i = 8; i < 66; i += 8) { x.fillRect(i, 3, 2, 1); x.fillRect(i, 72, 2, 1); }
  x.fillStyle = OUTC; x.fillRect(7, 7, 58, 62);
  const gr = x.createLinearGradient(0, 8, 0, 68); gr.addColorStop(0, '#4a3a26'); gr.addColorStop(1, '#1c140c'); x.fillStyle = gr; x.fillRect(8, 8, 56, 60);
  x.save(); x.beginPath(); x.rect(8, 8, 56, 60); x.clip(); x.drawImage(dc, 6, 2, 48, 66, 12, 8, 48, 66); x.restore();
  x.fillStyle = 'rgba(255,240,200,.08)'; x.fillRect(10, 10, 22, 4);
  x.fillStyle = OUTC; x.fillRect(3, 78, 66, 13); x.fillStyle = '#c9a24a'; x.fillRect(4, 79, 64, 11);
  x.font = '6px PS2P,monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#2a1c0c'; x.fillText(name, 36, 85);
  return c;
}
function makeGhost(look, prop) {
  const U = 2, w = DFW * U, h = DFH * U, [c, x] = mkCanvas(w, h);
  drawDoll(x, U, look, { armF: [1.55, 5, 1.35, 5], armB: [1.25, 5, 1.15, 5], mouth: 'o', lean: .8, prop, legs: [[.5, 6, .3, 6], [.7, 6, .4, 6]] });
  outline(x, w, h);
  const im = x.getImageData(0, 0, w, h), d = im.data, hip = 29 * U;
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const i = (yy * w + xx) * 4; if (!d[i + 3]) continue;
    const cut = hip + 6 * U + Math.sin(xx * .45) * U * 1.5;
    const a = yy < hip ? 1 : yy < cut ? 1 - (yy - hip) / (cut - hip) : 0;
    if (d[i] + d[i + 1] + d[i + 2] < 90) { d[i] = 40; d[i + 1] = 110; d[i + 2] = 150; }
    else { d[i] = d[i] * .45 + 110; d[i + 1] = d[i + 1] * .45 + 132; d[i + 2] = d[i + 2] * .45 + 140; }
    d[i + 3] = Math.round(a * 225);
  }
  x.putImageData(im, 0, 0);
  return c;
}
// Голова: чёрное каре с длинной косой чёлкой на один глаз, бледная, чёрный пиджак
function makeDegHead(v) {
  const U = 3, w = 46 * U, h = 54 * U, [c, x] = mkCanvas(w, h);
  const r = (a, b, ww, hh, col) => { x.fillStyle = col; x.fillRect(a * U, b * U, ww * U, hh * U); };
  const H = '#15121a', Hh = '#2e2a38', S = '#f1d7c8', Ss = '#dcb8a6', E = '#141018';
  // плечи: пиджак, футболка с принтом
  r(3, 47, 40, 7, '#1b1b22'); r(16, 47, 14, 7, '#0e0e12'); r(13, 46, 4, 8, '#2a2a34'); r(29, 46, 4, 8, '#2a2a34');
  r(19, 50, 6, 1, '#c2303c'); r(21, 51, 5, 1, '#c2303c'); r(18, 52, 9, 1, '#d8d4d0');
  // волосы сзади
  r(11, 3, 24, 2, H); r(8, 5, 30, 2, H); r(6, 7, 34, 37, H); r(5, 12, 36, 30, H);
  r(4, 40, 5, 6, H); r(37, 40, 5, 6, H); r(6, 44, 5, 3, H); r(35, 44, 5, 3, H); r(9, 44, 3, 2, H); r(34, 44, 3, 2, H);
  r(15, 5, 10, 1, Hh); r(8, 13, 1, 20, Hh); r(37, 15, 1, 18, Hh);
  // шея и лицо
  r(19, 40, 9, 8, Ss); r(19, 46, 9, 1, '#c8a090');
  r(12, 11, 22, 24, S); r(13, 35, 20, 3, S); r(15, 38, 16, 2, S); r(18, 40, 10, 1, S);
  r(12, 11, 2, 24, Ss); r(31, 30, 2, 6, Ss);
  // пряди по бокам лица
  r(10, 12, 3, 29, H); r(33, 11, 2, 27, H); r(34, 30, 2, 12, H);
  // глаз (второй под чёлкой)
  if (v === 2) { r(24, 21, 7, 1, E); r(25, 22, 5, 1, E); r(24, 18, 7, 1, '#2a1c1c'); }
  else {
    if (v === 1) { r(24, 17, 2, 1, '#2a1c1c'); r(26, 18, 2, 1, '#2a1c1c'); r(28, 19, 3, 1, '#2a1c1c'); }
    else r(24, 18, 7, 1, '#2a1c1c');
    r(23, 21, 8, 1, E); r(24, 22, 6, v === 1 ? 3 : 2, '#f4f0ee'); r(26, 22, 3, 2, '#3a2418'); r(27, 22, 1, 1, '#000'); r(30, 21, 2, 1, E);
  }
  r(19, 24, 2, 1, E);
  // нос, щека
  r(22, 24, 1, 6, Ss); r(21, 30, 4, 1, Ss); r(22, 31, 2, 1, '#c49a88'); r(27, 29, 3, 1, '#f0b8b0');
  // рот
  if (v === 1) { r(19, 33, 9, 5, '#4a0a14'); r(20, 33, 7, 1, '#f4f0ee'); r(21, 37, 5, 1, '#d07a80'); r(18, 33, 1, 2, '#a8505a'); }
  else if (v === 2) { r(21, 33, 4, 4, '#4a0a14'); r(21, 37, 4, 1, '#d07a80'); r(34, 16, 2, 3, '#9fd8ff'); }
  else { r(19, 34, 8, 1, '#a8505a'); r(27, 33, 1, 1, '#a8505a'); r(20, 35, 6, 1, '#d07a80'); }
  // косая чёлка закрывает один глаз
  r(11, 8, 24, 4, H); r(11, 12, 19, 2, H); r(11, 14, 15, 2, H); r(11, 16, 12, 2, H); r(11, 18, 10, 2, H);
  r(11, 20, 9, 2, H); r(11, 22, 8, 2, H); r(12, 24, 6, 2, H); r(13, 26, 4, 2, H); r(14, 28, 2, 2, H);
  r(16, 10, 13, 1, Hh); r(14, 13, 9, 1, Hh); r(13, 16, 6, 1, Hh);
  outline(x, w, h);
  return c;
}
function extraSprites() {
  const out = [];
  POETS.forEach((p, i) => out.push({ name: 'por_' + i, c: makePortrait(p[0], p[1], p[2]), w: 72, h: 92, ax: 36, ay: 0 }));
  for (const k of GHOSTS) out.push({ name: 'g_' + k, c: makeGhost(GHOST_LOOK[k][0], GHOST_LOOK[k][1]), w: DFW * 2, h: DFH * 2, ax: 30, ay: 46 });
  ['deg_idle', 'deg_shout', 'deg_hurt'].forEach((n, i) => out.push({ name: n, c: makeDegHead(i), w: 138, h: 162, ax: 69, ay: 162 }));
  const [ec, ex] = mkCanvas(20, 14);
  ex.fillStyle = OUTC; ex.fillRect(0, 0, 20, 14); ex.fillStyle = '#f4ecd8'; ex.fillRect(1, 1, 18, 12); ex.fillStyle = '#c9b48a';
  for (let i = 0; i < 9; i++) { ex.fillRect(1 + i, 1 + (i * .7 | 0), 1, 1); ex.fillRect(18 - i, 1 + (i * .7 | 0), 1, 1); }
  ex.fillStyle = '#c2303c'; ex.fillRect(8, 7, 4, 4);
  out.push({ name: 'env', c: ec, w: 20, h: 14, ax: 10, ay: 14 });
  return out.concat(slopSprites());
}
// фон этапа: стена старого ДК, склеивается сама с собой
function makeDkBg() {
  const [c, x] = mkCanvas(W, H);
  x.fillStyle = '#3e2228'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#46282f'; for (let i = 0; i < W; i += 20) x.fillRect(i, 0, 10, 300);
  x.fillStyle = '#5a3640'; for (let i = 0; i < W; i += 40) for (let j = 44; j < 290; j += 40) { x.fillRect(i + 18, j, 4, 4); x.fillRect(i + 16, j + 2, 8, 1); }
  x.fillStyle = '#d8caa4'; x.fillRect(0, 0, W, 26); x.fillStyle = '#b8a880'; for (let i = 0; i < W; i += 12) x.fillRect(i, 18, 6, 6); x.fillStyle = OUTC; x.fillRect(0, 26, W, 4);
  x.fillStyle = OUTC; x.fillRect(0, 296, W, 4); x.fillStyle = '#5a3a22'; x.fillRect(0, 300, W, H - 300);
  for (let i = 0; i < W; i += 100) { x.fillStyle = '#4a2e1a'; x.fillRect(i + 10, 314, 80, 60); x.fillStyle = '#6a4628'; x.fillRect(i + 10, 314, 80, 2); }
  // колонны
  for (const px of [40, 440]) {
    x.fillStyle = OUTC; x.fillRect(px - 2, 30, 48, 266); x.fillStyle = '#d8ccaa'; x.fillRect(px, 30, 44, 266);
    x.fillStyle = '#b8ac8a'; for (let k = 6; k < 44; k += 9) x.fillRect(px + k, 52, 3, 230); x.fillStyle = '#e8dcbc'; x.fillRect(px - 6, 30, 56, 16); x.fillRect(px - 6, 282, 56, 14);
  }
  // высокие окна в ночь
  for (const wx of [240, 640]) {
    x.fillStyle = OUTC; x.fillRect(wx - 40, 56, 80, 200); x.fillStyle = '#121a3a'; x.fillRect(wx - 36, 60, 72, 192);
    x.fillStyle = '#1c2856'; x.fillRect(wx - 36, 60, 72, 40);
    x.fillStyle = OUTC; x.fillRect(wx - 2, 60, 4, 192); x.fillRect(wx - 36, 150, 72, 4);
    x.fillStyle = '#7a1424'; x.fillRect(wx - 52, 46, 18, 220); x.fillRect(wx + 34, 46, 18, 220); x.fillStyle = '#5a0e1a'; x.fillRect(wx - 46, 46, 4, 220); x.fillRect(wx + 40, 46, 4, 220);
  }
  x.fillStyle = '#fff6c8'; x.fillRect(612, 78, 12, 12); x.fillStyle = '#121a3a'; x.fillRect(616, 76, 10, 10);
  // афиши
  const poster = (px, py, lines, col) => { x.fillStyle = OUTC; x.fillRect(px - 2, py - 2, 74, 94); x.fillStyle = col; x.fillRect(px, py, 70, 90); x.font = '6px PS2P,monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#16161d'; lines.forEach((l, i) => x.fillText(l, px + 35, py + 16 + i * 14)); };
  poster(340, 190, ['ВЕЧЕР', 'ПОЭЗИИ', '', 'А.ПЕЛЕВИН', 'СЕГОДНЯ'], '#e8d8a8');
  poster(720, 196, ['КРУЖОК', 'ХОРА', '', 'ВТ, ЧТ', '18:00'], '#c8d8c0');
  x.fillStyle = 'rgba(10,6,20,.42)'; x.fillRect(0, 0, W, H);
  return c;
}
// сцена для босса: кулисы, большая пустая рама в центре, рампа
function makeStageBg() {
  const [c, x] = mkCanvas(W, H);
  x.fillStyle = '#24141c'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#2c1822'; for (let i = 0; i < W; i += 28) x.fillRect(i, 0, 14, FYB);
  // рама
  x.fillStyle = OUTC; x.fillRect(318, 80, 164, 178); x.fillStyle = '#a07a2a'; x.fillRect(322, 84, 156, 170); x.fillStyle = '#e0b84a'; x.fillRect(322, 84, 156, 3);
  x.fillStyle = '#0a060e'; x.fillRect(332, 94, 136, 152);
  // растяжка
  x.fillStyle = OUTC; x.fillRect(196, 44, 408, 30); x.fillStyle = '#a3111f'; x.fillRect(200, 48, 400, 22); x.fillStyle = '#f3c93a'; x.fillRect(200, 48, 400, 2);
  x.font = '8px PS2P,monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff6e0'; x.fillText('ТВОРЧЕСКИЙ ВЕЧЕР А. ПЕЛЕВИНА', 400, 60);
  // кулисы
  for (const [x0, d] of [[0, 1], [W, -1]]) {
    for (let i = 0; i < 6; i++) { const cx = x0 + d * (i * 20 + 10); x.fillStyle = i % 2 ? '#7a1020' : '#9a1828'; x.fillRect(Math.min(cx, cx + d * 20), 0, 20, FYB); }
    x.fillStyle = '#c9a24a'; x.fillRect(d > 0 ? 112 : W - 120, 200, 8, 12);
  }
  x.fillStyle = '#7a1020'; x.fillRect(0, 0, W, 34); x.fillStyle = '#c9a24a'; for (let i = 0; i < W; i += 10) x.fillRect(i, 34, 6, 6);
  // сцена и рампа
  x.fillStyle = '#7a5432'; x.fillRect(0, FYB, W, H - FYB); x.fillStyle = '#5e3e22'; for (let i = 0; i < W; i += 40) x.fillRect(i, FYB, 2, H - FYB);
  x.fillStyle = '#e8c890'; x.fillRect(0, FYB, W, 2); x.fillStyle = OUTC; x.fillRect(0, FYB + 30, W, H);
  for (let i = 20; i < W; i += 50) { x.fillStyle = OUTC; x.fillRect(i - 6, FYB + 30, 12, 8); x.fillStyle = '#fff0b0'; x.fillRect(i - 4, FYB + 31, 8, 4); }
  x.fillStyle = 'rgba(10,6,20,.2)'; x.fillRect(0, 0, W, H);
  return c;
}
function buildDkArt() { bgDK = makeDkBg(); bgStage = makeStageBg(); buildSlopArt(); }
BK.deg = { start: startDeg, update: updateDeg, death: updateDegDeath, hud: drawDegHud, melee: degMelee, papers: degPaperHits, intro: drawDegIntro };
