// ---------- ЭТАП 6 (ФИНАЛ): ВНУТРИ КАНАЛА ----------
// Пелевин листал ленту, и его затянуло в телефон. Четыре зоны:
// A — лента (посты ползут вверх, реклама перегораживает путь, гусь пытается объяснить свой смысл),
// B — комментарии (свободы слова нет, удалённые сообщения исчезают из-под ног),
// C — окрошка (квас против кефира, бутылки летят с обеих сторон),
// D — «вражеская Википедия» (правки откатываются, «[источник не указан]», звонки «начальника»).
// Отсылки — к Telegram-каналу Александра Пелевина. Босс — Анастасия Миронова в огромном телефоне:
// перевирает факты, откатывает удары, снимает скриншоты, подкидывает фейковые сердца,
// а когда Пелевин умирает — «ЭТО Я РЕШАЮ, КОГДА МЫ ЗАКОНЧИМ» (один раз). Все персонажи — карикатуры.
let bgFeed = null, bgPhone = null, feedSongT = 0;
DEATH.okr = ['ОКРОШКА', 'спор так и не решён'];
DEATH.scam = ['РАЗВЕДЁН', 'начальник с бывшей работы доволен'];
DEATH.skrin = ['ЗАСКРИНЕНО', 'это были твои плохие стихи'];
DEATH.fake = ['ОПРОВЕРГНУТ', 'источник: её канал'];
DEATH.post = ['ПРИДАВЛЕН ПОСТОМ', 'восемь тысяч знаков про тебя'];
DEATH.src = ['[ИСТОЧНИК НЕ УКАЗАН]', 'статью о тебе удалили. тебя тоже'];
const TGB = '#0e1621', TGP = '#182533', TGL = '#2b5278', TGA = '#5eb5f7';

// комментаторы — обычные агенты с полями из o.as
const cmAs = v => ({ pre: 'cm' + v + '_', title: 'Комментатор', name: pick(['patriot1981', 'kritik_007', 'vasya', 'bot4815', 'chitatel', 'anon']), noMem: true,
  quotes: ['«ИСТОЧНИК?»', '«+»', '«А ВЫ ЧИТАЛИ?»', '«ОНА ПРАВА»', '«ДЯДЯ, ВЫ ДУРАК?»', '«ЛОЛ»', '«ОТПИСКА»'], lastL: ['ЗАБАНИЛИ!', 'ЭТО ЦЕНЗУРА!', 'СВОБОДЫ СЛОВА НЕТ!', 'ПОЙДУ В ДРУГОЙ КАНАЛ'], relocTxt: 'ЗАБАНЕН' });

