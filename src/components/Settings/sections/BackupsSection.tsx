// src/components/Settings/sections/BackupsSection.tsx
import React, { useState, useRef } from 'react';
import {
  Database,
  Lock,
  Download,
  Upload,
  FileKey,
  X,
  Eye,
  EyeOff,
  Unlock,
} from 'lucide-react';
import { useCongregation } from '../../../context/CongregationContext';
import { useAuth } from '../../../context/AuthContext';
import {
  encryptTheocraticData,
  decryptTheocraticData,
} from '../../../utils/theocraticSecurity';
import { insertAuditLog } from '../../../services/auditLogService';

export const BackupsSection: React.FC = () => {
  const {
    settings,
    exportBackupJSON,
    getBackupJSON,
    importBackupJSON,
  } = useCongregation();
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Encrypted Backup Export Modal States
  const [showEncryptExportModal, setShowEncryptExportModal] = useState(false);
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [confirmExportPassphrase, setConfirmExportPassphrase] = useState('');
  const [showExportPassphrase, setShowExportPassphrase] = useState(false);
  const [encryptExportError, setEncryptExportError] = useState<string | null>(null);
  const [isExportingEncrypted, setIsExportingEncrypted] = useState(false);

  // Encrypted Backup Restore Modal States
  const [showDecryptModal, setShowDecryptModal] = useState(false);
  const [pendingEncryptedJson, setPendingEncryptedJson] = useState<string | null>(null);
  const [decryptPassphrase, setDecryptPassphrase] = useState('');
  const [showDecryptPassphrase, setShowDecryptPassphrase] = useState(false);
  const [decryptModalError, setDecryptModalError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        if (parsed.version === 'kongre_v1' && parsed.ciphertext) {
          setPendingEncryptedJson(content);
          setDecryptPassphrase('');
          setDecryptModalError(null);
          setShowDecryptModal(true);
          return;
        }

        const success = importBackupJSON(content);
        if (success) {
          setImportStatus('¡Respaldo JSON restaurado exitosamente!');
        } else {
          setImportStatus('Error: El archivo no tiene un formato válido.');
        }
      } catch {
        setImportStatus('Error: Archivo corrupto o no compatible.');
      }
      setTimeout(() => setImportStatus(null), 3500);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportEncryptedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportPassphrase) {
      setEncryptExportError('Ingrese una contraseña para proteger la copia.');
      return;
    }
    if (exportPassphrase !== confirmExportPassphrase) {
      setEncryptExportError('Las contraseñas no coinciden.');
      return;
    }
    if (exportPassphrase.length < 6) {
      setEncryptExportError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsExportingEncrypted(true);
    setEncryptExportError(null);

    try {
      const plainJson = getBackupJSON();
      const encrypted = await encryptTheocraticData(plainJson, exportPassphrase);
      const blob = new Blob([encrypted], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Respaldo_Cifrado_${settings.congregationName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.enc.json`;
      link.click();
      URL.revokeObjectURL(url);

      setShowEncryptExportModal(false);
      setExportPassphrase('');
      setConfirmExportPassphrase('');

      insertAuditLog({
        accion: 'EXPORTAR_RESPALDO_CIFRADO',
        modulo: 'respaldos',
        hermano_nid: user?.email || 'sistema',
        detalles: 'Descarga de copia de seguridad cifrada con AES-256-GCM (.enc.json)',
      }).catch(() => {});
    } catch {
      setEncryptExportError('Error al cifrar el archivo de respaldo.');
    } finally {
      setIsExportingEncrypted(false);
    }
  };

  const handleDecryptRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEncryptedJson || !decryptPassphrase) return;

    setIsDecrypting(true);
    setDecryptModalError(null);

    try {
      const decryptedPlain = await decryptTheocraticData(pendingEncryptedJson, decryptPassphrase);
      const success = importBackupJSON(decryptedPlain);
      if (success) {
        setShowDecryptModal(false);
        setPendingEncryptedJson(null);
        setDecryptPassphrase('');
        setImportStatus('¡Respaldo cifrado descifrado y restaurado con éxito!');
        setTimeout(() => setImportStatus(null), 3500);

        insertAuditLog({
          accion: 'RESTAURAR_RESPALDO_CIFRADO',
          modulo: 'respaldos',
          hermano_nid: user?.email || 'sistema',
          detalles: 'Restauración exitosa de copia de seguridad cifrada AES-256-GCM',
        }).catch(() => {});
      } else {
        setDecryptModalError('El archivo descifrado no tiene el formato de congregación esperado.');
      }
    } catch (err: any) {
      setDecryptModalError(err.message || 'Contraseña incorrecta.');
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#121216] p-6 rounded-3xl border border-zinc-200 dark:border-[#27272A] space-y-6">
      <div className="pb-3 border-b border-zinc-100 dark:border-[#27272A] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-[#F4F4F5]">
              Copias de Seguridad y Respaldo Cifrado
            </h3>
            <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
              Descargas locales y protección con cifrado militar AES-256
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
        Exporta todos los datos teocráticos de la congregación. Puedes proteger tu copia con una clave de cifrado militar AES-256 para que nadie sin la contraseña pueda leer el archivo ni acceder a los registros.
      </p>

      {importStatus && (
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs font-bold animate-fade-in">
          {importStatus}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        {/* Encrypted Export Button */}
        <button
          type="button"
          onClick={() => {
            setExportPassphrase('');
            setConfirmExportPassphrase('');
            setEncryptExportError(null);
            setShowEncryptExportModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Lock className="w-4 h-4 text-indigo-200" />
          <span>Exportar Respaldo Cifrado (.enc.json)</span>
        </button>

        {/* Standard JSON Export */}
        <button
          type="button"
          onClick={exportBackupJSON}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-[#27272A] hover:bg-zinc-800 dark:hover:bg-[#3F3F46] text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Descargar JSON Estándar</span>
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json,.orgenc.json,.enc.json"
          className="hidden"
        />

        {/* Restore Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-[#18181F] hover:bg-zinc-200 dark:hover:bg-[#27272A] text-zinc-700 dark:text-[#F4F4F5] text-xs font-bold transition-all active:scale-95 cursor-pointer border border-zinc-200 dark:border-[#27272A]"
        >
          <Upload className="w-4 h-4 text-zinc-500 dark:text-[#A1A1AA]" />
          <span>Restaurar Copia de Seguridad</span>
        </button>
      </div>

      {/* EXPORT ENCRYPTED BACKUP MODAL */}
      {showEncryptExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#27272A] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FileKey className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm">
                  Exportar Respaldo con Cifrado Militar
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowEncryptExportModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExportEncryptedSubmit} className="space-y-3.5 text-xs">
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                Se aplicará cifrado <strong>AES-256-GCM</strong> con 100.000 iteraciones de derivación PBKDF2. El archivo descargado no podrá ser abierto por nadie que no conozca esta contraseña.
              </p>

              {encryptExportError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-semibold">
                  {encryptExportError}
                </div>
              )}

              <div>
                <label className="block font-bold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                  Contraseña de Cifrado:
                </label>
                <div className="relative">
                  <input
                    type={showExportPassphrase ? 'text' : 'password'}
                    value={exportPassphrase}
                    onChange={(e) => setExportPassphrase(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full p-2.5 pr-10 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowExportPassphrase(!showExportPassphrase)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5]"
                  >
                    {showExportPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                  Confirmar Contraseña:
                </label>
                <input
                  type={showExportPassphrase ? 'text' : 'password'}
                  value={confirmExportPassphrase}
                  onChange={(e) => setConfirmExportPassphrase(e.target.value)}
                  placeholder="Repita la contraseña"
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setShowEncryptExportModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isExportingEncrypted}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isExportingEncrypted ? 'Cifrando...' : 'Descargar Archivo Cifrado'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DECRYPT AND RESTORE MODAL */}
      {showDecryptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#121216] border border-zinc-200 dark:border-[#27272A] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-[#27272A] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/50 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-[#F4F4F5] text-sm">
                  Archivo Cifrado Detectado
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDecryptModal(false);
                  setPendingEncryptedJson(null);
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-[#F4F4F5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDecryptRestore} className="space-y-3.5 text-xs">
              <p className="text-xs text-zinc-500 dark:text-[#A1A1AA]">
                El archivo seleccionado está protegido con cifrado AES-256. Ingrese la contraseña con la que fue creado para descifrarlo en su navegador y restaurar los datos:
              </p>

              {decryptModalError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-semibold">
                  {decryptModalError}
                </div>
              )}

              <div>
                <label className="block font-bold text-zinc-700 dark:text-[#A1A1AA] mb-1">
                  Contraseña de Descifrado:
                </label>
                <div className="relative">
                  <input
                    type={showDecryptPassphrase ? 'text' : 'password'}
                    value={decryptPassphrase}
                    onChange={(e) => setDecryptPassphrase(e.target.value)}
                    placeholder="Ingrese la contraseña del respaldo"
                    className="w-full p-2.5 pr-10 rounded-xl border border-zinc-200 dark:border-[#27272A] bg-zinc-50 dark:bg-[#18181F] text-zinc-900 dark:text-[#F4F4F5]"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowDecryptPassphrase(!showDecryptPassphrase)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-[#F4F4F5]"
                  >
                    {showDecryptPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-[#27272A]">
                <button
                  type="button"
                  onClick={() => {
                    setShowDecryptModal(false);
                    setPendingEncryptedJson(null);
                  }}
                  className="px-4 py-2 rounded-xl text-zinc-600 dark:text-[#A1A1AA] hover:bg-zinc-100 dark:hover:bg-[#18181F] font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDecrypting || !decryptPassphrase}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{isDecrypting ? 'Descifrando...' : 'Descifrar y Restaurar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
