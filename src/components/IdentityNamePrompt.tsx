import React, { useState } from 'react';
import { UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCongregation } from '../context/CongregationContext';
import type { Publisher, TheocraticPrivilege } from '../types';

import { isGenericIdentityName } from '../utils/theocraticSecurity';
import { areNamesEquivalent } from '../utils/publisherDeduplication';

/**
 * Se muestra una sola vez cuando alguien entró con PIN pero el sistema aún no sabe su nombre.
 * Guarda el nombre, lo vincula al PIN y crea su ficha en Publicadores (que se respalda por ID de congregación).
 */
export const IdentityNamePrompt: React.FC = () => {
  const {
    currentBrotherName,
    setIdentifiedBrother,
    activeRole,
    userRolesList,
    assignRoleToEmail,
    assignPersonalPinToPublisher,
  } = useAuth();
  const { publishers, addPublisher, updatePublisher, settings, updateSettings } = useCongregation();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('kongre_identity_prompt_dismissed') === 'true');

  if (dismissed || !isGenericIdentityName(currentBrotherName)) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (clean.length < 3) {
      setError('Escribe tu nombre completo.');
      return;
    }

    // PIN personal con el que entró esta sesión (guardado al ingresar)
    const roleEntry =
      userRolesList.find((r) => r.role === activeRole && r.personalPin && isGenericIdentityName(r.name)) ||
      userRolesList.find((r) => r.role === activeRole && r.personalPin);
    const pin = roleEntry?.personalPin || '';

    setIdentifiedBrother(clean);

    const existing = publishers.find(
      (p) =>
        areNamesEquivalent(p.name, clean) ||
        (pin && p.personalPin && String(p.personalPin).trim() === pin.trim())
    );
    const isElder = activeRole === 'coordinador' || activeRole === 'secretario' || activeRole === 'superintendente_vym' || activeRole === 'anciano';
    const isSM = activeRole.startsWith('siervo_');
    const privilege: TheocraticPrivilege | undefined =
      isElder
        ? 'anciano'
        : isSM
        ? 'siervo_ministerial'
        : undefined;

    let publisherId = existing?.id || '';
    if (existing) {
      const updated: Publisher = { ...existing };
      if (pin && existing.personalPin !== pin) updated.personalPin = pin;
      if (clean && clean !== existing.name) updated.name = clean;
      updatePublisher(updated);
    } else {
      addPublisher({
        name: clean,
        gender: 'hermano',
        phone: '',
        email: roleEntry?.email && !roleEntry.email.startsWith('hermano_') ? roleEntry.email : '',
        personalPin: pin || undefined,
        notes: activeRole === 'coordinador' ? 'Coordinador del Cuerpo de Ancianos' : '',
        active: true,
        groupNumber: 1,
        privilege,
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
      } as Omit<Publisher, 'id'>);
    }

    if (pin) {
      if (publisherId) assignPersonalPinToPublisher(publisherId, pin, activeRole, clean);
      if (roleEntry) assignRoleToEmail(roleEntry.email, activeRole, clean, pin);
    }

    if (activeRole === 'coordinador') {
      try {
        localStorage.setItem('kongre_coordinator_name', clean);
      } catch {}
      if (isGenericIdentityName(settings.coordinatorName)) {
        updateSettings({ coordinatorName: clean });
      }
    }

    sessionStorage.setItem('kongre_identity_prompt_dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">¿Quién eres?</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Entraste con tu PIN pero aún no tenemos tu nombre. Se guardará una sola vez en tu congregación.
            </p>
          </div>
        </div>

        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder="Tu nombre completo"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('kongre_identity_prompt_dismissed', 'true');
              setDismissed(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Ahora no
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
};
