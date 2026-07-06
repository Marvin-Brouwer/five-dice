import { createStore } from '@rooted/store'

/** True when the score pad is empty (no progress → nothing to reset). */
export const newGameDisabledStore = createStore(true)

/** True when undo is not applicable (no committed history). */
export const undoDisabledStore = createStore(true)
