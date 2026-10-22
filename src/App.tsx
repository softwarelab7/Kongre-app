/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CongregationProvider, useCongregation } from './context/CongregationContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { isTabAllowedForRole, TheocraticRole } from './utils/rbac';
import { formatCanonicalCongregationId, isGenericIdentityName, getSecureLocalPin, setSecureLocalPin, verifySecureLocalPin, verifyPersonalPinMatch, decodeSecureShareToken, verifyAssignmentConfirmSignature } from './utils/theocraticSecurity';
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
import { MinisterioPublicadorTab } from './components/MinisterioPublicadorTab';
import { RolesManagerTab } from './components/RolesManagerTab';
import { AccessRestrictedView } from './components/AccessRestrictedView';
import { SecurityProvider } from './context/SecurityContext';
import { SessionLockModal } from './components/SessionLockModal';
import { AutoLockToastWarning } from './components/AutoLockToastWarning';
import { JoinCongregationModal } from './components/JoinCongregationModal';
import { InvitationManagerModal } from './components/InvitationManagerModal';
import { CongregationWelcomeLanding } from './components/CongregationWelcomeLanding';
import { RegisterCongregationWizard } from './components/RegisterCongregationWizard';
import { AppLockPinSuggestionModal } from './components/AppLockPinSuggestionModal';
import { AccountLinkRequestsModal } from './components/AccountLinkRequestsModal';
import { PendingApprovalView } from './components/PendingApprovalView';
import { PublisherPinsModal } from './components/PublisherPinsModal';
import { AuditLogModal } from './components/AuditLogModal';
import { AppFooter } from './components/AppFooter';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { OfflineSyncQueueModal } from './components/OfflineSyncQueueModal';
import { DemoNoticeModal } from './components/DemoNoticeModal';
import { Building2 } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import {
  checkUpcomingAssignmentsAndNotify,
  ensurePushServiceWorker,
  getPushSubscriptionRecord,
} from './services/notificationService';
import { ToastProvider, useToast } from './context/ToastContext';
import { ModalProvider } from './context/ModalContext';

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
};

