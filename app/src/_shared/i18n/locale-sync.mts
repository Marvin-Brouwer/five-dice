import { component } from '@rooted/components'

import { localization } from './localization.mts'
import { setLocale } from './remembered-locale.mts'

/** Non-rendering component that keeps the remembered-locale cookie in sync with the URL across every navigation. */
export const LocaleSync = component({
	name: 'locale-sync',
	onMount({ on }) {

		on('window', 'popstate', persist)
		persist()
	},
})

function persist() {
	if (localization.route.valid) setLocale(localization.currentLocale)
}