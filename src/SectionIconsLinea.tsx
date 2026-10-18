import {
  House, CalendarDays, ClipboardList, Map, UserCheck, Users, Megaphone,
  MonitorSpeaker, Settings, FileText, IdCard, QrCode, FileDown, Building2,
  CircleUserRound, KeyRound, Eye, Sun, Moon, CloudOff, RefreshCw,
} from 'lucide-react';

/** Un solo lugar para los íconos de cada sección de Kongre. */
export const ICONS = {
  // Navegación
  inicio: House,
  reuniones: CalendarDays,
  asignaciones: ClipboardList,
  territorios: Map,
  asistencia: UserCheck,
  publicadores: Users,
  anuncios: Megaphone,
  cabinaAV: MonitorSpeaker,
  ajustes: Settings,
  // Documentos
  hojaS89: FileText,
  tarjetaS21: IdCard,
  territorioQR: QrCode,
  exportarPDF: FileDown,
  // Acceso
  registrarCongregacion: Building2,
  iniciarGoogle: CircleUserRound,
  conectarIdPin: KeyRound,
  invitado: Eye,
  // Sistema
  temaClaro: Sun,
  temaOscuro: Moon,
  sinConexion: CloudOff,
  sincronizar: RefreshCw,
} as const;

export type IconName = keyof typeof ICONS;
