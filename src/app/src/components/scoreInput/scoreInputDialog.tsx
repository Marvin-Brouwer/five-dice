import "./scoreInputDialog.css";

import type { Accessor, Component, Setter, Signal } from "solid-js";
import type { ScorePadAccessor, ScorePadModifier } from "../../game/score/useScorePad";
import { DieButton } from "../die/input/die-button";
import { DieInput } from "../die/input/die-input";
import { createSignal, createReaction, createEffect, createMemo } from 'solid-js';
import type { DieValue } from "../../game/gameConstants";
import { Dialog } from "../hacks/dialog";
import { createScoreInputState, ScoreInput } from './scoreInput.state';
import { ScoreInputButtons } from "./scoreInput.scoreButtons";
import { ScoreDialogPrompt } from "./scoreInput.dialogPrompt";
import { ValidScore } from '../../game/score/score';
import { not } from "../../helpers/memoHelpers";
import { SelectorBackdrop } from "./scoreInput.selectorBackdrop";

type Props = {
    round: Signal<number>
    currentScore: ScorePadAccessor
    applyScore: ScorePadModifier
}

export const ScoreInputDialog: Component<Props> = ({ round:[getRound, setRound], applyScore, currentScore }) => {

    const dialogState = createSignal(false);
    const [dialogOpened, openDialog] = dialogState;
    const inputState = createScoreInputState();
    const [scoreInput, setScoreInput] = createSignal<ScoreInput | undefined>(undefined);
    const scoreSet = createMemo(() => scoreInput() !== undefined, scoreInput);
    // todo close dialog on score

    const [closeButtonRef, setCloseButtonRef] = createSignal<HTMLButtonElement>(undefined!);
    const [submitButtonRef, setSubmitButtonRef] = createSignal<HTMLButtonElement>(undefined!);
    const [firstDiceRef, setFirstDiceRef] = createSignal<HTMLInputElement>(undefined!);

    return (
        <section class="score-input">
            <div class="set-score">
                <DieButton value="+" onClick={() => {
                    inputState.reset();
                    setScoreInput(undefined);
                    openDialog(true);
                }}/>
            </div>
            <Dialog modal={true} dialogState={dialogState} showBackdrop={not(scoreSet)}>
                
                <ScoreInputButtons 
                    inputState={inputState} dialogOpened={dialogOpened} scoreSet={scoreSet}
                    closeButtonRef={closeButtonRef} submitButtonRef={submitButtonRef}
                    setFirstDiceRef={setFirstDiceRef} />

                {scoreSet() ? 
                    <SelectorBackdrop 
                        scoreInput={scoreInput as Accessor<ScoreInput>} 
                        applyScore={applyScore} setRound={setRound} currentScore={currentScore} /> :
                    <ScoreDialogPrompt 
                        inputState={inputState} closeDialog={() => openDialog(false)} setScoreInput={setScoreInput}
                        setCloseButtonRef={setCloseButtonRef} setSubmitButtonRef={setSubmitButtonRef} 
                        firstDiceRef={firstDiceRef}/>
                }
            </Dialog>
        </section>
    );
}