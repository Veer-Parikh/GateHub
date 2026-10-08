import { useEffect, useRef } from "react";

/**
 * Calls `onNew` for items whose key wasn't present on previous renders. The first render only
 * records what's already there, so existing data never triggers notifications. Encode state
 * in the key (e.g. `${id}:${status}`) to be notified about transitions.
 */
export function useNewItems<T>(items: T[], getKey: (item: T) => string, onNew: (item: T) => void, enabled = true) {
  const seen = useRef<Set<string> | null>(null);
  const onNewRef = useRef(onNew);
  onNewRef.current = onNew;

  useEffect(() => {
    if (!enabled) return;
    if (seen.current === null) {
      seen.current = new Set(items.map(getKey));
      return;
    }
    for (const item of items) {
      const key = getKey(item);
      if (!seen.current.has(key)) {
        seen.current.add(key);
        onNewRef.current(item);
      }
    }
  });
}
