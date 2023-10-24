/**
 * This test is non-conventional.
 * It just makes is a lot less verbose
 */

import { expect, test, describe } from 'vitest'

import { isScoreApplicableToField } from '../../src/game/score/scoreFieldValidator'
import { generateContainingScores } from './gameScore.mjs'
import { dice, Dice } from '../../src/game/gameConstants.js'

describe('scoreValidator', () => {

	describe('partOne', () => {

		testSection('aces')
		testSection('deuces')
		testSection('threes')
		testSection('fours')
		testSection('fives')
		testSection('sixes')
	})
})

function testSection(field: Dice) {
	test.concurrent(`partOne ${field}`, () => {

		const die = dice[field]
		const [allowedScores, disallowedScores] = generateContainingScores(die)

		for(const score of allowedScores) {
			test.concurrent(`validTheory ${score}`, () => {

				// Arrange
				const sut = () => isScoreApplicableToField(score, field)

				// Act
				const result = sut()

				// Assert
				expect(result).toBeTruthy()
			})
		}

		for(const score of disallowedScores) {
			test.concurrent(`inValidTheory ${score}`, () => {

				// Arrange
				const sut = () => isScoreApplicableToField(score, field)

				// Act
				const result = sut()

				// Assert
				expect(result).toBeFalsy()
			})
		}
	})
}