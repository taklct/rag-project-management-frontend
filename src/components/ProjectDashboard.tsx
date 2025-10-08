import { useCallback, useEffect, useState } from 'react';
import DashboardHeader from './DashboardHeader';
import AssistantPanel from './AssistantPanel';
import SprintStatus, { type SprintSegment } from './SprintStatus';
import StatsCard, { type StatsCardProps } from './StatsCard';
import TaskPriorityOverview, { type Priority } from './TaskPriorityOverview';
import TeamProgress, { type TeamProgressEntry } from './TeamProgress';
import IssuePanel, { type IssueItem, type IssueSeverity } from './IssuePanel';
import { API_ENDPOINTS } from '../config';
import '../css/project_dashboard.css';

const fallbackStats: StatsCardProps[] = [
  { icon: '✅', title: 'Completed Today', value: 12, subtitle: 'Logged today', variant: 'success' },
  { icon: '🔁', title: 'Updated Today', value: 8, subtitle: 'Tasks updated' },
  { icon: '🆕', title: 'Created Today', value: 5, subtitle: 'New tasks added', variant: 'info' },
  { icon: '⚠️', title: 'Overdue', value: 3, subtitle: 'Needs attention', variant: 'danger' },
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

type NormalisedStatusKey = 'done' | 'inProgress' | 'todo' | 'other';

type NormalisedTask = {
  statusKey: NormalisedStatusKey;
  statusLabel: string;
  priorityLabel: string;
  teamLabel: string;
  storyPoints: number;
};

const determineStatusCategory = (value: string | null): { key: NormalisedStatusKey; label: string } => {
  if (!value) {
    return { key: 'other', label: 'Unspecified' };
  }

  const normalised = value.toLowerCase();

  if (/(done|complete|closed|finished|resolved)/.test(normalised)) {
    return { key: 'done', label: 'Done' };
  }

  if (/(progress|wip|active|doing)/.test(normalised)) {
    return { key: 'inProgress', label: 'In Progress' };
  }

  if (/(todo|to-do|backlog|pending|queue|queued|not started|blocked|awaiting)/.test(normalised)) {
    return { key: 'todo', label: 'To-Do' };
  }

  return { key: 'other', label: normaliseLabelCase(value) };
};

const normaliseWithFallback = (value: string | null, fallback: string): string => {
  if (value) {
    return normaliseLabelCase(value);
  }

  return fallback;
};

const parseSprintTasksValue = (value: unknown): NormalisedTask[] | undefined => {
  const parseArray = (items: unknown[]): NormalisedTask[] => {
    return items
      .map((item) => {
        if (!isRecord(item)) {
          return null;
        }

        const rawStatus = toNonEmptyString(
          item.Status ?? item.status ?? item.state ?? item.progress ?? item.currentStatus,
        );
        const rawPriority = toNonEmptyString(item.Priority ?? item.priority ?? item.rank);
        const rawTeam = toNonEmptyString(item.Team ?? item.team ?? item.group);
        const rawPoints = toFiniteNumber(
          item['Story Point'] ?? item.storyPoint ?? item.storyPoints ?? item.points ?? item.sp,
        );

        const { key, label } = determineStatusCategory(rawStatus);
        const priorityLabel = normaliseWithFallback(rawPriority, 'Unspecified');
        const teamLabel = normaliseWithFallback(rawTeam, 'Unassigned Team');
        const storyPoints = toSafeInteger(rawPoints ?? 0);

        return {
          statusKey: key,
          statusLabel: label,
          priorityLabel,
          teamLabel,
          storyPoints,
        } satisfies NormalisedTask;
      })
      .filter((item): item is NormalisedTask => item !== null);
  };

  if (Array.isArray(value)) {
    const parsed = parseArray(value);
    return parsed.length > 0 ? parsed : undefined;
  }

  if (isRecord(value)) {
    const candidateKeys = ['tasks', 'items', 'data', 'results', 'records'];
    for (const key of candidateKeys) {
      const nested = value[key];
      if (Array.isArray(nested)) {
        const parsed = parseArray(nested);
        if (parsed.length > 0) {
          return parsed;
        }
      }
    }
  }

  return undefined;
};

const parseTaskSummary = (data: unknown, depth = 0): StatsCardProps[] => {
  if (depth > 3 || data === undefined || data === null) {
    return [];
  }

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

    if (parsed.length > 0) {
      return parsed;
    }
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

    const direct = mappings
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

    if (direct.length > 0) {
      return direct;
    }

    for (const value of Object.values(data)) {
      const nested = parseTaskSummary(value, depth + 1);
      if (nested.length > 0) {
        return nested;
      }
    }
  }

  return [];
};

