/**
 * The markup the social card is a screenshot of.
 *
 * Kept apart from the browser work in generate.mts so the card can be asserted
 * on without launching Chromium, and so the thing that decides what the card
 * looks like is a page you can open in a browser rather than a canvas API.
 *
 * It is the app's own look, stacked: cardboard page, a sheet of paper with the
 * mesh behind it, the masthead band with the dice tossed above the wordmark,
 * and the tagline written on the paper below the rule. Nothing here invents a
 * colour or a font — the tokens are read off index.tokens.css, so a palette
 * change reaches the card by regenerating it.
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

/**
 * The line the web manifest describes the app with — see `webManifest.description`
 * in vite.config.mts. Deliberately not localized: `og:image` is one image for
 * every locale, and the wordmark above it isn't translated either.
 */
const tagline = 'Grab five dice and see how far your luck stretches.'

export type SocialCardAssets = {
	/** Contents of index.tokens.css — the card's colours and fonts come from it. */
	tokensCss: string
	/** One paper mesh from src/_shared/textures, inlined so its facets see the cascade. */
	paperTexture0: string
	/** The cardboard grain, as a data URI: the only form a CSS `url()` can carry here. */
	pageNoiseTexture: string
	/** Self-contained `@font-face` rules for the two faces the card is set in. */
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
	const { tokensCss, paperTexture0, pageNoiseTexture, fontsCss } = assets

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
			/* The page is painted in a document of its own rather than by
			   loading the app, so the two backgrounds it composes are restated
			   here: the grain as a data URI, because the stylesheet's relative
			   url() has no document to be relative to. */
			:root {
				--background-page: url("${pageNoiseTexture}"), var(--color-page);
			}

			html, body {
				margin: 0;
				width: ${cardWidth}px;
				height: ${cardHeight}px;
			}

			/* The cardboard the pad is laid on. */
			.page {
				box-sizing: border-box;
				width: 100%;
				height: 100%;
				padding: 44px;
				background: var(--background-page);
				background-size: var(--background-page-size);
			}

			/* A sheet of the same paper, in landscape — values from
			   _shared/paper-card/paper-card.css. */
			.sheet {
				--sheet-gutter: 10px;
				box-sizing: border-box;
				position: relative;
				isolation: isolate;
				width: 100%;
				height: 100%;
				padding: var(--sheet-gutter);
				background: var(--background-surface);
				box-shadow: 0 12px 32px rgba(28, 29, 31, 0.15);
				display: flex;
				flex-direction: column;
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

			/* The masthead, stacked: at this size the dice have room to sit
			   above the wordmark instead of beside it. */
			.masthead {
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 24px;
				padding: 44px 40px 46px;
				margin-bottom: var(--sheet-gutter);
				background: var(--color-divider-strong);
				color: var(--color-surface);
			}

			.dice {
				display: flex;
				gap: 16px;
			}

			.die {
				width: 92px;
				height: 92px;
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
				margin: 0 -0.14em 0 0;
				font-family: var(--font-mono);
				font-size: 84px;
				font-weight: 700;
				letter-spacing: 0.14em;
				text-transform: uppercase;
				line-height: 1;
			}

			/* The ruled frame, with the tagline written inside it in the same
			   hand the score card is filled in with. */
			.frame {
				flex: 1;
				display: flex;
				align-items: center;
				justify-content: center;
				outline: 2px solid var(--color-text);
				outline-offset: -2px;
			}

			.tagline {
				margin: 0;
				max-width: 20ch;
				font-family: var(--font-hand);
				font-size: 54px;
				font-weight: 500;
				line-height: 1.2;
				text-align: center;
				color: var(--color-accent);
			}
		</style>
	</head>

	<body>
		<div class="page">
			<div class="sheet">
				<span class="texture">${paperTexture0}</span>
				<header class="masthead">
					<div class="dice">${heroRoll.map(dieMarkup).join('')}</div>
					<h1 class="wordmark">Five dice</h1>
				</header>
				<div class="frame">
					<p class="tagline">${tagline}</p>
				</div>
			</div>
		</div>
	</body>
</html>
`
}
