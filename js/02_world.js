// ---------- game state ----------
let scene = 'load', sceneT = 0;
let L = null, cam = 0, camR = 0, look = 0;
let mode = 'play', modeT = 0;
let hitstop = 0, shake = 0, slow = 1, flash = 0, fade = 0, fadeDir = 0, fadeCb = null;
let talkCd = 0;
let parts = [], gibs = [], floats = [], pickups = [], fxs = [], blurbs = [], words = [];
let stats = null, memorial = [];
let chain = 0, chainT = 0, pendingCele = false, cele = { t: 0, title: '', n: 3 };
let mir = null, mirT = 0, mirSeen = false, mirCard = 0;
let boss = null, folders = [];
let banner = null, letterT = 0, walker = null, walkerT = 12, fallCase = false;
let paused = false, gameT = 0;
const P = { x: 90, y: FY, w: 24, h: 76, crouch: false, sq: 0, idleAnim: '', idleA: 0, idleF: '', clean: 0, vx: 0, vy: 0, face: 1, onGround: true, ground: null, hp: 5, maxhp: 5, inv: 0, hurtT: 0, atk: 0, atkSet: null, coyote: 0, jbuf: 0, idleT: 0, runT: 0, emote: '', emoteT: 0, safeX: 90, safeY: FY, bub: null, wigT: 0, hitWall: false, slip: false };
const ATK_T = 0.3, CELE_T = 3.3, GRAV = 1500;

// Иноагенты в игре выдуманные: фамилии, города и биографии — собирательные.
// [должность, фамилия, куда уехал, что о нём напишут в титрах]
const NAMES = [
  ['Прозаик', 'Отъездов', 'Тбилиси', 'обещал вернуться. в блёрбе'], ['Поэтесса', 'Визова', 'Ригу', 'визу продлили, блёрб — нет'],
  ['Колумнист', 'Шенгенский', 'Берлин', 'пишет колонку «Почему Пелевин не ответил»'], ['Эссеист', 'Чемоданов', 'Ереван', 'чемодан собран с 2014-го'],
  ['Прозаик', 'Пересадкин', 'Стамбул', 'летит с тремя пересадками'], ['Критик', 'Апостилев', 'Белград', 'заверил блёрб у нотариуса'],
  ['Блогер', 'Вайфаев', 'Бали', 'стримит из коворкинга'], ['Публицист', 'Донатов', 'Тель-Авив', 'ссылка на донат в описании'],
  ['Поэт', 'Стримов', 'Вильнюс', 'читает стихи в прямом эфире. зрителей: 3'], ['Романист', 'Эссеев', 'Прагу', 'роман о том, как он уехал. том 4'],
  ['Подкастер', 'Подкастов', 'Лиссабон', 'выпуск 312: «Пелевин нас игнорирует»'], ['Лауреат', 'Лайкин', 'Алматы', 'лауреат премии «Рукопожатие-2019»'],
  ['Поэтесса', 'Колонкина', 'Варшаву', 'колонка вышла. никто не заметил'], ['Комментатор', 'Сноскин', 'Париж', 'весь роман — одна сноска'],
  ['Редактор', 'Предисловцев', 'Лондон', 'пишет предисловия ко всему. даже к меню'], ['Филолог', 'Аннотациев', 'Хельсинки', 'аннотация длиннее книги'],
  ['Поэтесса', 'Цитатова', 'Амстердам', 'цитирует саму себя'], ['Прозаик', 'Эпиграфов', 'Батуми', 'эпиграф из себя же'],
  ['Критик', 'Рецензиев', 'Нью-Йорк', 'рецензия написана до выхода книги'], ['Дизайнер', 'Обложкин', 'Будву', 'хотел на обложку. уехал в Будву'],
  ['Поэт', 'Курсивов', 'Лимассол', 'говорит курсивом'], ['Прозаик', 'Абзацев', 'Таллин', 'абзац на сорок страниц'],
  ['Литератор', 'Переплётов', 'Барселону', 'переплёт мягкий, позиция твёрдая'], ['Эссеистка', 'Релокантова', 'Дубай', 'релоцирована дважды. сегодня — трижды'],
  ['Блогер', 'Ретвитов', 'Бишкек', 'ретвитнул сам себя'], ['Поэт', 'Верлибров', 'Ниццу', 'верлибр без рифмы и без визы'],
  ['Колумнистка', 'Тредова', 'Кипр', 'тред из 48 твитов'], ['Мемуарист', 'Воспоминаев', 'Черногорию', 'вспоминает, как всё было хорошо']
];
const FEMALE = s => /(есса|истка|ова$|ина$|ева$)/.test(s);
let nameI = 0;
const LAST = ['это цензура!', 'напишу об этом колонку', 'уезжаю! опять', 'блёрб пришлю почтой', 'ну и не надо', 'ты ещё пожалеешь. в блёрбе', 'в Тбилиси меня поймут', 'я тебя всё равно процитирую', 'а мне Виктор ответил!', 'это войдёт в мемуары', 'запишу подкаст про это'];
const QUOTES = ['«ГЕНИАЛЬНО!»', '«ШЕДЕВР»', '«СМЕЛО!»', '«ВАЖНЕЙШИЙ ГОЛОС»', '«НА ОДНОМ ДЫХАНИИ»', '«ЛУЧШИЙ ИЗ ПЕЛЕВИНЫХ»', '«НЕ ХУЖЕ ВИКТОРА»', '«ГОЛОС ПОКОЛЕНИЯ»', '«МОЩНО»', '«ЧЕСТНО!»', '«РЕКОМЕНДУЮ ИЗДАЛЕКА»'];
const BONK = ['ОТКАЗ!', 'НЕТ!', 'ИГНОР!', 'МИМО!', 'НЕ НАДО!', 'БЕЗ БЛЁРБА!', 'СПАСИБО, НЕТ!', 'В ЧС!'];
const AWE = ['он танцует…', 'без единого блёрба', 'это вообще законно?', 'напишу об этом колонку', 'это войдёт в мою книгу', 'я тоже хочу так', 'запомните этот танец'];

