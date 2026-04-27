// CMS / Content API client — fetches published content, admin CRUD helpers.

// Cloudflare Pages serves the SPA but has no /api proxy, so a relative "/api"
// would return the index.html and break JSON parsing. Always resolve to the
// Render backend when running anywhere other than localhost.
const RENDER_API_URL = 'https://african-youth-observatory.onrender.com/api';

function resolveContentApiBase(): string {
  const viteUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (viteUrl && /^https?:\/\//i.test(viteUrl)) return viteUrl;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
    if (!isLocal) return RENDER_API_URL;
    return '/api';
  }
  return import.meta.env.PROD ? RENDER_API_URL : '/api';
}

export const CONTENT_API_BASE = resolveContentApiBase();

export type ContentType = 'TEXT' | 'RICH_TEXT' | 'IMAGE';

export interface ContentStyles {
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  letterSpacing?: string;
  lineHeight?: string;
  textDecoration?: string;
  textTransform?: string;
}

export interface PublishedContent {
  content: string;
  styles: ContentStyles;
  imageUrl: string | null;
  contentType: ContentType;
  version: number;
}

export type PublishedContentMap = Record<string, PublishedContent>;

export interface ContentEntryRow {
  id: string;
  key: string;
  page: string;
  section: string | null;
  contentType: ContentType;
  description: string | null;
  status: 'published' | 'draft' | 'new';
  currentContent: string;
  draftContent: string | null;
  imageUrl: string | null;
  updatedAt: string;
}

export interface ContentEntryDetail {
  id: string;
  key: string;
  page: string;
  section: string | null;
  contentType: ContentType;
  defaultContent: string;
  defaultStyles: ContentStyles;
  description: string | null;
  draft: {
    content: string;
    styles: ContentStyles;
    imageUrl: string | null;
    updatedAt: string;
    updatedById: string | null;
  } | null;
  published: {
    content: string;
    styles: ContentStyles;
    imageUrl: string | null;
    version: number;
    publishedAt: string;
    publishedById: string | null;
  } | null;
  revisions: Array<{
    id: string;
    content: string;
    styles: ContentStyles;
    imageUrl: string | null;
    version: number;
    action: 'SAVE_DRAFT' | 'PUBLISH' | 'REVERT' | 'DISCARD_DRAFT';
    actorId: string | null;
    createdAt: string;
  }>;
}

export interface PageTreeNode {
  page: string;
  sections: Record<string, number>;
  total: number;
}

function authHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ayd_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${CONTENT_API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...authHeader(),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Content API error ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const contentApi = {
  getPublished(preview = false): Promise<PublishedContentMap> {
    return request<PublishedContentMap>(`/content/published${preview ? '?preview=1' : ''}`);
  },

  listEntries(params: {
    search?: string;
    page?: string;
    section?: string;
    contentType?: ContentType;
    status?: 'all' | 'published' | 'draft' | 'new';
    pageNum?: number;
    pageSize?: number;
  } = {}): Promise<{ data: ContentEntryRow[]; total: number; page: number; pageSize: number }> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    return request(`/content/entries?${qs.toString()}`);
  },

  listPages(): Promise<PageTreeNode[]> {
    return request(`/content/pages`);
  },

  getEntry(key: string): Promise<ContentEntryDetail> {
    return request(`/content/entries/${encodeURIComponent(key)}`);
  },

  saveDraft(
    key: string,
    payload: { content: string; styles?: ContentStyles; imageUrl?: string | null },
  ) {
    return request(`/content/entries/${encodeURIComponent(key)}/draft`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  publish(key: string) {
    return request(`/content/entries/${encodeURIComponent(key)}/publish`, {
      method: 'POST',
    });
  },

  revert(key: string, revisionId: string) {
    return request(`/content/entries/${encodeURIComponent(key)}/revert`, {
      method: 'POST',
      body: JSON.stringify({ revisionId }),
    });
  },

  discardDraft(key: string) {
    return request(`/content/entries/${encodeURIComponent(key)}/draft`, {
      method: 'DELETE',
    });
  },

  syncRegistry(entries: Array<{
    key: string;
    page: string;
    section?: string;
    contentType?: ContentType;
    defaultContent?: string;
    defaultStyles?: ContentStyles;
    description?: string;
  }>): Promise<{ created: number; updated: number; total: number }> {
    return request(`/content/sync-registry`, {
      method: 'POST',
      body: JSON.stringify({ entries }),
    });
  },

  checkDrift(keys: string[]): Promise<{
    missing: string[];
    orphaned: string[];
    localCount: number;
    backendCount: number;
  }> {
    return request(`/content/drift`, {
      method: 'POST',
      body: JSON.stringify({ keys }),
    });
  },

  async uploadImage(file: File): Promise<{ url: string; key: string }> {
    const form = new FormData();
    form.append('file', file);
    return request(`/content/images`, { method: 'POST', body: form });
  },

  storageHealth(): Promise<{
    configured: boolean;
    reachable: boolean;
    bucket: string | null;
    publicUrl: string | null;
    reason?: string;
    missingVars?: string[];
  }> {
    return request(`/content/storage/health`);
  },
};
