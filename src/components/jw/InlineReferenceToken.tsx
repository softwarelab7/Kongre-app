import React from 'react';
import { ReferenceItem } from '../../types/jwDesignSystem';

interface InlineReferenceTokenProps {
  reference: ReferenceItem;
  onSelectReference: (ref: ReferenceItem) => void;
  isActive?: boolean;
}

export const InlineReferenceToken: React.FC<InlineReferenceTokenProps> = ({
  reference,
  onSelectReference,
  isActive = false,
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelectReference(reference);
      }}
      className={`inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded text-xs font-mono font-bold tracking-tight transition-all cursor-pointer ${
        isActive
          ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-xs'
          : 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40'
      }`}
      title={`${reference.code} — ${reference.title}`}
    >
      <span>[{reference.code}]</span>
    </button>
  );
};
