import bot from '../lib/bot.js';
import { registerStartHandler } from './handlers/start.js';
import { registerCatalogHandler } from './handlers/catalog.js';
import { registerCartHandler } from './handlers/cart.js';
import { registerHelpHandler } from './handlers/help.js';
import { registerPaymentHandler } from './handlers/payment.js';
import { registerAdminChatHandler } from './handlers/adminChat.js';
import { registerAnnounceHandler } from './handlers/announce.js';

let initialized = false;

export function initBot() {
  if (initialized || !bot) return bot;

  // Register handlers in order (first match wins for text handlers)
  registerStartHandler(bot);
  registerHelpHandler(bot);
  registerAnnounceHandler(bot);

  // Admin chat handler must be before catalog/search to intercept relay messages
  registerAdminChatHandler(bot);

  // Payment handler must be before search to intercept proof photos
  registerPaymentHandler(bot);

  registerCatalogHandler(bot);
  registerCartHandler(bot);

  initialized = true;
  return bot;
}

export default bot;
