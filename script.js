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

/* ---------- 1 · Hero story: one saved sale, on a loop ---------- */
(() => {
  const story = $('story');
  if (!story) return;
  const win = story.querySelector('.win');
  const cursor = story.querySelector('.story__cursor');
  const badge = story.querySelector('.story__badge');
  const count = story.querySelector('.story__cart b');
  const add = story.querySelector('.story__add');
  const help = story.querySelector('.sbox__help');
  const addS = story.querySelector('.sbox__add');
  const me = story.querySelector('.sbox__me');
  const typing = story.querySelector('.sbox__typing');
  const bot = story.querySelector('.sbox__bot');
  const sizes = story.querySelectorAll('.pdp__sizes span');
  const steps = [...story.querySelectorAll('.story__steps li')];
  const bars = steps.map((li) => li.querySelector('.bar'));
  const SPANS = [[0, 2400], [2400, 6000], [6000, 10400]];
  const LOOP = 11200;

  const moveTo = (target, fx = 0.5, fy = 0.5) => {
    const w = win.getBoundingClientRect();
    let x; let y;
    if (target instanceof Element) {
      const r = target.getBoundingClientRect();
      x = r.left - w.left + r.width * fx; y = r.top - w.top + r.height * fy;
    } else { x = target.x * w.width; y = target.y * w.height; }
    cursor.style.left = `${x.toFixed(0)}px`;
    cursor.style.top = `${y.toFixed(0)}px`;
  };
  const press = (el) => {
    el.classList.add('is-press'); cursor.classList.add('is-press');
    setTimeout(() => { el.classList.remove('is-press'); cursor.classList.remove('is-press'); }, 180);
  };
  const EVENTS = [
    [0, () => {
      story.className = 'story';
      [me, typing, bot, addS].forEach((el) => el.classList.remove('is-in'));
      badge.textContent = 'Browsing'; badge.className = 'win__badge story__badge';
      count.textContent = '0'; add.textContent = 'Add to cart';
      story.querySelector('.story__cart').classList.remove('is-full');
      moveTo(story.querySelector('.pdp__name'), 0.3, 0.6);
    }],
    [700, () => moveTo(sizes[2], 0.5, 0.6)],
    [1500, () => moveTo({ x: 0.93, y: 0.03 })],
    [2300, () => { badge.textContent = 'Exit intent'; badge.classList.add('is-live'); }],
    [2500, () => story.classList.add('is-pop')],
    [3500, () => moveTo(help, 0.5, 0.6)],
    [4250, () => press(help)],
    [4500, () => { story.classList.add('is-chat'); me.classList.add('is-in'); }],
    [5000, () => typing.classList.add('is-in')],
    [5900, () => { typing.classList.remove('is-in'); bot.classList.add('is-in'); addS.classList.add('is-in'); }],
    [6700, () => moveTo(addS, 0.5, 0.6)],
    [7450, () => press(addS)],
    [7600, () => {
      story.classList.add('is-saved');
      badge.textContent = 'Sale saved'; badge.classList.replace('is-live', 'is-saved');
      count.textContent = '1'; add.textContent = 'Added ✓';
      story.querySelector('.story__cart').classList.add('is-full');
    }],
  ];
  let next = 0;
  const paint = (t) => steps.forEach((li, k) => {
    const [a, b] = SPANS[k];
    li.classList.toggle('is-on', t >= a && t < b);
    li.classList.toggle('is-done', t >= b);
    bars[k].style.setProperty('--p', Math.max(0, Math.min(1, (t - a) / (b - a))).toFixed(4));
  });
  if (reduceMotion) { EVENTS.forEach(([, fn]) => fn()); cursor.hidden = true; paint(LOOP); return; }
  const c = clock((t) => {
    while (next < EVENTS.length && t >= EVENTS[next][0]) EVENTS[next++][1]();
    if (t >= LOOP) { next = 0; t = 0; }
    paint(t);
    return t;
  });
  window.addEventListener('resize', () => { c.reset(); next = 0; });
  whileVisible(story, c.play, c.pause, 0.2);
})();

