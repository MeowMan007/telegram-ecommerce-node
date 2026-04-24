import bot from '../../../lib/bot.js';

export async function GET(req) {
  try {
    if (!bot) {
      return Response.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 500 });
    }

    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const appUrl = process.env.APP_URL || `${protocol}://${host}`;
    const webhookUrl = `${appUrl}/api/bot/webhook`;

    // Set webhook
    await bot.telegram.setWebhook(webhookUrl);

    // Set bot commands menu
    await bot.telegram.setMyCommands([
      { command: 'start', description: 'Start the bot' },
      { command: 'myorders', description: 'View your orders' },
      { command: 'help', description: 'Show help' },
    ]);

    return Response.json({
      success: true,
      webhookUrl,
      message: 'Webhook set successfully! Bot is ready.',
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
