import prisma from '../../lib/prisma.js';
import { mainMenuKeyboard } from '../keyboards.js';

export function registerAdminChatHandler(bot) {
  const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

  // User taps "💬 Talk to Admin" button
  bot.hears('💬 Talk to Admin', async (ctx) => {
    const clientChatId = BigInt(ctx.from.id);

    // Check if user already has an active ticket
    const existing = await prisma.adminChatSession.findFirst({
      where: { clientChatId, isActive: true },
    });

    if (existing) {
      return ctx.reply(
        `📩 You already have an open support ticket.\n\nJust type your message here and it will be sent to the admin.\n\nThe admin will close the ticket when the conversation is over.`,
        { parse_mode: 'HTML' }
      );
    }

    // Get or create client record
    const client = await prisma.client.findUnique({ where: { chatId: clientChatId } });
    const clientName = client?.name || ctx.from.first_name || 'Customer';

    // Create a new ticket (chat session)
    await prisma.adminChatSession.create({
      data: {
        adminChatId: BigInt(ADMIN_CHAT_ID),
        clientChatId,
        clientName,
        isActive: true,
      },
    });

    await ctx.reply(
      `📩 <b>Support Ticket Opened!</b>\n\n` +
      `Your message will be forwarded to the admin.\n` +
      `Type your question or concern below 👇\n\n` +
      `The admin will reply here directly.`,
      { parse_mode: 'HTML' }
    );

    // Notify admin about the new ticket
    await ctx.telegram.sendMessage(
      ADMIN_CHAT_ID,
      `🎫 <b>New Support Ticket!</b>\n\n` +
      `👤 From: <b>${clientName}</b>\n` +
      `🆔 Chat ID: <code>${clientChatId}</code>\n\n` +
      `Their messages will appear here.\n` +
      `Type replies and they'll be forwarded.\n` +
      `Use /close when done.`,
      { parse_mode: 'HTML' }
    );
  });

  // Admin clicks "Reply to Customer" from payment proof notification
  bot.action(/^reply_(\d+)$/, async (ctx) => {
    if (String(ctx.from.id) !== ADMIN_CHAT_ID) {
      return ctx.answerCbQuery('⛔ Admin only');
    }
    await ctx.answerCbQuery();

    const orderId = parseInt(ctx.match[1]);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { client: true },
    });
    if (!order) return ctx.reply('Order not found.');

    // Close any existing active sessions
    await prisma.adminChatSession.updateMany({
      where: { adminChatId: BigInt(ADMIN_CHAT_ID), isActive: true },
      data: { isActive: false },
    });

    // Create new session
    await prisma.adminChatSession.create({
      data: {
        adminChatId: BigInt(ADMIN_CHAT_ID),
        clientChatId: order.client.chatId,
        clientName: order.client.name,
        isActive: true,
      },
    });

    await ctx.reply(
      `💬 <b>Chat session opened!</b>\n\n` +
      `Connected to: <b>${order.client.name || 'Customer'}</b> (Order #${orderId})\n\n` +
      `Send messages here and they'll be relayed to the customer.\n` +
      `Type /close when done.`,
      { parse_mode: 'HTML' }
    );

    // Notify customer
    await ctx.telegram.sendMessage(
      order.client.chatId.toString(),
      `📩 <b>Support Message</b>\n\n` +
      `Our team is reaching out regarding your order #${orderId}.\n` +
      `You can reply here and your messages will be forwarded to support.`,
      { parse_mode: 'HTML' }
    );
  });

  // /close command - admin closes chat session
  bot.command('close', async (ctx) => {
    if (String(ctx.from.id) !== ADMIN_CHAT_ID) return;

    const session = await prisma.adminChatSession.findFirst({
      where: { adminChatId: BigInt(ADMIN_CHAT_ID), isActive: true },
    });

    if (!session) {
      return ctx.reply('❌ No active chat session to close.');
    }

    await prisma.adminChatSession.update({
      where: { id: session.id },
      data: { isActive: false },
    });

    await ctx.reply(
      `🔒 Chat session with <b>${session.clientName || 'Customer'}</b> closed.`,
      { parse_mode: 'HTML' }
    );

    // Notify customer
    await ctx.telegram.sendMessage(
      session.clientChatId.toString(),
      `✅ <b>Support session closed.</b>\n\nThank you for reaching out! If you need more help, tap "💬 Talk to Admin" again.`,
      { parse_mode: 'HTML', ...mainMenuKeyboard() }
    );
  });

  // /chat command - admin starts chat with a user by chat ID
  bot.command('chat', async (ctx) => {
    if (String(ctx.from.id) !== ADMIN_CHAT_ID) return;

    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
      return ctx.reply('Usage: /chat <client_chat_id>');
    }

    const clientChatId = BigInt(args[1]);
    const client = await prisma.client.findUnique({ where: { chatId: clientChatId } });
    if (!client) {
      return ctx.reply('❌ Client not found with that chat ID.');
    }

    // Close existing sessions
    await prisma.adminChatSession.updateMany({
      where: { adminChatId: BigInt(ADMIN_CHAT_ID), isActive: true },
      data: { isActive: false },
    });

    await prisma.adminChatSession.create({
      data: {
        adminChatId: BigInt(ADMIN_CHAT_ID),
        clientChatId,
        clientName: client.name,
        isActive: true,
      },
    });

    await ctx.reply(
      `💬 <b>Chat session opened!</b>\n\n` +
      `Connected to: <b>${client.name || 'Customer'}</b>\n` +
      `Send messages here and they'll be relayed.\nType /close when done.`,
      { parse_mode: 'HTML' }
    );

    await ctx.telegram.sendMessage(
      clientChatId.toString(),
      `📩 <b>Message from Support</b>\n\nOur team is reaching out to you. You can reply here.`,
      { parse_mode: 'HTML' }
    );
  });

  // Relay admin messages to customer
  bot.on('text', async (ctx, next) => {
    // Only process admin messages
    if (String(ctx.from.id) !== ADMIN_CHAT_ID) {
      // Check if customer has active session - relay their replies to admin
      return handleCustomerReply(ctx, next);
    }

    // Skip commands
    if (ctx.message.text.startsWith('/')) return next();

    const session = await prisma.adminChatSession.findFirst({
      where: { adminChatId: BigInt(ADMIN_CHAT_ID), isActive: true },
    });

    if (!session) return next(); // No active session, pass to other handlers

    // Relay message to customer
    try {
      await ctx.telegram.sendMessage(
        session.clientChatId.toString(),
        `📩 <b>Support:</b>\n${ctx.message.text}`,
        { parse_mode: 'HTML' }
      );
      await ctx.reply('✅ Message sent.');
    } catch (err) {
      await ctx.reply(`❌ Failed to send: ${err.message}`);
    }
  });
}

async function handleCustomerReply(ctx, next) {
  const clientChatId = BigInt(ctx.from.id);

  const session = await prisma.adminChatSession.findFirst({
    where: { clientChatId, isActive: true },
  });

  if (!session) return next(); // No active session, proceed normally

  const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
  const clientName = session.clientName || 'Customer';

  try {
    await ctx.telegram.sendMessage(
      ADMIN_CHAT_ID,
      `💬 <b>${clientName}:</b>\n${ctx.message.text}`,
      { parse_mode: 'HTML' }
    );
  } catch (err) {
    console.error('Failed to relay customer message:', err.message);
  }
}
