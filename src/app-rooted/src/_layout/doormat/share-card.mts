import { component } from '@rooted/components'

import { LiveRegion } from '../../_shared/a11y/live-region.mts'
import { Icon } from '../../_shared/icon/icon.mts'
import { localization } from '../../_shared/i18n/localization.mts'

import chevronIcon from '../../_shared/menu/menu-content.chevron.svg?raw'
import shareIcon from './share-card.share.svg?raw'
import styles from './share-card.css'

/** How long the card shows "Link copied" before returning to its tagline. */
const copiedMilliseconds = 2000

/**
 * `navigator.share` / `navigator.clipboard`, typed structurally rather than
 * from lib.dom — the same approach `wake-lock.mts` takes, so the feature check
 * and the type sit together and a missing API is a plain `undefined`.
 */
type ShareCapableNavigator = Navigator & {
	share?: (data: { title?: string, text?: string, url?: string }) => Promise<void>
	clipboard?: { writeText(text: string): Promise<void> }
}

export type ShareCardOptions = {
	/** The link handed to the share sheet, or copied when there isn't one. */
	url: string
}

/**
 * The "Invite your friends" card at the head of the doormat.
 *
 * Takes the share sheet where the platform has one and falls back to the
 * clipboard where it doesn't, so the card never has to be hidden. The URL is
 * an option rather than read from the package manifest here, because which
 * link is worth sharing is the caller's decision, not this card's.
 */
export const ShareCard = component<ShareCardOptions>({
	name: 'doormat-share-card',
	styles,
	onMount({ append, element, create, signal, options }) {
		const { url } = options

		// LiveRegion hands its element over in its own onMount, a microtask
		// after ours, so the first announcement has to be buffered.
		let liveAnnounce: HTMLElement | undefined
		let announcement = ''
		function announce(text: string) {
			announcement = text
			if (liveAnnounce) liveAnnounce.textContent = text
		}

		const tagline = localization.text`Play the game together`

		const hint = element('span', {
			classes: styles.hint,
			textContent: tagline,
		})

		let copiedTimer: number | undefined
		function flashCopied() {
			hint.textContent = localization.text`Link copied`
			announce(localization.text`Link copied to clipboard`)
			if (copiedTimer !== undefined) clearTimeout(copiedTimer)
			copiedTimer = window.setTimeout(() => {
				hint.textContent = tagline
				copiedTimer = undefined
			}, copiedMilliseconds)
		}

		signal.addEventListener('abort', () => {
			if (copiedTimer !== undefined) clearTimeout(copiedTimer)
		}, { once: true })

		async function copyLink(shareNavigator: ShareCapableNavigator) {
			// Absent outside a secure context, which is exactly where the
			// share sheet is missing too — so this can genuinely be undefined.
			if (!shareNavigator.clipboard) {
				console.info('[share-card] neither navigator.share nor navigator.clipboard is available; the invite card cannot copy.')
				return
			}
			try {
				await shareNavigator.clipboard.writeText(url)
				flashCopied()
			}
			catch (error) {
				console.warn('[share-card] clipboard write failed', error)
			}
		}

		async function invite() {
			const shareNavigator = navigator as ShareCapableNavigator

			if (shareNavigator.share) {
				try {
					await shareNavigator.share({
						title: 'Five dice',
						text: localization.text`Play a game of five dice with me.`,
						url,
					})
					return
				}
				catch (error) {
					// Dismissing the sheet rejects with AbortError. That is a
					// choice, not a failure, and must not fall through to the
					// clipboard — copying a link they declined to share would
					// be a surprise.
					if ((error as Error | undefined)?.name === 'AbortError') return
					console.warn('[share-card] share failed, falling back to clipboard', error)
				}
			}

			await copyLink(shareNavigator)
		}

		append(
			element('button', {
				type: 'button',
				classes: styles.card,
				on: {
					click() {
						void invite()
					},
				},
				children: [
					element('span', {
						classes: styles.badge,
						children: create(Icon, {
							source: shareIcon,
						}),
					}),
					element('span', {
						classes: styles.text,
						children: [
							element('span', {
								classes: styles.title,
								textContent: localization.text`Invite your friends`,
							}),
							hint,
						],
					}),
					element('span', {
						classes: styles.chevron,
						children: create(Icon, {
							source: chevronIcon,
						}),
					}),
				],
			}),
			create(LiveRegion, {
				reference(region) {
					liveAnnounce = region
					region.textContent = announcement
				},
			}),
		)
	},
})
