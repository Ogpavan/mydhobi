"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const NAVIGATION_START_EVENT = "mydhobi:navigation-start";

export function startNavigationProgress() {
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/customer")
  ) {
    window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
  }
}

export function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const currentUrl = `${pathname}?${searchParams.toString()}`;
  const previousUrl = useRef(currentUrl);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    intervalRef.current = null;
    hideTimerRef.current = null;
    safetyTimerRef.current = null;
  }, []);

  const finish = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    intervalRef.current = null;
    safetyTimerRef.current = null;
    setProgress(100);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 240);
  }, []);

  const start = useCallback(() => {
    clearTimers();
    setVisible(true);
    setProgress(12);

    intervalRef.current = setInterval(() => {
      setProgress((value) => {
        if (value >= 90) return value;
        return Math.min(90, value + Math.max(1, (90 - value) * 0.12));
      });
    }, 180);

    safetyTimerRef.current = setTimeout(finish, 10000);
  }, [clearTimers, finish]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      const changesRoute =
        destination.pathname !== current.pathname ||
        destination.search !== current.search;

      if (destination.origin === current.origin && changesRoute) start();
    };

    const handleStart = () => start();
    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handleStart);
    window.addEventListener(NAVIGATION_START_EVENT, handleStart);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handleStart);
      window.removeEventListener(NAVIGATION_START_EVENT, handleStart);
      clearTimers();
    };
  }, [clearTimers, start]);

  useEffect(() => {
    if (previousUrl.current !== currentUrl) {
      previousUrl.current = currentUrl;
      finish();
    }
  }, [currentUrl, finish]);

  if (pathname.startsWith("/customer")) return null;

  return (
    <div
      className="navigation-loader"
      data-visible={visible}
      role="progressbar"
      aria-label="Loading page"
      aria-hidden={!visible}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <div
        className="navigation-loader__bar"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}
