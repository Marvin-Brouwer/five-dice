import "./scoreCard.css";

import type { Component } from "solid-js";
import type { ActiveGameState } from '../../gameState/gameState';
import type { Dice, DieValue } from '../../gameState/gameConstants';
import { discardedScore, ScoreField, isDiscarded } from '../../gameState/gameScore';
import type { PlayerRound } from '../../gameState/gameState';
import { NumberDie } from "../die/number-die";
import { RowDisplay } from './scoreCard.rowDisplay';
import { sortSomeOfKind, sortFullHouse, sortStraight } from './scoreCard.sorter';

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
                <FullHouseRow currentRound={currentRound} />
                <SomeStraightRow field='smallStraight' currentRound={currentRound} />
                <SomeStraightRow field='largeStraight' currentRound={currentRound} />
                <FlushRow currentRound={currentRound} />
                <ChanceRow currentRound={currentRound} />
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

type SomeOfKindRowProps = {
    field: Extract<ScoreField, 'threeOfKind' | 'fourOfKind'>,
    currentRound: PlayerRound
}
const SomeOfKindRow : Component<SomeOfKindRowProps> = ({ field, currentRound }) => {

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
        if (isDiscarded(fieldScore)) return "/";

        return fieldScore
            .reduce((accumulator, currentDie) => accumulator + currentDie, 0);
    }
    
    return (
        <RowDisplay 
            displayLabel={displayLabel}  displayRoll={displayRoll}  displayScore={displayScore} />
    );
};

type FullHouseRowProps = {
    currentRound: PlayerRound
}
const FullHouseRow : Component<FullHouseRowProps> = ({ currentRound }) => {

    const field = 'fullHouse';

    // This will be replaced by i8n anyway
    const displayLabel = () => labels[field];

    const displayRoll = () => {
        if (currentRound === undefined) return undefined;
        const fieldScore = currentRound.fields[field];
        if (fieldScore === undefined) return undefined;
        if (isDiscarded(fieldScore)) return (
            <span class="discard">/</span>
        );

        const [smallGroup, largeGroup] = sortFullHouse(fieldScore);

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

        return 25;
    }
    
    return (
        <RowDisplay 
            displayLabel={displayLabel}  displayRoll={displayRoll}  displayScore={displayScore} />
    );
};


type SomeStraightRowProps = {
    field: Extract<ScoreField, 'smallStraight' | 'largeStraight'>,
    currentRound: PlayerRound
}
const SomeStraightRow : Component<SomeStraightRowProps> = ({ field, currentRound }) => {

    const amount = field === 'smallStraight' ? 4 : 5;
    const score = field === 'smallStraight' ? 30 : 40;

    // This will be replaced by i8n anyway
    const displayLabel = () => labels[field];

    const displayRoll = () => {
        if (currentRound === undefined) return undefined;
        const fieldScore = currentRound.fields[field];
        if (fieldScore === undefined) return undefined;
        if (isDiscarded(fieldScore)) return (
            <span class="discard">/</span>
        );

        const [smallGroup, largeGroup] = sortStraight(fieldScore);

        return (<>
            <span class="smallGroup">{smallGroup.map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
            <span>{largeGroup.map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
        </>);
    }

    const displayScore = () => {
        if (currentRound === undefined) return ".";
        const fieldScore = currentRound.fields[field];
        if (fieldScore === undefined) return ".";
        if (isDiscarded(fieldScore)) return "/";

        return score;
    }
    
    return (
        <RowDisplay 
            displayLabel={displayLabel}  displayRoll={displayRoll}  displayScore={displayScore} />
    );
};

type FlushRowProps = {
    currentRound: PlayerRound
}
const FlushRow : Component<FlushRowProps> = ({ currentRound }) => {

    const field = 'flush';

    // This will be replaced by i8n anyway
    const displayLabel = () => labels[field];

    const displayRoll = () => {
        if (currentRound === undefined) return undefined;
        const fieldScore = currentRound.fields[field];
        if (fieldScore === undefined) return undefined;
        if (isDiscarded(fieldScore)) return (
            <span class="discard">/</span>
        );

        const plural = fieldScore.length > 1;
        const lastScore = fieldScore.reverse()?.[0];
        if (lastScore === undefined) return undefined;
        
        return (<>
            <span>{lastScore.map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
            {plural && <span class="many">+{fieldScore.length -1}</span>}
        </>);
    }

    const displayScore = () => {
        if (currentRound === undefined) return ".";
        const fieldScore = currentRound.fields[field];
        if (fieldScore === undefined) return ".";
        if (isDiscarded(fieldScore)) return "/";

        return 50 + (100 * (fieldScore.length -1));
    }
    
    return (
        <RowDisplay 
            displayLabel={displayLabel}  displayRoll={displayRoll}  displayScore={displayScore} />
    );
};

type ChanceRowProps = {
    currentRound: PlayerRound
}
const ChanceRow : Component<ChanceRowProps> = ({ currentRound }) => {

    const field = 'chance';

    // This will be replaced by i8n anyway
    const displayLabel = () => labels[field];

    const displayRoll = () => {
        if (currentRound === undefined) return undefined;
        const fieldScore = currentRound.fields[field];
        if (fieldScore === undefined) return undefined;
        if (isDiscarded(fieldScore)) return (
            <span class="discard">/</span>
        );
        
        return (<>
            <span>{fieldScore
                .map(scoreDie => (<NumberDie amount={scoreDie} />))}</span>
        </>);
    }

    const displayScore = () => {
        if (currentRound === undefined) return ".";
        const fieldScore = currentRound.fields[field];
        if (fieldScore === undefined) return ".";
        if (isDiscarded(fieldScore)) return "/";

        return fieldScore
            .reduce((reducer, die) => reducer + die, 0);
    }
    
    return (
        <RowDisplay 
            displayLabel={displayLabel}  displayRoll={displayRoll}  displayScore={displayScore} />
    );
};