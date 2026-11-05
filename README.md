# Sahaay website

Landing page for [Sahaay](https://www.linkedin.com/company/sahaay-sales), the AI sales agent for e-commerce brands.

Plain static site: no build step, no dependencies.

```
index.html        page markup (hero, problem, solution, features, numbers, quotes, pilot form, FAQ, footer)
styles.css        layout and components
script.js         form handling, sticky mobile CTA, scroll reveal; CONFIG at the top
assets/tokens.css brand tokens, copied from Design-system/brand/tokens.css
assets/logo/      SVG logos + favicons, copied from Design-system/brand/logo/
assets/img/       product screenshots (WebP), from Design-system/assets/graphics and brand/screenshots
```

**Look:** layout modelled on the Wispr Flow site (serif headlines, floating nav, rounded colour bands, sticky how-it-works, scattered quote cards, two-pane FAQ, giant footer wordmark), filled with Sahaay's own copy, brand and illustrations. EB Garamond for headlines, Plus Jakarta Sans for everything else; Electric Violet `#6C5FFF` accent on white and Ink `#111126`. The blurred backgrounds (`assets/img/blur-*.webp`) are made from the Velour demo-store product shot.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Serve over HTTP rather than opening the file directly: the footer wordmark is a CSS mask, which browsers block on `file://`.

## Before launch

Set these at the top of `script.js`:

| Key | What |
|---|---|
| `formEndpoint` | URL the pilot form POSTs to (`store`, `email` as form data), e.g. Formspree |
| `contactEmail` | Fallback: with no endpoint, the form opens a pre-filled email to this address |
| `bookingUrl` | Calendly / Cal.com link; every "Book a demo" link uses it |

Also in `index.html`:
- **Founder quote** (section `#voices`): draft copy. Replace with the founder's own words and add their name.
- `og:image`: point at an absolute URL once the domain is live.

## Brand source

Design tokens, logos and copy come from the Sahaay design system repo (`DESIGN-SYSTEM.md`, `brand/`, `emails/`). Keep `assets/tokens.css` in sync with `brand/tokens.css`.
