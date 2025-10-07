import type { FC } from 'react';
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
  return (
    <section className="panel">
      <header className="panel__header">
        <h2>Task Priority Overview</h2>
      </header>
      <div className="task-priority">
        <div className="task-priority__chart" role="img" aria-label="Task priority bar chart">
          {priorities.map((priority) => {
            const total = priority.counts.done + priority.counts.inProgress + priority.counts.todo;
            const hasWork = total > 0;
            const denominator = hasWork ? total : 1;
            const segments = (Object.keys(priority.counts) as PriorityKey[]).map((key) => ({
              key,
              value: priority.counts[key],
              color: segmentColors[key],
            }));

            return (
              <div key={priority.label} className="task-priority__column">
                <div className="task-priority__bars">
                  {segments.map((segment) => (
                    <div
                      key={segment.key}
                      className={`task-priority__bar task-priority__bar--${segment.key}`}
                      style={{
                        height: hasWork ? `${(segment.value / denominator) * 100}%` : '0%',
                        backgroundColor: segment.color,
                      }}
                    >
                      <span className="visually-hidden">
                        {segment.value} {segment.key} tasks
                      </span>
                    </div>
                  ))}
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
