/*
 * Sahaay landing page behaviour.
 * Each demo runs on its own clock and only while it's on screen. Booking and the chat widget
 * live in widget.js (window.Sahaay).
 */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const Sahaay = window.Sahaay || {};
const $ = (id) => document.getElementById(id);

// Run `start` while `el` is on screen and the tab is visible; `stop` otherwise.
function whileVisible(el, start, stop, threshold = 0.25) {
  if (!el) return;
  let onScreen = false;
  const sync = () => (onScreen && !document.hidden ? start() : stop());
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }, { threshold }).observe(el);
  } else { onScreen = true; sync(); }
  document.addEventListener('visibilitychange', sync);
}

// A pausable clock: calls tick(t) every frame with ms elapsed while running.
function clock(tick) {
  let t = 0; let last = 0; let running = false;
  const frame = (now) => {
    if (!running) return;
    t += last ? Math.min(now - last, 100) : 0;
    last = now;
    t = tick(t) ?? t;
    requestAnimationFrame(frame);
  };
  return {
    play() { if (running) return; running = true; last = 0; requestAnimationFrame(frame); },
    pause() { running = false; },
    reset() { t = 0; },
  };
}

/* ---------- Booking links ---------- */
document.querySelectorAll('[data-book]').forEach((a) => a.addEventListener('click', (e) => {
  if (!Sahaay.openBooking) return;
  e.preventDefault();
  Sahaay.openBooking();
}));
if ($('year')) $('year').textContent = new Date().getFullYear();

