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

## It is a hand-kept file

Unlike the paper textures, the card has no generator. It was drawn once, as a
screenshot of a page built from the app's own tokens, and then the machinery
was thrown away: a share card changes when the brand changes, which is to say
about never, and a build step nobody runs is a build step that rots.

So if it does need redrawing, redraw it — by hand, in a browser, or however
suits — rather than looking for a script. What it is made of:

- **The paper** is `--background-surface` with `src/_shared/textures/paper-texture-0.svg`
  behind it, filled from `--paper-shade-0..2`, and a 2px `--color-text` rule
  inset 19px.
- **The band** is `--color-divider-strong`, 1000 × 220, centred, with the
  dice hanging 16px over its top edge — the same overhang the masthead gives
  them beside the wordmark.
- **The dice** are the masthead's roll, 5 1 3 6 2, at the masthead's tilts
  (−8°, 5°, −3°, 9°, −6°), drawn like `PipDie` draws them.
- **The wordmark** is `--font-mono` 700 at 74px, `0.14em` letter-spacing,
  uppercase, in `--color-surface`.

## Tests

`app/tests/socialCard/` checks the shape of the committed PNG and that the tags
describing it still match the image they describe — swap in a card of another
size and the suite says so rather than shipping a preview that lays itself out
wrong.

It does not check whether the card looks good. That is a judgement call, and a
screenshot test of it would fail on a font-rendering difference rather than on
a mistake.
