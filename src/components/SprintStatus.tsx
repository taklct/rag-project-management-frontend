import type { FC } from 'react';
import '../css/SprintStatus.css';

type SprintSegment = {
  label: string;
  percentage: number;
  color: string;
};

const segments: SprintSegment[] = [
  { label: 'Done', percentage: 63, color: 'var(--color-success)' },
  { label: 'To-Do', percentage: 25, color: 'var(--color-warning)' },
  { label: 'In Progress', percentage: 12, color: 'var(--color-info)' },
];

const SprintStatus: FC = () => {
  return (
    <section className="panel">
      <header className="panel__header">
        <h2>Sprint Task Status</h2>
      </header>
      <div className="sprint-status">
        <div className="sprint-status__chart" aria-hidden="true">
          <div className="sprint-status__donut">
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