/* ---------- 2 · A shop, a website, and Sahaay (scroll story) ---------- */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const story = document.getElementById('shop-story');
  const root = document.querySelector('.shopstory');
  const scene = document.getElementById('shop-scene');
  const web = document.getElementById('shop-web');
  const lines = [...document.querySelectorAll('#lines li')];
  const keeper = document.getElementById('keeper');
  const orb = document.getElementById('shop-orb');
  const QA = [
    ['Will it fit me?', 'It runs true to size. Try S.'],
    ['How long is delivery?', '4 to 7 days, free above ₹1,999.'],
    ['Can I return it?', 'Yes, within 14 days of delivery.'],
    ['Is this in M?', 'Yes, M is in stock in both colours.'],
    ['Which colour is best?', 'Terracotta is the favourite.'],
    ['Is it breathable?', 'Yes, it’s light viscose crepe.'],
  ];
  const PRICES = [2599, 3499, 1399, 2599];
  const inr = (n) => (n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`);
  const small = () => innerWidth <= 860;

  // illustrated people
  const SKIN = ['#F2C9A6', '#E0A982', '#B9794F', '#8A5536', '#F6D7BD'];
  const HAIR = ['#2B1D16', '#4A2E1F', '#151515', '#7A4B2A', '#C9A06A'];
  const TOP = ['#5B7FD1', '#E0796B', '#3FA57F', '#E5B04A', '#8C70D6', '#2F3A56', '#D45F8E'];
  const BOTTOM = ['#2F3A56', '#1F2433', '#6B5B4E', '#3A4E7A', '#4B4B55'];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const person = ({ skin, hair, top, bottom, long }) => `
    <svg viewBox="0 0 40 100">
      <path d="M14 62 L12 96 L18 96 L20 66 L22 96 L28 96 L26 62 Z" fill="${bottom}"/>
      <rect x="11" y="95" width="8" height="4" rx="2" fill="#222"/><rect x="21" y="95" width="8" height="4" rx="2" fill="#222"/>
      <path d="M11 34 Q20 28 29 34 L30 64 L10 64 Z" fill="${top}"/>
      <path d="M11 35 L6 56 L9 57 L14 40 Z" fill="${top}"/><path d="M29 35 L34 56 L31 57 L26 40 Z" fill="${top}"/>
      <circle cx="7.5" cy="57.5" r="2.4" fill="${skin}"/><circle cx="32.5" cy="57.5" r="2.4" fill="${skin}"/>
      <g class="bag"><path d="M30 58 q2.5 -5 5 0" fill="none" stroke="#0E8A62" stroke-width="1.4"/><rect x="28" y="58" width="9" height="11" rx="1.5" fill="#10B981"/></g>
      <rect x="17.5" y="26" width="5" height="6" fill="${skin}"/>
      <ellipse cx="20" cy="18" rx="8" ry="9" fill="${skin}"/>
      <path d="M11.5 18 Q11 8 20 8 Q29 8 28.5 18 Q26 12 20 12.5 Q14 12 11.5 18 Z" fill="${hair}"/>
      ${long ? `<path d="M11.5 17 Q10 28 13 34 L15 22 Z M28.5 17 Q30 28 27 34 L25 22 Z" fill="${hair}"/>` : ''}
    </svg>`;
  keeper.innerHTML = `<svg viewBox="0 0 40 100"><path d="M11 34 Q20 28 29 34 L30 64 L10 64 Z" fill="#C2553F"/><path d="M11 35 L6 56 L9 57 L14 40 Z" fill="#C2553F"/><g class="wave"><path d="M29 35 L36 18 L33 16.5 L26 40 Z" fill="#C2553F"/><circle cx="35" cy="16" r="2.6" fill="#C68A62"/></g><circle cx="7.5" cy="57.5" r="2.4" fill="#C68A62"/><rect x="17.5" y="26" width="5" height="6" fill="#C68A62"/><ellipse cx="20" cy="18" rx="8" ry="9" fill="#C68A62"/><path d="M11.5 18 Q11 7 20 7 Q29 7 28.5 18 Q26 11 20 11.5 Q14 11 11.5 18 Z" fill="#2B1D16"/><rect x="14" y="44" width="12" height="20" rx="2" fill="#F3E3C8" opacity=".9"/></svg>`;

  // products: dresses on hangers in the shop, product cards on the website
  const slots = () => (small() ? [30] : [14, 30, 46, 62]);
  const prodSlots = () => (small() ? [18, 44] : [14, 30, 46, 62]);
  const HANGER = '<svg viewBox="0 0 34 22"><path d="M17 1 a3 3 0 1 1 0 5 v3 L2 20 h30 L17 9" fill="none" stroke="#8A6A4E" stroke-width="2" stroke-linejoin="round"/></svg>';
  const build = () => {
    const rail = document.getElementById('rail'); const cards = document.getElementById('cards');
    rail.innerHTML = ''; cards.innerHTML = '';
    prodSlots().forEach((x, i) => {
      const h = document.createElement('div'); h.className = 'hang'; h.style.left = x + '%';
      h.innerHTML = `${HANGER}<img src="assets/img/dress-cut.webp" alt="" width="267" height="249">`; rail.appendChild(h);
      const c = document.createElement('div'); c.className = 'card'; c.style.left = x + '%';
      c.innerHTML = `<div><img src="assets/img/dress-cut.webp" alt="" width="267" height="249"></div><b>Wrap Dress</b>${inr(PRICES[i % 4])}`; cards.appendChild(c);
    });
  };
  build();
  addEventListener('resize', build);

  // scroll drives one continuous story: shop (0-0.24), wipe to web (0.24-0.38), web (-0.6), Sahaay arrives (0.6-0.72), with Sahaay
  const clamp = (v) => Math.max(0, Math.min(1, v));
  let mode = 'shop';
  const onScroll = () => {
    const r = story.getBoundingClientRect();
    const p = reduce ? 1 : clamp(-r.top / (r.height - innerHeight));
    const w = clamp((p - 0.24) / 0.14);
    const s = clamp((p - 0.6) / 0.12);
    root.style.setProperty('--w', w.toFixed(3));
    root.style.setProperty('--s', s.toFixed(3));
    mode = w < 0.5 ? 'shop' : s < 0.5 ? 'silent' : 'sahaay';
    const k = { shop: 0, silent: 1, sahaay: 2 }[mode];
    lines.forEach((li, i) => { li.classList.toggle('is-on', i === k); li.classList.toggle('is-seen', i < k); });
    web.classList.toggle('is-silent', mode === 'silent');
    document.getElementById('where').textContent = { shop: 'In the shop', silent: 'On the website', sahaay: 'On the website · with Sahaay' }[mode];
    document.getElementById('shop-hint').hidden = p > 0.03;
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  let lost = 0; let won = 0; let rupees = 0;
  const tally = () => {
    document.getElementById('t-lost').innerHTML = `<b>${lost}</b> left without buying`;
    document.getElementById('t-won').innerHTML = `<b class="ok">${won}</b> sales saved · <b class="ok">${inr(rupees)}</b>`;
  };

  // Keep a bubble inside the scene.
  const fit = (el) => {
    const sr = scene.getBoundingClientRect(); const br = el.getBoundingClientRect();
    const dx = br.left < sr.left + 8 ? sr.left + 8 - br.left : br.right > sr.right - 8 ? sr.right - 8 - br.right : 0;
    if (dx) el.style.translate = `${dx}px 0`;
  };
  const say = (host, cls, who, text, style) => {
    const s = document.createElement('div'); s.className = `say ${cls}`; s.innerHTML = `<small>${who}</small>${text}`;
    if (style) Object.assign(s.style, style);
    host.appendChild(s); fit(s); return s;
  };
  // The answer sits above whoever answers: the shopkeeper behind the counter, or Sahaay's orb.
  const answerAt = (who) => {
    const sr = scene.getBoundingClientRect();
    const el = who === 'keeper' ? keeper : orb;
    const r = el.getBoundingClientRect();
    return { right: `${Math.max(8, sr.right - r.right - 6)}px`, bottom: `${sr.bottom - r.top + 10}px` };
  };

  // shoppers: many can browse, one conversation at a time so it's always clear who's talking
  const busy = new Set();
  let talking = false;
  let active = false;
  const later = (ms, fn) => setTimeout(fn, reduce ? 0 : ms);
  const walk = (el, to, ms) => { el.classList.add('is-walking'); el.style.transitionDuration = `${ms}ms, .5s, .5s`; el.style.left = to + '%'; later(ms, () => el.classList.remove('is-walking')); };
  const leave = (el, i, won, price) => {
    const tg = document.createElement('span');
    tg.className = 'tag ' + (won ? 'tag--won' : 'tag--lost'); tg.textContent = won ? `Bought · ${inr(price)}` : 'Left';
    el.appendChild(tg);
    el.classList.add(won ? 'is-won' : 'is-lost');
    walk(el, won ? 108 : -8, 2800);
    later(2800, () => { el.remove(); busy.delete(i); });
  };
  const converse = (el, i) => {
    if (talking) { later(500, () => converse(el, i)); return; }
    talking = true;
    const m = mode;
    const [q, a] = QA[Math.floor(Math.random() * QA.length)];
    const price = PRICES[i % 4];
    const qEl = say(el, 'say--q', 'Shopper', q);
    if (m === 'silent') {
      later(1100, () => qEl.classList.add('is-unanswered'));
      later(2600, () => { qEl.remove(); talking = false; lost += 1; tally(); leave(el, i, false, price); });
      return;
    }
    later(900, () => {
      let aEl;
      if (m === 'shop') {
        keeper.classList.remove('is-waving'); void keeper.offsetWidth; keeper.classList.add('is-waving');
        aEl = say(scene, 'say--keeper', '<span class="face"></span>Shopkeeper', 'Hello! ' + a, answerAt('keeper'));
      } else {
        orb.classList.remove('is-talking'); void orb.offsetWidth; orb.classList.add('is-talking');
        aEl = say(scene, 'say--sahaay', '<span class="orb"><img src="assets/logo/sahaay-monogram-white.svg" alt="" width="7" height="9"></span>Sahaay', a, answerAt('orb'));
      }
      later(2300, () => {
        qEl.remove(); aEl.remove(); talking = false;
        if (m === 'sahaay') { won += 1; rupees += price; tally(); }
        leave(el, i, true, price);
      });
    });
  };
  const spawn = () => {
    if (!active) return;
    const free = slots().map((_, i) => i).filter((i) => !busy.has(i));
    if (!free.length) return;
    const i = free[Math.floor(Math.random() * free.length)];
    busy.add(i);
    const x = slots()[i] + 3;
    const el = document.createElement('div');
    el.className = 'sh';
    el.innerHTML = person({ skin: pick(SKIN), hair: pick(HAIR), top: pick(TOP), bottom: pick(BOTTOM), long: Math.random() < 0.5 });
    el.style.left = '-5%';
    scene.appendChild(el);
    const t = 1200 + x * 22;
    requestAnimationFrame(() => requestAnimationFrame(() => walk(el, x, t)));
    later(t + 300, () => converse(el, i));
  };
  let timer = 0;
  const start = () => { if (active) return; active = true; spawn(); timer = setInterval(spawn, 1700); };
  const stop = () => { active = false; clearInterval(timer); };
  new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop()), { threshold: 0.2 }).observe(scene);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

})();

/* ---------- 5 · A day on your store (scroll through 24 hours) ---------- */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // hour: 9 = 9:00 AM, 33 = 9:00 AM next day
  const EVENTS = [
    [9.23, 'Asked about delivery to Pune. Answered in 1.4s.', 0],
    [10.5, 'Lingered on the size chart. Sahaay helped pick M.', 2599],
    [12.1, '“Is the fabric breathable?” Viscose crepe, light and airy.', 0],
    [13.5, 'Lunch-break browser added a matching bag.', 1299],
    [15.8, 'Compared two dresses for 3 minutes. Sahaay settled it.', 2599],
    [18.4, 'Headed for the close tab at checkout. Cart saved.', 3499],
    [19.6, 'Sale-night rush: 42 conversations in one hour.', 0, 40],
    [21.2, '“Will this reach Jaipur by Friday?” Yes, with 2 days to spare.', 2599],
    [23.6, 'You logged off for the night.', 0, 0, 'you'],
    [25.2, '“Where’s my order?” Tracked in chat.', 0, 0, 'shopify'],
    [26.23, '“Will it fit?” asked at 2:14 AM. Cart saved.', 2599],
    [27.4, 'Night owl from Dubai, shipping question answered.', 3499],
    [28.1, 'Return request with a photo. Verified, waiting for your OK.', 0, 0, 'shopify'],
    [30.4, 'Early riser bought the Ink Blue dress.', 2599],
    [32.7, 'You’re back. 1 return waits for your approval.', 0, 0, 'you'],
  ];
  const LINES = [[9, 'Your store opens. So does Sahaay.'], [12, 'Midday. Shoppers browse between meetings.'], [17.5, 'Evening. The busiest hours of the day.'], [22.5, 'Your team goes home.'], [24.5, 'Midnight. The store is still open.'], [28, 'Deep night. Somebody is always shopping.'], [31, 'Dawn. Almost time for you.']];
  // sky keyframes: [hour, bg, sun color, text is light?]
  const SKY = [[9, '#FFF6EA', '#FFD08A', 0], [13, '#FBFAFF', '#FFE6A6', 0], [17.5, '#FFE3CF', '#FFB27A', 0], [19.5, '#F4A6B8', '#FF8A6B', 0], [21, '#4E3F8F', '#C9C2FF', 1], [23.5, '#1A1838', '#E8E6FF', 1], [27, '#0E0D22', '#F1F0FF', 1], [30, '#2E2A6B', '#D9D6FF', 1], [31.6, '#F7C9B0', '#FFC28A', 0], [33, '#FFF6EA', '#FFD08A', 0]];
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, k) => `rgb(${hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k)).join(',')})`;
  const day = document.getElementById('day');
  const sky = document.getElementById('sky');
  const sun = document.getElementById('sun');
  const track = document.getElementById('track');
  const fmt = (h) => { const hh = Math.floor(h) % 24; const mm = Math.floor((h % 1) * 60); return [`${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')}`, hh < 12 ? 'AM' : 'PM']; };
  const inr = (n) => n >= 1e5 ? `₹${(n / 1e5).toFixed(2)}L` : `₹${n.toLocaleString('en-IN')}`;
  let shown = 0;

  const render = (h) => {
    // sky
    let i = 0; while (i < SKY.length - 2 && h > SKY[i + 1][0]) i++;
    const [h0, b0, s0, l0] = SKY[i]; const [h1, b1, s1, l1] = SKY[i + 1];
    const k = Math.max(0, Math.min(1, (h - h0) / (h1 - h0)));
    sky.style.setProperty('--sky', mix(b0, b1, k));
    const light = (k < .5 ? l0 : l1) === 1;
    sky.style.setProperty('--fg', light ? '#F4F3FF' : '#111126');
    sky.style.setProperty('--soft', light ? 'rgba(244,243,255,.66)' : 'rgba(17,17,38,.6)');
    sky.style.setProperty('--card', light ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.72)');
    sky.style.setProperty('--cardline', light ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.9)');
    const night = h > 21 && h < 31 ? Math.min(1, Math.min(h - 21, 31 - h) / 1.5) : 0;
    sky.style.setProperty('--stars', night.toFixed(2));
    // sun by day (9-20), moon by night (20-32): an arc across the top
    const isMoon = h >= 20 && h < 32;
    const a = isMoon ? (h - 20) / 12 : ((h >= 32 ? h - 32 : h - 8) / 12);
    sun.style.left = `${8 + a * 84}%`;
    sun.style.top = `${42 - Math.sin(Math.PI * Math.max(0, Math.min(1, a))) * 30}%`;
    sun.style.background = isMoon ? `radial-gradient(circle at 35% 35%, #fff, ${mix(s0, s1, k)})` : `radial-gradient(circle, ${mix(s0, s1, k)}, rgba(255,200,120,.0) 70%)`;
    sun.style.boxShadow = isMoon ? '0 0 60px 10px rgba(201,194,255,.35)' : 'none';
    // clock + line
    const [t, ap] = fmt(h);
    document.getElementById('clock').firstChild.nodeValue = t;
    document.getElementById('ampm').textContent = ap;
    let line = LINES[0][1]; LINES.forEach(([lh, txt]) => { if (h >= lh) line = txt; });
    document.getElementById('line').textContent = line;
    const asleep = h >= 23.6 && h < 32.7;
    document.getElementById('you').classList.toggle('is-asleep', asleep);
    document.getElementById('you-txt').textContent = asleep ? 'You: asleep' : h >= 32.7 ? 'You: back at work' : 'You: at work';
    // events
    const due = EVENTS.filter((e) => e[0] <= h);
    if (due.length !== shown) {
      track.innerHTML = '';
      due.slice(-6).forEach(([eh, txt, amt, , kind]) => {
        const el = document.createElement('div');
        el.className = 'ev' + (kind === 'you' ? ' ev--you' : '');
        const tag = kind === 'shopify' ? '<span class="ev__tag">Shopify</span>' : '';
        el.innerHTML = `<span class="orb">${kind === 'you' ? '' : '<img src="assets/logo/sahaay-monogram-white.svg" alt="" width="11" height="14">'}</span><span><span class="ev__t">${fmt(eh).join(' ')}</span>${tag}<br><span class="ev__txt">${txt}</span></span>${amt ? `<span class="ev__amt">+${inr(amt)}</span>` : ''}`;
        if (kind === 'you') el.querySelector('.orb').textContent = eh > 30 ? '☀' : '☾';
        track.appendChild(el);
      });
      shown = due.length;
    }
    const conv = Math.round((h - 9) * 9) + due.reduce((n, e) => n + (e[3] || 0), 0);
    const saved = due.filter((e) => e[2] > 0).length;
    const rev = due.reduce((n, e) => n + e[2], 0);
    document.getElementById('t-conv').textContent = String(Math.max(0, conv));
    document.getElementById('t-saved').textContent = String(saved);
    document.getElementById('t-rev').textContent = inr(rev);
    const sleptRev = EVENTS.filter((e) => e[0] >= 23.6 && e[0] < 32.7).reduce((n, e) => n + e[2], 0);
    document.getElementById('slept').textContent = inr(sleptRev);
    document.getElementById('day-hint').hidden = h > 9.4;
  };
  const onScroll = () => {
    const r = day.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, -r.top / (r.height - innerHeight)));
    render(9 + p * 24);
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  render(reduce ? 9 : 9);
  onScroll();

})();

