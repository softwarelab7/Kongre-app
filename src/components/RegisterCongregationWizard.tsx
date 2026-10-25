// src/components/RegisterCongregationWizard.tsx
import React, { useState } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { useSecurity } from '../context/SecurityContext';
import { supabaseSyncService } from '../services/supabaseSyncService';
import { insertAuditLog } from '../services/auditLogService';
import {
  hashPasscode,
  generateMilitaryGradeCongregationId,
  formatCanonicalCongregationId,
  generateSecureCongregationPin,
  generateSecureMasterPin,
  isCongregationIdString,
  setSecureLocalPin,
  signRoleSession,
} from '../utils/theocraticSecurity';
import { areNamesEquivalent } from '../utils/publisherDeduplication';
import { COUNTRIES_WITH_CITIES, COUNTRIES_LIST } from '../data/countriesAndCities';
import { SearchableCombobox } from './SearchableCombobox';
import { Select } from './Select';
import { IosTimePicker } from './IosTimePicker';
import { KongreLogo } from './KongreLogo';
import Logo from '../Logo';
import {
  LegalConsentCheckbox,
  hasAcceptedLegalTerms,
  recordLegalTermsAcceptance,
} from './TermsAndPrivacyModal';

const MIDWEEK_DAY_OPTIONS = [
  { value: 'Lunes', label: 'Lunes' },
  { value: 'Martes', label: 'Martes' },
  { value: 'Miércoles', label: 'Miércoles' },
  { value: 'Jueves', label: 'Jueves' },
  { value: 'Viernes', label: 'Viernes' },
];

const WEEKEND_DAY_OPTIONS = [
  { value: 'Sábado', label: 'Sábado' },
  { value: 'Domingo', label: 'Domingo' },
];
import {
  Building2,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MapPin,
  Globe,
  X,
  AlertCircle,
  Hash,
  Smartphone,
  Copy,
  Check,
  Eye,
  EyeOff,
  ShieldAlert,
  Download,
  FileText,
  RefreshCw,
} from 'lucide-react';

interface RegisterCongregationWizardProps {
  isOpen?: boolean;
  onClose: () => void;
  onRegisteredSuccess: () => void;
  isMandatory?: boolean;
  onOpenJoinWithCode?: () => void;
  embedded?: boolean;
}

