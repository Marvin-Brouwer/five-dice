import { component } from '@rooted/components'
import { href } from '@rooted/router'

import { AccessibilityRoute } from '../../content/_routes.mts'
import { localization } from '../../_shared/i18n/localization.mts'
import { installAvailableStore, promptInstall } from '../../_shared/services/install-prompt.mts'
import { scrollPageTo } from '../../_shared/services/page-scroll.mts'

import packageJson from '../../../package.json' with { type: 'json' }

import { DoormatLink } from './doormat-link.mts'
import { ShareButton } from './share-button.mts'
import topIcon from './doormat.top.svg?raw'
import styles from './doormat.css'

const repositoryUrl = packageJson.repository.url
const bugReportUrl = `${repositoryUrl}/issues/new?assignees=&labels=bug&template=bug_report.md&title=`
// The template filename really is misspelled in .github/ISSUE_TEMPLATE — do
// not "fix" it here, the URL has to match the file on disk.
const accessibilityReportUrl = `${repositoryUrl}/issues/new?assignees=&labels=accessibility&template=accesibility-challenge.md&title=`

function backToTop() {
	// `main` is not focusable on its own. Without moving focus, a keyboard
	// user is scrolled to the top while their tab position stays down here in
	// the footer.
	const main = document.getElementById('main-content')
	if (main) {
		if (!main.hasAttribute('tabindex')) main.tabIndex = -1
		main.focus({
			preventScroll: true,
		})
	}
	scrollPageTo(0)
}

/**
 * The doormat at the foot of a page: share button, link grid, meta line.
 *
 * Composition only — the button and every link own their own markup, styling
 * and behaviour. What is left here is which links there are, and the one
 * piece of state no link can know for itself: whether the browser is
 * currently offering an install prompt.
 *
 * Mounted per page rather than once in the app shell, so the score card and
 * the guide get one while the pre-locale culture-select splash does not —
 * its links would have no locale to point at. Pages resolve after
 * `localization.load()`, so the strings here need no `localized()` wrapper.
 */
export const Doormat = component({
	name: 'app-doormat',
	styles,
	onMount({ append, element, create, signal }) {

		const links = element('nav', {
			classes: styles.links,
			aria: {
				label: localization.text`Site links`
			},
			children: [
				create(DoormatLink, {
					variant: 'route',
					label: localization.text`Accessibility statement`,
					href: href.for(AccessibilityRoute, {
						locale: localization.currentLocale
					}),
				}),
				create(DoormatLink, {
					variant: 'external',
					label: localization.text`Report accessibility issues`,
					href: accessibilityReportUrl,
				}),
				create(DoormatLink, {
					variant: 'external',
					label: localization.text`View on GitHub`,
					href: repositoryUrl,
				}),
				create(DoormatLink, {
					variant: 'external',
					label: localization.text`Report a bug`,
					href: bugReportUrl,
				}),
				create(DoormatLink, {
					variant: 'action',
					label: localization.text`Back to top`,
					glyph: topIcon,
					onSelect: backToTop,
				}),
			],
		})

		/**
		 * The install row exists only while the browser is actually offering a
		 * prompt — it is added when `beforeinstallprompt` fires and taken out
		 * again once the app is installed.
		 *
		 * Added and removed rather than rendered hidden, so there is no inert
		 * cell in the grid on the browsers that never offer one, which is most
		 * of them. It goes on the end, where appearing and disappearing cannot
		 * shift the cells before it into the other column.
		 *
		 * `beforeinstallprompt` lands well after first paint, so this cannot be
		 * decided while building the list above.
		 */
		let installLink: Element | undefined
		function syncInstall() {
			if (installAvailableStore.value && installLink === undefined) {
				installLink = create(DoormatLink, {
					variant: 'action',
					label: localization.text`Add to home screen`,
					onSelect() {
						void promptInstall()
					},
				})
				links.append(installLink)
			}
			else if (!installAvailableStore.value && installLink !== undefined) {
				installLink.remove()
				installLink = undefined
			}
		}
		syncInstall()
		installAvailableStore.on('change', signal, syncInstall)

		const meta = element('p', {
			classes: styles.meta,
			children: [
				// Brand name and SPDX id, deliberately not localized.
				element('span', {
					textContent: 'Five dice',
				}),
				element('span', {
					textContent: packageJson.license,
				}),
			],
		})

		append(
			element('footer', {
				classes: styles.doormat,
				role: 'contentinfo',
				children: [
					create(ShareButton, {
						url: packageJson.homepage,
					}),
					links,
					element('hr', {
						classes: styles.rule,
					}),
					meta,
				],
			})
		)
	},
})
