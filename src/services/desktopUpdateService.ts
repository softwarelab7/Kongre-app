/**
 * Servicio de Verificación Automática de Actualizaciones para Kongre App Desktop
 */
import { CURRENT_APP_VERSION } from '../utils/versionLog';

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
  allAssets: Array<{ name: string; downloadUrl: string; size: number }>;
}

const GITHUB_REPO = 'softwarelab7/Kongre-app';
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const LAST_CHECK_KEY = 'kongre_desktop_last_update_check';
const CHECK_INTERVAL_MS = 1000 * 60 * 60 * 4; // Comprobar cada 4 horas automáticamente

/**
 * Detecta el sistema operativo del usuario para entregar el instalador exacto
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
 * Consulta la API de GitHub Releases para comprobar si existe una versión más reciente
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

    // Si la versión actual es diferente a la de la release pública más reciente
    const hasUpdate = cleanLatest !== '' && cleanLatest !== cleanCurrent;

    const platform = getClientPlatform();
    const assets: any[] = release.assets || [];

    // Mapear el archivo de descarga según el sistema operativo
    let matchedAsset = assets.find((a) => {
      const name = (a.name || '').toLowerCase();
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
