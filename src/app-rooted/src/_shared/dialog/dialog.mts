import { component } from '@rooted/components'
import type { Store } from '@rooted/store'

import styles from './dialog.css'

export type DialogOptions = {
	open: Store<boolean>
	label: string
	labelId?: string
	onClose?: () => void
	children: Node | Array<Node>
}

export const Dialog = component<DialogOptions>({
	name: 'shared-dialog',
	styles,
	onMount({ append, element, signal, options }) {
		const { open, label, labelId, onClose, children } = options

		const dialog = element('dialog', {
			classes: styles.dialog,
			aria: {
				modal: 'true',
				...(labelId ? { labelledBy: labelId } : { label }),
			},
			on: {
				close() {
					if (open.value) open.update(() => false)
					onClose?.()
				},
				click(event) {
					if (event.target === dialog) dialog.close()
				},
			},
		})

		dialog.append(...(Array.isArray(children) ? children : [children]))

		open.on('change', signal, ({ detail }) => {
			if (detail.state && !dialog.open) dialog.showModal()
			else if (!detail.state && dialog.open) dialog.close()
		})

		if (open.value && !dialog.open) {
			queueMicrotask(() => { if (open.value) dialog.showModal() })
		}

		append(dialog)
	},
})