const parseSprintSegmentsValue = (value: unknown): SprintSegment[] | undefined => {
  const tasks = parseSprintTasksValue(value);
  if (tasks && tasks.length > 0) {
    const counts = new Map<string, { label: string; count: number }>();

    tasks.forEach((task) => {
      const key = task.statusLabel;
      const entry = counts.get(key);
      if (entry) {
        entry.count += 1;
      } else {
        counts.set(key, { label: task.statusLabel, count: 1 });
      }
    });

    const total = tasks.length;

    return Array.from(counts.values()).map((entry) => ({
      label: entry.label,
      percentage: total > 0 ? clampPercentage((entry.count / total) * 100) : 0,
      color: inferSprintColor(entry.label),
      count: entry.count,
    }));
  }

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
          count: item.count !== null ? toSafeInteger(item.count) : null,
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

        return { label, count: toSafeInteger(amount) };
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
      count: item.count,
    }));
  }

  return undefined;
};

const parsePriorityValue = (value: unknown): Priority[] | undefined => {
  const tasks = parseSprintTasksValue(value);
  if (tasks && tasks.length > 0) {
    const priorities = new Map<
      string,
      {
        label: string;
        counts: Priority['counts'];
      }
    >();

    tasks.forEach((task) => {
      const entry = priorities.get(task.priorityLabel);
      const baseCounts = entry?.counts ?? { done: 0, inProgress: 0, todo: 0 };

      const updatedCounts = { ...baseCounts };
      if (task.statusKey === 'done') {
        updatedCounts.done += 1;
      } else if (task.statusKey === 'inProgress') {
        updatedCounts.inProgress += 1;
      } else {
        updatedCounts.todo += 1;
      }

      priorities.set(task.priorityLabel, {
        label: task.priorityLabel,
        counts: updatedCounts,
      });
    });

    return Array.from(priorities.values());
  }

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
  const tasks = parseSprintTasksValue(value);
  if (tasks && tasks.length > 0) {
    const teams = new Map<
      string,
      {
        label: string;
        completedPoints: number;
        totalPoints: number;
        completedTasks: number;
        totalTasks: number;
      }
    >();

    tasks.forEach((task) => {
      const entry = teams.get(task.teamLabel) ?? {
        label: task.teamLabel,
        completedPoints: 0,
        totalPoints: 0,
        completedTasks: 0,
        totalTasks: 0,
      };

      const contribution = task.storyPoints > 0 ? task.storyPoints : 1;
      entry.totalPoints += contribution;
      entry.totalTasks += 1;

      if (task.statusKey === 'done') {
        entry.completedPoints += contribution;
        entry.completedTasks += 1;
      }

      teams.set(task.teamLabel, entry);
    });

    return Array.from(teams.values()).map((team) => {
      const totalPoints = team.totalPoints > 0 ? team.totalPoints : team.totalTasks;
      const completedPoints = team.completedPoints > 0 ? team.completedPoints : team.completedTasks;

      const safeTotal = Math.max(1, toSafeInteger(totalPoints));
      const safeCompleted = Math.min(safeTotal, toSafeInteger(completedPoints));

      return {
        name: team.label,
        points: safeCompleted,
        total: safeTotal,
      } satisfies TeamProgressEntry;
    });
  }

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

const toIssueSeverity = (value: unknown, fallback: IssueSeverity = 'medium'): IssueSeverity => {
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (normalised === '') {
      return fallback;
    }

    if (/(critical|blocker|urgent|high|severe|p0|p1|red|major|immediate)/.test(normalised)) {
      return 'high';
    }

    if (/(medium|med|moderate|p2|amber|orange|normal)/.test(normalised)) {
      return 'medium';
    }

    if (/(low|minor|p3|p4|green|trivial)/.test(normalised)) {
      return 'low';
    }

    if (/(overdue|late)/.test(normalised)) {
      return 'high';
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value >= 3) {
      return 'high';
    }
    if (value <= 1) {
      return 'low';
    }
    return 'medium';
  }

  if (typeof value === 'boolean') {
    return value ? 'high' : fallback;
  }

  return fallback;
};

