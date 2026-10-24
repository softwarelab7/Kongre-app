// public/registerSW.js
// Inicializador seguro del Service Worker para Kongre PWA (evita fallback HTML en entorno dev/preview)
(function () {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker
      .getRegistrations()
      .then(function (registrations) {
        for (var i = 0; i < registrations.length; i++) {
          var reg = registrations[i];
          var scriptURL =
            (reg.active && reg.active.scriptURL) ||
            (reg.installing && reg.installing.scriptURL) ||
            (reg.waiting && reg.waiting.scriptURL) ||
            '';
          // Desregistrar posibles service workers de desarrollo (dev-sw.js) obsoletos que intercepten scripts
          if (scriptURL.indexOf('dev-sw.js') !== -1) {
            reg.unregister().catch(function () {});
          }
        }
      })
      .catch(function () {})
      .finally(function () {
        navigator.serviceWorker
          .register('/push-sw.js', { scope: '/' })
          .catch(function () {});
      });
  });
})();
