const teams = [
  { name: 'Backend', points: 40, total: 50 },
  { name: 'Frontend', points: 34, total: 40 },
  { name: 'QA', points: 18, total: 25 },
  { name: 'DevOps', points: 12, total: 20 },
];

const TeamProgress = () => {
  return (
    <section className="panel">
      <header className="panel__header">
        <h2>Team Progress</h2>
      </header>
      <ul className="team-progress">
        {teams.map((team) => {
          const completion = Math.round((team.points / team.total) * 100);
          return (
            <li key={team.name} className="team-progress__item">
              <div className="team-progress__info">
                <p className="team-progress__name">{team.name}</p>
                <p className="team-progress__value">
                  {team.points}/{team.total} SP
                </p>
              </div>
              <div className="team-progress__bar">
                <div className="team-progress__fill" style={{ width: `${completion}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default TeamProgress;
