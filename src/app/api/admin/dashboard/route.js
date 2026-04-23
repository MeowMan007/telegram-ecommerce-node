import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth.js';
import prisma from '../../../../lib/prisma.js';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [totalOrders, totalRevenue, activeClients, totalProducts, pendingPayments, recentOrders, ordersByStatus] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { amount: true } }),
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

  // Daily revenue for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyOrders = await prisma.order.findMany({
    where: { createdDate: { gte: thirtyDaysAgo } },
    select: { createdDate: true, amount: true },
    orderBy: { createdDate: 'asc' },
  });

  // Aggregate by day
  const dailyRevenue = {};
  for (const o of dailyOrders) {
    const day = o.createdDate.toISOString().split('T')[0];
    dailyRevenue[day] = (dailyRevenue[day] || 0) + Number(o.amount);
  }

  // Serialize BigInts
  const serializedOrders = recentOrders.map((o) => ({
    ...o,
    amount: Number(o.amount),
    discountAmount: Number(o.discountAmount),
    client: { ...o.client, chatId: o.client.chatId.toString() },
  }));

  return Response.json({
    totalOrders,
    totalRevenue: Number(totalRevenue._sum.amount || 0),
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
