/*
 * Sahaay landing page behaviour.
 * Fill in CONFIG before going live; everything degrades gracefully while it's empty.
 */
const CONFIG = {
  // Where the pilot form POSTs (Formspree, Basin, your own API...). Receives `store` and `email` as form data.
  formEndpoint: '',
  // Fallback when there's no endpoint: the form opens the visitor's email app addressed here.
  contactEmail: '',
  // Calendly / Cal.com link for the 20-minute demo. Empty = "Book a demo" links scroll to the pilot form.
  bookingUrl: '',
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Demo-booking links */
if (CONFIG.bookingUrl) {
  document.querySelectorAll('[data-book]').forEach((a) => {
    a.href = CONFIG.bookingUrl;
    a.target = '_blank';
    a.rel = 'noopener';
  });
}

/* Footer year */
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

/* ---------- Catalog screen: one template, used in the sticky and mobile how-it-works steps ---------- */
const tplCatalog = document.getElementById('tpl-catalog');
if (tplCatalog) {
  document.querySelectorAll('[data-tpl="catalog"]').forEach((slot) => slot.appendChild(tplCatalog.content.cloneNode(true)));
}

/* ---------- Hero demo: each trigger makes Sahaay speak first ---------- */
const DEMO = [
  { badge: 'Exit intent', msg: 'Leaving already? The Wrap Midi Dress runs true to size. Want help picking yours?', btn: 'Help me pick' },
  { badge: '45s on page', msg: 'Still deciding? It’s viscose crepe, light enough for a summer wedding. Ask me anything about it.', btn: 'Ask a question' },
  { badge: '70% scrolled', msg: 'Checking delivery? It reaches you in 4 to 7 business days, and returns are accepted within 14 days.', btn: 'Check my PIN code' },
  { badge: 'Cart ₹2,599', msg: 'Your order ships free. Want a layer to go with it? The Utility Bomber Jacket is ₹3,499.', btn: 'Show me' },
];
const demoScreen = document.getElementById('demo-screen');
const trigs = document.querySelectorAll('.trig');
if (demoScreen && trigs.length) {
  const badge = document.getElementById('demo-badge');
  const pop = document.getElementById('demo-pop');
  const msg = document.getElementById('demo-msg');
  const btn = document.getElementById('demo-btn');
  const addBtn = demoScreen.querySelector('.pdp__add');
  const DUR = 4500;
  let cur = 0;
  let timer = null;
  const show = (i) => {
    cur = i;
    trigs.forEach((t, k) => {
      t.classList.toggle('is-on', k === i);
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
    demoScreen.dataset.state = String(i);
    badge.textContent = DEMO[i].badge;
    addBtn.textContent = i === 3 ? 'Added to cart ✓' : 'Add to cart';
    pop.classList.add('is-out');
    setTimeout(() => {
      msg.textContent = DEMO[i].msg;
      btn.textContent = DEMO[i].btn;
      pop.classList.remove('is-out');
    }, reduceMotion ? 0 : 450);
  };
  const auto = () => {
    clearInterval(timer);
    if (reduceMotion) return;
    timer = setInterval(() => show((cur + 1) % trigs.length), DUR);
  };
  document.documentElement.style.setProperty('--dur', DUR + 'ms');
  trigs.forEach((t, i) => {
    t.addEventListener('click', () => { show(i); auto(); });
    t.addEventListener('keydown', (e) => {
      const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!k) return;
      e.preventDefault();
      const n = (i + k + trigs.length) % trigs.length;
      show(n); auto(); trigs[n].focus();
    });
  });
  // Pause while the demo is off screen.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { if (e.isIntersecting) auto(); else clearInterval(timer); }).observe(demoScreen);
  } else {
    auto();
  }
}

/* ---------- How it works: sticky media follows the step in view ---------- */
const steps = document.querySelectorAll('.how__step');
const listItems = document.querySelectorAll('.how__list li');
const shots = document.querySelectorAll('.how__media .shot');
if (steps.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const n = Number(e.target.dataset.step);
      listItems.forEach((li, k) => li.classList.toggle('is-on', k === n));
      shots.forEach((s, k) => s.classList.toggle('is-on', k === n));
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach((s) => io.observe(s));
}

/* Segmented control in the nav reflects where you are */
const seg = document.querySelectorAll('.seg__item');
const easy = document.getElementById('easy');
const onScroll = () => {
  if (easy && seg.length === 2) {
    const post = easy.getBoundingClientRect().top < window.innerHeight * 0.5;
    seg[0].classList.toggle('is-on', !post);
    seg[1].classList.toggle('is-on', post);
  }
};

/* Quote cards drift at different speeds */
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
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { onScroll(); drift(); ticking = false; });
}, { passive: true });
window.addEventListener('resize', drift);
onScroll();
drift();

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

/* ---------- Pilot form ---------- */
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

    const store = form.store;
    // Accept "yourstore.com" without a scheme.
    if (store.value && !/^https?:\/\//i.test(store.value.trim())) store.value = 'https://' + store.value.trim();

    let firstInvalid = null;
    [store, form.email].forEach((input) => {
      const ok = input.checkValidity();
      input.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) {
      setNote(firstInvalid === store ? 'Enter your store URL, like yourstore.com.' : 'Enter a valid work email.', 'is-err');
      firstInvalid.focus();
      return;
    }

    const data = new FormData(form);

    if (CONFIG.formEndpoint) {
      button.disabled = true;
      button.textContent = 'Sending…';
      try {
        const res = await fetch(CONFIG.formEndpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(res.statusText);
        form.reset();
        setNote('Request received. We’ll reply within one working day.', 'is-ok');
        button.textContent = 'Spot requested';
      } catch (err) {
        setNote('That didn’t go through. Check your connection and try again.', 'is-err');
        button.disabled = false;
        button.textContent = 'Claim my pilot spot';
      }
      return;
    }

    if (CONFIG.contactEmail) {
      const subject = encodeURIComponent('Sahaay pilot request');
      const body = encodeURIComponent(`Store: ${data.get('store')}\nEmail: ${data.get('email')}`);
      window.location.href = `mailto:${CONFIG.contactEmail}?subject=${subject}&body=${body}`;
      setNote(`Opening your email app. If nothing opens, write to ${CONFIG.contactEmail}.`, 'is-ok');
      return;
    }

    console.warn('Sahaay: set CONFIG.formEndpoint or CONFIG.contactEmail in script.js to receive pilot requests.');
    setNote('Sign-ups open shortly. Follow us on LinkedIn or Instagram for the launch.', 'is-err');
  });

  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true' && e.target.checkValidity()) {
      e.target.setAttribute('aria-invalid', 'false');
    }
  });
}
