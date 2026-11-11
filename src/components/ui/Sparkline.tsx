import { motion } from 'motion/react';
import { useId } from 'react';
import { duration, easing, useShouldReduceMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface SparklineProps {
  /** Values in order; at least two. */
  values: number[];
  /** Series color (2.1.1 chart order): `primary` or `tertiary`. */
  tone?: 'primary' | 'tertiary';
  className?: string;
}

const STROKE = { primary: 'var(--md-sys-color-primary)', tertiary: 'var(--md-sys-color-tertiary)' };

/**
 * Mini trend line of a KPI (2.2.1, pattern 3). Decorative: the value and its change
 * are always written next to it. Flat area fill at 12 %, never a gradient (2.2).
 */
export function Sparkline({ values, tone = 'primary', className }: SparklineProps) {
  const reduce = useShouldReduceMotion();
  const clipId = useId();
  if (values.length < 2) return null;

  const width = 96;
  const height = 32;
  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points: [number, number][] = values.map((v, i) => [
    pad + (i / (values.length - 1)) * (width - pad * 2),
    height - pad - ((v - min) / range) * (height - pad * 2),
  ]);
  // Smooth curve through the points (cardinal spline converted to cubic Béziers).
  const path = points.reduce((d, [x, y], i, all) => {
    if (i === 0) return `M${x},${y}`;
    const [x0, y0] = all[i - 1]!;
    const [xPrev, yPrev] = all[i - 2] ?? all[i - 1]!;
    const [xNext, yNext] = all[i + 1] ?? [x, y];
    const c1x = x0 + (x - xPrev) / 6;
    const c1y = y0 + (y - yPrev) / 6;
    const c2x = x - (xNext - x0) / 6;
    const c2y = y - (yNext - y0) / 6;
    return `${d} C${c1x},${c1y} ${c2x},${c2y} ${x},${y}`;
  }, '');
  const [lastX, lastY] = points.at(-1)!;
  const area = `${path} L${lastX},${height} L${points[0]![0]},${height} Z`;
  const color = STROKE[tone];

  return (
    // Stretched charts (previews) keep a round end dot and an even 2 px line (D-92).
    <span aria-hidden className={cn('relative block h-8 w-24 shrink-0', className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="block size-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <clipPath id={clipId}>
            <motion.rect
              x="0"
              y="-4"
              height={height + 8}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: width + 8 }}
              transition={{ duration: reduce ? 0 : duration.long * 2, ease: easing.emphasizedDecelerate }}
            />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <path d={area} fill={color} fillOpacity={0.12} />
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </svg>
      <motion.span
        className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-surface-container-lowest"
        style={{ left: `${(lastX / width) * 100}%`, top: `${(lastY / height) * 100}%`, borderColor: color }}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: duration.short, delay: reduce ? 0 : duration.long * 2 }}
      />
    </span>
  );
}
