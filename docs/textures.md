# Textures

The page's cardboard grain and the paper card's low-poly sheet are tiling SVGs
under `app/src/_shared/textures/`. There are five variants of each, and a device
picks one of each on first visit — the score pad gets passed around a table, and
two players holding their phones side by side should not be looking at the same
sheet.

Paper and noise are drawn independently, so five of each is 25 combinations.
That matters more than it sounds: with four players at a table, five variants
would collide about 80% of the time, 25 about 22%.

## How a device gets its variant

`app/src/_shared/services/texture-variant.mts` picks a number per kind on first
visit, stores it under `texture-paper` / `texture-noise`, and writes
`data-paper` / `data-noise` onto `<html>`. `textures.g.css` turns those
attributes into `--texture-paper`, `--texture-paper-dark` and `--texture-noise`,
which `index.tokens.css` and `index.theme.css` compose into
`--background-page` / `--background-surface`.

What is stored is the chosen variant — a number under five — not a random id or
a timestamp. A fifth of everyone who opens the app has the same value, so it
cannot single out a device, which keeps it a style preference alongside `theme`
rather than something that needs consenting to.

`:root` carries variant 0, so the page renders the original texture before the
service runs and if scripting is off. A stored value that no longer names a real
variant is re-drawn rather than left to fall through to that default — otherwise
shrinking the variant count would pile every affected device onto variant 0.

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
printed and written into each file's header, so a variant you like can be made
again. Regenerate one until you like it, then keep it:

```
pnpm generate:textures:paper --variant 3          # prints e.g. "seed 40213"
pnpm generate:textures:paper --variant 3 --seed 40213   # that one, again
```

Adding a sixth mesh is `--count 6`: the SVGs, `textures.g.css` and the counts in
`textures.g.mts` are all written together, so the runtime can't drift from how
many files exist. Dropping back to five leaves the sixth on disk and warns —
deleting art is your call, not the script's.

Variant 0 of both kinds is a fixed preset, not a draw, and ignores `--seed`. It
reproduces the original hand-drawn files exactly, which is also what makes it
safe as the pre-boot default.

## What the generator has to respect

**The paper tile is 200x100 and repeats**, which constrains the geometry:

- The four corners are pinned.
- The top and bottom edges are split at the same x, the left and right edges at
  the same y. Only the two interior points and those two splits actually move.
- **Facets facing each other across opposite edges carry the same shade.** Six
  of the ten shades are drawn freely and four are derived from them. Skip this
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

**Both are XML.** An SVG comment containing `--` makes the file unparseable and
the browser paints nothing at all, with no error anywhere — so the header avoids
it, the generator refuses to write a file that breaks the rule, and
`tests/textures/generatedSvg.test.ts` checks every committed file. This cost a
debugging session once; it renders fine in every check that inspects the CSS
rather than the pixels.

## Tests

`app/tests/textures/` covers the mesh invariants (seam pairing, shared splits,
shade balance, no collapsed facet, determinism), the noise markup, the variant
picker, and the committed SVGs themselves. The one thing it cannot check is
whether a given mesh looks good — that is why the variants are art-directed
files rather than generated at runtime.

Note that no `toHaveScreenshot` tests exist today. When they are added, the
fixture has to seed both `localStorage` keys or the per-device variant will make
them flaky.
