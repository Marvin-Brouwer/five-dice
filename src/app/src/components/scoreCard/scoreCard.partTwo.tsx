import "./scoreCard.css";

import type { Component } from "solid-js";
import { RowDisplay } from './scoreCard.rowDisplay';
import type { ScorePadAccessor } from '../../game/score/useScorePad';

interface Props { 
    scorePad: ScorePadAccessor
}

export const PartTwo: Component<Props> = ({ scorePad }) => {

    return (
        <table frame={1} border={1}>
            <thead>
                <tr>
                <td class="sectionName label-column">Part two</td> <td class="roll-column">Roll</td> <td class="score-column">Score</td>
                </tr>
            </thead>
            <tbody>
                <RowDisplay field="threeOfKind" scorePad={scorePad} />
                <RowDisplay field="fourOfKind" scorePad={scorePad} />
                <RowDisplay field="fullHouse" scorePad={scorePad} />
                <RowDisplay field="smallStraight" scorePad={scorePad} />
                <RowDisplay field="largeStraight" scorePad={scorePad} />
                <RowDisplay field="flush" scorePad={scorePad} />
                <RowDisplay field="chance" scorePad={scorePad} />
            </tbody>
        </table>
    );
}