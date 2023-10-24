import { Accessor, Component, Signal, createMemo, JSX, createSignal } from 'solid-js'
import type { ScoreField, DieValue } from '../../game/gameConstants'
import './scoreInput.selectorButtons.css'
import type { ScoreInputState } from './scoreInput.state'
import { discard, score } from '../../game/score/score'
import { RollDisplay } from '../scoreCard/scoreCard.rollDisplay'
import { SingleScoreDisplay } from '../scoreCard/scoreCard.scoreDisplay'
import type { ScorePadAccessor } from '../../game/score/useScorePad'
import { useKeyboardContext } from '../../context/keyboardContext'

type Props = {
	validFields: Accessor<Array<ScoreField>>
	discardFields: Accessor<Array<ScoreField>>
	inputState: ScoreInputState,
	getScorePad: ScorePadAccessor
	selectedField: Signal<ScoreField | undefined>
	previousButton: Accessor<HTMLButtonElement | undefined>
	nextButton: Accessor<HTMLButtonElement | undefined>
	selectableRows: Accessor<Array<[element: HTMLTableRowElement, field: ScoreField]>>
	firstInputRef: Signal<HTMLLabelElement | undefined>
}


export const SelectorButtons: Component<Props> = ({
	validFields, discardFields, inputState, selectedField, selectableRows, getScorePad,
	previousButton, nextButton, firstInputRef
}) => {

	const keyboardContext = useKeyboardContext()
	const [getFirstInputRef, setFirstInputRef] = firstInputRef
	const [getSectionRef, setSectionRef] = createSignal<HTMLDivElement>()
	const [getSelectedField, setSelectedField] = selectedField

	const rowSelectors = createMemo(() => {
		const scoreValue = !inputState.diceSelector.getAllDiceSet()
			? discard()
			: score(inputState.diceSelector.getScore() as [DieValue, DieValue, DieValue, DieValue, DieValue])

		return selectableRows()
			.filter(([,field]) => validFields().includes(field) || discardFields().includes(field))
			.map(([item, field], index) => {
				const bounds = item.getBoundingClientRect()
				const position: JSX.CSSProperties = {
					left: `${bounds.x}px`,
					top: `${bounds.y}px`,
					width: `${bounds.width -1}px`,
					height: `${bounds.height}px`
				}

				const isDiscard = discardFields().includes(field)

				const displayScore = () => isDiscard ? discard() : scoreValue
				const classList = {
					'row-selector': true,
					'discard': isDiscard,
					'selected': getSelectedField() === field
				}

				const checkFocus = index !== 0 ? () => {} : (e: FocusEvent) => {

					if (getFirstInputRef() !== undefined) return true
					if (keyboardContext.isKeyboardUser()) return true;

					(e.currentTarget as HTMLElement).blur()
					return false
				}

				return (
					<label style={position}  classList={classList} tabIndex={index}
						onKeyDown={handleKeyEvent}
						onFocus={checkFocus}>
						<input
							type='radio' checked={getSelectedField() === field} data-field={field}
							onChange={(e) => e.currentTarget.checked && setSelectedField(field) && e.currentTarget.focus()}
							onKeyDown={handleKeyEvent}
							onFocus={e => {
								if (!checkFocus(e)) return
								e.currentTarget.parentElement?.focus()
							}} />
						<RollDisplay field={field} score={displayScore} />
						<SingleScoreDisplay field={field} score={displayScore()} scorePad={getScorePad} />
					</label>
				)
			})},
	[selectableRows(), validFields(), discardFields(), inputState.diceSelector.getScore()]
	)

	const handleKeyEvent = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			return true
		}

		const handled = () => {
			e.preventDefault()
			e.stopImmediatePropagation()
			e.stopPropagation()
			return false
		}

		if (e.key === 'Tab') {
			if (e.shiftKey) {
				previousButton()?.focus()
			} else {
				nextButton()?.focus()
			}
			return handled()
		}

		if (e.shiftKey && !Number.isInteger(e.key))  return true
		let selectedIndex = document.activeElement === undefined
			? selectableRows().findIndex(([, field]) => field === getSelectedField())
			: Number(document.activeElement?.getAttribute('tabindex') ?? -1)
		if (selectedIndex < 0) selectableRows().findIndex(([, field]) => field === getSelectedField())
		if (selectedIndex < 0) selectedIndex = 0
		const lastIndex = selectableRows().length -1

		if (e.key === 'ArrowUp' || (e.shiftKey && e.key === 'Tab')) {
			if (selectedIndex === 0) selectedIndex = lastIndex
			else selectedIndex --
		}
		if (e.key === 'ArrowDown' || e.key === 'Tab') {
			if (selectedIndex === lastIndex) selectedIndex = 0
			else selectedIndex ++
		}

		const inputs = getSectionRef()?.querySelectorAll('label') ?? []
		let input = inputs[selectedIndex] as HTMLLabelElement | undefined
		if (input) setFirstInputRef(input)

		if (e.key === ' ') {
			input?.focus()
			input?.click()

			// Reselect because of rerender that happens when appending .selected
			input = getSectionRef()?.querySelector<HTMLLabelElement>(`label[tabindex="${input?.tabIndex}"]`) ?? undefined
			setFirstInputRef(input)

			return handled()
		}
		if (e.key === 'Enter'){
			input?.click()
			nextButton()?.focus()
			return handled()
		}

		input?.focus()

		return handled()
	}

	return (
		<section role="menu" class="selector-buttons" ref={setSectionRef} onKeyDown={handleKeyEvent}>
			{rowSelectors()}
		</section>
	)
}