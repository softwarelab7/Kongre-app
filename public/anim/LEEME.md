# Kongre - animaciones
svg/logo/       -> logo animado (claro y oscuro), SVG con animacion SMIL, sin librerias. Loader en bucle.
svg/iconos-*/   -> 21 iconos animados (se dibujan, se mueven y se repiten cada 4 s).
                   verde-texto = fondos claros, verde-neon = fondos oscuros.
video/          -> MP4: logo (claro y oscuro, 1280x720) y splash vertical verde (1080x1920).
gif/            -> GIF del logo y del loader (para vistas previas y redes).
kongre_animaciones.html -> galeria para ver todo en movimiento.

Uso en la web:  <img src="/anim/kongre_logo_animado_claro.svg" alt="Kongre">
Uso en React:   ya tienes AnimatedLogo y AnimIcon (pack web v4): se animan al cargar y al pasar el cursor.
Los SVG usan SMIL: funciona en Chrome, Safari y Firefox, tambien dentro de <img>.
Para la pantalla de carga (splash) nativa usa video/splash_vertical_verde.mp4.
