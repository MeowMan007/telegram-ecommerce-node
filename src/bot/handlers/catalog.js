import prisma from '../../lib/prisma.js';
import { categoriesKeyboard, categoryProductsKeyboard } from '../keyboards.js';

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

  // Callback: select category — show ALL products at once
  bot.action(/^cat_(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const categoryId = parseInt(ctx.match[1]);
    await showCategoryProducts(ctx, categoryId);
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

    // Refresh the category product list
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product?.categoryId) {
      await showCategoryProducts(ctx, product.categoryId, true);
    }
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

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product?.categoryId) {
      await showCategoryProducts(ctx, product.categoryId, true);
    }
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

async function showCategoryProducts(ctx, categoryId, edit = false) {
  const products = await prisma.product.findMany({
    where: { categoryId, isActive: true },
    orderBy: { id: 'asc' },
  });

  if (products.length === 0) {
    const msg = '😔 No products in this category yet.';
    if (edit && ctx.callbackQuery) {
      try { await ctx.editMessageText(msg); } catch { await ctx.reply(msg); }
    } else {
      await ctx.reply(msg);
    }
    return;
  }

  const chatId = BigInt(ctx.from.id);

  // Build cart map { productId: quantity }
  const cartItems = await prisma.cart.findMany({ where: { chatId } });
  const cartMap = {};
  for (const ci of cartItems) {
    cartMap[ci.productId] = ci.quantity;
  }

  // Build the product listing text
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  let text = `📁 <b>${category?.name || 'Products'}</b>\n\n`;

  for (const p of products) {
    const qty = cartMap[p.id] || 0;
    text += `🏷️ <b>${p.name}</b>  —  ₹${p.price}\n`;
    text += `${p.description}\n`;
    if (qty > 0) {
      text += `🛒 <i>In cart: ${qty} × ₹${p.price} = ₹${Number(p.price) * qty}</i>\n`;
    }
    text += `\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━\n`;
  text += `✅ <i>Tap a product to add, then go to Cart to checkout!</i>`;

  const keyboard = categoryProductsKeyboard(products, cartMap);

  if (edit && ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: 'HTML', ...keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
    }
  } else {
    await ctx.reply(text, { parse_mode: 'HTML', ...keyboard });
  }
}
