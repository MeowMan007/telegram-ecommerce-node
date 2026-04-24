import { Telegraf, session } from 'telegraf';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

let bot;

if (!BOT_TOKEN) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN not set');
} else {
  const globalForBot = globalThis;
  if (!globalForBot._bot) {
    bot = new Telegraf(BOT_TOKEN);
    bot.use(session());
    if (process.env.NODE_ENV !== 'production') globalForBot._bot = bot;
  } else {
    bot = globalForBot._bot;
  }
}

export default bot;

// Helper to send a message via the Telegram API directly (for use outside bot context)
export async function sendTelegramMessage(chatId, text, extra = {}) {
  if (!bot) return;
  try {
    return await bot.telegram.sendMessage(chatId, text, { parse_mode: 'HTML', ...extra });
  } catch (err) {
    console.error(`Failed to send message to ${chatId}:`, err.message);
    return null;
  }
}

export async function sendTelegramPhoto(chatId, photo, caption = '', extra = {}) {
  if (!bot) return;
  try {
    return await bot.telegram.sendPhoto(chatId, photo, { caption, parse_mode: 'HTML', ...extra });
  } catch (err) {
    console.error(`Failed to send photo to ${chatId}:`, err.message);
    return null;
  }
}

export async function forwardTelegramMessage(chatId, fromChatId, messageId) {
  if (!bot) return;
  try {
    return await bot.telegram.forwardMessage(chatId, fromChatId, messageId);
  } catch (err) {
    console.error(`Failed to forward message:`, err.message);
    return null;
  }
}
