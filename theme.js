// Theme Management

const ThemeManager = {
    get currentTheme() {
        return localStorage.getItem('theme') || 'dark';
    },

    set currentTheme(value) {
        localStorage.setItem('theme', value);
        document.body.classList.toggle('light-mode', value === 'light');
        this.updateButtonIcon();
        this.dispatchThemeEvent(value);
    },

    init() {
        // Set initial state without transition to avoid flicker
        if (this.currentTheme === 'light') {
            document.body.classList.add('light-mode');
        }
        this.updateButtonIcon();

        // Add event listener to button
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.addEventListener('click', () => this.toggle());
        }
    },

    toggle() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    },

    updateButtonIcon() {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;

        // Simple text/emoji for now, can be SVG later
        const isDark = this.currentTheme === 'dark';
        // Moon for Dark Mode (to switch to light), Sun for Light Mode (to switch to dark)
        // Actually standard convention: Show the icon of the mode you will SWITCH TO, or the current mode?
        // Let's show the CURRENT mode's representative icon, or a toggle switch.
        // User requested: "change the entire website to light/dark mode"
        // Let's use a Sun icon when in Dark mode (implies "turn on lights"), 
        // and Moon icon when in Light mode (implies "turn off lights/go dark").

        // Sun: ☀️ (or SVG)
        // Moon: 🌙 (or SVG)

        btn.innerHTML = isDark
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

        btn.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
        btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    },

    dispatchThemeEvent(theme) {
        const event = new CustomEvent('themeChanged', { detail: { theme } });
        window.dispatchEvent(event);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
});
