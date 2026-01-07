import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  duration?: number;
  startOnMount?: boolean;
}

export function useCountUp(
  endValue: number,
  options: UseCountUpOptions = {}
) {
  const { duration = 1000, startOnMount = true } = options;
  const [count, setCount] = useState(startOnMount ? 0 : endValue);
  const previousValueRef = useRef(endValue);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startOnMount && previousValueRef.current === endValue) return;

    const startValue = previousValueRef.current === endValue ? 0 : previousValueRef.current;
    previousValueRef.current = endValue;

    if (endValue === 0) {
      setCount(0);
      return;
    }

    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (easeOutExpo)
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      const currentCount = startValue + (endValue - startValue) * easeOutExpo;

      setCount(Math.floor(currentCount));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [endValue, duration, startOnMount]);

  return count;
}

export function useCountUpCurrency(
  endValue: number,
  options: UseCountUpOptions = {}
) {
  const count = useCountUp(endValue, options);
  
  const formatted = count.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  return formatted;
}