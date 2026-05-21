'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent
  extends Event {
  prompt: () => Promise<void>;

  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

export function InstallPrompt() {
  const [
    deferredPrompt,
    setDeferredPrompt,
  ] =
    useState<BeforeInstallPromptEvent | null>(
      null
    );

  useEffect(() => {
    const handler = (
      e: Event
    ) => {
      e.preventDefault();

      setDeferredPrompt(
        e as BeforeInstallPromptEvent
      );
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

  const handleInstall = async () => {
    await deferredPrompt.prompt();

    const choiceResult =
      await deferredPrompt.userChoice;

    if (
      choiceResult.outcome ===
      'accepted'
    ) {
      console.log(
        'PWA installation accepted'
      );
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-xl shadow-xl flex items-center justify-between z-50">
      <span className="text-sm font-medium">
        Install Flight App for offline access
      </span>

      <button
        onClick={handleInstall}
        className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm"
      >
        Install
      </button>
    </div>
  );
}