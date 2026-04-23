import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../lib/auth.js';
import AdminLayout from '../admin-layout';
import ProductsClient from './ProductsClient';

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <AdminLayout>
      <ProductsClient />
    </AdminLayout>
  );
}
