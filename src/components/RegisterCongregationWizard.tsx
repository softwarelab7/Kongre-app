// src/components/RegisterCongregationWizard.tsx
import React, { useState } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { useAuth } from '../context/AuthContext';
import { useSecurity } from '../context/SecurityContext';
import { hashPasscode } from '../utils/theocraticSecurity';
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
} from 'lucide-react';

interface RegisterCongregationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisteredSuccess: () => void;
  isMandatory?: boolean;
  onOpenJoinWithCode?: () => void;
}

export const RegisterCongregationWizard: React.FC<RegisterCongregationWizardProps> = ({
  isOpen,
  onClose,
  onRegisteredSuccess,
  isMandatory = false,
  onOpenJoinWithCode,
}) => {
  const { settings, updateSettings, publishers, addPublisher } = useCongregation();
  const { user, assignRoleToEmail, setActiveRole, assignPersonalPinToRole } = useAuth();
  const { setCongregationPin, setPersonalPin, setMasterPassphrase } = useSecurity();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Congregation info
  const [congregationName, setCongregationName] = useState(
    settings.congregationName || ''
  );
  const [congregationNumber, setCongregationNumber] = useState(
    settings.congregationNumber || ''
  );
  const [circuitNumber, setCircuitNumber] = useState(settings.circuitNumber || '');
  const [city, setCity] = useState(settings.city || '');
  const [country, setCountry] = useState(settings.country || '');
  const [hallAddress, setHallAddress] = useState(settings.hallAddress || '');

  // Step 2: Meeting Schedules
  const [midweekDay, setMidweekDay] = useState(settings.midweekMeetingDay || 'Miércoles');
  const [midweekTime, setMidweekTime] = useState(settings.midweekMeetingTime || '19:00');
  const [weekendDay, setWeekendDay] = useState(settings.weekendMeetingDay || 'Domingo');
  const [weekendTime, setWeekendTime] = useState(settings.weekendMeetingTime || '10:00');

  // Step 3: Coordinator Details
  const [coordinatorName, setCoordinatorName] = useState(
    settings.coordinatorName || user?.displayName || ''
  );
  const [coordinatorEmail, setCoordinatorEmail] = useState(
    settings.coordinatorEmail || user?.email || ''
  );
  const [coordinatorPhone, setCoordinatorPhone] = useState(settings.coordinatorPhone || '');

  // Step 4: Security (NW Scheduler Standard: PIN de Congregación + PIN Personal)
  const [congregationPin, setCongregationPinInput] = useState('');
  const [confirmCongregationPin, setConfirmCongregationPin] = useState('');
  const [personalPin, setPersonalPinInput] = useState('');
  const [confirmPersonalPin, setConfirmPersonalPin] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateId = () => {
    const randomId = String(Math.floor(10000 + Math.random() * 90000));
    setCongregationNumber(randomId);
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!congregationName.trim()) {
        setError('Por favor introduce el nombre oficial de la congregación.');
        return false;
      }
      if (!congregationNumber.trim()) {
        setError('Por favor introduce el ID / Número de la Congregación (NW Scheduler).');
        return false;
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

      // 1. Update Congregation Settings in context and Firestore
      await updateSettings({
        congregationName: congregationName.trim(),
        congregationNumber: congregationNumber.trim(),
        congregationId: congregationNumber.trim(),
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

      // 4. Add Coordinator as first publisher if publishers list is empty
      if (publishers.length === 0 && coordinatorName.trim()) {
        addPublisher({
          name: coordinatorName.trim(),
          gender: 'hermano',
          phone: coordinatorPhone.trim(),
          email: coordinatorEmail.trim().toLowerCase(),
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
      sessionStorage.removeItem('kongre_show_landing');

      setIsSubmitting(false);
      onRegisteredSuccess();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl lg:max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
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
                  : 'Asistente de configuración inicial (Estándar Organized)'}
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

        {/* Step Indicator Progress Bar */}
        <div className="px-6 pt-4 pb-2 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            {stepsList.map((s, index) => {
              const isPassed = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPassed
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-semibold hidden sm:inline ${
                      isCurrent
                        ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {s.title}
                  </span>
                  {index < stepsList.length - 1 && (
                    <div className="w-6 sm:w-10 h-0.5 bg-slate-200 dark:bg-slate-800 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: CONGREGATION INFO */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-slate-700 dark:text-slate-300">
                <span className="font-bold block mb-1">Paso 1: Identidad de la Congregación</span>
                <p>
                  Ingresa los datos oficiales de tu congregación tal como aparecen en los registros teocráticos.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Nombre de la Congregación: *
                </label>
                <input
                  type="text"
                  value={congregationName}
                  onChange={(e) => setCongregationName(e.target.value)}
                  placeholder="Ej: Congregación Central, Congregación Los Olivos"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      ID de la Congregación: *
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateId}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generar ID</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={congregationNumber}
                    onChange={(e) => setCongregationNumber(e.target.value)}
                    placeholder="Ej: 10582 (Estándar NW Scheduler)"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Número o identificador teocrático de tu congregación.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Circuito Asignado: *
                  </label>
                  <input
                    type="text"
                    value={circuitNumber}
                    onChange={(e) => setCircuitNumber(e.target.value)}
                    placeholder="Ej: CO-04, ES-08, MX-12"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ciudad / Municipio: *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ej: Bogotá, Madrid, Santiago"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    País: *
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Ej: Colombia, España, México"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dirección del Salón del Reino: *
                </label>
                <input
                  type="text"
                  value={hallAddress}
                  onChange={(e) => setHallAddress(e.target.value)}
                  placeholder="Ej: Calle 45 # 12-34, Barrio El Paraíso"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 2: MEETINGS AND SCHEDULES */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-slate-700 dark:text-slate-300">
                <span className="font-bold block mb-1">Paso 2: Días y Horarios de las Reuniones</span>
                <p>
                  Configura cuándo se llevan a cabo las reuniones para calcular automáticamente las fechas de los programas semanales y hojas S-89.
                </p>
              </div>

              {/* Midweek Meeting */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-bold text-slate-900 dark:text-white">
                    Reunión Entre Semana (Vida y Ministerio Cristianos)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Día de la semana:
                    </label>
                    <select
                      value={midweekDay}
                      onChange={(e) => setMidweekDay(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="Lunes">Lunes</option>
                      <option value="Martes">Martes</option>
                      <option value="Miércoles">Miércoles</option>
                      <option value="Jueves">Jueves</option>
                      <option value="Viernes">Viernes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Hora de inicio:
                    </label>
                    <input
                      type="time"
                      value={midweekTime}
                      onChange={(e) => setMidweekTime(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Weekend Meeting */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-slate-900 dark:text-white">
                    Reunión Fin de Semana (Discurso Público y La Atalaya)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Día de la semana:
                    </label>
                    <select
                      value={weekendDay}
                      onChange={(e) => setWeekendDay(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="Sábado">Sábado</option>
                      <option value="Domingo">Domingo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Hora de inicio:
                    </label>
                    <input
                      type="time"
                      value={weekendTime}
                      onChange={(e) => setWeekendTime(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: COORDINATOR INFO */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-slate-700 dark:text-slate-300">
                <span className="font-bold block mb-1">Paso 3: Datos del Coordinador del Cuerpo de Ancianos</span>
                <p>
                  El Coordinador tendrá acceso total como administrador general de la congregación y podrá generar invitaciones para los demás ancianos y siervos.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Nombre completo del Coordinador: *
                </label>
                <input
                  type="text"
                  value={coordinatorName}
                  onChange={(e) => setCoordinatorName(e.target.value)}
                  placeholder="Ej: Héctor Gutiérrez"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Correo Electrónico (Google / Cuenta principal): *
                </label>
                <input
                  type="email"
                  value={coordinatorEmail}
                  onChange={(e) => setCoordinatorEmail(e.target.value)}
                  placeholder="Ej: hectorguti95@gmail.com"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  * Esta cuenta recibirá acceso de Coordinador con supervisión de todos los departamentos.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono / WhatsApp de Contacto: *
                </label>
                <input
                  type="tel"
                  value={coordinatorPhone}
                  onChange={(e) => setCoordinatorPhone(e.target.value)}
                  placeholder="Ej: +57 300 1234567"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 4: SECURITY - PIN DE CONGREGACIÓN Y PIN PERSONAL (NW SCHEDULER STANDARD) */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-slate-700 dark:text-slate-300">
                <span className="font-bold text-amber-950 dark:text-amber-200 block mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Paso 4: Seguridad Teocrática y Roles (Estándar NW Scheduler)
                </span>
                <p className="text-amber-900/80 dark:text-amber-300/80">
                  Define el <strong>PIN de Bloqueo de la App</strong> (para bloquear la pantalla) y tu <strong>PIN Personal</strong> (que funciona como código de identificación de roles).
                </p>
              </div>

              {/* 1. PIN de Bloqueo de la Aplicación (Salón del Reino) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      1. PIN de Bloqueo de la Aplicación (Obligatorio)
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      Este PIN se utilizará para bloquear la app y proteger la pantalla en el Salón del Reino en caso de inactividad o para salir de la sesión.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      PIN de Bloqueo de la App (4 a 8 caracteres/dígitos): *
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      value={congregationPin}
                      onChange={(e) => setCongregationPinInput(e.target.value)}
                      placeholder="Ej: 7492 o teo2026"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold tracking-widest text-center"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Confirmar PIN de Bloqueo: *
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      value={confirmCongregationPin}
                      onChange={(e) => setConfirmCongregationPin(e.target.value)}
                      placeholder="Repite el PIN"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold tracking-widest text-center"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 2. PIN Personal (Identificación de Roles dentro de la congregación) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      2. Tu PIN Personal - Código de Identificación de Rol (Obligatorio)
                    </span>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      Este PIN funciona como tu código personal de identificación de roles dentro de la congregación. Cada hermano o anciano tendrá su propio PIN Personal para identificarse y activar sus privilegios de rol en la app.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Tu PIN Personal de Rol (4 a 6 dígitos numéricos): *
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={personalPin}
                      onChange={(e) => setPersonalPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej: 1234"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-center tracking-widest font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Confirmar PIN Personal: *
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={confirmPersonalPin}
                      onChange={(e) => setConfirmPersonalPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Repite el PIN"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-center tracking-widest font-bold"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SUMMARY & ACTIVATION */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  ¡Todo Listo para Registrar la Congregación!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  Verifica el resumen de los datos antes de activar el sistema. Al registrarte podrás generar los códigos de invitación para los demás siervos y ancianos.
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Congregación
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{congregationName}</p>
                  <p className="text-slate-600 dark:text-slate-300 font-mono font-bold">
                    ID: {congregationNumber} • Circuito {circuitNumber}
                  </p>
                  <p className="text-slate-500">{[city, country].filter(Boolean).join(', ')}</p>
                  <p className="text-[11px] text-slate-400 truncate">{hallAddress}</p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Reuniones Semanales
                  </span>
                  <p className="text-slate-800 dark:text-slate-200">
                    <strong>Entre semana:</strong> {midweekDay} a las {midweekTime}
                  </p>
                  <p className="text-slate-800 dark:text-slate-200">
                    <strong>Fin de semana:</strong> {weekendDay} a las {weekendTime}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Coordinador Designado
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white">{coordinatorName}</p>
                  <p className="text-indigo-600 dark:text-indigo-400 font-mono">{coordinatorEmail}</p>
                  <p className="text-slate-500">{coordinatorPhone}</p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Seguridad (NW Scheduler)
                  </span>
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">ID Congregación:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{congregationNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">PIN de Congregación:</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">•••• (Configurado)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">PIN Personal:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">•••• (Activo)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={step > 1 ? handleBack : onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{step > 1 ? 'Anterior' : 'Volver atrás'}</span>
            </button>

            {step === 1 && onOpenJoinWithCode && (
              <button
                type="button"
                onClick={onOpenJoinWithCode}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                ¿Tienes un código? Unirse a congregación
              </button>
            )}
          </div>

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-950/20"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/30 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Registrando...' : 'Registrar y Comenzar'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