/* ---------- 3 · Questions band ---------- */
(() => {
  const track = $('asks-track');
  const answer = $('asks-answer');
  if (!track || !answer) return;
  const QA = [
    ['What would you recommend for me?', 'Tell me the occasion and your usual size, and I’ll pick a few pieces that fit.'],
    ['Do you have this in XS?', 'Yes, the Wrap Midi Dress is in stock in XS, in Terracotta and Ink Blue.'],
    ['Where’s my order?', 'Order VEL-ACE0F49A has shipped. You can track it right here in the chat.'],
    ['What’s your return policy?', 'Returns are accepted within 14 days of delivery, unworn with tags attached.'],
    ['Is the fabric breathable?', 'It’s viscose crepe: light and breathable, so it works well for summer.'],
    ['When will it reach 560001?', 'Orders reach most of India, including 560001, in 4 to 7 business days.'],
    ['Can I return a damaged item?', 'Yes. Report it here with a photo and it goes straight to the team for review.'],
    ['Which colour is in stock?', 'Terracotta and Ink Blue are both in stock in XS, S, M and L.'],
  ];
  // Two copies so the loop is seamless; the second is hidden from assistive tech.
  [0, 1].forEach((copy) => QA.forEach(([q, a]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ask'; b.textContent = q; b.dataset.a = a;
    if (copy) { b.tabIndex = -1; b.setAttribute('aria-hidden', 'true'); }
    track.appendChild(b);
  }));
  const box = answer.parentElement;
  const show = (btn) => {
    track.querySelectorAll('.ask').forEach((b) => b.classList.toggle('is-on', b.textContent === btn.textContent));
    const q = document.createElement('span');
    q.className = 'asks__q'; q.textContent = btn.textContent;
    answer.replaceChildren(q, document.createTextNode(btn.dataset.a));
    box.classList.remove('is-new'); void box.offsetWidth; box.classList.add('is-new');
  };
  track.addEventListener('mouseover', (e) => { const b = e.target.closest('.ask'); if (b) show(b); });
  track.addEventListener('focusin', (e) => { const b = e.target.closest('.ask'); if (b) show(b); });
  track.addEventListener('click', (e) => { const b = e.target.closest('.ask'); if (b) show(b); });
})();

