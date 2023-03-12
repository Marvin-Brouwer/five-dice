import type { Setter, Accessor, Signal } from "solid-js";
import { createMemo } from 'solid-js';

export type SimpleSetter<T> = (value: T) => T
export function createSetterProxy<T>(parentSetter: SimpleSetter<T>, parentAccessor: Accessor<T>): Setter<T> {
    const setterProxy = ((handler) => {
        const previousValue = parentAccessor();
        const newValue = typeof handler === 'function'
            ? (handler as SimpleSetter<T>)(previousValue)
            : handler;
        return parentSetter(newValue);
    }) as Setter<T>

    return setterProxy;
}
export function createAccessorProxy<T>(parentAccessor: Accessor<T>): Accessor<T> {
    return parentAccessor
}

export function createProxyForSignal<T>(signal: Signal<T>): Signal<T> {

    const [accessor, setter] = signal;
    return [
        createAccessorProxy(accessor),
        createSetterProxy(v => setter(_ => v), accessor)
    ]
}
export function createProxyForSignalAccessor<T>(signal: Accessor<Signal<T>>): Signal<T> {

    return createMemo(() => createProxyForSignal(signal()), signal)();
}
export function createSignalProxy<T>(accessor: Accessor<T>, setter: SimpleSetter<T>): Signal<T> {

    return [
        createAccessorProxy(accessor),
        createSetterProxy(setter, accessor)
    ]
}