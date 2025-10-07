import { useEffect } from 'react';
import '../css/project_dashboard.css';

declare global {
  interface Window {
    FontAwesomeConfig?: Record<string, unknown>;
    Highcharts?: {
      chart: (renderTo: string, options: Record<string, unknown>) => void;
    };
    tailwind?: {
      config?: Record<string, unknown>;
    };
  }
}

type ScriptAttributes = Record<string, string>;

type LinkAttributes = Record<string, string> & { rel: string };

const loadScript = (src: string, attributes: ScriptAttributes = {}): Promise<void> => {
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);

  if (existing && existing.dataset.loaded === 'true') {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = existing ?? document.createElement('script');

    script.src = src;
    script.async = false;

    Object.entries(attributes).forEach(([key, value]) => {
      if (value) {
        script.setAttribute(key, value);
      }
    });

    const handleLoad = (): void => {
      script.dataset.loaded = 'true';
      resolve();
    };

    const handleError = (): void => {
      reject(new Error(`Failed to load script: ${src}`));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    if (!existing) {
      document.head.appendChild(script);
    }
  });
};

const loadLink = (href: string, attributes: LinkAttributes): void => {
  const selector = Object.entries({ href, ...attributes })
    .map(([key, value]) => `[${key}="${value}"]`)
    .join('');
  const existing = document.querySelector<HTMLLinkElement>(`link${selector}`);

  if (existing) {
    return;
  }

  const link = document.createElement('link');
  link.href = href;

  Object.entries(attributes).forEach(([key, value]) => {
    if (value) {
      link.setAttribute(key, value);
    }
  });

  document.head.appendChild(link);
};

