/**
 * Regenerates the tiling textures under src/_shared/textures.
 *
 *   pnpm generate:textures                      both kinds, every variant
 *   pnpm generate:textures:paper                paper only
 *   pnpm generate:textures:noise                noise only
 *
 *   --count <n>     how many variants exist   (default: what's on disk, else 5)
 *   --variant <n>   regenerate only this one  (repeatable)
 *   --seed <n>      run seed                  (default: random — always printed)
 *   --dry-run       report the writes without making them
 *
 * Each variant draws from its own stream, so `--variant 3 --seed 1234` always
 * gives the same mesh no matter what else is regenerated alongside it. Note the
 * seed this prints if you want a mesh back: the files carry no provenance of
 * their own, on purpose — they are art, and art doesn't need a banner.
 *
 * Variant 0 of both kinds is a fixed preset — the hand-drawn original — and
 * ignores --seed. Neither kind is a default, though: until a device picks, the
 * card is a plain sheet and the page is its plain colour.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import { createNoiseSeed, renderNoiseTexture } from './noise.mts'
import { createPaperMesh, originalPaperMesh, renderPaperTexture } from './paper.mts'
import { createRandom, variantSeed } from './random.mts'

type Kind = 'paper' | 'noise'

const kinds: Kind[] = ['paper', 'noise']
const defaultCount = 5
const texturesDir = fileURLToPath(new URL('../../src/_shared/textures/', import.meta.url))

const filePattern: Record<Kind, RegExp> = {
	paper: /^paper-texture-(\d+)\.svg$/,
	noise: /^page-noise-(\d+)\.svg$/,
}

function paperFile(variant: number) {
	return join(texturesDir, `paper-texture-${variant}.svg`)
}

function noiseFile(variant: number) {
	return join(texturesDir, `page-noise-${variant}.svg`)
}

/**
 * Highest variant index on disk, plus one — not a file count, so a gap left by
 * a deleted file doesn't silently renumber the variants after it.
 */
function countOnDisk(kind: Kind): number {
	if (!existsSync(texturesDir)) return 0
	let highest = -1
	for (const name of readdirSync(texturesDir)) {
		const match = filePattern[kind].exec(name)
		if (match) highest = Math.max(highest, Number(match[1]))
	}
	return highest + 1
}

/**
 * Only the .mts and .css files carry this. The SVGs get nothing: they are art,
 * and a banner on a ten-line drawing is noise. Checked in on purpose either
 * way — the script is for when a mesh wants replacing or a variant adding, and
 * it only ever rewrites the variants you ask it for.
 */
const moduleHeader = [
	'/**',
	' * Written by scripts/textures/generate.mts, and checked in.',
	' *',
	' * Not build output: regenerating a variant is something you do on purpose,',
	' * and it overwrites that variant alone. See docs/textures.md.',
	' */',
].join('\n')

function renderCss(noiseCount: number): string {
	const lines = [
		moduleHeader,
		'',
		'/* The page grain only. The paper is a component (paper-texture.mts), because',
		'   its facets are themed with custom properties and an SVG behind url() can',
		'   never see them. The noise needs no such thing: it is translucent, so the',
		'   page colour below it does the theming.',
		'',
		'   No variant until _shared/services/texture-variant.mts picks one: before',
		'   that the page is its plain colour, the same way an unpicked card is a',
		'   plain sheet. `none` rather than nothing, because an undefined custom',
		'   property would make --background-page invalid and take the page colour',
		'   down with it. */',
		':root {',
		'\t--texture-noise:      none;',
		'}',
	]

	for (let variant = 0; variant < noiseCount; variant++) {
		lines.push(
			'',
			`:root[data-noise="${variant}"] {`,
			`\t--texture-noise:      url("./page-noise-${variant}.svg");`,
			'}',
		)
	}

	return `${lines.join('\n')}\n`
}

function renderModule(noiseCount: number): string {
	return [
		moduleHeader,
		'',
		`export const noiseVariantCount = ${noiseCount}`,
		'',
	].join('\n')
}

/**
 * The paper meshes, as loaders rather than imports. A device draws exactly one,
 * so the other four have no business in the bundle it parses at startup — and
 * the markup has to be inlined rather than referenced, because the facets are
 * filled with custom properties that only resolve inside the document.
 *
 * The paper variant count is this array's length: one source of truth rather
 * than a number that can drift from the files on disk.
 */
function renderPaperModule(paperCount: number): string {
	const variants = Array.from({ length: paperCount }, (_, variant) => variant)
	return [
		moduleHeader,
		'',
		'export const paperTextures = [',
		...variants.map((variant) =>
			`\t() => import('./paper-texture-${variant}.svg?raw'),`),
		']',
		'',
	].join('\n')
}

const written: string[] = []
const unchanged: string[] = []

