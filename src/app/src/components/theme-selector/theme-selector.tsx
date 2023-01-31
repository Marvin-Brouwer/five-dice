import "../die/die.css";
import "./theme-selector.css";

import { Component, onMount, onCleanup } from "solid-js";
import { createSignal, createEffect } from "solid-js";
import Cookie from "js-cookie";

interface Props {
    initialTheme: 'auto' | 'dark' | 'light'
    initialPreference: 'dark' | 'light' | 'no-preference'
}

export const ThemeSelector: Component<Props> = ({ initialTheme, initialPreference }) => {

    function setPreferredTheme(theme: 'auto' | 'light' | 'dark') {

        const htmlNode = document.body.parentElement;
        htmlNode?.setAttribute('data-theme', theme);

        setSelectedTheme(theme);
        Cookie.set('theme', theme, { expires: 100 })
    }

    const [selectedTheme, setSelectedTheme] = createSignal(initialTheme);
    const [preferredColorScheme, setPreferredColorScheme] = createSignal(initialPreference);
        
    const handleColorSchemeChange = (event: MediaQueryListEvent) => {
        setPreferredColorScheme(event.matches ? 'dark' : 'light');
    }

    function isSelected(theme: 'auto' | 'light' | 'dark'): boolean {

        return selectedTheme() == theme;
    }

    function isActive(theme: 'auto' | 'light' | 'dark'): boolean {
        if (selectedTheme() !== 'auto') return isSelected(theme);

        return preferredColorScheme() == theme;
    }
    const [autoSelected, setAutoSelected] = createSignal(isSelected('auto'));
    const [lightSelected, setLightSelected] = createSignal(isSelected('light'));
    const [darkSelected, setDarkSelected] = createSignal(isSelected('dark'));
    const [lightActive, setLightActive] = createSignal(isActive('light'));
    const [darkActive, setDarkActive] = createSignal(isActive('dark'));

    createEffect(() => {
        setAutoSelected(isSelected('auto'));
        setLightSelected(isSelected('light'));
        setDarkSelected(isSelected('dark'));
        setLightActive(isActive('light'));
        setDarkActive(isActive('dark'));
        
    }, [selectedTheme(), preferredColorScheme()]);

    onMount(() => {
        const colorSchemeMount = window.matchMedia('(prefers-color-scheme: dark)');
        setPreferredColorScheme(colorSchemeMount.matches ? 'dark' : 'light');
        colorSchemeMount
            .addEventListener("change", handleColorSchemeChange)
    });
  
    onCleanup(() => {
        window.matchMedia('(prefers-color-scheme: dark)')
            .removeEventListener("change", handleColorSchemeChange)
    })

    return (
        <span class="theme-selector">
            <span role="img" class="theme-icon die">
                {/* The optical disk is just here to give some image when no preference is found on page load */}
                <span aria-hidden={!autoSelected()}>💿</span>
                <span aria-hidden={!autoSelected()} class="small-icon">⚙️</span>
                <span aria-hidden={!lightActive()}>🌞</span>
                <span aria-hidden={!darkActive()}>🌒</span>
            </span>
            <select id="theme" onChange={(e) => setPreferredTheme(e.currentTarget.value as any)}>
                <option value="auto" selected={autoSelected()}>System preference</option>
                <option value="light" selected={lightSelected()}>Light theme</option>
                <option value="dark" selected={darkSelected()}>Dark theme</option>
            </select>
        </span>
    );
}