import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth.js';
import prisma from '../../../../lib/prisma.js';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { id: 'desc' },
  });

  return Response.json(products.map((p) => ({
    ...p, price: Number(p.price),
  })));
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description || '',
      price: BigInt(data.price || 0),
      photoUrl: data.photoUrl || 'https://via.placeholder.com/300',
      categoryId: data.categoryId ? parseInt(data.categoryId) : null,
      stockQty: parseInt(data.stockQty) || 0,
      isActive: data.isActive !== false,
    },
  });

  return Response.json({ ...product, price: Number(product.price) });
}