/* ---------- 5 · Sandbox: the visitor plays the shopper ---------- */
(() => {
  const play = $('play');
  if (!play) return;
  const MSG = {
    exit: { why: 'Exit intent', msg: 'Leaving already? The Wrap Midi Dress runs true to size. Want help picking yours?', btn: 'Help me pick' },
    time: { why: '8s on page', msg: 'Still deciding? It’s viscose crepe, light enough for a summer wedding. Ask me anything about it.', btn: 'Ask a question' },
    scroll: { why: 'Scroll depth', msg: 'Checking delivery? It reaches you in 4 to 7 business days, and returns are accepted within 14 days.', btn: 'Check my PIN code' },
    cart: { why: 'Cart ₹2,599', msg: 'Your order ships free. Want a layer to go with it? The Utility Bomber Jacket is ₹3,499.', btn: 'Show me' },
  };
  const ORDER = ['exit', 'time', 'scroll', 'cart'];
  const win = $('play-win');
  const page = $('play-page');
  const pop = $('play-pop');
  const badge = $('play-badge');
  const status = $('play-status');
  const panel = play.querySelector('.triggers');
  const delivery = $('play-delivery');
  const rows = Object.fromEntries([...play.querySelectorAll('.triggers__list li')].map((li) => [li.dataset.t, li]));
  const enabled = { exit: true, time: true, scroll: true, cart: true };
  const found = new Set();
  let seconds = 0; let visible = false; let lastY = null; let hideTimer = 0;

  const live = () => ORDER.filter((k) => enabled[k]);
  const renderStatus = () => {
    const l = live();
    const n = l.filter((k) => found.has(k)).length;
    const done = l.length > 0 && n === l.length;
    panel.classList.toggle('is-done', done);
    status.classList.toggle('is-done', done);
    status.innerHTML = done
      ? (l.length === 4 ? 'All four moments caught. That’s Sahaay on your store, all day.' : `All ${l.length} live triggers caught.`)
      : `<b>${n}</b> of ${l.length} moments caught`;
  };
  const fire = (t) => {
    if (!enabled[t] || found.has(t)) return;
    found.add(t);
    const m = MSG[t];
    $('play-why').textContent = m.why;
    $('play-msg').textContent = m.msg;
    $('play-btn').textContent = m.btn;
    pop.classList.remove('is-out');
    badge.textContent = m.why;
    badge.classList.remove('is-live'); void badge.offsetWidth; badge.classList.add('is-live');
    rows[t].classList.add('is-found');
    if (t === 'scroll') delivery.classList.add('is-hit');
    renderStatus();
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => pop.classList.add('is-out'), 7000);
  };
  $('play-btn').addEventListener('click', () => pop.classList.add('is-out'));

  // Exit intent: a quick upward move into the browser bar, leaving through the top, or ← / ×.
  win.addEventListener('mousemove', (e) => {
    const y = e.clientY - win.getBoundingClientRect().top;
    if (lastY !== null && y < 34 && lastY - y > 6) fire('exit');
    lastY = y;
  });
  win.addEventListener('mouseleave', (e) => { if (e.clientY <= win.getBoundingClientRect().top + 4) fire('exit'); lastY = null; });
  play.querySelectorAll('[data-exit]').forEach((b) => b.addEventListener('click', () => fire('exit')));
  // Scroll depth: delivery details come into view.
  page.addEventListener('scroll', () => { if (page.scrollTop + page.clientHeight >= delivery.offsetTop + 30) fire('scroll'); }, { passive: true });
  // Cart value: adding the dress crosses ₹2,000.
  const addBtn = $('play-add');
  addBtn.addEventListener('click', () => {
    addBtn.textContent = 'Added to cart ✓'; addBtn.classList.add('is-added');
    $('play-cart').classList.add('is-full'); $('play-count').textContent = '1';
    fire('cart');
  });
  play.querySelectorAll('.pdp__sizes button').forEach((b) => b.addEventListener('click', () => {
    play.querySelectorAll('.pdp__sizes button').forEach((x) => x.classList.toggle('on', x === b));
  }));
  // Time on page: counts while the store is on screen.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting && e.intersectionRatio >= 0.5; }, { threshold: [0, 0.5] }).observe(win);
  }
  setInterval(() => {
    if (!visible || document.hidden) return;
    seconds += 1;
    if (!found.has('time') && pop.classList.contains('is-out')) badge.textContent = `${seconds}s on page`;
    if (seconds >= 8 && pop.classList.contains('is-out')) fire('time');
  }, 1000);
  // Switches: an off trigger stays quiet.
  play.querySelectorAll('.tog').forEach((tog) => tog.addEventListener('click', () => {
    const li = tog.closest('li');
    const on = tog.getAttribute('aria-checked') !== 'true';
    tog.setAttribute('aria-checked', String(on));
    tog.classList.toggle('is-on', on);
    enabled[li.dataset.t] = on;
    li.classList.toggle('is-off', !on);
    renderStatus();
  }));
  // For visitors who'd rather watch.
  const auto = $('play-auto');
  auto.addEventListener('click', () => {
    auto.disabled = true;
    const todo = live().filter((t) => !found.has(t));
    const act = {
      exit: () => fire('exit'),
      time: () => { seconds = 8; fire('time'); },
      scroll: () => { page.scrollTo({ top: delivery.offsetTop - 40, behavior: reduceMotion ? 'auto' : 'smooth' }); setTimeout(() => fire('scroll'), 600); },
      cart: () => { page.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); setTimeout(() => addBtn.click(), 500); },
    };
    todo.forEach((t, i) => setTimeout(() => { pop.classList.add('is-out'); setTimeout(act[t], 300); }, i * 3200));
    setTimeout(() => { auto.disabled = false; }, todo.length * 3200);
  });
  renderStatus();
})();

