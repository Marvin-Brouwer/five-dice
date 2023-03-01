

import { createEffect, createSignal } from 'solid-js';

export function createBlobAccessor(url) {
    
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