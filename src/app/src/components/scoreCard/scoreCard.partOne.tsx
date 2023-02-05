import "./scoreCard.css";

import type { Component } from "solid-js";
import type { ActiveGameState } from '../../gameState/gameState';
import { dice, Dice, DieValue } from '../../gameState/gameConstants';
import { discardedScore } from '../../gameState/gameScore';
import type { PlayerRound } from '../../gameState/gameState';

interface Props { 
    gameState: ActiveGameState
}

export const PartOne: Component<Props> = ({ gameState }) => {

    const currentRound = gameState.rounds[gameState.currentRound][gameState.currentPlayer];
    if (currentRound === undefined) return undefined;

    return (
        <table>
            <thead>
                <tr>
                    <td class="sectionName">Part one</td> <td>Roll</td> <td>Score</td>
                </tr>
            </thead>
            <tbody>
                <PartOneRow field="aces" currentRound={currentRound} />
                <PartOneRow field="deuces" currentRound={currentRound} />
                <PartOneRow field="threes" currentRound={currentRound} />
                <PartOneRow field="fours" currentRound={currentRound} />
                <PartOneRow field="fives" currentRound={currentRound} />
                <PartOneRow field="sixes" currentRound={currentRound} />
            </tbody>
        </table>
    );
}

// TODO Replace with dice component
const NumberDie : Component<{
    amount: DieValue,
    description?: string,
    tabindex?: number 
}> = ({ }) => (
    <>{/* TODO import dice component */}</>
)

const labels: Record<Dice, string> = {
    'aces': "Aces",
    'deuces': "Deuces",
    'threes': "Threes",
    'fours': "Fours",
    'fives': "Fives",
    'sixes': "Sixes"
}

type PartOneRowProps = {
    field: Dice,
    currentRound: PlayerRound
}
const PartOneRow : Component<PartOneRowProps> = ({ field, currentRound }) => {

    // This will be replaced by i8n anyway
    const displayLabel = () => labels[field];

    const displayRoll = () => {
        if (currentRound === undefined) return undefined;
        const fieldScore = currentRound.fields[field];
        if (fieldScore === undefined) return undefined;
        if (fieldScore === discardedScore) return "/";

        return `[ ${fieldScore.join(' ')} ]`;
    }

    const displayScore = () => {
        if (currentRound === undefined) return ".";
        const fieldScore = currentRound.fields[field];
        if (fieldScore === undefined) return ".";
        if (fieldScore === discardedScore) return "/";

        const targetDice =  fieldScore.filter(value => value === dice[field]!)?.length;
        return targetDice * dice[field];
    }
    
    return (

        <tr>
            <td>
                <NumberDie amount={dice['aces']} />
                {displayLabel}
            </td>
            <td>
                {/* TODO create score component */}
                {displayRoll}
            </td>
            <td>
                {displayScore}
            </td>
        </tr>
    );
};