import type { ComponentContext } from '@rooted/components'

import { newGameDisabledStore, undoDisabledStore } from '../_shared/stores/gameStateStore.mts'
import { localization } from '../_shared/i18n/localization.mts'

import type { ScorePadStore } from './_logic/scorePadStore.mts'

type BridgeContext = Pick<ComponentContext, 'signal' | 'on'> & { store: ScorePadStore }

/**
 * Everything the game page says to chrome it does not own: the browser's
 * reload prompt, and the app menu's New game / Undo actions.
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
