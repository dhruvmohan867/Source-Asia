'use client';

import { useEffect, useState } from 'react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();

      setDeferredPrompt(e);
    };

    window.addEventListener(
      'beforeinstallprompt',
      handler
    );

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handler
      );
    };
  }, []);

  if (!deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-xl shadow-xl flex items-center justify-between z-50">
      <span className="text-sm font-medium">
        Install Flight App for offline access
      </span>

      <button
        onClick={() => {
          deferredPrompt.prompt();

          setDeferredPrompt(null);
        }}
        className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm"
      >
        Install
      </button>
    </div>
  );
}