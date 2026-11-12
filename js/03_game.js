// ---------- player ----------
const DEATH = {
  blurb: ['РЕПУТАЦИЯ ВСЁ', 'на обложке пять блёрбов от иноагентов'],
  word: ['ОБВИНЁН В ГРАНТАХ', 'пост уже набрал три лайка'],
  folder: ['ПРОВЕРКА НАЗНАЧЕНА', 'ответ придёт через 30 дней'],
  misc: ['ПЕЛЕВИН ПАЛ', 'иноагенты пишут некролог. с блёрбом']
};
function hurtPlayer(dir, pit, kind) {
  if (mode !== 'play' || (P.inv > 0 && !pit)) return;
  P.hp--; stats.hits++; chain = 0; sfx.hurt(); shake = Math.max(shake, 7); flash = Math.max(flash, .25); P.lastHit = kind || 'blurb';
  if (P.hp <= 0) { mode = 'dead'; modeT = 0; P.vy = -420; P.vx = dir * 90; stats.deaths++; stopSong(); P.bub = null; return; }
  P.inv = 1.5; P.atk = 0;
  if (pit) { P.x = P.safeX; P.y = P.safeY; P.vx = P.vy = 0; say(P, pick(['ЯМА?!', 'КТО ТАК ВЕРСТАЕТ', 'НУ ВОТ…']), 1.2); }
  else { P.hurtT = .34; P.vx = dir * 175; P.vy = -280; P.onGround = false; say(P, pick(kind === 'ghost' ? ['НЕ НАДО СТИХОВ!', 'Я ВАС НЕ ЗВАЛ!', 'ИЗЫДИ!'] : kind === 'zhal' || kind === 'donos' ? ['ЗА ЧТО?!', 'Я НИЧЕГО НЕ ПИСАЛ!', 'КАКОЙ НАЦИСТ?!'] : kind === 'word' ? ['КАКИЕ ГРАНТЫ?!', 'Я НЕ ПРИЛЕПИН!', 'ЭТО НЕ Я!'] : kind === 'folder' ? ['ЗА ЧТО?!', 'Я НИЧЕГО НЕ ПОДПИСЫВАЛ', 'ОЙ!'] : ['НЕТ!', 'НА ОБЛОЖКУ НЕ НАДО!', 'УБЕРИТЕ!', 'Я ЕГО НЕ ЗНАЮ!']), .9); }
}
function attackHits() {
  const x0 = P.face > 0 ? P.x - 10 : P.x - 68, x1 = x0 + 78, y0 = P.y - 96, y1 = P.y + 8;
  for (const a of L.agents) {
    if (a.dead || a.ko > 0 || P.atkSet.has(a)) continue;
    const hw = 13 * a.scale;
    if (a.x + hw > x0 && a.x - hw < x1 && a.y > y0 && a.y - 70 * a.scale < y1) { P.atkSet.add(a); hitAgent(a, P.face); }
  }
  // отбить блёрб или заявление обратно
  for (const b of blurbs) {
    if (b.back || P.atkSet.has(b)) continue;
    if (b.x > x0 - 10 && b.x < x1 + 10 && b.y > y0 - 10 && b.y < y1) {
      P.atkSet.add(b); b.back = true; b.vx = P.face * 460; b.vy = -30; b.g = 0; b.t = 0; stats.deflected++;
      sfx.paper(); sfx.bonk(); hitstop = .04;
      floater(b.paper ? 'ВОЗВРАТ!' : pick(['ВОЗВРАТ!', 'НЕ НАДО!', 'ОТКАЗ!']), b.x, b.y - 24, { color: '#7fe08a', size: 11, t: .6, vy: -50 });
    }
  }
  for (const w of words) if (!P.atkSet.has(w) && Math.abs(w.x - (x0 + x1) / 2) < 50 && w.y > y0 && w.y < y1) { P.atkSet.add(w); floater('СЛОВО НЕ ВОРОБЕЙ', w.x, w.y - 20, { color: '#ffd0e8', size: 8, t: 1 }); }
  if (mir && !P.atkSet.has(mir) && mir.x + 16 > x0 && mir.x - 16 < x1 && mir.y > y0 && mir.y - 74 < y1) { P.atkSet.add(mir); mirPoked(); }
  for (const c of L.cases) {
    if (c.open || c.fall || P.atkSet.has(c)) continue;
    if (c.x + 14 > x0 && c.x - 14 < x1 && c.y > y0 && c.y - 30 < y1) { P.atkSet.add(c); openCase(c, P.face); sfx.bonk(); }
  }
  if (L.dark) dkAttack(x0, x1, y0, y1);
  if (boss && L.boss && boss.kind === 'deg') degMelee(x0, x1, y0, y1);
  else if (boss && L.boss && !boss.dead && !P.atkSet.has(boss) && boss.x + 40 > x0 && boss.x - 40 < x1 && boss.y > y0 && boss.y - 120 < y1) { P.atkSet.add(boss); meleeBoss(); }
}
const IDLE_LINES = {
  phone: ['ТАК… РЕЕСТР ОБНОВИЛСЯ', 'ПЯТНИЦА. ПРОВЕРЯЮ РЕЕСТР', 'ФУХ. НИКОГО ИЗ ЗНАКОМЫХ', 'ОПЯТЬ ПОЛОВИНА КОЛЛЕГ', 'ЛАЙКНУЛ БЫ, НО НЕТ'],
  write: ['ГЛАВА 12…', 'ПИШУ. БЕЗ БЛЁРБОВ', 'ТАК, ГДЕ ТУТ СЮЖЕТ', 'НОВЫЙ РОМАН. ЧИСТЫЙ', 'ВЫЧЕРКНУТЬ ПОСВЯЩЕНИЕ']
};
function updatePlayer(dt, ctrl) {
  if (P.bub) { P.bub.t -= dt; if (P.bub.t <= 0) P.bub = null; }
  P.inv = Math.max(0, P.inv - dt); P.emoteT = Math.max(0, P.emoteT - dt);
  if (P.hurtT > 0) { P.hurtT -= dt; ctrl = false; }
  P.crouch = ctrl && down('D') && P.onGround && P.atk <= 0; P.h = P.crouch ? 48 : 76;
  let ax = 0; if (ctrl) { if (down('L')) ax -= 1; if (down('R')) ax += 1; }
  const acc = P.onGround ? 1900 : 1300;
  if (ax) { const mv = P.crouch ? 80 : 190; P.vx = clamp(P.vx + ax * acc * dt, -mv, mv); if (P.atk <= 0) P.face = ax; }
  else { const fr = (P.onGround ? 2300 : 420) * dt; if (Math.abs(P.vx) <= fr) P.vx = 0; else P.vx -= sign(P.vx) * fr; }
  if (P.atk > 0 && P.onGround) P.vx *= Math.pow(0.002, dt);
  P.coyote = P.onGround ? .1 : Math.max(0, P.coyote - dt);
  if (ctrl && hit('J')) P.jbuf = .13; else P.jbuf = Math.max(0, P.jbuf - dt);
  if (P.jbuf > 0 && P.coyote > 0) { P.vy = -530; P.jbuf = 0; P.coyote = 0; P.onGround = false; sfx.jump(); burst(P.x, P.y, 5, ['#cfd8e6', '#8fa3c7'], 70, .3); }
  if (ctrl && !down('J') && P.vy < -190 && P.hurtT <= 0) P.vy = -190;
  if (ctrl && hit('A') && P.atk <= 0) { P.atk = ATK_T; P.atkSet = new Set(); sfx.swing(); }
  if (P.atk > 0) {
    const e = ATK_T - P.atk; P.atk -= dt;
    if (e >= .04 && e < .2) attackHits();
  }
  P.vy = Math.min(900, P.vy + GRAV * dt);
  const wasG = P.onGround;
  collide(P, dt);
  if (!wasG && P.onGround) burst(P.x, P.y, 4, ['#cfd8e6', '#8fa3c7'], 60, .25);
  // простой: проверяет реестр или пишет роман
  if (P.onGround && Math.abs(P.vx) < 6 && P.atk <= 0 && !ax && ctrl && !P.crouch) {
    P.idleT += dt;
    if (P.idleT > 3.5) {
      if (!P.idleAnim) { P.idleAnim = Math.random() < .5 ? 'phone' : 'write'; P.idleA = 0; P.wigT = 0; }
      P.idleA += dt; P.wigT -= dt;
      if (P.wigT <= 0) { P.wigT = rnd(3, 4.2); say(P, pick(IDLE_LINES[P.idleAnim]), 1.8); if (P.idleAnim === 'write') sfx.typewriter(); else sfx.blip2(); }
      if (P.idleA > 9) { P.idleAnim = P.idleAnim === 'phone' ? 'write' : 'phone'; P.idleA = 0; P.wigT = 0; }
    }
  } else { P.idleT = 0; P.idleAnim = ''; }
  if (P.onGround && Math.abs(P.vx) > 30) { const st = P.runT * 4.5 | 0; P.runT += dt; if ((P.runT * 4.5 | 0) !== st && !P.crouch) parts.push({ k: 'p', x: P.x - P.face * 8, y: P.y - 2, vx: -P.face * rnd(20, 50), vy: -rnd(10, 40), s: 2, c: '#8fa3c7', life: .3, g: 0 }); } else P.runT = 0;
  const s = P.ground;
  if (P.onGround && s && s.k !== 'p') { const m = Math.min(26, s.w / 2); P.safeX = clamp(P.x, s.x + m, s.x + s.w - m); P.safeY = s.y; }
  if (P.y > H + 70) hurtPlayer(0, true, 'misc');
}
function drawPlayer() {
  let name = 'p_idle', ox = 0, oy = 0, flip = P.face < 0;
  const laughFr = t => (t / .13 | 0) % 2 ? 'p_laugh2' : 'p_laugh1';
  if (mode === 'celebrate') {
    const t = cele.t, k = cele.kind;
    if (k === 'laugh') { name = laughFr(t); oy = (t / .065 | 0) % 2 ? -2 : 0; }
    else if (k === 'proud') { name = 'p_proud'; oy = -Math.abs(Math.sin(t * 5)) * 5; }
    else { const q = (t / .22 | 0); name = q % 2 ? 'p_dance2' : 'p_dance1'; if ((q / 2 | 0) % 2) flip = !flip; oy = -Math.abs(Math.sin(t * 14.3)) * 6; }
  }
  else if (mode === 'bossdeath' && boss && boss.won) { name = 'p_proud'; oy = -Math.abs(Math.sin(gameT * 6)) * 3; }
  else if (mode === 'dead' || P.hurtT > 0) name = 'p_hit';
  else if (P.atk > 0) name = (ATK_T - P.atk) < .06 ? 'p_wind' : 'p_smash';
  else if (!P.onGround) name = 'p_jump';
  else if (P.crouch) { if (Math.abs(P.vx) > 20) { name = (P.runT * 7 | 0) % 2 ? 'p_crouch2' : 'p_crouch'; oy = (P.runT * 14 | 0) % 2 ? -1 : 0; } else name = 'p_crouch'; }
  else if (Math.abs(P.vx) > 30) name = 'p_r' + ((P.runT * 10 | 0) % 4);
  else if (P.idleAnim && mode === 'play') { name = 'p_' + P.idleAnim; if (P.idleAnim === 'write') oy = (gameT * 8 | 0) % 2 ? -1 : 0; }
  if (P.inv > 0 && P.hurtT <= 0 && mode === 'play' && (P.inv * 18 | 0) % 2) return;
  if (name === 'p_idle' && mode === 'play') oy = (gameT * 1.6 | 0) % 2 ? -1 : 0;
  spr(name, P.x + ox, P.y + oy, flip);
  if (P.atk > 0) { const e = ATK_T - P.atk; if (e > .05 && e < .17) { g.globalAlpha = .75 * (1 - (e - .05) / .12); g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); const cx = P.x + P.face * 8, cy = P.y - 44; if (P.face > 0) g.arc(cx, cy, 48, -1.9, .8); else g.arc(cx, cy, 48, Math.PI - .8, Math.PI + 1.9); g.stroke(); g.globalAlpha = 1; } }
}

