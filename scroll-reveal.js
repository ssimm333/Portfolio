/**
 * Apple-style scroll reveal using Intersection Observer.
 * Any element with class "reveal", "reveal-scale", "reveal-left", or "reveal-right"
 * will animate into view when it enters the viewport.
 */
(function () {
    const SELECTORS = '.reveal, .reveal-scale, .reveal-left, .reveal-right';

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-visible');
                    observer.unobserve(entry.target); // animate once only
                }
            });
        },
        {
            threshold: 0.12,  // trigger when 12% visible
            rootMargin: '0px 0px -60px 0px' // slight offset so it triggers a bit after entering
        }
    );

    function init() {
        document.querySelectorAll(SELECTORS).forEach((el) => {
            observer.observe(el);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
