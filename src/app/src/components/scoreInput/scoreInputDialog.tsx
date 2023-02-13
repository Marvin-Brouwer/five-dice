import "./scoreInputDialog.css";

import type { Component, Setter } from "solid-js";
import type { ScorePadModifier } from "../../game/score/useScorePad";
import { DieButton } from "../die/input/die-button";
import { DieInput } from "../die/input/die-input";
import { createSignal } from 'solid-js';
import type { DieValue } from "../../game/gameConstants";
import { Dialog } from "../hacks/dialog";
import { createScoreInputState } from './scoreInput.state';
import { ScoreInputButtons } from "./scoreInput.scoreButtons";

type Props = {
    setRound: Setter<number>
    applyScore: ScorePadModifier
}

export const ScoreInputDialog: Component<Props> = () => {

    // const dieValue = createSignal<DieValue | undefined>(undefined)
    const dialogState = createSignal(false);
    const [dialogOpened, openDialog] = dialogState;
    const inputState = createScoreInputState();

    return (
        <section class="score-input">
            <DieButton value="+" onClick={() => {
                inputState.reset();
                openDialog(true);
            }}/>
            <Dialog modal={true} dialogState={dialogState}>
                <ScoreInputButtons inputState={inputState} dialogOpened={dialogOpened} />
            </Dialog>
        </section>
    );
}