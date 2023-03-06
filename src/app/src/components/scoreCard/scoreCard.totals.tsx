import "./scoreCard.css";

import { Component, createMemo } from 'solid-js';
import type { ScorePadAccessor } from "../../game/score/useScorePad";
import { calculatePartOneSubTotal, calculateGameTotal, calculatePartOneBonus, calculatePartTwoTotal } from '../../game/score/scoreCalculator';

interface Props { 
    scorePad: ScorePadAccessor
}

export const Totals: Component<Props> = ({ scorePad }) => {

    // All of this needs to be memos to trigger updates
    const partOneSubTotal = createMemo(() => calculatePartOneSubTotal(scorePad()), scorePad);
    const bonus = createMemo(() => calculatePartOneBonus(partOneSubTotal()), partOneSubTotal);
    const partTwoTotal = createMemo(() => calculatePartTwoTotal(scorePad()), scorePad);
    const gameTotal = createMemo(
        () => calculateGameTotal(partOneSubTotal(), bonus(), partTwoTotal()),
        [partOneSubTotal(), bonus(), partTwoTotal()]
    );

    return (
        <table frame={1} border={1}>
            <thead>
                <tr>
                    <td class="sectionName label-column">Rounds total</td> <td class="totals-column">Score</td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="label-column">
                        <span class="label-display">Total part 1</span>
                    </td> 
                    <td class="totals-column">
                        <span class="score-display">{partOneSubTotal}</span>
                    </td>
                </tr>
                <tr>
                    <td class="label-column">
                        <span class="label-display">
                            Bonus
                            <span class="description-label responsive-description-label" aria-label="Adds 63 if part one ≥ 63">
                                <span class="short"> +35 if part1 ≥ 63</span>
                                <span class="long">Adds 63 if part one ≥ 63</span>
                            </span>
                        </span>
                    </td> 
                    <td class="totals-column">
                        <span class="score-display">{bonus() != 0 ? bonus : "."}</span>
                    </td>
                </tr>
                <tr>
                    <td class="label-column">
                        <span class="label-display">
                            Total part 2
                        </span>
                    </td> 
                    <td class="totals-column">
                        <span class="score-display">{partTwoTotal}</span>
                    </td>
                </tr>
                <tr>
                    <td class="label-column">
                        <span class="label-display">
                            Final score
                        </span>
                    </td> 
                    <td class="totals-column">
                        <span class="score-display">{gameTotal}</span>
                    </td>
                </tr>
            </tbody>
        </table>
    );
}