// ---------- hazards, cases, triggers ----------
function updateWorld(dt) {
  for (const s of L.movers) {
    const dx = s.mv.sp * s.mv.d * dt; s.x += dx;
    if (s.x > s.mv.x1) { s.x = s.mv.x1; s.mv.d = -1; } if (s.x < s.mv.x0) { s.x = s.mv.x0; s.mv.d = 1; }
    if (P.ground === s && P.onGround) P.x += dx;
  }
  for (const c of L.cases) {
    c.bump = Math.max(0, c.bump - dt);
    if (c.fall) {
      c.vy += 1100 * dt; c.x += (c.vx || 0) * dt; c.y += c.vy * dt;
      const s = solidAt(c.x, c.y);
      if (s && c.vy > 0) {
        c.y = s.y; c.fall = false; c.vy = 0; c.vx = 0;
        if (c.fallen) { sfx.thud(); shake = Math.max(shake, 9); burst(c.x, c.y, 14, ['#cfd8e6', '#8fa3c7'], 150, .5); say(P, '?!', 1.1); floater('ЧЕМОДАН. С НЕБА. С ВИЗОЙ.', c.x, c.y - 70, { size: 8, t: 1.8 }); }
      }
    }
  }
  if (!L.boss) {
    for (const sp of L.spikes) if (P.x + 9 > sp.x && P.x - 9 < sp.x + sp.w && P.y > sp.y + 2 && P.y - P.h < sp.y + sp.h) hurtPlayer(P.x < sp.x + sp.w / 2 ? -1 : 1, false, 'misc');
    for (const z of L.zaps) {
      const on = zapOn(z);
      if (on && !z.was && inView(z.x)) sfx.zap(); z.was = on;
      if (on && Math.abs(P.x - z.x) < 15 && P.y > z.y0 && P.y - P.h < z.y1) hurtPlayer(P.x < z.x ? -1 : 1, false, 'misc');
    }
    for (const c of L.checks) if (!c.on && P.x > c.x) { c.on = true; L.lastCheck = c; sfx.ok(); floater('СОХРАНЕНО', c.x, FY - 96, { color: '#3ddc6a', size: 9, t: 1.4 }); if (P.hp < P.maxhp) P.hp++; }
    if (!mirSeen && L.mirX && P.x > L.mirX && P.onGround && !mir) startMir();
    if (!fallCase && L.fallX && P.x > L.fallX) { fallCase = true; const c = mkCase(P.x + 170, -40, 'agent', 2, 1, true); c.fall = true; c.fallen = true; L.cases.push(c); }
    if (P.x > L.gateX - 50 && P.onGround && (!L.gateY || P.y <= L.gateY + 1)) { mode = 'gate'; modeT = 0; sfx.gate(); P.atk = 0; mir = null; words = []; }
    walkerT -= dt;
    if (!walker && walkerT <= 0) { const d = Math.random() < .5 ? 1 : -1; walker = { x: d > 0 ? cam - 30 : cam + W + 30, d, ci: rint(0, 4) }; }
    if (walker) { walker.x += walker.d * 105 * dt; if (walker.x < cam - 60 || walker.x > cam + W + 60) { walker = null; walkerT = rnd(14, 26); } }
  }
  if (chainT > 0) { chainT -= dt; if (chainT <= 0) chain = 0; }
  if (pendingCele && P.onGround && !L.agents.some(a => a.ko > 0)) startCelebrate();
  if (letterT > 0) letterT -= dt;
  if (!L.boss) {
    look += (P.face * 60 - look) * Math.min(1, dt * 2.5);
    const tx = clamp(P.x - W * .45 + look, 0, L.w - W); cam += (tx - cam) * Math.min(1, dt * 7);
  } else cam = 0;
}

// ---------- Анастасия Миронова ----------
// Может появиться в любой момент. Кричит про гранты, слова летят низко (прыгай) или высоко (садись).
const MIR_SHOUT = ['ПРИЛЕПИНСКИЕ ГРАНТЫ!!!', 'ОТКУДА ДЕНЬГИ, САША?!', 'Я ВСЁ ПОСЧИТАЛА!', 'ПРИЛЕПИНСКИЕ! ГРАНТЫ!', 'ЭТО ПОЙДЁТ В ПОСТ!', 'КТО ВАМ ДАЛ ГРАНТ?!', 'ГРАНТЫ! Я ЗНАЮ ПРО ГРАНТЫ!'];
const MIR_WORDS = ['ГРАНТЫ!', 'ПРИЛЕПИН!', 'МИЛЛИОНЫ!', 'ГРАНТЫ!!!', 'ПФКИ!', 'КТО ДАЛ?!', 'СКОЛЬКО?!', 'ОТЧЁТ!'];
const MIR_HIT = ['НАПАДЕНИЕ НА ЖУРНАЛИСТКУ!', 'ЭТО ПОЙДЁТ В ПОСТ!', 'СКРИНШОТ СДЕЛАН!', 'ТАК И ЗАПИШУ: ГРАНТЫ И АГРЕССИЯ', 'ВЫ МНЕ УГРОЖАЕТЕ КНИГОЙ?!'];
const MIR_BYE = ['пойду напишу пост', 'продолжение в телеграме', 'я ещё вернусь. с цифрами', 'подписывайтесь на канал', 'грантам — бой!'];
function startMir() {
  if (mir) return;
  let side, stop;
  if (L.boss) { side = P.x < W / 2 ? 1 : -1; stop = side > 0 ? W - 64 : 64; }
  else {
    side = P.face > 0 ? 1 : -1; stop = P.x + side * 250;
    for (let k = 0; k < 30 && !groundBelow(stop, FY); k++) stop -= side * 16;
    stop = clamp(stop, cam + 50, cam + W - 50);
  }
  mir = { x: L.boss ? (side > 0 ? W + 60 : -60) : (side > 0 ? cam + W + 60 : cam - 60), y: L.fy, side, stop, st: 'in', t: 0, face: -side, bub: null, wT: .5, life: L.boss ? 9 : 6.5, hitCd: 0, shoutA: 0 };
  sfx.shout(); say(mir, 'ПРИЛЕПИНСКИЕ ГРАНТЫ!!!', 2.2);
  if (!mirSeen) { mirSeen = true; mirCard = 2.8; }
  if (boss && L.boss && !boss.dead) setTimeout(() => { if (boss && !boss.dead && mir) say(boss, 'ГРАНТЫ? ПРОШУ ПРОВЕРИТЬ ГРАНТЫ!', 2.4); }, 1400);
}
function mirPoked() {
  const m = mir; if (m.hitCd > 0) return;
  m.hitCd = 1; m.life += 2; stats.mirPoke++; shake = Math.max(shake, 5); sfx.shout();
  say(m, pick(MIR_HIT), 1.8); floater('ПОСТ +1', m.x, m.y - 110, { color: '#ff8a94', size: 9, t: 1.2 });
}
function updateMir(dt) {
  mirCard = Math.max(0, mirCard - dt);
  if (!mir) {
    if (!L.boss && (mirSeen || !L.mirX) && mode === 'play' && !isDark()) { mirT -= dt; if (mirT <= 0) startMir(); }
    return;
  }
  const m = mir; m.t += dt; m.hitCd -= dt; m.shoutA = Math.max(0, m.shoutA - dt);
  if (m.bub) { m.bub.t -= dt; if (m.bub.t <= 0) m.bub = null; }
  if (m.st === 'in') {
    m.face = -m.side; m.x -= m.side * 240 * dt;
    if ((m.x - m.stop) * m.side <= 0) { m.x = m.stop; m.st = 'shout'; m.t = 0; }
  } else if (m.st === 'shout') {
    m.face = sign(P.x - m.x); m.wT -= dt;
    if (m.wT <= 0) {
      m.wT = L.boss ? .9 : 1.05;
      const low = Math.random() < .5;
      words.push({ x: m.x + m.face * 34, y: m.y - (low ? 14 : 70), vx: m.face * (L.boss ? 270 : 240), s: pick(MIR_WORDS), t: 0 });
      m.shoutA = .3; sfx.shout();
      if (!m.bub && Math.random() < .55) say(m, pick(MIR_SHOUT), 1.6);
    }
    m.life -= dt; if (m.life <= 0) { m.st = 'out'; say(m, pick(MIR_BYE), 2); }
  } else {
    m.face = m.side; m.x += m.side * 200 * dt;
    if (L.boss ? (m.x < -80 || m.x > W + 80) : !inView(m.x, 100)) { mir = null; mirT = rnd(40, 65); }
  }
}
function updateWords(dt) {
  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i]; w.x += w.vx * dt; w.t += dt;
    const hw = w.s.length * 5.5 + 4;
    if (mode === 'play' && Math.abs(w.x - P.x) < hw + 6 && w.y + 6 > P.y - P.h && w.y - 6 < P.y && P.inv <= 0) {
      floater('«' + pick(['ПРИЛЕПИНСКИЙ ГРАНТ', 'СИДИТ НА ГРАНТАХ', 'ГРАНТОЕД']) + '» — пост', P.x, P.y - 110, { color: '#ff8a94', size: 8, t: 2 });
      hurtPlayer(sign(w.vx), false, 'word'); words.splice(i, 1); continue;
    }
    if (w.t > 6 || (L.boss ? (w.x < -100 || w.x > W + 100) : !inView(w.x, 200))) words.splice(i, 1);
  }
}
function drawMir() {
  if (!mir) return;
  const m = mir; let name, oy = 0;
  if (m.st === 'shout') name = m.shoutA > 0 ? 'm_shout2' : 'm_shout';
  else { name = (m.t * 8 | 0) % 2 ? 'm_w0' : 'm_w1'; oy = -Math.abs(Math.sin(m.t * 16)) * 3; }
  if (m.hitCd > .6) name = 'm_huff';
  spr(name, m.x, m.y + oy, m.face < 0);
  if (m.shoutA > 0) for (let i = 0; i < 3; i++) { const r = 10 + i * 8 + (.3 - m.shoutA) * 60; g.strokeStyle = '#ffffff' + (i ? '88' : 'cc'); g.lineWidth = 2; g.beginPath(); g.arc(m.x + m.face * 26, m.y - 62, r, m.face > 0 ? -.6 : Math.PI - .6, m.face > 0 ? .6 : Math.PI + .6); g.stroke(); }
}
function drawWords() {
  for (const w of words) { const wob = Math.sin(w.t * 20) * 1.5; T(w.s, w.x - camR, w.y + wob, { size: 12, color: '#ff5b6b', stroke: '#16161d', sw: 4 }); }
}

