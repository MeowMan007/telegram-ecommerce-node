'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Products', path: '/products', icon: '📦' },
    { name: 'Categories', path: '/categories', icon: '📁' },
    { name: 'Orders', path: '/orders', icon: '🛒' },
    { name: 'Payments', path: '/payments', icon: '💳' },
    { name: 'Clients', path: '/clients', icon: '👥' },
    { name: 'Announcements', path: '/announcements', icon: '📢' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">S</div>
        <div>
          <h2>Shop Admin</h2>
          <span>Bot Management</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`nav-item ${pathname === item.path ? 'active' : ''}`}
          >
            <span className="icon">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{session?.user?.name?.[0] || 'A'}</div>
          <div style={{ flex: 1 }}>
            <div className="user-name">{session?.user?.name || 'Admin'}</div>
            <div className="user-role">{session?.user?.role || 'MANAGER'}</div>
          </div>
          <button onClick={() => signOut()} className="btn btn-sm btn-danger" style={{ padding: '4px 8px' }}>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
