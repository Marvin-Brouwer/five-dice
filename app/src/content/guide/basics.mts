import { component } from '@rooted/components'

import { DiceKeypad } from '../../game/score-input/dice-keypad.mts'
import { createDiceStore } from '../../game/score-input/dice-state.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import { StickerButton } from '../../_shared/sticker/sticker-button.mts'

import { proseBlock } from './parts.mts'
import styles from '../how-to-play.css'

/** How a turn is entered: the sticker that opens the keypad, and the keypad. */
export const GuideBasics = component({
	name: 'guide-basics',
	styles,
	async onMount({ append, element, create }) {
		const prose = await localization.branch({
			en: () => import('./intro.en.md'),
			nl: () => import('./intro.nl.md'),
		})

		// A keypad of its own, so the guide can show the real thing without
		// reaching into a game in progress. Nothing reads this store back.
		const keypadState = createDiceStore()

		append(
			proseBlock({ element, create }, prose),
			element('div', {
				classes: styles.guideFigures,
				children: [
					element('figure', {
						classes: styles.guideFigure,
						children: [
							element('div', {
								classes: [
									styles.guideFigureSubject,
									styles.guideFigureBadge,
								],
								inert: true,
								aria: {
									hidden: 'true',
								},
								children: create(StickerButton, {
									label: localization.text`Enter\nscore`,
								}),
							}),
							element('figcaption', {
								classes: styles.guideFigureCaption,
								textContent: localization.text`Tap this to enter a roll`,
							}),
						],
					}),
					element('figure', {
						classes: styles.guideFigure,
						children: [
							element('div', {
								classes: styles.guideFigureSubject,
								inert: true,
								aria: {
									hidden: 'true',
								},
								// Boxed to its natural width: the keypad's buttons grow to
								// fill their row, which is right in the modal and sparse
								// here, so the wrapper hugs them instead of stretching.
								children: element('div', {
									classes: styles.guideKeypad,
									children: create(DiceKeypad, {
										state: keypadState,
									}),
								}),
							}),
							element('figcaption', {
								classes: styles.guideFigureCaption,
								textContent: localization.text`Then key in the dice you rolled`,
							}),
						],
					}),
				],
			}),
		)
	},
})
