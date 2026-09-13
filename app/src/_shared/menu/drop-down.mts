import { component, cssClass, optional } from '@rooted/components'
import type { ElementChild } from '@rooted/elements'

import { Icon } from '../icon/icon.mts'

import { attachDropdown } from './dropdown-controller.mts'
import chevronIcon from './dropdown-chevron.svg?raw'
import checkIcon from './drop-down.check.svg?raw'
import styles from './drop-down.css'

export type DropDownItem = {
	/**
	 * The row's name in plain text, for type-ahead.
	 *
	 * Not read off the row's own text: that runs the label into whatever else
	 * the caller puts in there -- "SystemFollow device setting", "ENEnglish".
	 */
	label: string
	/** Marks the row selected and gives it the check. */
	selected: boolean
	/** Greys the row out and swallows its click. */
	disabled?: boolean
	/** The row's content, minus the check the dropdown appends itself. */
	content: Array<ElementChild>
	onSelect(): void
}

export type DropDownApi = {
	/** Close the list. */
	close(): void
	/** Re-read `trigger`, `triggerLabel` and `items`, and repaint. */
	refresh(): void
	/** Disable the trigger, for a pick that will not come back. */
	disableTrigger(): void
	/** Put focus on the trigger, for a caller that rebuilt around one. */
	focusTrigger(): void
}

export type DropDownOptions = {
	/** Names the control — "Language", "Theme". Labels the listbox. */
	label: string
	/**
	 * The trigger's accessible name, naming the control and its current value.
	 *
	 * Composed by the caller rather than from `label` here, so it goes through
	 * `localization.text` and a locale can order or punctuate it its own way.
	 */
	triggerLabel: () => string
	/**
	 * The trigger's content, minus the chevron the dropdown appends. Re-read on
	 * `refresh()`, so a caller whose trigger changes with the value does not
	 * have to hold on to its own nodes.
	 */
	trigger: () => Array<ElementChild>
	items: () => Array<DropDownItem>
	reference?: (api: DropDownApi) => void
}

/**
 * The listbox dropdown behind the language and theme choosers.
 *
 * Owns the trigger, the list and the option rows — the ARIA contract and the
 * markup both choosers were repeating. Open/close, outside-click dismissal,
 * positioning and the whole keyboard contract live a layer down in
 * `attachDropdown`: arrows, Home/End, Enter/Space, Escape and type-ahead over
 * a listbox that holds focus itself and names its active row with
 * `aria-activedescendant`.
 */
export const DropDown = component<DropDownOptions>({
	name: 'drop-down',
	styles,
	onMount({ append, element, create, signal, on, options }) {
		const { label, triggerLabel, trigger, items } = options

		const buttonContent = element('span', {
			classes: styles.buttonContent,
			children: trigger(),
		})

		const button = element('button', {
			type: 'button',
			classes: styles.button,
			aria: {
				hasPopup: 'listbox',
				label: triggerLabel(),
			},
			children: [
				buttonContent,
				element('span', {
					classes: styles.chevron,
					children: create(Icon, {
						source: chevronIcon,
					}),
				}),
			],
		})

		const list = element('div', {
			role: 'listbox',
			aria: {
				label,
			},
			classes: styles.list,
		})

		function buildOptions(): Node[] {
			return items().map(item => {
				const option = element('div', {
					role: 'option',
					aria: {
						selected: String(item.selected),
						disabled: item.disabled ? 'true' : undefined!,
					},
					classes: [
						styles.option,
						cssClass(item.selected, styles.optionSelected),
						cssClass(item.disabled === true, styles.optionDisabled),
					],
					on: {
						click(event) {
							event.stopPropagation()
							if (item.disabled) return
							item.onSelect()
						},
					},
					children: [
						...item.content,
						optional(item.selected,
							element('span', {
								classes: styles.optionCheck,
								children: create(Icon, {
									source: checkIcon,
								}),
							})
						),
					],
				})
				option.dataset.label = item.label
				return option
			})
		}

		const dropdown = attachDropdown({
			button,
			list,
			buildOptions,
			signal,
			on,
		})

		append(
			element('div', {
				classes: styles.wrap,
				children: [
					button,
					list,
				],
			}),
		)

		// After the append, not before: an api that can focus the trigger is
		// only worth having once the trigger is on the page.
		options.reference?.({
			close: () => dropdown.close(),
			refresh() {
				buttonContent.replaceChildren(...trigger().filter(child => child !== undefined && child !== null))
				button.setAttribute('aria-label', triggerLabel())
				dropdown.refresh()
			},
			disableTrigger() {
				button.disabled = true
			},
			focusTrigger() {
				button.focus()
			},
		})
	},
})
