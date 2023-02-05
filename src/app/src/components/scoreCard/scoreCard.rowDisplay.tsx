import "./scoreCard.css";

import type { Accessor, Component, JSX } from "solid-js";

type Props = {
    displayLabel: Accessor<string | undefined | JSX.Element>,
    displayRoll: Accessor<string | undefined | JSX.Element>,
    displayScore: Accessor<string | undefined | JSX.Element>,
}

export const RowDisplay : Component<Props> = ({ displayLabel, displayRoll, displayScore }) => {

    return (

        <tr>
            <td>
                {displayLabel}
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