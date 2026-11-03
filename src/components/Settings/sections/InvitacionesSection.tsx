// src/components/Settings/sections/InvitacionesSection.tsx
import React, { useState } from 'react';
import {
  QrCode,
  Building2,
  ShieldCheck,
  KeyRound,
  UserPlus,
  Copy,
  Check,
} from 'lucide-react';

export interface InvitacionesSectionProps {
  invitations: Array<{ status: string; [key: string]: any }>;
  isCongregationPinSet: boolean;
  isPinEnabled: boolean;
  settings: {
    congregationNumber?: string;
    congregationId?: string;
    [key: string]: any;
  };
  onOpenWizard: () => void;
  onOpenInviteModal: () => void;
  onOpenJoinModal: () => void;
}

export const InvitacionesSection: React.FC<InvitacionesSectionProps> = ({
  invitations,
  isCongregationPinSet,
  isPinEnabled,
  settings,
  onOpenWizard,
  onOpenInviteModal,
  onOpenJoinModal,
}) => {
  const [copiedCongId, setCopiedCongId] = useState(false);

  return (
    <div className="kg-card-bento kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 p-6 rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/10 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="kg-glow-badge w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/50 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5]">
              Registro Teocrático e Invitaciones con QR
            </h3>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              Acceso cerrado por invitación y clave de congregación
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenWizard}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Asistente de Registro</span>
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero-Knowledge E2EE</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Invitaciones Activas */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Invitaciones Activas
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 font-mono tabular-nums">
                {invitations.filter((i) => i.status === 'active').length} vigentes
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              Genera códigos alfanuméricos o códigos QR para invitar a ancianos, siervos y publicadores sin registros públicos.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenInviteModal}
            className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Gestionar Invitaciones y QR</span>
          </button>
        </div>

        {/* Card 2: Unirse a la Congregación */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Unirse con Código
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-[#27272A] text-zinc-600 dark:text-[#A1A1AA]">
                Hermano o Dispositivo
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              Introduce un código de invitación recibido para vincular este dispositivo con el rol correspondiente en la congregación.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenJoinModal}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-purple-600" />
            <span>Canjear Código de Invitación</span>
          </button>
        </div>

        {/* Card 3: Credenciales Teocráticas */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-zinc-900 dark:text-[#F4F4F5] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Credenciales de Congregación
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200">
                {isCongregationPinSet ? 'Protegido' : 'Activo'}
              </span>
            </div>
            <div className="space-y-1.5 text-xs mt-2">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-[#A1A1AA]">ID Congregación:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono tabular-nums font-bold text-zinc-900 dark:text-[#F4F4F5]">
                    {settings.congregationNumber || settings.congregationId || 'No asignado'}
                  </span>
                  {(settings.congregationNumber || settings.congregationId) && (
                    <button
                      type="button"
                      onClick={() => {
                        const id = settings.congregationNumber || settings.congregationId || '';
                        navigator.clipboard.writeText(id);
                        setCopiedCongId(true);
                        setTimeout(() => setCopiedCongId(false), 2000);
                      }}
                      className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-500 hover:text-zinc-700 dark:hover:text-[#F4F4F5] transition-all cursor-pointer"
                      title="Copiar ID de la Congregación"
                    >
                      {copiedCongId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-[#A1A1AA]">PIN Congregación:</span>
                <span className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">•••• (Configurado)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-[#A1A1AA]">Tu PIN Personal:</span>
                <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                  {isPinEnabled ? '•••• (Activo)' : 'Sin configurar'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenWizard}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] hover:bg-zinc-100 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Ver Asistente de Registro</span>
          </button>
        </div>
      </div>
    </div>
  );
};
