// src/utils/memorialHelper.ts
import { MemorialPlan, TheocraticAssembly, Publisher } from '../types';

export function getPublisherName(publishers: Publisher[], id?: string): string {
  if (!id) return 'No asignado';
  const pub = publishers.find(p => p.id === id);
  return pub ? pub.name : 'No asignado';
}

export function getPublisherPhone(publishers: Publisher[], id?: string): string | undefined {
  if (!id) return undefined;
  const pub = publishers.find(p => p.id === id);
  return pub?.phone;
}

/**
 * Validates the readiness of the Memorial Plan.
 * Returns checklist items with status (complete, warning, missing).
 */
export interface MemorialChecklistItem {
  id: string;
  category: 'programa' | 'emblemas' | 'acomodadores' | 'campana' | 'informe';
  title: string;
  description: string;
  isReady: boolean;
  assignedTo?: string;
}

export function getMemorialChecklist(
  plan: MemorialPlan,
  publishers: Publisher[]
): MemorialChecklistItem[] {
  return [
    {
      id: 'check-speaker',
      category: 'programa',
      title: 'Orador del Discurso del Memorial',
      description: `Discurso: "${plan.speakerTheme}"`,
      isReady: !!plan.speakerPublisherId,
      assignedTo: getPublisherName(publishers, plan.speakerPublisherId),
    },
    {
      id: 'check-chairman',
      category: 'programa',
      title: 'Presidente de la Reunión',
      description: 'Presidirá la reunión, cánticos y bienvenida',
      isReady: !!plan.chairmanPublisherId,
      assignedTo: getPublisherName(publishers, plan.chairmanPublisherId),
    },
    {
      id: 'check-bread-prayer',
      category: 'emblemas',
      title: 'Oración por el Pan Ácimo',
      description: 'Hermano nombrado que dará gracias por el cuerpo de Cristo',
      isReady: !!plan.breadPrayerPublisherId,
      assignedTo: getPublisherName(publishers, plan.breadPrayerPublisherId),
    },
    {
      id: 'check-wine-prayer',
      category: 'emblemas',
      title: 'Oración por el Vino Tinto',
      description: 'Hermano nombrado que dará gracias por la sangre del pacto',
      isReady: !!plan.winePrayerPublisherId,
      assignedTo: getPublisherName(publishers, plan.winePrayerPublisherId),
    },
    {
      id: 'check-servers',
      category: 'emblemas',
      title: 'Servidores de los Emblemas',
      description: `${plan.emblemServers.length} secciones asignadas para pasar el pan y el vino`,
      isReady:
        plan.emblemServers.length > 0 &&
        plan.emblemServers.every(s => s.breadServerPublisherId && s.wineServerPublisherId),
      assignedTo: `${plan.emblemServers.length} secciones cubiertas`,
    },
    {
      id: 'check-bread-prep',
      category: 'emblemas',
      title: 'Preparación del Pan Ácimo',
      description: plan.preparation.emblemBreadType || 'Pan sin levadura ni sal',
      isReady: !!plan.preparation.breadPreparationPublisherId,
      assignedTo: getPublisherName(publishers, plan.preparation.breadPreparationPublisherId),
    },
    {
      id: 'check-wine-provider',
      category: 'emblemas',
      title: 'Provisión del Vino Tinto No Adulterado',
      description: plan.preparation.emblemWineType || 'Vino tinto puro',
      isReady: !!plan.preparation.wineProviderPublisherId,
      assignedTo: getPublisherName(publishers, plan.preparation.wineProviderPublisherId),
    },
    {
      id: 'check-attendants',
      category: 'acomodadores',
      title: 'Equipo de Acomodadores del Memorial',
      description: `${plan.attendants.length} puestos asignados (entrada, pasillos, parking, conteo, zoom)`,
      isReady: plan.attendants.length >= 4 && plan.attendants.every(a => a.publisherId),
      assignedTo: `${plan.attendants.length} hermanos asignados`,
    },
    {
      id: 'check-campaign',
      category: 'campana',
      title: 'Campaña Mundial de Invitaciones',
      description: `${plan.campaign.territoriesCoveredCount} de ${plan.campaign.totalCongregationTerritories} territorios cubiertos`,
      isReady: plan.campaign.territoriesCoveredCount > 0,
      assignedTo: `${Math.round(
        (plan.campaign.territoriesCoveredCount / (plan.campaign.totalCongregationTerritories || 1)) * 100
      )}% cobertura`,
    },
    {
      id: 'check-report',
      category: 'informe',
      title: 'Informe a la Sucursal (Betel)',
      description: plan.report.reportedToBranch
        ? `Remitido el ${plan.report.reportedDate || 'a tiempo'}`
        : 'Pendiente de envío tras la reunión',
      isReady: plan.report.reportedToBranch,
      assignedTo: plan.report.totalAttendance > 0 ? `${plan.report.totalAttendance} asistentes` : 'Pendiente',
    },
  ];
}

/**
 * Builds the official WhatsApp message announcing the Memorial Program
 */
