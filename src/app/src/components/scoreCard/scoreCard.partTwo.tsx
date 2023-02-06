import "./scoreCard.css";

import type { Component } from "solid-js";
import { NumberDie } from "../die/number-die";
import { RowDisplay } from './scoreCard.rowDisplay';
import { sortSomeOfKind, sortFullHouse, sortStraight } from './scoreCard.sorter';
import type { ScoreField } from '../../game/gameConstants';
import { isDiscarded } from '../../game/score/score';
import type { ScorePadAccessor } from '../../game/score/useScorePad';

interface Props { 
    scorePad: ScorePadAccessor
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

type SomeOfKindRowProps = Props & {
    field: Extract<ScoreField, 'threeOfKind' | 'fourOfKind'>
}
const SomeOfKindRow : Component<SomeOfKindRowProps> = ({ field, scorePad }) => {

    const amount = field === 'threeOfKind' ? 3 : 4;

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
    
    return (
        <RowDisplay field={field} scorePad={scorePad} displayRoll={displayRoll} />
    );
};

type FullHouseRowProps = Props
const FullHouseRow : Component<FullHouseRowProps> = ({ scorePad }) => {

    const field = 'fullHouse';

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
    
    return (
        <RowDisplay field={field} scorePad={scorePad} displayRoll={displayRoll} />
    );
};


type SomeStraightRowProps = Props & {
    field: Extract<ScoreField, 'smallStraight' | 'largeStraight'>,
}
const SomeStraightRow : Component<SomeStraightRowProps> = ({ field, scorePad }) => {

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
    
    return (
        <RowDisplay field={field} scorePad={scorePad} displayRoll={displayRoll} />
    );
};

type FlushRowProps = Props
const FlushRow : Component<FlushRowProps> = ({ scorePad }) => {

    const field = 'flush';

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
    
    return (
        <RowDisplay field={field} scorePad={scorePad} displayRoll={displayRoll} />
    );
};

type ChanceRowProps = Props
const ChanceRow : Component<ChanceRowProps> = ({ scorePad }) => {

    const field = 'chance';

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
    
    return (
        <RowDisplay field={field} scorePad={scorePad} displayRoll={displayRoll} />
    );
};