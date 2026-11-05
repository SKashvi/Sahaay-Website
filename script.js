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

document.documentElement.classList.add('js');

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

/* Nav border once scrolled */
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* Mobile sticky CTA: visible after the hero, hidden while the pilot form or footer is on screen */
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

/* 100-visitor dot grid: 3 green dots buy, 97 leave */
const dots = document.getElementById('dots');
if (dots) {
  const buyers = new Set([23, 58, 86]);
  for (let i = 0; i < 100; i++) {
    const d = document.createElement('i');
    if (buyers.has(i)) d.className = 'buy';
    dots.appendChild(d);
  }
}

/* Gentle reveal on scroll */
if ('IntersectionObserver' in window) {
  const targets = document.querySelectorAll(
    '.section__head, .visitors, .stat, .bridge, .journey li, .step, .feature, .numbers__grid > div, .quote, .pilot__copy, .pilot__card, .faq, .final__card'
  );
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  targets.forEach((el) => { el.classList.add('reveal'); io.observe(el); });
}

/* Pilot form */
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
      setNote(firstInvalid === store ? 'Please enter your store URL.' : 'Please enter a valid email.', 'is-err');
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
        setNote('You’re in! We’ll be in touch within one working day.', 'is-ok');
        button.textContent = 'Spot requested ✓';
      } catch (err) {
        setNote('Something went wrong. Please try again in a moment.', 'is-err');
        button.disabled = false;
        button.textContent = 'Claim my pilot spot';
      }
      return;
    }

    if (CONFIG.contactEmail) {
      const subject = encodeURIComponent('Sahaay pilot request');
      const body = encodeURIComponent(`Store: ${data.get('store')}\nEmail: ${data.get('email')}`);
      window.location.href = `mailto:${CONFIG.contactEmail}?subject=${subject}&body=${body}`;
      setNote('Opening your email app to send the request…', 'is-ok');
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
