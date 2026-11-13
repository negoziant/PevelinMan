// ---------- ЭТАП 3: ЗАВОД НЕЙРОСЛОПА ----------
// Старый офис движения, внутри — завод: робонашисты кидают нейроблёрбы, конвейеры тащат,
// прессы штампуют лозунги. В конце — Борис Якеменко и ЖЕЛЕЗНЫЙ БОРИС ЯКЕМЕНКО.
// Все персонажи — карикатуры.
let bgSlop = null, bgFactory = null;
const NEURO = ['«СЛАВА НЕЙРОСЕТИ!»', '«ГЕНИАЛЬНО. 6 ПАЛЬЦЕВ»', '«[ВСТАВЬТЕ ЛОЗУНГ]»', '«ПАТРИОТИЗМ.EXE»', '«НЕ ТОТ, НО СОЙДЁТ»', '«ГРАФОМАНИЯ 10/10»', '«ИКОНОСТАС ПОШЛЯКОВ»', '«ПАЦАНСКАЯ АНТРОПОЛОГИЯ»', '«КУМИР 90-Х. Б/У»', '«ОДОБРЕНО БОРИСОМ»', '«ШЕДЕВР (ПРОМПТ №7)»'];
const ROBO_LAST = ['ОШИБКА 404', 'ПЕРЕЗАГРУЗКА…', 'ДОЛОЖУ БОРИСУ…', 'ТОКЕНЫ КОНЧИЛИСЬ', 'ШПАНА ДЕРЁТСЯ', 'ЛИМОНОВЩИНА…', 'ПРОМПТ НЕ НАЙДЕН'];
DEATH.press = ['ПРОШТАМПОВАН', 'теперь ты тоже лозунг'];
DEATH.rocket = ['ЗАГЕНЕРИРОВАН', 'нейросеть написала о тебе роман. плохой'];
DEATH.fist = ['НОКАУТ', 'железный аргумент'];
DEATH.wave = ['СБИТ С НОГ', 'железный аргумент'];

// робонашист в патруле: ходит туда-сюда, увидел Пелевина — встаёт и кидает нейроблёрбы
function patrolAgent(a, dt, dx, dist, near) {
  if (mode === 'play' && dist < 250 && near && !a.awe) {
    a.face = sign(dx); a.vx = 0; a.state = 'offer';
    if (dist > 50) { a.throwT -= dt; if (a.throwT <= 0 && blurbs.length < 3) { a.throwT = rnd(1.8, 2.8); throwBlurb(a); } }
  } else {
    if (a.x0 === undefined) { a.x0 = a.x - a.range; a.x1 = a.x + a.range; a.pd = -1; }
    if (a.x < a.x0) a.pd = 1; if (a.x > a.x1) a.pd = -1;
    if ((a.onGround && !groundBelow(a.x + a.pd * 18, a.y)) || a.hitWall) a.pd *= -1;
    a.face = a.pd; a.vx = a.awe ? 0 : a.pd * 48; a.state = a.awe ? 'idle' : 'walk';
  }
}

// ---------- конвейеры и прессы ----------
const pressT = pr => (gameT + pr.ph) % 3.2;
function pressY(pr) {   // низ плиты
  const t = pressT(pr), up = FY - 112;
  if (t < 2.3) return up;
  if (t < 2.4) return up + (FY - up) * (t - 2.3) / .1;
  if (t < 2.8) return FY;
  return FY - (FY - up) * (t - 2.8) / .4;
}
function updateSlop(dt) {
  for (const c of L.convs) if (P.onGround && P.ground && P.ground.k === 'f' && P.x > c.x && P.x < c.x + c.w) P.x += c.sp * dt;
  for (const pr of L.presses) {
    const t = pressT(pr), y = pressY(pr);
    if (t >= 2.4 && t - 1 / 60 < 2.4 && inView(pr.x)) { sfx.thud(); shake = Math.max(shake, 5); burst(pr.x, FY - 2, 8, ['#cfd8e6', '#8a92a8'], 120, .4); }
    if (t > 2.3 && Math.abs(P.x - pr.x) < pr.w / 2 + 8 && y > P.y - P.h + 4) hurtPlayer(P.x < pr.x ? -1 : 1, false, 'press');
  }
}
function drawSlopFront() {
  for (const c of L.convs) {
    if (c.x + c.w < cam - 10 || c.x > cam + W + 10) continue;
    R(c.x, FY - 3, c.w, 12, OUTC); R(c.x + 2, FY - 1, c.w - 4, 8, '#2a2e38');
    const off = ((gameT * c.sp) % 20 + 20) % 20;
    for (let i = off - 20; i < c.w - 6; i += 20) if (i > 0) { const d = sign(c.sp); R(c.x + i, FY + 1, 6, 4, '#e9b616'); R(c.x + i + (d > 0 ? 6 : -2), FY + 2, 2, 2, '#e9b616'); }
    for (const ex of [c.x + 6, c.x + c.w - 6]) { R(ex - 6, FY - 3, 12, 12, OUTC); R(ex - 4, FY - 1, 8, 8, '#8a92a8'); }
  }
  for (const pr of L.presses) {
    if (!inView(pr.x, 60)) continue;
    const y = Math.round(pressY(pr)), t = pressT(pr), warn = t > 1.8 && t < 2.3, ox = warn ? rint(-1, 1) : 0, x = pr.x + ox;
    R(x - 8, 30, 16, y - 30 - 26, OUTC); R(x - 6, 30, 12, y - 30 - 26, '#a8b0c0'); R(x - 6, 30, 4, y - 56, '#d8e0f0');
    R(pr.x - pr.w / 2 - 10, 18, pr.w + 20, 16, OUTC); R(pr.x - pr.w / 2 - 8, 20, pr.w + 16, 12, '#4a5060');
    R(x - pr.w / 2 - 2, y - 28, pr.w + 4, 28, OUTC); R(x - pr.w / 2, y - 26, pr.w, 24, '#5a6278');
    g.fillStyle = pats.hz; g.fillRect(x - pr.w / 2, y - 26, pr.w, 6);
    T('ЛОЗУНГ', x - camR, y - 10, { size: 6, color: warn && (gameT * 12 | 0) % 2 ? '#ff5b6b' : '#ffe36b' });
    if (warn) R(pr.x - pr.w / 2, FY - 2, pr.w, 2, (gameT * 16 | 0) % 2 ? '#ff5b6b' : '#ffd0d6');
  }
}
function drawSlopSolid(s, x, y, w) {
  if (s.hid) return;
  if (s.k === 'f') {
    R(x, y, w, H - y, '#22262f'); R(x, y, w, 3, '#a8b0c0'); R(x, y + 3, w, 3, '#5a6278');
    for (let i = 4; i < w; i += 12) R(x + i, y + 10, 2, H - y, '#181b22');
    for (let j = y + 18; j < H; j += 14) R(x, j, w, 2, '#181b22');
    R(x, y, 3, H - y, OUTC); R(x + w - 3, y, 3, H - y, OUTC);
  } else if (s.k === 'b') {
    // серверная стойка
    R(x, y, w, s.h, OUTC); R(x + 2, y + 2, w - 4, s.h - 4, '#2e3440');
    for (let yy = 6; yy < s.h - 6; yy += 9) { R(x + 5, y + yy, w - 10, 6, '#3c4454'); R(x + w - 14, y + yy + 2, 3, 2, ((gameT * 3 + yy + x) | 0) % 3 ? '#39ff8a' : '#14401e'); R(x + w - 9, y + yy + 2, 3, 2, ((gameT * 5 + yy) | 0) % 4 ? '#ff5b6b' : '#401414'); }
  } else {
    R(x, y, w, 12, OUTC); R(x + 1, y, w - 2, 3, '#c8d0e0'); R(x + 1, y + 3, w - 2, 7, '#4a5060');
    for (let i = 5; i < w - 4; i += 8) R(x + i, y + 5, 4, 3, '#22262f');
    R(x + 4, y + 12, 3, 6, OUTC); R(x + w - 7, y + 12, 3, 6, OUTC);
    if (s.mv) { R(x + w / 2 - 5, y + 12, 10, 4, OUTC); R(x + w / 2 - 3, y + 13, 6, 2, (gameT * 6 | 0) % 2 ? '#39e0d0' : '#1a7f78'); }
  }
}
function drawSlopGate() {
  const x = L.gateX, o = Math.round(L.gate * 118);
  R(x - 14, FY - 152, 98, 152, OUTC); R(x - 10, FY - 148, 90, 148, '#4a5060'); g.fillStyle = pats.hz; g.fillRect(x - 10, FY - 148, 90, 8);
  R(x, FY - 122, 70, 122, '#0b0712');
  for (let y = 0; y < 122 - o; y += 8) { R(x, FY - 122 + y, 70, 7, '#6a7288'); R(x, FY - 122 + y, 70, 2, '#8a92a8'); }
  R(x + 28, FY - 140, 14, 8, (gameT * 3 | 0) % 2 ? '#ff3040' : '#601018');
  T('ЦЕХ №1', x + 35 - camR, FY - 164, { size: 8, color: '#ff6b6b', stroke: OUTC });
}