// ---------- объекты уровня ----------
function updateFeed(dt) {
  const l = L;
  // посты ползут вверх, как при прокрутке
  for (const s of l.risers) { s.y -= s.rise.sp * dt; if (s.y < s.rise.top) { s.y += s.rise.bot - s.rise.top; if (P.ground === s) { P.onGround = false; P.ground = null; } } else if (P.ground === s && P.onGround) P.y = s.y; }
  // удалённые сообщения
  for (const s of l.dels) {
    const d = s.del;
    if (d.st === 'on') { if (P.ground === s && P.onGround) { d.st = 'shake'; d.t = 0; } }
    else if (d.st === 'shake') { d.t += dt; if (d.t > .8) { d.st = 'off'; d.t = 0; s.y = -9999; sfx.click(); } }
    else { d.t += dt; if (d.t > 2.6) { d.st = 'on'; s.y = d.y; } }
  }
  // правки в Википедии: платформа то есть, то её откатили
  for (const s of l.edits) { const ph = (gameT + s.ed.ph) % 3; s.ed.on = ph < 1.9; s.ed.warn = ph > 1.5 && ph < 1.9; s.y = s.ed.on ? s.ed.y : -9999; }
  // гуси
  for (const q of l.geese) {
    q.t += dt; if (q.bub) { q.bub.t -= dt; if (q.bub.t <= 0) q.bub = null; } q.ad = Math.max(0, q.ad - dt);
    q.x += q.d * 26 * dt; if (Math.abs(q.x - q.x0) > 60) q.d *= -1;
    if (Math.abs(P.x - q.x) < 230 && q.cd <= 0) { q.cd = 7; say(q, 'СМЫСЛ ГУСЯ В ТОМ, ЧТО…', 1.5); q.adT = 1.5; tn('square', 300, 260, .12, .12); }
    q.cd -= dt;
    if (q.adT > 0) { q.adT -= dt; if (q.adT <= 0) { q.bub = null; q.ad = 2.2; q.adS = pick(['РЕКЛАМА: КУРСЫ ПИСАТЕЛЬСТВА ЗА 3 ДНЯ', 'РЕКЛАМА: ВПН. БЫСТРЫЙ. НАВЕРНОЕ', 'РЕКЛАМА: КАЗИНО «БЛЁРБ»', 'РЕКЛАМА: НЕЙРОСЕТЬ НАПИШЕТ РОМАН']); sfx.blip2(); } }
  }
  // окрошка: квас против кефира
  for (const c of l.crowds) {
    c.t -= dt; if (c.bub) { c.bub.t -= dt; if (c.bub.t <= 0) c.bub = null; }
    const dx = P.x - c.x;
    if (P.x > l.okr[0] && P.x < l.okr[1] && Math.abs(dx) < 560 && c.t <= 0 && blurbs.length < 5) {
      c.t = rnd(1.4, 2.2);
      const x = c.x + sign(dx) * 30, y = FY - 70, tx = P.x + rnd(-30, 30), ty = P.y - 44;
      const vx = clamp(Math.abs(tx - x) / 1.1, 170, 320) * sign(tx - x), Tt = Math.abs((tx - x) / vx), gr = 520, vy = clamp((ty - y - .5 * gr * Tt * Tt) / Math.max(.3, Tt), -520, 160);
      blurbs.push({ x, y, vx, vy, g: gr, q: c.kvas ? 'КВАС!' : 'КЕФИР!', from: c, back: false, t: 0, rot: 0, paper: true, spr: c.kvas ? 'kvas' : 'kefir', kind: 'okr', hitTxt: c.kvas ? 'ОБЛИТ КВАСОМ' : 'ОБЛИТ КЕФИРОМ' });
      sfx.whoosh();
      if (!c.bub && Math.random() < .5) say(c, pick(c.kvas ? ['ОКРОШКА — НА КВАСЕ!', 'КВАС — ЭТО ТРАДИЦИЯ!', 'КЕФИРНИКИ, ПОПЛАЧЬТЕ'] : ['ТОЛЬКО НА КЕФИРЕ!', 'КВАС — ДЛЯ ДЕТЕЙ!', 'КЕФИР ПОЛЕЗЕН ДЛЯ КОГНИТИВНЫХ']), 1.6);
    }
  }
  if (l.mid && l.mid.cd > 0) l.mid.cd -= dt;
  if (l.mid && P.x > l.mid.x - 200 && l.mid.cd <= 0) { l.mid.cd = 9; l.mid.bub = { s: pick(['А Я НА МИНЕРАЛКЕ', 'НА АЙРАНЕ НАДО!', 'ДРУЗЬЯ, ДАВАЙТЕ ЖИТЬ ДРУЖНО']), t: 2 }; }
  if (l.mid && l.mid.bub) { l.mid.bub.t -= dt; if (l.mid.bub.t <= 0) l.mid.bub = null; }
  // [источник не указан]
  if (P.x > l.wiki[0] && P.x < l.wiki[1]) { l.srcT -= dt; if (l.srcT <= 0) { l.srcT = rnd(1.6, 2.4); const low = Math.random() < .5; words.push({ x: cam + W + 40, y: P.y - (low ? 14 : 70), vx: -230, s: pick(['[ИСТОЧНИК НЕ УКАЗАН]', '[НЕТ АИ]', '[ПРОВЕРИТЬ]', '[ЧЬЁ МНЕНИЕ?]']), t: 0, size: 9, col: '#5eb5f7', kind: 'src', txt: 'СТАТЬЯ ПОПРАВЛЕНА' }); sfx.typewriter(); } }
  // звонки «начальника»
  for (let i = l.scams.length - 1; i >= 0; i--) {
    const q = l.scams[i]; q.t += dt;
    if (q.st === 'idle') { if (Math.abs(P.x - q.x) < 360) { q.st = 'fly'; sfx.blip2(); } continue; }
    const dx = P.x - q.x, dy = P.y - 50 - q.y, d = Math.hypot(dx, dy) || 1;
    q.x += dx / d * 105 * dt; q.y += dy / d * 105 * dt;
    if ((q.t * 3 | 0) !== ((q.t - dt) * 3 | 0)) tn('square', 1200, 1200, .05, .04);
    if (mode === 'play' && P.inv <= 0 && d < 22) { floater('«ЭТО ВАШ НАЧАЛЬНИК. ПЕРЕВЕДИТЕ…»', P.x, P.y - 110, { color: '#7fe08a', size: 8, t: 2 }); hurtPlayer(sign(dx || 1), false, 'scam'); l.scams.splice(i, 1); }
    else if (q.t > 14) l.scams.splice(i, 1);
  }
  // хвосты кота
  for (const c of l.tails) if (!c.got && Math.abs(P.x - c.x) < 20 && P.y > c.y - 40 && P.y - P.h < c.y + 10) { c.got = true; stats.tails++; sfx.heal(); floater('ХВОСТ КОТА ' + stats.tails + '/' + l.tails.length + '. КОТА НЕ ПОКАЖУ', c.x, c.y - 40, { color: '#ffe36b', size: 8, t: 2 }); }
  // реплики Пелевина
  for (const q of l.quips) if (!q.done && P.x > q.x) { q.done = true; say(P, q.s, 2.2); }
  // «саундтреком к этой новости звучит…»
  for (const q of l.sts) if (!q.done && P.x > q.x) { q.done = true; feedSongT = 7; floater('А САУНДТРЕКОМ К ЭТОЙ НОВОСТИ ЗВУЧИТ…', W / 2, 96, { scr: true, color: '#5eb5f7', size: 10, t: 2.4, vy: -6 }); playSong(q.song); }
  if (feedSongT > 0) { feedSongT -= dt; if (feedSongT <= 0) playSong(L.song); }
}
function feedAttack(x0, x1, y0, y1) {
  // реклама ломается книгой
  for (const s of L.solids) {
    if (!s.ad || P.atkSet.has(s)) continue;
    if (x1 > s.x && x0 < s.x + s.w && y1 > s.y && y0 < s.y + s.h) {
      P.atkSet.add(s); s.ad.hp--; s.ad.fl = .15; sfx.bonk(); shake = Math.max(shake, 4);
      if (s.ad.hp <= 0) {
        L.solids.splice(L.solids.indexOf(s), 1); burst(s.x + s.w / 2, s.y + s.h / 2, 20, ['#ffe36b', '#fff', TGA], 220, .5); sfx.paper();
        if (s.ad.again) { L.solids.push({ x: s.x + 6, y: FY - 90, w: s.w - 12, h: 90, k: 'b', ad: { hp: 1, txt: 'ЕЩЁ РЕКЛАМА', fl: 0 } }); floater('ЗА РЕКЛАМОЙ — РЕКЛАМА', s.x + s.w / 2, FY - 110, { color: '#ffe36b', size: 8, t: 1.4 }); }
        else floater(pick(['РЕКЛАМА ЗАКРЫТА', 'ПРОПУСТИТЬ ×', 'КУПИ ПРЕМИУМ']), s.x + s.w / 2, FY - 110, { color: '#ffe36b', size: 8, t: 1.2 });
      }
      break;
    }
  }
  for (let i = L.scams.length - 1; i >= 0; i--) { const q = L.scams[i]; if (q.x > x0 - 8 && q.x < x1 + 8 && q.y > y0 && q.y < y1) { L.scams.splice(i, 1); sfx.click(); floater('СБРОШЕНО', q.x, q.y - 20, { color: '#7fe08a', size: 9, t: 1 }); burst(q.x, q.y, 10, ['#7fe08a', '#fff'], 160, .4); } }
  for (const q of L.geese) if (!P.atkSet.has(q) && Math.abs(q.x - (x0 + x1) / 2) < 50 && q.y > y0) { P.atkSet.add(q); tn('square', 520, 380, .1, .12); floater('ГУСЯ НЕ ТРОГАТЬ. ОН СО СМЫСЛОМ', q.x, q.y - 50, { color: '#fff', size: 8, t: 1.2 }); }
}
function drawFeedBack() {
  const l = L;
  // пост про саму игру
  const gp = l.gamePost;
  if (inView(gp.x, 200)) {
    const x = gp.x, y = 120;
    R(x - 2, y - 2, 224, 150, OUTC); R(x, y, 220, 146, TGP); R(x, y, 220, 18, TGL);
    T('АЛЕКСАНДР ПЕЛЕВИН', x + 8 - camR, y + 10, { size: 6, color: '#fff', align: 'left' });
    g.drawImage(bgA, 0, 120, W, 240, x + 8, y + 24, 204, 62); R(x + 8, y + 74, 204, 12, '#a3111f');
    spr('p_idle', x + 40, y + 86, false, { sx: .4 }); spr('a1_give', x + 120, y + 86, true, { sx: .4 }); spr('a0_give', x + 160, y + 86, true, { sx: .4 });
    T('ПРО МЕНЯ СДЕЛАЛИ ИГРУ.', x + 8 - camR, y + 100, { size: 6, color: '#fff', align: 'left' });
    T('УВОРАЧИВАЮСЬ ОТ БЛЁРБОВ', x + 8 - camR, y + 114, { size: 6, color: '#fff', align: 'left' });
    T('ИНОАГЕНТОВ НА МОИ КНИГИ', x + 8 - camR, y + 126, { size: 6, color: '#fff', align: 'left' });
    T('ПРОСМ. 48К  20:38', x + 212 - camR, y + 139, { size: 5, color: '#6c8aa8', align: 'right' });
  }
  // окрошечные толпы
  for (const c of l.crowds) {
    if (!inView(c.x, 120)) continue;
    const pre = c.kvas ? ['a0_', 'a2_', 'a3_'] : ['a1_', 'a3_', 'a0_'];
    pre.forEach((p, i) => spr(p + ((gameT * 3 + i) % 2 < 1 ? 'throw' : 'give'), c.x + (c.kvas ? -i * 26 : i * 26), FY, !c.kvas, { sx: .9 }));
    const sx = c.x + (c.kvas ? -26 : 26);
    R(sx - 1, FY - 108, 2, 40, '#6e3d1c'); R(sx - 30, FY - 126, 60, 20, OUTC); R(sx - 28, FY - 124, 56, 16, c.kvas ? '#c9862a' : '#f4f8fb');
    T(c.kvas ? 'КВАС!' : 'КЕФИР!', sx - camR, FY - 115, { size: 8, color: c.kvas ? '#3a1a08' : '#1a5a8a' });
    if (c.bub) bubble(c.bub.s, c.x - camR, FY - 130, { size: 8, max: 16, prio: 1 });
  }
  if (l.mid && inView(l.mid.x)) { spr('a2_scared', l.mid.x, FY, false); if (l.mid.bub) bubble(l.mid.bub.s, l.mid.x - camR, FY - 90, { size: 8, max: 16, prio: 1 }); }
  // страница Википедии за зоной D
  const wx0 = l.wiki[0], wx1 = l.wiki[1];
  if (wx1 > cam && wx0 < cam + W) {
    R(wx0, 60, wx1 - wx0, 240, '#f6f6f6'); R(wx0, 60, wx1 - wx0, 26, '#eaecf0'); R(wx0, 86, wx1 - wx0, 1, '#a2a9b1');
    for (let x = Math.max(wx0, Math.floor(cam / 300) * 300); x < Math.min(wx1, cam + W + 300); x += 300) {
      T('ПЕЛЕВИН, АЛЕКСАНДР', x + 20 - camR, 74, { size: 9, color: '#202122', align: 'left' });
      for (let i = 0; i < 9; i++) R(x + 20, 100 + i * 20, 220 - (i * 37) % 90, 4, '#c8ccd1');
      T('[ИСТОЧНИК НЕ УКАЗАН]', x + 150 - camR, 100 + ((x / 300 | 0) % 4) * 40, { size: 5, color: '#3366cc' });
      T('(ВРАЖЕСКАЯ ВЕРСИЯ)', x + 260 - camR, 74, { size: 5, color: '#a3111f', align: 'left' });
    }
  }
}
function drawFeedFront() {
  const l = L;
  for (const s of l.dels) if (s.del.st === 'off' && inView(s.del.x0)) { g.globalAlpha = .5; R(s.x, s.del.y, s.w, 12, TGL); g.globalAlpha = 1; T('СООБЩЕНИЕ УДАЛЕНО', s.x + s.w / 2 - camR, s.del.y + 6, { size: 5, color: '#9fb4d8' }); }
  for (const s of l.edits) if (!s.ed.on && inView(s.x)) { g.globalAlpha = .35; R(s.x, s.ed.y, s.w, 12, '#c8ccd1'); g.globalAlpha = 1; T('[ПРАВКА ОТМЕНЕНА]', s.x + s.w / 2 - camR, s.ed.y + 6, { size: 5, color: '#3366cc' }); }
  for (const q of l.geese) {
    if (!inView(q.x)) continue;
    spr((q.t * 4 | 0) % 2 ? 'goose0' : 'goose1', q.x, q.y, q.d < 0);
    if (q.bub) bubble(q.bub.s, q.x - camR, q.y - 36, { size: 8, max: 16, prio: 2 });
    if (q.ad > 0) { const ln = wrap(q.adS, 16), w = 150, h = 18 + ln.length * 12, x = q.x - w / 2, y = q.y - 60 - h; R(x - 2, y - 2, w + 4, h + 4, OUTC); R(x, y, w, h, '#ffe36b'); ln.forEach((s, i) => T(s, q.x - camR, y + 12 + i * 12, { size: 6, color: OUTC })); T('×', x + w - 7 - camR, y + 6, { size: 7, color: OUTC }); }
  }
  for (const q of l.scams) { const sh = q.st === 'fly' ? rint(-1, 1) : 0; spr('scam', q.x + sh, q.y + 14, false); if (q.st === 'fly') T('«НАЧАЛЬНИК»', q.x - camR, q.y - 22, { size: 6, color: '#7fe08a', stroke: OUTC }); }
  for (const c of l.tails) if (!c.got && inView(c.x)) spr('tail', c.x, c.y + Math.round(Math.sin(gameT * 4 + c.x) * 1.5), false);
}
function drawFeedSolid(s, x, y, w) {
  if (s.k === 'f') {
    R(x, y, w, H - y, '#17212b'); R(x, y, w, 3, TGA); R(x, y + 3, w, 3, TGL);
    for (let i = 24; i < w - 30; i += 140) { R(x + i, y + 16, 100, 18, '#0e1621'); T('Сообщение…', x + i + 8 - camR, y + 25, { size: 5, color: '#6c7883', align: 'left' }); }
    R(x, y, 3, H - y, OUTC); R(x + w - 3, y, 3, H - y, OUTC);
  } else if (s.k === 'b') {
    if (s.ad) {
      // рекламная вставка
      R(x, y, w, s.h, OUTC); R(x + 2, y + 2, w - 4, s.h - 4, s.ad.fl > 0 ? '#fff' : '#ffe36b'); s.ad.fl = Math.max(0, s.ad.fl - 1 / 60);
      wrap(s.ad.txt, Math.max(5, w / 9 | 0)).forEach((ln, i) => T(ln, x + w / 2 - camR, y + 18 + i * 12, { size: 6, color: OUTC }));
      T('РЕКЛАМА', x + w / 2 - camR, y + s.h - 12, { size: 5, color: '#a3111f' }); for (let i = 0; i < s.ad.hp; i++) R(x + 6 + i * 8, y + 4, 5, 5, '#a3111f');
      return;
    }
    // пост-сообщение
    R(x, y, w, s.h, OUTC); R(x + 2, y + 2, w - 4, s.h - 4, TGP);
    for (let yy = 10, k = x | 0; yy < s.h - 12; yy += 10, k++) R(x + 8, y + yy, Math.max(8, w - 20 - (k * 13) % 30), 3, '#3a4a5c');
    T('20:38', x + w - 8 - camR, y + s.h - 7, { size: 5, color: '#6c8aa8', align: 'right' });
  } else {
    R(x, y, w, 12, OUTC); R(x + 1, y + 1, w - 2, 10, s.ed ? (s.ed.warn && (gameT * 12 | 0) % 2 ? '#ffd0d6' : '#f6f6f6') : s.del && s.del.st === 'shake' ? ((gameT * 20 | 0) % 2 ? TGL : '#a3111f') : TGL);
    R(x + 5, y + 4, Math.max(6, w - 30), 2, s.ed ? '#a2a9b1' : '#9fc4e8'); R(x + 5, y + 7, Math.max(6, w - 44), 2, s.ed ? '#a2a9b1' : '#9fc4e8');
    if (s.rise) T('ПРОСМ. ' + (12 + ((x / 7) | 0) % 80) + 'К', x + w - 4 - camR, y - 5, { size: 4, color: '#6c8aa8', align: 'right' });
    if (s.mv) { R(x + w / 2 - 5, y + 12, 10, 4, OUTC); R(x + w / 2 - 3, y + 13, 6, 2, TGA); }
  }
}
function drawFeedGate() {
  const x = L.gateX, o = Math.round(L.gate * 118);
  R(x - 14, FY - 152, 98, 152, OUTC); R(x - 10, FY - 148, 90, 148, TGL);
  R(x, FY - 122, 70, 122, '#06040c');
  for (let y = 0; y < 122 - o; y += 8) { R(x, FY - 122 + y, 70, 7, TGP); R(x, FY - 122 + y, 70, 1, TGA); }
  R(x - 30, FY - 186, 130, 24, OUTC); R(x - 28, FY - 184, 126, 20, TGA); T('ПОДПИСАТЬСЯ', x + 35 - camR, FY - 174, { size: 7, color: '#fff' });
  T('КАНАЛ МИРОНОВОЙ', x + 35 - camR, FY - 200, { size: 8, color: '#ff8a94', stroke: OUTC });
}
THEME.feed = { solid: (s, x, y, w) => drawFeedSolid(s, x, y, w), gate: () => drawFeedGate(), update: dt => updateFeed(dt), back: () => drawFeedBack(), front: () => drawFeedFront(), attack: (a, b, c, d) => feedAttack(a, b, c, d) };

