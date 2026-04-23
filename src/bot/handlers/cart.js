import prisma from '../../lib/prisma.js';
import { cartKeyboard } from '../keyboards.js';

const cartPages = new Map();

export function registerCartHandler(bot) {
  bot.hears('🛒 Cart', async (ctx) => {
    cartPages.set(ctx.from.id, 0);
    await showCart(ctx, false);
  });

  bot.action('open_cart', async (ctx) => {
    await ctx.answerCbQuery();
    cartPages.set(ctx.from.id, 0);
    await showCart(ctx, false);
  });

  bot.action('cart_prev', async (ctx) => {
    await ctx.answerCbQuery();
    const items = await getCartItems(ctx.from.id);
    const page = cartPages.get(ctx.from.id) || 0;
    cartPages.set(ctx.from.id, page <= 0 ? items.length - 1 : page - 1);
    await showCart(ctx, true);
  });

  bot.action('cart_next', async (ctx) => {
    await ctx.answerCbQuery();
    const items = await getCartItems(ctx.from.id);
    const page = cartPages.get(ctx.from.id) || 0;
    cartPages.set(ctx.from.id, page >= items.length - 1 ? 0 : page + 1);
    await showCart(ctx, true);
  });

  bot.action(/^cart_plus_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const chatId = BigInt(ctx.from.id);
    const productId = parseInt(ctx.match[1]);
    await prisma.cart.update({
      where: { chatId_productId: { chatId, productId } },
      data: { quantity: { increment: 1 } },
    });
    await showCart(ctx, true);
  });

  bot.action(/^cart_minus_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const chatId = BigInt(ctx.from.id);
    const productId = parseInt(ctx.match[1]);
    const item = await prisma.cart.findUnique({
      where: { chatId_productId: { chatId, productId } },
    });
    if (item && item.quantity <= 1) {
      await prisma.cart.delete({ where: { chatId_productId: { chatId, productId } } });
    } else if (item) {
      await prisma.cart.update({
        where: { chatId_productId: { chatId, productId } },
        data: { quantity: { decrement: 1 } },
      });
    }
    const items = await getCartItems(ctx.from.id);
    const page = cartPages.get(ctx.from.id) || 0;
    if (page >= items.length && items.length > 0) cartPages.set(ctx.from.id, items.length - 1);
    await showCart(ctx, true);
  });

  bot.action(/^cart_del_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery('Removed 🗑️');
    const chatId = BigInt(ctx.from.id);
    const productId = parseInt(ctx.match[1]);
    await prisma.cart.deleteMany({ where: { chatId, productId } });
    const items = await getCartItems(ctx.from.id);
    const page = cartPages.get(ctx.from.id) || 0;
    if (page >= items.length && items.length > 0) cartPages.set(ctx.from.id, items.length - 1);
    await showCart(ctx, true);
  });
}

async function getCartItems(userId) {
  const chatId = BigInt(userId);
  const carts = await prisma.cart.findMany({ where: { chatId }, orderBy: { id: 'asc' } });
  const items = [];
  for (const c of carts) {
    const product = await prisma.product.findUnique({ where: { id: c.productId } });
    if (product) {
      items.push({ ...c, name: product.name, price: product.price, description: product.description });
    }
  }
  return items;
}

async function showCart(ctx, edit = false) {
  const items = await getCartItems(ctx.from.id);
  if (items.length === 0) {
    const t = '🛒 Your cart is empty.\n\nBrowse the 📦 Catalog to add items!';
    if (edit && ctx.callbackQuery) { try { return await ctx.editMessageText(t); } catch {} }
    return ctx.reply(t);
  }
  const page = cartPages.get(ctx.from.id) || 0;
  const item = items[page];
  const totalPrice = items.reduce((s, ci) => s + Number(ci.price) * ci.quantity, 0);
  const text =
    `🛒 <b>Your Cart</b>\n\n` +
    `🏷️ <b>${item.name}</b>\n${item.description}\n\n` +
    `💰 ₹${item.price} × ${item.quantity} = <b>₹${Number(item.price) * item.quantity}</b>\n\n` +
    `📊 Total: <b>${items.length} items</b> — <b>₹${totalPrice}</b>`;
  const kb = cartKeyboard(items, page);
  if (edit && ctx.callbackQuery) { try { return await ctx.editMessageText(text, { parse_mode: 'HTML', ...kb }); } catch {} }
  return ctx.reply(text, { parse_mode: 'HTML', ...kb });
}
