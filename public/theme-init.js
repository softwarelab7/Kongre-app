// public/theme-init.js
// Aplica el tema guardado ANTES de pintar (evita parpadeo). Dos modos: claro y oscuro.
// Extraído de index.html para cumplir con Content-Security-Policy (H-03) sin 'unsafe-inline'.
(function () {
  try {
    var t = localStorage.getItem('kongre-theme') || localStorage.getItem('kongre_theme');
    if (t !== 'dark' && t !== 'light') {
      t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.dataset.theme = t;
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.classList.remove('theme-cabina');
    var c = t === 'dark' ? '#111827' : '#4C3AED';
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', c);
  } catch (e) {}
})();