// ---------- фоны ----------
function tgBubble(x, bx, by, w, lines, mine) {
  const h = 18 + lines.length * 13;
  x.fillStyle = OUTC; x.fillRect(bx - 2, by - 2, w + 4, h + 4); x.fillStyle = mine ? TGL : TGP; x.fillRect(bx, by, w, h);
  x.font = '7px PS2P,monospace'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillStyle = '#e8f0f8';
  lines.forEach((l, i) => x.fillText(l, bx + 8, by + 12 + i * 13));
  x.font = '5px PS2P,monospace'; x.fillStyle = '#6c8aa8'; x.textAlign = 'right'; x.fillText('ПРОСМ. ' + (8 + (bx * 7) % 40) + 'К  ' + (10 + (by % 13)) + ':' + (10 + (bx % 49)), bx + w - 6, by + h - 6);
}
function makeFeedBg() {
  const [c, x] = mkCanvas(W, H);
  x.fillStyle = TGB; x.fillRect(0, 0, W, H);
  // каракули-узор, как фон чата
  x.strokeStyle = '#152230'; x.lineWidth = 2;
  for (let i = 0; i < 60; i++) { const px = (i * 137) % W, py = (i * 71) % 300 + 40; x.beginPath(); x.arc(px, py, 6 + (i % 4) * 3, 0, Math.PI * (1 + (i % 3) * .4)); x.stroke(); }
  x.fillStyle = '#17212b'; x.fillRect(0, 0, W, 30); x.fillStyle = TGA; x.fillRect(0, 30, W, 1);
  tgBubble(x, 30, 50, 230, ['ТОВАРИЩИ ДОРОГИЕ.', 'Я ВЕДЬ БУКВАЛЬНО', 'НИЧЕГО НЕ ДЕЛАЮ.'], false);
  tgBubble(x, 300, 70, 200, ['ОТКРЫЛ НОВОСТИ.', 'ЗАКРЫЛ НОВОСТИ.'], false);
  tgBubble(x, 540, 44, 230, ['НА САМОМ ДЕЛЕ ЭТО', 'МОИ ХОРОШИЕ СТИХИ'], false);
  tgBubble(x, 60, 170, 180, ['СДЕЛАЛ ЕЩЁ МЕМ'], false);
  tgBubble(x, 290, 160, 250, ['СМЫСЛ ГУСЯ НА МОЁМ', 'КАНАЛЕ В ТОМ, ЧТО…'], false);
  tgBubble(x, 590, 150, 180, ['АГА, ИМЕННО.'], false);
  tgBubble(x, 120, 236, 200, ['ПОЧЕМУ НЕ ПОКАЗЫВАЮ', 'КОТА? ПОТОМУ ЧТО.'], false);
  tgBubble(x, 480, 230, 220, ['НУ ВЫ ПОНЯЛИ.'], false);
  x.fillStyle = 'rgba(6,10,16,.45)'; x.fillRect(0, 0, W, H);
  return c;
}
function makePhoneBg() {
  const [c, x] = mkCanvas(W, H);
  x.fillStyle = '#0a0a12'; x.fillRect(0, 0, W, H);
  // комната: стол, лампа (слева), телефон огромный (справа)
  const gr = x.createRadialGradient(120, 120, 10, 120, 120, 260); gr.addColorStop(0, 'rgba(255,220,150,.18)'); gr.addColorStop(1, 'rgba(255,220,150,0)'); x.fillStyle = gr; x.fillRect(0, 0, 420, 400);
  x.fillStyle = OUTC; x.fillRect(96, 60, 6, 70); x.fillRect(70, 52, 60, 16); x.fillStyle = '#c9a24a'; x.fillRect(72, 54, 56, 12);
  x.fillStyle = '#1c1820'; x.fillRect(0, FYB, W, H - FYB); x.fillStyle = TGA; x.fillRect(0, FYB, W, 2);
  for (let i = 0; i < W; i += 50) { x.fillStyle = '#141018'; x.fillRect(i, FYB + 2, 2, H); }
  return c;
}
function buildFeedArt() { bgFeed = makeFeedBg(); bgPhone = makePhoneBg(); }

