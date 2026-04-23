export function registerHelpHandler(bot) {
  bot.hears('❓ Help', async (ctx) => {
    await sendHelp(ctx);
  });

  bot.command('help', async (ctx) => {
    await sendHelp(ctx);
  });
}

async function sendHelp(ctx) {
  const text =
    `❓ <b>Help & Commands</b>\n\n` +
    `Here's what I can do:\n\n` +
    `📦 <b>Catalog</b> — Browse products by category\n` +
    `🛒 <b>Cart</b> — View and manage your cart\n` +
    `🔍 <b>Search</b> — Find products by name\n` +
    `📋 <b>My Orders</b> — Track your order history\n\n` +
    `<b>How to order:</b>\n` +
    `1️⃣ Browse the catalog and add items to cart\n` +
    `2️⃣ Go to cart and tap <b>Checkout</b>\n` +
    `3️⃣ Enter your delivery details\n` +
    `4️⃣ Choose payment method (UPI or USDT)\n` +
    `5️⃣ Send payment and upload proof screenshot\n` +
    `6️⃣ Wait for verification (a few hours)\n` +
    `7️⃣ Your order will be processed! ✅\n\n` +
    `<b>Commands:</b>\n` +
    `/start — Restart the bot\n` +
    `/myorders — View your orders\n` +
    `/help — Show this help message\n\n` +
    `Need support? Our admin will reach out to you through this bot! 💬`;

  await ctx.reply(text, { parse_mode: 'HTML' });
}
