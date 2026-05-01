/**
 * Upload a FormData payload via XMLHttpRequest so we can report bytes-sent
 * progress to the UI. `fetch` doesn't expose request-side progress events,
 * which is why we drop down to XHR for upload flows where the contributor
 * needs to see how long it'll take.
 *
 * Server response is parsed as JSON. Non-2xx responses throw with a helpful
 * message that includes the server's body (which Nest formats as
 * `{statusCode, message, error}`).
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
  /** ms since the upload started — useful for ETA calculation */
  elapsedMs: number;
  /** Smoothed bytes-per-second */
  bytesPerSec: number;
  /** Estimated time to completion in ms, or null when not yet computable */
  etaMs: number | null;
}

export interface XhrUploadOptions {
  url: string;
  body: FormData;
  headers?: Record<string, string>;
  onProgress?: (p: UploadProgress) => void;
  signal?: AbortSignal;
}

export async function xhrUpload<T = unknown>({
  url,
  body,
  headers,
  onProgress,
  signal,
}: XhrUploadOptions): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        // Don't override Content-Type — XHR sets the multipart boundary itself.
        if (k.toLowerCase() === 'content-type') continue;
        xhr.setRequestHeader(k, v);
      }
    }

    const start = performance.now();

    if (xhr.upload && onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (!event.lengthComputable) return;
        const elapsedMs = performance.now() - start;
        const bytesPerSec = elapsedMs > 0 ? (event.loaded / elapsedMs) * 1000 : 0;
        const remaining = event.total - event.loaded;
        const etaMs = bytesPerSec > 0 ? Math.round(remaining / bytesPerSec * 1000) : null;
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percent: Math.min(100, Math.round((event.loaded / event.total) * 100)),
          elapsedMs,
          bytesPerSec,
          etaMs,
        });
      });
      xhr.upload.addEventListener('load', () => {
        // Mark transfer complete; server may still be processing.
        onProgress({
          loaded: 1,
          total: 1,
          percent: 100,
          elapsedMs: performance.now() - start,
          bytesPerSec: 0,
          etaMs: 0,
        });
      });
    }

    xhr.addEventListener('load', () => {
      const status = xhr.status;
      let parsed: any = null;
      try { parsed = xhr.responseText ? JSON.parse(xhr.responseText) : null; } catch { /* keep raw */ }
      if (status >= 200 && status < 300) {
        resolve(parsed as T);
      } else {
        const msg = parsed?.message ?? xhr.responseText ?? `HTTP ${status}`;
        reject(new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('abort', () => reject(new DOMException('Upload aborted', 'AbortError')));

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    xhr.send(body);
  });
}

/** Format an ETA in ms to a short human string ("8s", "1m 12s"). */
export function formatEta(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || ms < 0) return '—';
  const sec = Math.ceil(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}m ${rem}s`;
}

/** Format bytes to short human string (KB/MB). */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