// ---------- спрайты ----------
const CM_LOOK = [
  { skin: '#f0c9a0', hair: '#5a4a3a', style: 'short', glasses: true, coat: '#4a5a3a', pants: '#2a3550', shoes: '#2a1c14', stubble: '#c69c7e' },
  { skin: '#e8b890', hair: '#9a9aa6', style: 'bald', coat: '#6a3a3a', shirt: '#e8e4d0', pants: '#3a3a4a', shoes: '#14141a', mus: '#9a9aa6' }
];
function feedSprites() {
  const out = [];
  CM_LOOK.forEach((lk, v) => {
    const a = (n, p) => out.push(dollItem('cm' + v + '_' + n, lk, p, 2));
    a('idle', { armF: [.35, 5, 2.7, 4], prop: 'phone' });
    a('give', { armF: [1.4, 5, 1.55, 5], prop: 'phone', lean: 1.2, mouth: 'o' });
    a('throw', { armF: [2.7, 5, 2.4, 5], lean: -.6, mouth: 'o', brow: true });
    a('run0', Object.assign({}, RUN[0], { prop: 'phone', mouth: 'o' }));
    a('run1', Object.assign({}, RUN[2], { prop: 'phone', mouth: 'o' }));
    a('ko', { armB: [-2.6, 5, -2.2, 5], armF: [2.7, 5, 2.4, 5], lean: -1.4, mouth: 'o', eyes: 'x' });
    a('scared', { armF: [2.3, 4, 3.1, 4], armB: [-2.3, 4, -3.1, 4], mouth: 'o', dy: 1 });
  });
  const m = (n, p) => out.push(dollItem('mb_' + n, LOOK.mir, p, 3));
  m('idle', { armF: [.4, 4, 1.2, 4], prop: 'mega', brow: true });
  m('shout', { armF: [1.9, 4, 2.9, 3.4], prop: 'mega', lean: 1, mouth: 'o', brow: true, legs: [[-.35, 6, -.1, 6.2], [.35, 6, .1, 6.2]], armB: [-.9, 5, -1.9, 4] });
  m('phone', { armF: [2.6, 5, 3, 4], prop: 'phone', armB: [-.3, 5, -.8, 4], lean: -.3, mouth: 'smile', brow: true });
  m('type', { armF: [.9, 5, 2.2, 3.6], prop: 'phone', armB: [.8, 5, 2.1, 3.6], lean: .6, brow: true });
  m('hurt', { armB: [-2.6, 5, -2.2, 5], armF: [2.7, 5, 2.4, 5], lean: -1.4, mouth: 'o', eyes: 'x' });
  m('huff', { armF: [-.3, 4, 1.4, 4], prop: 'mega', armB: [.6, 4, -1.2, 4], brow: true, lean: -.4 });
  // гусь
  for (let f = 0; f < 2; f++) {
    const [gc, gx] = mkCanvas(30, 32), r = (a, b, w, h, k) => { gx.fillStyle = k; gx.fillRect(a, b, w, h); };
    r(4, 14, 20, 12, '#f4f4f0'); r(18, 4, 5, 14, '#f4f4f0'); r(18, 2, 7, 6, '#f4f4f0'); r(25, 4, 5, 3, '#ff9a3a'); r(21, 4, 2, 2, OUTC); r(2, 16, 4, 4, '#e0e0d8'); r(8, 18, 12, 2, '#d8d8d0');
    r(9 + f * 3, 26, 2, 5, '#ff9a3a'); r(15 - f * 3, 26, 2, 5, '#ff9a3a'); r(8 + f * 3, 30, 5, 2, '#ff9a3a'); r(14 - f * 3, 30, 5, 2, '#ff9a3a');
    outline(gx, 30, 32); out.push({ name: 'goose' + f, c: gc, w: 30, h: 32, ax: 15, ay: 32 });
  }
  const icon = (name, w, h, ax, ay, fn) => { const [c, x] = mkCanvas(w, h); fn(x, (a, b, ww, hh, k) => { x.fillStyle = k; x.fillRect(a, b, ww, hh); }); out.push({ name, c, w, h, ax, ay }); };
  icon('kvas', 12, 24, 6, 12, (x, r) => { r(4, 0, 4, 7, OUTC); r(1, 5, 10, 19, OUTC); r(5, 1, 2, 5, '#5a2a0a'); r(2, 6, 8, 17, '#8a4a1a'); r(2, 11, 8, 6, '#e9b616'); r(3, 13, 6, 1, '#a3111f'); r(3, 7, 1, 3, '#c9862a'); });
  icon('scam', 18, 28, 9, 14, (x, r) => { r(0, 0, 18, 28, OUTC); r(2, 2, 14, 22, '#1a2a1a'); r(4, 6, 10, 6, '#7fe08a'); r(4, 16, 4, 4, '#3ddc6a'); r(10, 16, 4, 4, '#e2283a'); r(7, 25, 4, 1, '#566a92'); });
  icon('tail', 10, 24, 5, 24, (x, r) => { r(3, 6, 4, 18, OUTC); r(4, 7, 2, 17, '#e9862a'); r(1, 0, 6, 8, OUTC); r(2, 1, 4, 6, '#e9862a'); r(4, 10, 2, 2, '#b85a1a'); r(4, 16, 2, 2, '#b85a1a'); });
  icon('fheart', 18, 16, 9, 16, x => { heartIcon(x); const d = x.getImageData(0, 0, 18, 16); for (let i = 0; i < d.data.length; i += 4) if (d.data[i] > 150 && d.data[i + 2] < 120) { d.data[i] = 200; d.data[i + 1] = 60; d.data[i + 2] = 200; } x.putImageData(d, 0, 0); x.fillStyle = '#fff'; x.fillRect(8, 4, 2, 4); x.fillRect(8, 9, 2, 2); });
  icon('proof', 20, 16, 10, 16, (x, r) => { r(0, 0, 20, 16, OUTC); r(1, 1, 18, 14, '#e8f0f8'); r(1, 1, 18, 3, TGA); r(3, 6, 12, 1, '#566a92'); r(3, 9, 9, 1, '#566a92'); r(13, 9, 5, 5, '#3ddc6a'); r(14, 11, 1, 1, '#fff'); r(15, 12, 2, 1, '#fff'); });
  return out;
}

