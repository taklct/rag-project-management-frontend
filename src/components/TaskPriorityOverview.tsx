import { type CSSProperties, type FC, useEffect, useMemo, useState } from 'react';
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

export interface TaskPriorityOverviewProps {
  priorities: Priority[];
}

const TaskPriorityOverview: FC<TaskPriorityOverviewProps> = ({ priorities }) => {
  const [isAnimated, setIsAnimated] = useState(false);

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

      return { ...priority, segments };
    });
  }, [priorities]);

  return (
    <section className="panel">
      <header className="panel__header">
        <h2>Task Priority Overview</h2>
      </header>
      <div className="task-priority">
        <div className="task-priority__chart" role="img" aria-label="Task priority bar chart">
          {priorityAnimations.map((priority) => (
            <div key={priority.label} className="task-priority__column">
              <div className="task-priority__bars">
                {priority.segments.map((segment) => (
                  <div
                    key={segment.key}
                    className={`task-priority__bar task-priority__bar--${segment.key} ${isAnimated ? 'is-animated' : ''}`}
                    style={segment.style}
                  >
                    <span className="visually-hidden">
                      {segment.value} {segment.key} tasks
                    </span>
                  </div>
                ))}
              </div>
              <p className="task-priority__label">{priority.label}</p>
            </div>
          ))}
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
