import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { getCatalog } from '@/lib/catalog';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session.authenticated) {
    redirect('/admin/login');
  }

  const initialProducts = await getCatalog(true);

  return (
    <AdminDashboardClient
      initialProducts={initialProducts}
      username={session.username}
    />
  );
}
