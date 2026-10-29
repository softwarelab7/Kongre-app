/**
 * Servicio de Verificación Automática de Actualizaciones para Kongre App Desktop
 */
import { CURRENT_APP_VERSION } from '../utils/versionLog';
import { isDesktopApp } from '../utils/platform';

export type InstallKind = 'windows' | 'macos' | 'appimage' | 'linux-rpm' | 'linux-deb' | 'unknown';

export interface DesktopUpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseTitle: string;
  releaseNotes: string;
  publishedAt: string;
  downloadUrl: string;
  fileName: string;
  fileSize: string;
  canAutoUpdate: boolean;
  installKind: InstallKind;
  allAssets: Array<{ name: string; downloadUrl: string; size: number }>;
}

const GITHUB_REPO = 'softwarelab7/Kongre-app';
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const LAST_CHECK_KEY = 'kongre_desktop_last_update_check';
const CHECK_INTERVAL_MS = 1000 * 60 * 60 * 4; // Comprobar cada 4 horas automáticamente

/**
 * Consulta a Rust qué tipo de instalación está corriendo la aplicación.
 */
export async function getInstallKind(): Promise<InstallKind> {
  if (typeof window === 'undefined' || !isDesktopApp()) return 'unknown';
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const kind = await invoke<string>('install_kind');
    return (kind as InstallKind) || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Detecta el sistema operativo del cliente por User-Agent como fallback.
 */
export function getClientPlatform(): 'windows' | 'fedora' | 'debian' | 'mac' {
  if (typeof window === 'undefined') return 'windows';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('fedora') || ua.includes('red hat') || ua.includes('rhel')) return 'fedora';
  if (ua.includes('mac')) return 'mac';
  if (ua.includes('linux')) return 'debian';
  return 'windows';
}

/**
 * Compara versiones tipo "0.1.0-alpha.37". Devuelve >0 si a es más reciente que b.
 * Una versión sin prerelease (0.1.0) se considera más reciente que 0.1.0-alpha.N.
 */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => {
    const [core, pre = ''] = v.split('-');
    return { core: core.split('.').map((n) => parseInt(n, 10) || 0), pre };
  };
  const va = parse(a);
  const vb = parse(b);
  for (let i = 0; i < 3; i++) {
    const diff = (va.core[i] || 0) - (vb.core[i] || 0);
    if (diff !== 0) return diff;
  }
  if (va.pre === vb.pre) return 0;
  if (!va.pre) return 1;
  if (!vb.pre) return -1;
  const pa = va.pre.split('.');
  const pb = vb.pre.split('.');
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i];
    const y = pb[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const nx = Number(x);
    const ny = Number(y);
    if (!isNaN(nx) && !isNaN(ny)) {
      if (nx !== ny) return nx - ny;
    } else if (x !== y) {
      return x < y ? -1 : 1;
    }
  }
  return 0;
}

/**
 * Consulta la API de GitHub Releases para comprobar si existe una versión más reciente.
 */
export async function checkForDesktopUpdate(force: boolean = false): Promise<DesktopUpdateInfo | null> {
  try {
    if (!force) {
      const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
      if (lastCheck && Date.now() - parseInt(lastCheck, 10) < CHECK_INTERVAL_MS) {
        return null;
      }
    }

    const response = await fetch(API_URL, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());

    const release = await response.json();
    const latestTag: string = release.tag_name || '';
    const cleanLatest = latestTag.replace(/^v/, '');
    const cleanCurrent = CURRENT_APP_VERSION.replace(/^v/, '');

    // Solo hay actualización si la release pública es estrictamente más reciente que la instalada
    const hasUpdate = cleanLatest !== '' && compareVersions(cleanLatest, cleanCurrent) > 0;

    const installKind = await getInstallKind();
    const platform = getClientPlatform();
    const assets: any[] = release.assets || [];

    // Puede actualizar con 1 clic si es Windows, macOS o paquete portable AppImage
    const canAutoUpdate = installKind === 'windows' || installKind === 'macos' || installKind === 'appimage';

    // Mapear el archivo de descarga exacto según el sistema operativo o formato
    let matchedAsset = assets.find((a) => {
      const name = (a.name || '').toLowerCase();
      if (installKind === 'linux-rpm') return name.endsWith('.rpm');
      if (installKind === 'linux-deb') return name.endsWith('.deb');
      if (installKind === 'appimage') return name.endsWith('.appimage');
      if (installKind === 'windows') return name.endsWith('.exe') || name.endsWith('.msi');
      if (installKind === 'macos') return name.endsWith('.dmg');

      // Fallbacks basados en User-Agent si installKind es unknown
      if (platform === 'windows') return name.endsWith('.exe') || name.endsWith('.msi');
      if (platform === 'fedora') return name.endsWith('.rpm');
      if (platform === 'mac') return name.endsWith('.dmg');
      if (platform === 'debian') return name.endsWith('.deb') || name.endsWith('.appimage');
      return false;
    });

    if (!matchedAsset && assets.length > 0) {
      matchedAsset = assets[0];
    }

    const downloadUrl = matchedAsset
      ? matchedAsset.browser_download_url
      : release.html_url || `https://github.com/${GITHUB_REPO}/releases/latest`;

    const fileName = matchedAsset ? matchedAsset.name : 'Instalador Oficial';
    const fileSizeMB = matchedAsset && matchedAsset.size ? (matchedAsset.size / (1024 * 1024)).toFixed(1) + ' MB' : '';

    return {
      hasUpdate,
      currentVersion: cleanCurrent,
      latestVersion: cleanLatest,
      releaseTitle: release.name || latestTag,
      releaseNotes: release.body || '',
      publishedAt: release.published_at || '',
      downloadUrl,
      fileName,
      fileSize: fileSizeMB,
      canAutoUpdate,
      installKind,
      allAssets: assets.map((a) => ({
        name: a.name,
        downloadUrl: a.browser_download_url,
        size: a.size,
      })),
    };
  } catch {
    return null;
  }
}

/**
 * Ejecuta la actualización automática de 1 clic (descarga, verificación e instalación en caliente).
 */
export async function applyOneClickUpdate(
  onProgress?: (progressPercent: number, statusText: string) => void
): Promise<void> {
  const { check } = await import('@tauri-apps/plugin-updater');
  const { relaunch } = await import('@tauri-apps/plugin-process');

  onProgress?.(5, 'Comprobando paquetes oficiales...');
  const update = await check();
  if (!update) {
    throw new Error('No se encontró una actualización disponible en el canal oficial.');
  }

  let downloaded = 0;
  let totalLength: number | undefined;

  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case 'Started':
        totalLength = event.data.contentLength;
        onProgress?.(10, 'Iniciando descarga segura...');
        break;
      case 'Progress': {
        downloaded += event.data.chunkLength;
        const percent = totalLength && totalLength > 0
          ? Math.min(95, Math.round((downloaded / totalLength) * 90) + 5)
          : 50;
        const mb = (downloaded / (1024 * 1024)).toFixed(1);
        const totalMb = totalLength ? (totalLength / (1024 * 1024)).toFixed(1) : '?';
        onProgress?.(percent, `Descargando actualización (${mb} MB de ${totalMb} MB)...`);
        break;
      }
      case 'Finished':
        onProgress?.(98, 'Instalando actualización y preparando reinicio...');
        break;
    }
  });

  onProgress?.(100, '¡Actualización completada! Reiniciando Kongre...');
  // Pequeña pausa para que el usuario perciba la confirmación visual antes del reinicio
  await new Promise((r) => setTimeout(r, 800));
  await relaunch();
}
