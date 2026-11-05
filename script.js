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

/* ---------- Flowing text along SVG paths (hero + compare card) ---------- */
function flowText(id, speed) {
  const tp = document.getElementById(id);
  if (!tp) return null;
  // Repeat the copy so the path is always filled, then scroll by one copy's length.
  const copy = tp.textContent;
  tp.textContent = copy + copy + copy;
  let unit = 0;
  const measure = () => { unit = tp.parentNode.getComputedTextLength() / 3; };
  return {
    tick(t) {
      if (!unit) measure();
      if (!unit) return;
      const offset = ((t * speed) % unit) - unit;
      tp.setAttribute('startOffset', offset.toFixed(1));
    },
    measure,
  };
}
const flows = [flowText('tp-in', 0.045), flowText('tp-out', 0.05), flowText('tp-cmp', 0.04)].filter(Boolean);
if (flows.length) {
  if (reduceMotion) {
    flows.forEach((f) => f.tick(1200 / 0.045));
  } else {
    const loop = (t) => { flows.forEach((f) => f.tick(t)); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  document.fonts && document.fonts.ready.then(() => flows.forEach((f) => f.measure()));
}

/* Hero chip cycles through what Sahaay just did */
const chip = document.getElementById('flow-chip');
const chipText = document.getElementById('flow-chip-text');
const sizeChip = () => {
  if (!chip || !chipText || !chipText.getBBox) return;
  const w = chipText.getBBox().width;
  const rect = chip.querySelector('rect');
  const tick = chip.querySelector('.flow__chip-tick');
  const total = w + 54;
  rect.setAttribute('x', (-total / 2).toFixed(1));
  rect.setAttribute('width', total.toFixed(1));
  tick.setAttribute('transform', `translate(${(-total / 2 + 20 + 58).toFixed(1)} 0)`);
  chipText.setAttribute('x', (-total / 2 + 40).toFixed(1));
};
if (chipText) { chipText.setAttribute('text-anchor', 'start'); sizeChip(); document.fonts && document.fonts.ready.then(sizeChip); }
if (chip && chipText && !reduceMotion) {
  const steps = ['Stock confirmed', 'Size checked', 'Delivery estimated', 'Added to cart'];
  let i = 0;
  setInterval(() => {
    chip.style.opacity = '0';
    setTimeout(() => {
      i = (i + 1) % steps.length;
      chipText.textContent = steps[i];
      sizeChip();
      chip.style.opacity = '1';
    }, 300);
  }, 2600);
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
