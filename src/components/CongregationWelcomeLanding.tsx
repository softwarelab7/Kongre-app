import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSecurity } from '../context/SecurityContext';
import { useCongregation } from '../context/CongregationContext';
import { useTheme } from '../context/ThemeContext';
import { THEOCRATIC_ROLES, TheocraticRole } from '../utils/rbac';
import { isCongregationIdString, getFriendlyCongregationName, verifyPasscode, isGenericIdentityName, formatCanonicalCongregationId, formatCongregationIdInput, formatCongregationPinInput, verifyPersonalPinMatch, getSecureLocalPin, setSecureLocalPin, verifySecureLocalPin } from '../utils/theocraticSecurity';
import { areNamesEquivalent } from '../utils/publisherDeduplication';
import {
  Sun,
  Moon,
  MonitorSpeaker,
  CircleUserRound,
  User as UserIcon,
  Mail,
  Home,
  Sparkles,
  KeyRound,
  QrCode,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Users,
  LogOut,
  Lock,
  Calendar,
  CalendarDays,
  MapPin,
  Wifi,
  CloudOff,
  Layers,
  Hash,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { DemoStartupModal } from './DemoStartupModal';
import { IconCongregationAccess } from './IconCongregationAccess';
import { RegisterCongregationWizard } from './RegisterCongregationWizard';
import { PendingApprovalView } from './PendingApprovalView';
import { KongreLogo } from './KongreLogo';
import Logo from '../Logo';
import AnimatedLogo from '../AnimatedLogo';
import ThemeToggle from './ThemeToggle';
import { AppFooter } from './AppFooter';
import { CURRENT_APP_VERSION, BUILD_DATE } from '../utils/versionLog';

const NEXT_THEME: Record<string, 'light' | 'dark' | 'cabina'> = { light: 'dark', dark: 'cabina', cabina: 'light' };
const THEME_NAMES: Record<string, string> = { light: 'Claro', dark: 'Oscuro', cabina: 'Cabina A/V' };
const THEME_ICONS: Record<string, any> = { light: Sun, dark: Moon, cabina: MonitorSpeaker };

interface CongregationWelcomeLandingProps {
  onEnterApp: () => void;
  onOpenJoinModal?: () => void;
  onOpenVersionModal?: () => void;
}

function LandingFeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <article className="border-t border-line py-3 lg:py-3.5 cursor-default group transition-colors">
      <div className="flex items-center gap-2.5">
        <Icon size={22} className="text-brand shrink-0" strokeWidth={2} aria-hidden />
        <h3 className="text-sm lg:text-[14.5px] font-bold text-ink group-hover:text-brand transition-colors">
          {title}
        </h3>
      </div>
      <p className="mt-1 text-xs sm:text-[12.5px] leading-relaxed text-muted line-clamp-2 xl:line-clamp-none">
        {text}
      </p>
    </article>
  );
}

interface DesktopOptionProps {
  icon: any;
  title: string;
  description: string;
  pill?: { label: string; tone: 'of' | 'ok' };
  isFeatured?: boolean;
  onClick: () => void;
  iconCustom?: React.ReactNode;
}

function DesktopOption({
  icon: Icon,
  title,
  description,
  pill,
  isFeatured = false,
  onClick,
  iconCustom,
}: DesktopOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`opt hov group mb-1.5 flex w-full cursor-pointer items-start gap-3 rounded-2xl border-[1.5px] p-2.5 sm:p-3 text-left transition-all ${
        isFeatured
          ? 'border-bline bg-brand-soft hover:border-brand shadow-xs'
          : 'border-transparent hover:bg-hover'
      }`}
    >
      <span className="mt-0.5 shrink-0 text-brand">
        {iconCustom ? iconCustom : <Icon size={24} strokeWidth={2} aria-hidden />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <b className="text-[13.5px] sm:text-[14px] lg:text-[14.5px] font-bold text-ink group-hover:text-brand transition-colors leading-snug">
            {title}
          </b>
          {pill && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold whitespace-nowrap ${
                pill.tone === 'of' ? 'bg-ofb text-off' : 'bg-okb text-okf'
              }`}
            >
              {pill.label}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-[11.5px] sm:text-[12px] leading-snug text-muted">
          {description}
        </span>
      </span>
      <ArrowRight
        size={18}
        className="mt-1 text-muted transition-all group-hover:translate-x-1 group-hover:text-brand shrink-0"
        aria-hidden
      />
    </button>
  );
}

interface LandingOptionRowProps {
  icon?: any;
  title: string;
  description: string;
  badge?: { label: string; tone: 'oficial' | 'lectura' };
  isFeatured?: boolean;
  onClick: () => void;
  iconCustom?: React.ReactNode;
  iconColor?: string;
}

function LandingOptionRow({
  icon: Icon,
  title,
  description,
  badge,
  isFeatured = false,
  onClick,
  iconCustom,
  iconColor = 'text-brand',
}: LandingOptionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full box-border p-3.5 sm:p-4 rounded-2xl text-left cursor-pointer transition-all flex items-start gap-3.5 sm:gap-4 group ${
        isFeatured
          ? 'bg-brand-soft border-[1.5px] border-bline hover:border-brand dark:bg-indigo-950/40 dark:border-indigo-800 dark:hover:border-indigo-600 shadow-xs'
          : 'bg-transparent border-[1.5px] border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60'
      }`}
    >
      <div className="shrink-0 mt-0.5">
        {iconCustom ? (
          iconCustom
        ) : Icon ? (
          <Icon className={`w-7 h-7 ${iconColor}`} strokeWidth={2} aria-hidden />
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-[15.5px] sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-brand transition-colors">
            {title}
          </span>
          {badge && badge.tone === 'oficial' && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#E0E7FF] dark:bg-indigo-900/70 text-[#3730A3] dark:text-indigo-200 text-xs font-semibold whitespace-nowrap">
              {badge.label}
            </span>
          )}
          {badge && badge.tone === 'lectura' && (
            <span className="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] dark:bg-emerald-950 text-[#166534] dark:text-emerald-300 text-xs font-semibold whitespace-nowrap">
              {badge.label}
            </span>
          )}
        </div>
        <div className="mt-1 text-[13px] leading-snug text-slate-500 dark:text-slate-400">
          {description}
        </div>
      </div>

      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand group-hover:translate-x-1 transition-all shrink-0 mt-0.5" />
    </button>
  );
}

