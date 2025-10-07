import { useCallback, useEffect, useState } from 'react';
import DashboardHeader from './DashboardHeader';
import AssistantPanel from './AssistantPanel';
import SprintStatus, { type SprintSegment } from './SprintStatus';
import StatsCard, { type StatsCardProps } from './StatsCard';
import TaskPriorityOverview, { type Priority } from './TaskPriorityOverview';
import TeamProgress, { type TeamProgressEntry } from './TeamProgress';
import { API_ENDPOINTS } from '../config';
import '../css/project_dashboard.css';

const fallbackStats: StatsCardProps[] = [
  { icon: '✅', title: 'Completed Today', value: 12, subtitle: 'Logged today', variant: 'success' },
  { icon: '🔁', title: 'Updated Today', value: 8, subtitle: 'Tasks updated' },
  { icon: '🆕', title: 'Created Today', value: 5, subtitle: 'New tasks added', variant: 'info' },
  { icon: '⚠️', title: 'Overdue', value: 3, subtitle: 'Needs attention', variant: 'danger' },
];

const fallbackSprintSegments: SprintSegment[] = [
  { label: 'Done', percentage: 63, color: 'var(--color-success)' },
  { label: 'To-Do', percentage: 25, color: 'var(--color-warning)' },
  { label: 'In Progress', percentage: 12, color: 'var(--color-info)' },
];

const fallbackPriorities: Priority[] = [
  { label: 'High', counts: { done: 10, inProgress: 6, todo: 2 } },
  { label: 'Medium', counts: { done: 8, inProgress: 9, todo: 4 } },
  { label: 'Low', counts: { done: 6, inProgress: 5, todo: 7 } },
];

const fallbackTeams: TeamProgressEntry[] = [
  { name: 'Backend', points: 40, total: 50 },
  { name: 'Frontend', points: 34, total: 40 },
  { name: 'QA', points: 18, total: 25 },
  { name: 'DevOps', points: 12, total: 20 },
];

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
};

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim();
  }

  return null;
};

const toNumericOrString = (value: unknown): number | string | null => {
  const numeric = toFiniteNumber(value);
  if (numeric !== null) {
    return numeric;
  }

  const stringValue = toNonEmptyString(value);
  if (stringValue !== null) {
    return stringValue;
  }

  return null;
};

const isStatsVariant = (value: unknown): value is StatsCardProps['variant'] =>
  value === 'default' || value === 'success' || value === 'info' || value === 'danger';

const normaliseLabelCase = (value: string): string =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const clampPercentage = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
};

const toSafeInteger = (value: number): number => Math.max(0, Math.round(value));

const inferSprintColor = (label: string): string => {
  const normalised = label.toLowerCase();
  if (normalised.includes('done') || normalised.includes('complete')) {
    return 'var(--color-success)';
  }

  if (normalised.includes('todo') || normalised.includes('backlog') || normalised.includes('pending')) {
    return 'var(--color-warning)';
  }

  return 'var(--color-info)';
};

const parseTaskSummary = (data: unknown): StatsCardProps[] => {
  if (Array.isArray(data)) {
    const parsed = data
      .map((item) => {
        if (!isRecord(item)) {
          return null;
        }

        const title = toNonEmptyString(item.title);
        const value = toNumericOrString(item.value ?? item.count ?? item.total ?? item.amount);

        if (!title || value === null) {
          return null;
        }

        const subtitle = toNonEmptyString(item.subtitle) ?? undefined;
        const variant = isStatsVariant(item.variant) ? item.variant : undefined;

        return {
          title,
          value,
          subtitle,
          variant,
          icon: item.icon ?? '📊',
        } satisfies StatsCardProps;
      })
      .filter((item): item is StatsCardProps => item !== null);

    return parsed;
  }

  if (isRecord(data)) {
    const mappings: Array<{
      keys: string[];
      stat: StatsCardProps;
    }> = [
      {
        keys: ['completedToday', 'completed_today', 'doneToday'],
        stat: { icon: '✅', title: 'Completed Today', subtitle: 'Logged today', value: 0, variant: 'success' },
      },
      {
        keys: ['updatedToday', 'updated_today'],
        stat: { icon: '🔁', title: 'Updated Today', subtitle: 'Tasks updated', value: 0 },
      },
      {
        keys: ['createdToday', 'created_today', 'newTasks'],
        stat: { icon: '🆕', title: 'Created Today', subtitle: 'New tasks added', value: 0, variant: 'info' },
      },
      {
        keys: ['overdue', 'overdueTasks'],
        stat: { icon: '⚠️', title: 'Overdue', subtitle: 'Needs attention', value: 0, variant: 'danger' },
      },
    ];

    return mappings
      .map(({ keys, stat }) => {
        const value = keys
          .map((key) => toNumericOrString(data[key]))
          .find((candidate) => candidate !== null);

        if (value === null || value === undefined) {
          return null;
        }

        return { ...stat, value } satisfies StatsCardProps;
      })
      .filter((item): item is StatsCardProps => item !== null);
  }

  return [];
};

