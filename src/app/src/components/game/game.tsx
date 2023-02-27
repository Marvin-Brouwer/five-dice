import { createSignal, Component, onMount, createEffect } from 'solid-js';
import { useScorePad } from '../../game/score/useScorePad';
import { ScoreCard } from '../scoreCard/scoreCard';
import { ScoreInputDialog } from '../scoreInput/scoreInput';

const round = createSignal(1);
const scorePad = useScorePad();
const [getScorePad] = scorePad;

const createPlayerNameSignal = () => {
    
    const playerName = createSignal("");
    const [getPlayerName, setPlayerName] = playerName;

    onMount(() => {
        const playerName = localStorage.getItem('playerName');
        setPlayerName(playerName ?? '');
        
        createEffect(() => {
            localStorage.setItem('playerName', getPlayerName());
        }, getPlayerName)
    })

    return playerName;
}

// TEMP test sound
round[1](13);

export const Game: Component = () => {

    const playerName = createPlayerNameSignal();

    
    return (<>
        <ScoreCard playerName={playerName} round={round} getScorePad={getScorePad} />
        <ScoreInputDialog round={round} scorePad={scorePad}  />
    </>);
}