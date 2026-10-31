// src/components/RolesManagerTab.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import { useSecurity } from '../context/SecurityContext';
import { TheocraticRole, THEOCRATIC_ROLES, checkCredentialChange, checkEmailRoleLink, getAssignableRoles, canRevealPinOf } from '../utils/rbac';
import {
  generateSecurePublisherPin,
  formatCanonicalCongregationId,
  getSecureLocalPin,
  encodeSecureShareToken,
} from '../utils/theocraticSecurity';
import { insertAuditLog } from '../services/auditLogService';
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
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  Info,
} from 'lucide-react';

interface RolesManagerTabProps {
  setActiveTab: (tab: ActiveTab) => void;
  onBack?: () => void;
}

export const RolesManagerTab: React.FC<RolesManagerTabProps> = ({ setActiveTab, onBack }) => {
  const {
    activeRole,
    activeRoles,
    currentPublisherId,
    setActiveRole,
    effectiveRoleInfo,
    currentBrotherName,
    publisherPinsList,
    identifyRoleByPersonalPin,
    assignPersonalPinToPublisher,
    removePublisherPin,
    generateUniquePublisherPin,
    isCoordinator,
    permissions,
    signOutUser,
  } = useAuth();

  const isAllowedAccess =
    permissions.canManageAccess || isCoordinator || activeRole === 'coordinador' || activeRole === 'anciano';

  const {
    publishers,
    updatePublisher,
    settings,
    accountLinkRequests,
    approveAccountLinkRequest,
    rejectAccountLinkRequest,
  } = useCongregation();

  const { invitations, createInvitation, revokeInvitation, lockSession } = useSecurity();

  // Navigation tab modes:
  // - 'directorio': Responsabilidades y PINs de los hermanos (Gestión principal)
  // - 'mi_sesion': Mi perfil actual, cambiar con PIN y simulación de roles
  // - 'nube_qr': Vinculación Google y Códigos QR
  // - 'matriz': Matriz de Permisos Teocráticos por Roles
  const [activeTabMode, setActiveTabMode] = useState<'directorio' | 'mi_sesion' | 'nube_qr' | 'matriz'>('directorio');

  useEffect(() => {
    if (!isAllowedAccess && activeTabMode === 'directorio') {
      setActiveTabMode('mi_sesion');
    }
  }, [isAllowedAccess, activeTabMode]);

  // Search & category filter in the directory
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<
    'todos' | 'ancianos' | 'siervos' | 'publicadores' | 'con_pin' | 'sin_pin'
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

  // Quick invitation state
  const [invRole, setInvRole] = useState<TheocraticRole>('anciano');
  const [invBrotherName, setInvBrotherName] = useState('');

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
        hasPin: boolean;
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
      const assignedPinHash = pub.personalPinHash || pinRec?.pinHash || '';

      map.set(pub.id, {
        id: pub.id,
        publisherId: pub.id,
        name: pub.name,
        role: assignedRole,
        pin: assignedPin,
        hasPin: Boolean(assignedPin || assignedPinHash),
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
        const cPin = pinRec?.pin || '';
        const cHash = pinRec?.pinHash || '';
        map.set('coord_principal', {
          id: 'coord_principal',
          publisherId: 'coord_principal',
          name: coordName,
          role: 'coordinador',
          pin: cPin,
          hasPin: Boolean(cPin || cHash),
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
      if (filterCategory === 'con_pin') {
        return item.hasPin;
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

  // Pending link requests count
  const pendingRequestsCount = (accountLinkRequests || []).filter((r) => r.status === 'pending').length;

  // Toggle PIN visibility
  const togglePinVisibility = (id: string) => {
    setVisiblePins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Quick 1-click role change
  // ── Política de administración de accesos (reglas en utils/rbac.ts) ───────────────────
  const actorRoles: TheocraticRole[] = activeRoles && activeRoles.length > 0 ? activeRoles : [activeRole];
  const policyGuard = (
    target: { publisherId?: string; role?: string; privilege?: string },
    newRole?: TheocraticRole
  ): boolean => {
    const decision = checkCredentialChange({
      actorRoles,
      actorPublisherId: currentPublisherId,
      target: { publisherId: target.publisherId, currentRole: target.role, privilege: target.privilege },
      newRole,
    });
    if (!decision.allowed) {
      setFeedback(`🚫 ${decision.reason}`);
      setTimeout(() => setFeedback(null), 4000);
    }
    return decision.allowed;
  };
  const canRevealPin = (item: { publisherId: string; role: TheocraticRole; privilege?: string }) =>
    canRevealPinOf(
      actorRoles,
      { publisherId: item.publisherId, currentRole: item.role, privilege: item.privilege },
      currentPublisherId
    );
  const roleOptionsGeneric = allTheocraticRoles.filter((r) => checkEmailRoleLink(actorRoles, r).allowed);
  const roleOptionsFor = (item: { publisherId: string; role: TheocraticRole; privilege?: string }) =>
    getAssignableRoles(
      actorRoles,
      { publisherId: item.publisherId, currentRole: item.role, privilege: item.privilege },
      currentPublisherId
    );
  const denyReveal = () => {
    setFeedback('🚫 No tienes permiso para ver ni compartir el PIN de este hermano.');
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleChangePublisherRole = (publisherId: string, newRoleValue: TheocraticRole) => {
    if (!isAllowedAccess) return;
    const item = combinedPublishersList.find((p) => p.publisherId === publisherId);
    if (!item) return;
    if (!policyGuard({ publisherId, role: item.role, privilege: item.privilege }, newRoleValue)) return;

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

    insertAuditLog({
      accion: 'CAMBIO_ROL_PUBLICADOR',
      modulo: 'seguridad',
      hermano_nid: publisherId,
      hermano_nombre: currentBrotherName || THEOCRATIC_ROLES[activeRole]?.shortName || 'Sin identificar',
      detalles: `Rol de ${item.name} actualizado a ${THEOCRATIC_ROLES[newRoleValue]?.shortName || newRoleValue}`,
    }).catch(() => {});

    setFeedback(`Responsabilidad actualizada: ${item.name} es ahora ${THEOCRATIC_ROLES[newRoleValue]?.shortName}.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Quick 1-click PIN generation
  const handleGeneratePinForPublisher = (publisherId: string) => {
    if (!isAllowedAccess) return;
    const item = combinedPublishersList.find((p) => p.publisherId === publisherId);
    if (!item) return;
    if (!policyGuard({ publisherId, role: item.role, privilege: item.privilege })) return;

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

    insertAuditLog({
      accion: 'GENERAR_PIN_PUBLICADOR',
      modulo: 'seguridad',
      hermano_nid: publisherId,
      hermano_nombre: currentBrotherName || THEOCRATIC_ROLES[activeRole]?.shortName || 'Sin identificar',
      detalles: `Nuevo PIN personal generado para ${item.name}`,
    }).catch(() => {});

    setFeedback(`PIN único asignado a ${item.name}: ${newGeneratedPin}`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Revoke PIN
  const handleRevokePinForPublisher = (publisherId: string) => {
    if (!isAllowedAccess) return;
    const item = combinedPublishersList.find((p) => p.publisherId === publisherId);
    if (!item) return;
    if (!policyGuard({ publisherId, role: item.role, privilege: item.privilege })) return;

    removePublisherPin(publisherId);

    const matchingPub = publishers.find((p) => p.id === publisherId);
    if (matchingPub) {
      updatePublisher({
        ...matchingPub,
        personalPin: '',
      });
    }

    insertAuditLog({
      accion: 'REVOCAR_PIN_PUBLICADOR',
      modulo: 'seguridad',
      hermano_nid: publisherId,
      hermano_nombre: currentBrotherName || THEOCRATIC_ROLES[activeRole]?.shortName || 'Sin identificar',
      detalles: `PIN revocado y sesiones cerradas para ${item.name}`,
    }).catch(() => {});

    setFeedback(`🔒 PIN revocado para ${item.name}. Todas las sesiones han sido cerradas.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Auto-generate PINs for all publishers who don't have one
  const handleAutoAssignAllMissingPins = () => {
    if (!isAllowedAccess) return;
    const missing = combinedPublishersList.filter(
      (p) =>
        !p.pin &&
        checkCredentialChange({
          actorRoles,
          actorPublisherId: currentPublisherId,
          target: { publisherId: p.publisherId, currentRole: p.role, privilege: p.privilege },
        }).allowed
    );
    if (missing.length === 0) {
      setFeedback('Todos los publicadores ya tienen su PIN personal asignado.');
      setTimeout(() => setFeedback(null), 3000);
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

    insertAuditLog({
      accion: 'AUTO_ASIGNAR_PINS_MASIVO',
      modulo: 'seguridad',
      hermano_nid: 'directorio',
      hermano_nombre: currentBrotherName || THEOCRATIC_ROLES[activeRole]?.shortName || 'Sin identificar',
      detalles: `Generación masiva de ${count} PINs personales únicos`,
    }).catch(() => {});

    setFeedback(`¡Se generaron ${count} PINs personales únicos exitosamente!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Format theocratic WhatsApp invitation message
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
    const token = encodeSecureShareToken({
      cong: congNumber || undefined,
      pub: id || undefined,
    });
    const directLink =
      congNumber && id && pin
        ? token
          ? `${origin}/?tk=${encodeURIComponent(token)}`
          : `${origin}/?cong=${encodeURIComponent(congNumber)}&pub=${encodeURIComponent(id)}`
        : '';
    const compositeCode = token;

    return (
      `🏛️ *CREDENCIALES TEOCRÁTICAS KONGRE*\n` +
      `Congregación: *${congName}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 Hermano: *${name}*\n` +
      `📋 Responsabilidad: *${roleTitle}*\n` +
      (congNumber ? `🏛️ ID Congregación: *${congNumber}*\n` : '') +
      `🔒 Tu PIN personal y el PIN de la congregación te los entrega un anciano por separado (en persona o por llamada). No se envían por mensaje.\n` +
      `📋 Código Portátil Cifrado: *${compositeCode}*\n` +
      (directLink ? `━━━━━━━━━━━━━━━━━━━━\n📲 *Enlace de Acceso Directo (un solo toque):*\n${directLink}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_Abre el enlace o ingresa tus credenciales en Kongre para activar automáticamente tu perfil y departamentos asignados._`
    );
  };

  // Copy 1-click Pocket Direct Link to clipboard
  const handleCopyDirectLink = (name: string, _role: TheocraticRole, pin: string, id: string) => {
    const revealTarget = combinedPublishersList.find((p) => p.publisherId === id);
    if (revealTarget && !canRevealPin(revealTarget)) return denyReveal();
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
    const token = encodeSecureShareToken({
      cong: congNumber || undefined,
      pub: id || undefined,
    });
    const directLink = token
      ? `${origin}/?tk=${encodeURIComponent(token)}`
      : `${origin}/?cong=${encodeURIComponent(congNumber)}&pub=${encodeURIComponent(id)}`;
    navigator.clipboard.writeText(directLink);
    setCopiedId(`link_${id}`);
    setTimeout(() => setCopiedId(null), 2500);
    setFeedback(`Enlace directo cifrado copiado para ${name}.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Share via WhatsApp
  const handleShareWhatsApp = (name: string, role: TheocraticRole, pin: string, id: string) => {
    const revealTarget = combinedPublishersList.find((p) => p.publisherId === id);
    if (revealTarget && !canRevealPin(revealTarget)) return denyReveal();
    const msg = getTheocraticShareMessage(name, role, pin, id);
    navigator.clipboard.writeText(msg);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();

    setFeedback(`Mensaje oficial copiado y WhatsApp abierto para ${name}.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Add new publisher with role & PIN
  const handleCreateNewPublisherPin = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    let brotherName = newCustomName.trim();
    let publisherId = newSelectedPublisherId || `ext_${Date.now()}`;
    let brotherPrivilege: string | undefined = undefined;

    if (newSelectedPublisherId) {
      const selectedPub = publishers.find((p) => p.id === newSelectedPublisherId);
      if (selectedPub) {
        brotherName = selectedPub.name;
        brotherPrivilege = selectedPub.privilege;
      }
    }

    if (!brotherName) {
      setAddError('Por favor selecciona un hermano o escribe su nombre.');
      return;
    }

    const cleanPin = newPin.trim();
    if (!cleanPin || cleanPin.length < 4) {
      setAddError('El PIN debe tener al menos 4 dígitos.');
      return;
    }

    const existingRoleForNew = combinedPublishersList.find((p) => p.publisherId === publisherId)?.role;
    if (!policyGuard({ publisherId, role: existingRoleForNew, privilege: brotherPrivilege }, newRole)) return;

    assignPersonalPinToPublisher(publisherId, cleanPin, newRole, brotherName, undefined, brotherPrivilege);

    if (newSelectedPublisherId) {
      const matchingPub = publishers.find((p) => p.id === newSelectedPublisherId);
      if (matchingPub) {
        updatePublisher({
          ...matchingPub,
          theocraticRole: newRole,
          personalPin: cleanPin,
        });
      }
    }

    insertAuditLog({
      accion: 'ASIGNAR_ROL_MANUAL',
      modulo: 'seguridad',
      hermano_nid: publisherId,
      hermano_nombre: currentBrotherName || THEOCRATIC_ROLES[activeRole]?.shortName || 'Sin identificar',
      detalles: `Asignación de ${THEOCRATIC_ROLES[newRole]?.name} a ${brotherName} con PIN ${cleanPin}`,
    }).catch(() => {});

    setShowAddModal(false);
    setNewSelectedPublisherId('');
    setNewCustomName('');
    setNewPin('');
    setFeedback(`¡Hermano ${brotherName} asignado como ${THEOCRATIC_ROLES[newRole]?.shortName} exitosamente!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Save custom edit
  const handleSaveCustomEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPublisher) return;
    setEditError(null);

    const cleanPin = customPinInput.trim();
    if (cleanPin && cleanPin.length < 4) {
      setEditError('El PIN debe tener al menos 4 dígitos.');
      return;
    }

    const existingForEdit = combinedPublishersList.find((p) => p.publisherId === editingPublisher.id);
    if (
      !policyGuard(
        { publisherId: editingPublisher.id, role: existingForEdit?.role, privilege: editingPublisher.privilege ?? existingForEdit?.privilege },
        editingPublisher.role
      )
    )
      return;

    assignPersonalPinToPublisher(
      editingPublisher.id,
      cleanPin,
      editingPublisher.role,
      editingPublisher.name,
      undefined,
      editingPublisher.privilege
    );

    const matchingPub = publishers.find((p) => p.id === editingPublisher.id);
    if (matchingPub) {
      updatePublisher({
        ...matchingPub,
        theocraticRole: editingPublisher.role,
        personalPin: cleanPin,
      });
    }

    insertAuditLog({
      accion: 'EDITAR_CREDENCIALES_HERMANO',
      modulo: 'seguridad',
      hermano_nid: editingPublisher.id,
      hermano_nombre: currentBrotherName || THEOCRATIC_ROLES[activeRole]?.shortName || 'Sin identificar',
      detalles: `Actualizadas credenciales de ${editingPublisher.name}: Rol ${THEOCRATIC_ROLES[editingPublisher.role]?.shortName}`,
    }).catch(() => {});

    setEditingPublisher(null);
    setFeedback(`Credenciales actualizadas para ${editingPublisher.name}.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Session verification PIN handler
  const handleVerifySessionPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    const clean = enteredPin.trim();
    if (!clean) {
      setPinError('Por favor ingresa un PIN.');
      return;
    }

    const identified = await identifyRoleByPersonalPin(clean);
    if (!identified.success || !identified.role) {
      setPinError(identified.message || 'PIN no reconocido o no asignado a ningún hermano.');
      return;
    }

    setActiveRole(identified.role);
    setPinSuccess(
      `¡Bienvenido, hermano ${identified.name || 'hermano'}! Se activó tu rol de ${THEOCRATIC_ROLES[identified.role]?.name || identified.role}.`
    );
    setEnteredPin('');
    setTimeout(() => setPinSuccess(null), 4000);
  };

  // Create quick invitation
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invBrotherName.trim()) return;
    const inviteDecision = checkEmailRoleLink(actorRoles, invRole);
    if (!inviteDecision.allowed) {
      setFeedback(`🚫 ${inviteDecision.reason}`);
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    try {
      const inv = await createInvitation(invRole, invBrotherName.trim(), 7);
      setInvBrotherName('');
      setFeedback(`Invitación creada para ${inv.targetName || 'el hermano'} con código: ${inv.code}`);
      setTimeout(() => setFeedback(null), 3500);
    } catch {
      setFeedback('Error al generar la invitación.');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12">
      {/* Barra de Sesión y Acciones de Roles (Unified Container) */}
      <div className="bg-white dark:bg-[#121216] p-3.5 sm:p-4 rounded-xl border border-zinc-200 dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
            Seguridad Teocrática
          </span>
          <span className="text-xs font-medium text-zinc-500 dark:text-[#A1A1AA] hidden sm:inline">
            Roles de departamento y claves personales (PINs)
          </span>
        </div>

        {/* Active Brother Session Capsule */}
        <div className="p-2 sm:px-3 sm:py-2 rounded-xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] flex items-center justify-between sm:justify-start gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xs shrink-0">
            {(currentBrotherName || 'H')[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 pr-1 text-left">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-[#F4F4F5] truncate max-w-[150px]">
              {currentBrotherName || 'Usuario'}
            </h4>
            <div className="flex items-center gap-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${effectiveRoleInfo.badgeColor}`}>
                {effectiveRoleInfo.shortName}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTabMode('mi_sesion')}
            className="p-1.5 rounded-xl bg-white hover:bg-zinc-100 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] transition-colors cursor-pointer border border-zinc-200/60 dark:border-[#27272A]"
            title="Cambiar sesión o ingresar PIN"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating feedback message */}
      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-md animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-white/20 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. STATS KPI CARDS (ACTING AS INSTANT FILTERS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Hermanos */}
        <div
          onClick={() => {
            setFilterCategory('todos');
            setActiveTabMode('directorio');
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
            filterCategory === 'todos' && activeTabMode === 'directorio'
              ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/20'
              : 'bg-white dark:bg-[#121216] border-zinc-200 dark:border-[#27272A] hover:border-indigo-300 dark:hover:border-indigo-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA] uppercase tracking-wider">
              Hermanos
            </span>
            <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <strong className="text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">{stats.total}</strong>
            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
              Ver todos →
            </span>
          </div>
        </div>

        {/* Ancianos */}
        <div
          onClick={() => {
            setFilterCategory('ancianos');
            setActiveTabMode('directorio');
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
            filterCategory === 'ancianos' && activeTabMode === 'directorio'
              ? 'bg-purple-50/90 dark:bg-purple-950/50 border-purple-400 dark:border-purple-600 ring-2 ring-purple-500/20'
              : 'bg-white dark:bg-[#121216] border-zinc-200 dark:border-[#27272A] hover:border-purple-300 dark:hover:border-purple-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA] uppercase tracking-wider">
              Ancianos
            </span>
            <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <strong className="text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">{stats.ancianosCount}</strong>
            <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 group-hover:underline">
              Filtrar →
            </span>
          </div>
        </div>

        {/* Siervos Ministeriales */}
        <div
          onClick={() => {
            setFilterCategory('siervos');
            setActiveTabMode('directorio');
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
            filterCategory === 'siervos' && activeTabMode === 'directorio'
              ? 'bg-teal-50/90 dark:bg-teal-950/50 border-teal-400 dark:border-teal-600 ring-2 ring-teal-500/20'
              : 'bg-white dark:bg-[#121216] border-zinc-200 dark:border-[#27272A] hover:border-teal-300 dark:hover:border-teal-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA] uppercase tracking-wider">
              Siervos Min.
            </span>
            <div className="w-7 h-7 rounded-xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <strong className="text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">{stats.siervosCount}</strong>
            <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 group-hover:underline">
              Filtrar →
            </span>
          </div>
        </div>

        {/* Con PIN Activo */}
        <div
          onClick={() => {
            setFilterCategory('con_pin');
            setActiveTabMode('directorio');
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
            filterCategory === 'con_pin' && activeTabMode === 'directorio'
              ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-[#121216] border-zinc-200 dark:border-[#27272A] hover:border-emerald-300 dark:hover:border-emerald-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-[#A1A1AA] uppercase tracking-wider">
              Con PIN Activo
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <strong className="text-2xl font-black text-zinc-900 dark:text-[#F4F4F5] font-mono tabular-nums">{stats.withPin}</strong>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline">
              Filtrar →
            </span>
          </div>
        </div>

        {/* Sin PIN Asignado */}
        <div
          onClick={() => {
            setFilterCategory('sin_pin');
            setActiveTabMode('directorio');
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group col-span-2 sm:col-span-1 ${
            filterCategory === 'sin_pin' && activeTabMode === 'directorio'
              ? 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-400 dark:border-amber-600 ring-2 ring-amber-500/20'
              : stats.withoutPin > 0
              ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
              : 'bg-white dark:bg-[#121216] border-zinc-200 dark:border-[#27272A]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Sin PIN
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <strong className={`text-2xl font-black font-mono tabular-nums ${stats.withoutPin > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-zinc-900 dark:text-[#F4F4F5]'}`}>
              {stats.withoutPin}
            </strong>
            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 group-hover:underline">
              {stats.withoutPin > 0 ? 'Asignar PINs →' : 'Completado ✓'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. MAIN SECTION TABS NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-[#27272A] pb-2">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200/80 dark:border-[#27272A] w-full sm:w-auto">
          {isAllowedAccess && (
            <button
              type="button"
              onClick={() => setActiveTabMode('directorio')}
              className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTabMode === 'directorio'
                  ? 'bg-white dark:bg-indigo-600 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300 shrink-0" />
              <span className="truncate">Directorio ({stats.total})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTabMode('mi_sesion')}
            className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTabMode === 'mi_sesion'
                ? 'bg-white dark:bg-indigo-600 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate">Mi Sesión</span>
          </button>

          {isAllowedAccess && (
            <button
              type="button"
              onClick={() => setActiveTabMode('nube_qr')}
              className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTabMode === 'nube_qr'
                  ? 'bg-white dark:bg-indigo-600 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span className="truncate">Cuentas Nube</span>
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-extrabold animate-pulse shrink-0 font-mono tabular-nums">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTabMode('matriz')}
            className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTabMode === 'matriz'
                ? 'bg-white dark:bg-indigo-600 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-[#A1A1AA] hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Permisos</span>
          </button>
        </div>

        {/* Action Header Button */}
        {activeTabMode === 'directorio' && isAllowedAccess && (
          <div className="flex items-center gap-2">
            {stats.withoutPin > 0 && (
              <button
                type="button"
                onClick={handleAutoAssignAllMissingPins}
                className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all font-mono tabular-nums"
                title="Generar PIN personal a todos los hermanos que no tienen"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Auto-asignar ({stats.withoutPin} faltantes)</span>
                <span className="sm:hidden">Auto ({stats.withoutPin})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Asignar Hermano</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: DIRECTORIO DE RESPONSABILIDADES Y PINS */}
      {/* ========================================================================= */}
      {activeTabMode === 'directorio' && isAllowedAccess && (
        <div className="space-y-4">
          {/* Search Bar & Filter Chips */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar hermano por nombre, cargo teocrático o privilegio..."
                className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold py-0.5">
              <button
                type="button"
                onClick={() => setFilterCategory('todos')}
                className={`px-3 py-1.5 rounded-xl shrink-0 cursor-pointer transition-colors ${
                  filterCategory === 'todos'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-200 dark:hover:bg-[#27272A]'
                }`}
              >
                Todos <span className="font-mono tabular-nums">({combinedPublishersList.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('ancianos')}
                className={`px-3 py-1.5 rounded-xl shrink-0 cursor-pointer transition-colors ${
                  filterCategory === 'ancianos'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-200 dark:hover:bg-[#27272A]'
                }`}
              >
                Ancianos <span className="font-mono tabular-nums">({stats.ancianosCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('siervos')}
                className={`px-3 py-1.5 rounded-xl shrink-0 cursor-pointer transition-colors ${
                  filterCategory === 'siervos'
                    ? 'bg-teal-600 text-white font-bold'
                    : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-200 dark:hover:bg-[#27272A]'
                }`}
              >
                Siervos Min. <span className="font-mono tabular-nums">({stats.siervosCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('con_pin')}
                className={`px-3 py-1.5 rounded-xl shrink-0 cursor-pointer transition-colors ${
                  filterCategory === 'con_pin'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-200 dark:hover:bg-[#27272A]'
                }`}
              >
                Con PIN <span className="font-mono tabular-nums">({stats.withPin})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('sin_pin')}
                className={`px-3 py-1.5 rounded-xl shrink-0 cursor-pointer transition-colors ${
                  filterCategory === 'sin_pin'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-200 dark:hover:bg-[#27272A]'
                }`}
              >
                Sin PIN <span className="font-mono tabular-nums">({stats.withoutPin})</span>
              </button>
            </div>
          </div>

          {/* Publishers Cards List */}
          <div className="space-y-3">
            {filteredPublishers.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#121216] border border-dashed border-zinc-200 dark:border-[#27272A] text-zinc-400 space-y-3">
                <Users className="w-12 h-12 mx-auto text-zinc-300 dark:text-[#27272A]" />
                <h4 className="text-base font-bold text-zinc-800 dark:text-[#F4F4F5]">
                  No se encontraron hermanos
                </h4>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA] max-w-sm mx-auto">
                  No hay hermanos que coincidan con el término de búsqueda o filtro seleccionado.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('todos');
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-950"
                >
                  Limpiar Filtros
                </button>
              </div>
            ) : (
              filteredPublishers.map((item) => {
                const isVisible = (visiblePins[item.publisherId] || false) && canRevealPin(item);
                const hasPin = item.hasPin;

                return (
                  <div
                    key={item.publisherId}
                    className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121216] hover:border-indigo-300 dark:hover:border-indigo-800/80 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* 1. Identity & Ecclesiastical Info */}
                    <div className="flex items-center gap-3.5 min-w-0 lg:w-[28%]">
                      <div className="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-[#F4F4F5] truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-semibold text-zinc-500 dark:text-[#A1A1AA] capitalize">
                            {item.privilege?.replace('_', ' ') || 'Publicador'}
                          </span>
                          {item.email && (
                            <span className="text-[11px] text-zinc-400 dark:text-[#71717A] truncate hidden sm:inline">
                              • {item.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. Theocratic Role Selector (Wide & Clear) */}
                    <div className="lg:w-[32%] space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-[#A1A1AA] flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Responsabilidad Asignada:</span>
                      </label>
                      <div className="relative">
                        <select
                          value={item.role}
                          onChange={(e) => handleChangePublisherRole(item.publisherId, e.target.value as TheocraticRole)}
                          className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm font-bold rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {roleOptionsFor(item).map((rKey) => (
                            <option key={rKey} value={rKey}>
                              {THEOCRATIC_ROLES[rKey].name} ({THEOCRATIC_ROLES[rKey].shortName})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 3. Personal PIN Capsule */}
                    <div className="lg:w-[20%] flex items-center gap-2">
                      {hasPin ? (
                        <div className="w-full flex items-center justify-between bg-zinc-50 dark:bg-[#18181F] px-3 py-2 rounded-xl border border-zinc-200 dark:border-[#27272A]">
                          <div className="flex items-center gap-2">
                            <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span className="font-mono tabular-nums font-black text-sm text-indigo-600 dark:text-indigo-400 tracking-widest">
                              {item.pin ? (isVisible ? item.pin : '••••') : '🔒 Cifrado'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {item.pin && canRevealPin(item) && (
                              <button
                                type="button"
                                onClick={() => togglePinVisibility(item.publisherId)}
                                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] cursor-pointer"
                                title={isVisible ? 'Ocultar PIN' : 'Ver PIN'}
                              >
                                {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleGeneratePinForPublisher(item.publisherId)}
                              className="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                              title="Generar otro PIN aleatorio"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevokePinForPublisher(item.publisherId)}
                              className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                              title="Revocar PIN y cerrar sesiones"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleGeneratePinForPublisher(item.publisherId)}
                          className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>+ Generar PIN</span>
                        </button>
                      )}
                    </div>

                    {/* 4. Action Buttons (WhatsApp, Link, Edit) */}
                    <div className="flex items-center justify-end gap-2 lg:w-[20%] pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-100 dark:border-[#27272A]">
                      {item.pin && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopyDirectLink(item.name, item.role, item.pin, item.publisherId)}
                            className="px-2.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181F] dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all border border-zinc-200 dark:border-[#27272A]"
                            title="Copiar enlace directo de publicador (un solo toque)"
                          >
                            {copiedId === `link_${item.publisherId}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-zinc-500" />
                            )}
                            <span>Enlace</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(item.name, item.role, item.pin, item.publisherId)}
                            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                            title="Compartir credenciales por WhatsApp"
                          >
                            {copiedId === item.publisherId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            )}
                            <span>WhatsApp</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setEditingPublisher(item);
                          setCustomPinInput(item.pin || generateUniquePublisherPin());
                          setEditError(null);
                        }}
                        className="p-2 rounded-xl text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-[#18181F] dark:hover:text-indigo-400 cursor-pointer"
                        title="Personalizar datos o PIN"
                      >
                        <Edit3 className="w-4 h-4" />
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
      {/* SECTION 2: MI SESIÓN Y CONMUTADOR CON PIN */}
      {/* ========================================================================= */}
      {activeTabMode === 'mi_sesion' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Card 1: Perfil Activo Actual */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg">
                {(currentBrotherName || 'U')[0]?.toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-[#A1A1AA] uppercase tracking-wider block">
                  Identidad Reconocida
                </span>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-[#F4F4F5]">
                  {currentBrotherName || 'Usuario sin nombre'}
                </h3>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-[#A1A1AA]">Rol Activo:</span>
                <span className={`font-bold px-2.5 py-0.5 rounded-md ${effectiveRoleInfo.badgeColor}`}>
                  {effectiveRoleInfo.name}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-[#A1A1AA]">Privilegio:</span>
                <span className="font-semibold text-zinc-700 dark:text-[#F4F4F5]">
                  {isCoordinator ? 'Coordinador del Cuerpo de Ancianos' : effectiveRoleInfo.shortName}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-[#A1A1AA] pt-1 leading-relaxed">
                {effectiveRoleInfo.description}
              </p>
            </div>

            {/* Quick Session Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  lockSession();
                }}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] text-zinc-700 dark:text-[#F4F4F5] font-bold text-xs hover:bg-zinc-100 dark:hover:bg-[#18181F] cursor-pointer flex items-center justify-center gap-2 transition-colors"
              >
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Bloquear Pantalla</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await signOutUser();
                  window.location.reload();
                }}
                className="py-2.5 px-4 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>

          {/* Card 2: Ingresar con otro PIN Personal */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-[#F4F4F5]">
                  Cambiar de Hermano con PIN
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                  Ingresa tu PIN personal para asumir tu cargo de inmediato.
                </p>
              </div>
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{pinError}</span>
              </div>
            )}

            {pinSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{pinSuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerifySessionPin} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">
                  Tu PIN Personal Único:
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value.replace(/\D/g, ''));
                    setPinError(null);
                  }}
                  placeholder="Ej: 3829"
                  className="w-full p-3 text-center text-lg font-mono tabular-nums font-bold tracking-widest rounded-2xl border border-zinc-300 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <button
                type="submit"
                disabled={!enteredPin.trim()}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
              >
                <KeyRound className="w-4 h-4" />
                <span>Verificar y Activar Rol</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: CUENTAS NUBE Y CÓDIGOS QR */}
      {/* ========================================================================= */}
      {activeTabMode === 'nube_qr' && isAllowedAccess && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Col 1: Solicitudes de Vinculación de Cuentas Google */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-[#F4F4F5]">
                    Solicitudes de Vinculación Google
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                    Aprobación requerida por ancianos para vincular correos de Google.
                  </p>
                </div>
              </div>

              {pendingRequestsCount > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono tabular-nums bg-rose-500 text-white">
                  {pendingRequestsCount} pendientes
                </span>
              )}
            </div>

            {(!accountLinkRequests || accountLinkRequests.length === 0) ? (
              <div className="p-8 text-center rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-dashed border-zinc-200 dark:border-[#27272A] text-zinc-400">
                <Globe className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-[#27272A]" />
                <p className="text-xs font-semibold text-zinc-600 dark:text-[#A1A1AA]">
                  No hay solicitudes de vinculación pendientes.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {accountLinkRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50/70 dark:bg-[#18181F] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs text-zinc-900 dark:text-[#F4F4F5] truncate">
                        {req.brotherName || req.email}
                      </h5>
                      <span className="text-[11px] text-zinc-400 dark:text-[#71717A] block truncate">{req.email}</span>
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        {req.status === 'pending' ? 'Pendiente de aprobación' : req.status}
                      </span>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const linkDecision = checkEmailRoleLink(actorRoles, req.role);
                            if (!linkDecision.allowed) {
                              setFeedback(`🚫 ${linkDecision.reason} (la solicitud pide el rol "${req.role}")`);
                              setTimeout(() => setFeedback(null), 5000);
                              return;
                            }
                            approveAccountLinkRequest(req.id, currentBrotherName || THEOCRATIC_ROLES[activeRole]?.shortName || 'Sin identificar');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-colors"
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectAccountLinkRequest(req.id, currentBrotherName || THEOCRATIC_ROLES[activeRole]?.shortName || 'Sin identificar')}
                          className="px-2.5 py-1.5 rounded-xl bg-zinc-200 dark:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] font-bold text-xs cursor-pointer hover:bg-zinc-300 dark:hover:bg-[#3F3F46] transition-colors"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Col 2: Generador de Invitaciones Portátiles & Códigos QR */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-[#F4F4F5]">
                  Invitaciones Portátiles & Códigos QR
                </h3>
                <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                  Crea enlaces temporales o códigos QR para escanear con la cámara.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateInvitation} className="space-y-3 p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">
                    Hermano Destinatario:
                  </label>
                  <input
                    type="text"
                    required
                    value={invBrotherName}
                    onChange={(e) => setInvBrotherName(e.target.value)}
                    placeholder="Ej: Samuel Morales"
                    className="w-full p-2.5 text-xs rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121216] text-zinc-900 dark:text-[#F4F4F5] focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">
                    Rol Asignado:
                  </label>
                  <select
                    value={invRole}
                    onChange={(e) => setInvRole(e.target.value as TheocraticRole)}
                    className="w-full p-2.5 text-xs rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#121216] text-zinc-900 dark:text-[#F4F4F5] font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  >
                    {roleOptionsGeneric.map((rKey) => (
                      <option key={rKey} value={rKey}>
                        {THEOCRATIC_ROLES[rKey].name} ({THEOCRATIC_ROLES[rKey].shortName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Generar Invitación E2EE</span>
              </button>
            </form>

            {/* Active Invitations List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {invitations.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-[#71717A] text-center py-4 italic">No hay invitaciones activas aún.</p>
              ) : (
                invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-2xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50/70 dark:bg-[#18181F] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-zinc-900 dark:text-[#F4F4F5] truncate">
                          {inv.targetName || 'Hermano'}
                        </strong>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                          {THEOCRATIC_ROLES[inv.role as TheocraticRole]?.shortName || inv.role}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono tabular-nums text-zinc-500 dark:text-[#A1A1AA] block mt-0.5 truncate">
                        Código: {inv.code}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => revokeInvitation(inv.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg cursor-pointer transition-colors"
                      title="Revocar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: MATRIZ DE PERMISOS TEOCRÁTICOS */}
      {/* ========================================================================= */}
      {activeTabMode === 'matriz' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-[#F4F4F5]">
                Matriz Oficial de Permisos Teocráticos
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Detalle transparente de accesos y facultades de edición por cada cargo ministerial.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-[#27272A]">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-[#18181F] text-[11px] font-extrabold uppercase tracking-wider text-zinc-600 dark:text-[#A1A1AA] border-b border-zinc-200 dark:border-[#27272A]">
                <tr>
                  <th className="p-3.5">Cargo Teocrático</th>
                  <th className="p-3.5 text-center">Reuniones</th>
                  <th className="p-3.5 text-center">Secretaría & S-21</th>
                  <th className="p-3.5 text-center">Territorios</th>
                  <th className="p-3.5 text-center">Cuentas</th>
                  <th className="p-3.5 text-center">Literatura</th>
                  <th className="p-3.5 text-center">Ajustes & PINs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-[#27272A] font-medium">
                {allTheocraticRoles.map((rKey) => {
                  const r = THEOCRATIC_ROLES[rKey];
                  return (
                    <tr key={rKey} className="hover:bg-zinc-50/50 dark:hover:bg-[#18181F]/40 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${r.badgeColor}`}>
                            {r.shortName}
                          </span>
                          <span className="font-bold text-zinc-900 dark:text-[#F4F4F5] hidden sm:inline">
                            {r.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        {r.canEditSchedule || r.canEditCLM || r.canEditWeekend ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Edición Total</span>
                        ) : r.allowedTabs.includes('programacion') ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Lectura</span>
                        ) : (
                          <span className="text-zinc-300 dark:text-[#3F3F46]">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {r.canEditS21 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Edición S-21</span>
                        ) : r.canViewS21 ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Lectura S-21</span>
                        ) : (
                          <span className="text-zinc-300 dark:text-[#3F3F46]">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {r.canEditTerritories || r.canManageTerritories ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Gestión S-13</span>
                        ) : r.allowedTabs.includes('territorios') ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Lectura</span>
                        ) : (
                          <span className="text-zinc-300 dark:text-[#3F3F46]">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {r.canManageAccounts ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Cuentas S-26</span>
                        ) : (
                          <span className="text-zinc-300 dark:text-[#3F3F46]">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {r.canManageLiterature ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Literatura S-14</span>
                        ) : (
                          <span className="text-zinc-300 dark:text-[#3F3F46]">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {r.canManageAccess ? (
                          <span className="text-purple-600 dark:text-purple-400 font-bold">Control Total</span>
                        ) : (
                          <span className="text-zinc-300 dark:text-[#3F3F46]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ASIGNAR NUEVO HERMANO CON ROL Y PIN */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#121216] rounded-3xl p-6 border border-zinc-200 dark:border-[#27272A] z-10 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-[#27272A]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-[#F4F4F5]">
                  Asignar Rol y PIN a un Hermano
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] cursor-pointer"
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
                <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">
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
                    className="w-full p-2.5 text-xs rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] font-medium cursor-pointer"
                  >
                    <option value="">-- Seleccionar hermano --</option>
                    {publishers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.privilege?.replace('_', ' ') || 'Publicador'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-zinc-400 italic mb-2">No hay publicadores registrados aún.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">
                  O escribir nombre completo:
                </label>
                <input
                  type="text"
                  placeholder="Ej: David Gómez"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">
                  Responsabilidad a Asignar:
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as TheocraticRole)}
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] font-semibold cursor-pointer"
                >
                  {roleOptionsGeneric.map((rKey) => (
                    <option key={rKey} value={rKey}>
                      {THEOCRATIC_ROLES[rKey].name} ({THEOCRATIC_ROLES[rKey].shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA]">
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
                  className="w-full p-2.5 text-xs font-mono tabular-nums font-bold tracking-widest text-center rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5]"
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
                  className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-200 dark:hover:bg-[#27272A] font-semibold text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDITAR CREDENCIALES DE UN HERMANO */}
      {/* ========================================================================= */}
      {editingPublisher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setEditingPublisher(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#121216] rounded-3xl p-6 border border-zinc-200 dark:border-[#27272A] z-10 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-[#27272A]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-[#F4F4F5]">
                  Editar Credenciales de {editingPublisher.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingPublisher(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5] cursor-pointer"
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
                <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA] block mb-1">
                  Responsabilidad Teocrática:
                </label>
                <select
                  value={editingPublisher.role}
                  onChange={(e) =>
                    setEditingPublisher({ ...editingPublisher, role: e.target.value as TheocraticRole })
                  }
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5] font-semibold cursor-pointer"
                >
                  {roleOptionsGeneric.map((rKey) => (
                    <option key={rKey} value={rKey}>
                      {THEOCRATIC_ROLES[rKey].name} ({THEOCRATIC_ROLES[rKey].shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-[#A1A1AA]">
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
                  className="w-full p-2.5 text-xs font-mono tabular-nums font-bold tracking-widest text-center rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5]"
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
                  className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-[#18181F] text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-200 dark:hover:bg-[#27272A] font-semibold text-xs cursor-pointer transition-colors"
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

export default RolesManagerTab;
