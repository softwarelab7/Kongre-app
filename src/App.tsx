/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CongregationProvider, useCongregation } from './context/CongregationContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { isTabAllowedForRole } from './utils/rbac';
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
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { AccessRestrictedView } from './components/AccessRestrictedView';
import { SecurityProvider } from './context/SecurityContext';
import { SessionLockModal } from './components/SessionLockModal';
import { JoinCongregationModal } from './components/JoinCongregationModal';
import { InvitationManagerModal } from './components/InvitationManagerModal';
import { CongregationWelcomeLanding } from './components/CongregationWelcomeLanding';
import { RegisterCongregationWizard } from './components/RegisterCongregationWizard';
import { AppLockPinSuggestionModal } from './components/AppLockPinSuggestionModal';
import { AccountLinkRequestsModal } from './components/AccountLinkRequestsModal';
import { PendingApprovalView } from './components/PendingApprovalView';
import { Building2 } from 'lucide-react';
import { useAuth } from './context/AuthContext';

const AppContent: React.FC = () => {
  const { user, effectiveRoleInfo, signOutUser } = useAuth();
  const [isLockPinSuggestionOpen, setIsLockPinSuggestionOpen] = useState(false);
  const prevUserRef = useRef(user);

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    // If scanning QR code with ?modo=tablero, open personal view directly
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('modo') === 'tablero') return 'mi_vista';
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
      if (weekId && assignmentPath && publisherId) {
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
    return !!urlParams.get('invite');
  });
  const [isInviteManagerOpen, setIsInviteManagerOpen] = useState(false);
  const [showWelcomeLanding, setShowWelcomeLanding] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
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
  const { setCurrentWeekId, territories, settings, accountLinkRequests, publishers } = useCongregation();
  const [isRegisterWizardOpen, setIsRegisterWizardOpen] = useState(false);
  const [isLinkRequestsModalOpen, setIsLinkRequestsModalOpen] = useState(false);
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
    setActiveTab('programacion');
  };

  const handleSearchNavigate = (tab: ActiveTab, extraAction?: () => void) => {
    setActiveTab(tab);
    setIsSearchModalOpen(false);
    if (extraAction) {
      extraAction();
    }
  };

  // Suggest setting up app lock PIN on this device after user enters the session / logs in
  useEffect(() => {
    if (!showWelcomeLanding) {
      const hasPersonalPin = localStorage.getItem('kongre_security_pin_hash');
      const dismissed = localStorage.getItem('kongre_lock_pin_suggestion_dismissed');
      if (!hasPersonalPin && !dismissed) {
        const timer = setTimeout(() => {
          setIsLockPinSuggestionOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [showWelcomeLanding]);

  useEffect(() => {
    if (user && !prevUserRef.current && !showWelcomeLanding) {
      const hasPersonalPin = localStorage.getItem('kongre_security_pin_hash');
      const dismissed = localStorage.getItem('kongre_lock_pin_suggestion_dismissed');
      if (!hasPersonalPin && !dismissed) {
        setIsLockPinSuggestionOpen(true);
      }
    }
    prevUserRef.current = user;
  }, [user, showWelcomeLanding]);

  // Mandatory Congregation Registration Check:
  // A user MUST register the congregation (or join an existing one) before accessing the platform
  const isCongregationRegistered = Boolean(
    (settings.isRegistered && settings.congregationName?.trim()) ||
    localStorage.getItem('kongre_is_registered_congregation') === 'true' ||
    user?.email === 'hectorguti95@gmail.com'
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
          }}
          onOpenJoinModal={() => {
            setIsJoinModalOpen(true);
          }}
        />
        <JoinCongregationModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          onSuccessRole={() => {
            setIsJoinModalOpen(false);
            setShowWelcomeLanding(false);
            sessionStorage.removeItem('kongre_show_landing');
            localStorage.setItem('kongre_has_entered_app', 'true');
            localStorage.setItem('kongre_is_registered_congregation', 'true');
          }}
        />
      </>
    );
  }

  // If registering congregation, show full-page registration view (NO pop-up)
  if (isRegisterWizardOpen) {
    return (
      <RegisterCongregationWizard
        onClose={() => setIsRegisterWizardOpen(false)}
        onRegisteredSuccess={() => setIsRegisterWizardOpen(false)}
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
        onOpenConflictsModal={() => setIsConflictsModalOpen(true)}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenTimerModal={() => setIsTimerModalOpen(true)}
        onOpenKioskModal={() => setIsKioskModalOpen(true)}
        onOpenSearchModal={() => setIsSearchModalOpen(true)}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenJoinModal={() => setIsJoinModalOpen(true)}
        onOpenInviteManager={() => setIsInviteManagerOpen(true)}
        onOpenLinkRequestsModal={() => setIsLinkRequestsModalOpen(true)}
        onOpenWelcomeLanding={() => setShowWelcomeLanding(true)}
      />

      <main className={`flex-1 w-full ${isSidebarVisible ? 'md:pl-16 lg:pl-18' : 'pl-0'} mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-6 pb-24 md:pb-8 transition-all duration-200`}>
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
            onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
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
                      ¡Bienvenido! Tu congregación aún no está configurada
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Puedes usar y explorar la app libremente, o registrar los datos oficiales (nombre, circuito y reuniones) para comenzar a organizar.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRegisterWizardOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer text-center"
                >
                  Registrar mi Congregación
                </button>
              </div>
            )}

            {activeTab === 'inicio' && (
              <ResumenInicioTab
                setActiveTab={setActiveTab}
                onOpenTimerModal={() => setIsTimerModalOpen(true)}
                onOpenKioskModal={() => setIsKioskModalOpen(true)}
                onOpenConflictsModal={() => setIsConflictsModalOpen(true)}
              />
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
            {activeTab === 'ajustes' && <SettingsTab />}
          </>
        )}
      </main>

      {/* Global Modals */}
      <ConflictsModal
        isOpen={isConflictsModalOpen}
        onClose={() => setIsConflictsModalOpen(false)}
        onNavigateToWeek={handleNavigateToWeek}
      />

      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      <MeetingTimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
      />

      <TableroSalonModal
        isOpen={isKioskModalOpen}
        onClose={() => setIsKioskModalOpen(false)}
      />

      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onNavigate={handleSearchNavigate}
        onOpenKiosk={() => setIsKioskModalOpen(true)}
        onOpenTimer={() => setIsTimerModalOpen(true)}
        onOpenQr={() => setIsQrModalOpen(true)}
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
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* Offline Connectivity & Cloud Sync Status Banner */}
      <OfflineSyncBanner />

      {/* Role Switcher & Google Account Permissions Modal */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Theocratic Session Lock Modal */}
      <SessionLockModal />

      {/* Join Congregation with Code Modal */}
      <JoinCongregationModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      {/* Theocratic Invitations & QR Manager Modal */}
      <InvitationManagerModal
        isOpen={isInviteManagerOpen}
        onClose={() => setIsInviteManagerOpen(false)}
      />

      {/* Account Link Requests Approval Modal (Elders/Coordinator) */}
      <AccountLinkRequestsModal
        isOpen={isLinkRequestsModalOpen}
        onClose={() => setIsLinkRequestsModalOpen(false)}
      />

      {/* App Lock PIN Setup Suggestion Modal (appears after session starts / login) */}
      <AppLockPinSuggestionModal
        isOpen={isLockPinSuggestionOpen}
        onClose={() => setIsLockPinSuggestionOpen(false)}
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
            <AppContent />
          </SecurityProvider>
        </CongregationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
