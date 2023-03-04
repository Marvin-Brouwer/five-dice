import './scoreInput.rowSelector.css';

import type { ScoreInputState } from './scoreInput.state';
import type { Component } from 'solid-js';
import { Dialog } from '../hacks/dialog';
import { createMemo, createSignal, createReaction } from 'solid-js';
import { ScoreDialogPrompt } from './scoreInput.dialogPrompt';
import { isScoreApplicableToField } from '../../game/score/scoreFieldValidator';
import type { DieValue, ScoreField } from '../../game/gameConstants';
import { score, isDiscarded, isFlushScore } from '../../game/score/score';
import { SelectorBackdrop } from './scoreInput.selectorBackdrop';
import type { ScorePadAccessor } from '../../game/score/useScorePad';
import { Selector } from './scoreInput.selector';

type Props = {
    inputState: ScoreInputState,
    getScorePad: ScorePadAccessor
}

export const RowSelector: Component<Props> = ({ inputState, getScorePad }) => {

    const [getCloseButtonRef, setCloseButtonRef] = createSignal<HTMLButtonElement | undefined>(undefined);
    const [getResetButtonRef, setResetButtonRef] = createSignal<HTMLButtonElement | undefined>(undefined);
    const [getSubmitButtonRef, setSubmitButtonRef] = createSignal<HTMLButtonElement | undefined>(undefined);
    const firstInputRef = createSignal<HTMLLabelElement | undefined>();
    const [getFirstInputRef, setFirstInputRef] = firstInputRef;

    const [getSelectedRow] = inputState.row;
    const submitEnabled = createMemo(
        () => getSelectedRow() !== undefined, 
        getSelectedRow
    );

    const availableRows = createMemo(() => Object.entries(getScorePad())
        .filter(([propertyName, value]) => {
            if (value === undefined) return true;
            if (propertyName === "flush") return isFlushScore(value)
        })
        .map(([name]) => name as ScoreField),
        getScorePad()
    )

    const scoreValue = createMemo(() => 
        score(inputState.diceSelector.getScore() as [DieValue, DieValue, DieValue, DieValue, DieValue]),
        inputState.diceSelector.getScore
    );
    
    const validRows = createMemo(() => 
        availableRows()
            .filter(row => isScoreApplicableToField(scoreValue(), row)), 
        scoreValue
    );
    const discardRows = createMemo(() =>
        availableRows()
            .filter(row => {
                if (isScoreApplicableToField(scoreValue(), row)) return false;
                if (row === 'flush') {
                    const currentFlush = getScorePad().flush;
                    if (!isFlushScore(currentFlush)) return false;
                    return currentFlush.length === 0
                }
                return true;
            }), 
        scoreValue
    );

    function onSubmit() {
        const row = getSelectedRow()!;
        const inputScoreValue = inputState.diceSelector.getScore() as [DieValue, DieValue, DieValue, DieValue, DieValue];

        if (getSelectedRow() !== 'flush') return inputState.submitAndClose();
        if (!isScoreApplicableToField(score(inputScoreValue), row)) return inputState.submitAndClose();
        const currentFlushValue = getScorePad()['flush'];
        if (getSelectedRow() === 'flush' && !isDiscarded(currentFlushValue) && currentFlushValue.length == 0)
            return inputState.submitAndClose();
            
        inputState.nextStep();
    }

    return (
        <Dialog modal={true} dialogState={inputState.dialogs.rowSelector} showBackdrop={() => false}>
            
            <section class="title-section">
                <h2>Please select a row</h2>
                <p>Select a row your score applies to</p>
            </section>

            <Selector id="row"
                getScorePad={getScorePad}
                selectedField={inputState.row} inputState={inputState} 
                validFields={validRows} discardFields={discardRows} 
                firstInputRef={firstInputRef}
                nextButton={() => getSelectedRow() === undefined ? getResetButtonRef() : getSubmitButtonRef()} previousButton={getCloseButtonRef} />
            <ScoreDialogPrompt
                inputState={inputState} onSubmit={onSubmit} submitEnabled={submitEnabled}
                setSubmitButtonRef={setSubmitButtonRef} setCloseButtonRef={setCloseButtonRef}  setResetButtonRef={setResetButtonRef} 
                submitLabel="confirm" submitDescription="Select the field to apply the current score to"
                getFirstInputRef={getFirstInputRef} />
        </Dialog>
    );
}