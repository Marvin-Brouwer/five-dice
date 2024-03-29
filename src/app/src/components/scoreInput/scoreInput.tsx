import './scoreInput.css'

import getBalloonPopAudio from '../../audio/458398__breviceps__balloon-pop-christmas-cracker-confetti-cannon.wav?blob'
import getTrumpetAudio from '../../audio/383154__profcalla__re_frullato_tromba.mp3?blob'
import getPartyHornAudio from '../../audio/170583__audiosmedia__party-horn.wav?blob'

import PlusIcon from '../../icons/iconmonstr-plus-lined.svg?raw'
import UndoIcon from '../../icons/iconmonstr-refresh-5.svg?raw'
import ResetIcon from '../../icons/iconmonstr-trash-can-lined.svg?raw'

import { Component, onCleanup } from 'solid-js'
import { DieButton } from '../die/input/die-button'
import { createScoreInputState, ScoreInputStateProps } from './scoreInput.state'
import { DiceSelector } from './scoreInput.diceSelector'
import { RowSelector } from './scoreInput.rowSelector'
import { FlushDiscardSelector } from './scoreInput.flushDiscard'
import { roundAmount } from '../../game/gameConstants'
import { createMemo, onMount, createEffect } from 'solid-js'
import JSConfetti from 'js-confetti'
import { createEchoDelayEffect } from '../../audio/echoDelay'
import { createAudioContextAccessor } from '../../audio/audioContextSignal'
import { isServerSide } from '../../helpers/utilities'

type Props = ScoreInputStateProps

export const ScoreInputDialog: Component<Props> = (props) => {

	const inputState = createScoreInputState(props)
	const { getScorePad, canUndoScore, undoScore } = props.scorePad
	const [getRound, setRound] = props.round

	// Put into memo to force rerender on change
	const gameEnded = createMemo(() => getRound() > roundAmount, getRound)
	const getAudioContext = createAudioContextAccessor()

	const undoDisabled = createMemo(() => gameEnded() ||  !canUndoScore(), [gameEnded, canUndoScore])
	const undoLastTurn = () => {
		if (!canUndoScore()) return
		setRound((prev) => prev -1)
		undoScore()
	}

	const ballonPopAudio = getBalloonPopAudio()
	const trumpetAudio = getTrumpetAudio()
	const partyHornAudio = getPartyHornAudio()

	onMount(() => {
		const confetti = new JSConfetti()
		createEffect(async () => {
			if (!gameEnded()) return

			const audioContext = getAudioContext()
			if (audioContext) {
				audioContext.suspend()

				try{
					await appendBuffer(audioContext, ballonPopAudio(), createBalloonEffect(3))
					await appendBuffer(audioContext, trumpetAudio(),createPartyHornEffect(0))
					await appendBuffer(audioContext, partyHornAudio(), createPartyHornEffect(.06))
					audioContext.resume()
				} catch (e) {
					console.warn(e)
				}
			}

			confetti.addConfetti()

		}, [gameEnded, getAudioContext])
	})

	function handleUnload(e: BeforeUnloadEvent) {

		if (inputState.isEmpty()) return true

		e.preventDefault()
		return e.returnValue = 'You have a scorepad with changes, are you sure you want to reload the page?'

	}
	onMount(() => {
		if (isServerSide()) return

		window.addEventListener('beforeunload', handleUnload)
	})
	onCleanup(() => {
		if (isServerSide()) return

		document.removeEventListener('beforeunload', handleUnload)
	})

	return (
		<section class="score-input">
			<div class="set-score">

				<DieButton
					classList={{
						'die-button': true,
						'enter-button': true,
						'game-ended': gameEnded()
					}}
					value={<span class="illustration" innerHTML={PlusIcon} /> as Element}
					description="Enter a new round's value"
					disabled={() => inputState.isOpen() || gameEnded()}
					onClick={() => {
						inputState.open()
					}}
				/>
				<DieButton
					classList={{
						'die-button': true,
						'undo-button': true,
						'game-ended': gameEnded()
					}}
					value={<span class="illustration" innerHTML={UndoIcon} /> as Element}
					description="Undo last turn" disabled={undoDisabled} // todo
					onClick={() => {
						if (confirm('Are you sure you wan\'t to reset to your previous round?'))
							undoLastTurn()
					}}
				/>
				<DieButton
					classList={{
						'die-button': true,
						'reset-button': true,
						'game-ended': gameEnded()
					}}
					value={<span class="illustration" innerHTML={ResetIcon} /> as Element}
					description="Reset score pad" disabled={inputState.isEmpty}
					onClick={() => {
						window.location.reload()
					}}
				/>
			</div>
			{gameEnded() ? undefined :
				<>
					<DiceSelector inputState={inputState} />
					<RowSelector inputState={inputState} getScorePad={getScorePad} />
					<FlushDiscardSelector inputState={inputState} getScorePad={getScorePad} />
				</>
			}
		</section>
	)
}


type PitchShifter = (audioContext: AudioContext, node: AudioNode) => AudioNode;

const createBalloonEffect = (echo: number): PitchShifter => (audioContext, audioNode) => {
	const echoDelay = createEchoDelayEffect(audioContext, echo)
	echoDelay.placeBetween(audioNode, audioNode)
	const gain = audioContext.createGain()
	gain.gain.value = 20
	return audioNode.connect(gain)
}
const createPartyHornEffect = (delayTime: number): PitchShifter => (audioContext, audioNode) => {
	if (delayTime <= 0) return audioNode
	const delay = audioContext.createDelay()
	delay.delayTime.value = delayTime
	return audioNode.connect(delay)
}
async function appendBuffer(audioContext: AudioContext, blob: Blob, shifter?: PitchShifter) {

	const actualShifter = shifter ?? ((_, n) => n)
	const bufferSource = audioContext.createBufferSource()
	const audioBuffer = await audioContext.decodeAudioData(await blob.arrayBuffer())
	bufferSource.buffer = audioBuffer

	actualShifter(audioContext, bufferSource)
		.connect(audioContext.destination)
	bufferSource.loop = false
	bufferSource.start()
}