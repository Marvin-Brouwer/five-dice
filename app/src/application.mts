import { component } from '@rooted/components'
import { application } from '@rooted/components/application'
import { router } from '@rooted/router/application'

import { AppBar } from './_layout/app-bar.mts'
import { appRoutes } from './_routes.g.mts'
import { localization } from './_shared/i18n/localization.mts'
import { LocaleSync } from './_shared/i18n/locale-sync.mts'
import { Menu } from './_shared/menu/menu.mts'
import { CultureSelect } from './navigation/culture-select.mts'
import { NotFoundPage } from './navigation/not-found.mts'

// Side-effect imports to hydrate theme + language stores before render
import './_shared/stores/themeStore.mts'
// Services that translate stores into runtime effects (theme resolution, wake lock)
import './_shared/services/app-update.mts'
import './_shared/services/theme-sensor.mts'
import './_shared/services/wake-lock.mts'
import './_shared/services/install-prompt.mts'
import './_shared/services/navigation-guard.mts'
import './_shared/services/texture-variant.mts'

import packageJson from '../package.json' with { type: 'json' }

const Router = router({
	home: CultureSelect,
	notFound: NotFoundPage,
	...appRoutes,
})

export const Application = component({
	name: 'five-dice-application',
	async onMount({ append, element, create }) {
		document.title = 'Five dice'
		localization.observeDocument({ deploymentUrl: packageJson.homepage })
		// Menu is part of the app shell, not a per-route component. It mounts once
		// and never re-renders on navigation, so its localization.text calls (e.g.
		// the "Settings" section label) need the dictionary in place before this
		// first render, same reason every route resolver awaits load() too.
		await localization.load()
		append(
			create(LocaleSync),
			localization.localized(() => create(AppBar)),
			element('main', {
				id: 'main-content',
				children: create(Router, {
					viewTransition: true,
				}),
			}),
			create(Menu),
		)
	},
})

application(Application)
