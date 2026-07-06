import type { EventBuilder } from '@rooted/elements/events'

export type DropdownController = {
	/** True when the list is currently open. */
	readonly isOpen: () => boolean
	/** Open the list; rebuilds the options and positions it. */
	open(): void
	/** Close the list. */
	close(): void
	/** Toggle open/close. */
	toggle(): void
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
	/** The list element. Managed here — `hidden`, position and children. */
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

/**
 * Wire up a dropdown/listbox around an existing button + list pair.
 * Handles open/close state, aria-expanded, outside-click and resize
 * re-positioning, and flips the list downward when the default upward
 * open would clip past the top of the viewport.
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

	list.hidden = true
	button.setAttribute('aria-expanded', 'false')

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
			list.style.right = ''
			list.style.top = ''
			list.style.bottom = ''
			return
		}
		list.hidden = false
		list.replaceChildren(...buildOptions())
		position()
	}

	function setOpen(next: boolean) {
		if (open === next) return
		open = next
		button.setAttribute('aria-expanded', String(open))
		render()
	}

	button.addEventListener('click', (event) => {
		event.stopPropagation()
		setOpen(!open)
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

	return {
		isOpen: () => open,
		open: () => setOpen(true),
		close: () => setOpen(false),
		toggle: () => setOpen(!open),
		refresh: () => { if (open) render() },
	}
}
