import { Accessor, Component, Signal, createMemo, JSX } from 'solid-js';
import type { ScoreField, DieValue } from '../../game/gameConstants';
import './scoreInput.selectorButtons.css';
import type { ScoreInputState } from './scoreInput.state';
import { discard, score } from '../../game/score/score';
import { RollDisplay } from '../scoreCard/scoreCard.rollDisplay';
import { SingleScoreDisplay } from '../scoreCard/scoreCard.scoreDisplay';
import type { ScorePadAccessor } from '../../game/score/useScorePad';

type Props = {
    validFields: Accessor<Array<ScoreField>>
    discardFields: Accessor<Array<ScoreField>>
    inputState: ScoreInputState,
    getScorePad: ScorePadAccessor
    selectedField: Signal<ScoreField | undefined>
    selectableRows: Accessor<Array<[element: HTMLTableRowElement, field: ScoreField]>>
}


export const SelectorButtons: Component<Props> = ({ 
    validFields, discardFields, inputState, selectedField, selectableRows, getScorePad
}) => {

    const [getSelectedField, setSelectedField] = selectedField;

    const rowSelectors = createMemo(() => {
        const scoreValue = !inputState.diceSelector.getAllDiceSet() 
            ? discard()
            : score(inputState.diceSelector.getScore() as [DieValue, DieValue, DieValue, DieValue, DieValue])
        
        return selectableRows()
            .filter(([,field]) => validFields().includes(field) || discardFields().includes(field))
            .map(([item, field]) => {
                const bounds = item.getBoundingClientRect();
                const position: JSX.CSSProperties = {
                    left: `${bounds.x}px`,
                    top: `${bounds.y}px`,
                    width: `${bounds.width}px`,
                    height: `${bounds.height}px`
                }

                const isDiscard = discardFields().includes(field);

                const displayScore = () => isDiscard ? discard() : scoreValue 
                const classList = { 
                    'row-selector': true,
                    'discard': isDiscard,
                    'selected': getSelectedField() === field
                }
                
                return (
                    <label style={position}  classList={classList}>
                        <input 
                            type='radio' checked={getSelectedField() === field} data-field={field}
                            onChange={(e) => e.currentTarget.checked && setSelectedField(field) && e.currentTarget.focus()} />
                        <RollDisplay field={field} score={displayScore} />
                        <SingleScoreDisplay field={field} score={displayScore()} scorePad={getScorePad} />
                    </label>
                )
            })},
            [selectableRows(), validFields(), discardFields(), inputState.diceSelector.getScore()]
    );

    return (
        <section role="menu" class="selector-buttons">
            {rowSelectors}
        </section>
    )
}