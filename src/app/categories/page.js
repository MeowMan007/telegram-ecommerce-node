import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../../lib/auth.js';
import AdminLayout from '../../admin-layout';
import CategoriesClient from './CategoriesClient';

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <AdminLayout>
      <CategoriesClient />
    </AdminLayout>
  );
}
