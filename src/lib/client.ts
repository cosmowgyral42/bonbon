"use client";

import { useCallback, useEffect, useState } from "react";

// Tiny fetch helpers for the local API.
export async function api<T>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? (init?.body ? "POST" : "GET"),
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error || `Request failed (${res.status})`);
  return json as T;
}

export function useData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const next = await api<T>(url);
      setData((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [url]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
    // Claude edits data from outside the browser, so keep every page fresh:
    // refetch when the tab regains focus and every few seconds while visible.
    const onFocus = () => document.visibilityState === "visible" && reload();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    const t = setInterval(onFocus, 4000);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      clearInterval(t);
    };
  }, [reload]);

  return { data, setData, error, reload, loading: data === null && !error };
}

export const fmtDay = (d: Date | string) =>
  new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
export const fmtTime = (d: Date | string) =>
  new Date(d).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
export const fmtDateTime = (d: Date | string) => `${fmtDay(d)} · ${fmtTime(d)}`;

// Local copy if we have it (fast, works offline), otherwise the public URL.
export const imageSrc = (img: { file?: string; url?: string | null }) =>
  img.file ? `/api/media/${encodeURIComponent(img.file)}` : (img.url ?? "");