const ProjectDashboard = (): JSX.Element => {
  useEffect(() => {
    let isMounted = true;

    window.FontAwesomeConfig = { autoReplaceSvg: 'nest' };
    window.tailwind = window.tailwind ?? {};
    window.tailwind.config = {
      theme: {
        extend: {
          colors: {
            'atlassian-blue': '#0052CC',
            'atlassian-light': '#E9F2FF',
            'atlassian-gray': '#6B778C',
            'atlassian-green': '#00875A',
            'atlassian-orange': '#FF8B00',
            'atlassian-red': '#DE350B',
          },
        },
      },
    };

    loadLink('https://fonts.googleapis.com', { rel: 'preconnect' });
    loadLink('https://fonts.gstatic.com', { rel: 'preconnect', crossorigin: 'anonymous' });
    loadLink(
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
      { rel: 'stylesheet' }
    );

    const initialiseCharts = async (): Promise<void> => {
      try {
        await loadScript('https://cdn.tailwindcss.com');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js', {
          crossorigin: 'anonymous',
          referrerpolicy: 'no-referrer',
        });
        await loadScript('https://code.highcharts.com/highcharts.js');
        await loadScript('https://code.highcharts.com/highcharts-more.js');
      } catch (error) {
        console.error(error);
        return;
      }

      if (!isMounted || !window.Highcharts) {
        return;
      }

      window.Highcharts.chart('donut-chart', {
        chart: { type: 'pie' },
        credits: { enabled: false },
        title: { text: null },
        plotOptions: {
          pie: {
            innerSize: '50%',
            dataLabels: {
              enabled: true,
              format: '{point.name}: {point.percentage:.1f}%',
              style: {
                fontWeight: 'bold',
                fontSize: '12px',
              },
            },
          },
        },
        colors: ['#6B7280', '#F59E0B', '#10B981'],
        series: [
          {
            name: 'Tasks',
            data: [
              { name: 'To Do', y: 25 },
              { name: 'In Progress', y: 30 },
              { name: 'Done', y: 45 },
            ],
          },
        ],
      });

      window.Highcharts.chart('bar-chart', {
        chart: { type: 'column' },
        credits: { enabled: false },
        title: { text: null },
        xAxis: {
          categories: ['High', 'Medium', 'Low'],
          labels: {
            style: {
              fontWeight: 'bold',
            },
          },
        },
        yAxis: {
          title: {
            text: 'Tasks',
            style: {
              fontWeight: 'bold',
            },
          },
        },
        plotOptions: {
          column: {
            stacking: 'normal',
            borderWidth: 1,
            borderColor: '#ffffff',
          },
        },
        colors: ['#6B7280', '#F59E0B', '#10B981'],
        series: [
          {
            name: 'To Do',
            data: [8, 12, 5],
          },
          {
            name: 'In Progress',
            data: [4, 8, 3],
          },
          {
            name: 'Done',
            data: [6, 15, 7],
          },
        ],
      });
    };

    void initialiseCharts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-900">Project Dashboard</h1>
            <div className="ml-8">
              <label className="text-sm font-medium text-gray-700 mr-3" htmlFor="project-select">
                Project:
              </label>
              <select
                id="project-select"
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-atlassian-blue focus:border-transparent"
                defaultValue="E-Commerce Platform"
              >
                <option>E-Commerce Platform</option>
                <option>Mobile App</option>
                <option>Analytics Dashboard</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <i className="fa-regular fa-bell text-gray-500" aria-hidden="true" />
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <main className="flex-1 p-6 overflow-y-auto">
          <section className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
            <article className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-atlassian-green bg-opacity-10 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-check text-atlassian-green text-lg" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">12</p>
                  <p className="text-sm text-gray-600">Completed Today</p>
                </div>
              </div>
            </article>

            <article className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-atlassian-blue bg-opacity-10 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-arrows-rotate text-atlassian-blue text-lg" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">8</p>
                  <p className="text-sm text-gray-600">Updated Today</p>
                </div>
              </div>
            </article>

            <article className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-atlassian-orange bg-opacity-10 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-plus text-atlassian-orange text-lg" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">5</p>
                  <p className="text-sm text-gray-600">Created Today</p>
                </div>
              </div>
            </article>

            <article className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-atlassian-red bg-opacity-10 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-clock text-atlassian-red text-lg" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">3</p>
                  <p className="text-sm text-gray-600">Overdue</p>
                </div>
              </div>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-8 mb-8 xl:grid-cols-2">
            <article className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Sprint Task Status</h3>
              <div id="donut-chart" className="h-80" />
            </article>

            <article className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Task Priority Overview</h3>
              <div id="bar-chart" className="h-80" />
            </article>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Team Progress</h3>
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="flex items-center w-40">
                  <span className="font-medium text-gray-900">Backend</span>
                </div>
                <div className="flex-1 mx-6">
                  <div className="bg-gray-200 rounded-full h-4">
                    <div className="bg-green-500 h-4 rounded-full" style={{ width: '67%' }} />
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-20 text-right">40/60 SP</span>
              </div>

              <div className="flex items-center">
                <div className="flex items-center w-40">
                  <span className="font-medium text-gray-900">Frontend</span>
                </div>
                <div className="flex-1 mx-6">
                  <div className="bg-gray-200 rounded-full h-4">
                    <div className="bg-green-500 h-4 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-20 text-right">34/40 SP</span>
              </div>

              <div className="flex items-center">
                <div className="flex items-center w-40">
                  <span className="font-medium text-gray-900">QA</span>
                </div>
                <div className="flex-1 mx-6">
                  <div className="bg-gray-200 rounded-full h-4">
                    <div className="bg-green-500 h-4 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-20 text-right">18/40 SP</span>
              </div>

              <div className="flex items-center">
                <div className="flex items-center w-40">
                  <span className="font-medium text-gray-900">DevOps</span>
                </div>
                <div className="flex-1 mx-6">
                  <div className="bg-gray-200 rounded-full h-4">
                    <div className="bg-green-500 h-4 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-20 text-right">15/20 SP</span>
              </div>
            </div>
          </section>
        </main>

        <aside className="w-full bg-white border-t border-gray-200 flex flex-col lg:w-96 lg:border-t-0 lg:border-l">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <i className="fa-solid fa-robot mr-2 text-atlassian-blue" aria-hidden="true" />
              AI Assistant
            </h3>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="flex">
              <div className="bg-atlassian-light rounded-lg p-3 max-w-xs">
                <p className="text-sm text-gray-800">
                  Hello! I'm here to help you with your project management tasks. What would you like to know?
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="bg-atlassian-blue text-white rounded-lg p-3 max-w-xs">
                <p className="text-sm">Can you show me the status of our current sprint?</p>
              </div>
            </div>

            <div className="flex">
              <div className="bg-atlassian-light rounded-lg p-3 max-w-xs">
                <p className="text-sm text-gray-800">
                  Based on the current data, your sprint has 45% tasks completed, 30% in progress, and 25% still to do.
                  The backend team is slightly behind schedule.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200">
            <form className="flex items-center space-x-2">
              <label htmlFor="assistant-message" className="visually-hidden">
                Type a message
              </label>
              <input
                id="assistant-message"
                type="text"
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-atlassian-blue focus:border-transparent"
              />
              <button
                type="button"
                className="bg-atlassian-blue text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                aria-label="Send message"
              >
                <i className="fa-solid fa-paper-plane text-sm" aria-hidden="true" />
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProjectDashboard;
