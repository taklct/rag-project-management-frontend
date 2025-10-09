import { type FC, useMemo } from 'react';
import '../css/TaskPriorityOverview.css';

export type PriorityKey = 'done' | 'inProgress' | 'todo';

export type PriorityCounts = Record<PriorityKey, number>;

export type Priority = {
  label: string;
  counts: PriorityCounts;
};

const chartSegments: Array<{ key: PriorityKey; label: string; color: string }> = [
  { key: 'todo', label: 'To-Do', color: '#FCCA77' },
  { key: 'inProgress', label: 'In Progress', color: '#4A80FF' },
  { key: 'done', label: 'Done', color: '#98D8AA' },
];

const legendSegments: Array<{ key: PriorityKey; label: string; color: string }> = [
  { key: 'done', label: 'Done', color: '#98D8AA' },
  { key: 'inProgress', label: 'In Progress', color: '#4A80FF' },
  { key: 'todo', label: 'To-Do', color: '#FCCA77' },
];

export interface TaskPriorityOverviewProps {
  priorities: Priority[];
}

type PreparedPriority = {
  label: string;
  total: number;
  segments: Array<{
    key: PriorityKey;
    value: number;
    ratio: number;
    color: string;
    label: string;
  }>;
};

const TaskPriorityOverview: FC<TaskPriorityOverviewProps> = ({ priorities }) => {
  const preparedPriorities = useMemo<PreparedPriority[]>(() => {
    return priorities.map((priority) => {
      const total = Math.max(0, priority.counts.done + priority.counts.inProgress + priority.counts.todo);

      const segments = chartSegments.map(({ key, label, color }) => {
        const value = Math.max(0, priority.counts[key]);
        const ratio = total > 0 ? value / total : 0;

        return { key, value, ratio, color, label };
      });

      return { label: priority.label, total, segments };
    });
  }, [priorities]);

  const maxTotal = useMemo(() => {
    return preparedPriorities.reduce((max, priority) => (priority.total > max ? priority.total : max), 0);
  }, [preparedPriorities]);

  const safeMaxTotal = maxTotal > 0 ? maxTotal : 1;

  return (
    <section className="panel task-priority-overview">
      <header className="task-priority-overview__header">
        <h2>Task Priority Overview</h2>
        <div className="task-priority-overview__legend" aria-label="Task status legend">
          {legendSegments.map((segment) => (
            <div key={segment.key} className="task-priority-overview__legend-item">
              <span className="legend-dot" style={{ backgroundColor: segment.color }} />
              <span>{segment.label}</span>
            </div>
          ))}
        </div>
      </header>
      {preparedPriorities.length > 0 ? (
        <div
          className="task-priority-overview__chart"
          role="img"
          aria-label="Stacked column chart showing tasks by priority and status"
        >
          {preparedPriorities.map((priority) => {
            const columnHeight = priority.total / safeMaxTotal;
            const totalLabel = priority.total === 1 ? 'task' : 'tasks';

            return (
              <div key={priority.label} className="task-priority-overview__column" aria-label={`${priority.label} priority`}>
                <span className="task-priority-overview__column-total">
                  {priority.total}
                  <span className="task-priority-overview__column-total-suffix"> {totalLabel}</span>
                </span>
                <div className="task-priority-overview__column-bar" aria-hidden={priority.total === 0}>
                  <div
                    className="task-priority-overview__stack"
                    style={{ height: `${Math.max(columnHeight, 0) * 100}%` }}
                  >
                    {priority.segments.map((segment) => (
                      <div
                        key={segment.key}
                        className={`task-priority-overview__segment task-priority-overview__segment--${segment.key}`}
                        style={{
                          backgroundColor: segment.color,
                          flexBasis: `${segment.ratio * 100}%`,
                        }}
                        aria-hidden={segment.value === 0}
                      >
                        <span className="visually-hidden">
                          {segment.value} {segment.label} tasks in {priority.label} priority
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="task-priority-overview__label">{priority.label}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="panel__empty">No priority data available.</p>
      )}
    </section>
  );
};

export default TaskPriorityOverview;