export function buildMemorialProgramWhatsApp(plan: MemorialPlan, publishers: Publisher[]): string {
  const speaker = getPublisherName(publishers, plan.speakerPublisherId);
  const chairman = getPublisherName(publishers, plan.chairmanPublisherId);
  const breadPrayer = getPublisherName(publishers, plan.breadPrayerPublisherId);
  const winePrayer = getPublisherName(publishers, plan.winePrayerPublisherId);

  return (
    `🕯️ *CONMEMORACIÓN DE LA MUERTE DE JESUCRISTO (${plan.serviceYear})*\n` +
    `🗓️ *Fecha:* ${plan.date} | ⏰ *Hora:* ${plan.time} hrs (Puesta del Sol: ${plan.sunsetTime})\n` +
    `📍 *Lugar:* ${plan.location}\n\n` +
    `🎶 *Cántico Inicial:* Nº ${plan.initialSongNumber}\n` +
    `🎤 *Presidente:* ${chairman}\n` +
    `📖 *Orador:* ${speaker}\n` +
    `💡 *Tema:* "${plan.speakerTheme}"\n\n` +
    `🍞 *Oración por el Pan:* ${breadPrayer}\n` +
    `🍷 *Oración por el Vino:* ${winePrayer}\n` +
    `🎶 *Cántico Final:* Nº ${plan.finalSongNumber}\n\n` +
    `🕊️ _"Sigan haciendo esto en memoria de mí." — Lucas 22:19_\n\n` +
    `¡Esperamos a toda la congregación, sus familias e invitados con gran gozo!`
  );
}

/**
 * Builds a personal assignment reminder for a brother assigned to Memorial
 */
export function buildPersonalMemorialReminder(
  publisherName: string,
  roleDescription: string,
  plan: MemorialPlan
): string {
  return (
    `Estimado hermano *${publisherName}*:\n\n` +
    `Te saludamos con afecto cristiano. Te recordamos con aprecio tu asignación para la *Conmemoración del Memorial ${plan.serviceYear}*:\n\n` +
    `📋 *Tu Asignación:* ${roleDescription}\n` +
    `🗓️ *Fecha:* ${plan.date}\n` +
    `⏰ *Hora de reunión:* ${plan.time} hrs (Por favor estar 40 minutos antes para la coordinación previa)\n` +
    `📍 *Lugar:* ${plan.location}\n\n` +
    `Agradecemos de corazón tu fiel disposición y espíritu de servicio para esta noche tan sagrada.\n\n` +
    `_Cuerpo de Ancianos_`
  );
}

/**
 * Builds the official Memorial Report WhatsApp message to notify the elders / circuit overseer
 */
export function buildMemorialReportWhatsApp(plan: MemorialPlan): string {
  return (
    `📊 *INFORME OFICIAL DE LA CONMEMORACIÓN (${plan.serviceYear})*\n` +
    `🗓️ *Fecha de Celebración:* ${plan.date}\n` +
    `📍 *Congregación:* ${plan.location}\n\n` +
    `👥 *Asistencia Presencial en el Salón:* ${plan.report.inPersonAttendance}\n` +
    `💻 *Conexiones por Videoconferencia / Zoom:* ${plan.report.streamingAttendance}\n` +
    `⭐ *ASISTENCIA TOTAL:* ${plan.report.totalAttendance}\n\n` +
    `🍷 *Participantes de los Emblemas (Ungidos):* ${plan.report.partakersCount}\n` +
    (plan.report.partakerNames ? `📝 *Observaciones participantes:* ${plan.report.partakerNames}\n` : '') +
    `📨 *Estado en la Sucursal:* ${plan.report.reportedToBranch ? 'Enviado a Betel ✅' : 'Pendiente de envío ⏳'}\n\n` +
    `Damos gracias a Jehová por bendecir tan grandemente esta sagrada ocasión.`
  );
}

/**
 * Builds WhatsApp message for an Assembly announcement and arrangements
 */
export function buildAssemblyWhatsApp(assembly: TheocraticAssembly, publishers: Publisher[]): string {
  const cleaningCoord = getPublisherName(publishers, assembly.cleaningCoordinatorPublisherId);
  const busCoord = getPublisherName(publishers, assembly.busArrangement.coordinatorPublisherId);

  return (
    `🏛️ *${assembly.theme.toUpperCase()}*\n` +
    `📌 *Tipo:* ${
      assembly.type === 'circuito_con_sc'
        ? 'Asamblea de Circuito con Superintendente de Circuito'
        : assembly.type === 'circuito_sin_sc'
        ? 'Asamblea de Circuito con Representante de Sucursal'
        : 'Asamblea Regional'
    }\n` +
    `🗓️ *Fechas:* ${assembly.dates}\n` +
    `📍 *Sede:* ${assembly.venue}\n\n` +
    (assembly.assignedCleaningDepartment
      ? `🧹 *Limpieza Asignada a Nuestra Congregación:* ${assembly.assignedCleaningDepartment}\n` +
        `👤 *Coordinador de Limpieza:* ${cleaningCoord}\n\n`
      : '') +
    (assembly.busArrangement.hasBus
      ? `🚌 *Arreglos de Autobús:*\n` +
        `  • Salida: ${assembly.busArrangement.departureTime} hrs (${assembly.busArrangement.departureLocation})\n` +
        `  • Regreso: ${assembly.busArrangement.returnTime} hrs\n` +
        `  • Aporte por asiento: ${assembly.busArrangement.farePerSeat}€\n` +
        `  • Asientos reservados: ${assembly.busArrangement.seatsBooked}/${assembly.busArrangement.seatsTotal}\n` +
        `  • Coordinador de Viaje: ${busCoord}\n\n`
      : '') +
    `Recordamos a todos los publicadores llevar su distintivo de asamblea, su cancionero y un refrigerio ligero.`
  );
}
