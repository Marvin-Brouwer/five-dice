import "./scoreCard.css";

import type { ScorePadAccessor } from '../../game/score/useScorePad';

import type { Component, Signal } from "solid-js";
import { PartOne } from './scoreCard.partOne';
import { PartTwo } from './scoreCard.partTwo';
import { Totals } from './scoreCard.totals';
import type { Accessor } from 'solid-js';

interface Props {
    round: Signal<number>,
    playerName: Accessor<string>,
    getScorePad: ScorePadAccessor
}

export const ScoreCard: Component<Props> = ({ playerName, round: [getRound], getScorePad: scorePad }) => {

    return (
        <section id="score-card" role="document">
            <aside role="banner">
                <span class="name">{playerName}</span>
                <span class="round-number">
                    <span class="round-label">Round</span>
                    {getRound}
                </span>
            </aside>
            <article id="part1" role="presentation">
                <PartOne scorePad={scorePad} />
            </article>
            <article id="part2" role="presentation">
                <PartTwo scorePad={scorePad} />
            </article>
            <article id="score" role="presentation">
                <Totals scorePad={scorePad} />
            </article>
        </section>
    );
}