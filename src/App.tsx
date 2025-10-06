import './App.css';
import DashboardHeader from './components/DashboardHeader';
import StatsCard, { type StatsCardProps } from './components/StatsCard';
import SprintStatus from './components/SprintStatus';
import TaskPriorityOverview from './components/TaskPriorityOverview';
import TeamProgress from './components/TeamProgress';
import AssistantPanel from './components/AssistantPanel';

const stats: StatsCardProps[] = [
  { icon: '✅', title: 'Completed Today', value: 12, subtitle: 'Logged today', variant: 'success' },
  { icon: '🔁', title: 'Updated Today', value: 8, subtitle: 'Tasks updated' },
  { icon: '🆕', title: 'Created Today', value: 5, subtitle: 'New tasks added', variant: 'info' },
  { icon: '⚠️', title: 'Overdue', value: 3, subtitle: 'Needs attention', variant: 'danger' },
];

function App(): JSX.Element {
  return (
    <div className="dashboard">
      <DashboardHeader />
      <main className="dashboard__layout">
        <section className="stats-grid">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </section>
        <section className="dashboard__content">
          <div className="dashboard__main-panels">
            <SprintStatus />
            <TaskPriorityOverview />
            <TeamProgress />
          </div>
          <AssistantPanel />
        </section>
      </main>
    </div>
  );
}

export default App;
