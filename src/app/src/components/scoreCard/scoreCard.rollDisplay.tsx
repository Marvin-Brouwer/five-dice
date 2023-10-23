import './scoreCard.rollDisplay.css';

import { ValidScore, ScoreContainer, isDiscarded, isFlushScore } from '../../game/score/score';
import type { Accessor, Component, JSX } from "solid-js";
import { Dice, dice, ScoreField } from '../../game/gameConstants';
import { sortFullHouse, sortSimpleScore, sortSomeOfKind, sortStraight } from "./scoreCard.sorter";
import { NumberDie } from "../die/number-die";
import { InvalidScoreError } from '../../game/score/invalidScoreError';
import { createMemo } from 'solid-js';

type Props = {
    score: Accessor<ScoreContainer | undefined>,
    field: ScoreField
}
export const RollDisplay: Component<Props> = ({ score, field }) => {

    const roll = createMemo(() => showRoll(score(), field), score);
    return (
        <span class='roll-display'><span>{roll()}</span></span>
    )
}

function showRoll(score: ScoreContainer | undefined, field: ScoreField) {

    if (score === undefined) return undefined;
    if (isDiscarded(score)) return (
        <span class="discard">/</span>
    );

    if (isFlushScore(score)) {
        if (field !== 'flush') throw InvalidScoreError.normalScoreCannotBeArray(score, field)
        return showFlush(score);
    }

    switch (field) {
        case 'aces': return showSingle(score, 'aces');
        case 'deuces': return showSingle(score, 'deuces');
        case 'threes': return showSingle(score, 'threes');
        case 'fours': return showSingle(score, 'fours');
        case 'fives': return showSingle(score, 'fives');
        case 'sixes': return showSingle(score, 'sixes');

        case "threeOfKind": return showSomeOfKind(score, 3);
        case "fourOfKind": return showSomeOfKind(score, 4);
        case 'fullHouse': return showFullHouse(score);
        case 'smallStraight': return showStraight(score);
        case 'largeStraight': return showStraight(score);
        case 'flush': return showFlush([score]);
        case 'chance': return showAll(score);
    }
}

function showSingle(score: ValidScore, die: Dice): JSX.Element {

    const [smallGroup, largeGroup] = sortSimpleScore(dice[die], score);

    return (<>
        <span class="smallGroup dim">{smallGroup.map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
        <span>{largeGroup.map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
    </>);
}

function showSomeOfKind(score: ValidScore, amount: number): JSX.Element {

    const [smallGroup, largeGroup] = sortSomeOfKind(amount, score);

    return (<>
        <span class="smallGroup">{smallGroup.map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
        <span>{largeGroup.map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
    </>);
}

function showFullHouse(score: ValidScore): JSX.Element {

    const [smallGroup, largeGroup] = sortFullHouse(score);

    return (<>
        <span class="smallGroup">{smallGroup.map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
        <span>{largeGroup.map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
    </>);
}

function showStraight(score: ValidScore): JSX.Element {

    const [smallGroup, largeGroup] = sortStraight(score);

    return (<>
        <span class="smallGroup">{smallGroup.map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
        <span>{largeGroup.map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
    </>);
}

function showFlush(score: ValidScore[]): JSX.Element {

    if (score.length === 0) return undefined;
    const plural = score.length > 1;
    const lastScore = score.reverse()?.[0];
    if (lastScore === undefined) return undefined;

    return (<>
        {plural && <span class="many">+{score.length -1}</span>}
        <span>{lastScore.map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
    </>);
}

function showAll(score: ValidScore): JSX.Element {

    return (<>
        <span>{score
            .map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
    </>);
}
