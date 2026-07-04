import { component } from '@rooted/components'
import { application } from '@rooted/components/application'
import { router } from '@rooted/router/application'

import { AppBar } from './_layout/app-bar.mts'
import { appRoutes } from './_routes.g.mts'
import { Menu } from './_shared/menu/menu.mts'
// Side-effect imports to hydrate theme + language stores before render
import './_shared/stores/themeStore.mts'
import './_shared/stores/languageStore.mts'
// Services that translate stores into runtime effects (theme resolution, wake lock)
import './_shared/services/theme-sensor.mts'
import './_shared/services/wake-lock.mts'
import { Rules } from './content/rules.mts'
import { NotFoundPage } from './navigation/not-found.mts'

import styles from './application.css'

const Router = router({
	home: Rules,
	notFound: NotFoundPage,
	...appRoutes,
})

export const Application = component({
	name: 'five-dice-application',
	styles,
	onMount({ append, element, create }) {
		document.title = 'Five dice'
		append(
			create(AppBar),
			element('main', {
				id: 'main-content',
				children: create(Router, { viewTransition: true }),
			}),
			create(Menu),
		)
	},
})

application(Application)