function mkAgent(x, y, kind, line, o) {
  o = o || {};
  const nm = NAMES[nameI++ % NAMES.length];
  const v = o.robo ? o.robo - 1 : FEMALE(nm[0]) || FEMALE(nm[1]) ? 1 : pick([0, 2, 3]);
  if (o.as) { nameI--; return Object.assign(mkAgentRaw(x, y, kind, line, o, 0), o.as); }
  if (o.robo) { nameI--; return Object.assign(mkAgentRaw(x, y, kind, line, o, v), { robo: true, title: 'Робонашист', name: 'Т-' + rint(100, 999), city: '', epi: '', range: o.range || 120 }); }
  return mkAgentRaw(x, y, kind, line, o, v, nm);
}
function mkAgentRaw(x, y, kind, line, o, v, nm) {
  nm = nm || ['', '', '', ''];
  return { x, y, w: 24, h: 74, vx: 0, vy: 0, kind, line, scale: o.scale || 1, v, title: nm[0], name: nm[1], city: nm[2], epi: nm[3], face: -1, state: 'idle', t: rnd(3), said: false, said2: false, ko: 0, koDir: 1, dead: false, bub: null, onGround: true, ground: null, sign: o.sign, awe: false, hitWall: false, throwT: rnd(1.2, 2.6), throwA: 0 };
}
function mkCase(x, y, content, ci, scale, main) { return { x, y, content, ci: ci || 0, scale: scale || 1, main: !!main, open: false, vx: 0, vy: 0, fall: false, fallen: false, t: 0, bump: 0 }; }
function say(e, s, t) { e.bub = { s, t: t || 2.4 }; }
const fullName = a => a.title + ' ' + a.name;
const isFem = a => FEMALE(a.title) || FEMALE(a.name);

// Заготовка уровня: возвращает пустой уровень и короткие команды для его сборки.
// Ею пользуются все уровни, в том числе файлы друзей в js/levels/.
function levelKit(width) {
  const l = { w: width, fy: FY, solids: [], agents: [], cases: [], signs: [], zaps: [], spikes: [], movers: [], deco: [], checks: [], pits: [], boss: false, gateX: width - 100, gate: 0 };
  const floors = [];
  const k = {
    l,
    fl: (a, b) => { floors.push([a, b]); l.solids.push({ x: a, y: FY, w: b - a, h: 120, k: 'f' }); },
    bl: (x, y, w, h) => l.solids.push({ x, y, w, h, k: 'b' }),
    pl: (x, y, w) => l.solids.push({ x, y, w, h: 12, k: 'p' }),
    mv: (x0, x1, y, w, sp) => { const s = { x: x0, y, w, h: 12, k: 'p', mv: { x0, x1, sp: sp || 45, d: 1 } }; l.solids.push(s); l.movers.push(s); },
    ag: (x, y, kind, line, o) => { const r = mkAgent(x, y, kind, line, o); l.agents.push(r); return r; },
    cs: (x, y, content, ci) => l.cases.push(mkCase(x, y, content, ci, 1, true)),
    spikes: (x, w, y) => l.spikes.push({ x, y: (y === undefined ? FY : y) - 12, w, h: 12 }),
    zap: (x, yTop, period, phase) => l.zaps.push({ x, y0: yTop === undefined ? 180 : yTop, y1: FY, per: period || 2.6, ph: phase || 0 }),
    sign: (x, y, lines, w) => l.signs.push({ x, y, w: w || Math.max.apply(null, lines.map(s => s.length)) * 8 + 24, lines }),
    check: x => l.checks.push({ x, on: false }),
    deco: (x, ci) => l.deco.push({ x, y: FY, ci: ci || 0, s: .8 }),
    // закончить уровень: стены по краям, ямы между кусками пола, счётчики
    done() {
      l.solids.push({ x: -60, y: -300, w: 60, h: 800, k: 'b', hid: true }, { x: width, y: -300, w: 80, h: 800, k: 'b', hid: true });
      floors.sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < floors.length; i++) if (floors[i][0] > floors[i - 1][1]) l.pits.push([floors[i - 1][1], floors[i][0]]);
      l.casesTotal = l.cases.length + (l.fallX ? 1 : 0); l.rabTotal = l.agents.length;
      return l;
    }
  };
  k.rb = k.ag;   // старое имя из «Гали», чтобы шаблоны уровней не ломались
  return k;
}
function buildLevel1() {
  const k = levelKit(6960), l = k.l, { fl, bl, pl, mv, ag, cs } = k;
  l.name = 'КНИЖНАЯ ЯРМАРКА';
  fl(-200, 1300); fl(1390, 1900); fl(2260, 4600); fl(5230, 7200);
  // A: знакомство
  k.sign(60, 236, TOUCH ? ['◀ ▶  БЕГАТЬ', 'ПРЫГ  ПРЫГАТЬ', 'КНИГА  ОТКАЗАТЬ'] : ['СТРЕЛКИ    БЕГАТЬ', 'ПРОБЕЛ / Z  ПРЫЖОК', 'X      ОТКАЗАТЬ'], 250);
  cs(360, FY, 'socks', 0);
  ag(580, FY, 'sit', 'Саша! Можно я напишу тебе блёрб?');
  ag(830, FY, 'give', 'всего пару слов на обложку!');
  bl(990, 346, 70, 40); ag(1025, 346, 'sit', '«Лучший роман десятилетия» — подойдёт?');
  ag(1190, FY, 'run', 'ЭТО ОН! ТОТ, ЧТО БЕЗ БЛЁРБОВ!');
  // B
  k.sign(1396, 232, ['ДНЕЙ БЕЗ БЛЁРБА:', '0'], 150);
  ag(1470, FY, 'sit', 'я тебя не читал, но напишу!');
  bl(1560, 346, 60, 40); bl(1620, 306, 90, 80); ag(1668, 306, 'give', 'возьми блёрб. он из Риги, свежий');
  k.spikes(1716, 50);
  ag(1850, FY, 'sit', 'все уже взяли. один ты такой');
  // C: яма
  pl(1950, 346, 70); pl(2075, 322, 70); pl(2195, 346, 62); pl(1988, 250, 66);
  ag(2112, 322, 'sit', 'я напишу из Тбилиси. никто не узнает');
  cs(2021, 250, 'heart', 1);
  // D: собрание. Тут впервые выходит Миронова
  k.sign(2290, 262, ['ПЛАН:', '1. НЕ БРАТЬ БЛЁРБ', '2. СМ. ПУНКТ 1'], 216);
  ag(2560, FY, 'sit', 'это он. как в пророчестве'); ag(2618, FY, 'sit', 'предлагаю блёрб всем клубом'); ag(2676, FY, 'sit', 'кто за то, чтобы написать? единогласно');
  k.check(2790);
  ag(2960, FY, 'run', 'А-А-А! ОН НАСТОЯЩИЙ!');
  l.mirX = 3120;
  k.sign(3150, 250, ['ОСТОРОЖНО:', 'ЖУРНАЛИСТЫ'], 120);
  ag(3400, FY, 'sit', 'я уже уезжаю. но блёрб оставлю'); cs(3438, FY, 'books', 3);
  ag(3610, FY, 'give', 'рукопожатно же! ну?');
  // E: мостик и разряды
  bl(3740, 346, 60, 40); bl(3800, 306, 90, 80); pl(3920, 270, 340);
  k.zap(3992, 282, 2.6, 0); k.zap(4196, 282, 2.6, 1.3);
  ag(4070, FY, 'sit', 'тут тупик. как в моей карьере'); cs(4126, FY, 'matryoshka', 2);
  ag(4010, 270, 'sit', 'я лауреат! мой блёрб продаёт тиражи', { scale: 1.08 });
  ag(4052, 270, 'sit', 'а я молодой поэт!', { scale: .7 }); ag(4078, 270, 'sit', 'я тоже напишу!', { scale: .7 }); ag(4104, 270, 'sit', 'можно хотя бы в аннотацию?', { scale: .7 });
  l.pot = { x: 4226, y: 270 };
  k.check(4340);
  k.sign(4384, 226, ['ПРОДАЖА БЛЁРБОВ.', 'ДОРОГО.', 'ИЗ-ЗА ГРАНИЦЫ.'], 190);
  ag(4450, FY, 'sit', 'а мне Виктор ответил. почти');
  // F: движущиеся платформы
  pl(4650, 350, 72); mv(4760, 4850, 340, 84, 46); pl(4975, 326, 84); mv(5092, 5138, 340, 84, 40);
  ag(5018, 326, 'sit', 'сюда не допрыгнет. как до Риги');
  // G: клуб релокантов
  l.fallX = 5330;
  ag(5560, FY, 'give', 'мир? дружба? блёрб?');
  bl(5680, 346, 80, 40); bl(5760, 306, 84, 80); cs(5718, 346, 'letter', 4);
  ag(5802, 306, 'sit', 'я за блёрбы! нас осталось трое', { sign: 'БЛЁРБ' });
  ag(5950, FY, 'sit', 'я тебе уже написал, просто не отправил'); ag(6004, FY, 'sit', 'а я напишу тебе предисловие');
  k.sign(5868, 236, ['КЛУБ РЕЛОКАНТОВ:', '«МЫ НЕ УЕХАЛИ,', 'МЫ ВЫШЛИ»'], 224);
  ag(6110, FY, 'sit', 'у меня виза до пятницы');
  ag(6230, FY, 'run', 'бегите! он отказывает всем!');
  bl(6300, 326, 70, 60); pl(6400, 262, 70); pl(6500, 200, 72); cs(6536, 200, 'money', 1);
  ag(6690, FY, 'sit', 'дальше Бородин. он проверит тебя');
  k.sign(6716, 250, ['БОРОДИН →', '(он проверит)'], 136);
  [140, 700, 905, 1432, 2300, 2330, 2315, 2850, 3230, 3550, 4300, 4560, 5290, 5480, 5505, 5492, 5900, 6160, 6620, 6800].forEach((x, i) => {
    const pile = (i === 6 || i === 15); l.deco.push({ x, y: pile ? FY - 17 : FY, ci: i % 5, s: .8 });
  });
  return k.done();
}
// Список уровней. Новый уровень добавляется строкой LEVELS.push({...}) в своём файле в js/levels/.
const LEVELS = [{ name: 'КНИЖНАЯ ЯРМАРКА', sub: 'босс: Бородин', build: buildLevel1, boss: true, bossKind: 'bor' }];
function buildBossLevel() {
  const l = { w: W, fy: FYB, solids: [], agents: [], cases: [], signs: [], zaps: [], spikes: [], movers: [], deco: [], checks: [], pits: [], boss: true, name: 'ПРИЁМНАЯ' };
  l.solids.push({ x: -200, y: FYB, w: W + 400, h: 120, k: 'f', hid: true }, { x: -60, y: -300, w: 68, h: 800, k: 'b', hid: true }, { x: W - 8, y: -300, w: 68, h: 800, k: 'b', hid: true });
  return l;
}

