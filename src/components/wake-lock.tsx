"use client";

import { useEffect, useRef, useState } from "react";

type WakeLockSentinel = {
  release: () => Promise<void>;
  addEventListener: (type: string, listener: () => void) => void;
};

/**
 * „Képernyő ébren tartása” – sütés közben kényelmes, hogy ne aludjon el
 * a telefon. Csak biztonságos környezetben elérhető (localhost vagy HTTPS),
 * ezért ha nem támogatott, egyszerűen nem jelenik meg.
 */
export function WakeLockButton() {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && "wakeLock" in navigator);
    return () => {
      void sentinelRef.current?.release().catch(() => undefined);
    };
  }, []);

  if (!supported) return null;

  const toggle = async () => {
    if (active) {
      await sentinelRef.current?.release().catch(() => undefined);
      sentinelRef.current = null;
      setActive(false);
      return;
    }

    try {
      const navigatorWithLock = navigator as Navigator & {
        wakeLock: { request: (type: "screen") => Promise<WakeLockSentinel> };
      };
      const sentinel = await navigatorWithLock.wakeLock.request("screen");
      sentinelRef.current = sentinel;
      sentinel.addEventListener("release", () => setActive(false));
      setActive(true);
    } catch {
      setSupported(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center gap-1 px-3 py-2 rounded-lg ${
        active
          ? "bg-forest-600 text-white shadow-md"
          : "bg-white text-forest-700 border border-forest-200 hover:border-forest-300"
      }`}
      title="A képernyő nem alszik el, amíg a recept nyitva van"
    >
      <span className="text-lg">{active ? "✓" : "⏻"}</span>
      <span className="hidden sm:inline">
        {active ? "Képernyő ébren" : "Ébren tartás"}
      </span>
    </button>
  );
}