// ---------- уровень ----------
function buildLevel3() {
  const k = levelKit(6800), l = k.l, { fl, bl, pl, mv, ag, cs } = k;
  l.name = 'ЗАВОД НЕЙРОСЛОПА'; l.theme = 'slop'; l.bgA = bgSlop; l.song = 'slop';
  l.convs = []; l.presses = [];
  const conv = (x, w, sp) => l.convs.push({ x, w, sp });
  const press = (x, ph) => l.presses.push({ x, w: 56, ph: ph || 0 });
  const rob = (x, y, kind, line, v, o) => ag(x, y, kind, line, Object.assign({ robo: v || 1 }, o || {}));
  fl(-200, 1400); fl(1500, 2700); fl(2820, 4300); fl(4500, 7000);
  // A: бывший офис
  k.sign(60, 236, ['ОФИС ДВИЖЕНИЯ:', 'ВХОД ПО ПРОПУСКАМ', '(ПРОПУСКА ПИШЕТ ИИ)'], 200);
  cs(370, FY, 'socks', 0);
  rob(600, FY, 'sit', 'ШПАНА ОБНАРУЖЕНА. ПЕЛЕВИН.');
  bl(800, 346, 70, 40); rob(835, 346, 'sit', 'НАЦБОЛ? ПРОВЕРЯЮ… 404', 2);
  rob(1150, FY, 'patrol', 'ВОЗЬМИТЕ НЕЙРОБЛЁРБ', 1, { range: 130 });
  ag(1330, FY, 'sit', 'я не робот, я иноагент. блёрб?');
  // B: конвейер и прессы
  k.check(1560);
  conv(1620, 420, -60); press(1760, 0); press(2120, 1.6);
  rob(2330, FY, 'patrol', 'БОРИС ВЕЛЕЛ ПЕРЕДАТЬ: ГОПОТА', 2, { range: 140 });
  cs(2560, FY, 'heart', 1);
  pl(2725, 340, 70);
  // C: мостки над цехом
  k.check(2960);
  pl(3040, 320, 90); pl(3180, 262, 90); pl(3330, 210, 110);
  cs(3220, 262, 'books', 3);
  rob(3380, 210, 'sit', 'Я ВИЖУ ВАС СВЕРХУ. ЗА!', 1, { sign: 'ЗА!!1' });
  k.sign(3470, 240, ['ПЛАН ЦЕХА:', '1000 ЛОЗУНГОВ/ЧАС', 'СМЫСЛ: НЕ НУЖЕН'], 170);
  k.zap(3700, 230, 2.6, 0);
  conv(3760, 500, 70); press(4000, .8);
  rob(3900, FY, 'patrol', 'ВПЕРЁД ВПЕРЁД ВПЕРЁД', 2, { range: 120 });
  mv(4330, 4420, 336, 76, 48);
  // D: генеральный цех
  k.check(4600);
  rob(4820, FY, 'sit', 'ПОСТ О ВАС СГЕНЕРИРОВАН', 1, { sign: 'ДА' }); rob(4880, FY, 'sit', 'ПОДТВЕРЖДАЮ. ГРАФОМАН', 2);
  conv(5000, 420, -80); press(5130, 0); press(5290, 1.2);
  cs(5600, FY, 'matryoshka', 2);
  rob(5800, FY, 'patrol', 'ГЕНЕРАЛЬНЫЙ ПРОМПТЕР ЖДЁТ', 1, { range: 160 });
  bl(6060, 346, 70, 40); bl(6130, 306, 70, 80); l.pot = { x: 6165, y: 306 };
  rob(6420, FY, 'give', 'ЛИМОНОВЩИНА! ДЕРЖИТЕ БЛЁРБ!', 2);
  k.sign(6250, 240, ['ЦЕХ №1:', 'ГЕНЕРАЛЬНЫЙ', 'ПРОМПТЕР'], 140);
  l.fallX = 5000;
  return k.done();
}
LEVELS.push({
  name: 'ЗАВОД НЕЙРОСЛОПА', sub: 'босс: ???', build: buildLevel3, boss: true, bossKind: 'yak', tag: 'ПРОМПТ: УЦЕЛЕТЬ',
  endA: 'ЗАВОД ОСТАНОВЛЕН.', endB: 'Лозунги снова пишут люди. Пока.', relocLabel: 'ОТКЛЮЧЕНО',
  cast: [['АЛЕКСАНДР ПЕЛЕВИН', 'не наш'], ['РОБОНАШИСТЫ', 'на переобучении'], ['ИНОАГЕНТ', 'один, случайно'], ['АНАСТАСИЯ МИРОНОВА', 'с мегафоном'], ['БОРИС ЯКЕМЕНКО', 'катапультировался'], ['ЖЕЛЕЗНЫЙ БОРИС', 'металлолом'], ['НЕЙРОСЕТЬ', 'написала этот текст'], ['КНИГА', 'твёрдый переплёт']]
});

