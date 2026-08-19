import { component, cssClass } from '@rooted/components'

import { Icon } from '../icon/icon.mts'
import { localization } from '../i18n/localization.mts'
import { sensorAvailable } from '../services/theme-sensor.mts'
import { themeStore, type Theme } from '../stores/themeStore.mts'

import { attachDropdown } from './dropdown-controller.mts'
import checkIcon from './theme-chooser.check.svg?raw'
import chevronIcon from './dropdown-chevron.svg?raw'
import moonIcon from './theme-chooser.moon.svg?raw'
import sensorDarkIcon from './theme-chooser.sensor-dark.svg?raw'
import sensorLightIcon from './theme-chooser.sensor-light.svg?raw'
import sunIcon from './theme-chooser.sun.svg?raw'
import systemDarkIcon from './theme-chooser.system-dark.svg?raw'
import systemLightIcon from './theme-chooser.system-light.svg?raw'
import styles from './theme-chooser.css'

type ThemeOption = {
	value: Theme
	label: string
	sub: string
}

function getOptions(): ThemeOption[] {
	return [
		{ value: 'system', label: localization.text`System`, sub: localization.text`Follow device setting` },
		{ value: 'sensor', label: localization.text`Sensor`, sub: localization.text`Adapt to room light` },
		{ value: 'light',  label: localization.text`Light`,  sub: localization.text`Always light` },
		{ value: 'dark',   label: localization.text`Dark`,   sub: localization.text`Always dark` },
	]
}

// TODO this should be CSS driven
const systemIcon = (dark: boolean) => dark ? systemDarkIcon : systemLightIcon
const sensorIcon = (dark: boolean) => dark ? sensorDarkIcon : sensorLightIcon

function themeIconFor(value: Theme, resolvedDark: boolean): string {
	if (value === 'system') return systemIcon(resolvedDark)
	if (value === 'sensor') return sensorIcon(resolvedDark)
	if (value === 'dark') return moonIcon
	return sunIcon
}

function themeLabel(value: Theme): string {
	return getOptions().find(o => o.value === value)!.label
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
				source: themeIconFor(themeStore.value, dark),
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
			const dark = isDarkNow()
			const sensorSupported = sensorAvailable()
			return getOptions().map((option) => {
				const selected = option.value === themeStore.value
				const disabled = option.value === 'sensor' && !sensorSupported

				const iconWrap = element('span', {
					classes: styles.optionIcon,
					children: create(Icon, {
						source: themeIconFor(option.value, dark),
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

		// Listen for data-theme changes (theme-sensor writes it) so the button
		// glyph reflects the currently-resolved theme in auto modes.
		if (typeof MutationObserver !== 'undefined') {
			const observer = new MutationObserver(() => {
				syncButton()
				dropdown.refresh()
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
