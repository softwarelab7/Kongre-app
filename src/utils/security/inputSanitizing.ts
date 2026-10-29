// src/utils/security/inputSanitizing.ts
// Extraído sin cambios de comportamiento desde theocraticSecurity.ts (ver barril src/utils/theocraticSecurity.ts).

/**
 * Neutraliza vectores de Inyección de Fórmulas en CSV / Excel (CWE-1236 / DDE Injection).
 * Si un valor comienza con `=`, `+`, `-`, `@`, `\t` o `\r` (salvo números telefónicos seguros o fechas),
 * antepone un apóstrofo `'` para forzar modo texto en Excel / Calc / Google Sheets.
 */
export function sanitizeCsvFormulaInjection(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  if (!str) return '';
  const trimmed = str.trimStart();
  if (/^[=+\-@]/.test(trimmed) || /^[\t\r]/.test(str)) {
    // Permitir números telefónicos legítimos tipo "+52 55 1234 5678" o "---" sin romper formato,
    // pero bloquear cualquier expresión con letras, paréntesis, pipes o comandos
    if (/^\+\d[\d\s\-()]{4,20}$/.test(trimmed) || /^-{2,5}$/.test(trimmed)) {
      return str;
    }
    return `'${str}`;
  }
  return str;
}

/**
 * Limpia texto proveniente de archivos CSV importados:
 * - Remueve prefijos de inyección de fórmulas (`'=`, `=`, `@`, etc.)
 * - Neutraliza etiquetas `<script>`, `javascript:` y manejadores de eventos HTML inline (`onload=`, `onerror=`, etc.)
 */
export function sanitizeImportedCsvText(value: string | undefined | null): string {
  if (!value) return '';
  return String(value)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/^\s*(javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, '')
    .replace(/\bon(error|load|click|mouseover|focus|blur)\s*=/gi, '')
    .replace(/^'+([=+\-@])/, '$1')
    .replace(/^[=@\t\r]+/, '')
    .trim();
}

/**
 * Abre una URL externa (como WhatsApp `https://wa.me/...`) mediante un elemento `<a>` seguro
 * con `rel="noopener noreferrer"` sin depender de `window.open`.
 */
export function openSafeExternalUrl(url: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !url) return;
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
      } catch {}
    }, 100);
  } catch {}
}
