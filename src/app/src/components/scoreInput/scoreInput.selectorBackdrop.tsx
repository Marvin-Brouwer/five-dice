import './scoreInput.selectorBackdrop.css';

import type { Accessor, Component, Setter } from "solid-js"
import type { ScorePadModifier } from "../../game/score/useScorePad"
import type { ScoreInput } from "./scoreInput.state"
import type { ScorePadAccessor } from '../../game/score/useScorePad';
import type { ScorePad } from '../../game/score/scorePad';
import { isScoreApplicableToField } from '../../game/score/scoreFieldValidator';
import type { DieValue } from '../../game/gameConstants';
import { score, ValidScore, discard } from '../../game/score/score';


type Props = {
    currentScore: ScorePadAccessor
    scoreInput: Accessor<ScoreInput>
    setRound: Setter<number>
    applyScore: ScorePadModifier
}

export const SelectorBackdrop: Component<Props> = ({ currentScore, scoreInput }) => {

    const scoreInputValue = scoreInput() as Array<DieValue> as ValidScore;
    const selectables = Array.from(document.querySelectorAll<HTMLTableRowElement>('.row-display'))
        .map(item => {
            const field = item.getAttribute('data-for-field') as keyof ScorePad;
            const currentScoreFieldValue = currentScore()[field];
            const disabled = field === 'flush'
                ? currentScoreFieldValue !== undefined && (currentScoreFieldValue as Array<number>).length > 0 
                : currentScoreFieldValue !== undefined;

            return [item, field, disabled, isScoreApplicableToField(scoreInputValue, field)] as
                [HTMLTableRowElement, keyof ScorePad, boolean, boolean]
        });
    const selectionWindows = selectables
        .filter(([,,disabled]) => !disabled)
        .map(([item]) => {
            const bounds = item.getBoundingClientRect();
            
            return (
                <rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} fill='black' />
            )
        })
        const rowSelectors = selectables
            .filter(([,,,isApplicable]) => isApplicable)
            .map(([item, field, disabled]) => {
                const bounds = item.getBoundingClientRect();
                
                return (
                    <button 
                        class="row-selector" 
                        disabled={disabled}
                        style={{ 
                            left: `${bounds.x}px`,  top: `${bounds.y}px`,
                            width: `${bounds.width}px`, height: `${bounds.height}px` 
                        }} onClick={() => {
                            console.log('setting score', field, score(scoreInputValue))
                        }} 
                    />
                )
            })
        const rowDiscardSelectors = selectables
            .filter(([,,,isApplicable]) => !isApplicable)
            .map(([item, field, disabled]) => {
                const bounds = item.getBoundingClientRect();
                
                return (
                    <button 
                        class="row-selector discard" 
                        disabled={disabled}
                        style={{ 
                            left: `${bounds.x}px`,  top: `${bounds.y}px`,
                            width: `${bounds.width}px`, height: `${bounds.height}px` 
                        }} onClick={() => {
                            console.log('setting score', field, discard())
                        }} 
                    />
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
            {rowDiscardSelectors}
        </section>
    )
}