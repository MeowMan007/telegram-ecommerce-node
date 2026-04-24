import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth.js';
import prisma from '../../../../lib/prisma.js';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const products = await prisma.product.findMany({
    include: { category: true, credentials: { where: { isSold: false } } },
    orderBy: { id: 'desc' },
  });

  return Response.json(products.map((p) => ({
    ...p, 
    price: Number(p.price),
    stockQty: p.credentials.length
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
      stockQty: 0, // Ignored now, dynamically calculated
      isActive: data.isActive !== false,
    },
  });

  if (data.bulkCredentials) {
    const lines = data.bulkCredentials.split('\n').map(l => l.trim()).filter(Boolean);
    const credsToCreate = lines.map(line => {
      const parts = line.split(':');
      return {
        productId: product.id,
        username: parts[0].trim(),
        password: parts.slice(1).join(':').trim() || 'N/A'
      };
    });
    if (credsToCreate.length > 0) {
      await prisma.digitalCredential.createMany({ data: credsToCreate });
    }
  }

  return Response.json({ ...product, price: Number(product.price) });
}
