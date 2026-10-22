// src/components/QrCodeModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useCongregation } from '../context/CongregationContext';
import { X, QrCode, Download, Printer, Copy, Check, ExternalLink } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose }) => {
  const { settings } = useCongregation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const currentUrl =
    typeof window !== 'undefined' && window.location?.href
      ? window.location.href.split('?')[0] + '?modo=tablero'
      : '/?modo=tablero';

  useEffect(() => {
    if (isOpen && canvasRef.current && currentUrl) {
      QRCode.toCanvas(
        canvasRef.current,
        currentUrl,
        {
          width: 240,
          margin: 2,
          color: {
            dark: '#1e1b4b', // Indigo 950
            light: '#ffffff',
          },
        },
        error => {
          if (error) console.error('Error generating QR:', error);
        }
      );
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_Tablero_${settings.congregationName.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Código QR para el Tablero"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Código QR para el Tablero</h3>
              <p className="text-xs text-slate-500">Acceso móvil para publicadores</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar código QR"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center space-y-3">
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
            {settings.congregationName}
          </h4>
          <p className="text-xs text-slate-500 max-w-xs">
            Escanea este código con la cámara de tu celular para consultar tus asignaciones en tiempo real:
          </p>

          <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200">
            <canvas ref={canvasRef} className="rounded-lg" />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            Sin instalación requerida
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 text-xs text-slate-600">
            <span className="truncate flex-1 text-left font-mono">{currentUrl}</span>
            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-semibold text-slate-800 hover:bg-slate-50 flex items-center gap-1 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleDownloadQr}
              className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Descargar Imagen</span>
            </button>

            <button
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Cartel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
