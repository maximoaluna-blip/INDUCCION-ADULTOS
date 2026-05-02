/* ============================================================================
   THEME TOGGLE - Plataforma de Formacion Rover ASC
   - Lee/escribe preferencia en localStorage ("rover-theme")
   - Respeta prefers-color-scheme en la primera visita
   - Inyecta un boton circular en .top-bar-inner (si existe)
   - Se ejecuta inline-early para minimizar FOUC
   ============================================================================ */
(function() {
    var STORAGE_KEY = 'rover-theme';
    var root = document.documentElement;

    function getStored() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    }

    function setStored(v) {
        try { localStorage.setItem(STORAGE_KEY, v); } catch (e) {}
    }

    function currentTheme() {
        return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.removeAttribute('data-theme');
        }
        updateIcon();
    }

    function updateIcon() {
        var toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        var isDark = currentTheme() === 'dark';
        toggle.textContent = isDark ? '\u2600\uFE0F' : '\uD83C\uDF19'; // ☀️ o 🌙
        var label = isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
        toggle.setAttribute('aria-label', label);
        toggle.setAttribute('title', label);
    }

    function init() {
        var saved = getStored();
        if (saved === 'dark' || saved === 'light') {
            applyTheme(saved);
            return;
        }
        var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
    }

    function mountToggle() {
        if (document.getElementById('themeToggle')) {
            updateIcon();
            return;
        }
        var host = document.querySelector('.top-bar-inner') || document.querySelector('.top-bar');
        if (!host) return;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'themeToggle';
        btn.className = 'theme-toggle';
        btn.addEventListener('click', function() {
            var next = currentTheme() === 'dark' ? 'light' : 'dark';
            setStored(next);
            applyTheme(next);
        });
        host.appendChild(btn);
        updateIcon();
    }

    // Aplicacion temprana del tema (antes de que pinte el body)
    init();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountToggle);
    } else {
        mountToggle();
    }
})();
