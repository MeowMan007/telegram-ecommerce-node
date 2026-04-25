import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth.js';
import prisma from '../../../../lib/prisma.js';
import bcrypt from 'bcryptjs';

const MASTER_PASSWORD = 'Chamar@8520';

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const { currentPassword, newPassword } = data;

  if (!currentPassword || !newPassword) {
    return Response.json({ error: 'Both current and new password are required' }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return Response.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { username: session.user.username },
  });

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  // Verify current password (or master password)
  const isValid = currentPassword === MASTER_PASSWORD || await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return Response.json({ error: 'Current password is incorrect' }, { status: 403 });
  }

  // Hash new password and update
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return Response.json({ success: true, message: 'Password changed successfully' });
}
