export const roundAmount = 13

export type Dice = 'aces' | 'deuces' | 'threes' | 'fours' | 'fives' | 'sixes'
export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;
export const dice: Record<Dice, DieValue> = { 
	aces: 1,
	deuces: 2,
	threes: 3,
	fours: 4,
	fives: 5,
	sixes: 6
}

export type ScoreField = 
  | Dice 
  | 'threeOfKind' | 'fourOfKind' | 'fullHouse' | 'smallStraight' | 'largeStraight' | 'flush' | 'chance';
  