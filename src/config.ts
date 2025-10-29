const DEFAULT_API_SERVER = "http://localhost:8000";

const normaliseBaseUrl = (value: string): string => value.replace(/\/+$/, "");

const resolvedFromEnv =
  typeof import.meta !== "undefined"
    ? (import.meta.env?.VITE_API_SERVER as string | undefined)
    : undefined;

const baseUrl =
  resolvedFromEnv && resolvedFromEnv.trim() !== ""
    ? resolvedFromEnv
    : DEFAULT_API_SERVER;

export const API_SERVER = normaliseBaseUrl(baseUrl);

export const API_ENDPOINTS = {
  build: `${API_SERVER}/build`,
  taskSummary: `${API_SERVER}/project-dashboard/task-summary`,
  sprintTasks: `${API_SERVER}/project-dashboard/tasks-of-sprint`,
  ask: `${API_SERVER}/ask`,
  blockedItems: `${API_SERVER}/project-dashboard/blocked-item`,
  overdueItems: `${API_SERVER}/project-dashboard/overdue-item`,
} as const;

export default API_SERVER;
