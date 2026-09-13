import type { EventBuilder } from '@rooted/elements/events'

export type DropdownController = {
	/** Close the list. */
	close(): void
	/**
	 * Rebuild the options and reposition. Call after external state changes
	 * that need the list to reflect (e.g. a store update while the list is
	 * open).
	 */
	refresh(): void
}

export type DropdownAttachOptions = {
	/** The trigger button. Click toggles; aria-expanded is kept in sync. */
	button: HTMLButtonElement
	/** The list element. Managed here,  `hidden`, position and children. */
	list: HTMLElement
	/** Called every time the list opens or refreshes; returns the option nodes. */
	buildOptions: () => Node[]
	/** Component lifetime signal (used to unsubscribe from `on()` bindings). */
	signal: AbortSignal
	/** The component context `on` builder for global listeners. */
	on: EventBuilder
	/** Optional gap between the button and the list, in px. Defaults to 6. */
	gap?: number
}

/** How long a type-ahead search survives without another keystroke, in ms. */
const TYPE_AHEAD_TIMEOUT = 500

/**
 * Wire up a dropdown/listbox around an existing button + list pair.
 * Handles open/close state, aria-expanded, outside-click and resize
 * re-positioning, and flips the list downward when the default upward
 * open would clip past the top of the viewport.
 *
 * Also the keyboard: the list itself takes focus while it is open and the
 * active option is named by `aria-activedescendant`, rather than focus
 * roving over the options. That is not a preference — `refresh()` replaces
 * the option nodes wholesale, and the theme chooser refreshes while the list
 * is open, so a DOM-focused option would be thrown away underneath the user.
 * A focused list survives the rebuild with one attribute to re-point.
 */
