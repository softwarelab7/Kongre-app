// src/components/RoleSwitcherModal.tsx
import React, { useState, useMemo } from 'react';
import { useAuth, PublisherPinRecord } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { TheocraticRole, THEOCRATIC_ROLES } from '../utils/rbac';
import { generateSecurePublisherPin } from '../utils/theocraticSecurity';
import { ActiveTab } from './Navbar';
import {
  Shield,
  Check,
  UserCheck,
  Users,
  Plus,
  Trash2,
  X,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Info,
  Key,
  QrCode,
  Copy,
  Share2,
  KeyRound,
  RefreshCw,
  Search,
  UserPlus,
  Edit3,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
}) => {
  const {
    activeRole,
    setActiveRole,
    effectiveRoleInfo,
    userRolesList,
    assignRoleToEmail,
    removeRoleFromEmail,
    user,
    currentBrotherName,
    rolePinsMap,
    publisherPinsList,
    identifyRoleByPersonalPin,
    assignPersonalPinToPublisher,
    removePublisherPin,
    generateUniquePublisherPin,
    isCoordinator,
  } = useAuth();

  const { publishers, updatePublisher, settings } = useCongregation();
  const { invitations, createInvitation, revokeInvitation } = useSecurity();

  const [activeTabMode, setActiveTabMode] = useState<
    'identificar_pin' | 'directorio_pins' | 'cambiar_rol' | 'asignar_cuentas' | 'invitaciones_qr'
  >('directorio_pins');

  // Personal PIN identification state
  const [enteredPersonalPin, setEnteredPersonalPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  // Search & filter in PINs Directory
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrivilege, setFilterPrivilege] = useState<'todos' | 'ancianos_siervos' | 'con_rol' | 'sin_pin'>('todos');

  // Edit publisher PIN state
  const [editingPublisherId, setEditingPublisherId] = useState<string | null>(null);
  const [editingPin, setEditingPin] = useState('');
  const [editingRole, setEditingRole] = useState<TheocraticRole>('secretario');
  const [editingName, setEditingName] = useState('');
  const [editingError, setEditingError] = useState<string | null>(null);

  // Show/hide PIN visibility state
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});
  const [copiedPublisherId, setCopiedPublisherId] = useState<string | null>(null);

  // Add new publisher with PIN modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSelectedPublisherId, setNewSelectedPublisherId] = useState<string>('');
  const [newCustomName, setNewCustomName] = useState('');
  const [newRole, setNewRole] = useState<TheocraticRole>('secretario');
  const [newPin, setNewPin] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Google Accounts state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [selectedRoleForNew, setSelectedRoleForNew] = useState<TheocraticRole>('secretario');

  // Quick invitation state
  const [invRole, setInvRole] = useState<TheocraticRole>('secretario');
  const [invBrotherName, setInvBrotherName] = useState('');
  const [copiedInvId, setCopiedInvId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<string | null>(null);

  // Combined Directory of Publishers with unique PINs
  const combinedPublishersList = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        publisherId: string;
        name: string;
        role: TheocraticRole;
        pin: string;
        privilege?: string;
        email?: string;
        gender?: string;
      }
    >();

    // 1. Process all real congregation publishers first (Fuente de Verdad)
    publishers.forEach((pub) => {
      const pinRec = publisherPinsList.find(
        (rec) =>
          rec.publisherId === pub.id ||
          rec.name.toLowerCase().trim() === pub.name.toLowerCase().trim()
      );

      const assignedRole = pub.theocraticRole || pinRec?.role || 'publico';
      const assignedPin = pub.personalPin || pinRec?.pin || '';

      map.set(pub.id, {
        id: pub.id,
        publisherId: pub.id,
        name: pub.name,
        role: assignedRole,
        pin: assignedPin,
        privilege: pub.privilege,
        email: pub.email || pinRec?.email,
        gender: pub.gender,
      });
    });

    // 2. Include designated coordinator if not already present in publishers list
    if (settings?.coordinatorName && settings.coordinatorName.trim()) {
      const coordName = settings.coordinatorName.trim();
      const alreadyIncluded = Array.from(map.values()).some(
        (p) => p.name.toLowerCase().trim() === coordName.toLowerCase().trim()
      );
      if (!alreadyIncluded) {
        const pinRec = publisherPinsList.find(
          (rec) =>
            rec.publisherId === 'coord_principal' ||
            rec.name.toLowerCase().trim() === coordName.toLowerCase().trim()
        );
        map.set('coord_principal', {
          id: 'coord_principal',
          publisherId: 'coord_principal',
          name: coordName,
          role: 'coordinador',
          pin: pinRec?.pin || '',
          privilege: 'anciano',
          email: settings.coordinatorEmail,
          gender: 'hermano',
        });
      }
    }

    return Array.from(map.values());
  }, [publishers, publisherPinsList, settings]);

  const handleGenerateAllMissingPins = () => {
    const missing = combinedPublishersList.filter((p) => !p.pin);
    if (missing.length === 0) {
      alert('Todos los publicadores ya tienen su PIN personal único.');
      return;
    }
    if (!confirm(`¿Generar un PIN personal único para los ${missing.length} publicadores que aún no tienen PIN?`)) {
      return;
    }
    const takenPins = combinedPublishersList.map((p) => p.pin.trim()).filter(Boolean);
    let count = 0;
    missing.forEach((item) => {
      const uniquePin = generateSecurePublisherPin(takenPins);
      takenPins.push(uniquePin);
      assignPersonalPinToPublisher(
        item.publisherId,
        uniquePin,
        item.role,
        item.name,
        item.email,
        item.privilege
      );
      const matchingPub = publishers.find((p) => p.id === item.publisherId);
      if (matchingPub) {
        updatePublisher({
          ...matchingPub,
          personalPin: uniquePin,
          theocraticRole: item.role,
        });
      }
      count++;
    });
    setFeedback(`¡Se asignaron ${count} PINs personales únicos exitosamente!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Filtered publishers for Directory tab
  const filteredPublishers = useMemo(() => {
    return combinedPublishersList.filter((item) => {
      // Search filter
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.privilege && item.privilege.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.role && THEOCRATIC_ROLES[item.role]?.name.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Category filter
      if (filterPrivilege === 'ancianos_siervos') {
        return item.privilege === 'anciano' || item.privilege === 'siervo_ministerial';
      }
      if (filterPrivilege === 'con_rol') {
        return item.role && item.role !== 'publico';
      }
      if (filterPrivilege === 'sin_pin') {
        return !item.pin;
      }

      return true;
    });
  }, [combinedPublishersList, searchTerm, filterPrivilege]);

  if (!isOpen) return null;

  const togglePinVisibility = (id: string) => {
    setVisiblePins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleVerifyPersonalPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    if (!enteredPersonalPin.trim()) {
      setPinError('Introduce tu PIN Personal único.');
      return;
    }

    const result = await identifyRoleByPersonalPin(enteredPersonalPin.trim());
    if (result.success && result.role) {
      setPinSuccess(result.message);
      const roleInfo = THEOCRATIC_ROLES[result.role];
      if (!roleInfo.allowedTabs.includes(activeTab)) {
        setActiveTab(roleInfo.allowedTabs[0] || 'programacion');
      }
      setTimeout(() => {
        setPinSuccess(null);
        setEnteredPersonalPin('');
        onClose();
      }, 1200);
    } else {
      setPinError(result.message);
    }
  };

  const handleStartEditing = (pub: {
    id: string;
    publisherId: string;
    name: string;
    role: TheocraticRole;
    pin: string;
  }) => {
    setEditingPublisherId(pub.publisherId);
    setEditingName(pub.name);
    setEditingRole(pub.role);
    setEditingPin(pub.pin || generateUniquePublisherPin());
    setEditingError(null);
  };

  const handleSavePublisherPin = (publisherId: string) => {
    if (!editingPin.trim() || editingPin.trim().length < 4) {
      setEditingError('El PIN debe tener al menos 4 dígitos numéricos.');
      return;
    }

    const res = assignPersonalPinToPublisher(
      publisherId,
      editingPin.trim(),
      editingRole,
      editingName.trim()
    );

    if (!res.success) {
      setEditingError(res.message);
      return;
    }

    // Also update publisher in congregation if exists
    const matchingPub = publishers.find((p) => p.id === publisherId);
    if (matchingPub) {
      updatePublisher({
        ...matchingPub,
        theocraticRole: editingRole,
        personalPin: editingPin.trim(),
      });
    }

    setEditingPublisherId(null);
    setFeedback(`¡PIN y rol actualizados con éxito para ${editingName}!`);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleQuickGeneratePin = (pub: {
    publisherId: string;
    name: string;
    role: TheocraticRole;
    privilege?: string;
  }) => {
    const uniquePin = generateUniquePublisherPin();
    const res = assignPersonalPinToPublisher(
      pub.publisherId,
      uniquePin,
      pub.role,
      pub.name,
      undefined,
      pub.privilege
    );

    if (res.success) {
      // Also update publisher in congregation if exists
      const matchingPub = publishers.find((p) => p.id === pub.publisherId);
      if (matchingPub) {
        updatePublisher({
          ...matchingPub,
          theocraticRole: pub.role,
          personalPin: uniquePin,
        });
      }

      setFeedback(`Se generó el PIN único ${uniquePin} para ${pub.name}.`);
      setTimeout(() => setFeedback(null), 2500);
    } else {
      alert(res.message);
    }
  };

  const handleCopyPin = (id: string, name: string, role: TheocraticRole, pin: string) => {
    const roleName = THEOCRATIC_ROLES[role]?.name || role;
    const msg = `🔐 CREDENCIALES TEOCRÁTICAS KONGRE\n━━━━━━━━━━━━━━━━━━━━\n👤 Hermano: ${name}\n🏛️ Rol Asignado: ${roleName}\n🔑 Tu PIN Personal Único: ${pin}\n━━━━━━━━━━━━━━━━━━━━\n⚠️ Guarda este PIN. Te identifica de forma única para activar tus funciones en la congregación.`;
    navigator.clipboard.writeText(msg);
    setCopiedPublisherId(id);
    setTimeout(() => setCopiedPublisherId(null), 2000);
  };

  const handleSelectRole = (role: TheocraticRole) => {
    setActiveRole(role);
    const roleInfo = THEOCRATIC_ROLES[role];

    if (!roleInfo.allowedTabs.includes(activeTab)) {
      setActiveTab(roleInfo.allowedTabs[0] || 'programacion');
    }

    setFeedback(`Has cambiado al rol: ${roleInfo.name}`);
    setTimeout(() => {
      setFeedback(null);
      onClose();
    }, 900);
  };

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      alert('Por favor ingrese un correo electrónico válido');
      return;
    }

    assignRoleToEmail(newEmail.trim(), selectedRoleForNew, newName.trim());
    setNewEmail('');
    setNewName('');
    setFeedback('Rol asignado correctamente a la cuenta Google.');
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleCreateQuickInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await createInvitation(invRole, invBrotherName);
    setInvBrotherName('');
    setFeedback(`¡Código generado con éxito: ${created.code}!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCreatePublisherPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    let pubId = newSelectedPublisherId;
    let pubName = newCustomName.trim();
    let privilege: string | undefined;

    if (newSelectedPublisherId) {
      const selected = publishers.find((p) => p.id === newSelectedPublisherId);
      if (selected) {
        pubName = selected.name;
        privilege = selected.privilege;
      }
    } else if (!pubName) {
      setAddError('Por favor selecciona o escribe el nombre del hermano.');
      return;
    } else {
      pubId = `pub_custom_${Date.now()}`;
    }

    const pinToUse = newPin.trim() || generateUniquePublisherPin();
    const res = assignPersonalPinToPublisher(
      pubId,
      pinToUse,
      newRole,
      pubName,
      undefined,
      privilege
    );

    if (!res.success) {
      setAddError(res.message);
      return;
    }

    // Also update publisher in congregation if exists
    const matchingPub = publishers.find((p) => p.id === pubId);
    if (matchingPub) {
      updatePublisher({
        ...matchingPub,
        theocraticRole: newRole,
        personalPin: pinToUse,
      });
    }

    setShowAddModal(false);
    setNewSelectedPublisherId('');
    setNewCustomName('');
    setNewPin('');
    setFeedback(`¡PIN asignado a ${pubName}!`);
    setTimeout(() => setFeedback(null), 2500);
  };

  const roleList: TheocraticRole[] = [
    'coordinador',
    'superintendente_vym',
    'secretario',
    'siervo_discursos',
    'siervo_territorios',
    'siervo_literatura',
    'siervo_cuentas',
    'publico',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-inner">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">
                  Seguridad Teocrática
                </span>
                <span className="text-xs text-indigo-200">PINs Únicos por Publicador</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Gestor de Roles y PINs Personales
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Directorio de PINs (Principal), Identificar por PIN, Manual, Cuentas, QR */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between overflow-x-auto">
          <div className="inline-flex p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl text-xs font-semibold gap-1 shrink-0">
            <button
              onClick={() => setActiveTabMode('directorio_pins')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTabMode === 'directorio_pins'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" />
              <span>PINs por Publicador</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                {combinedPublishersList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTabMode('identificar_pin')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTabMode === 'identificar_pin'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" />
              <span>Identificar con PIN</span>
            </button>

            <button
              onClick={() => setActiveTabMode('cambiar_rol')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTabMode === 'cambiar_rol'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cambio Rápido
            </button>

            <button
              onClick={() => setActiveTabMode('asignar_cuentas')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTabMode === 'asignar_cuentas'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cuentas Google ({userRolesList.length})
            </button>

            <button
              onClick={() => setActiveTabMode('invitaciones_qr')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTabMode === 'invitaciones_qr'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" />
              <span>QR ({invitations.filter((i) => i.status === 'active').length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block pl-2">
            Rol actual: <strong className="text-slate-900 dark:text-white">{effectiveRoleInfo.shortName}</strong>
          </div>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className="px-6 py-2 bg-emerald-600 text-white text-xs font-bold text-center animate-in fade-in">
            {feedback}
          </div>
        )}

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* ======================================================== */}
          {/* TAB 1: DIRECTORIO DE PINS ÚNICOS POR PUBLICADOR */}
          {/* ======================================================== */}
          {activeTabMode === 'directorio_pins' && (
            <div className="space-y-4">
              {/* Explanatory banner: PINs belong to publishers, NOT to roles! */}
              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-slate-800 dark:text-slate-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="font-bold text-xs text-indigo-950 dark:text-indigo-200">
                    Seguridad por Publicador: Los PINs son Únicos e Intransferibles
                  </span>
                </div>
                <p className="text-xs text-indigo-900/80 dark:text-indigo-300/80 leading-relaxed">
                  Cada hermano tiene su propio <strong>PIN Personal único</strong> que le otorga acceso a sus responsabilidades asignadas (Secretario, Territorios, Cuentas, etc.). <strong>Ningún publicador comparte el mismo PIN</strong> con otro hermano.
                </p>
              </div>

              {/* Toolbar: Search, Filters & Add Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar hermano por nombre o cargo..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setFilterPrivilege('todos')}
                    className={`px-2.5 py-1.5 rounded-lg shrink-0 cursor-pointer transition-colors ${
                      filterPrivilege === 'todos'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Todos ({combinedPublishersList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterPrivilege('ancianos_siervos')}
                    className={`px-2.5 py-1.5 rounded-lg shrink-0 cursor-pointer transition-colors ${
                      filterPrivilege === 'ancianos_siervos'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Ancianos y Siervos
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterPrivilege('con_rol')}
                    className={`px-2.5 py-1.5 rounded-lg shrink-0 cursor-pointer transition-colors ${
                      filterPrivilege === 'con_rol'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Con Rol Asignado
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterPrivilege('sin_pin')}
                    className={`px-2.5 py-1.5 rounded-lg shrink-0 cursor-pointer transition-colors ${
                      filterPrivilege === 'sin_pin'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Sin PIN ({combinedPublishersList.filter((p) => !p.pin).length})
                  </button>
                  {combinedPublishersList.some((p) => !p.pin) && (
                    <button
                      type="button"
                      onClick={handleGenerateAllMissingPins}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                      title="Generar automáticamente PINs únicos a publicadores sin PIN"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Auto-asignar PINs ({combinedPublishersList.filter((p) => !p.pin).length})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors shadow-2xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Asignar a Hermano</span>
                  </button>
                </div>
              </div>

              {/* Publisher Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredPublishers.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 col-span-2 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      No se encontraron hermanos con ese criterio.
                    </p>
                  </div>
                ) : (
                  filteredPublishers.map((item) => {
                    const roleDef = THEOCRATIC_ROLES[item.role];
                    const isEditing = editingPublisherId === item.publisherId;
                    const isVisible = visiblePins[item.publisherId] || false;
                    const hasPin = !!item.pin;

                    return (
                      <div
                        key={item.publisherId}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 space-y-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        {/* Top: Name & Privilege */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                              {item.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                {item.name}
                              </h4>
                              <span className="text-[10px] text-slate-400 capitalize block">
                                {item.privilege?.replace('_', ' ') || 'Publicador'}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              roleDef?.badgeColor || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {roleDef?.shortName || item.role}
                          </span>
                        </div>

                        {/* Editor Mode vs Display Mode */}
                        {isEditing ? (
                          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/80 animate-fade-in">
                            {editingError && (
                              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-[11px] font-bold">
                                {editingError}
                              </div>
                            )}

                            <div>
                              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Rol Teocrático Asignado:
                              </label>
                              <select
                                value={editingRole}
                                onChange={(e) => setEditingRole(e.target.value as TheocraticRole)}
                                className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                              >
                                {roleList.map((rKey) => (
                                  <option key={rKey} value={rKey}>
                                    {THEOCRATIC_ROLES[rKey].name} ({THEOCRATIC_ROLES[rKey].shortName})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  PIN Personal Único:
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setEditingPin(generateUniquePublisherPin())}
                                  className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>Generar aleatorio</span>
                                </button>
                              </div>
                              <input
                                type="text"
                                maxLength={6}
                                value={editingPin}
                                onChange={(e) => {
                                  setEditingPin(e.target.value.replace(/\D/g, ''));
                                  setEditingError(null);
                                }}
                                placeholder="Ej: 2021"
                                className="w-full p-2 text-xs font-mono font-bold tracking-widest text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                              />
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                Debe ser único y no estar usado por ningún otro hermano.
                              </span>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleSavePublisherPin(item.publisherId)}
                                className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
                              >
                                Guardar Cambios
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPublisherId(null)}
                                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            {/* PIN Display & Status */}
                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-2">
                                <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">PIN:</span>
                                {hasPin ? (
                                  <span className="font-mono font-black text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 tracking-wider">
                                    {isVisible ? item.pin : '••••'}
                                  </span>
                                ) : (
                                  <span className="text-rose-500 font-bold text-xs italic">
                                    Sin PIN asignado
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                {hasPin && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => togglePinVisibility(item.publisherId)}
                                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                      title={isVisible ? 'Ocultar PIN' : 'Ver PIN'}
                                    >
                                      {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCopyPin(item.publisherId, item.name, item.role, item.pin)
                                      }
                                      className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                                      title="Copiar credenciales para enviar"
                                    >
                                      {copiedPublisherId === item.publisherId ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Actions Row */}
                            <div className="flex items-center justify-between pt-1 gap-2">
                              {hasPin ? (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditing(item)}
                                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Editar PIN / Rol</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleQuickGeneratePin(item)}
                                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>Generar PIN único</span>
                                </button>
                              )}

                              {hasPin && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickGeneratePin(item)}
                                  className="text-[11px] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                                  title="Generar otro PIN aleatorio"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Regenerar</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: IDENTIFICAR CON PIN PERSONAL */}
          {/* ======================================================== */}
          {activeTabMode === 'identificar_pin' && (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xs">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Identificación por PIN Único
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Cada hermano tiene su propio <strong>PIN Personal único</strong>. Introduce tu PIN para activar automáticamente tu rol y los departamentos a tu cargo.
                </p>
                {currentBrotherName && (
                  <div className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                    ✓ Identificado: {currentBrotherName} ({effectiveRoleInfo.name})
                  </div>
                )}
              </div>

              {pinError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold text-center animate-shake">
                  {pinError}
                </div>
              )}

              {pinSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold text-center animate-fade-in">
                  {pinSuccess}
                </div>
              )}

              <form onSubmit={handleVerifyPersonalPin} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 text-center">
                    PIN Personal Único del Hermano:
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={enteredPersonalPin}
                    onChange={(e) => {
                      setEnteredPersonalPin(e.target.value.replace(/\D/g, ''));
                      setPinError(null);
                    }}
                    placeholder="••••"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold text-center tracking-widest text-lg bg-slate-50 dark:bg-slate-800 focus:bg-white text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Identificar y Activar Rol</span>
                </button>
              </form>

              {/* Demo / Rapid Suggestions by BROTHER */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider text-center">
                  PINs registrados en la congregación (acceso rápido):
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {combinedPublishersList
                    .filter((p) => !!p.pin)
                    .slice(0, 6)
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setEnteredPersonalPin(item.pin)}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-left transition-colors cursor-pointer"
                      >
                        <span className="font-bold block text-slate-800 dark:text-slate-200 truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                          PIN: {item.pin} ({THEOCRATIC_ROLES[item.role]?.shortName})
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: CAMBIO MANUAL DE ROL (TEST / PREVIEW) */}
          {/* ======================================================== */}
          {activeTabMode === 'cambiar_rol' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Simulación y Cambio Manual
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Permite al Coordinador o administrador previsualizar los permisos de cada rol teocrático.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {roleList.map((rKey) => {
                  const r = THEOCRATIC_ROLES[rKey];
                  const isSelected = activeRole === rKey;

                  return (
                    <button
                      key={rKey}
                      onClick={() => handleSelectRole(rKey)}
                      className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                            rKey === 'coordinador'
                              ? 'bg-indigo-600'
                              : rKey === 'superintendente_vym'
                              ? 'bg-emerald-600'
                              : rKey === 'secretario'
                              ? 'bg-blue-600'
                              : rKey === 'siervo_discursos'
                              ? 'bg-amber-600'
                              : rKey === 'siervo_territorios'
                              ? 'bg-teal-600'
                              : rKey === 'siervo_literatura'
                              ? 'bg-orange-600'
                              : rKey === 'siervo_cuentas'
                              ? 'bg-rose-600'
                              : 'bg-slate-700'
                          }`}
                        >
                          {rKey === 'publico' ? <Eye className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {r.name}
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.badgeColor}`}>
                              {r.shortName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            {r.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 pl-2">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-700">
                            Activar
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: ASIGNAR CUENTAS GOOGLE */}
          {/* ======================================================== */}
          {activeTabMode === 'asignar_cuentas' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Vincular Cuentas de Correo Google
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Los hermanos que inicien sesión con su cuenta de Google recibirán automáticamente su rol.
                </p>
              </div>

              {/* Add form */}
              <form
                onSubmit={handleAddAssignment}
                className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3"
              >
                <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 block">
                  Vincular Nuevo Correo de Hermano:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    placeholder="Nombre del hermano"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                  <input
                    type="email"
                    placeholder="correo@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                  <select
                    value={selectedRoleForNew}
                    onChange={(e) => setSelectedRoleForNew(e.target.value as TheocraticRole)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                  >
                    {roleList.map((rKey) => (
                      <option key={rKey} value={rKey}>
                        {THEOCRATIC_ROLES[rKey].shortName}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Vincular Cuenta</span>
                </button>
              </form>

              {/* List of mapped accounts */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Cuentas Vinculadas ({userRolesList.length})
                </span>
                {userRolesList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 text-center">
                    No hay cuentas Google vinculadas aún.
                  </p>
                ) : (
                  userRolesList.map((rec) => (
                    <div
                      key={rec.email}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs bg-white dark:bg-slate-800/80"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{rec.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{rec.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${THEOCRATIC_ROLES[rec.role]?.badgeColor}`}>
                          {THEOCRATIC_ROLES[rec.role]?.shortName}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeRoleFromEmail(rec.email)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: INVITACIONES POR CÓDIGO O QR */}
          {/* ======================================================== */}
          {activeTabMode === 'invitaciones_qr' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Invitaciones con Código Teocrático o QR
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Genera un código temporal para que un hermano se una directamente con su rol asignado.
                </p>
              </div>

              {/* Create invitation form */}
              <form
                onSubmit={handleCreateQuickInvitation}
                className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Nombre del Hermano Invitado:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Carlos Pérez"
                      value={invBrotherName}
                      onChange={(e) => setInvBrotherName(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Rol Asignado:
                    </label>
                    <select
                      value={invRole}
                      onChange={(e) => setInvRole(e.target.value as TheocraticRole)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                    >
                      {roleList.map((rKey) => (
                        <option key={rKey} value={rKey}>
                          {THEOCRATIC_ROLES[rKey].name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generar Código de Invitación</span>
                </button>
              </form>

              {/* Active invitations */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Códigos Activos ({invitations.filter((i) => i.status === 'active').length})
                </span>
                {invitations.filter((i) => i.status === 'active').length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 text-center">
                    No hay códigos de invitación activos en este momento.
                  </p>
                ) : (
                  invitations
                    .filter((i) => i.status === 'active')
                    .map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                              {inv.code}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${THEOCRATIC_ROLES[inv.role as TheocraticRole]?.badgeColor}`}>
                              {THEOCRATIC_ROLES[inv.role as TheocraticRole]?.shortName}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Para: <strong>{inv.targetName || 'Hermano Asignado'}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(inv.code);
                              setCopiedInvId(inv.id);
                              setTimeout(() => setCopiedInvId(null), 2000);
                            }}
                            className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedInvId === inv.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedInvId === inv.id ? 'Copiado' : 'Copiar'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => revokeInvitation(inv.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Revocar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Control de Acceso Teocrático • Kongre
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* SUB-MODAL: ASIGNAR ROL Y PIN A OTRO HERMANO */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Asignar Rol y PIN a un Hermano
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreatePublisherPinSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Seleccionar Hermano de la Congregación:
                </label>
                {publishers.length > 0 ? (
                  <select
                    value={newSelectedPublisherId}
                    onChange={(e) => {
                      setNewSelectedPublisherId(e.target.value);
                      if (e.target.value) {
                        const p = publishers.find((pub) => pub.id === e.target.value);
                        if (p) {
                          setNewCustomName(p.name);
                          if (p.theocraticRole) setNewRole(p.theocraticRole);
                        }
                      }
                    }}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="">-- Elegir de la lista de publicadores --</option>
                    {publishers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.privilege?.replace('_', ' ') || 'Publicador'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-slate-400 italic mb-2">No hay publicadores registrados aún.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  O escribir nombre completo del hermano:
                </label>
                <input
                  type="text"
                  placeholder="Ej: David Gómez"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Rol Teocrático a Asignar:
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as TheocraticRole)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  {roleList.map((rKey) => (
                    <option key={rKey} value={rKey}>
                      {THEOCRATIC_ROLES[rKey].name} ({THEOCRATIC_ROLES[rKey].shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    PIN Personal Único:
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPin(generateUniquePublisherPin())}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generar PIN único</span>
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Ej: 3829 (o pulsa generar)"
                  value={newPin}
                  onChange={(e) => {
                    setNewPin(e.target.value.replace(/\D/g, ''));
                    setAddError(null);
                  }}
                  className="w-full p-2.5 text-xs font-mono font-bold tracking-widest text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  El PIN es único para este hermano y activa su rol.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Asignar PIN al Hermano
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
