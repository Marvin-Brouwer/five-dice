import { component } from '@rooted/components'

import { partOneFields, partTwoFields } from '../game/logic/fields.ts'
import type { DiceTuple, DieValue } from '../game/logic/gameConstants.ts'
import { createScorePadStore } from '../game/logic/scorePadStore.mts'
import { score } from '../game/logic/score/score.ts'
import { createRowRegistry } from '../game/score-card/row-registry.mts'
import { ScoreSection } from '../game/score-card/score-section.mts'
import { createSelectionStore } from '../game/score-card/selection-store.mts'
import { localization } from '../_shared/i18n/localization.mts'
import { StickerButton } from '../_shared/sticker/sticker-button.mts'

import { examplePad } from './how-to-play.examples.ts'
import styles from './rolling-example-table.css'

const scrambleTicks = 8
const tickMilliseconds = 70

function reducedMotion(): boolean {
	return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

function randomRoll(): DiceTuple {
	return Array.from({ length: 5 }, () => (1 + Math.floor(Math.random() * 6)) as DieValue) as DiceTuple
}

/**
 * The real score card, filled in and tumbling: same rows, same sorting and
 * dimming of the dice that don't count, same score column.
 *
 * Its own stores, so nothing here can touch a game in progress.
 */
export const RollingExampleTable = component({
	name: 'rolling-example-table',
	styles,
	onMount({ replace, element, create, signal }) {
		const demo = createScorePadStore()
		const selection = createSelectionStore()
		const rows = createRowRegistry()

		let timer: number | undefined
		function stop() {
			if (timer !== undefined) clearInterval(timer)
			timer = undefined
		}

		function show(pad: ReturnType<typeof examplePad>) {
			demo.update(state => {
				state.pad = pad
			})
		}

		/** Mid-tumble faces. Not valid rolls — they are never shown at rest. */
		function scrambledPad(): ReturnType<typeof examplePad> {
			const pad = examplePad()
			for (const field of [...partOneFields, ...partTwoFields]) {
				if (field === 'flush') pad.flush = [score(randomRoll())]
				else pad[field] = score(randomRoll())
			}
			return pad
		}

		/** Random faces for a beat, then a roll each row would really accept. */
		function reroll() {
			stop()
			if (reducedMotion()) {
				show(examplePad())
				return
			}
			let tick = 0
			timer = window.setInterval(() => {
				tick++
				if (tick >= scrambleTicks) {
					stop()
					show(examplePad())
					return
				}
				show(scrambledPad())
			}, tickMilliseconds)
		}

		show(examplePad())
		signal.addEventListener('abort', stop)

		const table = element('div', {
			classes: styles.guideTable,
			children: [
				create(ScoreSection, {
					store: demo,
					selection,
					rows,
					title: localization.text`Part one`,
					fields: partOneFields,
					withDieIcon: true,
				}),
				create(ScoreSection, {
					store: demo,
					selection,
					rows,
					title: localization.text`Part two`,
					fields: partTwoFields,
					withDieIcon: false,
				}),
				create(StickerButton, {
					label: localization.text`Roll\nagain`,
					ariaLabel: localization.text`Roll again`,
					classes: styles.guideRollAgain,
					on: {
						click: reroll,
					},
				}),
			],
		})

		// Nothing scrolled past should have finished tumbling before it was
		// seen, so the first roll waits until the table is actually on screen.
		if (reducedMotion() || typeof IntersectionObserver === 'undefined') {
			reroll()
		} else {
			const observer = new IntersectionObserver(entries => {
				if (!entries.some(entry => entry.isIntersecting)) return
				observer.disconnect()
				reroll()
			}, { rootMargin: '0px 0px -10% 0px' })
			observer.observe(table)
			signal.addEventListener('abort', () => observer.disconnect())
		}

		replace(table)
	},
})
