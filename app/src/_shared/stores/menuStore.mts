import { createStore } from '@rooted/store'

/** Whether the app menu (bottom-sheet) is open. Ephemeral, not persisted. */
export const menuStore = createStore<boolean>(false)
