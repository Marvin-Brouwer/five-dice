import './scoreInput.flushDiscard.css';

import type { ScoreInputState } from './scoreInput.state';
import type { Component } from 'solid-js';
import { Dialog } from '../hacks/dialog';
import { createMemo, createSignal } from 'solid-js';
import { ScoreDialogPrompt } from './scoreInput.dialogPrompt';
import { Selector } from './scoreInput.selector';
import type { ScorePadAccessor } from '../../game/score/useScorePad';
import type { ScoreField } from '../../game/gameConstants';
import { SelectorFlushFake } from './scoreInput.selectorButtons.flushFake';

type Props = {
    inputState: ScoreInputState,
    getScorePad: ScorePadAccessor
}

export const FlushDiscardSelector: Component<Props> = ({ inputState, getScorePad }) => {

    const [getCloseButtonRef, setCloseButtonRef] = createSignal<HTMLButtonElement | undefined>(undefined);
    const [getSubmitButtonRef, setSubmitButtonRef] = createSignal<HTMLButtonElement | undefined>(undefined);
    const [getFirstInputRef, setFirstInputRef] = createSignal<HTMLInputElement | undefined>(undefined);

    const [getFlushDiscard] = inputState.flushDiscard;
    const submitEnabled = createMemo(
        () => getFlushDiscard() !== undefined, 
        getFlushDiscard
    );

    const availableRows = createMemo(() => Object.entries(getScorePad())
        .filter(([propertyName, value]) => {
            if (value === undefined) return true;
            if (propertyName === "flush") return false
        })
        .map(([name]) => name as ScoreField),
        getScorePad()
    );
    
    return (
        <Dialog modal={true} dialogState={inputState.dialogs.flushDiscard} showBackdrop={() => false}>
            
            <section class="title-section">
                <h2>Select a row to discard</h2>
                <p>You need to throw away a row, when you have more than one discard</p>
            </section>

            <SelectorFlushFake 
                getScorePad={getScorePad} inputState={inputState} />
            <Selector id="flushDiscard"
                getScorePad={getScorePad}
                selectedField={inputState.flushDiscard} inputState={inputState} 
                validFields={() => []} discardFields={availableRows} />
            <ScoreDialogPrompt 
                inputState={inputState} onSubmit={inputState.submitAndClose} submitEnabled={submitEnabled}
                submitLabel="confirm" submitDescription="Select the field to discard"
                setSubmitButtonRef={setSubmitButtonRef} setCloseButtonRef={setCloseButtonRef} 
                getFirstInputRef={getFirstInputRef} />
        </Dialog>
    );
}