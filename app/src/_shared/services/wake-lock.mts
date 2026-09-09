import { screenLockStore } from '../stores/screenLockStore.mts'

type SafeWakeLockSentinel = {
	released: boolean
	release(): Promise<void>
	addEventListener(type: 'release', listener: () => void): void
}

type SafeWakeLock = {
	request(type: 'screen'): Promise<SafeWakeLockSentinel>
}

let sentinel: SafeWakeLockSentinel | undefined
let noticeShown = false

function getApi(): SafeWakeLock | undefined {
	if (typeof navigator === 'undefined') return undefined
	const nav = navigator as Navigator & { wakeLock?: SafeWakeLock }
	return nav.wakeLock
}

async function acquire() {
	const api = getApi()
	if (!api) {
		if (!noticeShown) {
			console.info('[wake-lock] navigator.wakeLock is not available in this browser; toggle is inert.')
			noticeShown = true
		}
		return
	}
	if (sentinel && !sentinel.released) return
	try {
		sentinel = await api.request('screen')
		sentinel.addEventListener('release', () => {
			sentinel = undefined
		})
	}
	catch (error) {
		console.warn('[wake-lock] request failed', error)
		sentinel = undefined
	}
}

async function releaseIfHeld() {
	if (sentinel && !sentinel.released) {
		try {
			await sentinel.release()
		}
		catch (error) {
			console.warn('[wake-lock] release failed', error)
		}
	}
	sentinel = undefined
}

if (typeof document !== 'undefined') {
	if (screenLockStore.value) void acquire()

	screenLockStore.on('change', new AbortController().signal, async ({ detail }) => {
		if (detail.state) await acquire()
		else await releaseIfHeld()
	})

	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible' && screenLockStore.value) {
			void acquire()
		}
	})
}
