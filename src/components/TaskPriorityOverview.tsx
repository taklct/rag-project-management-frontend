import type { FC } from 'react';
import './TaskPriorityOverview.css';

type PriorityKey = 'done' | 'inProgress' | 'todo';

type PriorityCounts = Record<PriorityKey, number>;

type Priority = {
  label: string;
  counts: PriorityCounts;
};

const priorities: Priority[] = [
  { label: 'High', counts: { done: 10, inProgress: 6, todo: 2 } },
  { label: 'Medium', counts: { done: 8, inProgress: 9, todo: 4 } },
  { label: 'Low', counts: { done: 6, inProgress: 5, todo: 7 } },
];

const segmentColors: Record<PriorityKey, string> = {
  done: 'var(--color-success)',
  inProgress: 'var(--color-info)',
  todo: 'var(--color-warning)',
};

const TaskPriorityOverview: FC = () => {
  return (
    <section className="panel">
      <header className="panel__header">
        <h2>Task Priority Overview</h2>
      </header>
      <div className="task-priority">
        <div className="task-priority__chart" role="img" aria-label="Task priority bar chart">
          {priorities.map((priority) => {
            const total = priority.counts.done + priority.counts.inProgress + priority.counts.todo;
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
                      style={{ height: `${(segment.value / total) * 100}%`, backgroundColor: segment.color }}
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
