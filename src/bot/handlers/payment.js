import prisma from '../../lib/prisma.js';
import { paymentMethodKeyboard, paymentReviewKeyboard, mainMenuKeyboard } from '../keyboards.js';

// Track users in payment proof upload state via session

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
    const upiQrUrl = settings?.upiQrUrl || '';

    const text =
      `💳 <b>UPI Payment</b>\n\n` +
      `📦 Order: <b>#${orderId}</b>\n` +
      `💰 Amount: <b>₹${order.amount}</b>\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📲 UPI ID: <code>${upiId}</code>\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `<b>Instructions:</b>\n` +
      `1️⃣ Copy the UPI ID above${upiQrUrl ? ' or scan the QR code' : ''}\n` +
      `2️⃣ Send <b>₹${order.amount}</b> via any UPI app\n` +
      `3️⃣ Type your <b>12-digit UTR</b> (Transaction ID) here\n\n` +
      `⏳ Waiting for your UTR...`;

    ctx.session ??= {};
    ctx.session.awaitingProofOrderId = orderId;

    // Send QR code image if available
    if (upiQrUrl) {
      try {
        await ctx.replyWithPhoto(upiQrUrl, {
          caption: text,
          parse_mode: 'HTML',
        });
        return;
      } catch { /* fall through to text */ }
    }

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
      `3️⃣ Type your <b>Transaction Hash (TxHash)</b> here\n\n` +
      `⏳ Waiting for your TxHash...`;

    ctx.session ??= {};
    ctx.session.awaitingProofOrderId = orderId;

    try {
      await ctx.editMessageText(text, { parse_mode: 'HTML' });
    } catch {
      await ctx.reply(text, { parse_mode: 'HTML' });
    }
  });

  // Handle proof text upload
  bot.on('text', async (ctx, next) => {
    ctx.session ??= {};
    const orderId = ctx.session.awaitingProofOrderId;
    if (!orderId) return next();

    const textInput = ctx.message.text.trim();
    if (textInput.startsWith('/')) return next();

    ctx.session.awaitingProofOrderId = null;

    // Save proof to order
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentProofId: textInput, paymentStatus: 'PROOF_SUBMITTED' },
    });

    // Acknowledge to user
    await ctx.reply(
      `✅ <b>Payment transaction ID received!</b>\n\n` +
      `📦 Your order <b>#${orderId}</b> is being verified.\n` +
      `We'll notify you once verified and send your product details instantly! 🙏`,
      { parse_mode: 'HTML', ...mainMenuKeyboard() }
    );

    // Notify admin
    await notifyAdminAboutPayment(ctx, orderId, textInput);
  });

  // Admin: approve payment
  bot.action(/^approve_(\d+)$/, async (ctx) => {
    const adminChatId = process.env.ADMIN_CHAT_ID;
    if (String(ctx.from.id) !== adminChatId) {
      return ctx.answerCbQuery('⛔ Admin only');
    }
    const orderId = parseInt(ctx.match[1]);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { client: true, items: true },
    });

    if (!order) return ctx.answerCbQuery('Order not found');

    // Allocate digital credentials
    const assignedCredentials = [];
    let outOfStockProduct = null;

    for (const item of order.items) {
      const credentials = await prisma.digitalCredential.findMany({
        where: { productId: item.productId, isSold: false },
        take: item.quantity,
      });

      if (credentials.length < item.quantity) {
        outOfStockProduct = item.productName;
        break;
      }
      assignedCredentials.push(...credentials);
    }

    if (outOfStockProduct) {
      await ctx.answerCbQuery(`❌ OUT OF STOCK: ${outOfStockProduct}`, { show_alert: true });
      return;
    }

    await ctx.answerCbQuery('✅ Approved and sending credentials!');

    // Mark as sold
    for (const cred of assignedCredentials) {
      await prisma.digitalCredential.update({
        where: { id: cred.id },
        data: { isSold: true, orderId: order.id },
      });
    }

    // Prepare credentials message
    let credsMessage = `🎉 <b>Your Digital Goods are here!</b>\n\n`;
    for (const item of order.items) {
      credsMessage += `🛍️ <b>${item.productName}</b>\n`;
      const itemCreds = assignedCredentials.filter(c => c.productId === item.productId);
      for (const c of itemCreds) {
        credsMessage += `Username: <code>${c.username}</code>\nPassword: <code>${c.password}</code>\n\n`;
      }
    }
    credsMessage += `Thank you for your purchase!`;

    // Send credentials to client
    await ctx.telegram.sendMessage(order.client.chatId.toString(), credsMessage, { parse_mode: 'HTML' });

    // Append to purchaseHistory
    let currentHistory = [];
    try {
      if (order.client.purchaseHistory) currentHistory = JSON.parse(order.client.purchaseHistory);
    } catch {}
    currentHistory.push({
      date: new Date().toISOString(),
      amount: Number(order.amount),
      items: order.items.map(i => ({ name: i.productName, qty: i.quantity })),
    });

    await prisma.client.update({
      where: { id: order.client.id },
      data: { purchaseHistory: JSON.stringify(currentHistory) }
    });

    // Delete the order (wiping tracking as requested)
    await prisma.order.delete({ where: { id: order.id } });

    try {
      const msgText = ctx.callbackQuery.message.text || 'Payment Verification';
      await ctx.editMessageText(msgText + '\n\n✅ <b>APPROVED & DELIVERED</b>', { parse_mode: 'HTML' });
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
      const msgText = ctx.callbackQuery.message.text || 'Payment Verification';
      await ctx.editMessageText(
        msgText + '\n\n❌ REJECTED',
        { parse_mode: 'HTML' }
      );
    } catch {}
  });
}

async function notifyAdminAboutPayment(ctx, orderId, utr) {
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

  const text =
    `🔔 <b>New Payment Verification!</b>\n\n` +
    `📦 Order: <b>#${orderId}</b>\n` +
    `👤 Client: ${order.client.name || 'Unknown'}\n` +
    `💳 Method: <b>${order.paymentMethod}</b>\n` +
    `💰 Amount: <b>₹${order.amount}</b>\n\n` +
    `🔑 Transaction ID (UTR/TxHash):\n<code>${utr}</code>\n\n` +
    `<b>Items:</b>\n${itemsList}`;

  await ctx.telegram.sendMessage(adminChatId, text, {
    parse_mode: 'HTML',
    ...paymentReviewKeyboard(orderId),
  });
}
