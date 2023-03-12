import type { DieValue, ScoreField } from "../../game/gameConstants";
import { Accessor, createMemo, createSignal, Setter, Signal } from 'solid-js';
import type { ScorePadSignal } from '../../game/score/useScorePad';
import { score, discard } from '../../game/score/score';
import { isScoreApplicableToField } from "../../game/score/scoreFieldValidator";
import { DialogState, createDialogSignal } from '../hacks/dialog';

export type ScoreInput = [
    one: DieValue | undefined, 
    two: DieValue | undefined, 
    three: DieValue | undefined, 
    four: DieValue | undefined ,
    five: DieValue | undefined
]

export type ScoreInputState = {
    open: () => void,
    isOpen: Accessor<boolean>,
    isEmpty: Accessor<boolean>,
    autoFocus: Signal<boolean>,
    reset: () => void,
    resetAndClose: () => void,
    submitAndClose: () => void,
    nextStep: () => void,
    getStep: Accessor<'closed' | 'diceSelector' | 'rowSelector' | 'flushDiscard'>,
    dialogs: {
        diceSelector: DialogState,
        rowSelector: DialogState,
        flushDiscard: DialogState
    },
    diceSelector: {
        getScore: Accessor<ScoreInput>,
        getAllDiceSet: Accessor<boolean>,
        getSignalForDie: (die: keyof ScoreInput) => Signal<DieValue | undefined>,
        getScoreForDie: (die: keyof ScoreInput) => DieValue | undefined,
        setScoreForDie: (die: keyof ScoreInput, score: DieValue | undefined) => void,
        selectedDie: Signal<keyof ScoreInput | undefined>
    },
    row: Signal<ScoreField | undefined>,
    flushDiscard: Signal<Exclude<ScoreField, 'flush'> | undefined>
}

export type ScoreInputStateProps = {
    round: Signal<number>
    scorePad: ScorePadSignal
}


const createEmptyScore = () => (
    [ undefined, undefined, undefined, undefined, undefined ] as ScoreInput
);
export function createScoreInputState({ 
    scorePad: [,setScorePad], 
    round:[,setRound] 
}: ScoreInputStateProps): ScoreInputState {

    const step = createSignal<'closed' | 'diceSelector' | 'rowSelector' | 'flushDiscard'>('closed');
    const [getStep, setStep] = step;
    const [isEmpty, setIsEmpty] = createSignal(true);
    const autoFocus = createSignal(true);
    const [, setAutoFocus] = autoFocus;
    const row = createSignal<ScoreField | undefined>(undefined);
    const [getRow, setRow] = row;
    const flushDiscard = createSignal<Exclude<ScoreField, 'flush'> | undefined>(undefined);
    const [getFlushDiscard, setFlushDiscard] = flushDiscard;
    const scoreInput = createSignal(createEmptyScore());
    const [getScoreInput, setScoreInput] = scoreInput;
    const selectedDie = createSignal<keyof ScoreInput | undefined>(undefined);
    const [, setSelectedDie] = selectedDie;

    const isOpen = createMemo(() => getStep() !== "closed", getStep);

    const diceSelectorDialogSignal = createDialogSignal(resetAndClose);
    const rowSelectorDialogSignal = createDialogSignal(resetAndClose);
    const flushDiscardDialogSignal = createDialogSignal(resetAndClose);
    const dialogs = {
        diceSelector: diceSelectorDialogSignal,
        rowSelector: rowSelectorDialogSignal,
        flushDiscard: flushDiscardDialogSignal
    };

    function getScoreForDie(die: keyof ScoreInput) {
        return getScoreInput()[die as number]
    }
    function setScoreForDie(die: keyof ScoreInput, score: DieValue | undefined) {
        return  setScoreInput(previous => {

            const newScore = [...previous] as ScoreInput
            (newScore[die] as DieValue | undefined) = score;

            return newScore;
        })
    }

    
    function getSignalForDie(die: keyof ScoreInput) {
        const accessorProxy = () => getScoreForDie(die);
        const setterProxy = ((handler) => {
            const previousValue = getScoreForDie(die);
            const newValue = typeof handler === 'function'
                ? handler(previousValue)
                : handler;
            return setScoreForDie(die, newValue)[die];
        }) as Setter<DieValue | undefined>

        return [accessorProxy, setterProxy] as Signal<DieValue | undefined>;
    }
    
    const getAllDiceSet = createMemo(
        () => {
            return Array.from(getScoreInput()).every(value => value !== undefined) === true
        }, 
        getScoreInput
    )
    const diceSelector: ScoreInputState['diceSelector'] = {
        getScore: getScoreInput,
        getSignalForDie,
        getScoreForDie,
        setScoreForDie,
        getAllDiceSet,
        selectedDie
    }

    function reset(reopen: boolean = true) {
        rowSelectorDialogSignal.closeDialog(false);
        flushDiscardDialogSignal.closeDialog(false);
        setScoreInput(createEmptyScore());
        setRow(undefined);
        setFlushDiscard(undefined);
        setAutoFocus(true);
        if (reopen) {
            setSelectedDie(0);
            setStep('diceSelector')
            diceSelectorDialogSignal.openDialog();
        } else {
            setSelectedDie(undefined);
            setStep('closed')
        }
    }
    function resetAndClose() {
        setStep('closed');
        diceSelectorDialogSignal.closeDialog(false);
        reset(false);
    }
    function submitAndClose() {
        setIsEmpty(false);
        const row = getRow();
        // TODO throw
        if (row == undefined) return;
        const scoreInput = getScoreInput();
        const scoreValue = score(scoreInput as [DieValue, DieValue, DieValue, DieValue, DieValue]);

        if (isScoreApplicableToField(scoreValue, row)){

            if (row !== 'flush') {
                setScorePad({
                    field: row,
                    score: scoreValue
                })
            } else {
                setScorePad({
                    field: row,
                    score: scoreValue,
                    discard: getFlushDiscard()!
                })
            }
        } else{
            setScorePad({
                field: row,
                score: discard()
            })
        }

        setRound(previous => previous +1);
        resetAndClose();
    }
    function open() {
        reset();
        setStep('diceSelector');
        diceSelectorDialogSignal.openDialog();
    }

    function nextStep() {
        const currentStep = getStep();
        
        if (currentStep === 'diceSelector') {
            diceSelectorDialogSignal.closeDialog(false);
            rowSelectorDialogSignal.openDialog();
            return setStep('rowSelector');
        }
        if (currentStep === 'rowSelector') {
            rowSelectorDialogSignal.closeDialog(false);
            flushDiscardDialogSignal.openDialog();
            return setStep('flushDiscard');
        }
        
        resetAndClose();
    }
    return {
        open,
        isOpen,
        isEmpty,
        autoFocus,
        reset,
        resetAndClose,
        submitAndClose,
        nextStep,
        getStep,
        dialogs,
        diceSelector,
        row,
        flushDiscard
    }
}