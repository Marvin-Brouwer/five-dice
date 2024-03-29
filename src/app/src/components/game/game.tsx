import { createSignal, Component, onMount, createEffect } from 'solid-js'
import { useScorePad } from '../../game/score/useScorePad'
import { ScoreCard } from '../scoreCard/scoreCard'
import { ScoreInputDialog } from '../scoreInput/scoreInput'
import { KeyboardContextProvider } from '../../context/keyboardContext'

const round = createSignal(1)
const scorePad = useScorePad()
const { getScorePad } = scorePad

const createPlayerNameSignal = () => {

	const playerName = createSignal('')
	const [getPlayerName, setPlayerName] = playerName

	onMount(() => {
		const playerName = localStorage.getItem('playerName')
		setPlayerName(playerName ?? '')

		createEffect(() => {
			localStorage.setItem('playerName', getPlayerName())
		}, getPlayerName)
	})

	return playerName
}

export const Game: Component = () => {

	const playerName = createPlayerNameSignal()

	return (<KeyboardContextProvider>
		<ScoreCard playerName={playerName} round={round} getScorePad={getScorePad} />
		<ScoreInputDialog round={round} scorePad={scorePad} />
	</KeyboardContextProvider>)
}