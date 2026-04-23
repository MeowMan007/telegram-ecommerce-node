import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../lib/auth.js';
import AdminLayout from '../admin-layout';
import ClientsClient from './ClientsClient';

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <AdminLayout>
      <ClientsClient />
    </AdminLayout>
  );
}
