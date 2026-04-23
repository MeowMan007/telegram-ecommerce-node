'use client';

import { SessionProvider } from 'next-auth/react';
import Sidebar from '../components/Sidebar';

export default function AdminLayout({ children }) {
  return (
    <SessionProvider>
      <div className="admin-container">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
