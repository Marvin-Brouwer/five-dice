

import { onMount, onCleanup, createSignal } from 'solid-js';

export function createBlobAccessor(url, baseUrl) {
    
    const dataSignal = createSignal();
    const [getDataSignal, setDataSignal] = dataSignal;

    const abortController = new AbortController();
    const { signal } = abortController;

    onCleanup(() => {
        abortController.abort();
    });
    onMount(async () => {

        const origin = document.location.origin;    
        
        try {
            const data = await fetch(origin + baseUrl + url, { signal })
                .then(response => response.blob());

            setDataSignal(_ => data);
        }
        catch {
            console.warn(`failed to fetch resource: ${url}`);
        }

    })

    return getDataSignal;
}