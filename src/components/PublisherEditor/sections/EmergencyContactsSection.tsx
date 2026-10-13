import React from 'react';
import { Publisher } from '../../../types';
import { 
  Heart, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  Smartphone, 
  Link, 
  Copy,
  X
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
  showToast
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* CABECERA FLOTANTE TIPO ZERO */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-2 px-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-rose-500/20">
               <Heart size={20} />
            </div>
            <div>
              <span className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 block leading-tight">Contactos de</span>
              <span className="text-[13px] font-bold text-rose-500 block leading-tight">Emergencia</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto relative z-20">
          <div className="relative group flex-1 md:flex-none">
            <div className={`flex items-center gap-3 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border ${showSearchResults ? 'border-rose-500/50 ring-4 ring-rose-500/10' : 'border-zinc-200/50 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/10'} rounded-xl px-4 py-2.5 transition-all w-full md:w-64 shadow-sm`}>
              <Search size={14} className={showSearchResults ? 'text-rose-500' : 'text-zinc-400 group-hover:text-zinc-500'} />
              <input 
                type="text"
                value={publisherSearch}
                onChange={e => {
                  setPublisherSearch(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Buscar publicador..."
                className="bg-transparent text-[11px] font-bold outline-none w-full placeholder:text-zinc-400 text-zinc-800 dark:text-zinc-200"
              />
            </div>

            {showSearchResults && publisherSearch.length > 0 && (
              <>
                <div 
                  className="fixed inset-0 z-[105]" 
                  onClick={() => setShowSearchResults(false)} 
                />
                <div className="absolute z-[110] left-0 right-0 mt-2 bg-white/90 dark:bg-[#0f1623]/90 backdrop-blur-xl border border-zinc-100 dark:border-white/[0.06] rounded-2xl shadow-2xl shadow-rose-500/10 max-h-48 overflow-y-auto overflow-x-hidden no-scrollbar">
                  {allPublishers
                    .filter(p => (p.full_name || p.name || '').toLowerCase().includes(publisherSearch.toLowerCase()) && p.id !== formData.id)
                    .map(p => {
                      const displayName = p.full_name || p.name || 'Publicador';
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setNewContact({
                              name: displayName,
                              relationship: '',
                              phone: p.phone || '',
                              alt_phone: '',
                              email: p.email || ''
                            });
                            setEditingContact(null);
                            setPublisherSearch('');
                            setShowSearchResults(false);
                            setShowEmergencyModal(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-left transition-colors border-b border-zinc-50 dark:border-white/[0.02] last:border-none group/item"
                        >
                          <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 group-hover/item:bg-rose-100 dark:group-hover/item:bg-rose-500/20 group-hover/item:text-rose-600 rounded-full flex items-center justify-center text-[10px] font-black transition-colors">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 leading-none">{displayName}</p>
                            <p className="text-[10px] font-bold text-zinc-400 mt-1">{p.phone || 'Sin teléfono'}</p>
                          </div>
                        </button>
                      );
                    })
                  }
                </div>
              </>
            )}
          </div>

          <button 
            onClick={() => {
              setEditingContact(null);
              setNewContact({ name: '', relationship: '', phone: '', alt_phone: '', email: '' });
              setShowEmergencyModal(true);
            }}
            className="flex items-center justify-center w-10 h-10 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-105 hover:bg-rose-500 dark:hover:bg-rose-500 dark:hover:text-white rounded-xl transition-all shadow-md active:scale-95 group"
            title="Nuevo Contacto"
          >
            <Plus size={16} className="transition-transform group-hover:rotate-90" />
          </button>
        </div>
      </div>

      {/* GRID DE CONTACTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(formData.emergency_contacts || []).map((contact: any) => (
          <div key={contact.id} className="bg-white dark:bg-[#0f1623] border border-zinc-100 dark:border-white/[0.06] rounded-3xl p-5 shadow-sm hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 group-hover:bg-rose-500/10 transition-all duration-700 pointer-events-none" />
            
            <div className="flex items-start justify-between relative z-10 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-500/20 dark:to-rose-500/5 text-rose-500 rounded-2xl flex items-center justify-center text-lg font-black shadow-inner border border-rose-200/50 dark:border-rose-500/20 group-hover:scale-105 transition-transform">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-[14px] leading-tight mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{contact.name}</h4>
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md inline-block border border-rose-100 dark:border-rose-500/20">
                    {contact.relationship}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                <button 
                  onClick={() => {
                    setEditingContact(contact);
                    setNewContact(contact);
                    setShowEmergencyModal(true);
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 hover:bg-amber-100 hover:text-amber-600 rounded-xl transition-all shadow-sm"
                  title="Editar contacto"
                >
                  <Edit2 size={13} />
                </button>
                <button 
                  onClick={() => handleDeleteEmergencyContactLocal(contact.id)}
                  className="w-8 h-8 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 hover:bg-rose-100 hover:text-rose-600 rounded-xl transition-all shadow-sm"
                  title="Eliminar contacto"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div className="space-y-2 relative z-10 mt-auto bg-zinc-50 dark:bg-white/[0.02] p-3 rounded-2xl border border-zinc-100 dark:border-white/[0.04]">
              {contact.phone ? (
                <div className="flex items-center justify-between group/phone">
                   <div className="flex items-center gap-3 text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
                     <div className="w-7 h-7 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 shadow-sm border border-zinc-100 dark:border-white/[0.04] group-hover/phone:text-rose-500 transition-colors shrink-0">
                       <Phone size={13} />
                     </div>
                     <div className="flex flex-col">
                       <span>{contact.phone}</span>
                       {contact.alt_phone && <span className="text-[10px] text-zinc-400 leading-none mt-0.5">{contact.alt_phone}</span>}
                     </div>
                   </div>
                   <a 
                     href={`tel:${contact.phone}`} 
                     className="w-7 h-7 bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white rounded-lg flex items-center justify-center transition-colors shadow-sm shrink-0"
                     title="Llamar"
                   >
                     <Phone size={12} className="fill-current" />
                   </a>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-[12px] font-semibold text-zinc-400">
                   <div className="w-7 h-7 bg-white/50 dark:bg-zinc-800/50 rounded-lg flex items-center justify-center shadow-sm border border-zinc-100/50 dark:border-white/[0.02] shrink-0">
                     <Phone size={13} className="opacity-50" />
                   </div>
                   <span className="italic font-normal">Sin teléfono</span>
                </div>
              )}
              
              {contact.email && (
                <div className="flex items-center justify-between pt-2 border-t border-zinc-200/50 dark:border-white/[0.04] group/email">
                  <div className="flex items-center gap-3 text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 overflow-hidden">
                    <div className="w-7 h-7 bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400 shadow-sm border border-zinc-100 dark:border-white/[0.04] group-hover/email:text-rose-500 transition-colors shrink-0">
                      <Mail size={13} />
                    </div>
                    <span className="truncate">{contact.email}</span>
                  </div>
                  <a 
                     href={`mailto:${contact.email}`} 
                     className="w-7 h-7 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg flex items-center justify-center transition-colors shadow-sm shrink-0"
                     title="Enviar correo"
                   >
                     <Mail size={12} className="fill-current" />
                   </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
