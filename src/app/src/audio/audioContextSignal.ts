import { createSignal, onMount, onCleanup } from 'solid-js';

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

export function createAudioContextAccessor() {

    const [getAudioContext, setAudioContext] = createSignal<AudioContext>();

    function detachEventListeners() {
        for(const eventName of userContextEvents) document.body.removeEventListener(eventName, createAudioContext)
    }
    function attachEventListeners() {
        for(const eventName of userContextEvents) document.body.addEventListener(eventName, createAudioContext, { once: true })
    }
    function createAudioContext() {
        
        setAudioContext(new (window.AudioContext || (window as any).webkitAudioContext)());

        detachEventListeners();
    }
    onMount(attachEventListeners);
    onCleanup(detachEventListeners);

    return getAudioContext;
}