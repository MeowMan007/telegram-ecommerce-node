import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth.js';
import prisma from '../../../../lib/prisma.js';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const settings = await prisma.botSettings.findUnique({ where: { id: 1 } });
  return Response.json(settings || { upiId: '', upiQrUrl: '', usdtAddress: '', usdtNetwork: 'TRC20' });
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const settings = await prisma.botSettings.upsert({
    where: { id: 1 },
    update: {
      upiId: data.upiId || '',
      upiQrUrl: data.upiQrUrl || '',
      usdtAddress: data.usdtAddress || '',
      usdtNetwork: data.usdtNetwork || 'TRC20',
    },
    create: {
      id: 1,
      upiId: data.upiId || '',
      upiQrUrl: data.upiQrUrl || '',
      usdtAddress: data.usdtAddress || '',
      usdtNetwork: data.usdtNetwork || 'TRC20',
    },
  });
  return Response.json(settings);
}
