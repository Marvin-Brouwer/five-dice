import { component, cssClass } from '@rooted/components'

import { Icon } from '../icon/icon.mts'
import { localization } from '../i18n/localization.mts'
import { sensorAvailable } from '../services/theme-sensor.mts'
import { themeStore, type Theme } from '../stores/themeStore.mts'

import { attachDropdown } from './dropdown-controller.mts'
import checkIcon from './theme-chooser.check.svg?raw'
import chevronIcon from './dropdown-chevron.svg?raw'
import moonIcon from './theme-chooser.moon.svg?raw'
import sensorIcon from './theme-chooser.sensor.svg?raw'
import sunIcon from './theme-chooser.sun.svg?raw'
import systemIcon from './theme-chooser.system.svg?raw'
import styles from './theme-chooser.css'

type ThemeOption = {
	value: Theme
	icon: string
	label: string
	sub: string
}

function getOptions(text: typeof localization.text): ThemeOption[] {
	return [
		{
			value: 'system', icon: systemIcon,
			label: text`System`, sub: text`Follow device setting`
		},
		{
			value: 'sensor', icon: sensorIcon,
			label: text`Sensor`, sub: text`Adapt to room light`
		},
		{
			value: 'light',  icon: sunIcon,
			label: text`Light`,  sub: text`Always light`
		},
		{
			value: 'dark',   icon: moonIcon,
			label: text`Dark`, sub: text`Always dark`
		},
	]
}

function themeOption(value: Theme): ThemeOption {
	return getOptions(localization.text).find(o => o.value === value)!
}

function themeLabel(value: Theme): string {
	return themeOption(value).label
}

function isDarkNow(): boolean {
	if (typeof document === 'undefined') return false
	return document.documentElement.dataset.theme === 'dark'
}

export const ThemeChooser = component({
	name: 'theme-chooser',
	styles,
	onMount({ append, element, create, signal, on }) {
		const statusLine = element('span', {
			classes: styles.status,
			aria: {
				hidden: 'true'
			},
		})

		const buttonIcon = element('span', {
			classes: styles.buttonIcon
		})
		const buttonLabel = element('span', {
			classes: styles.buttonLabel,
			textContent: themeLabel(themeStore.value),
		})
		const buttonChevron = element('span', {
			classes: styles.buttonChevron,
			children: create(Icon, {
				source: chevronIcon,
			}),
		})

		const button = element('button', {
			type: 'button',
			classes: styles.button,
			aria: {
				hasPopup: 'listbox',
				label: localization.text`Theme: ${themeLabel(themeStore.value)}`
			},
			children: [
				buttonIcon,
				buttonLabel,
				buttonChevron
			],
		})

		const list = element('div', {
			role: 'listbox',
			aria: {
				label: localization.text`Theme`
			},
			classes: styles.list,
		})

		function syncButton() {
			const dark = isDarkNow()
			buttonIcon.replaceChildren(create(Icon, {
				source: themeOption(themeStore.value).icon,
			}))
			buttonLabel.textContent = themeLabel(themeStore.value)
			button.setAttribute('aria-label', localization.text`Theme: ${themeLabel(themeStore.value)}`)

			const auto = themeStore.value === 'system' || themeStore.value === 'sensor'
			statusLine.hidden = !auto
			if (auto) {
				statusLine.replaceChildren(
					create(Icon, {
						source: dark ? moonIcon : sunIcon,
					}),
					element('span', {
						textContent: dark ? localization.text`Dark active` : localization.text`Light active`,
					}),
				)
			}
			else {
				statusLine.textContent = ''
			}
		}

		function buildOptions(): Node[] {
			const sensorSupported = sensorAvailable()
			return getOptions(localization.text).map((option) => {
				const selected = option.value === themeStore.value
				const disabled = option.value === 'sensor' && !sensorSupported

				const iconWrap = element('span', {
					classes: styles.optionIcon,
					children: create(Icon, {
						source: option.icon,
					}),
				})

				const optionEl = element('div', {
					role: 'option',
					aria: {
						selected: String(selected),
						disabled: disabled ? 'true' : undefined!
					},
					classes: [
						styles.option,
						cssClass(styles.optionSelected, selected),
						cssClass(styles.optionDisabled, disabled),
					],
					on: {
						click(event) {
							event.stopPropagation()
							if (disabled) return
							themeStore.update(() => option.value)
							dropdown.close()
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
									textContent: disabled
										? localization.text`unavailable in this browser`
										: option.sub,
								}),
							],
						}),
					],
				})

				if (selected) {
					optionEl.append(element('span', {
						classes: styles.optionCheck,
						children: create(Icon, {
							source: checkIcon,
						}),
					}))
				}
				return optionEl
			})
		}

		const dropdown = attachDropdown({ button, list, buildOptions, signal, on })

		syncButton()

		themeStore.on('change', signal, () => {
			syncButton()
			dropdown.refresh()
		})

		// Listen for data-theme changes (theme-sensor writes it) so the status
		// line text reflects the currently-resolved theme in auto modes. The
		// icon itself is CSS-driven and repaints without JS involvement.
		if (typeof MutationObserver !== 'undefined') {
			const observer = new MutationObserver(() => {
				syncButton()
			})
			observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
			signal.addEventListener('abort', () => observer.disconnect(), { once: true })
		}

		append(
			statusLine,
			element('div', {
				classes: styles.wrap,
				children: [
					button,
					list
				],
			}),
		)
	},
})
