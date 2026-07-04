import { createStore } from '@rooted/store'

/** The current route's breadcrumb label, e.g. "Home", "Score card", "Accessibility".
    Each route writes into this on mount; the app bar reads from it. */
export const routeTitleStore = createStore<string>('')
