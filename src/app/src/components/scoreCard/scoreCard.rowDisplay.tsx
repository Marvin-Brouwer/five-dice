import "./scoreCard.css";

import type { Accessor, Component, JSX } from "solid-js";
import type { ScoreField } from '../../game/gameConstants';
import { isDiscarded } from '../../game/score/score';
import { calculateScore } from '../../game/score/scoreCalculator';
import type { ScorePadAccessor } from "../../game/score/useScorePad";

type Props = {
    icon?: JSX.Element;
    field: ScoreField,
    scorePad: ScorePadAccessor,
    displayRoll: Accessor<string | undefined | JSX.Element>
}


const labels: Record<ScoreField, string> = {
    'aces': "Aces",
    'deuces': "Deuces",
    'threes': "Threes",
    'fours': "Fours",
    'fives': "Fives",
    'sixes': "Sixes",

    'threeOfKind' : "Three of a kind",
    'fourOfKind' : "Four of a kind",
    'fullHouse' : "Full house",
    'smallStraight' : "Small straight",
    'largeStraight' : "Large straight",
    'flush' : "Flush",
    'chance' : "Chance",
};

export const RowDisplay : Component<Props> = ({ icon, field, scorePad, displayRoll }) => {

    const displayScore = () => {
        const fieldScore = scorePad()[field];
        if (fieldScore === undefined) return ".";
        if (isDiscarded(fieldScore)) return "/";

        return calculateScore(scorePad(), field);
    }

    return (
        <tr>
            <td>
                {icon}{labels[field]}
            </td>
            <td>
                {displayRoll}
            </td>
            <td>
                {displayScore}
            </td>
        </tr>
    );
};