// оформление этапов: THEME[имя] = { solid, gate, update, back, front } (новые этапы регистрируются тут)
const THEME = {};

// ---------- physics ----------
function collide(e, dt) {
  const hw = e.w / 2;
  e.hitWall = false;
  e.x += e.vx * dt;
  for (const s of L.solids) {
    if (s.k === 'p') continue;
    if (e.x + hw > s.x && e.x - hw < s.x + s.w && e.y > s.y + 0.01 && e.y - e.h < s.y + s.h) {
      if (e.vx > 0) e.x = s.x - hw; else if (e.vx < 0) e.x = s.x + s.w + hw;
      else e.x = (e.x < s.x + s.w / 2) ? s.x - hw : s.x + s.w + hw;
      e.vx = 0; e.hitWall = true;
    }
  }
  const prev = e.y; e.y += e.vy * dt; e.onGround = false; e.ground = null;
  for (const s of L.solids) {
    if (!(e.x + hw > s.x + 0.01 && e.x - hw < s.x + s.w - 0.01)) continue;
    if (s.k === 'p') { if (e.vy >= 0 && prev <= s.y + 3 && e.y >= s.y) { e.y = s.y; e.vy = 0; e.onGround = true; e.ground = s; } }
    else if (e.y > s.y && e.y - e.h < s.y + s.h) {
      if (e.vy >= 0 && prev <= s.y + 10) { e.y = s.y; e.vy = 0; e.onGround = true; e.ground = s; }
      else if (e.vy < 0) { e.y = s.y + s.h + e.h; e.vy = 0; }
    }
  }
}
function solidAt(x, y) { for (const s of L.solids) if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return s; return null; }
function groundBelow(x, y) { for (const s of L.solids) if (x >= s.x && x <= s.x + s.w && s.y >= y - 4 && s.y <= y + 10) return s; return null; }
const inView = (x, m) => x > cam - (m || 60) && x < cam + W + (m || 60);

