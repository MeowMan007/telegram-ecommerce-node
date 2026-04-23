import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../../lib/auth.js';
import AdminLayout from '../../admin-layout';
import OrdersClient from './OrdersClient';

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <AdminLayout>
      <OrdersClient />
    </AdminLayout>
  );
}
