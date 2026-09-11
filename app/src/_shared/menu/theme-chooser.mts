import { component } from '@rooted/components'

import { Icon } from '../icon/icon.mts'
import { localization } from '../i18n/localization.mts'
import { sensorAvailable } from '../services/theme-sensor.mts'
import { themeStore, type Theme } from '../stores/themeStore.mts'

import { DropDown, type DropDownApi } from './drop-down.mts'
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
	onMount({ append, element, create, signal }) {
		const statusLine = element('span', {
			classes: styles.status,
			aria: {
				hidden: 'true'
			},
		})

		let dropdown: DropDownApi | undefined

		function syncStatus() {
			const dark = isDarkNow()
			const auto = themeStore.value === 'system' || themeStore.value === 'sensor'
			statusLine.hidden = !auto
			if (!auto) {
				statusLine.textContent = ''
				return
			}
			statusLine.replaceChildren(
				create(Icon, {
					source: dark ? moonIcon : sunIcon,
				}),
				element('span', {
					textContent: dark ? localization.text`Dark active` : localization.text`Light active`,
				}),
			)
		}

		function items() {
			const sensorSupported = sensorAvailable()
			return getOptions(localization.text).map(option => {
				const disabled = option.value === 'sensor' && !sensorSupported
				return {
					selected: option.value === themeStore.value,
					disabled,
					content: [
						element('span', {
							classes: styles.optionIcon,
							children: create(Icon, {
								source: option.icon,
							}),
						}),
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
					onSelect() {
						themeStore.update(() => option.value)
						dropdown?.close()
					},
				}
			})
		}

		const chooser = create(DropDown, {
			label: localization.text`Theme`,
			triggerLabel: () => localization.text`Theme: ${themeLabel(themeStore.value)}`,
			trigger: () => [
				element('span', {
					classes: styles.buttonIcon,
					children: create(Icon, {
						source: themeOption(themeStore.value).icon,
					}),
				}),
				element('span', {
					classes: styles.buttonLabel,
					textContent: themeLabel(themeStore.value),
				}),
			],
			items,
			reference: api => {
				dropdown = api
			},
		})

		syncStatus()

		themeStore.on('change', signal, () => {
			syncStatus()
			dropdown?.refresh()
		})

		// Listen for data-theme changes (theme-sensor writes it) so the status
		// line text reflects the currently-resolved theme in auto modes. The
		// icon itself is CSS-driven and repaints without JS involvement.
		if (typeof MutationObserver !== 'undefined') {
			const observer = new MutationObserver(() => {
				syncStatus()
				dropdown?.refresh()
			})
			observer.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ['data-theme'],
			})
			signal.addEventListener('abort', () => observer.disconnect(), { once: true })
		}

		append(statusLine, chooser)
	},
})
