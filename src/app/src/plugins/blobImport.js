

import { onMount, onCleanup, createSignal } from 'solid-js';

export function createBlobAccessor(url) {
    
    const dataSignal = createSignal();
    const [getDataSignal, setDataSignal] = dataSignal;

    const abortController = new AbortController();
    const { signal } = abortController;

    onCleanup(() => {
        abortController.abort();
    });
    onMount(async () => {

        const baseUrl = import.meta.env.BASE_URL;
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