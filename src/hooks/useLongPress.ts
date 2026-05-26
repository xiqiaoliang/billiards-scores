import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  delay?: number;
  disabled?: boolean;
}

export function useLongPress(
  onLongPress: () => void,
  { delay = 500, disabled = false }: UseLongPressOptions = {},
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (disabled) return;
    clear();
    timerRef.current = setTimeout(onLongPress, delay);
  }, [clear, delay, disabled, onLongPress]);

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onTouchCancel: clear,
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
  };
}
