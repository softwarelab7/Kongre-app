// public/theme-init.js
// La aplicación inicia siempre predeterminada en modo Claro ('light') antes de pintar (evita parpadeo).
(function () {
  try {
    var t = 'light';
    localStorage.setItem('kongre-theme', 'light');
    localStorage.setItem('kongre_theme', 'light');
    localStorage.setItem('theme', 'light');
    document.documentElement.dataset.theme = t;
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.remove('theme-cabina');
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', '#4C3AED');
  } catch (e) {}
})();
