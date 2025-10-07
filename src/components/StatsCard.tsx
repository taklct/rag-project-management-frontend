import type { FC, ReactNode } from 'react';
import '../css/StatsCard.css';

export type StatsCardVariant = 'default' | 'success' | 'info' | 'danger';

export interface StatsCardProps {
  icon: ReactNode;
  title: string;
  value: number | string;
  subtitle?: string;
  variant?: StatsCardVariant;
}

const StatsCard: FC<StatsCardProps> = ({ icon, title, value, subtitle, variant = 'default' }) => {
  return (
    <div className={`stats-card stats-card--${variant}`}>
      <div className="stats-card__icon" aria-hidden="true">
        {icon}
      </div>
      <div className="stats-card__content">
        <p className="stats-card__title">{title}</p>
        <p className="stats-card__value">{value}</p>
        {subtitle && <p className="stats-card__subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatsCard;
