import { type FC, useEffect, useState } from 'react';
import '../css/TeamProgress.css';

export type TeamProgressEntry = {
  name: string;
  points: number;
  total: number;
};

export interface TeamProgressProps {
  teams: TeamProgressEntry[];
}

const TeamProgress: FC<TeamProgressProps> = ({ teams }) => {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    setIsAnimated(false);
    const frame = requestAnimationFrame(() => {
      setIsAnimated(true);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [teams]);

  return (
    <section className="panel">
      <header className="panel__header">
        <h2>Team Progress</h2>
      </header>
      <ul className="team-progress">
        {teams.map((team) => {
          const completion = team.total > 0 ? Math.round((team.points / team.total) * 100) : 0;
          return (
            <li key={team.name} className="team-progress__item">
              <div className="team-progress__info">
                <p className="team-progress__name">{team.name}</p>
                <p className="team-progress__value">
                  {team.points}/{team.total} SP
                </p>
              </div>
              <div className="team-progress__bar">
                <div
                  className="team-progress__fill"
                  style={{ width: isAnimated ? `${completion}%` : '0%' }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default TeamProgress;
