const adContainer = document.querySelector('.ad-container');
const skipButton = document.querySelector('.skip-button');

skipButton.addEventListener('click', function() {
   adContainer.style.display = 'none'; // or adContainer.remove();
});

