import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth.js';
import prisma from '../../../../lib/prisma.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [totalOrdersActive, activeClients, totalProducts, pendingPayments, recentOrders, ordersByStatus] =
    await Promise.all([
      prisma.order.count(),
      prisma.client.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count({ where: { paymentStatus: 'PROOF_SUBMITTED' } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdDate: 'desc' },
        include: { client: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

  // Calculate total revenue + total orders from client purchaseHistory (permanent records)
  const allClients = await prisma.client.findMany({
    select: { purchaseHistory: true },
  });

  let totalRevenue = 0;
  let totalOrders = 0;
  const dailyRevenue = {};

  for (const client of allClients) {
    if (!client.purchaseHistory) continue;
    try {
      const history = JSON.parse(client.purchaseHistory);
      for (const purchase of history) {
        totalRevenue += purchase.amount || 0;
        totalOrders += 1;
        const day = purchase.date ? purchase.date.split('T')[0] : 'Unknown';
        dailyRevenue[day] = (dailyRevenue[day] || 0) + (purchase.amount || 0);
      }
    } catch { /* skip malformed */ }
  }

  // Also include pending orders in revenue count
  const pendingRevenue = await prisma.order.aggregate({ _sum: { amount: true } });
  const activeOrderRevenue = Number(pendingRevenue._sum.amount || 0);

  // Serialize BigInts for recent orders
  const serializedOrders = recentOrders.map((o) => ({
    ...o,
    amount: Number(o.amount),
    discountAmount: Number(o.discountAmount),
    client: { ...o.client, chatId: o.client.chatId.toString() },
  }));

  return Response.json({
    totalOrders: totalOrders + totalOrdersActive,
    totalRevenue: totalRevenue + activeOrderRevenue,
    activeClients,
    totalProducts,
    pendingPayments,
    recentOrders: serializedOrders,
    ordersByStatus: ordersByStatus.map((s) => ({
      status: s.status,
      count: s._count.status,
    })),
    dailyRevenue,
  });
}
