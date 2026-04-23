import { initBot } from '../../../../bot/index.js';

const bot = initBot();

export async function POST(req) {
  try {
    if (!bot) {
      return Response.json({ error: 'Bot not configured' }, { status: 500 });
    }

    const body = await req.json();
    await bot.handleUpdate(body);

    return Response.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return Response.json({ ok: true }); // Always return 200 to Telegram
  }
}

export async function GET() {
  return Response.json({ status: 'Bot webhook is active' });
}
