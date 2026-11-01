// src/services/pinChangeRequestsService.ts
import { supabase } from '../lib/supabase';
import { SolicitudCambioPin, PinChangeRequestReasonId } from '../types';
import {
  encryptPinAtRest,
  decryptPinAtRest,
  isEncryptedPinAtRest,
  isSafeDemoMode,
} from '../utils/theocraticSecurity';
import { insertAuditLog } from './auditLogService';

export const SOLICITUDES_CAMBIO_PIN_COLLECTION = 'SolicitudesCambioPin';
const LOCAL_STORAGE_PIN_REQUESTS_KEY = 'kongre_solicitudes_cambio_pin_v1';

export const PIN_CHANGE_REQUEST_REASONS: {
  id: PinChangeRequestReasonId;
  label: string;
  description: string;
}[] = [
  {
    id: 'perdida_dispositivo',
    label: 'Pérdida de dispositivo',
    description: 'Extravié, perdí o me robaron el teléfono o equipo donde usaba mi cuenta.',
  },
  {
    id: 'olvido',
    label: 'Olvido del PIN',
    description: 'No recuerdo mi PIN personal de acceso y necesito que se me asigne uno nuevo.',
  },
  {
    id: 'sospecha_acceso_no_autorizado',
    label: 'Sospecha de acceso no autorizado',
    description: 'Creo que otra persona vio mi PIN o pudo haber ingresado sin autorización.',
  },
  {
    id: 'cambio_equipo',
    label: 'Cambio o renovación de dispositivo',
    description: 'Cambié de teléfono o computadora y deseo renovar mi credencial por seguridad.',
  },
  {
    id: 'otro',
    label: 'Otro motivo de seguridad',
    description: 'Requiero actualizar mi PIN personal por otra circunstancia.',
  },
];

function isDemoEnvironment(congregationId?: string): boolean {
  if (typeof window !== 'undefined') {
    if (
      isSafeDemoMode() ||
      localStorage.getItem('kongre_demo_mode') === 'true' ||
      sessionStorage.getItem('kongre_demo_mode') === 'true'
    ) {
      return true;
    }
  }
  const clean = String(congregationId || '').trim().toUpperCase();
  if (!clean || clean.includes('DEMO') || clean === '1001') {
    return true;
  }
  return false;
}

export function loadLocalPinChangeRequests(): SolicitudCambioPin[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_PIN_REQUESTS_KEY);
    if (!saved) return [];
    const rawJson = isEncryptedPinAtRest(saved) ? decryptPinAtRest(saved) : saved;
    const parsed = JSON.parse(rawJson || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalPinChangeRequests(requests: SolicitudCambioPin[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      LOCAL_STORAGE_PIN_REQUESTS_KEY,
      encryptPinAtRest(JSON.stringify(requests))
    );
    window.dispatchEvent(
      new CustomEvent('kongre_pin_requests_updated', { detail: requests })
    );
  } catch {}
}

/**
 * Registra una nueva solicitud de cambio de PIN en la colección 'SolicitudesCambioPin' de Supabase
 * y notifica automáticamente a los ancianos.
 */