const pickStringValue = (record: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const candidate = toNonEmptyString(record[key]);
    if (candidate) {
      return candidate;
    }
  }
  return null;
};

const pickNumberValue = (record: Record<string, unknown>, keys: string[]): number | null => {
  for (const key of keys) {
    const candidate = toFiniteNumber(record[key]);
    if (candidate !== null && candidate !== undefined && Number.isFinite(candidate)) {
      return Math.max(0, Math.round(Math.abs(candidate)));
    }
  }
  return null;
};

interface IssueParseConfig {
  fallbackTitle: string;
  defaultSeverity: IssueSeverity;
  idPrefix: string;
  waitingKeys?: string[];
  dueKeys?: string[];
  daysKeys?: string[];
  assigneeKeys?: string[];
  severityKeys?: string[];
}

const parseIssueCollection = (value: unknown, config: IssueParseConfig): IssueItem[] | undefined => {
  const parseArray = (items: unknown[]): IssueItem[] =>
    items
      .map((item, index) => {
        if (!isRecord(item)) {
          return null;
        }

        const record = item as Record<string, unknown>;
        const id =
          pickStringValue(record, ['id', 'key', 'issueId', 'issue_id', 'itemId', 'item_id', 'reference']) ??
          `${config.idPrefix}-${index}`;
        const title =
          pickStringValue(record, ['title', 'name', 'summary', 'task', 'item', 'issue', 'label']) ??
          `${config.fallbackTitle} ${index + 1}`;
        const description =
          pickStringValue(record, [
            'description',
            'detail',
            'details',
            'notes',
            'reason',
            'message',
            'context',
            'statusDescription',
          ]) ?? undefined;
        const severityCandidate =
          pickStringValue(record, config.severityKeys ?? []) ??
          record.severity ??
          record.priority ??
          record.level ??
          record.importance ??
          record.impact;
        const severity = toIssueSeverity(severityCandidate, config.defaultSeverity);

        const waiting = pickStringValue(record, config.waitingKeys ?? []);
        const due = pickStringValue(record, config.dueKeys ?? []);
        const overdueDays = pickNumberValue(record, config.daysKeys ?? []);
        const assignee = pickStringValue(record, config.assigneeKeys ?? []);

        const metaParts: string[] = [];
        if (waiting) {
          metaParts.push(`Waiting on ${waiting}`);
        }
        if (due) {
          metaParts.push(`Due: ${due}`);
        }
        if (overdueDays !== null) {
          metaParts.push(`Overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`);
        }
        if (assignee) {
          metaParts.push(`Owner: ${assignee}`);
        }

        const meta = metaParts.length > 0 ? metaParts.join(' • ') : undefined;

        return {
          id,
          title,
          description,
          meta,
          severity,
        } satisfies IssueItem;
      })
      .filter((item): item is IssueItem => item !== null);

  if (Array.isArray(value)) {
    const parsed = parseArray(value);
    return parsed.length > 0 ? parsed : undefined;
  }

  if (isRecord(value)) {
    const candidateKeys = ['items', 'data', 'results', 'records', 'issues', 'blocked', 'overdue'];
    for (const key of candidateKeys) {
      const nested = value[key];
      if (Array.isArray(nested)) {
        const parsed = parseArray(nested);
        if (parsed.length > 0) {
          return parsed;
        }
      }
    }
  }

  return undefined;
};

