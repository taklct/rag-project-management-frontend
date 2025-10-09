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

        return { key, value, color, label };
      });

      return { label: priority.label, total, segments };
    });
  }, [priorities]);

  const maxSegmentValue = useMemo(() => {
    return preparedPriorities.reduce((maxValue, priority) => {
      const priorityMax = priority.segments.reduce(
        (segmentMax, segment) => (segment.value > segmentMax ? segment.value : segmentMax),
        0,
      );

      return priorityMax > maxValue ? priorityMax : maxValue;
    }, 0);
  }, [preparedPriorities]);

  const safeMaxSegmentValue = maxSegmentValue > 0 ? maxSegmentValue : 1;

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
          aria-label="Clustered column chart showing tasks by priority and status"
        >
          {preparedPriorities.map((priority) => {
            const totalLabel = priority.total === 1 ? 'task' : 'tasks';

            return (
              <div key={priority.label} className="task-priority-overview__column" aria-label={`${priority.label} priority`}>
                <span className="task-priority-overview__column-total">
                  {priority.total}
                  <span className="task-priority-overview__column-total-suffix"> {totalLabel}</span>
                </span>
                <div className="task-priority-overview__column-bar" aria-hidden={priority.total === 0}>
                  <div className="task-priority-overview__cluster" role="group" aria-label={`${priority.label} priority task statuses`}>
                    {priority.segments.map((segment) => {
                      const heightRatio = segment.value / safeMaxSegmentValue;
                      const srLabel = `${segment.value} ${segment.label} tasks in ${priority.label} priority`;

                      return (
                        <div key={segment.key} className="task-priority-overview__cluster-column">
                          <span className="visually-hidden">{srLabel}</span>
                          <span className="task-priority-overview__cluster-value" aria-hidden="true">
                            {segment.value}
                          </span>
                          <div className="task-priority-overview__cluster-bar-wrapper">
                            <div
                              className={`task-priority-overview__cluster-bar task-priority-overview__cluster-bar--${segment.key}`}
                              style={{
                                height: `${Math.max(heightRatio, 0) * 100}%`,
                                backgroundColor: segment.color,
                              }}
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      );
                    })}
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