const parseSprintSegmentsValue = (value: unknown): SprintSegment[] | undefined => {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => {
        if (!isRecord(item)) {
          return null;
        }

        const label = toNonEmptyString(item.label ?? item.name ?? item.status);
        const percentage = toFiniteNumber(item.percentage ?? item.percent ?? item.value);
        const count = toFiniteNumber(item.count ?? item.tasks ?? item.total);
        const color = toNonEmptyString(item.color) ?? undefined;

        if (!label || (percentage === null && count === null)) {
          return null;
        }

        return {
          label: normaliseLabelCase(label),
          percentage,
          count,
          color: color ?? inferSprintColor(label),
        };
      })
      .filter(
        (item): item is { label: string; percentage: number | null; count: number | null; color: string } => item !== null,
      );

    if (items.length === 0) {
      return undefined;
    }

    const hasPercentage = items.some((item) => item.percentage !== null);
    const totalCount = hasPercentage ? 0 : items.reduce((sum, item) => sum + (item.count ?? 0), 0);

    return items.map((item) => {
      const computedPercentage =
        item.percentage !== null
          ? item.percentage
          : totalCount > 0
            ? (item.count ?? 0) / totalCount * 100
            : 0;

      return {
        label: item.label,
        percentage: clampPercentage(computedPercentage),
        color: item.color,
      } satisfies SprintSegment;
    });
  }

  if (isRecord(value)) {
    const statusMappings = [
      { label: 'Done', keys: ['done', 'completed', 'complete'] },
      { label: 'In Progress', keys: ['inProgress', 'in_progress', 'progress'] },
      { label: 'To-Do', keys: ['todo', 'to_do', 'backlog', 'pending'] },
    ] as const;

    const counts = statusMappings
      .map(({ label, keys }) => {
        const amount = keys.map((key) => toFiniteNumber(value[key])).find((candidate) => candidate !== null);
        if (amount === null || amount === undefined) {
          return null;
        }

        return { label, count: amount };
      })
      .filter((item): item is { label: string; count: number } => item !== null);

    if (counts.length === 0) {
      return undefined;
    }

    const total = counts.reduce((sum, item) => sum + item.count, 0);

    return counts.map((item) => ({
      label: item.label,
      percentage: total > 0 ? clampPercentage((item.count / total) * 100) : 0,
      color: inferSprintColor(item.label),
    }));
  }

  return undefined;
};

const parsePriorityValue = (value: unknown): Priority[] | undefined => {
  if (Array.isArray(value)) {
    const parsed = value
      .map((item) => {
        if (!isRecord(item)) {
          return null;
        }

        const label = toNonEmptyString(item.label ?? item.priority);
        const done = toFiniteNumber(item.done ?? item.completed);
        const inProgress = toFiniteNumber(item.inProgress ?? item.in_progress ?? item.progress);
        const todo = toFiniteNumber(item.todo ?? item.to_do ?? item.pending);

        if (!label || (done === null && inProgress === null && todo === null)) {
          return null;
        }

        return {
          label: normaliseLabelCase(label),
          counts: {
            done: toSafeInteger(done ?? 0),
            inProgress: toSafeInteger(inProgress ?? 0),
            todo: toSafeInteger(todo ?? 0),
          },
        } satisfies Priority;
      })
      .filter((item): item is Priority => item !== null);

    return parsed.length > 0 ? parsed : undefined;
  }

  if (isRecord(value)) {
    const parsed: Priority[] = [];

    for (const [rawLabel, nested] of Object.entries(value)) {
      if (!isRecord(nested)) {
        continue;
      }

      const done = toFiniteNumber(nested.done ?? nested.completed);
      const inProgress = toFiniteNumber(nested.inProgress ?? nested.in_progress ?? nested.progress);
      const todo = toFiniteNumber(nested.todo ?? nested.to_do ?? nested.pending);

      if (done === null && inProgress === null && todo === null) {
        continue;
      }

      parsed.push({
        label: normaliseLabelCase(rawLabel),
        counts: {
          done: toSafeInteger(done ?? 0),
          inProgress: toSafeInteger(inProgress ?? 0),
          todo: toSafeInteger(todo ?? 0),
        },
      });
    }

    return parsed.length > 0 ? parsed : undefined;
  }

  return undefined;
};