export const CongregationWelcomeLanding: React.FC<CongregationWelcomeLandingProps> = ({
  onEnterApp,
  onOpenJoinModal,
  onOpenVersionModal,
}) => {
  const {
    user,
    signInWithGoogle,
    signOutUser,
    setActiveRole,
    setIdentifiedBrother,
    setIdentifiedPublisher,
    assignRoleToEmail,
    identifyRoleByPersonalPin,
    userRolesList,
    userProfile,
    assignPersonalPinToPublisher,
  } = useAuth();
  const {
    redeemInvitationCode,
    verifyCongregationPin,
    verifyPersonalPin,
  } = useSecurity();
  const {
    settings,
    updateSettings,
    publishers,
    addPublisher,
    accountLinkRequests,
    createAccountLinkRequest,
    restorePreviousRegistration,
    uploadLocalDataToGoogle,
    loadCongregationFromCloud,
    hydrateCongregation,
    findUserCongregationId,
    loadDemoData,
  } = useCongregation();
  const { themeMode, setThemeMode, isDark, toggleTheme } = useTheme();
  const nextTheme = NEXT_THEME[themeMode] || 'dark';
  const CurrentThemeIcon = THEME_ICONS[themeMode] || (isDark ? Moon : Sun);

  const [activeTab, setRawActiveTab] = useState<'home' | 'email_login' | 'code_login' | 'invite_code_login' | 'register' | 'unauthorized'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
      const v = params.get('view') as any;
      if (['home', 'email_login', 'code_login', 'invite_code_login', 'register', 'unauthorized'].includes(v)) {
        return v;
      }
    }
    return 'home';
  });

  const setActiveTab = useCallback((nextTabOrFn: any) => {
    setRawActiveTab((prev: any) => {
      const nextTab = typeof nextTabOrFn === 'function' ? nextTabOrFn(prev) : nextTabOrFn;
      if (nextTab === prev) return prev;
      const hash = nextTab === 'home' ? '#portal' : `#portal?view=${nextTab}`;
      window.history.pushState({ landing: true, view: nextTab }, '', hash);
      return nextTab;
    });
  }, []);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const hash = window.location.hash;
      if (hash.startsWith('#portal') || hash.startsWith('#bienvenida')) {
        const params = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
        const v = (params.get('view') || e.state?.view || 'home') as any;
        if (['home', 'email_login', 'code_login', 'invite_code_login', 'register', 'unauthorized'].includes(v)) {
          setRawActiveTab(v);
        } else {
          setRawActiveTab('home');
        }
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const [pendingApprovalEmail, setPendingApprovalEmail] = useState<string | null>(null);
  const [unauthorizedGoogleAccount, setUnauthorizedGoogleAccount] = useState<{
    email: string;
    name: string;
    congregationId: string;
    congregationName: string;
  } | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Three credentials (PIN Personal es opcional para coordinadores):
  // 1. ID de la Congregación
  // 2. PIN de la Congregación
  // 3. PIN Personal suministrado por el Coordinador
  const [congregationIdInput, setCongregationIdInput] = useState(() => {
    const defaultId = settings.congregationNumber || settings.congregationId || '';
    if (!defaultId || defaultId.toUpperCase().includes('DEMO')) {
      return '';
    }
    return formatCanonicalCongregationId(defaultId);
  });

  // Garantizar que '1001-DEMO' o cualquier texto de prueba nunca persista en el formulario
  useEffect(() => {
    if (congregationIdInput && congregationIdInput.toUpperCase().includes('DEMO')) {
      setCongregationIdInput('');
    }
  }, [congregationIdInput]);
  const [congregationPinInput, setCongregationPinInput] = useState('');
  const [personalPinInput, setPersonalPinInput] = useState('');
  const [showCongPin, setShowCongPin] = useState(false);
  const [showPersPin, setShowPersPin] = useState(false);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState<string | null>(null);

  // Email login state
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Invitation code login state (Organized Pocket mode)
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [isActivatingCode, setIsActivatingCode] = useState(false);
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);
  const [inviteCodeSuccess, setInviteCodeSuccess] = useState<string | null>(null);
  const [isQrDetected, setIsQrDetected] = useState(false);

  // Detectar automáticamente parámetro ?invite=... de un Código QR o enlace compartido
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
      const hashParams = new URLSearchParams(hashQuery);

      const inviteParam = searchParams.get('invite') || hashParams.get('invite');
      const congParam = searchParams.get('cong') || hashParams.get('cong');
      const cpinParam = searchParams.get('cpin') || hashParams.get('cpin');

      if (inviteParam) {
        const cleanInvite = inviteParam.trim();
        const fullCode = congParam && cpinParam
          ? `${formatCanonicalCongregationId(congParam)}::${cpinParam.trim()}::${cleanInvite}`
          : cleanInvite;
        setInviteCodeInput(fullCode);
        setShowInviteCode(true);
        setIsQrDetected(true);
        if (congParam) setCongregationIdInput(formatCanonicalCongregationId(congParam));
        if (cpinParam) setCongregationPinInput(cpinParam.trim());
        setRawActiveTab('invite_code_login');
      }
    } catch {}
  }, []);

  const resolvePublisherRolesList = (matched: any): { primaryRole: TheocraticRole; allRoles: TheocraticRole[] } => {
    const primaryRole: TheocraticRole = (
      matched.theocraticRole ||
      (matched.privilege === 'anciano' ? 'anciano' : 'publico')
    ) as TheocraticRole;

    const rolesSet = new Set<TheocraticRole>([primaryRole]);
    if (matched.privilege === 'anciano') {
      rolesSet.add('anciano');
    }
    if (Array.isArray(matched.theocraticRoles)) {
      matched.theocraticRoles.forEach((r: string) => {
        if (r && THEOCRATIC_ROLES[r as TheocraticRole]) {
          rolesSet.add(r as TheocraticRole);
        }
      });
    }
    return { primaryRole, allRoles: Array.from(rolesSet) };
  };

  const handleActivateWithInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteCodeError(null);
    setInviteCodeSuccess(null);
    let cleanCode = inviteCodeInput.trim();
    if (!cleanCode) {
      setInviteCodeError('Por favor introduce el código de invitación.');
      return;
    }

    setIsActivatingCode(true);

    try {
      let finalRole: TheocraticRole | null = null;
      let finalRolesList: TheocraticRole[] = [];
      let finalBrotherName = '';
      let publisherIdToSet: string | null = null;
      let targetCongregationId = settings.congregationNumber || settings.congregationId || '';
      let targetCongPin = congregationPinInput.trim() || localStorage.getItem('kongre_registered_cong_pin') || '';
      let codeToRedeem = cleanCode;

      // 0A. Si el hermano pegó un enlace completo (https://.../?invite=... o ?cong=...) extraer sus parámetros automáticamente
      if (cleanCode.includes('invite=') || cleanCode.includes('cong=')) {
        try {
          const queryPart = cleanCode.includes('?') ? cleanCode.split('?')[1].split('#')[0] : cleanCode;
          const urlParams = new URLSearchParams(queryPart);
          const uCong = urlParams.get('cong');
          const uCpin = urlParams.get('cpin');
          const uInvite = urlParams.get('invite') || urlParams.get('pin');
          if (uCong && uCpin && uInvite) {
            cleanCode = `${formatCanonicalCongregationId(uCong)}::${uCpin.trim()}::${uInvite.trim()}`;
            codeToRedeem = cleanCode;
          } else if (uInvite) {
            if (uCong) targetCongregationId = formatCanonicalCongregationId(uCong);
            if (uCpin) targetCongPin = uCpin.trim();
            codeToRedeem = uInvite.trim();
          }
        } catch {}
      }

      // 0B. Soportar código portátil compuesto con '::': KGR-XXXX-XXXX::PINCONG::KONG-ROL-1234 (o PINPersonal)
      if (cleanCode.includes('::')) {
        const segments = cleanCode.split('::').map((s) => s.trim()).filter(Boolean);
        if (segments.length >= 3) {
          targetCongregationId = formatCanonicalCongregationId(segments[0]);
          targetCongPin = segments[1];
          codeToRedeem = segments.slice(2).join('::');

          const cloudRes = await loadCongregationFromCloud(targetCongregationId, {
            skipHydrate: true,
            pin: targetCongPin,
            personalPin: codeToRedeem,
          });
          if (cloudRes?.success && cloudRes.data) {
            await hydrateCongregation(cloudRes.data);
            localStorage.setItem('kongre_registered_cong_pin', targetCongPin);
            localStorage.setItem('kongre_last_cong_pin', targetCongPin);

            const pubs = (cloudRes.data.publishers || []) as any[];
            const matched = pubs.find(
              (p: any) => p.personalPin && String(p.personalPin).trim().toUpperCase() === codeToRedeem.toUpperCase()
            );
            if (matched) {
              const resolved = resolvePublisherRolesList(matched);
              finalRole = resolved.primaryRole;
              finalRolesList = resolved.allRoles;
              finalBrotherName = matched.name && !isGenericIdentityName(matched.name) ? matched.name.trim() : 'Hermano';
              publisherIdToSet = matched.id;
            }
          }
        }
      }

      // 1. Verificar si el código contiene guiones con formato compuesto ID-PINCONG-PINPERSONAL (ej: KGR-XXXX-XXXX-XXXX-XXXX-PIN o CONG-PINCONG-PIN)
      if (!finalRole && codeToRedeem.includes('-') && !codeToRedeem.toUpperCase().startsWith('KONG-')) {
        const parts = codeToRedeem.split('-').map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          let potentialCong = '';
          let potentialPin = '';
          let optionalCongPin = targetCongPin;
          if (parts[0].toUpperCase() === 'KGR' && parts.length >= 4) {
            potentialCong = formatCanonicalCongregationId(parts.slice(0, 3).join('-'));
            if (parts.length >= 6) {
              optionalCongPin = `${parts[3]}-${parts[4]}`;
              potentialPin = parts.slice(5).join('-');
            } else if (parts.length === 5 && parts[3].length === 8) {
              optionalCongPin = `${parts[3].slice(0, 4)}-${parts[3].slice(4)}`;
              potentialPin = parts[4];
            } else {
              potentialPin = parts.slice(3).join('-');
            }
          } else if (parts.length >= 3 && !parts[1].toUpperCase().startsWith('KONG')) {
            potentialCong = formatCanonicalCongregationId(parts[0]);
            optionalCongPin = parts[1];
            potentialPin = parts.slice(2).join('-');
          } else {
            potentialCong = formatCanonicalCongregationId(parts[0]);
            potentialPin = parts.slice(1).join('-');
          }

          const cloudRes = await loadCongregationFromCloud(potentialCong, {
            skipHydrate: true,
            pin: optionalCongPin || potentialPin,
            personalPin: potentialPin,
          });
          if (cloudRes?.success && cloudRes.data) {
            targetCongregationId = potentialCong;
            if (optionalCongPin) {
              targetCongPin = optionalCongPin;
              localStorage.setItem('kongre_registered_cong_pin', optionalCongPin);
              localStorage.setItem('kongre_last_cong_pin', optionalCongPin);
            }
            codeToRedeem = potentialPin;
            await hydrateCongregation(cloudRes.data);

            const pubs = (cloudRes.data.publishers || []) as any[];
            const matched = pubs.find((p: any) => verifyPersonalPinMatch(potentialPin, p));
            if (matched) {
              const resolved = resolvePublisherRolesList(matched);
              finalRole = resolved.primaryRole;
              finalRolesList = resolved.allRoles;
              finalBrotherName = matched.name && !isGenericIdentityName(matched.name) ? matched.name.trim() : 'Hermano';
              publisherIdToSet = matched.id;
            }
          }
        }
      }

      // 2. Verificar si es un código de invitación generado en InvitationManagerModal (local o sincronizado desde la nube)
      if (!finalRole) {
        const invRes = await redeemInvitationCode(codeToRedeem, user?.email || `hermano_${Date.now()}@kongre.org`, 'Hermano');
        if (invRes.success && invRes.role) {
          finalRole = invRes.role;
          finalRolesList = [invRes.role];
          finalBrotherName = invRes.targetName && !isGenericIdentityName(invRes.targetName) ? invRes.targetName : 'Hermano';
        }
      }

      // 3. Verificar si el código coincide con el PIN personal de algún publicador en la congregación activa
      if (!finalRole && publishers && publishers.length > 0) {
        const matched = publishers.find((p) => verifyPersonalPinMatch(codeToRedeem, p));
        if (matched) {
          const resolved = resolvePublisherRolesList(matched);
          finalRole = resolved.primaryRole;
          finalRolesList = resolved.allRoles;
          finalBrotherName = matched.name && !isGenericIdentityName(matched.name) ? matched.name.trim() : 'Hermano';
          publisherIdToSet = matched.id;
        }
      }

      // 4. Si el código es 'DEMO', activar el modo de prueba
      if (!finalRole && (codeToRedeem.toUpperCase() === 'DEMO' || codeToRedeem.toUpperCase() === 'DEMO-001' || codeToRedeem.toUpperCase() === 'INV-DEMO')) {
        loadDemoData();
        setActiveRole('coordinador');
        setIdentifiedBrother('Carlos Mendoza (Demo)');
        sessionStorage.setItem('kongre_demo_notice_shown', 'false');
        setInviteCodeSuccess('¡Activado con éxito en modo de prueba!');
        setTimeout(() => {
          setIsActivatingCode(false);
          onEnterApp();
        }, 600);
        return;
      }

      // 5. Verificar si coincide con algún publicador o invitación en la nube para la congregación activa
      if (!finalRole) {
        const activeCongId = targetCongregationId || localStorage.getItem('kongre_congregation_number') || '';
        if (activeCongId) {
          const cloudRes = await loadCongregationFromCloud(activeCongId, {
            skipHydrate: true,
            pin: targetCongPin || codeToRedeem,
            personalPin: codeToRedeem,
          });
          if (cloudRes?.success && cloudRes.data) {
            await hydrateCongregation(cloudRes.data);
            if (cloudRes.data.publishers) {
              const matched = cloudRes.data.publishers.find((p: any) => verifyPersonalPinMatch(codeToRedeem, p));
              if (matched) {
                const resolved = resolvePublisherRolesList(matched);
                finalRole = resolved.primaryRole;
                finalRolesList = resolved.allRoles;
                finalBrotherName = matched.name && !isGenericIdentityName(matched.name) ? matched.name.trim() : 'Hermano';
                publisherIdToSet = matched.id;
              }
            }
            if (!finalRole && Array.isArray(cloudRes.data.invitations)) {
              const invRes = await redeemInvitationCode(codeToRedeem, user?.email || `hermano_${Date.now()}@kongre.org`, 'Hermano');
              if (invRes.success && invRes.role) {
                finalRole = invRes.role;
                finalRolesList = [invRes.role];
                finalBrotherName = invRes.targetName && !isGenericIdentityName(invRes.targetName) ? invRes.targetName : 'Hermano';
              }
            }
          }
        }
      }

      if (!finalRole) {
        setInviteCodeError('Código de invitación no válido o expirado. Verifica que esté bien escrito o solicita el código completo a los ancianos de tu congregación.');
        setIsActivatingCode(false);
        return;
      }

      // Activación exitosa: Aplicar rol(es), identificar hermano y entrar a la app
      if (finalRolesList.length > 0) {
        setActiveRoles(finalRolesList);
      } else {
        setActiveRole(finalRole);
      }
      setIdentifiedBrother(finalBrotherName || 'Hermano');
      if (publisherIdToSet) {
        setIdentifiedPublisher(publisherIdToSet, finalBrotherName);
      }
      localStorage.setItem('kongre_session_pin_v2', codeToRedeem);
      localStorage.setItem('kongre_is_registered_congregation', 'true');
      localStorage.setItem('kongre_has_entered_app', 'true');
      localStorage.setItem('kongre_identified_brother', finalBrotherName || 'Hermano');
      if (targetCongregationId) {
        localStorage.setItem('kongre_congregation_number', targetCongregationId);
        localStorage.setItem('kongre_congregation_id', targetCongregationId);
      }

      // Limpiar parámetros ?invite=... de la URL para evitar re-ejecución al recargar
      if (typeof window !== 'undefined' && window.location.search.includes('invite=')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      setInviteCodeSuccess(`¡Bienvenido, ${finalBrotherName}! Activando aplicación...`);
      setTimeout(() => {
        setIsActivatingCode(false);
        onEnterApp();
      }, 700);
    } catch (err: any) {
      setInviteCodeError(err?.message || 'Error al validar el código de invitación.');
      setIsActivatingCode(false);
    }
  };

  const handleConnectWithIdPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    setCodeSuccess(null);
    setIsSubmittingCode(true);

    try {
      const rawInput = congregationIdInput.trim();
      const cleanId = formatCanonicalCongregationId(rawInput);
      const cleanCongPin = congregationPinInput.trim();
      const cleanPersonalPin = personalPinInput.trim();
      let nameToUse = '';
      let emailToUse = user?.email || `hermano_${cleanId || 'cong'}@kongre.org`;

      // 1. Validar ID
      if (!cleanId) {
        setCodeError('Por favor introduce el ID o Nombre de la Congregación.');
        setIsSubmittingCode(false);
        return;
      }
      // 2. Validar PIN de congregación
      if (!cleanCongPin) {
        setCodeError('Por favor introduce el PIN de la Congregación.');
        setIsSubmittingCode(false);
        return;
      }

      // 1. Cargar y descifrar datos actualizados de la congregación desde la nube pasando el PIN provisto
      const cloudRes = await loadCongregationFromCloud(cleanId, {
        skipHydrate: true,
        pin: cleanCongPin,
        personalPin: cleanPersonalPin || undefined,
      });
      const cloudData = cloudRes?.data;
      const effectiveId = formatCanonicalCongregationId(
        cloudData?.congregationId || cloudData?.congregation_id || cloudData?.settings?.congregationId || cleanId
      );

      if (!cloudRes?.success || !cloudData) {
        setCodeError(
          cloudRes?.message ||
            `No se encontró ninguna congregación registrada con el ID "${cleanId}" o el PIN de Congregación es incorrecto.`
        );
        setIsSubmittingCode(false);
        return;
      }

      // 2. Validar coincidencia de PIN de Congregación (OBLIGATORIO)
      const effectivePinHash =
        cloudData?.settings?.congregationPinHash ||
        cloudData?.congregationPinHash;

      let isCongPinValid = Boolean(cloudRes.isDecryptedFromCloud);
      if (effectivePinHash) {
        isCongPinValid = await verifyPasscode(cleanCongPin, effectivePinHash);
      } else if (!isCongPinValid) {
        isCongPinValid = await verifyCongregationPin(cleanCongPin);
      }

      if (!isCongPinValid) {
        setCodeError('El PIN de Congregación ingresado es incorrecto.');
        setIsSubmittingCode(false);
        return;
      }

      // Persistir el PIN de congregación verificado para futuras sincronizaciones en este dispositivo
      localStorage.setItem('kongre_registered_cong_pin', cleanCongPin);
      localStorage.setItem('kongre_last_cong_pin', cleanCongPin);

      let identifiedRole: TheocraticRole | undefined;

      // 3. Probar PIN personal en el directorio de la congregación ÚNICAMENTE si el usuario lo ingresó
      let matchingPub: any = null;
      const savedCoordPin = localStorage.getItem('kongre_coordinator_pin');
      if (cleanPersonalPin) {
        if (savedCoordPin && savedCoordPin.trim() === cleanPersonalPin) {
          identifiedRole = 'coordinador';
          const savedCoord = localStorage.getItem('kongre_coordinator_name') || cloudData?.settings?.coordinatorName || settings.coordinatorName;
          nameToUse = savedCoord && !isGenericIdentityName(savedCoord) ? savedCoord.trim() : 'Coordinador';
          setIdentifiedBrother(nameToUse);
        } else {
          const congPubs = (cloudData?.publishers || publishers) as any[];
          matchingPub = congPubs.find((p) => verifyPersonalPinMatch(cleanPersonalPin, p));

          if (matchingPub) {
            const resolved = resolvePublisherRolesList(matchingPub);
            identifiedRole = resolved.primaryRole;
            nameToUse = matchingPub.name && !isGenericIdentityName(matchingPub.name) ? matchingPub.name.trim() : 'Hermano';
            if (matchingPub.email) emailToUse = matchingPub.email;
            setIdentifiedPublisher(matchingPub.id, nameToUse);
            setIdentifiedBrother(nameToUse);
          } else {
            // Sincronizar invitaciones descargadas de la nube antes de canjear
            if (cloudData?.invitations && Array.isArray(cloudData.invitations)) {
              try {
                localStorage.setItem('kongre_theocratic_invitations_v1', JSON.stringify(cloudData.invitations));
                window.dispatchEvent(new CustomEvent('kongre_invitations_updated', { detail: cloudData.invitations }));
              } catch {}
            }
            // Probar código de invitación generado por los ancianos
            const invResult = await redeemInvitationCode(cleanPersonalPin, emailToUse, nameToUse || 'Hermano');
            if (invResult.success && invResult.role) {
              identifiedRole = invResult.role;
              if (invResult.targetName && !isGenericIdentityName(invResult.targetName)) {
                nameToUse = invResult.targetName;
              }
            } else {
              setCodeError('El PIN Personal ingresado no coincide con ningún publicador en esta congregación. Verifica el PIN asignado por los ancianos o déjalo vacío para entrar en Modo Cartelera/Público.');
              setIsSubmittingCode(false);
              return;
            }
          }
        }
      }

      // Si solo ingresó PIN de congregación sin PIN personal, el rol es ESTRICTAMENTE 'publico' (nunca 'coordinador')
      const roleFinal: TheocraticRole = identifiedRole || 'publico';

      // 4. Resolver nombre real según la identidad identificada
      if (!nameToUse || isGenericIdentityName(nameToUse)) {
        if (roleFinal === 'coordinador') {
          const cloudCoord = cloudData?.settings?.coordinatorName;
          const localCoord = settings.coordinatorName;
          const savedCoord = localStorage.getItem('kongre_coordinator_name');
          const googleName = user?.displayName;

          if (cloudCoord && !isGenericIdentityName(cloudCoord)) {
            nameToUse = cloudCoord.trim();
          } else if (localCoord && !isGenericIdentityName(localCoord)) {
            nameToUse = localCoord.trim();
          } else if (savedCoord && !isGenericIdentityName(savedCoord)) {
            nameToUse = savedCoord.trim();
          } else if (googleName && !isGenericIdentityName(googleName)) {
            nameToUse = googleName.trim();
          } else {
            nameToUse = 'Coordinador';
          }
        } else {
          nameToUse = user?.displayName && !isGenericIdentityName(user.displayName) ? user.displayName.trim() : 'Publicador';
        }
      }

      // 5. El usuario ha sido validado correctamente con el PIN de la congregación
      const cleanCongName =
        (cloudRes?.success && cloudRes.congregationName && !isCongregationIdString(cloudRes.congregationName)
          ? cloudRes.congregationName
          : null) ||
        (settings.congregationName && !isCongregationIdString(settings.congregationName)
          ? settings.congregationName
          : (localStorage.getItem('kongre_congregation_name') || ''));

      // Hidratar datos de la congregación una sola vez de manera segura tras validar el PIN
      if (cloudData) {
        hydrateCongregation(cloudData);
      }

      localStorage.setItem('kongre_congregation_number', effectiveId);
      localStorage.setItem('kongre_congregation_id', effectiveId);

      const newSettingsUpdate: any = {
        isRegistered: true,
        ...(cleanCongName ? { congregationName: cleanCongName } : {}),
        congregationNumber: effectiveId,
        congregationId: effectiveId,
      };

      if (!isGenericIdentityName(nameToUse)) {
        localStorage.setItem('kongre_identified_brother', nameToUse);
        setIdentifiedBrother(nameToUse);
        if (roleFinal === 'coordinador') {
          localStorage.setItem('kongre_coordinator_name', nameToUse);
          newSettingsUpdate.coordinatorName = nameToUse;
        }
      }

      // Actualizar configuración local sin sobreescribir la nube recién descargada
      updateSettings(newSettingsUpdate, { skipCloudWrite: true });

      const cleanPhoto =
        cloudData?.settings?.coordinatorPhotoURL ||
        cloudData?.coordinatorPhotoURL ||
        localStorage.getItem('kongre_coordinator_photo') ||
        localStorage.getItem('kongre_google_photo') ||
        '';

      if (cleanPhoto) {
        localStorage.setItem('kongre_coordinator_photo', cleanPhoto);
        if (roleFinal === 'coordinador') {
          localStorage.setItem('kongre_user_photo', cleanPhoto);
        }
      }

      assignRoleToEmail(emailToUse, roleFinal, nameToUse, cleanPersonalPin || undefined);
      setActiveRole(roleFinal);

      if (cleanPersonalPin) {
        localStorage.setItem('kongre_session_pin_v2', cleanPersonalPin);
      }

      // Si se identificó un publicador coincidente en la lista, asegurar la vinculación exacta
      if (matchingPub && matchingPub.id) {
        setIdentifiedPublisher(matchingPub.id, nameToUse);
      }

      localStorage.setItem('kongre_is_registered_congregation', 'true');
      localStorage.setItem('kongre_has_entered_app', 'true');
      localStorage.removeItem('kongre_needs_cloud_upload');
      localStorage.setItem('kongre_last_local_update', cloudData?.updatedAt || new Date().toISOString());

      // Vincular de forma persistente si el usuario tiene sesión activa
      const uidToLink = user?.uid;
      if (uidToLink) {
        try {
          localStorage.setItem('kongre_user_cong_id', effectiveId);
        } catch {}
      }

      setCodeSuccess(`¡Conexión exitosa a ${cleanCongName}! Bienvenido, ${nameToUse} (${THEOCRATIC_ROLES[roleFinal]?.name || roleFinal}).`);
      setTimeout(() => {
        onEnterApp();
      }, 900);
    } catch (err: any) {
      setCodeError(err?.message || 'Error al conectar con la congregación.');
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // Si tiene una solicitud en espera de aprobación, mostrar pantalla dedicada
  const currentPendingReq = user?.email
    ? accountLinkRequests.find(
        (r) => r.email.toLowerCase().trim() === user.email?.toLowerCase().trim() && r.status === 'pending'
      )
    : null;

  if (pendingApprovalEmail || currentPendingReq) {
    return (
      <PendingApprovalView
        email={pendingApprovalEmail || user?.email || ''}
        onEnterApp={() => {
          setPendingApprovalEmail(null);
          localStorage.setItem('kongre_has_entered_app', 'true');
          onEnterApp();
        }}
        onSignOut={async () => {
          await signOutUser();
          setPendingApprovalEmail(null);
          setActiveTab('home');
        }}
      />
    );
  }

  const handleGoogleLogin = async () => {
    setEmailError(null);
    setIsSubmittingEmail(true);
    try {
      const loggedUser = await signInWithGoogle();
      if (!loggedUser) {
        setIsSubmittingEmail(false);
        return;
      }
      const userEmail = loggedUser.email?.toLowerCase().trim() || '';

      if (!userEmail) {
        setEmailError('No se pudo obtener el correo de la cuenta de Google.');
        setIsSubmittingEmail(false);
        return;
      }

      // Pre-llenar el ID de congregación si el usuario ya tenía uno registrado en su perfil
      try {
        const foundId = await findUserCongregationId(userEmail, loggedUser.uid);
        if (foundId) {
          setCongregationIdInput(foundId);
        }
      } catch (err) {
        console.warn('Aviso buscando ID de congregación:', err);
      }

      // Permanecer en la pantalla de inicio de sesión con Google para mostrar el enunciado y solicitar el ID de congregación
      setActiveTab('email_login');
    } catch (err: any) {
      setEmailError(err?.message || 'Error al iniciar sesión con Google.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const [isStartingDemo, setIsStartingDemo] = useState(false);

  const handleEnterDemoMode = () => {
    setIsStartingDemo(true);
    setTimeout(() => {
      loadDemoData();
      setActiveRole('coordinador');
      setIdentifiedBrother('Carlos Mendoza (Demo)');
      sessionStorage.setItem('kongre_demo_notice_shown', 'false');
      setIsStartingDemo(false);
      onEnterApp();
    }, 700);
  };

  const handleEnterAsGuest = () => {
    handleEnterDemoMode();
  };

  const handleRequestAccessFromCoordinator = async () => {
    if (!unauthorizedGoogleAccount) return;
    setIsSubmittingRequest(true);
    try {
      await createAccountLinkRequest(
        unauthorizedGoogleAccount.email,
        unauthorizedGoogleAccount.name,
        '',
        'publico',
        unauthorizedGoogleAccount.congregationId
      );
      setPendingApprovalEmail(unauthorizedGoogleAccount.email);
    } catch (err: any) {
      setEmailError(err?.message || 'Error al enviar la solicitud al Coordinador.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col justify-between font-sans selection:bg-brand selection:text-white transition-colors duration-200">
      {/* ========================================================= */}
      {/* 0. MOBILE HERO & SHEET VIEW (< md) - FIEL A BIENVENIDA-HTML*/}
      {/* ========================================================= */}
      {activeTab === 'home' && (
        <div className="md:hidden flex flex-col flex-1 bg-white dark:bg-slate-900 font-sans">
          {/* Top Gradient Banner with Horizontal White Logo & Slogan */}
          <div
            className="relative px-5 pt-4 pb-12 sm:pb-14 flex flex-col items-center select-none text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #4C3AED, #3728BE)' }}
          >
            {/* Top Utility Bar (Demo Mode & Theme Toggle) */}
            <div className="w-full flex items-center justify-between z-10 mb-2">
              <button
                type="button"
                onClick={handleEnterDemoMode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-xs transition-all cursor-pointer shadow-xs active:scale-95"
                title="Probar Kongre con datos de demostración"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Modo Demo</span>
              </button>

              <ThemeToggle size={36} variant="onBrand" />
            </div>

            {/* Centered Horizontal Negative Logo */}
            <div className="mt-2 mb-1 flex items-center justify-center">
              <img
                src="/logo/kongre_horizontal_negativo.svg"
                alt="Kongre"
                className="h-12 sm:h-14 w-auto max-w-[260px] drop-shadow-md select-none"
              />
            </div>

            {/* Slogan */}
            <p className="mt-3.5 max-w-[290px] text-center text-[15px] leading-relaxed text-white/95 font-medium">
              Una herramienta teocrática que facilita la gestión integral de la congregación
            </p>
          </div>

          {/* Sliding Bottom Sheet */}
          <div className="-mt-7 flex-1 rounded-t-[28px] bg-white dark:bg-slate-900 px-5 pt-7 pb-6 flex flex-col shadow-2xl z-10">
            <h1 className="text-[22px] font-bold text-slate-900 dark:text-white m-0 tracking-tight">
              ¡Bienvenido a Kongre!
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Elige cómo quieres entrar
            </p>

            {/* Mobile Options List */}
            <div className="space-y-1.5 flex-1">
              <LandingOptionRow
                isFeatured
                icon={Building2}
                title="Registrar mi congregación"
                badge={{ label: 'Oficial', tone: 'oficial' }}
                description="Configura tu congregación desde cero: ID, PIN, circuito y horarios."
                onClick={() => setActiveTab('register')}
              />

              <LandingOptionRow
                icon={UserIcon}
                iconCustom={
                  <div className="relative">
                    <UserIcon className="w-7 h-7 text-brand" strokeWidth={2} />
                    <span className="absolute -bottom-1 -right-1 text-[8.5px] font-bold bg-brand text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      @
                    </span>
                  </div>
                }
                title="Iniciar sesión con Google"
                description="Sincroniza tus asignaciones y accede a tu perfil."
                onClick={() => setActiveTab('email_login')}
              />

              <LandingOptionRow
                icon={KeyRound}
                title="Conectar con ID y PIN"
                description="Únete a una congregación existente con su ID y PIN o código de invitación."
                onClick={() => {
                  setActiveTab('code_login');
                  setCodeError(null);
                  setCodeSuccess(null);
                }}
              />

              <LandingOptionRow
                icon={Eye}
                title="Iniciar sesión con código de invitación"
                description="Accede con un código de un solo uso en este dispositivo."
                onClick={() => {
                  setInviteCodeError(null);
                  setInviteCodeSuccess(null);
                  setActiveTab('invite_code_login');
                }}
              />
            </div>

            {/* Mobile Features Section: Funciones Principales de la App */}
            <div className="mt-7 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-soft text-brand text-[11px] font-bold tracking-wide uppercase">
                  <Sparkles className="w-3 h-3 text-brand" />
                  Funciones de la App
                </span>
              </div>
              <h2 className="text-[16px] sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Toda la gestión teocrática en un solo lugar
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3.5 leading-relaxed">
                Herramienta integral para coordinadores, secretarios, superintendentes de servicio y publicadores.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5 text-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                      Reuniones & Guía S-89
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-snug">
                      Programación Vida y Ministerio, Fin de Semana y hojas S-89 oficiales automáticas.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                      Territorios & Carritos
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-snug">
                      Manzanas con mapas, tarjetas digitales con código QR para publicadores y carritos.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                      Seguridad por Roles & PIN
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-snug">
                      ID y PIN de congregación, más PIN personal bajo confidencialidad teocrática.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
                    <Wifi className="w-5 h-5 text-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[13.5px] font-bold text-slate-900 dark:text-white">
                      PWA & Modo Offline
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-snug">
                      Úsala en el Salón sin conexión; tus datos se sincronizan al recuperar internet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container: Desktop view or Mobile active subviews */}
      <div className={`${activeTab === 'home' ? 'hidden md:flex' : 'flex'} flex-col justify-between flex-1`}>
        {/* ========================================================= */}
        {/* 1. TOP HEADER                                            */}
        {/* ========================================================= */}
        <header className="w-full bg-card border-b border-line px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-30 transition-colors">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2.5">
            <AnimatedLogo height={32} />
          </div>

          {/* Right Actions: Demo Mode Button & Theme Switch */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={handleEnterDemoMode}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              title="Probar Kongre con datos de demostración"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span>Modo Demo</span>
            </button>
            <ThemeToggle size={36} />
          </div>
        </header>

        {/* ========================================================= */}
        {/* 2. MAIN WORKSPACE / RESPONSIVE HERO & ACTIONS            */}
        {/* ========================================================= */}
        <main
          className={`mx-auto grid w-full flex-1 gap-6 lg:gap-10 xl:gap-14 px-4 sm:px-6 md:px-8 ${
            activeTab === 'register'
              ? 'max-w-4xl xl:max-w-5xl grid-cols-1 py-2 sm:py-3.5 my-auto items-center'
              : 'max-w-[1240px] 2xl:max-w-[1360px] lg:grid-cols-[1.12fr_.88fr] py-4 sm:py-6 lg:py-6 xl:py-8 items-center'
          }`}
        >
          {/* ========================================================= */}
          {/* LEFT COLUMN: DESKTOP HERO & THEOCRATIC FEATURES (Only on Desktop) */}
          {/* ========================================================= */}
          {activeTab !== 'register' && (
            <section className="hidden lg:block space-y-0">
              <div
                className="inline-flex items-center gap-2 rounded-full border border-bline bg-brand-soft px-3 py-1 text-[11.5px] sm:text-xs font-semibold text-brand mb-2.5 sm:mb-3 select-none"
              >
                <Sparkles size={15} className="text-brand shrink-0" aria-hidden />
                <span>Gestor Teocrático Integral • Seguro y Eficiente</span>
              </div>

              <h1 className="mb-2.5 sm:mb-3 text-[clamp(26px,2.9vw,48px)] font-black leading-[1.08] tracking-tight text-ink">
                Toda la gestión teocrática de tu congregación,{' '}
                <em className="bg-linear-to-r from-(--t1) to-(--t2) bg-clip-text not-italic text-transparent">
                  en un solo lugar.
                </em>
              </h1>

              <p className="max-w-[520px] text-xs sm:text-[13.5px] lg:text-[14.5px] leading-relaxed text-muted mb-4 sm:mb-5">
                Plataforma digital especializada para coordinadores, secretarios, superintendentes de servicio y publicadores. Organiza programas semanales, hojas S-89, asignaciones de limpieza y territorios con soporte offline PWA.
              </p>

              {/* Feature Cards Grid (2x2 on Desktop) */}
              <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                <LandingFeatureCard
                  icon={CalendarDays}
                  title="Reuniones & Guía S-89"
                  text="Programación Vida y Ministerio, Fin de Semana, generación automática e impresión de hojas S-89 oficiales."
                />
                <LandingFeatureCard
                  icon={MapPin}
                  title="Territorios & Carritos"
                  text="Manzanas georreferenciadas, enlaces digitales por QR para publicadores y control de turnos en carritos."
                />
                <LandingFeatureCard
                  icon={ShieldCheck}
                  title="Seguridad por Roles & PIN"
                  text="Autenticación con ID de congregación, PIN de congregación y PIN personal bajo estrictas directrices."
                />
                <LandingFeatureCard
                  icon={Wifi}
                  title="PWA & Modo Offline"
                  text="Úsala en el Salón sin conexión a internet; tus datos se sincronizan al volver a tener red."
                />
              </div>
            </section>
          )}

          {/* ========================================================= */}
          {/* RIGHT COLUMN: INTERACTIVE ACCESS CARD                    */}
          {/* ========================================================= */}
          <div className={`${activeTab === 'register' ? 'w-full' : 'w-full'} mx-auto transition-all duration-300`}>
            <section
              key={activeTab === 'register' ? 'register-box' : `portal-${activeTab}`}
              aria-label="Portal de acceso"
              className={`card rounded-3xl border border-line bg-card relative overflow-hidden ${
                activeTab === 'register'
                  ? 'p-3.5 sm:p-5 lg:p-6 kg-register-box-enter shadow-2xl'
                  : 'p-4 sm:p-5 lg:p-6 kg-home-box-enter shadow-xl'
              } transition-all`}
              style={{ boxShadow: 'var(--card-shadow)' }}
            >
              {/* Vibrant glowing gradient line at top for register mode */}
              {activeTab === 'register' && (
                <div className="absolute top-0 left-0 right-0 h-1 kg-shimmer-bar z-10" />
              )}

              {/* UNIFIED CARD HEADER ACROSS ALL VIEWS */}
              <div className={`eye flex items-center justify-between text-[11px] font-bold tracking-[0.06em] text-brand ${
                activeTab === 'register' ? 'kg-header-enter' : ''
              }`}>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {activeTab !== 'home' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('home');
                        setCodeError(null);
                        setCodeSuccess(null);
                        setEmailError(null);
                        setInviteCodeError(null);
                      }}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group -ml-1.5"
                      title="Volver"
                      aria-label="Volver"
                    >
                      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                  )}
                  <span className="uppercase">
                    KONGRE • {
                      activeTab === 'home'
                        ? 'PORTAL DE ACCESO'
                        : activeTab === 'email_login'
                        ? 'ACCESO CON GOOGLE'
                        : activeTab === 'code_login'
                        ? 'CONECTAR CON ID Y PIN'
                        : activeTab === 'invite_code_login'
                        ? 'CÓDIGO DE INVITACIÓN'
                        : activeTab === 'unauthorized'
                        ? 'ACCESO RESTRINGIDO'
                        : 'REGISTRO DE CONGREGACIÓN'
                    }
                  </span>
                </div>

                <span className="rounded-full bg-hover px-2.5 py-0.5 font-semibold tracking-normal text-muted text-[10.5px]">
                  Gestor Teocrático
                </span>
              </div>

              {/* Main Title & Subtitle */}
              <div className={activeTab === 'register' ? 'kg-title-enter' : ''}>
                <h2 className={`font-extrabold tracking-tight text-ink ${
                  activeTab === 'register'
                    ? 'mb-0.5 mt-1 sm:mt-1.5 text-lg sm:text-xl lg:text-2xl'
                    : 'mb-0.5 mt-2 text-[20px] sm:text-[22px] lg:text-[24px]'
                }`}>
                  {activeTab === 'home'
                    ? '¡Bienvenido a Kongre!'
                    : activeTab === 'email_login'
                    ? 'Acceso con Google'
                    : activeTab === 'code_login'
                    ? 'Conectar con ID y PIN'
                    : activeTab === 'invite_code_login'
                    ? 'Conéctate a tu congregación'
                    : activeTab === 'unauthorized'
                    ? 'Acceso Restringido'
                    : 'Registrar mi Congregación'}
                </h2>
                <p className={`text-muted ${
                  activeTab === 'register'
                    ? 'mb-2 sm:mb-2.5 text-[11px] sm:text-xs'
                    : 'mb-3 sm:mb-3.5 text-xs sm:text-[13px]'
                } leading-normal`}>
                  {activeTab === 'home'
                    ? 'Una herramienta teocrática que facilita la gestión integral de la congregación'
                    : activeTab === 'email_login'
                    ? 'Inicia sesión con tu cuenta de Google para acceder a tus asignaciones y perfil'
                    : activeTab === 'code_login'
                    ? 'Introduce el ID de congregación y tu PIN para acceder'
                    : activeTab === 'invite_code_login'
                    ? 'Para activar la aplicación Kongre en este dispositivo, ingresa el código de invitación que recibiste de los ancianos de tu congregación.'
                    : activeTab === 'unauthorized'
                    ? 'Esta cuenta requiere autorización previa del Cuerpo de Ancianos'
                    : 'Configura los datos oficiales de tu congregación paso a paso'}
                </p>
              </div>

              {/* VIEW: MAIN HOME OPTIONS */}
              {activeTab === 'home' && (
                <div className="space-y-0.5 pt-0.5">
                  <DesktopOption
                    isFeatured
                    icon={Building2}
                    pill={{ label: 'Oficial', tone: 'of' }}
                    title="Registrar mi Congregación"
                    description="Configura tu congregación desde cero: ID, PINs, circuito y horarios."
                    onClick={() => setActiveTab('register')}
                  />

                  <DesktopOption
                    icon={CircleUserRound}
                    title="Iniciar sesión con Google"
                    description="Accede con tu cuenta verificada para sincronizar asignaciones y perfil."
                    onClick={() => setActiveTab('email_login')}
                  />

                  <DesktopOption
                    icon={KeyRound}
                    title="Conectar con ID y PIN de Congregación"
                    description="Accede a una congregación existente con su ID y PIN."
                    onClick={() => {
                      setActiveTab('code_login');
                      setCodeError(null);
                      setCodeSuccess(null);
                    }}
                  />

                  <DesktopOption
                    icon={Eye}
                    title="Iniciar sesión con código de invitación"
                    description="Accede con un código temporal de un solo uso en este dispositivo."
                    onClick={() => {
                      setInviteCodeError(null);
                      setInviteCodeSuccess(null);
                      setActiveTab('invite_code_login');
                    }}
                  />
                </div>
              )}

              {/* VIEW: EMAIL LOGIN (Google) */}
              {activeTab === 'email_login' && (
                <div className="space-y-4 pt-1 animate-fade-in">
                  {/* Tarjeta explicativa con los 3 requisitos y aprobación obligatoria */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs space-y-2.5">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                      <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>¿Cómo funciona el acceso con Google? (Lee antes de iniciar)</span>
                    </div>

                    <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      <p>
                        Para proteger los registros privados de la congregación, iniciar con Google <strong>no da acceso inmediato por sí solo</strong>:
                      </p>
                      <ul className="space-y-1.5 pl-3 list-disc marker:text-indigo-500">
                        <li>
                          <strong>Si tu correo fue precargado por el Coordinador:</strong> Entrarás de inmediato a tu perfil y asignaciones.
                        </li>
                        <li>
                          <strong>Si tu correo no está registrado aún:</strong> Deberás ingresar el <strong>ID de Congregación</strong>, el <strong>PIN de Congregación</strong> y tu <strong>PIN Personal</strong> que te entregan los ancianos.
                        </li>
                        <li>
                          <strong>Aprobación obligatoria:</strong> Una vez enviados los PINs, se creará una solicitud. <em>Hasta que un anciano no apruebe la vinculación de tu cuenta, no podrás usar la app.</em>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-start gap-1.5 bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800/50">
                      <span className="shrink-0 text-sm">⚠️</span>
                      <span>
                        <strong>Consejo:</strong> Si no tienes los PINs que te proporcionan los ancianos, te sugerimos pedírselos antes de continuar para no perder tiempo.
                      </span>
                    </div>
                  </div>

                  {typeof window !== 'undefined' &&
                    window.location.hostname !== 'localhost' &&
                    (window.location.hostname === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname)) && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold">Aviso importante de dominio local:</p>
                          <p>
                            Estás accediendo mediante <span className="font-mono font-bold">{window.location.hostname}</span>. La autenticación con Google autoriza <span className="font-mono font-bold">localhost</span> para entornos locales.
                          </p>
                          <a
                            href={`http://localhost:${window.location.port || '3050'}/`}
                            className="inline-block font-semibold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700"
                          >
                            Abrir en http://localhost:{window.location.port || '3050'}/ →
                          </a>
                        </div>
                      </div>
                    )}

                  {emailError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{emailError}</span>
                    </div>
                  )}

                  {!user ? (
                    <>
                      {/* Google One-Click Button */}
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isSubmittingEmail}
                        className="w-full py-3.5 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 bg-white dark:bg-slate-900"
                      >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                        <span>{isSubmittingEmail ? 'Conectando con Google...' : 'Continuar con Google'}</span>
                      </button>

                      {/* Acceso alternativo con ID y PIN */}
                      <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          ¿Prefieres ingresar sin cuenta de Google?{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('code_login');
                              setCodeError(null);
                              setCodeSuccess(null);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                          >
                            Usa ID y PIN de Congregación →
                          </button>
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      {/* Tarjeta de cuenta de Google verificada */}
                      <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.displayName || 'Google'}
                              className="w-10 h-10 rounded-full border-2 border-indigo-300 dark:border-indigo-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                              {(user.displayName || user.email || 'G')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Sesión de Google iniciada</span>
                            </div>
                            <p className="text-xs text-slate-900 dark:text-white font-bold truncate">
                              {user.displayName || user.email}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await signOutUser();
                            setEmailError(null);
                            setCodeError(null);
                          }}
                          className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline shrink-0 cursor-pointer"
                        >
                          Cambiar cuenta
                        </button>
                      </div>

                      {/* ENUNCIADO PARA PONER ID DE CONGREGACIÓN */}
                      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                          <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>¿A qué congregación perteneces?</span>
                        </div>
                        <p className="text-xs text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
                          Kongre necesita saber a qué congregación enlazar tu cuenta. Introduce el <strong>ID y el PIN de tu congregación</strong> para conectarte, o regístrala como una nueva congregación.
                        </p>
                      </div>

                      {/* Formulario para ingresar ID y PIN de congregación */}
                      <form onSubmit={handleConnectWithIdPin} className="space-y-3.5">
                        {/* DATO 1: ID DE LA CONGREGACIÓN */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>1. ID de la Congregación: *</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              maxLength={13}
                              value={congregationIdInput}
                              onFocus={() => {
                                if (!congregationIdInput) setCongregationIdInput('KGR-');
                              }}
                              onBlur={() => {
                                if (congregationIdInput === 'KGR-' || congregationIdInput === 'KGR') {
                                  setCongregationIdInput('');
                                }
                              }}
                              onChange={(e) => setCongregationIdInput(formatCongregationIdInput(e.target.value, congregationIdInput))}
                              placeholder="KGR-XXXX-XXXX (ej: KGR-NQ5A-JQAA)"
                              className="w-full p-2.5 pr-9 font-mono font-bold tracking-widest text-center text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                            />
                            {congregationIdInput && (
                              <button
                                type="button"
                                onClick={() => setCongregationIdInput('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                                title="Borrar ID"
                                tabIndex={-1}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Formato estándar oficial con guiones automáticos (ej: KGR-NQ5A-JQAA).
                          </span>
                        </div>

                        {/* DATO 2: PIN DE LA CONGREGACIÓN */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>2. PIN de la Congregación: *</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showCongPin ? 'text' : 'password'}
                              required
                              maxLength={9}
                              value={congregationPinInput}
                              onChange={(e) => setCongregationPinInput(formatCongregationPinInput(e.target.value, congregationPinInput))}
                              placeholder="XXXX-XXXX (ej: 8X4W-9M2K)"
                              className="w-full p-2.5 pr-10 font-mono font-bold tracking-wider text-center text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCongPin(!showCongPin)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              tabIndex={-1}
                              title={showCongPin ? 'Ocultar PIN' : 'Ver PIN'}
                            >
                              {showCongPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Clave de 8 caracteres alfanuméricos con guión central automático (ej: 8X4W-9M2K).
                          </span>
                        </div>

                        {/* DATO 3: PIN PERSONAL */}
                        <div>
                          <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-1 flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>3. PIN Personal Único:</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showPersPin ? 'text' : 'password'}
                              maxLength={16}
                              value={personalPinInput}
                              onChange={(e) => setPersonalPinInput(e.target.value)}
                              placeholder="PIN asignado o déjalo vacío si eres el creador"
                              className="w-full p-2.5 pr-10 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono tracking-widest text-center"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPersPin(!showPersPin)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600/70 hover:text-emerald-800 dark:hover:text-emerald-200 cursor-pointer"
                              tabIndex={-1}
                            >
                              {showPersPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            Si eres el Coordinador registrado en la congregación, puedes dejar este campo vacío.
                          </span>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingCode || !congregationIdInput.trim() || !congregationPinInput.trim()}
                          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>{isSubmittingCode ? 'Verificando y vinculando...' : 'Vincular cuenta de Google y Entrar'}</span>
                        </button>
                      </form>

                      {/* Opción de Registrar Nueva Congregación */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('register');
                          }}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          ¿Tu congregación aún no está registrada? Regístrala aquí →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW: CONEXIÓN UNIFICADA CON ID Y PIN DE CONGREGACIÓN / INVITACIÓN */}
              {activeTab === 'code_login' && (
                <div className="space-y-4 pt-1 animate-fade-in">
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

                  <form onSubmit={handleConnectWithIdPin} className="space-y-3.5">
                    {/* DATO 1: ID DE LA CONGREGACIÓN */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>1. ID de la Congregación: *</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          maxLength={13}
                          value={congregationIdInput}
                          onFocus={() => {
                            if (!congregationIdInput) setCongregationIdInput('KGR-');
                          }}
                          onBlur={() => {
                            if (congregationIdInput === 'KGR-' || congregationIdInput === 'KGR') {
                              setCongregationIdInput('');
                            }
                          }}
                          onChange={(e) => setCongregationIdInput(formatCongregationIdInput(e.target.value, congregationIdInput))}
                          placeholder="KGR-XXXX-XXXX (ej: KGR-NQ5A-JQAA)"
                          className="w-full p-2.5 pr-9 font-mono font-bold tracking-widest text-center text-sm sm:text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                        />
                        {congregationIdInput && (
                          <button
                            type="button"
                            onClick={() => setCongregationIdInput('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Borrar ID"
                            tabIndex={-1}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <span className="text-[10.5px] text-slate-400 mt-1 block">
                        Identificador único oficial asignado a tu congregación (formato KGR-XXXX-XXXX).
                      </span>
                    </div>

                    {/* DATO 2: PIN DE LA CONGREGACIÓN */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>2. PIN de la Congregación: *</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCongPin ? 'text' : 'password'}
                          required
                          maxLength={9}
                          value={congregationPinInput}
                          onChange={(e) => setCongregationPinInput(formatCongregationPinInput(e.target.value, congregationPinInput))}
                          placeholder="XXXX-XXXX (ej: 8X4W-9M2K)"
                          className="w-full p-2.5 pr-10 font-mono font-bold tracking-widest text-center text-sm sm:text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCongPin(!showCongPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          tabIndex={-1}
                          title={showCongPin ? 'Ocultar PIN' : 'Ver PIN'}
                        >
                          {showCongPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <span className="text-[10.5px] text-slate-400 mt-1 block">
                        Clave de seguridad general de 8 caracteres con guión (ej: 8X4W-9M2K).
                      </span>
                    </div>

                    {/* DATO 3: PIN PERSONAL SUMINISTRADO POR EL COORDINADOR (Opcional si es coordinador) */}
                    <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1">
                      <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-1 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>3. PIN Personal Único:</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPersPin ? 'text' : 'password'}
                          maxLength={16}
                          value={personalPinInput}
                          onChange={(e) => setPersonalPinInput(e.target.value)}
                          placeholder="PIN que te dio el Coordinador o déjalo vacío si eres el creador"
                          className="w-full p-2.5 pr-10 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono tracking-widest text-center"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPersPin(!showPersPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600/70 hover:text-emerald-800 dark:hover:text-emerald-200 cursor-pointer"
                          tabIndex={-1}
                        >
                          {showPersPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <span className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80 block">
                        Si ya te habías registrado previamente antes de los cambios de PINs, puedes dejar este campo vacío o ingresar tu PIN anterior.
                      </span>
                    </div>

                    {/* Nota teocrática sobre la vinculación de cuentas */}
                    <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Aprobación de Ancianos:</strong> Los coordinadores entran directamente sin aprobación. Si eres un publicador nuevo, se enviará una solicitud para que los ancianos la aprueben.
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingCode || !congregationIdInput.trim() || (!congregationPinInput.trim() && !personalPinInput.trim())}
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isSubmittingCode ? 'Verificando datos...' : 'Conectar a la Congregación'}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* VIEW: INICIAR SESIÓN CON CÓDIGO DE INVITACIÓN (Organized Pocket SignUp) */}
              {activeTab === 'invite_code_login' && (
                <div className="space-y-5 pt-1 animate-in fade-in zoom-in-95 duration-150">
                  {isQrDetected && (
                    <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-200 flex items-center gap-2.5 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <div>
                        <span className="font-bold block">Código QR o enlace de invitación detectado</span>
                        <span className="text-[11px] text-indigo-600/90 dark:text-indigo-300/90">
                          Tus credenciales se han completado automáticamente. Presiona <strong>ACTIVAR</strong> para ingresar.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Activation Form */}
                  <form onSubmit={handleActivateWithInviteCode} className="space-y-4">
                    {inviteCodeError && (
                      <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-bold block">No se pudo activar</span>
                          <span>{inviteCodeError}</span>
                        </div>
                      </div>
                    )}

                    {inviteCodeSuccess && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-bold block">¡Activación exitosa!</span>
                          <span>{inviteCodeSuccess}</span>
                        </div>
                      </div>
                    )}

                    {/* Input with border & eye toggle matching Image 2 */}
                    <div className="space-y-1.5">
                      <div className="relative">
                        <input
                          type={showInviteCode ? 'text' : 'password'}
                          autoComplete="off"
                          value={inviteCodeInput}
                          onChange={(e) => setInviteCodeInput(e.target.value)}
                          placeholder="Código de invitación (ej: KGR-XXXX-XXXX::PIN::CÓDIGO)"
                          className="w-full px-4 py-3.5 pr-12 rounded-xl border border-indigo-300 dark:border-indigo-700/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-2xs"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowInviteCode((prev) => !prev)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
                          title={showInviteCode ? 'Ocultar código' : 'Mostrar código'}
                        >
                          {showInviteCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <span className="text-[10.5px] text-slate-400 dark:text-slate-500 block px-1">
                        Acepta código de invitación, código compuesto (<code className="font-mono">ID-PINCONG-PINPERSONAL</code>) o enlace QR.
                      </span>
                    </div>

                    {/* Big Action Button "ACTIVAR" matching Image 2 */}
                    <button
                      type="submit"
                      disabled={!inviteCodeInput.trim() || isActivatingCode}
                      className="w-full py-3.5 px-6 rounded-xl bg-indigo-100 hover:bg-indigo-600 dark:bg-indigo-950/80 dark:hover:bg-indigo-600 text-indigo-700 hover:text-white dark:text-indigo-300 dark:hover:text-white disabled:opacity-40 disabled:hover:bg-indigo-100 dark:disabled:hover:bg-indigo-950/80 disabled:hover:text-indigo-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-xs"
                    >
                      {isActivatingCode ? (
                        <>
                          <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          <span>ACTIVANDO...</span>
                        </>
                      ) : (
                        <span>ACTIVAR</span>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* VIEW: REGISTRO DE CONGREGACIÓN (Unificado en la misma tarjeta) */}
              {activeTab === 'register' && (
                <RegisterCongregationWizard
                  key={activeTab}
                  embedded={true}
                  isMandatory={!settings.isRegistered}
                  onOpenJoinWithCode={() => {
                    setActiveTab('code_login');
                  }}
                  onClose={() => setActiveTab('home')}
                  onRegisteredSuccess={() => {
                    localStorage.setItem('kongre_has_entered_app', 'true');
                    onEnterApp();
                  }}
                />
              )}

              {/* VIEW: CUENTA NO AUTORIZADA (Estilo Organized Unauthorized Role) */}
              {activeTab === 'unauthorized' && unauthorizedGoogleAccount && (
                <div className="space-y-5 pt-1 animate-in fade-in zoom-in-95 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                    <ShieldAlert className="w-8 h-8" />
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                      Privacidad Teocrática • Cero Confianza
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-3">
                      Acceso Restringido a la Congregación
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                      La cuenta de Google <strong className="text-slate-800 dark:text-slate-200">({unauthorizedGoogleAccount.email})</strong> no figura en la lista de ancianos ni de hermanos autorizados de <strong className="text-slate-800 dark:text-slate-200">{unauthorizedGoogleAccount.congregationName}</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 text-left space-y-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">¿Cómo deseas proceder?</p>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-500 dark:text-slate-400">
                      <li><strong>Solicitar Aprobación:</strong> El Coordinador recibirá tu solicitud y podrá autorizar tu cuenta con tu rol correspondiente.</li>
                      <li><strong>PIN Personal:</strong> Si los ancianos ya te dieron un PIN de publicador, ingrésalo para conectarte directamente.</li>
                      <li><strong>Entrar como Invitado:</strong> Verás el programa y los anuncios de solo lectura sin datos personales.</li>
                    </ul>
                  </div>

                  {emailError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2 text-left">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{emailError}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleRequestAccessFromCoordinator}
                      disabled={isSubmittingRequest}
                      className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Mail className="w-4 h-4" />
                      <span>{isSubmittingRequest ? 'Enviando solicitud...' : 'Solicitar Aprobación al Coordinador'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCongregationIdInput(unauthorizedGoogleAccount.congregationId);
                        setActiveTab('code_login');
                      }}
                      className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-indigo-500" />
                      <span>Conectar con ID y PIN de Congregación</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInviteCodeError(null);
                        setInviteCodeSuccess(null);
                        setActiveTab('invite_code_login');
                      }}
                      className="w-full py-2.5 px-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <IconCongregationAccess className="w-4 h-4 text-indigo-500" />
                      <span>Iniciar sesión con código de invitación</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleEnterDemoMode}
                      className="w-full py-2.5 px-4 rounded-2xl border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>Probar Kongre en Modo Demo</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        await signOutUser();
                        setUnauthorizedGoogleAccount(null);
                        setActiveTab('home');
                      }}
                      className="w-full py-2 px-4 text-rose-500 hover:text-rose-600 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión Google</span>
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* Unified Bottom Bar across Mobile and Desktop */}
      <AppFooter
        variant="landing"
        onOpenVersionModal={onOpenVersionModal}
      />

      {/* Demo Mode Startup & Data Preparation Modal */}
      <DemoStartupModal isOpen={isStartingDemo} />
    </div>
  );
};
