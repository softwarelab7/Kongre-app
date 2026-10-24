// src/utils/familyGrouping.ts
import { Publisher } from '../types';

/**
 * Normaliza un texto para comparaciones insensibles a mayúsculas/acentos.
 */
function normalizeText(value?: string | null): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Obtiene el identificador único efectivo de un publicador (compatible con modelo Kongre y CLM).
 */
export function getPubId(pub: Publisher): string {
  return pub.id || pub.nid || '';
}

/**
 * Obtiene el nombre completo legible de un publicador.
 */
export function getPubDisplayName(pub: Publisher): string {
  return pub.full_name || pub.name || '';
}

/**
 * Determina si dos publicadores pertenecen al mismo núcleo familiar (estilo KHS Family Grouping).
 * Verifica:
 * 1. Vínculo explícito por `spouse_nid` o `familyMemberIds` (bidireccional).
 * 2. Mismo `familyId` explícito no vacío.
 * 3. Coincidencia exacta de `spouse_name` con el nombre del otro publicador.
 */
export function arePublishersFamily(
  pubA: Publisher | undefined,
  pubB: Publisher | undefined
): boolean {
  if (!pubA || !pubB) return false;
  const idA = getPubId(pubA);
  const idB = getPubId(pubB);
  if (!idA || !idB || idA === idB) return false;

  // 1. Cónyuge por ID explícito
  if (pubA.spouse_nid && (pubA.spouse_nid === idB || pubA.spouse_nid === pubB.nid || pubA.spouse_nid === pubB.id)) {
    return true;
  }
  if (pubB.spouse_nid && (pubB.spouse_nid === idA || pubB.spouse_nid === pubA.nid || pubB.spouse_nid === pubA.id)) {
    return true;
  }

  // 2. Lista de familiares directos (familyMemberIds)
  if (Array.isArray(pubA.familyMemberIds) && (pubA.familyMemberIds.includes(idB) || (pubB.nid && pubA.familyMemberIds.includes(pubB.nid)))) {
    return true;
  }
  if (Array.isArray(pubB.familyMemberIds) && (pubB.familyMemberIds.includes(idA) || (pubA.nid && pubB.familyMemberIds.includes(pubA.nid)))) {
    return true;
  }

  // 3. Mismo código de núcleo familiar (familyId)
  if (
    pubA.familyId &&
    pubB.familyId &&
    normalizeText(pubA.familyId) === normalizeText(pubB.familyId)
  ) {
    return true;
  }

  // 4. Coincidencia por nombre de cónyuge escrito en texto
  const nameA = normalizeText(getPubDisplayName(pubA));
  const nameB = normalizeText(getPubDisplayName(pubB));
  const spouseA = normalizeText(pubA.spouse_name);
  const spouseB = normalizeText(pubB.spouse_name);

  if (spouseA && nameB && spouseA === nameB) return true;
  if (spouseB && nameA && spouseB === nameA) return true;

  return false;
}

/**
 * Devuelve todos los publicadores de la congregación que pertenecen al núcleo familiar de `pub`.
 */
export function getPublisherFamilyMembers(
  pub: Publisher,
  allPublishers: Publisher[]
): Publisher[] {
  const selfId = getPubId(pub);
  if (!selfId) return [];
  return allPublishers.filter((other) => {
    const otherId = getPubId(other);
    if (!otherId || otherId === selfId) return false;
    return arePublishersFamily(pub, other);
  });
}

/**
 * Sugiere posibles familiares en la congregación basándose en apellidos compartidos o misma dirección,
 * que aún no estén vinculados explícitamente.
 */