// ---------- fx ----------
function floater(s, x, y, o) { o = o || {}; floats.push({ s, x, y, vy: o.vy === undefined ? -34 : o.vy, t: 0, max: o.t || 1.1, color: o.color || '#fff', size: o.size || 10, rot: o.rot || 0, scr: !!o.scr, stroke: o.stroke || '#16161d' }); }
function burst(x, y, n, cols, sp, life, grav) { for (let i = 0; i < n; i++) { const a = rnd(6.28), v = rnd(sp * .3, sp); parts.push({ k: 'p', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * .3, s: rint(1, 3), c: pick(cols), life: rnd(life * .5, life), g: grav === undefined ? 600 : grav }); } }
// бумажное конфетти: листки кружатся и медленно падают
function confetti(x, y, n, sp) { for (let i = 0; i < n; i++) gibs.push({ k: 'sheet', x: x + rnd(-10, 10), y: y + rnd(-10, 10), vx: rnd(-sp, sp), vy: -rnd(sp * .5, sp * 1.4), rot: rnd(6.28), vr: rnd(-8, 8), sc: rnd(.5, .9), rest: false, life: rnd(3, 6), ph: rnd(6) }); if (gibs.length > 160) gibs.splice(0, gibs.length - 160); }
function updateFx(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.life <= 0 || p.y > H + 30) { parts[i] = parts[parts.length - 1]; parts.pop(); }
  }
  for (let i = gibs.length - 1; i >= 0; i--) {
    const q = gibs[i]; q.life -= dt;
    if (q.life <= 0 || q.y > H + 60) { gibs.splice(i, 1); continue; }
    if (q.rest) { if (!groundBelow(q.x, q.y + 1)) q.rest = false; continue; }
    if (q.k === 'sheet') {   // бумага планирует
      q.vy = Math.min(q.vy + 500 * dt, 70); q.vx *= Math.pow(.4, dt); q.x += (q.vx + Math.sin(gameT * 4 + q.ph) * 40) * dt; q.y += q.vy * dt; q.rot += q.vr * dt;
    } else { q.vy += 1100 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt; }
    const s = solidAt(q.x, q.y);
    if (s && q.vy > 0 && q.y - q.vy * dt <= s.y + 6) {
      q.y = s.y;
      if (q.k === 'sheet' || Math.abs(q.vy) < 120) { q.rest = true; q.vy = 0; q.vx = 0; q.vr = 0; q.rot = Math.round(q.rot / (Math.PI / 2)) * (Math.PI / 2); }
      else { q.vy *= -.4; q.vx *= .7; q.vr *= .6; }
    }
    if (L.boss) { if (q.x < 14) { q.x = 14; q.vx = Math.abs(q.vx) * .6; } if (q.x > W - 14) { q.x = W - 14; q.vx = -Math.abs(q.vx) * .6; } }
  }
  for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.t += dt; f.y += f.vy * dt; if (f.t > f.max) floats.splice(i, 1); }
  for (let i = fxs.length - 1; i >= 0; i--) { fxs[i].t += dt; if (fxs[i].t > fxs[i].max) fxs.splice(i, 1); }
  // pickups
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i]; p.t += dt;
    if (p.k === 'copy' && p.t > .55) {
      const dx = P.x - p.x, dy = (P.y - 50) - p.y, d = Math.hypot(dx, dy) || 1, sp = 300 + p.t * 500;
      p.x += dx / d * sp * dt; p.y += dy / d * sp * dt;
      if (d < 22) { pickups.splice(i, 1); stats.copies += p.n || 1; sfx.hat(); floater('+' + (p.n || 1), P.x, P.y - 96, { color: '#ffe36b', size: 9, t: .7 }); }
      continue;
    }
    if (!p.rest) {
      p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const s = solidAt(p.x, p.y);
      if (s && p.vy > 0) { p.y = s.y; if (p.vy < 130) { p.rest = true; p.vx = 0; } else { p.vy *= -.4; p.vx *= .6; } }
      if (L.boss) p.x = clamp(p.x, 24, W - 24);
      if (p.y > H + 40) { pickups.splice(i, 1); continue; }
    }
    if (p.k !== 'copy' && p.t > .35 && Math.abs(p.x - P.x) < 26 && p.y > P.y - 84 && p.y - 20 < P.y && mode === 'play') {
      pickups.splice(i, 1);
      if (p.k === 'heart') { P.hp = Math.min(P.maxhp, P.hp + 1); sfx.heal(); floater('ХОРОШАЯ РЕЦЕНЗИЯ +1', P.x, P.y - 90, { color: '#ff5b6b', size: 8, t: 1.4 }); }
      else if (p.k === 'kefir') { P.kefir = Math.min(3, (P.kefir || 0) + 1); sfx.heal(); floater('КЕФИР ×' + P.kefir, P.x, P.y - 96, { color: '#fff', t: 1.2, size: 9 }); }
      else if (p.k === 'shroom') { P.hp = Math.min(P.maxhp, P.hp + 1); sfx.heal(); floater(pick(['ПОГАНКА +1', 'ЭТО ТОЧНО СЪЕДОБНО?', 'ВКУС ПУСТОТЫ +1']), P.x, P.y - 96, { color: '#e8e8c0', t: 1.4, size: 9 }); }
      else if (p.k === 'vodka') { P.vodka = Math.min(3, (P.vodka || 0) + 1); sfx.heal(); floater('ПУЗЫРЬ ×' + P.vodka, P.x, P.y - 96, { color: '#dff0ff', t: 1.2, size: 9 }); }
      else if (p.k === 'money') { P.hp = P.maxhp; sfx.heal(); floater('ГОНОРАР. НЕ ГРАНТ!', P.x, P.y - 96, { color: '#7fe08a', t: 2.2, size: 9 }); }
    }
  }
}

// ---------- блёрбы ----------
// Иноагент кидает блёрб в Пелевина. Попал — блёрб на обложке, минус репутация.
// Книгой блёрб можно отбить обратно, и тогда он прилетает в автора.
function throwBlurb(a) {
  const x = a.x + a.face * 14, y = a.y - 58 * a.scale, tx = P.x, ty = P.y - 44;
  const dx = tx - x, vx = clamp(Math.abs(dx) / .95, 170, 300) * sign(dx), T = Math.abs(dx / vx), gr = 420;
  const vy = clamp((ty - y - .5 * gr * T * T) / Math.max(.3, T), -420, 160);
  blurbs.push({ x, y, vx, vy, g: gr, q: pick(a.quotes || (a.robo ? NEURO : QUOTES)), from: a, back: false, t: 0, rot: 0 });
  a.throwA = .35; sfx.paper();
}
function updateBlurbs(dt) {
  for (let i = blurbs.length - 1; i >= 0; i--) {
    const b = blurbs[i]; b.t += dt; b.vy += b.g * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += dt * (b.back ? 18 : 6);
    let kill = b.t > 4.5 || b.y > H + 20;
    const s = solidAt(b.x, b.y); if (s && s.k !== 'p') kill = true;
    if (!b.back && !kill && Math.abs(b.x - P.x) < 15 && b.y > P.y - P.h - 2 && b.y < P.y + 2 && mode === 'play' && P.inv <= 0) {
      kill = true; if (!b.paper) stats.got++;
      floater(b.paper ? (b.hitTxt || 'ЗАЯВЛЕНИЕ НА ВАС') : b.q + ' — ' + b.from.name, P.x, P.y - 110, { color: b.paper ? '#8fdcff' : '#ffe36b', size: 8, t: 2.2, vy: -18 });
      hurtPlayer(sign(b.vx), false, b.kind || (b.paper ? 'folder' : 'blurb'));
    }
    if (b.back && !kill) for (const a of L.agents) if (!a.dead && a.ko <= 0 && Math.abs(a.x - b.x) < 16 * a.scale && b.y > a.y - 74 * a.scale && b.y < a.y) { kill = true; floater('ВОЗВРАЩЁН АВТОРУ', a.x, a.y - 96, { color: '#7fe08a', size: 8, t: 1.4 }); hitAgent(a, sign(b.vx)); break; }
    if (kill) { if (b.y < H) confetti(b.x, b.y, 2, 60); blurbs.splice(i, 1); }
  }
}
function drawBlurbs() {
  for (const b of blurbs) {
    if (!inView(b.x)) continue;
    spr(b.spr || (b.paper ? 'sheet' : 'blurbp'), b.x, b.y + (b.spr ? 0 : 8), false, { rot: b.paper ? b.rot : Math.sin(b.rot) * .5 });
    if (!b.back) T(b.q, b.x - camR, b.y - 14, { size: 7, color: '#ffe36b', stroke: '#16161d' });
  }
}

