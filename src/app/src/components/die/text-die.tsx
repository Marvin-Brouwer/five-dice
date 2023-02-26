import "./die.css";
import "./text-die.css";

import type { Component, ParentProps } from "solid-js";

interface Props {
    value: string | Element,
    label: string,
    tabindex?: number 
}

export const TextDie : Component<Props> = ({ value, label, tabindex }) => (
    <span class="die" aria-valuetext={label} tabindex={tabindex?.toString()}>
        <span class="text">{value}</span>
    </span>
);