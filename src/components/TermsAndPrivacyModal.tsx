import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ShieldCheck,
  ScrollText,
  Lock,
  Database,
  EyeOff,
  CheckCircle2,
  Building2,
  KeyRound,
  WifiOff,
  Trash2,
  FileCheck2,
  Scale,
  Globe,
  Mail,
  Server,
  UserCheck,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';
import { CURRENT_APP_VERSION, BUILD_DATE } from '../utils/versionLog';
import Logo from '../Logo';

export type LegalModalTab = 'terms' | 'privacy';

export const LEGAL_CONSENT_STORAGE_KEY = 'kongre_legal_terms_accepted_v1';
export const LEGAL_CONSENT_TIMESTAMP_KEY = 'kongre_legal_terms_accepted_at';

export function hasAcceptedLegalTerms(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(LEGAL_CONSENT_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function recordLegalTermsAcceptance(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LEGAL_CONSENT_STORAGE_KEY, 'true');
    localStorage.setItem(LEGAL_CONSENT_TIMESTAMP_KEY, new Date().toISOString());
    window.dispatchEvent(new CustomEvent('kongre_legal_terms_accepted'));
  } catch {}
}

export function detectLegalRoute(): LegalModalTab | null {
  if (typeof window === 'undefined') return null;
  const hash = (window.location.hash || '').replace(/^#\/?/, '').toLowerCase().split('?')[0];
  const path = (window.location.pathname || '').replace(/^\//, '').toLowerCase().split('/')[0];
  if (hash === 'privacy' || hash === 'privacidad' || path === 'privacy' || path === 'privacidad') {
    return 'privacy';
  }
  if (hash === 'terms' || hash === 'terminos' || path === 'terms' || path === 'terminos') {
    return 'terms';
  }
  return null;
}

interface TermsAndPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalModalTab;
  onAccept?: () => void;
}

export const ProfessionalTermsContent: React.FC = () => (
  <div className="space-y-6">
    {/* Executive Summary Banner */}
    <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-start gap-3.5 shadow-2xs">
      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
        <FileCheck2 className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-extrabold text-zinc-900 dark:text-white text-sm sm:text-base">
            Marco Normativo de Uso Ordenado, Ético y Confidencial
          </h3>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300">
            Documento Vinculante
          </span>
        </div>
        <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-[#D4D4D8] leading-relaxed">
          Los presentes Términos y Condiciones regulan el acceso, configuración y utilización de la plataforma <strong>Kongre — Gestor Teocrático Integral</strong> (<span className="font-mono">https://kongre-app.com</span>). Al registrar una congregación, vincular una cuenta o ingresar mediante credenciales de acceso, el usuario manifiesta haber leído, comprendido y aceptado íntegramente este marco normativo.
        </p>
      </div>
    </div>

    {/* Key Highlights Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/50 border border-zinc-200/80 dark:border-[#27272A]/70">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
          Propósito Exclusivo
        </span>
        <p className="text-xs font-semibold text-zinc-800 dark:text-[#E4E4E7] leading-snug">
          Organización auxiliar de reuniones, asignaciones S-89, territorios y servicio del campo.
        </p>
      </div>
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/50 border border-zinc-200/80 dark:border-[#27272A]/70">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
          Control Teocrático
        </span>
        <p className="text-xs font-semibold text-zinc-800 dark:text-[#E4E4E7] leading-snug">
          Acceso jerárquico por roles (RBAC), PINs cifrados y verificación en dos pasos (2FA).
        </p>
      </div>
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/50 border border-zinc-200/80 dark:border-[#27272A]/70">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
          Independencia Legal
        </span>
        <p className="text-xs font-semibold text-zinc-800 dark:text-[#E4E4E7] leading-snug">
          Herramienta auxiliar sin fines comerciales; no sustituye sitios ni formularios oficiales.
        </p>
      </div>
    </div>

    {/* Clause 1 */}
    <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121216]/90 border border-zinc-200/80 dark:border-[#27272A] space-y-2.5 shadow-2xs">
      <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
        <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>1. Naturaleza del Servicio y Declaración de Independencia Institucional</span>
      </h4>
      <p>
        <strong>1.1. Objeto Operativo:</strong> <strong>Kongre</strong> es una Aplicación Web Progresiva (PWA) de carácter auxiliar e independiente, concebida para facilitar a los cuerpos de ancianos, siervos ministeriales y publicadores la planificación y administración local de programas de la Reunión Vida y Ministerio Cristiano, Reunión del Fin de Semana, hojas de asignación S-89, control de territorios georreferenciados con códigos QR, turnos de predicación pública en carritos, estadísticas de asistencia S-88, tarjetas de publicador S-21 y programas de limpieza y mantenimiento del Salón del Reino.
      </p>
      <p>
        <strong>1.2. No Afiliación Oficial:</strong> Kongre es una iniciativa tecnológica privada de apoyo organizativo local. <strong>No constituye una aplicación, publicación ni sitio web oficial</strong> de <em>Watch Tower Bible and Tract Society of Pennsylvania</em> ni de ninguna de sus corporaciones religiosas afiliadas (<span className="font-mono">jw.org</span>), ni reemplaza las cartas, pautas, instrucciones o formularios provistos por la organización.
      </p>
    </section>

    {/* Clause 2 */}
    <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121216]/90 border border-zinc-200/80 dark:border-[#27272A] space-y-2.5 shadow-2xs">
      <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>2. Gobernanza de Accesos, Roles Teocráticos (RBAC) y Custodia de Credenciales</span>
      </h4>
      <p>
        El acceso a la información de cada congregación se rige estrictamente por el principio de privilegio mínimo (<em>Least Privilege</em>) y control de acceso basado en roles (RBAC):
      </p>
      <ul className="list-disc list-inside space-y-2 pl-1 text-zinc-600 dark:text-[#D4D4D8]">
        <li>
          <strong>Administración por el Cuerpo de Ancianos:</strong> El Coordinador y los ancianos designados son los únicos facultados para registrar la congregación, generar o rotar claves de seguridad, auditar el registro de actividad y autorizar o revocar el acceso de nuevos dispositivos o usuarios.
        </li>
        <li>
          <strong>Credenciales de Tres Niveles:</strong> El acceso requiere la validación combinada del <em>ID de Congregación</em> (<span className="font-mono">KGR-XXXX-XXXX</span>), el <em>PIN de la Congregación</em> (destinado exclusivamente a miembros aprobados de la congregación local) y el <em>PIN Personal Único</em> (personal e intransferible para cada publicador o siervo nombrado).
        </li>
        <li>
          <strong>Autenticación de Dos Factores (2FA / TOTP):</strong> Los usuarios pueden habilitar voluntariamente la verificación en dos pasos bajo el estándar RFC 6238 (compatible con Microsoft Authenticator y Google Authenticator), siendo responsables del resguardo seguro de sus códigos de recuperación de emergencia.
        </li>
        <li>
          <strong>Deber de Custodia:</strong> Queda estrictamente prohibido compartir el PIN Maestro del Coordinador, los PINs personales de otros hermanos o publicar los enlaces de invitación en redes sociales o foros abiertos.
        </li>
      </ul>
    </section>

    {/* Clause 3 */}
    <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121216]/90 border border-zinc-200/80 dark:border-[#27272A] space-y-2.5 shadow-2xs">
      <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
        <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>3. Obligaciones de Confidencialidad, Ética Cristiana y Uso Aceptable</span>
      </h4>
      <p>
        Todo usuario que ingrese a Kongre se compromete a tratar los datos personales de sus hermanos en la fe (nombres, teléfonos, direcciones de correo electrónico, grupos de servicio, ausencias y asignaciones) con absoluta reserva, discreción y respeto cristiano.
      </p>
      <p>
        <strong>Conductas Expresamente Prohibidas:</strong>
      </p>
      <ul className="list-disc list-inside space-y-1.5 pl-1 text-zinc-600 dark:text-[#D4D4D8]">
        <li>Extraer, copiar o exportar el directorio de la congregación para fines comerciales, laborales, políticos, promocionales o ajenos a las actividades teocráticas.</li>
        <li>Enviar cadenas de mensajes masivos no solicitados (<em>spam</em>) utilizando la información de contacto registrada en el sistema.</li>
        <li>Intentar eludir los controles de acceso por roles, realizar ingeniería inversa o ejecutar pruebas de fuerza bruta contra los puntos de sincronización.</li>
      </ul>
    </section>

    {/* Clause 4 */}
    <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121216]/90 border border-zinc-200/80 dark:border-[#27272A] space-y-2.5 shadow-2xs">
      <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>4. Operación Offline-First (PWA), Sincronización y Copias de Respaldo</span>
      </h4>
      <p>
        Kongre está diseñado con una arquitectura <em>Offline-First</em> que permite consultar y gestionar programas dentro del Salón del Reino o en el ministerio del campo sin conexión a internet. Al restablecerse la conexión, la cola de cambios se sincroniza automáticamente mediante paquetes cifrados de extremo a extremo.
      </p>
      <p>
        <strong>Responsabilidad sobre Claves y Respaldos:</strong> Debido a que Kongre implementa cifrado de <strong>Cero Conocimiento (Zero-Knowledge)</strong>, ningún administrador central posee copia de las claves de descifrado. Si una congregación extravía simultáneamente su PIN Maestro y su PIN de Congregación, los datos cifrados en la nube no podrán ser recuperados por ningún medio técnico. Se recomienda a los ancianos descargar periódicamente una copia de respaldo local desde el módulo de <strong>Ajustes</strong>.
      </p>
    </section>

    {/* Clause 5 */}
    <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121216]/90 border border-zinc-200/80 dark:border-[#27272A] space-y-2.5 shadow-2xs">
      <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>5. Disponibilidad del Servicio, Limitación de Responsabilidad y Baja Definitiva</span>
      </h4>
      <p>
        <strong>5.1. Provisión del Software:</strong> Kongre se ofrece de manera gratuita como herramienta comunitaria de apoyo «tal cual» (<em>as-is</em>). Aunque se aplican altos estándares de disponibilidad y respaldo en la nube, no se garantiza la ausencia absoluta de interrupciones derivadas de mantenimiento o fallos de proveedores de red externos.
      </p>
      <p>
        <strong>5.2. Eliminación y Baja del Servicio:</strong> El Cuerpo de Ancianos conserva en todo momento la soberanía absoluta sobre los datos de su congregación, pudiendo exportar toda su información o ejecutar la <strong>eliminación definitiva e irreversible</strong> de sus registros locales y en la nube desde el panel de Ajustes o solicitándolo a <strong>soporte@kongre-app.com</strong>.
      </p>
    </section>
  </div>
);

export const ProfessionalPrivacyContent: React.FC = () => (
  <div className="space-y-6">
    {/* Executive Privacy Banner */}
    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-3.5 shadow-2xs">
      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
        <ShieldCheck className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-extrabold text-zinc-900 dark:text-white text-sm sm:text-base">
            Arquitectura de Cero Conocimiento (Zero-Knowledge) y Privacidad por Diseño
          </h3>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300">
            AES-256-GCM • PBKDF2
          </span>
        </div>
        <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-[#D4D4D8] leading-relaxed">
          En <strong>Kongre</strong> la privacidad y protección de los datos de los hermanos es un pilar arquitectónico innegociable. Toda la información sensible de la congregación se cifra localmente en tu dispositivo antes de transmitirse a la nube, cumpliendo con los principios internacionales de protección de datos (<strong>RGPD / GDPR, LOPDGDD, CCPA, LGPD</strong>) y la <strong>Política de Datos de Usuario de los Servicios de las APIs de Google</strong>.
        </p>
      </div>
    </div>

    {/* Cryptographic Specifications Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/50 border border-zinc-200/80 dark:border-[#27272A]/70">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
          Cifrado Extremo a Extremo
        </span>
        <p className="text-xs font-semibold text-zinc-800 dark:text-[#E4E4E7] leading-snug">
          AES-256-GCM autenticado en cliente con IV aleatorio de 96 bits.
        </p>
      </div>
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/50 border border-zinc-200/80 dark:border-[#27272A]/70">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
          Derivación OWASP
        </span>
        <p className="text-xs font-semibold text-zinc-800 dark:text-[#E4E4E7] leading-snug">
          PBKDF2-HMAC-SHA256 con hasta 600.000 iteraciones y sal criptográfica única.
        </p>
      </div>
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/50 border border-zinc-200/80 dark:border-[#27272A]/70">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1">
          Cero Venta o Rastreo
        </span>
        <p className="text-xs font-semibold text-zinc-800 dark:text-[#E4E4E7] leading-snug">
          Sin publicidad, sin corredores de datos y sin entrenamiento de modelos de IA.
        </p>
      </div>
    </div>

    {/* Section 1 */}
    <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121216]/90 border border-zinc-200/80 dark:border-[#27272A] space-y-2.5 shadow-2xs">
      <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
        <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>1. Responsable del Tratamiento y Modelo de Cero Conocimiento</span>
      </h4>
      <p>
        <strong>1.1. Rol de las Partes:</strong> Cada congregación local (administrada por su Cuerpo de Ancianos) actúa como controladora y responsable de los datos organizativos que registra en la aplicación. La infraestructura en la nube de Kongre opera estrictamente como un repositorio técnico de bloques cifrados (<em>Zero-Knowledge Encrypted Storage</em>).
      </p>
      <p>
        <strong>1.2. Imposibilidad Técnica de Lectura por Terceros:</strong> Debido a que las claves de cifrado se derivan exclusivamente del PIN Maestro y del PIN de la Congregación en el navegador o teléfono del usuario mediante la API nativa <code>Web Crypto API</code>, ni los desarrolladores de Kongre, ni los proveedores de bases de datos en la nube (Supabase / AWS), ni terceros pueden leer, indexar o descifrar el contenido de los directorios, tarjetas S-21 o programaciones.
      </p>
      <p>
        <strong>1.3. Transparencia en la Segregación de Roles:</strong> El cifrado de extremo a extremo opera a nivel de congregación (paquete maestro para ancianos y paquete público para publicadores). La compartimentación interna entre departamentos se gestiona mediante Control de Acceso Basado en Roles (RBAC en cliente) respaldado por tokens de sesión de rol firmados con HMAC por el servidor (<code>kgr_srt1</code>), requiriéndose la debida custodia del PIN Maestro de 12 dígitos por parte del cuerpo de ancianos.
      </p>
    </section>

    {/* Section 2 */}
    <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121216]/90 border border-zinc-200/80 dark:border-[#27272A] space-y-2.5 shadow-2xs">
      <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
        <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>2. Principio de Minimización y Tratamiento de Datos de Especial Sensibilidad</span>
      </h4>
      <p>
        Kongre reconoce que la información relativa a convicciones religiosas, directivas médicas sobre tratamientos (DPA / Voluntad Anticipada), notas de pastoreo y contactos de emergencia constituyen <strong>datos de categoría especial y sensible</strong> bajo el <strong>Artículo 9 del RGPD (UE)</strong> y normativas homólogas (como la <strong>Ley 1581 de 2012</strong>):
      </p>
      <ul className="list-disc list-inside space-y-2 pl-1 text-zinc-600 dark:text-[#D4D4D8]">
        <li>
          <strong>Salvaguardas Criptográficas Reforzadas:</strong> Los datos de directivas médicas, contactos de emergencia y pastoreo confidencial se someten a cifrado granular en reposo con AES-256-GCM (<code>kgr_sec5</code>) respaldado por la bóveda criptográfica local de IndexedDB con claves no extraíbles (<code>extractable: false</code>), y se excluyen permanentemente del paquete de sincronización pública.
        </li>
        <li>
          <strong>Sanitización en Almacenamiento Local:</strong> Toda persistencia en el dispositivo ejecuta filtros de sanitización automática, suprimiendo PINs en texto plano y transformando credenciales en hashes criptográficos irreversibles.
        </li>
        <li>
          <strong>Datos Institucionales de la Congregación:</strong> Nombre de la congregación, identificador único (<span className="font-mono">KGR-XXXX-XXXX</span>), número de circuito, ciudad, país, dirección del Salón del Reino y horarios de reuniones semanales.
        </li>
        <li>
          <strong>Directorio Operativo y Asignaciones:</strong> Nombre del hermano o hermana, grupo de servicio de campo, privilegios de asignación en reuniones, disponibilidad, fechas de ausencia e historial de partes asignadas para preservar la equidad.
        </li>
        <li>
          <strong>Datos de Contacto Opcionales:</strong> Número telefónico (utilizado exclusivamente para enviar recordatorios o papeletas S-89 vía WhatsApp a solicitud del usuario) y dirección de correo electrónico (para vinculación de cuenta y recuperación de acceso).
        </li>
        <li>
          <strong>Metadatos de Seguridad y Auditoría:</strong> Hashes criptográficos de verificación de PIN con 600.000 iteraciones PBKDF2, configuración opcional de segundo factor (2FA TOTP), marcas de tiempo de versión para control de concurrencia y registros internos de auditoría teocrática.
        </li>
      </ul>
    </section>

    {/* Section 3 - Google API User Data Policy */}
    <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121216]/90 border border-zinc-200/80 dark:border-[#27272A] space-y-2.5 shadow-2xs">
      <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
        <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>3. Política de Datos de Usuario de Google API (Google OAuth 2.0 & Limited Use)</span>
      </h4>
      <p>
        Kongre ofrece autenticación opcional mediante <strong>Google Sign-In</strong> (OAuth 2.0) con el único propósito de verificar la identidad del usuario de manera segura sin requerir contraseñas adicionales. En cumplimiento expreso de la <em>Google API Services User Data Policy</em>:
      </p>
      <ul className="list-disc list-inside space-y-2 pl-1 text-zinc-600 dark:text-[#D4D4D8]">
        <li>
          <strong>Alcances Solicitados (Scopes Mínimos):</strong> Kongre solicita únicamente los alcances básicos de identidad: nombre visible (<code>name</code>), dirección de correo electrónico (<code>email</code>), imagen de perfil (<code>picture</code>) e identificador único de cuenta (<code>sub</code>).
        </li>
        <li>
          <strong>Sin Acceso a Servicios Privados de Google:</strong> Kongre <strong>NO solicita, no lee, no modifica ni tiene acceso</strong> a Google Drive, Gmail, Google Calendar, Contactos ni ubicación en segundo plano.
        </li>
        <li>
          <strong>Prohibición Absoluta de Venta o Transferencia:</strong> Los datos obtenidos a través de Google Sign-In <strong>jamás</strong> se venden, alquilan, comercializan ni transfieren a terceros, anunciantes, agencias de marketing ni corredores de datos.
        </li>
        <li>
          <strong>Prohibición de Entrenamiento de Inteligencia Artificial:</strong> Los datos de usuario de Google recibidos nunca se utilizan para entrenar, reentrenar ni perfeccionar modelos de inteligencia artificial (IA) o aprendizaje automático (<em>Machine Learning</em>).
        </li>
        <li>
          <strong>Cumplimiento de Uso Limitado (Limited Use Disclosure):</strong> El uso y la transferencia a cualquier otra aplicación de la información recibida de las APIs de Google se adhieren estrictamente a la{' '}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 underline font-semibold"
          >
            Política de Datos de Usuario de los Servicios de las APIs de Google
          </a>
          , incluidos todos los requisitos de Uso Limitado (<em>Limited Use</em>).
        </li>
      </ul>
    </section>

    {/* Section 4 */}
    <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121216]/90 border border-zinc-200/80 dark:border-[#27272A] space-y-2.5 shadow-2xs">
      <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
        <Fingerprint className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>4. Seguridad en el Dispositivo, Retención y Supresión Definitiva</span>
      </h4>
      <p>
        <strong>4.1. Protección en Dispositivos Compartidos:</strong> Los datos almacenados localmente para uso sin conexión (<code>IndexedDB</code> / <code>localStorage</code>) cuentan con cifrado de credenciales en reposo y un sistema de bloqueo automático de sesión por inactividad mediante PIN, protegiendo la privacidad en dispositivos compartidos (como computadoras de la cabina de audio y video del Salón del Reino).
      </p>
      <p>
        <strong>4.2. Retención y Eliminación Inmediata:</strong> Los datos se conservan únicamente mientras la congregación o el publicador mantenga activa su vinculación. Los usuarios pueden desvincular su cuenta de Google en cualquier momento mediante la opción «Cambiar cuenta», revocar el permiso directamente en{' '}
        <a
          href="https://myaccount.google.com/permissions"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 dark:text-indigo-400 underline font-semibold"
        >
          Configuración de Seguridad de Google
        </a>{' '}
        o solicitar la purga irreversible de todos sus registros.
      </p>
    </section>

    {/* Section 5 */}
    <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121216]/90 border border-zinc-200/80 dark:border-[#27272A] space-y-2.5 shadow-2xs">
      <h4 className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
        <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>5. Ejercicio de Derechos ARCO+ y Canal Oficial de Privacidad</span>
      </h4>
      <p>
        Todo usuario titular de datos tiene derecho a ejercer en cualquier momento sus derechos de <strong>Acceso, Rectificación, Cancelación (Supresión), Oposición y Portabilidad</strong> sobre su información personal directamente ante el Cuerpo de Ancianos de su congregación o a través de nuestro canal oficial de privacidad y soporte técnico:
      </p>
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181F]/70 border border-zinc-200/80 dark:border-[#27272A]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div>
          <span className="font-bold text-zinc-900 dark:text-white">Contacto Oficial de Privacidad y Seguridad:</span>{' '}
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">soporte@kongre-app.com</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 underline font-semibold"
          >
            Versión estática /terms
          </a>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 underline font-semibold"
          >
            Versión estática /privacy
          </a>
        </div>
      </div>
    </section>
  </div>
);

export const TermsAndPrivacyModal: React.FC<TermsAndPrivacyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
  onAccept,
}) => {
  const [activeTab, setActiveTabState] = useState<LegalModalTab>(initialTab);

  const handleSelectTab = (tab: LegalModalTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.history.replaceState({ legal: true, tab }, '', `#${tab}`);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTabState(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const pageContent = (
    <div
      className="fixed inset-0 z-[100] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch] block sm:py-6 sm:px-6 lg:px-8 transition-colors duration-200 animate-fade-in"
      role="region"
      aria-label="Términos de uso y política de privacidad"
    >
      <div className="w-full max-w-4xl xl:max-w-5xl mx-auto pb-10">
        {/* Full-Page Main Card */}
        <div className="w-full sm:rounded-3xl bg-white dark:bg-[#121216] sm:border border-zinc-200 dark:border-[#27272A] sm:shadow-xl">
          {/* Page Header */}
          <div className="sticky top-0 z-20 px-4 py-3.5 sm:px-7 sm:py-5 border-b border-zinc-100 dark:border-[#27272A] flex items-center justify-between gap-3 bg-white/95 dark:bg-[#121216]/95 backdrop-blur-md sm:rounded-t-3xl">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                data-mobile-back-btn="true"
                onClick={onClose}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#E4E4E7] transition-colors cursor-pointer shrink-0 active:scale-95"
                title="Volver"
                aria-label="Volver"
              >
                <ArrowLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </button>
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                {activeTab === 'terms' ? (
                  <Scale className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight truncate">
                    {activeTab === 'terms'
                      ? 'Términos y Condiciones de Uso Teocrático'
                      : 'Política de Privacidad, Protección de Datos y Seguridad'}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    v{CURRENT_APP_VERSION}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] truncate">
                  Kongre • Gestor Teocrático Integral • Vigencia: {BUILD_DATE}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-[#A1A1AA] shrink-0">
              <Logo variant="isotipo" className="w-4 h-4 object-contain" />
              <span className="hidden sm:inline">Kongre • Marco Legal</span>
            </div>
          </div>

          {/* Tab Selector Bar */}
          <div className="px-5 pt-3.5 pb-3 sm:px-7 border-b border-zinc-100 dark:border-[#27272A] bg-white dark:bg-[#121216] flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleSelectTab('terms')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                  : 'bg-zinc-100 dark:bg-[#18181F]/80 text-zinc-600 dark:text-[#D4D4D8] hover:bg-zinc-200/70 dark:hover:bg-[#27272A]'
              }`}
            >
              <ScrollText className="w-4 h-4 shrink-0" />
              <span>Términos y Condiciones de Uso</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('privacy')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                  : 'bg-zinc-100 dark:bg-[#18181F]/80 text-zinc-600 dark:text-[#D4D4D8] hover:bg-zinc-200/70 dark:hover:bg-[#27272A]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Política de Privacidad y Seguridad</span>
            </button>
          </div>

          {/* Full-Page Content Body */}
          <div className="p-5 sm:p-7 text-xs sm:text-[13.5px] leading-relaxed text-zinc-600 dark:text-[#D4D4D8]">
            {activeTab === 'terms' ? <ProfessionalTermsContent /> : <ProfessionalPrivacyContent />}
          </div>

          {/* Page Footer */}
          <div className="px-5 py-4 sm:px-7 border-t border-zinc-100 dark:border-[#27272A] bg-zinc-50/70 dark:bg-[#121216]/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-[#A1A1AA]">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Cifrado de Conocimiento Cero AES-256-GCM • Cumplimiento Google API Limited Use</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#E4E4E7] font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  recordLegalTermsAcceptance();
                  if (onAccept) onAccept();
                  onClose();
                }}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Entendido y Aceptar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(pageContent, document.body);
  }
  return pageContent;
};

interface LegalConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const LegalConsentCheckbox: React.FC<LegalConsentCheckboxProps> = ({
  checked,
  onChange,
  className = '',
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<LegalModalTab>('terms');

  const handleOpenDoc = (e: React.MouseEvent, tab: LegalModalTab) => {
    e.preventDefault();
    e.stopPropagation();
    setModalTab(tab);
    setModalOpen(true);
  };

  return (
    <>
      <div
        className={`p-3 rounded-xl border transition-all ${
          checked
            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70'
            : 'bg-zinc-50/90 dark:bg-[#18181F]/60 border-zinc-200 dark:border-[#27272A]/80'
        } ${className}`}
      >
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => {
              const isChecked = e.target.checked;
              onChange(isChecked);
              if (isChecked) {
                recordLegalTermsAcceptance();
              }
            }}
            className="mt-0.5 w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0 accent-indigo-600"
          />
          <span className="text-[11.5px] leading-snug text-zinc-700 dark:text-[#E4E4E7]">
            He leído y acepto los{' '}
            <button
              type="button"
              onClick={(e) => handleOpenDoc(e, 'terms')}
              className="font-bold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
            >
              Términos de Uso
            </button>{' '}
            y la{' '}
            <button
              type="button"
              onClick={(e) => handleOpenDoc(e, 'privacy')}
              className="font-bold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
            >
              Política de Privacidad
            </button>{' '}
            de Kongre. <span className="text-rose-500 font-bold">*</span>
          </span>
        </label>
      </div>

      <TermsAndPrivacyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTab={modalTab}
        onAccept={() => {
          onChange(true);
          recordLegalTermsAcceptance();
        }}
      />
    </>
  );
};

interface FirstTimeLegalConsentModalProps {
  isOpen: boolean;
  onAccepted: () => void;
}

export const FirstTimeLegalConsentModal: React.FC<FirstTimeLegalConsentModalProps> = ({
  isOpen,
  onAccepted,
}) => {
  const [activeTab, setActiveTab] = useState<LegalModalTab>('terms');
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!checked) return;
    recordLegalTermsAcceptance();
    onAccepted();
  };

  const pageContent = (
    <div
      className="fixed inset-0 z-[100] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-y-auto flex flex-col py-3 sm:py-6 px-3 sm:px-6 lg:px-8 transition-colors duration-200 animate-fade-in"
      role="region"
      aria-label="Aceptación obligatoria de términos de uso y política de privacidad"
    >
      <div className="w-full max-w-4xl xl:max-w-5xl mx-auto flex-1 flex flex-col justify-center">
        <div className="w-full rounded-2xl sm:rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] shadow-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-zinc-100 dark:border-[#27272A] bg-zinc-50/80 dark:bg-[#121216]/90 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  Bienvenido a Kongre • Términos de Uso y Privacidad
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Consentimiento de Primer Ingreso
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Antes de utilizar la plataforma por primera vez, revisa y acepta el Marco Normativo de Uso y la Política de Privacidad.
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="px-5 pt-3.5 pb-3 sm:px-7 border-b border-zinc-100 dark:border-[#27272A] bg-white dark:bg-[#121216] flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#D4D4D8] hover:bg-zinc-200/70'
              }`}
            >
              <ScrollText className="w-4 h-4" />
              <span>Términos y Condiciones de Uso</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#D4D4D8] hover:bg-zinc-200/70'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Política de Privacidad y Seguridad</span>
            </button>
          </div>

          {/* Full Content */}
          <div className="p-5 sm:p-7 text-xs sm:text-[13.5px] leading-relaxed text-zinc-600 dark:text-[#D4D4D8]">
            {activeTab === 'terms' ? <ProfessionalTermsContent /> : <ProfessionalPrivacyContent />}
          </div>

          {/* Footer with Checkbox & Confirm Button */}
          <div className="px-5 py-4 sm:px-7 border-t border-zinc-100 dark:border-[#27272A] bg-zinc-50/80 dark:bg-[#121216]/90 space-y-3.5 shrink-0">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0 accent-indigo-600"
              />
              <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-[#E4E4E7] leading-snug">
                He leído, comprendido y acepto expresamente los Términos y Condiciones de Uso y la Política de Privacidad de Kongre para continuar.
              </span>
            </label>

            <button
              type="button"
              disabled={!checked}
              onClick={handleConfirm}
              className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Aceptar Términos y Continuar a Kongre</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(pageContent, document.body);
  }
  return pageContent;
};


