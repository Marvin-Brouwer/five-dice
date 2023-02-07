import "./scoreCard.css";

import { useScorePad } from '../../game/score/useScorePad';

import type { Component } from "solid-js";
import { PartOne } from './scoreCard.partOne';
import { PartTwo } from './scoreCard.partTwo';
import { score, discard } from '../../game/score/score';
import { Totals } from './scoreCard.totals';
import { createSignal } from 'solid-js';

interface Props { }
const [round, setRound] = createSignal(1);
const [scorePad, applyScore] = useScorePad();

// TODO check scores with outliers (3 of a kind with 4 or 5 values)
applyScore({
    field: 'aces',
    score: score(1,2,4,1,4)
})
setRound((previous) => previous +1);
applyScore({
    field: 'threes',
    score: discard()
})
setRound((previous) => previous +1);
applyScore({
    field: 'threeOfKind',
    score: score(6,4,4,1,4)
})
setRound((previous) => previous +1);
applyScore({
    field: 'fourOfKind',
    score: score(5,5,5,5,3)
})
setRound((previous) => previous +1);
applyScore({
    field: 'fullHouse',
    score: score(5,5,5,3,3)
})
setRound((previous) => previous +1);
applyScore({
    field: 'smallStraight',
    score: score(1,2,3,4,2)
})
setRound((previous) => previous +1);
applyScore({
    field: 'largeStraight',
    score: score(6,5,4,3,2)
}) 
setRound((previous) => previous +1);
applyScore({
    field: 'flush',
    score: score(2,2,2,2,2), 
    discard: 'deuces'
})
setRound((previous) => previous +1);
applyScore({
    field: 'flush',
    score: score(2,2,2,2,2),
    discard: 'fours'
})
setRound((previous) => previous +1);
applyScore({
    field: 'flush',
    score: score(3,3,3,3,3),
    discard: 'fives'
})
setRound((previous) => previous +1);
applyScore({
    field: 'chance',
    score: score(3,3,4,3,3)
})
setRound((previous) => previous +1);

export const ScoreCard: Component<Props> = () => {

    return (
        <section id="score-card" role="document">
            <aside role="banner">
                <span class="name">Marvin</span>
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