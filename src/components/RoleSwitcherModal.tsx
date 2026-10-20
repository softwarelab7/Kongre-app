// src/components/RoleSwitcherModal.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { useSecurity } from '../context/SecurityContext';
import { TheocraticRole, THEOCRATIC_ROLES } from '../utils/rbac';
import { generateSecurePublisherPin, formatCanonicalCongregationId, getSecureLocalPin } from '../utils/theocraticSecurity';
import { ActiveTab } from './Navbar';
import {
  ShieldCheck,
  Shield,
  Users,
  UserCheck,
  KeyRound,
  Sparkles,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  RefreshCw,
  X,
  Share2,
  Lock,
  UserPlus,
  Trash2,
  QrCode,
  Globe,
  Award,
  BookOpen,
  MapPin,
  CreditCard,
  Mic,
  Calendar,
  MessageSquare,
  Edit3,
} from 'lucide-react';

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
    currentBrotherName,
    publisherPinsList,
    identifyRoleByPersonalPin,
    assignPersonalPinToPublisher,
    removePublisherPin,
    generateUniquePublisherPin,
    isCoordinator,
    permissions,
  } = useAuth();

  const isAllowedAccess = permissions.canManageAccess || isCoordinator || activeRole === 'coordinador' || activeRole === 'anciano';

  useEffect(() => {
    if (isOpen && !isAllowedAccess) {
      setActiveTabMode('mi_sesion');
    }
  }, [isOpen, isAllowedAccess]);

  const { publishers, updatePublisher, settings } = useCongregation();
  const { invitations, createInvitation, revokeInvitation } = useSecurity();

  // Navigation tabs:
  // - 'directorio': Responsabilidades y PINs de los hermanos (Gestión principal)
  // - 'mi_sesion': Mi perfil actual, cambiar con PIN y simulación de roles
  // - 'nube_qr': Vinculación Google y Códigos QR
  const [activeTabMode, setActiveTabMode] = useState<'directorio' | 'mi_sesion' | 'nube_qr'>('directorio');

  // Search & category filter in the directory
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<
    'todos' | 'ancianos' | 'siervos' | 'publicadores' | 'sin_pin'
  >('todos');

  // PIN visibility state
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Verification PIN in "Mi Sesión"
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  // Edit publisher modal
  const [editingPublisher, setEditingPublisher] = useState<{
    id: string;
    name: string;
    role: TheocraticRole;
    pin: string;
    privilege?: string;
  } | null>(null);
  const [customPinInput, setCustomPinInput] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Add new publisher modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSelectedPublisherId, setNewSelectedPublisherId] = useState('');
  const [newCustomName, setNewCustomName] = useState('');
  const [newRole, setNewRole] = useState<TheocraticRole>('anciano');
  const [newPin, setNewPin] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Google Accounts state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [selectedRoleForEmail, setSelectedRoleForEmail] = useState<TheocraticRole>('anciano');

  // Quick invitation state
  const [invRole, setInvRole] = useState<TheocraticRole>('anciano');
  const [invBrotherName, setInvBrotherName] = useState('');
  const [copiedInvId, setCopiedInvId] = useState<string | null>(null);

  // Complete official list of 16 theocratic roles
  const allTheocraticRoles: TheocraticRole[] = [
    'coordinador',
    'anciano',
    'superintendente_vym',
    'superintendente_servicio',
    'secretario',
    'siervo_discursos',
    'siervo_territorios',
    'siervo_carritos',
    'siervo_literatura',
    'siervo_cuentas',
    'superintendente_grupo',
    'encargado_mantenimiento',
    'encargado_audiovideo',
    'encargado_acomodadores',
    'encargado_cartelera',
    'publico',
  ];

  // Combined Directory of Publishers with their unique PINs
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

    // 1. Process all registered congregation publishers
    publishers.forEach((pub) => {
      const pinRec = publisherPinsList.find(
        (rec) =>
          rec.publisherId === pub.id ||
          rec.name.toLowerCase().trim() === pub.name.toLowerCase().trim()
      );

      const assignedRole = pub.theocraticRole || pinRec?.role || (pub.privilege === 'anciano' ? 'anciano' : 'publico');
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

    // 2. Include designated coordinator if not already present
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

  // Filtered publishers
  const filteredPublishers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return combinedPublishersList.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.privilege && item.privilege.toLowerCase().includes(q)) ||
        (item.role && THEOCRATIC_ROLES[item.role]?.name.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterCategory === 'ancianos') {
        return (
          item.privilege === 'anciano' ||
          item.role === 'coordinador' ||
          item.role === 'anciano' ||
          item.role === 'secretario' ||
          item.role === 'superintendente_vym' ||
          item.role === 'superintendente_servicio' ||
          item.role === 'superintendente_grupo'
        );
      }
      if (filterCategory === 'siervos') {
        return (
          item.privilege === 'siervo_ministerial' ||
          item.role === 'siervo_territorios' ||
          item.role === 'siervo_carritos' ||
          item.role === 'siervo_literatura' ||
          item.role === 'siervo_cuentas' ||
          item.role === 'siervo_discursos' ||
          item.role === 'encargado_mantenimiento' ||
          item.role === 'encargado_audiovideo' ||
          item.role === 'encargado_acomodadores' ||
          item.role === 'encargado_cartelera'
        );
      }
      if (filterCategory === 'publicadores') {
        return item.role === 'publico' && item.privilege !== 'anciano' && item.privilege !== 'siervo_ministerial';
      }
      if (filterCategory === 'sin_pin') {
        return !item.pin;
      }

      return true;
    });
  }, [combinedPublishersList, searchTerm, filterCategory]);

  // Statistics
  const stats = useMemo(() => {
    const total = combinedPublishersList.length;
    const ancianosCount = combinedPublishersList.filter(
      (p) =>
        p.privilege === 'anciano' ||
        p.role === 'coordinador' ||
        p.role === 'anciano' ||
        p.role === 'secretario' ||
        p.role === 'superintendente_vym' ||
        p.role === 'superintendente_servicio' ||
        p.role === 'superintendente_grupo'
    ).length;
    const siervosCount = combinedPublishersList.filter(
      (p) =>
        p.privilege === 'siervo_ministerial' ||
        p.role === 'siervo_territorios' ||
        p.role === 'siervo_carritos' ||
        p.role === 'siervo_literatura' ||
        p.role === 'siervo_cuentas' ||
        p.role === 'siervo_discursos' ||
        p.role === 'encargado_mantenimiento' ||
        p.role === 'encargado_audiovideo' ||
        p.role === 'encargado_acomodadores' ||
        p.role === 'encargado_cartelera'
    ).length;
    const withPin = combinedPublishersList.filter((p) => !!p.pin).length;
    const withoutPin = total - withPin;
    return { total, ancianosCount, siervosCount, withPin, withoutPin };
  }, [combinedPublishersList]);

  if (!isOpen || !isAllowedAccess) return null;

  // Toggle PIN visibility
  const togglePinVisibility = (id: string) => {
    setVisiblePins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Quick 1-click role change
  const handleChangePublisherRole = (publisherId: string, newRoleValue: TheocraticRole) => {
    const item = combinedPublishersList.find((p) => p.publisherId === publisherId);
    if (!item) return;

    const pinToUse = item.pin || generateUniquePublisherPin();

    assignPersonalPinToPublisher(
      publisherId,
      pinToUse,
      newRoleValue,
      item.name,
      item.email,
      item.privilege
    );

    const matchingPub = publishers.find((p) => p.id === publisherId);
    if (matchingPub) {
      updatePublisher({
        ...matchingPub,
        theocraticRole: newRoleValue,
        personalPin: pinToUse,
      });
    }

    setFeedback(`Responsabilidad actualizada: ${item.name} es ahora ${THEOCRATIC_ROLES[newRoleValue]?.shortName}.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Quick 1-click PIN generation
  const handleGeneratePinForPublisher = (publisherId: string) => {
    const item = combinedPublishersList.find((p) => p.publisherId === publisherId);
    if (!item) return;

    const newGeneratedPin = generateUniquePublisherPin();
    assignPersonalPinToPublisher(
      publisherId,
      newGeneratedPin,
      item.role,
      item.name,
      item.email,
      item.privilege
    );

    const matchingPub = publishers.find((p) => p.id === publisherId);
    if (matchingPub) {
      updatePublisher({
        ...matchingPub,
        personalPin: newGeneratedPin,
        theocraticRole: item.role,
      });
    }

    setFeedback(`PIN único asignado a ${item.name}: ${newGeneratedPin}`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Revocar PIN y cerrar todas las sesiones del publicador (ej. teléfono perdido o robo)
  const handleRevokePinForPublisher = (publisherId: string) => {
    const item = combinedPublishersList.find((p) => p.publisherId === publisherId);
    if (!item) return;

    if (
      !confirm(
        `¿Deseas revocar el PIN de ${item.name}?\n\nAl revocarlo, se cerrarán inmediatamente todas las sesiones activas en teléfonos o navegadores de este hermano (por ejemplo, si extravió su teléfono). Nadie podrá acceder hasta que se le asigne un nuevo PIN.`
      )
    ) {
      return;
    }

    removePublisherPin(publisherId);

    const matchingPub = publishers.find((p) => p.id === publisherId);
    if (matchingPub) {
      updatePublisher({
        ...matchingPub,
        personalPin: '',
      });
    }

    setFeedback(`🔒 PIN revocado para ${item.name}. Todas las sesiones han sido cerradas.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Auto-generate PINs for all publishers who don't have one
  const handleAutoAssignAllMissingPins = () => {
    const missing = combinedPublishersList.filter((p) => !p.pin);
    if (missing.length === 0) {
      alert('Todos los publicadores ya tienen su PIN personal asignado.');
      return;
    }

    if (
      !confirm(
        `¿Deseas generar automáticamente un PIN personal único para los ${missing.length} publicadores que aún no tienen PIN?`
      )
    ) {
      return;
    }

    const takenPins = combinedPublishersList.map((p) => p.pin.trim()).filter(Boolean);
    let count = 0;

    missing.forEach((item) => {
      const pin = generateSecurePublisherPin(takenPins);
      takenPins.push(pin);

      assignPersonalPinToPublisher(
        item.publisherId,
        pin,
        item.role,
        item.name,
        item.email,
        item.privilege
      );

      const matchingPub = publishers.find((p) => p.id === item.publisherId);
      if (matchingPub) {
        updatePublisher({
          ...matchingPub,
          personalPin: pin,
          theocraticRole: item.role,
        });
      }
      count++;
    });

    setFeedback(`¡Se generaron ${count} PINs personales únicos exitosamente!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Format theocratic WhatsApp invitation message with 1-click Pocket link and composite code
  const getTheocraticShareMessage = (name: string, role: TheocraticRole, pin: string, id: string) => {
    const roleTitle = THEOCRATIC_ROLES[role]?.name || role;
    const congName = settings.congregationName || 'la Congregación';
    const congNumber = formatCanonicalCongregationId(
      settings.congregationNumber ||
        settings.congregationId ||
        (typeof window !== 'undefined' ? localStorage.getItem('kongre_congregation_number') || '' : '')
    );
    const congPin =
      typeof window !== 'undefined'
        ? getSecureLocalPin('kongre_registered_cong_pin') ||
          getSecureLocalPin('kongre_last_cong_pin') ||
          ''
        : '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams();
    if (congNumber) params.set('cong', congNumber);
    if (congPin) params.set('cpin', congPin);
    if (id) params.set('pub', id);
    if (pin) params.set('pin', pin);
    const directLink = congNumber && id && pin ? `${origin}/?${params.toString()}` : '';
    const compositeCode = congNumber && congPin && pin ? `${congNumber}::${congPin}::${pin}` : pin;

    return `🏛️ *CREDENCIALES TEOCRÁTICAS KONGRE*\n` +
      `Congregación: *${congName}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 Hermano: *${name}*\n` +
      `📋 Responsabilidad: *${roleTitle}*\n` +
      (congNumber ? `🏛️ ID Congregación: *${congNumber}*\n` : '') +
      (congPin ? `🔒 PIN Congregación: *${congPin}*\n` : '') +
      `🔑 Tu PIN Personal Único: *${pin}*\n` +
      `📋 Código Portátil: *${compositeCode}*\n` +
      (directLink ? `━━━━━━━━━━━━━━━━━━━━\n📲 *Enlace de Acceso Directo (un solo toque):*\n${directLink}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Abre el enlace o ingresa tus credenciales en Kongre para activar automáticamente tu perfil y departamentos asignados._`;
  };

  // Copy 1-click Pocket Direct Link to clipboard
  const handleCopyDirectLink = (name: string, _role: TheocraticRole, pin: string, id: string) => {
    const congNumber = formatCanonicalCongregationId(
      settings.congregationNumber ||
        settings.congregationId ||
        (typeof window !== 'undefined' ? localStorage.getItem('kongre_congregation_number') || '' : '')
    );
    const congPin =
      typeof window !== 'undefined'
        ? getSecureLocalPin('kongre_registered_cong_pin') ||
          getSecureLocalPin('kongre_last_cong_pin') ||
          ''
        : '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams();
    if (congNumber) params.set('cong', congNumber);
    if (congPin) params.set('cpin', congPin);
    if (id) params.set('pub', id);
    if (pin) params.set('pin', pin);
    const directLink = `${origin}/?${params.toString()}`;
    navigator.clipboard.writeText(directLink);
    setCopiedId(`link_${id}`);
    setTimeout(() => setCopiedId(null), 2500);
    setFeedback(`Enlace directo copiado para ${name}.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Copy or send by WhatsApp
  const handleShareWhatsApp = (name: string, role: TheocraticRole, pin: string, id: string) => {
    const msg = getTheocraticShareMessage(name, role, pin, id);
    navigator.clipboard.writeText(msg);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Verify PIN in "Mi Sesión"
  const handleVerifyPersonalPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    const cleanPin = enteredPin.trim();
    if (!cleanPin) {
      setPinError('Introduce tu PIN personal de 4 a 6 dígitos.');
      return;
    }

    const result = await identifyRoleByPersonalPin(cleanPin);
    if (result.success && result.role) {
      setPinSuccess(result.message);
      const roleInfo = THEOCRATIC_ROLES[result.role];
      if (!roleInfo.allowedTabs.includes(activeTab)) {
        setActiveTab(roleInfo.allowedTabs[0] || 'programacion');
      }
      setTimeout(() => {
        setPinSuccess(null);
        setEnteredPin('');
        onClose();
      }, 1200);
    } else {
      setPinError(result.message || 'PIN no encontrado o inválido.');
    }
  };

  // Simulator role selection (Coordinator only)
  const handleSelectRoleSimulation = (role: TheocraticRole) => {
    if (!isCoordinator && role !== 'publico') {
      alert('Solo el Coordinador puede simular manualmente roles sin PIN.');
      return;
    }
    setActiveRole(role);
    const roleInfo = THEOCRATIC_ROLES[role];
    if (!roleInfo.allowedTabs.includes(activeTab)) {
      setActiveTab(roleInfo.allowedTabs[0] || 'programacion');
    }
    setFeedback(`Vista cambiada: ahora estás probando el rol "${roleInfo.name}".`);
    setTimeout(() => {
      setFeedback(null);
      onClose();
    }, 1000);
  };

  // Add Google email
  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      alert('Introduce un correo electrónico válido');
      return;
    }
    assignRoleToEmail(newEmail.trim(), selectedRoleForEmail, newName.trim());
    setNewEmail('');
    setNewName('');
    setFeedback('Cuenta Google vinculada correctamente con su rol asignado.');
    setTimeout(() => setFeedback(null), 3000);
  };

  // Create temporary code
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await createInvitation(invRole, invBrotherName);
    setInvBrotherName('');
    setFeedback(`¡Código generado exitosamente: ${created.code}!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Submit custom edit
  const handleSaveCustomEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPublisher) return;
    setEditError(null);

    const pinToUse = customPinInput.trim();
    if (!pinToUse || pinToUse.length < 4) {
      setEditError('El PIN debe tener al menos 4 dígitos numéricos.');
      return;
    }

    const res = assignPersonalPinToPublisher(
      editingPublisher.id,
      pinToUse,
      editingPublisher.role,
      editingPublisher.name,
      undefined,
      editingPublisher.privilege
    );

    if (!res.success) {
      setEditError(res.message);
      return;
    }

    const matchingPub = publishers.find((p) => p.id === editingPublisher.id);
    if (matchingPub) {
      updatePublisher({
        ...matchingPub,
        personalPin: pinToUse,
        theocraticRole: editingPublisher.role,
      });
    }

    setEditingPublisher(null);
    setFeedback(`Credenciales actualizadas para ${editingPublisher.name}.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Submit new publisher PIN
  const handleCreateNewPublisherPin = (e: React.FormEvent) => {
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

    const matchingPub = publishers.find((p) => p.id === pubId);
    if (matchingPub) {
      updatePublisher({
        ...matchingPub,
        personalPin: pinToUse,
        theocraticRole: newRole,
      });
    }

    setShowAddModal(false);
    setNewCustomName('');
    setNewSelectedPublisherId('');
    setNewPin('');
    setFeedback(`¡PIN y rol asignados a ${pubName}!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Get icon for role
  const getRoleIcon = (roleId: TheocraticRole) => {
    switch (roleId) {
      case 'coordinador':
        return <Award className="w-4 h-4" />;
      case 'anciano':
        return <Shield className="w-4 h-4" />;
      case 'superintendente_vym':
        return <BookOpen className="w-4 h-4" />;
      case 'secretario':
        return <Users className="w-4 h-4" />;
      case 'siervo_territorios':
        return <MapPin className="w-4 h-4" />;
      case 'siervo_cuentas':
        return <CreditCard className="w-4 h-4" />;
      case 'siervo_discursos':
        return <Mic className="w-4 h-4" />;
      case 'siervo_literatura':
        return <Calendar className="w-4 h-4" />;
      default:
        return <UserCheck className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Main Dialog */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-linear-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-white shadow-inner shrink-0">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/20">
                  Gestión Teocrática
                </span>
                <span className="text-xs text-indigo-300">
                  {settings.congregationName || 'Congregación'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Roles Teocráticos y PINs de Acceso
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs">
              <span className="text-indigo-200">Activo:</span>
              <strong className="text-white font-bold">{currentBrotherName || 'Usuario'}</strong>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${effectiveRoleInfo.badgeColor}`}>
                {effectiveRoleInfo.shortName}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top 3 Navigation Tabs */}
        <div className="px-6 pt-3 pb-2.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="inline-flex p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl text-xs font-semibold gap-1 shrink-0">
            {isCoordinator && (
              <button
                type="button"
                onClick={() => setActiveTabMode('directorio')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTabMode === 'directorio'
                    ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                <span>Responsabilidades y PINs</span>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold">
                  {stats.total}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTabMode('mi_sesion')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTabMode === 'mi_sesion'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
              <span>Mi Sesión / Cambiar con PIN</span>
            </button>

            {isCoordinator && (
              <button
                type="button"
                onClick={() => setActiveTabMode('nube_qr')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTabMode === 'nube_qr'
                    ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                <span>Cuentas Nube & QR</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
            {activeTabMode === 'directorio' && 'Asigna cargos y PINs a cada hermano'}
            {activeTabMode === 'mi_sesion' && 'Ingresa tu PIN personal o prueba roles'}
            {activeTabMode === 'nube_qr' && 'Vincula cuentas Google e invitaciones'}
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* ========================================================================= */}
          {/* TAB 1: DIRECTORIO DE RESPONSABILIDADES Y PINS */}
          {/* ========================================================================= */}
          {activeTabMode === 'directorio' && (
            <div className="space-y-4">
              {/* Theocratic Guide Banner */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <h4 className="font-extrabold text-xs text-indigo-950 dark:text-indigo-200">
                      Asignación de Responsabilidades Teocráticas
                    </h4>
                  </div>
                  <p className="text-xs text-indigo-900/80 dark:text-indigo-300/80 leading-relaxed">
                    Cada hermano tiene su propio <strong>PIN personal único</strong>. Al ingresar con su PIN, Kongre le activa automáticamente solo los departamentos asignados a su cargo (Secretaría, Territorios, Cuentas, etc.).
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {stats.withoutPin > 0 && (
                    <button
                      type="button"
                      onClick={handleAutoAssignAllMissingPins}
                      className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                      title="Generar PIN único a quienes no tienen"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto-asignar ({stats.withoutPin})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Asignar Hermano</span>
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Ancianos</span>
                    <strong className="text-sm text-slate-900 dark:text-white font-extrabold">{stats.ancianosCount}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Siervos Min.</span>
                    <strong className="text-sm text-slate-900 dark:text-white font-extrabold">{stats.siervosCount}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Con PIN Activo</span>
                    <strong className="text-sm text-slate-900 dark:text-white font-extrabold">{stats.withPin}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    stats.withoutPin > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Sin PIN</span>
                    <strong className="text-sm text-slate-900 dark:text-white font-extrabold">{stats.withoutPin}</strong>
                  </div>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar hermano por nombre o responsabilidad asignada..."
                    className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold py-0.5">
                  <button
                    type="button"
                    onClick={() => setFilterCategory('todos')}
                    className={`px-3 py-2 rounded-xl shrink-0 cursor-pointer transition-colors ${
                      filterCategory === 'todos'
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Todos ({combinedPublishersList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory('ancianos')}
                    className={`px-3 py-2 rounded-xl shrink-0 cursor-pointer transition-colors ${
                      filterCategory === 'ancianos'
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Ancianos ({stats.ancianosCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory('siervos')}
                    className={`px-3 py-2 rounded-xl shrink-0 cursor-pointer transition-colors ${
                      filterCategory === 'siervos'
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Siervos Min. ({stats.siervosCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterCategory('sin_pin')}
                    className={`px-3 py-2 rounded-xl shrink-0 cursor-pointer transition-colors ${
                      filterCategory === 'sin_pin'
                        ? 'bg-amber-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Sin PIN ({stats.withoutPin})
                  </button>
                </div>
              </div>

              {/* Publishers List */}
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {filteredPublishers.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      No se encontraron hermanos con ese criterio de búsqueda.
                    </p>
                  </div>
                ) : (
                  filteredPublishers.map((item) => {
                    const roleInfo = THEOCRATIC_ROLES[item.role] || THEOCRATIC_ROLES.publico;
                    const isVisible = visiblePins[item.publisherId] || false;
                    const hasPin = item.hasPin;

                    return (
                      <div
                        key={item.publisherId}
                        className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        {/* 1. Identity & Name */}
                        <div className="flex items-center gap-3 min-w-0 md:w-1/3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-extrabold text-xs shadow-2xs shrink-0">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 capitalize">
                                {item.privilege?.replace('_', ' ') || 'Publicador'}
                              </span>
                              {item.email && (
                                <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                                  • {item.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 2. Theocratic Role Selector */}
                        <div className="md:w-1/3">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Responsabilidad Asignada:
                          </label>
                          <div className="relative">
                            <select
                              value={item.role}
                              onChange={(e) => handleChangePublisherRole(item.publisherId, e.target.value as TheocraticRole)}
                              className="w-full pl-3 pr-8 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                            >
                              {allTheocraticRoles.map((rKey) => (
                                <option key={rKey} value={rKey}>
                                  {THEOCRATIC_ROLES[rKey].name} ({THEOCRATIC_ROLES[rKey].shortName})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* 3. Personal PIN & Share Action */}
                        <div className="flex items-center justify-between md:justify-end gap-2 md:w-1/3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                          {hasPin ? (
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                              <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <span className="font-mono font-black text-xs sm:text-sm text-indigo-700 dark:text-indigo-300 tracking-wider">
                                {item.pin ? (isVisible ? item.pin : '••••') : '🔒 Hash'}
                              </span>

                              {item.pin && (
                                <button
                                  type="button"
                                  onClick={() => togglePinVisibility(item.publisherId)}
                                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                  title={isVisible ? 'Ocultar PIN' : 'Ver PIN'}
                                >
                                  {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleGeneratePinForPublisher(item.publisherId)}
                                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                                title="Generar otro PIN aleatorio"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRevokePinForPublisher(item.publisherId)}
                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                                title="Revocar PIN y cerrar sesiones activas (teléfono perdido)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleGeneratePinForPublisher(item.publisherId)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>+ Generar PIN</span>
                            </button>
                          )}

                          {item.pin && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyDirectLink(item.name, item.role, item.pin, item.publisherId)}
                                className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                title="Copiar enlace directo de publicador (un solo toque)"
                              >
                                {copiedId === `link_${item.publisherId}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                )}
                                <span className="hidden sm:inline">Enlace</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleShareWhatsApp(item.name, item.role, item.pin, item.publisherId)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                                title="Copiar y enviar por WhatsApp"
                              >
                                {copiedId === item.publisherId ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                )}
                                <span className="hidden sm:inline">WhatsApp</span>
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setEditingPublisher(item);
                              setCustomPinInput(item.pin || generateUniquePublisherPin());
                              setEditError(null);
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Personalizar datos o PIN a mano"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MI SESIÓN Y CAMBIO CON PIN */}
          {/* ========================================================================= */}
          {activeTabMode === 'mi_sesion' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Current Active User Status Card */}
              <div className="p-5 rounded-3xl bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-base shadow-md shrink-0">
                    {(currentBrotherName || 'H').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">
                      Identidad Actual en esta Pantalla
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                      {currentBrotherName || 'Modo Público / Cartelera'}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {effectiveRoleInfo.name}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-end gap-1.5 shrink-0">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-2xs ${effectiveRoleInfo.badgeColor}`}>
                    {effectiveRoleInfo.shortName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {effectiveRoleInfo.allowedTabs.length} módulos habilitados
                  </span>
                </div>
              </div>

              {/* Enter Personal PIN Form */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    Ingresar con PIN de Publicador
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Si eres un hermano con responsabilidades o deseas acceder a tu portal personal de publicador, introduce tu PIN de 4 a 6 dígitos aquí:
                  </p>
                </div>

                {pinError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold text-center">
                    {pinError}
                  </div>
                )}

                {pinSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold text-center">
                    {pinSuccess}
                  </div>
                )}

                <form onSubmit={handleVerifyPersonalPin} className="space-y-3.5 max-w-xs mx-auto">
                  <input
                    type="password"
                    maxLength={6}
                    value={enteredPin}
                    onChange={(e) => {
                      setEnteredPin(e.target.value.replace(/\D/g, ''));
                      setPinError(null);
                    }}
                    placeholder="••••"
                    className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 font-mono font-black text-center tracking-widest text-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/30"
                    autoFocus
                  />

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Activar Mi Perfil</span>
                  </button>
                </form>
              </div>

              {/* Coordinator Simulation Box */}
              {isCoordinator && (
                <div className="space-y-3 pt-2">
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                        Herramienta de Coordinador: Simulación de Vistas Teocráticas
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Toca un rol para probar cómo ve la aplicación cada hermano de la congregación:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {allTheocraticRoles.map((rKey) => {
                      const r = THEOCRATIC_ROLES[rKey];
                      const isCurrentActive = activeRole === rKey;

                      return (
                        <button
                          key={rKey}
                          type="button"
                          onClick={() => handleSelectRoleSimulation(rKey)}
                          className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                            isCurrentActive
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 ${r.badgeColor}`}>
                              {getRoleIcon(rKey)}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">
                                {r.shortName}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {r.allowedTabs.length} pestañas
                              </span>
                            </div>
                          </div>

                          {isCurrentActive && (
                            <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: CUENTAS NUBE (GOOGLE) Y CÓDIGOS QR */}
          {/* ========================================================================= */}
          {activeTabMode === 'nube_qr' && isCoordinator && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Google Accounts Section */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    <span>Vinculación de Cuentas de Correo Google</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Cuando un hermano inicie sesión con su correo de Google, Kongre le asignará automáticamente este rol permanente.
                  </p>
                </div>

                <form onSubmit={handleAddEmail} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
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
                  <div className="flex gap-2">
                    <select
                      value={selectedRoleForEmail}
                      onChange={(e) => setSelectedRoleForEmail(e.target.value as TheocraticRole)}
                      className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                    >
                      {allTheocraticRoles.map((rKey) => (
                        <option key={rKey} value={rKey}>
                          {THEOCRATIC_ROLES[rKey].shortName}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                {/* Mapped accounts list */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Cuentas Mapeadas ({userRolesList.length})
                  </span>
                  {userRolesList.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-3 text-center">
                      No hay cuentas Google vinculadas aún.
                    </p>
                  ) : (
                    userRolesList.map((rec) => (
                      <div
                        key={rec.email}
                        className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-900/40"
                      >
                        <div>
                          <strong className="text-slate-900 dark:text-white block">{rec.name}</strong>
                          <span className="text-[11px] text-slate-400 font-mono">{rec.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${THEOCRATIC_ROLES[rec.role]?.badgeColor}`}>
                            {THEOCRATIC_ROLES[rec.role]?.shortName}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeRoleFromEmail(rec.email)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Eliminar vinculación"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Temporary Codes / QR Section */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    <span>Invitaciones por Código Temporal</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Genera un código temporal para compartir con un hermano nuevo o visitante sin requerir PIN fijo.
                  </p>
                </div>

                <form onSubmit={handleCreateInvitation} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                  <input
                    type="text"
                    placeholder="Nombre del hermano invitado"
                    value={invBrotherName}
                    onChange={(e) => setInvBrotherName(e.target.value)}
                    required
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                  <div className="flex gap-2">
                    <select
                      value={invRole}
                      onChange={(e) => setInvRole(e.target.value as TheocraticRole)}
                      className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                    >
                      {allTheocraticRoles.map((rKey) => (
                        <option key={rKey} value={rKey}>
                          {THEOCRATIC_ROLES[rKey].name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 cursor-pointer"
                    >
                      Generar
                    </button>
                  </div>
                </form>

                {/* Active codes */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Códigos Activos ({invitations.filter((i) => i.status === 'active').length})
                  </span>
                  {invitations.filter((i) => i.status === 'active').length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-3 text-center">
                      No hay invitaciones activas en este momento.
                    </p>
                  ) : (
                    invitations
                      .filter((i) => i.status === 'active')
                      .map((inv) => {
                        const congNumber = formatCanonicalCongregationId(
                          settings.congregationNumber ||
                            settings.congregationId ||
                            (typeof window !== 'undefined' ? localStorage.getItem('kongre_congregation_number') || '' : '')
                        );
                        const congPin =
                          typeof window !== 'undefined'
                            ? localStorage.getItem('kongre_registered_cong_pin') ||
                              localStorage.getItem('kongre_last_cong_pin') ||
                              ''
                            : '';
                        const portableCode = congNumber && congPin ? `${congNumber}::${congPin}::${inv.code}` : inv.code;
                        const params = new URLSearchParams();
                        params.set('invite', inv.code);
                        if (congNumber) params.set('cong', congNumber);
                        if (congPin) params.set('cpin', congPin);
                        const directInviteUrl = `${window.location.origin}/?${params.toString()}#portal?view=invite_code_login`;

                        return (
                          <div
                            key={inv.id}
                            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-extrabold text-xs sm:text-sm text-indigo-600 dark:text-indigo-400">
                                  {portableCode}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${THEOCRATIC_ROLES[inv.role as TheocraticRole]?.badgeColor}`}>
                                  {THEOCRATIC_ROLES[inv.role as TheocraticRole]?.shortName}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 block mt-0.5">
                                Para: <strong>{inv.targetName || 'Hermano Asignado'}</strong>
                              </span>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(portableCode);
                                  setCopiedInvId(inv.id);
                                  setTimeout(() => setCopiedInvId(null), 2000);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
                              >
                                {copiedInvId === inv.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedInvId === inv.id ? 'Copiado' : 'Copiar'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const roleTitle = THEOCRATIC_ROLES[inv.role as TheocraticRole]?.name || inv.role;
                                  const msg = `Estimado hermano *${inv.targetName || ''}*, se le ha otorgado acceso teocrático a *${settings.congregationName || 'la congregación'}* con el rol de *${roleTitle}*.\n\nCódigo Portátil de Invitación: *${portableCode}*\n\nToque el siguiente enlace para activar automáticamente la aplicación en su dispositivo:\n${directInviteUrl}`;
                                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                                title="Compartir por WhatsApp"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
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
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Kongre • Seguridad y Asignaciones Teocráticas
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>

      {/* EDIT MODAL: PERSONALIZAR PIN O ROL DE UN HERMANO */}
      {editingPublisher && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setEditingPublisher(null)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Editar Credenciales de {editingPublisher.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingPublisher(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveCustomEdit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Responsabilidad Teocrática:
                </label>
                <select
                  value={editingPublisher.role}
                  onChange={(e) =>
                    setEditingPublisher({ ...editingPublisher, role: e.target.value as TheocraticRole })
                  }
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  {allTheocraticRoles.map((rKey) => (
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
                    onClick={() => setCustomPinInput(generateUniquePublisherPin())}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generar aleatorio</span>
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={customPinInput}
                  onChange={(e) => {
                    setCustomPinInput(e.target.value.replace(/\D/g, ''));
                    setEditError(null);
                  }}
                  placeholder="Ej: 2048"
                  className="w-full p-2.5 text-xs font-mono font-bold tracking-widest text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPublisher(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MODAL: ASIGNAR ROL Y PIN A OTRO HERMANO */}
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
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
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

            <form onSubmit={handleCreateNewPublisherPin} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Elegir de la lista de publicadores:
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
                    <option value="">-- Seleccionar hermano --</option>
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
                  O escribir nombre completo:
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
                  Responsabilidad a Asignar:
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as TheocraticRole)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  {allTheocraticRoles.map((rKey) => (
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
                    <Sparkles className="w-3.5 h-3.5" />
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
