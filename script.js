/*
 * Sahaay landing page behaviour: hero demo, sticky how-it-works, nav state,
 * quote drift, FAQ tabs, pilot form, demo-booking links.
 * Booking and the chat widget live in widget.js (window.Sahaay).
 */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const Sahaay = window.Sahaay || {};

/* Demo-booking links open the booking dialog (they fall back to the Calendly page without JS). */
document.querySelectorAll('[data-book]').forEach((a) => {
  a.addEventListener('click', (e) => {
    if (!Sahaay.openBooking) return;
    e.preventDefault();
    Sahaay.openBooking();
  });
});

/* Footer year */
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

/* Catalog screen: one template, used in the sticky and the mobile how-it-works step */
const tplCatalog = document.getElementById('tpl-catalog');
if (tplCatalog) {
  document.querySelectorAll('[data-tpl="catalog"]').forEach((slot) => slot.appendChild(tplCatalog.content.cloneNode(true)));
}

/* ---------- Questions band: hover or tap a question to see Sahaay's answer ---------- */
const asks = document.querySelectorAll('.ask');
const askAnswer = document.getElementById('asks-answer');
if (asks.length && askAnswer) {
  const box = askAnswer.parentElement;
  const show = (btn) => {
    asks.forEach((b) => b.classList.toggle('is-on', b.textContent === btn.textContent));
    askAnswer.innerHTML = '';
    const q = document.createElement('span');
    q.className = 'asks__q';
    q.textContent = btn.textContent;
    askAnswer.append(q, document.createTextNode(btn.dataset.a));
    box.classList.remove('is-new'); void box.offsetWidth; box.classList.add('is-new');
  };
  asks.forEach((b) => {
    b.addEventListener('mouseenter', () => show(b));
    b.addEventListener('focus', () => show(b));
    b.addEventListener('click', () => show(b));
  });
}

/* ---------- Cost-of-silence calculator ---------- */
const calc = document.querySelector('.calc');
if (calc) {
  const $ = (id) => document.getElementById(id);
  const inr = (n) => {
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(n >= 1e8 ? 0 : 1)}Cr`;
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(n >= 1e6 ? 0 : 1)}L`;
    return `₹${Math.round(n).toLocaleString('en-IN')}`;
  };
  const num = (n) => Math.round(n).toLocaleString('en-IN');
  const shown = { leave: 0, orders: 0, rev: 0 };
  let anim = null;
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
    // Count towards the new numbers so the change is felt, not just read.
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
}

