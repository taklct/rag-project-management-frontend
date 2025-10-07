import { useEffect, useMemo, useState } from 'react';
import ProjectDashboardView from './views/projectDashboard';

interface RouteConfig {
  readonly render: () => JSX.Element;
  readonly title: string;
}

const DEFAULT_ROUTE = '/project-dashboard';

const ROUTES: Record<string, RouteConfig> = {
  '/': {
    render: () => <ProjectDashboardView />,
    title: 'Project Dashboard',
  },
  '/dashboard': {
    render: () => <ProjectDashboardView />,
    title: 'Project Dashboard',
  },
  '/project-dashboard': {
    render: () => <ProjectDashboardView />,
    title: 'Project Dashboard',
  },
};

const getCurrentPath = (): string => {
  if (typeof window === 'undefined') {
    return DEFAULT_ROUTE;
  }

  return window.location.pathname || DEFAULT_ROUTE;
};

const resolvePath = (path: string): string => {
  if (ROUTES[path]) {
    return path;
  }

  return DEFAULT_ROUTE;
};

const App = (): JSX.Element => {
  const [path, setPath] = useState<string>(() => resolvePath(getCurrentPath()));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleNavigation = (): void => {
      setPath(resolvePath(getCurrentPath()));
    };

    const initialPath = getCurrentPath();
    if (!ROUTES[initialPath]) {
      window.history.replaceState(window.history.state, '', DEFAULT_ROUTE);
      setPath(DEFAULT_ROUTE);
    }

    window.addEventListener('popstate', handleNavigation);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
    };
  }, []);

  const route = useMemo(() => ROUTES[path] ?? ROUTES[DEFAULT_ROUTE], [path]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = route.title;
    }
  }, [route.title]);

  return route.render();
};

export default App;
