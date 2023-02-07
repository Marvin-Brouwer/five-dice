import "./scoreCard.css";

import type { Accessor, Component, JSX } from "solid-js";
import type { ScoreField } from '../../game/gameConstants';
import { isDiscarded } from '../../game/score/score';
import { calculateScore } from '../../game/score/scoreCalculator';
import type { ScorePadAccessor } from "../../game/score/useScorePad";
import { rowDisplayLabels } from './scoreCard.rowDisplay.labels';

type Props = {
    icon?: JSX.Element;
    field: ScoreField,
    scorePad: ScorePadAccessor,
    displayRoll: Accessor<string | undefined | JSX.Element>
}

export const RowDisplay : Component<Props> = ({ icon, field, scorePad, displayRoll }) => {

    const displayScore = () => {
        const fieldScore = scorePad()[field];
        if (fieldScore === undefined) return ".";
        if (isDiscarded(fieldScore)) return "/";

        return calculateScore(scorePad(), field);
    }

    return (
        <tr>
            <td class="label-column">
                {icon}{rowDisplayLabels[field].title}
                <ScoreLabel field={field} />
            </td>
            <td class="roll-column">
                {displayRoll}
            </td>
            <td class="score-column">
                {displayScore}
            </td>
        </tr>
    );
};

type ScoreDescriptionProps = {
    field: ScoreField
}
const ScoreLabel: Component<ScoreDescriptionProps> = ({ field }) => {

    if (rowDisplayLabels[field].scoreDescription.short === undefined) return (
        <span class="score-display simple-score-display">
            {rowDisplayLabels[field].scoreDescription.long}
        </span>
    )

    const { short, long } = rowDisplayLabels[field].scoreDescription;

    return (
        <span class="score-display responsive-score-display" aria-label={long}>
            <span class="short">{short}</span>
            <span class="long">{long}</span>
        </span>
    )
}