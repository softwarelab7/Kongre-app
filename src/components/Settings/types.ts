// src/components/Settings/types.ts
import { ComponentType } from 'react';

export type SettingsCategoryTab =
  | 'all'
  | 'notificaciones'
  | 'general'
  | 'reglas'
  | 'invitaciones'
  | 'seguridad'
  | 'nube'
  | 'respaldos'
  | 'mantenimiento';

export interface SettingsTabConfigItem {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  desc: string;
  badge?: string;
  color: string;
  borderColor: string;
  hoverBorder: string;
  bgLight: string;
  bgHover: string;
  pillBg: string;
}

export interface SettingsTabProps {
  onNavigateToProfile?: () => void;
  onOpenVersionModal?: () => void;
  onNavigateToRoles?: () => void;
}
