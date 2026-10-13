import React from 'react';
import { Publisher } from '../../../types';
import { Phone, Mail, MapPin, Contact } from 'lucide-react';

interface ContactSectionProps {
  formData: Publisher;
  handleChange: (field: keyof Publisher, value: any) => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ formData, handleChange }) => {
  return (
    <section className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
          <Contact size={18} />
        </div>
        <h3 className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-200">Datos de Contacto</h3>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block ml-1">Teléfono Móvil</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="tel" 
                value={formData.phone || ''}
                onChange={e => handleChange('phone', e.target.value)}
                className="kf-input kf-input-icon w-full"
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block ml-1">Correo Electrónico</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="email" 
                value={formData.email || ''}
                onChange={e => handleChange('email', e.target.value)}
                className="kf-input kf-input-icon w-full"
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 block ml-1">Dirección de Domicilio</label>
          <div className="relative">
            <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text"
              value={formData.address || ''}
              onChange={e => handleChange('address', e.target.value)}
              className="kf-input kf-input-icon w-full"
              placeholder="Ej. Calle Principal 123, Ciudad"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
