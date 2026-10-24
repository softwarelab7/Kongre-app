import React, { useState, useEffect } from 'react';
import {
  X,
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
} from 'lucide-react';
import { CURRENT_APP_VERSION, BUILD_DATE } from '../utils/versionLog';

export type LegalModalTab = 'terms' | 'privacy';

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
}

export const TermsAndPrivacyModal: React.FC<TermsAndPrivacyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-3 sm:p-5 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Términos de uso y política de privacidad"
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              {activeTab === 'terms' ? (
                <Scale className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                  {activeTab === 'terms'
                    ? 'Términos de Uso Teocrático'
                    : 'Política de Privacidad y Seguridad'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  v{CURRENT_APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Kongre • Gestor Teocrático Integral • Actualizado el {BUILD_DATE}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Cerrar"
            aria-label="Cerrar ventana legal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector Bar */}
        <div className="px-5 pt-3 pb-2.5 sm:px-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSelectTab('terms')}
            className={`flex-1 py-2 px-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <ScrollText className="w-4 h-4 shrink-0" />
            <span>Términos de Uso</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('privacy')}
            className={`flex-1 py-2 px-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Política de Privacidad</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
          {activeTab === 'terms' ? (
            <>
              {/* Intro Banner */}
              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 flex items-start gap-3">
                <FileCheck2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Compromiso de Uso Ordenado y Teocrático
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    Al registrar una congregación o acceder a Kongre, aceptas utilizar esta herramienta exclusivamente para apoyar la organización espiritual, el cuidado de las reuniones y el servicio del campo con apego a los principios cristianos.
                  </p>
                </div>
              </div>

              {/* Section 1 */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>1. Naturaleza y Propósito de la Aplicación</span>
                </h4>
                <p>
                  <strong>Kongre</strong> es una herramienta digital auxiliar e independiente diseñada para facilitar a los cuerpos de ancianos, siervos ministeriales y publicadores la gestión de programas semanales (Reunión Vida y Ministerio Cristiano y Reunión del Fin de Semana), hojas de asignación S-89, tarjetas de territorio con mapas y códigos QR, turnos de carritos, registro de asistencia S-88 y programas de limpieza y mantenimiento del Salón del Reino.
                </p>
                <p>
                  Esta aplicación es un recurso práctico de organización local y <strong>no representa un sitio web oficial ni reemplaza las cartas, pautas o formularios oficiales</strong> provistos por la organización.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>2. Roles, Accesos y Custodia de Credenciales</span>
                </h4>
                <p>
                  El acceso a los datos de cada congregación se estructura mediante control de acceso basado en roles teocráticos (Coordinador, Secretario, Superintendente de Servicio, Siervos de Cuentas/Territorios y Publicadores):
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-600 dark:text-slate-300">
                  <li>
                    <strong>ID y PIN de la Congregación:</strong> Son generados al registrar la congregación y deben compartirse únicamente con los miembros aprobados de la misma.
                  </li>
                  <li>
                    <strong>PIN Personal Único:</strong> Cada hermano con responsabilidades administrativas o de edición cuenta con un PIN personal intransferible para proteger la confidencialidad de las asignaciones y registros.
                  </li>
                  <li>
                    <strong>Aprobación por los Ancianos:</strong> Las solicitudes de vinculación de nuevos dispositivos o cuentas deben ser verificadas por el Coordinador o los ancianos designados.
                  </li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>3. Uso Ético y Confidencial de los Datos</span>
                </h4>
                <p>
                  Los usuarios se comprometen a tratar los nombres, números telefónicos y asignaciones de sus hermanos con el máximo respeto y confidencialidad. Queda estrictamente prohibido extraer, divulgar o utilizar los datos de contacto de la congregación para actividades comerciales, cadenas de mensajes ajenas a las reuniones o cualquier fin no teocrático.
                </p>
              </div>

              {/* Section 4 */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>4. Disponibilidad Offline (PWA) y Copias de Respaldo</span>
                </h4>
                <p>
                  Kongre opera bajo tecnología PWA (Aplicación Web Progresiva), permitiendo consultar y editar programas incluso sin conexión a internet dentro del Salón del Reino. Al recuperar la conexión, los cambios se sincronizan de forma cifrada. Se recomienda a los administradores exportar periódicamente un respaldo local desde la sección de Ajustes.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Privacy Intro Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Arquitectura de Cero Conocimiento (Zero-Knowledge)
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    La privacidad y seguridad de los hermanos es nuestra máxima prioridad. Tus datos se cifran de extremo a extremo antes de salir de tu dispositivo.
                  </p>
                </div>
              </div>

              {/* Privacy Section 1 */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>1. Cifrado de Grado Militar (AES-256-GCM)</span>
                </h4>
                <p>
                  Toda la información de la congregación se cifra localmente en el navegador o teléfono mediante el algoritmo <strong>AES-256-GCM</strong> con derivación criptográfica <strong>PBKDF2 (100,000 iteraciones SHA-256)</strong> utilizando las claves de seguridad de tu congregación. En la base de datos en la nube solo se almacenan bloques cifrados ilegibles para terceros.
                </p>
              </div>

              {/* Privacy Section 2 */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>2. Principio de Minimización de Datos</span>
                </h4>
                <p>
                  Kongre recopila únicamente la información mínima indispensable para el funcionamiento de los módulos teocráticos:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-600 dark:text-slate-300">
                  <li>
                    <strong>Datos de la Congregación:</strong> Nombre de la congregación, circuito, horarios de reunión y dirección del Salón del Reino.
                  </li>
                  <li>
                    <strong>Directorio de Participantes:</strong> Nombre del hermano o hermana, grupo de servicio, privilegios de asignación y disponibilidad.
                  </li>
                  <li>
                    <strong>Contacto Opcional:</strong> Teléfono o correo electrónico únicamente si se desea enviar notificaciones de asignaciones S-89 por WhatsApp o vincular cuenta de Google.
                  </li>
                </ul>
              </div>

              {/* Privacy Section 3 */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>3. Uso de Datos de Cuentas de Google (Google API User Data Policy)</span>
                </h4>
                <p>
                  Kongre permite la autenticación opcional con <strong>Google Sign-In</strong> (OAuth 2.0) para verificar la identidad de publicadores y ancianos. En estricto cumplimiento con la <em>Google API Services User Data Policy</em>:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-600 dark:text-slate-300">
                  <li>
                    <strong>Datos solicitados:</strong> Solo la información básica de perfil: nombre visible (<code>name</code>), correo electrónico (<code>email</code>) y foto de perfil (<code>picture</code>). No solicitamos acceso a Google Drive, Gmail, contactos ni ningún otro servicio privado.
                  </li>
                  <li>
                    <strong>Uso exclusivo:</strong> La información se utiliza únicamente para identificar al usuario y enlazarlo con su congregación aprobada.
                  </li>
                  <li>
                    <strong>No comercialización ni venta:</strong> Jamás vendemos, alquilamos ni transferimos los datos de Google a terceros, anunciantes o corredores de datos.
                  </li>
                  <li>
                    <strong>Sin entrenamiento de Inteligencia Artificial:</strong> Los datos de usuario de Google nunca se usan para entrenar ni mejorar modelos de inteligencia artificial o aprendizaje automático.
                  </li>
                  <li>
                    <strong>Cumplimiento de Uso Limitado (Limited Use):</strong> El uso y transferencia de información recibida de las APIs de Google se apegan rigurosamente a la <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">Política de Datos de Usuario de los Servicios de las APIs de Google</a>, incluidos los requisitos de Uso Limitado.
                  </li>
                  <li>
                    <strong>Desvinculación y revocación:</strong> Puedes desconectar tu cuenta en cualquier momento con el botón «Cambiar cuenta» o revocando el acceso directamente en <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">Configuración de Seguridad de Google</a>.
                  </li>
                </ul>
              </div>

              {/* Privacy Section 4 */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>4. Sin Publicidad, Sin Venta de Datos ni Rastreo Comercial</span>
                </h4>
                <p>
                  Kongre es un proyecto libre de publicidad comercial. <strong>Jamás vendemos, alquilamos, cedemos ni compartimos</strong> información de las congregaciones ni de los publicadores con terceros, anunciantes ni plataformas externas. Tampoco utilizamos cookies de seguimiento publicitario.
                </p>
              </div>

              {/* Privacy Section 5 */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>5. Almacenamiento Local, Control y Eliminación Definitiva</span>
                </h4>
                <p>
                  Para garantizar que la aplicación funcione sin internet y proteja la sesión en dispositivos compartidos (como la cabina de audio y video), los datos locales se resguardan en el almacenamiento del navegador (<code>IndexedDB</code> / <code>localStorage</code>) y cuentan con bloqueo automático por PIN tras inactividad.
                </p>
                <p>
                  El Cuerpo de Ancianos puede modificar, exportar o <strong>eliminar de manera definitiva e irreversible</strong> todos los datos locales y remotos de la congregación en cualquier momento desde el panel de Ajustes.
                </p>
              </div>

              {/* Privacy Section 6 */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>6. Canal de Contacto y Versión Oficial</span>
                </h4>
                <p>
                  Para consultas de privacidad o solicitudes de supresión de datos: <strong>soporte@kongre-app.com</strong>.
                  También puedes consultar la versión estática oficial y su versión en inglés en <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">https://kongre-app.com/privacy</a>.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 sm:px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Protegido con cifrado extremo a extremo AES-256-GCM</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
          >
            Entendido y Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
