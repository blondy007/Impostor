import React, { useLayoutEffect, useRef, useState } from 'react';

interface Props {
  text: string;
  className?: string;
  minSizePx?: number;
  maxSizePx?: number;
}

const FitSingleLineText: React.FC<Props> = ({ text, className = '', minSizePx = 10, maxSizePx = 48 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(maxSizePx);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const fit = () => {
      const width = container.clientWidth;
      if (width <= 0) return;

      let low = minSizePx;
      let high = maxSizePx;
      let best = minSizePx;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        textEl.style.fontSize = `${mid}px`;

        if (textEl.scrollWidth <= width) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      setFontSize(best);
    };

    const frame = requestAnimationFrame(fit);
    const observer = new ResizeObserver(() => fit());
    observer.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [text, minSizePx, maxSizePx]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden flex justify-center">
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap leading-[1.05] ${className}`}
        style={{ fontSize: `${fontSize}px` }}
      >
        {text}
      </span>
    </div>
  );
};

export default FitSingleLineText;
