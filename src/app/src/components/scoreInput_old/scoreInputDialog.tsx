import "./scoreInputDialog.css";

import type { Setter, Component } from 'solid-js';
import type { ScorePadModifier } from '../../game/score/useScorePad';
import { TextDie } from '../die/text-die';
import { createSignal, createEffect } from 'solid-js';
import { Dialog } from '../hacks/dialog';
import { DiceButtons } from './scoreInput.diceButtons';
import { createScoreInputState } from './scoreInput.state';

type Props = {
    setRound: Setter<number>
    applyScore: ScorePadModifier
}

export const ScoreInputDialog: Component<Props> = ({ setRound, applyScore }) => {

    const state = createScoreInputState();

    const dialogState = createSignal(false);
    const [dialogVisible, setDialogVisible] = dialogState;
    const showDialog = () => setDialogVisible(true);
    const closeDialog = () => setDialogVisible(false);

    createEffect(() => {
        if (!dialogVisible()) return state.reset();
        const input = document.getElementById(`dice-value-0-input-aces`) as HTMLInputElement;

        const setFocus = () =>{
            input.focus({ preventScroll: true });

            if (document.activeElement != input)
                window.requestAnimationFrame(setFocus)
        }
        if (document.activeElement !== undefined) setFocus();
    }, dialogVisible);

    const handleSubmit = (e: SubmitEvent) => {
        if (!state.allFieldsSet()) {
            e.preventDefault();
            state.selectNextField();
            return false;
        }
        console.log('score', state.score());
        closeDialog();
    };
    
    return (
        <section class="score-input">
            <button id="open-input" onclick={(e) => {
                e.currentTarget.focus();
                showDialog();
            }}>
                <TextDie value='+' />
            </button>
            <Dialog id="score-dialog" modal={true} dialogState={dialogState}>
                <form form-action="dialog" onSubmit={handleSubmit} >
                    <DiceButtons state={state} />
                    <div class="dialog-buttons">
                        <button type="submit">
                            <TextDie value="✓" />
                            <span class="label">Submit</span>
                        </button>
                        <button type="reset" onClick={() => state.reset()}>
                            <TextDie value="⭯" />
                            <span class="label">Reset</span>
                        </button>
                    </div>
                    <div class="close-button">
                        <button
                            class="close-input" aria-label="close window" 
                            type="reset"
                            onSelect={() => state.selectField(undefined)}
                        >
                            X
                        </button>
                    </div>
                </form>
            </Dialog>
        </section>
    )
}