/*
 * Sahaay website: demo booking (Calendly) and the website assistant chat widget.
 * Exposes window.Sahaay.openBooking(prefill) for the page script.
 */
(() => {
  const CALENDLY_URL = 'https://calendly.com/ka1sh8vi/sahaay-demo';
  const API = ''; // same origin as the site; the server in server.mjs answers /api/*

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function postJson(path, body) {
    const res = await fetch(API + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    let data = {};
    try { data = await res.json(); } catch { /* non-JSON (static hosting) */ }
    if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { status: res.status, data });
    return data;
  }

  /* =====================================================================
   * Demo booking: short details form -> lead saved -> Calendly inline -> booked
   * ===================================================================== */
  const dialog = $('#book');
  let leadToken = null;
  let calendlyLoading = null;

  function loadCalendly() {
    if (window.Calendly) return Promise.resolve();
    if (calendlyLoading) return calendlyLoading;
    calendlyLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://assets.calendly.com/assets/external/widget.js';
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return calendlyLoading;
  }

  function showStep(name) {
    dialog.querySelectorAll('.book__step').forEach((el) => { el.hidden = el.dataset.step !== name; });
  }

  function openBooking(prefill = {}) {
    if (!dialog || typeof dialog.showModal !== 'function') {
      window.open(CALENDLY_URL, '_blank', 'noopener');
      return;
    }
    const form = $('#book-form');
    form.reset();
    ['name', 'email', 'store'].forEach((k) => { if (prefill[k]) form[k].value = prefill[k]; });
    $('#book-note').textContent = '';
    $('#book-cal').innerHTML = '';
    leadToken = null;
    showStep('details');
    dialog.showModal();
    (form.name.value ? form.email : form.name).focus();
    loadCalendly().catch(() => {});
  }

  if (dialog) {
    $('.book__close', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

    $('#book-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const note = $('#book-note');
      const email = form.email.value.trim();
      if (!form.name.value.trim()) { note.textContent = 'Enter your name.'; form.name.focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { note.textContent = 'Enter a valid work email.'; form.email.focus(); return; }
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'One moment…';
      const details = { name: form.name.value.trim(), email, store: form.store.value.trim() };
      try {
        const out = await postJson('/api/lead', { intent: 'Demo', ...details, company_site: form.company_site.value, source: 'demo-modal' });
        leadToken = out.lead || null;
      } catch (err) {
        // Don't block the booking if saving fails: Calendly still records it.
        console.warn('Sahaay: lead not saved', err);
      }
      btn.disabled = false;
      btn.textContent = 'Pick a time';
      showStep('calendar');
      const box = $('#book-cal');
      try {
        await loadCalendly();
        window.Calendly.initInlineWidget({
          url: `${CALENDLY_URL}?hide_gdpr_banner=1&primary_color=6c5fff&text_color=111126`,
          parentElement: box,
          prefill: { name: details.name, email: details.email, customAnswers: details.store ? { a1: `Store: ${details.store}` } : {} },
          utm: { utmSource: 'sahaay-website', utmMedium: 'demo-modal' },
        });
      } catch {
        box.innerHTML = `<p class="book__fallback">The calendar didn’t load here. <a href="${CALENDLY_URL}" target="_blank" rel="noopener">Open the booking page</a> to pick a time.</p>`;
      }
    });

    window.addEventListener('message', (e) => {
      if (e.origin !== 'https://calendly.com' || !e.data || e.data.event !== 'calendly.event_scheduled') return;
      const eventUri = e.data.payload?.event?.uri;
      if (leadToken && eventUri) postJson('/api/lead/booked', { lead: leadToken, event: eventUri }).catch(() => {});
      setTimeout(() => showStep('done'), 1200);
    });
  }

  /* =====================================================================
   * Website assistant
   * ===================================================================== */
  const GREETING = 'Hi! Ask me anything about Sahaay.';
  const SUGGESTIONS = ['How does the pilot work?', 'Do you charge per order?', 'How long is setup?'];

  // Built-in answers, used when the live assistant can't be reached. Same facts as knowledge/sahaay.md.
  const LOCAL = [
    { k: ['pilot', 'free', 'trial', 'try'], a: 'The founding pilot is free for 14 days: 100 real conversations, Sahaay trained on your catalog, the full analytics dashboard and approval on every action. No card, no commitment, and it’s open to the first 10 brands. Use **Claim free pilot** below to sign up.' },
    { k: ['price', 'pricing', 'cost', 'charge', 'per order', 'commission', 'fee', 'expensive', 'plan'], a: 'Sahaay doesn’t charge per order or take a commission, because checkout happens on your own store. The pilot is free for 14 days; pricing after that is shared on a call.' },
    { k: ['setup', 'set up', 'install', 'integrate', 'how long', 'onboard', 'snippet', '24'], a: 'Share your store link and Sahaay learns your catalog, policies and brand voice in under 24 hours. Then you add one snippet to your site and it goes live.' },
    { k: ['checkout', 'payment', 'pay', 'cart'], a: 'Shoppers pick a size and colour and add to cart inside the chat, then pay on your own checkout page. Sahaay never takes payments, which is why there’s no per-order fee.' },
    { k: ['trigger', 'exit', 'proactive', 'speak first', 'scroll', 'time on page', 'popup', 'pop-up'], a: 'Sahaay can start the conversation when a shopper shows a signal: exit intent, time on a product, scroll depth, or a cart value you set. Each trigger gets a message that fits the moment.' },
    { k: ['return', 'refund', 'cancel', 'damage', 'approve', 'approval', 'permission'], a: 'Shoppers report issues in the chat and can attach a photo; damage photos get an AI score. Every refund, return and cancellation waits in your dashboard until you approve it.' },
    { k: ['track', 'order status', 'where is my order', 'where’s my order', 'post-purchase', 'after purchase', 'delivery'], a: 'After purchase, shoppers look up orders by email with a six-digit code, track status, see order history and report issues, all in the chat. About 80% of these questions get resolved without a human.' },
    { k: ['shopify', 'woocommerce', 'platform', 'integration', 'wix', 'magento'], a: 'I don’t have a confirmed list of supported store platforms yet. The team can check your setup on a 20-minute demo call.' },
    { k: ['language', 'hindi', 'tamil', 'regional'], a: 'I don’t have a confirmed list of chat languages yet. The team can confirm it for your store on a demo call.' },
    { k: ['security', 'privacy', 'data', 'gdpr', 'soc'], a: 'Sahaay answers only from your own catalog and policies, and actions like refunds need your approval. For security and data questions, the team will walk you through details on a demo call.' },
    { k: ['demo', 'call', 'meeting', 'talk', 'book', 'calendly'], a: 'The demo is a 20-minute video call: your store and where shoppers drop off, Sahaay live on your own catalog, then a pilot plan. Use **Book a demo** below to pick a time.' },
    { k: ['analytics', 'dashboard', 'report', 'revenue', 'measure'], a: 'Your dashboard shows every conversation, saved cart and the revenue Sahaay brought in, so you can see what it’s worth.' },
    { k: ['brand', 'voice', 'tone', 'custom', 'theme', 'colour', 'color'], a: 'Sahaay learns your tone from your site and policies, and you set its branding and widget theme in the admin.' },
    { k: ['what is', 'what does', 'who are', 'about', 'sahaay', 'how does it work', 'how it works'], a: 'Sahaay is an AI sales agent for online stores. It greets shoppers, answers product questions in under 2 seconds, recommends what fits, recovers carts and handles order questions after purchase.' },
    { k: ['stat', 'number', '97', 'conversion', 'abandon'], a: '97% of store visitors leave without buying (Monetate), about 70% of carts are abandoned (Baymard), and proactive chat converts 3.5x better (McKinsey).' },
    { k: ['contact', 'linkedin', 'instagram', 'email', 'reach'], a: 'You can find us on LinkedIn (linkedin.com/company/sahaay-sales) and Instagram (@sahaay_sells), or book a demo below.' },
  ];
  function localAnswer(q) {
    const text = q.toLowerCase();
    let best = null;
    let score = 0;
    for (const item of LOCAL) {
      const s = item.k.reduce((n, k) => n + (text.includes(k) ? k.length : 0), 0);
      if (s > score) { score = s; best = item; }
    }
    return best ? best.a : 'I’m not sure about that one. The team can answer it on a 20-minute demo call, or you can start the free pilot below.';
  }

  function render(md) {
    let h = esc(md);
    h = h.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    h = h.replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    h = h.replace(/(^|[\s(])(https:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
    h = h.replace(/^\s*[-•]\s+(.+)$/gm, '<span class="sw__li">$1</span>');
    return h.replace(/\n/g, '<br>');
  }

  const root = document.createElement('div');
  root.className = 'sw';
  root.innerHTML = `
    <p class="sw__teaser" hidden>Questions? Ask me.</p>
    <section class="sw__panel" id="sw-panel" role="dialog" aria-label="Sahaay assistant" hidden>
      <header class="sw__head">
        <span class="sw__av"><img src="assets/logo/sahaay-monogram-white.svg" alt="" width="14" height="18"></span>
        <span class="sw__who"><b>Sahaay</b><span><i></i>AI-powered</span></span>
        <button type="button" class="sw__x" aria-label="Close chat">×</button>
      </header>
      <div class="sw__log" role="log" aria-live="polite"></div>
      <form class="sw__form">
        <label class="sr" for="sw-input">Your question</label>
        <textarea id="sw-input" rows="1" maxlength="1000" placeholder="Type a question…"></textarea>
        <button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2-7z"/></svg></button>
      </form>
    </section>
    <button type="button" class="sw__launch" aria-controls="sw-panel" aria-expanded="false" aria-label="Chat with Sahaay">
      <img class="sw__mono" src="assets/logo/sahaay-monogram-white.svg" alt="" width="20" height="26">
      <svg class="sw__close" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>`;
  document.body.appendChild(root);

  const panel = $('.sw__panel', root);
  const launch = $('.sw__launch', root);
  const log = $('.sw__log', root);
  const chips = document.createElement('div');
  chips.className = 'sw__chips';
  const form = $('.sw__form', root);
  const input = $('#sw-input', root);
  const teaser = $('.sw__teaser', root);
  const history = [];
  let busy = false;

  function addMsg(role, text) {
    const el = document.createElement('div');
    el.className = `sw__msg sw__msg--${role === 'user' ? 'me' : 'bot'}`;
    el.innerHTML = render(text);
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  // Small next-step links under answers that point somewhere: no standing buttons.
  function addActions(after, text) {
    const wantsPilot = /pilot|free|sign up|trial/i.test(text);
    const wantsDemo = /demo|call|book/i.test(text);
    if (!wantsPilot && !wantsDemo) return;
    const row = document.createElement('div');
    row.className = 'sw__acts';
    if (wantsPilot) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = 'Claim free pilot →';
      b.addEventListener('click', () => { setOpen(false); document.getElementById('pilot')?.scrollIntoView({ behavior: 'smooth' }); });
      row.appendChild(b);
    }
    if (wantsDemo) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = 'Book a demo →';
      b.addEventListener('click', () => openBooking());
      row.appendChild(b);
    }
    after.after(row);
    log.scrollTop = log.scrollHeight;
  }

  function setOpen(open) {
    panel.hidden = !open;
    root.classList.toggle('is-open', open);
    launch.setAttribute('aria-expanded', String(open));
    launch.setAttribute('aria-label', open ? 'Close chat' : 'Chat with Sahaay');
    teaser.hidden = true;
    if (open) {
      if (!log.children.length) { addMsg('assistant', GREETING); log.appendChild(chips); }
      input.focus();
    }
  }

  SUGGESTIONS.forEach((q) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = q;
    b.addEventListener('click', () => ask(q));
    chips.appendChild(b);
  });

  async function ask(q) {
    q = q.trim();
    if (!q || busy) return;
    busy = true;
    chips.remove();
    addMsg('user', q);
    history.push({ role: 'user', content: q });
    const bot = addMsg('assistant', '');
    bot.classList.add('is-typing');
    bot.innerHTML = '<span class="sw__dots"><i></i><i></i><i></i></span>';
    let text = '';
    try {
      const res = await fetch(API + '/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: history }) });
      if (!res.ok || !res.body || !(res.headers.get('content-type') || '').includes('text/event-stream')) {
        let msg = '';
        try { msg = (await res.json()).error || ''; } catch { /* static hosting */ }
        throw Object.assign(new Error(msg || 'offline'), { status: res.status, user: res.status === 429 ? msg : '' });
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n\n')) >= 0) {
          const line = buf.slice(0, i).replace(/^data: /, '');
          buf = buf.slice(i + 2);
          let ev;
          try { ev = JSON.parse(line); } catch { continue; }
          if (ev.t) text += ev.t;
          if (ev.replace) text = ev.replace;
          if (ev.error) text = text || ev.error;
          bot.classList.remove('is-typing');
          bot.innerHTML = render(text);
          log.scrollTop = log.scrollHeight;
        }
      }
      if (!text) throw new Error('empty');
    } catch (err) {
      text = err.user || localAnswer(q);
      bot.classList.remove('is-typing');
      bot.innerHTML = render(text);
    }
    history.push({ role: 'assistant', content: text });
    addActions(bot, text);
    busy = false;
    log.scrollTop = log.scrollHeight;
  }

  launch.addEventListener('click', () => setOpen(panel.hidden));
  $('.sw__x', root).addEventListener('click', () => { setOpen(false); launch.focus(); });
  teaser.addEventListener('click', () => setOpen(true));
  form.addEventListener('submit', (e) => { e.preventDefault(); const q = input.value; input.value = ''; input.style.height = ''; ask(q); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  input.addEventListener('input', () => { input.style.height = ''; input.style.height = Math.min(input.scrollHeight, 110) + 'px'; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden && !(dialog && dialog.open)) setOpen(false); });

  // A one-time nudge after a short read.
  let seen = false;
  try { seen = sessionStorage.getItem('sw-teaser') === '1'; } catch { /* storage blocked */ }
  if (!seen) {
    setTimeout(() => {
      if (!panel.hidden) return;
      teaser.hidden = false;
      try { sessionStorage.setItem('sw-teaser', '1'); } catch { /* storage blocked */ }
      setTimeout(() => { teaser.hidden = true; }, 9000);
    }, 9000);
  }

  window.Sahaay = { openBooking, postJson, CALENDLY_URL };
})();