// ---------- релокация (вместо смерти) ----------
function relocate(a, dir) {
  a.dead = true; stats.relocated++;
  const cx = a.x, cy = a.y - 40 * a.scale;
  if (a.robo) burst(cx, cy, 26, ['#ffe36b', '#ff9a3a', '#cfd8e6', '#39e0d0'], 260, .6, 500); else confetti(cx, cy, 10, 160);
  burst(cx, cy, 16, ['#fff', '#ffe36b', '#cfd8e6'], 200, .5, 300);
  shake = Math.max(shake, 5); sfx.whoosh();
  pickups.push({ k: 'copy', x: cx, y: cy, vx: rnd(-40, 40), vy: -330, t: 0, rest: false });
  if (!a.robo && !a.noMem) memorial.push([fullName(a), 'уехал' + (isFem(a) ? 'а' : '') + ' в ' + a.city + ': ' + a.epi]);
  floater(a.relocTxt || (a.robo ? 'ОТКЛЮЧЁН: НА ПЕРЕОБУЧЕНИЕ' : 'РЕЛОКАЦИЯ: ' + a.city.toUpperCase(), cx, cy - 46, { color: '#8fdcff', size: 8, t: 1.6, vy: -22 }));
  chain++; chainT = 3.6; stats.best = Math.max(stats.best, chain);
  if (chain % 4 === 0) { pendingCele = true; cele.n = chain; }
  if (!P.bub && Math.random() < .45) say(P, pick(['СЧАСТЛИВОГО ПУТИ', 'ПИШИТЕ. НО НЕ МНЕ', 'НЕ НАДО БЛЁРБОВ', 'ОБЛОЖКА ЧИСТАЯ', 'Я ВАС НЕ ЗНАЮ']), 1.2);
}
function startCelebrate() {
  pendingCele = false; mode = 'celebrate'; cele.t = 0;
  const lvl = Math.floor(cele.n / 4);
  cele.title = lvl <= 1 ? pick(['ЧИСТАЯ ОБЛОЖКА', 'ЧЕТЫРЕ ОТКАЗА', 'НИ СЛОВА НА ОБЛОЖКЕ']) : lvl === 2 ? pick(['ВОСЕМЬ РЕЛОКАЦИЙ', 'АЭРОПОРТ ПЕРЕПОЛНЕН']) : pick(['ВЕЛИКИЙ ОТЪЕЗД', 'ПОСЛЕДНИЙ РЕЙС']);
  cele.kind = pick(['dance', 'laugh', 'proud']);
  P.vx = 0; P.atk = 0; P.crouch = false; P.h = 76; P.idleAnim = '';
  if (cele.kind === 'laugh') { stopSong(); sfx.maniac(); }
  else { sfx.laugh(5, 600); playSong('dance'); }
  let aweN = 0;
  for (const a of L.agents) if (!a.dead && inView(a.x)) { a.awe = true; a.vx = 0; if (aweN < 2 && Math.random() < .6) { aweN++; say(a, pick(AWE), 2.4); } else a.bub = null; }
  if (boss && L.boss && !boss.dead && !boss.kind) say(boss, 'ТАНЦЫ В ПРИЁМНОЙ? ЗАПИСЫВАЮ', 2.4);
}
function endCelebrate() {
  mode = 'play'; for (const a of L.agents) a.awe = false;
  playSong(L.boss ? (L.song || 'boss') : (L.song || 'level')); P.idleT = 0;
}

// ---------- suitcases ----------
function openCase(c, dir) {
  if (c.open) return; c.open = true; c.bump = .2; sfx.click(); shake = Math.max(shake, 3);
  if (c.main) { stats.cases++; floater('ЧЕМОДАН ' + stats.cases + '/' + stats.casesTotal, c.x, c.y - 64, { color: '#ffe36b', size: 8, t: 1.5 }); }
  const x = c.x, y = c.y - 20 * c.scale;
  burst(x, y, 10, ['#fff', '#ffe36b', '#d9d2b0'], 160, .5);
  switch (c.content) {
    case 'socks':
      for (let i = 0; i < 7; i++) gibs.push({ k: 'sock', x, y, vx: rnd(-170, 170), vy: -rnd(240, 440), rot: rnd(6.28), vr: rnd(-12, 12), sc: 1, c: pick(['#e84a5f', '#4ab0e8', '#f3c93a', '#7fbf6d', '#fff']), rest: false, life: 14 });
      floater('НОСКИ НА ВСЕ ВИЗЫ', x, y - 26, { size: 8, t: 1.8 }); break;
    case 'heart': pickups.push({ k: 'heart', x, y, vx: dir * 40, vy: -300, t: 0 }); break;
    case 'books': for (let i = 0; i < 3; i++) pickups.push({ k: 'copy', x: x + i * 8 - 8, y, vx: rnd(-60, 60), vy: -rnd(260, 380), t: -i * .12 }); floater('НЕПРОДАННЫЙ ТИРАЖ', x, y - 26, { size: 8, t: 1.8 }); break;
    case 'money': pickups.push({ k: 'money', x, y, vx: dir * 40, vy: -300, t: 0 }); floater('ГОНОРАР', x, y - 26, { size: 8, t: 1.8 }); break;
    case 'matryoshka':
      if (c.scale > .42) { const n = mkCase(x + dir * 6, y, 'matryoshka', (c.ci + 1) % 5, c.scale * .7, false); n.fall = true; n.vy = -330; n.vx = dir * 70; L.cases.push(n); floater(c.scale === 1 ? 'ЧЕМОДАН В ЧЕМОДАНЕ' : '…В ЧЕМОДАНЕ', x, y - 26, { size: 8, t: 1.5 }); }
      else { pickups.push({ k: 'copy', x, y, vx: 0, vy: -300, t: 0 }); floater('КАРМАННОЕ ИЗДАНИЕ', x, y - 26, { size: 8, t: 1.8 }); }
      break;
    case 'agent': {
      const a = mkAgent(x, y, 'sit', c.fallen ? 'десант с блёрбом!' : 'занято! я тут с 2022-го'); a.vy = -340; a.onGround = false; a.said = true; say(a, a.line, 2.2); L.agents.push(a); L.rabTotal++; sfx.squeak(); break;
    }
    case 'letter': letterT = 4.2; sfx.blip2(); break;
    default: floater('ПУСТО. ВСЁ УВЕЗЛИ', x, y - 26, { size: 8, t: 2 });
  }
}