/* ---------- Proactive sandbox: the visitor plays the shopper ---------- */
const play = document.getElementById('play');
if (play) {
  const MSG = {
    exit: { why: 'Exit intent', msg: 'Leaving already? The Wrap Midi Dress runs true to size. Want help picking yours?', btn: 'Help me pick' },
    time: { why: '8s on page', msg: 'Still deciding? It’s viscose crepe, light enough for a summer wedding. Ask me anything about it.', btn: 'Ask a question' },
    scroll: { why: 'Scroll depth', msg: 'Checking delivery? It reaches you in 4 to 7 business days, and returns are accepted within 14 days.', btn: 'Check my PIN code' },
    cart: { why: 'Cart ₹2,599', msg: 'Your order ships free. Want a layer to go with it? The Utility Bomber Jacket is ₹3,499.', btn: 'Show me' },
  };
  const ORDER = ['exit', 'time', 'scroll', 'cart'];
  const win = document.getElementById('play-win');
  const page = document.getElementById('play-page');
  const pop = document.getElementById('play-pop');
  const badge = document.getElementById('play-badge');
  const status = document.getElementById('play-status');
  const nEl = document.getElementById('play-n');
  const addBtn = document.getElementById('play-add');
  const cart = play.querySelector('.play__cart');
  const delivery = document.getElementById('play-delivery');
  const pills = Object.fromEntries([...play.querySelectorAll('.play__found li')].map((li) => [li.dataset.t, li]));
  const enabled = { exit: true, time: true, scroll: true, cart: true };
  const found = new Set();
  let seconds = 0;
  let visible = false;
  let lastY = null;
  let hideTimer = null;

  const fire = (t) => {
    if (!enabled[t] || found.has(t)) return;
    found.add(t);
    const m = MSG[t];
    document.getElementById('play-why').textContent = m.why;
    document.getElementById('play-msg').textContent = m.msg;
    document.getElementById('play-btn').textContent = m.btn;
    pop.classList.remove('is-out');
    badge.textContent = m.why;
    badge.classList.remove('is-live'); void badge.offsetWidth; badge.classList.add('is-live');
    pills[t].classList.add('is-found', 'is-hit');
    if (t === 'scroll') delivery.classList.add('is-hit');
    nEl.textContent = String(found.size);
    const live = ORDER.filter((k) => enabled[k]).length;
    if (found.size >= live) {
      status.classList.add('is-done');
      status.innerHTML = live === 4
        ? 'All four moments caught. That’s what Sahaay does on your store, all day. <a href="#pilot">Try it free</a>'
        : `All ${live} live triggers caught. Switch the others back on below.`;
    } else {
      status.innerHTML = `<b>${found.size}</b> of ${live} moments caught`;
    }
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => pop.classList.add('is-out'), 7000);
  };
  document.getElementById('play-btn').addEventListener('click', () => pop.classList.add('is-out'));

  // Exit intent: the cursor moves quickly up into the browser bar, leaves through the top, or hits back/close.
  win.addEventListener('mousemove', (e) => {
    const r = win.getBoundingClientRect();
    const y = e.clientY - r.top;
    if (lastY !== null && y < 34 && lastY - y > 6) fire('exit');
    lastY = y;
  });
  win.addEventListener('mouseleave', (e) => { if (e.clientY <= win.getBoundingClientRect().top + 4) fire('exit'); lastY = null; });
  play.querySelectorAll('[data-exit]').forEach((b) => b.addEventListener('click', () => fire('exit')));

  // Scroll depth: the delivery details come into view inside the page.
  page.addEventListener('scroll', () => {
    if (page.scrollTop + page.clientHeight >= delivery.offsetTop + 30) fire('scroll');
  }, { passive: true });

  // Cart value: adding the dress crosses the ₹2,000 threshold.
  addBtn.addEventListener('click', () => {
    addBtn.textContent = 'Added to cart ✓';
    addBtn.classList.add('is-added');
    cart.classList.add('is-full');
    document.getElementById('play-count').textContent = '1';
    fire('cart');
  });
  play.querySelectorAll('.pdp__sizes button').forEach((b) => b.addEventListener('click', () => {
    play.querySelectorAll('.pdp__sizes button').forEach((x) => x.classList.toggle('on', x === b));
  }));

  // Time on page: counts while the store is on screen; fires at 8 seconds.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting && e.intersectionRatio >= 0.5; }, { threshold: [0, 0.5, 1] }).observe(win);
  }
  setInterval(() => {
    if (!visible || document.hidden) return;
    seconds += 1;
    if (!pop.classList.contains('is-out')) return;
    if (!found.has('time')) badge.textContent = `${seconds}s on page`;
    if (seconds >= 8) fire('time');
  }, 1000);

  // Rules: switching a trigger off keeps it quiet in the sandbox.
  const liveChip = document.getElementById('rules-live');
  document.querySelectorAll('.tog[data-rule]').forEach((tog) => tog.addEventListener('click', () => {
    const on = tog.getAttribute('aria-checked') !== 'true';
    tog.setAttribute('aria-checked', String(on));
    tog.classList.toggle('is-on', on);
    enabled[tog.dataset.rule] = on;
    pills[tog.dataset.rule].classList.toggle('is-off', !on);
    const live = ORDER.filter((k) => enabled[k]).length;
    liveChip.textContent = `${live} trigger${live === 1 ? '' : 's'} live`;
    if (!status.classList.contains('is-done')) status.innerHTML = `<b>${[...found].filter((k) => enabled[k]).length}</b> of ${live} moments caught`;
  }));

  // For visitors who'd rather watch: act out each trigger in turn.
  const auto = document.getElementById('play-auto');
  auto.addEventListener('click', () => {
    auto.disabled = true;
    const todo = ORDER.filter((t) => enabled[t] && !found.has(t));
    const act = {
      exit: () => fire('exit'),
      time: () => { seconds = 8; fire('time'); },
      scroll: () => { page.scrollTo({ top: delivery.offsetTop - 40, behavior: reduceMotion ? 'auto' : 'smooth' }); setTimeout(() => fire('scroll'), 600); },
      cart: () => { page.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); setTimeout(() => addBtn.click(), 500); },
    };
    todo.forEach((t, i) => setTimeout(() => { pop.classList.add('is-out'); setTimeout(act[t], 300); }, i * 3200));
    setTimeout(() => { auto.disabled = false; }, todo.length * 3200);
  });

  if (window.matchMedia('(hover: none)').matches) {
    play.querySelector('.play__how').textContent = 'Be the shopper: tap ← or ×, wait a few seconds, scroll the page, or add the dress to your cart.';
  }
}

