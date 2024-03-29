/**
 * This test is non-conventional.
 * It just makes is a lot less verbose
 */

import { expect, test, describe } from 'vitest'

import { isScoreApplicableToField } from '../../src/game/score/scoreFieldValidator'
import { generateRandomScores } from './gameScore.mjs'

const [pattern, allowedScores, disallowedScores] = generateRandomScores(
	'aaaab', 'aaaaa'
)

describe('scoreValidator', () => {

	describe(`fourOfKind ${pattern}`, () => {

		for(const score of allowedScores) {
			test.concurrent(`validTheory ${score}`, () => {

				// Arrange
				const sut = () => isScoreApplicableToField(score, 'fourOfKind')

				// Act
				const result = sut()

				// Assert
				expect(result).toBeTruthy()
			})
		}

		for(const score of disallowedScores) {
			test.concurrent(`inValidTheory ${score}`, () => {

				// Arrange
				const sut = () => isScoreApplicableToField(score, 'fourOfKind')

				// Act
				const result = sut()

				// Assert
				expect(result).toBeFalsy()
			})
		}
	})
})