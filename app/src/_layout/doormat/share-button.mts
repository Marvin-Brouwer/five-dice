import { component } from '@rooted/components'
import { createStore } from '@rooted/store'

import { LiveRegion } from '../../_shared/a11y/live-region.mts'
import { ActionButton } from '../../_shared/action-button/action-button.mts'
import { localization } from '../../_shared/i18n/localization.mts'

import shareIcon from './share-button.share.svg?raw'

/** How long the button shows "Link copied" before returning to its tagline. */
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

export type ShareButtonOptions = {
	/** The link handed to the share sheet, or copied when there isn't one. */
	url: string
}

/**
 * The "Invite your friends" button at the head of the doormat.
 *
 * An ActionButton with the sharing behind it, the way StartGameButton and
 * HowToButton are ActionButtons with a route behind them — so the invite at
 * the foot of a page and the calls to action on it are one control.
 *
 * Takes the share sheet where the platform has one and falls back to the
 * clipboard where it doesn't, so the button never has to be hidden. The URL is
 * an option rather than read from the package manifest here, because which
 * link is worth sharing is the caller's decision, not this button's.
 */
export const ShareButton = component<ShareButtonOptions>({
	name: 'doormat-share-button',
	onMount({ append, create, signal, options }) {
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

		// The hint is the one part of the row that answers back, so it is the
		// one part handed over as a store rather than as a string.
		const hint = createStore(tagline)

		let copiedTimer: number | undefined
		function flashCopied() {
			hint.update(() => localization.text`Link copied`)
			announce(localization.text`Link copied to clipboard`)
			if (copiedTimer !== undefined) clearTimeout(copiedTimer)
			copiedTimer = window.setTimeout(() => {
				hint.update(() => tagline)
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
				console.info('[share-button] neither navigator.share nor navigator.clipboard is available; the invite button cannot copy.')
				return
			}
			try {
				await shareNavigator.clipboard.writeText(url)
				flashCopied()
			}
			catch (error) {
				console.warn('[share-button] clipboard write failed', error)
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
					console.warn('[share-button] share failed, falling back to clipboard', error)
				}
			}

			await copyLink(shareNavigator)
		}

		append(
			create(ActionButton, {
				variant: 'secondary',
				label: localization.text`Invite your friends`,
				hint: tagline,
				hintStore: hint,
				glyph: shareIcon,
				on: {
					async click() {
						await invite()
					},
				},
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
