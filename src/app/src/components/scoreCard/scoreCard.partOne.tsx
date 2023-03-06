import "./scoreCard.css";
import "./tablefix.d.ts";

import type { Component } from "solid-js";
import { dice, Dice } from '../../game/gameConstants';
import { NumberDie } from "../die/number-die";
import { RowDisplay } from './scoreCard.rowDisplay';
import type { ScorePadAccessor } from "../../game/score/useScorePad";

interface Props { 
    scorePad: ScorePadAccessor
}


export const PartOne: Component<Props> = ({ scorePad }) => {

    return (
        <table frame={1} border={1}>
            <thead>
                <tr>
                    <td class="sectionName label-column">Part one</td> <td class="roll-column">Roll</td> <td class="score-column">Score</td>
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
    
    const icon = <NumberDie amount={dice[field]} />;
    
    return (
        <RowDisplay icon={icon} field={field} scorePad={scorePad} />
    );
};