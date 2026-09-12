# Textures

The page's cardboard grain and the paper card's low-poly sheet are tiling SVGs
under `app/src/_shared/textures/`. There are five variants of each, and a device
picks one of each on first visit — the score pad gets passed around a table, and
two players holding their phones side by side should not be looking at the same
sheet.

Paper and noise are drawn independently, so five of each is 25 combinations.
That matters more than it sounds: with four players at a table, five variants
would collide about 80% of the time, 25 about 22%.

## Two textures, two mechanisms

**The paper is a component**, and its meshes load on demand — a device draws
one, so the other four stay out of the bundle it parses before first paint. They
are found with `import.meta.glob`, so there is no list to maintain: a sixth mesh
is a sixth file in the directory. Its facets are filled with
`var(--paper-shade-*)`, so one mesh serves every theme — the dark theme swaps
three tokens and the geometry never moves. That only works because the markup is inlined into the
document: an SVG loaded through CSS `url()` renders in *secure static mode*, an
isolated document with no access to the page's cascade, and would paint those
fills black. `Icon` relies on the same thing for `currentColor`.

**The noise stays a CSS background.** It doesn't need any of this: it is
translucent, so the page colour below shows through and the theme only has to
change that colour. That is also why it never needed a dark counterpart while
the paper needed one per variant.

The paper couldn't have used the noise's trick, incidentally. A neutral wash can
reproduce the dark palette almost exactly (per-channel alpha spread 0.006–0.056)
but not the light one (0.62–0.82), because light-mode facets are cool-hued over
a warm surface and no amount of black or white gets you there.

## How a device gets its variant

`app/src/_shared/services/texture-variant.mts` picks a number per kind on first
visit and stores it under `texture-paper` / `texture-noise`. The paper variant
is exported and handed to `PaperTexture` by `PaperCard`; the noise variant is
written to `<html data-noise>`, which `page-noise.css` turns into
`--texture-noise` for `--background-page`.

What is stored is the chosen variant — a number under five — not a random id or
a timestamp. A fifth of everyone who opens the app has the same value, so it
cannot single out a device, which keeps it a style preference alongside `theme`
rather than something that needs consenting to.

Neither kind has a default variant. `PaperTexture` draws nothing when the
variant is missing or names a mesh that doesn't exist, and `--texture-noise` is
`none` until `data-noise` is set — so before a device picks, the card is a plain
sheet and the page is its plain colour. Defaulting either to variant 0 would
quietly crowd every such device onto one look, which is the opposite of the
point.

`none` rather than leaving `--texture-noise` undefined, though: an undefined
custom property makes `--background-page` invalid at computed-value time, which
takes the page *colour* down with it and leaves the page transparent.

A stored value that no longer names a real variant is re-drawn rather than left
to fall through — otherwise shrinking the variant count would pile every
affected device onto the default.

The mesh is a `<pattern>` painted through a full-size `<rect>`, not bare
polygons. The polygons are one 200x100 tile and the sheet is sized by its
content, so something has to repeat them — and inline SVG has no equivalent of
`background-repeat`. `<pattern>` is that something.

The pattern id is fixed rather than per-instance. Two cards drawing the same
mesh do emit the same id, but each carries its own copy of the pattern and SVG
id references resolve live: remove one card and the other keeps painting from
its own. Checked in a browser rather than assumed.

One more thing worth knowing if you move the texture: it is positioned at
`z-index: -1`, which paints above its stacking context's background and below
the content in it. `.sheet` does **not** establish that stacking context on its
own — `container-type` was not enough in Chromium, and the texture disappeared
behind the sheet's own background colour. `isolation: isolate` on `.sheet` is
what makes it work.

## Regenerating

```
pnpm generate:textures                    # both kinds, every variant
pnpm generate:textures:paper
pnpm generate:textures:noise

  --count <n>      how many variants exist   (default: what's on disk, else 5)
  --variant <n>    regenerate only this one  (repeatable)
  --seed <n>       run seed                  (default: random — always printed)
  --dry-run        report the writes without making them
```

