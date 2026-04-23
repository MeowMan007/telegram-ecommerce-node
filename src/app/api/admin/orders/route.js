import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth.js';
import prisma from '../../../../lib/prisma.js';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const orders = await prisma.order.findMany({
    include: { client: true, items: true },
    orderBy: { createdDate: 'desc' },
  });

  return Response.json(orders.map((o) => ({
    ...o,
    amount: Number(o.amount),
    discountAmount: Number(o.discountAmount),
    client: { ...o.client, chatId: o.client.chatId.toString() },
    items: o.items.map((i) => ({ ...i, productPrice: Number(i.productPrice) })),
  })));
}
