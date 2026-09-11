import { component } from '@rooted/components'

import { localization } from '../../_shared/i18n/localization.mts'

import { RollingExampleTable } from '../rolling-example-table.mts'
import styles from '../how-to-play.css'

/** The score card, filled in and tumbling, as a worked example. */
export const GuideExample = component({
	name: 'guide-example',
	styles,
	onMount({ append, element, create }) {
		append(
			element('section', {
				classes: styles.guideExample,
				aria: {
					label: localization.text`Example rolls and scores`,
				},
				children: create(RollingExampleTable),
			}),
		)
	},
})