// ---------- босс: Виталий Бородин ----------
const B_GREET = ['ВИТАЛИЙ БОРОДИН. ОБЩЕСТВЕННИК.', 'ПОСТУПИЛ СИГНАЛ.', 'ВАШ РОМАН ПРОВЕРЕН? НЕТ? ПРОВЕРИМ.', 'КТО ПИСАЛ ВАМ БЛЁРБЫ? ИМЕНА!', 'ПРИСАЖИВАЙТЕСЬ. ПОКА ЧТО.'];
const B_THROW = ['ПРОШУ ПРОВЕРИТЬ!', 'ЗАЯВЛЕНИЕ!', 'В ПРОКУРАТУРУ!', 'ЕЩЁ ОДНО!', 'И КОПИЮ!', 'ПРОШУ ДАТЬ ОЦЕНКУ!', 'ВХОДЯЩИЙ!'];
const B_DEMAND = ['ПРОШУ ПРОВЕРИТЬ ПРАВООХРАНИТЕЛЬНЫЕ ОРГАНЫ!', 'А КТО ПРОВЕРИТ ПРОВЕРЯЮЩИХ? Я!', 'ПРОШУ ПРОВЕРИТЬ ПРОКУРАТУРУ НА ПРЕДМЕТ ПРОВЕРКИ!', 'ВСЕ ОРГАНЫ — НА ПРОВЕРКУ!'];
const B_HURT = ['ЭТО ВОСПРЕПЯТСТВОВАНИЕ!', 'ЗАПИСЫВАЮ!', 'ВЫ ПОЖАЛЕЕТЕ. ПИСЬМЕННО!', 'НАРУШЕНИЕ!', 'Я ЭТО ОБЖАЛУЮ!', 'КАК ВАША ФАМИЛИЯ? А, ЗНАЮ', 'ПРОШУ ПРОВЕРИТЬ ЭТОТ УДАР!'];
const B_WRITE = ['ПИШУ ЗАЯВЛЕНИЕ…', 'ТАК… «ПРОШУ ПРОВЕРИТЬ…»', 'ИСХОДЯЩИЙ НОМЕР…', 'ПОДПИСЬ. ДАТА.', 'КОПИЯ — ГЕНПРОКУРОРУ…'];
const B_BLOCK = ['ПРОВЕРЕНО!', 'ОТКАЗАНО!', 'НЕ ПО ФОРМЕ!', 'ВХОДЯЩИЙ ЗАРЕГИСТРИРОВАН', 'В ПОРЯДКЕ ОЧЕРЕДИ!'];
const COUNTER = ['ЗАЯВЛЕНИЕ ЗАРЕГИСТРИРОВАНО', 'ПЕРЕНАПРАВЛЕНО ПО ПОДВЕДОМСТВЕННОСТИ', 'СРОК РАССМОТРЕНИЯ: 30 ДНЕЙ', 'ОТВЕТ: НАРУШЕНИЙ НЕ ВЫЯВЛЕНО', 'КНОПКА ПРОВЕРЕНА И ИЗЪЯТА'];
const AGENCIES = ['МВД', 'СК', 'ФСБ', 'ПРОКУРАТУРА', 'РКН', 'МИНЮСТ', 'ГИБДД', 'ФНС'];
function startBoss() {
  if (LEVELS[curLevel].bossKind === 'deg') return startDeg();
  L = buildBossLevel(); cam = 0; look = 0;
  parts = []; gibs = []; pickups = []; folders = []; floats = []; fxs = []; blurbs = []; words = []; mir = null;
  Object.assign(P, { x: 70, y: FYB, vx: 0, vy: 0, hp: P.maxhp, face: 1, inv: 0, hurtT: 0, atk: 0, onGround: true, idleT: 0, bub: null, clean: 0, crouch: false, h: 76, idleAnim: '', safeX: 70, safeY: FYB });
  boss = { x: 620, y: FYB, hp: 18, max: 18, name: 'Бородин', state: 'greet', t: 0, phase: 1, face: -1, inv: 0, fl: 0, bub: null, line: 0, dead: false, started: false, mercy: 0, mercyGone: 0, n: 0, pose: 0, walkTo: 0, mirDone: false };
  mode = 'play'; modeT = 0; scene = 'play'; chain = 0; pendingCele = false; stopSong();
  banner = { s: 'ОБЩЕСТВЕННАЯ ПРИЁМНАЯ', sub: 'вас уже ждут', t: 2.4 };
}
function bossBegin() { const b = boss; if (b.started) return; b.started = true; playSong('boss'); banner = null; b.state = 'throw'; b.t = 0; b.n = 0; }
function bossPaper() {
  const b = boss, x = b.x + b.face * 50, y = b.y - 118, tx = P.x, ty = P.y - 40;
  const dx = tx - x, vx = clamp(Math.abs(dx) / (b.phase === 3 ? .8 : 1), 200, 380) * sign(dx || 1), T = Math.abs(dx / vx), gr = 520;
  const vy = clamp((ty - y - .5 * gr * T * T) / Math.max(.3, T), -460, 220);
  blurbs.push({ x, y, vx, vy, g: gr, q: 'ЗАЯВЛЕНИЕ', from: b, back: false, t: 0, rot: 0, paper: true });
  b.pose = .3; sfx.paper();
}
function damageBoss(by) {
  const b = boss; if (b.dead || b.inv > 0 || mode !== 'play') return false;
  if (!b.started) bossBegin();
  b.hp--; b.inv = .45; b.fl = .25; hitstop = .07; shake = Math.max(shake, 8); sfx.stamp(); sfx.bonk();
  confetti(b.x, b.y - 90, 6, 180);
  floater(by === 'paper' ? pick(['ВОЗВРАЩЕНО БЕЗ РАССМОТРЕНИЯ', 'НЕ ПО АДРЕСУ', 'ВАМ ЖЕ И ОТВЕТ']) : pick(['ОТКАЗ!', 'НЕ ПРИНЯТО!', 'ИГНОР!']), b.x, b.y - 150, { color: '#ffe36b', size: 10, t: .9, vy: -40 });
  if (b.hp <= 0) { startBossDeath(); return true; }
  const np = b.hp <= 6 ? 3 : b.hp <= 12 ? 2 : 1;
  if (np !== b.phase) { b.phase = np; if (np === 3 && !b.mirDone) { b.mirDone = true; startMir(); } }
  if (!b.bub || Math.random() < .5) say(b, pick(B_HURT), 1.5);
  return true;
}
function meleeBoss() {
  const b = boss;
  if (b.state === 'greet' || b.state === 'write') { damageBoss('book'); return; }
  sfx.stamp(); floater(pick(B_BLOCK), b.x, b.y - 140, { color: '#8fdcff', size: 9, t: .9, vy: -40 });
  P.vx = -P.face * 200; P.vy = -160; P.onGround = false;
}
function updateBoss(dt) {
  if (boss && boss.kind === 'deg') return updateDeg(dt);
  const b = boss; if (!b || b.dead) return;
  b.t += dt; b.inv = Math.max(0, b.inv - dt); b.fl = Math.max(0, b.fl - dt); b.pose = Math.max(0, b.pose - dt);
  if (b.bub) { b.bub.t -= dt; if (b.bub.t <= 0) b.bub = null; }
  if (b.state !== 'walk') b.face = P.x < b.x ? -1 : 1;
  const ph = b.phase;
  switch (b.state) {
    case 'greet':
      if (b.t > 1.1 && !b.bub) { if (b.line >= B_GREET.length) { bossBegin(); break; } say(b, B_GREET[b.line++], 2.4); b.t = -1.4; sfx.blip2(); }
      break;
    case 'throw': {
      const cnt = ph === 1 ? 3 : ph === 2 ? 4 : 5, gap = ph === 1 ? .85 : ph === 2 ? .7 : .55;
      if (b.n < cnt && b.t > gap) { b.t = 0; b.n++; bossPaper(); if (!b.bub && Math.random() < .5) say(b, pick(B_THROW), 1.1); }
      if (b.n >= cnt && b.t > 1) { b.state = 'demand'; b.t = 0; b.n = 0; say(b, pick(B_DEMAND), 2.4); sfx.shout(); }
      break;
    }
    case 'demand': {
      const dur = ph === 1 ? 2.4 : 3, gap = ph === 1 ? .34 : ph === 2 ? .25 : .22;
      if (b.t > .9) { b.n += dt; if (b.n > gap) { b.n = 0; const x = Math.random() < .65 ? clamp(P.x + rnd(-150, 150), 26, W - 26) : rnd(26, W - 26); folders.push({ x, y: -24, vy: rnd(250, 320), lab: pick(AGENCIES) }); } }
      if (b.t > .9 + dur) { b.state = 'write'; b.t = 0; say(b, pick(B_WRITE), 2); }
      break;
    }
    case 'write':
      if ((b.t * 6 | 0) !== ((b.t - dt) * 6 | 0) && Math.random() < .4) sfx.typewriter();
      if (b.t > (ph === 1 ? 3 : ph === 2 ? 2.4 : 2)) { b.state = 'walk'; b.t = 0; b.walkTo = b.x > W / 2 ? rnd(150, 230) : rnd(570, 650); }
      break;
    case 'walk': {
      const d = sign(b.walkTo - b.x); b.face = d; b.x += d * 150 * dt;
      if ((b.walkTo - b.x) * d <= 0) { b.x = b.walkTo; b.state = 'throw'; b.t = 0; b.n = 0; }
      break;
    }
  }
  // не даёт пройти сквозь себя
  if (Math.abs(P.x - b.x) < 44 && P.y > b.y - 112) { P.x = clamp(b.x + (P.x < b.x ? -44 : 44), 22, W - 22); if (sign(P.vx) === sign(b.x - P.x)) P.vx = 0; }
  // папки-проверки
  for (let i = folders.length - 1; i >= 0; i--) {
    const f = folders[i]; f.y += f.vy * dt;
    if (mode === 'play' && Math.abs(f.x - P.x) < 20 && f.y > P.y - P.h - 2 && f.y - 18 < P.y) { floater('ПРОВЕРКА: ' + f.lab, P.x, P.y - 110, { color: '#8fdcff', size: 8, t: 1.6 }); hurtPlayer(sign(P.x - f.x || 1), false, 'folder'); f.y = 9999; }
    if (f.y >= FYB) { if (f.y < 9000) { burst(f.x, FYB - 2, 6, ['#f4f0e0', '#c9a24a'], 130, .4); if (Math.random() < .4) sfx.stamp(); } folders.splice(i, 1); }
  }
  // кнопка «встречное заявление»
  if (b.started && !b.mercyGone && mode === 'play') {
    const tap = hit('T') && Math.abs(tapX - W / 2) < 110 && tapY > H - 40;
    if (hit('S') || tap) { sfx.stamp(); shake = Math.max(shake, 4); floater(COUNTER[Math.min(b.mercy, COUNTER.length - 1)], W / 2, H - 62, { scr: true, color: '#8fdcff', size: 9, t: 1.8, vy: -14 }); b.mercy++; if (b.mercy >= COUNTER.length) { b.mercyGone = .01; sfx.thud(); } }
  }
  if (b.mercyGone) b.mercyGone += dt;
}
function startBossDeath() {
  const b = boss; mode = 'bossdeath'; modeT = 0; b.state = 'dying'; b.bub = null; stopSong(); folders = []; blurbs = []; words = []; P.atk = 0;
  if (mir) { mir.st = 'out'; say(mir, 'ВСЁ, ПИШУ ПРО ВАС ОБОИХ', 2.4); }
  sfx.shout();
  b.hatY = null; b.won = 0; b.left = false;
}
function updateBossDeath(dt) {
  if (boss.kind === 'deg') return updateDegDeath(dt);
  const b = boss; P.vx *= .9; P.vy = Math.min(900, P.vy + GRAV * dt); collide(P, dt);
  if (mir) updateMir(dt);
  if (!b.dead) {
    if (modeT < 2.4) { shake = Math.max(shake, 2 + modeT * 2); if ((modeT * 8 | 0) !== ((modeT - dt) * 8 | 0)) { confetti(b.x + rnd(-30, 30), b.y - rnd(60, 120), 2, 120); sfx.paper(); } }
    else {
      b.dead = true; confetti(b.x, b.y - 80, 60, 360); shake = 16; flash = .8; sfx.boom();
      memorial.push(['Виталий Бородин', 'ушёл проверять сам себя']);
    }
  } else if (!b.left) {
    b.x += 140 * dt; b.face = 1; if (!b.bub && b.x < W) say(b, 'ПОЙДУ НАПИШУ НА СЕБЯ…', 2.4);
    if (b.x > W + 90) b.left = true;
  } else if (b.hatY === null) { b.hatY = -70; b.hatV = 0; }
  else if (!b.won) {
    b.hatV += 900 * dt; b.hatY += b.hatV * dt;
    if (b.hatY >= P.y - 60) { b.won = .001; P.clean = 1; sfx.thud(); shake = 8; playSong('win'); burst(P.x, P.y - 80, 20, ['#fff', '#ffe36b'], 200, .7); }
  } else {
    b.won += dt;
    if (b.won > 3.4 && mode === 'bossdeath') { cele.n = 99; startCelebrate(); cele.title = 'ПЕЛЕВИН'; cele.kind = 'dance'; L.after = true; }
  }
}
function drawBoss() {
  const b = boss; if (!b || !L.boss || b.kind === 'deg') return;
  for (const f of folders) { const k = clamp(f.y / FYB, 0, 1), w = 6 + k * 16; R(f.x - w / 2, FYB + 1, w, 2, (gameT * 16 | 0) % 2 ? '#ff5b6b' : '#ffd0d6'); }
  const vis = !b.dead || (b.x < W + 80 && b.state === 'dying');
  if (vis) {
    let name = 'b_stand', ox = 0, oy = 0;
    if (b.state === 'dying' && !b.dead) { name = (modeT * 6 | 0) % 2 ? 'b_raise' : 'b_write'; ox = rnd(-3, 3) * Math.min(1, modeT); }
    else if (b.dead) { name = (gameT * 7 | 0) % 2 ? 'b_walk0' : 'b_walk1'; oy = -Math.abs(Math.sin(gameT * 14)) * 3; }
    else if (b.fl > 0) { name = 'b_hurt'; ox = (gameT * 40 | 0) % 2 ? 3 : -3; }
    else if (b.state === 'walk') { name = (b.t * 6 | 0) % 2 ? 'b_walk0' : 'b_walk1'; oy = -Math.abs(Math.sin(b.t * 12)) * 3; }
    else if (b.state === 'throw') name = b.pose > 0 ? 'b_throw' : 'b_point';
    else if (b.state === 'demand') { name = 'b_raise'; oy = b.t < .9 ? -Math.abs(Math.sin(b.t * 12)) * 3 : 0; }
    else if (b.state === 'write') name = 'b_write';
    else oy = -Math.abs(Math.sin(gameT * 3)) * 2;
    const flip = b.face < 0;
    g.globalAlpha = .3; R(b.x - 40, FYB - 2, 80, 5, '#000'); g.globalAlpha = 1;
    spr(name, b.x + ox, b.y + oy, flip);
    if (b.fl > .12) spr(name, b.x + ox, b.y + oy, flip, { img: atlasW, a: .7 });
    if (b.state === 'write' && !b.dead) T('ПИШЕТ…', b.x - camR, b.y - 140 - (gameT * 2 % 1) * 6, { size: 8, color: '#7fe08a', stroke: '#16161d' });
    if (b.bub) bubble(b.bub.s, b.x, b.y - 136, { prio: 5, size: 10, max: 18, shake: b.fl > 0 ? 2 : 0, color: b.fl > 0 ? '#a3111f' : '#16161d' });
  }
  for (const f of folders) { const x = Math.round(f.x), y = Math.round(f.y); spr('folderp', x, y, false); T(f.lab, x - camR, y - 8, { size: 6, color: '#16161d' }); }
  if (b.hatY !== null && b.hatY !== undefined && !b.won) spr('copy', P.x, b.hatY, false, { sx: 2, rot: Math.sin(gameT * 5) * .25 });
  if (b.state === 'dying' && !b.dead) {
    const s = 'ПРОШУ ПРОВЕРИТЬ… МЕНЯ?!', n = Math.min(s.length, (modeT * 12 | 0));
    T(s.slice(0, n), W / 2 + rnd(-2, 2), 110 + rnd(-2, 2), { size: 20 + modeT * 3, color: '#fff', stroke: '#1b2a6b', sw: 6 });
  }
}
function drawBossHud() {
  const b = boss; if (!b || !L.boss || !b.started) return;
  if (b.kind === 'deg') return drawDegHud();
  if (!b.dead) {
    T('ВИТАЛИЙ БОРОДИН', W / 2, 16, { size: 9, color: '#8fdcff', stroke: '#16161d' });
    OV.push(c => { c.fillStyle = '#16161d'; c.fillRect(W / 2 - 152, 26, 304, 12); const sw = 300 / b.max; for (let i = 0; i < b.max; i++) { c.fillStyle = i < b.hp ? (b.phase === 3 ? '#ff5b6b' : b.phase === 2 ? '#ffb35b' : '#8fdcff') : '#2a3350'; c.fillRect(W / 2 - 150 + i * sw, 28, sw - 2, 8); } });
    if (!b.mercyGone || b.mercyGone < 1.2) {
      const dy = b.mercyGone ? b.mercyGone * b.mercyGone * 400 : 0, rot = b.mercyGone ? b.mercyGone * 1.4 : 0, cr = b.mercy;
      OV.push(c => { c.save(); c.translate(W / 2, H - 22 + dy); c.rotate(rot); c.fillStyle = '#16161d'; c.fillRect(-114, -13, 228, 26); c.fillStyle = '#1b2a6b'; c.fillRect(-112, -11, 224, 22); c.fillStyle = '#8fdcff'; c.fillRect(-112, -11, 224, 2); c.font = '8px PS2P,monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#eaf6ff'; c.fillText((TOUCH ? '' : 'ENTER: ') + 'ВСТРЕЧНОЕ ЗАЯВЛЕНИЕ', 0, 1); c.fillStyle = '#ff5b6b'; for (let i = 0; i < cr; i++) c.fillRect(-100 + i * 46, -9, 6, 6); c.restore(); });
    }
  }
}

