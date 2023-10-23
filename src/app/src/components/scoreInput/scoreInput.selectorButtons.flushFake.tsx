import { Accessor, Component, Signal, createMemo, JSX, createSignal, createEffect } from 'solid-js';
import type { ScoreField, DieValue } from '../../game/gameConstants';
import './scoreInput.selectorButtons.css';
import type { ScoreInputState } from './scoreInput.state';
import { discard, score } from '../../game/score/score';
import { RollDisplay } from '../scoreCard/scoreCard.rollDisplay';
import { SingleScoreDisplay } from '../scoreCard/scoreCard.scoreDisplay';
import type { ScorePadAccessor } from '../../game/score/useScorePad';

type Props = {
    inputState: ScoreInputState,
    getScorePad: ScorePadAccessor
}


export const SelectorFlushFake: Component<Props> = ({
    inputState, getScorePad
}) => {


    const [getFlushElement, setFlushElement] = createSignal<HTMLTableRowElement>();
    createEffect(() => {
        setFlushElement(document.querySelector<HTMLTableRowElement>('.row-display[data-for-field="flush"]') ?? undefined);
    })

    const rowSelector = createMemo(() =>
        {
            const scoreValue = !inputState.diceSelector.getAllDiceSet()
                ? discard()
                : score(inputState.diceSelector.getScore() as [DieValue, DieValue, DieValue, DieValue, DieValue])

            const item = getFlushElement();
            if (item === undefined) return undefined;

            const bounds = item.getBoundingClientRect();
            const position: JSX.CSSProperties = {
                left: `${bounds.x}px`,
                top: `${bounds.y}px`,
                width: `${bounds.width}px`,
                height: `${bounds.height}px`
            }

            const classList = {
                'row-selector': true,
                'selected': true,
                'fake': true
            }

            return (
                <label style={position}  classList={classList}>
                    <RollDisplay field="flush" score={() => scoreValue} />
                    <SingleScoreDisplay field="flush" score={scoreValue} scorePad={getScorePad} />
                </label>
            )
        },
        [getFlushElement(), inputState.diceSelector.getScore()]
    );

    return (
        <section role="presentation" class="selector-buttons">
            {rowSelector()}
        </section>
    )
}