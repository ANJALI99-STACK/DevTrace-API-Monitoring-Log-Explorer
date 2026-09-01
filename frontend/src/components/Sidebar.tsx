import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/app/dashboard', label: 'Dashboard', icon: '\u25A6' },
  { to: '/app/endpoints', label: 'API Management', icon: '\u2699' },
  { to: '/app/logs', label: 'Log Explorer', icon: '\u2315' },
  { to: '/app/alerts', label: 'Alerts', icon: '\u26A0' },
  { to: '/app/profile', label: 'Profile', icon: '\u25CF' },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-screen sticky top-0">
      <div className="px-6 py-5 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold">D</div>
        <span className="font-semibold text-lg">DevTrace</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            <span className="text-base">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800">
        <p className="text-sm font-medium truncate">{user?.name}</p>
        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        <button onClick={logout} className="mt-3 text-xs font-medium text-rose-500 hover:text-rose-600">
          Sign out
        </button>
      </div>
    </aside>
  );
};
