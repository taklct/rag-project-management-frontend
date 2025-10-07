import { type CSSProperties, type FC, useEffect, useMemo, useState } from 'react';
import '../css/SprintStatus.css';

export type SprintSegment = {
  label: string;
  percentage: number;
  color: string;
};

export interface SprintStatusProps {
  segments: SprintSegment[];
}

const SprintStatus: FC<SprintStatusProps> = ({ segments }) => {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    setIsAnimated(false);
    const frame = requestAnimationFrame(() => {
      setIsAnimated(true);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [segments]);

  const donutStyle = useMemo(() => {
    if (segments.length === 0) {
      return {
        backgroundImage: 'conic-gradient(var(--color-info) 0deg 360deg)',
      } satisfies CSSProperties;
    }

    const total = segments.reduce((sum, segment) => sum + Math.max(segment.percentage, 0), 0);
    const denominator = total > 0 ? total : 1;

    let cumulative = 0;
    const style: (CSSProperties & Record<string, string | number>) = {};
    const stops: string[] = [];

    segments.forEach((segment, index) => {
      const safeValue = Math.max(segment.percentage, 0);
      const share = (safeValue / denominator) * 360;
      const start = cumulative;
      cumulative += share;
      style[`--segment-${index}-start` as string] = `${start}deg`;
      style[`--segment-${index}-end` as string] = `${cumulative}deg`;
      style[`--segment-${index}-color` as string] = segment.color;
      stops.push(`var(--segment-${index}-color) calc(var(--segment-${index}-start) * var(--progress)) calc(var(--segment-${index}-end) * var(--progress))`);
    });

    style.backgroundImage = `conic-gradient(${stops.join(', ')})`;
    return style;
  }, [segments]);

  return (
    <section className="panel">
      <header className="panel__header">
        <h2>Sprint Task Status</h2>
      </header>
      <div className="sprint-status">
        <div className="sprint-status__chart" aria-hidden="true">
          <div
            className={`sprint-status__donut ${isAnimated ? 'is-animated' : ''}`}
            style={donutStyle}
          >
            <div className="sprint-status__donut-hole" />
          </div>
        </div>
        <ul className="sprint-status__legend">
          {segments.map((segment) => (
            <li key={segment.label}>
              <span className="legend-dot" style={{ backgroundColor: segment.color }} />
              <div>
                <p className="legend-label">{segment.label}</p>
                <p className="legend-value">{segment.percentage}%</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default SprintStatus;