export function parseAppHash(hashString: string) {
  const clean = (hashString || '').replace(/^#\/?/, '').trim();
  if (!clean) return null;
  const [routePart, queryPart] = clean.split('?');
  const normalizedRoute = routePart.toLowerCase().trim();
  const searchParams = new URLSearchParams(queryPart || '');
  const tab = VALID_TABS_MAP[normalizedRoute] || null;
  const modal = searchParams.get('modal') || null;
  const semana = searchParams.get('semana') || null;
  const isLanding = normalizedRoute === 'portal' || normalizedRoute === 'bienvenida';
  return { tab, modal, semana, isLanding };
}

const AppContent: React.FC = () => {
  const {
    user,
    activeRole,
    setActiveRole,
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
  const [showWelcomeLanding, setShowWelcomeLanding] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashInfo = typeof window !== 'undefined' ? parseAppHash(window.location.hash) : null;
    if (hashInfo?.isLanding) {
      return true;
    }
    if (
      urlParams.get('portal') === '1' ||
      urlParams.get('inicio') === '1' ||
      urlParams.get('bienvenida') === '1' ||
      sessionStorage.getItem('kongre_show_landing') === 'true'
    ) {
      return true;
    }
    // Show welcome screen if the user has not entered yet in this browser
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
    isDemoMode,
    loadDemoData,
    exitDemoMode,
  } = useCongregation();

  const [isDemoNoticeOpen, setIsDemoNoticeOpen] = useState(() => {
    return (
      typeof window !== 'undefined' &&
      localStorage.getItem('kongre_demo_mode') === 'true' &&
      sessionStorage.getItem('kongre_demo_notice_shown') !== 'true'
    );
  });

  useEffect(() => {
    if (isDemoMode && sessionStorage.getItem('kongre_demo_notice_shown') !== 'true') {
      setIsDemoNoticeOpen(true);
    }
  }, [isDemoMode]);

  // Limpieza de fotos y perfiles residuales previos para que no contaminen el modo prueba
  useEffect(() => {
    if (isDemoMode || (typeof window !== 'undefined' && localStorage.getItem('kongre_demo_mode') === 'true')) {
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

  // Navigation with browser History (Back / Forward button support)
  const setActiveTab = useCallback(
    (
      targetTabOrFn: ActiveTab | ((prev: ActiveTab) => ActiveTab),
      options?: { replace?: boolean; weekId?: string; modal?: string | null }
    ) => {
      setRawActiveTab((prevTab) => {
        const nextTab = typeof targetTabOrFn === 'function' ? targetTabOrFn(prevTab) : targetTabOrFn;
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
      const nextHash = `#${activeTab}?modal=${modalName}`;
      const nextState = {
        tab: activeTab,
        modal: modalName,
        landing: false,
      };
      window.history.pushState(nextState, '', nextHash);
    },
    [activeTab]
  );

  const closeModalWithHistory = useCallback(
    (modalName: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
      if (window.history.state?.modal === modalName) {
        window.history.back();
      } else {
        setter(false);
        const parsed = parseAppHash(window.location.hash);
        if (parsed?.modal === modalName) {
          window.history.replaceState({ tab: activeTab, modal: null, landing: false }, '', `#${activeTab}`);
        }
      }
    },
    [activeTab]
  );

  // Synchronize browser history events (Back / Forward button in browser)
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const state = event.state;
      const hashInfo = parseAppHash(window.location.hash);

      const isLanding = state?.landing ?? hashInfo?.isLanding ?? false;
      if (isLanding) {
        setShowWelcomeLanding(true);
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
        setIsVersionModalOpen(false);
        setIsQueueModalOpen(false);
        return;
      }

      setShowWelcomeLanding(false);

      const targetTab = state?.tab || hashInfo?.tab || 'inicio';
      const targetModal = state?.modal ?? hashInfo?.modal ?? null;
      const targetWeekId = state?.weekId || hashInfo?.semana || null;

      if (targetWeekId) {
        setCurrentWeekId(targetWeekId);
      }

      setRawActiveTab(targetTab);

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

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [setCurrentWeekId, canManageRoles, isDemoMode, permissions.canViewAuditLog, permissions.canSuperviseConflicts]);

  // Initial history state synchronization on app mount
  useEffect(() => {
    const hashInfo = parseAppHash(window.location.hash);
    const isLanding = showWelcomeLanding || (hashInfo?.isLanding ?? false);
    const initialModal = hashInfo?.modal || null;

    if (isLanding) {
      window.history.replaceState({ tab: activeTab, modal: null, landing: true }, '', '#portal');
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

  // Organized-style "Pocket Mode" Direct Invitation Link (?tk=... or legacy ?cong=...&cpin=...&pub=...&pin=...)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const decodedTk = decodeSecureShareToken(urlParams.get('tk'));
    const urlCong = decodedTk?.cong || urlParams.get('cong');
    const urlCpin = decodedTk?.cpin || urlParams.get('cpin');
    const urlPub = decodedTk?.pub || urlParams.get('pub');
    const urlPin = decodedTk?.pin || urlParams.get('pin');

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

          setShowWelcomeLanding(false);
          setActiveTab('mi_vista');
        }
      })();
    }
  }, [publishers, loadCongregationFromCloud]);

  // Verificación de existencia real de la congregación en la nube (Supabase):
  // Si la congregación activa fue eliminada de la nube o no existe, restablecer el acceso a la pantalla de bienvenida
  useEffect(() => {
    if (isDemoMode || localStorage.getItem('kongre_demo_mode') === 'true') {
      return;
    }
    const activeCongId = settings.congregationNumber || settings.congregationId || localStorage.getItem('kongre_congregation_number');
    if (activeCongId && activeCongId.length >= 3 && !['1001', 'CENTRAL', 'MAIN', 'ID', 'DEMO-001'].includes(activeCongId.toUpperCase())) {
      (async () => {
        try {
          const res = await loadCongregationFromCloud(activeCongId, { skipHydrate: true });
          if (!res?.success || !res.data) {
            // La congregación ya no existe en la nube
            localStorage.removeItem('kongre_has_entered_app');
            localStorage.removeItem('kongre_is_registered_congregation');
            localStorage.removeItem('kongre_congregation_number');
            localStorage.removeItem('kongre_congregation_id');
            localStorage.removeItem('kongre_congregation_name');
            setShowWelcomeLanding(true);
          }
        } catch (e) {
          console.warn('Verificando estado de congregación en la nube:', e);
        }
      })();
    }
  }, [settings.congregationNumber, settings.congregationId, loadCongregationFromCloud, isDemoMode]);

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

  // Listen to Cmd+K / Ctrl+K shortcut globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Suggest setting up app lock PIN on this device after user enters the session / logs in
  useEffect(() => {
    const isDemo =
      isDemoMode ||
      (typeof window !== 'undefined' && localStorage.getItem('kongre_demo_mode') === 'true');
    if (isDemo) return;

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
    const isDemo =
      isDemoMode ||
      (typeof window !== 'undefined' && localStorage.getItem('kongre_demo_mode') === 'true');
    if (isDemo) return;

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
    localStorage.getItem('kongre_demo_mode') === 'true' ||
    localStorage.getItem('kongre_is_guest') === 'true' ||
    localStorage.getItem('kongre_identified_brother') === 'Invitado'
  );

  const isCongregationRegistered = Boolean(
    isGuestSession ||
    ((localStorage.getItem('kongre_has_entered_app') === 'true' && localStorage.getItem('kongre_is_registered_congregation') === 'true') &&
    (settings.isRegistered || Boolean(localStorage.getItem('kongre_congregation_id')) || Boolean(localStorage.getItem('kongre_congregation_number'))))
  );

  if (showWelcomeLanding || !isCongregationRegistered) {
    return (
      <>
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
        <VersionHistoryModal
          isOpen={isVersionModalOpen}
          onClose={() => closeModalWithHistory('versiones', setIsVersionModalOpen)}
        />
        <OfflineSyncQueueModal
          isOpen={isQueueModalOpen}
          onClose={() => closeModalWithHistory('cola_offline', setIsQueueModalOpen)}
          isOnline={isOnline}
          onSyncNow={syncOfflineQueueNow}
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarVisible={isSidebarVisible}
        onToggleSidebar={handleToggleSidebar}
        onOpenConflictsModal={() => openModalWithHistory('conflictos', setIsConflictsModalOpen)}
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
      />

      <main className={`flex-1 w-full ${isSidebarVisible ? 'md:pl-16' : 'pl-0'} transition-all duration-200 flex flex-col justify-between overflow-x-hidden`}>
        <div className="w-full mx-auto px-2.5 sm:px-6 lg:px-8 2xl:px-12 py-2.5 sm:py-6 pb-6">
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
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {isGuestSession ? 'Modo Invitado / Exploración Activa' : '¡Bienvenido! Tu congregación aún no está configurada'}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
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
              <ResumenInicioTab
                setActiveTab={setActiveTab}
                onOpenTimerModal={() => openModalWithHistory('cronometro', setIsTimerModalOpen)}
                onOpenKioskModal={() => openModalWithHistory('tablero_salon', setIsKioskModalOpen)}
                onOpenConflictsModal={() => openModalWithHistory('conflictos', setIsConflictsModalOpen)}
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
          </>
        )}
        </div>
        <AppFooter
          onOpenVersionModal={() => openModalWithHistory('versiones', setIsVersionModalOpen)}
          onOpenQueueModal={() => openModalWithHistory('cola_offline', setIsQueueModalOpen)}
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
      <OfflineSyncBanner onOpenQueueModal={() => openModalWithHistory('cola_offline', setIsQueueModalOpen)} />

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
                <AppContent />
              </ModalProvider>
            </ToastProvider>
          </SecurityProvider>
        </CongregationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

