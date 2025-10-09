import type { FC, ReactNode } from 'react';
import '../css/IssuePanel.css';

export type IssueSeverity = 'low' | 'medium' | 'high';

export interface IssueItem {
  id: string;
  title: string;
  description?: string;
  meta?: string;
  severity: IssueSeverity;
}

export interface IssuePanelProps {
  title: string;
  icon: ReactNode;
  items: IssueItem[];
  emptyMessage: string;
  tone?: 'danger' | 'warning';
}

const severityLabel: Record<IssueSeverity, string> = {
  high: 'HIGH',
  medium: 'MED',
  low: 'LOW',
};

const IssuePanel: FC<IssuePanelProps> = ({ title, icon, items, emptyMessage, tone = 'danger' }) => {
  return (
    <section className={`panel issue-panel issue-panel--${tone}`}>
      <header className="panel__header issue-panel__header">
        <div className="issue-panel__title">
          <span className="issue-panel__badge" aria-hidden="true">
            {icon}
          </span>
          <h2>{title}</h2>
        </div>
      </header>
      {items.length === 0 ? (
        <p className="panel__empty">{emptyMessage}</p>
      ) : (
        <ul className="issue-panel__list" role="list">
          {items.map((item) => (
            <li key={item.id} className={`issue-panel__item issue-panel__item--${item.severity}`}>
              <div className="issue-panel__indicator" aria-hidden="true">
                <span className="issue-panel__indicator-icon">!</span>
              </div>
              <div className="issue-panel__content">
                <span className="issue-panel__item-id" aria-label={`Task number ${item.id}`}>
                  {item.id}
                </span>
                <p className="issue-panel__item-title">{item.title}</p>
                {item.description ? (
                  <p className="issue-panel__item-description">{item.description}</p>
                ) : null}
                {item.meta ? <p className="issue-panel__item-meta">{item.meta}</p> : null}
              </div>
              <span className={`issue-panel__severity issue-panel__severity--${item.severity}`}>
                {severityLabel[item.severity]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default IssuePanel;
