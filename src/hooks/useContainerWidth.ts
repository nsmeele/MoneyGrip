import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Measures the width of a container element using ResizeObserver.
 * Returns a ref to attach to the container and the current width in pixels.
 */
export function useContainerWidth<T extends HTMLElement = HTMLDivElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  const updateWidth = useCallback((entries: ResizeObserverEntry[]) => {
    const entry = entries[0];
    if (entry) setWidth(entry.contentRect.width);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    setWidth(el.clientWidth);
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateWidth]);

  return [ref, width];
}
