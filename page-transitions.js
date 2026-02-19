// Page Transitions — Apple-style crossfade
(function () {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Dismiss preloader
    function dismissPreloader() {
        var preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.transition = 'opacity 0.3s ease';
            preloader.style.opacity = '0';
            setTimeout(function () {
                preloader.style.display = 'none';
            }, 300);
        }
    }

    // Show page
    window.addEventListener('load', function () {
        dismissPreloader();
        document.body.classList.add('page-loaded');
    });

    // Fallback — if load takes too long, show page after 2s
    setTimeout(function () {
        dismissPreloader();
        document.body.classList.add('page-loaded');
    }, 2000);

    if (reducedMotion) return;

    // Intercept internal link clicks for smooth transition
    document.addEventListener('click', function (e) {
        var link = e.target.closest('a');
        if (!link) return;

        var href = link.getAttribute('href');
        if (!href) return;

        // Skip external links, anchors, downloads, mailto, tel
        if (link.hostname && link.hostname !== window.location.hostname) return;
        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        if (link.hasAttribute('download')) return;
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;

        e.preventDefault();
        document.body.classList.add('page-leaving');

        setTimeout(function () {
            window.location.href = href;
        }, 300);
    });
})();