/**
 * Instrumentation for the end-of-game celebration, installed before the page
 * loads.
 *
 * Neither half of the celebration leaves a mark a test can assert on: the
 * confetti draws to its own canvas and the fanfare is Web Audio. So count the
 * calls instead — animation frames for the confetti, and buffer playback for
 * the sound.
 */

export type CelebrationSpy = {
	/** Animation frames requested. Flat at idle; climbs while confetti runs. */
	rafCalls: number
	decodeAttempts: number
	decodeFailures: number
	/** Audio buffers actually started, i.e. sound was produced. */
	soundsStarted: number
}

declare global {
	interface Window {
		__celebration: CelebrationSpy
	}
}

/**
 * Runs in the page, before any application code. Written as a standalone
 * function so it can be handed to `addInitScript` directly.
 */
export function installCelebrationSpy() {
	const spy: CelebrationSpy = {
		rafCalls: 0,
		decodeAttempts: 0,
		decodeFailures: 0,
		soundsStarted: 0,
	}
	window.__celebration = spy

	// Nothing else in this app animates, so the frame count is a clean read on
	// whether the confetti is still running.
	const requestFrame = window.requestAnimationFrame.bind(window)
	window.requestAnimationFrame = (callback) => {
		spy.rafCalls++
		return requestFrame(callback)
	}

	const decode = AudioContext.prototype.decodeAudioData
	AudioContext.prototype.decodeAudioData = function (...parameters: Parameters<typeof decode>) {
		spy.decodeAttempts++
		const result = decode.apply(this, parameters)
		void result.catch(() => { spy.decodeFailures++ })
		return result
	}

	const start = AudioBufferSourceNode.prototype.start
	AudioBufferSourceNode.prototype.start = function (...parameters: Parameters<typeof start>) {
		spy.soundsStarted++
		return start.apply(this, parameters)
	}
}
