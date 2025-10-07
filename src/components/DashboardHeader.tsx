import type { FC } from 'react';
import '../css/DashboardHeader.css';

export interface DashboardHeaderProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const DashboardHeader: FC<DashboardHeaderProps> = ({ onRefresh, isRefreshing = false }) => {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__title">
        <h1>Project Dashboard</h1>
        <div className="dashboard-header__filters">
          <label htmlFor="project-select" className="visually-hidden">
            Select project
          </label>
          <select id="project-select" defaultValue="E-Commerce Platform">
            <option>E-Commerce Platform</option>
            <option>Mobile Banking</option>
            <option>AI Assistant</option>
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
        <button type="button" className="header-button" disabled={isRefreshing}>
          <span aria-hidden="true">➕</span> New Task
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
