import { beforeEach, describe, expect, test } from 'vitest'

import { createInputFlowStore, type InputFlowStore } from '../../src/game/logic/input-flow-store.mts'
import type { DiceTuple } from '../../src/game/logic/gameConstants.ts'

const roll: DiceTuple = [1, 2, 3, 4, 5]

describe('inputFlowStore', () => {

	let flow: InputFlowStore
	beforeEach(() => { flow = createInputFlowStore() })

	test('starts closed and inactive', () => {
		expect(flow.value.step).toBe('closed')
		expect(flow.isActive()).toBe(false)
	})

	test('open moves to the dice step', () => {
		flow.open()

		expect(flow.value.step).toBe('dice')
		expect(flow.isActive()).toBe(true)
	})

	test('confirming a roll carries it to the row step', () => {
		flow.open()
		flow.toRow(roll)

		expect(flow.value.step).toBe('row')
		expect(flow.value.dice).toEqual(roll)
	})

	test('going back to the dice step keeps the roll', () => {
		flow.open()
		flow.toRow(roll)
		flow.backToDice()

		expect(flow.value.step).toBe('dice')
		expect(flow.value.dice).toEqual(roll)
	})

	test('the flush discard step remembers the chosen row', () => {
		flow.open()
		flow.toRow(roll)
		flow.toFlushDiscard('flush')

		expect(flow.value.step).toBe('flushDiscard')
		expect(flow.value.field).toBe('flush')
	})

	test('backing out of the flush discard forgets the chosen row', () => {
		flow.open()
		flow.toRow(roll)
		flow.toFlushDiscard('flush')
		flow.backToRow()

		expect(flow.value.step).toBe('row')
		expect(flow.value.field).toBeUndefined()
	})

	test('close clears the roll and the chosen row', () => {
		flow.open()
		flow.toRow(roll)
		flow.toFlushDiscard('flush')
		flow.close()

		expect(flow.value).toEqual({ step: 'closed', dice: undefined, field: undefined })
		expect(flow.isActive()).toBe(false)
	})

	test('reopening does not resurrect the previous roll', () => {
		flow.open()
		flow.toRow(roll)
		flow.close()
		flow.open()

		expect(flow.value.dice).toBeUndefined()
	})
})
