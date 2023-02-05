import "./scoreCard.css";

import type { Component } from "solid-js";
import { useGameState } from "../../gameState/useGameState";
import { PartOne } from './scoreCard.partOne';
import type { PendingGameState, ActiveGameState, FinishedGameState } from '../../gameState/gameState';
import { score, discardedScore } from '../../gameState/gameScore';

interface Props { }

// TODO add player context
// TODO add socket context
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

export const ScoreCard: Component<Props> = () => {

    return (
        <section id="score-card" role="document">
            <article id="part1" role="presentation">
                <PartOne gameState={gameState() as ActiveGameState} />
            </article>
            <article id="part2" role="presentation">
                TODO: Part 2
            </article>
            <article id="score" role="presentation">
                TODO: Total
            </article>
        </section>
    );
}