const parseTeamProgressValue = (value: unknown): TeamProgressEntry[] | undefined => {
  if (Array.isArray(value)) {
    const parsed = value
      .map((item) => {
        if (!isRecord(item)) {
          return null;
        }

        const name = toNonEmptyString(item.name ?? item.team);
        const points = toFiniteNumber(item.points ?? item.completed ?? item.value ?? item.current);
        const total = toFiniteNumber(item.total ?? item.capacity ?? item.goal);
        const percentage = toFiniteNumber(item.percentage ?? item.percent ?? item.progress);

        if (!name || (points === null && total === null && percentage === null)) {
          return null;
        }

        let computedPoints = points;
        let computedTotal = total;

        if (computedPoints === null && computedTotal !== null && percentage !== null) {
          computedPoints = (percentage / 100) * computedTotal;
        } else if (computedTotal === null && computedPoints !== null && percentage !== null && percentage !== 0) {
          computedTotal = (computedPoints / percentage) * 100;
        } else if (computedPoints === null && computedTotal === null && percentage !== null) {
          computedPoints = percentage;
          computedTotal = 100;
        }

        if (computedPoints === null && computedTotal === null) {
          return null;
        }

        const safePoints = toSafeInteger(computedPoints ?? 0);
        const safeTotal = Math.max(safePoints, toSafeInteger(computedTotal ?? 100));

        return {
          name: normaliseLabelCase(name),
          points: safePoints,
          total: safeTotal,
        } satisfies TeamProgressEntry;
      })
      .filter((item): item is TeamProgressEntry => item !== null);

    return parsed.length > 0 ? parsed : undefined;
  }

  if (isRecord(value)) {
    const parsed: TeamProgressEntry[] = [];

    for (const [rawName, nested] of Object.entries(value)) {
      if (!isRecord(nested)) {
        continue;
      }

      const points = toFiniteNumber(nested.points ?? nested.completed ?? nested.value ?? nested.current);
      const total = toFiniteNumber(nested.total ?? nested.capacity ?? nested.goal);
      const percentage = toFiniteNumber(nested.percentage ?? nested.percent ?? nested.progress);

      if (points === null && total === null && percentage === null) {
        continue;
      }

      let computedPoints = points;
      let computedTotal = total;

      if (computedPoints === null && computedTotal !== null && percentage !== null) {
        computedPoints = (percentage / 100) * computedTotal;
      } else if (computedTotal === null && computedPoints !== null && percentage !== null && percentage !== 0) {
        computedTotal = (computedPoints / percentage) * 100;
      } else if (computedPoints === null && computedTotal === null && percentage !== null) {
        computedPoints = percentage;
        computedTotal = 100;
      }

      const safePoints = toSafeInteger(computedPoints ?? 0);
      const safeTotal = Math.max(safePoints, toSafeInteger(computedTotal ?? 100));

      parsed.push({
        name: normaliseLabelCase(rawName),
        points: safePoints,
        total: safeTotal,
      });
    }

    return parsed.length > 0 ? parsed : undefined;
  }

  return undefined;
};

const deepSearchForArray = <T,>(value: unknown, parser: (candidate: unknown) => T[] | undefined, depth = 0): T[] | undefined => {
  if (depth > 3) {
    return undefined;
  }

  const direct = parser(value);
  if (direct && direct.length > 0) {
    return direct;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = deepSearchForArray(item, parser, depth + 1);
      if (result && result.length > 0) {
        return result;
      }
    }
  } else if (isRecord(value)) {
    for (const nested of Object.values(value)) {
      const result = deepSearchForArray(nested, parser, depth + 1);
      if (result && result.length > 0) {
        return result;
      }
    }
  }

  return undefined;
};

