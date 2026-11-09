"use client";
import { useEffect, useState } from "react";

export function useApi<T>(url: string): { data: T | null; notFound: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then(async (r) => {
        if (r.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!r.ok) throw new Error(`${url} failed with status ${r.status}`);
        const json = (await r.json()) as T;
        if (!cancelled) setData(json);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) throw error;
  return { data, notFound };
}