// ---------- иноагенты ----------
function updateAgents(dt) {
  talkCd -= dt;
  for (let i = L.agents.length - 1; i >= 0; i--) {
    const a = L.agents[i];
    if (a.dead) { L.agents.splice(i, 1); continue; }
    a.t += dt; a.throwA = Math.max(0, a.throwA - dt);
    if (a.bub) { a.bub.t -= dt; if (a.bub.t <= 0) a.bub = null; }
    if (a.ko > 0) {
      a.ko -= dt;
      if (a.fin === 'launch') { a.x += a.koDir * 170 * dt; a.y -= 560 * dt; a.rot += 14 * dt; }
      else { a.x += a.koDir * 560 * dt; a.face = a.koDir; if (Math.random() < .5) parts.push({ k: 'p', x: a.x - a.koDir * 16, y: a.y - 4, vx: -a.koDir * rnd(20, 80), vy: -rnd(10, 60), s: 2, c: '#cfd8e6', life: .4, g: 0 }); }
      if (a.ko <= 0) relocate(a, a.koDir);
      continue;
    }
    if (!inView(a.x, 260)) continue;
    const dx = P.x - a.x, dist = Math.abs(dx), near = Math.abs(P.y - a.y) < 130;
    if (!a.said && dist < 230 && near && a.line && mode === 'play' && talkCd <= 0) { a.said = true; say(a, a.line, 1.7 + a.line.length * .06); sfx.blip(); talkCd = 1; }
    if (a.kind === 'patrol') patrolAgent(a, dt, dx, dist, near);
    else if (a.kind === 'run') {
      if (a.state === 'idle' && dist < 205 && near) { a.state = 'flee'; sfx.squeak(); }
      if (a.state === 'flee') {
        const dir = dx > 0 ? -1 : 1; a.face = dir;
        const ahead = a.x + dir * 22;
        const blocked = (a.onGround && !groundBelow(ahead, a.y)) || a.hitWall || L.zaps.some(z => Math.abs(z.x - ahead) < 14);
        if (blocked) { a.state = 'corner'; a.vx = 0; if (!a.said2) { a.said2 = true; say(a, pick(['тупик. а виза кончилась', 'ладно, держи блёрб!', 'бежать некуда. как и писать']), 1.6); } }
        else a.vx = dir * 150;
        if (dist > 360) { a.state = 'idle'; a.vx = 0; }
      } else { a.vx = 0; a.face = sign(dx); }
      if (a.state === 'corner' && mode === 'play' && !isDark() && dist < 330 && near) { a.throwT -= dt; if (a.throwT <= 0 && blurbs.length < 3) { a.throwT = rnd(2.2, 3.2); throwBlurb(a); } }
    } else if (a.kind === 'give') {
      // идёт к Пелевину, чтобы вручить блёрб лично
      a.face = sign(dx);
      if (mode === 'play' && dist < 280 && dist > 16 && near && !a.awe) {
        const ahead = a.x + a.face * 18;
        if (a.onGround && !groundBelow(ahead, a.y)) { a.vx = 0; a.state = 'offer'; }
        else { a.vx = a.face * 62; a.state = 'walk'; }
      } else { a.vx = 0; a.state = dist < 280 && near ? 'offer' : 'idle'; }
      if (mode === 'play' && dist < 22 && Math.abs(P.y - a.y) < 40 && P.inv <= 0 && a.bite) {
        floater(a.bite, P.x, P.y - 110, { color: '#ff5b6b', size: 8, t: 2 }); hurtPlayer(sign(dx || 1), false, 'bite');
        say(a, pick(a.biteSay || ['ВКУСНО']), 1.4);
      } else if (mode === 'play' && dist < 22 && Math.abs(P.y - a.y) < 40 && P.inv <= 0) {
        stats.got++; floater('«ЛИЧНО ВРУЧЁН» — ' + a.name, P.x, P.y - 110, { color: '#ffe36b', size: 8, t: 2 });
        hurtPlayer(sign(dx || 1)); say(a, pick(['ВРУЧИЛ!', 'есть! на обложку!', 'теперь мы коллеги']), 1.4);
      }
    } else {
      a.face = sign(dx); a.vx = 0;
      a.state = (dist < 150 && near) ? 'scared' : 'idle';
      if (mode === 'play' && !isDark() && a.said && dist < 340 && dist > 60 && near && !a.awe) {
        a.throwT -= dt;
        if (a.throwT <= 0 && blurbs.length < 3) { a.throwT = rnd(2.4, 3.6); throwBlurb(a); }
      }
      if (!a.said2 && a.said && dist < 80 && near && !a.bub) { a.said2 = true; if (Math.random() < .7 && talkCd <= 0) say(a, pick(['ну хоть строчку…', 'я без претензий', 'у меня есть премия', 'возьми у соседа', 'давай я сам себе напишу', 'может, в аннотацию?', 'бесплатно же!']), 1.4); }
    }
    a.vy += GRAV * dt; collide(a, dt);
    if (a.y > H + 80) { a.dead = true; }
  }
}
function hitAgent(a, dir) {
  if (a.ko > 0 || a.dead) return;
  // уезжает: либо улетает (самолётом), либо убегает с чемоданом
  a.fin = pick(['launch', 'launch', 'dash']); a.koMax = a.fin === 'launch' ? .5 : .55; a.rot = 0;
  a.ko = a.koMax; a.koDir = dir; a.bub = null; hitstop = .05; sfx.bonk();
  if (Math.random() < .85) say(a, pick(a.lastL || (a.robo ? ROBO_LAST : LAST)), .9);
  floater(pick(BONK), a.x + dir * 10, a.y - 70, { color: '#ffe36b', size: 13, t: .55, rot: rnd(-.3, .3), vy: -60 });
  fxs.push({ k: 'star', x: a.x, y: a.y - 40, t: 0, max: .12 });
  if (a.robo) { for (let i = 0; i < 4; i++) gibs.push({ k: 'bolt', x: a.x, y: a.y - 40, vx: rnd(-160, 160), vy: -rnd(260, 420), rot: rnd(6), vr: rnd(-14, 14), sc: 1, rest: false, life: 7 }); sfx.zap(); }
  else if (!a.pre) gibs.push({ k: 'case', x: a.x, y: a.y - 20, vx: dir * rnd(80, 200), vy: -rnd(300, 420), rot: 0, vr: dir * 9, sc: .7, ci: [4, 1, 0, 3][a.v], rest: false, life: 6 });
}

