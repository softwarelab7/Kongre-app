/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CongregationProvider, useCongregation } from './context/CongregationContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { isTabAllowedForRole, TheocraticRole, THEOCRATIC_ROLES } from './utils/rbac';
import { formatCanonicalCongregationId, isGenericIdentityName, getSecureLocalPin, setSecureLocalPin, verifySecureLocalPin, verifyPersonalPinMatch, decodeSecureShareToken, verifyAssignmentConfirmSignature, verifyInvitationCodeMatch, decryptPinAtRest, encryptPinAtRest, isEncryptedPinAtRest, isSafeDemoMode } from './utils/theocraticSecurity';
import { CongregationCalendar } from './components/CongregationCalendar';
import { ScheduleTab } from './components/ScheduleTab';
import ClmScheduleView from './components/ClmScheduleView';
import { S89SlipsTab } from './components/S89SlipsTab';
import { PublishersTab } from './components/PublishersTab';
import { GruposServicioTab } from './components/GruposServicioTab';
import { TerritoriosTab } from './components/TerritoriosTab';
import { VisitaSuperintendenteTab } from './components/VisitaSuperintendenteTab';
import { MemorialAsambleasTab } from './components/MemorialAsambleasTab';
import { DiscursosPublicosTab } from './components/DiscursosPublicosTab';
import { CarritosTab } from './components/CarritosTab';
import { HospitalidadTab } from './components/HospitalidadTab';
import { AsistenciaTab } from './components/AsistenciaTab';
import { InformesServicioTab } from './components/InformesServicioTab';
import { TarjetasS21Tab } from './components/TarjetasS21Tab';
import { PrecursoresAuxiliaresTab } from './components/PrecursoresAuxiliaresTab';
import { InformeSucursalS1Tab } from './components/InformeSucursalS1Tab';
import { CuentasTab } from './components/CuentasTab';
import { LiteraturaTab } from './components/LiteraturaTab';
import { CleaningDutiesTab } from './components/CleaningDutiesTab';
import { PanelElectricoTab } from './components/PanelElectricoTab';
import { MantenimientoTab } from './components/MantenimientoTab';
import { TableroAnunciosTab } from './components/TableroAnunciosTab';
import { ConflictCenterTab } from './components/ConflictCenterTab';
import { EquidadDashboardTab } from './components/EquidadDashboardTab';
import { ExportPdfTab } from './components/ExportPdfTab';
import { PersonalViewTab } from './components/PersonalViewTab';
import { SettingsTab } from './components/SettingsTab';
import { UserProfileSettingsView } from './components/UserProfileSettingsView';
import { ConflictsModal } from './components/ConflictsModal';
import { QrCodeModal } from './components/QrCodeModal';
import { MeetingTimerModal } from './components/MeetingTimerModal';
import { TableroSalonModal } from './components/TableroSalonModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AssignmentConfirmationModal } from './components/AssignmentConfirmationModal';
import { DigitalTerritoryModal } from './components/DigitalTerritoryModal';
import { ThemeToggleModal } from './components/ThemeToggleModal';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';
import { ResumenInicioTab } from './components/ResumenInicioTab';
import { PanoramaGeneralTab } from './components/PanoramaGeneralTab';
import { MinisterioPublicadorTab } from './components/MinisterioPublicadorTab';
import { RolesManagerTab } from './components/RolesManagerTab';
import { MobileMenuTab } from './components/MobileMenuTab';
import { CategoryHubTab } from './components/CategoryHubTab';
import { AccessRestrictedView } from './components/AccessRestrictedView';
import { SecurityProvider } from './context/SecurityContext';
import { SessionLockModal } from './components/SessionLockModal';
import { AutoLockToastWarning } from './components/AutoLockToastWarning';
import { JoinCongregationModal } from './components/JoinCongregationModal';
import { InvitationManagerModal } from './components/InvitationManagerModal';
import { CongregationWelcomeLanding } from './components/CongregationWelcomeLanding';
import { KongreOfficialWebsite, WebsiteSection } from './components/KongreOfficialWebsite';
import { RegisterCongregationWizard } from './components/RegisterCongregationWizard';
import { AppLockPinSuggestionModal } from './components/AppLockPinSuggestionModal';
import { AccountLinkRequestsModal } from './components/AccountLinkRequestsModal';
import { PendingApprovalView } from './components/PendingApprovalView';
import { PublisherPinsModal } from './components/PublisherPinsModal';
import { AuditLogModal } from './components/AuditLogModal';
import { AppFooter } from './components/AppFooter';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { DesktopUpdateModal } from './components/DesktopUpdateModal';
import { checkForDesktopUpdate, DesktopUpdateInfo } from './services/desktopUpdateService';
import { isDesktopApp } from './utils/platform';
import { OfflineSyncQueueModal } from './components/OfflineSyncQueueModal';
import { DemoNoticeModal } from './components/DemoNoticeModal';
import { FirstTimeLegalConsentModal, hasAcceptedLegalTerms } from './components/TermsAndPrivacyModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Building2, ArrowLeft } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import {
  checkUpcomingAssignmentsAndNotify,
  ensurePushServiceWorker,
  getPushSubscriptionRecord,
} from './services/notificationService';
import { ToastProvider, useToast } from './context/ToastContext';
import { ModalProvider } from './context/ModalContext';
import { StudyInspectorProvider, useStudyInspector } from './context/StudyInspectorContext';
import { StudyInspectorPanel } from './components/jw';

export const VALID_TABS_MAP: Record<string, ActiveTab> = {
  inicio: 'inicio',
  ministerio: 'inicio',
  panorama_general: 'panorama_general',
  panorama: 'panorama_general',
  cronometro_ministerio: 'cronometro_ministerio',
  revisitas: 'revisitas',
  estudios_biblicos: 'estudios_biblicos',
  estudios: 'estudios_biblicos',
  calendario: 'calendario',
  programacion: 'programacion',
  clm_vmc: 'clm_vmc',
  clm: 'clm_vmc',
  vmc: 'clm_vmc',
  s89: 's89',
  's-89': 's89',
  publicadores: 'publicadores',
  precursores_auxiliares: 'precursores_auxiliares',
  precursores: 'precursores_auxiliares',
  grupos_servicio: 'grupos_servicio',
  grupos: 'grupos_servicio',
  territorios: 'territorios',
  visita_sc: 'visita_sc',
  memorial_asambleas: 'memorial_asambleas',
  discursos: 'discursos',
  hospitalidad: 'hospitalidad',
  carritos: 'carritos',
  asistencia: 'asistencia',
  estadisticas_secretaria: 'estadisticas_secretaria',
  estadisticas: 'estadisticas_secretaria',
  informe_s1: 'informe_s1',
  informes_servicio: 'informes_servicio',
  tarjetas_s21: 'tarjetas_s21',
  cuentas: 'cuentas',
  literatura: 'literatura',
  limpieza_deberes: 'limpieza_deberes',
  panel_electrico: 'panel_electrico',
  mantenimiento: 'mantenimiento',
  tablero_anuncios: 'tablero_anuncios',
  conflictos: 'conflictos',
  equidad: 'equidad',
  exportar_pdf: 'exportar_pdf',
  formatos_oficiales: 'exportar_pdf',
  formatos: 'exportar_pdf',
  mi_vista: 'mi_vista',
  perfil: 'perfil',
  ajustes: 'ajustes',
  roles: 'roles',
  'roles-permisos': 'roles',
  'roles_permisos': 'roles',
  seguridad_roles: 'roles',
  menu: 'menu',
  menú: 'menu',
  navegacion: 'menu',
  departamentos: 'menu',
};

