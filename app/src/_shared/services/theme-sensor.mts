import { themeStore, type Theme } from '../stores/themeStore.mts'
import { syncThemeColor } from './theme-color.mts'

type SensorLike = {
	illuminance: number
	start(): void
	stop(): void
	addEventListener(type: 'reading' | 'error', listener: (event: Event) => void): void
	removeEventListener(type: 'reading' | 'error', listener: (event: Event) => void): void
}

type SensorConstructor = new (options?: { frequency?: number }) => SensorLike

type Resolved = 'light' | 'dark'

const LUX_LIGHT_MIN = 40
const LUX_DARK_MAX = 10

let mediaQuery: MediaQueryList | undefined
let sensor: SensorLike | undefined
let lastResolved: Resolved | undefined

function apply(resolved: Resolved) {
	if (typeof document === 'undefined') return
	document.documentElement.dataset.theme = resolved
	// The browser chrome reads its colour off the tokens, so it has to be
	// repainted after the theme attribute lands, not before.
	syncThemeColor()
	lastResolved = resolved
}

function getSensorCtor(): SensorConstructor | undefined {
	if (typeof window === 'undefined') return undefined
	const w = window as unknown as { AmbientLightSensor?: SensorConstructor }
	return w.AmbientLightSensor
}

export function sensorAvailable(): boolean {
	return getSensorCtor() !== undefined
}

function stopSensor() {
	if (!sensor) return
	try { sensor.stop() } catch { /* ignore */ }
	sensor = undefined
}

function startSensor() {
	const Ctor = getSensorCtor()
	if (!Ctor) return false
	try {
		sensor = new Ctor({ frequency: 1 })
		sensor.addEventListener('reading', () => {
			if (!sensor) return
			const lux = sensor.illuminance
			if (lux >= LUX_LIGHT_MIN) apply('light')
			else if (lux <= LUX_DARK_MAX) apply('dark')
			// values in the gap keep the previous resolved theme
		})
		sensor.addEventListener('error', (event) => {
			console.warn('[theme-sensor] AmbientLightSensor error', event)
			stopSensor()
			applyFromMatchMedia()
		})
		sensor.start()
		return true
	}
	catch (error) {
		console.warn('[theme-sensor] AmbientLightSensor unavailable at runtime', error)
		sensor = undefined
		return false
	}
}

function ensureMediaListener() {
	if (mediaQuery || typeof window === 'undefined' || !window.matchMedia) return
	mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
	mediaQuery.addEventListener('change', () => {
		// Re-resolve if the user is still on system/sensor and no sensor is active.
		const mode = themeStore.value
		if ((mode === 'system' || (mode === 'sensor' && !sensor))) {
			applyFromMatchMedia()
		}
	})
}

function applyFromMatchMedia() {
	if (typeof window === 'undefined' || !window.matchMedia) {
		apply('light')
		return
	}
	apply(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

function resolve(mode: Theme) {
	stopSensor()
	if (mode === 'light' || mode === 'dark') {
		apply(mode)
		return
	}
	if (mode === 'sensor') {
		if (startSensor()) return
		// Fell back; behave like system.
	}
	applyFromMatchMedia()
}

if (typeof document !== 'undefined') {
	ensureMediaListener()
	resolve(themeStore.value)

	themeStore.on('change', new AbortController().signal, ({ detail }) => {
		resolve(detail.state)
	})

	void lastResolved
}
