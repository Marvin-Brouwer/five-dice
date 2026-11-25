import { describe, expect, test } from 'vitest'

import { createRowRegistry } from '../../src/game/score-card/row-registry.mts'

function fakeRow(top: number, bottom: number, isConnected = true) {
	return { isConnected, getBoundingClientRect: () => ({ top, bottom }) } as unknown as HTMLElement
}

describe('rowRegistry', () => {

	test('rect is undefined for unknown or disconnected rows', () => {
		// Arrange
		const sut = createRowRegistry()
		sut.set('chance', fakeRow(0, 10, false))

		// Act
		const unknown = sut.rect('aces')
		const disconnected = sut.rect('chance')

		// Assert
		expect(unknown).toBeUndefined()
		expect(disconnected).toBeUndefined()
	})

	test('rect returns the row box', () => {
		// Arrange
		const sut = createRowRegistry()
		sut.set('aces', fakeRow(10, 20))

		// Act
		const result = sut.rect('aces')

		// Assert
		expect(result?.top).toBe(10)
	})

	test('delete forgets the row', () => {
		// Arrange
		const sut = createRowRegistry()
		sut.set('aces', fakeRow(10, 20))

		// Act
		sut.delete('aces')

		// Assert
		expect(sut.rect('aces')).toBeUndefined()
	})

	test('span covers all visible rows', () => {
		// Arrange
		const sut = createRowRegistry()
		sut.set('aces', fakeRow(10, 20))
		sut.set('deuces', fakeRow(30, 45))
		sut.set('chance', fakeRow(0, 5, false))

		// Act
		const result = sut.span(['aces', 'deuces', 'chance'])

		// Assert
		expect(result).toEqual({ top: 10, bottom: 45 })
	})

	test('span is undefined when nothing is on screen', () => {
		// Arrange
		const sut = createRowRegistry()

		// Act
		const result = sut.span(['aces'])

		// Assert
		expect(result).toBeUndefined()
	})
})
