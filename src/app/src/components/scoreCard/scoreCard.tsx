import "./scoreCard.css";

import type { Component } from "solid-js";
import { useGameState } from "../../gameState/useGameState";
import { PartOne } from './scoreCard.partOne';
import type { PendingGameState, ActiveGameState, FinishedGameState } from '../../gameState/gameState';
import { score, discardedScore, FlushScore } from '../../gameState/gameScore';
import { PartTwo } from './scoreCard.partTwo';

interface Props { }

// TODO add player context
// TODO add socket context
// TODO add additional tests for new gamestates and chance

const _onGameStart = new Array<(gameState: PendingGameState) => void>();
const _onAdvance = new Array<(gameState: ActiveGameState) => void>();
const fakeSocket = {

    start: () => {
        _onGameStart[0](gameState() as PendingGameState);
    },

    onGameStart: (handler: (gameState: PendingGameState) => void) => {
        _onGameStart.push(handler);
    },
    onAdvance: (handler: (gameState: ActiveGameState) => void) => {
        _onAdvance.push(handler);
    },

    advance: (gameState: ActiveGameState) => { 
        console.log( gameState );
        _onAdvance[0](gameState as ActiveGameState);
    },
    sendGameEnd: (gameState: FinishedGameState) => { console.log( gameState )}

};
const [gameState, accessGameState] = useGameState({
    playerId: 123,
    players: new Set([123, 937])
}, fakeSocket)

// TODO check scores with outliers (3 of a kind with 4 or 5 values)
fakeSocket.start();
accessGameState.applyScore({
    field: 'aces',
    score: score(1,2,4,1,4)
})
fakeSocket.advance(gameState() as ActiveGameState);
fakeSocket.advance(gameState() as ActiveGameState);
accessGameState.applyScore({
    field: 'threes',
    score: discardedScore
})
fakeSocket.advance(gameState() as ActiveGameState);
fakeSocket.advance(gameState() as ActiveGameState);
accessGameState.applyScore({
    field: 'threeOfKind',
    score: score(6,4,4,1,4)
})
fakeSocket.advance(gameState() as ActiveGameState);
fakeSocket.advance(gameState() as ActiveGameState);
accessGameState.applyScore({
    field: 'fourOfKind',
    score: score(5,5,5,5,3)
})
fakeSocket.advance(gameState() as ActiveGameState);
fakeSocket.advance(gameState() as ActiveGameState);
accessGameState.applyScore({
    field: 'fullHouse',
    score: score(5,5,5,3,3)
})
fakeSocket.advance(gameState() as ActiveGameState);
fakeSocket.advance(gameState() as ActiveGameState);
accessGameState.applyScore({
    field: 'smallStraight',
    score: score(1,2,3,4,2)
})
fakeSocket.advance(gameState() as ActiveGameState);
fakeSocket.advance(gameState() as ActiveGameState);
accessGameState.applyScore({
    field: 'largeStraight',
    score: score(6,5,4,3,2)
}) 
fakeSocket.advance(gameState() as ActiveGameState);
fakeSocket.advance(gameState() as ActiveGameState);
accessGameState.applyScore({
    field: 'flush',
    score: new FlushScore(score(2,2,2,2,2), 'deuces')
})

fakeSocket.advance(gameState() as ActiveGameState);
fakeSocket.advance(gameState() as ActiveGameState);
accessGameState.applyScore({
    field: 'flush',
    score: new FlushScore(score(2,2,2,2,2), 'fours')
})
fakeSocket.advance(gameState() as ActiveGameState);
fakeSocket.advance(gameState() as ActiveGameState);
accessGameState.applyScore({
    field: 'flush',
    score: new FlushScore(score(3,3,3,3,3), 'fives')
})
fakeSocket.advance(gameState() as ActiveGameState);
fakeSocket.advance(gameState() as ActiveGameState);
accessGameState.applyScore({
    field: 'chance',
    score: score(3,3,4,3,3)
})

export const ScoreCard: Component<Props> = () => {

    return (
        <section id="score-card" role="document">
            <article id="part1" role="presentation">
                <PartOne gameState={gameState() as ActiveGameState} />
            </article>
            <article id="part2" role="presentation">
                <PartTwo gameState={gameState() as ActiveGameState} />
            </article>
            <article id="score" role="presentation">
                TODO: Total
            </article>
        </section>
    );
}