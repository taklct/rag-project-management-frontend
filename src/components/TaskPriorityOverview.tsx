import {
  type CSSProperties,
  type FC,
  type FocusEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import '../css/TaskPriorityOverview.css';

export type PriorityKey = 'done' | 'inProgress' | 'todo';

export type PriorityCounts = Record<PriorityKey, number>;

export type Priority = {
  label: string;
  counts: PriorityCounts;
};

const segmentColors: Record<PriorityKey, string> = {
  done: 'var(--color-success)',
  inProgress: 'var(--color-info)',
  todo: 'var(--color-warning)',
};

const segmentLabels: Record<PriorityKey, string> = {
  done: 'Done',
  inProgress: 'In Progress',
  todo: 'To-Do',
};

export interface TaskPriorityOverviewProps {
  priorities: Priority[];
}

const TaskPriorityOverview: FC<TaskPriorityOverviewProps> = ({ priorities }) => {
  const [isAnimated, setIsAnimated] = useState(false);
  const [hoveredTarget, setHoveredTarget] = useState<{
    label: string;
    key: PriorityKey | 'all';
  } | null>(null);

  useEffect(() => {
    setIsAnimated(false);
    const frame = requestAnimationFrame(() => {
      setIsAnimated(true);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [priorities]);

  const priorityAnimations = useMemo(() => {
    return priorities.map((priority, columnIndex) => {
      const total = priority.counts.done + priority.counts.inProgress + priority.counts.todo;
      const hasWork = total > 0;
      const denominator = hasWork ? total : 1;
      const segments = (Object.keys(priority.counts) as PriorityKey[]).map((key, index) => {
        const rawValue = priority.counts[key];
        const ratio = hasWork ? Math.max(rawValue / denominator, 0) : 0;
        const segmentStyle: CSSProperties & Record<string, string | number> = {
          ['--bar-fill' as string]: ratio,
          ['--bar-delay' as string]: `${columnIndex * 0.1 + index * 0.05}s`,
          backgroundColor: segmentColors[key],
        };

        return { key, value: rawValue, style: segmentStyle };
      });

      return { ...priority, segments, total };
    });
  }, [priorities]);

  const handleColumnEnter = useCallback((label: string) => {
    setHoveredTarget({ label, key: 'all' });
  }, []);

  const handleColumnLeave = useCallback(() => {
    setHoveredTarget(null);
  }, []);

  const handleBarEnter = useCallback((label: string, key: PriorityKey) => {
    setHoveredTarget({ label, key });
  }, []);

  const handleColumnBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
        return;
      }

      handleColumnLeave();
    },
    [handleColumnLeave],
  );

  return (
    <section className="panel">
      <header className="panel__header">
        <h2>Task Priority Overview</h2>
      </header>
      <div className="task-priority">
        <div className="task-priority__chart" role="img" aria-label="Task priority bar chart">
          {priorityAnimations.map((priority) => {
            const isColumnActive = hoveredTarget?.label === priority.label;
            const activeSegment =
              isColumnActive && hoveredTarget?.key !== 'all'
                ? priority.segments.find((segment) => segment.key === hoveredTarget.key)
                : undefined;

            const displayValue = activeSegment?.value ?? priority.total;
            const displayLabel = activeSegment
              ? segmentLabels[activeSegment.key]
              : 'Total Tasks';

            return (
              <div
                key={priority.label}
                className={`task-priority__column ${isColumnActive ? 'is-hovered' : ''}`}
                onMouseEnter={() => handleColumnEnter(priority.label)}
                onMouseLeave={handleColumnLeave}
                onFocus={() => handleColumnEnter(priority.label)}
                onBlur={handleColumnBlur}
                tabIndex={0}
                role="group"
                aria-label={`${priority.label} priority tasks`}
              >
                <div className={`task-priority__tooltip ${isColumnActive ? 'is-visible' : ''}`}>
                  <span className="task-priority__tooltip-value">{displayValue}</span>
                  <span className="task-priority__tooltip-label">{displayLabel}</span>
                </div>
                <div className="task-priority__bars">
                  {priority.segments.map((segment) => {
                    const isActive =
                      isColumnActive && hoveredTarget?.key === segment.key;

                    return (
                      <div
                        key={segment.key}
                        className={`task-priority__bar task-priority__bar--${segment.key} ${
                          isAnimated ? 'is-animated' : ''
                        } ${isActive ? 'is-active' : ''}`.trim()}
                        style={segment.style}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isActive}
                        aria-label={`${segmentLabels[segment.key]} tasks: ${segment.value}`}
                        onMouseEnter={() => handleBarEnter(priority.label, segment.key)}
                        onMouseLeave={() => handleColumnEnter(priority.label)}
                        onFocus={() => handleBarEnter(priority.label, segment.key)}
                        onBlur={() => handleColumnEnter(priority.label)}
                      >
                        <span className="visually-hidden">
                          {segment.value} {segment.key} tasks
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="task-priority__label">{priority.label}</p>
              </div>
            );
          })}
        </div>
        <div className="task-priority__legend">
          <p>
            <span className="legend-dot" style={{ backgroundColor: segmentColors.done }} /> Done
          </p>
          <p>
            <span className="legend-dot" style={{ backgroundColor: segmentColors.inProgress }} /> In Progress
          </p>
          <p>
            <span className="legend-dot" style={{ backgroundColor: segmentColors.todo }} /> To-Do
          </p>
        </div>
      </div>
    </section>
  );
};

export default TaskPriorityOverview;
