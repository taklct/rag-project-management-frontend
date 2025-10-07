import type { FC } from 'react';
import '../css/DashboardHeader.css';

const DashboardHeader: FC = () => {
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
      <button type="button" className="header-button">
        <span aria-hidden="true">➕</span> New Task
      </button>
    </header>
  );
};

export default DashboardHeader;
