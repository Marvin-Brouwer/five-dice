import "./scoreCard.css";

import type { ScorePadAccessor } from '../../game/score/useScorePad';

import type { Component } from "solid-js";
import { PartOne } from './scoreCard.partOne';
import { PartTwo } from './scoreCard.partTwo';
import { Totals } from './scoreCard.totals';
import type { Accessor } from 'solid-js';

interface Props {
    round: Accessor<number>,
    playerName: Accessor<string>,
    scorePad: ScorePadAccessor
}

export const ScoreCard: Component<Props> = ({ playerName, round, scorePad }) => {

    return (
        <section id="score-card" role="document">
            <aside role="banner">
                <span class="name">{playerName}</span>
                <span class="round-number">
                    <span class="round-label">Round</span>
                    {round}
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