import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth.js';
import prisma from '../../../../../lib/prisma.js';
import { sendTelegramMessage } from '../../../../../lib/bot.js';

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const data = await req.json();

  const order = await prisma.order.update({
    where: { id: parseInt(id) },
    data: { status: data.status, paymentStatus: data.paymentStatus },
    include: { client: true },
  });

  // Notify customer about status change
  if (data.status) {
    const icon = data.status === 'COMPLETED' ? '✅' : data.status === 'PROCESSED' ? '🔄' : data.status === 'CANCELED' ? '❌' : '⏳';
    await sendTelegramMessage(
      order.client.chatId.toString(),
      `${icon} <b>Order #${order.id} Update</b>\n\nYour order status has been changed to: <b>${data.status}</b>`
    );
  }

  return Response.json({ ...order, amount: Number(order.amount), client: { ...order.client, chatId: order.client.chatId.toString() } });
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.order.delete({ where: { id: parseInt(id) } });
  return Response.json({ success: true });
}
