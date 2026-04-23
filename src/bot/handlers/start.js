import prisma from '../../lib/prisma.js';
import { mainMenuKeyboard } from '../keyboards.js';

export function registerStartHandler(bot) {
  bot.command('start', async (ctx) => {
    const chatId = BigInt(ctx.from.id);
    const name = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || 'User';

    // Upsert client
    await prisma.client.upsert({
      where: { chatId },
      update: { isActive: true, name },
      create: { chatId, name, isActive: true },
    });

    // Get welcome message from DB or use default
    let text;
    try {
      const msg = await prisma.message.findUnique({ where: { name: 'START_MESSAGE' } });
      text = msg?.text || getDefaultWelcome(name);
    } catch {
      text = getDefaultWelcome(name);
    }

    await ctx.reply(text, mainMenuKeyboard());
  });
}

function getDefaultWelcome(name) {
  return `👋 Welcome, <b>${name}</b>!\n\n` +
    `🛍️ Browse our catalog, add items to your cart, and checkout with <b>UPI</b> or <b>USDT</b>.\n\n` +
    `Use the menu buttons below to get started!`;
}
