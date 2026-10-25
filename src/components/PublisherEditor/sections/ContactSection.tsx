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
    <section className="bg-white dark:bg-[#0f1623] border border-zinc-200 dark:border-white/[0.06] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm transition-all space-y-6">
      {/* Cabecera de Contacto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-white/[0.04]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-500/10 rounded-2xl text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 ring-4 ring-cyan-500/5">
            <Contact size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Contacto, Domicilio y Movilidad
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Canales directos para pastoreo, superintendente de grupo, ubicación en emergencias y transporte
            </p>
          </div>
        </div>

        {/* Acciones rápidas de comunicación */}
        <div className="flex flex-wrap items-center gap-2">
          {cleanPhone && (
            <>
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-semibold text-xs border border-indigo-200/60 dark:border-indigo-800/40 transition-colors"
                title="Llamar al teléfono móvil"
              >
                <Phone size={13} />
                <span>Llamar</span>
              </a>
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-semibold text-xs border border-emerald-200/60 dark:border-emerald-800/40 transition-colors"
                title="Abrir chat en WhatsApp"
              >
                <MessageSquare size={13} />
                <span>WhatsApp</span>
              </a>
            </>
          )}
          {formData.email && (
            <a
              href={`mailto:${formData.email}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 hover:bg-sky-100 font-semibold text-xs border border-sky-200/60 dark:border-sky-800/40 transition-colors"
              title="Enviar correo electrónico"
            >
              <Mail size={13} />
              <span>Correo</span>
            </a>
          )}
        </div>
      </div>

      {/* Teléfono Móvil, Fijo y Email */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                Teléfono Móvil (WhatsApp)
              </label>
              {formData.phone && (
                <button
                  type="button"
                  onClick={() => handleCopy('phone', formData.phone)}
                  className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
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
                className="kf-input kf-input-icon w-full"
                placeholder="+54 9 11 1234-5678"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                Teléfono Fijo / Alternativo
              </label>
              {cleanHomePhone && (
                <a
                  href={`tel:${cleanHomePhone}`}
                  className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  <Phone size={10} /> Llamar fijo
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
                className="kf-input kf-input-icon w-full"
                placeholder="Teléfono fijo de casa"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                Correo Electrónico
              </label>
              {formData.email && (
                <button
                  type="button"
                  onClick={() => handleCopy('email', formData.email || '')}
                  className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
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
                    ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800 shadow-2xs font-semibold'
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

      {/* Domicilio Completo, Referencia y Enlaces de Navegación */}
      <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Dirección del Domicilio y Ubicación Geográfica
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {fullAddressString && (
              <button
                type="button"
                onClick={() => handleCopy('address', fullAddressString)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 cursor-pointer"
              >
                {copiedField === 'address' ? <Check size={11} /> : <Copy size={11} />}
                <span>{copiedField === 'address' ? 'Dirección copiada' : 'Copiar dirección'}</span>
              </button>
            )}
            {googleMapsHref && (
              <a
                href={googleMapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-200/60 dark:border-blue-800/40"
              >
                <Navigation size={11} />
                <span>Google Maps</span>
                <ExternalLink size={10} />
              </a>
            )}
            {wazeHref && (
              <a
                href={wazeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-xs font-semibold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 border border-cyan-200/60 dark:border-cyan-800/40"
              >
                <Compass size={11} />
                <span>Waze</span>
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div>
            <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 block">
              Referencias de Llegada / Entre Calles (Pastoreo y Emergencias)
            </label>
            <input
              type="text"
              value={formData.address_reference || ''}
              onChange={(e) => handleChange('address_reference', e.target.value)}
              className="kf-input w-full"
              placeholder="Ej. Entre San Martín y Belgrano, portón gris, timbre 2"
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

        {/* Enlace directo GPS o captura de coordenadas */}
        <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
              Enlace de Ubicación Exacta (Google Maps URL o Coordenadas GPS)
            </label>
            <input
              type="url"
              value={formData.maps_url || ''}
              onChange={(e) => handleChange('maps_url', e.target.value)}
              placeholder="https://maps.google.com/?q=-34.6037,-58.3816"
              className="kf-input w-full bg-white dark:bg-zinc-900 text-xs"
            />
          </div>
          <button
            type="button"
            onClick={handleCaptureCurrentGps}
            disabled={locatingGps}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 self-start sm:self-end disabled:opacity-50"
            title="Guardar la ubicación GPS actual del dispositivo"
          >
            <LocateFixed size={14} />
            <span>{locatingGps ? 'Obteniendo GPS...' : 'Usar GPS Actual'}</span>
          </button>
        </div>
      </div>

      {/* Apoyo de Transporte, Vehículo y Publicaciones Impresas */}
      <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-white/[0.04]">
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
          Transporte, Evacuación y Ejemplares Impresos
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div
            className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
              formData.has_vehicle
                ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200/70 dark:border-white/[0.06]'
            }`}
          >
            <button
              type="button"
              onClick={() => handleChange('has_vehicle', !formData.has_vehicle)}
              className="w-full flex items-center justify-between text-xs font-semibold cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Car size={16} className={formData.has_vehicle ? 'text-blue-600' : 'text-zinc-400'} />
                <div className="text-left">
                  <p className={formData.has_vehicle ? 'text-blue-800 dark:text-blue-200 font-bold' : 'text-zinc-700 dark:text-zinc-300'}>
                    Dispone de vehículo propio
                  </p>
                  <p className="text-[10px] font-normal text-zinc-400">
                    Para salidas al campo y apoyo en plan de emergencias
                  </p>
                </div>
              </div>
              <CheckCircle2
                size={16}
                className={formData.has_vehicle ? 'text-blue-600 opacity-100' : 'opacity-20'}
              />
            </button>

            {formData.has_vehicle && (
              <div className="flex items-center justify-between pt-2 border-t border-blue-200/60 dark:border-blue-800/50 text-xs">
                <span className="text-[11px] font-medium text-blue-800 dark:text-blue-300">
                  Plazas / asientos disponibles:
                </span>
                <div className="flex items-center gap-1">
                  {[2, 3, 4, 5, 7].map((seats) => (
                    <button
                      key={seats}
                      type="button"
                      onClick={() => handleChange('vehicle_seats', seats)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
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
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-xs font-semibold cursor-pointer ${
              formData.needs_ride
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 shadow-2xs'
                : 'bg-zinc-50 dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-400 border-zinc-200/70 dark:border-white/[0.06] hover:bg-zinc-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Home size={16} className={formData.needs_ride ? 'text-amber-600' : 'text-zinc-400'} />
              <div className="text-left">
                <p className="font-bold">Necesita transporte para ir al Salón</p>
                <p className="text-[10px] font-normal text-zinc-400">
                  Notifica al superintendente de grupo para coordinar traslado
                </p>
              </div>
            </div>
            <CheckCircle2
              size={16}
              className={formData.needs_ride ? 'text-amber-600 opacity-100' : 'opacity-20'}
            />
          </button>
        </div>

        {/* Solicitud recurrente de publicaciones impresas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              key: 'printed_guide' as const,
              label: 'Guía de Actividades impresa',
              desc: 'Recibe ejemplar físico bimestral',
            },
            {
              key: 'printed_watchtower' as const,
              label: 'La Atalaya de estudio impresa',
              desc: 'Recibe ejemplar físico mensual',
            },
            {
              key: 'large_print' as const,
              label: 'Edición en Letra Grande',
              desc: 'Priorizar formato de letra grande',
            },
          ].map((pubItem) => {
            const active = Boolean(formData[pubItem.key]);
            return (
              <button
                key={pubItem.key}
                type="button"
                onClick={() => handleChange(pubItem.key, !active)}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  active
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200'
                    : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200/70 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BookOpen size={15} className={active ? 'text-indigo-600 shrink-0' : 'text-zinc-400 shrink-0'} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{pubItem.label}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{pubItem.desc}</p>
                  </div>
                </div>
                <CheckCircle2 size={15} className={active ? 'text-indigo-600 shrink-0' : 'opacity-20 shrink-0'} />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
