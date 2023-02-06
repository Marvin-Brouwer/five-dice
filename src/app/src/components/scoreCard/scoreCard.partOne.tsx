import "./scoreCard.css";

import type { Component } from "solid-js";
import { dice, Dice } from '../../game/gameConstants';
import { NumberDie } from "../die/number-die";
import { RowDisplay } from './scoreCard.rowDisplay';
import { sortSimpleScore } from './scoreCard.sorter';
import { isDiscarded } from '../../game/score/score';
import type { ScorePadAccessor } from "../../game/score/useScorePad";

interface Props { 
    scorePad: ScorePadAccessor
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

type PartOneRowProps = Props & {
    field: Dice
}
const PartOneRow : Component<PartOneRowProps> = ({ field, scorePad }) => {

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
    
    const icon = <NumberDie amount={dice[field]} />;
    
    return (
        <RowDisplay icon={icon} field={field} scorePad={scorePad} displayRoll={displayRoll} />
    );
};