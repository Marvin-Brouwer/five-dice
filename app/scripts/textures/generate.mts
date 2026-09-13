/**
 * Regenerates the tiling textures under src/_shared/textures.
 *
 *   pnpm generate:textures                      both
 *   pnpm generate:textures:paper                the paper meshes
 *   pnpm generate:textures:noise                the page grain
 *
 *   --count <n>     how many paper meshes exist (default: what's on disk, else 5)
 *   --variant <n>   regenerate only this mesh   (repeatable)
 *   --seed <n>      run seed                    (default: random — always printed)
 *   --dry-run       report the writes without making them
 *
 * Only the paper varies per device, so only the paper has variants. The grain
 * is one file: a different `feTurbulence` seed gives a different grain, not a
 * different-looking one, so there was nothing for a player to notice. `--count`
 * and `--variant` are paper-only; the noise just takes `--seed` if you want to
 * re-roll its grain.
 *
 * Each mesh draws from its own stream, so `--variant 3 --seed 1234` always
 * gives the same one no matter what else is regenerated alongside it. Note the
 * seed this prints if you want a mesh back: the files carry no provenance of
 * their own, on purpose — they are art, and art doesn't need a banner.
 *
 * Mesh 0 is a fixed preset, the hand-drawn original, and ignores --seed. It is
 * not a default: until a device picks, the card is a plain sheet.
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

const paperPattern = /^paper-texture-(\d+)\.svg$/

function paperFile(variant: number) {
	return join(texturesDir, `paper-texture-${variant}.svg`)
}

const noiseFile = join(texturesDir, 'page-noise.svg')

/**
 * Highest mesh index on disk, plus one — not a file count, so a gap left by a
 * deleted file doesn't silently renumber the meshes after it.
 */
function countOnDisk(): number {
	if (!existsSync(texturesDir)) return 0
	let highest = -1
	for (const name of readdirSync(texturesDir)) {
		const match = paperPattern.exec(name)
		if (match) highest = Math.max(highest, Number(match[1]))
	}
	return highest + 1
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

/**
 * One file, and by default the same one: seed 0 is the SVG default, so this
 * reproduces the grain the app has always had. Pass --seed to re-roll it.
 */
function generateNoise(seed: number | undefined, dryRun: boolean): void {
	const noiseSeed = seed === undefined ? 0 : createNoiseSeed(createRandom(seed))
	writeIfChanged(noiseFile, renderNoiseTexture(noiseSeed), dryRun)
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
	const seed = parseInteger(values.seed, 'seed')
	const countArg = parseInteger(values.count, 'count')
	if (countArg === 0) throw new Error('--count must be at least 1')

	if (selected.includes('paper')) {
		const count = countArg ?? (countOnDisk() || defaultCount)
		const requested = values.variant?.map((value) => parseInteger(value, 'variant')!)
			?? Array.from({ length: count }, (_, index) => index)

		// Printed rather than recorded: the files carry no provenance, so this
		// line is the only way back to a mesh you liked.
		const paperSeed = seed ?? Math.floor(Math.random() * 0xFFFFFFFF)
		console.log(`paper seed ${paperSeed}${dryRun ? ' (dry run)' : ''}`)

		for (const variant of requested) {
			if (variant >= count) {
				throw new Error(`--variant ${variant} is outside the ${count} paper meshes`)
			}
			generatePaper(variant, paperSeed, dryRun)
		}

		// Meshes past the count are no longer globbed by the component. Left in
		// place rather than deleted — removing art is the user's call.
		const orphans = readdirSync(texturesDir).filter((name) => {
			const match = paperPattern.exec(name)
			return match !== null && Number(match[1]) >= count
		})
		if (orphans.length) {
			console.warn(`\nunreferenced, delete by hand if you meant to drop them:\n  ${orphans.join('\n  ')}`)
		}
	}

	// --seed is for the meshes. Regenerating everything with a noted seed must
	// not quietly change the page grain too, so the noise re-rolls only when you
	// asked for the noise by name.
	if (selected.includes('noise')) generateNoise(values.kind === 'noise' ? seed : undefined, dryRun)

	console.log(`${written.length} written${written.length ? `: ${written.join(', ')}` : ''}`)
	if (unchanged.length) console.log(`${unchanged.length} unchanged`)
}

main()
