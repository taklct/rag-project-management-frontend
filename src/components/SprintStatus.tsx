import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import '../css/SprintStatus.css';

export type SprintSegment = {
  label: string;
  percentage: number;
  color: string;
  count?: number | null;
};

export interface SprintStatusProps {
  segments: SprintSegment[];
}

type EnhancedSegment = SprintSegment & {
  value: number;
  ratio: number;
  dashLength: number;
  dashOffset: number;
  displayValue: number;
  displayCount: number | null;
};

const RADIUS = 68;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const SprintStatus: FC<SprintStatusProps> = ({ segments }) => {
  const [isAnimated, setIsAnimated] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    setIsAnimated(false);
    const frame = requestAnimationFrame(() => {
      setIsAnimated(true);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [segments]);

  const enhancedSegments = useMemo(() => {
    const safeSegments = segments.map((segment) => {
      const safeValue = Number.isFinite(segment.percentage)
        ? Math.max(segment.percentage, 0)
        : 0;
      const rawCount = typeof segment.count === 'number' && Number.isFinite(segment.count)
        ? Math.max(Math.round(segment.count), 0)
        : null;

      return {
        ...segment,
        value: safeValue,
        displayValue: Math.round(safeValue),
        displayCount: rawCount,
      } satisfies Omit<EnhancedSegment, 'ratio' | 'dashLength' | 'dashOffset'>;
    });

    const total = safeSegments.reduce((sum, segment) => sum + segment.value, 0);

    if (total <= 0) {
      return [
        {
          label: 'No Data',
          color: 'var(--color-info)',
          percentage: 0,
          value: 1,
          ratio: 1,
          dashLength: CIRCUMFERENCE,
          dashOffset: 0,
          displayValue: 0,
          displayCount: null,
        },
      ] satisfies EnhancedSegment[];
    }

    let cumulativeRatio = 0;

    return safeSegments.map((segment) => {
      const ratio = segment.value / total;
      const dashLength = ratio * CIRCUMFERENCE;
      const dashOffset = cumulativeRatio * CIRCUMFERENCE;
      cumulativeRatio += ratio;

      return {
        ...segment,
        ratio,
        dashLength,
        dashOffset,
        displayCount: segment.displayCount ?? null,
      } satisfies EnhancedSegment;
    });
  }, [segments]);

  const defaultIndex = useMemo(() => {
    if (enhancedSegments.length === 0) {
      return null;
    }

    let index = 0;
    let maxValue = enhancedSegments[0]?.value ?? 0;

    enhancedSegments.forEach((segment, currentIndex) => {
      if (segment.value > maxValue) {
        maxValue = segment.value;
        index = currentIndex;
      }
    });

    return index;
  }, [enhancedSegments]);

  const activeIndex = hoveredIndex ?? defaultIndex;
  const activeSegment =
    activeIndex !== null && activeIndex !== undefined
      ? enhancedSegments[activeIndex]
      : undefined;

  const handleHover = useCallback((index: number | null) => {
    setHoveredIndex(index);
  }, []);

  return (
    <section className="panel">
      <header className="panel__header">
        <h2>Sprint Task Status</h2>
      </header>
      <div className="sprint-status">
        <div
          className="sprint-status__chart"
          aria-hidden={enhancedSegments.length === 0}
          onMouseLeave={() => handleHover(null)}
        >
          <svg
            className="sprint-status__svg"
            viewBox="0 0 160 160"
            role="img"
            aria-hidden
          >
            <g transform="translate(80 80) rotate(-90)">
              {enhancedSegments.map((segment, index) => {
                const isHovered = index === activeIndex && hoveredIndex !== null;

                return (
                  <circle
                    key={segment.label}
                    className={`sprint-status__segment ${
                      isAnimated ? 'is-animated' : ''
                    } ${isHovered ? 'is-hovered' : ''}`.trim()}
                    r={RADIUS}
                    fill="transparent"
                    stroke={segment.color}
                    strokeWidth={20}
                    strokeDasharray={`${isAnimated ? segment.dashLength : 0} ${CIRCUMFERENCE}`}
                    strokeDashoffset={-segment.dashOffset}
                    strokeLinecap="round"
                    role="presentation"
                    onMouseEnter={() => handleHover(index)}
                  />
                );
              })}
            </g>
          </svg>
          <div className="sprint-status__center" aria-hidden={activeSegment === undefined}>
            {activeSegment ? (
              <>
                <span className="sprint-status__center-value">{activeSegment.displayValue}%</span>
                {activeSegment.displayCount !== null ? (
                  <span className="sprint-status__center-count">
                    {activeSegment.displayCount} task{activeSegment.displayCount === 1 ? '' : 's'}
                  </span>
                ) : null}
                <span className="sprint-status__center-label">{activeSegment.label}</span>
              </>
            ) : (
              <span className="sprint-status__center-label">No sprint data</span>
            )}
          </div>
        </div>
        <ul className="sprint-status__legend">
          {enhancedSegments.map((segment, index) => (
            <li key={segment.label}>
              <button
                type="button"
                className={`sprint-status__legend-item ${
                  activeIndex === index ? 'is-active' : ''
                }`}
                onMouseEnter={() => handleHover(index)}
                onMouseLeave={() => handleHover(null)}
                onFocus={() => handleHover(index)}
                onBlur={() => handleHover(null)}
              >
                <span className="legend-dot" style={{ backgroundColor: segment.color }} />
                <div>
                  <p className="legend-label">{segment.label}</p>
                  <p className="legend-value">
                    <span>{segment.displayValue}%</span>
                    {segment.displayCount !== null ? (
                      <span className="legend-count">
                        {segment.displayCount} task{segment.displayCount === 1 ? '' : 's'}
                      </span>
                    ) : null}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default SprintStatus;
