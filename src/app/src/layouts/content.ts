const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let prefersReducedMotion = mediaQuery.matches;

mediaQuery.addEventListener('change', () => {
    prefersReducedMotion = mediaQuery.matches;
});

const topElement = document.getElementById('top')!;
const topScroller = document.getElementById('topScroller')!;

function scrollToTop() {
    topScroller.blur();

    if (prefersReducedMotion) {
        window.scrollTo({ top: 0 });
        topElement.focus();
    }
    else {
        topElement.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

topScroller.addEventListener('click', scrollToTop);