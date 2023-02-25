import "./scoreCard.scoreDisplay.css";

import type { Component, JSX } from "solid-js";
import type { ScoreField } from '../../game/gameConstants';
import { isDiscarded, ScoreContainer, isFlushScore, ScoreValue } from '../../game/score/score';
import { calculateFlush, calculateScore, calculateScoreForPad } from '../../game/score/scoreCalculator';
import type { ScorePadAccessor } from "../../game/score/useScorePad";

type Props = {
    field: ScoreField,
    scorePad: ScorePadAccessor
}

export const ScoreDisplay : Component<Props> = ({ field, scorePad }) => {
    const calculateScore = () => {
        const fieldScore = scorePad()[field];
        if (fieldScore === undefined) return ".";
        if (isDiscarded(fieldScore)) return "/";

        const score = calculateScoreForPad(scorePad(), field);
        if (score === 0) return ".";
        return score;   
    }

    return (
        <span class="score-display">
            {calculateScore()}
        </span>
    )
};

type SingleProps = {
    field: ScoreField,
    score: ScoreValue
    scorePad: ScorePadAccessor
}
export const SingleScoreDisplay : Component<SingleProps> = ({ field, score, scorePad }) => {
    const calculateActualScore = () => {
        if (score === undefined) return ".";
        if (isDiscarded(score)) return "/";

        if (field === 'flush') {
            const padFlush = scorePad()['flush'];
            const existingFlush = isDiscarded(padFlush) ? [] : padFlush;
            const flushScore = calculateFlush([...existingFlush, score]);
            if (flushScore === 0) return ".";
            return flushScore;   
        }

        const actualScore = calculateScore(score, field);
        if (actualScore === 0) return ".";
        return actualScore;   
    }

    return (
        <span class="score-display">
            <span>{calculateActualScore()}</span>
        </span>
    )
};