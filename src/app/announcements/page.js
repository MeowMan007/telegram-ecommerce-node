import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../../lib/auth.js';
import AdminLayout from '../../admin-layout';
import AnnouncementsClient from './AnnouncementsClient';

export default async function AnnouncementsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <AdminLayout>
      <AnnouncementsClient />
    </AdminLayout>
  );
}
