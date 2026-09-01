import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-surface-light dark:bg-surface-dark">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
};
