import { createSignal, onMount, onCleanup } from 'solid-js'
import { isServerSide } from '../helpers/utilities'

const userContextEvents = [
	'mousemove',
	'click',
	'tap',
	'drag',
	'focus',
	'pointerdown',
	'scroll',
	'keypress',
]

type WebkitAudioContext = {
	webkitAudioContext: AudioContext
}

export function createAudioContextAccessor() {

	const [getAudioContext, setAudioContext] = createSignal<AudioContext>()
	if (isServerSide()) return getAudioContext

	function detachEventListeners() {
		for(const eventName of userContextEvents) document.body.removeEventListener(eventName, createAudioContext)
	}
	function attachEventListeners() {
		for(const eventName of userContextEvents) document.body.addEventListener(eventName, createAudioContext, { once: true })
	}
	function createAudioContext() {

		setAudioContext(new (window.AudioContext || (window as unknown as WebkitAudioContext).webkitAudioContext)())

		detachEventListeners()
	}

	onMount(attachEventListeners)
	onCleanup(detachEventListeners)

	return getAudioContext
}