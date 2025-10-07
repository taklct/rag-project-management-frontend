import type { FC } from 'react';
import '../css/DashboardHeader.css';

export interface DashboardHeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
  projects: string[];
  selectedProject: string;
  onProjectChange: (project: string) => void;
}

const DashboardHeader: FC<DashboardHeaderProps> = ({
  onRefresh,
  isRefreshing = false,
  projects,
  selectedProject,
  onProjectChange,
}) => {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__title">
        <h1>Project Dashboard</h1>
        <div className="dashboard-header__filters">
          <label htmlFor="project-select" className="visually-hidden">
            Select project
          </label>
          <select
            id="project-select"
            value={selectedProject}
            onChange={(event) => onProjectChange(event.target.value)}
          >
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="dashboard-header__actions">
        <button
          type="button"
          className="header-icon-button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label={isRefreshing ? 'Refreshing data' : 'Refresh dashboard data'}
        >
          <span
            aria-hidden="true"
            className={`header-icon-button__icon${isRefreshing ? ' header-icon-button__icon--spinning' : ''}`}
          >
            ⟳
          </span>
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
