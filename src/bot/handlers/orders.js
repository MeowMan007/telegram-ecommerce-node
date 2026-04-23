import prisma from '../../lib/prisma.js';
import { orderListKeyboard } from '../keyboards.js';

const ORDERS_PER_PAGE = 5;

export function registerOrdersHandler(bot) {
  bot.hears('📋 My Orders', async (ctx) => {
    await showOrders(ctx, 0);
  });

  bot.command('myorders', async (ctx) => {
    await showOrders(ctx, 0);
  });

  bot.action(/^orders_page_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const page = parseInt(ctx.match[1]);
    await showOrders(ctx, page, true);
  });

  bot.action(/^order_detail_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const orderId = parseInt(ctx.match[1]);
    await showOrderDetail(ctx, orderId);
  });
}

async function showOrders(ctx, page, edit = false) {
  const chatId = BigInt(ctx.from.id);
  const client = await prisma.client.findUnique({ where: { chatId } });
  if (!client) {
    return ctx.reply('You have no orders yet. Start shopping with 📦 Catalog!');
  }

  const totalOrders = await prisma.order.count({ where: { clientId: client.id } });
  if (totalOrders === 0) {
    return ctx.reply('📋 You have no orders yet.\n\nBrowse the 📦 Catalog to start shopping!');
  }

  const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE);
  const orders = await prisma.order.findMany({
    where: { clientId: client.id },
    orderBy: { createdDate: 'desc' },
    skip: page * ORDERS_PER_PAGE,
    take: ORDERS_PER_PAGE,
  });

  const text = `📋 <b>Your Orders</b> (${totalOrders} total)\n\nTap an order to see details:`;
  const kb = orderListKeyboard(orders, page, totalPages);

  if (edit && ctx.callbackQuery) {
    try { return await ctx.editMessageText(text, { parse_mode: 'HTML', ...kb }); } catch {}
  }
  return ctx.reply(text, { parse_mode: 'HTML', ...kb });
}

async function showOrderDetail(ctx, orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, client: true },
  });

  if (!order || order.client.chatId !== BigInt(ctx.from.id)) {
    return ctx.answerCbQuery('Order not found');
  }

  const statusIcon =
    order.status === 'COMPLETED' ? '✅' :
    order.status === 'PROCESSED' ? '🔄' :
    order.status === 'CANCELED' ? '❌' : '⏳';

  const payIcon =
    order.paymentStatus === 'VERIFIED' ? '✅' :
    order.paymentStatus === 'REJECTED' ? '❌' :
    order.paymentStatus === 'PROOF_SUBMITTED' ? '⏳' : '💳';

  let text = `📦 <b>Order #${order.id}</b>\n\n`;
  text += `${statusIcon} Status: <b>${order.status}</b>\n`;
  text += `${payIcon} Payment: <b>${order.paymentStatus}</b>`;
  if (order.paymentMethod) text += ` (${order.paymentMethod})`;
  text += `\n📅 Date: ${order.createdDate.toLocaleDateString()}\n`;
  text += `💰 Amount: <b>₹${order.amount}</b>\n\n`;
  text += `<b>Items:</b>\n`;

  for (const item of order.items) {
    text += `  • ${item.productName} × ${item.quantity} = ₹${Number(item.productPrice) * item.quantity}\n`;
  }

  try {
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '◀️ Back to Orders', callback_data: 'orders_page_0' }]],
      },
    });
  } catch {
    await ctx.reply(text, { parse_mode: 'HTML' });
  }
}
