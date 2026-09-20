import { useEffect, useRef, useState } from 'react';

// Animates 0 -> target once `start` flips true (e.g. once a stat section has
// scrolled into view), and stays put if `start` flips again. Re-arms itself
// if `target` changes after that first run while it's still 0 (the common
// case: `start` becomes true before the network fetch for `target` lands).
export function useCountUp(target: number, start: boolean, durationMs = 1400) {
  const [value, setValue] = useState(0);
  const ranForTarget = useRef<number | null>(null);

  useEffect(() => {
    if (!start || target <= 0 || ranForTarget.current === target) return;
    ranForTarget.current = target;

    const startTime = Date.now();
    let frame: number;
    const tick = () => {
      const progress = Math.min((Date.now() - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, target, durationMs]);

  return value;
}
