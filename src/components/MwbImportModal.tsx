// src/components/MwbImportModal.tsx
import React, { useState } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { parseMwbText, PRESET_SAMPLE_MWB_WEEKS, ParsedMwbWeek } from '../utils/mwbParser';
import { WeekSchedule } from '../types';
import { X, Sparkles, BookOpen, FileText, Check, ArrowRight } from 'lucide-react';

interface MwbImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MwbImportModal: React.FC<MwbImportModalProps> = ({ isOpen, onClose }) => {
  const { currentWeek, updateWeek } = useCongregation();
  const [inputText, setInputText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedMwbWeek | null>(() => {
    return PRESET_SAMPLE_MWB_WEEKS['salmos_80'];
  });

  if (!isOpen || !currentWeek) return null;

  const handleParse = (textToParse: string) => {
    setInputText(textToParse);
    const result = parseMwbText(textToParse);
    setParsedData(result);
  };

  const handleApplyPreset = (presetKey: string) => {
    const preset = PRESET_SAMPLE_MWB_WEEKS[presetKey];
    if (preset) {
      setParsedData(preset);
      setInputText('');
    }
  };

  const handleApplyToCurrentWeek = () => {
    if (!parsedData) return;

    const clone: WeekSchedule = JSON.parse(JSON.stringify(currentWeek));

    // Tesoros
    clone.midweek.tesoros.discurso.title = parsedData.discursoTitle;
    clone.midweek.tesoros.perlas.title = parsedData.perlasTitle;
    clone.midweek.tesoros.lecturaBiblia.title = parsedData.lecturaBibliaTitle;

    // Maestros
    clone.midweek.maestros.items = parsedData.demonstrations.map((d, idx) => ({
      id: `maes-imp-${Date.now()}-${idx}`,
      title: d.title,
      type: 'vym_maestros_titular',
      timeMinutes: d.timeMinutes,
      room: 'principal',
      status: 'pendiente',
    }));

    // Vida Cristiana
    clone.midweek.vidaCristiana.items = parsedData.vidaPartes.map((v, idx) => ({
      id: `vida-imp-${Date.now()}-${idx}`,
      title: v.title,
      type: 'vym_vida_partes',
      timeMinutes: v.timeMinutes,
      status: 'pendiente',
    }));

    // Estudio Bíblico
    if (parsedData.estudioBiblicoTitle) {
      clone.midweek.vidaCristiana.items.push({
        id: `cbs-imp-${Date.now()}`,
        title: parsedData.estudioBiblicoTitle,
        type: 'vym_vida_partes',
        timeMinutes: 30,
        status: 'pendiente',
      });
    }

    if (parsedData.atalayaTheme) {
      clone.weekend.publicTalkTheme = parsedData.atalayaTheme;
    }

    updateWeek(clone);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Guía de Actividades (MWB)
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Importador Inteligente del Programa
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets and text input */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Quick presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Seleccionar plantilla oficial de ejemplo:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('salmos_80')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 text-left text-xs bg-slate-50 hover:bg-amber-50/50 transition-all"
              >
                <strong className="block font-bold text-slate-900">Salmos 80 a 82</strong>
                <span className="text-[10px] text-slate-500">Oraciones / Demostraciones</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('proverbios_1')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 text-left text-xs bg-slate-50 hover:bg-amber-50/50 transition-all"
              >
                <strong className="block font-bold text-slate-900">Proverbios 1 a 3</strong>
                <span className="text-[10px] text-slate-500">Sabiduría / Necesidades</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('mateo_5')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 text-left text-xs bg-slate-50 hover:bg-amber-50/50 transition-all"
              >
                <strong className="block font-bold text-slate-900">Mateo 5 a 7</strong>
                <span className="text-[10px] text-slate-500">Sermón del Monte</span>
              </button>
            </div>
          </div>

          {/* Paste area */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              O pega el texto copiado de JW.ORG / Guía de Actividades:
            </label>
            <textarea
              rows={4}
              value={inputText}
              onChange={e => handleParse(e.target.value)}
              placeholder={`Lectura semanal de la Biblia: Salmos 80 a 82\nTESOROS DE LA BIBLIA\n"El Dios que escucha nuestras oraciones" (10 min.)\nBusquemos perlas escondidas (10 min.)\nSEAMOS MEJORES MAESTROS\nEmpiece conversaciones (3 min.)`}
              className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Extracted preview */}
          {parsedData && (
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2 text-xs">
              <div className="flex items-center gap-1 font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Estructura extraída para la reunión:</span>
              </div>

              <div className="space-y-1 text-slate-700">
                <p><strong>Discurso Tesoros:</strong> {parsedData.discursoTitle}</p>
                <p><strong>Perlas:</strong> {parsedData.perlasTitle}</p>
                <p><strong>Lectura Biblia:</strong> {parsedData.lecturaBibliaTitle}</p>
                <div>
                  <strong>Demostraciones ({parsedData.demonstrations.length}):</strong>
                  <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-[11px] text-slate-600">
                    {parsedData.demonstrations.map((d, i) => (
                      <li key={i}>{d.title} ({d.timeMinutes} min)</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Vida Cristiana:</strong>
                  <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-[11px] text-slate-600">
                    {parsedData.vidaPartes.map((v, i) => (
                      <li key={i}>{v.title}</li>
                    ))}
                    {parsedData.estudioBiblicoTitle && <li>{parsedData.estudioBiblicoTitle}</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-3xl">
          <p className="text-xs text-slate-500">
            Se aplicará a la semana: <strong>{currentWeek.weekStartDate}</strong>
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleApplyToCurrentWeek}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar al Programa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