/* ---------- Hero story: shopper about to leave -> Sahaay speaks first -> sale saved ---------- */
const story = document.getElementById('story');
if (story) {
  const win = story.querySelector('.win');
  const cursor = story.querySelector('.story__cursor');
  const badge = story.querySelector('.story__badge');
  const cartCount = story.querySelector('.story__cart b');
  const addBtn = story.querySelector('.story__add');
  const help = story.querySelector('.sbox__btn--help');
  const add = story.querySelector('.sbox__btn--add');
  const me = story.querySelector('.sbox__me');
  const typing = story.querySelector('.sbox__typing');
  const bot = story.querySelector('.sbox__bot');
  const stepEls = [...story.querySelectorAll('.story__steps li')];
  const stepBars = stepEls.map((li) => li.querySelector('.story__bar'));
  // When each step starts and ends (ms), and the full loop length.
  const STEPS = [[0, 2400], [2400, 6000], [6000, 10400]];
  const LOOP = 11200;

  // Put the cursor on an element (fx, fy = point inside it, 0..1) or on a raw point.
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
  const sizes = story.querySelectorAll('.pdp__sizes span');

  const EVENTS = [
    [0, () => {
      story.className = 'story';
      [me, typing, bot, add].forEach((el) => el.classList.remove('is-in'));
      badge.textContent = 'Browsing';
      cartCount.textContent = '0';
      addBtn.textContent = 'Add to cart';
      moveTo(story.querySelector('.pdp__name'), 0.3, 0.6);
    }],
    [700, () => moveTo(sizes[2], 0.5, 0.6)],
    [1500, () => moveTo({ x: 0.93, y: 0.02 })],                       // heads for the close tab
    [2300, () => { badge.textContent = 'Exit intent'; story.classList.add('is-exit'); }],
    [2500, () => story.classList.add('is-pop')],                      // Sahaay speaks first
    [3500, () => moveTo(help, 0.5, 0.6)],
    [4250, () => press(help)],
    [4500, () => { story.classList.add('is-chat'); me.classList.add('is-in'); }],
    [5000, () => typing.classList.add('is-in')],
    [5900, () => { typing.classList.remove('is-in'); bot.classList.add('is-in'); add.classList.add('is-in'); }],
    [6700, () => moveTo(add, 0.5, 0.6)],
    [7450, () => press(add)],
    [7600, () => { story.classList.add('is-saved'); badge.textContent = 'Sale saved'; cartCount.textContent = '1'; addBtn.textContent = 'Added to cart ✓'; }],
  ];

  let t = 0; let last = 0; let next = 0; let running = false;
  const paint = () => {
    stepEls.forEach((li, k) => {
      const [a, b] = STEPS[k];
      li.classList.toggle('is-on', t >= a && t < b);
      li.classList.toggle('is-done', t >= b);
      stepBars[k].style.setProperty('--p', Math.max(0, Math.min(1, (t - a) / (b - a))).toFixed(4));
    });
  };
  const frame = (now) => {
    if (!running) return;
    t += last ? Math.min(now - last, 100) : 0;
    last = now;
    while (next < EVENTS.length && t >= EVENTS[next][0]) EVENTS[next++][1]();
    if (t >= LOOP) { t = 0; next = 0; }
    paint();
    requestAnimationFrame(frame);
  };
  const play = () => { if (running) return; running = true; last = 0; requestAnimationFrame(frame); };
  const pause = () => { running = false; };

  if (reduceMotion) {
    // One still frame: the conversation and the saved sale.
    EVENTS.forEach(([, fn]) => fn());
    cursor.hidden = true;
    t = LOOP - 1; paint();
  } else {
    let visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible && !document.hidden ? play() : pause(); }).observe(story);
    }
    document.addEventListener('visibilitychange', () => (document.hidden || !visible ? pause() : play()));
    window.addEventListener('resize', () => { t = 0; next = 0; });
    play();
  }
}

