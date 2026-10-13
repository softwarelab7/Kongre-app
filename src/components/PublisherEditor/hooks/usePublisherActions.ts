import { useCallback } from 'react';
import { Publisher } from '../../../types';
import { useCongregation } from '../../../context/CongregationContext';

interface UsePublisherActionsProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  confirm: (options: any) => Promise<boolean>;
  prompt: (options: any) => Promise<string | null>;
  onCancel: () => void;
  isDirty: boolean;
  handleChange: (field: keyof Publisher, value: any) => void;
}

export const usePublisherActions = ({
  showToast,
  confirm,
  prompt,
  onCancel,
  isDirty,
  handleChange,
}: UsePublisherActionsProps) => {
  const { publishers, preachingGroups } = useCongregation();

  const groups = (preachingGroups || []).map(g => ({
    id: String(g.number),
    name: g.name || `Grupo ${g.number}`,
    number: g.number,
  }));

  const allPublishers: Publisher[] = (publishers || []).map(p => ({
    ...p,
    full_name: p.full_name || p.name || '',
  }));

  const handleBack = useCallback(async () => {
    if (isDirty) {
      const confirmed = await confirm({
        title: '¿Salir sin guardar?',
        message: 'Has realizado cambios en la ficha del publicador. Si sales ahora, perderás toda la información modificada.',
        confirmText: 'Salir sin guardar',
        cancelText: 'Seguir editando',
        type: 'warning'
      });
      if (!confirmed) return;
    }
    onCancel();
  }, [isDirty, confirm, onCancel]);

  return {
    groups,
    fetchingGroups: false,
    allPublishers,
    fetchingAllPublishers: false,
    handleBack,
    refreshData: () => {},
  };
};
