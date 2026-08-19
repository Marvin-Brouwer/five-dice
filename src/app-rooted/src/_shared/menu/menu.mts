import { component } from '@rooted/components'

import { localization } from '../i18n/localization.mts'
import { menuStore } from '../stores/menuStore.mts'

import { MenuContent } from './menu-content.mts'

import styles from './menu.css'

const closeXIcon = `
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
		<path d="M6 6l12 12M18 6L6 18"/>
	</svg>
`

export const Menu = component({
	name: 'app-menu',
	styles,
	onMount({ append, element, create, signal, on }) {
		const dialog = element('dialog', {
			classes: styles.sheet,
			aria: {
				modal: 'true',
				label: localization.text`App menu`
			},
			on: {
				close() {
					if (menuStore.value) menuStore.update(() => false)
				},
			},
		})

		const navCloseButton = element('button', {
			type: 'button',
			classes: styles.navClose,
			aria: {
				label: localization.text`Close menu`
			},
			on: {
				click() { dialog.close() },
			},
			children: element('span', {
				classes: styles.navCloseIcon,
				innerHTML: closeXIcon
			}),
		})

		const navTitle = element('span', {
			classes: styles.navTitle,
			textContent: localization.text`Menu`
		})

		const navBar = element('header', {
			classes: styles.navBar,
			children: [
				navTitle,
				navCloseButton,
			],
		})

		dialog.append(navBar,
			localization.localized(() =>
				create(MenuContent, {
					onClose: () => dialog.close()
				})
			)
		)

		menuStore.on('change', signal, ({ detail }) => {
			if (detail.state && !dialog.open) dialog.showModal()
			else if (!detail.state && dialog.open) dialog.close()
		})

		if (menuStore.value) queueMicrotask(() => { if (menuStore.value) dialog.showModal() })

		// Menu's own dialog chrome is mounted once in the app shell, outside
		// MenuContent's localized() wrap, so it never rebuilds on navigation,
		// resync it directly on a locale switch.
		on('window', 'popstate', async () => {
			await localization.load()
			dialog.setAttribute('aria-label', localization.text`App menu`)
			navCloseButton.setAttribute('aria-label', localization.text`Close menu`)
			navTitle.textContent = localization.text`Menu`
		})

		append(dialog)
	},
})
