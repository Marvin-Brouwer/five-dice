import "./die.css";
import "./text-die.css";

import type { Component } from "solid-js";

interface Props {
    value: string,
    tabindex?: number 
}

export const TextDie : Component<Props> = ({ value, tabindex }) => (
    <span class="die" aria-valuetext={value} tabindex={tabindex?.toString()}>
        <span class="text">{value}</span>
    </span>
);