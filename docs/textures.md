# Textures

The page's cardboard grain and the paper card's low-poly sheet are tiling SVGs
under `app/src/_shared/textures/`. The paper comes in five meshes and a device
picks one on first visit — the score pad gets passed around a table, and two
players holding their phones side by side should not be looking at the same
sheet. The grain is one file for everyone.

Five meshes and four players means a pair between them more often than not.
The grain used to vary too, which on paper made 25 combinations — but nobody
could tell two grains apart, so those combinations were arithmetic rather than
anything a player would see. One file says so honestly.

## Two textures, two mechanisms

**The paper is a component**, and its meshes load on demand — a device draws
one, so the other four stay out of the bundle it parses before first paint. They
are found with `import.meta.glob`, so there is no list to maintain: a sixth mesh
is a sixth file in the directory. Its facets are filled with
`var(--paper-shade-*)`, so one mesh serves every theme — the dark theme swaps
three tokens and the geometry never moves. That only works because the markup is
inlined into the document: an SVG loaded through CSS `url()` renders in *secure
static mode*, an isolated document with no access to the page's cascade, and
would paint those fills black. `Icon` relies on the same thing for `currentColor`.

**The noise is a plain CSS background**, hand-kept, one file. It needs none of
this: it is translucent, so the page colour below shows through and the theme
only has to change that colour. That is why it never needed a dark counterpart
while the paper needed one per variant, why it needs no component, and why it
has nothing to generate — `feTurbulence` with three numbers in it is easier to
edit than to script.

The paper couldn't have used the noise's trick, incidentally. A neutral wash can
reproduce the dark palette almost exactly (per-channel alpha spread 0.006–0.056)
but not the light one (0.62–0.82), because light-mode facets are cool-hued over
a warm surface and no amount of black or white gets you there.

## How a device gets its variant

`PaperTexture` picks a mesh on first visit and stores it under `texture-paper`.
Picking, persisting and drawing all live in that one component — `PaperCard`
just renders it, with nothing to pass. The grain is a fixed `url()` in
`index.tokens.css` and involves no JavaScript at all.

What is stored is the chosen mesh — a number under five — not a random id or a
timestamp. A fifth of everyone who opens the app has the same value, so it
cannot single out a device, which keeps it a style preference alongside `theme`
rather than something that needs consenting to.

There is no default mesh. `PaperTexture` draws nothing when the variant is
missing or names a mesh that doesn't exist, so a device that hasn't picked gets
a plain sheet. Defaulting to mesh 0 would quietly crowd every such device onto
one look, which is the opposite of the point. A stored value that no longer
names a real mesh is re-drawn rather than left to fall through, so dropping a
mesh doesn't leave those devices blank.

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
pnpm generate:textures

  --count <n>      how many meshes exist     (default: what's on disk, else 5)
  --variant <n>    regenerate only this mesh (repeatable)
  --seed <n>       run seed                  (default: random — always printed)
  --dry-run        report the writes without making them
```

Only the paper is generated. The grain is a single hand-kept file, so there is
nothing to script for it — change `baseFrequency`, `numOctaves` or the opacity
in `page-noise.svg` directly.

Each variant draws from its own stream, so `--variant 3 --seed 1234` always
gives the same mesh no matter what else is regenerated beside it. The seed is
printed — note it down if you like what came out, because the files carry no
provenance of their own. Regenerate one until you like it, then keep it:

```
pnpm generate:textures --variant 3               # prints e.g. "seed 40213"
pnpm generate:textures --variant 3 --seed 40213  # that one, again
```

Adding a sixth mesh is `--count 6`, and that is all of it: the component globs
the directory, so the file *is* the registration. Dropping back to five leaves
the sixth on disk and warns — deleting art is your call, not the script's.

Keep the paper files numbered without gaps. The stored variant indexes the
sorted glob, not the filename, so deleting `paper-texture-1.svg` shifts everyone
above it onto a different mesh. `generatedSvg.test.ts` checks this.

Note what these files are **not**: build output. They carry no `.g.` suffix, no
"DO NOT EDIT" banner, and nothing regenerates them on `pnpm build`. They are
checked-in art, and the script is the tool you reach for when a mesh wants
replacing or a variant adding — the opposite of `src/_routes.g.mts`, which is
gitignored and rebuilt by a Vite plugin every time. Editing a texture by hand is
fine; just know that regenerating that variant overwrites it.

Mesh 0 is a fixed preset, not a draw, and ignores `--seed`. Its geometry is the
original hand-drawn mesh — the look this app shipped with before any of this
existed, kept so it stays in the rotation.

## What the textures have to respect

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

**The noise tile is 200x200**, and `stitchTiles="stitch"` is what keeps the
field tiling — leave it on if you edit it.

It carries no `seed`. The default of 0 is the only one it has ever used, so
writing it out said nothing. Nor does it vary per device: a different seed gives
a different grain, not a different-*looking* grain, and nobody could tell two
apart. `baseFrequency`, `numOctaves` and the opacity are the knobs that actually
change how it reads.

**Both are XML.** The files carry no comments, but if you add one: `--` inside
an XML comment makes the whole file unparseable and the browser paints nothing
at all, with no error anywhere. The generator refuses to write a file that
breaks the rule and `tests/textures/generatedSvg.test.ts` checks every committed
file. This cost a debugging session once; it renders fine in every check that
inspects the CSS rather than the pixels.

## Tests

`app/tests/textures/` covers the mesh invariants (seam pairing, shared splits,
shade balance, no collapsed facet, determinism), the mesh picker, and the
committed SVGs themselves — including that the grain is still one file and the
meshes are still numbered without gaps.

`paperTexture.test.ts` is the one file that runs on happy-dom rather than node,
via a `@vitest-environment` docblock: it imports the component, and
`component()` injects its stylesheet at module load, which needs a document.
Scoped to that file so the rest of the suite stays on plain node.

The one thing the suite cannot check is whether a given mesh looks good — that
is why the variants are art-directed files rather than generated at runtime.

Note that no `toHaveScreenshot` tests exist today. When they are added, the
fixture has to set `texture-paper` or the per-device mesh will make them flaky.
