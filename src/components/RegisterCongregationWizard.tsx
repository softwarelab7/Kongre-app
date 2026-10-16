// src/components/RegisterCongregationWizard.tsx
import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { useSecurity } from '../context/SecurityContext';
import {
  hashPasscode,
  generateMilitaryGradeCongregationId,
  formatCanonicalCongregationId,
  evaluatePinStrength,
  generateSecureCongregationPin,
  generateSecureRolePin,
  isCongregationIdString,
} from '../utils/theocraticSecurity';
import { areNamesEquivalent } from '../utils/publisherDeduplication';
import { COUNTRIES_WITH_CITIES, COUNTRIES_LIST } from '../data/countriesAndCities';
import { SearchableCombobox } from './SearchableCombobox';
import { KongreLogo } from './KongreLogo';
import Logo from '../Logo';
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
  if (isOpen === false) return null;
  const { settings, updateSettings, publishers, addPublisher } = useCongregation();
  const { user, assignRoleToEmail, setActiveRole, assignPersonalPinToRole } = useAuth();
  const { setCongregationPin, setPersonalPin, setMasterPassphrase } = useSecurity();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Congregation info - Inicia 100% vacío para registrar una congregación nueva
  const [congregationName, setCongregationName] = useState('');
  const [congregationNumber, setCongregationNumber] = useState('');
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

  // Step 3: Coordinator Details - Vacíos por defecto
  const [coordinatorName, setCoordinatorName] = useState('');
  const [coordinatorEmail, setCoordinatorEmail] = useState('');
  const [coordinatorPhone, setCoordinatorPhone] = useState('');

  // Step 4: Security: PIN de Congregación + PIN Personal (vacíos por defecto)
  const [congregationPin, setCongregationPinInput] = useState('');
  const [confirmCongregationPin, setConfirmCongregationPin] = useState('');
  const [showCongregationPin, setShowCongregationPin] = useState(false);

  const [personalPin, setPersonalPinInput] = useState('');
  const [confirmPersonalPin, setConfirmPersonalPin] = useState('');
  const [showPersonalPin, setShowPersonalPin] = useState(false);

  const [pinRegeneratedCong, setPinRegeneratedCong] = useState(false);
  const [pinRegeneratedPers, setPinRegeneratedPers] = useState(false);

  // Regeneradores de PINs automáticos con la app
  const handleRegenerateCongregationPin = () => {
    const newPin = generateSecureCongregationPin();
    setCongregationPinInput(newPin);
    setConfirmCongregationPin(newPin);
    setShowCongregationPin(true);
    setPinRegeneratedCong(true);
    setTimeout(() => setPinRegeneratedCong(false), 2000);
  };

  const handleRegeneratePersonalPin = () => {
    const newPin = generateSecureRolePin();
    setPersonalPinInput(newPin);
    setConfirmPersonalPin(newPin);
    setShowPersonalPin(true);
    setPinRegeneratedPers(true);
    setTimeout(() => setPinRegeneratedPers(false), 2000);
  };

  const pinStrength = evaluatePinStrength(congregationPin);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Al escribir o cambiar el nombre de la congregación, se genera automáticamente el ID
  const handleCongregationNameChange = (newName: string) => {
    setCongregationName(newName);
    const militaryId = generateMilitaryGradeCongregationId(newName);
    setCongregationNumber(militaryId);
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
        const fresh = generateMilitaryGradeCongregationId(congregationName);
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
    }
    if (currentStep === 4) {
      if (!congregationPin.trim()) {
        setError('El PIN de la Congregación es obligatorio (4 a 8 dígitos o caracteres).');
        return false;
      }
      if (congregationPin.trim().length < 4) {
        setError('El PIN de la Congregación debe tener al menos 4 caracteres o dígitos.');
        return false;
      }
      if (pinStrength.isWeak) {
        setError(pinStrength.message || 'El PIN seleccionado es predecible o inseguro. Por favor utiliza una combinación más segura.');
        return false;
      }
      if (congregationPin !== confirmCongregationPin) {
        setError('La confirmación del PIN de la Congregación no coincide.');
        return false;
      }
      if (!personalPin.trim()) {
        setError('Tu PIN Personal es obligatorio (4 a 6 dígitos numéricos).');
        return false;
      }
      if (personalPin.trim().length < 4) {
        setError('Tu PIN Personal debe tener al menos 4 dígitos numéricos.');
        return false;
      }
      if (personalPin !== confirmPersonalPin) {
        setError('La confirmación de tu PIN Personal no coincide.');
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
    setIsSubmitting(true);

    try {
      const congPinHashed = await hashPasscode(congregationPin.trim());

      const finalId = formatCanonicalCongregationId(congregationNumber.trim()) || congregationNumber.trim().toUpperCase();

      // 1. Update Congregation Settings in context and database
      await updateSettings({
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
      });

      // Si el usuario está autenticado con Google, vincular inmediatamente en /users/{uid}
      if (user && user.uid) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            congregationId: finalId,
            congregationNumber: finalId,
            congregationName: congregationName.trim(),
            theocraticRole: 'coordinador',
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch {}
      }

      // 2. Set Congregation App Lock PIN and Personal PIN in security context
      await setCongregationPin(congregationPin.trim());
      await setPersonalPin(personalPin.trim());

      // 3. Assign Coordinator role and Personal PIN in AuthContext
      assignPersonalPinToRole(
        'coordinador',
        personalPin.trim(),
        coordinatorName.trim(),
        coordinatorEmail.trim().toLowerCase()
      );

      assignRoleToEmail(
        coordinatorEmail.trim().toLowerCase(),
        'coordinador',
        coordinatorName.trim(),
        personalPin.trim()
      );
      setActiveRole('coordinador');

      // 4. Add Coordinator to publishers list if not already present
      const alreadyHasCoord = publishers.some(
        (p) =>
          areNamesEquivalent(p.name, coordinatorName.trim()) ||
          (p.email && coordinatorEmail.trim() && p.email.trim().toLowerCase() === coordinatorEmail.trim().toLowerCase())
      );
      if (!alreadyHasCoord && coordinatorName.trim()) {
        addPublisher({
          name: coordinatorName.trim(),
          gender: 'hermano',
          phone: coordinatorPhone.trim(),
          email: coordinatorEmail.trim().toLowerCase(),
          personalPin: personalPin.trim(),
          notes: 'Coordinador del Cuerpo de Ancianos',
          active: true,
          groupNumber: 1,
          privilege: 'anciano',
          hope: 'otras_ovejas',
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
        });
      }

      // 5. Store registration flag in localStorage
      localStorage.setItem('kongre_is_registered_congregation', 'true');
      localStorage.setItem('kongre_has_entered_app', 'true');
      localStorage.setItem('kongre_needs_cloud_upload', 'true');
      localStorage.setItem('kongre_congregation_name', congregationName.trim());
      localStorage.setItem('kongre_congregation_number', finalId);
      localStorage.setItem('kongre_congregation_id', finalId);
      localStorage.setItem('kongre_midweek_day', midweekDay);
      localStorage.setItem('kongre_midweek_time', midweekTime);
      localStorage.setItem('kongre_weekend_day', weekendDay);
      localStorage.setItem('kongre_weekend_time', weekendTime);
      localStorage.setItem('kongre_last_local_update', new Date().toISOString());
      sessionStorage.removeItem('kongre_show_landing');

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

  const wizardContent = (
    <>
      {/* Step Indicator Progress Bar */}
      <div className={`${embedded ? 'px-0 pt-1 pb-4' : 'px-6 pt-4 pb-3 bg-slate-50/70 dark:bg-slate-900/50'} border-b border-slate-100 dark:border-slate-800`}>
        <div className="flex items-center justify-between gap-1">
          {stepsList.map((s, index) => {
            const isPassed = step > s.num;
            const isCurrent = step === s.num;
            return (
              <React.Fragment key={s.num}>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                      isPassed
                        ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                        : isCurrent
                        ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30 ring-2 ring-indigo-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/70 dark:border-slate-700/70'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-bold hidden sm:inline ${
                      isCurrent
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : isPassed
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
                {index < stepsList.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 sm:mx-2 rounded-full transition-all ${
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
      <div className={`${embedded ? 'p-0 pt-3' : 'p-6 flex-1 overflow-y-auto'} text-xs space-y-4`}>
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200/80 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: CONGREGATION INFO */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-slate-700 dark:text-slate-300 space-y-1 shadow-2xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Paso 1: Identidad de la Congregación
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Ingresa los datos oficiales de tu congregación tal como aparecen en los registros teocráticos.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Nombre de la Congregación:</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={congregationName}
                onChange={(e) => handleCongregationNameChange(e.target.value)}
                placeholder="Ej: Congregación Central, Congregación Los Olivos"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-semibold text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                required
                autoFocus
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block leading-relaxed">
                El ID de la congregación se genera automáticamente a partir del nombre ingresado.
              </span>
            </div>

            {/* ========================================================= */}
            {/* ID DE LA CONGREGACIÓN                                     */}
            {/* ========================================================= */}
            <div className="p-4 sm:p-5 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50/70 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-indigo-950/30 space-y-3.5 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      ID de la Congregación
                    </h4>
                    <span className="text-rose-500 font-bold">*</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Identificador asignado a tu congregación para que los publicadores y ancianos puedan vincularse.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono font-bold text-sm sm:text-base tracking-wider text-indigo-700 dark:text-indigo-300">
                    {congregationNumber || 'Se generará automáticamente al ingresar el nombre'}
                  </span>
                  {congregationNumber && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Asignado
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyId(congregationNumber)}
                    disabled={!congregationNumber}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? 'Copiado' : 'Copiar ID'}</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Este ID estará siempre visible en los ajustes de la congregación una vez registrado.</span>
              </p>
            </div>

            {/* Circuito Asignado */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Circuito Asignado:</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={circuitNumber}
                onChange={(e) => setCircuitNumber(e.target.value)}
                placeholder="Ej: CO-04, ES-08, MX-12"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white uppercase font-mono font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                required
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block leading-relaxed">
                Código oficial de circuito de asambleas.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. PAÍS */}
              <div>
                <SearchableCombobox
                  label="País:"
                  value={country}
                  onChange={handleCountryChange}
                  options={COUNTRIES_LIST}
                  placeholder="Escribe el país (ej: Colombia, México, España)..."
                  helperText="Escribe para filtrar o pulsa para seleccionar de la lista completa."
                  required
                />
              </div>

              {/* 2. CIUDAD / MUNICIPIO */}
              <div>
                <SearchableCombobox
                  label="Ciudad / Municipio:"
                  value={city}
                  onChange={(val) => setCity(val)}
                  options={availableCities}
                  placeholder={country ? `Escribe o busca en ${country}...` : "Escribe la ciudad o municipio..."}
                  helperText={
                    availableCities.length > 0
                      ? `Ciudades de ${country}. Puedes seleccionar o escribir otra.`
                      : "Escribe el nombre de la ciudad o municipio del Salón."
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Dirección del Salón del Reino:</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={hallAddress}
                onChange={(e) => setHallAddress(e.target.value)}
                placeholder="Ej: Calle 45 # 12-34, Barrio El Paraíso"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                required
              />
            </div>
          </div>
        )}

        {/* STEP 2: MEETINGS AND SCHEDULES */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-slate-700 dark:text-slate-300 space-y-1 shadow-2xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Paso 2: Días y Horarios de las Reuniones
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Configura los horarios para calcular automáticamente los programas semanales y hojas S-89.
              </p>
            </div>

            {/* Midweek Meeting */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                    Reunión Entre Semana (Vida y Ministerio Cristianos)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Día y hora de la reunión semanal de entre semana
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Día de la semana:</span>
                  </label>
                  <select
                    value={midweekDay}
                    onChange={(e) => setMidweekDay(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white font-medium text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs cursor-pointer"
                  >
                    <option value="">Selecciona un día...</option>
                    <option value="Lunes">Lunes</option>
                    <option value="Martes">Martes</option>
                    <option value="Miércoles">Miércoles</option>
                    <option value="Jueves">Jueves</option>
                    <option value="Viernes">Viernes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Hora de inicio:</span>
                  </label>
                  <input
                    type="time"
                    value={midweekTime}
                    onChange={(e) => setMidweekTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white font-mono font-bold text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Weekend Meeting */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                    Reunión Fin de Semana (Discurso Público y La Atalaya)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Día y hora de la reunión del fin de semana
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Día de la semana:</span>
                  </label>
                  <select
                    value={weekendDay}
                    onChange={(e) => setWeekendDay(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white font-medium text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs cursor-pointer"
                  >
                    <option value="">Selecciona un día...</option>
                    <option value="Sábado">Sábado</option>
                    <option value="Domingo">Domingo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Hora de inicio:</span>
                  </label>
                  <input
                    type="time"
                    value={weekendTime}
                    onChange={(e) => setWeekendTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white font-mono font-bold text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: COORDINATOR INFO */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-slate-700 dark:text-slate-300 space-y-1 shadow-2xs">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Paso 3: Datos del Coordinador del Cuerpo de Ancianos
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                El Coordinador tendrá acceso total como administrador general de la congregación y podrá generar invitaciones para los demás ancianos y siervos.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Nombre completo del Coordinador:</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={coordinatorName}
                onChange={(e) => setCoordinatorName(e.target.value)}
                placeholder="Ej: Héctor Gutiérrez"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-semibold text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Correo Electrónico (Google / Cuenta principal):</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={coordinatorEmail}
                onChange={(e) => setCoordinatorEmail(e.target.value)}
                placeholder="Ej: hectorguti95@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                required
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block leading-relaxed">
                * Esta cuenta recibirá acceso de Coordinador con supervisión de todos los departamentos.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Teléfono / WhatsApp de Contacto:</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={coordinatorPhone}
                onChange={(e) => setCoordinatorPhone(e.target.value)}
                placeholder="Ej: +57 300 1234567"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                required
              />
            </div>
          </div>
        )}

        {/* STEP 4: SECURITY - PIN DE CONGREGACIÓN Y PIN PERSONAL */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-slate-700 dark:text-slate-300 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="font-bold text-xs text-amber-950 dark:text-amber-200">
                    Paso 4: Seguridad Teocrática y Roles
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Seguridad Personalizada</span>
                </div>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                Establece las claves de seguridad para tu congregación y para tu cuenta de Coordinador. Puedes ingresarlas manualmente o pulsar <strong>«Generar PIN»</strong> para crearlas automáticamente con alta seguridad teocrática.
              </p>
            </div>

            {/* 1. PIN de la Congregación */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                    1. PIN de la Congregación (Bloqueo de Pantalla)
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    Clave de seguridad exclusiva de tu congregación para bloquear la app y proteger la confidencialidad de los datos teocráticos en el Salón.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>PIN de la Congregación:</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleRegenerateCongregationPin}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                        title="Generar otro PIN de 6 dígitos aleatorio"
                      >
                        <RefreshCw className={`w-3 h-3 ${pinRegeneratedCong ? 'animate-spin' : ''}`} />
                        <span>{pinRegeneratedCong ? '¡Generado!' : congregationPin ? 'Generar nuevo' : 'Generar PIN'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCongregationPin(!showCongregationPin)}
                        className="text-[11px] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors"
                        title={showCongregationPin ? 'Ocultar PIN' : 'Ver PIN'}
                      >
                        {showCongregationPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showCongregationPin ? 'Ocultar' : 'Ver'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type={showCongregationPin ? 'text' : 'password'}
                      maxLength={8}
                      value={congregationPin}
                      onChange={(e) => {
                        setCongregationPinInput(e.target.value);
                        setConfirmCongregationPin(e.target.value);
                      }}
                      placeholder="Ej: 749258 o Teo#26"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white font-mono font-bold tracking-widest text-center text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                      required
                    />
                  </div>

                  {/* Medidor de Fortaleza Teocrática del PIN */}
                  {congregationPin.length > 0 && (
                    <div className="mt-2 p-2 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-semibold">Fortaleza Teocrática:</span>
                        <span className={`font-bold px-2 py-0.5 rounded-full ${pinStrength.color}`}>
                          {pinStrength.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 h-1.5">
                        <div className={`rounded-full transition-all ${pinStrength.score >= 1 ? (pinStrength.isWeak ? 'bg-rose-500' : 'bg-amber-500') : 'bg-slate-200 dark:bg-slate-700'}`} />
                        <div className={`rounded-full transition-all ${pinStrength.score >= 2 ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                        <div className={`rounded-full transition-all ${pinStrength.score >= 3 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      </div>
                      {pinStrength.message && (
                        <p className={`text-[10px] leading-tight ${pinStrength.isWeak ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                          {pinStrength.message}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <Sparkles className="w-3 h-3" /> Generado por la app (6 dígitos)
                    </span>
                    <span>De 4 a 8 dígitos</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Confirmar PIN de la Congregación:</span>
                      <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <input
                    type={showCongregationPin ? 'text' : 'password'}
                    maxLength={8}
                    value={confirmCongregationPin}
                    onChange={(e) => setConfirmCongregationPin(e.target.value)}
                    placeholder="Repite el PIN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white font-mono font-bold tracking-widest text-center text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                    required
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Debe coincidir exactamente</span>
                    {confirmCongregationPin.length > 0 && (
                      confirmCongregationPin === congregationPin ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Coincide (Verificado)</span>
                      ) : (
                        <span className="text-rose-500 font-bold">No coincide</span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. PIN Personal Único de Publicador (Coordinador) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                    2. Tu PIN Personal de Publicador (Coordinador)
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    En Kongre, los PINs son <strong>únicos por publicador</strong> (pertenecen a cada hermano, no a un privilegio genérico). Este PIN te identificará a ti como Coordinador. Para los demás hermanos, podrás generar sus PINs personales únicos desde la pestaña de Publicadores o el Gestor de PINs.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Tu PIN Personal Único:</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleRegeneratePersonalPin}
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer"
                        title="Generar otro PIN personal de 4 dígitos"
                      >
                        <RefreshCw className={`w-3 h-3 ${pinRegeneratedPers ? 'animate-spin' : ''}`} />
                        <span>{pinRegeneratedPers ? '¡Generado!' : personalPin ? 'Generar nuevo' : 'Generar PIN'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPersonalPin(!showPersonalPin)}
                        className="text-[11px] text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors"
                        title={showPersonalPin ? 'Ocultar PIN' : 'Ver PIN'}
                      >
                        {showPersonalPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showPersonalPin ? 'Ocultar' : 'Ver'}</span>
                      </button>
                    </div>
                  </div>
                  <input
                    type={showPersonalPin ? 'text' : 'password'}
                    maxLength={6}
                    value={personalPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPersonalPinInput(val);
                      setConfirmPersonalPin(val);
                    }}
                    placeholder="Ej: 1234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white font-mono font-bold tracking-widest text-center text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                    required
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <Sparkles className="w-3 h-3" /> Generado por la app (4 dígitos)
                    </span>
                    <span>De 4 a 6 dígitos</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Confirmar PIN Personal:</span>
                      <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <input
                    type={showPersonalPin ? 'text' : 'password'}
                    maxLength={6}
                    value={confirmPersonalPin}
                    onChange={(e) => setConfirmPersonalPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Repite el PIN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white font-mono font-bold tracking-widest text-center text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                    required
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Debe coincidir exactamente</span>
                    {confirmPersonalPin.length > 0 && (
                      confirmPersonalPin === personalPin ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Coincide (Verificado)</span>
                      ) : (
                        <span className="text-rose-500 font-bold">No coincide</span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: SUMMARY & ACTIVATION */}
        {step === 5 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-center space-y-2 shadow-2xs">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                ¡Todo listo para registrar la congregación!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                Verifica el resumen de los datos antes de activar el sistema. Al registrarte podrás generar los códigos de invitación para los demás siervos y ancianos.
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Congregación
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{congregationName}</p>
                <p className="text-slate-700 dark:text-slate-200 font-mono font-bold text-xs pt-0.5">
                  ID: {congregationNumber}
                </p>
                <p className="text-slate-500 font-mono text-xs">
                  Circuito {circuitNumber}
                </p>
                <p className="text-xs text-slate-500">{[city, country].filter(Boolean).join(', ')}</p>
                <p className="text-[11px] text-slate-400 truncate">{hallAddress}</p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 space-y-1.5 shadow-2xs">
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

              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Coordinador Designado
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{coordinatorName}</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-semibold">{coordinatorEmail}</p>
                <p className="text-xs text-slate-500">{coordinatorPhone}</p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Seguridad Teocrática
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSummaryPins(!showSummaryPins)}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {showSummaryPins ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showSummaryPins ? 'Ocultar' : 'Ver claves'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopySecurityData}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                      title="Copiar todos los datos de seguridad juntos"
                    >
                      {copiedSecurity ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSecurity ? '¡Copiado!' : 'Copiar todo'}</span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">ID Congregación:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{congregationNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopySingle(congregationNumber, 'id_step5')}
                        className="text-slate-400 hover:text-indigo-600 p-0.5 cursor-pointer"
                        title="Copiar ID"
                      >
                        {copiedField === 'id_step5' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">PIN Congregación:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {showSummaryPins ? congregationPin : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopySingle(congregationPin, 'pin_cong_step5')}
                        className="text-slate-400 hover:text-indigo-600 p-0.5 cursor-pointer"
                        title="Copiar PIN"
                      >
                        {copiedField === 'pin_cong_step5' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">PIN Personal:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {showSummaryPins ? personalPin : '••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopySingle(personalPin, 'pin_pers_step5')}
                        className="text-slate-400 hover:text-indigo-600 p-0.5 cursor-pointer"
                        title="Copiar PIN Personal"
                      >
                        {copiedField === 'pin_pers_step5' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Botón destacado para copiar todo el cuadro de seguridad sin ir uno por uno */}
                <button
                  type="button"
                  onClick={handleCopySecurityData}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  {copiedSecurity ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSecurity ? '¡Todos los datos copiados al portapapeles!' : 'Copiar todos los datos de seguridad'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Buttons */}
      <div className={`${embedded ? 'pt-4' : 'p-5 bg-slate-50/50 dark:bg-slate-900/50'} border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={step > 1 ? handleBack : onClose}
            className="px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700/70 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs active:scale-[0.99]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{step > 1 ? 'Anterior' : 'Volver atrás'}</span>
          </button>

          {step === 1 && onOpenJoinWithCode && (
            <button
              type="button"
              onClick={onOpenJoinWithCode}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer transition-colors"
            >
              ¿Tienes ID y PIN? Conectar
            </button>
          )}
        </div>

        {step < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20 transition-all"
          >
            <span>Continuar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
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
      <div className="space-y-5 animate-fade-in p-2 sm:p-4">
        {/* Banner de Éxito */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 text-center space-y-2.5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            ¡Congregación Registrada con Éxito!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
            La <strong>{congregationName}</strong> ya está configurada en Kongre. Guarda y copia tus claves y datos antes de comenzar.
          </p>
        </div>

        {/* Tarjeta de Credenciales */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* ID Congregación */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">ID de la Congregación</span>
                <span className="font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white select-all">{congregationNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopySingle(congregationNumber, 'id_final')}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedField === 'id_final' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'id_final' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {/* PIN de la Congregación */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">PIN de la Congregación</span>
                <span className="font-mono font-bold text-sm sm:text-base text-indigo-600 dark:text-indigo-400 select-all">
                  {showSummaryPins ? congregationPin : '••••••••'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopySingle(congregationPin, 'pin_cong_final')}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedField === 'pin_cong_final' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'pin_cong_final' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {/* PIN Personal Coordinador */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Tu PIN Personal (Coordinador)</span>
                <span className="font-mono font-bold text-sm sm:text-base text-emerald-600 dark:text-emerald-400 select-all">
                  {showSummaryPins ? personalPin : '••••••'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopySingle(personalPin, 'pin_pers_final')}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedField === 'pin_pers_final' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'pin_pers_final' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            {/* Coordinador Info */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs">
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
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            {copiedSecurity ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSecurity ? '¡Todos los datos copiados al portapapeles!' : 'Copiar todos los datos de seguridad (ID y PINs)'}</span>
          </button>
        </div>

        {/* Action Buttons: Copiar todo & Descargar .txt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleCopyAll}
            className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 active:scale-[0.99] transition-all cursor-pointer"
          >
            {copiedAll ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedAll ? '¡Todas las credenciales copiadas!' : 'Copiar todas las credenciales'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadTxt}
            className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-200/70 dark:border-slate-700/70 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar comprobante (.txt)</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          💡 Podrás consultar el ID y generar invitaciones para otros ancianos y siervos en cualquier momento desde la pestaña <strong>Ajustes &gt; Seguridad y Roles</strong>.
        </p>

        {/* Enter App Button */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => onRegisteredSuccess()}
            className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>Ir al Gestor Teocrático</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );

    if (embedded) {
      return <div className="space-y-4 pt-1 animate-fade-in">{successCard}</div>;
    }

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col py-6 sm:py-10 px-3 sm:px-6 lg:px-8 transition-colors duration-200">
        <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col justify-center">
          <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden p-4 sm:p-6">
            {successCard}
          </div>
        </div>
      </div>
    );
  }

  if (embedded) {
    return <div className="space-y-4 pt-1 animate-fade-in">{wizardContent}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col py-6 sm:py-10 px-3 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
        {/* Top Back Navigation Bar */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={step > 1 ? handleBack : onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-800 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{step > 1 ? 'Paso anterior' : 'Volver al Inicio'}</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Logo variant="isotipo" className="w-5 h-5 object-contain" />
            <span className="hidden sm:inline">Kongre • Registro de Congregación</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col flex-1">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={step > 1 ? handleBack : onClose}
                className="p-2 -ml-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                title={step > 1 ? 'Paso anterior' : 'Volver atrás'}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Registro de Congregación
                  </h3>
                  {isMandatory && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Requisito Obligatorio
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isMandatory
                    ? 'Debes registrar los datos oficiales de tu congregación para comenzar a usar Kongre'
                    : 'Asistente de configuración inicial teocrática'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar y volver atrás"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {wizardContent}
        </div>
      </div>
    </div>
  );
};
