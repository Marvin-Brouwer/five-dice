import type { DieValue } from "../../game/gameConstants";
import { Accessor, createSignal, Setter, Signal } from 'solid-js';

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
    setScoreForField: (field: keyof ScoreInput, score: DieValue | undefined) => void,
    getScoreForField: (field: keyof ScoreInput) => DieValue | undefined,
    getSignalForField: (field: keyof ScoreInput) => Signal<DieValue | undefined>,
}

export const createScoreInputState: () => ScoreInputState = () => {

    const [state, setState] = createSignal(createEmptyScore(), { equals: false })

    const reset = () => {
        setState(createEmptyScore());
    };
    const allFieldsSet: ScoreInputState['allFieldsSet'] = () => state().score.every(value => value !== undefined);
    const setScoreForField: ScoreInputState['setScoreForField'] = (field, score) => {
        if (score === undefined) throw 't'
        setState(previous => {

            const newScore = [...previous.score] as ScoreInput
            (newScore[field] as DieValue | undefined) = score;

            return ({
                ...previous,
                score: newScore
            })
        })
    };
    const getScoreForField: ScoreInputState['getScoreForField'] = (field) => state().score[field] as DieValue | undefined;

    const getSignalForField: ScoreInputState['getSignalForField'] = (field) => {
        const accessorProxy = () => getScoreForField(field);
        const setterProxy = ((handler) => {
            const previousValue = getScoreForField(field);
            const newValue = typeof handler === 'function'
                ? handler(previousValue)
                : handler;
            return setScoreForField(field, newValue) as DieValue | undefined;
        }) as Setter<DieValue | undefined>

        return [accessorProxy, setterProxy];
    }
    return {
        score: () => state().score,
        reset,
        allFieldsSet,
        setScoreForField,
        getScoreForField,
        getSignalForField
    }
}