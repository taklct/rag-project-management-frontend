import type { FC, ReactNode, KeyboardEvent } from 'react';
import '../css/IssuePanel.css';

export type IssueSeverity = 'low' | 'medium' | 'high';

export interface IssueItem {
  id: string;
  title: string;
  description?: string;
  meta?: string;
  severity: IssueSeverity;
  assignee?: string;
  dueDate?: string;
  url?: string;
  status?: string;
}

export interface IssuePanelProps {
  title: string;
  icon: ReactNode;
  items: IssueItem[];
  emptyMessage: string;
  tone?: 'danger' | 'warning';
  showSeverity?: boolean;
}

const severityLabel: Record<IssueSeverity, string> = {
  high: 'HIGH',
  medium: 'MED',
  low: 'LOW',
};

const IssuePanel: FC<IssuePanelProps> = ({ title, icon, items, emptyMessage, tone = 'danger', showSeverity = true }) => {
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
          {items.map((item) => {
            const hasSeverity = Boolean(showSeverity && item.severity);
            const itemClasses = [
              'issue-panel__item',
              `issue-panel__item--${item.severity}`,
              !hasSeverity ? 'issue-panel__item--no-severity' : '',
              item.url ? 'issue-panel__item--link' : '',
            ]
              .filter(Boolean)
              .join(' ');
            if (item.url) {
              return (
                <li key={item.id}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={itemClasses}
                    aria-label={`Open ${title} ${item.id} in new tab`}
                  >
                    <div className="issue-panel__content">
                      <span className="issue-panel__item-id" aria-label={`Task number ${item.id}`}>
                        {item.id}
                      </span>
                      <p className="issue-panel__item-title">{item.title}</p>
                      {item.description ? (
                        <p className="issue-panel__item-description">{item.description}</p>
                      ) : null}
                      {item.assignee || item.dueDate || item.status ? (
                        <div className="issue-panel__meta-grid">
                          {item.status ? (
                            <>
                              <span className="issue-panel__meta-label">Status:</span>
                              <span className="issue-panel__meta-value">{item.status}</span>
                            </>
                          ) : null}
                          <span className="issue-panel__meta-label">Assignee:</span>
                          <span className="issue-panel__meta-value">{item.assignee ?? '—'}</span>
                          <span className="issue-panel__meta-label">Due Date:</span>
                          <span className="issue-panel__meta-value issue-panel__meta-date">{item.dueDate ?? '—'}</span>
                        </div>
                      ) : item.meta ? (
                        <p className="issue-panel__item-meta">{item.meta}</p>
                      ) : null}
                    </div>
                    {hasSeverity ? (
                      <span className={`issue-panel__severity issue-panel__severity--${item.severity}`}>
                        {severityLabel[item.severity]}
                      </span>
                    ) : null}
                  </a>
                </li>
              );
            }
            return (
              <li key={item.id} className={itemClasses}>
                <div className="issue-panel__content">
                  <span className="issue-panel__item-id" aria-label={`Task number ${item.id}`}>
                    {item.id}
                  </span>
                  <p className="issue-panel__item-title">{item.title}</p>
                  {item.description ? (
                    <p className="issue-panel__item-description">{item.description}</p>
                  ) : null}
                  {item.assignee || item.dueDate || item.status ? (
                    <div className="issue-panel__meta-grid">
                      {item.status ? (
                        <>
                          <span className="issue-panel__meta-label">Status:</span>
                          <span className="issue-panel__meta-value">{item.status}</span>
                        </>
                      ) : null}
                      <span className="issue-panel__meta-label">Assignee:</span>
                      <span className="issue-panel__meta-value">{item.assignee ?? '—'}</span>
                      <span className="issue-panel__meta-label">Due Date:</span>
                      <span className="issue-panel__meta-value issue-panel__meta-date">{item.dueDate ?? '—'}</span>
                    </div>
                  ) : item.meta ? (
                    <p className="issue-panel__item-meta">{item.meta}</p>
                  ) : null}
                </div>
                {hasSeverity ? (
                  <span className={`issue-panel__severity issue-panel__severity--${item.severity}`}>
                    {severityLabel[item.severity]}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default IssuePanel;
