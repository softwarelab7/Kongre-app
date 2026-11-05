// src/components/LocalP2PTransferModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Download,
  Copy,
  Check,
  ArrowLeft,
  Radio,
  Camera,
  CameraOff,
  Upload,
  Calendar,
  FileSpreadsheet,
  MapPin,
  Users,
  Database,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Layers,
  ArrowLeftRight,
  WifiOff,
} from 'lucide-react';
import { useCongregation } from '../context/CongregationContext';
import { useToast } from '../context/ToastContext';
import {
  TransferContentType,
  TheocraticTransferPackage,
  buildTheocraticTransferPackage,
  compressPackageToTransferString,
  decompressTransferStringToPackage,
  broadcastPackageLocally,
  LOCAL_P2P_BROADCAST_CHANNEL,
} from '../utils/p2pTransferEngine';

interface LocalP2PTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultContentType?: TransferContentType;
}

export const LocalP2PTransferModal: React.FC<LocalP2PTransferModalProps> = ({
  isOpen,
  onClose,
  defaultContentType = 'meetings',
}) => {
  const {
    publishers,
    weeks,
    territories,
    monthlyReports,
    preachingGroups,
    customDuties,
    settings,
    outgoingSpeakers,
    cartLocations,
    cartShifts,
    transactions,
    quarterlyAudits,
    applyTheocraticTransferPackage,
  } = useCongregation();

  const { showToast } = useToast();

  // Navigation tab: 'send' | 'receive'
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');
  const [contentType, setContentType] = useState<TransferContentType>(defaultContentType);

  // Send states
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrString, setQrString] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [currentPackage, setCurrentPackage] = useState<TheocraticTransferPackage | null>(null);

  // Receive states
  const [receiveInputMode, setReceiveInputMode] = useState<'camera' | 'paste' | 'file'>('camera');
  const [manualCode, setManualCode] = useState<string>('');
  const [scannedPackage, setScannedPackage] = useState<TheocraticTransferPackage | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── GENERACIÓN DE PAQUETE PARA ENVIAR ─────────────────────────────────────
  useEffect(() => {
    if (!isOpen || activeTab !== 'send') return;

    let isMounted = true;
    setIsGeneratingQr(true);

    const ctx = {
      publishers,
      weeks,
      territories,
      monthlyReports,
      preachingGroups,
      customDuties,
      settings,
      outgoingSpeakers,
      cartLocations,
      cartShifts,
      transactions,
      quarterlyAudits,
    };

    const pkg = buildTheocraticTransferPackage(
      contentType,
      ctx,
      settings.congregationName || 'Congregación',
      settings.congregationNumber
    );

    setCurrentPackage(pkg);

    compressPackageToTransferString(pkg)
      .then((compressedStr) => {
        if (!isMounted) return;
        setQrString(compressedStr);

        if (canvasRef.current) {
          QRCode.toCanvas(
            canvasRef.current,
            compressedStr,
            {
              width: 260,
              margin: 2,
              errorCorrectionLevel: 'M',
              color: {
                dark: '#1e1b4b', // Indigo 950
                light: '#ffffff',
              },
            },
            (err) => {
              if (err) console.error('Error renderizando QR:', err);
              if (isMounted) setIsGeneratingQr(false);
            }
          );
        } else {
          setIsGeneratingQr(false);
        }
      })
      .catch((err) => {
        console.error('Error al empaquetar datos:', err);
        if (isMounted) setIsGeneratingQr(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    isOpen,
    activeTab,
    contentType,
    publishers,
    weeks,
    territories,
    monthlyReports,
    preachingGroups,
    customDuties,
    settings,
  ]);

  // ─── ESCÁNER DE CÁMARA PARA RECIBIR ─────────────────────────────────────────
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Este navegador no permite acceso directo a la cámara.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);

      // Comprobar soporte de BarcodeDetector nativo
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const rawVal = barcodes[0].rawValue;
              if (rawVal) {
                stopCamera();
                void handleProcessScannedString(rawVal);
              }
            }
          } catch {}
        }, 300);
      } else {
        setCameraError(
          'El escaneo automático en vivo no está soportado por este navegador. Puedes tomar una foto del código QR o pegar el texto.'
        );
      }
    } catch (err: any) {
      console.warn('Acceso a cámara no concedido:', err);
      setCameraError('Permiso de cámara no concedido o no hay cámara disponible.');
      stopCamera();
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'receive' && receiveInputMode === 'camera' && !scannedPackage) {
      void startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, receiveInputMode, scannedPackage]);

  // ─── ESCUCHADOR DE BROADCASTCHANNEL LOCAL ──────────────────────────────────
  useEffect(() => {
    if (!isOpen || typeof BroadcastChannel === 'undefined') return;

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(LOCAL_P2P_BROADCAST_CHANNEL);
      bc.onmessage = (event) => {
        if (event.data?.type === 'KONGRE_TRANSFER_OFFER' && event.data.package) {
          setScannedPackage(event.data.package);
          setActiveTab('receive');
          showToast('¡Paquete recibido desde otra ventana de Kongre!', 'success');
        }
      };
    } catch {}

    return () => {
      if (bc) bc.close();
    };
  }, [isOpen, showToast]);

  if (!isOpen) return null;

  // ─── PROCESAMIENTO DE PAQUETE ──────────────────────────────────────────────
  const handleProcessScannedString = async (inputStr: string) => {
    const res = await decompressTransferStringToPackage(inputStr);
    if (res.package) {
      setScannedPackage(res.package);
      showToast('¡Paquete de transferencia reconocido y validado!', 'success');
    } else {
      showToast(res.error || 'Código no válido o incompatible con Kongre.', 'error');
    }
  };

  const handleApplyPackage = (mode: 'merge' | 'replace') => {
    if (!scannedPackage || !applyTheocraticTransferPackage) return;
    const res = applyTheocraticTransferPackage(scannedPackage, mode);
    if (res.success) {
      showToast(
        mode === 'merge' ? '¡Datos fusionados exitosamente!' : '¡Módulo reemplazado exitosamente!',
        'success'
      );
      setScannedPackage(null);
      onClose();
    } else {
      showToast('Error al aplicar los datos recibidos.', 'error');
    }
  };

  const handleCopyQrString = () => {
    if (!qrString) return;
    navigator.clipboard.writeText(qrString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Código de transferencia copiado al portapapeles', 'info');
  };

  const handleDownloadQrImage = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_Transferencia_${contentType}_${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  const handleDownloadJsonFile = () => {
    if (!currentPackage) return;
    const blob = new Blob([JSON.stringify(currentPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Paquete_Kongre_${contentType}_${new Date().toISOString().slice(0, 10)}.kongre.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Archivo de transferencia descargado', 'info');
  };

  const handleBroadcastLocally = () => {
    if (!currentPackage) return;
    broadcastPackageLocally(currentPackage);
    showToast('Emitido a ventanas locales vía canal P2P', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        void handleProcessScannedString(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Transferencia Directa Local P2P & QR"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-[#121216] border border-zinc-200/80 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-white/10 flex items-center justify-between gap-3 bg-zinc-50/60 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-mobile-back-btn="true"
              onClick={onClose}
              aria-label="Volver"
              className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-200 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                  Transferencia Directa Local Salón
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <WifiOff size={10} /> 100% Offline
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Intercambio rápido de datos entre hermanos en el Salón sin conexión a Internet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="hidden sm:inline-flex p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Apple Segmented Control: Enviar / Recibir */}
        <div className="p-3 sm:p-4 border-b border-zinc-200/60 dark:border-white/5 bg-zinc-50/40 dark:bg-white/[0.01]">
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-200/60 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setActiveTab('send');
                setScannedPackage(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'send'
                  ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Enviar Datos (Generar QR)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('receive')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'receive'
                  ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Recibir Datos (Escanear)</span>
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal con Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* ═══════════ PESTAÑA: ENVIAR DATOS ═══════════ */}
          {activeTab === 'send' && (
            <div className="space-y-5 animate-fade-in">
              {/* Selector de Contenido a Compartir */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Selecciona qué deseas transferir:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setContentType('meetings')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      contentType === 'meetings'
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500/60 text-indigo-900 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500/20'
                        : 'bg-zinc-50/60 dark:bg-white/5 border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Programa Reuniones</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {weeks.length} semanas y asignaciones VMC/FDS
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentType('field_service')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      contentType === 'field_service'
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500/60 text-indigo-900 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500/20'
                        : 'bg-zinc-50/60 dark:bg-white/5 border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Informes S-4</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {monthlyReports.length} informes mensuales de grupos
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentType('territories')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      contentType === 'territories'
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500/60 text-indigo-900 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500/20'
                        : 'bg-zinc-50/60 dark:bg-white/5 border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Territorios S-13</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {territories.length} mapas y manzanas
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentType('publishers')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      contentType === 'publishers'
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500/60 text-indigo-900 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500/20'
                        : 'bg-zinc-50/60 dark:bg-white/5 border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Publicadores S-21</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {publishers.length} registros y nombramientos
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentType('full')}
                    className={`col-span-2 sm:col-span-2 p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      contentType === 'full'
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500/60 text-indigo-900 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500/20'
                        : 'bg-zinc-50/60 dark:bg-white/5 border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Database className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <span>Copia Completa de Congregación</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Respaldo total de todos los departamentos y cuentas
                    </span>
                  </button>
                </div>
              </div>

              {/* Visor de Código QR y Tarjeta de Transferencia */}
              <div className="p-5 rounded-3xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 flex flex-col items-center justify-center text-center space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {currentPackage?.summary.title || 'Preparando transferencia...'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                  Pide al hermano que abra la pestaña <strong>«Recibir»</strong> en su celular o tablet y escanee este código:
                </p>

                {/* Canvas QR */}
                <div className="p-3 bg-white rounded-2xl shadow-md border border-zinc-200/80">
                  <canvas ref={canvasRef} className="rounded-xl" />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-200/70 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
                    Deflate {qrString.length} bytes
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    Sello SHA-256 ✓
                  </span>
                </div>
              </div>

              {/* Acciones de Envío */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyQrString}
                  className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQrImage}
                  className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Imagen QR</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJsonFile}
                  className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Archivo .json</span>
                </button>

                <button
                  type="button"
                  onClick={handleBroadcastLocally}
                  className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Emitir Local</span>
                </button>
              </div>
            </div>
          )}

          {/* ═══════════ PESTAÑA: RECIBIR DATOS ═══════════ */}
          {activeTab === 'receive' && (
            <div className="space-y-5 animate-fade-in">
              {/* Si hay un paquete escaneado pendiente de confirmación */}
              {scannedPackage ? (
                <div className="p-5 rounded-3xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                          {scannedPackage.summary.title}
                        </h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300">
                          {scannedPackage.summary.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setScannedPackage(null)}
                      className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline cursor-pointer"
                    >
                      Descartar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10">
                      <span className="text-[10px] text-zinc-400 block font-medium">Congregación:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate block">
                        {scannedPackage.congregationName}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10">
                      <span className="text-[10px] text-zinc-400 block font-medium">Exportado:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
                        {new Date(scannedPackage.exportedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10">
                      <span className="text-[10px] text-zinc-400 block font-medium">Integridad:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                        Sello Criptográfico ✓
                      </span>
                    </div>
                  </div>

                  {/* Acciones de Fusión o Reemplazo */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyPackage('merge')}
                      className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Fusionar e Integrar Novedades</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyPackage('replace')}
                      className="w-full sm:w-auto py-3 px-4 rounded-2xl border border-zinc-300 dark:border-white/20 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Reemplazar Módulo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Selector de Modo de Recepción (Cámara / Pegar / Archivo) */}
                  <div className="grid grid-cols-3 p-1 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setReceiveInputMode('camera')}
                      className={`py-2 rounded-xl transition-all cursor-pointer ${
                        receiveInputMode === 'camera'
                          ? 'bg-white dark:bg-white/15 text-indigo-600 dark:text-indigo-300 shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      Cámara en Vivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setReceiveInputMode('paste')}
                      className={`py-2 rounded-xl transition-all cursor-pointer ${
                        receiveInputMode === 'paste'
                          ? 'bg-white dark:bg-white/15 text-indigo-600 dark:text-indigo-300 shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      Pegar Código
                    </button>
                    <button
                      type="button"
                      onClick={() => setReceiveInputMode('file')}
                      className={`py-2 rounded-xl transition-all cursor-pointer ${
                        receiveInputMode === 'file'
                          ? 'bg-white dark:bg-white/15 text-indigo-600 dark:text-indigo-300 shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      Subir Archivo
                    </button>
                  </div>

                  {/* Modo 1: Cámara en vivo */}
                  {receiveInputMode === 'camera' && (
                    <div className="space-y-3">
                      <div className="relative aspect-video max-h-64 sm:max-h-72 w-full rounded-3xl overflow-hidden bg-black flex items-center justify-center border border-zinc-200 dark:border-white/10">
                        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

                        {cameraActive && (
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-48 h-48 border-2 border-dashed border-indigo-400 rounded-3xl animate-pulse flex items-center justify-center">
                              <span className="text-[10px] text-white/80 font-bold bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-xs">
                                Enfoca el código QR
                              </span>
                            </div>
                          </div>
                        )}

                        {!cameraActive && (
                          <div className="text-center p-4 space-y-2">
                            <CameraOff className="w-8 h-8 text-zinc-500 mx-auto" />
                            <p className="text-xs text-zinc-400">La cámara está desactivada.</p>
                            <button
                              type="button"
                              onClick={() => void startCamera()}
                              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                            >
                              Activar Cámara
                            </button>
                          </div>
                        )}
                      </div>

                      {cameraError && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 text-center font-medium">
                          {cameraError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Modo 2: Pegar Código */}
                  {receiveInputMode === 'paste' && (
                    <div className="space-y-3">
                      <textarea
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="Pega aquí la cadena de transferencia (comienza con kgr_p2p_z:... o JSON)..."
                        className="w-full h-36 p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      />
                      <button
                        type="button"
                        disabled={!manualCode.trim()}
                        onClick={() => void handleProcessScannedString(manualCode)}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all"
                      >
                        Validar y Previsualizar Datos
                      </button>
                    </div>
                  )}

                  {/* Modo 3: Subir Archivo */}
                  {receiveInputMode === 'file' && (
                    <div className="p-8 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-white/10 flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                          Selecciona un paquete .kongre.json
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Transferido vía Bluetooth, AirDrop o memoria USB
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.kongre"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer active:scale-95 transition-all"
                      >
                        Explorar Archivo
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
