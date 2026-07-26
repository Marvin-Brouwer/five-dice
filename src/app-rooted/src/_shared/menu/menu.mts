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
	onMount({ append, element, create, signal }) {
		const dialog = element('dialog', {
			classes: styles.sheet,
			aria: { modal: 'true', label: 'App menu' },
			on: {
				close() {
					if (menuStore.value) menuStore.update(() => false)
				},
			},
		})

		const closeXWrap = element('span', { classes: styles.navCloseIcon })
		closeXWrap.innerHTML = closeXIcon
		const navCloseButton = element('button', {
			type: 'button',
			classes: styles.navClose,
			aria: { label: 'Close menu' },
			on: {
				click() { dialog.close() },
			},
			children: closeXWrap,
		})

		const navBar = element('header', {
			classes: styles.navBar,
			children: [
				element('span', { classes: styles.navTitle, textContent: 'Menu' }),
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

		append(dialog)
	},
})
