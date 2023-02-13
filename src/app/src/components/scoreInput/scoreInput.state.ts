import type { DieValue } from "../../game/gameConstants";
import { Accessor, createSignal } from 'solid-js';

export type ScoreInput = [
    one: DieValue | undefined, 
    two: DieValue | undefined, 
    three: DieValue | undefined, 
    four: DieValue | undefined ,
    five: DieValue | undefined
]
const createEmptyScore = () => ({
    score: [ undefined, undefined, undefined, undefined, undefined ] as ScoreInput,
    selectedField: 0 as keyof ScoreInput | undefined
})

export type ScoreInputState = {
    score: Accessor<ScoreInput>,
    allFieldsSet: Accessor<boolean>,
    reset: () => void,
    setScoreForField: (field: keyof ScoreInput, score: DieValue) => void,
    getScoreForField: (field: keyof ScoreInput) => DieValue | undefined,
    selectField: (field: keyof ScoreInput | undefined) => void,
    selectedField: Accessor<undefined | keyof ScoreInput>,
    isSelected: (field: keyof ScoreInput) => boolean,
    selectNextField: () => void,
}

export const createScoreInputState: () => ScoreInputState = () => {

    const [state, setState] = createSignal(createEmptyScore())

    const reset = () => {
        setState(createEmptyScore());
    };
    const allFieldsSet: ScoreInputState['allFieldsSet'] = () => state().score.every(value => value !== undefined);
    const setScoreForField: ScoreInputState['setScoreForField'] = (field, score) => {
        setState(previous => {

            const previousScore = [...previous.score] as ScoreInput
            (previousScore[field] as DieValue | undefined) = score;

            return ({
                ...previous,
                score: previousScore
            })
        })
    };
    const selectField: ScoreInputState['selectField'] = (field) => {
        setState(previous =>  ({
            ...previous,
            selectedField: field
        }));
    };
    const getScoreForField: ScoreInputState['getScoreForField'] = (field) => state().score[field] as DieValue | undefined;
    const isSelected: ScoreInputState['isSelected'] = (field) => state().selectedField === field;
    const selectNextField: ScoreInputState['selectNextField'] = () => setState(previousState => {
        const unsetIndex = previousState.score.indexOf(undefined);
        return {
            ...previousState,
            selectedField: unsetIndex === -1 ? undefined : unsetIndex
        }
    })
    return {
        score: () => state().score,
        selectedField: () => state().selectedField,
        reset,
        allFieldsSet,
        setScoreForField,
        getScoreForField,
        selectField,
        isSelected,
        selectNextField
    }
}