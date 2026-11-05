# Sahaay website

Landing page for [Sahaay](https://www.linkedin.com/company/sahaay-sales), the AI sales agent for e-commerce brands, by Rize & Shine.

Plain static site: no build step, no dependencies.

```
index.html        page markup (hero, problem, solution, features, numbers, quotes, pilot form, FAQ, footer)
styles.css        layout and components
script.js         form handling, sticky mobile CTA, scroll reveal; CONFIG at the top
assets/tokens.css brand tokens, copied from Design-system/brand/tokens.css
assets/logo/      SVG logos + favicons, copied from Design-system/brand/logo/
assets/img/       product screenshots (WebP), from Design-system/assets/graphics and brand/screenshots
```

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
