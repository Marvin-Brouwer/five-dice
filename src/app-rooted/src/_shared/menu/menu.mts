import { component } from '@rooted/components'
import { href } from '@rooted/router'

import { menuStore } from '../stores/menuStore.mts'
import { screenLockStore } from '../stores/screenLockStore.mts'

import { LanguageChooser } from './language-chooser.mts'
import { MenuRow } from './menu-row.mts'
import { MenuSection } from './menu-section.mts'
import { OnOffSegment } from './on-off-segment.mts'
import { ThemeChooser } from './theme-chooser.mts'

import styles from './menu.css'

const chevron = `
	<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M9 6l6 6-6 6"/>
	</svg>
`

const refresh = `
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M3 12a9 9 0 1 0 3-6.7"/>
		<path d="M3 4v5h5"/>
	</svg>
`

const undo = `
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M9 14l-4-4 4-4M5 10h9a5 5 0 010 10h-2"/>
	</svg>
`

const closeIcon = `
	<svg width="13" height="11" viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M9 4L3 10l6 6M3 10h13a5 5 0 010 10"/>
	</svg>
`

function iconElement(svg: string): HTMLSpanElement {
	const wrap = document.createElement('span')
	wrap.classList.add('menu-icon')
	wrap.innerHTML = svg
	return wrap
}

export const Menu = component({
	name: 'app-menu',
	styles,
	onMount({ append, element, create, signal }) {
		// Theme chooser (multi-node control wrapped in a fragment span)
		const themeControl = element('span', {
			classes: styles.controlWrap,
			children: create(ThemeChooser),
		})

		const languageControl = create(LanguageChooser)
		const screenLockControl = create(OnOffSegment, {
			store: screenLockStore,
			ariaLabel: 'Keep screen on',
			idPrefix: 'menu-screen-lock',
		})

		const dialog = element('dialog', {
			classes: styles.sheet,
			aria: { modal: 'true', label: 'App menu' },
			on: {
				close() {
					if (menuStore.value) menuStore.update(() => false)
				},
				click(event) {
					if (event.target === dialog) dialog.close()
				},
			},
		})

		const handle = element('span', {
			classes: styles.handle,
			aria: { hidden: 'true' },
		})

		const settingsSection = create(MenuSection, { label: 'Settings', rightHint: 'Preferences' })
		const themeRow = create(MenuRow, {
			label: 'Theme',
			hint: 'System & sensor follow the device · Light/Dark force it',
			control: themeControl,
		})
		const languageRow = create(MenuRow, {
			label: 'Language',
			hint: 'App and rules text',
			control: languageControl,
		})
		const screenLockRow = create(MenuRow, {
			label: 'Keep screen on',
			hint: 'Disable lock while playing',
			control: screenLockControl,
		})

		const gameSection = create(MenuSection, { label: 'Game', rightHint: 'Actions' })
		const newGameRow = create(MenuRow, {
			label: 'New game',
			hint: 'Reset the score pad',
			variant: 'button',
			onSelect() {
				dialog.close()
				window.dispatchEvent(new CustomEvent('five-dice:new-game'))
			},
			control: iconElement(refresh),
		})
		const undoRow = create(MenuRow, {
			label: 'Undo last turn',
			hint: 'Revert the last committed score',
			variant: 'button',
			onSelect() {
				dialog.close()
				window.dispatchEvent(new CustomEvent('five-dice:undo'))
			},
			control: iconElement(undo),
		})

		const aboutSection = create(MenuSection, { label: 'About', rightHint: 'Help & links' })
		const rulesRow = create(MenuRow, {
			label: 'Rules',
			hint: 'How to play',
			variant: 'link',
			href: href.path('/'),
			control: iconElement(chevron),
		})
		const accessibilityRow = create(MenuRow, {
			label: 'Accessibility',
			hint: 'Statement & keyboard map',
			variant: 'link',
			href: href.path('/accessibility'),
			control: iconElement(chevron),
		})
		const sourceRow = create(MenuRow, {
			label: 'Source',
			hint: 'github.com/marvin-brouwer/five-dice',
			variant: 'external-link',
			href: 'https://github.com/marvin-brouwer/five-dice',
			control: iconElement(chevron),
		})

		const closeIconEl = element('span', { classes: styles.closeIcon })
		closeIconEl.innerHTML = closeIcon
		const closeButton = element('button', {
			type: 'button',
			classes: styles.closeButton,
			children: [closeIconEl, element('span', { textContent: 'Close menu' })],
			on: {
				click() { dialog.close() },
			},
		})

		dialog.append(
			handle,
			settingsSection, themeRow, languageRow, screenLockRow,
			gameSection, newGameRow, undoRow,
			aboutSection, rulesRow, accessibilityRow, sourceRow,
			element('div', { classes: styles.footer, children: closeButton }),
		)

		menuStore.on('change', signal, ({ detail }) => {
			if (detail.state && !dialog.open) dialog.showModal()
			else if (!detail.state && dialog.open) dialog.close()
		})

		if (menuStore.value) queueMicrotask(() => { if (menuStore.value) dialog.showModal() })

		append(dialog)
	},
})
