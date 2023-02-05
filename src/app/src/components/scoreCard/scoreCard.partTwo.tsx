import "./scoreCard.css";

import type { Component } from "solid-js";
import type { ActiveGameState } from '../../gameState/gameState';
import type { Dice } from '../../gameState/gameConstants';
import { discardedScore, ScoreField, sortSomeOfKind, ValidScore, isDiscarded } from '../../gameState/gameScore';
import type { PlayerRound } from '../../gameState/gameState';
import { NumberDie } from "../die/number-die";

interface Props { 
    gameState: ActiveGameState
}

export const PartTwo: Component<Props> = ({ gameState }) => {

    const currentRound = gameState.rounds[gameState.currentRound][gameState.currentPlayer];
    if (currentRound === undefined) return undefined;

    return (
        <table>
            <thead>
                <tr>
                    <td class="sectionName">Part two</td> <td>Roll</td> <td>Score</td>
                </tr>
            </thead>
            <tbody>
                <SomeOfKindRow field='threeOfKind' currentRound={currentRound} />
                <SomeOfKindRow field='fourOfKind' currentRound={currentRound} />
            </tbody>
        </table>
    );
}

const labels: Record<Exclude<ScoreField, Dice>, string> = {
    'threeOfKind' : "Three of a kind",
    'fourOfKind' : "Four of a kind",
    'fullHouse' : "Full house",
    'smallStraight' : "Small straight",
    'largeStraight' : "Large straight",
    'flush' : "Flush",
    'chance' : "Chance",
}

type PartOneRowProps = {
    field: Extract<ScoreField, 'threeOfKind' | 'fourOfKind'>,
    currentRound: PlayerRound
}
const SomeOfKindRow : Component<PartOneRowProps> = ({ field, currentRound }) => {

    const amount = field === 'threeOfKind' ? 3 : 4;

    // This will be replaced by i8n anyway
    const displayLabel = () => labels[field];

    const displayRoll = () => {
        if (currentRound === undefined) return undefined;
        const fieldScore = currentRound.fields[field];
        if (fieldScore === undefined) return undefined;
        if (isDiscarded(fieldScore)) return (
            <span class="discard">/</span>
        );

        const [smallGroup, largeGroup] = sortSomeOfKind(amount, fieldScore);

        return (<>
            <span class="smallGroup">{smallGroup.map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
            <span>{largeGroup.map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
        </>);
    }

    const displayScore = () => {
        if (currentRound === undefined) return ".";
        const fieldScore = currentRound.fields[field];
        if (fieldScore === undefined) return ".";
        if (fieldScore === discardedScore) return "/";

        return (fieldScore as Array<number>)
            .reduce((accumulator, currentDie) => accumulator + currentDie, 0);
    }
    
    return (

        <tr>
            <td>
                {displayLabel}
            </td>
            <td>
                {displayRoll}
            </td>
            <td>
                {displayScore}
            </td>
        </tr>
    );
};