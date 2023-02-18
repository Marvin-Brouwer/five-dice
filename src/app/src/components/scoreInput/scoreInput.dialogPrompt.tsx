import type { Accessor, Component, Setter } from "solid-js";
import { DieButton } from "../die/input/die-button";
import "./scoreInput.dialogPrompt.css";
import type { ScoreInputState } from "./scoreInput.state";


type Props = {
    inputState: ScoreInputState,
    closeDialog: () => void,
    setCloseButtonRef: Setter<HTMLButtonElement>,
    setSubmitButtonRef: Setter<HTMLButtonElement>,
    firstDiceRef: Accessor<HTMLInputElement>,
}

export const ScoreDialogPrompt: Component<Props> = ({ 
    inputState, closeDialog, setCloseButtonRef, setSubmitButtonRef, firstDiceRef 
}) => {

    const close = () => {
        closeDialog();
        inputState.reset();
    };

    const reset = () =>{
        console.log(firstDiceRef());
        inputState.reset();
        firstDiceRef()?.focus();
    }

    return (
        <div class="score-input-dialog-prompt" role="toolbar">
            <div class="grid">
                <label>
                    <DieButton value="⭯" type="reset" onClick={reset} />
                    reset
                </label>
                <label aria-label="Submit the score" aria-disabled={!inputState.allFieldsSet()}>
                    <DieButton value="✓" type="submit" ref={setSubmitButtonRef} disabled={() => !inputState.allFieldsSet()} />
                    submit
                </label>
                <label>
                    <DieButton value="🗙" type="reset" onClick={close} ref={setCloseButtonRef} />
                    close
                </label>
            </div>
        </div>
    )
}