const PROJECT_OPTIONS = ['E-Commerce Platform', 'Mobile Banking', 'AI Assistant'];

const createEndpointForProject = (endpoint: string, project: string): string => {
  try {
    const url = new URL(endpoint);
    if (project.trim() !== '') {
      url.searchParams.set('project', project);
    }
    return url.toString();
  } catch (error) {
    console.error('Unable to build endpoint URL', error);
    return endpoint;
  }
};

const ProjectDashboard = (): JSX.Element => {
  const [summaryStats, setSummaryStats] = useState<StatsCardProps[]>([]);
  const [sprintSegments, setSprintSegments] = useState<SprintSegment[]>([]);
  const [priorityOverview, setPriorityOverview] = useState<Priority[]>([]);
  const [teamProgress, setTeamProgress] = useState<TeamProgressEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>(PROJECT_OPTIONS[0]);

  const loadTaskSummary = useCallback(async (project: string) => {
    try {
      const response = await fetch(createEndpointForProject(API_ENDPOINTS.taskSummary, project), {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Failed to load task summary: ${response.status}`);
      }

      const payload = await response.json();
      const parsed = parseTaskSummary(payload);
      setSummaryStats(parsed.length > 0 ? parsed : fallbackStats);
    } catch (error) {
      console.error('Unable to fetch task summary', error);
      setSummaryStats(fallbackStats);
    }
  }, []);

  const loadSprintData = useCallback(async (project: string) => {
    try {
      const response = await fetch(createEndpointForProject(API_ENDPOINTS.sprintTasks, project), {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Failed to load sprint data: ${response.status}`);
      }

      const payload = await response.json();
      const segments = deepSearchForArray(payload, parseSprintSegmentsValue);
      setSprintSegments(segments && segments.length > 0 ? segments : fallbackSprintSegments);

      const priorities = deepSearchForArray(payload, parsePriorityValue);
      setPriorityOverview(priorities && priorities.length > 0 ? priorities : fallbackPriorities);

      const teams = deepSearchForArray(payload, parseTeamProgressValue);
      setTeamProgress(teams && teams.length > 0 ? teams : fallbackTeams);
    } catch (error) {
      console.error('Unable to fetch sprint data', error);
      setSprintSegments(fallbackSprintSegments);
      setPriorityOverview(fallbackPriorities);
      setTeamProgress(fallbackTeams);
    }
  }, []);

  const loadAllData = useCallback(
    async (project: string) => {
      await Promise.all([loadTaskSummary(project), loadSprintData(project)]);
    },
    [loadTaskSummary, loadSprintData],
  );

  useEffect(() => {
    void loadAllData(selectedProject);
  }, [loadAllData, selectedProject]);

  const handleProjectChange = useCallback((project: string) => {
    setSelectedProject(project);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(API_ENDPOINTS.build, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rebuild: false, project: selectedProject }),
      });
      if (!response.ok) {
        throw new Error(`Failed to trigger build: ${response.status}`);
      }
    } catch (error) {
      console.error('Unable to trigger data rebuild', error);
    }

    try {
      await loadAllData(selectedProject);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadAllData, selectedProject]);

  return (
    <div className="project-dashboard">
      <DashboardHeader
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        projects={PROJECT_OPTIONS}
        selectedProject={selectedProject}
        onProjectChange={handleProjectChange}
      />
      <main className="project-dashboard__layout">
        <section className="project-dashboard__stats" aria-label="Project statistics summary">
          {summaryStats.map((stat, index) => (
            <StatsCard key={stat.title} {...stat} animationOrder={index} />
          ))}
        </section>
        <section className="project-dashboard__content">
          <div className="project-dashboard__main">
            <SprintStatus segments={sprintSegments} />
            <TaskPriorityOverview priorities={priorityOverview} />
            <TeamProgress teams={teamProgress} />
          </div>
          <AssistantPanel />
        </section>
      </main>
    </div>
  );
};

export default ProjectDashboard;
