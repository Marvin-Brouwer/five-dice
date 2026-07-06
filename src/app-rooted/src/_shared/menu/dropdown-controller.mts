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

export type NativeOption = {
	value: string
	label: string
	selected?: boolean
	disabled?: boolean
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
	/**
	 * Optional native <select> fallback overlaid on the button. Only picks
	 * up pointer events on coarse-pointer devices (touch), where it opens
	 * the system picker instead of the styled list. On fine-pointer (mouse)
	 * devices it stays out of the way and the styled dropdown handles clicks.
	 */
	nativeSelect?: {
		options: () => NativeOption[]
		onChange: (value: string) => void
		ariaLabel?: string
	}
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
	nativeSelect,
}: DropdownAttachOptions): DropdownController {
	let open = false

	list.hidden = true
	button.setAttribute('aria-expanded', 'false')

	// Optional native <select> overlaid on the button. On coarse-pointer
	// devices its pointer-events are enabled (see styles below); on
	// fine-pointer devices we disable pointer-events so the styled dropdown
	// keeps handling clicks.
	let nativeEl: HTMLSelectElement | undefined
	if (nativeSelect) {
		if (getComputedStyle(button).position === 'static') {
			button.style.position = 'relative'
		}
		nativeEl = document.createElement('select')
		nativeEl.setAttribute('aria-hidden', 'true')
		if (nativeSelect.ariaLabel) nativeEl.setAttribute('aria-label', nativeSelect.ariaLabel)
		Object.assign(nativeEl.style, {
			position: 'absolute',
			inset: '0',
			width: '100%',
			height: '100%',
			opacity: '0',
			border: '0',
			padding: '0',
			margin: '0',
			background: 'transparent',
			appearance: 'none',
			// Off by default; the media query below enables it on touch.
			pointerEvents: 'none',
		} as CSSStyleDeclaration)
		// Coarse pointer → enable native select
		const mql = window.matchMedia('(hover: none) and (pointer: coarse)')
		function syncNativeInteractivity() {
			nativeEl!.style.pointerEvents = mql.matches ? 'auto' : 'none'
		}
		syncNativeInteractivity()
		mql.addEventListener('change', syncNativeInteractivity, { signal })
		nativeEl.addEventListener('change', () => {
			if (nativeEl!.value) nativeSelect.onChange(nativeEl!.value)
		}, { signal })
		button.append(nativeEl)
	}

	function syncNative() {
		if (!nativeEl || !nativeSelect) return
		const options = nativeSelect.options()
		nativeEl.replaceChildren(
			...options.map(({ value, label, selected, disabled }) => {
				const opt = document.createElement('option')
				opt.value = value
				opt.textContent = label
				if (disabled) opt.disabled = true
				if (selected) opt.selected = true
				return opt
			}),
		)
	}

	syncNative()

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
		// If the click originated from the native <select> overlay (touch),
		// let the OS picker handle it and don't open the styled list too.
		if (nativeEl && (event.target === nativeEl || nativeEl.contains(event.target as Node))) return
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
		refresh: () => {
			syncNative()
			if (open) render()
		},
	}
}
