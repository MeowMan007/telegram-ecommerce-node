import prisma from '../../lib/prisma.js';

export function registerAnnounceHandler(bot) {
  const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

  // /announce command - admin broadcasts message to all users
  bot.command('announce', async (ctx) => {
    if (String(ctx.from.id) !== ADMIN_CHAT_ID) return;

    const text = ctx.message.text.replace('/announce ', '').trim();
    if (!text || text === '/announce') {
      return ctx.reply('Usage: /announce <message>\n\nThe message will be sent to all active users.');
    }

    await ctx.reply('📢 Broadcasting message to all users...');

    const result = await broadcastMessage(ctx.telegram, text, 'Admin (Telegram)');

    await ctx.reply(
      `✅ <b>Broadcast complete!</b>\n\n` +
      `📤 Sent: ${result.sent}\n` +
      `❌ Failed: ${result.failed}\n` +
      `🚫 Blocked: ${result.blocked}`,
      { parse_mode: 'HTML' }
    );
  });
}

export async function broadcastMessage(telegram, text, sentBy) {
  const clients = await prisma.client.findMany({ where: { isActive: true } });

  let sent = 0;
  let failed = 0;
  let blocked = 0;

  for (const client of clients) {
    try {
      await telegram.sendMessage(
        client.chatId.toString(),
        `📢 <b>Announcement</b>\n\n${text}`,
        { parse_mode: 'HTML' }
      );
      sent++;
      // Rate limit: 30 msgs/sec max for Telegram
      if (sent % 25 === 0) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (err) {
      if (err.message?.includes('blocked') || err.message?.includes('Forbidden')) {
        blocked++;
        await prisma.client.update({
          where: { id: client.id },
          data: { isActive: false },
        });
      } else {
        failed++;
      }
    }
  }

  // Log announcement
  await prisma.announcement.create({
    data: { text, sentBy, totalSent: sent },
  });

  return { sent, failed, blocked };
}
