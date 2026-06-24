import { createEchoDelayEffect } from './echo-delay.ts'

const audioBase = `${import.meta.env.BASE_URL}audio`
const balloonPopUrl = `${audioBase}/458398__breviceps__balloon-pop-christmas-cracker-confetti-cannon.wav`
const trumpetUrl = `${audioBase}/383154__profcalla__re_frullato_tromba.mp3`
const partyHornUrl = `${audioBase}/170583__audiosmedia__party-horn.wav`

type PitchShifter = (audioContext: AudioContext, node: AudioNode) => AudioNode

let audioContextInstance: AudioContext | undefined

function getAudioContext(): AudioContext | undefined {
	if (typeof window === 'undefined') return undefined
	const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
	if (!Ctor) return undefined
	if (!audioContextInstance) audioContextInstance = new Ctor()
	return audioContextInstance
}

async function fetchBlob(url: string): Promise<Blob> {
	const response = await fetch(url)
	return response.blob()
}

async function appendBuffer(audioContext: AudioContext, blob: Blob, shifter?: PitchShifter) {
	const actualShifter = shifter ?? ((_, n) => n)
	const bufferSource = audioContext.createBufferSource()
	const audioBuffer = await audioContext.decodeAudioData(await blob.arrayBuffer())
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

export async function playGameEndFanfare() {
	const audioContext = getAudioContext()
	if (!audioContext) return

	try {
		const [balloon, trumpet, partyHorn] = await Promise.all([
			fetchBlob(balloonPopUrl),
			fetchBlob(trumpetUrl),
			fetchBlob(partyHornUrl),
		])
		audioContext.suspend()
		await appendBuffer(audioContext, balloon, createBalloonEffect(3))
		await appendBuffer(audioContext, trumpet, createPartyHornEffect(0))
		await appendBuffer(audioContext, partyHorn, createPartyHornEffect(0.06))
		audioContext.resume()
	}
	catch (e) {
		console.warn('audio failed', e)
	}
}