// ---------- scene flow ----------
function fadeTo(cb) { if (fadeDir === 1) return; fadeDir = 1; fadeCb = cb; }
// какие уровни открыты, запоминается в браузере
// OPEN — сколько уровней открыто сразу, без прохождения; passed — докуда игрок дошёл сам
const OPEN = 2;
let passed = 1, unlocked = OPEN, curLevel = 0;
try { passed = Math.max(1, +localStorage.getItem('pelevin_unlocked') || 1); } catch (e) { }
unlocked = Math.max(OPEN, passed);
function unlockNext() { passed = Math.max(passed, curLevel + 2); unlocked = Math.max(unlocked, passed); try { localStorage.setItem('pelevin_unlocked', String(passed)); } catch (e) { } }
function newGame() {
  nameI = 0; NAMES.sort(() => Math.random() - .5);
  stats = { ghosts: 0, copies: 0, relocated: 0, cases: 0, casesTotal: 0, deflected: 0, got: 0, best: 0, hits: 0, deaths: 0, time: 0, left: 0, mirPoke: 0 };
  memorial = []; parts = []; gibs = []; floats = []; pickups = []; fxs = []; folders = []; blurbs = []; words = [];
  chain = 0; chainT = 0; pendingCele = false; mir = null; mirSeen = false; mirCard = 0; boss = null; banner = null; letterT = 0; walker = null; walkerT = 10; fallCase = false;
  hitstop = 0; shake = 0; slow = 1; paused = false;
  L = LEVELS[curLevel].build(); stats.casesTotal = L.casesTotal || 0; dkReset(); lite.seen = false; lite.exiled = {};
  mirT = L.mirX ? 999 : rnd(30, 45);
  if (L.pot) pickups.push({ k: 'money', x: L.pot.x, y: L.pot.y, vx: 0, vy: 0, t: 1, rest: true });
  Object.assign(P, { x: 90, y: FY, vx: 0, vy: 0, face: 1, hp: 5, inv: 0, hurtT: 0, atk: 0, onGround: true, ground: null, idleT: 0, bub: null, clean: 0, crouch: false, h: 76, idleAnim: '', safeX: 90, safeY: FY, emoteT: 0 });
  cam = 0; look = 0; mode = 'play'; modeT = 0;
}
function startLevel(i) { curLevel = i || 0; newGame(); scene = 'play'; sceneT = 0; playSong(L.song || 'level'); banner = { s: 'ЭТАП ' + (curLevel + 1) + ': ' + LEVELS[curLevel].name, sub: LEVELS[curLevel].tag || 'НИ ОДНОГО БЛЁРБА!', t: 2.6 }; }
function respawn() {
  if (L.boss) { startBoss(); return; }
  const c = L.lastCheck; P.x = c ? c.x + 20 : 90; P.y = FY; P.vx = P.vy = 0; P.hp = P.maxhp; P.inv = 1.5; P.hurtT = 0; P.onGround = true;
  blurbs = []; words = []; mir = null; mirT = rnd(25, 40); if (L.dark) dkReset();
  mode = 'play'; modeT = 0; cam = clamp(P.x - W * .45, 0, L.w - W); playSong(L.song || 'level'); chain = 0;
}
function tickBubbles(dt) { for (const a of L.agents) if (a.bub) { a.bub.t -= dt; if (a.bub.t <= 0) a.bub = null; } if (P.bub) { P.bub.t -= dt; if (P.bub.t <= 0) P.bub = null; } if (boss && boss.bub) { boss.bub.t -= dt; if (boss.bub.t <= 0) boss.bub = null; } }
function updatePlay(dt) {
  if (hitstop > 0) { hitstop -= dt; return; }
  stats.time += dt; modeT += dt;
  if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
  updateFx(dt);
  updateDk(dt);
  switch (mode) {
    case 'play':
      updateWorld(dt); if (mode !== 'play') break;
      updatePlayer(dt, true); updateAgents(dt); updateBlurbs(dt); updateMir(dt); updateWords(dt);
      if (L.boss) updateBoss(dt);
      // заявление, отбитое обратно в Бородина
      if (L.boss && boss && boss.kind === 'deg') degPaperHits();
      else if (L.boss && boss && !boss.dead) for (let i = blurbs.length - 1; i >= 0; i--) { const b = blurbs[i]; if (b.back && Math.abs(b.x - boss.x) < 40 && b.y > boss.y - 130 && b.y < boss.y) { blurbs.splice(i, 1); damageBoss('paper'); } }
      break;
    case 'celebrate':
      cele.t += dt; tickBubbles(dt);
      if (cele.t > CELE_T || (cele.t > 1 && (hit('A') || hit('J')) && !L.after)) {
        if (L.after) { if (fadeDir !== 1) fadeTo(startEnding); } else endCelebrate();
      }
      break;
    case 'gate':
      L.gate = Math.min(1, modeT / .9);
      if (modeT > .7) { P.vx = 120; P.face = 1; P.runT += dt; P.vy += GRAV * dt; collide(P, dt); if (P.x > L.gateX + 30) fadeTo(LEVELS[curLevel].boss ? startBossIntro : () => { stats.left = L.agents.filter(a => !a.dead).length; startEnding(); }); }
      else { P.vx = 0; P.vy += GRAV * dt; collide(P, dt); }
      break;
    case 'dead':
      P.vy += GRAV * .7 * dt; P.y += P.vy * dt; P.x += P.vx * dt; tickBubbles(dt);
      if (modeT > 1.5 && anyPress) fadeTo(respawn);
      break;
    case 'bossdeath': tickBubbles(dt); updateBossDeath(dt); break;
  }
}
function startBossIntro() { stats.left = L.agents.filter(a => !a.dead).length; scene = 'bossintro'; sceneT = 0; stopSong(); tn('sawtooth', 82, 78, 1.4, .2); tn('sawtooth', 62, 58, 1.6, .2, .5); }
function startEnding() { scene = 'ending'; sceneT = 0; playSong('sad'); unlockNext(); }