export function attachDropdown({
	button,
	list,
	buildOptions,
	signal,
	on,
	gap = 6,
}: DropdownAttachOptions): DropdownController {
	let open = false
	/** Index of the active option, or -1 for none. Reset on every close. */
	let active = -1

	const listId = `drop-down-list-${Math.random().toString(36).slice(2, 8)}`

	list.id = listId
	list.hidden = true
	// Focusable, but never in the tab order: focus is put here on open and
	// handed back to the button on close.
	list.tabIndex = -1
	button.setAttribute('aria-expanded', 'false')
	button.setAttribute('aria-controls', listId)

	function optionNodes(): HTMLElement[] {
		return Array.from(list.querySelectorAll<HTMLElement>('[role="option"]'))
	}

	function isDisabled(option: HTMLElement): boolean {
		return option.getAttribute('aria-disabled') === 'true'
	}

	/**
	 * The first selectable option at or after `from`, walking in `step`
	 * direction. -1 when there is none, which is what stops the arrow keys at
	 * the ends rather than wrapping them around.
	 */
	function enabledFrom(from: number, step: 1 | -1): number {
		const options = optionNodes()
		for (let index = from; index >= 0 && index < options.length; index += step) {
			if (!isDisabled(options[index]!)) return index
		}
		return -1
	}

	/** Point `aria-activedescendant` and the `data-active` mark at one option. */
	function setActive(index: number) {
		active = index
		const options = optionNodes()
		options.forEach((option, optionIndex) => {
			if (optionIndex === index) option.dataset.active = 'true'
			else delete option.dataset.active
		})
		const activeOption = options[index]
		if (activeOption) list.setAttribute('aria-activedescendant', activeOption.id)
		else list.removeAttribute('aria-activedescendant')
	}

	/**
	 * Which option is active after a rebuild: the one that was, if it is still
	 * there and still selectable, else the selected one, else the first that
	 * can be chosen.
	 */
	function resolveActive(): number {
		const options = optionNodes()
		if (active >= 0 && active < options.length && !isDisabled(options[active]!)) return active
		const selected = options.findIndex(option =>
			option.getAttribute('aria-selected') === 'true' && !isDisabled(option))
		if (selected !== -1) return selected
		return enabledFrom(0, 1)
	}

	function position() {
		const rect = button.getBoundingClientRect()
		list.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`

		// Default upward; flip to downward if the list would clip past the top.
		list.style.top = ''
		list.style.bottom = ''
		const listHeight = list.offsetHeight
		const spaceAbove = rect.top - 8
		const openUpward = listHeight <= spaceAbove

		if (openUpward) {
			list.style.bottom = `${window.innerHeight - rect.top + gap}px`
		}
		else {
			list.style.top = `${rect.bottom + gap}px`
		}
	}

	function render() {
		if (!open) {
			list.hidden = true
			list.replaceChildren()
			list.removeAttribute('aria-activedescendant')
			list.style.right = ''
			list.style.top = ''
			list.style.bottom = ''
			return
		}
		list.hidden = false
		list.replaceChildren(...buildOptions())
		// The dropdown owns option ids: they exist only to be pointed at.
		optionNodes().forEach((option, index) => { option.id = `${listId}-option-${index}` })
		setActive(resolveActive())
		position()
	}

	/**
	 * Hand focus back to the trigger, because the thing holding it is about to
	 * be hidden.
	 *
	 * Only when focus is still the dropdown's to give: an outside click onto
	 * something focusable has already put it where the user asked for it. A
	 * click onto nothing leaves it on the body, and that is ours — the list
	 * was holding it a moment ago.
	 *
	 * This runs for pointer closes too, and costs them nothing: a programmatic
	 * focus following a click does not match `:focus-visible`, so no ring
	 * appears where a mouse user would not expect one.
	 */
	function restoreFocus() {
		const focused = document.activeElement
		const ours = focused === null
			|| focused === document.body
			|| focused === button
			|| focused === list
			|| list.contains(focused)
		if (!ours) return
		if (!button.isConnected || button.disabled) return
		button.focus({ preventScroll: true })
	}

	function setOpen(next: boolean) {
		if (open === next) return
		open = next
		button.setAttribute('aria-expanded', String(open))
		if (!open) {
			// Before `render()` hides the list out from under the focus it holds.
			restoreFocus()
			active = -1
		}
		render()
		if (open) list.focus({ preventScroll: true })
	}

	let typed = ''
	let typedTimer: ReturnType<typeof setTimeout> | undefined

	/**
	 * Jump to the next option whose label starts with what was typed.
	 *
	 * A buffer of one character repeated collapses back to that character, so
	 * tapping the same key cycles between the options sharing an initial
	 * rather than searching for a string nothing can match.
	 */
	function typeAhead(event: KeyboardEvent) {
		if (event.key.length !== 1) return
		event.preventDefault()

		typed += event.key.toLowerCase()
		if (typed.length > 1 && [...typed].every(character => character === typed[0])) {
			typed = typed[0]!
		}
		clearTimeout(typedTimer)
		typedTimer = setTimeout(() => { typed = '' }, TYPE_AHEAD_TIMEOUT)

		const options = optionNodes()
		// Start past the active option, so a repeated letter walks forward
		// instead of sticking on the first match. A longer buffer is still
		// refining one word, so that one starts where it is.
		const from = typed.length === 1 ? active + 1 : active
		for (let step = 0; step < options.length; step++) {
			const index = (from + step + options.length) % options.length
			const option = options[index]!
			if (isDisabled(option)) continue
			if (option.dataset.label?.toLowerCase().startsWith(typed)) {
				setActive(index)
				return
			}
		}
	}

	button.addEventListener('click', (event) => {
		event.stopPropagation()
		setOpen(!open)
	}, { signal })

	// Enter and Space already open the list — they click the button. The
	// arrows are the ones the platform does not give a button.
	button.addEventListener('keydown', (event) => {
		if (open) return
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
		event.preventDefault()
		setOpen(true)
		setActive(event.key === 'ArrowDown'
			? enabledFrom(0, 1)
			: enabledFrom(optionNodes().length - 1, -1))
	}, { signal })

	list.addEventListener('keydown', (event) => {
		if (!open) return
		if (event.altKey || event.ctrlKey || event.metaKey) return

		/** Arrows, Home and End all scroll the page if they are left alone. */
		function moveTo(index: number) {
			event.preventDefault()
			if (index !== -1) setActive(index)
		}

		switch (event.key) {
			case 'ArrowDown':
				moveTo(enabledFrom(active + 1, 1))
				break
			case 'ArrowUp':
				moveTo(enabledFrom(active - 1, -1))
				break
			case 'Home':
				moveTo(enabledFrom(0, 1))
				break
			case 'End':
				moveTo(enabledFrom(optionNodes().length - 1, -1))
				break
			case 'Enter':
			case ' ':
				event.preventDefault()
				// Through the option's own click handler, which already knows
				// to swallow a disabled row and to call back with the pick.
				optionNodes()[active]?.click()
				break
			case 'Escape':
				// The menu is a modal `<dialog>`, and dismissing it is this
				// event's default action — so this preventDefault is what
				// leaves the sheet standing behind a closing list.
				event.preventDefault()
				setOpen(false)
				break
			case 'Tab':
				// Left to the browser. `focusout` closes the list behind it.
				break
			default:
				typeAhead(event)
		}
	}, { signal })

	// Covers Tab and Shift+Tab in one, rather than guessing where either lands.
	list.addEventListener('focusout', (event) => {
		if (!open) return
		const next = event.relatedTarget as Node | null
		if (next && (button.contains(next) || list.contains(next))) return
		setOpen(false)
	}, { signal })

	on('document', 'click', (event) => {
		if (!open) return
		const target = event.target as Node | null
		if (target && (button.contains(target) || list.contains(target))) return
		setOpen(false)
	})

	on('window', 'resize', () => {
		if (open) position()
	})

	signal.addEventListener('abort', () => clearTimeout(typedTimer), { once: true })

	// Opening is the button's own business, handled by the click and keydown
	// listeners above, so there is no `open` or `toggle` here and nothing has
	// needed to ask whether the list is open.
	return {
		close: () => setOpen(false),
		refresh: () => {
			if (open) render()
		},
	}
}
