

import { createEffect, createSignal } from 'solid-js';

const isServerSide = () => typeof window === 'undefined' || window === undefined;

export function createBlobAccessor(url) {

	if (isServerSide()) return;

    const dataSignal = createSignal();
    const [getDataSignal, setDataSignal] = dataSignal;

    createEffect(async () => {

        const origin = document.location.origin;

        try {
            const data = await fetch(origin + url)
                .then(response => response.blob());

            setDataSignal(_ => data);
        }
        catch {
            console.warn(`failed to fetch resource: ${url}`);
        }

    })

    return getDataSignal;
}