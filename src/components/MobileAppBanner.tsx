import { useEffect, useState } from 'react';
import { X, Smartphone, Download, Apple } from 'lucide-react';

type Platform = 'android' | 'ios' | null;
const STORAGE_KEY = 'ayo_mobile_banner_dismissed_v1';

const APK_URL = '/downloads/afyo-latest.apk';
const APP_STORE_URL: string | null = null;

function detectMobilePlatform(): Platform {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  return null;
}

const MobileAppBanner = () => {
  const [platform, setPlatform] = useState<Platform>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const p = detectMobilePlatform();
    if (!p) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    setPlatform(p);
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  };

  if (!open || !platform) return null;

  const androidReady = false;
  const iosReady = APP_STORE_URL !== null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={dismiss}
      />
      <div
        role="dialog"
        aria-label="Get the AfYO mobile app"
        className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-3xl shadow-2xl pb-[env(safe-area-inset-bottom)] animate-in slide-in-from-bottom duration-300"
      >
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full p-2 text-gray-400 hover:bg-gray-100"
        >
          <X size={18} />
        </button>

        <div className="px-6 pb-6 pt-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pan-blue-500 to-pan-blue-700">
              <Smartphone className="text-white" size={26} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Get the AfYO mobile app</h3>
              <p className="mt-1 text-sm text-gray-600">
                Faster charts, offline reports, and push alerts on your phone.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {platform === 'android' ? (
              androidReady ? (
                <a
                  href={APK_URL}
                  className="flex items-center justify-center gap-2 rounded-xl bg-pan-blue-600 py-3 font-semibold text-white hover:bg-pan-blue-700"
                >
                  <Download size={18} />
                  Download APK
                </a>
              ) : (
                <button
                  disabled
                  className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-semibold text-gray-500"
                >
                  <Download size={18} />
                  Android app coming soon
                </button>
              )
            ) : iosReady && APP_STORE_URL ? (
              <a
                href={APP_STORE_URL}
                className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 font-semibold text-white hover:bg-gray-800"
              >
                <Apple size={18} />
                Open in App Store
              </a>
            ) : (
              <button
                disabled
                className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-semibold text-gray-500"
              >
                <Apple size={18} />
                iOS app coming soon
              </button>
            )}

            <button
              onClick={dismiss}
              className="w-full rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Continue in browser
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-gray-400">
            We'll remember your choice on this device.
          </p>
        </div>
      </div>
    </>
  );
};

export default MobileAppBanner;
