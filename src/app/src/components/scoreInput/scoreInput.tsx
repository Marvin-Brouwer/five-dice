import "./scoreInput.css";

import { Component, onCleanup } from "solid-js";
import { DieButton } from "../die/input/die-button";
import { createScoreInputState, ScoreInputStateProps } from "./scoreInput.state";
import { DiceSelector } from "./scoreInput.diceSelector";
import { RowSelector } from './scoreInput.rowSelector';
import { FlushDiscardSelector } from './scoreInput.flushDiscard';
import { roundAmount } from '../../game/gameConstants';
import { createMemo, onMount, createEffect, createSignal } from 'solid-js';
import JSConfetti from 'js-confetti'
import { createEchoDelayEffect } from "../../audio/echoDelay";


type Props = ScoreInputStateProps

export const ScoreInputDialog: Component<Props> = (props) => {

    const inputState = createScoreInputState(props);
    const [getScorePad] = props.scorePad;
    const [getRound] = props.round;

    // Put into memo to force rerender on change
    const gameEnded = createMemo(() => getRound() > roundAmount, getRound);
    const [getAudioContext, setAudioContext] = createSignal<AudioContext>();

    const createAudioContext = () => {
        setAudioContext(new (window.AudioContext || (window as any).webkitAudioContext)());
        document.removeEventListener('mousemove', createAudioContext);
        document.removeEventListener('click', createAudioContext);
        document.removeEventListener('tap', createAudioContext);
        document.removeEventListener('drag', createAudioContext);
        document.removeEventListener('focus', createAudioContext);
        document.removeEventListener('pointerdown', createAudioContext);
        document.removeEventListener('scroll', createAudioContext);
        document.removeEventListener('keypress', createAudioContext);
    }
    onMount(() => {
        document.addEventListener('mousemove', createAudioContext);
        document.addEventListener('click', createAudioContext);
        document.addEventListener('tap', createAudioContext);
        document.addEventListener('drag', createAudioContext);
        document.addEventListener('focus', createAudioContext);
        document.addEventListener('pointerdown', createAudioContext);
        document.addEventListener('scroll', createAudioContext);
        document.addEventListener('keypress', createAudioContext);
    })
    onCleanup(() => {
        document.removeEventListener('click', createAudioContext);
        document.removeEventListener('tap', createAudioContext);
        document.removeEventListener('drag', createAudioContext);
        document.removeEventListener('focus', createAudioContext);
        document.removeEventListener('pointerdown', createAudioContext);
        document.removeEventListener('scroll', createAudioContext);
        document.removeEventListener('keypress', createAudioContext);
    })


    onMount(() => {
        const confetti = new JSConfetti();
        createEffect(async () => {
            if (!gameEnded()) return;

            confetti.addConfetti();
            
            const audioContext = getAudioContext();
            if (!audioContext) return;

            audioContext.suspend();

            try{
                await appendBuffer(audioContext, `${import.meta.env.BASE_URL}458398__breviceps__balloon-pop-christmas-cracker-confetti-cannon.wav`, createBalloonEffect(3))
                await appendBuffer(audioContext, `${import.meta.env.BASE_URL}383154__profcalla__re_frullato_tromba.mp3`,createPartyHornEffect(0))
                await appendBuffer(audioContext, `${import.meta.env.BASE_URL}170583__audiosmedia__party-horn.wav`, createPartyHornEffect(.06))
                audioContext.resume();
            } catch (e) {
                console.warn(e);
            }
        }, [gameEnded, getAudioContext])
    })

    return (
        <section class="score-input">
            {gameEnded() ? undefined : 
                <>
                    <div class="set-score">
                        
                        <DieButton 
                            value={<img src={`${import.meta.env.BASE_URL}iconmonstr-plus-lined.svg`} /> as Element} 
                            description="Enter a new round's value" disabled={inputState.isOpen} 
                            onClick={() => {
                                inputState.open();
                            }}
                        />
                    </div>
                    <DiceSelector inputState={inputState} />
                    <RowSelector inputState={inputState} getScorePad={getScorePad} />
                    <FlushDiscardSelector inputState={inputState} getScorePad={getScorePad} />
                </>
            }
        </section>
    );
}


type PitchShifter = (audioContext: AudioContext, node: AudioNode) => AudioNode;

const createBalloonEffect = (echo: number): PitchShifter => (audioContext, audioNode) => {
    const echoDelay = createEchoDelayEffect(audioContext, echo);
    echoDelay.placeBetween(audioNode, audioNode);
    const gain = audioContext.createGain();
    gain.gain.value = 20;
    return audioNode.connect(gain);
}
const createPartyHornEffect = (delayTime: number): PitchShifter => (audioContext, audioNode) => {
    if (delayTime <= 0) return audioNode;
    const delay = audioContext.createDelay();
    delay.delayTime.value = delayTime;
    return audioNode.connect(delay);
}
async function appendBuffer(audioContext: AudioContext, url: string, shifter?: PitchShifter) {
    
    const actualShifter = shifter ?? ((_, n) => n);
    const bufferSource = audioContext.createBufferSource();
    const audioBuffer = await fetch(url)
        .then(res => res.arrayBuffer())
        .then(b => audioContext.decodeAudioData(b));
    bufferSource.buffer = audioBuffer

    actualShifter(audioContext, bufferSource)
        .connect(audioContext.destination);
    bufferSource.loop = false;
    bufferSource.start();
}