export async function submitSolicitudCambioPinToSupabase(params: {
  congregationId: string;
  publisherId: string;
  publisherName: string;
  publisherEmail?: string;
  role: string;
  reasonId: PinChangeRequestReasonId;
  details?: string;
}): Promise<{
  success: boolean;
  record: SolicitudCambioPin;
  syncedToSupabase: boolean;
}> {
  const reasonObj =
    PIN_CHANGE_REQUEST_REASONS.find((r) => r.id === params.reasonId) ||
    PIN_CHANGE_REQUEST_REASONS[0];

  const newRecord: SolicitudCambioPin = {
    id: `scp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    congregation_id: params.congregationId || 'CONG-LOCAL',
    publisher_id: params.publisherId || 'pub-local',
    publisher_name: params.publisherName.trim() || 'Publicador',
    publisher_email: params.publisherEmail?.trim() || undefined,
    role: params.role || 'publico',
    reason_id: params.reasonId,
    reason_label: reasonObj.label,
    details: params.details?.trim() || undefined,
    status: 'pendiente',
    created_at: new Date().toISOString(),
  };

  // 1. Guardar inmediatamente en almacenamiento local cifrado y notificar en la app
  const existing = loadLocalPinChangeRequests();
  const updated = [newRecord, ...existing];
  saveLocalPinChangeRequests(updated);

  // 2. Insertar en la colección 'SolicitudesCambioPin' en Supabase
  let syncedToSupabase = false;
  if (!isDemoEnvironment(params.congregationId)) {
    try {
      const { error } = await supabase
        .from(SOLICITUDES_CAMBIO_PIN_COLLECTION)
        .insert([
          {
            id: newRecord.id,
            congregation_id: newRecord.congregation_id,
            publisher_id: newRecord.publisher_id,
            publisher_name: newRecord.publisher_name,
            publisher_email: newRecord.publisher_email || null,
            role: newRecord.role,
            reason_id: newRecord.reason_id,
            reason_label: newRecord.reason_label,
            details: newRecord.details || null,
            status: newRecord.status,
            created_at: newRecord.created_at,
          },
        ]);
      if (!error) {
        syncedToSupabase = true;
      }
    } catch {
      // Fallback silencioso a cola local y sincronización de congregación
    }
  }

  // 3. Registrar en la cadena de auditoría para notificar a los ancianos
  insertAuditLog({
    accion: 'SOLICITUD_CAMBIO_PIN_PUBLICADOR',
    hermano_nid: newRecord.publisher_id,
    hermano_nombre: newRecord.publisher_name,
    modulo: 'auth',
    detalles: `Solicitud de cambio de PIN enviada a los ancianos en '${SOLICITUDES_CAMBIO_PIN_COLLECTION}'. Motivo: ${newRecord.reason_label}${newRecord.details ? ` (${newRecord.details})` : ''}.`,
  }).catch(() => {});

  // 4. Disparar sincronización en la nube y notificación del navegador si está permitida
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kongre_trigger_cloud_sync'));
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Solicitud de Cambio de PIN Registrada', {
          body: `${newRecord.publisher_name} solicitó un cambio de PIN (${newRecord.reason_label}). Los ancianos han sido notificados.`,
          icon: '/icon-192.png',
        });
      }
    } catch {}
  }

  return {
    success: true,
    record: newRecord,
    syncedToSupabase,
  };
}

/**
 * Sincroniza las solicitudes de la colección 'SolicitudesCambioPin' desde Supabase
 */
export async function fetchSolicitudesCambioPinFromSupabase(
  congregationId?: string
): Promise<SolicitudCambioPin[]> {
  const local = loadLocalPinChangeRequests();
  if (isDemoEnvironment(congregationId)) {
    return local;
  }

  try {
    let query = supabase
      .from(SOLICITUDES_CAMBIO_PIN_COLLECTION)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (congregationId && congregationId.trim().length > 0) {
      query = query.eq('congregation_id', congregationId.trim());
    }

    const { data, error } = await query;
    if (error || !Array.isArray(data)) {
      return local;
    }

    const map = new Map<string, SolicitudCambioPin>();
    for (const item of data as SolicitudCambioPin[]) {
      if (item && item.id) map.set(item.id, item);
    }
    for (const item of local) {
      if (item && item.id) {
        const remote = map.get(item.id);
        map.set(item.id, remote ? { ...item, ...remote } : item);
      }
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    saveLocalPinChangeRequests(merged);
    return merged;
  } catch {
    return local;
  }
}

/**
 * Marca una solicitud en 'SolicitudesCambioPin' como atendida o rechazada por un anciano
 */
export async function updateSolicitudCambioPinStatusInSupabase(params: {
  requestId: string;
  status: 'atendida' | 'rechazada';
  resolvedBy: string;
  newPinMasked?: string;
  congregationId?: string;
}): Promise<SolicitudCambioPin[]> {
  const nowIso = new Date().toISOString();
  const local = loadLocalPinChangeRequests();
  const updated = local.map((req) =>
    req.id === params.requestId
      ? {
          ...req,
          status: params.status,
          resolved_at: nowIso,
          resolved_by: params.resolvedBy,
          new_pin_masked: params.newPinMasked || req.new_pin_masked,
        }
      : req
  );
  saveLocalPinChangeRequests(updated);

  if (!isDemoEnvironment(params.congregationId)) {
    try {
      await supabase
        .from(SOLICITUDES_CAMBIO_PIN_COLLECTION)
        .update({
          status: params.status,
          resolved_at: nowIso,
          resolved_by: params.resolvedBy,
          new_pin_masked: params.newPinMasked || null,
        })
        .eq('id', params.requestId);
    } catch {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kongre_trigger_cloud_sync'));
  }

  return updated;
}
