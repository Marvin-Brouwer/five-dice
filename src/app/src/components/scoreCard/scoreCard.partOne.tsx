import "./scoreCard.css";

import type { Accessor, Component } from "solid-js";
import { dice, Dice } from '../../game/gameConstants';
import type { ScorePad } from '../../game/score/scorePad';
import { NumberDie } from "../die/number-die";
import { RowDisplay } from './scoreCard.rowDisplay';
import { sortSimpleScore } from './scoreCard.sorter';
import { isDiscarded } from '../../game/score/score';

interface Props { 
    scorePad: Accessor<Readonly<ScorePad>>
}

export const PartOne: Component<Props> = ({ scorePad }) => {

    return (
        <table>
            <thead>
                <tr>
                    <td class="sectionName">Part one</td> <td>Roll</td> <td>Score</td>
                </tr>
            </thead>
            <tbody>
                <PartOneRow field="aces" scorePad={scorePad} />
                <PartOneRow field="deuces" scorePad={scorePad} />
                <PartOneRow field="threes" scorePad={scorePad} />
                <PartOneRow field="fours" scorePad={scorePad} />
                <PartOneRow field="fives" scorePad={scorePad} />
                <PartOneRow field="sixes" scorePad={scorePad} />
            </tbody>
        </table>
    );
}

const labels: Record<Dice, string> = {
    'aces': "Aces",
    'deuces': "Deuces",
    'threes': "Threes",
    'fours': "Fours",
    'fives': "Fives",
    'sixes': "Sixes"
}

type PartOneRowProps = Props & {
    field: Dice
}
const PartOneRow : Component<PartOneRowProps> = ({ field, scorePad }) => {

    // This will be replaced by i8n anyway
    const displayLabel = () => (<>
        <NumberDie amount={dice[field]} />{" "} {labels[field]}
    </>);

    const displayRoll = () => {
        const fieldScore = scorePad()[field];
        if (fieldScore === undefined) return undefined;
        if (isDiscarded(fieldScore)) return (
            <span class="discard">/</span>
        );

        const [smallGroup, largeGroup] = sortSimpleScore(dice[field], fieldScore);

        return (<>
            <span class="smallGroup dim">{smallGroup.map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
            <span>{largeGroup.map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
        </>);
    }

    const displayScore = () => {
        const fieldScore = scorePad()[field];
        if (fieldScore === undefined) return ".";
        if (isDiscarded(fieldScore)) return "/";

        const targetDice =  fieldScore.filter(value => value === dice[field]!)?.length;
        return targetDice * dice[field];
    }
    
    return (
        <RowDisplay 
            displayLabel={displayLabel} displayRoll={displayRoll} displayScore={displayScore} />
    );
};