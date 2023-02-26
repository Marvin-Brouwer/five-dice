import type { Accessor, Component, Setter } from "solid-js";
import { DieButton } from "../die/input/die-button";
import "./scoreInput.dialogPrompt.css";
import type { ScoreInput, ScoreInputState } from "./scoreInput.state";


type Props = {
    inputState: ScoreInputState,
    submitLabel: string,
    submitDescription: string,
    onSubmit: () => void,
    submitEnabled: Accessor<boolean>,
    setCloseButtonRef: Setter<HTMLButtonElement>,
    setSubmitButtonRef: Setter<HTMLButtonElement>,
    getFirstInputRef: Accessor<HTMLInputElement | undefined>,
}

export const ScoreDialogPrompt: Component<Props> = ({ 
    inputState, onSubmit, submitEnabled, setCloseButtonRef, setSubmitButtonRef, getFirstInputRef,
    submitLabel, submitDescription
}) => {

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
        getFirstInputRef()?.focus();
    }

    return (
        <div class="score-input-dialog-prompt" role="toolbar">
            <div class="grid">
                <label>
                    <DieButton value="⭯" description="reset" type="reset" onClick={reset} />
                    reset
                </label>
                <label aria-label={submitDescription} aria-disabled={!submitEnabled()}>
                    <DieButton value="✓" description={submitLabel} type="submit" 
                        onClick={submit}
                        ref={setSubmitButtonRef} disabled={() => !submitEnabled()} />
                    {submitLabel}
                </label>
                <label>
                    <DieButton value={<img src="/iconmonstr-x-mark-lined.svg" /> as Element} description="close" type="reset" onClick={close} ref={setCloseButtonRef} />
                    close
                </label>
            </div>
        </div>
    )
}