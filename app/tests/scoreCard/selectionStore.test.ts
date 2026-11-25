import { beforeEach, describe, expect, test } from 'vitest'

import { createSelectionStore, type SelectionStore } from '../../src/game/score-card/selection-store.mts'

describe('selectionStore', () => {

	let sut: SelectionStore
	beforeEach(() => { sut = createSelectionStore() })

	test('starts idle', () => {
		expect(sut.value.mode).toBe('none')
		expect(sut.value.targets).toEqual({})
		expect(sut.value.hover).toBeUndefined()
		expect(sut.value.preview).toBeUndefined()
		expect(sut.value.pinned).toBeUndefined()
	})

	test('begin opens a picker and resets hover and preview', () => {
		sut.setHover('aces')
		sut.begin('apply', { aces: 'valid', chance: 'discard' })

		expect(sut.value.mode).toBe('apply')
		expect(sut.value.targets).toEqual({ aces: 'valid', chance: 'discard' })
		expect(sut.value.hover).toBeUndefined()
		expect(sut.value.preview).toBeUndefined()
	})

	test('setHover tracks the hovered field', () => {
		sut.begin('apply', { aces: 'valid' })
		sut.setHover('aces')
		expect(sut.value.hover).toBe('aces')
		sut.setHover(undefined)
		expect(sut.value.hover).toBeUndefined()
	})

	test('setPreview and clearPreview manage the preview', () => {
		sut.begin('apply', { aces: 'valid' })
		sut.setPreview('aces', undefined)
		expect(sut.value.preview?.field).toBe('aces')
		sut.clearPreview()
		expect(sut.value.preview).toBeUndefined()
	})

	test('end restores the idle state', () => {
		sut.begin('discard', { chance: 'discard' })
		sut.setHover('chance')
		sut.end()

		expect(sut.value.mode).toBe('none')
		expect(sut.value.targets).toEqual({})
		expect(sut.value.hover).toBeUndefined()
	})
})
