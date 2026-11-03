// src/components/MwbImportModal.tsx
import React, { useState } from 'react';
import { useCongregation } from '../context/CongregationContext';
import { parseMwbText, PRESET_SAMPLE_MWB_WEEKS, ParsedMwbWeek } from '../utils/mwbParser';
import { WeekSchedule } from '../types';
import {
  X,
  Sparkles,
  BookOpen,
  Check,
  Music,
} from 'lucide-react';

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

  const [songsData, setSongsData] = useState<{
    initial?: string;
    middle?: string;
    final?: string;
  }>({});

  if (!isOpen || !currentWeek) return null;

  const handleLocalParse = (textToParse: string) => {
    setInputText(textToParse);
    if (textToParse.trim().length > 10) {
      const result = parseMwbText(textToParse);
      setParsedData(result);
    }
  };

  const handleApplyPreset = (presetKey: string) => {
    const preset = PRESET_SAMPLE_MWB_WEEKS[presetKey];
    if (preset) {
      setParsedData(preset);
      setInputText('');
      setSongsData({});
    }
  };

  const handleApplyToCurrentWeek = () => {
    if (!parsedData) return;

    const clone: WeekSchedule = JSON.parse(JSON.stringify(currentWeek));

    // Tesoros
    clone.midweek.tesoros.discurso.title = parsedData.discursoTitle;
    clone.midweek.tesoros.perlas.title = parsedData.perlasTitle;
    clone.midweek.tesoros.lecturaBiblia.title = parsedData.lecturaBibliaTitle;

    // Canciones si fueron extraídas
    if (songsData.initial) {
      const s1 = parseInt(songsData.initial.replace(/\D/g, ''), 10);
      if (!isNaN(s1)) clone.midweek.songFirst = s1;
    }
    if (songsData.middle) {
      const s2 = parseInt(songsData.middle.replace(/\D/g, ''), 10);
      if (!isNaN(s2)) clone.midweek.songMiddle = s2;
    }
    if (songsData.final) {
      const s3 = parseInt(songsData.final.replace(/\D/g, ''), 10);
      if (!isNaN(s3)) clone.midweek.songConclude = s3;
    }

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Importador inteligente de la Guía de Actividades"
    >
      <div className="kg-glass-surface kg-sheen-top bg-white/95 dark:bg-[#121216]/95 rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-zinc-200/80 dark:border-white/10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-[#27272A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="kg-glow-badge w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-[#18181F] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272A] flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  Guía de Actividades (MWB)
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">
                Importador Inteligente del Programa
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar importador de la Guía de Actividades"
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#27272A] cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Quick presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA] mb-2">
              Plantillas oficiales de ejemplo:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('salmos_80')}
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] hover:border-zinc-400 dark:hover:border-zinc-500 text-left text-xs bg-zinc-50 dark:bg-[#18181F]/50 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-all cursor-pointer"
              >
                <strong className="block font-bold text-zinc-900 dark:text-white">Salmos 80 a 82</strong>
                <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">Oraciones / Demostraciones</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('proverbios_1')}
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] hover:border-zinc-400 dark:hover:border-zinc-500 text-left text-xs bg-zinc-50 dark:bg-[#18181F]/50 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-all cursor-pointer"
              >
                <strong className="block font-bold text-zinc-900 dark:text-white">Proverbios 1 a 3</strong>
                <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">Sabiduría / Necesidades</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('mateo_5')}
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] hover:border-zinc-400 dark:hover:border-zinc-500 text-left text-xs bg-zinc-50 dark:bg-[#18181F]/50 hover:bg-zinc-100 dark:hover:bg-[#27272A] transition-all cursor-pointer"
              >
                <strong className="block font-bold text-zinc-900 dark:text-white">Mateo 5 a 7</strong>
                <span className="text-[10px] text-zinc-500 dark:text-[#A1A1AA]">Sermón del Monte</span>
              </button>
            </div>
          </div>

          {/* Paste area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-[#A1A1AA]">
                Pega el texto copiado de JW.ORG / Guía de Actividades:
              </label>
            </div>

            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => handleLocalParse(e.target.value)}
              placeholder={`Lectura semanal de la Biblia: Salmos 80 a 82\nTESOROS DE LA BIBLIA\n"El Dios que escucha nuestras oraciones" (10 min.)\nBusquemos perlas escondidas (10 min.)\nSEAMOS MEJORES MAESTROS\nEmpiece conversaciones (3 min.) (th lecc. 1)\nHaga revisitas (4 min.) (th lecc. 6)`}
              className="w-full p-3 text-xs font-mono rounded-xl border border-zinc-200 dark:border-[#27272A] bg-white dark:bg-[#18181F] text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Extracted preview */}
          {parsedData && (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181F] border border-zinc-200 dark:border-[#27272A] space-y-2.5 text-xs">
              <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-[#F4F4F5]">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Estructura extraída para la reunión:</span>
                </div>
              </div>

              {(songsData.initial || songsData.middle || songsData.final) && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] flex items-center gap-3 text-[11px] text-zinc-600 dark:text-[#D4D4D8]">
                  <Music className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>
                    Canciones: {songsData.initial ? `Inicial (${songsData.initial})` : ''}
                    {songsData.middle ? ` • Intermedia (${songsData.middle})` : ''}
                    {songsData.final ? ` • Final (${songsData.final})` : ''}
                  </span>
                </div>
              )}

              <div className="space-y-1.5 text-zinc-700 dark:text-[#D4D4D8]">
                <p>
                  <strong>Discurso Tesoros:</strong> {parsedData.discursoTitle}
                </p>
                <p>
                  <strong>Perlas:</strong> {parsedData.perlasTitle}
                </p>
                <p>
                  <strong>Lectura Biblia:</strong> {parsedData.lecturaBibliaTitle}
                </p>
                <div>
                  <strong>Demostraciones ({parsedData.demonstrations.length}):</strong>
                  <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-[11px] text-zinc-600 dark:text-[#A1A1AA]">
                    {parsedData.demonstrations.map((d, i) => (
                      <li key={i}>
                        {d.title} ({d.timeMinutes} min)
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Vida Cristiana:</strong>
                  <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-[11px] text-zinc-600 dark:text-[#A1A1AA]">
                    {parsedData.vidaPartes.map((v, i) => (
                      <li key={i}>
                        {v.title} ({v.timeMinutes} min)
                      </li>
                    ))}
                    {parsedData.estudioBiblicoTitle && (
                      <li>
                        <strong>Estudio Bíblico:</strong> {parsedData.estudioBiblicoTitle}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-[#27272A] flex items-center justify-between bg-zinc-50 dark:bg-[#121216]/60 rounded-b-3xl">
          <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
            Se aplicará a la semana: <strong className="text-zinc-700 dark:text-[#E4E4E7]">{currentWeek.weekStartDate}</strong>
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-600 dark:text-[#D4D4D8] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleApplyToCurrentWeek}
              className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
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
