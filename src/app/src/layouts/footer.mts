const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let prefersReducedMotion = mediaQuery.matches;

mediaQuery.addEventListener('change', () => {
    prefersReducedMotion = mediaQuery.matches;
});

const topElement = document.getElementById('top');
const topScroller = document.getElementById('top-scroller');

function scrollToTop() {
    topScroller?.blur();

    if (prefersReducedMotion) {
        window.document.body.scrollTo({ top: 0 });
        topElement?.focus();
    }
    else {
        topElement?.focus({ preventScroll: true });
        window.document.body.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

topScroller?.addEventListener('click', scrollToTop);