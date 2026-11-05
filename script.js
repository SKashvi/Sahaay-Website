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

/* ---------- Hero demo: one clock drives the trigger bar, the page, the badge and the pop-up ---------- */
const DEMO = [
  { badge: 'Exit intent', msg: 'Leaving already? The Wrap Midi Dress runs true to size. Want help picking yours?', btn: 'Help me pick' },
  { badge: '45s on page', msg: 'Still deciding? It’s viscose crepe, light enough for a summer wedding. Ask me anything about it.', btn: 'Ask a question' },
  { badge: '70% scrolled', msg: 'Checking delivery? It reaches you in 4 to 7 business days, and returns are accepted within 14 days.', btn: 'Check my PIN code' },
  { badge: 'Cart ₹2,599', msg: 'Your order ships free. Want a layer to go with it? The Utility Bomber Jacket is ₹3,499.', btn: 'Show me' },
];
// Timeline of one trigger, in ms from the moment it starts.
const T = { swap: 280, act: 120, fire: 900, pop: 1050, next: 5600 };

const demoScreen = document.getElementById('demo-screen');
const trigs = [...document.querySelectorAll('.trig')];
if (demoScreen && trigs.length) {
  const badge = document.getElementById('demo-badge');
  const pop = document.getElementById('demo-pop');
  const msg = document.getElementById('demo-msg');
  const btn = document.getElementById('demo-btn');
  const addBtn = demoScreen.querySelector('.pdp__add');
  const bars = trigs.map((t) => t.querySelector('.trig__bar'));

  let cur = 0;
  let elapsed = 0;        // ms into the current trigger
  let last = 0;           // last frame timestamp
  let running = false;    // on screen and tab visible
  let flags = {};

  const enter = (i) => {
    cur = i;
    elapsed = 0;
    flags = {};
    trigs.forEach((t, k) => {
      const on = k === i;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    bars.forEach((b) => b.style.setProperty('--p', 0));
    demoScreen.classList.remove('is-fired', 'is-acting');
    pop.classList.add('is-out');
    badge.textContent = i === 1 ? '0s on page' : 'Watching…';
    addBtn.textContent = 'Add to cart';
    demoScreen.dataset.state = String(i);
    if (reduceMotion) step(T.pop + 1);
  };

  // Apply everything that should have happened by time `e`.
  const step = (e) => {
    elapsed = e;
    if (!flags.swap && e >= T.swap) { flags.swap = true; msg.textContent = DEMO[cur].msg; btn.textContent = DEMO[cur].btn; }
    if (!flags.act && e >= T.act) {
      flags.act = true;
      demoScreen.classList.add('is-acting');           // cursor moves, page scrolls, item goes in the cart
      if (cur === 3) addBtn.textContent = 'Added to cart ✓';
    }
    if (cur === 1 && e < T.fire) badge.textContent = `${Math.round((45 * e) / T.fire)}s on page`;
    if (!flags.fire && e >= T.fire) { flags.fire = true; badge.textContent = DEMO[cur].badge; demoScreen.classList.add('is-fired'); }
    if (!flags.pop && e >= T.pop) { flags.pop = true; pop.classList.remove('is-out'); }
    bars[cur].style.setProperty('--p', reduceMotion ? 1 : Math.min(1, e / T.next).toFixed(4));
  };

  const frame = (now) => {
    if (!running) return;
    const dt = last ? Math.min(now - last, 100) : 0; // clamp so a stalled tab doesn't skip ahead
    last = now;
    step(elapsed + dt);
    if (elapsed >= T.next) enter((cur + 1) % trigs.length);
    requestAnimationFrame(frame);
  };
  const play = () => { if (running || reduceMotion) return; running = true; last = 0; requestAnimationFrame(frame); };
  const pause = () => { running = false; };

  trigs.forEach((t, i) => {
    t.addEventListener('click', () => enter(i));
    t.addEventListener('keydown', (e) => {
      const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!k) return;
      e.preventDefault();
      const n = (i + k + trigs.length) % trigs.length;
      enter(n);
      trigs[n].focus();
    });
  });

  let onScreen = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      onScreen && !document.hidden ? play() : pause();
    }).observe(demoScreen);
  }
  document.addEventListener('visibilitychange', () => (document.hidden || !onScreen ? pause() : play()));

  enter(0);
  play();
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

const board = document.querySelector('.board');
const cards = document.querySelectorAll('.qcard[data-depth]');
const drift = () => {
  if (!board || reduceMotion || window.innerWidth <= 1080) {
    cards.forEach((c) => c.style.removeProperty('--py'));
    return;
  }
  const r = board.getBoundingClientRect();
  const d = r.top + r.height / 2 - window.innerHeight / 2;
  const clamp = (v) => Math.max(-48, Math.min(48, v));
  cards.forEach((c) => c.style.setProperty('--py', clamp(d * Number(c.dataset.depth)).toFixed(1) + 'px'));
};

let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { syncSteps(); syncSeg(); drift(); ticking = false; });
};
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
syncSteps(); syncSeg(); drift();

/* ---------- FAQ: questions on the left, answer bubble on the right ---------- */
const tabs = document.querySelectorAll('.faq__qs [role="tab"]');
const echo = document.getElementById('faq-echo');
const bubble = document.getElementById('faq-bubble');
const panel = document.getElementById('faq-answer');
const select = (tab) => {
  tabs.forEach((t) => { t.setAttribute('aria-selected', String(t === tab)); t.tabIndex = t === tab ? 0 : -1; });
  echo.textContent = tab.textContent;
  bubble.textContent = tab.dataset.a;
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