const parseBlockedItemsValue = (value: unknown): IssueItem[] | undefined =>
  parseIssueCollection(value, {
    fallbackTitle: 'Blocked item',
    defaultSeverity: 'high',
    idPrefix: 'blocked',
    waitingKeys: ['blockedBy', 'blocked_by', 'dependency', 'dependsOn', 'depends_on', 'waitingOn', 'waiting_on'],
    assigneeKeys: ['assignee', 'owner', 'responsible', 'lead', 'contact'],
    severityKeys: ['severity', 'priority', 'level', 'impact', 'risk'],
  });

const parseOverdueItemsValue = (value: unknown): IssueItem[] | undefined =>
  parseIssueCollection(value, {
    fallbackTitle: 'Overdue item',
    defaultSeverity: 'high',
    idPrefix: 'overdue',
    dueKeys: ['due', 'dueDate', 'due_date', 'deadline', 'targetDate', 'target_date', 'expected'],
    daysKeys: ['daysOverdue', 'overdueDays', 'days_late', 'lateBy', 'delay', 'age'],
    assigneeKeys: ['assignee', 'owner', 'responsible', 'lead', 'contact'],
    severityKeys: ['severity', 'priority', 'level', 'impact', 'risk', 'status'],
  });

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
  const [blockedItems, setBlockedItems] = useState<IssueItem[]>([]);
  const [overdueItems, setOverdueItems] = useState<IssueItem[]>([]);
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
      setSprintSegments(segments && segments.length > 0 ? segments : []);

      const priorities = deepSearchForArray(payload, parsePriorityValue);
      setPriorityOverview(priorities && priorities.length > 0 ? priorities : []);

      const teams = deepSearchForArray(payload, parseTeamProgressValue);
      setTeamProgress(teams && teams.length > 0 ? teams : []);
    } catch (error) {
      console.error('Unable to fetch sprint data', error);
      setSprintSegments([]);
      setPriorityOverview([]);
      setTeamProgress([]);
    }
  }, []);

  const loadBlockedItems = useCallback(async (project: string) => {
    try {
      const response = await fetch(createEndpointForProject(API_ENDPOINTS.blockedItems, project), {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Failed to load blocked items: ${response.status}`);
      }

      const payload = await response.json();
      const items = deepSearchForArray(payload, parseBlockedItemsValue);
      setBlockedItems(items && items.length > 0 ? items : []);
    } catch (error) {
      console.error('Unable to fetch blocked items', error);
      setBlockedItems([]);
    }
  }, []);

  const loadOverdueItems = useCallback(async (project: string) => {
    try {
      const response = await fetch(createEndpointForProject(API_ENDPOINTS.overdueItems, project), {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Failed to load overdue items: ${response.status}`);
      }

      const payload = await response.json();
      const items = deepSearchForArray(payload, parseOverdueItemsValue);
      setOverdueItems(items && items.length > 0 ? items : []);
    } catch (error) {
      console.error('Unable to fetch overdue items', error);
      setOverdueItems([]);
    }
  }, []);

  const loadAllData = useCallback(
    async (project: string) => {
      await Promise.all([
        loadTaskSummary(project),
        loadSprintData(project),
        loadBlockedItems(project),
        loadOverdueItems(project),
      ]);
    },
    [loadTaskSummary, loadSprintData, loadBlockedItems, loadOverdueItems],
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
            <div className="project-dashboard__grid project-dashboard__grid--two">
              <SprintStatus segments={sprintSegments} />
              <TaskPriorityOverview priorities={priorityOverview} />
            </div>
            <div className="project-dashboard__grid project-dashboard__grid--two">
              <IssuePanel
                title="Blocked Items"
                icon="🚫"
                items={blockedItems}
                emptyMessage="No blocked work at the moment."
                tone="danger"
              />
              <IssuePanel
                title="Overdue Items"
                icon="⏰"
                items={overdueItems}
                emptyMessage="Everything is on schedule."
                tone="warning"
              />
            </div>
            <TeamProgress teams={teamProgress} />
          </div>
          <AssistantPanel />
        </section>
      </main>
    </div>
  );
};

export default ProjectDashboard;