export function suggestPotentialFamilyMembers(
  pub: Publisher,
  allPublishers: Publisher[]
): Array<{ publisher: Publisher; reason: string }> {
  const selfId = getPubId(pub);
  const alreadyLinkedIds = new Set(
    getPublisherFamilyMembers(pub, allPublishers).map((p) => getPubId(p))
  );

  const selfLast = normalizeText(pub.last_name);
  const selfSecondLast = normalizeText(pub.second_last_name);
  const selfAddress = normalizeText(pub.address);
  const selfFullNameTokens = normalizeText(getPubDisplayName(pub))
    .split(/\s+/)
    .filter((t) => t.length >= 3);

  const suggestions: Array<{ publisher: Publisher; reason: string }> = [];

  for (const candidate of allPublishers) {
    const candId = getPubId(candidate);
    if (!candId || candId === selfId || alreadyLinkedIds.has(candId)) continue;

    // 1. Misma dirección exacta (y no vacía)
    const candAddress = normalizeText(candidate.address);
    if (selfAddress && selfAddress.length >= 6 && selfAddress === candAddress) {
      suggestions.push({
        publisher: candidate,
        reason: 'Misma dirección de domicilio',
      });
      continue;
    }

    // 2. Apellido paterno o materno coincidente
    const candLast = normalizeText(candidate.last_name);
    const candSecondLast = normalizeText(candidate.second_last_name);
    if (selfLast && selfLast.length >= 3 && (selfLast === candLast || selfLast === candSecondLast)) {
      suggestions.push({
        publisher: candidate,
        reason: `Mismo apellido (${pub.last_name})`,
      });
      continue;
    }
    if (
      selfSecondLast &&
      selfSecondLast.length >= 3 &&
      (selfSecondLast === candLast || selfSecondLast === candSecondLast)
    ) {
      suggestions.push({
        publisher: candidate,
        reason: `Apellido compartido (${pub.second_last_name})`,
      });
      continue;
    }

    // 3. Fallback si no tienen last_name separado pero comparten el último apellido en name
    if (!selfLast && selfFullNameTokens.length >= 2) {
      const lastToken = selfFullNameTokens[selfFullNameTokens.length - 1];
      const candTokens = normalizeText(getPubDisplayName(candidate)).split(/\s+/);
      if (lastToken.length >= 4 && candTokens.includes(lastToken)) {
        suggestions.push({
          publisher: candidate,
          reason: `Apellido compartido`,
        });
      }
    }
  }

  return suggestions;
}

/**
 * Devuelve la lista de familiares de `pub` que YA tienen una asignación en la reunión actual.
 */
export function getAssignedFamilyMembersInMeeting(
  pub: Publisher,
  assignedPublisherIds: Set<string> | string[],
  allPublishers: Publisher[]
): Publisher[] {
  const set =
    assignedPublisherIds instanceof Set
      ? assignedPublisherIds
      : new Set(assignedPublisherIds);

  if (set.size === 0) return [];

  const familyMembers = getPublisherFamilyMembers(pub, allPublishers);
  return familyMembers.filter((fam) => {
    const fId = getPubId(fam);
    return (fId && set.has(fId)) || (fam.id && set.has(fam.id)) || (fam.nid && set.has(fam.nid));
  });
}

/**
 * Verifica si un par (Titular + Ayudante) cumple con las pautas de Seamos Mejores Maestros (S-38):
 * - Personas del mismo género siempre pueden participar juntas.
 * - Personas de distinto género SOLO pueden participar juntas si son familiares directos (cónyuges, padres/hijos, hermanos carnales).
 */
export function isValidDemonstrationPair(
  titular: Publisher | undefined,
  assistant: Publisher | undefined,
  enforceRule: boolean = true
): boolean {
  if (!titular || !assistant) return true;
  if (!enforceRule) return true;

  const isTitularMale =
    (titular.gender as string) === 'male' || titular.gender === 'hermano';
  const isAssistantMale =
    (assistant.gender as string) === 'male' || assistant.gender === 'hermano';

  if (isTitularMale === isAssistantMale) {
    return true;
  }

  // Distinto género: solo válido si pertenecen al mismo núcleo familiar
  return arePublishersFamily(titular, assistant);
}