// ---------- уровень ----------
function buildLevel6() {
  const k = levelKit(7000), l = k.l, { fl, bl, pl, ag, cs } = k;
  l.name = 'ВНУТРИ КАНАЛА'; l.theme = 'feed'; l.bgA = bgFeed; l.song = 'feed';
  l.risers = []; l.dels = []; l.edits = []; l.geese = []; l.crowds = []; l.scams = []; l.tails = []; l.quips = []; l.sts = []; l.srcT = 2;
  const cm = (x, y, kind, line, v, o) => ag(x, y, kind, line, Object.assign({ as: cmAs(v || 0) }, o || {}));
  const ad = (x, txt, again) => l.solids.push({ x, y: FY - 120, w: 60, h: 120, k: 'b', ad: { hp: 3, txt, fl: 0, again } });
  const riser = (x, w, top, bot, sp, n) => { const r = { top, bot, sp }; for (let i = 0; i < n; i++) { const s = { x, y: bot - (bot - top) * i / n, w, h: 12, k: 'p', rise: r }; l.solids.push(s); l.risers.push(s); } };
  const del = (x, y, w) => { const s = { x, y, w, h: 12, k: 'p', del: { st: 'on', t: 0, y, x0: x } }; l.solids.push(s); l.dels.push(s); };
  const edit = (x, y, w, ph) => { const s = { x, y, w, h: 12, k: 'p', ed: { y, ph, on: true } }; l.solids.push(s); l.edits.push(s); };
  const goose = (x) => l.geese.push({ x, x0: x, y: FY, d: 1, t: rnd(2), bub: null, cd: 0, adT: 0, ad: 0, adS: '' });
  fl(-200, 1300); fl(1580, 2620); fl(2920, 5350); fl(5720, 7200);
  // A: лента
  k.sign(60, 230, ['ТОВАРИЩИ ДОРОГИЕ!', '(И СЛОНЯТА)', 'ВЫ ВНУТРИ КАНАЛА'], 220);
  l.quips.push({ x: 160, s: 'Я ВЕДЬ БУКВАЛЬНО НИЧЕГО НЕ ДЕЛАЮ' });
  cs(330, FY, 'socks', 0);
  goose(520);
  ag(700, FY, 'sit', 'я подписан на вас с 2014-го. блёрб?');
  ad(860, 'КУРСЫ ПИСАТЕЛЬСТВА ЗА 3 ДНЯ', true);
  ag(1060, FY, 'give', 'я из комментов! вручаю лично!');
  l.quips.push({ x: 1180, s: 'СДЕЛАЛ ЕЩЁ МЕМ' });
  riser(1330, 90, 150, 430, 46, 3); pl(1450, 200, 110); l.tails.push({ x: 1490, y: 200 });
  l.gamePost = { x: 1640 };
  l.sts.push({ x: 1720, song: 'dance' });
  cs(1900, FY, 'heart', 1);
  // B: комментарии
  k.check(2000);
  k.sign(2060, 230, ['КОММЕНТАРИИ:', 'СВОБОДЫ СЛОВА', 'В КОММЕНТАХ НЕТ'], 170);
  cm(2280, FY, 'sit', 'ИСТОЧНИК?', 0);
  goose(2420);
  cm(2540, FY, 'patrol', 'А ВЫ ЧИТАЛИ? Я НЕТ', 1, { range: 70 });
  del(2650, 340, 70); del(2760, 310, 70); del(2850, 340, 60);
  cm(3050, FY, 'sit', 'ОНА ПРАВА. КТО ОНА? НЕВАЖНО', 1);
  ad(3200, 'ВПН. БЫСТРЫЙ. НАВЕРНОЕ', false);
  cm(3360, FY, 'patrol', 'ДЯДЯ, ВЫ ДУРАК? ЭТО ВОПРОС', 0, { range: 90 });
  l.quips.push({ x: 3300, s: 'Л — ЛОГИКА' });
  // C: окрошка
  k.check(3560);
  l.okr = [3640, 4900];
  k.sign(3620, 226, ['РУССКИЕ ГОТОВЯТ', 'ОКРОШКУ.', 'СПОР ИДЁТ'], 160);
  l.crowds.push({ x: 3820, kvas: true, t: 1, bub: null }, { x: 4820, kvas: false, t: 1.8, bub: null });
  l.mid = { x: 4320, cd: 0, bub: null };
  bl(4000, 346, 60, 40); pl(4120, 300, 90); bl(4500, 346, 60, 40); pl(4560, 280, 80); l.tails.push({ x: 4600, y: 280 });
  cs(4250, FY, 'books', 3);
  l.sts.push({ x: 4400, song: 'robot' });
  // D: вражеская Википедия
  k.check(5000);
  l.wiki = [5050, 6700];
  l.quips.push({ x: 5060, s: 'ОТКРЫЛ СТАТЬЮ О СЕБЕ ВО ВРАЖЕСКОЙ ВИКИПЕДИИ' });
  cs(5200, FY, 'matryoshka', 2);
  edit(5370, 330, 80, 0); edit(5490, 290, 80, 1); edit(5610, 320, 80, 2);
  l.scams.push({ x: 5900, y: 260, st: 'idle', t: 0 }, { x: 6350, y: 240, st: 'idle', t: 0 });
  cm(6050, FY, 'sit', 'ПРАВЛЮ СТАТЬЮ О ВАС. ДЛЯ ТОЧНОСТИ', 0);
  bl(6150, 346, 70, 40); l.tails.push({ x: 6185, y: 346 }); l.pot = { x: 6185, y: 346 };
  cs(6300, FY, 'letter', 4);
  k.check(6500);
  k.sign(6460, 230, ['ЗАКРЕП:', '«НИКТО НЕ УМРЁТ»', '(НОВАЯ КНИГА)'], 160);
  l.quips.push({ x: 6600, s: 'НУ ВЫ ПОНЯЛИ' });
  l.fallX = 3000;
  feedSongT = 0;
  return k.done();
}
LEVELS.push({
  name: 'ВНУТРИ КАНАЛА', sub: 'босс: ???', build: buildLevel6, boss: true, bossKind: 'nas', tag: 'СВОБОДЫ СЛОВА В КОММЕНТАХ НЕТ',
  endA: 'ОТПИСАЛСЯ.', endB: 'Роман пишется. Без блёрбов.', relocLabel: 'ЗАБАНЕНО',
  extraRows: () => [['ХВОСТОВ КОТА', stats.tails + '/3']],
  cast: [['АЛЕКСАНДР ПЕЛЕВИН', 'отписался'], ['АНАСТАСИЯ МИРОНОВА', 'финальный босс. пост пишется'], ['ВИТАЛИЙ БОРОДИН', 'на проверке'], ['МАРИЯ ДЕГТЕРЕВА', 'боится света'], ['ЖЕЛЕЗНЫЙ БОРИС', 'металлолом'], ['ВЛАДИСЛАВ УГОЛЬНЫЙ', 'гойда'], ['ВИКТОР ПЕЛЕВИН', 'в пустоте'], ['ИНОАГЕНТЫ', 'собирательные образы'], ['КОММЕНТАТОРЫ', 'забанены'], ['КВАС И КЕФИР', 'ничья'], ['КОТ', 'не покажу'], ['КНИГА', 'твёрдый переплёт'], ['ГУСЬ', 'смысл гуся в том, что—']]
});