/* ---------- 8 · FAQ: answers arrive like a chat reply ---------- */
(() => {
  const tabs = [...document.querySelectorAll('.faq__qs [role="tab"]')];
  const echo = $('faq-echo');
  const bubble = $('faq-bubble');
  const panel = $('faq-a');
  if (!tabs.length) return;
  let typing = 0;
  const typeOut = (text) => {
    clearInterval(typing);
    if (reduceMotion) { bubble.textContent = text; return; }
    bubble.innerHTML = '<span class="sw__dots"><i></i><i></i><i></i></span>';
    let i = 0;
    setTimeout(() => {
      bubble.textContent = '';
      typing = setInterval(() => {
        i = Math.min(text.length, i + 3);
        bubble.textContent = text.slice(0, i);
        if (i >= text.length) clearInterval(typing);
      }, 16);
    }, 450);
  };
  const select = (tab) => {
    tabs.forEach((t) => { t.setAttribute('aria-selected', String(t === tab)); t.tabIndex = t === tab ? 0 : -1; });
    echo.textContent = tab.textContent;
    typeOut(tab.dataset.a);
    panel.setAttribute('aria-labelledby', tab.id);
  };
  tabs.forEach((tab, i) => {
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!k) return;
      e.preventDefault();
      const n = tabs[(i + k + tabs.length) % tabs.length];
      select(n); n.focus();
    });
  });
})();