/* ---------- 2 · Problem: 100 visitors, 97 leave ---------- */
(() => {
  const card = $('crowd-card');
  const crowd = $('crowd');
  if (!card || !crowd) return;
  crowd.innerHTML = '<i></i>'.repeat(100);
  const people = [...crowd.children];
  const BUYERS = new Set([23, 58, 86]);
  // A fixed shuffle so the crowd thins out unevenly, like a real store.
  const order = people.map((_, i) => i).filter((i) => !BUYERS.has(i)).sort((a, b) => ((a * 37) % 101) - ((b * 37) % 101));
  const beats = [...document.querySelectorAll('#beats li')];
  const paint = (p) => {
    beats.forEach((li, k) => li.classList.toggle('is-on', p >= [0, 0.2, 0.45][k]));
    card.classList.toggle('has-qs', p >= 0.2 && p < 0.5);
    card.classList.toggle('is-leaving', p >= 0.5);
    const gone = Math.round(Math.max(0, Math.min(1, (p - 0.5) / 0.38)) * 97);
    order.forEach((idx, k) => people[idx].classList.toggle('is-gone', k < gone));
    const bought = p >= 0.92;
    BUYERS.forEach((idx) => people[idx].classList.toggle('is-buy', bought));
    $('crowd-left').textContent = String(gone);
    $('crowd-bought').textContent = bought ? '3' : '0';
  };
  if (reduceMotion) return paint(1);
  paint(0);
  let played = false;
  const DUR = 6500;
  const c = clock((t) => { paint(Math.min(1, t / DUR)); if (t >= DUR) { played = true; c.pause(); } return t; });
  whileVisible(card, () => { if (!played) c.play(); }, c.pause, 0.45);
})();

/* ---------- 2 · Calculator ---------- */
(() => {
  const calc = $('calc');
  if (!calc) return;
  const inr = (n) => {
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(n >= 1e8 ? 0 : 1)}Cr`;
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(n >= 1e6 ? 0 : 1)}L`;
    return `₹${Math.round(n).toLocaleString('en-IN')}`;
  };
  const num = (n) => Math.round(n).toLocaleString('en-IN');
  const shown = { leave: 0, orders: 0, rev: 0 };
  let anim = 0;
  const update = () => {
    const visitors = +$('c-visitors').value;
    const aov = +$('c-aov').value;
    const rate = +$('c-rate').value;
    $('o-visitors').textContent = num(visitors);
    $('o-aov').textContent = `₹${num(aov)}`;
    $('o-rate').textContent = `${rate}%`;
    const target = { leave: visitors * 0.97, orders: visitors * 0.97 * (rate / 100) };
    target.rev = target.orders * aov;
    $('r-year').textContent = `a month · ${inr(target.rev * 12)} a year`;
    $('r-cta').textContent = inr(target.rev);
    cancelAnimationFrame(anim);
    const from = { ...shown };
    const t0 = performance.now();
    const step = (now) => {
      const k = reduceMotion ? 1 : Math.min(1, (now - t0) / 450);
      const e = 1 - Math.pow(1 - k, 3);
      for (const key of Object.keys(target)) shown[key] = from[key] + (target[key] - from[key]) * e;
      $('r-leave').textContent = num(shown.leave);
      $('r-orders').textContent = num(shown.orders);
      $('r-rev').textContent = inr(shown.rev);
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  };
  calc.querySelectorAll('input[type="range"]').forEach((r) => r.addEventListener('input', update));
  update();
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

/* ---------- 4 · Waiting vs speaking first ---------- */
(() => {
  const vs = $('vs');
  if (!vs) return;
  const PHASES = [[0, 0], [1400, 1], [2300, 2], [3500, 3], [4600, 4], [5800, 5]];
  const LOOP = 9000;
  if (reduceMotion) { vs.dataset.phase = '5'; return; }
  const c = clock((t) => {
    t %= LOOP;
    let ph = 0;
    for (const [at, n] of PHASES) if (t >= at) ph = n;
    if (vs.dataset.phase !== String(ph)) vs.dataset.phase = String(ph);
    return t;
  });
  whileVisible(vs, c.play, c.pause, 0.3);
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

/* ---------- 7 · Pilot form -> lead saved -> kickoff call ---------- */
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
      const out = await Sahaay.postJson('/api/lead', { intent: 'Pilot', store, email, company_site: form.company_site.value, source: 'pilot-form' });
      const safe = email.replace(/[<>&"]/g, '');
      form.innerHTML = `
        <div class="form__done" role="status">
          <span class="tickbig" aria-hidden="true"></span>
          <p class="form__title">Your spot is saved.</p>
          <p>Last step: pick a time for a 20-minute kickoff call, and we’ll have Sahaay live on your store within 24 hours of it.</p>
          <button type="button" class="btn btn--primary btn--block" id="pilot-book">Pick a kickoff time</button>
          <p class="form__note">We’ve also noted ${safe}. No card needed.</p>
        </div>`;
      $('pilot-book').addEventListener('click', () => Sahaay.openBooking({ email, store }, { lead: out.lead }));
    } catch (err) {
      button.disabled = false;
      button.textContent = 'Claim free pilot';
      note.classList.add('is-err');
      note.textContent = err.status === 400 || err.status === 429 ? err.message : 'We couldn’t save that just now. Try again, or book a demo instead.';
    }
  });
  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value.trim()) e.target.setAttribute('aria-invalid', 'false');
  });
})();
