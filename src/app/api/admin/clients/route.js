import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth.js';
import prisma from '../../../../lib/prisma.js';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const clients = await prisma.client.findMany({ orderBy: { id: 'desc' } });
  return Response.json(clients.map((c) => ({ ...c, chatId: c.chatId.toString() })));
}
