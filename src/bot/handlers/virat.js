export function registerViratHandler(bot) {
  bot.command('virat', async (ctx) => {
    const adminChatId = process.env.ADMIN_CHAT_ID;
    if (String(ctx.from.id) !== adminChatId) {
      return; // silently ignore non-admin
    }

    await ctx.reply(
      `🔗 <b>Admin Panel</b>\n\n` +
      `https://vercel.com/meowmeowmeow-1c15a7dd/nnkdvnwfmkl`,
      { parse_mode: 'HTML' }
    );
  });
}
