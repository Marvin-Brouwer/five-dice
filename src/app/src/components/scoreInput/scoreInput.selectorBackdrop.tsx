import './scoreInput.selectorBackdrop.css';

import type { Accessor, Component, Setter } from "solid-js"
import type { ScorePadModifier } from "../../game/score/useScorePad"
import type { ScoreInput } from "./scoreInput.state"
import type { ScorePadAccessor } from '../../game/score/useScorePad';
import type { ScorePad } from '../../game/score/scorePad';
import { isScoreApplicableToField } from '../../game/score/scoreFieldValidator';
import type { DieValue } from '../../game/gameConstants';
import { score, ValidScore, discard } from '../../game/score/score';
import { RollDisplay } from '../scoreCard/scoreCard.rollDisplay';
import { SingleScoreDisplay } from '../scoreCard/scoreCard.scoreDisplay';


type Props = {
    currentScore: ScorePadAccessor
    scoreInput: Accessor<ScoreInput>
    setRound: Setter<number>
    applyScore: ScorePadModifier
}

export const SelectorBackdrop: Component<Props> = ({ currentScore, scoreInput, applyScore, setRound }) => {

    const scoreInputValue = scoreInput() as Array<DieValue> as ValidScore;
    const selectableRows = Array.from(document.querySelectorAll<HTMLTableRowElement>('.row-display'))
        .map(item => {
            const field = item.getAttribute('data-for-field') as keyof ScorePad;
            const currentScoreFieldValue = currentScore()[field];
            const disabled = field === 'flush'
                ? currentScoreFieldValue !== undefined && (currentScoreFieldValue as Array<number>).length > 0 
                : currentScoreFieldValue !== undefined;

            return [item, field, disabled, isScoreApplicableToField(scoreInputValue, field)] as
                [HTMLTableRowElement, keyof ScorePad, boolean, boolean]
        });
    const selectionWindows = selectableRows
        .filter(([,,disabled]) => !disabled)
        .map(([item]) => {
            const bounds = item.getBoundingClientRect();
            
            return (
                <rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} fill='black' />
            )
        })
        const rowSelectors = selectableRows
            .map(([item, field, disabled, applicable]) => {
                const bounds = item.getBoundingClientRect();
                
                return applicable 
                    ? (
                        <button 
                            class="row-selector" 
                            disabled={disabled}
                            style={{ 
                                left: `${bounds.x}px`,  top: `${bounds.y}px`,
                                width: `${bounds.width}px`, height: `${bounds.height}px` 
                            }} onClick={() => {
                                console.log('setting score', field, score(scoreInputValue))
                                // todo flush discard
                                applyScore({
                                    score: score(scoreInputValue),
                                    field
                                });
                                setRound(r => r+1);
                            }} 
                        >
                            <RollDisplay field={field} score={() => score(scoreInputValue)} />
                            <SingleScoreDisplay field={field} score={score(scoreInputValue)} scorePad={currentScore} />
                        </button>
                    ) : (
                        <button 
                            class="row-selector discard" 
                            disabled={disabled}
                            style={{ 
                                left: `${bounds.x}px`,  top: `${bounds.y}px`,
                                width: `${bounds.width}px`, height: `${bounds.height}px` 
                            }} onClick={() => {
                                applyScore({
                                    score: discard(),
                                    field
                                });
                                setRound(r => r+1);
                            }} 
                        >
                            <RollDisplay field={field} score={() => discard()} />
                            <SingleScoreDisplay field={field} score={discard()} scorePad={currentScore} />
                        </button>
                    )
            })

    return (
        <section role="menu" class="selector-backdrop">
            <svg>
                <defs>
                    <mask id="available-inputs">
                        <rect width="100%" height="100%" fill="white"/>
                        {selectionWindows}
                    </mask>
                </defs>
                <rect class="main-screen" mask="url(#available-inputs)" />
            </svg>
            {rowSelectors}
        </section>
    )
}