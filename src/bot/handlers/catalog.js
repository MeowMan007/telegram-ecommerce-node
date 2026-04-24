import prisma from '../../lib/prisma.js';
import { categoriesKeyboard, productNavKeyboard } from '../keyboards.js';

export function registerCatalogHandler(bot) {
  // Text button: "📦 Catalog"
  bot.hears('📦 Catalog', async (ctx) => {
    await showCategories(ctx);
  });

  // Callback: back to catalog
  bot.action('back_catalog', async (ctx) => {
    await ctx.answerCbQuery();
    await showCategories(ctx);
  });

  // Callback: select category
  bot.action(/^cat_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const categoryId = parseInt(ctx.match[1]);
    await showProductInCategory(ctx, categoryId, 0);
  });

  // Callback: product navigation
  bot.action(/^pnav_(prev|next)_(\d+)_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const direction = ctx.match[1];
    const categoryId = parseInt(ctx.match[2]);
    const currentIndex = parseInt(ctx.match[3]);

    const products = await prisma.product.findMany({
      where: { categoryId, isActive: true },
      orderBy: { id: 'asc' },
    });

    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex <= 0 ? products.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex >= products.length - 1 ? 0 : currentIndex + 1;
    }

    await showProductAtIndex(ctx, products, newIndex, true);
  });

  // Callback: add product to cart
  bot.action(/^prod_plus_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery('Added to cart! 🛒');
    const productId = parseInt(ctx.match[1]);
    const chatId = BigInt(ctx.from.id);

    await prisma.cart.upsert({
      where: { chatId_productId: { chatId, productId } },
      update: { quantity: { increment: 1 } },
      create: { chatId, productId, quantity: 1 },
    });

    // Refresh the product message
    await refreshProductMessage(ctx, productId);
  });

  // Callback: remove product from cart
  bot.action(/^prod_minus_(\d+)$/, async (ctx) => {
    const productId = parseInt(ctx.match[1]);
    const chatId = BigInt(ctx.from.id);

    const cartItem = await prisma.cart.findUnique({
      where: { chatId_productId: { chatId, productId } },
    });

    if (cartItem) {
      if (cartItem.quantity <= 1) {
        await prisma.cart.delete({
          where: { chatId_productId: { chatId, productId } },
        });
        await ctx.answerCbQuery('Removed from cart');
      } else {
        await prisma.cart.update({
          where: { chatId_productId: { chatId, productId } },
          data: { quantity: { decrement: 1 } },
        });
        await ctx.answerCbQuery('Quantity decreased');
      }
    }

    await refreshProductMessage(ctx, productId);
  });

  // Noop for display-only buttons
  bot.action('noop', (ctx) => ctx.answerCbQuery());
}

async function showCategories(ctx) {
  const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });

  if (categories.length === 0) {
    return ctx.reply('📦 No categories available yet. Check back later!');
  }

  await ctx.reply('📁 <b>Choose a category:</b>', {
    parse_mode: 'HTML',
    ...categoriesKeyboard(categories),
  });
}

async function showProductInCategory(ctx, categoryId, index) {
  const products = await prisma.product.findMany({
    where: { categoryId, isActive: true },
    orderBy: { id: 'asc' },
  });

  if (products.length === 0) {
    return ctx.reply('😔 No products in this category yet.');
  }

  await showProductAtIndex(ctx, products, index, false);
}

async function showProductAtIndex(ctx, products, index, edit = false) {
  const product = products[index];
  const chatId = BigInt(ctx.from.id);

  const cartItem = await prisma.cart.findUnique({
    where: { chatId_productId: { chatId, productId: product.id } },
  });
  const cartQty = cartItem?.quantity || 0;

  const text =
    `🏷️ <b>${product.name}</b>\n\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `${product.description}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `💰 Price: <b>₹${product.price}</b>` +
    (cartQty > 0 ? `\n🛒 In cart: ${cartQty} pcs = ₹${Number(product.price) * cartQty}` : '') +
    `\n\n`;

  const keyboard = productNavKeyboard(product, index, products.length, cartQty);

  if (edit && ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
    }
  } else {
    if (product.photoUrl && product.photoUrl.startsWith('http')) {
      try {
        await ctx.replyWithPhoto(product.photoUrl, {
          caption: text,
          parse_mode: 'HTML',
          ...keyboard,
        });
        return;
      } catch { /* fall through to text */ }
    }
    await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }
}

async function refreshProductMessage(ctx, productId) {
  const chatId = BigInt(ctx.from.id);
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true },
  });
  if (!product) return;

  const cartItem = await prisma.cart.findUnique({
    where: { chatId_productId: { chatId, productId } },
  });
  const cartQty = cartItem?.quantity || 0;

  // Find product index in its category
  const products = await prisma.product.findMany({
    where: { categoryId: product.categoryId, isActive: true },
    orderBy: { id: 'asc' },
  });
  const index = products.findIndex((p) => p.id === productId);

  const text =
    `🏷️ <b>${product.name}</b>\n\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `${product.description}\n\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `💰 Price: <b>₹${product.price}</b>` +
    (cartQty > 0 ? `\n🛒 In cart: ${cartQty} pcs = ₹${Number(product.price) * cartQty}` : '') +
    `\n\n`;

  const keyboard = productNavKeyboard(product, index >= 0 ? index : 0, products.length, cartQty);

  try {
    await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard });
  } catch {
    // If can't edit (e.g., photo message), send new
    try {
      await ctx.editMessageCaption(text, { parse_mode: 'HTML', ...keyboard });
    } catch { /* ignore */ }
  }
}
