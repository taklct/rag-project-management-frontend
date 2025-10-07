import { type CSSProperties, type FC, type ReactNode, useEffect, useState } from 'react';
import '../css/StatsCard.css';

export type StatsCardVariant = 'default' | 'success' | 'info' | 'danger';

export interface StatsCardProps {
  icon: ReactNode;
  title: string;
  value: number | string;
  subtitle?: string;
  variant?: StatsCardVariant;
  animationOrder?: number;
}

const StatsCard: FC<StatsCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  variant = 'default',
  animationOrder = 0,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, []);

  const cardStyle: CSSProperties & Record<string, string | number> = {
    ['--enter-delay' as string]: `${Math.max(animationOrder, 0) * 0.08}s`,
  };

  return (
    <div
      className={`stats-card stats-card--${variant} ${isVisible ? 'stats-card--visible' : ''}`}
      style={cardStyle}
    >
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
