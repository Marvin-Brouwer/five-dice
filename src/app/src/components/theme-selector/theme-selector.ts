
const htmlNode = document.body.parentElement;
const themeSelector = document.getElementById<HtmlSelectElement>('theme');

themeSelector.addEventListener('change', () => {
    htmlNode.setAttribute('data-theme', themeSelector.value);
    // TODO set cookie
})