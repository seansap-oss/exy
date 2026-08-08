import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

export interface BackHandlerOptions {
  /**
   * Ordered escape layers, checked outermost-first. Each returns true if it
   * consumed the press (i.e. it was open and has now been closed).
   */
  layers: Array<() => boolean>;
  /** Pops one step of in-app route history. Returns false at the root view. */
  goBack: () => boolean;
  /** Shown on the first press at the root view. */
  onConfirmExit: (message: string) => void;
}

const EXIT_MESSAGE = 'Press back again to exit EXY';
const EXIT_WINDOW_MS = 2000;

/**
 * Android hardware back-button engine.
 *
 * Press order:
 *   1. Close the topmost open modal / drawer / overlay
 *   2. Pop one step of in-app route history
 *   3. At the root view, require a second press within 2s to exit
 *
 * Also handles the browser's popstate so the gesture behaves identically in
 * the PWA. Registration is idempotent and cleans up on unmount.
 */
export function useAndroidBack({ layers, goBack, onConfirmExit }: BackHandlerOptions): void {
  // Keep the newest callbacks without re-registering the native listener.
  const ref = useRef({ layers, goBack, onConfirmExit });
  useEffect(() => {
    ref.current = { layers, goBack, onConfirmExit };
  }, [layers, goBack, onConfirmExit]);

  useEffect(() => {
    let armed = false;
    let timer: number | null = null;

    const handleBack = () => {
      const { layers: current, goBack: pop, onConfirmExit: confirm } = ref.current;

      // 1 — dismiss the topmost overlay
      for (const close of current) {
        if (close()) return;
      }

      // 2 — walk back through in-app history
      if (pop()) return;

      // 3 — double-press to exit from the root
      if (!armed) {
        armed = true;
        confirm(EXIT_MESSAGE);
        timer = window.setTimeout(() => {
          armed = false;
        }, EXIT_WINDOW_MS);
        return;
      }

      if (timer) window.clearTimeout(timer);
      if (Capacitor.isNativePlatform()) void CapacitorApp.exitApp();
    };

    // Native hardware button
    let remove: (() => void) | null = null;
    if (Capacitor.isNativePlatform()) {
      void CapacitorApp.addListener('backButton', handleBack).then((listener) => {
        remove = () => listener.remove();
      });
    }

    // Browser / PWA gesture parity. A sentinel entry keeps the app from
    // unloading on the first swipe-back.
    const onPopState = () => {
      window.history.pushState({ exyGuard: true }, '');
      handleBack();
    };
    window.history.pushState({ exyGuard: true }, '');
    window.addEventListener('popstate', onPopState);

    return () => {
      if (timer) window.clearTimeout(timer);
      if (remove) remove();
      window.removeEventListener('popstate', onPopState);
    };
  }, []);
}
