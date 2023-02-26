import type { Component } from "solid-js";
import { calculateFace, } from "./die";
import { DieRow } from './die-row';

interface Props {
    amount: Parameters<typeof calculateFace>[0]
}

export const DieFace : Component<Props> = ({ amount }) => {
    
    const face = calculateFace(amount);

    return (
        <span class="face">
            <DieRow face={face} rowName="top" />
            <DieRow face={face} rowName="middle" />
            <DieRow face={face} rowName="bottom" />
        </span>
    );
}