export const RegisterCongregationWizard: React.FC<RegisterCongregationWizardProps> = ({
  isOpen = true,
  onClose,
  onRegisteredSuccess,
  isMandatory = false,
  onOpenJoinWithCode,
  embedded = false,
}) => {
  const { settings, updateSettings, addPublisher, resetAllCongregationData } = useCongregation();
  const { user, assignRoleToEmail, setActiveRole, assignPersonalPinToRole, setIdentifiedPublisher } = useAuth();
  const { setCongregationPin, setPersonalPin, setMasterPassphrase } = useSecurity();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Congregation info - ID criptográfico preasignado con entropía pura
  const [congregationName, setCongregationName] = useState('');
  const [congregationNumber, setCongregationNumber] = useState(() => generateMilitaryGradeCongregationId());
  const [copiedId, setCopiedId] = useState(false);
  const [circuitNumber, setCircuitNumber] = useState('');

  // Country and City (País primero, luego Ciudad)
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');

  const availableCities = country && COUNTRIES_WITH_CITIES[country]
    ? COUNTRIES_WITH_CITIES[country]
    : [];

  const [hallAddress, setHallAddress] = useState('');

  // Country change handler
  const handleCountryChange = (selectedCountry: string) => {
    setCountry(selectedCountry);
    const citiesForCountry = COUNTRIES_WITH_CITIES[selectedCountry];
    if (city && citiesForCountry && !citiesForCountry.includes(city)) {
      setCity('');
    }
  };

  // Step 2: Meeting Schedules - Vacíos por defecto
  const [midweekDay, setMidweekDay] = useState('');
  const [midweekTime, setMidweekTime] = useState('');
  const [weekendDay, setWeekendDay] = useState('');
  const [weekendTime, setWeekendTime] = useState('');

  // Step 3: Coordinator Details - Pre-llenados si el usuario inició sesión con Google
  const [coordinatorName, setCoordinatorName] = useState(() => user?.displayName || '');
  const [coordinatorEmail, setCoordinatorEmail] = useState(() => user?.email || '');
  const [coordinatorPhone, setCoordinatorPhone] = useState('');

  React.useEffect(() => {
    if (user?.email && !coordinatorEmail) {
      setCoordinatorEmail(user.email);
    }
    if (user?.displayName && !coordinatorName) {
      setCoordinatorName(user.displayName);
    }
  }, [user]);

  // Step 4: Security: PIN de Congregación + PIN Personal (generados automáticamente con CSPRNG)
  const [congregationPin, setCongregationPinInput] = useState(() => generateSecureCongregationPin());
  const [confirmCongregationPin, setConfirmCongregationPin] = useState(() => congregationPin);
  const [showCongregationPin, setShowCongregationPin] = useState(true);
  const [copiedCongPin, setCopiedCongPin] = useState(false);

  const [personalPin, setPersonalPinInput] = useState(() => generateSecureMasterPin());
  const [confirmPersonalPin, setConfirmPersonalPin] = useState(() => personalPin);
  const [showPersonalPin, setShowPersonalPin] = useState(true);
  const [copiedPersPin, setCopiedPersPin] = useState(false);

  const [pinRegeneratedCong, setPinRegeneratedCong] = useState(false);
  const [pinRegeneratedPers, setPinRegeneratedPers] = useState(false);
  const [acceptedLegalTerms, setAcceptedLegalTerms] = useState<boolean>(() =>
    hasAcceptedLegalTerms()
  );

  React.useEffect(() => {
    const syncConsent = () => setAcceptedLegalTerms(hasAcceptedLegalTerms());
    window.addEventListener('kongre_legal_terms_accepted', syncConsent);
    return () => window.removeEventListener('kongre_legal_terms_accepted', syncConsent);
  }, []);

  const handleCopyCongPin = (textToCopy: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedCongPin(true);
    setTimeout(() => setCopiedCongPin(false), 2000);
  };

  const handleCopyPersPin = (textToCopy: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedPersPin(true);
    setTimeout(() => setCopiedPersPin(false), 2000);
  };

  // Regeneradores de PINs automáticos con CSPRNG
  const handleRegenerateCongregationPin = () => {
    const newPin = generateSecureCongregationPin();
    setCongregationPinInput(newPin);
    setConfirmCongregationPin(newPin);
    setShowCongregationPin(true);
    setPinRegeneratedCong(true);
    setTimeout(() => setPinRegeneratedCong(false), 1500);
  };

  const handleRegeneratePersonalPin = () => {
    const newPin = generateSecureMasterPin();
    setPersonalPinInput(newPin);
    setConfirmPersonalPin(newPin);
    setShowPersonalPin(true);
    setPinRegeneratedPers(true);
    setTimeout(() => setPinRegeneratedPers(false), 1500);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al escribir el nombre de la congregación, mantenemos el ID estable sin recalcularlo
  const handleCongregationNameChange = (newName: string) => {
    setCongregationName(newName);
    if (!congregationNumber) {
      setCongregationNumber(generateMilitaryGradeCongregationId());
    }
  };

  const handleRegenerateCongregationId = () => {
    setCongregationNumber(generateMilitaryGradeCongregationId());
  };

  const [isSuccessScreen, setIsSuccessScreen] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSecurity, setCopiedSecurity] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showSummaryPins, setShowSummaryPins] = useState(false);

  // Formato de solo datos de seguridad teocrática (ID y PINs)
  const getSecurityOnlyFormattedText = () => {
    return `🔐 SEGURIDAD TEOCRÁTICA - ${congregationName ? congregationName.trim().toUpperCase() : 'CONGREGACIÓN'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆔 ID de la Congregación: ${congregationNumber}
🔒 PIN de la Congregación: ${congregationPin}
🔑 Tu PIN Personal (Coordinador): ${personalPin}
👤 Coordinador: ${coordinatorName} (${coordinatorEmail})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Guarda estos datos en un lugar seguro. Permiten desbloquear la app y activar roles teocráticos.`;
  };

  const handleCopySecurityData = () => {
    navigator.clipboard.writeText(getSecurityOnlyFormattedText());
    setCopiedSecurity(true);
    setTimeout(() => setCopiedSecurity(false), 2500);
  };

  // Formato ordenado para guardar o enviar por mensajería
  const getCredentialsFormattedText = () => {
    return `🏛️ KONGRE - CREDENCIALES OFICIALES DE LA CONGREGACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Nombre: ${congregationName}
🆔 ID de Congregación: ${congregationNumber}
🔒 PIN de la Congregación: ${congregationPin}
🔑 PIN Personal (Coordinador): ${personalPin}
👤 Coordinador: ${coordinatorName}
📧 Correo: ${coordinatorEmail}
📱 Teléfono: ${coordinatorPhone}
📅 Reunión Entre Semana: ${midweekDay} a las ${midweekTime}
📅 Reunión Fin de Semana: ${weekendDay} a las ${weekendTime}
📍 Salón: ${hallAddress || city || 'No especificado'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Guarda esta información en un lugar seguro. El ID y el PIN de la congregación permiten a otros ancianos y publicadores conectarse.`;
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(getCredentialsFormattedText());
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleCopySingle = (text: string, fieldKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([getCredentialsFormattedText()], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    const safeName = congregationName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    element.download = `credenciales_kongre_${safeName || 'congregacion'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Copiar ID al portapapeles
  const handleCopyId = (idToCopy: string) => {
    if (!idToCopy) return;
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!congregationName.trim()) {
        setError('Por favor introduce el nombre oficial de la congregación.');
        return false;
      }
      if (!congregationNumber.trim()) {
        const fresh = generateMilitaryGradeCongregationId();
        setCongregationNumber(fresh);
        if (!fresh) {
          setError('Por favor genera o introduce el ID de la Congregación.');
          return false;
        }
      }
      if (!circuitNumber.trim()) {
        setError('Por favor introduce el número de circuito asignado (ej. CO-04).');
        return false;
      }
      if (!city.trim() || !country.trim()) {
        setError('Por favor completa la ciudad y el país de la congregación.');
        return false;
      }
      if (!hallAddress.trim()) {
        setError('Por favor introduce la dirección del Salón del Reino.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!midweekDay || !midweekTime || !weekendDay || !weekendTime) {
        setError('Por favor especifica los días y horarios exactos de ambas reuniones.');
        return false;
      }
    }
    if (currentStep === 3) {
      if (!coordinatorName.trim()) {
        setError('Por favor introduce el nombre completo del Coordinador.');
        return false;
      }
      if (!coordinatorEmail.trim() || !coordinatorEmail.includes('@')) {
        setError('Por favor introduce un correo electrónico de Google válido para el Coordinador.');
        return false;
      }
      if (!coordinatorPhone.trim()) {
        setError('Por favor introduce el teléfono / WhatsApp de contacto del Coordinador.');
        return false;
      }
      const phoneDigits = coordinatorPhone.replace(/\D/g, '');
      if (phoneDigits.length < 7) {
        setError('Por favor introduce un número de teléfono válido (mínimo 7 dígitos numéricos).');
        return false;
      }
    }
    if (currentStep === 4) {
      if (!congregationPin.trim()) {
        setError('El PIN de la Congregación es obligatorio.');
        return false;
      }
      if (congregationPin.trim().length < 8) {
        setError('El PIN de la Congregación debe tener al menos 8 caracteres.');
        return false;
      }
      if (!personalPin.trim()) {
        setError('El PIN Maestro del Coordinador es obligatorio (mínimo 12 dígitos).');
        return false;
      }
      if (personalPin.trim().length < 12) {
        setError('El PIN Maestro del Coordinador debe tener al menos 12 dígitos para proteger la congregación contra ataques de fuerza bruta.');
        return false;
      }
      if (personalPin !== confirmPersonalPin) {
        setError('La confirmación de tu PIN Maestro no coincide.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 5) as any);
    }
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1) as any);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!acceptedLegalTerms) {
      setError('Debes aceptar los Términos de Uso y la Política de Privacidad para registrar la congregación.');
      return;
    }
    setIsSubmitting(true);

    try {
      const cleanPersonalPin = personalPin.trim();
      const cleanCongPin = congregationPin.trim();
      const congPinHashed = await hashPasscode(cleanCongPin);
      const finalId = formatCanonicalCongregationId(congregationNumber.trim()) || congregationNumber.trim().toUpperCase();

      // 0. Limpiar completamente cualquier dato de demostración o sesión previa antes de registrar la nueva congregación
      resetAllCongregationData();
      localStorage.removeItem('kongre_demo_mode');
      recordLegalTermsAcceptance();

      // 1. Guardar credenciales y PINs inmediatamente en almacenamiento local cifrado
      setSecureLocalPin('kongre_session_pin_v2', cleanPersonalPin);
      setSecureLocalPin('kongre_coordinator_pin', cleanPersonalPin);
      setSecureLocalPin('kongre_registered_cong_pin', cleanCongPin);
      setSecureLocalPin('kongre_last_cong_pin', cleanCongPin);
      localStorage.setItem('kongre_is_registered_congregation', 'true');
      localStorage.setItem('kongre_has_entered_app', 'true');
      localStorage.removeItem('kongre_is_guest');
      localStorage.setItem('kongre_identified_brother', coordinatorName.trim());
      localStorage.setItem('kongre_coordinator_name', coordinatorName.trim());
      localStorage.setItem('kongre_coordinator_email', coordinatorEmail.trim().toLowerCase());
      localStorage.setItem('theocratic_app_data_v1_active_role', 'coordinador');
      signRoleSession('coordinador', ['coordinador']);
      localStorage.setItem('kongre_congregation_name', congregationName.trim());
      localStorage.setItem('kongre_congregation_number', finalId);
      localStorage.setItem('kongre_congregation_id', finalId);
      localStorage.setItem('kongre_midweek_day', midweekDay);
      localStorage.setItem('kongre_midweek_time', midweekTime);
      localStorage.setItem('kongre_weekend_day', weekendDay);
      localStorage.setItem('kongre_weekend_time', weekendTime);
      localStorage.setItem('kongre_last_local_update', new Date().toISOString());
      sessionStorage.removeItem('kongre_show_landing');

      if (user && user.uid) {
        try {
          localStorage.setItem('kongre_user_cong_id', finalId);
        } catch {}
      }

      // 2. Actualizar configuración de la congregación en el contexto y estado
      const registeredSettings = {
        congregationName: congregationName.trim(),
        congregationNumber: finalId,
        congregationId: finalId,
        congregationPinHash: congPinHashed,
        circuitNumber: circuitNumber.trim(),
        city: city.trim(),
        country: country.trim(),
        hallAddress: hallAddress.trim(),
        midweekMeetingDay: midweekDay,
        midweekMeetingTime: midweekTime,
        weekendMeetingDay: weekendDay,
        weekendMeetingTime: weekendTime,
        coordinatorName: coordinatorName.trim(),
        coordinatorEmail: coordinatorEmail.trim().toLowerCase(),
        coordinatorPhone: coordinatorPhone.trim(),
        isRegistered: true,
        registeredAt: new Date().toISOString(),
      };

      await updateSettings(registeredSettings);

      // 3. Establecer PINs en SecurityContext y asignar rol de Coordinador
      await setCongregationPin(cleanCongPin);
      await setPersonalPin(cleanPersonalPin);

      assignPersonalPinToRole(
        'coordinador',
        cleanPersonalPin,
        coordinatorName.trim(),
        coordinatorEmail.trim().toLowerCase()
      );

      assignRoleToEmail(
        coordinatorEmail.trim().toLowerCase(),
        'coordinador',
        coordinatorName.trim(),
        cleanPersonalPin
      );
      setActiveRole('coordinador');

      // 4. Agregar únicamente al Coordinador al registro limpio de publicadores
      let updatedPubs: any[] = [];
      if (coordinatorName.trim()) {
        const coordId = `pub_coord_${Date.now()}`;
        const coordPub = {
          id: coordId,
          name: coordinatorName.trim(),
          gender: 'hermano' as const,
          phone: coordinatorPhone.trim(),
          email: coordinatorEmail.trim().toLowerCase(),
          personalPin: cleanPersonalPin,
          theocraticRole: 'coordinador' as const,
          notes: 'Coordinador del Cuerpo de Ancianos',
          active: true,
          groupNumber: 1,
          privilege: 'anciano' as const,
          hope: 'otras_ovejas' as const,
          absences: [],
          roles: {
            vym_presidente: true,
            vym_oracion: true,
            vym_tesoros_discurso: true,
            vym_tesoros_perlas: true,
            vym_tesoros_lectura: true,
            vym_maestros_titular: true,
            vym_maestros_ayudante: true,
            vym_vida_partes: true,
            vym_estudio_conductor: true,
            vym_estudio_lector: true,
            fds_presidente: true,
            fds_atalaya_lector: true,
            fds_oracion: true,
            deber_acomodador: true,
            deber_seguridad: true,
            deber_audio: true,
            deber_video: true,
            deber_microfonos: true,
            deber_plataforma: true,
            deber_zoom: true,
          },
        };
        addPublisher(coordPub);
        setIdentifiedPublisher(coordId, coordinatorName.trim());
        updatedPubs = [coordPub];
      }

      // 5. Cifrado de grado militar (AES-256-GCM) y subida inmediata a Supabase
      try {
        await supabaseSyncService.uploadCongregation({
          congregationId: finalId,
          data: {
            settings: { ...settings, ...registeredSettings },
            publishers: updatedPubs,
            weeks: [],
            territories: [],
            notices: [],
          },
          pinMaestro: cleanPersonalPin,
          pinCongregacion: cleanCongPin,
        });
      } catch (uploadErr) {
        console.warn('Aviso de subida inicial a Supabase diferida:', uploadErr);
      }

      // 6. Registrar en la Pista de Auditoría Teocrática
      await insertAuditLog({
        modulo: 'seguridad',
        accion: 'REGISTRO_CONGREGACION',
        hermano_nid: 'coordinador',
        hermano_nombre: coordinatorName.trim(),
        detalles: `Congregación ${congregationName.trim()} (${finalId}) registrada con seguridad Cero Conocimiento.`,
      });

      setIsSubmitting(false);
      setIsSuccessScreen(true);
    } catch (err: any) {
      setError(err?.message || 'Error al registrar la congregación.');
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Congregación' },
    { num: 2, title: 'Reuniones' },
    { num: 3, title: 'Coordinador' },
    { num: 4, title: 'Seguridad' },
    { num: 5, title: 'Confirmación' },
  ];

  if (!isOpen) return null;

  const wizardContent = (
    <>
      {/* Step Indicator Progress Bar */}
      <div className={`${embedded ? 'px-0 pt-0.5 pb-2 sm:pb-2.5 kg-stepper-enter' : 'px-4 sm:px-6 pt-2.5 pb-2 sm:pb-2.5 bg-slate-50/70 dark:bg-slate-900/50'} border-b border-slate-100 dark:border-slate-800 w-full overflow-hidden shrink-0`}>
        <div className="flex items-center justify-between gap-1 sm:gap-2 w-full overflow-x-auto scrollbar-none py-0.5">
          {stepsList.map((s, index) => {
            const isPassed = step > s.num;
            const isCurrent = step === s.num;
            return (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <div
                    className={`w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 rounded-lg flex items-center justify-center text-[10.5px] sm:text-xs font-black transition-all ${
                      isPassed
                        ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                        : isCurrent
                        ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30 ring-2 ring-indigo-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/70 dark:border-slate-700/70'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-bold transition-all ${
                      isCurrent
                        ? 'inline text-indigo-600 dark:text-indigo-400'
                        : isPassed
                        ? 'hidden md:inline text-slate-700 dark:text-slate-300'
                        : 'hidden md:inline text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {index < stepsList.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 min-w-1.5 sm:min-w-3 mx-1 sm:mx-1.5 rounded-full transition-all ${
                      step > s.num ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form Body */}
      <div className={`relative z-20 ${embedded ? 'p-0 pt-2 sm:pt-2.5 kg-form-enter' : 'p-3.5 sm:p-6 flex-1'} text-xs space-y-2.5 sm:space-y-3`}>
        {error && (
          <div className="p-2.5 sm:p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200/80 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: CONGREGATION INFO */}
        {step === 1 && (
          <div className="space-y-2.5 sm:space-y-3 animate-fade-in">
            {/* Step 1 Compact Banner */}
            <div className="py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2.5 sm:gap-3 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5.5 h-5.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                    Paso 1: Identidad de la Congregación
                  </span>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 hidden sm:block">
                    Ingresa los datos oficiales según registros teocráticos.
                  </span>
                </div>
              </div>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 shrink-0">
                1 de 5
              </span>
            </div>

            {/* Responsive Grid for Step 1 Fields */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3">
              {/* Row 1: Nombre de la Congregación (8 cols) + Circuito (4 cols) */}
              <div className="md:col-span-8">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Nombre de la Congregación:</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={congregationName}
                  onChange={(e) => handleCongregationNameChange(e.target.value)}
                  placeholder="Ej: Usme, Congregación Los Olivos"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                  required
                  autoFocus
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">
                  Nombre oficial según registros teocráticos.
                </span>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Circuito Asignado:</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={circuitNumber}
                  onChange={(e) => setCircuitNumber(e.target.value)}
                  placeholder="Ej: CO-04, ES-08"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white uppercase font-mono font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                  required
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">
                  Código de circuito.
                </span>
              </div>

              {/* Row 2: ID Criptográfico Horizontal Elegante (Full width) */}
              <div className="md:col-span-12 p-2.5 sm:p-3 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50/70 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-indigo-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs">
                    <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">ID de Congregación:</span>
                      <span className="font-mono font-bold text-xs sm:text-sm tracking-wider text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                        {congregationNumber || 'Generando ID seguro...'}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        CSPRNG
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      Identificador criptográfico aleatorio independiente del nombre para vincular publicadores.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-stretch sm:self-center justify-end">
                  <button
                    type="button"
                    onClick={handleRegenerateCongregationId}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    title="Generar otro ID criptográfico aleatorio"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Generar otro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyId(congregationNumber)}
                    disabled={!congregationNumber}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[11px] font-bold">{copiedId ? 'Copiado' : 'Copiar ID'}</span>
                  </button>
                </div>
              </div>

              {/* Row 3: País (6 cols) + Ciudad (6 cols) */}
              <div className="md:col-span-6">
                <SearchableCombobox
                  label="País:"
                  value={country}
                  onChange={handleCountryChange}
                  options={COUNTRIES_LIST}
                  placeholder="Escribe el país (ej: Colombia)..."
                  helperText="Filtra o pulsa para seleccionar."
                  required
                />
              </div>

              <div className="md:col-span-6">
                <SearchableCombobox
                  label="Ciudad / Municipio:"
                  value={city}
                  onChange={(val) => setCity(val)}
                  options={availableCities}
                  placeholder={country ? `Busca en ${country}...` : "Escribe la ciudad..."}
                  helperText={
                    availableCities.length > 0
                      ? `Ciudades de ${country}. Puedes escribir otra.`
                      : "Escribe la ciudad del Salón."
                  }
                  required
                />
              </div>

              {/* Row 4: Dirección del Salón del Reino (12 cols) */}
              <div className="md:col-span-12">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Dirección del Salón del Reino:</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={hallAddress}
                  onChange={(e) => setHallAddress(e.target.value)}
                  placeholder="Ej: Calle 45 # 12-34, Barrio El Paraíso"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: MEETINGS AND SCHEDULES */}
        {step === 2 && (
          <div className="space-y-2.5 sm:space-y-3 animate-fade-in">
            <div className="py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2.5 sm:gap-3 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5.5 h-5.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                    Paso 2: Días y Horarios de las Reuniones
                  </span>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 hidden sm:block">
                    Para calcular automáticamente los programas semanales y hojas S-89.
                  </span>
                </div>
              </div>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 shrink-0">
                2 de 5
              </span>
            </div>

            {/* 2-Column Responsive Grid: Midweek & Weekend Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
              {/* Midweek Meeting Card */}
              <div className="relative z-20 p-2.5 sm:p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2 sm:space-y-2.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                      Reunión Entre Semana (Vida y Ministerio)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Día y horario habitual de entre semana
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Día:</span>
                    </label>
                    <Select
                      value={midweekDay}
                      onChange={setMidweekDay}
                      options={MIDWEEK_DAY_OPTIONS}
                      placeholder="Selecciona día..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Hora de inicio:</span>
                    </label>
                    <IosTimePicker
                      value={midweekTime}
                      onChange={setMidweekTime}
                      placeholder="Ej. 19:00"
                      accentColor="indigo"
                      presets={['18:30', '19:00', '19:30', '20:00']}
                    />
                  </div>
                </div>
              </div>

              {/* Weekend Meeting Card */}
              <div className="relative z-10 p-2.5 sm:p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2 sm:space-y-2.5 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                      Reunión Fin de Semana (Público y Atalaya)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Día y horario de la reunión de fin de semana
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Día:</span>
                    </label>
                    <Select
                      value={weekendDay}
                      onChange={setWeekendDay}
                      options={WEEKEND_DAY_OPTIONS}
                      placeholder="Selecciona día..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Hora de inicio:</span>
                    </label>
                    <IosTimePicker
                      value={weekendTime}
                      onChange={setWeekendTime}
                      placeholder="Ej. 10:00"
                      accentColor="emerald"
                      presets={['09:00', '09:30', '10:00', '16:00', '17:00']}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: COORDINATOR INFO */}
        {step === 3 && (
          <div className="space-y-2.5 sm:space-y-3 animate-fade-in">
            <div className="py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2.5 sm:gap-3 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5.5 h-5.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                    Paso 3: Datos del Coordinador del Cuerpo de Ancianos
                  </span>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 hidden sm:block">
                    Tendrá acceso total como administrador general de la congregación.
                  </span>
                </div>
              </div>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 shrink-0">
                3 de 5
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Nombre completo del Coordinador:</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={coordinatorName}
                onChange={(e) => setCoordinatorName(e.target.value)}
                placeholder="Ej: Carlos Mendoza"
                className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Correo Electrónico (Google):</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={coordinatorEmail}
                  onChange={(e) => setCoordinatorEmail(e.target.value)}
                  placeholder="Ej: coordinador.cbe@gmail.com"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                  required
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Cuenta con acceso de Coordinador.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Teléfono / WhatsApp de Contacto:</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={coordinatorPhone}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9+\s-]/g, '');
                    if (val.indexOf('+') > 0) {
                      val = val.charAt(0) + val.slice(1).replace(/\+/g, '');
                    }
                    setCoordinatorPhone(val);
                  }}
                  onKeyDown={(e) => {
                    if (/^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData('text');
                    let cleaned = text.replace(/[^0-9+\s-]/g, '');
                    if (cleaned.indexOf('+') > 0) {
                      cleaned = cleaned.charAt(0) + cleaned.slice(1).replace(/\+/g, '');
                    }
                    setCoordinatorPhone(cleaned);
                  }}
                  placeholder="Ej: +57 300 123 4567"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Solo números y código de país (+).
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SECURITY - PIN DE CONGREGACIÓN Y PIN PERSONAL */}
        {step === 4 && (
          <div className="space-y-2.5 sm:space-y-3 animate-fade-in">
            <div className="py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2.5 sm:gap-3 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5.5 h-5.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-amber-950 dark:text-amber-200 block truncate">
                    Paso 4: Seguridad Teocrática y Roles
                  </span>
                  <span className="text-[10.5px] text-amber-900/80 dark:text-amber-300/80 hidden sm:block">
                    Credenciales asignadas según las directrices de seguridad de Kongre.
                  </span>
                </div>
              </div>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                CSPRNG
              </span>
            </div>

            {/* 2-Column Responsive Grid: Congregation PIN & Personal PIN Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
              {/* Card 1: Clave / PIN de la Congregación (Alfanumérico) */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2 sm:space-y-2.5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block truncate">
                        1. Clave / PIN de la Congregación
                      </span>
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-tight mt-0.5">
                        Clave de seguridad criptográfica general de la congregación (Alfanumérica).
                      </p>
                    </div>
                  </div>

                  {/* Input y Credencial Alfanumérica CSPRNG */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Clave Criptográfica:
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        Alfanumérica (1.09B+ comb.)
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type={showCongregationPin ? 'text' : 'password'}
                        value={congregationPin}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setCongregationPinInput(val);
                          setConfirmCongregationPin(val);
                        }}
                        placeholder="Ej: 8X4W-9M2K"
                        className="w-full px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold tracking-widest text-center text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-700/70">
                      <button
                        type="button"
                        onClick={() => setShowCongregationPin(!showCongregationPin)}
                        className="flex-1 py-1 px-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        {showCongregationPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showCongregationPin ? 'Ocultar' : 'Ver'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRegenerateCongregationPin}
                        className="flex-1 py-1 px-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title="Generar otra clave alfanumérica aleatoria"
                      >
                        <RefreshCw className={`w-3 h-3 ${pinRegeneratedCong ? 'animate-spin' : ''}`} />
                        <span>{pinRegeneratedCong ? '¡Listo!' : 'Generar'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyCongPin(congregationPin)}
                        className="flex-1 py-1 px-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-[10.5px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                      >
                        {copiedCongPin ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCongPin ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>CSPRNG alfanumérico (letras y números). Inmune a deducción o fuerza bruta.</span>
                </p>
              </div>

              {/* Card 2: PIN Personal Único */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2 sm:space-y-2.5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block truncate">
                        2. Tu PIN Personal (Coordinador)
                      </span>
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-tight mt-0.5">
                        PIN único que te identifica a ti como Coordinador.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        PIN Maestro (12 dígitos):
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleRegeneratePersonalPin}
                          className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${pinRegeneratedPers ? 'animate-spin' : ''}`} />
                          <span>{pinRegeneratedPers ? '¡Listo!' : 'Generar'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPersonalPin(!showPersonalPin)}
                          className="text-[10px] text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {showPersonalPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type={showPersonalPin ? 'text' : 'password'}
                          maxLength={12}
                          value={personalPin}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setPersonalPinInput(val);
                            setConfirmPersonalPin(val);
                          }}
                          placeholder="PIN Maestro (12 dígitos)"
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold tracking-widest text-center text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type={showPersonalPin ? 'text' : 'password'}
                          maxLength={12}
                          value={confirmPersonalPin}
                          onChange={(e) => setConfirmPersonalPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="Confirmar"
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold tracking-widest text-center text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-0.5">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> CSPRNG seguro
                      </span>
                      {confirmPersonalPin.length > 0 && (
                        confirmPersonalPin === personalPin ? (
                          <span className="text-emerald-600 font-bold">✓ Coincide</span>
                        ) : (
                          <span className="text-rose-500 font-bold">No coincide</span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Cada publicador tendrá su propio PIN personal único.</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: SUMMARY & ACTIVATION */}
        {step === 5 && (
          <div className="space-y-2.5 sm:space-y-3 animate-fade-in">
            <div className="py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-2.5 sm:gap-3 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    ¡Todo listo para registrar la congregación!
                  </h4>
                  <p className="text-[10.5px] text-slate-600 dark:text-slate-300 truncate hidden sm:block">
                    Verifica el resumen antes de activar el sistema.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopySecurityData}
                className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] sm:text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer shrink-0"
              >
                {copiedSecurity ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSecurity ? '¡Copiado!' : 'Copiar claves'}</span>
              </button>
            </div>

            {/* Summary Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              <div className="p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 space-y-1 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Congregación
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">{congregationName}</p>
                <p className="text-slate-700 dark:text-slate-200 font-mono font-bold text-xs">
                  ID: {congregationNumber}
                </p>
                <p className="text-slate-500 font-mono text-xs">
                  Circuito {circuitNumber}
                </p>
                <p className="text-xs text-slate-500 truncate">{[city, country].filter(Boolean).join(', ')}</p>
                <p className="text-[11px] text-slate-400 truncate">{hallAddress}</p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 space-y-1 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Reuniones Semanales
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200">
                  <strong>Entre semana:</strong> {midweekDay} a las {midweekTime}
                </p>
                <p className="text-xs text-slate-800 dark:text-slate-200">
                  <strong>Fin de semana:</strong> {weekendDay} a las {weekendTime}
                </p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 space-y-1 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Coordinador Designado
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">{coordinatorName}</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-semibold truncate">{coordinatorEmail}</p>
                <p className="text-xs text-slate-500">{coordinatorPhone}</p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Seguridad Teocrática
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSummaryPins(!showSummaryPins)}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showSummaryPins ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showSummaryPins ? 'Ocultar' : 'Ver'}</span>
                  </button>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">ID Congregación:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{congregationNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">PIN Congregación:</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {showSummaryPins ? congregationPin : '••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">PIN Personal:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {showSummaryPins ? personalPin : '••••••'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <LegalConsentCheckbox
              checked={acceptedLegalTerms}
              onChange={(val) => {
                setAcceptedLegalTerms(val);
                if (val) setError(null);
              }}
            />
          </div>
        )}
      </div>

      {/* Footer Navigation Buttons */}
      <div className={`relative z-10 ${embedded ? 'pt-2.5 sm:pt-3 kg-actions-enter' : 'p-3.5 sm:p-4 bg-slate-50/50 dark:bg-slate-900/50'} border-t border-slate-100 dark:border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shrink-0`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={step > 1 ? handleBack : onClose}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700/70 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs active:scale-[0.99]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{step > 1 ? 'Anterior' : 'Volver atrás'}</span>
          </button>

          {step === 1 && onOpenJoinWithCode && (
            <button
              type="button"
              onClick={onOpenJoinWithCode}
              className="text-[11px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer transition-colors"
            >
              ¿Tienes ID y PIN? Conectar
            </button>
          )}
        </div>

        {step < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md shadow-indigo-600/20 transition-all ml-auto sm:ml-0"
          >
            <span>Continuar al Paso {step + 1}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={isSubmitting || !acceptedLegalTerms}
            className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-auto sm:ml-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Registrando...' : 'Registrar y Comenzar'}</span>
          </button>
        )}
      </div>
    </>
  );

  if (isSuccessScreen) {
    const successCard = (
      <div className="space-y-3 sm:space-y-4 animate-fade-in p-1 sm:p-2">
        {/* Banner de Éxito */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 text-center space-y-1.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            ¡Congregación Registrada con Éxito!
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
            La <strong>{congregationName}</strong> ya está configurada en Kongre. Guarda y copia tus claves y datos antes de comenzar.
          </p>
        </div>

        {/* Tarjeta de Credenciales */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3 sm:p-4 space-y-2.5 sm:space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Credenciales Teocráticas de la Congregación
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSummaryPins(!showSummaryPins)}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showSummaryPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showSummaryPins ? 'Ocultar claves' : 'Mostrar claves'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopySecurityData}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                title="Copiar ID y claves de seguridad juntos"
              >
                {copiedSecurity ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSecurity ? '¡Copiado!' : 'Copiar todo'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
            {/* ID Congregación */}
            <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">ID de la Congregación</span>
                <span className="font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white select-all">{congregationNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopySingle(congregationNumber, 'id_final')}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedField === 'id_final' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'id_final' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {/* PIN de la Congregación */}
            <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">PIN de la Congregación</span>
                <span className="font-mono font-bold text-sm sm:text-base text-indigo-600 dark:text-indigo-400 select-all">
                  {showSummaryPins ? congregationPin : '••••••••'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopySingle(congregationPin, 'pin_cong_final')}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedField === 'pin_cong_final' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'pin_cong_final' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {/* PIN Personal Coordinador */}
            <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Tu PIN Personal (Coordinador)</span>
                <span className="font-mono font-bold text-sm sm:text-base text-emerald-600 dark:text-emerald-400 select-all">
                  {showSummaryPins ? personalPin : '••••••'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopySingle(personalPin, 'pin_pers_final')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedField === 'pin_pers_final' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'pin_pers_final' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {/* Coordinador Info */}
            <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Coordinador Designado</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{coordinatorName}</span>
                <span className="text-slate-400 text-[11px] truncate block">{coordinatorEmail}</span>
              </div>
            </div>
          </div>

          {/* Botón para copiar todos los datos del cuadro juntos con un solo clic */}
          <button
            type="button"
            onClick={handleCopySecurityData}
            className="w-full py-2 px-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            {copiedSecurity ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSecurity ? '¡Todos los datos copiados al portapapeles!' : 'Copiar todos los datos de seguridad (ID y PINs)'}</span>
          </button>
        </div>

        {/* Action Buttons: Copiar todo & Descargar .txt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleCopyAll}
            className="py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 active:scale-[0.99] transition-all cursor-pointer"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAll ? '¡Todas las credenciales copiadas!' : 'Copiar todas las credenciales'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadTxt}
            className="py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-200/70 dark:border-slate-700/70 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar comprobante (.txt)</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          💡 Podrás consultar el ID y generar invitaciones para otros ancianos y siervos en cualquier momento desde la pestaña <strong>Ajustes &gt; Seguridad y Roles</strong>.
        </p>

        {/* Enter App Button */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => onRegisteredSuccess()}
            className="w-full sm:w-auto py-2.5 sm:py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>Ir al Gestor Teocrático</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );

    if (embedded) {
      return <div className="space-y-3 pt-0.5 animate-fade-in">{successCard}</div>;
    }

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col py-2 sm:py-5 px-3 sm:px-6 lg:px-8 transition-colors duration-200">
        <div className="w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto flex-1 flex flex-col justify-center">
          <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden p-3.5 sm:p-5">
            {successCard}
          </div>
        </div>
      </div>
    );
  }

  if (embedded) {
    return <div className="space-y-2.5 sm:space-y-3 pt-0.5 animate-fade-in">{wizardContent}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col py-2 sm:py-4 px-3 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto flex-1 flex flex-col">
        {/* Main Card */}
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col flex-1 kg-register-box-enter">
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={step > 1 ? handleBack : onClose}
                className="p-1.5 -ml-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center"
                title={step > 1 ? 'Paso anterior' : 'Volver'}
                aria-label={step > 1 ? 'Paso anterior' : 'Volver'}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Registro de Congregación
                  </h3>
                  {isMandatory && (
                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Requisito Obligatorio
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isMandatory
                    ? 'Debes registrar los datos oficiales de tu congregación para comenzar a usar Kongre'
                    : 'Asistente de configuración inicial teocrática'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                <Logo variant="isotipo" className="w-4 h-4 object-contain" />
                <span>Kongre</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {wizardContent}
        </div>
      </div>
    </div>
  );
};
