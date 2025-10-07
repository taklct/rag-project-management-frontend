import DashboardHeader from './DashboardHeader';
import AssistantPanel from './AssistantPanel';
import SprintStatus from './SprintStatus';
import StatsCard, { type StatsCardProps } from './StatsCard';
import TaskPriorityOverview from './TaskPriorityOverview';
import TeamProgress from './TeamProgress';
import '../css/project_dashboard.css';

const stats: StatsCardProps[] = [
  { icon: '✅', title: 'Completed Today', value: 12, subtitle: 'Logged today', variant: 'success' },
  { icon: '🔁', title: 'Updated Today', value: 8, subtitle: 'Tasks updated' },
  { icon: '🆕', title: 'Created Today', value: 5, subtitle: 'New tasks added', variant: 'info' },
  { icon: '⚠️', title: 'Overdue', value: 3, subtitle: 'Needs attention', variant: 'danger' },
];

const ProjectDashboard = (): JSX.Element => {
  return (
    <div className="project-dashboard">
      <DashboardHeader />
      <main className="project-dashboard__layout">
        <section className="project-dashboard__stats" aria-label="Project statistics summary">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </section>
        <section className="project-dashboard__content">
          <div className="project-dashboard__main">
            <SprintStatus />
            <TaskPriorityOverview />
            <TeamProgress />
          </div>
          <AssistantPanel />
        </section>
      </main>
    </div>
  );
};

export default ProjectDashboard;
