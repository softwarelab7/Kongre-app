/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CongregationProvider, useCongregation } from './context/CongregationContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { ScheduleTab } from './components/ScheduleTab';
import { S89SlipsTab } from './components/S89SlipsTab';
import { PublishersTab } from './components/PublishersTab';
import { GruposServicioTab } from './components/GruposServicioTab';
import { TerritoriosTab } from './components/TerritoriosTab';
import { VisitaSuperintendenteTab } from './components/VisitaSuperintendenteTab';
import { MemorialAsambleasTab } from './components/MemorialAsambleasTab';
import { DiscursosPublicosTab } from './components/DiscursosPublicosTab';
import { CarritosTab } from './components/CarritosTab';
import { AsistenciaTab } from './components/AsistenciaTab';
import { InformesServicioTab } from './components/InformesServicioTab';
import { TarjetasS21Tab } from './components/TarjetasS21Tab';
import { CuentasTab } from './components/CuentasTab';
import { LiteraturaTab } from './components/LiteraturaTab';
import { CleaningDutiesTab } from './components/CleaningDutiesTab';
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
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { AccessRestrictedView } from './components/AccessRestrictedView';
import { useAuth } from './context/AuthContext';

const AppContent: React.FC = () => {
  const { effectiveRoleInfo } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    // If scanning QR code with ?modo=tablero, open personal view directly
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('modo') === 'tablero') return 'mi_vista';
    return 'programacion';
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
  const { setCurrentWeekId, territories } = useCongregation();

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenConflictsModal={() => setIsConflictsModalOpen(true)}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenTimerModal={() => setIsTimerModalOpen(true)}
        onOpenKioskModal={() => setIsKioskModalOpen(true)}
        onOpenSearchModal={() => setIsSearchModalOpen(true)}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
      />

      <main className="flex-1 w-full mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-6 pb-24 md:pb-8">
        {!effectiveRoleInfo.allowedTabs.includes(activeTab) ? (
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
            onNavigateHome={() => setActiveTab('programacion')}
            onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
          />
        ) : (
          <>
            {activeTab === 'programacion' && <ScheduleTab />}
            {activeTab === 's89' && <S89SlipsTab />}
            {activeTab === 'publicadores' && <PublishersTab />}
            {activeTab === 'grupos_servicio' && <GruposServicioTab />}
            {activeTab === 'territorios' && <TerritoriosTab />}
            {activeTab === 'visita_sc' && <VisitaSuperintendenteTab />}
            {activeTab === 'memorial_asambleas' && <MemorialAsambleasTab />}
            {activeTab === 'discursos' && <DiscursosPublicosTab />}
            {activeTab === 'carritos' && <CarritosTab />}
            {activeTab === 'asistencia' && <AsistenciaTab />}
            {activeTab === 'informes_servicio' && <InformesServicioTab />}
            {activeTab === 'tarjetas_s21' && <TarjetasS21Tab />}
            {activeTab === 'cuentas' && <CuentasTab />}
            {activeTab === 'literatura' && <LiteraturaTab />}
            {activeTab === 'limpieza_deberes' && <CleaningDutiesTab />}
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
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CongregationProvider>
          <AppContent />
        </CongregationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
