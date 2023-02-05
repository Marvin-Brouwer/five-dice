import "./die.css";
import "./number-die.css";

import { DieFace } from "./die-face";
import type { DieValue } from "../../gameState/gameConstants";
import type { Component } from 'solid-js';

interface Props {
    amount: DieValue,
    description?: string,
    tabindex?: number 
}

export const NumberDie : Component<Props> = ({ amount, description, tabindex }) => (
    <span class="die" data-amount={amount} tabindex={tabindex?.toString()}
        aria-role="article"
        aria-valuetext={amount.toString()}
        aria-label={description || `${amount}-die,`}
        aria-details={description || `A die displaying ${amount} dot${amount !==1 ? 's' : ''} on its face`}
    >
        <DieFace amount={amount} />
        <span class="value" aria-hidden="true">{amount}</span>
    </span>
)