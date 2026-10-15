import { Publisher, WeekSchedule } from '../types';

/**
 * Normaliza nombres de personas quitando tildes, signos diacríticos, mayúsculas
 * y espacios adicionales para comparaciones fiables en español.
 */
export function normalizePersonName(name?: string | null): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina acentos/tildes
    .toLowerCase()
    .trim()
    .replace(/[,.;:_\-/\\()]+/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Comprueba si dos nombres corresponden a la misma persona, teniendo en cuenta:
 * - Tildes / acentos ("Héctor Gutiérrez Jiménez" vs "Hector Gutierrez Jimenez")
 * - Nombres con 1 apellido vs 2 apellidos ("Héctor Gutiérrez" vs "Héctor Gutiérrez Jiménez")
 * - Formato "Apellido, Nombre" vs "Nombre Apellido"
 */
export function areNamesEquivalent(nameA?: string | null, nameB?: string | null): boolean {
  const normA = normalizePersonName(nameA);
  const normB = normalizePersonName(nameB);

  if (!normA || !normB) return false;
  if (normA === normB) return true;

  // Si uno empieza exactamente con el otro y la longitud es significativa (mínimo 6 chars)
  if (normA.length >= 6 && normB.length >= 6) {
    if (normA.startsWith(normB) || normB.startsWith(normA)) {
      return true;
    }
  }

  // Comparar por conjunto de palabras (para ignorar orden Apellido, Nombre)
  const wordsA = normA.split(' ').filter((w) => w.length > 1);
  const wordsB = normB.split(' ').filter((w) => w.length > 1);

  if (wordsA.length >= 2 && wordsB.length >= 2) {
    // Si comparten el primer nombre y el primer apellido
    if (wordsA[0] === wordsB[0] && wordsA[1] === wordsB[1]) {
      return true;
    }

    // Coincidencia de todas las palabras de la lista menor
    const setA = new Set(wordsA);
    const setB = new Set(wordsB);
    const matchesInB = wordsA.filter((w) => setB.has(w)).length;
    const matchesInA = wordsB.filter((w) => setA.has(w)).length;

    if (matchesInB >= 2 && (matchesInB === wordsA.length || matchesInA === wordsB.length)) {
      return true;
    }
  }

  return false;
}

/**
 * Verifica si dos objetos de publicador son en realidad la misma persona.
 */
export function isSamePublisher(p1: Partial<Publisher>, p2: Partial<Publisher>): boolean {
  if (!p1 || !p2) return false;

  // 1. Mismo ID
  if (p1.id && p2.id && p1.id === p2.id) return true;

  // 2. Mismo NID / Documento
  if (p1.nid && p2.nid && p1.nid.trim() && p1.nid.trim() === p2.nid.trim()) return true;

  // 3. Mismo Correo Electrónico (válido y no genérico)
  const e1 = (p1.email || '').trim().toLowerCase();
  const e2 = (p2.email || '').trim().toLowerCase();
  if (e1 && e2 && !e1.startsWith('hermano_') && !e2.startsWith('hermano_') && e1 === e2) {
    return true;
  }

  // 4. Mismo PIN Personal (si ambos tienen PIN válido de al menos 4 dígitos)
  const pin1 = String(p1.personalPin || '').trim();
  const pin2 = String(p2.personalPin || '').trim();
  if (pin1.length >= 4 && pin2.length >= 4 && pin1 === pin2) {
    // Si tienen el mismo PIN personal y alguno de los nombres coincide mínimamente
    const n1 = normalizePersonName(p1.name || (p1 as any).full_name);
    const n2 = normalizePersonName(p2.name || (p2 as any).full_name);
    if (!n1 || !n2 || areNamesEquivalent(n1, n2)) {
      return true;
    }
  }

  // 5. Nombres equivalentes (con o sin tildes)
  const name1 = p1.name || (p1 as any).full_name;
  const name2 = p2.name || (p2 as any).full_name;
  if (name1 && name2 && areNamesEquivalent(name1, name2)) {
    return true;
  }

  return false;
}

function countAccents(str: string): number {
  return (str.match(/[áéíóúÁÉÍÓÚñÑ]/g) || []).length;
}

/**
 * Fusión inteligente de dos registros de publicador conservando la mejor información.
 */
export function mergePublisherData(target: Publisher, incoming: Partial<Publisher>): Publisher {
  const merged: Publisher = { ...target };

  // Nombre: preferir el que tenga más tildes / mejor ortografía, o el más completo
  const tName = target.name || '';
  const iName = incoming.name || (incoming as any).full_name || '';
  if (iName) {
    const iAccents = countAccents(iName);
    const tAccents = countAccents(tName);
    if (iAccents > tAccents || (!tAccents && iAccents) || iName.length > tName.length) {
      merged.name = iName;
      merged.full_name = iName;
    }
  }

  if (incoming.phone && !target.phone) merged.phone = incoming.phone;
  if (incoming.email && (!target.email || target.email.startsWith('hermano_'))) merged.email = incoming.email;
  if (incoming.personalPin && !target.personalPin) merged.personalPin = incoming.personalPin;
  if (incoming.address && !target.address) merged.address = incoming.address;
  if (incoming.birth_date && !target.birth_date) merged.birth_date = incoming.birth_date;
  if (incoming.baptism_date && !target.baptism_date) merged.baptism_date = incoming.baptism_date;
  if (incoming.birthDate && !target.birthDate) merged.birthDate = incoming.birthDate;
  if (incoming.baptismDate && !target.baptismDate) merged.baptismDate = incoming.baptismDate;

  // Privilegios: el más alto prevalece ('anciano' > 'siervo_ministerial' > otros)
  const privOrder: Record<string, number> = {
    anciano: 3,
    siervo_ministerial: 2,
    publicador_bautizado: 1,
    publicador_no_bautizado: 0,
  };
  const targetPrivScore = privOrder[target.privilege || ''] || 0;
  const incomingPrivScore = privOrder[incoming.privilege || ''] || 0;
  if (incomingPrivScore > targetPrivScore) {
    merged.privilege = incoming.privilege;
  }

  // Rol teocrático
  if (incoming.theocraticRole && !target.theocraticRole) {
    merged.theocraticRole = incoming.theocraticRole;
  } else if (incoming.theocraticRole === 'coordinador') {
    merged.theocraticRole = 'coordinador';
  }

  // Precursor
  if (incoming.pioneer_type && incoming.pioneer_type !== 'none' && (!target.pioneer_type || target.pioneer_type === 'none')) {
    merged.pioneer_type = incoming.pioneer_type;
  }

  // Fusión de Roles booleanos (unión lógica)
  if (incoming.roles) {
    merged.roles = {
      ...(merged.roles || {}),
      ...(incoming.roles || {}),
    };
    // Asegurar que si en alguno era true, se mantenga true
    Object.keys(incoming.roles).forEach((key) => {
      const k = key as keyof typeof merged.roles;
      if (incoming.roles && incoming.roles[k]) {
        (merged.roles as any)[k] = true;
      }
    });
  }

  // Notas
  if (incoming.notes && (!target.notes || target.notes.length < incoming.notes.length)) {
    merged.notes = incoming.notes;
  }

  return merged;
}

function hasAccents(str: string): boolean {
  return /[áéíóúÁÉÍÓÚñÑ]/.test(str);
}

/**
 * Deduplica una lista completa de publicadores fusionando duplicados automáticamente.
 */
export function deduplicatePublishersList(publishers: Publisher[]): {
  cleanList: Publisher[];
  mergedCount: number;
  idMap: Record<string, string>;
} {
  if (!publishers || publishers.length <= 1) {
    return { cleanList: publishers || [], mergedCount: 0, idMap: {} };
  }

  const cleanList: Publisher[] = [];
  const idMap: Record<string, string> = {};
  let mergedCount = 0;

  for (const pub of publishers) {
    // Buscar si ya existe en la lista depurada
    const existingIndex = cleanList.findIndex((existing) => isSamePublisher(existing, pub));

    if (existingIndex !== -1) {
      // Duplicado detectado! Fusionar información
      const existing = cleanList[existingIndex];
      cleanList[existingIndex] = mergePublisherData(existing, pub);
      // Mapear el ID duplicado al ID conservado
      if (pub.id && existing.id && pub.id !== existing.id) {
        idMap[pub.id] = existing.id;
      }
      mergedCount++;
    } else {
      cleanList.push({ ...pub });
    }
  }

  return { cleanList, mergedCount, idMap };
}

/**
 * Reasigna los IDs de publicadores duplicados en el programa de semanas (weeks).
 */
export function reassignWeeksForDeduplicatedPublishers(
  weeks: WeekSchedule[],
  idMap: Record<string, string>
): { updatedWeeks: WeekSchedule[]; hasChanges: boolean } {
  if (!weeks || Object.keys(idMap).length === 0) {
    return { updatedWeeks: weeks, hasChanges: false };
  }

  let hasChanges = false;
  const remapId = (id?: string): string => {
    if (!id) return '';
    if (idMap[id]) {
      hasChanges = true;
      return idMap[id];
    }
    return id;
  };

  const updatedWeeks = weeks.map((w) => {
    const clone: WeekSchedule = JSON.parse(JSON.stringify(w));

    if (clone.midweek) {
      if (clone.midweek.presidentId) clone.midweek.presidentId = remapId(clone.midweek.presidentId);
      if (clone.midweek.initialPrayerId) clone.midweek.initialPrayerId = remapId(clone.midweek.initialPrayerId);
      if (clone.midweek.finalPrayerId) clone.midweek.finalPrayerId = remapId(clone.midweek.finalPrayerId);

      if (clone.midweek.tesoros?.discurso?.publisherId) clone.midweek.tesoros.discurso.publisherId = remapId(clone.midweek.tesoros.discurso.publisherId);
      if (clone.midweek.tesoros?.perlas?.publisherId) clone.midweek.tesoros.perlas.publisherId = remapId(clone.midweek.tesoros.perlas.publisherId);
      if (clone.midweek.tesoros?.lecturaBiblia?.publisherId) clone.midweek.tesoros.lecturaBiblia.publisherId = remapId(clone.midweek.tesoros.lecturaBiblia.publisherId);
      if (clone.midweek.tesoros?.lecturaBibliaAux?.publisherId) clone.midweek.tesoros.lecturaBibliaAux.publisherId = remapId(clone.midweek.tesoros.lecturaBibliaAux.publisherId);

      clone.midweek.maestros?.items?.forEach((item) => {
        if (item.publisherId) item.publisherId = remapId(item.publisherId);
        if (item.assistantId) item.assistantId = remapId(item.assistantId);
      });

      clone.midweek.vidaCristiana?.items?.forEach((item) => {
        if (item.publisherId) item.publisherId = remapId(item.publisherId);
      });

      if (clone.midweek.vidaCristiana?.estudioBiblico?.conductorId) clone.midweek.vidaCristiana.estudioBiblico.conductorId = remapId(clone.midweek.vidaCristiana.estudioBiblico.conductorId);
      if (clone.midweek.vidaCristiana?.estudioBiblico?.lectorId) clone.midweek.vidaCristiana.estudioBiblico.lectorId = remapId(clone.midweek.vidaCristiana.estudioBiblico.lectorId);

      if (clone.midweek.duties) {
        Object.keys(clone.midweek.duties).forEach((dKey) => {
          clone.midweek.duties[dKey] = clone.midweek.duties[dKey].map((pid) => remapId(pid));
        });
      }
    }

    if (clone.weekend) {
      if (clone.weekend.presidentId) clone.weekend.presidentId = remapId(clone.weekend.presidentId);
      if (clone.weekend.atalayaConductorId) clone.weekend.atalayaConductorId = remapId(clone.weekend.atalayaConductorId);
      if (clone.weekend.atalayaLectorId) clone.weekend.atalayaLectorId = remapId(clone.weekend.atalayaLectorId);
      if (clone.weekend.publicTalkSpeaker) clone.weekend.publicTalkSpeaker = remapId(clone.weekend.publicTalkSpeaker);
      if (clone.weekend.hospitalityPublisherId) clone.weekend.hospitalityPublisherId = remapId(clone.weekend.hospitalityPublisherId);
      if (clone.weekend.initialPrayerId) clone.weekend.initialPrayerId = remapId(clone.weekend.initialPrayerId);
      if (clone.weekend.finalPrayerId) clone.weekend.finalPrayerId = remapId(clone.weekend.finalPrayerId);

      if (clone.weekend.duties) {
        Object.keys(clone.weekend.duties).forEach((dKey) => {
          clone.weekend.duties[dKey] = clone.weekend.duties[dKey].map((pid) => remapId(pid));
        });
      }
    }

    return clone;
  });

  return { updatedWeeks, hasChanges };
}
