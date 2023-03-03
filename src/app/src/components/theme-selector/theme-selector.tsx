import "../die/die.css";
import "./theme-selector.css";

import ThemeNoneIcon from "../../icons/five-dice.color-scheme.none.svg?raw";
import ThemeDarkIcon from "../../icons/five-dice.color-scheme.dark.svg?raw";
import ThemeLightIcon from "../../icons/five-dice.color-scheme.light.svg?raw";
import ThemeSystemIcon from "../../icons/five-dice.color-scheme.system.svg?raw";

import { Component, onMount, onCleanup } from "solid-js";
import { createSignal, createEffect } from "solid-js";
import Cookie from "js-cookie";

interface Props {
    initialTheme: 'auto' | 'dark' | 'light'
    initialPreference: 'dark' | 'light' | 'no-preference'
}
function componentToHex(hexComponent: number) {
    var hex = hexComponent.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
  
function rgbToHex(r: any, g: any, b: any) {
    return "#" + componentToHex(Number(r)) + componentToHex(Number(g)) + componentToHex(Number(b));
}

const rgbParse = new RegExp("^rgb\\(\\s*(?<r>[0-9]+)\\s*,\\s(?<g>[0-9]+)\\s*,\\s*(?<b>[0-9]+)\\s*\\)$", "gi");
function updateThemeMeta() {
    const rgbTheme = window.getComputedStyle(document.body, null).getPropertyValue("background-color");
    const rgb = rgbParse.exec(rgbTheme);
    if (!rgb) return;

    const androidThemeNode = document.getElementById("android-theme-color") as HTMLMetaElement;
    const appleThemeNode = document.getElementById("apple-theme-color") as HTMLMetaElement;

    const hexColor = rgbToHex(rgb!.groups!["r"], rgb!.groups!["g"], rgb!.groups!["b"]);
    androidThemeNode.content = hexColor;
    appleThemeNode.content = hexColor;
}

export const ThemeSelector: Component<Props> = ({ initialTheme, initialPreference }) => {

    function setPreferredTheme(theme: 'auto' | 'light' | 'dark') {

        const htmlNode = document.body.parentElement;
        htmlNode?.setAttribute('data-theme', theme);
        updateThemeMeta();

        setSelectedTheme(theme);
        Cookie.set('theme', theme, { expires: 100 })
    }

    const [selectedTheme, setSelectedTheme] = createSignal(initialTheme);
    const [preferredColorScheme, setPreferredColorScheme] = createSignal(initialPreference);
        
    const handleColorSchemeChange = (event: MediaQueryListEvent) => {
        setPreferredColorScheme(event.matches ? 'dark' : 'light');
        updateThemeMeta();
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
        updateThemeMeta();
        
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
                <span aria-hidden={!autoSelected()} innerHTML={ThemeNoneIcon} />
                <span aria-hidden={!lightActive()} innerHTML={ThemeLightIcon} />
                <span aria-hidden={!darkActive()} innerHTML={ThemeDarkIcon} />
                <span aria-hidden={!autoSelected()} innerHTML={ThemeSystemIcon} />
            </span>
            <select id="theme" onChange={(e) => setPreferredTheme(e.currentTarget.value as any)}>
                <option value="auto" selected={autoSelected()}>System preference</option>
                <option value="light" selected={lightSelected()}>Light theme</option>
                <option value="dark" selected={darkSelected()}>Dark theme</option>
            </select>
        </span>
    );
}