/**
 * This test is non-conventional.
 * It just makes is a lot less verbose
 */

import { expect, test, describe } from 'vitest'

import { isScoreApplicableToField } from '../../src/game/score/scoreFieldValidator'
import { generateRandomScores } from './gameScore.mjs'
import { score } from '../../src/game/score/score'

const [pattern, allowedScores, disallowedScores] = generateRandomScores(
	'12345', '23456'
)

describe('scoreValidator', () => {

	describe('test-cases', () => {

		test.concurrent('86-large-staight-is-also-incorrect [13456]', () => {

			// Arrange
			const testScore = score([1, 3, 4, 5, 6])
			const sut = () => isScoreApplicableToField(testScore, 'largeStraight')

			// Act
			const result = sut()

			// Assert
			expect(result).toBeFalsy()
		})
	})

	describe(`largeStraight ${pattern}`, () => {

		for(const score of allowedScores) {
			test.concurrent(`validTheory ${score}`, () => {

				// Arrange
				const sut = () => isScoreApplicableToField(score, 'largeStraight')

				// Act
				const result = sut()

				// Assert
				expect(result).toBeTruthy()
			})
		}

		for(const score of disallowedScores) {
			test.concurrent(`inValidTheory ${score}`, () => {

				// Arrange
				const sut = () => isScoreApplicableToField(score, 'largeStraight')

				// Act
				const result = sut()

				// Assert
				expect(result).toBeFalsy()
			})
		}
	})
})