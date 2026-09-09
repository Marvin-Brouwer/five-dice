import { component } from '@rooted/components'
import { Markdown } from '@rooted/markdown'

import { partOneFields, partTwoFields } from '../game/logic/fields.ts'
import type { DiceTuple, DieValue } from '../game/logic/gameConstants.ts'
import { createScorePadStore } from '../game/logic/scorePadStore.mts'
import { createScorePad } from '../game/logic/score/scorePad.ts'
import { discard, score } from '../game/logic/score/score.ts'
import { createRowRegistry } from '../game/score-card/row-registry.mts'
import { ScoreSection } from '../game/score-card/score-section.mts'
import { createSelectionStore } from '../game/score-card/selection-store.mts'
import { DiceKeypad } from '../game/score-input/dice-keypad.mts'
import { createDiceStore } from '../game/score-input/dice-state.mts'
import { StartGameButton } from '../game/start-game-button.mts'
import { ContentCard } from '../_layout/content-card.mts'
import { Icon } from '../_shared/icon/icon.mts'
import { localization } from '../_shared/i18n/localization.mts'
import { MenuRow } from '../_shared/menu/menu-row.mts'
import { StickerButton } from '../_shared/sticker/sticker-button.mts'

import { examplePad } from './how-to-play.examples.ts'
import { RollingExampleTable } from './rolling-example-table.mts'
import styles from './how-to-play.css'

import refreshIcon from '../_shared/menu/menu-content.refresh.svg?raw'
import undoIcon from '../_shared/menu/menu-content.undo.svg?raw'

/**
 * Class names here are `guide-` prefixed on purpose. A component's stylesheet
 * is scoped to its host's *subtree*, so a bare `.row` or `.sheet` in here
 * would also restyle the score sections, menu rows and paper card mounted
 * inside this page.
 */
export const HowToPlay = component({
	name: 'how-to-play-page',
	styles,
	async onMount({ append, element, create, signal }) {

		// Prose lives in translated markdown, one file per section so the
		// figures below can sit with the paragraph they illustrate.
		const prose = await localization.branch({
			en: async () => ({
				intro: await import('./how-to-play-intro.en.md'),
				discard: await import('./how-to-play-discard.en.md'),
				flush: await import('./how-to-play-flush.en.md'),
				undo: await import('./how-to-play-undo.en.md'),
				ending: await import('./how-to-play-ending.en.md'),
			}),
			nl: async () => ({
				intro: await import('./how-to-play-intro.nl.md'),
				discard: await import('./how-to-play-discard.nl.md'),
				flush: await import('./how-to-play-flush.nl.md'),
				undo: await import('./how-to-play-undo.nl.md'),
				ending: await import('./how-to-play-ending.nl.md'),
			}),
		})

		/** Prose from markdown, padded in from the card's ruled edge. */
		function proseBlock(source: unknown): Node {
			return element('div', {
				classes: styles.guideProse,
				children: create(Markdown, {
					source: source as never
				}),
			})
		}

		/**
		 * A real piece of the app, shown rather than described. Illustrations
		 * only: `inert` keeps their controls out of the tab order and
		 * aria-hidden keeps them out of the accessibility tree, so the caption
		 * is what gets read.
		 */
		function figure(caption: string, subject: Node): Node {
			return element('div', {
				classes: styles.guideFigures,
				children: element('figure', {
					classes: styles.guideFigure,
					children: [
						element('div', {
						classes: styles.guideFigureSubject,
							inert: true,
							aria: {
								hidden: 'true'
							},
							children: subject,
						}),
						element('figcaption', {
							classes: styles.guideFigureCaption,
							textContent: caption,
						}),
					],
				}),
			})
		}

		const table = create(RollingExampleTable)

		// A keypad of its own, so the guide can show the real thing without
		// reaching into a game in progress. Nothing reads this store back.
		// One real section of the card with its only row given up on, so the
		// slash across it is the card's own rather than a drawing of one.
		const discarded = createScorePadStore()
		discarded.update(state => {
			state.pad = {
				...createScorePad(),
				chance: discard(),
			}
		})

		const keypadState = createDiceStore()

		append(
			create(ContentCard, {
				children: element('div', {
					classes: styles.guide,
					children: [
						proseBlock(prose.intro),
						element('div', {
							classes: styles.guideFigures,
							children: [
								element('figure', {
									classes: styles.guideFigure,
									children: [
										element('div', {
											classes: [styles.guideFigureSubject, styles.guideFigureBadge],
											inert: true,
											aria: {
												hidden: 'true'
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
												hidden: 'true'
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

						element('section', {
							classes: styles.guideExample,
							aria: {
								label: localization.text`Example rolls and scores`
							},
							children: table,
						}),

						proseBlock(prose.discard),
						// Boxed like the keypad is: the illustration wrapper stays, and
						// the ruled card frame sits inside it.
						figure(localization.text`A discarded row`,
							element('div', {
								classes: styles.guideFigureCard,
								children: create(ScoreSection, {
									store: discarded,
									selection: createSelectionStore(),
									rows: createRowRegistry(),
									title: localization.text`Part two`,
									fields: ['chance'],
									withDieIcon: false,
								}),
							})
						),

						proseBlock(prose.flush),

						proseBlock(prose.undo),
						figure(localization.text`From the menu, any time`,
							create(MenuRow, {
								label: localization.text`Undo last turn`,
								hint: localization.text`Revert the last committed score`,
								control: create(Icon, {
									source: undoIcon,
								}),
							})
						),

						proseBlock(prose.ending),
						figure(localization.text`Ready for the next one`,
							create(MenuRow, {
								label: localization.text`New game`,
								hint: localization.text`Reset the score pad`,
								control: create(Icon, {
									source: refreshIcon,
								}),
							})
						),

						// Closes the instructions before the call to action, the way
						// the card's bands close a section. Empty on purpose: it is a
						// rule, not a heading, so it carries its meaning as a label.
						element('hr', {
							classes: styles.guideEnd,
							aria: {
								label: localization.text`End of the instructions`
							},
						}),

						element('p', {
							classes: styles.guideActions,
							children: create(StartGameButton),
						}),
					],
				}),
			})
		)
	},
})
