/**
 * vite-security-headers.ts
 * Genera la Content-Security-Policy y el resto de cabeceras de seguridad en el build de producción.
 *
 *  - Calcula el hash SHA-256 del script inline del tema (index.html) para no necesitar 'unsafe-inline' en scripts.
 *  - Emite `dist/_headers` (formato Netlify / Cloudflare Pages; para otros hosts ver SECURITY_DEPLOY.md).
 *  - Con KONGRE_CSP=enforce también inserta la CSP como <meta> (red de seguridad si el host no permite cabeceras;
 *    ojo: <meta> no soporta frame-ancestors; esa directiva solo funciona como cabecera).
 *
 * MODO POR DEFECTO = solo informe (Content-Security-Policy-Report-Only): no bloquea nada, solo avisa en la consola
 * del navegador. Despliega así, navega por TODAS las pantallas (mapas, PDF, login con Google, impresión,
 * notificaciones), corrige lo que avise y entonces compila con KONGRE_CSP=enforce.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

export function buildCsp(supabaseOrigin: string, scriptHashes: string[], opts: { forMeta?: boolean } = {}): string {
  const d: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", 'https://va.vercel-scripts.com', ...scriptHashes],
    // 'unsafe-inline' en estilos: React (style=...) y Leaflet lo necesitan. Es el riesgo menor.
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'], // teselas de mapa y fotos de perfil de Google
    'media-src': ["'self'", 'data:', 'blob:'],
    // connect-src también rige los fetch() del service worker (teselas en caché, fuentes).
    'connect-src': [
      "'self'",
      supabaseOrigin,
      'https://va.vercel-scripts.com',
      'https://nominatim.openstreetmap.org',
      'https://*.basemaps.cartocdn.com',
      'https://*.tile.openstreetmap.org',
      'https://server.arcgisonline.com',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],
    'frame-src': ["'self'", 'blob:', 'data:'], // vistas previas de PDF
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };
  if (!opts.forMeta) d['frame-ancestors'] = ["'none'"];
  return Object.entries(d).map(([k, v]) => `${k} ${v.join(' ')}`).join('; ');
}

export function securityHeadersPlugin(env: Record<string, string>): Plugin {
  const enforce = process.env.KONGRE_CSP === 'enforce';
  const supabaseOrigin = (() => {
    try { return new URL(env.VITE_SUPABASE_URL || 'https://rceyevhwhtjshsthrrtp.supabase.co').origin; }
    catch { return 'https://rceyevhwhtjshsthrrtp.supabase.co'; }
  })();
  let hashes: string[] = [];
  let resolved: ResolvedConfig;

  return {
    name: 'kongre-security-headers',
    apply: 'build',
    configResolved(c) { resolved = c; },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        hashes = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)]
          .map((m) => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
        if (!enforce) return html;
        const csp = buildCsp(supabaseOrigin, hashes, { forMeta: true });
        return html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`);
      },
    },
    closeBundle() {
      const outDir = path.resolve(resolved.root, resolved.build.outDir);
      if (!fs.existsSync(outDir)) return;
      const cspHeader = enforce ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';
      const file = [
        '/*',
        `  ${cspHeader}: ${buildCsp(supabaseOrigin, hashes)}`,
        '  X-Content-Type-Options: nosniff',
        '  X-Frame-Options: DENY',
        '  Referrer-Policy: strict-origin-when-cross-origin',
        '  Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()',
        '  Cross-Origin-Opener-Policy: same-origin-allow-popups',
        '  Strict-Transport-Security: max-age=31536000; includeSubDomains',
        '',
        '/sw.js',
        '  Cache-Control: no-cache',
        '',
        '/index.html',
        '  Cache-Control: no-cache',
        '',
      ].join('\n');
      fs.writeFileSync(path.join(outDir, '_headers'), file);
      // eslint-disable-next-line no-console
      console.log(`[kongre-security-headers] _headers escrito (${enforce ? 'ENFORCE' : 'REPORT-ONLY'}), ${hashes.length} hash(es) de script inline.`);
    },
  };
}