// ---------- render ----------
function drawHud() {
  for (let i = 0; i < P.maxhp; i++) spr('heart_s', 20 + i * 20, 28, false, { a: i < P.hp ? 1 : .22 });
  spr('copy_s', 136, 31, false); T('×' + stats.copies, 150, 21, { size: 10, align: 'left', stroke: '#16161d' });
  if (!L.boss) { drawCase({ x: 222, y: 30, ci: 0, scale: .55, open: false, bump: 0 }); T(stats.cases + '/' + stats.casesTotal, 236, 21, { size: 10, align: 'left', stroke: '#16161d' }); }
  if (chain >= 2 && chainT > 0 && mode === 'play') { T('ОТКАЗОВ x' + chain, W - 14, 20, { size: 11, align: 'right', color: '#ffe36b', stroke: '#16161d' }); OV.push(c => { c.fillStyle = '#16161d'; c.fillRect(W - 116, 30, 102, 6); c.fillStyle = '#ffe36b'; c.fillRect(W - 115, 31, 100 * clamp(chainT / 3.6, 0, 1), 4); }); }
  drawBossHud();
  if (mirCard > 0) OV.push(c => { const a = Math.min(1, mirCard * 2, (2.8 - mirCard) * 4); c.globalAlpha = a; c.fillStyle = '#16161d'; c.fillRect(W / 2 - 170, 52, 340, 50); c.fillStyle = '#a3111f'; c.fillRect(W / 2 - 166, 56, 332, 42); c.font = '12px PS2P,monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText('АНАСТАСИЯ МИРОНОВА', W / 2, 70); c.font = '7px PS2P,monospace'; c.fillStyle = '#ffd0d6'; c.fillText('журналистка. прыгай или садись', W / 2, 88); c.globalAlpha = 1; });
  if (banner) { const a = Math.min(1, banner.t * 2); T(banner.s, W / 2, 120, { size: 18, color: '#fff', stroke: '#1b2a6b', sw: 6, a }); if (banner.sub && (banner.t * 5 | 0) % 2) T(banner.sub, W / 2, 152, { size: 12, color: '#ffe36b', stroke: '#16161d', a }); }
  if (letterT > 0) OV.push(c => { const a = Math.min(1, letterT * 2); c.globalAlpha = a; c.fillStyle = '#16161d'; c.fillRect(W / 2 - 182, 78, 364, 104); c.fillStyle = '#fff6e0'; c.fillRect(W / 2 - 178, 82, 356, 96); c.font = '9px PS2P,monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#5a4a3a'; c.fillText('ПИСЬМО ИЗ ЧЕМОДАНА:', W / 2, 100); c.fillStyle = '#16161d'; c.font = '10px PS2P,monospace'; c.fillText('«САША, НУ ХОТЬ ОДИН БЛЁРБ.', W / 2, 126); c.fillText('МЫ ЖЕ ИЗДАЛЕКА.»', W / 2, 144); c.font = '8px PS2P,monospace'; c.fillStyle = '#5a4a3a'; c.fillText('— иноагенты', W / 2 + 90, 164); c.globalAlpha = 1; });
  if (mode === 'celebrate') {
    const t = cele.t, pop = Math.min(1, t * 6);
    if (!L.after) T('ОТКАЗОВ ПОДРЯД: ' + cele.n + '!', W / 2, 84, { size: 22 * pop, color: '#ffe36b', stroke: '#1b2a6b', sw: 7, rot: Math.sin(t * 9) * .05 });
    T(cele.title, W / 2, L.after ? 100 : 122, { size: L.after ? 30 : 12, color: '#fff', stroke: '#16161d', sw: L.after ? 8 : 4 });
    if (cele.kind === 'laugh' && !L.after) for (let i = 0; i < 3; i++) T('ХА', P.x - camR + Math.sin(t * 7 + i * 2) * 50, P.y - 110 - ((t * 60 + i * 26) % 70), { size: 11, color: '#8fdcff', stroke: '#16161d', rot: Math.sin(t * 5 + i) * .3 });
  }
  if (mode === 'dead' && modeT > 1) { const d = DEATH[P.lastHit] || DEATH.misc; T(d[0], W / 2, 150, { size: 26, color: '#ff5b6b', stroke: '#16161d', sw: 8 }); T(d[1], W / 2, 190, { size: 9, color: '#fff', stroke: '#16161d' }); if (modeT > 1.5 && (gameT * 2 | 0) % 2) T(TOUCH ? 'ТАПНИ' : 'ЛЮБАЯ КНОПКА', W / 2, 226, { size: 10, color: '#ffe36b', stroke: '#16161d' }); }
  drawDkHud();
  if (boss && L.boss && boss.won && mode === 'bossdeath') { const pz = boss.prize || ['ПОЛУЧЕНО: ЧИСТАЯ ОБЛОЖКА', '(ни одного блёрба)']; T(pz[0], W / 2, 96, { size: 20, color: '#ffe36b', stroke: '#16161d', sw: 7 }); T(pz[1], W / 2, 128, { size: 12, color: '#fff', stroke: '#16161d', sw: 5 }); }
}
function drawPlay() {
  const cx = Math.round(cam); camR = cx;
  if (L.boss) g.drawImage(L.bg || bg2, 0, 0);
  else { const bgI = L.bgA || bgA, off = -(Math.floor(cx * .45) % W); for (let x = off; x < W; x += W) g.drawImage(bgI, x, 0); }
  g.save(); g.translate(-cx, 0);
  if (!L.boss) {
    for (const d of L.deco) if (inView(d.x)) drawCase(d, true);
    if (walker) { g.globalAlpha = .6; const st = (gameT * 14 | 0) % 2; R(walker.x - 6, FY - 6 - (st ? 2 : 0), 3, 6 + (st ? 2 : 0), '#16161d'); R(walker.x + 4, FY - 6 - (st ? 0 : 2), 3, 6 + (st ? 0 : 2), '#16161d'); g.globalAlpha = 1; drawCase({ x: walker.x, y: FY - 6 - st, ci: walker.ci, s: .8, open: false, bump: 0 }, true); }
    if (L.theme === 'dk') drawDkWorld();
    for (const s of L.signs) if (inView(s.x + s.w / 2, 200)) drawSign(s);
    for (const c of L.checks) if (inView(c.x)) drawCheck(c);
    if (inView(L.gateX, 140)) drawGate();
    for (const p of L.pits) if (p[1] > cx && p[0] < cx + W) drawSpikes(p[0] + 4, H - 13, p[1] - p[0] - 8);
  }
  for (const s of L.solids) if (s.x + s.w > cx - 4 && s.x < cx + W + 4) drawSolid(s);
  if (!L.boss) { for (const sp of L.spikes) drawSpikes(sp.x, sp.y, sp.w); for (const z of L.zaps) if (inView(z.x)) drawZap(z); }
  for (const c of L.cases) if (inView(c.x)) drawCase(c);
  for (const p of pickups) {
    if (!inView(p.x)) continue; const bob = p.rest ? Math.round(Math.sin(gameT * 5 + p.x) * 2) - 3 : 0;
    spr(p.k, p.x, p.y + bob, false);
  }
  for (const q of gibs) if (q.rest && inView(q.x)) drawGib(q);
  for (const a of L.agents) drawAgent(a);
  drawBoss(); drawMir();
  if (!(mode === 'dead' && P.y > H + 120)) drawPlayer();
  for (const q of gibs) if (!q.rest && inView(q.x)) drawGib(q);
  for (const p of parts) R(p.x, p.y, p.s, p.s, p.c);
  for (const f of fxs) { const k = f.t / f.max, r = 8 + k * 26; g.strokeStyle = k < .5 ? '#fff' : '#ffe36b'; g.lineWidth = 3; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + .3; g.moveTo(f.x + Math.cos(a) * r * .5, f.y + Math.sin(a) * r * .5); g.lineTo(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r); } g.stroke(); }
  if (L.dark) drawDkTop(cx);
  drawBlurbs();
  g.restore();
  drawWords();
  drawBubbles();
  if (mir && mir.bub) bubble(mir.bub.s, mir.x - camR, mir.y - 96, { prio: 5, size: 10, max: 16, bg: '#ffe9ec', color: '#a3111f', shake: mir.st === 'shout' ? 1.5 : 0 });
  for (const f of floats) { const a = clamp((f.max - f.t) * 4, 0, 1); T(f.s, f.scr ? f.x : f.x - camR, f.y, { size: f.size, color: f.color, stroke: f.stroke, rot: f.rot, a, sw: 3 }); }
  drawHud();
}
function drawFloor() { R(0, FY, W, H - FY, '#2a1a10'); g.fillStyle = pats.panel; g.fillRect(0, FY + 8, W, H); R(0, FY, W, 2, '#e8c890'); R(0, FY + 2, W, 6, '#a3111f'); }
function drawTitle() {
  g.drawImage(bgA, -360, 0); g.drawImage(bgA, W - 360, 0); g.fillStyle = 'rgba(6,6,24,.35)'; g.fillRect(0, 0, W, H);
  drawFloor();
  const t = sceneT;
  spr((t % 8) < 4 ? 'p_phone' : 'p_write', 170, FY + ((t % 8) >= 4 && (t * 8 | 0) % 2 ? -1 : 0), false);
  ['a0_give', 'a1_idle', 'a2_give', 'a3_idle', 'a1_give'].forEach((n, i) => { const x = 430 + i * 64, hop = ((t + i * .37) % 2.2) < .3 ? -Math.sin(((t + i * .37) % 2.2) / .3 * Math.PI) * 4 : 0; spr(n, x, FY + hop, true); });
  drawCase({ x: 300, y: FY, ci: 1, scale: 1, open: false, bump: 0 }); drawCase({ x: 770, y: FY, ci: 2, scale: 1, open: false, bump: 0 }); drawCase({ x: 762, y: FY - 34, ci: 4, scale: .8, open: false, bump: 0 });
  bubble('Саша! Блёрб?', 494, FY - 90, { size: 8 });
  bubble((t % 8) < 4 ? 'проверяю реестр' : 'пишу. без блёрбов', 170, FY - 92, { size: 8, bg: '#e9f1ff', color: '#1b2a6b' });
  const y = 100 + Math.sin(t * 2) * 4;
  T('ПЕЛЕВИН', W / 2 + 5, y + 6, { size: 60, color: '#0a1a4a' });
  T('ПЕЛЕВИН', W / 2, y, { size: 60, color: '#ffe36b', stroke: '#16161d', sw: 12 });
  T('ПЕЛЕВИН', W / 2, y - 3, { size: 60, color: '#fff7c2', a: .55 });
  T('БЕЗ БЛЁРБА', W / 2, 152, { size: 18, color: '#ff6b7a', stroke: '#16161d', sw: 5 });
  T('Иноагенты хотят написать ему блёрб. Он против.', W / 2, 184, { size: 8, color: '#bff7ee', stroke: '#16161d' });
  if ((t * 2 | 0) % 2) T(TOUCH ? 'ТАПНИ, ЧТОБЫ НАЧАТЬ' : 'НАЖМИ ENTER ИЛИ ПРОБЕЛ', W / 2, 222, { size: 12, color: '#fff', stroke: '#16161d', sw: 4 });
  T('пародия. все персонажи — карикатуры', 10, H - 10, { size: 6, color: '#bfa080', align: 'left' });
  T(TOUCH ? '' : 'M — звук   P — пауза', W - 10, H - 10, { size: 7, color: '#bfa080', align: 'right' });
}
let selI = 0;
const slotCount = () => Math.max(6, Math.ceil((LEVELS.length + 1) / 3) * 3);
const slotRect = i => [70 + (i % 3) * 226, 86 + (i / 3 | 0) * 150, 208, 130];
function drawSelect() {
  R(0, 0, W, H, '#0a1030'); for (let y = 0; y < H; y += 6) R(0, y, W, 2, '#0d1640');
  T('ВЫБЕРИ УРОВЕНЬ', W / 2, 44, { size: 20, color: '#ffe36b', stroke: '#16161d', sw: 6 });
  const n = slotCount(), row0 = Math.max(0, Math.min((selI / 3 | 0) - 1, Math.ceil(n / 3) - 2));
  for (let i = row0 * 3; i < Math.min(n, row0 * 3 + 6); i++) {
    const r = slotRect(i - row0 * 3), x = r[0], y = r[1], w = r[2], h = r[3], lv = LEVELS[i], open = lv && i < unlocked;
    R(x - 4, y - 4, w + 8, h + 8, i === selI ? ((sceneT * 6 | 0) % 2 ? '#ffe36b' : '#fff') : open ? '#39e0d0' : '#2a3350');
    R(x, y, w, h, open ? '#1b2a6b' : '#11162a');
    T('ЭТАП ' + (i + 1), x + w / 2, y + 18, { size: 9, color: open ? '#39e0d0' : '#566a92' });
    if (lv) {
      wrap(lv.name, 15).forEach((ln, j) => T(ln, x + w / 2, y + 44 + j * 16, { size: 10, color: open ? '#fff' : '#566a92' }));
      if (open) { spr('a' + (i % 4) + '_give', x + 24, y + h - 4, false, { sx: .6 }); T(i < passed - 1 ? 'ПРОЙДЕН' : (lv.sub || ''), x + w / 2 + 14, y + h - 22, { size: 7, color: i < passed - 1 ? '#3ddc6a' : '#ffd0e8' }); if (lv.author) T('автор: ' + lv.author, x + w / 2 + 14, y + h - 10, { size: 6, color: '#8f9ad0' }); }
      else { drawCase({ x: x + 26, y: y + h - 8, ci: 4, scale: .8, open: false, bump: 0 }); T('ЗАКРЫТ', x + w / 2 + 14, y + h - 26, { size: 8, color: '#ff6b6b' }); T('пройди этап ' + i, x + w / 2 + 14, y + h - 12, { size: 6, color: '#566a92' }); }
    } else { T('СКОРО', x + w / 2, y + 58, { size: 12, color: '#566a92' }); T('место для', x + w / 2, y + 86, { size: 7, color: '#3d4d6e' }); T('твоего уровня', x + w / 2, y + 100, { size: 7, color: '#3d4d6e' }); }
  }
  T(TOUCH ? 'тапни по уровню' : 'стрелки — выбрать, ENTER — играть', W / 2, H - 20, { size: 8, color: '#8f9ad0' });
}
function drawBossIntro() {
  if (LEVELS[curLevel].bossKind === 'deg') return drawDegIntro();
  const t = sceneT;
  R(0, 0, W, H, '#0a1a12'); for (let i = 0; i < 12; i++) { const y = ((i * 44 + t * 240) % (H + 44)) - 44; R(0, y, W, 16, i % 2 ? '#14301f' : '#0f2418'); }
  R(0, 150, W, 150, '#05100a'); R(0, 150, W, 3, '#8fdcff'); R(0, 297, W, 3, '#8fdcff');
  const x = t < .7 ? W + 100 - (W - 170) * (t / .7) : 270;
  spr(t > .7 && (t * 2 | 0) % 2 ? 'b_point' : 'b_stand', x, 296, false);
  const nm = 'ВИТАЛИЙ БОРОДИН', n = clamp(((t - .9) * 12 | 0), 0, nm.length);
  T(nm.slice(0, n), 360, 192, { size: 22, color: '#fff', align: 'left', stroke: '#16161d', sw: 6 });
  if (t > 2) T('общественник. проверяет всё', 362, 226, { size: 8, color: '#8fdcff', align: 'left' });
  if (t > 2.5) T('ПРОВЕРЕНО: ВСЁ', 362, 248, { size: 8, color: '#ffe36b', align: 'left' });
  if (t > 2.9) T('ОСТАЛОСЬ: ВЫ', 362, 264, { size: 8, color: '#ffe36b', align: 'left' });
  if (t > 3.3) T('ПРАВООХРАНИТЕЛЬНЫЕ ОРГАНЫ: НА ПРОВЕРКЕ', 362, 280, { size: 7, color: '#ff8a94', align: 'left' });
}
function rankOf() { const k = stats.got; return k === 0 ? 'ЧИСТ ПЕРЕД ОБЛОЖКОЙ' : k <= 3 ? 'ЛЁГКОЕ РУКОПОЖАТИЕ' : k <= 8 ? 'ПОД ПОДОЗРЕНИЕМ' : 'СОАВТОР ВСЕХ ИНОАГЕНТОВ'; }
let credits = null;
function drawEnding() {
  const t = sceneT; R(0, 0, W, H, '#07060d');
  if (!credits) {
    const lv = LEVELS[curLevel] || {};
    if (t > .6) T(lv.endA || 'ОБЛОЖКА ЧИСТА.', W / 2, 66, { size: 24, color: '#fff' });
    if (t > 2.6) T(lv.endB || 'Надолго ли?', W / 2, 102, { size: 13, color: '#8fdcff' });
    const mm = (stats.time / 60 | 0) + ':' + String(stats.time % 60 | 0).padStart(2, '0');
    const rows = [['ТИРАЖ', stats.copies], ['ЧЕМОДАНОВ', stats.cases + '/' + stats.casesTotal], ['БЛЁРБОВ ОТБИТО', stats.deflected], ['БЛЁРБОВ НА ОБЛОЖКЕ', stats.got], ['РЕЛОЦИРОВАНО', stats.relocated + (stats.left ? ' (' + stats.left + ' ОСТАЛИСЬ)' : '')], ['ЛУЧШЕЕ КОМБО', 'x' + stats.best], ['ВРЕМЯ', mm]];
    if (lv.bossKind === 'deg') rows.splice(5, 0, ['ПРИЗРАКОВ ИЗГНАНО', stats.ghosts]);
    const rh = rows.length > 7 ? 20 : 23;
    rows.forEach((r, i) => { if (t > 4.4 + i * .45) { T(r[0], W / 2 - 14, 140 + i * rh, { size: 10, color: '#8f9ad0', align: 'right' }); T(String(r[1]), W / 2 + 14, 140 + i * rh, { size: 10, color: '#ffe36b', align: 'left' }); } });
    if (t > 8) T('РАНГ: ' + rankOf(), W / 2, 316, { size: 13, color: '#3ddc6a', stroke: '#16161d', sw: 5 });
    spr((t / .22 | 0) % 2 ? 'p_dance2' : 'p_dance1', 90, 430 - Math.abs(Math.sin(t * 14.3)) * 5, (t / .88 | 0) % 2 === 1);
  } else {
    const y0 = H + 20 - (t - credits.t0) * 30;
    credits.rows.forEach((r, i) => { const y = y0 + r.y; if (y > -20 && y < H + 20) { if (r.b) T(r.a, W / 2 - 12, y, { size: 8, color: '#fff', align: 'right' }), T(r.b, W / 2 + 12, y, { size: 7, color: '#8f9ad0', align: 'left' }); else T(r.a, W / 2, y, { size: r.size || 10, color: r.color || '#ffe36b' }); } });
    const endY = y0 + credits.h;
    if (endY < H / 2) { T('КОНЕЦ', W / 2, H / 2 - 20, { size: 30, color: '#fff' }); if ((t * 2 | 0) % 2) T(TOUCH ? 'ТАПНИ — ЕЩЁ РАЗ' : 'ENTER — ЕЩЁ РАЗ', W / 2, H / 2 + 24, { size: 10, color: '#8fdcff' }); credits.done = true; }
    const wx = ((t * 70) % (W + 120)) - 60, st = (t * 14 | 0) % 2;
    R(wx - 6, H - 12 - (st ? 2 : 0), 3, 8, '#cfd8e6'); R(wx + 4, H - 12 - (st ? 0 : 2), 3, 8, '#cfd8e6'); drawCase({ x: wx, y: H - 10 - st, ci: 3, scale: .8, open: false, bump: 0 });
  }
}
function makeCredits() {
  const rows = []; let y = 0; const add = (a, b, o) => { rows.push(Object.assign({ a, b, y }, o || {})); y += (o && o.gap) || 22; };
  add('РЕЛОЦИРОВАНЫ', null, { size: 16, gap: 40 });
  memorial.forEach(m => add(m[0].toUpperCase(), m[1]));
  if (!memorial.length) add('НИКТО', 'все остались. с блёрбами');
  y += 30; add('В РОЛЯХ', null, { size: 14, gap: 34 });
  const cast = (LEVELS[curLevel] || {}).cast || [['АЛЕКСАНДР ПЕЛЕВИН', 'сам'], ['ИНОАГЕНТЫ', 'собирательные образы'], ['АНАСТАСИЯ МИРОНОВА', 'с мегафоном'], ['ВИТАЛИЙ БОРОДИН', 'на проверке'], ['ЧЕМОДАНЫ', 'релокация'], ['КНИГА', 'твёрдый переплёт']];
  cast.forEach(c => add(c[0], c[1]));
  y += 30; add('ВСЕ ПЕРСОНАЖИ — КАРИКАТУРЫ', null, { size: 9, color: '#bff7ee', gap: 18 }); add('СОВПАДЕНИЯ С РЕАЛЬНОСТЬЮ —', null, { size: 9, color: '#bff7ee', gap: 18 }); add('НА СОВЕСТИ РЕАЛЬНОСТИ', null, { size: 9, color: '#bff7ee', gap: 26 }); add('(блёрбов в игре нет)', null, { size: 8, color: '#8fdcff', gap: 60 });
  add('ФОРК «ГАЛИ МЕН»', null, { size: 10, color: '#ffd0e8', gap: 40 });
  return { rows, h: y, t0: sceneT, done: false };
}
// «Z! Z! ZZZ!» на весь экран: иногда выскакивает по нажатию Z
let zz = null, zzCd = 0;
function drawZZ() {
  const t = zz.t, a = t < 1 ? 1 : Math.max(0, (1.2 - t) / .2);
  OV.push(c => { c.fillStyle = 'rgba(255,227,107,' + (.35 * a).toFixed(3) + ')'; c.fillRect(0, 0, W, H); });
  const parts = [['Z!', W * .2, H * .32, 54, 0], ['Z!', W * .78, H * .3, 54, .12], ['ZZZ!', W / 2, H * .66, 96, .24]];
  for (let i = 0; i < 3; i++) {
    const [s, x, y, size, t0] = parts[i]; const k = t - t0; if (k < 0) continue;
    const pop = k < .12 ? .4 + k / .12 * .8 : k < .2 ? 1.2 - (k - .12) / .08 * .2 : 1;
    T(s, x, y, { size: Math.round(size * pop), color: '#fff', stroke: '#a3111f', sw: 10, shadow: '#16161d', sd: 5, rot: zz.rot[i], a });
  }
}
function render() {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  OV.length = 0;
  if (scene === 'load') T('ЗАГРУЗКА…', W / 2, H / 2, { size: 12 });
  else if (scene === 'title') drawTitle();
  else if (scene === 'select') drawSelect();
  else if (scene === 'play') drawPlay();
  else if (scene === 'bossintro') drawBossIntro();
  else if (scene === 'ending') drawEnding();
  if (paused) { OV.push(c => { c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, W, H); }); T('ПАУЗА', W / 2, H / 2, { size: 24 }); }
  flushBubbles(scene === 'play' ? P.x - camR : W / 2);
  if (zz) drawZZ();
  const sx = shake > .3 ? rnd(-shake, shake) : 0, sy = shake > .3 ? rnd(-shake, shake) * .7 : 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(buf, 0, 0, W, H, Math.round(sx * K), Math.round(sy * K), cv.width, cv.height);
  ctx.setTransform(K, 0, 0, K, sx * K, sy * K);
  for (const f of OV) f(ctx);
  ctx.setTransform(K, 0, 0, K, 0, 0);
  if (flash > 0) { ctx.fillStyle = (scene === 'play' && boss && boss.dead ? 'rgba(255,255,255,' : 'rgba(255,60,70,') + clamp(flash, 0, 1).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
  if (fade > 0) { ctx.fillStyle = 'rgba(0,0,0,' + clamp(fade, 0, 1).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
}

// ---------- main loop ----------
function step(dt) {
  gameT += dt; sceneT += dt;
  if (fadeDir) { fade += fadeDir * dt * 2.6; if (fade >= 1 && fadeDir === 1) { fade = 1; fadeDir = -1; const cb = fadeCb; fadeCb = null; if (cb) cb(); } else if (fade <= 0) { fade = 0; fadeDir = 0; } }
  shake = Math.max(0, shake - dt * 34); flash = Math.max(0, flash - dt * 1.8);
  if (zz) { zz.t += dt; if (zz.t > 1.2) zz = null; } if (zzCd > 0) zzCd -= dt;
  if (zPress) { zPress = false; if (scene === 'play' && !paused && !zz && zzCd <= 0 && Math.random() < .25) { zz = { t: 0, rot: [rnd(-.2, .2), rnd(-.2, .2), rnd(-.12, .12)] }; zzCd = 2; shake = Math.max(shake, 6); sfx.shout(); } }
  const go = hit('S') || hit('J') || hit('A') || hit('T');
  switch (scene) {
    case 'title': if (sceneT > .4 && go && !fadeDir) { sfx.ok(); fadeTo(() => { scene = 'select'; sceneT = 0; selI = Math.min(passed, LEVELS.length) - 1; }); } break;
    case 'select': {
      const n = slotCount(); let ok = hit('S') || hit('A');
      if (hit('L')) { selI = (selI + n - 1) % n; sfx.select(); } if (hit('R')) { selI = (selI + 1) % n; sfx.select(); }
      if (hit('D')) { selI = (selI + 3) % n; sfx.select(); } if (hit('J')) { selI = (selI + n - 3) % n; sfx.select(); }
      if (hit('T')) { const row0 = Math.max(0, Math.min((selI / 3 | 0) - 1, Math.ceil(n / 3) - 2)); for (let i = 0; i < 6; i++) { const r = slotRect(i); if (tapX > r[0] && tapX < r[0] + r[2] && tapY > r[1] && tapY < r[1] + r[3]) { selI = row0 * 3 + i; ok = true; } } }
      if (sceneT > .4 && ok && !fadeDir) { if (LEVELS[selI] && selI < unlocked) { sfx.ok(); const i = selI; fadeTo(() => startLevel(i)); } else sfx.buzz(); }
      break;
    }
    case 'play': updatePlay(dt * slow); break;
    case 'bossintro':
      if (sceneT > .9 && sceneT < 2.2 && ((sceneT - .9) * 12 | 0) !== ((sceneT - dt - .9) * 12 | 0)) sfx.blip();
      if (sceneT > 2 && sceneT - dt <= 2) sfx.stamp();
      if ((sceneT > 4.6 || (sceneT > 1.2 && go)) && !fadeDir) fadeTo(startBoss);
      break;
    case 'ending':
      if (!credits) { if (sceneT > 12 || (sceneT > 5 && go)) credits = makeCredits(); }
      else if ((credits.done || sceneT - credits.t0 > 8) && go && !fadeDir) fadeTo(() => { credits = null; stopSong(); curLevel = 0; newGame(); scene = 'select'; sceneT = 0; selI = Math.min(unlocked, LEVELS.length) - 1; });
      break;
  }
}
let lastTs = 0, acc = 0;
const STEP = 1 / 60;
function frame(ts) {
  requestAnimationFrame(frame);
  const now = ts / 1000; let dt = Math.min(.1, now - lastTs); lastTs = now; if (!(dt > 0)) dt = STEP;
  if (hit('M')) { toggleMute(); pressed.M = false; }
  if (hit('P')) { if (scene === 'play') paused = !paused; pressed.P = false; }
  if (!paused) {
    acc += dt; let n = 0;
    while (acc >= STEP && n < 5) { step(STEP); acc -= STEP; n++; for (const k in pressed) pressed[k] = false; anyPress = false; }
    if (n === 5) acc = 0;
  } else { for (const k in pressed) pressed[k] = false; anyPress = false; }
  render(); musicTick();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && scene === 'play' && mode === 'play') paused = true; });

