import React, { createContext, useContext, useState, useCallback } from 'react';
import { ReferenceItem, UserAnnotation } from '../types/jwDesignSystem';

interface StudyInspectorContextType {
  isInspectorOpen: boolean;
  activeReference: ReferenceItem | null;
  activeAnnotation: UserAnnotation | null;
  references: ReferenceItem[];
  openReference: (ref: ReferenceItem) => void;
  openAnnotation: (ann: UserAnnotation) => void;
  closeInspector: () => void;
  toggleInspector: () => void;
  setDocumentReferences: (refs: ReferenceItem[]) => void;
  saveAnnotation: (ann: UserAnnotation) => void;
}

const StudyInspectorContext = createContext<StudyInspectorContextType | undefined>(undefined);

export const StudyInspectorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [activeReference, setActiveReference] = useState<ReferenceItem | null>(null);
  const [activeAnnotation, setActiveAnnotation] = useState<UserAnnotation | null>(null);
  const [references, setReferences] = useState<ReferenceItem[]>([]);

  const openReference = useCallback((ref: ReferenceItem) => {
    setActiveReference(ref);
    setIsInspectorOpen(true);
  }, []);

  const openAnnotation = useCallback((ann: UserAnnotation) => {
    setActiveAnnotation(ann);
    setIsInspectorOpen(true);
  }, []);

  const closeInspector = useCallback(() => {
    setIsInspectorOpen(false);
  }, []);

  const toggleInspector = useCallback(() => {
    setIsInspectorOpen((prev) => !prev);
  }, []);

  const setDocumentReferences = useCallback((refs: ReferenceItem[]) => {
    setReferences(refs);
  }, []);

  const saveAnnotation = useCallback((ann: UserAnnotation) => {
    setActiveAnnotation(ann);
    try {
      const stored = localStorage.getItem('kongre_jw_annotations');
      const all: Record<string, UserAnnotation> = stored ? JSON.parse(stored) : {};
      all[ann.blockId || ann.id] = ann;
      localStorage.setItem('kongre_jw_annotations', JSON.stringify(all));
    } catch {}
  }, []);

  return (
    <StudyInspectorContext.Provider
      value={{
        isInspectorOpen,
        activeReference,
        activeAnnotation,
        references,
        openReference,
        openAnnotation,
        closeInspector,
        toggleInspector,
        setDocumentReferences,
        saveAnnotation,
      }}
    >
      {children}
    </StudyInspectorContext.Provider>
  );
};

export const useStudyInspector = () => {
  const context = useContext(StudyInspectorContext);
  if (!context) {
    throw new Error('useStudyInspector must be used within a StudyInspectorProvider');
  }
  return context;
};
