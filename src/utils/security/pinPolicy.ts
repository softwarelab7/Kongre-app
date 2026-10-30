// src/utils/security/pinPolicy.ts
// Extraído sin cambios de comportamiento desde theocraticSecurity.ts (ver barril src/utils/theocraticSecurity.ts).

export interface PinStrengthResult {
  score: number; // 0: Débil, 1: Básico, 2: Fuerte, 3: Óptimo
  label: string;
  color: string;
  isWeak: boolean;
  message?: string;
}

const TRIVIAL_PINS = new Set([
  '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
  '1234', '4321', '0123', '9876', '2580', '1379',
  '000000', '111111', '123456', '654321', '123123',
  '12345678', '87654321', '00000000', '11111111'
]);

export function evaluatePinStrength(pin: string): PinStrengthResult {
  if (!pin || pin.length < 6) {
    return {
      score: 0,
      label: 'Muy corto',
      color: 'bg-slate-300 text-slate-500',
      isWeak: true,
      message: 'Mínimo 6 caracteres o dígitos'
    };
  }

  const allSameChar = /^([a-zA-Z0-9])\1+$/.test(pin);
  if (TRIVIAL_PINS.has(pin) || allSameChar) {
    return {
      score: 0,
      label: 'Inseguro',
      color: 'bg-rose-500 text-white',
      isWeak: true,
      message: 'Combinación obvia o repetitiva. Usa números no correlativos.'
    };
  }

  let score = 1;

  if (pin.length >= 6) score += 1;

  const hasDigits = /\d/.test(pin);
  const hasLetters = /[a-zA-Z]/.test(pin);
  if (hasDigits && hasLetters) {
    score += 1;
  }

  if (score === 1) {
    return {
      score: 1,
      label: 'Básico',
      color: 'bg-amber-500 text-white',
      isWeak: false,
      message: 'Válido. Se recomiendan 6 dígitos o combinar con letras para mayor seguridad.'
    };
  } else if (score === 2) {
    return {
      score: 2,
      label: 'Fuerte',
      color: 'bg-indigo-500 text-white',
      isWeak: false,
      message: 'Excelente longitud y resistencia a intentos no autorizados.'
    };
  } else {
    return {
      score: 3,
      label: 'Grado Teocrático Alto',
      color: 'bg-emerald-600 text-white',
      isWeak: false,
      message: 'Máxima protección contra accesos no autorizados.'
    };
  }
}

// Anti-brute-force rate limiting helpers (persistidos en localStorage + sessionStorage para impedir evasión cerrando pestañas)
const LOCKOUT_KEY = 'kongre_pin_lockout_until';

const FAILED_COUNT_KEY = 'kongre_pin_failed_count';

const LAST_FAILED_AT_KEY = 'kongre_pin_last_failed_at';

const MAX_ATTEMPTS_BEFORE_COOLDOWN = 5;

const COOLDOWN_SECONDS = 30;

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos

export function getPinLockoutRemainingSeconds(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const rawLocal = localStorage.getItem(LOCKOUT_KEY);
    const rawSession = sessionStorage.getItem(LOCKOUT_KEY);
    const lockoutUntil = Math.max(
      parseInt(rawLocal || '0', 10) || 0,
      parseInt(rawSession || '0', 10) || 0
    );
    const now = Date.now();
    if (lockoutUntil > now) {
      return Math.ceil((lockoutUntil - now) / 1000);
    }
  } catch {}
  return 0;
}

export function recordFailedPinAttempt(): { isLockedOut: boolean; remainingSeconds: number; attempts: number } {
  if (typeof window === 'undefined') return { isLockedOut: false, remainingSeconds: 0, attempts: 1 };
  try {
    const now = Date.now();
    const lastFailedAt = parseInt(localStorage.getItem(LAST_FAILED_AT_KEY) || sessionStorage.getItem(LAST_FAILED_AT_KEY) || '0', 10) || 0;
    const prevCountRaw = Math.max(
      parseInt(localStorage.getItem(FAILED_COUNT_KEY) || '0', 10) || 0,
      parseInt(sessionStorage.getItem(FAILED_COUNT_KEY) || '0', 10) || 0
    );

    // Si pasaron más de 15 minutos desde el último fallo, reiniciar contador base
    const baseCount = lastFailedAt > 0 && now - lastFailedAt > ATTEMPT_WINDOW_MS ? 0 : prevCountRaw;
    const currentAttempts = baseCount + 1;

    localStorage.setItem(FAILED_COUNT_KEY, currentAttempts.toString());
    localStorage.setItem(LAST_FAILED_AT_KEY, now.toString());
    sessionStorage.setItem(FAILED_COUNT_KEY, currentAttempts.toString());
    sessionStorage.setItem(LAST_FAILED_AT_KEY, now.toString());

    if (currentAttempts >= MAX_ATTEMPTS_BEFORE_COOLDOWN) {
      const tier = Math.floor(currentAttempts / MAX_ATTEMPTS_BEFORE_COOLDOWN);
      // Backoff exponencial: 30s (5 intentos), 60s (10 intentos), 120s (15 intentos), máx 300s
      const lockSeconds = Math.min(COOLDOWN_SECONDS * Math.pow(2, Math.max(0, tier - 1)), 300);
      const lockDuration = lockSeconds * 1000;
      const lockoutUntil = now + lockDuration;
      localStorage.setItem(LOCKOUT_KEY, lockoutUntil.toString());
      sessionStorage.setItem(LOCKOUT_KEY, lockoutUntil.toString());
      return {
        isLockedOut: true,
        remainingSeconds: lockSeconds,
        attempts: currentAttempts,
      };
    }

    return {
      isLockedOut: false,
      remainingSeconds: 0,
      attempts: currentAttempts,
    };
  } catch {
    return { isLockedOut: false, remainingSeconds: 0, attempts: 1 };
  }
}

export function resetFailedPinAttempts(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCKOUT_KEY);
    localStorage.removeItem(FAILED_COUNT_KEY);
    localStorage.removeItem(LAST_FAILED_AT_KEY);
    sessionStorage.removeItem(LOCKOUT_KEY);
    sessionStorage.removeItem(FAILED_COUNT_KEY);
    sessionStorage.removeItem(LAST_FAILED_AT_KEY);
  } catch {}
}
