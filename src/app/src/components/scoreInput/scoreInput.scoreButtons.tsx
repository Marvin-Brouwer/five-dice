import './scoreInput.scoreButtons.css';

import { Accessor, Component, createRenderEffect, createSignal, createReaction, Setter } from 'solid-js';
import type { ScoreInputState } from "./scoreInput.state"
import { DieInput } from '../die/input/die-input';
import { createMemo, createEffect } from 'solid-js';

type Props = {
    inputState: ScoreInputState,
    dialogOpened: Accessor<boolean>,
    closeButtonRef: Accessor<HTMLButtonElement>,
    submitButtonRef: Accessor<HTMLButtonElement>,
    setFirstDiceRef: Setter<HTMLInputElement>,
}

export const ScoreInputButtons: Component<Props> = ({ inputState, dialogOpened, setFirstDiceRef, submitButtonRef }) => {

    const fieldsDisabled = createMemo(() => ([
        () => false,
        () => inputState.getScoreForField(0) === undefined,
        () => inputState.getScoreForField(1) === undefined,
        () => inputState.getScoreForField(2) === undefined,
        () => inputState.getScoreForField(3) === undefined
    ]), inputState.score);

    const firstEmptyField = createMemo(() => inputState.score().findIndex(value => value === undefined), inputState.score);

    const refs = new Array<HTMLInputElement|((el: HTMLInputElement) => void)>(5);

    const reaction = createReaction(() => {
        console.log('next');
        reaction(firstEmptyField);
        if (!dialogOpened()) return;
        requestAnimationFrame(setFocus);
    })

    reaction(dialogOpened);

    const setFocus = () =>{
        const field = firstEmptyField();
        if (field === -1) {
            submitButtonRef()?.focus();
            return;
        }

        const input = (refs[field] as HTMLInputElement);
        console.log(input)
        input.focus({ preventScroll: true });
        input.select();

        if (input !== document.activeElement)
            requestAnimationFrame(setFocus);
    };

    // TODO make shift+tab and tab loop around

    return <div class="score-input-buttons">
        <DieInput ref={(el) => { setFirstDiceRef(el); refs[0] = el; }} name='die-1' disabled={fieldsDisabled()[0]} value={inputState.getSignalForField(0)} />
        <DieInput ref={refs[1]!} name='die-2' disabled={fieldsDisabled()[1]} value={inputState.getSignalForField(1)} />
        <DieInput ref={refs[2]!} name='die-3' disabled={fieldsDisabled()[2]} value={inputState.getSignalForField(2)} />
        <DieInput ref={refs[3]!} name='die-4' disabled={fieldsDisabled()[3]} value={inputState.getSignalForField(3)} />
        <DieInput ref={refs[4]!} name='die-5' disabled={fieldsDisabled()[4]} value={inputState.getSignalForField(4)} />
    </div>
}
