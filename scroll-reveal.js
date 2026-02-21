/**
 * Apple-style scroll reveal using Intersection Observer.
 * Elements animate in when entering the viewport and
 * reset when leaving, so they animate again on re-entry.
 */
(function () {
    const SELECTORS = '.reveal, .reveal-scale, .reveal-left, .reveal-right';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-visible');
                } else {
                    entry.target.classList.remove('reveal-visible');
                }
            });
        },
        {
            threshold: 0.12,
            rootMargin: '0px 0px -60px 0px'
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
