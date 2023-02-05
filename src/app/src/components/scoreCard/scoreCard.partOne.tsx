import "./scoreCard.css";

import type { Component } from "solid-js";
import type { ActiveGameState } from '../../gameState/gameState';
import { dice, Dice } from '../../gameState/gameConstants';
import { discardedScore, isDiscarded } from '../../gameState/gameScore';
import type { PlayerRound } from '../../gameState/gameState';
import { NumberDie } from "../die/number-die";
import { RowDisplay } from './scoreCard.rowDisplay';
import { sortSimpleScore } from './scoreCard.sorter';

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
    const displayLabel = () => (<>
        <NumberDie amount={dice[field]} />{" "} {labels[field]}
    </>);

    const displayRoll = () => {
        if (currentRound === undefined) return undefined;
        const fieldScore = currentRound.fields[field];
        if (fieldScore === undefined) return undefined;
        if (isDiscarded(fieldScore)) return (
            <span class="discard">/</span>
        );

        const [smallGroup, largeGroup] = sortSimpleScore(dice[field], fieldScore);

        return (<>
            <span class="smallGroup dim">{smallGroup.map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
            <span>{largeGroup.map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
        </>);
    }

    const displayScore = () => {
        if (currentRound === undefined) return ".";
        const fieldScore = currentRound.fields[field];
        if (fieldScore === undefined) return ".";
        if (isDiscarded(fieldScore)) return "/";

        const targetDice =  fieldScore.filter(value => value === dice[field]!)?.length;
        return targetDice * dice[field];
    }
    
    return (
        <RowDisplay 
            displayLabel={displayLabel} displayRoll={displayRoll} displayScore={displayScore} />
    );
};