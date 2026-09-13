/**
 * The markup the social card is a screenshot of.
 *
 * Kept apart from the browser work in generate.mts so the card can be asserted
 * on without launching Chromium, and so the thing that decides what the card
 * looks like is a page you can open in a browser rather than a canvas API.
 *
 * It is the app's own look, stacked: a sheet of paper with the mesh behind it,
 * ruled just inside its edge, and the masthead band laid across it with the
 * dice tossed over its top edge above the wordmark. Nothing here invents a
 * colour or a font — the tokens are read off index.tokens.css, so a palette
 * change reaches the card by regenerating it.
 *
 * No sentence anywhere on it, on purpose: one image serves every locale, and
 * the wordmark is a name rather than something to translate.
 */

import {
	dieFrame, dieViewBox, pipCells, pipCoordinates, pipRadius,
} from '../../src/_shared/die/pip-geometry.ts'
import type { DieValue } from '../../src/game/logic/gameConstants.ts'

/** The size every scraper crops against: 1.91:1, the Open Graph norm. */
export const cardWidth = 1200
export const cardHeight = 630

/**
 * The same roll and the same tilts the masthead tosses — see
 * `src/_shared/masthead/masthead.mts` and its stylesheet. A roll that reads as
 * one rather than as a sorted set, landing slightly askew.
 */
const heroRoll: Array<{ value: DieValue, tilt: number }> = [
	{ value: 5, tilt: -8 },
	{ value: 1, tilt: 5 },
	{ value: 3, tilt: -3 },
	{ value: 6, tilt: 9 },
	{ value: 2, tilt: -6 },
]

export type SocialCardAssets = {
	/** Contents of index.tokens.css — the card's colours and fonts come from it. */
	tokensCss: string
	/** One paper mesh from src/_shared/textures, inlined so its facets see the cascade. */
	paperTexture0: string
	/** Self-contained `@font-face` rules for the face the wordmark is set in. */
	fontsCss: string
}

/** One die face, drawn from the same geometry `PipDie` draws from. */
function dieMarkup({ value, tilt }: { value: DieValue, tilt: number }): string {
	const frame = Object.entries(dieFrame).map(([name, size]) => `${name}="${size}"`).join(' ')
	const pips = pipCells[value]
		.map((cell) => pipCoordinates[cell]!)
		.map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="${pipRadius}" fill="var(--color-die-dot)"/>`)
		.join('')

	return `<span class="die" style="--tilt: ${tilt}deg">`
		+ `<svg viewBox="${dieViewBox}" xmlns="http://www.w3.org/2000/svg">`
		+ `<rect ${frame} fill="var(--color-die-face)" stroke="var(--color-die-border)" stroke-width="1.5"/>`
		+ pips
		+ '</svg></span>'
}

export function socialCardHtml(assets: SocialCardAssets): string {
	const { tokensCss, paperTexture0, fontsCss } = assets

	return `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<style>
${fontsCss}
		</style>
		<style>
${tokensCss}
		</style>
		<style>
			html, body {
				margin: 0;
				width: ${cardWidth}px;
				height: ${cardHeight}px;
			}

			/* The card is a sheet of paper and nothing else — no cardboard
			   around it. Values from _shared/paper-card/paper-card.css, which
			   is also where the isolate comes from: without it the mesh's
			   negative z-index paints behind the sheet's own background and
			   the paper comes out blank.

			   It centres the band rather than the band offsetting itself: a
			   top margin on the only child in flow collapses straight out of
			   the sheet and moves the paper down the card instead. */
			.sheet {
				position: relative;
				isolation: isolate;
				display: flex;
				align-items: center;
				justify-content: center;
				width: 100%;
				height: 100%;
				background: var(--background-surface);
			}

			.texture {
				position: absolute;
				inset: 0;
				z-index: -1;
			}

			.texture svg {
				display: block;
				width: 100%;
				height: 100%;
			}

			/* The ink rule, ruled just inside the paper's edge. Thin on
			   purpose: it is a pen line on a pad, and the sheet is what the
			   eye should land on. */
			.rule {
				position: absolute;
				inset: 19px;
				border: 2px solid var(--color-text);
			}

			/* The masthead band, laid across the sheet rather than reaching
			   its edges, with an even margin of paper all the way round. The
			   dice hang over its top edge, so the band is centred and the
			   ink on it sits a touch high — that is the toss, not a
			   mismeasured box. */
			.masthead {
				width: 1000px;
				height: 220px;
				flex: none;
				background: var(--color-divider-strong);
				color: var(--color-surface);
				display: flex;
				flex-direction: column;
				align-items: center;
			}

			.dice {
				display: flex;
				/* Tossed onto the band, so they land over its top edge rather
				   than inside it — the same negative margin the masthead uses
				   to hang them off the band beside the wordmark. */
				margin-top: -16px;
			}

			/* Close enough that the tilted corners overlap: five dice thrown
			   together, not five dice laid out in a row. */
			.die + .die {
				margin-left: -6px;
			}

			.die {
				width: 105px;
				height: 105px;
				transform: rotate(var(--tilt));
			}

			.die svg {
				display: block;
				width: 100%;
				height: 100%;
			}

			/* Set like the masthead's wordmark: spaced mono caps. The trailing
			   letter-spacing is trimmed off so the caps stay optically centred. */
			.wordmark {
				margin: 26px -0.14em 0 0;
				font-family: var(--font-mono);
				font-size: 74px;
				font-weight: 700;
				letter-spacing: 0.14em;
				text-transform: uppercase;
				line-height: 1;
			}
		</style>
	</head>

	<body>
		<div class="sheet">
			<span class="texture">${paperTexture0}</span>
			<div class="rule"></div>
			<header class="masthead">
				<div class="dice">${heroRoll.map(dieMarkup).join('')}</div>
				<h1 class="wordmark">Five dice</h1>
			</header>
		</div>
	</body>
</html>
`
}
