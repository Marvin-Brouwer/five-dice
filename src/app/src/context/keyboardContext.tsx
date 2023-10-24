import { createSignal, createContext, useContext, Component, ParentProps, onMount, onCleanup, Accessor } from 'solid-js'
import { isServerSide } from '../helpers/utilities'

type KeyboardContext = {
	isKeyboardUser: Accessor<boolean>
}
const KeyboardContext = createContext<KeyboardContext>({ isKeyboardUser: () => false})

export const KeyboardContextProvider: Component<ParentProps> = (props) => {

	const [isKeyboardUser, setIsKeyboardUser] = createSignal(true)

	onMount(() => {
		if (isServerSide()) return

		document.addEventListener('mousemove', () => setIsKeyboardUser(false))
		document.addEventListener('mousedown', () => setIsKeyboardUser(false))
		document.addEventListener('mouseup', () => setIsKeyboardUser(false))
		document.addEventListener('contextmenu', () => setIsKeyboardUser(false))
		document.addEventListener('dblclick', () => setIsKeyboardUser(false))
		document.addEventListener('dragstart', () => setIsKeyboardUser(false))
		document.addEventListener('dragend', () => setIsKeyboardUser(false))
		document.addEventListener('drop', () => setIsKeyboardUser(false))
		document.addEventListener('pointermove', () => setIsKeyboardUser(false))
		document.addEventListener('touchstart', () => setIsKeyboardUser(false))
		document.addEventListener('touchend', () => setIsKeyboardUser(false))
		document.addEventListener('wheel', () => setIsKeyboardUser(false))

		document.addEventListener('keydown', () => setIsKeyboardUser(true))
		document.addEventListener('keyup', () => setIsKeyboardUser(true))
	})
	onCleanup(() => {
		if (isServerSide()) return

		document.removeEventListener('mousemove', () => setIsKeyboardUser(false))
		document.removeEventListener('mousedown', () => setIsKeyboardUser(false))
		document.removeEventListener('mouseup', () => setIsKeyboardUser(false))
		document.removeEventListener('contextmenu', () => setIsKeyboardUser(false))
		document.removeEventListener('dblclick', () => setIsKeyboardUser(false))
		document.removeEventListener('dragstart', () => setIsKeyboardUser(false))
		document.removeEventListener('dragend', () => setIsKeyboardUser(false))
		document.removeEventListener('drop', () => setIsKeyboardUser(false))
		document.removeEventListener('pointermove', () => setIsKeyboardUser(false))
		document.removeEventListener('touchstart', () => setIsKeyboardUser(false))
		document.removeEventListener('touchend', () => setIsKeyboardUser(false))
		document.removeEventListener('wheel', () => setIsKeyboardUser(false))

		document.removeEventListener('keydown', () => setIsKeyboardUser(true))
		document.removeEventListener('keyup', () => setIsKeyboardUser(true))
	})

	return (
		<KeyboardContext.Provider value={{isKeyboardUser}}>
			{props.children}
		</KeyboardContext.Provider>
	)
}

export function useKeyboardContext() { return useContext(KeyboardContext) }