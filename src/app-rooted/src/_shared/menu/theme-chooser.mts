import { component } from '@rooted/components'

import { sensorAvailable } from '../services/theme-sensor.mts'
import { themeStore, type Theme } from '../stores/themeStore.mts'

import styles from './theme-chooser.css'

type ThemeOption = {
	value: Theme
	label: string
	sub: string
}

const OPTIONS: ThemeOption[] = [
	{ value: 'system', label: 'System', sub: 'Follow device setting' },
	{ value: 'sensor', label: 'Sensor', sub: 'Adapt to room light' },
	{ value: 'light',  label: 'Light',  sub: 'Always light' },
	{ value: 'dark',   label: 'Dark',   sub: 'Always dark' },
]

const iconSystem = (dark: boolean) => `
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<rect x="2.5" y="4" width="19" height="13" rx="2"/>
		<path d="M8 21h8M12 17v4"/>
		${dark
			? '<path d="M14.2 10.5a3 3 0 1 1-2.7-4 2.3 2.3 0 0 0 2.7 4z" fill="currentColor" stroke="none"/>'
			: '<circle cx="12" cy="10.5" r="2" fill="currentColor"/>'}
	</svg>
`

const iconSensor = (dark: boolean) => `
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		${dark
			? '<circle cx="12" cy="12" r="7"/><path d="M14.5 12.5a3.2 3.2 0 1 1-3-4.3 2.5 2.5 0 0 0 3 4.3z" fill="currentColor" stroke="none"/>'
			: '<circle cx="12" cy="12" r="3.2" fill="currentColor"/><path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M5.6 18.4l1.7-1.7M16.7 7.3l1.7-1.7"/>'}
	</svg>
`

const iconSun = `
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<circle cx="12" cy="12" r="4.2" fill="currentColor"/>
		<path d="M12 2v3M12 19v3M22 12h-3M5 12H2M19 5l-2 2M7 17l-2 2M19 19l-2-2M7 7L5 5"/>
	</svg>
`

const iconMoon = `
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="currentColor"/>
	</svg>
`

const chevron = `
	<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M6 9l6 6 6-6"/>
	</svg>
`

const check = `
	<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M5 12l5 5L20 7"/>
	</svg>
`

function themeIconFor(value: Theme, resolvedDark: boolean): string {
	if (value === 'system') return iconSystem(resolvedDark)
	if (value === 'sensor') return iconSensor(resolvedDark)
	if (value === 'dark') return iconMoon
	return iconSun
}

function themeLabel(value: Theme): string {
	return OPTIONS.find(o => o.value === value)!.label
}

function isDarkNow(): boolean {
	if (typeof document === 'undefined') return false
	return document.documentElement.dataset.theme === 'dark'
}

export const ThemeChooser = component({
	name: 'theme-chooser',
	styles,
	onMount({ append, element, signal, on }) {
		let listOpen = false

		const statusLine = element('span', {
			classes: styles.status,
			aria: { hidden: 'true' },
		})

		const buttonIcon = element('span', { classes: styles.buttonIcon })
		const buttonLabel = element('span', {
			classes: styles.buttonLabel,
			textContent: themeLabel(themeStore.value),
		})
		const buttonChevron = element('span', { classes: styles.buttonChevron })
		buttonChevron.innerHTML = chevron

		const button = element('button', {
			type: 'button',
			classes: styles.button,
			aria: { hasPopup: 'listbox', expanded: 'false', label: `Theme: ${themeLabel(themeStore.value)}` },
			children: [buttonIcon, buttonLabel, buttonChevron],
			on: {
				click(event) {
					event.stopPropagation()
					listOpen = !listOpen
					renderList()
				},
			},
		})

		const list = element('div', {
			role: 'listbox',
			aria: { label: 'Theme' },
			classes: styles.list,
		})
		list.hidden = true

		function syncButton() {
			const dark = isDarkNow()
			buttonIcon.innerHTML = themeIconFor(themeStore.value, dark)
			buttonLabel.textContent = themeLabel(themeStore.value)
			button.setAttribute('aria-label', `Theme: ${themeLabel(themeStore.value)}`)

			const auto = themeStore.value === 'system' || themeStore.value === 'sensor'
			statusLine.hidden = !auto
			if (auto) {
				statusLine.innerHTML = `${dark ? iconMoon : iconSun}<span>${dark ? 'Dark active' : 'Light active'}</span>`
			}
			else {
				statusLine.textContent = ''
			}
		}

		function positionList() {
			const rect = button.getBoundingClientRect()
			list.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`

			// Default to opening upward. If the list would clip past the top
			// of the viewport, flip it downward instead.
			list.style.top = ''
			list.style.bottom = ''
			const listHeight = list.offsetHeight
			const spaceAbove = rect.top - 8
			const openUpward = listHeight <= spaceAbove

			if (openUpward) {
				list.style.bottom = `${window.innerHeight - rect.top + 6}px`
			}
			else {
				list.style.top = `${rect.bottom + 6}px`
			}
		}

		function renderList() {
			list.hidden = !listOpen
			button.setAttribute('aria-expanded', String(listOpen))
			if (!listOpen) {
				list.replaceChildren()
				list.style.right = ''
				list.style.top = ''
				list.style.bottom = ''
				return
			}
			const dark = isDarkNow()
			const sensorSupported = sensorAvailable()
			const options = OPTIONS.map((option) => {
				const selected = option.value === themeStore.value
				const disabled = option.value === 'sensor' && !sensorSupported

				const iconWrap = element('span', { classes: styles.optionIcon })
				iconWrap.innerHTML = themeIconFor(option.value, dark)

				const optionEl = element('div', {
					role: 'option',
					aria: { selected: String(selected), disabled: disabled ? 'true' : undefined! },
					classes: [
						styles.option,
						selected ? styles.optionSelected : undefined,
						disabled ? styles.optionDisabled : undefined,
					],
					on: {
						click(event) {
							event.stopPropagation()
							if (disabled) return
							themeStore.update(() => option.value)
							listOpen = false
							renderList()
						},
					},
					children: [
						iconWrap,
						element('span', {
							children: [
								element('span', {
									classes: styles.optionLabel,
									textContent: option.label,
								}),
								element('span', {
									classes: styles.optionSub,
									textContent: disabled ? 'unavailable in this browser' : option.sub,
								}),
							],
						}),
					],
				})

				if (selected) {
					const tick = element('span', { classes: styles.optionCheck })
					tick.innerHTML = check
					optionEl.append(tick)
				}
				return optionEl
			})
			list.replaceChildren(...options)
			positionList()
		}

		syncButton()

		themeStore.on('change', signal, () => {
			syncButton()
			if (listOpen) renderList()
		})

		on('document', 'click', (event) => {
			if (!listOpen) return
			const target = event.target as Node | null
			if (target && (button.contains(target) || list.contains(target))) return
			listOpen = false
			renderList()
		})

		on('window', 'resize', () => {
			if (listOpen) positionList()
		})

		// Listen for data-theme changes (theme-sensor writes it) so the button
		// glyph reflects the currently-resolved theme in auto modes.
		if (typeof MutationObserver !== 'undefined') {
			const observer = new MutationObserver(() => {
				syncButton()
				if (listOpen) renderList()
			})
			observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
			signal.addEventListener('abort', () => observer.disconnect(), { once: true })
		}

		append(
			statusLine,
			element('div', {
				classes: styles.wrap,
				children: [button, list],
			}),
		)
	},
})
