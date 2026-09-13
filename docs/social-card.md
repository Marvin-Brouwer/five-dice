# The social card

`app/public/og-card.png` is what a link to this app looks like when someone
pastes it into a chat, a timeline or a slide. The doormat has an **Invite your
friends** button, so links here are actively passed around, and the card is the
first thing anyone sees of the app.

It is the masthead, stacked: a sheet of paper with a mesh behind it, ruled just
inside its edge, and the black band laid across it with the five dice tossed
over its top edge above the wordmark.

It carries no sentence, on purpose. One image serves `/en/` and `/nl/` both, so
a line of copy would be an English card everywhere it was shared. The wordmark
stays — it is a name, and the app does not translate it either.

## 1200 × 630, and why the icon would not do

The fallback, when `seo.defaultOgImage` is unset, is `pwa-512x512.png` — an app
icon. A square image still makes a valid preview, but every platform renders it
as a small thumbnail beside the text rather than as the wide banner it gives a
1.91:1 image. Nothing is broken by a square card; it is just a smaller one.

Two tags have to agree for the wide card to appear:

- `og:image`, injected per page by `@rooted/seo` from `defaultOgImage` in
  `app/src/seo.mts`. **It has to be absolute.** The tag is injected verbatim
  into pages several directories deep, so a relative path resolves against
  whichever page the scraper happened to read.
- `twitter:card=summary_large_image`, written once in `app/index.html`. It is
  the only tag that controls a card's *format*, and X reads it from the
  `twitter:` namespace alone — everything else it takes from `og:`. It and a
  wide image go together: a large-image toggle with a square image asks for a
  banner and gets letterboxing, and a wide image without the toggle is shown
  small.

`og:image:width` / `og:image:height` sit beside it, so a scraper can lay the
card out before it has fetched the image.

`public/share.png` used to sit next to these — a 300 × 300 leftover from the
Astro app that nothing referenced, smaller and squarer than the fallback it
would have replaced. It is gone.

## Regenerating

```sh
pnpm generate:social-card
```

Rerun it when the palette, the wordmark or the masthead changes. The PNG is
committed, so nobody needs to run it to build the app, and the build does not
run it.

`app/scripts/social-card/card.mts` is the design: a page, in the app's own CSS.
`generate.mts` is a screenshot of that page — Chromium takes it, because the
card is real CSS (the tokens, the paper mesh, the mono wordmark) and a browser
is the only thing that renders that faithfully. Passing `--html <path>` writes
the page out to open yourself.

Two things are deliberately not restated in the script:

- **The colours and faces** come from `app/index.tokens.css`, read at generate
  time. A palette change reaches the card by regenerating it.
- **The dice** come from `src/_shared/die/pip-geometry.ts`, which `PipDie`
  draws from too. A Node script cannot import a component, and pip positions
  copied into one would drift the first time a pip moved.

The wordmark's face is fetched from Google Fonts — the same one `index.html`
loads — and inlined into the page before the shot, so this is the one script
here that wants a network connection. Inlining it is also what makes the shot
reproducible: the page has nothing left to load, so it cannot race a face that
is still arriving.

If Playwright has no browser it can download (a sandbox with a pinned
Chromium), point `PLAYWRIGHT_CHROMIUM_PATH` at one — the same escape hatch
`playwright.config.mts` offers the e2e suite.

## Tests

`app/tests/socialCard/` checks the shape of the committed PNG, that the card
still tosses the masthead's roll, that it takes its colours from the tokens,
that the only words on it are still the wordmark, and that the tags describing
it match the image they describe.

It does not check whether the card looks good. That is a judgement call, and a
screenshot test of it would fail on a font-rendering difference rather than on
a mistake.