/* ---------- Scroll-linked state: how-it-works step, nav segment, quote drift ---------- */
const steps = [...document.querySelectorAll('.how__step')];
const listItems = [...document.querySelectorAll('.how__list li')];
const shots = [...document.querySelectorAll('.how__media .shot')];
let activeStep = -1;
const syncSteps = () => {
  if (!steps.length || window.innerWidth <= 820) return;
  // The step whose middle is closest to the middle of the screen is the one being read.
  const mid = window.innerHeight / 2;
  let best = 0;
  let bestDist = Infinity;
  steps.forEach((s, k) => {
    const r = s.getBoundingClientRect();
    const d = Math.abs(r.top + r.height / 2 - mid);
    if (d < bestDist) { bestDist = d; best = k; }
  });
  if (best === activeStep) return;
  activeStep = best;
  listItems.forEach((li, k) => li.classList.toggle('is-on', k === best));
  shots.forEach((s, k) => s.classList.toggle('is-on', k === best));
};

const seg = document.querySelectorAll('.seg__item');
const easy = document.getElementById('easy');
const syncSeg = () => {
  if (!easy || seg.length !== 2) return;
  const post = easy.getBoundingClientRect().top < window.innerHeight * 0.5;
  seg[0].classList.toggle('is-on', !post);
  seg[1].classList.toggle('is-on', post);
};

// Why-we-built-it cards start stacked in the middle and fan out to their places as the section scrolls in.
const board = document.querySelector('.board');
const cards = [...document.querySelectorAll('.qcard')];
const placeCards = () => {
  if (!board) return;
  const cx = board.clientWidth / 2;
  const cy = 260;
  cards.forEach((c) => {
    const x = c.offsetLeft + c.offsetWidth / 2;
    const y = c.offsetTop + c.offsetHeight / 2;
    c.style.setProperty('--dx', `${(cx - x).toFixed(0)}px`);
    c.style.setProperty('--dy', `${(cy - y).toFixed(0)}px`);
  });
};
const drift = () => {
  if (!board) return;
  if (reduceMotion || window.innerWidth <= 1080) { cards.forEach((c) => c.style.setProperty('--k', 1)); return; }
  const r = board.getBoundingClientRect();
  const vh = window.innerHeight;
  // 0 when the board's top is at the bottom of the screen, 1 once it's a third of the way up.
  const k = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.72)));
  const eased = 1 - Math.pow(1 - k, 3);
  cards.forEach((c) => c.style.setProperty('--k', eased.toFixed(3)));
};
placeCards();
window.addEventListener('resize', placeCards);

