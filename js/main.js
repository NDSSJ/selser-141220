// main.js
import { initSlideshow } from './slideshow.js';
import { initWheel } from './wheel.js';
import { initCountdown } from './countdown.js';

document.addEventListener('DOMContentLoaded', () => {
    initSlideshow();
    initWheel();
    initCountdown();
});
