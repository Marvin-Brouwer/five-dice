import './scoreCard.css'
import EraserIcon from '../../icons/iconmonstr-eraser-1.svg?raw'
import FinishedIcon from '../../icons/iconmonstr-party-7.svg?raw'

import type { ScorePadAccessor } from '../../game/score/useScorePad'

import type { Component, Signal } from 'solid-js'
import { PartOne } from './scoreCard.partOne'
import { PartTwo } from './scoreCard.partTwo'
import { Totals } from './scoreCard.totals'
import { createSignal, onMount, Accessor } from 'solid-js'
import { roundAmount } from '../../game/gameConstants'

interface Props {
    round: Signal<number>,
    playerName: Signal<string>,
    getScorePad: ScorePadAccessor
}

export const ScoreCard: Component<Props> = ({
	playerName: [getPlayerName, setPlayerName], round: [getRound], getScorePad: scorePad
}) => {

	const [getNameInputRef, setNameInputRef] = createSignal<HTMLInputElement>()

	const [getNameDisabled, setNameDisabled] = createSignal(true)
	onMount(() => setNameDisabled(false))

	return (
		<section id="score-card" role="document">
			<aside role="banner">
				<span class="name">
					<input ref={setNameInputRef}
						disabled={getNameDisabled()} type="text" class="name-input"
						placeholder={getNameDisabled() ? '...' : 'Your name here' }
						value={getPlayerName()} onInput={e => setPlayerName(e.currentTarget.value)} />
					<button
						disabled={getNameDisabled()}
						class="clear-name" aria-label="Clear the name value" innerHTML={EraserIcon}
						onClick={() => {
							setPlayerName('')
							getNameInputRef()?.focus()
						}} />
				</span>
				<RoundLabel getRound={getRound} />
			</aside>
			<article id="part1" role="presentation">
				<PartOne scorePad={scorePad} />
			</article>
			<article id="part2" role="presentation">
				<PartTwo scorePad={scorePad} />
			</article>
			<article id="score" role="presentation">
				<Totals scorePad={scorePad} />
			</article>
		</section>
	)
}

type RoundLabelProps = {
    getRound: Accessor<number>
}
const RoundLabel: Component<RoundLabelProps> =({ getRound }) => {

	return <>
		{
			getRound() > roundAmount ? (
				<span class="round-number finished"
					aria-label="Game finished"
					innerHTML={FinishedIcon} />
			) : (
				<span class="round-number">
					<span class="round-label">Round</span>
					{getRound()}
				</span>
			)
		}
	</>
}