import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth.js';
import prisma from '../../../../lib/prisma.js';
import { broadcastMessage } from '../../../../bot/handlers/announce.js';
import bot from '../../../../lib/bot.js';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const announcements = await prisma.announcement.findMany({ orderBy: { sentAt: 'desc' }, take: 50 });
  return Response.json(announcements);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { text } = await req.json();
  if (!text?.trim()) return Response.json({ error: 'Text is required' }, { status: 400 });

  const result = await broadcastMessage(bot.telegram, text, session.user.name || 'Admin');
  return Response.json(result);
}
