import type { ScoreField } from '../logic/gameConstants.ts'
import type { RowRegistry } from '../score-card/row-registry.mts'

export type RowTargetPositioner = {
	/** Hand over the labels to place. Replaces the previous set. */
	setLabels(labels: HTMLLabelElement[]): void
	/** Re-measure every label against the row it covers. */
	reposition(): void
	/** Start watching for the page to stop moving, and re-measure until it does. */
	trackSettle(): void
	/** Stop the settle loop and forget the labels. */
	stop(): void
}

export type RowTargetPositionerOptions = {
	rows: RowRegistry
	/** False once the overlay is closing, which ends the settle loop. */
	isShown: () => boolean
}

/**
 * Keeps the picker's invisible hit targets sitting exactly over their rows.
 *
 * The labels are positioned rather than laid out, so anything that moves the
 * score card — a row changing height as a preview lands, a scroll, a resize —
 * leaves them stale, covering the wrong row.
 */
export function createRowTargetPositioner({ rows, isShown }: RowTargetPositionerOptions): RowTargetPositioner {
	let labels: HTMLLabelElement[] = []
	let settleFrame: number | undefined

	function reposition() {
		labels.forEach((label) => {
			const field = label.dataset.field as ScoreField | undefined
			if (!field) return
			const rect = rows.rect(field)
			if (rect === undefined) {
				label.style.display = 'none'
				return
			}
			label.style.display = ''
			label.style.left = `${rect.left}px`
			label.style.top = `${rect.top}px`
			label.style.width = `${rect.width}px`
			label.style.height = `${rect.height}px`
		})
	}

	/**
	 * Keep re-measuring until the page stops moving under the overlay.
	 *
	 * The keypad scrolls the rows the picker will offer into view with a
	 * *smooth* scroll -- and hands the scroll back the same way once the
	 * wizard ends -- so the picker can open while the page is still
	 * travelling and take its measurements mid-flight. A hit target left
	 * at a stale offset covers the wrong row, and a pick then reacts on a
	 * row the player did not touch while the one they did touch stays
	 * empty.
	 *
	 * The window `scroll` listener already covers this wherever it fires
	 * for every frame of a smooth scroll; this covers the frames where it
	 * does not. Self-terminating: a few still frames, or a second and a
	 * half, whichever comes first.
	 */
	function trackSettle() {
		const deadline = performance.now() + 1500
		let previous = window.scrollY
		let stillFrames = 0

		function step() {
			settleFrame = undefined
			if (!isShown()) return
			reposition()
			stillFrames = window.scrollY === previous ? stillFrames + 1 : 0
			previous = window.scrollY
			if (stillFrames >= 3 || performance.now() > deadline) return
			settleFrame = requestAnimationFrame(step)
		}

		settleFrame = requestAnimationFrame(step)
	}

	return {
		setLabels(next) {
			labels = next
		},
		reposition,
		trackSettle,
		stop() {
			if (settleFrame !== undefined) cancelAnimationFrame(settleFrame)
			settleFrame = undefined
			labels = []
		},
	}
}
