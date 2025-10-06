const TaskPriorityOverview = () => {
  const priorities = [
    { label: 'High', counts: { done: 10, inProgress: 6, todo: 2 } },
    { label: 'Medium', counts: { done: 8, inProgress: 9, todo: 4 } },
    { label: 'Low', counts: { done: 6, inProgress: 5, todo: 7 } },
  ];

  return (
    <section className="panel">
      <header className="panel__header">
        <h2>Task Priority Overview</h2>
      </header>
      <div className="task-priority">
        <div className="task-priority__chart" role="img" aria-label="Task priority bar chart">
          {priorities.map((priority) => {
            const total = priority.counts.done + priority.counts.inProgress + priority.counts.todo;
            const segments = [
              { key: 'done', value: priority.counts.done, color: 'var(--color-success)' },
              { key: 'inProgress', value: priority.counts.inProgress, color: 'var(--color-info)' },
              { key: 'todo', value: priority.counts.todo, color: 'var(--color-warning)' },
            ];

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
            <span className="legend-dot" style={{ backgroundColor: 'var(--color-success)' }} /> Done
          </p>
          <p>
            <span className="legend-dot" style={{ backgroundColor: 'var(--color-info)' }} /> In Progress
          </p>
          <p>
            <span className="legend-dot" style={{ backgroundColor: 'var(--color-warning)' }} /> To-Do
          </p>
        </div>
      </div>
    </section>
  );
};

export default TaskPriorityOverview;
