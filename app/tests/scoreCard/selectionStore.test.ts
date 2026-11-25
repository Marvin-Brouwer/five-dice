import { beforeEach, describe, expect, test } from 'vitest'

import { createSelectionStore, type SelectionStore } from '../../src/game/score-card/selection-store.mts'

describe('selectionStore', () => {

	let sut: SelectionStore
	beforeEach(() => { sut = createSelectionStore() })

	test('starts idle', () => {
		// Arrange

		// Act
		const result = sut.value

		// Assert
		expect(result.mode).toBe('none')
		expect(result.targets).toEqual({})
		expect(result.hover).toBeUndefined()
		expect(result.preview).toBeUndefined()
		expect(result.pinned).toBeUndefined()
	})

	test('begin opens a picker and resets hover and preview', () => {
		// Arrange
		sut.setHover('aces')

		// Act
		sut.begin('apply', { aces: 'valid', chance: 'discard' })

		// Assert
		expect(sut.value.mode).toBe('apply')
		expect(sut.value.targets).toEqual({ aces: 'valid', chance: 'discard' })
		expect(sut.value.hover).toBeUndefined()
		expect(sut.value.preview).toBeUndefined()
	})

	test('setHover tracks the hovered field', () => {
		// Arrange
		sut.begin('apply', { aces: 'valid' })

		// Act
		sut.setHover('aces')

		// Assert
		expect(sut.value.hover).toBe('aces')
	})

	test('setHover with undefined clears the hovered field', () => {
		// Arrange
		sut.begin('apply', { aces: 'valid' })
		sut.setHover('aces')

		// Act
		sut.setHover(undefined)

		// Assert
		expect(sut.value.hover).toBeUndefined()
	})

	test('setPreview sets the preview', () => {
		// Arrange
		sut.begin('apply', { aces: 'valid' })

		// Act
		sut.setPreview('aces', undefined)

		// Assert
		expect(sut.value.preview?.field).toBe('aces')
	})

	test('clearPreview removes the preview', () => {
		// Arrange
		sut.begin('apply', { aces: 'valid' })
		sut.setPreview('aces', undefined)

		// Act
		sut.clearPreview()

		// Assert
		expect(sut.value.preview).toBeUndefined()
	})

	test('end restores the idle state', () => {
		// Arrange
		sut.begin('discard', { chance: 'discard' })
		sut.setHover('chance')

		// Act
		sut.end()

		// Assert
		expect(sut.value.mode).toBe('none')
		expect(sut.value.targets).toEqual({})
		expect(sut.value.hover).toBeUndefined()
	})
})
