// src/components/PublisherEditor/sections/ContactSection.tsx
import React from 'react';
import { Publisher } from '../../../types';
import {
  Phone,
  Mail,
  MapPin,
  Contact,
  MessageSquare,
  ExternalLink,
  Car,
  Home,
  CheckCircle2,
  Navigation,
} from 'lucide-react';

interface ContactSectionProps {
  formData: Publisher;
  handleChange: (field: keyof Publisher, value: any) => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ formData, handleChange }) => {
  const cleanPhone = (formData.phone || '').replace(/[^0-9]/g, '');

  const openGoogleMaps = () => {
    const fullQuery = [formData.address, formData.neighborhood, formData.city]
      .filter(Boolean)
      .join(', ');
    if (!fullQuery) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullQuery)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm transition-all space-y-5 sm:space-y-6">
      {/* Cabecera de Contacto */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400">
            <Contact size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Datos de Contacto y Residencia
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Canales directos para pastoreo, superintendente de grupo y avisos
            </p>
          </div>
        </div>

        {/* Acceso rápido a WhatsApp si hay número */}
        {cleanPhone && (
          <a
            href={`https://wa.me/${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-semibold text-xs border border-emerald-200/60 dark:border-emerald-800/40 transition-colors shrink-0"
            title="Abrir chat en WhatsApp"
          >
            <MessageSquare size={13} />
            <span>Chat WhatsApp</span>
          </a>
        )}
      </div>

      {/* Teléfono Móvil, Fijo y Email */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
              Teléfono Móvil (WhatsApp)
            </label>
            <div className="relative">
              <Phone
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="kf-input kf-input-icon w-full"
                placeholder="+54 9 11 1234-5678"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
              Teléfono Fijo / Alternativo
            </label>
            <div className="relative">
              <Phone
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="tel"
                value={formData.home_phone || ''}
                onChange={(e) => handleChange('home_phone', e.target.value)}
                className="kf-input kf-input-icon w-full"
                placeholder="Teléfono fijo de casa"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className="kf-input kf-input-icon w-full"
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>
        </div>

        {/* Método preferido de contacto */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-medium text-zinc-500 mr-1">Canal de preferencia:</span>
          {[
            { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
            { id: 'call', label: 'Llamada telefónica', icon: Phone },
            { id: 'email', label: 'Correo electrónico', icon: Mail },
          ].map((ch) => {
            const isSel = (formData.preferred_contact_method || 'whatsapp') === ch.id;
            const Icon = ch.icon;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => handleChange('preferred_contact_method', ch.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-2xs font-semibold'
                    : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-500 border-zinc-200/60 dark:border-white/[0.06] hover:bg-zinc-100'
                }`}
              >
                <Icon size={12} />
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Domicilio Completo y Mapa */}
      <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-white/[0.04]">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Dirección del Domicilio
          </label>
          {(formData.address || formData.city) && (
            <button
              type="button"
              onClick={openGoogleMaps}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <Navigation size={12} />
              <span>Abrir en Google Maps</span>
              <ExternalLink size={11} />
            </button>
          )}
        </div>

        <div>
          <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
            Calle y Número Exterior / Interior
          </label>
          <div className="relative">
            <MapPin
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              className="kf-input kf-input-icon w-full"
              placeholder="Ej. Av. Los Rosales 450, Piso 3 Depto B"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
              Barrio / Colonia / Sector
            </label>
            <input
              type="text"
              value={formData.neighborhood || ''}
              onChange={(e) => handleChange('neighborhood', e.target.value)}
              className="kf-input w-full"
              placeholder="Ej. Centro / Las Flores"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
              Ciudad / Municipio
            </label>
            <input
              type="text"
              value={formData.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              className="kf-input w-full"
              placeholder="Ej. Buenos Aires"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
              Código Postal
            </label>
            <input
              type="text"
              value={formData.postal_code || ''}
              onChange={(e) => handleChange('postal_code', e.target.value)}
              className="kf-input w-full"
              placeholder="Ej. 1425"
            />
          </div>
        </div>
      </div>

      {/* Apoyo de Transporte y Vehículo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 border-t border-zinc-100 dark:border-white/[0.04]">
        <button
          type="button"
          onClick={() => handleChange('has_vehicle', !formData.has_vehicle)}
          className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-xs font-semibold cursor-pointer ${
            formData.has_vehicle
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-2xs'
              : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-400 border-zinc-200/70 dark:border-white/[0.06] hover:bg-zinc-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Car size={16} className={formData.has_vehicle ? 'text-blue-600' : 'text-zinc-400'} />
            <div className="text-left">
              <p>Tiene vehículo propio</p>
              <p className="text-[10px] font-normal text-zinc-400">
                Puede apoyar transportando hermanos en predicación
              </p>
            </div>
          </div>
          <CheckCircle2
            size={16}
            className={formData.has_vehicle ? 'text-blue-600 opacity-100' : 'opacity-20'}
          />
        </button>

        <button
          type="button"
          onClick={() => handleChange('needs_ride', !formData.needs_ride)}
          className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-xs font-semibold cursor-pointer ${
            formData.needs_ride
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 shadow-2xs'
              : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-400 border-zinc-200/70 dark:border-white/[0.06] hover:bg-zinc-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Home size={16} className={formData.needs_ride ? 'text-amber-600' : 'text-zinc-400'} />
            <div className="text-left">
              <p>Necesita transporte al salón</p>
              <p className="text-[10px] font-normal text-zinc-400">
                Avisar al superintendente de grupo para coordinar viaje
              </p>
            </div>
          </div>
          <CheckCircle2
            size={16}
            className={formData.needs_ride ? 'text-amber-600 opacity-100' : 'opacity-20'}
          />
        </button>
      </div>
    </section>
  );
};
