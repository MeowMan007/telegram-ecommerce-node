import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth.js';
import prisma from '../../../../../lib/prisma.js';

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: { category: true, credentials: { where: { isSold: false } } },
  });

  if (!product) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ 
    ...product, 
    price: Number(product.price),
    stockQty: product.credentials.length 
  });
}

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const data = await req.json();

  const product = await prisma.product.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      description: data.description,
      price: BigInt(data.price || 0),
      photoUrl: data.photoUrl,
      categoryId: data.categoryId ? parseInt(data.categoryId) : null,
      stockQty: 0,
      isActive: data.isActive,
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

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.product.delete({ where: { id: parseInt(id) } });
  return Response.json({ success: true });
}
