"use client";

import { useCallback, useEffect, useState } from "react";

type CacheEntry = {
  data: unknown;
  updatedAt: number;
};

const cache = new Map<string, CacheEntry>();
const pending = new Map<string, Promise<unknown>>();

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(body?.message ?? "Unable to load this page");
  }

  return (await response.json()) as T;
}

function load<T>(url: string): Promise<T> {
  const running = pending.get(url);
  if (running) return running as Promise<T>;

  const request = requestJson<T>(url)
    .then((data) => {
      cache.set(url, { data, updatedAt: Date.now() });
      return data;
    })
    .finally(() => pending.delete(url));

  pending.set(url, request);
  return request;
}

export function preloadCustomerData<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached) return Promise.resolve(cached.data as T);
  return load<T>(url);
}

export function invalidateCustomerData(...urls: string[]) {
  if (urls.length === 0) {
    cache.clear();
    return;
  }
  for (const url of urls) cache.delete(url);
}

export function useCustomerData<T>(
  url: string,
  maxAge = 30_000,
): {
  data: T | undefined;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  retry: () => void;
} {
  const cached = cache.get(url);
  const [data, setData] = useState<T | undefined>(() => cached?.data as T | undefined);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    cache.delete(url);
    setAttempt((value) => value + 1);
  }, [url]);

  useEffect(() => {
    let active = true;
    const current = cache.get(url);
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

    setRefreshing(Boolean(current));
    setError(null);
    void load<T>(url)
      .then((next) => {
        if (active) setData(next);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Unable to load this page");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [attempt, maxAge, url]);

  return { data, loading, refreshing, error, retry };
}
