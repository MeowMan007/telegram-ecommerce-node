import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../lib/auth.js';
import AdminLayout from '../admin-layout';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <AdminLayout>
      <SettingsClient />
    </AdminLayout>
  );
}
