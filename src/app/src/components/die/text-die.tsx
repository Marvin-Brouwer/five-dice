import "./die.css";
import "./text-die.css";

import type { Component } from "solid-js";

interface Props {
    value: string | Element,
    description?: string,
    tabindex?: number 
}

export const TextDie : Component<Props> = ({ value, description, tabindex }) => (
    <span class="die" aria-valuetext={description} tabindex={tabindex?.toString()}>
        <span class="text">{value}</span>
    </span>
);