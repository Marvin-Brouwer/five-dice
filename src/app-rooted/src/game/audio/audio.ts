import balloonPopUrl from './458398__breviceps__balloon-pop-christmas-cracker-confetti-cannon.wav'
import trumpetUrl from './383154__profcalla__re_frullato_tromba.mp3'
import partyHornUrl from './170583__audiosmedia__party-horn.wav'
import type { EventBuilder } from '@rooted/elements/events'
import { createEchoDelayEffect } from './echo-delay.ts'

type PitchShifter = (audioContext: AudioContext, node: AudioNode) => AudioNode

export type AudioPlayer = {
	playGameEndFanfare(): Promise<void>
}

function appendBuffer(audioContext: AudioContext, audioBuffer: AudioBuffer, shifter?: PitchShifter) {
	const actualShifter = shifter ?? ((_, n) => n)
	const bufferSource = audioContext.createBufferSource()
	bufferSource.buffer = audioBuffer
	actualShifter(audioContext, bufferSource).connect(audioContext.destination)
	bufferSource.loop = false
	bufferSource.start()
}

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

const unlockEvents = ['pointerdown', 'keydown', 'touchstart'] as const

export async function createAudioPlayer(on: EventBuilder): Promise<AudioPlayer> {
	if (typeof window === 'undefined') {
		return { playGameEndFanfare: async () => {} }
	}

	let audioContext: AudioContext | undefined
	const bufferCache = new Map<string, AudioBuffer>()
	const inFlight = new Map<string, Promise<AudioBuffer>>()

	function ensureContext(): AudioContext {
		if (!audioContext) {
			const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
			audioContext = new Ctor()
		}
		return audioContext
	}

	function loadBuffer(url: string): Promise<AudioBuffer> {
		const cached = bufferCache.get(url)
		if (cached) return Promise.resolve(cached)
		const pending = inFlight.get(url)
		if (pending) return pending
		const promise = (async () => {
			const context = ensureContext()
			const response = await fetch(url)
			const arrayBuffer = await response.arrayBuffer()
			const buffer = await context.decodeAudioData(arrayBuffer)
			bufferCache.set(url, buffer)
			return buffer
		})()
		inFlight.set(url, promise)
		void promise.catch(() => {}).finally(() => inFlight.delete(url))
		return promise
	}

	let unlocked = false
	function unlock() {
		if (unlocked) return
		unlocked = true
		ensureContext()
		void Promise.all([balloonPopUrl, trumpetUrl, partyHornUrl].map(loadBuffer))
			.catch((e) => console.warn('audio warm-up failed', e))
	}
	for (const eventName of unlockEvents) on('document', eventName, unlock)

	async function playGameEndFanfare() {
		const context = ensureContext()
		try {
			const [balloon, trumpet, partyHorn] = await Promise.all([
				loadBuffer(balloonPopUrl),
				loadBuffer(trumpetUrl),
				loadBuffer(partyHornUrl),
			])
			context.suspend()
			appendBuffer(context, balloon, createBalloonEffect(3))
			appendBuffer(context, trumpet, createPartyHornEffect(0))
			appendBuffer(context, partyHorn, createPartyHornEffect(0.06))
			context.resume()
		}
		catch (e) {
			console.warn('audio failed', e)
		}
	}

	return { playGameEndFanfare }
}
