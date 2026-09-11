import type { ComponentContext } from '@rooted/components'
import { href } from '@rooted/router'

import { guardNavigation } from '../_shared/services/navigation-guard.mts'
import { newGameDisabledStore, undoDisabledStore } from '../_shared/stores/gameStateStore.mts'
import { localization } from '../_shared/i18n/localization.mts'

import { ScoreCardRoute } from './_routes.mts'

import type { ScorePadStore } from './logic/scorePadStore.mts'

type BridgeContext = Pick<ComponentContext, 'signal' | 'on'> & { store: ScorePadStore }

/**
 * Every path this page answers to — one per locale, because the language
 * switcher navigates between them. Swapping the locale segment is not leaving
 * the game, so it must not be confirmed.
 */
const scoreCardPaths = new Set(localization.supportedLocales.map(
	locale => href.for(ScoreCardRoute, {
		locale,
	}).pathOnly
))

/**
 * Every route in this app is written with a trailing slash, and the router
 * puts a missing one back — but it does that from its own `popstate`
 * listener, which runs after the guard has already had to decide. Reading a
 * bare `/en/score-card` as somewhere else would mean prompting to leave a
 * page we are staying on, and then wiping the pad for it.
 */
function isScoreCard(path: string): boolean {
	return scoreCardPaths.has(path.endsWith('/') ? path : `${path}/`)
}

/**
 * Everything the game page says to chrome it does not own: the browser's
 * reload prompt, the in-app navigation prompt, and the app menu's New game /
 * Undo actions.
 *
 * The menu lives in `_shared` and must not depend on `game/`, so the two talk
 * through neutral ground — a pair of flag stores the game writes and the menu
 * reads, and window events the menu dispatches and the game listens for. It
 * is a crude bus, but the indirection is what keeps chrome independent of the
 * feature. The pad store being a module singleton would allow the menu to
 * call it directly; that would invert the dependency.
 *
 * A plain function rather than a component, because it renders nothing.
 */
export function wireGameMenuBridge({ signal, on, store }: BridgeContext) {

	on('window', 'beforeunload', (event) => {
		if (!store.hasProgress()) return
		event.preventDefault()
		event.returnValue = localization.text`You have a scorepad with changes, are you sure you want to reload the page?`
	})

	// `beforeunload` never fires for a route change, so routing away from a
	// game in progress — a doormat link, the back button — needs its own ask.
	let abandoned = false
	guardNavigation({
		ask(destination) {
			if (!store.hasProgress()) return undefined
			if (isScoreCard(destination)) return undefined
			return localization.text`You have a scorepad with changes, are you sure you want to leave the game?`
		},
		onConfirmed() {
			// Not `store.reset()` here: the pad outlives this page (see
			// scorePadStore.mts), so every cell is still on screen, and wiping
			// them now empties the card in front of the player and hands the
			// outgoing view transition a blank board to animate away. Waiting
			// for the unmount below erases it once there is nothing to see.
			abandoned = true
		},
	}, signal)

	function syncMenuActions() {
		const noProgress = !store.hasProgress()
		const noUndo = !store.canUndo()
		if (newGameDisabledStore.value !== noProgress) newGameDisabledStore.update(() => noProgress)
		if (undoDisabledStore.value !== noUndo) undoDisabledStore.update(() => noUndo)
	}

	syncMenuActions()
	store.on('change', signal, syncMenuActions)

	// Leave the menu showing both actions disabled once this page is gone,
	// otherwise Rules and Accessibility inherit the game's state.
	signal.addEventListener('abort', () => {
		if (!newGameDisabledStore.value) newGameDisabledStore.update(() => true)
		if (!undoDisabledStore.value) undoDisabledStore.update(() => true)
		// The player was warned and said yes, so the game really is over —
		// keeping the pad would put it straight back on screen on the next
		// visit and make the warning a lie. A remount that was never asked
		// anything (a locale switch) leaves it alone, which is the whole
		// reason the pad is a singleton.
		if (abandoned) store.reset()
	})

	window.addEventListener('five-dice:new-game', () => {
		if (confirm(localization.text`Start a new game? This will clear the current score pad.`)) {
			store.reset()
		}
	}, { signal })

	window.addEventListener('five-dice:undo', () => {
		if (!store.canUndo()) return
		if (confirm(localization.text`Undo your last committed round?`)) store.undo()
	}, { signal })
}