Each variant draws from its own stream, so `--variant 3 --seed 1234` always
gives the same mesh no matter what else is regenerated beside it. The seed is
printed — note it down if you like what came out, because the files carry no
provenance of their own. Regenerate one until you like it, then keep it:

```
pnpm generate:textures:paper --variant 3          # prints e.g. "seed 40213"
pnpm generate:textures:paper --variant 3 --seed 40213   # that one, again
```

Adding a sixth mesh is `--count 6`. For the paper that is all of it: the
component globs the directory, so the file *is* the registration. For the noise
the script also rewrites `page-noise.css` and the count in `page-noise.mts`,
which have to agree with the files. Dropping back to five leaves the sixth on
disk and warns — deleting art is your call, not the script's.

Keep the paper files numbered without gaps. The stored variant indexes the
sorted glob, not the filename, so deleting `paper-texture-1.svg` shifts everyone
above it onto a different mesh. `generatedSvg.test.ts` checks this.

Note what these files are **not**: build output. They carry no `.g.` suffix, no
"DO NOT EDIT" banner, and nothing regenerates them on `pnpm build`. They are
checked-in art, and the script is the tool you reach for when a mesh wants
replacing or a variant adding — the opposite of `src/_routes.g.mts`, which is
gitignored and rebuilt by a Vite plugin every time. Editing a texture by hand is
fine; just know that regenerating that variant overwrites it.

Variant 0 of both kinds is a fixed preset, not a draw, and ignores `--seed`. Its
geometry is the original hand-drawn mesh — the look this app shipped with before
any of this existed, kept so it stays in the rotation.

## What the generator has to respect

**The paper tile is 200x100 and repeats**, which constrains the geometry:

- The four corners are pinned.
- The top and bottom edges are split at the same x, the left and right edges at
  the same y. Only the two interior points and those two splits actually move.
- **Facets facing each other across opposite edges carry the same shade.** Six
  of the ten shades are drawn freely and four are derived from them. "Shade"
  means one of `--paper-shade-0/1/2`, not a colour — the generator picks which
  token a facet gets and the theme decides what it looks like. Skip this
  and the repeat shows up as a dead-straight colour change running the full
  width or height of the tile, every 200px — the one artefact that makes a
  tiling texture look like a tiling texture.
- Every shade covers at least two of the ten facets, or the sheet comes out
  flat. Requiring merely that all three appear is not enough; it lets through
  meshes where eight facets share one shade.

**The noise tile is 200x200** and is genuinely procedural — `feTurbulence` takes
a `seed`, and `stitchTiles="stitch"` keeps the field tiling for any of them.
Only the seed varies; `baseFrequency`, `numOctaves` and the opacity stay put so
every variant reads as the same material. Be aware the variants are only weakly
distinguishable by eye: a different seed gives a different grain, not a
different-looking grain.

**Both are XML.** The files carry no comments, but if you add one: `--` inside
an XML comment makes the whole file unparseable and the browser paints nothing
at all, with no error anywhere. The generator refuses to write a file that
breaks the rule and `tests/textures/generatedSvg.test.ts` checks every committed
file. This cost a debugging session once; it renders fine in every check that
inspects the CSS rather than the pixels.

## Tests

`app/tests/textures/` covers the mesh invariants (seam pairing, shared splits,
shade balance, no collapsed facet, determinism), the noise markup, the variant
picker, and the committed SVGs themselves.

`textureVariant.test.ts` is the one file that runs on happy-dom rather than
node, via a `@vitest-environment` docblock: it reaches the component for the
mesh count, and `component()` injects its stylesheet at module load, which needs
a document. Scoped to that file so the rest of the suite stays on plain node.

The one thing the suite cannot check is whether a given mesh looks good — that
is why the variants are art-directed files rather than generated at runtime.

Note that no `toHaveScreenshot` tests exist today. When they are added, the
fixture has to seed both `localStorage` keys or the per-device variant will make
them flaky.
