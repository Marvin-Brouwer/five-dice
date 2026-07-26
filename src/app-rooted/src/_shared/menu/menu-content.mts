import { component } from '@rooted/components'
import { href } from '@rooted/router'

import { AccessibilityRoute, RulesRoute } from '../../content/_routes.mts'
import { localization } from '../i18n/localization.mts'
import { newGameDisabledStore, undoDisabledStore } from '../stores/gameStateStore.mts'
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

function iconElement(svg: string): HTMLSpanElement {
	const wrap = document.createElement('span')
	wrap.classList.add('menu-icon')
	wrap.innerHTML = svg
	return wrap
}

export type MenuContentOptions = {
	onClose: () => void
}

/** The menu's scrollable body. Fully rebuilt (not patched) whenever the locale
    changes, so any localization.text call in here just needs to be written —
    no per-string reactivity plumbing required. See menu.mts. */
export const MenuContent = component<MenuContentOptions>({
	name: 'menu-content',
	styles,
	onMount({ append, element, create, options }) {
		const { onClose } = options

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

		const settingsSection = create(MenuSection, { label: localization.text`Settings`, rightHint: 'Preferences' })
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
			disabledStore: newGameDisabledStore,
			onSelect() {
				onClose()
				window.dispatchEvent(new CustomEvent('five-dice:new-game'))
			},
			control: iconElement(refresh),
		})
		const undoRow = create(MenuRow, {
			label: 'Undo last turn',
			hint: 'Revert the last committed score',
			variant: 'button',
			disabledStore: undoDisabledStore,
			onSelect() {
				onClose()
				window.dispatchEvent(new CustomEvent('five-dice:undo'))
			},
			control: iconElement(undo),
		})

		const aboutSection = create(MenuSection, { label: 'About', rightHint: 'Help & links' })
		const rulesRow = create(MenuRow, {
			label: 'Rules',
			hint: 'How to play',
			variant: 'link',
			href: href.for(RulesRoute, { locale: localization.currentLocale }),
			control: iconElement(chevron),
		})
		const accessibilityRow = create(MenuRow, {
			label: 'Accessibility',
			hint: 'Statement & keyboard map',
			variant: 'link',
			href: href.for(AccessibilityRoute, { locale: localization.currentLocale }),
			control: iconElement(chevron),
		})
		const sourceRow = create(MenuRow, {
			label: 'Source',
			hint: 'github.com/marvin-brouwer/five-dice',
			variant: 'external-link',
			href: 'https://github.com/marvin-brouwer/five-dice',
			control: iconElement(chevron),
		})

		append(element('div', {
			classes: styles.content,
			children: [
				settingsSection, themeRow, languageRow, screenLockRow,
				gameSection, newGameRow, undoRow,
				aboutSection, rulesRow, accessibilityRow, sourceRow,
			],
		}))
	},
})
