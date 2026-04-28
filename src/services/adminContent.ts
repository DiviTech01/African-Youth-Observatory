// Admin-managed content store (reports, documents, future site settings).
// localStorage-based for now — files stored as base64 data URLs so the
// front-end Reports page can resolve download buttons to real files
// without a backend round-trip. Migrate to a real storage backend (S3,
// Supabase Storage) by swapping the read/write helpers below.

export type ReportType = 'Country Report' | 'Thematic Report' | 'Regional Report';

export interface ReportFile {
  /** Original filename including extension */
  name: string;
  /** MIME type, e.g. application/pdf */
  type: string;
  /** Base64 data URL — used directly as the download href */
  dataUrl: string;
  /** Size in bytes */
  size: number;
}

export interface AdminReport {
  id: string;
  title: string;
  description: string;
  category: string;
  type: ReportType;
  theme: string;
  year: number;
  date: string; // ISO date
  featured: boolean;
  downloads: number;
  files: ReportFile[];
  createdAt: number;
  updatedAt: number;
}

const REPORTS_KEY = 'ayo_admin_reports_v1';
const SITE_SETTINGS_KEY = 'ayo_site_settings_v1';

// ─── Reports ────────────────────────────────────────────────────────────────

export function getAdminReports(): AdminReport[] {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

export function saveAdminReports(reports: AdminReport[]): void {
  try { localStorage.setItem(REPORTS_KEY, JSON.stringify(reports)); }
  catch (e) { console.error('[admin-content] failed to save reports', e); }
}

export function upsertAdminReport(report: AdminReport): AdminReport[] {
  const all = getAdminReports();
  const idx = all.findIndex((r) => r.id === report.id);
  const next = idx >= 0
    ? all.map((r) => (r.id === report.id ? { ...report, updatedAt: Date.now() } : r))
    : [{ ...report, updatedAt: Date.now() }, ...all];
  saveAdminReports(next);
  return next;
}

export function deleteAdminReport(id: string): AdminReport[] {
  const next = getAdminReports().filter((r) => r.id !== id);
  saveAdminReports(next);
  return next;
}

export function incrementReportDownloads(id: string): void {
  const all = getAdminReports();
  const next = all.map((r) => (r.id === id ? { ...r, downloads: r.downloads + 1 } : r));
  saveAdminReports(next);
}

// ─── File helpers ───────────────────────────────────────────────────────────

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function bytesToReadable(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function inferFormat(filename: string): string {
  const ext = filename.split('.').pop()?.toUpperCase() || '';
  return ext;
}

// ─── Site settings (placeholder for future expansion) ──────────────────────

export interface SiteSettings {
  bannerMessage: string;
  bannerActive: boolean;
  featuredCountry: string;
  partnerLogosEnabled: boolean;
  contactEmail: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  bannerMessage: '',
  bannerActive: false,
  featuredCountry: '',
  partnerLogosEnabled: true,
  contactEmail: 'afriyouthstats@pacsda.org',
};

export function getSiteSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(SITE_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

export function saveSiteSettings(s: SiteSettings): void {
  try { localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(s)); }
  catch (e) { console.error('[admin-content] failed to save site settings', e); }
}
