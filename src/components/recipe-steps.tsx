"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { formatDuration } from "@/lib/format";

export type StepForDisplay = {
  id: string;
  sortOrder: number;
  text: string;
  durationMinutes: number | null;
  temperatureC: number | null;
  note: string | null;
  photoFileName: string | null;
};

type Timer = { remaining: number; total: number; done: boolean };

function clock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Hangkártya-berregés, hogy a konyhából is hallható legyen. */
function beep() {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const context = new Ctor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.16;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    // Három rövid jelzés, hogy biztosan feltűnjön.
    setTimeout(() => {
      try {
        oscillator.stop();
        void context.close();
      } catch {
        /* nem gond */
      }
    }, 1200);
  } catch {
    /* hang nélkül is működik */
  }
}

export function RecipeSteps({
  steps,
  big = false,
}: {
  steps: StepForDisplay[];
  /** Sütés közbeni nézet: nagyobb betűk. */
  big?: boolean;
}) {
  const [timers, setTimers] = useState<Record<string, Timer>>({});
  const beepedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((current) => {
        let changed = false;
        const next: Record<string, Timer> = {};

        for (const [id, timer] of Object.entries(current)) {
          if (timer.done || timer.remaining <= 0) {
            next[id] = timer;
            continue;
          }
          next[id] = { ...timer, remaining: timer.remaining - 1 };
          changed = true;
        }

        return changed ? next : current;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // A lejárt időzítőknél egyszer jelzünk.
  useEffect(() => {
    const finished = Object.entries(timers).filter(
      ([id, timer]) => timer.remaining <= 0 && !beepedRef.current.has(id),
    );
    if (finished.length === 0) return;

    for (const [id] of finished) beepedRef.current.add(id);
    beep();
    setTimers((current) => {
      const next = { ...current };
      for (const [id] of finished) {
        next[id] = { ...next[id], done: true };
      }
      return next;
    });
  }, [timers]);

  const start = useCallback((step: StepForDisplay, extraSeconds = 0) => {
    const seconds = (step.durationMinutes ?? 0) * 60 + extraSeconds;
    if (seconds <= 0) return;
    beepedRef.current.delete(step.id);
    setTimers((current) => ({
      ...current,
      [step.id]: { remaining: seconds, total: seconds, done: false },
    }));
  }, []);

  const stop = (stepId: string) => {
    beepedRef.current.delete(stepId);
    setTimers((current) => {
      const next = { ...current };
      delete next[stepId];
      return next;
    });
  };

  return (
    <ol className={big ? "space-y-7" : "space-y-5"}>
      {steps.map((step) => {
        const timer = timers[step.id];

        return (
          <li key={step.id} className="flex gap-3 sm:gap-4">
            <span
              className={`mt-1 grid flex-shrink-0 place-items-center rounded-full border border-forest-300 font-display text-forest-700 ${
                big ? "h-11 w-11 text-lg" : "h-8 w-8 text-sm"
              }`}
            >
              {step.sortOrder + 1}
            </span>

            <div className="min-w-0 flex-1">
              <p className={`prose-recipe ${big ? "text-2xl leading-relaxed" : ""}`}>
                {step.text}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3 print:hidden">
                {step.durationMinutes !== null && (
                  <>
                    {timer ? (
                      <span
                        className={`chip border ${
                          timer.done
                            ? "border-forest-600 bg-forest-600 text-white"
                            : "border-caramel-300 bg-caramel-200/40 text-ink-900"
                        }`}
                      >
                        {timer.done ? "✓ Kész!" : `⏱ ${clock(timer.remaining)}`}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => start(step)}
                        className="chip border border-sage-300 bg-white font-semibold text-forest-700 hover:border-forest-300"
                        title="Visszaszámláló indítása"
                      >
                        ⏱ {formatDuration(step.durationMinutes)} indítása
                      </button>
                    )}

                    {timer && !timer.done && (
                      <>
                        <button
                          type="button"
                          onClick={() => start(step, 60)}
                          className="text-xs font-semibold text-ink-400 hover:text-forest-600"
                        >
                          +1 perc
                        </button>
                        <button
                          type="button"
                          onClick={() => stop(step.id)}
                          className="text-xs font-semibold text-ink-400 hover:text-plum-500"
                        >
                          mégse
                        </button>
                      </>
                    )}

                    {timer?.done && (
                      <button
                        type="button"
                        onClick={() => stop(step.id)}
                        className="text-xs font-semibold text-ink-400 hover:text-forest-600"
                      >
                        visszaállítás
                      </button>
                    )}
                  </>
                )}

                {step.temperatureC !== null && (
                  <span className="text-xs font-semibold text-forest-600 print:text-ink-700">
                    {step.temperatureC} °C
                  </span>
                )}
              </div>

              {step.note && (
                <p
                  className={`mt-1 italic text-ink-400 ${big ? "text-lg" : "text-sm"}`}
                >
                  {step.note}
                </p>
              )}

              {step.photoFileName && (
                <div className="relative mt-3 aspect-[4/3] w-full max-w-xs overflow-hidden rounded-xl border border-sage-200">
                  <Image
                    src={`/api/files/${encodeURIComponent(step.photoFileName)}`}
                    alt="A lépés állapota"
                    fill
                    sizes="320px"
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
