import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Uptime monitoring',
    body: 'Ping every endpoint on its own schedule and know within seconds when something goes down.',
  },
  {
    title: 'Searchable logs',
    body: 'Every check is indexed for full-text search — filter by status, endpoint, or error message instantly.',
  },
  {
    title: 'Smart alerts',
    body: 'Get emailed the moment an endpoint fails three checks in a row, not after your users notice.',
  },
  {
    title: 'Latency history',
    body: 'Track response times over time so regressions show up before they become incidents.',
  },
];

export const Landing = () => {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold">
            D
          </div>
          <span className="font-semibold text-lg">DevTrace</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600">
            Log in
          </Link>
          <Link to="/register" className="btn-primary text-sm">
            Get started free
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto text-center px-6 pt-16 pb-20">
        <span className="inline-block text-xs font-semibold uppercase tracking-wide text-brand-600 bg-brand-50 dark:bg-brand-500/10 px-3 py-1 rounded-full">
          API monitoring, without the enterprise price tag
        </span>
        <h1 className="mt-6 text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
          Know the moment your API breaks — not when a customer tells you
        </h1>
        <p className="mt-5 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          DevTrace watches your REST endpoints around the clock, logs every response, and alerts you the second
          something goes wrong.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link to="/register" className="btn-primary">
            Start monitoring — it's free
          </Link>
          <Link to="/login" className="btn-secondary">
            I already have an account
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-2 gap-5">
        {features.map((f) => (
          <div key={f.title} className="card p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="card p-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Simple pricing</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">One plan. Everything included.</p>
          <div className="mt-6">
            <span className="text-4xl font-bold">$0</span>
            <span className="text-slate-500">/month</span>
          </div>
          <ul className="mt-6 text-sm text-slate-600 dark:text-slate-300 space-y-2">
            <li>Unlimited endpoints</li>
            <li>1-minute check intervals</li>
            <li>Searchable log history</li>
            <li>Email alerts</li>
            <li>CSV export</li>
          </ul>
          <Link to="/register" className="btn-primary inline-block mt-8">
            Create your account
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-8">
        <p className="text-center text-sm text-slate-400">© {new Date().getFullYear()} DevTrace. Built for developers.</p>
      </footer>
    </div>
  );
};