/* ---------- The problem: 100 visitors; scroll and watch 97 of them leave ---------- */
const leak = document.getElementById('why');
const crowd = leak ? [...leak.querySelectorAll('.crowd i')] : [];
const BUYERS = new Set([23, 58, 86]);
// A fixed shuffled order, so the crowd thins out unevenly like a real store.
const leaveOrder = crowd.map((_, i) => i).filter((i) => !BUYERS.has(i)).sort((a, b) => ((a * 37) % 101) - ((b * 37) % 101));
const leakBeats = leak ? [...leak.querySelectorAll('.leak__beats li')] : [];
const leftEl = document.getElementById('leak-left');
const boughtEl = document.getElementById('leak-bought');
const paintLeak = (p) => {
  const beat = p < 0.28 ? 0 : p < 0.5 ? 1 : 2;
  leakBeats.forEach((li, k) => li.classList.toggle('is-on', k <= beat));
  leak.classList.toggle('has-qs', p >= 0.28);
  leak.classList.toggle('is-leaving', p >= 0.55);
  const gone = Math.round(Math.max(0, Math.min(1, (p - 0.55) / 0.33)) * 97);
  leaveOrder.forEach((idx, k) => crowd[idx].classList.toggle('is-gone', k < gone));
  const bought = p >= 0.9;
  BUYERS.forEach((idx) => crowd[idx].classList.toggle('is-buy', bought));
  leftEl.textContent = String(gone);
  boughtEl.textContent = bought ? '3' : '0';
};
const syncLeak = () => {
  if (!leak) return;
  if (window.innerWidth <= 820) return; // phones get a timed version instead
  const r = leak.getBoundingClientRect();
  const p = Math.max(0, Math.min(1, -r.top / (r.height - window.innerHeight)));
  paintLeak(reduceMotion ? 1 : p);
};
if (leak && 'IntersectionObserver' in window) {
  let played = false;
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting || played || window.innerWidth > 820) return;
    played = true;
    if (reduceMotion) return paintLeak(1);
    const t0 = performance.now();
    const run = (now) => { const p = Math.min(1, (now - t0) / 5200); paintLeak(p); if (p < 1) requestAnimationFrame(run); };
    requestAnimationFrame(run);
  }, { threshold: 0.4 }).observe(leak.querySelector('.leak__viz'));
}

/* ---------- Waiting vs speaking first: both stores on one clock ---------- */
const vsx = document.getElementById('vsx');
if (vsx) {
  const section = vsx.closest('.vsx');
  const PHASES = [[0, 0], [1400, 1], [2300, 2], [3500, 3], [4600, 4], [5800, 5]];
  const LOOP = 9000;
  let t = 0; let last = 0; let running = false;
  const frame = (now) => {
    if (!running) return;
    t = (t + (last ? Math.min(now - last, 100) : 0)) % LOOP;
    last = now;
    let ph = 0;
    for (const [at, n] of PHASES) if (t >= at) ph = n;
    if (section.dataset.phase !== String(ph)) section.dataset.phase = String(ph);
    requestAnimationFrame(frame);
  };
  if (reduceMotion) section.dataset.phase = '5';
  else if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) { running = true; last = 0; requestAnimationFrame(frame); }
      else if (!e.isIntersecting) running = false;
    }).observe(vsx);
  }
}

let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { syncSteps(); syncSeg(); drift(); syncLeak(); ticking = false; });
};
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
syncSteps(); syncSeg(); drift(); syncLeak();

