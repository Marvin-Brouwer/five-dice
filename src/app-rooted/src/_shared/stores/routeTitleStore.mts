import { createStore } from '@rooted/store'

/** The current route's breadcrumb label, e.g. "Home", "Score card", "Accessibility".
    Each route writes into this on mount; the app bar reads from it. */
// TODO: every route writes here on mount, but nothing reads it — app-bar's
// breadcrumb is a hardcoded 'Five dice' string. Decide: wire this up to a real
// breadcrumb UI, or drop it and have routes set document.title directly instead.
// Note routes' seo.title (lazy localization.text resolvers) already drives
// document.title per-navigation via the router's applyRouteSeoMeta — so the
// "drop it" option may already be covered and this store may just be dead weight.
export const routeTitleStore = createStore<string>('')