// ---------- босс: ЖЕЛЕЗНЫЙ БОРИС ЯКЕМЕНКО ----------
const YAK_GREET = ['ПИСАТЕЛЬ ПЕЛЕВИН. ШПАНА.', 'Я ПРО ТЕБЯ УЖЕ ВСЁ НАПИСАЛ. ТРИЖДЫ.', 'ЖЕЛЕЗНЫЙ БОРИС К БОЮ!'];
const YAK_SHOUT = ['ШПАНА! ПЕЛЕВИН — ШПАНА!', 'ГОПОТА И ГРАФОМАНЫ!', 'ПОДЕРЖАННЫЙ КУМИР ДЕВЯНОСТЫХ!', 'ПАЦАНСКАЯ АНТРОПОЛОГИЯ!', 'ЛИМОНОВСКИЙ ПОДВАЛ!', 'БУНКЕРФЮРЕРЫ! ПАРТАЙГЕНОССЕ!', 'ВЫ ВСЕ ДОЛЖНЫ СИДЕТЬ В ТЮРЬМЕ!', 'ИКОНОСТАС ПОШЛЯКОВ!', 'ОДИНАКОВЫЕ, КАК ЗАБОР!', 'ПЕЛЕВИН ТРУСЛИВ!', 'ТУСОВКА! ОДНА ТУСОВКА!', 'ТЫ ДАЖЕ НЕ ТОТ ПЕЛЕВИН!', 'ГДЕ ТВОЙ БЛЁРБ? В «ЛИМОНКЕ»?'];
const YAK_HURT = ['ШПАНА ДЕРЁТСЯ!', 'ТОЛЬКО НЕ КЕФИР!', 'ЛИМОНОВСКАЯ ПРОВОКАЦИЯ!', 'В ТЮРЬМУ! ВСЕХ!', 'КУПОЛ! НЕ ТРОГАЙ КУПОЛ!', 'НАПИШУ ПОСТ! ДЛИННЫЙ!', 'КТО ПИСАЛ ЭТОТ КОД?!', 'ГОПОТА!!!'];
const YAK_HEAT = ['НЕ СМОТРИ! ОН ДУМАЕТ!', 'НЕЙРОСЕТЬ ПИШЕТ ПОСТ ПРО ПЕЛЕВИНА…', 'ГЕНЕРИРУЮ ОСКОРБЛЕНИЕ… 47%'];
const YAK_ROCKET = ['«ШПАНА»', '«ГОПОТА»', '«ГРАФОМАН»', '«КУМИР 90-Х»', '«ТУСОВКА»', '«В ТЮРЬМУ!»', '«ЛИМОНКА»', '«ЗА!»'];
const YAK_SCR = ['НЕЙРОСЛОП', 'ПЕЛЕВИН: ШПАНА', 'ГОПОТЫ: ВСЯ', 'ПОСТОВ О НЁМ: 412', 'КЕФИР: НЕ ПРОПУСКАТЬ', 'ТЮРЕМ: МАЛО', 'ПАТРИОТИЗМ: 98%'];
const YAK_SEQ = [null, ['walk', 'rockets', 'walk', 'punch', 'heat'], ['walk', 'rockets', 'stomp', 'punch', 'spawn', 'heat'], ['stomp', 'rockets', 'punch', 'spawn', 'stomp', 'rockets', 'heat']];
function startYak() {
  L = buildBossLevel(); L.theme = 'slop'; L.bg = bgFactory; L.song = 'robot'; L.name = 'ЦЕХ №1'; L.dark = true;
  lite.on = false; lite.a = 0; lite.manual = true; lite.card = 0; kefs = []; kefCard = 0;
  cam = 0; look = 0;
  parts = []; gibs = []; pickups = []; folders = []; floats = []; fxs = []; blurbs = []; words = []; mir = null;
  Object.assign(P, { x: 90, y: FYB, vx: 0, vy: 0, hp: P.maxhp, face: 1, inv: 0, hurtT: 0, atk: 0, onGround: true, idleT: 0, bub: null, clean: 0, crouch: false, h: 76, idleAnim: '', safeX: 90, safeY: FYB, kefir: 0 });
  boss = { kind: 'yak', title: 'ЖЕЛЕЗНЫЙ БОРИС', x: 640, y: FYB, hp: 16, max: 16, phase: 1, state: 'dim', shown: false, kef: 0, kefT: 1.2, t: 0, n: 0, seq: 0, line: 0, inv: 0, fl: 0, bub: null, dead: false, started: false,
    kneel: 0, lift: 0, stepT: 0, walking: false, fist: null, hatch: 0, heat: false, waves: [], scr: 'НЕЙРОСЛОП', scrT: 0, target: 640, ej: null, left: false,
    prize: ['ЗАВОД ОСТАНОВЛЕН', '(слоп больше не льётся)'] };
  mode = 'play'; modeT = 0; scene = 'play'; chain = 0; pendingCele = false; stopSong();
  banner = { s: 'ЦЕХ №1', sub: 'кто выключил свет?', t: 2 };
}
let kefs = [], kefCard = 0;
// геометрия: x — центр между ногами; при перегреве корпус наклоняется вперёд и опускается
function yakGeo(b) {
  const drop = Math.round(b.kneel * 70), F = FYB - Math.round(b.lift);
  const hipY = F - 96 + drop, ux = Math.round(b.x - 30 * b.kneel), tY = hipY - 120;
  const dx = ux - Math.round(34 * b.kneel), dY = tY - 84;
  return { F, hipY, ux, tY, dx, dY, dome: [dx - 44, dY, dx + 44, dY + 72] };
}
function yakNext() {
  const b = boss, s = YAK_SEQ[b.phase]; b.state = s[b.seq % s.length]; b.seq++; b.t = 0; b.n = 0;
  if (b.state === 'walk') { b.target = clamp(P.x + 300 + rnd(-30, 60), 470, 680); if (Math.abs(b.target - b.x) < 30) b.target = b.x > 575 ? 480 : 670; }
  if (b.state === 'punch') b.hi = Math.random() < .5;
  if (b.state === 'heat') { say(b, pick(YAK_HEAT), 2); }
  else if (!b.bub && Math.random() < .55) say(b, pick(YAK_SHOUT), 1.5);
}
function yakBegin() { const b = boss; if (b.started) return; b.started = true; banner = null; yakNext(); kefCard = 3.4; }
function yakOpen() { const b = boss; return b && !b.dead && b.state === 'heat' && b.kneel > .8; }
function yakMelee(x0, x1, y0, y1) {
  const b = boss; if (!b || b.dead || !b.shown || P.atkSet.has(b)) return;
  const d = yakGeo(b).dome;
  if (x1 > d[0] && x0 < d[2] && y1 > d[1] && y0 < d[3]) {
    P.atkSet.add(b);
    if (yakOpen()) damageYak('book');
    else { sfx.stamp(); floater('КЛАНГ!', P.x + P.face * 50, P.y - 100, { color: '#cfd8e6', size: 10, t: .6 }); }
    return;
  }
  if (b.fist && !P.atkSet.has(b.fist) && Math.abs(b.fist.x - (x0 + x1) / 2) < 60 && b.fist.y > y0 && b.fist.y < y1) { P.atkSet.add(b.fist); sfx.stamp(); floater('КЛАНГ!', b.fist.x, b.fist.y - 30, { color: '#cfd8e6', size: 10, t: .6 }); P.vx = -P.face * 160; }
  // по корпусу книгой бесполезно
  const gx = yakGeo(b);
  if (x1 > b.x - 120 && P.y > gx.tY && !P.atkSet.has('body')) { P.atkSet.add('body'); sfx.stamp(); floater(pick(['КЛАНГ!', 'БРОНЯ!', 'БЕЙ В КУПОЛ!']), x1, P.y - 70, { color: '#cfd8e6', size: 9, t: .6 }); }
}
// ракеты, отбитые книгой, сами летят в купол
function yakPapers(dt) {
  const b = boss; if (!b || b.dead) return;
  const d = yakGeo(b).dome, cx = (d[0] + d[2]) / 2, cy = (d[1] + d[3]) / 2;
  for (let i = blurbs.length - 1; i >= 0; i--) {
    const r = blurbs[i]; if (!r.back || r.from !== b) continue;
    const dx = cx - r.x, dy = cy - r.y, dd = Math.hypot(dx, dy) || 1; r.vx = dx / dd * 540; r.vy = dy / dd * 540; r.g = 0;
    if (r.x > d[0] && r.x < d[2] && r.y > d[1] && r.y < d[3]) { blurbs.splice(i, 1); damageYak('rocket'); }
  }
}
function damageYak(by) {
  const b = boss; if (b.dead || b.inv > 0 || mode !== 'play') return;
  if (!b.started) yakBegin();
  b.hp--; b.inv = .35; b.fl = .3; hitstop = .07; shake = Math.max(shake, 9); sfx.bonk(); sfx.zap();
  const d = yakGeo(b).dome; burst((d[0] + d[2]) / 2, d[1] + 30, 14, ['#9fdcff', '#fff', '#ffe36b'], 220, .5);
  floater(by === 'kefir' ? pick(['КЕФИРОМ ПО КУПОЛУ!', 'КИСЛОМОЛОЧНАЯ МЕСТЬ', 'ОНО ТОГО СТОИЛО?']) : by === 'rocket' ? pick(['ВОЗВРАТ ЛОЗУНГА', 'САМ СЕБЕ ПРОМПТ', 'ОБРАТНАЯ СВЯЗЬ']) : pick(['ПО КУПОЛУ!', 'ОТКАЗ!', 'НЕ НАШ!']), (d[0] + d[2]) / 2, d[1] - 20, { color: '#ffe36b', size: 10, t: .9, vy: -40 });
  if (b.hp <= 0) { yakDeath(); return; }
  const np = b.hp <= 5 ? 3 : b.hp <= 10 ? 2 : 1;
  if (np !== b.phase) { b.phase = np; b.seq = 0; if (np === 3) pickups.push({ k: 'heart', x: clamp(P.x + rnd(-80, 80), 60, 380), y: 40, vx: 0, vy: 0, t: 0 }); }
  if (!b.bub || Math.random() < .5) say(b, pick(YAK_HURT), 1.3);
  if (by !== 'kefir' && !P.bub && Math.random() < .45) say(P, pick(['Я ТОТ САМЫЙ.', 'НАЦБОЛЫ ПЕРЕДАЮТ ПРИВЕТ', 'КЕФИРУ НЕ ХОЧЕШЬ?', 'КЕФИР ПОЛЕЗЕН ДЛЯ КОГНИТИВНЫХ', 'ОНО ТОГО СТОИЛО, БОРИС?', 'ЧИТАЙ ДО КОНЦА, БОРИС', 'КТО ТУТ ШПАНА, БОРИС?']), 1.2);
}
function yakThrowKefir() {
  const b = boss, d = yakGeo(b).dome, cx = (d[0] + d[2]) / 2, cy = (d[1] + d[3]) / 2, x = P.x + 10, y = P.y - 70;
  const T = clamp((cx - x) / 430, .45, .95), g = 900;
  kefs.push({ x, y, vx: (cx - x) / T, vy: (cy - y - .5 * g * T * T) / T, rot: 0 });
  P.kefir--; P.face = 1; sfx.swing(); say(P, pick(['ЛОВИ КЕФИР!', 'ДЛЯ КОГНИТИВНЫХ!', 'ОНО ТОГО СТОИЛО?', 'КИСЛОМОЛОЧНОЕ!']), 1);
}
function kefSplash(x, y, n) { burst(x, y, n, ['#ffffff', '#f0f4f8', '#dfe8ef'], 220, .7, 500); sfx.paper(); tn('sine', 300, 120, .12, .2); }
function updateKefs(dt) {
  const b = boss;
  for (let i = kefs.length - 1; i >= 0; i--) {
    const k = kefs[i]; k.vy += 900 * dt; k.x += k.vx * dt; k.y += k.vy * dt; k.rot += dt * 14;
    if (!b.dead && b.shown) {
      const gx = yakGeo(b), d = gx.dome;
      if (k.x > d[0] - 20 && k.x < d[2] + 20 && k.y > d[1] - 20 && k.y < d[3] + 16) {
        kefs.splice(i, 1); kefSplash(k.x, k.y, 30); b.kef = 3.2;
        if (b.inv > 0) b.inv = 0;
        damageYak('kefir'); say(b, pick(['ТОЛЬКО НЕ КЕФИР!!!', 'ОПЯТЬ КЕФИР?!', 'Я НИЧЕГО НЕ ВИЖУ!', 'ЭТО НАЦБОЛЬСКИЙ КЕФИР!']), 1.4);
        continue;
      }
      if (k.x > gx.ux - 84 && k.y > gx.tY + 20) { kefs.splice(i, 1); kefSplash(k.x, k.y, 14); floater('МИМО КУПОЛА', k.x, k.y - 20, { color: '#fff', size: 8, t: .8 }); continue; }
    }
    if (k.y > FYB) { kefs.splice(i, 1); kefSplash(k.x, FYB - 2, 12); }
  }
}
function yakRocket() {
  const b = boss, gx = yakGeo(b), x = gx.ux - 104, y = gx.tY - 18, tx = P.x, ty = P.y - 52;
  const dx = tx - x + (b.kef > 0 ? rnd(-140, 140) : 0), dy = ty - y + (b.kef > 0 ? rnd(-60, 30) : 0), dd = Math.hypot(dx, dy) || 1, sp = [230, 255, 280][b.phase - 1];
  blurbs.push({ x, y, vx: dx / dd * sp, vy: dy / dd * sp, g: 0, q: pick(YAK_ROCKET), from: b, back: false, t: 0, rot: 0, paper: true, spr: 'slopb', kind: 'rocket', hitTxt: 'НЕЙРОЛОЗУНГ В ЛОБ' });
  sfx.whoosh(); burst(x, y, 6, ['#ff9a3a', '#ffe36b'], 90, .3, 0);
}
function updateYak(dt) {
  const b = boss; if (!b || b.dead) return;
  b.t += dt; b.inv = Math.max(0, b.inv - dt); b.fl = Math.max(0, b.fl - dt);
  if (b.bub) { b.bub.t -= dt; if (b.bub.t <= 0) b.bub = null; }
  b.scrT -= dt; if (b.scrT <= 0) { b.scrT = 1.2; b.scr = pick(YAK_SCR); }
  const ph = b.phase;
  if (b.state !== 'heat') b.kneel = Math.max(0, b.kneel - dt * 2);
  if (b.state !== 'spawn') b.hatch = Math.max(0, b.hatch - dt * 3);
  b.walking = false; b.heat = false;
  switch (b.state) {
    case 'dim':
      // свет медленно гаснет
      lite.a = Math.min(.94, b.t / 2.6 * .94);
      if (b.t > .3 && b.n === 0) { b.n = 1; tn('sawtooth', 55, 40, 2.6, .12); tn('sawtooth', 58, 41, 2.6, .08); }
      if ((b.t * 3 | 0) !== ((b.t - dt) * 3 | 0) && b.t < 2.4) sfx.flick();
      if (b.t > 2.9) { b.state = 'drop'; b.t = 0; b.shown = true; b.lift = 460; sfx.whoosh(); }
      break;
    case 'drop':
      b.lift = Math.max(0, 460 - b.t * b.t * 1800);
      if (b.lift === 0 && b.n < 2) { b.n = 2; shake = 18; sfx.boom(); sfx.thud(); burst(b.x, FYB - 4, 30, ['#cfd8e6', '#8a92a8'], 260, .6); playSong('robot'); }
      if (b.t > 1.1) { b.state = 'greet'; b.t = 0; }
      break;
    case 'greet':
      if (b.t > .25 && !b.bub) { if (b.line >= YAK_GREET.length) { b.state = 'lightsup'; b.t = 0; sfx.on(); break; } say(b, YAK_GREET[b.line++], 1.5); b.t = 0; sfx.blip2(); }
      break;
    case 'lightsup':
      lite.a = Math.max(0, .94 - b.t * 2.2);
      if (b.t < .05) flash = Math.max(flash, .35);
      if (b.t > .5) { lite.a = 0; yakBegin(); }
      break;
    case 'walk': {
      const d = sign(b.target - b.x), was = Math.sin(b.stepT * 6);
      b.walking = true; b.stepT += dt; b.x += d * 85 * dt;
      if ((was > 0) !== (Math.sin(b.stepT * 6) > 0)) { sfx.thud(); shake = Math.max(shake, 4); }
      if ((b.target - b.x) * d <= 0 || b.t > 2.4) { b.x = clamp(b.x, 470, 680); yakNext(); }
      break;
    }
    case 'rockets': {
      const cnt = [2, 3, 4][ph - 1], gap = [.75, .6, .5][ph - 1];
      if (b.n < cnt && b.t > gap * (b.n + 1)) { b.n++; yakRocket(); }
      if (b.t > gap * cnt + .9) yakNext();
      break;
    }
    case 'punch': {
      const gx = yakGeo(b);
      if (b.t < .6) { if ((b.t * 20 | 0) % 2) shake = Math.max(shake, 1.5); }
      else if (!b.fist && b.n === 0) { b.n = 1; b.fist = { x: gx.ux - 112, y: FYB - (b.hi ? 66 : 16), vx: -[520, 570, 620][ph - 1], st: 'out', home: gx.ux - 112 }; sfx.whoosh(); sfx.boom(); }
      const f = b.fist;
      if (f) {
        if (f.st === 'out') { f.x += f.vx * dt; if (f.x < 26) { f.st = 'back'; sfx.stamp(); shake = Math.max(shake, 4); } }
        else { f.x += 420 * dt; if (f.x >= f.home) { b.fist = null; yakNext(); } }
        if (b.fist && mode === 'play' && P.inv <= 0 && Math.abs(f.x - P.x) < 26 && f.y + 14 > P.y - P.h && f.y - 14 < P.y) { floater('ЖЕЛЕЗНЫЙ АРГУМЕНТ', P.x, P.y - 110, { color: '#cfd8e6', size: 8, t: 1.5 }); hurtPlayer(-1, false, 'fist'); }
      }
      break;
    }
    case 'stomp':
      if (b.t < .3) b.kneel = Math.min(.35, b.kneel + dt * 2);
      else if (b.t < .8) b.lift = Math.sin((b.t - .3) / .5 * Math.PI) * 80;
      else if (b.n === 0) {
        b.n = 1; b.lift = 0; shake = 14; sfx.thud(); sfx.boom();
        const gx = yakGeo(b); b.waves.push({ x: gx.ux - 70, d: -1 }); burst(gx.ux, FYB - 4, 24, ['#cfd8e6', '#8a92a8'], 220, .5);
        if (ph === 3) setTimeout(() => { if (boss && !boss.dead && mode === 'play') boss.waves.push({ x: yakGeo(boss).ux - 70, d: -1 }); }, 650);
      }
      if (b.t > 1.6) yakNext();
      break;
    case 'spawn':
      b.hatch = Math.min(1, b.hatch + dt * 3);
      if (b.t > .5 && b.n === 0) {
        b.n = 1;
        if (L.agents.filter(a => !a.dead).length < 2) {
          const gx = yakGeo(b), a = mkAgent(gx.ux, gx.tY + 100, 'give', pick(['ГОПОТА! ДЕРЖИ БЛЁРБ!', 'БОРИС ВЕЛЕЛ: В ТЮРЬМУ!', 'ШПАНА ОБНАРУЖЕНА!', 'ПОСТ О ВАС ГОТОВ!']), { robo: rint(1, 2) });
          a.vy = -200; a.vx = -120; a.onGround = false; a.said = true; say(a, a.line, 1.8); L.agents.push(a); sfx.squeak();
        }
      }
      if (b.t > 1.1) yakNext();
      break;
    case 'heat': {
      const dur = [3, 2.6, 2.2][ph - 1];
      b.heat = true;
      if (b.t < dur + .5) b.kneel = Math.min(1, b.kneel + dt * 2.5);
      if (Math.random() < .5) { const gx = yakGeo(b); parts.push({ k: 'p', x: gx.ux + rnd(-70, 70), y: gx.tY + rnd(0, 40), vx: rnd(-20, 20), vy: -rnd(40, 90), s: 3, c: '#e8e8f0', life: .8, g: -40 }); }
      if (b.t > dur + .5) yakNext();
      break;
    }
  }
  // кефир: падает сверху, подобрать, кинуть вниз + удар (или C)
  b.kef = Math.max(0, b.kef - dt); kefCard = Math.max(0, kefCard - dt);
  if (b.started) {
    b.kefT -= dt;
    if (b.kefT <= 0) { b.kefT = 7; if ((P.kefir || 0) < 3 && !pickups.some(q => q.k === 'kefir')) { const x = rnd(60, Math.max(80, yakGeo(b).ux - 160)); pickups.push({ k: 'kefir', x, y: -20, vx: 0, vy: 0, t: 0 }); floater('КЕФИР!', x, 70, { color: '#fff', size: 9, t: 1.2 }); } }
    if (mode === 'play' && P.kefir > 0 && P.hurtT <= 0 && (hit('C') || (down('D') && hit('A')))) yakThrowKefir();
  }
  updateKefs(dt);
  // ударные волны по полу: перепрыгнуть
  for (let i = b.waves.length - 1; i >= 0; i--) {
    const w = b.waves[i]; w.x += w.d * 330 * dt;
    if (Math.random() < .6) parts.push({ k: 'p', x: w.x, y: FYB - 2, vx: rnd(-30, 30), vy: -rnd(40, 120), s: 2, c: '#cfd8e6', life: .4, g: 500 });
    if (mode === 'play' && P.inv <= 0 && Math.abs(w.x - P.x) < 16 && P.y > FYB - 18) { floater('УДАРНАЯ ВОЛНА', P.x, P.y - 110, { color: '#cfd8e6', size: 8, t: 1.4 }); hurtPlayer(w.d, false, 'wave'); }
    if (w.x < -30 || w.x > W + 30) b.waves.splice(i, 1);
  }
  // робот непроходим
  const front = yakGeo(b).ux - 112;
  if (b.shown && P.x > front) { P.x = front; if (P.vx > 0) P.vx = 0; }
}
function yakDeath() {
  const b = boss; mode = 'bossdeath'; modeT = 0; b.state = 'dying'; b.bub = null; stopSong();
  blurbs = []; b.waves = []; b.fist = null; P.atk = 0; b.heat = false; kefs = []; lite.a = 0; lite.manual = false;
  for (const a of L.agents) if (!a.dead && a.ko <= 0) hitAgent(a, 1);
  sfx.boom(); b.left = false; b.won = 0;
}
function updateYakDeath(dt) {
  const b = boss; P.vx *= .9; P.vy = Math.min(900, P.vy + GRAV * dt); collide(P, dt);
  updateAgents(dt);
  if (!b.dead) {
    b.kneel = Math.min(1, b.kneel + dt); shake = Math.max(shake, 3 + modeT * 2);
    if ((modeT * 7 | 0) !== ((modeT - dt) * 7 | 0)) { const gx = yakGeo(b); burst(gx.ux + rnd(-80, 80), gx.tY + rnd(-60, 120), 16, ['#ffe36b', '#ff9a3a', '#ff5b6b', '#fff'], 260, .5, 200); tn('sawtooth', 120, 40, .2, .15); }
    if (modeT > 2.6) {
      b.dead = true; flash = .8; shake = 18; sfx.boom();
      for (let i = 0; i < 14; i++) gibs.push({ k: 'bolt', x: b.x + rnd(-60, 60), y: FYB - rnd(60, 200), vx: rnd(-260, 260), vy: -rnd(200, 520), rot: rnd(6), vr: rnd(-14, 14), sc: 1.6, rest: false, life: 9 });
      const gx = yakGeo(b); b.ej = { x: gx.dx, y: gx.dY + 60, vx: 140, vy: -620, land: false, t: 0 };
      memorial.push(['Железный Борис', 'сдан в металлолом']); memorial.push(['Борис Якеменко', 'катапультировался. ищет новый промпт']);
    }
  } else if (b.ej && !b.ej.land) {
    const e = b.ej; e.vy += 1300 * dt; e.x += e.vx * dt; e.y += e.vy * dt;
    if (e.y >= FYB && e.vy > 0) { e.y = FYB; e.land = true; sfx.thud(); shake = 6; say(b, 'ЭТО НЕ Я! ЭТО НЕЙРОСЕТЬ!', 2.4); }
  } else if (!b.left) {
    const e = b.ej; e.t += dt;
    if (e.t > 2.2) { e.x += 140 * dt; if (!b.bub && e.x < W) say(b, 'ПОЙДУ НАПИШУ ПРО ТЕБЯ ПОСТ…', 2); if (e.x > W + 60) b.left = true; }
  } else if (!b.won) { b.won = .001; P.clean = 1; playSong('win'); burst(P.x, P.y - 80, 20, ['#fff', '#ffe36b'], 200, .7); }
  else { b.won += dt; if (b.won > 3.4 && mode === 'bossdeath') { cele.n = 99; startCelebrate(); cele.title = 'ПЕЛЕВИН'; cele.kind = 'dance'; L.after = true; } }
  if (b.bub) { b.bub.t -= dt; if (b.bub.t <= 0) b.bub = null; }
}
// робот рисуется прямо кодом каждый кадр
function drawRobot(b, face) {
  const gx = yakGeo(b), { F, hipY, ux, tY, dx, dY } = gx, x = Math.round(b.x);
  const ST = '#8a92a8', STd = '#5a6278', STl = '#c8d0e0', RED = '#b8202a', REDd = '#801820';
  const sh = b.fl > 0 ? rint(-3, 3) : 0;
  g.save(); g.translate(sh, 0);
  g.globalAlpha = .3; R(x - 100, FYB - 3, 200, 6, '#000'); g.globalAlpha = 1;
  // ноги
  [[x + 34, Math.PI], [x - 34, 0]].forEach(([lx, ph]) => {
    const up = b.walking ? Math.max(0, Math.sin(b.stepT * 6 + ph)) * 16 : 0, fy = F - up;
    R(lx - 19, hipY - 4, 38, fy - 14 - hipY + 4, OUTC); R(lx - 17, hipY - 2, 34, fy - 16 - hipY + 2, ST); R(lx - 17, hipY - 2, 6, fy - 16 - hipY + 2, STl);
    const kneeY = Math.round((hipY + fy) / 2) - 8; R(lx - 21, kneeY, 42, 16, OUTC); R(lx - 19, kneeY + 2, 38, 12, STd); R(lx - 6, kneeY + 5, 12, 6, '#e9b616');
    R(lx - 30, fy - 18, 60, 18, OUTC); R(lx - 28, fy - 16, 56, 14, '#3a3e4a'); R(lx - 28, fy - 16, 56, 3, STd);
  });
  // задняя рука
  R(ux + 80, tY + 26, 32, 56, OUTC); R(ux + 82, tY + 28, 28, 52, STd); R(ux + 76, tY + 80, 42, 36, OUTC); R(ux + 78, tY + 82, 38, 32, ST);
  // корпус
  R(ux - 84, tY - 2, 168, 124, OUTC); R(ux - 82, tY, 164, 120, RED); R(ux - 82, tY, 164, 6, '#e04050'); R(ux - 82, tY + 110, 164, 10, REDd);
  for (const bx of [-74, 66]) for (const by of [10, 100]) R(ux + bx, tY + by, 6, 6, STl);
  R(ux - 54, tY + 14, 108, 50, OUTC); R(ux - 50, tY + 18, 100, 42, b.heat ? '#3a0a0a' : '#06180e');
  for (let i = 0; i < 6; i++) R(ux - 48, tY + 21 + i * 7, 96, 1, 'rgba(0,0,0,.4)');
  R(ux - 28, tY + 70, 56, 36, OUTC);
  if (b.hatch > .05) { R(ux - 26, tY + 72, 52, 32, '#0a0a0e'); R(ux - 26, tY + 72, 52, Math.round(32 * (1 - b.hatch)), STd); }
  else { R(ux - 26, tY + 72, 52, 32, STd); g.fillStyle = pats.hz; g.fillRect(ux - 26, tY + 96, 52, 6); }
  // плечи и ракетница
  for (const sx of [-1, 1]) { R(ux + sx * 92 - 18, tY - 8, 36, 42, OUTC); R(ux + sx * 92 - 16, tY - 6, 32, 38, ST); R(ux + sx * 92 - 16, tY - 6, 32, 6, STl); }
  R(ux - 126, tY - 34, 48, 28, OUTC); R(ux - 124, tY - 32, 44, 24, STd); for (let i = 0; i < 3; i++) R(ux - 128, tY - 29 + i * 7, 8, 5, b.state === 'rockets' && (gameT * 10 | 0) % 2 ? '#ff9a3a' : OUTC);
  // передняя рука с кулаком
  R(ux - 116, tY + 26, 32, 56, OUTC); R(ux - 114, tY + 28, 28, 52, ST);
  const wind = b.state === 'punch' && b.t < .6;
  if (!b.fist) { R(ux - 128, tY + 78, 46, 40, OUTC); R(ux - 126, tY + 80, 42, 36, wind && (gameT * 16 | 0) % 2 ? '#ffe36b' : STl); for (let i = 0; i < 3; i++) R(ux - 126, tY + 86 + i * 9, 10, 2, STd); }
  else { R(ux - 120, tY + 82, 22, 14, '#ff9a3a'); R(ux - 116, tY + 85, 12, 8, '#ffe36b'); }
  // шея и купол с Борисом
  R(ux - 16, tY - 14, 32, 16, OUTC); R(ux - 14, tY - 12, 28, 14, STd);
  R(dx - 46, dY - 2, 92, 76, OUTC); R(dx - 44, dY, 88, 72, '#14202c');
  spr('yf_' + face, dx + 2, dY + 70, true, { sx: 1.6 });
  g.globalAlpha = .22; R(dx - 44, dY, 88, 72, '#9fdcff'); g.globalAlpha = .45; R(dx - 38, dY + 6, 8, 34, '#fff'); R(dx - 28, dY + 6, 4, 18, '#fff'); g.globalAlpha = 1;
  R(dx - 48, dY + 66, 96, 10, OUTC); R(dx - 46, dY + 68, 92, 6, ST);
  R(dx - 2, dY - 26, 4, 24, OUTC); R(dx - 5, dY - 33, 10, 10, (gameT * 3 | 0) % 2 ? '#ff3040' : '#601018');
  if (b.fl > .15) { g.globalAlpha = .5; R(dx - 44, dY, 88, 72, '#fff'); g.globalAlpha = 1; }
  if (b.kef > 0) { g.globalAlpha = Math.min(1, b.kef); R(dx - 40, dY + 4, 60, 22, '#f4f8fb'); for (let i = 0; i < 6; i++) R(dx - 38 + i * 10, dY + 24, 6, 8 + ((i * 7) % 5) * 6 + (3.2 - b.kef) * 6, '#eef3f7'); g.globalAlpha = 1; }
  g.restore();
  return gx;
}
function drawYak() {
  const b = boss;
  for (const w of b.waves) { R(w.x - 12, FYB - 16, 24, 16, OUTC); R(w.x - 10, FYB - 14, 20, 14, '#cfd8e6'); R(w.x - 6, FYB - 20, 12, 6, '#ffe36b'); }
  if (b.fist) { const f = b.fist; R(f.x - 24, f.y - 18, 48, 36, OUTC); R(f.x - 22, f.y - 16, 44, 32, '#c8d0e0'); for (let i = 0; i < 3; i++) R(f.x - 22, f.y - 10 + i * 9, 10, 2, '#5a6278'); if (f.st === 'out') { R(f.x + 24, f.y - 8, 18, 16, '#ff9a3a'); R(f.x + 24, f.y - 4, 30, 8, '#ffe36b'); } }
  for (const k of kefs) { g.save(); g.translate(Math.round(k.x), Math.round(k.y)); g.rotate(k.rot); g.drawImage(atlas, F.kefir[0], F.kefir[1], F.kefir[2], F.kefir[3], -F.kefir[2] / 2, -F.kefir[3] / 2, F.kefir[2], F.kefir[3]); g.restore(); }
  if (!b.shown) return;
  if (lite.a > .05) {
    // прожектор сверху на робота
    g.globalAlpha = .16 * lite.a; g.fillStyle = '#fff6c8'; g.beginPath(); g.moveTo(b.x - 30, 0); g.lineTo(b.x + 30, 0); g.lineTo(b.x + 150, FYB); g.lineTo(b.x - 150, FYB); g.fill(); g.globalAlpha = 1;
  }
  if (!b.dead) {
    const face = b.state === 'dying' || b.fl > 0 ? 'hurt' : b.bub ? 'shout' : 'idle';
    const gx = drawRobot(b, face);
    T(b.state === 'dying' ? 'ОШИБКА ОШИБКА' : b.heat ? 'ПЕРЕГРЕВ…' : b.scr, gx.ux - camR, gx.tY + 39, { size: 7, color: b.heat || b.state === 'dying' ? '#ff5b6b' : '#39ff8a' });
    if (b.heat && b.kneel > .8 && (gameT * 3 | 0) % 2) T('БЕЙ В КУПОЛ!', gx.dx, gx.dY - 44, { size: 9, color: '#ffe36b', stroke: OUTC });
    if (b.bub) bubble(b.bub.s, gx.dx, gx.dY - 34, { prio: 5, size: 10, max: 18, shake: b.fl > 0 ? 2 : 0, color: b.fl > 0 ? '#a3111f' : '#16161d' });
    if (b.state === 'dying') { const s = 'КТО ПИСАЛ ЭТОТ ПРОМПТ?!', n = Math.min(s.length, (modeT * 12 | 0)); T(s.slice(0, n), W / 2 + rnd(-2, 2), 90 + rnd(-2, 2), { size: 18 + modeT * 2, color: '#fff', stroke: '#801820', sw: 6 }); }
  } else {
    // обломки
    const x = Math.round(b.x);
    R(x - 110, FYB - 40, 220, 40, OUTC); R(x - 106, FYB - 36, 90, 34, '#8a92a8'); R(x - 10, FYB - 30, 70, 28, '#b8202a'); R(x + 64, FYB - 26, 40, 24, '#5a6278'); R(x - 60, FYB - 58, 50, 22, '#801820');
    if (Math.random() < .3) parts.push({ k: 'p', x: x + rnd(-80, 80), y: FYB - 40, vx: rnd(-10, 10), vy: -rnd(30, 60), s: 4, c: '#3a3a44', life: 1.2, g: -20 });
    if (b.ej && (!b.left)) {
      const e = b.ej, walk = e.land && e.t > 2.2;
      spr(!e.land ? 'y_ko' : walk ? ((gameT * 7 | 0) % 2 ? 'y_w0' : 'y_w1') : 'y_shout', e.x, e.y - (walk ? Math.abs(Math.sin(gameT * 14)) * 3 : 0), !walk, { rot: e.land ? 0 : modeT * 8 });
      if (b.bub && e.land) bubble(b.bub.s, e.x, e.y - 132, { prio: 5, size: 10, max: 18 });
    }
  }
}
function drawYakHud() {
  const b = boss;
  if (b.started && !b.dead) { for (let i = 0; i < (P.kefir || 0); i++) spr('kefir', 222 + i * 16, 36, false); if (P.kefir) T('КЕФИР', 222 + P.kefir * 16 + 4, 26, { size: 7, align: 'left', color: '#fff', stroke: OUTC }); }
  if (kefCard > 0) OV.push(c => { c.globalAlpha = Math.min(1, kefCard * 2, (3.4 - kefCard) * 4); c.fillStyle = OUTC; c.fillRect(W / 2 - 190, 52, 380, 50); c.fillStyle = '#2a3a4a'; c.fillRect(W / 2 - 186, 56, 372, 42); c.font = '12px PS2P,monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText('КИДАЙ КЕФИР В КУПОЛ', W / 2, 70); c.font = '7px PS2P,monospace'; c.fillStyle = '#bff7ee'; c.fillText(TOUCH ? 'подбери бутылку, потом ВНИЗ + КНИГА' : 'подбери бутылку, потом C (или ВНИЗ + X)', W / 2, 88); c.globalAlpha = 1; });
  if (!b.started || b.dead) return;
  T('ЖЕЛЕЗНЫЙ БОРИС ЯКЕМЕНКО', W / 2, 16, { size: 9, color: '#ff8a94', stroke: OUTC });
  OV.push(c => { c.fillStyle = OUTC; c.fillRect(W / 2 - 152, 26, 304, 12); const sw = 300 / b.max; for (let i = 0; i < b.max; i++) { c.fillStyle = i < b.hp ? (b.phase === 3 ? '#ff5b6b' : b.phase === 2 ? '#ffb35b' : '#cfd8e6') : '#2a3350'; c.fillRect(W / 2 - 150 + i * sw, 28, sw - 2, 8); } });
}
// кат-сцена: Пелевин, Борис, и потом сверху падает робот
const YI = { len: 11 };
function yakIntroTick(dt) {
  const t = sceneT, at = k => t >= k && t - dt < k;
  if (at(.9) || at(4.8)) sfx.blip2();
  if (at(2.9)) sfx.shout();
  if (at(7.7)) sfx.stamp();
  if (t > 7.8 && t < 9.6 && ((t - 7.8) * 12 | 0) !== ((t - dt - 7.8) * 12 | 0)) sfx.blip();
}
function drawYakIntro() {
  const t = sceneT;
  g.drawImage(bgFactory, 0, 0); g.fillStyle = 'rgba(6,4,14,.35)'; g.fillRect(0, 0, W, H);
  spr('p_idle', 200, FYB, false);
  // Борис
  if (t < 6.4) {
    const bx = t < .8 ? W + 40 - (W + 40 - 560) * (t / .8) : 560;
    const nm = t < .8 ? ((t * 8 | 0) % 2 ? 'y_w0' : 'y_w1') : t > 4.8 ? 'y_point' : 'y_stand';
    spr(nm, bx, FYB - (t < .8 ? Math.abs(Math.sin(t * 14)) * 3 : 0), true);
  } else if (t < 8) { const bx = 560 + (t - 6.4) * 260; spr((t * 8 | 0) % 2 ? 'y_w0' : 'y_w1', bx, FYB - Math.abs(Math.sin(t * 14)) * 3, false); }
  if (t > .9 && t < 2.7) bubble('ПЕЛЕВИН? ШПАНА НА МОЁМ ЗАВОДЕ?', 560, FYB - 130, { prio: 5, size: 10, max: 18 });
  if (t > 2.9 && t < 4.6) bubble('БОРИС, ИДИ НАХУЙ.', 200, FYB - 96, { prio: 5, size: 12, max: 20, bg: '#e9f1ff', color: '#1b2a6b' });
  if (t > 4.8 && t < 6.4) bubble('ЭТО Я ТЕБЕ СЕЙЧАС ПОКАЖУ.', 560, FYB - 130, { prio: 5, size: 10, max: 18 });
  if (t > 7.8) {
    const nm = 'БОРИС ЯКЕМЕНКО', n = clamp(((t - 7.8) * 12 | 0), 0, nm.length);
    T(nm.slice(0, n), W / 2, 70, { size: 20, color: '#fff', stroke: '#801820', sw: 7 });
  }
  if (t > 9.8) T('ушёл готовить сюрприз', W / 2, 104, { size: 8, color: '#ffe36b', stroke: OUTC });
}
BK.yak = { start: startYak, update: updateYak, death: updateYakDeath, hud: drawYakHud, melee: yakMelee, papers: yakPapers, intro: drawYakIntro, introTick: yakIntroTick, introLen: YI.len };

// ---------- звук ----------
SONGS.slop = {
  bpm: 160, loop: true, tr: [
    { w: 'square', v: .065, s: seq('E5:2 G5:2 B5:2 G5:2 E5:2 G5:2 B5:2 D6:2 C6:2 A5:2 E5:2 A5:2 C6:4 B5:4 D5:2 F#5:2 A5:2 F#5:2 D5:2 F#5:2 A5:2 C6:2 B5:2 G5:2 E5:2 G5:2 B5:4 -:4') },
    { w: 'sawtooth', v: .06, s: seq(['E2', 'C2', 'D2', 'B1'].map(r => (r + ':1 -:1 ' + r + ':1 ' + r + ':1 ').repeat(4)).join(' ')) }
  ], dr: 'k.h.s.h.k.k.s.h.'
};

// тема Железного Бориса: быстро, минор, бас ходит хроматически восьмыми, сверху быстрые арпеджио
SONGS.robot = (() => {
  const lead = ['C5:2 C5:1 D#5:1 G5:2 C6:2 A#5:2 G5:2 F5:2 D#5:2', 'D5:3 D#5:1 F5:2 D5:2 A#4:4 B4:4', 'C5:2 C5:1 D#5:1 G5:2 C6:2 D6:2 D#6:2 D6:2 C6:2', 'B5:4 G5:2 D5:2 G5:2 A5:2 B5:4',
    'G#5:3 G5:1 F5:2 D#5:2 F5:3 G5:1 G#5:4', 'G5:3 F5:1 D#5:2 D5:2 D#5:2 F5:2 G5:4', 'G#5:2 A#5:2 C6:2 G#5:2 A#5:2 C6:2 D6:2 A#5:2', 'C6:1 B5:1 C6:1 D6:1 D#6:4 D6:2 C6:2 B5:4'].join(' ');
  // эхо: та же мелодия на шестнадцатую позже и тише — приём из NES-игр
  const echo = seq('-:1 ' + lead); echo[echo.length - 1][1] -= 1;
  return {
    bpm: 112, loop: true, tr: [
      { w: 'p25', v: .1, s: seq(lead) },
      { w: 'p12', v: .035, s: echo },
      { w: 'p12', v: .03, s: seq(['C5 D#5 G5 D#5', 'A#4 D5 F5 D5', 'C5 D#5 G5 D#5', 'G4 B4 D5 B4', 'G#4 C5 D#5 C5', 'G4 A#4 D#5 A#4', 'G#4 C5 D#5 C5', 'G4 B4 D5 F5']
        .map(c => (c.split(' ').map(n => n + ':1').join(' ') + ' ').repeat(4)).join(' ')) },
      { w: 'triangle', v: .28, s: seq(['C2 C3 C2 C3 D#2 D#3 C2 C3', 'B1 B2 B1 B2 C#2 C#3 D2 D3', 'C2 C3 C2 C3 D#2 D#3 F2 F3', 'G1 G2 G1 G2 F#1 F#2 G1 G2',
        'G#1 G#2 G#1 G#2 G1 G2 G1 G2', 'F1 F2 F1 F2 F#1 F#2 G1 G2', 'G#1 G#2 G#1 G#2 A#1 A#2 B1 B2', 'C2 C3 C2 C3 C2 C3 B1 B2'].join(' ').split(' ').map(n => n + ':2').join(' ')) }
    ], dr: 'k.hhs.hkk.hhs.hh'
  };
})();

// ---------- графика ----------
const YAK_LOOK = { skin: '#eab894', hair: '#9a9aa2', style: 'bald', beard: '#b4b0ac', mus: '#5a5048', coat: '#1e1e24', shirt: '#1a2238', pants: '#22222a', shoes: '#111116', brow: true, wide: true };
const ROBO_LOOK = [
  { robo: true, skin: '#a8b0c0', led: '#ff3040', coat: '#c8202a', shirt: '#f4f4f8', pants: '#4a5060', shoes: '#2a2e38' },
  { robo: true, skin: '#b8bcc8', led: '#39e0d0', coat: '#e8e8ee', scarf: '#c8202a', pants: '#4a5060', shoes: '#2a2e38' }
];
function dollItem(name, look, pose, U) {
  const w = DFW * U, h = DFH * U, [c, x] = mkCanvas(w, h);
  drawDoll(x, U, look, pose); outline(x, w, h);
  return { name, c, w, h, ax: 15 * U, ay: DFH * U };
}
function slopSprites() {
  const out = [];
  ROBO_LOOK.forEach((lk, v) => {
    const a = (n, p) => out.push(dollItem('r' + v + '_' + n, lk, p, 2));
    a('idle', { armF: [.5, 5, 1.2, 4], prop: 'blurb', armB: [-.2, 5, .3, 5] });
    a('give', { armF: [1.4, 5, 1.55, 5], prop: 'blurb', lean: 1.2 });
    a('throw', { armF: [2.7, 5, 2.4, 5], lean: -.6 });
    a('run0', Object.assign({}, RUN[0], { prop: 'blurb' }));
    a('run1', Object.assign({}, RUN[2], { prop: 'blurb' }));
    a('ko', { armB: [-2.6, 5, -2.2, 5], armF: [2.7, 5, 2.4, 5], lean: -1.4, eyes: 'x' });
    a('scared', { armF: [2.3, 4, 3.1, 4], armB: [-2.3, 4, -3.1, 4], dy: 1 });
  });
  const y = (n, p) => out.push(dollItem('y_' + n, YAK_LOOK, p, 3));
  y('stand', { armF: [.15, 5, .3, 5] });
  y('point', { armF: [1.5, 5, 1.55, 5], lean: 1, brow: true });
  y('shout', { armF: [2.6, 5, 2.9, 5], armB: [-2.4, 5, -2.8, 5], mouth: 'o' });
  y('ko', { armB: [-2.6, 5, -2.2, 5], armF: [2.7, 5, 2.4, 5], lean: -1.4, mouth: 'o', eyes: 'x' });
  y('w0', Object.assign({}, RUN[0], { lean: .5 }));
  y('w1', Object.assign({}, RUN[2], { lean: .5 }));
  // лицо Бориса для купола: голова куклы крупным планом
  [['idle', {}], ['shout', { mouth: 'o', brow: true }], ['hurt', { mouth: 'o', eyes: 'x' }]].forEach(([n, p]) => {
    const U = 2, [dc, dx] = mkCanvas(DFW * U, DFH * U); drawDoll(dx, U, YAK_LOOK, p); outline(dx, DFW * U, DFH * U);
    const [c, x] = mkCanvas(30, 40); x.drawImage(dc, 14, 0, 30, 40, 0, 0, 30, 40);
    out.push({ name: 'yf_' + n, c, w: 30, h: 40, ax: 15, ay: 40 });
  });
  // нейролозунг-ракета
  const [rc, rx] = mkCanvas(18, 18);
  rx.fillStyle = OUTC; rx.fillRect(1, 1, 16, 16); rx.fillStyle = '#ff5bd0'; rx.fillRect(2, 2, 14, 14); rx.fillStyle = '#39ff8a'; rx.fillRect(4, 4, 4, 4); rx.fillRect(10, 10, 4, 4); rx.fillStyle = '#ffe36b'; rx.fillRect(10, 4, 4, 4); rx.fillStyle = '#fff'; rx.fillRect(3, 3, 2, 2);
  out.push({ name: 'slopb', c: rc, w: 18, h: 18, ax: 9, ay: 9 });
  const [kc, kx] = mkCanvas(12, 22);
  kx.fillStyle = OUTC; kx.fillRect(3, 0, 6, 4); kx.fillRect(1, 3, 10, 19); kx.fillStyle = '#3a8ad8'; kx.fillRect(4, 1, 4, 2);
  kx.fillStyle = '#f8fbff'; kx.fillRect(2, 4, 8, 17); kx.fillStyle = '#3aa86a'; kx.fillRect(2, 10, 8, 6); kx.fillStyle = '#fff'; kx.fillRect(4, 12, 4, 2); kx.fillStyle = '#dfe8ef'; kx.fillRect(8, 5, 2, 15);
  out.push({ name: 'kefir', c: kc, w: 12, h: 22, ax: 6, ay: 22 });
  return out;
}
// фон уровня: офис, захваченный заводом. Склеивается сам с собой
function makeSlopBg() {
  const [c, x] = mkCanvas(W, H);
  x.fillStyle = '#1c2230'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#222a3a'; for (let i = 0; i < W; i += 50) x.fillRect(i, 0, 25, 300);
  // трубы
  for (const [py, col] of [[48, '#4a5060'], [72, '#6a4a3a']]) { x.fillStyle = OUTC; x.fillRect(0, py - 2, W, 14); x.fillStyle = col; x.fillRect(0, py, W, 10); x.fillStyle = 'rgba(255,255,255,.15)'; x.fillRect(0, py + 1, W, 2); for (let i = 30; i < W; i += 120) { x.fillStyle = OUTC; x.fillRect(i, py - 4, 8, 18); } }
  // старый плакат офиса, заклеенный
  x.fillStyle = OUTC; x.fillRect(116, 110, 148, 98); x.fillStyle = '#e8e4d0'; x.fillRect(120, 114, 140, 90);
  x.font = '8px PS2P,monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#b8202a'; x.fillText('ОФИС', 190, 136); x.fillText('ДВИЖЕНИЯ', 190, 152);
  x.fillStyle = '#e9b616'; x.save(); x.translate(190, 172); x.rotate(-.12); x.fillRect(-74, -12, 148, 24); x.fillStyle = OUTC; x.font = '7px PS2P,monospace'; x.fillText('ЗАВОД НЕЙРОСЛОПА', 0, 0); x.restore();
  // мониторы с генерацией
  for (const mx of [360, 640]) {
    x.fillStyle = OUTC; x.fillRect(mx - 64, 104, 128, 84); x.fillStyle = '#06180e'; x.fillRect(mx - 60, 108, 120, 76);
    x.fillStyle = '#39ff8a'; x.font = '6px PS2P,monospace'; x.textAlign = 'left';
    ['> ПРОМПТ: ЛОЗУНГ', 'ВПЕРЁД ВПЕРЁД ВП', 'ЕРЁД НАШ НАШ НА', '> ПОВТОРИТЬ x1000', '███ 98%'].forEach((l, i) => x.fillText(l, mx - 56, 118 + i * 13));
    x.fillStyle = OUTC; x.fillRect(mx - 6, 188, 12, 20); x.fillRect(mx - 24, 206, 48, 6);
  }
  // стойки серверов
  for (const sx of [480, 760]) { x.fillStyle = OUTC; x.fillRect(sx - 26, 140, 52, 160); x.fillStyle = '#2e3440'; x.fillRect(sx - 22, 144, 44, 152); for (let k = 0; k < 14; k++) { x.fillStyle = '#3c4454'; x.fillRect(sx - 18, 150 + k * 10, 36, 6); x.fillStyle = k % 3 ? '#39ff8a' : '#ff5b6b'; x.fillRect(sx + 10, 152 + k * 10, 3, 2); } }
  // конвейер на заднем плане
  x.fillStyle = OUTC; x.fillRect(0, 262, W, 14); x.fillStyle = '#3a3e4a'; x.fillRect(0, 264, W, 10);
  for (let i = 20; i < W; i += 90) { x.fillStyle = OUTC; x.fillRect(i - 2, 236, 40, 28); x.fillStyle = '#c9a24a'; x.fillRect(i, 238, 36, 24); x.fillStyle = OUTC; x.font = '6px PS2P,monospace'; x.textAlign = 'center'; x.fillText('СЛОП', i + 18, 250); }
  x.fillStyle = OUTC; x.fillRect(0, 296, W, 4); x.fillStyle = '#2a303c'; x.fillRect(0, 300, W, H - 300);
  x.fillStyle = 'rgba(8,8,22,.45)'; x.fillRect(0, 0, W, H);
  return c;
}
// цех для босса
function makeFactoryBg() {
  const [c, x] = mkCanvas(W, H);
  x.fillStyle = '#161a24'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#1c2230'; for (let i = 0; i < W; i += 60) x.fillRect(i, 0, 30, FYB);
  for (let i = 0; i < W; i += 160) { x.fillStyle = OUTC; x.fillRect(i + 40, 0, 16, FYB); x.fillStyle = '#3a4050'; x.fillRect(i + 42, 0, 12, FYB); }
  x.fillStyle = OUTC; x.fillRect(196, 26, 408, 70); x.fillStyle = '#06180e'; x.fillRect(200, 30, 400, 62);
  x.font = '16px PS2P,monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#39ff8a'; x.fillText('НЕЙРОСЛОП 24/7', 400, 52);
  x.font = '7px PS2P,monospace'; x.fillStyle = '#1f9a52'; x.fillText('СГЕНЕРИРОВАНО ЛОЗУНГОВ: 9 999 999', 400, 78);
  for (const lx of [80, 720]) { x.fillStyle = OUTC; x.fillRect(lx - 10, 110, 20, 20); x.fillStyle = '#ff3040'; x.fillRect(lx - 7, 113, 14, 14); }
  x.fillStyle = OUTC; x.fillRect(0, 300, W, 14); x.fillStyle = '#3a3e4a'; x.fillRect(0, 302, W, 10);
  x.fillStyle = '#2a2e38'; x.fillRect(0, FYB, W, H - FYB); x.fillStyle = '#a8b0c0'; x.fillRect(0, FYB, W, 3);
  for (let i = 4; i < W; i += 12) { x.fillStyle = '#181b22'; x.fillRect(i, FYB + 8, 2, H); }
  for (let i = 0; i < W; i += 16) { x.fillStyle = '#e9b616'; x.fillRect(i, FYB + 3, 8, 5); x.fillStyle = '#17171f'; x.fillRect(i + 8, FYB + 3, 8, 5); }
  x.fillStyle = 'rgba(8,8,22,.25)'; x.fillRect(0, 0, W, H);
  return c;
}
function buildSlopArt() { bgSlop = makeSlopBg(); bgFactory = makeFactoryBg(); }
