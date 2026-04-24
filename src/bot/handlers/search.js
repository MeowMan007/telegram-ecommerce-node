import prisma from '../../lib/prisma.js';

export function registerSearchHandler(bot) {
  bot.hears('🔍 Search', async (ctx) => {
    await ctx.reply('🔍 <b>Search Products</b>\n\nType the product name you\'re looking for:', { parse_mode: 'HTML' });
    ctx.session ??= {};
    ctx.session.isSearching = true;
  });

  // Handle text input when in search mode
  bot.on('text', async (ctx, next) => {
    ctx.session ??= {};
    if (!ctx.session.isSearching) return next();
    ctx.session.isSearching = false;

    const query = ctx.message.text.trim();
    if (query.startsWith('/') || ['📦 Catalog', '🛒 Cart', '🔍 Search', '📋 My Orders', '❓ Help'].includes(query)) {
      return next();
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        name: { contains: query, mode: 'insensitive' },
      },
      take: 10,
      include: { category: true },
    });

    if (products.length === 0) {
      return ctx.reply(`😔 No products found for "<b>${query}</b>".\n\nTry a different search term!`, { parse_mode: 'HTML' });
    }

    let text = `🔍 <b>Search results for "${query}":</b>\n\n`;
    const buttons = [];
    for (const p of products) {
      const catName = p.category?.name || 'Uncategorized';
      text += `🏷️ <b>${p.name}</b> — ₹${p.price}\n   📁 ${catName}\n\n`;
      buttons.push([{ text: `🛒 ${p.name} — ₹${p.price}`, callback_data: `prod_plus_${p.id}` }]);
    }

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons },
    });
  });
}