/**
 * An SVG is parsed as XML, so a comment containing "--" makes the whole file
 * unparseable and the browser paints nothing at all — with no error anywhere.
 * Cheap to check here, invisible until someone looks at the rendered page.
 */
function assertWellFormedSvg(path: string, markup: string): void {
	const comments = markup.match(/<!--[\s\S]*?-->/g) ?? []
	for (const comment of comments) {
		if (comment.slice(4, -3).includes('--')) {
			throw new Error(`${basename(path)}: XML comments cannot contain "--"\n  ${comment}`)
		}
	}
}

function writeIfChanged(path: string, content: string, dryRun: boolean): void {
	if (path.endsWith('.svg')) assertWellFormedSvg(path, content)

	const existing = existsSync(path) ? readFileSync(path, 'utf8') : undefined
	if (existing === content) {
		unchanged.push(basename(path))
		return
	}
	if (!dryRun) writeFileSync(path, content, 'utf8')
	written.push(basename(path))
}

function generatePaper(variant: number, seed: number, dryRun: boolean): void {
	const mesh = variant === 0
		? originalPaperMesh
		: createPaperMesh(createRandom(variantSeed(seed, 'paper', variant)))
	// One file per variant, whatever the theme: the facets are filled with
	// custom properties, so the ambient-light sensor flipping mid-game recolours
	// the paper without it rearranging itself.
	writeIfChanged(paperFile(variant), renderPaperTexture(mesh), dryRun)
}

function generateNoise(variant: number, seed: number, dryRun: boolean): void {
	const noiseSeed = variant === 0
		? 0
		: createNoiseSeed(createRandom(variantSeed(seed, 'noise', variant)))
	writeIfChanged(noiseFile(variant), renderNoiseTexture(noiseSeed), dryRun)
}

function parseInteger(value: string | undefined, name: string): number | undefined {
	if (value === undefined) return undefined
	const parsed = Number(value)
	if (!Number.isInteger(parsed) || parsed < 0) {
		throw new Error(`--${name} expects a non-negative integer, got "${value}"`)
	}
	return parsed
}

function main(): void {
	const { values } = parseArgs({
		options: {
			kind: { type: 'string' },
			count: { type: 'string' },
			variant: { type: 'string', multiple: true },
			seed: { type: 'string' },
			'dry-run': { type: 'boolean', default: false },
		},
	})

	if (values.kind !== undefined && !kinds.includes(values.kind as Kind)) {
		throw new Error(`--kind expects ${kinds.join(' or ')}, got "${values.kind}"`)
	}

	const selected = values.kind === undefined ? kinds : [values.kind as Kind]
	const dryRun = values['dry-run'] === true
	const seed = parseInteger(values.seed, 'seed') ?? Math.floor(Math.random() * 0xFFFFFFFF)
	const countArg = parseInteger(values.count, 'count')
	if (countArg === 0) throw new Error('--count must be at least 1')

	const counts: Record<Kind, number> = {
		paper: countOnDisk('paper') || defaultCount,
		noise: countOnDisk('noise') || defaultCount,
	}
	for (const kind of selected) {
		if (countArg !== undefined) counts[kind] = countArg
	}

	const requested = values.variant?.map((value) => parseInteger(value, 'variant')!)

	console.log(`seed ${seed}${dryRun ? ' (dry run)' : ''}`)

	for (const kind of selected) {
		const variants = requested ?? Array.from({ length: counts[kind] }, (_, index) => index)
		for (const variant of variants) {
			if (variant >= counts[kind]) {
				throw new Error(`--variant ${variant} is outside the ${counts[kind]} ${kind} variants`)
			}
			if (kind === 'paper') generatePaper(variant, seed, dryRun)
			else generateNoise(variant, seed, dryRun)
		}
	}

	writeIfChanged(join(texturesDir, 'page-noise.css'), renderCss(counts.noise), dryRun)
	writeIfChanged(join(texturesDir, 'page-noise.mts'), renderModule(counts.noise), dryRun)
	writeIfChanged(join(texturesDir, 'paper-textures.mts'), renderPaperModule(counts.paper), dryRun)

	console.log(`${written.length} written${written.length ? `: ${written.join(', ')}` : ''}`)
	if (unchanged.length) console.log(`${unchanged.length} unchanged`)

	// Files above the variant count are no longer referenced by the generated
	// CSS. Left in place rather than deleted — removing art is the user's call.
	const orphans = kinds.flatMap((kind) => readdirSync(texturesDir)
		.filter((name) => {
			const match = filePattern[kind].exec(name)
			return match !== null && Number(match[1]) >= counts[kind]
		}))

	if (orphans.length) {
		console.warn(`\nunreferenced, delete by hand if you meant to drop them:\n  ${orphans.join('\n  ')}`)
	}
}

main()
