import "./scoreInputDialog.css";

import type { Component, Setter } from "solid-js";
import type { ScorePadModifier } from "../../game/score/useScorePad";
import { DieButton } from "../die/input/die-button";
import { DieInput } from "../die/input/die-input";
import { createSignal, createReaction, createEffect } from 'solid-js';
import type { DieValue } from "../../game/gameConstants";
import { Dialog } from "../hacks/dialog";
import { createScoreInputState } from './scoreInput.state';
import { ScoreInputButtons } from "./scoreInput.scoreButtons";
import { ScoreDialogPrompt } from "./scoreInput.dialogPrompt";

type Props = {
    setRound: Setter<number>
    applyScore: ScorePadModifier
}

export const ScoreInputDialog: Component<Props> = () => {

    // const dieValue = createSignal<DieValue | undefined>(undefined)
    const dialogState = createSignal(false);
    const [dialogOpened, openDialog] = dialogState;
    const inputState = createScoreInputState();
    const [closeButtonRef, setCloseButtonRef] = createSignal<HTMLButtonElement>(undefined!);
    const [submitButtonRef, setSubmitButtonRef] = createSignal<HTMLButtonElement>(undefined!);
    const [firstDiceRef, setFirstDiceRef] = createSignal<HTMLInputElement>(undefined!);

    return (
        <section class="score-input">
            <DieButton value="+" onClick={() => {
                inputState.reset();
                openDialog(true);
            }}/>
            <Dialog modal={true} dialogState={dialogState}>
                <ScoreInputButtons 
                    inputState={inputState} dialogOpened={dialogOpened} 
                    closeButtonRef={closeButtonRef} submitButtonRef={submitButtonRef}
                    setFirstDiceRef={setFirstDiceRef} />
                <ScoreDialogPrompt 
                    inputState={inputState} closeDialog={() => openDialog(false)} 
                    setCloseButtonRef={setCloseButtonRef} setSubmitButtonRef={setSubmitButtonRef} 
                    firstDiceRef={firstDiceRef}/>
            </Dialog>
        </section>
    );
}