// ждём шрифт (он нужен и для фонов), потом рисуем всю графику
(document.fonts && document.fonts.load ? Promise.race([document.fonts.load('10px PS2P', 'Пелевин 123'), new Promise(r => setTimeout(r, 1500))]) : Promise.resolve())
  .then(() => { buildArt(); newGame(); scene = 'title'; sceneT = 0; })
  .catch(e => { console.error(e); });
requestAnimationFrame(frame);

window.__dbg = {
  get s() { return { scene, mode, x: P.x, y: P.y, hp: P.hp, relocated: stats && stats.relocated, got: stats && stats.got, boss: boss && { hp: boss.hp, state: boss.state, phase: boss.phase, x: boss.x }, mir: mir && { st: mir.st, x: mir.x }, cam, agents: L && L.agents.length, blurbs: blurbs.length, words: words.length, chain, fade }; },
  warp(x, y) { P.x = x; P.y = y === undefined ? FY : y; P.vx = P.vy = 0; cam = clamp(x - 360, 0, L.w - W); },
  god(v) { P.maxhp = v ? 99 : 5; P.hp = P.maxhp; },
  start(i) { startLevel(i || 0); }, deg() { curLevel = 1; startDeg(); }, lite: () => lite, ghosts: () => ghosts, darkAt(t) { lite.t = t; }, mir() { startMir(); }, cele(k) { cele.n = 4; startCelebrate(); if (k) cele.kind = k; }, idle(k) { P.idleT = 4; P.idleAnim = k; P.idleA = 0; }, boss() { startBoss(); }, bosshp(n) { boss.hp = n; }, ending() { startEnding(); }, intro() { startBossIntro(); },
  bossObj: () => boss, L: () => L, P, F, stats: () => stats, atlas: () => atlas,
  blurb() { const a = L.agents.filter(r => !r.dead).sort((p, q) => Math.abs(p.x - P.x) - Math.abs(q.x - P.x))[0]; if (a) throwBlurb(a); }
};
