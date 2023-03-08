import type { Accessor, Component, Setter } from "solid-js";
import { DieButton } from "../die/input/die-button";
import "./scoreInput.dialogPrompt.css";
import type { ScoreInputState } from "./scoreInput.state";

import CloseIcon from "../../icons/iconmonstr-x-mark-lined.svg?raw";
import SubmitIcon from "../../icons/iconmonstr-check-mark-lined.svg?raw";
import ResetIcon from "../../icons/iconmonstr-undo-4.svg?raw";
import { createMemo } from 'solid-js';

type Props = {
    inputState: ScoreInputState,
    submitLabel: string,
    submitDescription: string,
    onSubmit: () => void,
    submitEnabled: Accessor<boolean>,
    setResetButtonRef?: Setter<HTMLButtonElement>,
    setCloseButtonRef: Setter<HTMLButtonElement>,
    setSubmitButtonRef: Setter<HTMLButtonElement>,
    getFirstInputRef: Accessor<HTMLLabelElement | undefined>,
    autoFocusEnabled?: Accessor<boolean | undefined>
}

export const ScoreDialogPrompt: Component<Props> = ({ 
    inputState, onSubmit, submitEnabled, setCloseButtonRef, setSubmitButtonRef, getFirstInputRef, setResetButtonRef,
    submitLabel, submitDescription, autoFocusEnabled
}) => {

    const isAutoFocusEnabled = createMemo(() => autoFocusEnabled === undefined || autoFocusEnabled(), autoFocusEnabled);
    const submit = (e: MouseEvent) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();

        if (inputState.diceSelector.getScore().some(value => value === undefined))
            return false;
        
        onSubmit();

        return false;
    }

    const close = () => {
        inputState.resetAndClose();
    };

    const reset = () =>{
        inputState.reset();
        if (isAutoFocusEnabled())
            getFirstInputRef()?.focus();
    }

    return (
        <div class="score-input-dialog-prompt" role="toolbar">
            <div class="grid">
                <label>
                    <DieButton value={<span class="illustration" innerHTML={ResetIcon} /> as Element} description="reset" type="reset" onClick={reset} ref={setResetButtonRef} />
                    reset
                </label>
                <label aria-label={submitDescription} aria-disabled={!submitEnabled()}>
                    <DieButton value={<span class="illustration" innerHTML={SubmitIcon} /> as Element} description={submitLabel} type="submit" 
                        onClick={submit}
                        ref={setSubmitButtonRef} disabled={() => !submitEnabled()} />
                    {submitLabel}
                </label>
                <label>
                    <DieButton value={<span class="illustration" innerHTML={CloseIcon} /> as Element} description="close" type="reset" onClick={close} ref={setCloseButtonRef} />
                    close
                </label>
            </div>
        </div>
    )
}