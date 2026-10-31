// src/components/PublisherEditor/sections/ContactSection.tsx
import React, { useState } from 'react';
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
  Copy,
  Check,
  Compass,
  BookOpen,
  LocateFixed,
} from 'lucide-react';

interface ContactSectionProps {
  formData: Publisher;
  handleChange: (field: keyof Publisher, value: any) => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ formData, handleChange }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [locatingGps, setLocatingGps] = useState(false);

  const cleanPhone = (formData.phone || '').replace(/[^0-9]/g, '');
  const cleanHomePhone = (formData.home_phone || '').replace(/[^0-9]/g, '');

  const fullAddressString = [
    formData.address,
    formData.neighborhood,
    formData.city,
    formData.postal_code,
  ]
    .filter(Boolean)
    .join(', ');

  const googleMapsHref = formData.maps_url?.trim()
    ? formData.maps_url.trim()
    : fullAddressString
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddressString)}`
    : '';

  const wazeHref = fullAddressString
    ? `https://waze.com/ul?q=${encodeURIComponent(fullAddressString)}`
    : '';

  const handleCopy = (key: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCaptureCurrentGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const url = `https://www.google.com/maps?q=${lat},${lng}`;
        handleChange('maps_url', url);
        setLocatingGps(false);
      },
      () => {
        setLocatingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-6">
      {/* BLOQUE 1: CABECERA, ACCIONES RÁPIDAS Y CINTA DE LOCALIZACIÓN */}
      <section className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 md:px-8 border-b border-zinc-100 dark:border-white/[0.05] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 bg-cyan-50 dark:bg-cyan-500/10 rounded-2xl text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-200/50 dark:border-cyan-500/20">
              <Contact size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Contacto, Ubicación Geográfica y Movilidad
                </h3>
                <span className="text-xs font-mono tabular-nums text-zinc-400 dark:text-zinc-500">
                  · {formData.phone ? 'Teléfono activo' : 'Sin móvil'} ·{' '}
                  {formData.address ? 'Domicilio registrado' : 'Sin domicilio'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Canales directos para pastoreo, ubicación GPS ante emergencias, apoyo de transporte y literatura impresa
              </p>
            </div>
          </div>

          {/* Botones de Acción Inmediata */}
          <div className="flex flex-wrap items-center gap-2">
            {cleanPhone && (
              <>
                <a
                  href={`tel:${cleanPhone}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-xs border border-indigo-200/70 dark:border-indigo-800/50 transition-colors"
                >
                  <Phone size={13} />
                  <span>Llamar</span>
                </a>
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xs transition-colors"
                >
                  <MessageSquare size={13} />
                  <span>WhatsApp</span>
                </a>
              </>
            )}
            {formData.email && (
              <a
                href={`mailto:${formData.email}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-white/[0.05] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 font-bold text-xs border border-zinc-200/70 dark:border-white/[0.08] transition-colors"
              >
                <Mail size={13} />
                <span>Correo</span>
              </a>
            )}
          </div>
        </div>

        {/* Cinta KPI de Contacto y Movilidad */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100 dark:divide-white/[0.05] bg-zinc-50/40 dark:bg-white/[0.01]">
          <div className="px-6 py-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Teléfono Móvil
            </span>
            <p className="text-sm font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
              {formData.phone || 'Sin registrar'}
            </p>
          </div>
          <div className="px-6 py-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Canal Preferido
            </span>
            <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400 capitalize mt-0.5">
              {formData.preferred_contact_method === 'call'
                ? 'Llamada telefónica'
                : formData.preferred_contact_method === 'email'
                ? 'Correo electrónico'
                : 'WhatsApp'}
            </p>
          </div>
          <div className="px-6 py-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Movilidad al Salón
            </span>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {formData.has_vehicle
                ? `Vehículo propio (${formData.vehicle_seats || 4} plazas)`
                : formData.needs_ride
                ? 'Requiere transporte'
                : 'Autónomo'}
            </p>
          </div>
          <div className="px-6 py-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Literatura Impresa
            </span>
            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {formData.large_print
                ? 'Letra Grande activa'
                : formData.printed_guide || formData.printed_watchtower
                ? 'Formato estándar impreso'
                : 'Formato digital'}
            </p>
          </div>
        </div>

        {/* 1. Canales Telefónicos y Electrónicos */}
        <div className="p-6 md:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              1. Teléfonos y Correo Electrónico
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-400 mr-1">Preferencia:</span>
              {[
                { id: 'whatsapp', label: 'WhatsApp' },
                { id: 'call', label: 'Llamada' },
                { id: 'email', label: 'Correo' },
              ].map((ch) => {
                const isSel = (formData.preferred_contact_method || 'whatsapp') === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleChange('preferred_contact_method', ch.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      isSel
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-500 border-zinc-200 dark:border-white/[0.06]'
                    }`}
                  >
                    {ch.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  Teléfono Móvil (WhatsApp)
                </label>
                {formData.phone && (
                  <button
                    type="button"
                    onClick={() => handleCopy('phone', formData.phone || '')}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'phone' ? <Check size={10} /> : <Copy size={10} />}
                    <span>{copiedField === 'phone' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <Phone
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="kf-input kf-input-icon w-full font-mono text-xs"
                  placeholder="+54 9 11 1234-5678"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  Teléfono Fijo / Casa
                </label>
                {cleanHomePhone && (
                  <a
                    href={`tel:${cleanHomePhone}`}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Phone size={10} /> Llamar
                  </a>
                )}
              </div>
              <div className="relative">
                <Phone
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="tel"
                  value={formData.home_phone || ''}
                  onChange={(e) => handleChange('home_phone', e.target.value)}
                  className="kf-input kf-input-icon w-full font-mono text-xs"
                  placeholder="Teléfono fijo alternativo"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  Correo Electrónico
                </label>
                {formData.email && (
                  <button
                    type="button"
                    onClick={() => handleCopy('email', formData.email || '')}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'email' ? <Check size={10} /> : <Copy size={10} />}
                    <span>{copiedField === 'email' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="kf-input kf-input-icon w-full text-xs"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BLOQUE 2: DOMICILIO, REFERENCIAS DE PASTOREO Y COORDENADAS GPS */}
      <section className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-2xl sm:rounded-3xl p-6 md:p-8 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-zinc-100 dark:border-white/[0.05]">
          <div className="flex items-center gap-2">
            <MapPin size={17} className="text-cyan-500" />
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              2. Domicilio y Ubicación GPS para Pastoreo y Emergencias
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {fullAddressString && (
              <button
                type="button"
                onClick={() => handleCopy('address', fullAddressString)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 cursor-pointer"
              >
                {copiedField === 'address' ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedField === 'address' ? 'Copiada' : 'Copiar dirección'}</span>
              </button>
            )}
            {googleMapsHref && (
              <a
                href={googleMapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-200/70 dark:border-blue-800/40"
              >
                <Navigation size={12} />
                <span>Google Maps</span>
                <ExternalLink size={10} />
              </a>
            )}
            {wazeHref && (
              <a
                href={wazeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-xs font-bold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 border border-cyan-200/70 dark:border-cyan-800/40"
              >
                <Compass size={12} />
                <span>Waze</span>
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
              Calle, Número Exterior / Interior
            </label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              className="kf-input w-full text-xs"
              placeholder="Ej. Av. Los Rosales 450, Piso 3 Depto B"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
              Referencias de Llegada / Entre Calles
            </label>
            <input
              type="text"
              value={formData.address_reference || ''}
              onChange={(e) => handleChange('address_reference', e.target.value)}
              className="kf-input w-full text-xs"
              placeholder="Ej. Entre San Martín y Belgrano, portón gris, timbre 2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
              Barrio / Colonia / Sector
            </label>
            <input
              type="text"
              value={formData.neighborhood || ''}
              onChange={(e) => handleChange('neighborhood', e.target.value)}
              className="kf-input w-full text-xs"
              placeholder="Ej. Las Flores"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
              Ciudad / Municipio
            </label>
            <input
              type="text"
              value={formData.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              className="kf-input w-full text-xs"
              placeholder="Ej. Buenos Aires"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
              Código Postal
            </label>
            <input
              type="text"
              value={formData.postal_code || ''}
              onChange={(e) => handleChange('postal_code', e.target.value)}
              className="kf-input w-full font-mono text-xs"
              placeholder="Ej. 1425"
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-[#18181F] border border-zinc-200/70 dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
              Enlace Exacto de Google Maps o Coordenadas GPS
            </label>
            <input
              type="url"
              value={formData.maps_url || ''}
              onChange={(e) => handleChange('maps_url', e.target.value)}
              placeholder="https://www.google.com/maps?q=-34.6037,-58.3816"
              className="kf-input w-full bg-white dark:bg-zinc-900 font-mono text-xs"
            />
          </div>
          <button
            type="button"
            onClick={handleCaptureCurrentGps}
            disabled={locatingGps}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0 self-start sm:self-end disabled:opacity-50"
          >
            <LocateFixed size={14} />
            <span>{locatingGps ? 'Capturando GPS...' : 'Capturar GPS Actual'}</span>
          </button>
        </div>
      </section>

      {/* BLOQUE 3: TRANSPORTE Y PUBLICACIONES IMPRESAS */}
      <section className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-2xl sm:rounded-3xl p-6 md:p-8 shadow-xs space-y-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
          3. Apoyo de Transporte, Evacuación y Literatura Impresa
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`p-4 rounded-2xl border transition-all space-y-3 ${
              formData.has_vehicle
                ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-400 dark:border-blue-500/60'
                : 'bg-zinc-50/70 dark:bg-white/[0.02] border-zinc-200/70 dark:border-white/[0.06]'
            }`}
          >
            <button
              type="button"
              onClick={() => handleChange('has_vehicle', !formData.has_vehicle)}
              className="w-full flex items-center justify-between text-xs font-bold cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Car size={18} className={formData.has_vehicle ? 'text-blue-600' : 'text-zinc-400'} />
                <div className="text-left">
                  <p className="text-zinc-900 dark:text-zinc-100">Dispone de vehículo propio</p>
                  <p className="text-[11px] font-normal text-zinc-500">
                    Para salidas al ministerio y plan de contingencia
                  </p>
                </div>
              </div>
              <CheckCircle2
                size={16}
                className={formData.has_vehicle ? 'text-blue-600 opacity-100' : 'opacity-25'}
              />
            </button>

            {formData.has_vehicle && (
              <div className="flex items-center justify-between pt-2.5 border-t border-blue-200/60 dark:border-blue-800/50 text-xs">
                <span className="text-[11px] font-semibold text-blue-900 dark:text-blue-300">
                  Plazas / asientos disponibles:
                </span>
                <div className="flex items-center gap-1">
                  {[2, 3, 4, 5, 7].map((seats) => (
                    <button
                      key={seats}
                      type="button"
                      onClick={() => handleChange('vehicle_seats', seats)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                        (formData.vehicle_seats || 4) === seats
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {seats}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleChange('needs_ride', !formData.needs_ride)}
            className={`p-4 rounded-2xl border transition-all flex items-center justify-between text-xs font-bold cursor-pointer ${
              formData.needs_ride
                ? 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-500/60'
                : 'bg-zinc-50/70 dark:bg-white/[0.02] text-zinc-700 dark:text-zinc-300 border-zinc-200/70 dark:border-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-3 text-left">
              <Home size={18} className={formData.needs_ride ? 'text-amber-600' : 'text-zinc-400'} />
              <div>
                <p>Necesita apoyo de transporte para asistir al Salón</p>
                <p className="text-[11px] font-normal text-zinc-500">
                  Notifica al superintendente de grupo para coordinar traslado
                </p>
              </div>
            </div>
            <CheckCircle2
              size={16}
              className={formData.needs_ride ? 'text-amber-600 opacity-100' : 'opacity-25'}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {[
            {
              key: 'printed_guide' as const,
              label: 'Guía de Actividades impresa',
              desc: 'Ejemplar físico bimestral',
            },
            {
              key: 'printed_watchtower' as const,
              label: 'La Atalaya de estudio impresa',
              desc: 'Ejemplar físico mensual',
            },
            {
              key: 'large_print' as const,
              label: 'Edición en Letra Grande',
              desc: 'Priorizar formato accesible',
            },
          ].map((pubItem) => {
            const active = Boolean(formData[pubItem.key]);
            return (
              <button
                key={pubItem.key}
                type="button"
                onClick={() => handleChange(pubItem.key, !active)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  active
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/35 border-indigo-400 dark:border-indigo-500/60 text-indigo-950 dark:text-indigo-200'
                    : 'bg-zinc-50/70 dark:bg-white/[0.02] border-zinc-200/70 dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BookOpen
                    size={15}
                    className={active ? 'text-indigo-600 shrink-0' : 'text-zinc-400 shrink-0'}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{pubItem.label}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{pubItem.desc}</p>
                  </div>
                </div>
                <CheckCircle2
                  size={15}
                  className={active ? 'text-indigo-600 shrink-0' : 'opacity-25 shrink-0'}
                />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
