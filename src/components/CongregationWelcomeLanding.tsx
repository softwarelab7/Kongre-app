// src/components/CongregationWelcomeLanding.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSecurity } from '../context/SecurityContext';
import { useCongregation } from '../context/CongregationContext';
import { useTheme } from '../context/ThemeContext';
import { THEOCRATIC_ROLES, TheocraticRole } from '../utils/rbac';
import {
  Bell,
  Sun,
  Moon,
  User as UserIcon,
  ChevronDown,
  Mail,
  Home,
  Sparkles,
  MousePointerClick,
  KeyRound,
  QrCode,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ShieldCheck,
  Lock,
  Calendar,
  MapPin,
  Wifi,
  Layers,
} from 'lucide-react';
import { RegisterCongregationWizard } from './RegisterCongregationWizard';

interface CongregationWelcomeLandingProps {
  onEnterApp: () => void;
  onOpenJoinModal?: () => void;
}

export const CongregationWelcomeLanding: React.FC<CongregationWelcomeLandingProps> = ({
  onEnterApp,
  onOpenJoinModal,
}) => {
  const { user, signInWithGoogle, signOutUser, setActiveRole, assignRoleToEmail } = useAuth();
  const { redeemInvitationCode, isMasterPassphraseSet, verifyMasterPassphrase } = useSecurity();
  const { settings } = useCongregation();
  const { isDark, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'home' | 'email_login' | 'code_login'>('home');
  const [isRegisterWizardOpen, setIsRegisterWizardOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Invitation code state
  const [invitationCode, setInvitationCode] = useState('');
  const [brotherName, setBrotherName] = useState(user?.displayName || '');
  const [masterPassphrase, setMasterPassphrase] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState<string | null>(null);

  // Email login state
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleEnterDemoMode = () => {
    localStorage.setItem('kongre_has_entered_app', 'true');
    setActiveRole('coordinador');
    onEnterApp();
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    setIsSubmittingCode(true);

    try {
      if (isMasterPassphraseSet && masterPassphrase) {
        const isMasterValid = await verifyMasterPassphrase(masterPassphrase);
        if (!isMasterValid) {
          setCodeError('La Clave Maestra de la Congregación es incorrecta.');
          setIsSubmittingCode(false);
          return;
        }
      }

      const emailToUse = user?.email || `${invitationCode.toLowerCase().replace(/[^a-z0-9]/g, '')}@kongre.org`;
      const nameToUse = brotherName.trim() || user?.displayName || 'Hermano Autorizado';

      const result = await redeemInvitationCode(invitationCode.trim(), emailToUse, nameToUse);

      if (!result.success || !result.role) {
        setCodeError(result.message);
        setIsSubmittingCode(false);
        return;
      }

      assignRoleToEmail(emailToUse, result.role, nameToUse);
      setActiveRole(result.role);
      localStorage.setItem('kongre_has_entered_app', 'true');

      setCodeSuccess(`¡Bienvenido! Has accedido con el rol de ${THEOCRATIC_ROLES[result.role]?.name || result.role}.`);

      setTimeout(() => {
        onEnterApp();
      }, 1000);
    } catch (err: any) {
      setCodeError(err?.message || 'Error al validar el código.');
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const handleGoogleLogin = async () => {
    setEmailError(null);
    setIsSubmittingEmail(true);
    try {
      await signInWithGoogle();
      // If congregation is already registered, enter the app
      if (settings.isRegistered && settings.congregationName) {
        localStorage.setItem('kongre_has_entered_app', 'true');
        onEnterApp();
      } else {
        // Registration is mandatory for a new congregation
        setIsRegisterWizardOpen(true);
      }
    } catch (err: any) {
      setEmailError(err?.message || 'Error al iniciar sesión con Google.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* ========================================================= */}
      {/* 1. TOP HEADER                                            */}
      {/* ========================================================= */}
      <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5">
          {/* Kongre Official-style Theocratic Emblem */}
          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-blue-500 p-1 flex items-center justify-center shadow-xs text-white">
            <Building2 className="w-4.5 h-4.5" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Kongre
          </span>
        </div>

        {/* Right Actions: Notifications, Theme Switch, Avatar Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Bell */}
          <button
            type="button"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Notificaciones"
          >
            <Bell className="w-5 h-5" />
          </button>

          {/* Dark / Light Mode Toggle Switch */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-12 h-6 p-0.5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center transition-colors relative cursor-pointer"
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-xs flex items-center justify-center transition-transform ${
                isDark ? 'translate-x-6 text-indigo-400' : 'translate-x-0 text-amber-500'
              }`}
            >
              {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
            </div>
          </button>

          {/* User Menu / Avatar Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-1 p-1 sm:px-2 sm:py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                <UserIcon className="w-4 h-4" />
              </div>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-40 text-xs">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{user.displayName || 'Hermano'}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onEnterApp();
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                    >
                      Ir al Panel Principal
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await signOutUser();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold cursor-pointer"
                    >
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 text-slate-500 dark:text-slate-400">Sin sesión iniciada</div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setActiveTab('email_login');
                      }}
                      className="w-full text-left px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-semibold cursor-pointer"
                    >
                      Iniciar Sesión
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN WORKSPACE / RESPONSIVE HERO & ACTIONS            */}
      {/* ========================================================= */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
          {/* ========================================================= */}
          {/* LEFT COLUMN: DESKTOP HERO & THEOCRATIC FEATURES          */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 xl:col-span-7 hidden lg:flex flex-col space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold w-fit shadow-xs">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Gestor Teocrático Integral • Seguro y Eficiente</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
                Toda la gestión teocrática de tu congregación, <span className="bg-linear-to-r from-indigo-600 via-indigo-500 to-blue-500 bg-clip-text text-transparent">en un solo lugar</span>.
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                Plataforma digital especializada para coordinadores, secretarios, superintendentes de servicio y publicadores. Organiza programas semanales, hojas S-89, asignaciones de limpieza y territorios con soporte offline PWA.
              </p>
            </div>

            {/* Feature Cards Grid (2x2 on Desktop) */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Reuniones & Guía S-89
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Programación Vida y Ministerio, Fin de Semana, generación automática e impresión de hojas S-89 oficiales.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 group hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Territorios & Carritos
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Manzanas georreferenciadas, enlaces digitales por QR para publicadores y control de turnos en carritos.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Seguridad por Roles & PIN
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Autenticación con ID de congregación, PIN de congregación y PIN personal bajo estrictas directrices.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 group hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Wifi className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  PWA & Modo Offline
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Úsala en el Salón sin conexión a internet; tus datos se sincronizan al volver a tener red.
                </p>
              </div>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleEnterDemoMode}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <MousePointerClick className="w-4 h-4 text-indigo-500" />
                <span>Explorar en Modo Demostración</span>
              </button>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Pruébalo sin registro previo en este equipo
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: INTERACTIVE ACCESS CARD                    */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 xl:col-span-5 w-full max-w-xl mx-auto lg:max-w-none">
            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 lg:p-9 shadow-xl shadow-slate-900/5 space-y-6">
              {/* Header Title inside card */}
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {activeTab === 'home'
                    ? '¡Bienvenido a Kongre!'
                    : activeTab === 'email_login'
                    ? 'Acceso con Correo'
                    : 'Unirse a Congregación'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  {activeTab === 'home'
                    ? 'Una herramienta teocrática que facilita la gestión integral de la congregación'
                    : activeTab === 'email_login'
                    ? 'Inicia sesión con Google u otro correo electrónico para entrar a tu cuenta'
                    : 'Accede con tu ID y PIN de congregación o código de invitación'}
                </p>
              </div>

              {/* VIEW: MAIN HOME OPTIONS */}
              {activeTab === 'home' && (
                <div className="space-y-4 pt-1">
                  {/* Option 1: Registrar una Nueva Congregación (Primary for new user) */}
                  <button
                    type="button"
                    onClick={() => setIsRegisterWizardOpen(true)}
                    className="w-full p-4 sm:p-5 rounded-2xl border-2 border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-950/30 hover:border-indigo-600 dark:hover:border-indigo-400 hover:shadow-md transition-all text-left flex items-start gap-4 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform shadow-xs">
                      <Building2 className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          Registrar mi Congregación
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 shrink-0">
                          Oficial
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Configura tu congregación desde cero (ID, PIN de Congregación, PIN Personal, circuito y horarios).
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center self-center text-indigo-500 group-hover:translate-x-0.5 transition-transform">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>

                  {/* Option 2: Iniciar sesión con correo electrónico */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('email_login')}
                    className="w-full p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs transition-all text-left flex items-start gap-4 group cursor-pointer bg-white dark:bg-slate-900"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <div className="relative">
                        <UserIcon className="w-5 h-5" />
                        <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-indigo-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">
                          @
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 flex-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        Iniciar sesión con correo electrónico
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Usa Google u otro correo electrónico para entrar a tu cuenta en cualquier momento.
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center self-center text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>

                  {/* Option 3: Iniciar sesión con ID & PIN o código de invitación */}
                  <button
                    type="button"
                    onClick={() => onOpenJoinModal ? onOpenJoinModal() : setActiveTab('code_login')}
                    className="w-full p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs transition-all text-left flex items-start gap-4 group cursor-pointer bg-white dark:bg-slate-900"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <div className="relative">
                        <Home className="w-5 h-5" />
                        <span className="absolute -bottom-1 -right-1 text-[8px] font-mono font-bold bg-indigo-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">
                          *
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 flex-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        Conectar con ID y PIN de Congregación
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Accede a una congregación existente con tu ID y PIN de Congregación o código de invitación.
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center self-center text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>

                  {/* Mobile Demo button */}
                  <div className="lg:hidden pt-2 text-center">
                    <button
                      type="button"
                      onClick={handleEnterDemoMode}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold cursor-pointer underline"
                    >
                      O explorar en modo demostración sin registrarse
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW: EMAIL LOGIN (Google or Email) */}
              {activeTab === 'email_login' && (
                <div className="space-y-4 pt-2 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Acceso con Correo Electrónico
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('home')}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      ← Volver
                    </button>
                  </div>

                  {emailError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{emailError}</span>
                    </div>
                  )}

                  {/* Google One-Click Button */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isSubmittingEmail}
                    className="w-full py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continuar con Google</span>
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="grow border-t border-slate-200 dark:border-slate-800" />
                    <span className="shrink mx-3 text-slate-400 text-xs uppercase">o con correo</span>
                    <div className="grow border-t border-slate-200 dark:border-slate-800" />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tu Correo Electrónico:
                      </label>
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="hermano@gmail.com"
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      Enviar enlace de acceso o entrar
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW: INVITATION CODE LOGIN */}
              {activeTab === 'code_login' && (
                <div className="space-y-4 pt-2 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Acceso con Código de Invitación
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('home')}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      ← Volver
                    </button>
                  </div>

                  {codeError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{codeError}</span>
                    </div>
                  )}

                  {codeSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span>{codeSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleRedeemCode} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Código de Invitación:
                      </label>
                      <input
                        type="text"
                        required
                        value={invitationCode}
                        onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                        placeholder="Ej: KONG-SEC-4819"
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-center tracking-widest text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nombre del Hermano:
                      </label>
                      <input
                        type="text"
                        value={brotherName}
                        onChange={(e) => setBrotherName(e.target.value)}
                        placeholder="Ej: Juan Pérez"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    {isMasterPassphraseSet && (
                      <div>
                        <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
                          Clave Maestra de la Congregación:
                        </label>
                        <input
                          type="password"
                          value={masterPassphrase}
                          onChange={(e) => setMasterPassphrase(e.target.value)}
                          placeholder="Frase de paso secreta de ancianos"
                          className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingCode || !invitationCode.trim()}
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>{isSubmittingCode ? 'Validando...' : 'Canjear e Ingresar'}</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Policy & Terms Notice */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-8 leading-relaxed">
          Más información sobre nuestros{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Términos de Uso
          </a>{' '}
          y{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Política de Privacidad
          </a>
          .
        </p>
      </main>

      {/* Subtle bottom note */}
      <footer className="w-full text-center py-4 text-[11px] text-slate-400 dark:text-slate-600">
        Kongre • Gestor Teocrático Integral para Congregaciones
      </footer>

      {/* Step-by-Step Congregation Registration Wizard (Mandatory flow) */}
      <RegisterCongregationWizard
        isOpen={isRegisterWizardOpen}
        isMandatory={!settings.isRegistered}
        onOpenJoinWithCode={() => {
          setIsRegisterWizardOpen(false);
          setActiveTab('code_login');
        }}
        onClose={() => setIsRegisterWizardOpen(false)}
        onRegisteredSuccess={() => {
          setIsRegisterWizardOpen(false);
          localStorage.setItem('kongre_has_entered_app', 'true');
          onEnterApp();
        }}
      />
    </div>
  );
};
