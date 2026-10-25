// src/components/PublisherEditor/sections/EmergencyContactsSection.tsx
import React, { useState } from 'react';
import { Publisher } from '../../../types';
import {
  PhoneCall,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  Copy,
  Check,
  UserPlus,
  ShieldAlert,
} from 'lucide-react';

interface EmergencyContactsSectionProps {
  formData: Publisher;
  allPublishers: Publisher[];
  publisherSearch: string;
  setPublisherSearch: (val: string) => void;
  showSearchResults: boolean;
  setShowSearchResults: (val: boolean) => void;
  setNewContact: (contact: any) => void;
  setEditingContact: (contact: any) => void;
  setShowEmergencyModal: (show: boolean) => void;
  handleDeleteEmergencyContactLocal: (id: string) => void;
  showToast: (msg: string, type?: any) => void;
}

export const EmergencyContactsSection: React.FC<EmergencyContactsSectionProps> = ({
  formData,
  allPublishers,
  publisherSearch,
  setPublisherSearch,
  showSearchResults,
  setShowSearchResults,
  setNewContact,
  setEditingContact,
  setShowEmergencyModal,
  handleDeleteEmergencyContactLocal,
  showToast,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const contacts = (formData.emergency_contacts || []).filter((c: any) => c && c.name);

  const handleCopyPhone = (id: string, phone: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Teléfono copiado al portapapeles', 'success');
  };

  const cleanDigits = (val?: string) => (val || '').replace(/[^0-9]/g, '');

  const matchingDirectoryPublishers = allPublishers
    .filter(
      (p) =>
        (p.full_name || p.name || '')
          .toLowerCase()
          .includes(publisherSearch.trim().toLowerCase()) && p.id !== formData.id
    )
    .slice(0, 6);

  return (
    <section className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-xs space-y-6 animate-in fade-in duration-300">
      {/* CABECERA EDITORIAL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-white/[0.05]">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/50 dark:border-rose-500/20">
            <PhoneCall size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Contactos de Emergencia
              </h3>
              <span className="text-xs font-mono tabular-nums text-zinc-400 dark:text-zinc-500">
                · {contacts.length} {contacts.length === 1 ? 'registrado' : 'registrados'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Familiares directos o hermanos de confianza para localización urgente ante contingencias o salud
            </p>
          </div>
        </div>

        {/* Buscador de Directorio + Botón Nuevo */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 relative z-20">
          <div className="relative flex-1 sm:w-64">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
            <input
              type="text"
              value={publisherSearch}
              onChange={(e) => {
                setPublisherSearch(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Importar desde congregación..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/[0.08] text-xs font-medium text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-rose-500 transition-colors"
            />

            {showSearchResults && publisherSearch.trim().length > 0 && (
              <>
                <div
                  className="fixed inset-0 z-[105]"
                  onClick={() => setShowSearchResults(false)}
                />
                <div className="absolute z-[110] left-0 right-0 mt-1.5 bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-white/[0.04]">
                  {matchingDirectoryPublishers.length === 0 ? (
                    <div className="p-3 text-xs text-zinc-400 text-center">
                      No se encontraron hermanos con ese nombre
                    </div>
                  ) : (
                    matchingDirectoryPublishers.map((p) => {
                      const displayName = p.full_name || p.name || 'Publicador';
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setNewContact({
                              name: displayName,
                              relationship: 'Hermano(a) de la congregación',
                              phone: p.phone || p.home_phone || '',
                              alt_phone: p.home_phone && p.phone ? p.home_phone : '',
                              email: p.email || '',
                            });
                            setEditingContact(null);
                            setPublisherSearch('');
                            setShowSearchResults(false);
                            setShowEmergencyModal(true);
                          }}
                          className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-rose-50/60 dark:hover:bg-rose-500/10 text-left transition-colors cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {displayName}
                            </p>
                            <p className="text-[11px] font-mono tabular-nums text-zinc-400 truncate">
                              {p.phone || p.home_phone || 'Sin teléfono registrado'}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 shrink-0">
                            <UserPlus size={12} /> Vincular
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingContact(null);
              setNewContact({
                name: '',
                relationship: '',
                phone: '',
                alt_phone: '',
                email: '',
              });
              setShowEmergencyModal(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Plus size={15} />
            <span>Agregar Contacto</span>
          </button>
        </div>
      </div>

      {/* ESTADO VACÍO O TARJETAS DE CONTACTO */}
      {contacts.length === 0 ? (
        <div className="py-10 px-4 rounded-2xl border border-dashed border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.01] flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <ShieldAlert size={20} />
          </div>
          <div className="max-w-md space-y-1">
            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              Sin contactos de emergencia registrados
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Registra al menos un familiar o hermano de confianza para que los ancianos y el superintendente de grupo puedan comunicarse ante cualquier emergencia.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setEditingContact(null);
                setNewContact({
                  name: '',
                  relationship: '',
                  phone: '',
                  alt_phone: '',
                  email: '',
                });
                setShowEmergencyModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Registrar primer contacto</span>
            </button>

            {formData.healthcare_agent_name && (
              <button
                type="button"
                onClick={() => {
                  setEditingContact(null);
                  setNewContact({
                    name: formData.healthcare_agent_name || '',
                    relationship: 'Representante Médico (DPA)',
                    phone: formData.healthcare_agent_phone || '',
                    alt_phone: '',
                    email: '',
                  });
                  setShowEmergencyModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 text-xs font-semibold transition-colors cursor-pointer"
              >
                <UserPlus size={14} className="text-rose-500" />
                <span>Usar representante DPA ({formData.healthcare_agent_name})</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact: any, idx: number) => {
            const digits = cleanDigits(contact.phone);
            const isPrimary = idx === 0;

            return (
              <div
                key={contact.id || idx}
                className="bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/[0.06] hover:border-rose-300 dark:hover:border-rose-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all"
              >
                <div>
                  {/* Fila Superior: Nombre, Parentesco y Acciones Editar/Borrar siempre accesibles */}
                  <div className="flex items-start justify-between gap-2 pb-3.5 border-b border-zinc-200/60 dark:border-white/[0.05]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-100/80 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center text-sm font-bold shrink-0">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate">
                            {contact.name}
                          </h4>
                          {isPrimary && (
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 shrink-0">
                              · 1°
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                          {contact.relationship || 'Contacto de emergencia'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingContact(contact);
                          setNewContact(contact);
                          setShowEmergencyModal(true);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                        title="Editar contacto"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEmergencyContactLocal(contact.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Eliminar contacto"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Datos Telefónicos y Correo */}
                  <div className="py-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">Teléfono:</span>
                      {contact.phone ? (
                        <button
                          type="button"
                          onClick={() => handleCopyPhone(contact.id, contact.phone)}
                          className="inline-flex items-center gap-1.5 font-mono tabular-nums font-bold text-zinc-800 dark:text-zinc-200 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                          title="Copiar número"
                        >
                          <span>{contact.phone}</span>
                          {copiedId === contact.id ? (
                            <Check size={11} className="text-emerald-500" />
                          ) : (
                            <Copy size={11} className="opacity-50" />
                          )}
                        </button>
                      ) : (
                        <span className="italic text-zinc-400">No registrado</span>
                      )}
                    </div>

                    {contact.alt_phone && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-zinc-400">Alternativo:</span>
                        <span className="font-mono tabular-nums font-semibold text-zinc-700 dark:text-zinc-300">
                          {contact.alt_phone}
                        </span>
                      </div>
                    )}

                    {contact.email && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-zinc-400 shrink-0">Correo:</span>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">
                          {contact.email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botonera Directa de Comunicación */}
                <div className="pt-3 border-t border-zinc-200/60 dark:border-white/[0.05] flex items-center gap-2">
                  {digits ? (
                    <>
                      <a
                        href={`tel:${digits}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/[0.08] text-xs font-semibold transition-colors"
                      >
                        <Phone size={13} className="text-rose-500" />
                        <span>Llamar</span>
                      </a>
                      <a
                        href={`https://wa.me/${digits}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50 text-xs font-semibold transition-colors"
                      >
                        <MessageSquare size={13} />
                        <span>WhatsApp</span>
                      </a>
                    </>
                  ) : (
                    <span className="text-[11px] text-zinc-400 italic py-1">
                      Agrega un teléfono para llamada o WhatsApp rápido
                    </span>
                  )}

                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="p-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/[0.08] transition-colors"
                      title="Enviar correo"
                    >
                      <Mail size={13} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
