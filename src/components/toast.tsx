"use client";

import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useState } from "react";

type Tone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: Tone };

const ToastCtx = createContext<(message: string, tone?: Tone) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

const ICON: Record<Tone, string> = { success: "💖", error: "🥀", info: "✨" };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: Tone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "error" ? 6000 : 3500);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              role="status"
              className={`glass pointer-events-auto flex items-center gap-3 rounded-full px-5 py-3 text-sm font-medium shadow-[var(--shadow-candy-lg)] ${
                t.tone === "error" ? "text-blush-700" : "text-berry"
              }`}
            >
              <span className="text-base">{ICON[t.tone]}</span>
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
