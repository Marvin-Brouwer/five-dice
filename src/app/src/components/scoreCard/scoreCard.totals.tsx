import "./scoreCard.css";

import type { Component } from "solid-js";
import type { ScorePadAccessor } from "../../game/score/useScorePad";
import { calculatePartOneSubTotal, calculateGameTotal, calculatePartOneBonus, calculatePartTwoTotal } from '../../game/score/scoreCalculator';

interface Props { 
    scorePad: ScorePadAccessor
}

export const Totals: Component<Props> = ({ scorePad }) => {

    const partOneSubTotal = calculatePartOneSubTotal(scorePad());
    const bonus = calculatePartOneBonus(partOneSubTotal);
    const partTwoTotal = calculatePartTwoTotal(scorePad());
    const gameTotal = calculateGameTotal(partOneSubTotal, bonus, partTwoTotal)

    return (
        <table>
            <thead>
                <tr>
                    <td class="sectionName label-column">Rounds total</td> <td class="totals-column">Score</td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="label-column">Total part 1</td> <td class="totals-column">{partOneSubTotal}</td>
                </tr>
                <tr>
                    <td class="label-column">
                        Bonus
                        <span class="score-display responsive-score-display" aria-label="Adds 63 if part one ≥ 63">
                            <span class="short"> +35 if part1 ≥ 63</span>
                            <span class="long">Adds 63 if part one ≥ 63</span>
                        </span>
                    </td> 
                    <td class="totals-column">
                        {bonus != 0 ? bonus : "."}
                    </td>
                </tr>
                <tr>
                    <td class="label-column">Total part 2</td> <td class="totals-column">{partTwoTotal}</td>
                </tr>
                <tr>
                    <td class="label-column">Final score</td> <td class="totals-column">{gameTotal}</td>
                </tr>
            </tbody>
        </table>
    );
}