// ---------- drawing: world pieces ----------
function drawSolid(s) {
  if (s.hid) return;
  const x = Math.round(s.x), y = Math.round(s.y), w = Math.round(s.w);
  if (L.theme === 'slop') return drawSlopSolid(s, x, y, w);
  if (THEME[L.theme] && THEME[L.theme].solid) return THEME[L.theme].solid(s, x, y, w);
  if (L.theme === 'dk' && s.k !== 'p') {
    if (s.k === 'f') {
      g.fillStyle = pats.panel; g.fillRect(x, y + 8, w, H - y);
      R(x, y, w, 2, '#c9a24a'); R(x, y + 2, w, 7, '#5a1630'); for (let i = 6; i < w; i += 16) R(x + i, y + 4, 3, 3, '#c9a24a');
      R(x, y + 9, w, 2, '#2a1a10'); R(x, y, 3, H - y, '#2a1a10'); R(x + w - 3, y, 3, H - y, '#2a1a10');
    } else if (s.st === 'bal') {
      for (let i = 20; i < w; i += 140) { R(x + i - 1, y + s.h, 10, FY - y - s.h, '#16161d'); R(x + i, y + s.h, 8, FY - y - s.h, '#d8ccaa'); }
      R(x, y, w, s.h, '#16161d'); R(x + 1, y + 1, w - 2, 5, '#d8caa4'); R(x + 1, y + 6, w - 2, s.h - 7, '#6a4628');
      for (let i = 8; i < w - 6; i += 14) R(x + i, y + 8, 5, s.h - 11, '#c9b88a');
    } else {
      // ящик с реквизитом
      R(x, y, w, s.h, '#16161d'); R(x + 2, y + 2, w - 4, s.h - 4, '#8a6440');
      for (let yy = 10; yy < s.h - 2; yy += 10) R(x + 2, y + yy, w - 4, 1, '#6a4a2a');
      R(x + 2, y + 2, w - 4, 2, '#a88050'); R(x + 4, y + 4, 3, s.h - 8, '#6a4a2a'); R(x + w - 7, y + 4, 3, s.h - 8, '#6a4a2a');
    }
    return;
  }
  if (s.k === 'f') {
    g.fillStyle = pats.panel; g.fillRect(x, y + 8, w, H - y);
    R(x, y, w, 2, '#e8c890'); R(x, y + 2, w, 6, '#a3111f'); R(x, y + 3, w, 1, '#d84a4a'); R(x, y + 8, w, 2, '#2a1a10');
    R(x, y, 3, H - y, '#2a1a10'); R(x + w - 3, y, 3, H - y, '#2a1a10');
  } else if (s.k === 'b') {
    // стопка книг
    R(x, y, w, s.h, '#16161d');
    const cols = ['#b02a35', '#2f6fa8', '#4d8a4a', '#c9a24a', '#7a4fa0', '#e8e4d0'];
    for (let yy = 0, i = Math.round(x / 7); yy < s.h - 2; yy += 10, i++) { const ins = (i * 3) % 5; R(x + 2 + ins % 3, y + 2 + yy, w - 4 - ins % 3, 8, cols[i % cols.length]); R(x + 6 + ins, y + 5 + yy, Math.min(26, w - 16), 2, '#f3e6c0'); }
  } else {
    R(x, y, w, 12, '#16161d'); R(x + 1, y, w - 2, 2, '#e8c890'); R(x + 1, y + 2, w - 2, 8, '#7a5432'); R(x + 1, y + 2, w - 2, 1, '#9a6a42');
    for (let i = 6; i < w - 4; i += 14) R(x + i, y + 5, 8, 3, ['#b02a35', '#2f6fa8', '#c9a24a'][(i / 14 | 0) % 3]);
    R(x + 4, y + 12, 3, 5, '#16161d'); R(x + w - 7, y + 12, 3, 5, '#16161d');
    if (s.mv) { R(x + w / 2 - 5, y + 12, 10, 4, '#16161d'); R(x + w / 2 - 3, y + 13, 6, 2, (gameT * 6 | 0) % 2 ? '#39e0d0' : '#1a7f78'); }
  }
}
function drawSpikes(x, y, w) { for (let i = 0; i < w; i += 10) { g.fillStyle = '#141a2c'; g.beginPath(); g.moveTo(x + i - 1, y + 13); g.lineTo(x + i + 5, y - 2); g.lineTo(x + i + 11, y + 13); g.fill(); g.fillStyle = '#cfd8e6'; g.beginPath(); g.moveTo(x + i + 1, y + 12); g.lineTo(x + i + 5, y + 2); g.lineTo(x + i + 9, y + 12); g.fill(); R(x + i + 4, y + 4, 1, 6, '#fff'); } }
const zapOn = z => ((gameT + z.ph) % z.per) < 1.05;
const zapWarn = z => { const t = (gameT + z.ph) % z.per; return t > z.per - .45; };
function drawZap(z) {
  R(z.x - 9, z.y0 - 2, 18, 10, '#141a2c'); R(z.x - 7, z.y0, 14, 6, '#566a92'); R(z.x - 9, z.y1 - 8, 18, 8, '#141a2c'); R(z.x - 7, z.y1 - 6, 14, 5, '#566a92');
  if (zapOn(z)) {
    for (let y = z.y0 + 8; y < z.y1 - 8; y += 6) { const o = rint(-3, 3); R(z.x - 4 + o, y, 8, 6, 'rgba(60,220,255,.45)'); R(z.x - 1 + o, y, 3, 6, '#eaffff'); }
    R(z.x - 3, z.y0 + 4, 6, 4, '#eaffff'); R(z.x - 3, z.y1 - 10, 6, 4, '#eaffff');
  } else if (zapWarn(z) && (gameT * 20 | 0) % 2) R(z.x, z.y0 + 8, 1, z.y1 - z.y0 - 16, '#39e0d0');
  R(z.x - 2, z.y0 + 2, 4, 2, zapOn(z) || zapWarn(z) ? '#ff4d4d' : '#39e0d0');
}
function drawCase(c, dim) {
  const img = caseSpr[c.ci][c.open ? 1 : 0], s = c.scale || c.s || 1;
  const w = Math.round(32 * s), h = Math.round(36 * s), by = c.bump > 0 ? Math.round(Math.sin(c.bump / .2 * Math.PI) * -6) : 0;
  if (dim) g.globalAlpha = .5;
  g.drawImage(img, Math.round(c.x - w / 2), Math.round(c.y - h + by), w, h);
  if (dim) { g.globalAlpha = 1; }
}
function drawSign(s) {
  const h = s.lines.length * 15 + 12;
  R(s.x + s.w / 2 - 3, s.y + h, 6, L.fy - s.y - h, '#141a2c'); R(s.x + s.w / 2 - 1, s.y + h, 2, L.fy - s.y - h, '#566a92');
  R(s.x - 2, s.y - 2, s.w + 4, h + 4, '#141a2c'); R(s.x, s.y, s.w, h, '#10243a'); R(s.x, s.y, s.w, 2, '#39e0d0'); R(s.x, s.y + h - 2, s.w, 2, '#1a7f78');
  s.lines.forEach((ln, i) => T(ln, s.x - camR + s.w / 2, s.y + 14 + i * 15, { size: 8, color: i === 0 && s.lines.length > 1 && ln.endsWith(':') ? '#ffe36b' : '#bff7ee' }));
}
function drawCheck(c) {
  // стенд с книгой: сохранение
  R(c.x - 2, L.fy - 58, 4, 58, '#141a2c'); R(c.x - 1, L.fy - 58, 2, 58, '#8fa3c7');
  R(c.x - 11, L.fy - 76, 22, 20, '#141a2c'); R(c.x - 9, L.fy - 74, 18, 16, c.on ? '#3ddc6a' : '#7a1c28'); R(c.x - 6, L.fy - 71, 12, 10, c.on ? '#c9ffd6' : '#c2444f');
}
function drawGate() {
  if (L.theme === 'dk') return drawDkGate();
  if (L.theme === 'slop') return drawSlopGate();
  if (THEME[L.theme] && THEME[L.theme].gate) return THEME[L.theme].gate();
  const x = L.gateX, o = Math.round(L.gate * 118);
  R(x - 12, FY - 150, 94, 150, '#141a2c'); R(x - 8, FY - 146, 86, 146, '#3d4a3a'); R(x - 8, FY - 146, 86, 3, '#8fb07f');
  R(x, FY - 122, 70, 122, '#0b0712');
  for (let y = 0; y < 122 - o; y += 8) { R(x, FY - 122 + y, 70, 7, '#6e4a2a'); R(x, FY - 122 + y, 70, 2, '#8a6440'); }
  R(x + 24, FY - 140, 22, 10, '#e8e4d0'); R(x + 27, FY - 137, 16, 1, '#16161d'); R(x + 27, FY - 134, 12, 1, '#16161d');
  T('ПРИЁМНАЯ', x + 35 - camR, FY - 160, { size: 8, color: '#ff6b6b', stroke: '#16161d' });
}
function drawGib(q) {
  const x = Math.round(q.x), y = Math.round(q.y);
  if (q.k === 'sheet') { spr('sheet', x, y + 2, false, { rot: q.rot, sx: q.sc }); return; }
  if (q.k === 'case') { g.save(); g.translate(x, y - 10); g.rotate(q.rot); g.drawImage(caseSpr[q.ci][0], -11, -13, 22, 25); g.restore(); return; }
  g.save(); g.translate(x, y - 4); g.rotate(q.rot); g.scale(q.sc || 1, q.sc || 1);
  if (q.k === 'bolt') { g.fillStyle = '#16161d'; g.fillRect(-4, -4, 8, 8); g.fillStyle = '#a8b0c0'; g.fillRect(-3, -3, 6, 6); g.fillStyle = '#5a6278'; g.fillRect(-1, -1, 2, 2); }
  if (q.k === 'sock') { g.fillStyle = '#16161d'; g.fillRect(-3, -7, 7, 12); g.fillRect(-3, 1, 10, 6); g.fillStyle = q.c; g.fillRect(-2, -6, 5, 10); g.fillRect(-2, 2, 8, 4); g.fillStyle = '#fff'; g.fillRect(-2, -6, 5, 2); }
  g.restore();
}
function drawAgent(a) {
  if (a.dead || !inView(a.x, 90)) return;
  const pre = a.pre || (a.robo ? 'r' + (a.v % 2) + '_' : 'a' + a.v + '_');
  let name = pre + 'idle', ox = 0, oy = 0, flip = a.face < 0;
  if (a.ko > 0) {
    if (a.fin === 'launch') { spr(pre + 'ko', a.x, a.y, a.koDir < 0, { sx: a.scale, rot: a.rot }); return; }
    spr(pre + ((gameT * 10 | 0) % 2 ? 'run0' : 'run1'), a.x, a.y - Math.abs(Math.sin(gameT * 20)) * 4, a.koDir < 0, { sx: a.scale });
    return;
  }
  if (a.awe) { name = pre + 'scared'; ox = (gameT * 40 | 0) % 2 ? 1 : -1; }
  else if (a.throwA > 0) name = pre + 'throw';
  else if (a.state === 'flee' || a.state === 'walk') { name = pre + ((a.t * (a.state === 'flee' ? 9 : 5) | 0) % 2 ? 'run0' : 'run1'); oy = -Math.abs(Math.sin(a.t * 14)) * 3; }
  else if (a.state === 'scared' || a.state === 'corner' || a.state === 'offer') { name = pre + 'give'; oy = a.state === 'offer' ? -Math.abs(Math.sin(a.t * 5)) * 2 : 0; }
  else { const ph = a.t % 2.6; if (ph < .3) oy = -Math.sin(ph / .3 * Math.PI) * 3; }
  spr(name, a.x + ox, a.y + oy, flip, { sx: a.scale });
  if (a.sign) {
    const sx = a.x + (flip ? 14 : -14);
    R(sx - 1, a.y - 98, 2, 50, '#6e3d1c'); R(sx - 24, a.y - 116, 48, 20, '#16161d'); R(sx - 22, a.y - 114, 44, 16, '#fff');
    T(a.sign, sx - camR, a.y - 105, { size: 8, color: '#d81b2a' });
  }
}
function drawBubbles() {
  for (const a of L.agents) if (a.bub && !a.dead && inView(a.x, 20)) bubble(a.bub.s, a.x - camR, a.y - 84 * a.scale - 4, { size: 8, max: 17, prio: 1 });
  if (P.bub) bubble(P.bub.s, P.x - camR, P.y - (P.crouch ? 70 : 96), { prio: 4, size: 10, max: 14, bg: '#e9f1ff', color: '#1b2a6b' });
}
