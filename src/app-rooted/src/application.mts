import { component } from '@rooted/components'
import { application } from '@rooted/components/application'
import { router } from '@rooted/router/application'

import { Footer } from './_layout/footer.mts'
import { Header } from './_layout/header.mts'
import { appRoutes } from './_routes.g.mts'
// Side-effect imports to hydrate theme + language from storage before render
import './_shared/stores/themeStore.mts'
import './_shared/stores/languageStore.mts'
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
			create(Header),
			element('main', {
				id: 'main-content',
				children: create(Router, { viewTransition: true }),
			}),
			create(Footer),
		)
	},
})

application(Application)
