import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../lib/auth.js';
import AdminLayout from '../admin-layout';
import PaymentsClient from './PaymentsClient';

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <AdminLayout>
      <PaymentsClient />
    </AdminLayout>
  );
}