/* ---------- FAQ: questions on the left, answer bubble on the right ---------- */
const tabs = document.querySelectorAll('.faq__qs [role="tab"]');
const echo = document.getElementById('faq-echo');
const bubble = document.getElementById('faq-bubble');
const panel = document.getElementById('faq-answer');
// Answers arrive the way a chat reply does: a beat of typing, then the words.
let typing = null;
const typeOut = (el, text) => {
  clearInterval(typing);
  if (reduceMotion) { el.textContent = text; return; }
  el.innerHTML = '<span class="sw__dots"><i></i><i></i><i></i></span>';
  let i = 0;
  setTimeout(() => {
    el.textContent = '';
    typing = setInterval(() => {
      i = Math.min(text.length, i + 3);
      el.textContent = text.slice(0, i);
      if (i >= text.length) clearInterval(typing);
    }, 16);
  }, 450);
};
const select = (tab) => {
  tabs.forEach((t) => { t.setAttribute('aria-selected', String(t === tab)); t.tabIndex = t === tab ? 0 : -1; });
  echo.textContent = tab.textContent;
  typeOut(bubble, tab.dataset.a);
  panel.setAttribute('aria-labelledby', tab.id);
};
tabs.forEach((tab, i) => {
  tab.tabIndex = i === 0 ? 0 : -1;
  tab.addEventListener('click', () => select(tab));
  tab.addEventListener('keydown', (e) => {
    const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!k) return;
    e.preventDefault();
    const next = tabs[(i + k + tabs.length) % tabs.length];
    select(next);
    next.focus();
  });
});

/* ---------- Mobile sticky CTA: hidden over the hero, the pilot form and the footer ---------- */
const sticky = document.querySelector('.sticky-cta');
if (sticky && 'IntersectionObserver' in window) {
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
  [['hero', '#hero'], ['pilot', '#pilot'], ['footer', '.footer']].forEach(([key, sel]) => {
    const el = document.querySelector(sel);
    if (el) { el.dataset.watch = key; io.observe(el); }
  });
}

/* ---------- Pilot form -> /api/lead (stored in Airtable) ---------- */
const form = document.getElementById('pilot-form');
if (form) {
  const note = form.querySelector('.form__note');
  const button = form.querySelector('button[type="submit"]');
  const setNote = (text, state) => {
    note.textContent = text;
    note.classList.remove('is-ok', 'is-err');
    if (state) note.classList.add(state);
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fields = [form.name, form.email, form.store];
    let firstInvalid = null;
    fields.forEach((input) => {
      const ok = input.value.trim() !== '' && (input !== form.email || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim()));
      input.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) {
      const msgs = { name: 'Enter your name.', email: 'Enter a valid work email.', store: 'Enter your store URL, like yourstore.com.' };
      setNote(msgs[firstInvalid.name], 'is-err');
      firstInvalid.focus();
      return;
    }

    const details = { name: form.name.value.trim(), email: form.email.value.trim(), store: form.store.value.trim() };
    button.disabled = true;
    button.textContent = 'Saving…';
    try {
      await Sahaay.postJson('/api/lead', { intent: 'Pilot', ...details, company_site: form.company_site.value, source: 'pilot-form' });
      form.classList.add('is-done');
      form.innerHTML = `
        <div class="form__done" role="status">
          <span class="form__tick" aria-hidden="true"></span>
          <p class="form__done-title">You’re on the list.</p>
          <p>We’ll email ${details.email.replace(/[<>&"]/g, '')} within one working day to set up your pilot.</p>
          <button type="button" class="btn btn--lav btn--block" id="pilot-book">Book a 20-minute demo now</button>
        </div>`;
      document.getElementById('pilot-book').addEventListener('click', () => Sahaay.openBooking(details));
    } catch (err) {
      button.disabled = false;
      button.textContent = 'Claim my pilot spot';
      if (err.status === 400 || err.status === 429) setNote(err.message, 'is-err');
      else setNote('We couldn’t save that just now. Try again, or book a demo instead.', 'is-err');
    }
  });

  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value.trim()) e.target.setAttribute('aria-invalid', 'false');
  });
}
