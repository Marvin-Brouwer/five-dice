import "./scoreCard.css";

import type { Component } from "solid-js";
import type { Dice } from '../../game/gameConstants';
import { NumberDie } from "../die/number-die";
import { RowDisplay } from './scoreCard.rowDisplay';
import { sortSomeOfKind, sortFullHouse, sortStraight } from './scoreCard.sorter';
import type { Accessor } from 'solid-js';
import type { ScorePad } from "../../game/score/scorePad";
import type { ScoreField } from '../../game/gameConstants';
import { isDiscarded } from '../../game/score/score';

interface Props { 
    scorePad: Accessor<Readonly<ScorePad>>
}

export const PartTwo: Component<Props> = ({ scorePad }) => {

    return (
        <table>
            <thead>
                <tr>
                    <td class="sectionName">Part two</td> <td>Roll</td> <td>Score</td>
                </tr>
            </thead>
            <tbody>
                <SomeOfKindRow field='threeOfKind' scorePad={scorePad} />
                <SomeOfKindRow field='fourOfKind' scorePad={scorePad} />
                <FullHouseRow scorePad={scorePad} />
                <SomeStraightRow field='smallStraight' scorePad={scorePad} />
                <SomeStraightRow field='largeStraight' scorePad={scorePad} />
                <FlushRow scorePad={scorePad} />
                <ChanceRow scorePad={scorePad} />
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

type SomeOfKindRowProps = Props & {
    field: Extract<ScoreField, 'threeOfKind' | 'fourOfKind'>
}
const SomeOfKindRow : Component<SomeOfKindRowProps> = ({ field, scorePad }) => {

    const amount = field === 'threeOfKind' ? 3 : 4;

    // This will be replaced by i8n anyway
    const displayLabel = () => labels[field];

    const displayRoll = () => {
        const fieldScore = scorePad()[field];
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
        const fieldScore = scorePad()[field];
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

type FullHouseRowProps = Props
const FullHouseRow : Component<FullHouseRowProps> = ({ scorePad }) => {

    const field = 'fullHouse';

    // This will be replaced by i8n anyway
    const displayLabel = () => labels[field];

    const displayRoll = () => {
        const fieldScore = scorePad()[field];
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
        const fieldScore = scorePad()[field];
        if (fieldScore === undefined) return ".";
        if (isDiscarded(fieldScore)) return "/";

        return 25;
    }
    
    return (
        <RowDisplay 
            displayLabel={displayLabel}  displayRoll={displayRoll}  displayScore={displayScore} />
    );
};


type SomeStraightRowProps = Props & {
    field: Extract<ScoreField, 'smallStraight' | 'largeStraight'>,
}
const SomeStraightRow : Component<SomeStraightRowProps> = ({ field, scorePad }) => {

    const amount = field === 'smallStraight' ? 4 : 5;
    const score = field === 'smallStraight' ? 30 : 40;

    // This will be replaced by i8n anyway
    const displayLabel = () => labels[field];

    const displayRoll = () => {
        const fieldScore = scorePad()[field];
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
        const fieldScore = scorePad()[field];
        if (fieldScore === undefined) return ".";
        if (isDiscarded(fieldScore)) return "/";

        return score;
    }
    
    return (
        <RowDisplay 
            displayLabel={displayLabel}  displayRoll={displayRoll}  displayScore={displayScore} />
    );
};

type FlushRowProps = Props
const FlushRow : Component<FlushRowProps> = ({ scorePad }) => {

    const field = 'flush';

    // This will be replaced by i8n anyway
    const displayLabel = () => labels[field];

    const displayRoll = () => {
        const fieldScore = scorePad()[field];
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
        const fieldScore = scorePad()[field];
        if (fieldScore === undefined) return ".";
        if (isDiscarded(fieldScore)) return "/";

        return 50 + (100 * (fieldScore.length -1));
    }
    
    return (
        <RowDisplay 
            displayLabel={displayLabel}  displayRoll={displayRoll}  displayScore={displayScore} />
    );
};

type ChanceRowProps = Props
const ChanceRow : Component<ChanceRowProps> = ({ scorePad }) => {

    const field = 'chance';

    // This will be replaced by i8n anyway
    const displayLabel = () => labels[field];

    const displayRoll = () => {
        const fieldScore = scorePad()[field];
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
        const fieldScore = scorePad()[field];
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