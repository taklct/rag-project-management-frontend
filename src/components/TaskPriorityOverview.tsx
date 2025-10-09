import { type FC, useEffect, useMemo, useState } from 'react';
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

type ActiveSegment = {
  priorityLabel: string;
  priorityTotal: number;
  segmentKey: PriorityKey;
  label: string;
  value: number;
  percentage: number;
};

const buildSegmentDetails = (
  priority: PreparedPriority,
  segment: PreparedPriority['segments'][number],
): ActiveSegment => {
  const percentage = priority.total > 0 ? (segment.value / priority.total) * 100 : 0;

  return {
    priorityLabel: priority.label,
    priorityTotal: priority.total,
    segmentKey: segment.key,
    label: segment.label,
    value: segment.value,
    percentage,
  };
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

  const defaultActiveSegment = useMemo<ActiveSegment | null>(() => {
    for (const priority of preparedPriorities) {
      const nonZeroSegment = priority.segments.find((segment) => segment.value > 0);

      if (nonZeroSegment) {
        return buildSegmentDetails(priority, nonZeroSegment);
      }
    }

    const fallbackPriority = preparedPriorities[0];
    const fallbackSegment = fallbackPriority?.segments[0];

    if (fallbackPriority && fallbackSegment) {
      return buildSegmentDetails(fallbackPriority, fallbackSegment);
    }

    return null;
  }, [preparedPriorities]);

  const [activeSegment, setActiveSegment] = useState<ActiveSegment | null>(() => defaultActiveSegment);

  useEffect(() => {
    setActiveSegment((current) => {
      if (!current) {
        return defaultActiveSegment;
      }

      const matchingPriority = preparedPriorities.find((priority) => priority.label === current.priorityLabel);

      if (!matchingPriority) {
        return defaultActiveSegment;
      }

      const matchingSegment = matchingPriority.segments.find((segment) => segment.key === current.segmentKey);

      if (!matchingSegment) {
        return defaultActiveSegment;
      }

      return buildSegmentDetails(matchingPriority, matchingSegment);
    });
  }, [defaultActiveSegment, preparedPriorities]);

  const handleActivateSegment = (priorityLabel: string, segmentKey: PriorityKey) => {
    const priority = preparedPriorities.find((item) => item.label === priorityLabel);

    if (!priority) {
      return;
    }

    const segment = priority.segments.find((item) => item.key === segmentKey);

    if (!segment) {
      return;
    }

    setActiveSegment(buildSegmentDetails(priority, segment));
  };

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
            return (
              <div key={priority.label} className="task-priority-overview__column" aria-label={`${priority.label} priority`}>
                <div className="task-priority-overview__column-bar" aria-hidden={priority.total === 0}>
                  <div className="task-priority-overview__cluster" role="group" aria-label={`${priority.label} priority task statuses`}>
                    {priority.segments.map((segment) => {
                      const heightRatio = segment.value / safeMaxSegmentValue;
                      const srLabel = `${segment.value} ${segment.label} tasks in ${priority.label} priority`;
                      const isActive =
                        activeSegment?.priorityLabel === priority.label && activeSegment.segmentKey === segment.key;
                      const clusterColumnClassName = `task-priority-overview__cluster-column${
                        isActive ? ' task-priority-overview__cluster-column--active' : ''
                      }`;
                      const clusterBarClassName = `task-priority-overview__cluster-bar task-priority-overview__cluster-bar--${segment.key}${
                        isActive ? ' task-priority-overview__cluster-bar--active' : ''
                      }`;

                      return (
                        <button
                          key={segment.key}
                          type="button"
                          className={clusterColumnClassName}
                          onMouseEnter={() => handleActivateSegment(priority.label, segment.key)}
                          onFocus={() => handleActivateSegment(priority.label, segment.key)}
                          onClick={() => handleActivateSegment(priority.label, segment.key)}
                          aria-pressed={isActive}
                          aria-label={`${segment.label} tasks in ${priority.label} priority`}
                        >
                          <span className="visually-hidden">{srLabel}</span>
                          <span className="task-priority-overview__cluster-value" aria-hidden="true">
                            {segment.value}
                          </span>
                          <div className="task-priority-overview__cluster-bar-wrapper">
                            <div
                              className={clusterBarClassName}
                              style={{
                                height: `${Math.max(heightRatio, 0) * 100}%`,
                                backgroundColor: segment.color,
                              }}
                              aria-hidden="true"
                            />
                          </div>
                        </button>
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
      <div className="task-priority-overview__details" aria-live="polite">
        {activeSegment ? (
          <>
            <p className="task-priority-overview__details-heading">{activeSegment.label}</p>
            <p className="task-priority-overview__details-description">
              <span className="task-priority-overview__details-value">{activeSegment.value}</span>
              <span className="task-priority-overview__details-label"> tasks in </span>
              <span className="task-priority-overview__details-priority">{activeSegment.priorityLabel}</span>
            </p>
            <p className="task-priority-overview__details-percentage" aria-label="Percentage of tasks in this status">
              {activeSegment.percentage.toFixed(1)}%
              <span className="task-priority-overview__details-percentage-caption"> of priority workload</span>
            </p>
            <p className="task-priority-overview__details-total">
              Out of <span className="task-priority-overview__details-total-value">{activeSegment.priorityTotal}</span> total
              tasks for this priority
            </p>
          </>
        ) : (
          <p className="task-priority-overview__details-placeholder">Hover or focus a bar to explore task distribution.</p>
        )}
      </div>
    </section>
  );
};

export default TaskPriorityOverview;
