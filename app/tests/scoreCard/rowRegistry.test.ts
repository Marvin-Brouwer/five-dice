import { describe, expect, test } from 'vitest'

import { createRowRegistry } from '../../src/game/score-card/row-registry.mts'

function fakeRow(top: number, bottom: number, isConnected = true) {
	return { isConnected, getBoundingClientRect: () => ({ top, bottom }) } as unknown as HTMLElement
}

describe('rowRegistry', () => {

	test('rect is undefined for unknown or disconnected rows', () => {
		const sut = createRowRegistry()
		sut.set('chance', fakeRow(0, 10, false))

		expect(sut.rect('aces')).toBeUndefined()
		expect(sut.rect('chance')).toBeUndefined()
	})

	test('rect returns the row box and delete forgets it', () => {
		const sut = createRowRegistry()
		sut.set('aces', fakeRow(10, 20))

		expect(sut.rect('aces')?.top).toBe(10)
		sut.delete('aces')
		expect(sut.rect('aces')).toBeUndefined()
	})

	test('span covers all visible rows', () => {
		const sut = createRowRegistry()
		sut.set('aces', fakeRow(10, 20))
		sut.set('deuces', fakeRow(30, 45))
		sut.set('chance', fakeRow(0, 5, false))

		expect(sut.span(['aces', 'deuces', 'chance'])).toEqual({ top: 10, bottom: 45 })
	})

	test('span is undefined when nothing is on screen', () => {
		expect(createRowRegistry().span(['aces'])).toBeUndefined()
	})
})
