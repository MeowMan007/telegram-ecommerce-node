import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth.js';
import prisma from '../../../../lib/prisma.js';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
  return Response.json(categories);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await req.json();
  const category = await prisma.category.create({ data: { name: data.name } });
  return Response.json(category);
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await req.json();
  const category = await prisma.category.update({
    where: { id: parseInt(data.id) },
    data: { name: data.name },
  });
  return Response.json(category);
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  await prisma.category.delete({ where: { id: parseInt(id) } });
  return Response.json({ success: true });
}
