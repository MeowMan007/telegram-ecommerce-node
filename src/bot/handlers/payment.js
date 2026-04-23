import prisma from '../../lib/prisma.js';
import { paymentMethodKeyboard, paymentReviewKeyboard, mainMenuKeyboard } from '../keyboards.js';

// Track users in payment proof upload state
const awaitingProof = new Map();

export function registerPaymentHandler(bot) {
  // Checkout: create order and show payment methods
  bot.action('checkout_start', async (ctx) => {
    await ctx.answerCbQuery();
    const chatId = BigInt(ctx.from.id);

    const client = await prisma.client.findUnique({ where: { chatId } });
    if (!client) return ctx.reply('Please /start the bot first.');

    const cartItems = await prisma.cart.findMany({ where: { chatId } });
    if (cartItems.length === 0) return ctx.reply('🛒 Cart is empty!');

    // Build order items
    let totalAmount = BigInt(0);
    const items = [];
    for (const ci of cartItems) {
      const product = await prisma.product.findUnique({ where: { id: ci.productId } });
      if (!product) continue;
      const lineTotal = product.price * BigInt(ci.quantity);
      totalAmount += lineTotal;
      items.push({
        productId: product.id,
        quantity: ci.quantity,
        productName: product.name,
        productPrice: product.price,
      });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        clientId: client.id,
        amount: totalAmount,
        status: 'WAITING',
        paymentStatus: 'PENDING',
        items: { create: items },
      },
    });

    // Clear cart
    await prisma.cart.deleteMany({ where: { chatId } });

    const text =
      `🛍️ <b>Order #${order.id} Created!</b>\n\n` +
      `💰 Total: <b>₹${totalAmount}</b>\n\n` +
      `Choose your payment method:`;

    try {
      await ctx.editMessageText(text, { parse_mode: 'HTML', ...paymentMethodKeyboard(order.id) });
    } catch {
      await ctx.reply(text, { parse_mode: 'HTML', ...paymentMethodKeyboard(order.id) });
    }
  });

  // UPI payment selected
  bot.action(/^pay_upi_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const orderId = parseInt(ctx.match[1]);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;

    await prisma.order.update({ where: { id: orderId }, data: { paymentMethod: 'UPI' } });

    const settings = await prisma.botSettings.findUnique({ where: { id: 1 } });
    const upiId = settings?.upiId || 'Not configured';

    const text =
      `💳 <b>UPI Payment</b>\n\n` +
      `📦 Order: <b>#${orderId}</b>\n` +
      `💰 Amount: <b>₹${order.amount}</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📲 UPI ID: <code>${upiId}</code>\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `<b>Instructions:</b>\n` +
      `1️⃣ Copy the UPI ID above\n` +
      `2️⃣ Send <b>₹${order.amount}</b> via any UPI app\n` +
      `3️⃣ Take a <b>screenshot</b> of the payment\n` +
      `4️⃣ Send the screenshot here as a photo 📸\n\n` +
      `⏳ Waiting for your payment proof...`;

    awaitingProof.set(ctx.from.id, orderId);

    try {
      await ctx.editMessageText(text, { parse_mode: 'HTML' });
    } catch {
      await ctx.reply(text, { parse_mode: 'HTML' });
    }
  });

  // USDT payment selected
  bot.action(/^pay_usdt_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const orderId = parseInt(ctx.match[1]);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;

    await prisma.order.update({ where: { id: orderId }, data: { paymentMethod: 'USDT' } });

    const settings = await prisma.botSettings.findUnique({ where: { id: 1 } });
    const usdtAddr = settings?.usdtAddress || 'Not configured';
    const network = settings?.usdtNetwork || 'TRC20';

    const text =
      `💰 <b>USDT Payment (${network})</b>\n\n` +
      `📦 Order: <b>#${orderId}</b>\n` +
      `💲 Amount: <b>$${order.amount} USDT</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📋 Address:\n<code>${usdtAddr}</code>\n` +
      `🔗 Network: <b>${network}</b>\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `<b>Instructions:</b>\n` +
      `1️⃣ Copy the address above\n` +
      `2️⃣ Send <b>$${order.amount} USDT</b> on ${network}\n` +
      `3️⃣ Take a <b>screenshot</b> or copy the TxHash\n` +
      `4️⃣ Send the screenshot here as a photo 📸\n\n` +
      `⏳ Waiting for your payment proof...`;

    awaitingProof.set(ctx.from.id, orderId);

    try {
      await ctx.editMessageText(text, { parse_mode: 'HTML' });
    } catch {
      await ctx.reply(text, { parse_mode: 'HTML' });
    }
  });

  // Handle proof photo upload
  bot.on('photo', async (ctx, next) => {
    const orderId = awaitingProof.get(ctx.from.id);
    if (!orderId) return next();

    awaitingProof.delete(ctx.from.id);

    const photo = ctx.message.photo;
    const fileId = photo[photo.length - 1].file_id; // Highest resolution

    // Save proof to order
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentProofId: fileId, paymentStatus: 'PROOF_SUBMITTED' },
    });

    // Acknowledge to user
    await ctx.reply(
      `✅ <b>Payment proof received!</b>\n\n` +
      `📦 Your order <b>#${orderId}</b> is being verified.\n` +
      `⏳ Please allow a few hours for confirmation.\n` +
      `We'll notify you once verified! 🙏\n\n` +
      `You can track your order in 📋 My Orders.`,
      { parse_mode: 'HTML', ...mainMenuKeyboard() }
    );

    // Notify admin
    await notifyAdminAboutPayment(ctx, orderId, fileId);
  });

  // Admin: approve payment
  bot.action(/^approve_(\d+)$/, async (ctx) => {
    const adminChatId = process.env.ADMIN_CHAT_ID;
    if (String(ctx.from.id) !== adminChatId) {
      return ctx.answerCbQuery('⛔ Admin only');
    }
    await ctx.answerCbQuery('✅ Approved!');
    const orderId = parseInt(ctx.match[1]);

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'VERIFIED', status: 'PROCESSED' },
    });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { client: true },
    });

    // Notify user
    if (order) {
      await ctx.telegram.sendMessage(
        order.client.chatId.toString(),
        `✅ <b>Payment Verified!</b>\n\n` +
        `Your payment for order <b>#${orderId}</b> has been verified.\n` +
        `Your order is now being processed! 🎉`,
        { parse_mode: 'HTML' }
      );
    }

    try {
      await ctx.editMessageCaption(
        ctx.callbackQuery.message.caption + '\n\n✅ APPROVED',
        { parse_mode: 'HTML' }
      );
    } catch {}
  });

  // Admin: reject payment
  bot.action(/^reject_(\d+)$/, async (ctx) => {
    const adminChatId = process.env.ADMIN_CHAT_ID;
    if (String(ctx.from.id) !== adminChatId) {
      return ctx.answerCbQuery('⛔ Admin only');
    }
    await ctx.answerCbQuery('❌ Rejected');
    const orderId = parseInt(ctx.match[1]);

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'REJECTED' },
    });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { client: true },
    });

    if (order) {
      await ctx.telegram.sendMessage(
        order.client.chatId.toString(),
        `❌ <b>Payment Rejected</b>\n\n` +
        `Your payment proof for order <b>#${orderId}</b> was not accepted.\n` +
        `Please submit a valid proof or contact support.`,
        { parse_mode: 'HTML' }
      );
    }

    try {
      await ctx.editMessageCaption(
        ctx.callbackQuery.message.caption + '\n\n❌ REJECTED',
        { parse_mode: 'HTML' }
      );
    } catch {}
  });
}

async function notifyAdminAboutPayment(ctx, orderId, fileId) {
  const adminChatId = process.env.ADMIN_CHAT_ID;
  if (!adminChatId) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { client: true, items: true },
  });
  if (!order) return;

  let itemsList = order.items
    .map((i) => `  • ${i.productName} × ${i.quantity} = ₹${Number(i.productPrice) * i.quantity}`)
    .join('\n');

  const caption =
    `🔔 <b>New Payment Proof!</b>\n\n` +
    `📦 Order: <b>#${orderId}</b>\n` +
    `👤 Client: ${order.client.name || 'Unknown'}\n` +
    `💳 Method: <b>${order.paymentMethod}</b>\n` +
    `💰 Amount: <b>₹${order.amount}</b>\n\n` +
    `<b>Items:</b>\n${itemsList}`;

  await ctx.telegram.sendPhoto(adminChatId, fileId, {
    caption,
    parse_mode: 'HTML',
    ...paymentReviewKeyboard(orderId),
  });
}

export { awaitingProof };
