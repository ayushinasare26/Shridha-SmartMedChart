import { Sidebar } from '../components/Sidebar';
import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      <Sidebar />
      <div className="main-layout" style={{ flex: 1, minWidth: 0, width: 'calc(100% - var(--sidebar-width))' }}>
        <Outlet />
      </div>
    </div>
  );
}

