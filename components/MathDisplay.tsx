
import React, { useEffect, useRef } from 'react';

// We'll use the window.katex global since we added it in index.html
declare global {
  interface Window {
    katex: any;
  }
}

interface MathDisplayProps {
  math: string;
  block?: boolean;
  className?: string;
}

const MathDisplay: React.FC<MathDisplayProps> = ({ math, block = false, className = "" }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current && window.katex) {
      // Clean the math string from $ delimiters if they exist
      const cleanMath = math.replace(/^\$+/, '').replace(/\$+$/, '');
      try {
        window.katex.render(cleanMath, containerRef.current, {
          throwOnError: false,
          displayMode: block
        });
      } catch (e) {
        containerRef.current.textContent = math;
      }
    }
  }, [math, block]);

  return (
    <span ref={containerRef} className={`inline-block ${className}`} />
  );
};

export default MathDisplay;