// ---------- босс: Анастасия Миронова в огромном телефоне ----------
const NAS_GREET = ['О. ПЕЛЕВИН. В МОЁМ КАНАЛЕ.', 'Я УЖЕ НАПИСАЛА ОБ ЭТОМ ПОСТ.', 'И ЕЩЁ ОДИН. ПРО ГРАНТЫ.', 'НАЧИНАЕМ ЭФИР!'];
const NAS_SHOUT = ['ПРИЛЕПИНСКИЕ ГРАНТЫ!!!', 'Я ВСЁ ПОСЧИТАЛА!', 'ЭТО ПОЙДЁТ В ПОСТ!', 'СКРИНШОТ СДЕЛАН!', 'ВЫ МНЕ УГРОЖАЕТЕ КНИГОЙ?!', 'ПОДПИСЫВАЙТЕСЬ НА КАНАЛ!', 'ЭТО ВЫ НАЧАЛИ!'];
const NAS_HURT = ['НАПАДЕНИЕ НА ЖУРНАЛИСТКУ!', 'ЭТО ПОЙДЁТ В ПОСТ!', 'ВСЁ ЗАПИСАНО!', 'ТАК И НАПИШУ!', 'КТО ВАМ ДАЛ ГРАНТ НА ЭТО?!'];
const NAS_WORDS = ['ГРАНТЫ!', 'ПРИЛЕПИН!', 'СКРИН!', 'ПОСТ!', 'ОТЧЁТ!', 'КТО ДАЛ?!', 'ФЕЙК!', 'СТИХИ ПЛОХИЕ!'];
const NAS_POSTS = ['ПОСТ ПРО ПЕЛЕВИНА', 'ПЕЛЕВИН И ГРАНТЫ', 'ВСЯ ПРАВДА (ЧАСТЬ 9)', 'Я ПРЕДУПРЕЖДАЛА', 'ОПЯТЬ ОН'];
const NAS_SEQ = [null, ['words', 'posts', 'edit', 'words', 'rec'], ['words', 'rec', 'posts', 'edit', 'words', 'posts'], ['posts', 'words', 'rec', 'edit', 'words', 'posts', 'rec']];
let slabs = [], nasCard = 0;
function startNas() {
  L = buildBossLevel(); L.theme = 'feed'; L.bg = bgPhone; L.song = 'nas'; L.name = 'КАНАЛ';
  cam = 0; look = 0; slabs = []; nasCard = 0;
  parts = []; gibs = []; pickups = []; folders = []; floats = []; fxs = []; blurbs = []; words = []; mir = null;
  Object.assign(P, { x: 90, y: FYB, vx: 0, vy: 0, hp: P.maxhp, face: 1, inv: 0, hurtT: 0, atk: 0, onGround: true, idleT: 0, bub: null, clean: 0, crouch: false, h: 76, idleAnim: '', safeX: 90, safeY: FYB, vodka: 0, kefir: 0, signT: 0 });
  boss = { kind: 'nas', title: 'АНАСТАСИЯ МИРОНОВА', x: 610, y: FYB, hp: 14, max: 14, phase: 1, state: 'greet', t: 0, n: 0, seq: 0, line: 0, face: -1, fl: 0, inv: 0, bub: null, dead: false, started: false,
    edits: [], recounted: {}, saved: false, heartT: 6, off: false, home: -1, ds: 0 };
  mode = 'play'; modeT = 0; scene = 'play'; chain = 0; pendingCele = false; stopSong();
  banner = { s: 'КАНАЛ МИРОНОВОЙ', sub: 'вы подписаны', t: 2.2 };
}
function nasBegin() { const b = boss; if (b.started) return; b.started = true; banner = null; playSong('nas'); nasCard = 3.8; nasNext(); }
function nasNext() {
  const b = boss, s = NAS_SEQ[b.phase]; b.state = s[b.seq % s.length]; b.seq++; b.t = 0; b.n = 0;
  if (b.state === 'edit') say(b, pick(['СЕЙЧАС ПОПРАВЛЮ…', 'РЕДАКТИРУЮ ФАКТЫ', 'ЭТОГО НЕ БЫЛО']), 1.6);
  else if (b.state === 'rec') say(b, pick(['СНИМАЮ!', 'ДАВАЙ, УДАРЬ. Я ЗАПИСЫВАЮ', 'УЛЫБНИСЬ, ЭТО ДЛЯ ПОСТА']), 1.6);
  else if (!b.bub && Math.random() < .55) say(b, pick(NAS_SHOUT), 1.5);
}
function nasDamage(by) {
  const b = boss; if (b.dead || mode !== 'play' || b.inv > 0) return;
  b.hp--; b.inv = .3; b.fl = .3; hitstop = .06; shake = Math.max(shake, 7); sfx.bonk(); sfx.shout();
  floater(by === 'word' ? pick(['ВЕРНУЛ СЛОВО', 'СЛОВО — ВОРОБЕЙ', 'ОБРАТНО В ЭКРАН']) : pick(['ОТКАЗ!', 'НЕ ГРАНТ!', 'ОТПИСКА!']), b.x, b.y - 150, { color: '#ffe36b', size: 10, t: .9, vy: -40 });
  if (b.state === 'edit') { b.edits.push({ t: 1.1 }); floater('…РЕДАКТИРУЕТ', b.x, b.y - 170, { color: '#5eb5f7', size: 8, t: .9 }); }
  if (b.hp <= 0 && !b.edits.length) { nasWin(); return; }
  const np = b.hp <= 5 ? 3 : b.hp <= 10 ? 2 : 1;
  if (np > b.phase) {
    b.phase = np; b.seq = 0;
    // «у меня другие цифры»: пересчитала здоровье, выпадает скриншот-пруф
    if (!b.recounted[np]) {
      b.recounted[np] = true; b.hp = Math.min(b.max, b.hp + 3); sfx.typewriter();
      floater('ПО МОИМ ДАННЫМ: +3', b.x, b.y - 180, { color: '#ff8a94', size: 11, t: 1.8, vy: -20 }); say(b, 'У МЕНЯ ДРУГИЕ ЦИФРЫ!', 1.8);
      pickups.push({ k: 'proof', x: clamp(P.x + rnd(-120, 120), 50, 420), y: 40, vx: 0, vy: 0, t: 0, onPick: () => { const bb = boss; if (!bb || bb.dead) return; bb.hp = Math.max(1, bb.hp - 3); sfx.stamp(); shake = 8; floater('ФАКТЧЕК: ОПРОВЕРГНУТО', W / 2, 110, { scr: true, color: '#3ddc6a', size: 14, t: 1.6, vy: -10 }); say(bb, 'ЭТО ФЕЙК! ФОТОШОП!', 1.6); say(P, 'ИСТОЧНИК: СКРИНШОТ', 1.2); } });
      floater('СКРИНШОТ-ПРУФ!', W / 2, 150, { scr: true, color: '#3ddc6a', size: 10, t: 1.6 });
    }
  }
  if (!b.bub || Math.random() < .5) say(b, pick(NAS_HURT), 1.3);
}
function nasMelee(x0, x1, y0, y1) {
  const b = boss; if (!b || b.dead || b.off) return;
  // отбить слова обратно в экран
  for (const w of words) if (!w.back && w.x > x0 - 30 && w.x < x1 + 30 && w.y > y0 && w.y < y1) { w.back = true; w.vx = Math.abs(w.vx) * 1.8 * sign(b.x - w.x || 1); w.col = '#7fe08a'; sfx.paper(); }
  if (P.atkSet.has(b)) return;
  if (b.x + 24 > x0 && b.x - 24 < x1 && b.y > y0 && b.y - 120 < y1) {
    P.atkSet.add(b);
    if (!b.started) { nasBegin(); return; }
    if (b.state === 'rec' && b.t > .4) {
      // «это ты меня ударил»: урон уходит тебе
      sfx.stamp(); flash = .4; P.inv = 0; floater('ПОСТ: «ПЕЛЕВИН ОПЯТЬ ПИШЕТ ПЛОХИЕ СТИХИ»', P.x, P.y - 130, { color: '#ff8a94', size: 8, t: 2.2, vy: -16 });
      hurtPlayer(-1, false, 'skrin'); say(b, pick(['ЗАСКРИНИЛА!', 'ВСЕ ВИДЕЛИ? ОН НАПАЛ!', 'ЭТО ВЫ МЕНЯ УДАРИЛИ']), 1.6);
      setTimeout(() => { if (mode === 'play') say(P, 'НА САМОМ ДЕЛЕ ЭТО МОИ ХОРОШИЕ СТИХИ', 1.8); }, 500);
    } else nasDamage('book');
  }
}
function nasPapers() {
  const b = boss; if (!b || b.dead || b.off) return;
  for (let i = words.length - 1; i >= 0; i--) { const w = words[i]; if (w.back && Math.abs(w.x - b.x) < 30) { words.splice(i, 1); burst(b.x, w.y, 12, ['#7fe08a', '#fff'], 180, .4); nasDamage('word'); } }
}
// не дать умереть: один раз
function nasSave() {
  const b = boss; if (!b || b.saved || b.dead) return false;
  b.saved = true; P.hp = P.maxhp; P.inv = 2.2; P.hurtT = .4; P.vx = -150; P.vy = -300; hitstop = .5; flash = .8; shake = 14; sfx.shout(); sfx.boom();
  say(b, 'ЭТО Я РЕШАЮ, КОГДА МЫ ЗАКОНЧИМ!', 2.8);
  floater('«НИКТО НЕ УМРЁТ»', W / 2, 140, { scr: true, color: '#fff', size: 18, t: 2.4, vy: -6 });
  words = words.filter(w => w.back); slabs = [];
  return true;
}
function nasFakeHeart() {
  const fake = Math.random() < .55, x = clamp(P.x + rnd(-160, 160), 40, 440);
  if (fake) pickups.push({ k: 'fheart', x, y: 30, vx: 0, vy: 0, t: 0, onPick: () => { floater('ФЕЙК. ОПРОВЕРГНУТО', P.x, P.y - 100, { color: '#c83cc8', size: 9, t: 1.6 }); hurtPlayer(0, false, 'fake'); } });
  else pickups.push({ k: 'heart', x, y: 30, vx: 0, vy: 0, t: 0 });
}
function updateNas(dt) {
  const b = boss; if (!b || b.dead) return;
  b.t += dt; b.fl = Math.max(0, b.fl - dt); b.inv = Math.max(0, b.inv - dt); nasCard = Math.max(0, nasCard - dt);
  if (b.bub) { b.bub.t -= dt; if (b.bub.t <= 0) b.bub = null; }
  const ph = b.phase;
  switch (b.state) {
    case 'greet':
      if (b.t > .9 && !b.bub) { if (b.line >= NAS_GREET.length) { nasBegin(); break; } say(b, NAS_GREET[b.line++], 2); b.t = -1.1; sfx.blip2(); }
      break;
    case 'words': {
      const cnt = [4, 5, 6][ph - 1], gap = [.85, .7, .6][ph - 1];
      if (b.n < cnt && b.t > .3 + gap * b.n) {
        b.n++; const low = Math.random() < .5, flip = Math.random() < [.3, .45, .6][ph - 1];
        words.push({ x: b.x - 40, y: FYB - (low ? 14 : 70), vx: -[220, 240, 260][ph - 1], s: pick(NAS_WORDS), t: 0, flip, flipped: false, col: flip ? '#ff9ad0' : undefined, kind: 'word', txt: '«ГРАНТОЕД» — ПОСТ' });
        sfx.shout();
      }
      if (b.t > .3 + gap * cnt + .5) nasNext();
      break;
    }
    case 'posts': {
      const cnt = [3, 4, 5][ph - 1];
      if (b.n < cnt && b.t > .4 + b.n * .55) { b.n++; slabs.push({ x: clamp(P.x + rnd(-90, 90), 50, 450), y: -50, vy: 0, w: 96, s: pick(NAS_POSTS), warn: .7 }); sfx.typewriter(); }
      if (b.t > .4 + cnt * .55 + 1.6) nasNext();
      break;
    }
    case 'edit': if (b.t > 2.8) nasNext(); break;
    case 'rec': if (b.t > 2.6) nasNext(); break;
  }
  // слово «переврано»: на полпути меняет высоту
  for (const w of words) if (w.flip && !w.flipped && !w.back && w.t > .5) { w.flipped = true; w.y = w.y > FYB - 40 ? FYB - 70 : FYB - 14; floater('ПЕРЕВРАНО', w.x, w.y - 18, { color: '#ff9ad0', size: 7, t: .6 }); }
  // правки откатывают урон
  for (let i = b.edits.length - 1; i >= 0; i--) { const e = b.edits[i]; e.t -= dt; if (e.t <= 0) { b.edits.splice(i, 1); b.hp = Math.min(b.max, b.hp + 1); floater('ЭТОГО НЕ БЫЛО (ИЗМЕНЕНО)', b.x, b.y - 160, { color: '#5eb5f7', size: 8, t: 1.2 }); sfx.typewriter(); } }
  if (b.hp <= 0 && !b.edits.length && b.started) { nasWin(); return; }
  // посты-плиты падают сверху
  for (let i = slabs.length - 1; i >= 0; i--) {
    const s = slabs[i];
    if (s.warn > 0) { s.warn -= dt; continue; }
    s.vy += 900 * dt; s.y += s.vy * dt;
    if (mode === 'play' && P.inv <= 0 && Math.abs(P.x - s.x) < s.w / 2 + 6 && s.y > P.y - P.h && s.y - 40 < P.y) { floater('ПРИДАВЛЕН ПОСТОМ', P.x, P.y - 110, { color: '#5eb5f7', size: 8, t: 1.4 }); hurtPlayer(sign(P.x - s.x) || 1, false, 'post'); }
    if (s.y >= FYB) { slabs.splice(i, 1); shake = Math.max(shake, 5); sfx.thud(); burst(s.x, FYB - 2, 14, [TGA, '#fff', TGL], 180, .4); }
  }
  // сердечки: настоящие и фейковые
  if (b.started) { b.heartT -= dt; if (b.heartT <= 0) { b.heartT = rnd(7, 10); nasFakeHeart(); } }
  b.face = -1;
}
function nasWin() {
  const b = boss; mode = 'bossdeath'; modeT = 0; b.state = 'lose'; b.bub = null; stopSong();
  blurbs = []; slabs = []; P.atk = 0; b.ds = 0; b.lastW = null;
  words = [];
}
function updateNasDeath(dt) {
  const b = boss; P.vx *= .9; P.vy = Math.min(900, P.vy + GRAV * dt); collide(P, dt);
  P.atk = Math.max(0, P.atk - dt);
  if (b.bub) { b.bub.t -= dt; if (b.bub.t <= 0) b.bub = null; }
  const t = modeT, at = k => t >= k && t - dt < k;
  if (at(.4)) say(b, 'Я НЕ ПРОИГРАЛА.', 1.6);
  if (at(2.2)) say(b, 'ЭТО ПОЙДЁТ В ПОСТ!', 1.6);
  if (t > 2 && t < 4) { b.ds = Math.min(1, (t - 2) / 2); if ((t * 6 | 0) !== ((t - dt) * 6 | 0)) { sfx.stamp(); shake = Math.max(shake, 3); } }
  if (at(4)) { say(b, 'ГРАНТЫ!!!', 1); sfx.shout(); b.lastW = { x: b.x - 40, y: FYB - 50, vx: -340, back: false }; }
  const w = b.lastW;
  if (w) {
    w.x += w.vx * dt;
    if (!w.back && w.x < P.x + 60) { w.back = true; w.vx = 520; P.face = 1; P.atk = ATK_T; sfx.swing(); sfx.bonk(); hitstop = .1; }
    if (w.back && w.x > b.x - 20) { b.lastW = null; b.off = true; flash = 1; shake = 18; sfx.boom(); burst(600, 200, 60, ['#fff', TGA, '#ff8a94'], 320, .9, 200); memorial.push(['Анастасия Миронова', 'отписка оформлена. пост пишется']); b.offT = t; }
  }
  if (b.off && t - b.offT > 1.2 && !b.said) { b.said = true; say(P, 'Я ОТПИСАЛСЯ.', 2.6); P.clean = 1; }
  if (b.off && t - b.offT > 4 && b.home < 0) { b.home = 0; playSong('listva'); }
  if (b.home >= 0) {
    const h = b.home; b.home += dt;
    if (h < 1.6 && h + dt >= 1.6) { sfx.blip2(); tn('square', 180, 160, .25, .15); tn('square', 180, 160, .25, .15, .35); }
    if (h < 3.6 && h + dt >= 3.6) sfx.click();
    if (h < 5.4 && h + dt >= 5.4) tn('square', 300, 260, .12, .12);
    if (h > 7.6 && !fadeDir && mode === 'bossdeath') { mode = 'won'; fadeTo(() => { stats.left = 0; startEnding(); }); }
  }
}
function drawNas() {
  const b = boss;
  // огромный телефон
  const x0 = 470, x1 = 750, y0 = 46, y1 = FYB + 2;
  R(x0 - 8, y0 - 8, x1 - x0 + 16, y1 - y0 + 8, OUTC); R(x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 4, '#2a2a34'); R(x0 + 110, y0 - 2, 60, 4, '#0a0a10');
  if (b.off) { R(x0, y0, x1 - x0, y1 - y0, '#050508'); g.globalAlpha = .12; R(x0 + 20, y0 + 10, 40, y1 - y0 - 20, '#fff'); g.globalAlpha = 1; }
  else {
    R(x0, y0, x1 - x0, y1 - y0, TGB); R(x0, y0, x1 - x0, 28, '#17212b');
    T('АНАСТАСИЯ МИРОНОВА', (x0 + x1) / 2, y0 + 10, { size: 7, color: '#fff' }); T(b.state === 'edit' ? 'редактирует…' : b.state === 'rec' ? 'записывает видео…' : 'печатает…', (x0 + x1) / 2, y0 + 21, { size: 5, color: TGA });
    for (let i = 0; i < 6; i++) { const yy = y0 + 40 + ((i * 52 + gameT * 30) % 300); if (yy < y1 - 30) { R(x0 + 14, yy, 120 + (i * 37) % 90, 36, TGP); R(x0 + 22, yy + 8, 90, 3, '#3a4a5c'); R(x0 + 22, yy + 16, 70, 3, '#3a4a5c'); } }
  }
  if (!b.off) {
    let n = 'idle', ox = 0;
    if (mode === 'bossdeath') { n = b.ds > .5 ? 'huff' : 'hurt'; ox = rint(-2, 2); }
    else if (b.fl > 0) n = 'hurt';
    else if (b.state === 'rec') n = 'phone';
    else if (b.state === 'edit') n = 'type';
    else if (b.state === 'words') n = (b.t * 4 | 0) % 2 ? 'shout' : 'idle';
    else if (b.state === 'posts') n = 'type';
    spr('mb_' + n, b.x + ox, b.y, true);
    if (b.fl > .12) spr('mb_' + n, b.x + ox, b.y, true, { img: atlasW, a: .6 });
    if (b.state === 'rec') { R(b.x - 60, y0 + 36, 12, 12, (gameT * 4 | 0) % 2 ? '#e2283a' : '#601018'); T('REC', b.x - 34, y0 + 42, { size: 7, color: '#e2283a' }); }
    if (b.state === 'edit' && (gameT * 3 | 0) % 2) T('РЕДАКТИРУЕТ…', b.x, y0 + 46, { size: 8, color: TGA, stroke: OUTC });
  }
  // трещины по экрану
  const cr = mode === 'bossdeath' ? 1 : 1 - b.hp / b.max;
  g.strokeStyle = 'rgba(230,240,255,.7)'; g.lineWidth = 2;
  for (let i = 0; i < Math.floor(cr * 8); i++) { const cx = x0 + 40 + (i * 97) % 200, cy = y0 + 50 + (i * 61) % 240; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 30 - (i % 3) * 25, cy + 40); g.lineTo(cx + 10, cy + 80); g.moveTo(cx, cy); g.lineTo(cx - 34, cy - 20 + (i % 2) * 30); g.stroke(); }
  for (const s of slabs) {
    if (s.warn > 0) { const k = 1 - s.warn / .7; R(s.x - s.w / 2 * k, FYB - 3, s.w * k, 3, (gameT * 16 | 0) % 2 ? '#5eb5f7' : '#fff'); continue; }
    R(s.x - s.w / 2 - 2, s.y - 42, s.w + 4, 44, OUTC); R(s.x - s.w / 2, s.y - 40, s.w, 40, TGP); R(s.x - s.w / 2, s.y - 40, s.w, 3, TGA);
    T(s.s, s.x, s.y - 28, { size: 5, color: '#fff' }); R(s.x - s.w / 2 + 6, s.y - 18, s.w - 20, 2, '#3a4a5c'); R(s.x - s.w / 2 + 6, s.y - 12, s.w - 34, 2, '#3a4a5c');
  }
  if (b.lastW) T('ГРАНТЫ!!!', b.lastW.x, b.lastW.y, { size: 16, color: b.lastW.back ? '#7fe08a' : '#ff5b6b', stroke: OUTC, sw: 5 });
  if (b.bub && !b.off) bubble(b.bub.s, b.x, b.y - 136, { prio: 5, size: 10, max: 18, bg: '#ffe9ec', color: '#a3111f', shake: b.fl > 0 ? 2 : 0 });
}
function drawHome(c, h) {
  const a = Math.min(1, h / .8);
  c.save(); c.globalAlpha = a;
  c.fillStyle = '#1a1420'; c.fillRect(0, 0, W, H);
  const gr = c.createRadialGradient(330, 220, 10, 330, 220, 300); gr.addColorStop(0, 'rgba(255,220,150,.3)'); gr.addColorStop(1, 'rgba(255,220,150,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
  c.fillStyle = '#2a2030'; c.fillRect(0, 330, W, H - 330);
  // окно с ночью
  c.fillStyle = OUTC; c.fillRect(520, 60, 180, 140); c.fillStyle = '#121a3a'; c.fillRect(526, 66, 168, 128); c.fillStyle = '#fff6c8'; c.fillRect(640, 90, 12, 12); c.fillStyle = OUTC; c.fillRect(608, 66, 4, 128); c.fillRect(526, 128, 168, 4);
  // стол, лампа
  c.fillStyle = OUTC; c.fillRect(180, 300, 340, 14); c.fillRect(200, 314, 12, 70); c.fillRect(490, 314, 12, 70); c.fillStyle = '#6a4428'; c.fillRect(182, 302, 336, 9);
  c.fillStyle = OUTC; c.fillRect(436, 230, 6, 72); c.fillRect(416, 222, 46, 14); c.fillStyle = '#c9a24a'; c.fillRect(418, 224, 42, 10);
  c.fillStyle = '#f4f0e0'; c.fillRect(300, 290, 60, 12); c.fillStyle = '#8a8a9a'; for (let i = 0; i < 3; i++) c.fillRect(306, 293 + i * 3, 40 - i * 8, 1);
  // Пелевин пишет
  const ff = F.p_write;
  c.drawImage(atlas, ff[0], ff[1], ff[2], ff[3], 270 - ff[4], 330 - ff[5] - ((h * 8 | 0) % 2 ? 1 : 0), ff[2], ff[3]);
  // телефон на столе
  const buzz = h > 1.6 && h < 3.6;
  const px = 392 + (buzz ? rint(-1, 1) : 0);
  c.fillStyle = OUTC; c.fillRect(px, 290, 30, 12);
  c.fillStyle = h > 3.6 ? '#2a2a34' : buzz ? '#5eb5f7' : '#17212b'; c.fillRect(px + 2, 292, 26, 8);
  c.font = '8px PS2P,monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
  if (buzz) { c.fillStyle = OUTC; c.fillRect(330, 236, 210, 40); c.fillStyle = '#e8f0f8'; c.fillRect(332, 238, 206, 36); c.fillStyle = '#5a6a7a'; c.font = '6px PS2P,monospace'; c.fillText('МИРОНОВА:', 435, 248); c.fillStyle = OUTC; c.font = '7px PS2P,monospace'; c.fillText('НОВЫЙ ПОСТ ПРО ВАС', 435, 263); }
  if (h > 3.6 && h < 5) { c.fillStyle = '#ffe36b'; c.font = '7px PS2P,monospace'; c.fillText('(экраном вниз)', 407, 318); }
  // гусь
  if (h > 5) {
    const g0 = F[(h * 4 | 0) % 2 ? 'goose0' : 'goose1'], gx = Math.min(640, 820 - (h - 5) * 120);
    c.drawImage(atlas, g0[0], g0[1], g0[2], g0[3], gx - g0[4], 384 - g0[5], g0[2], g0[3]);
    if (h > 6) { c.fillStyle = OUTC; c.fillRect(gx - 120, 304, 214, 30); c.fillStyle = '#fff'; c.fillRect(gx - 118, 306, 210, 26); c.fillStyle = OUTC; c.font = '7px PS2P,monospace'; c.fillText('СМЫСЛ ГУСЯ В ТОМ, ЧТО—', gx - 13, 319); }
  }
  c.restore();
}
function drawNasHud() {
  const b = boss;
  // дом: Пелевин пишет роман, телефон экраном вниз (поверх всего интерфейса)
  if (b.home >= 0) { OV.push(c => drawHome(c, b.home)); return; }
  if (nasCard > 0) OV.push(c => { c.globalAlpha = Math.min(1, nasCard * 2, (3.8 - nasCard) * 4); c.fillStyle = OUTC; c.fillRect(W / 2 - 210, 56, 420, 50); c.fillStyle = '#17212b'; c.fillRect(W / 2 - 206, 60, 412, 42); c.font = '11px PS2P,monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText('ВСЁ БУДЕТ ПЕРЕВРАНО', W / 2, 74); c.font = '7px PS2P,monospace'; c.fillStyle = TGA; c.fillText('отбивай слова книгой. не бей, когда снимает', W / 2, 92); c.globalAlpha = 1; });
  if (!b.started || b.dead || mode === 'bossdeath') return;
  T('АНАСТАСИЯ МИРОНОВА', W / 2, 16, { size: 9, color: '#ff8a94', stroke: OUTC });
  OV.push(c => { c.fillStyle = OUTC; c.fillRect(W / 2 - 152, 26, 304, 12); const sw = 300 / b.max; for (let i = 0; i < b.max; i++) { c.fillStyle = i < b.hp ? (b.phase === 3 ? '#ff5b6b' : b.phase === 2 ? '#ffb35b' : '#ff8a94') : '#2a3350'; c.fillRect(W / 2 - 150 + i * sw, 28, sw - 2, 8); } });
  if (b.edits.length) T('(ИЗМЕНЕНО)', W / 2 + 190, 32, { size: 7, color: TGA, stroke: OUTC, align: 'left' });
}
// кат-сцена: Пелевин листает ленту, его затягивает в телефон
function nasIntroTick(dt) {
  const t = sceneT, at = k => t >= k && t - dt < k;
  if (at(.8) || at(1.6)) sfx.blip2();
  if (t > 2.6 && t < 3.8 && ((t - 2.6) * 12 | 0) !== ((t - dt - 2.6) * 12 | 0)) sfx.blip();
  if (at(4.4)) { sfx.whoosh(); flash = .5; }
}
function drawNasIntro() {
  const t = sceneT;
  g.drawImage(bgPhone, 0, 0);
  const k = t > 4.4 ? Math.min(1, (t - 4.4) / .8) : 0;
  spr('p_phone', 200 + k * 360, FYB - k * 60, false, { sx: 1 - k * .8, rot: k * 6 });
  R(462, 38, 296, FYB - 30, OUTC); R(470, 46, 280, FYB - 44, TGB); R(470, 46, 280, 28, '#17212b');
  T('АНАСТАСИЯ МИРОНОВА', 610, 56, { size: 7, color: '#fff' });
  spr('mb_idle', 610, FYB, true);
  if (t > .8 && t < 2.4) bubble('ОПЯТЬ ЛИСТАЕТ МОЙ КАНАЛ', 610, FYB - 136, { prio: 5, size: 9, max: 18, bg: '#ffe9ec', color: '#a3111f' });
  if (t > 1.6 && t < 3) bubble('ОТКРЫЛ НОВОСТИ…', 200, FYB - 96, { prio: 4, size: 9, max: 14, bg: '#e9f1ff', color: '#1b2a6b' });
  const nm = 'АНАСТАСИЯ МИРОНОВА', n = clamp(((t - 2.6) * 12 | 0), 0, nm.length);
  T(nm.slice(0, n), 240, 120, { size: 16, color: '#fff', stroke: '#a3111f', sw: 6 });
  if (t > 3.6) T('финальный босс. всё переврёт', 240, 150, { size: 8, color: '#ff8a94', stroke: OUTC });
  if (t > 4.4) T('…И ЗАКРЫТЬ НЕ УСПЕЛ', 240, 180, { size: 10, color: '#ffe36b', stroke: OUTC });
}
BK.nas = { start: startNas, update: updateNas, death: updateNasDeath, draw: drawNas, hud: drawNasHud, melee: nasMelee, papers: nasPapers, intro: drawNasIntro, introTick: nasIntroTick, introLen: 6, save: nasSave };
Object.assign(window.__dbg, { nas() { curLevel = 5; startNas(); }, nasIntro() { curLevel = 5; startBossIntro(); }, feed: () => L, hurt() { hurtPlayer(1, false, 'post'); } });

// ---------- музыка ----------
// лента: бодро, соль мажор, «уведомления»
SONGS.feed = {
  bpm: 140, loop: true, tr: [
    { w: 'p25', v: .08, s: seq('G5:2 B5:2 D6:2 B5:2 C6:2 A5:2 F#5:2 A5:2 G5:2 B5:2 D6:2 G6:2 F#6:4 D6:4 E6:2 D6:2 C6:2 B5:2 A5:2 B5:2 C6:2 A5:2 B5:2 G5:2 D5:2 G5:2 A5:8 C6:2 E6:2 G6:2 E6:2 D6:2 B5:2 G5:2 B5:2 A5:2 C6:2 E6:2 C6:2 B5:4 G5:4 C6:2 B5:2 A5:2 G5:2 F#5:2 G5:2 A5:2 F#5:2 G5:6 D5:2 G5:8') },
    { w: 'triangle', v: .22, s: bassLine(['G2', 'D2', 'C2', 'D2', 'C2', 'A1', 'D2', 'G2']) }
  ], dr: 'k.h.s.hkk.h.s.h.'
};
// Миронова: си минор, быстро и зло
SONGS.nas = (() => {
  const lead = ['B4:1 B4:1 D5:2 F#5:2 B5:2 A5:2 F#5:2 D5:2 E5:2', 'F#5:2 F#5:1 F#5:1 E5:2 D5:2 C#5:4 A4:4', 'B4:1 B4:1 D5:2 F#5:2 B5:2 C#6:2 D6:2 C#6:2 B5:2', 'A#5:2 F#5:2 C#5:2 F#5:2 B4:8',
    'G5:2 G5:1 A5:1 B5:2 G5:2 F#5:2 F#5:1 G5:1 A5:2 F#5:2', 'E5:2 E5:1 F#5:1 G5:2 E5:2 D5:4 C#5:4', 'D5:2 F#5:2 B5:2 D6:2 C#6:2 A#5:2 F#5:2 C#6:2', 'B5:6 F#5:2 B4:8'].join(' ');
  const echo = seq('-:1 ' + lead); echo[echo.length - 1][1] -= 1;
  return { bpm: 168, loop: true, tr: [{ w: 'p25', v: .09, s: seq(lead) }, { w: 'p12', v: .03, s: echo }, { w: 'triangle', v: .26, s: bassLine(['B1', 'F#1', 'B1', 'F#1', 'G1', 'E2', 'B1', 'F#1']) }], dr: 'k.hhs.hkk.hhs.hh' };
})();
