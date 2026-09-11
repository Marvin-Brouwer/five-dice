import type { ComponentContext } from '@rooted/components'

/**
 * The slice of a component's context that a render function needs.
 *
 * Rooted has two ways to break a component up. A `component()` gets its own
 * CSS scope, signal and lifetime, at the cost of a host element in the DOM.
 * A render function gets none of that — it runs inside the caller's scope and
 * lifetime — but leaves the DOM untouched, which is what tables require: a
 * host between `<tbody>` and `<tr>` drops the rows out of the accessibility
 * tree. See docs/table-components-in-rooted.md.
 *
 * Render functions take this as their first parameter so they read like
 * components without being one.
 */
export type RenderContext = Pick<ComponentContext, 'element' | 'create'>