/* ---------- Mobile sticky action: hidden over the hero, the form and the footer ---------- */
(() => {
  const sticky = document.querySelector('.sticky');
  if (!sticky || !('IntersectionObserver' in window)) return;
  const inView = new Map();
  const update = () => {
    const show = !inView.get('hero') && !inView.get('pilot') && !inView.get('footer');
    sticky.classList.toggle('is-visible', show);
    document.body.classList.toggle('has-sticky', show);
    sticky.setAttribute('aria-hidden', String(!show));
    sticky.querySelector('a').tabIndex = show ? 0 : -1;
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => inView.set(e.target.dataset.watch, e.isIntersecting));
    update();
  });
  [['hero', '.hero'], ['pilot', '#pilot-form'], ['footer', '.footer']].forEach(([key, sel]) => {
    const el = document.querySelector(sel);
    if (el) { el.dataset.watch = key; io.observe(el); }
  });
})();

/* ---------- 7 · Waitlist form -> lead saved -> optional demo ---------- */
(() => {
  const form = $('pilot-form');
  if (!form) return;
  const note = form.querySelector('.form__note');
  const button = form.querySelector('button[type="submit"]');
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const store = form.store.value.trim();
    const email = form.email.value.trim();
    const bad = !store ? form.store : !EMAIL.test(email) ? form.email : null;
    [form.store, form.email].forEach((i) => i.setAttribute('aria-invalid', String(i === bad)));
    if (bad) {
      note.textContent = bad === form.store ? 'Enter your store URL, like yourstore.com.' : 'Enter a valid work email.';
      note.classList.add('is-err');
      bad.focus();
      return;
    }
    button.disabled = true;
    button.textContent = 'Saving…';
    try {
      const out = await Sahaay.postJson('/api/lead', { intent: 'Waitlist', store, email, company_site: form.company_site.value, source: 'waitlist-form' });
      const safe = email.replace(/[<>&"]/g, '');
      form.innerHTML = `
        <div class="form__done" role="status">
          <span class="tickbig" aria-hidden="true"></span>
          <p class="form__title">You’re on the waitlist.</p>
          <p>We’ll email ${safe} before launch. Want to skip the queue? Book a 20-minute demo and see Sahaay on your own catalog.</p>
          <button type="button" class="btn btn--primary btn--block" id="pilot-book">Book a 20-minute demo</button>
        </div>`;
      $('pilot-book').addEventListener('click', () => Sahaay.openBooking({ email, store }, { lead: out.lead }));
    } catch (err) {
      button.disabled = false;
      button.textContent = 'Join the waitlist';
      note.classList.add('is-err');
      note.textContent = err.status === 400 || err.status === 429 ? err.message : 'We couldn’t save that just now. Try again, or book a demo instead.';
    }
  });
  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value.trim()) e.target.setAttribute('aria-invalid', 'false');
  });
})();

/* ---------- Hide the chat bubble while a scroll story is on screen ---------- */
(() => {
  const stories = [document.getElementById('shop-story'), document.getElementById('day')].filter(Boolean);
  if (!stories.length || !('IntersectionObserver' in window)) return;
  const seen = new Map();
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => seen.set(e.target, e.isIntersecting));
    const any = [...seen.values()].some(Boolean);
    document.body.classList.toggle('in-story', any && !document.querySelector('.sw.is-open'));
  }, { rootMargin: '-20% 0px -20% 0px' });
  stories.forEach((s) => io.observe(s));
})();