export function parseAppHash(hashString: string) {
  const clean = (hashString || '').replace(/^#\/?/, '').trim();
  if (!clean) {
    return {
      tab: null,
      modal: null,
      semana: null,
      isLanding: false,
      isLegal: false,
      isWebsite: true,
      websiteSection: 'about' as WebsiteSection,
    };
  }
  const [routePart, queryPart] = clean.split('?');
  const normalizedRoute = routePart.toLowerCase().trim();
  const searchParams = new URLSearchParams(queryPart || '');
  const isCategoryRoute = ['reuniones', 'secretaria', 'predicacion', 'salon', 'supervision'].includes(normalizedRoute);
  const tab = isCategoryRoute ? ('menu' as ActiveTab) : (VALID_TABS_MAP[normalizedRoute] || null);
  const categoryParam = isCategoryRoute
    ? normalizedRoute
    : (searchParams.get('cat') || searchParams.get('categoria') || null);
  const modal = searchParams.get('modal') || null;
  const semana = searchParams.get('semana') || null;
  const isLanding = normalizedRoute === 'portal' || normalizedRoute === 'bienvenida';
  const isDownloads =
    normalizedRoute === 'descargas' ||
    normalizedRoute === 'downloads' ||
    normalizedRoute === 'instalar' ||
    searchParams.get('seccion') === 'downloads' ||
    searchParams.get('section') === 'downloads' ||
    searchParams.get('tab') === 'downloads';
  const isGuide =
    normalizedRoute === 'docs' ||
    normalizedRoute === 'guia' ||
    normalizedRoute === 'documentacion' ||
    searchParams.get('seccion') === 'guide' ||
    searchParams.get('section') === 'guide' ||
    searchParams.get('tab') === 'guide';
  const isWebsite =
    isDownloads ||
    isGuide ||
    normalizedRoute === 'web' ||
    normalizedRoute === 'sitio' ||
    normalizedRoute === 'presentacion' ||
    normalizedRoute === 'about' ||
    normalizedRoute === 'acerca';
  const websiteSection: WebsiteSection = isDownloads ? 'downloads' : isGuide ? 'guide' : 'about';
  const isLegal =
    normalizedRoute === 'privacy' ||
    normalizedRoute === 'terms' ||
    normalizedRoute === 'privacidad' ||
    normalizedRoute === 'terminos';
  return { tab, modal, semana, isLanding, isLegal, isWebsite, websiteSection, categoryParam };
}

const AppContent: React.FC = () => {
  const {
    user,
    activeRole,
    setActiveRole,
    setActiveRoles,
    assignRoleToEmail,
    effectiveRoleInfo,
    signOutUser,
    currentBrotherName,
    currentPublisherId,
    setIdentifiedBrother,
    setIdentifiedPublisher,
    isCoordinator,
    permissions,
  } = useAuth();
  const { showToast } = useToast();
  const {
    isInspectorOpen,
    closeInspector,
    activeReference,
    references,
    activeAnnotation,
    saveAnnotation,
    toggleInspector,
  } = useStudyInspector();
  const canManageRoles = isCoordinator || activeRole === 'coordinador' || activeRole === 'anciano';
  const [isLockPinSuggestionOpen, setIsLockPinSuggestionOpen] = useState(false);
  const [isPinsModalOpen, setIsPinsModalOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const prevUserRef = useRef(user);

  const [activeTab, setRawActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined') {
      const parsed = parseAppHash(window.location.hash);
      if (parsed?.tab) return parsed.tab;
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('modo') === 'tablero') return 'mi_vista';
    }
    return 'inicio';
  });

  const [selectedCategoryHub, setSelectedCategoryHub] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const parsed = parseAppHash(window.location.hash);
      if (parsed?.categoryParam) return parsed.categoryParam;
    }
    return 'all';
  });

  const [confirmationParams, setConfirmationParams] = useState<{
    weekId: string;
    meetingType: 'midweek' | 'weekend';
    assignmentPath: string;
    publisherId: string;
  } | null>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('confirmar') === '1') {
      const weekId = urlParams.get('semana') || '';
      const meetingType = (urlParams.get('tipo') as any) || 'midweek';
      const assignmentPath = urlParams.get('path') || '';
      const publisherId = urlParams.get('pub') || '';
      const sig = urlParams.get('sig');
      if (
        weekId &&
        assignmentPath &&
        publisherId &&
        verifyAssignmentConfirmSignature(weekId, meetingType, assignmentPath, publisherId, sig)
      ) {
        // Limpiar parámetros sensibles de la barra de direcciones inmediatamente
        try {
          const cleanUrl = window.location.pathname + (window.location.hash || '');
          window.history.replaceState({}, document.title, cleanUrl);
        } catch {}
        return { weekId, meetingType, assignmentPath, publisherId };
      }
    }
    return null;
  });

  const [isConflictsModalOpen, setIsConflictsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isKioskModalOpen, setIsKioskModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('invite')) return true;
    const tk = decodeSecureShareToken(urlParams.get('tk'));
    return Boolean(tk?.invite && !tk?.pub);
  });
  const [isInviteManagerOpen, setIsInviteManagerOpen] = useState(false);
  const [isRegisterWizardOpen, setIsRegisterWizardOpen] = useState(false);
  const [isLinkRequestsModalOpen, setIsLinkRequestsModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [desktopUpdate, setDesktopUpdate] = useState<DesktopUpdateInfo | null>(null);
  const [isDesktopUpdateOpen, setIsDesktopUpdateOpen] = useState(false);
  const [websiteInitialSection, setWebsiteInitialSection] = useState<WebsiteSection>(() => {
    if (typeof window !== 'undefined') {
      const hashInfo = parseAppHash(window.location.hash);
      if (hashInfo?.websiteSection) {
        return hashInfo.websiteSection;
      }
    }
    return 'about';
  });

  const [showOfficialWebsite, setShowOfficialWebsite] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (isDesktopApp()) return false;
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthOrActionParams =
      urlParams.get('portal') === '1' ||
      urlParams.get('inicio') === '1' ||
      urlParams.get('bienvenida') === '1' ||
      urlParams.has('code') ||
      urlParams.has('invite') ||
      urlParams.has('tk') ||
      urlParams.has('pub') ||
      urlParams.has('confirmar') ||
      urlParams.has('territorio') ||
      urlParams.has('t') ||
      urlParams.get('modo') === 'tablero' ||
      window.location.hash.includes('access_token');

    if (hasAuthOrActionParams) {
      return false;
    }

    const hashInfo = parseAppHash(window.location.hash);
    if (hashInfo?.isWebsite) {
      return true;
    }

    // Si el hash quedó en #portal por una recarga previa pero el usuario no abrió explícitamente el portal en esta sesión
    const explicitPortal = sessionStorage.getItem('kongre_portal_explicit_v2') === 'true';
    const isProductionDirectPortal =
      window.location.hostname.includes('kongre-app.com') && Boolean(hashInfo?.isLanding);

    if (hashInfo?.isLanding && !explicitPortal && !isProductionDirectPortal) {
      return true;
    }

    if (!hashInfo?.tab && !hashInfo?.isLegal && !explicitPortal && !isProductionDirectPortal) {
      return true;
    }

    return false;
  });

  const [showWelcomeLanding, setShowWelcomeLanding] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashInfo = typeof window !== 'undefined' ? parseAppHash(window.location.hash) : null;
    if (
      urlParams.get('portal') === '1' ||
      urlParams.get('inicio') === '1' ||
      urlParams.get('bienvenida') === '1'
    ) {
      return true;
    }
    const explicitPortal =
      typeof window !== 'undefined' &&
      sessionStorage.getItem('kongre_portal_explicit_v2') === 'true';
    const isProductionDirectPortal =
      typeof window !== 'undefined' &&
      window.location.hostname.includes('kongre-app.com') &&
      Boolean(hashInfo?.isLanding);

    if (hashInfo?.isLanding && (explicitPortal || isProductionDirectPortal)) {
      return true;
    }
    if (hashInfo?.isWebsite && !isDesktopApp()) {
      return false;
    }
    // Show welcome portal if the user has not entered yet in this browser
    if (!localStorage.getItem('kongre_has_entered_app')) {
      return true;
    }
    return false;
  });
  const {
    setCurrentWeekId,
    territories,
    settings,
    accountLinkRequests,
    publishers,
    publishersMap,
    weeks,
    cartShifts,
    cartLocations,
    loadCongregationFromCloud,
    isOnline,
    syncOfflineQueueNow,
    isSupabaseSyncing,
    syncStatus,
    isDemoMode,
    loadDemoData,
    exitDemoMode,
  } = useCongregation();

  const [isDemoNoticeOpen, setIsDemoNoticeOpen] = useState(false);

  const [hasAcceptedTermsState, setHasAcceptedTermsState] = useState<boolean>(() =>
    hasAcceptedLegalTerms()
  );

  useEffect(() => {
    const syncConsent = () => setHasAcceptedTermsState(hasAcceptedLegalTerms());
    window.addEventListener('kongre_legal_terms_accepted', syncConsent);
    return () => window.removeEventListener('kongre_legal_terms_accepted', syncConsent);
  }, []);

  // Limpieza de fotos y perfiles residuales previos para que no contaminen el modo prueba
  useEffect(() => {
    if (isDemoMode || isSafeDemoMode()) {
      try {
        if (localStorage.getItem('kongre_user_photo')) localStorage.removeItem('kongre_user_photo');
        if (localStorage.getItem('kongre_google_photo')) localStorage.removeItem('kongre_google_photo');
        if (localStorage.getItem('kongre_coordinator_photo')) localStorage.removeItem('kongre_coordinator_photo');
        if (localStorage.getItem('kongre_user_profile_active')) localStorage.removeItem('kongre_user_profile_active');
        if (localStorage.getItem('kongre_user_profile_guest')) localStorage.removeItem('kongre_user_profile_guest');
        if (sessionStorage.getItem('kongre_session_locked')) sessionStorage.removeItem('kongre_session_locked');
      } catch {}
    }
  }, [isDemoMode]);

  // Comprobación automática de actualización en PC (Desktop App)
  useEffect(() => {
    // Solo la app de escritorio (Tauri) consulta GitHub Releases; la PWA se actualiza vía Service Worker.
    if (!isDesktopApp()) return;
    const timer = setTimeout(async () => {
      try {
        // force=true: en cada arranque se consulta siempre, sin el candado de 4 horas
        const update = await checkForDesktopUpdate(true);
        if (update && update.hasUpdate) {
          setDesktopUpdate(update);
          setIsDesktopUpdateOpen(true);
        }
      } catch {}
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const [previousTab, setPreviousTab] = useState<ActiveTab>('menu');

  // Navigation with browser History (Back / Forward button support)
  const setActiveTab = useCallback(
    (
      targetTabOrFn: ActiveTab | ((prev: ActiveTab) => ActiveTab),
      options?: { replace?: boolean; weekId?: string; modal?: string | null }
    ) => {
      setRawActiveTab((prevTab) => {
        const nextTab = typeof targetTabOrFn === 'function' ? targetTabOrFn(prevTab) : targetTabOrFn;
        if (nextTab !== prevTab) {
          setPreviousTab(prevTab);
        }
        const currentModal = options?.modal !== undefined ? options.modal : null;
        const currentWeekId = options?.weekId || null;

        let newHash = `#${nextTab}`;
        const params = new URLSearchParams();
        if (currentWeekId) params.set('semana', currentWeekId);
        if (currentModal) params.set('modal', currentModal);
        const q = params.toString();
        if (q) newHash += `?${q}`;

        const newState = {
          tab: nextTab,
          modal: currentModal,
          weekId: currentWeekId,
          landing: false,
        };

        if (options?.replace) {
          window.history.replaceState(newState, '', newHash);
        } else {
          if (
            window.location.hash === newHash &&
            window.history.state?.tab === nextTab &&
            window.history.state?.modal === currentModal
          ) {
            window.history.replaceState(newState, '', newHash);
          } else {
            window.history.pushState(newState, '', newHash);
          }
        }

        return nextTab;
      });
    },
    []
  );

  const openModalWithHistory = useCallback(
    (modalName: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
      setter(true);
      const baseRoute = showOfficialWebsite ? 'presentacion' : showWelcomeLanding ? 'portal' : activeTab;
      const nextHash = `#${baseRoute}?modal=${modalName}`;
      const nextState = {
        tab: activeTab,
        modal: modalName,
        landing: showWelcomeLanding,
        website: showOfficialWebsite,
      };
      window.history.pushState(nextState, '', nextHash);
    },
    [activeTab, showWelcomeLanding, showOfficialWebsite]
  );

  const closeModalWithHistory = useCallback(
    (modalName: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
      setter(false);
      if (window.history.state?.modal === modalName) {
        window.history.back();
      } else {
        const parsed = parseAppHash(window.location.hash);
        if (parsed?.modal === modalName) {
          const fallbackUrl = showOfficialWebsite
            ? window.location.pathname
            : showWelcomeLanding
            ? '#portal'
            : `#${activeTab}`;
          window.history.replaceState(
            { tab: activeTab, modal: null, landing: showWelcomeLanding, website: showOfficialWebsite },
            '',
            fallbackUrl
          );
        }
      }
    },
    [activeTab, showWelcomeLanding, showOfficialWebsite]
  );

  const openConflictsView = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setActiveTab('conflictos');
    } else {
      openModalWithHistory('conflictos', setIsConflictsModalOpen);
    }
  }, [setActiveTab, openModalWithHistory]);

  // Synchronize browser history events (Back / Forward button in browser & hash changes)
  useEffect(() => {
    const syncFromLocation = (state?: any) => {
      const hashInfo = parseAppHash(window.location.hash);
      const targetModal = state?.modal ?? hashInfo?.modal ?? null;

      const isWebsite =
        !isDesktopApp() &&
        (state?.website ?? (hashInfo?.isWebsite && !state?.landing && !hashInfo?.isLanding));

      if (isWebsite) {
        setShowOfficialWebsite(true);
        if (state?.section) {
          setWebsiteInitialSection(state.section);
        } else if (hashInfo?.websiteSection) {
          setWebsiteInitialSection(hashInfo.websiteSection);
        }
        setShowWelcomeLanding(false);
        setIsConflictsModalOpen(false);
        setIsQrModalOpen(false);
        setIsTimerModalOpen(false);
        setIsKioskModalOpen(false);
        setIsSearchModalOpen(false);
        setIsRoleModalOpen(false);
        setIsThemeModalOpen(false);
        setIsJoinModalOpen(false);
        setIsInviteManagerOpen(false);
        setIsLinkRequestsModalOpen(false);
        setIsPinsModalOpen(false);
        setIsAuditLogOpen(false);
        setIsRegisterWizardOpen(false);
        setIsVersionModalOpen(targetModal === 'versiones');
        setIsQueueModalOpen(false);
        return;
      }

      setShowOfficialWebsite(false);

      const isLanding = state?.landing ?? hashInfo?.isLanding ?? hashInfo?.isLegal ?? false;
      if (isLanding) {
        setShowWelcomeLanding(true);
        setIsConflictsModalOpen(false);
        setIsQrModalOpen(false);
        setIsTimerModalOpen(false);
        setIsKioskModalOpen(false);
        setIsSearchModalOpen(false);
        setIsRoleModalOpen(false);
        setIsThemeModalOpen(false);
        setIsJoinModalOpen(targetModal === 'unirse');
        setIsInviteManagerOpen(false);
        setIsLinkRequestsModalOpen(false);
        setIsPinsModalOpen(false);
        setIsAuditLogOpen(false);
        setIsRegisterWizardOpen(false);
        setIsVersionModalOpen(targetModal === 'versiones');
        setIsQueueModalOpen(false);
        return;
      }

      setShowWelcomeLanding(false);

      const targetTab = state?.tab || hashInfo?.tab || 'inicio';
      const targetWeekId = state?.weekId || hashInfo?.semana || null;

      if (targetWeekId) {
        setCurrentWeekId(targetWeekId);
      }

      setRawActiveTab(targetTab);

      if (hashInfo?.categoryParam) {
        setSelectedCategoryHub(hashInfo.categoryParam);
      }

      // Sync modals with history (enforcing RBAC guards for administrative modals)
      const allowAdminModals = Boolean(canManageRoles || isDemoMode);
      const allowAuditModal = Boolean(permissions.canViewAuditLog || canManageRoles || isDemoMode);
      const allowConflictModal = Boolean(permissions.canSuperviseConflicts || canManageRoles || isDemoMode);

      setIsConflictsModalOpen(targetModal === 'conflictos' && allowConflictModal);
      setIsQrModalOpen(targetModal === 'qr');
      setIsTimerModalOpen(targetModal === 'cronometro');
      setIsKioskModalOpen(targetModal === 'tablero_salon');
      setIsSearchModalOpen(targetModal === 'buscar');
      if (targetModal === 'roles') {
        setRawActiveTab('roles');
      }
      setIsRoleModalOpen(false);
      setIsThemeModalOpen(targetModal === 'tema');
      setIsJoinModalOpen(targetModal === 'unirse');
      setIsInviteManagerOpen(targetModal === 'invitaciones' && allowAdminModals);
      setIsLinkRequestsModalOpen(targetModal === 'vinculacion' && allowAdminModals);
      setIsPinsModalOpen(targetModal === 'pines' && allowAdminModals);
      setIsAuditLogOpen(targetModal === 'auditoria' && allowAuditModal);
      setIsRegisterWizardOpen(targetModal === 'registro_congregacion');
      setIsVersionModalOpen(targetModal === 'versiones');
      setIsQueueModalOpen(targetModal === 'cola_offline' || targetModal === 'cola');
    };

    const onPopState = (event: PopStateEvent) => {
      syncFromLocation(event.state);
    };

    const onHashChange = () => {
      syncFromLocation(window.history.state);
    };

    window.addEventListener('popstate', onPopState);
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, [setCurrentWeekId, canManageRoles, isDemoMode, permissions.canViewAuditLog, permissions.canSuperviseConflicts]);

  // Initial history state synchronization on app mount
  useEffect(() => {
    const hashInfo = parseAppHash(window.location.hash);
    const isLanding = showWelcomeLanding || (hashInfo?.isLanding ?? false);
    const initialModal = hashInfo?.modal || null;

    if (showOfficialWebsite) {
      const cleanRootUrl =
        window.location.pathname + window.location.search + (window.location.hash || '');
      window.history.replaceState(
        { tab: activeTab, modal: initialModal, landing: false, website: true },
        '',
        cleanRootUrl
      );
      if (initialModal === 'versiones') {
        setIsVersionModalOpen(true);
      }
      return;
    }

    if (isLanding) {
      const hasAuthTokens = typeof window !== 'undefined' && (
        window.location.search.includes('code=') ||
        window.location.hash.includes('access_token') ||
        window.location.search.includes('error=') ||
        window.location.hash.includes('error=')
      );
      if (hasAuthTokens) {
        // No sobreescribir el historial ni los parámetros de URL mientras Supabase procesa el intercambio de código OAuth
        return;
      }
      const currentHash = window.location.hash || '';
      const isLegalHash = currentHash.startsWith('#privacy') || currentHash.startsWith('#terms') ||
                          currentHash.startsWith('#privacidad') || currentHash.startsWith('#terminos');
      if (isLegalHash) {
        return;
      }
      const landingHash = (currentHash.startsWith('#portal') || currentHash.startsWith('#bienvenida'))
        ? currentHash
        : '#portal';
      window.history.replaceState({ tab: activeTab, modal: null, landing: true, website: false }, '', landingHash);
    } else {
      let initialHash = `#${activeTab}`;
      const params = new URLSearchParams();
      if (hashInfo?.semana) params.set('semana', hashInfo.semana);
      if (initialModal) params.set('modal', initialModal);
      const q = params.toString();
      if (q) initialHash += `?${q}`;

      window.history.replaceState(
        {
          tab: activeTab,
          modal: initialModal,
          weekId: hashInfo?.semana || null,
          landing: false,
          website: false,
        },
        '',
        initialHash
      );

      if (hashInfo?.semana) {
        setCurrentWeekId(hashInfo.semana);
      }

      if (initialModal) {
        const allowAdminModals = Boolean(canManageRoles || isDemoMode);
        const allowAuditModal = Boolean(permissions.canViewAuditLog || canManageRoles || isDemoMode);
        const allowConflictModal = Boolean(permissions.canSuperviseConflicts || canManageRoles || isDemoMode);

        if (initialModal === 'conflictos' && allowConflictModal) setIsConflictsModalOpen(true);
        if (initialModal === 'qr') setIsQrModalOpen(true);
        if (initialModal === 'cronometro') setIsTimerModalOpen(true);
        if (initialModal === 'tablero_salon') setIsKioskModalOpen(true);
        if (initialModal === 'buscar') setIsSearchModalOpen(true);
        if (initialModal === 'roles') setActiveTab('roles');
        if (initialModal === 'tema') setIsThemeModalOpen(true);
        if (initialModal === 'unirse') setIsJoinModalOpen(true);
        if (initialModal === 'invitaciones' && allowAdminModals) setIsInviteManagerOpen(true);
        if (initialModal === 'vinculacion' && allowAdminModals) setIsLinkRequestsModalOpen(true);
        if (initialModal === 'pines' && allowAdminModals) setIsPinsModalOpen(true);
        if (initialModal === 'auditoria' && allowAuditModal) setIsAuditLogOpen(true);
        if (initialModal === 'registro_congregacion') setIsRegisterWizardOpen(true);
        if (initialModal === 'versiones') setIsVersionModalOpen(true);
      }
    }
  }, []);

  // Theocratic Route Guard: Protect against unauthorized tab viewing
  useEffect(() => {
    if (!isTabAllowedForRole(effectiveRoleInfo.id, activeTab)) {
      if (effectiveRoleInfo.allowedTabs.includes('mi_vista')) {
        setActiveTab('mi_vista', { replace: true });
      } else if (effectiveRoleInfo.allowedTabs.includes('inicio')) {
        setActiveTab('inicio', { replace: true });
      } else if (effectiveRoleInfo.allowedTabs.length > 0) {
        setActiveTab(effectiveRoleInfo.allowedTabs[0], { replace: true });
      }
    }
  }, [effectiveRoleInfo.id, activeTab, setActiveTab]);

  // Organized-style "Pocket Mode" Direct Invitation Link (?tk=... or legacy ?cong=...&cpin=...&pub=...&pin=... or ?invite=...)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const decodedTk = decodeSecureShareToken(urlParams.get('tk'));
    let urlCong = (decodedTk?.cong || urlParams.get('cong') || '').trim();
    let urlCpin = (decodedTk?.cpin || '').trim(); // L-04: Solo aceptar cpin desde token cifrado tk
    const urlPub = (decodedTk?.pub || urlParams.get('pub') || '').trim();
    const urlPin = (decodedTk?.pin || urlParams.get('pin') || '').trim();
    let urlInvite = (decodedTk?.invite || urlParams.get('invite') || '').trim();

    // Soportar código compuesto: CONG::CPIN::INVITE
    if (urlInvite.includes('::')) {
      const parts = urlInvite.split('::');
      if (parts.length === 3) {
        if (!urlCong) urlCong = parts[0].trim();
        if (!urlCpin) urlCpin = parts[1].trim();
        urlInvite = parts[2].trim();
      }
    }

    // A) Enlace Directo por Código de Invitación Teocrático (QR o URL)
    if (urlInvite) {
      const cleanCong = urlCong
        ? formatCanonicalCongregationId(urlCong)
        : (localStorage.getItem('kongre_congregation_number') || localStorage.getItem('kongre_congregation_id') || '').trim();
      const cleanCpin = urlCpin || getSecureLocalPin('kongre_registered_cong_pin') || getSecureLocalPin('kongre_last_cong_pin') || '';
      const cleanInvite = urlInvite.trim();

      // Limpiar URL sensible de la barra de direcciones y hash (L-04)
      const cleanHash = (window.location.hash || '').split('?')[0];
      const cleanUrl = window.location.pathname + cleanHash;
      window.history.replaceState({}, document.title, cleanUrl);

      (async () => {
        let invList: any[] = [];
        try {
          const stored = localStorage.getItem('kongre_theocratic_invitations_v1');
          if (stored) {
            const rawJson = isEncryptedPinAtRest(stored) ? decryptPinAtRest(stored) : stored;
            const parsed = JSON.parse(rawJson || '[]');
            if (Array.isArray(parsed)) invList = parsed;
          }
        } catch {}

        let matchInv = invList.find((inv: any) => verifyInvitationCodeMatch(cleanInvite, inv));

        // Si no se encuentra en el almacenamiento local y hay congregación, consultar Supabase
        if (!matchInv && cleanCong) {
          const cloudRes = await loadCongregationFromCloud(cleanCong, {
            pin: cleanCpin || cleanInvite,
            personalPin: cleanInvite,
          });

          if (cloudRes?.success && cloudRes.data) {
            const cloudInvs = Array.isArray(cloudRes.data.invitations) ? cloudRes.data.invitations : [];
            matchInv = cloudInvs.find((inv: any) => verifyInvitationCodeMatch(cleanInvite, inv));
            if (matchInv) {
              invList = cloudInvs;
            }
          }
        }

        if (matchInv && matchInv.status !== 'revoked' && matchInv.status !== 'used') {
          const role = matchInv.role as TheocraticRole;
          const brotherName = matchInv.targetName && !isGenericIdentityName(matchInv.targetName) ? matchInv.targetName.trim() : 'Hermano';

          // Marcar invitación como utilizada
          matchInv.status = 'used';
          matchInv.usedAt = new Date().toISOString();
          matchInv.usedByEmail = user?.email || 'invitado_directo@kongre.org';
          try {
            localStorage.setItem('kongre_theocratic_invitations_v1', encryptPinAtRest(JSON.stringify(invList)));
            window.dispatchEvent(new CustomEvent('kongre_invitations_updated', { detail: invList }));
            window.dispatchEvent(new CustomEvent('kongre_trigger_cloud_sync'));
          } catch {}

          setActiveRole(role);
          setActiveRoles([role]);
          setIdentifiedBrother(brotherName);
          setSecureLocalPin('kongre_session_pin_v2', cleanInvite);
          if (cleanCpin) {
            setSecureLocalPin('kongre_registered_cong_pin', cleanCpin);
            setSecureLocalPin('kongre_last_cong_pin', cleanCpin);
          }
          localStorage.setItem('kongre_is_registered_congregation', 'true');
          localStorage.setItem('kongre_has_entered_app', 'true');
          if (cleanCong) {
            localStorage.setItem('kongre_congregation_number', cleanCong);
            localStorage.setItem('kongre_congregation_id', cleanCong);
          }
          localStorage.setItem('kongre_identified_brother', brotherName);

          const emailToAssign = user?.email || `invitado_${(cleanCong || 'teocratico').toLowerCase()}@kongre.org`;
          assignRoleToEmail(emailToAssign, role, brotherName, cleanInvite);

          setShowWelcomeLanding(false);
          setIsJoinModalOpen(false);

          const roleInfo = THEOCRATIC_ROLES[role];
          const targetTab = roleInfo?.allowedTabs?.[0] || 'inicio';
          setActiveTab(targetTab);
        }
      })();
      return;
    }

    // B) Enlace Directo por Publicador con PIN Personal Único
    if (urlCong && urlPub && urlPin) {
      const cleanCong = formatCanonicalCongregationId(urlCong);
      const cleanCpin = urlCpin ? urlCpin.trim() : '';
      const cleanPub = urlPub.trim();
      const cleanPin = urlPin.trim();

      // Scrub sensitive query parameters immediately from browser address bar & history
      const cleanUrl = window.location.pathname + (window.location.hash || '');
      window.history.replaceState({}, document.title, cleanUrl);

      (async () => {
        let matchingPub = (publishers || []).find(
          (p) => p.id === cleanPub && verifyPersonalPinMatch(cleanPin, p)
        );

        if (!matchingPub && cleanCong) {
          const cloudRes = await loadCongregationFromCloud(cleanCong, {
            pin: cleanCpin || cleanPin,
            personalPin: cleanPin,
          });
          if (cloudRes?.success && cloudRes.data?.publishers) {
            matchingPub = cloudRes.data.publishers.find(
              (p: any) =>
                (p.id === cleanPub || verifyPersonalPinMatch(cleanPin, p)) &&
                verifyPersonalPinMatch(cleanPin, p)
            );
          }
        }

        if (matchingPub) {
          const role = (matchingPub.theocraticRole || (matchingPub.privilege === 'anciano' ? 'anciano' : 'publico')) as TheocraticRole;
          const brotherName = matchingPub.name && !isGenericIdentityName(matchingPub.name) ? matchingPub.name.trim() : 'Hermano';

          setActiveRole(role);
          setIdentifiedPublisher(matchingPub.id, brotherName);
          setIdentifiedBrother(brotherName);
          setSecureLocalPin('kongre_session_pin_v2', cleanPin);
          if (cleanCpin) {
            setSecureLocalPin('kongre_registered_cong_pin', cleanCpin);
            setSecureLocalPin('kongre_last_cong_pin', cleanCpin);
          }
          localStorage.setItem('kongre_is_registered_congregation', 'true');
          localStorage.setItem('kongre_has_entered_app', 'true');
          localStorage.setItem('kongre_congregation_number', cleanCong);
          localStorage.setItem('kongre_congregation_id', cleanCong);
          localStorage.setItem('kongre_identified_brother', brotherName);

          const emailToAssign = user?.email || matchingPub.email || `publicador_${cleanPub}@kongre.org`;
          assignRoleToEmail(emailToAssign, role, brotherName, cleanPin);

          setShowWelcomeLanding(false);
          setActiveTab('mi_vista');
        }
      })();
    }
  }, [publishers, loadCongregationFromCloud]);

  // Verificación inicial única de sincronización en la nube por ID de congregación:
  // Se protege con ref para evitar bucles infinitos de re-renderizado y NUNCA borra la sesión local
  // ante errores transitorios de red, límites de tasa (429) o al volver de suspensión del navegador.
  const verifiedCloudCongRef = useRef<string | null>(null);
  const loadCongregationFromCloudRef = useRef(loadCongregationFromCloud);
  loadCongregationFromCloudRef.current = loadCongregationFromCloud;

  useEffect(() => {
    if (isDemoMode || isSafeDemoMode()) {
      return;
    }
    const activeCongId = (
      settings.congregationNumber ||
      settings.congregationId ||
      localStorage.getItem('kongre_congregation_number') ||
      ''
    )
      .trim()
      .toUpperCase();

    if (
      !activeCongId ||
      activeCongId.length < 3 ||
      ['1001', 'CENTRAL', 'MAIN', 'ID', 'DEMO-001', 'DEMO001'].includes(activeCongId) ||
      activeCongId.startsWith('DEMO')
    ) {
      return;
    }

    if (verifiedCloudCongRef.current === activeCongId) {
      return;
    }
    verifiedCloudCongRef.current = activeCongId;

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }

    (async () => {
      try {
        await loadCongregationFromCloudRef.current(activeCongId, { skipHydrate: true });
      } catch (e) {
        console.warn('Verificando estado de congregación en la nube:', e);
      }
    })();
  }, [settings.congregationNumber, settings.congregationId, isDemoMode]);

  // Recuperación automática al volver del reposo/hibernación de pestaña (visibilitychange / pageshow BFCache)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    let hiddenSince = document.visibilityState === 'hidden' ? Date.now() : 0;

    const handleWakeUp = () => {
      const idleDurationMs = hiddenSince > 0 ? Date.now() - hiddenSince : 0;
      hiddenSince = 0;

      // Rehidratar bóveda criptográfica en memoria si el navegador cerró conexiones IndexedDB en reposo
      import('./utils/atRestVault')
        .then(({ initAtRestVault }) => initAtRestVault(1500))
        .catch(() => {});

      // Si estuvo en reposo más de 30s, disparar sincronización ligera no bloqueante
      if (idleDurationMs > 30000 && navigator.onLine && !isDemoMode && !isSafeDemoMode()) {
        window.dispatchEvent(new CustomEvent('kongre_tab_wakeup', { detail: { idleDurationMs } }));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenSince = Date.now();
      } else if (document.visibilityState === 'visible') {
        handleWakeUp();
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        handleWakeUp();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [isDemoMode]);

  // Guardián de Sesión de Publicador: Revocación o cambio de PIN en tiempo real (p.ej. teléfono perdido o robo)
  useEffect(() => {
    // Solo aplica a sesiones de publicadores (no a ancianos/administradores autenticados con Google ni al Coordinador)
    if (!currentPublisherId || user) return;
    if (!publishers || publishers.length === 0) return;

    const storedSessionPin = getSecureLocalPin('kongre_session_pin_v2');

    // NUNCA revocar la sesión del Coordinador a través del guardián de publicadores
    if (
      activeRole === 'coordinador' ||
      isCoordinator ||
      (storedSessionPin && verifySecureLocalPin('kongre_coordinator_pin', storedSessionPin))
    ) {
      return;
    }

    let myPub = publishers.find((p) => p.id === currentPublisherId);
    if (!myPub && storedSessionPin) {
      myPub = publishers.find((p) => verifyPersonalPinMatch(storedSessionPin, p));
      if (myPub) {
        setIdentifiedPublisher(myPub.id, myPub.name);
      }
    }

    // 1. El publicador fue eliminado del directorio de la congregación
    if (!myPub) {
      setIdentifiedPublisher(null);
      setIdentifiedBrother('');
      setSecureLocalPin('kongre_session_pin_v2', null);
      localStorage.removeItem('kongre_identified_brother');
      localStorage.removeItem('kongre_current_publisher_id_v2');
      setActiveRole('publico');
      showToast('Tu sesión ha finalizado porque ya no figuras en el directorio de la congregación.', 'warning');
      return;
    }

    const hasServerPin = Boolean(
      (myPub.personalPin && String(myPub.personalPin).trim()) ||
      (myPub.personalPinHash && String(myPub.personalPinHash).trim())
    );

    // 2. El PIN fue REVOCADO por los ancianos
    if (!hasServerPin) {
      setIdentifiedPublisher(null);
      setIdentifiedBrother('');
      setSecureLocalPin('kongre_session_pin_v2', null);
      localStorage.removeItem('kongre_identified_brother');
      localStorage.removeItem('kongre_current_publisher_id_v2');
      setActiveRole('publico');
      showToast('🔒 Sesión cerrada: Tu PIN de acceso fue revocado por los ancianos. Por favor solicita un nuevo PIN.', 'error');
      return;
    }

    // 3. El PIN fue CAMBIADO o REGENERADO (el PIN local ya no coincide con el nuevo ni con su hash)
    if (storedSessionPin && !verifyPersonalPinMatch(storedSessionPin, myPub)) {
      setIdentifiedPublisher(null);
      setIdentifiedBrother('');
      setSecureLocalPin('kongre_session_pin_v2', null);
      localStorage.removeItem('kongre_identified_brother');
      localStorage.removeItem('kongre_current_publisher_id_v2');
      setActiveRole('publico');
      showToast('🔑 Tu PIN de acceso ha sido actualizado. Por favor introduce tu nuevo PIN personal.', 'warning');
      return;
    }
  }, [publishers, currentPublisherId, user, setIdentifiedPublisher, setIdentifiedBrother, setActiveRole, showToast]);

  // Registro global del Service Worker de Notificaciones Push y escucha de clics en notificaciones
  useEffect(() => {
    ensurePushServiceWorker().catch(() => {});

    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const handleSwMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || !data.type) return;
      if (data.type === 'NAVIGATE_TO_PORTAL') {
        setShowWelcomeLanding(false);
        setActiveTab('mi_vista');
      } else if (data.type === 'REMINDER_INTERACTION' && data.action === 'confirm_ack') {
        showToast('Recordatorio de asignación marcado como enterado.', 'success');
      }
    };
    navigator.serviceWorker.addEventListener('message', handleSwMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    };
  }, [setActiveTab, showToast]);

  // Escaneo automático y sincronización en segundo plano de asignaciones próximas para notificaciones Web Push
  useEffect(() => {
    if (!weeks || weeks.length === 0) return;
    const savedSub = getPushSubscriptionRecord();
    const brotherName =
      currentBrotherName || user?.displayName || savedSub?.publisherName || '';
    const pubId = currentPublisherId || savedSub?.publisherId || undefined;
    if (!brotherName && !pubId) return;

    checkUpcomingAssignmentsAndNotify({
      publisherName: brotherName,
      publisherId: pubId,
      weeks,
      cartShifts,
      cartLocations,
      settings,
      publishersMap,
    }).catch((err) => console.warn('Error al verificar recordatorios de asignaciones:', err));
  }, [
    weeks,
    cartShifts,
    cartLocations,
    settings,
    publishersMap,
    currentBrotherName,
    currentPublisherId,
    user?.displayName,
  ]);
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kongre_sidebar_visible') !== 'false';
    } catch {
      return true;
    }
  });

  const handleToggleSidebar = () => {
    setIsSidebarVisible((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('kongre_sidebar_visible', String(next));
      } catch {}
      return next;
    });
  };

  // Digital Territory Direct Link / QR scan via URL: ?territorio=01 or ?t=01
  const [digitalTerritoryNumber, setDigitalTerritoryNumber] = useState<string | null>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('territorio') || urlParams.get('t');
  });

  const activeDigitalTerritory = useMemo(() => {
    if (!digitalTerritoryNumber) return null;
    const clean = digitalTerritoryNumber.trim().toLowerCase();
    return (
      territories.find(
        (t) =>
          t.number.toLowerCase() === clean ||
          t.number.toLowerCase().padStart(2, '0') === clean.padStart(2, '0') ||
          t.id.toLowerCase() === clean
      ) || null
    );
  }, [digitalTerritoryNumber, territories]);

  // Listen to Cmd+K / Ctrl+K, Cmd+B / Ctrl+B, and Ctrl+Shift+T / Cmd+Shift+T shortcuts globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setShowWelcomeLanding(false);
        setIsSearchModalOpen(false);
        setActiveTab('cronometro_ministerio');
        window.dispatchEvent(new CustomEvent('kongre_open_preaching_timer'));
        showToast('⏱️ Cronómetro de predicación abierto (Ctrl+Shift+T)', 'info');
        return;
      }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab, showToast]);

  const handleNavigateToWeek = (weekId: string) => {
    setCurrentWeekId(weekId);
    setActiveTab('programacion', { weekId });
  };

  const handleSearchNavigate = (tab: ActiveTab, extraAction?: () => void) => {
    closeModalWithHistory('buscar', setIsSearchModalOpen);
    setActiveTab(tab);
    if (extraAction) {
      extraAction();
    }
  };

  const mobileTabTitles: Partial<Record<ActiveTab, string>> = {
    perfil: 'Mi Perfil y Cuenta',
    roles: 'Roles y Permisos',
    conflictos: 'Centro de Conflictos',
    ajustes: 'Ajustes del Sistema',
    publicadores: 'Directorio de Publicadores',
    territorios: 'Territorios',
    carritos: 'Predicación Pública',
    discursos: 'Discursos Públicos',
    hospitalidad: 'Hospitalidad',
    asistencia: 'Asistencia a Reuniones',
    informes_servicio: 'Informes de Servicio',
    tarjetas_s21: 'Tarjetas S-21',
    informe_s1: 'Informe a la Sucursal (S-1)',
    cuentas: 'Cuentas de la Congregación',
    literatura: 'Literatura',
    limpieza_deberes: 'Limpieza y Acomodadores',
    mantenimiento: 'Mantenimiento',
    panel_electrico: 'Seguridad del Salón',
    tablero_anuncios: 'Tablero de Anuncios',
    visita_sc: 'Visita del Superintendente',
    memorial_asambleas: 'Conmemoración y Asambleas',
    grupos_servicio: 'Grupos de Servicio',
    precursores_auxiliares: 'Precursores Auxiliares',
    s89: 'Hojas de Asignación S-89',
    clm_vmc: 'Programa Vida y Ministerio',
    equidad: 'Equidad de Asignaciones',
    exportar_pdf: 'Exportar e Imprimir PDF',
    estadisticas_secretaria: 'Estadísticas de Secretaría',
    mi_vista: 'Mi Portal Teocrático',
    cronometro_ministerio: 'Cronómetro de Ministerio',
    revisitas: 'Revisitas',
    estudios_biblicos: 'Estudios Bíblicos',
  };

  // Garantiza que cualquier vista en pantalla completa en móvil que antes era un pop-up tenga botón "Atrás"
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const ensureMobileBackButtons = () => {
      if (window.innerWidth >= 768) return;
      const overlays = document.querySelectorAll<HTMLElement>('div.fixed.inset-0');
      overlays.forEach((overlay) => {
        if (overlay.children.length === 0) return;
        if (overlay.querySelector('[data-mobile-back-btn="true"]')) return;
        const existingBackArrowBtn = overlay.querySelector('button svg.lucide-arrow-left')?.closest('button');
        if (existingBackArrowBtn) {
          existingBackArrowBtn.setAttribute('data-mobile-back-btn', 'true');
          return;
        }
        const ariaLabel = (overlay.getAttribute('aria-label') || '').toLowerCase();
        if (ariaLabel.includes('bloqueo') || ariaLabel.includes('consentimiento')) return;

        // Buscar el botón de cierre dentro del contenedor
        const closeBtn = Array.from(overlay.querySelectorAll<HTMLButtonElement>('button')).find((btn) => {
          const label = (btn.getAttribute('aria-label') || btn.getAttribute('title') || '').toLowerCase();
          const text = (btn.textContent || '').trim().toLowerCase();
          if (
            label.includes('cerrar') ||
            label.includes('volver') ||
            label.includes('cancelar') ||
            text === 'cerrar' ||
            text === 'cancelar' ||
            text === 'volver'
          ) {
            return true;
          }
          return Boolean(btn.querySelector('svg.lucide-x, svg.lucide-x-circle'));
        });

        const card = (overlay.firstElementChild as HTMLElement) || overlay;
        if (!closeBtn || !card) return;

        const bar = document.createElement('div');
        bar.setAttribute('data-mobile-back-btn', 'true');
        bar.className =
          'sm:hidden flex items-center justify-between px-4 py-2.5 bg-white dark:bg-[#121216] border-b border-zinc-200 dark:border-[#27272A] shrink-0 sticky top-0 z-30';

        const backButton = document.createElement('button');
        backButton.type = 'button';
        backButton.setAttribute('aria-label', 'Atrás');
        backButton.className =
          'inline-flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-100 dark:bg-[#18181F] text-zinc-800 dark:text-[#F4F4F5] active:scale-95 cursor-pointer';
        backButton.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600 dark:text-indigo-400 shrink-0"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>';
        backButton.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeBtn.click();
        };

        bar.appendChild(backButton);
        card.insertBefore(bar, card.firstChild);
      });
    };

    ensureMobileBackButtons();
    const observer = new MutationObserver(() => {
      ensureMobileBackButtons();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Suggest setting up app lock PIN on desktop only (no automatic pop-ups on mobile)
  useEffect(() => {
    const isDemo = isDemoMode || isSafeDemoMode();
    if (isDemo) return;
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;

    const isGuest = localStorage.getItem('kongre_is_guest') === 'true' || localStorage.getItem('kongre_identified_brother') === 'Invitado';
    if (!showWelcomeLanding && !isGuest) {
      const hasPersonalPin = localStorage.getItem('kongre_security_pin_hash');
      const dismissed = localStorage.getItem('kongre_lock_pin_suggestion_dismissed');
      if (!hasPersonalPin && !dismissed) {
        const timer = setTimeout(() => {
          setIsLockPinSuggestionOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [showWelcomeLanding, isDemoMode]);

  useEffect(() => {
    const isDemo = isDemoMode || isSafeDemoMode();
    if (isDemo) return;
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      prevUserRef.current = user;
      return;
    }

    if (user && !prevUserRef.current && !showWelcomeLanding) {
      const hasPersonalPin = localStorage.getItem('kongre_security_pin_hash');
      const dismissed = localStorage.getItem('kongre_lock_pin_suggestion_dismissed');
      if (!hasPersonalPin && !dismissed) {
        setIsLockPinSuggestionOpen(true);
      }
    }
    prevUserRef.current = user;
  }, [user, showWelcomeLanding, isDemoMode]);

  // Mandatory Congregation Registration Check:
  // A user MUST register the congregation (or join an existing one with verified PIN/credentials),
  // OR enter as guest (read-only mode like Organized app) before accessing the platform
  const isGuestSession = Boolean(
    isDemoMode ||
    isSafeDemoMode() ||
    localStorage.getItem('kongre_is_guest') === 'true' ||
    localStorage.getItem('kongre_identified_brother') === 'Invitado'
  );

  const isCongregationRegistered = Boolean(
    isGuestSession ||
    ((localStorage.getItem('kongre_has_entered_app') === 'true' && localStorage.getItem('kongre_is_registered_congregation') === 'true') &&
    (settings.isRegistered || Boolean(localStorage.getItem('kongre_congregation_id')) || Boolean(localStorage.getItem('kongre_congregation_number'))))
  );

  // Full-page Version History / Changelog view (NO pop-up)
  if (isVersionModalOpen) {
    return (
      <VersionHistoryModal
        isOpen={true}
        onClose={() => closeModalWithHistory('versiones', setIsVersionModalOpen)}
      />
    );
  }

  // Official Product Presentation & Documentation Website (www.kongre-app.com / root URL)
  if (showOfficialWebsite) {
    return (
      <>
        <KongreOfficialWebsite
        initialSection={websiteInitialSection}
        onGoToPortal={(initialPortalTab) => {
          try {
            sessionStorage.setItem('kongre_portal_explicit_v2', 'true');
          } catch {}
          setShowOfficialWebsite(false);
          if (initialPortalTab === 'register') {
            setIsRegisterWizardOpen(true);
            window.history.pushState(
              { tab: activeTab, modal: 'registro_congregacion', landing: false, website: false },
              '',
              '#portal?modal=registro_congregacion'
            );
            return;
          }
          setShowWelcomeLanding(true);
          window.history.pushState(
            { tab: activeTab, modal: null, landing: true, website: false },
            '',
            '#portal'
          );
        }}
        onStartDemoMode={() => {
          loadDemoData();
          setShowOfficialWebsite(false);
          setShowWelcomeLanding(false);
          sessionStorage.removeItem('kongre_show_landing');
          localStorage.setItem('kongre_has_entered_app', 'true');
          localStorage.setItem('kongre_is_guest', 'true');
          setActiveTab('inicio');
        }}
        onOpenVersionModal={() => {
          openModalWithHistory('versiones', setIsVersionModalOpen);
        }}
        isSignedInOrRegistered={isCongregationRegistered}
        onEnterAppDirectly={() => {
          setShowOfficialWebsite(false);
          setShowWelcomeLanding(false);
          setActiveTab('inicio');
          window.history.pushState(
            { tab: 'inicio', modal: null, landing: false, website: false },
            '',
            '#inicio'
          );
        }}
      />
      {/* Aviso de actualización para PC en la vista de presentación/web */}
      <DesktopUpdateModal
        isOpen={isDesktopUpdateOpen}
        updateInfo={desktopUpdate}
        onClose={() => setIsDesktopUpdateOpen(false)}
      />
    </>
  );
}

  if (showWelcomeLanding || !isCongregationRegistered) {
    return (
      <>
        {!isDesktopApp() && (
          <div className="w-full bg-[#121216] text-white px-3.5 sm:px-4 py-1.5 flex items-center justify-between gap-2 text-xs border-b border-[#27272A] z-50 shrink-0">
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.removeItem('kongre_portal_explicit_v2');
                  sessionStorage.removeItem('kongre_show_landing');
                } catch {}
                setShowOfficialWebsite(true);
                setShowWelcomeLanding(false);
                window.history.pushState(
                  { tab: activeTab, modal: null, landing: false, website: true },
                  '',
                  window.location.pathname
                );
              }}
              className="inline-flex items-center gap-1.5 font-bold text-indigo-300 hover:text-white transition-colors cursor-pointer min-w-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden truncate">Volver a Presentación y Guía</span>
              <span className="hidden sm:inline truncate">Ir a Presentación y Documentación (www.kongre-app.com)</span>
            </button>
            <span className="text-[11px] font-mono tabular-nums text-zinc-400 hidden sm:inline shrink-0">
              kongre-app.com/#portal
            </span>
          </div>
        )}
        <CongregationWelcomeLanding
          onEnterApp={() => {
            setShowWelcomeLanding(false);
            sessionStorage.removeItem('kongre_show_landing');
            localStorage.setItem('kongre_has_entered_app', 'true');
            localStorage.setItem('kongre_is_registered_congregation', 'true');
            setActiveTab('inicio');
            window.history.pushState({ tab: 'inicio', modal: null, landing: false }, '', '#inicio');
          }}
          onOpenJoinModal={() => {
            openModalWithHistory('unirse', setIsJoinModalOpen);
          }}
          onOpenVersionModal={() => {
            openModalWithHistory('versiones', setIsVersionModalOpen);
          }}
          onOpenDownloads={() => {
            setWebsiteInitialSection('downloads');
            setShowOfficialWebsite(true);
            setShowWelcomeLanding(false);
            window.history.pushState(
              { tab: activeTab, modal: null, landing: false, website: true, section: 'downloads' },
              '',
              '#descargas'
            );
          }}
          desktopUpdate={desktopUpdate}
          onOpenDesktopUpdate={() => setIsDesktopUpdateOpen(true)}
        />
        <JoinCongregationModal
          isOpen={isJoinModalOpen}
          onClose={() => closeModalWithHistory('unirse', setIsJoinModalOpen)}
          onSuccessRole={() => {
            closeModalWithHistory('unirse', setIsJoinModalOpen);
            setShowWelcomeLanding(false);
            sessionStorage.removeItem('kongre_show_landing');
            localStorage.setItem('kongre_has_entered_app', 'true');
            localStorage.setItem('kongre_is_registered_congregation', 'true');
            window.history.pushState({ tab: activeTab, modal: null, landing: false }, '', `#${activeTab}`);
          }}
        />
        <OfflineSyncQueueModal
          isOpen={isQueueModalOpen}
          onClose={() => closeModalWithHistory('cola_offline', setIsQueueModalOpen)}
          isOnline={isOnline}
          onSyncNow={syncOfflineQueueNow}
        />
        {/* Aviso de actualización para PC también en la pantalla de bienvenida */}
        <DesktopUpdateModal
          isOpen={isDesktopUpdateOpen}
          updateInfo={desktopUpdate}
          onClose={() => setIsDesktopUpdateOpen(false)}
        />
      </>
    );
  }

  // If registering congregation, show full-page registration view (NO pop-up)
  if (isRegisterWizardOpen) {
    return (
      <RegisterCongregationWizard
        onClose={() => closeModalWithHistory('registro_congregacion', setIsRegisterWizardOpen)}
        onRegisteredSuccess={() => closeModalWithHistory('registro_congregacion', setIsRegisterWizardOpen)}
      />
    );
  }

  // Check if current logged-in Google user has a pending account link request
  const userPendingReq = user?.email
    ? accountLinkRequests.find(
        (r) => r.email.toLowerCase().trim() === user.email?.toLowerCase().trim() && r.status === 'pending'
      )
    : null;

  if (userPendingReq) {
    return (
      <PendingApprovalView
        email={user?.email || ''}
        onEnterApp={() => {
          localStorage.setItem('kongre_has_entered_app', 'true');
          setShowWelcomeLanding(false);
        }}
        onSignOut={async () => {
          await signOutUser();
          setShowWelcomeLanding(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-[#F4F4F5] flex flex-col font-sans transition-colors duration-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCategoryHub={selectedCategoryHub}
        onSelectCategoryHub={setSelectedCategoryHub}
        isSidebarVisible={isSidebarVisible}
        onToggleSidebar={handleToggleSidebar}
        onOpenConflictsModal={openConflictsView}
        onOpenQrModal={() => openModalWithHistory('qr', setIsQrModalOpen)}
        onOpenTimerModal={() => openModalWithHistory('cronometro', setIsTimerModalOpen)}
        onOpenKioskModal={() => openModalWithHistory('tablero_salon', setIsKioskModalOpen)}
        onOpenSearchModal={() => openModalWithHistory('buscar', setIsSearchModalOpen)}
        onOpenRoleModal={() => setActiveTab('roles')}
        onOpenThemeModal={() => openModalWithHistory('tema', setIsThemeModalOpen)}
        onOpenJoinModal={() => openModalWithHistory('unirse', setIsJoinModalOpen)}
        onOpenInviteManager={() => openModalWithHistory('invitaciones', setIsInviteManagerOpen)}
        onOpenLinkRequestsModal={() => openModalWithHistory('vinculacion', setIsLinkRequestsModalOpen)}
        onOpenWelcomeLanding={() => {
          setShowWelcomeLanding(true);
          window.history.pushState({ tab: activeTab, modal: null, landing: true }, '', '#portal');
        }}
        onOpenPinsModal={() => openModalWithHistory('pines', setIsPinsModalOpen)}
        onOpenAuditLog={() => openModalWithHistory('auditoria', setIsAuditLogOpen)}
        onOpenVersionModal={() => openModalWithHistory('versiones', setIsVersionModalOpen)}
        onOpenQueueModal={() => openModalWithHistory('cola_offline', setIsQueueModalOpen)}
        onOpenRegisterModal={() => openModalWithHistory('registro_congregacion', setIsRegisterWizardOpen)}
        onToggleInspector={toggleInspector}
        isInspectorOpen={isInspectorOpen}
      />

      <main className={`flex-1 w-full ${isSidebarVisible ? 'md:pl-16' : 'pl-0'} ${isInspectorOpen ? 'lg:pr-[380px]' : ''} transition-all duration-200 flex flex-col justify-between overflow-x-clip`}>
        <div className="relative flex-1 w-full px-2.5 sm:px-4 md:px-6 lg:px-7 xl:px-8 py-2.5 sm:py-5 pb-6">
          {!['inicio', 'programacion', 'calendario', 'panorama_general', 'menu'].includes(activeTab) && (
            <div className="md:hidden sticky top-[calc(env(safe-area-inset-top,0px)+3.5rem)] z-30 -mx-2.5 px-3 pt-[max(0.625rem,env(safe-area-inset-top,0px))] pb-2.5 mb-3.5 bg-white/95 dark:bg-[#121216]/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-[#27272A] flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  data-mobile-back-btn="true"
                  aria-label="Atrás"
                  onClick={() => setActiveTab(previousTab || 'menu')}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-800 dark:text-[#F4F4F5] transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                </button>
                <span className="text-sm font-extrabold text-zinc-900 dark:text-[#F4F4F5] truncate">
                  {mobileTabTitles[activeTab] || ''}
                </span>
              </div>
            </div>
          )}
          <LoadingSpinner
            isVisible={!isDemoMode && (isSupabaseSyncing || syncStatus === 'saving')}
            activeTab={activeTab}
          />
          {!isTabAllowedForRole(effectiveRoleInfo.id, activeTab) ? (
          <AccessRestrictedView
            requiredRoleName={
              activeTab === 'cuentas'
                ? 'el Siervo de Cuentas o el Coordinador'
                : activeTab === 'tarjetas_s21' || activeTab === 'informes_servicio'
                ? 'el Secretario o el Coordinador'
                : activeTab === 'territorios'
                ? 'el Siervo de Territorios o el Coordinador'
                : activeTab === 'literatura'
                ? 'el Siervo de Literatura o el Coordinador'
                : activeTab === 'discursos'
                ? 'el Siervo de Discursos o el Coordinador'
                : activeTab === 'visita_sc'
                ? 'el Cuerpo de Ancianos'
                : 'un hermano con privilegios autorizados'
            }
            onNavigateHome={() => setActiveTab('inicio')}
            onOpenRoleSwitcher={() => setActiveTab('roles')}
          />
        ) : (
          <>
            {/* Friendly banner if congregation has not yet been registered */}
            {!settings.isRegistered && !settings.congregationName && (
              <div className="mb-6 p-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-[#F4F4F5]">
                      {isGuestSession ? 'Modo Invitado / Exploración Activa' : '¡Bienvenido! Tu congregación aún no está configurada'}
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">
                      {isGuestSession
                        ? 'Estás explorando Kongre en modo invitado (solo lectura). Puedes consultar el programa de reuniones, cartelera y calendario, o registrar tu congregación para empezar a administrarla.'
                        : 'Puedes usar y explorar la app libremente, o registrar los datos oficiales (nombre, circuito y reuniones) para comenzar a organizar.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openModalWithHistory('registro_congregacion', setIsRegisterWizardOpen)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer text-center"
                >
                  Registrar mi Congregación
                </button>
              </div>
            )}

            {(activeTab === 'inicio' ||
              activeTab === 'cronometro_ministerio' ||
              activeTab === 'revisitas' ||
              activeTab === 'estudios_biblicos') && (
              <MinisterioPublicadorTab
                setActiveTab={setActiveTab}
                initialSubTab={
                  activeTab === 'cronometro_ministerio'
                    ? 'cronometro'
                    : activeTab === 'revisitas'
                    ? 'revisitas'
                    : activeTab === 'estudios_biblicos'
                    ? 'estudios'
                    : 'resumen'
                }
                onOpenTimerModal={() => openModalWithHistory('cronometro', setIsTimerModalOpen)}
              />
            )}
            {activeTab === 'panorama_general' && (
              <PanoramaGeneralTab setActiveTab={setActiveTab} />
            )}
            {activeTab === 'estadisticas_secretaria' && (
              <ResumenInicioTab
                setActiveTab={setActiveTab}
                onOpenTimerModal={() => openModalWithHistory('cronometro', setIsTimerModalOpen)}
                onOpenKioskModal={() => openModalWithHistory('tablero_salon', setIsKioskModalOpen)}
                onOpenConflictsModal={openConflictsView}
                onOpenPinsModal={() => openModalWithHistory('pines', setIsPinsModalOpen)}
              />
            )}
            {activeTab === 'calendario' && (
              <CongregationCalendar onNavigateToWeek={handleNavigateToWeek} />
            )}
            {activeTab === 'programacion' && <ScheduleTab />}
            {activeTab === 'clm_vmc' && (
              <ClmScheduleView
                publishers={publishers}
                congregationId={settings.congregationName}
              />
            )}
            {activeTab === 's89' && <S89SlipsTab />}
            {activeTab === 'publicadores' && <PublishersTab />}
            {activeTab === 'precursores_auxiliares' && <PrecursoresAuxiliaresTab />}
            {activeTab === 'grupos_servicio' && <GruposServicioTab />}
            {activeTab === 'territorios' && <TerritoriosTab />}
            {activeTab === 'visita_sc' && <VisitaSuperintendenteTab />}
            {activeTab === 'memorial_asambleas' && <MemorialAsambleasTab />}
            {activeTab === 'discursos' && <DiscursosPublicosTab />}
            {activeTab === 'hospitalidad' && <HospitalidadTab />}
            {activeTab === 'carritos' && <CarritosTab />}
            {activeTab === 'asistencia' && <AsistenciaTab />}
            {activeTab === 'informe_s1' && <InformeSucursalS1Tab />}
            {activeTab === 'informes_servicio' && <InformesServicioTab />}
            {activeTab === 'tarjetas_s21' && <TarjetasS21Tab />}
            {activeTab === 'cuentas' && <CuentasTab />}
            {activeTab === 'literatura' && <LiteraturaTab />}
            {activeTab === 'limpieza_deberes' && <CleaningDutiesTab />}
            {activeTab === 'panel_electrico' && <PanelElectricoTab />}
            {activeTab === 'mantenimiento' && <MantenimientoTab />}
            {activeTab === 'tablero_anuncios' && <TableroAnunciosTab />}
            {activeTab === 'conflictos' && (
              <ConflictCenterTab onNavigateToWeek={handleNavigateToWeek} />
            )}
            {activeTab === 'equidad' && <EquidadDashboardTab />}
            {activeTab === 'exportar_pdf' && <ExportPdfTab />}
            {activeTab === 'mi_vista' && <PersonalViewTab />}
            {activeTab === 'perfil' && <UserProfileSettingsView />}
            {activeTab === 'roles' && (
              <RolesManagerTab setActiveTab={setActiveTab} />
            )}
            {activeTab === 'ajustes' && (
              <SettingsTab
                onNavigateToProfile={() => setActiveTab('perfil')}
                onOpenVersionModal={() => openModalWithHistory('versiones', setIsVersionModalOpen)}
                onNavigateToRoles={() => setActiveTab('roles')}
              />
            )}
            {activeTab === 'menu' && (
              <CategoryHubTab
                setActiveTab={setActiveTab}
                selectedCategory={selectedCategoryHub}
                onSelectCategory={setSelectedCategoryHub}
                onOpenConflictsModal={openConflictsView}
                onOpenQrModal={() => openModalWithHistory('qr', setIsQrModalOpen)}
                onOpenTimerModal={() => openModalWithHistory('cronometro', setIsTimerModalOpen)}
                onOpenKioskModal={() => openModalWithHistory('tablero_salon', setIsKioskModalOpen)}
                onOpenPinsModal={() => openModalWithHistory('pines', setIsPinsModalOpen)}
                onOpenRoleModal={() => setActiveTab('roles')}
                onOpenVersionModal={() => openModalWithHistory('versiones', setIsVersionModalOpen)}
                onOpenQueueModal={() => openModalWithHistory('cola_offline', setIsQueueModalOpen)}
              />
            )}
          </>
        )}
        </div>
        <AppFooter
          onOpenVersionModal={() => openModalWithHistory('versiones', setIsVersionModalOpen)}
          onOpenQueueModal={() => openModalWithHistory('cola_offline', setIsQueueModalOpen)}
          desktopUpdate={desktopUpdate}
          onOpenDesktopUpdate={() => setIsDesktopUpdateOpen(true)}
          isOnline={isOnline}
          isDemoMode={isDemoMode}
        />
      </main>

      {/* Global Modals */}
      <ConflictsModal
        isOpen={isConflictsModalOpen}
        onClose={() => closeModalWithHistory('conflictos', setIsConflictsModalOpen)}
        onNavigateToWeek={handleNavigateToWeek}
      />

      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => closeModalWithHistory('qr', setIsQrModalOpen)}
      />

      <MeetingTimerModal
        isOpen={isTimerModalOpen}
        onClose={() => closeModalWithHistory('cronometro', setIsTimerModalOpen)}
      />

      <TableroSalonModal
        isOpen={isKioskModalOpen}
        onClose={() => closeModalWithHistory('tablero_salon', setIsKioskModalOpen)}
      />

      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => closeModalWithHistory('buscar', setIsSearchModalOpen)}
        onNavigate={handleSearchNavigate}
        onOpenKiosk={() => openModalWithHistory('tablero_salon', setIsKioskModalOpen)}
        onOpenTimer={() => openModalWithHistory('cronometro', setIsTimerModalOpen)}
        onOpenQr={() => openModalWithHistory('qr', setIsQrModalOpen)}
      />

      {/* 1-Click WhatsApp Direct Assignment Confirmation Modal */}
      {confirmationParams && (
        <AssignmentConfirmationModal
          isOpen={true}
          onClose={() => {
            setConfirmationParams(null);
            const url = new URL(window.location.href);
            url.searchParams.delete('confirmar');
            url.searchParams.delete('semana');
            url.searchParams.delete('tipo');
            url.searchParams.delete('path');
            url.searchParams.delete('pub');
            window.history.replaceState({}, '', url.toString());
          }}
          weekId={confirmationParams.weekId}
          meetingType={confirmationParams.meetingType}
          assignmentPath={confirmationParams.assignmentPath}
          publisherId={confirmationParams.publisherId}
        />
      )}

      {/* Standalone Mobile Digital Territory Card Modal (from QR / WhatsApp Link) */}
      {activeDigitalTerritory && (
        <DigitalTerritoryModal
          isOpen={true}
          standaloneMobile={true}
          onClose={() => {
            setDigitalTerritoryNumber(null);
            const url = new URL(window.location.href);
            url.searchParams.delete('territorio');
            url.searchParams.delete('t');
            window.history.replaceState({}, '', url.toString());
          }}
          territory={activeDigitalTerritory}
        />
      )}

      {/* Theme Toggle Modal (Modo Claro / Modo Oscuro / Cabina de Audio & Acomodadores) */}
      <ThemeToggleModal
        isOpen={isThemeModalOpen}
        onClose={() => closeModalWithHistory('tema', setIsThemeModalOpen)}
      />

      {/* Offline Connectivity & Cloud Sync Status Banner */}
      {!isDemoMode && (
        <OfflineSyncBanner onOpenQueueModal={() => openModalWithHistory('cola_offline', setIsQueueModalOpen)} />
      )}

      {/* Roles & Theocratic Permissions are now a dedicated full-page view (activeTab === 'roles') */}

      {/* Theocratic Session Lock Modal */}
      {!isDemoMode && <SessionLockModal />}

      {/* Auto-Lock Inactivity Countdown Toast Warning (Últimos 60 segundos) */}
      {!isDemoMode && <AutoLockToastWarning />}

      {/* Join Congregation with Code Modal */}
      <JoinCongregationModal
        isOpen={isJoinModalOpen}
        onClose={() => closeModalWithHistory('unirse', setIsJoinModalOpen)}
      />

      {/* Theocratic Invitations & QR Manager Modal */}
      <InvitationManagerModal
        isOpen={isInviteManagerOpen}
        onClose={() => closeModalWithHistory('invitaciones', setIsInviteManagerOpen)}
      />

      {/* Account Link Requests Approval Modal (Elders/Coordinator) */}
      <AccountLinkRequestsModal
        isOpen={isLinkRequestsModalOpen}
        onClose={() => closeModalWithHistory('vinculacion', setIsLinkRequestsModalOpen)}
      />

      {/* App Lock PIN Setup Suggestion Modal (appears after session starts / login) */}
      {!isDemoMode && (
        <AppLockPinSuggestionModal
          isOpen={isLockPinSuggestionOpen}
          onClose={() => setIsLockPinSuggestionOpen(false)}
        />
      )}

      {/* Directory of Congregation & Publisher PINs */}
      <PublisherPinsModal
        isOpen={isPinsModalOpen}
        onClose={() => closeModalWithHistory('pines', setIsPinsModalOpen)}
      />

      {/* Theocratic Audit Log Modal (Elders & Coordinators) */}
      {permissions.canViewAuditLog && (
        <AuditLogModal
          isOpen={isAuditLogOpen}
          onClose={() => closeModalWithHistory('auditoria', setIsAuditLogOpen)}
        />
      )}

      {/* Registro de Versiones y Control de Cambios */}
      <VersionHistoryModal
        isOpen={isVersionModalOpen}
        onClose={() => closeModalWithHistory('versiones', setIsVersionModalOpen)}
      />

      {/* Notificación y Modal de Actualización para PC */}
      <DesktopUpdateModal
        isOpen={isDesktopUpdateOpen}
        updateInfo={desktopUpdate}
        onClose={() => setIsDesktopUpdateOpen(false)}
      />

      {/* Modal de Cola de Sincronización Offline (IndexedDB / Supabase) */}
      <OfflineSyncQueueModal
        isOpen={isQueueModalOpen}
        onClose={() => closeModalWithHistory('cola_offline', setIsQueueModalOpen)}
        isOnline={isOnline}
        onSyncNow={syncOfflineQueueNow}
      />

      {/* Demo Notice Modal (Organized-style Welcome to Demo Notice) */}
      <DemoNoticeModal
        isOpen={isDemoNoticeOpen}
        onClose={() => {
          setIsDemoNoticeOpen(false);
          sessionStorage.setItem('kongre_demo_notice_shown', 'true');
        }}
        onOpenRegisterModal={() => {
          setIsDemoNoticeOpen(false);
          sessionStorage.setItem('kongre_demo_notice_shown', 'true');
          openModalWithHistory('registro_congregacion', setIsRegisterWizardOpen);
        }}
      />

      {/* First-Time Legal Consent Modal (Mandatory if entering the app for the first time without prior acceptance) */}
      <FirstTimeLegalConsentModal
        isOpen={!isDemoMode && !isSafeDemoMode() && !hasAcceptedTermsState}
        onAccepted={() => setHasAcceptedTermsState(true)}
      />

      {/* Panel de Estudio e Inspector Acoplado (Zero Context-Switching JW) */}
      <StudyInspectorPanel
        isOpen={isInspectorOpen}
        onClose={closeInspector}
        activeReference={activeReference}
        references={references}
        activeAnnotation={activeAnnotation}
        onSaveAnnotation={saveAnnotation}
      />

    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CongregationProvider>
          <SecurityProvider>
            <ToastProvider>
              <ModalProvider>
                <StudyInspectorProvider>
                  <AppContent />
                </StudyInspectorProvider>
              </ModalProvider>
            </ToastProvider>
          </SecurityProvider>
        </CongregationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

