"use client";

import { useCallback, useEffect, useState } from "react";

type CacheEntry = {
  data: unknown;
  updatedAt: number;
};

const cache = new Map<string, CacheEntry>();
const pending = new Map<string, Promise<unknown>>();

async function requestAdminPageData<T>(key: string): Promise<T> {
  const response = await fetch(`/api/admin/page-data?${key}`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  const body = (await response.json().catch(() => null)) as
    | { data?: T; message?: string }
    | null;
  if (!response.ok || body?.data === undefined) {
    throw new Error(body?.message ?? "Unable to load this page");
  }
  return body.data;
}

export function preloadAdminPageData<T>(key: string): Promise<T> {
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached.data as T);
  return loadAdminPageData<T>(key);
}

function loadAdminPageData<T>(key: string): Promise<T> {
  const running = pending.get(key);
  if (running) return running as Promise<T>;

  const request = requestAdminPageData<T>(key)
    .then((data) => {
      cache.set(key, { data, updatedAt: Date.now() });
      return data;
    })
    .finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}

export function invalidateAdminPageData(...keys: string[]) {
  if (keys.length === 0) {
    cache.clear();
    return;
  }
  for (const key of keys) cache.delete(key);
}

export function useAdminPageData<T>(key: string, maxAge = 30_000) {
  const cached = cache.get(key);
  const [data, setData] = useState<T | undefined>(
    () => cached?.data as T | undefined,
  );
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    cache.delete(key);
    setAttempt((value) => value + 1);
  }, [key]);

  useEffect(() => {
    let active = true;
    const current = cache.get(key);
    const fresh = current && Date.now() - current.updatedAt < maxAge;
    if (current) {
      setData(current.data as T);
      setLoading(false);
    } else {
      setLoading(true);
    }
    if (fresh) return () => {
      active = false;
    };

    setError(null);
    void loadAdminPageData<T>(key)
      .then((next) => {
        if (active) setData(next);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Unable to load this page");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt, key, maxAge]);

  return { data, loading, error, retry };
}
