import { Markup } from 'telegraf';

// Main menu keyboard (persistent reply keyboard)
export function mainMenuKeyboard() {
  return Markup.keyboard([
    ['📦 Catalog', '🛒 Cart'],
    ['❓ Help'],
  ]).resize();
}

// Category list as inline keyboard
export function categoriesKeyboard(categories) {
  const buttons = categories.map((cat) => [
    Markup.button.callback(`📁 ${cat.name}`, `cat_${cat.id}`),
  ]);
  return Markup.inlineKeyboard(buttons);
}

// All products in a category shown at once — each gets +/- buttons
export function categoryProductsKeyboard(products, cartMap = {}) {
  const rows = [];
  for (const p of products) {
    const qty = cartMap[p.id] || 0;
    if (qty > 0) {
      rows.push([
        Markup.button.callback('➖', `prod_minus_${p.id}`),
        Markup.button.callback(`${qty} × ${p.name}`, 'noop'),
        Markup.button.callback('➕', `prod_plus_${p.id}`),
      ]);
    } else {
      rows.push([
        Markup.button.callback(`₹${p.price} — ${p.name}`, `prod_plus_${p.id}`),
      ]);
    }
  }

  // Bottom navigation
  rows.push([
    Markup.button.callback('📦 Back to Categories', 'back_catalog'),
    Markup.button.callback('🛒 Go to Cart', 'open_cart'),
  ]);

  return Markup.inlineKeyboard(rows);
}

// Cart item keyboard
export function cartKeyboard(cartItems, currentIndex) {
  const item = cartItems[currentIndex];
  const total = cartItems.length;
  const rows = [];

  // Quantity controls
  rows.push([
    Markup.button.callback('🗑️', `cart_del_${item.productId}`),
    Markup.button.callback('➖', `cart_minus_${item.productId}`),
    Markup.button.callback(`${item.quantity} pcs`, 'noop'),
    Markup.button.callback('➕', `cart_plus_${item.productId}`),
  ]);

  // Pagination
  if (total > 1) {
    rows.push([
      Markup.button.callback('◀️', 'cart_prev'),
      Markup.button.callback(`${currentIndex + 1}/${total}`, 'noop'),
      Markup.button.callback('▶️', 'cart_next'),
    ]);
  }

  // Checkout
  const totalPrice = cartItems.reduce(
    (sum, ci) => sum + Number(ci.price) * ci.quantity,
    0
  );
  rows.push([
    Markup.button.callback(
      `🛍️ Checkout — ₹${totalPrice}`,
      'checkout_start'
    ),
  ]);

  return Markup.inlineKeyboard(rows);
}

// Payment method selection
export function paymentMethodKeyboard(orderId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('💳 Pay via UPI (INR)', `pay_upi_${orderId}`)],
    [Markup.button.callback('💰 Pay via USDT (Binance)', `pay_usdt_${orderId}`)],
  ]);
}

// Admin: approve/reject payment
export function paymentReviewKeyboard(orderId) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Approve', `approve_${orderId}`),
      Markup.button.callback('❌ Reject', `reject_${orderId}`),
    ],
    [
      Markup.button.callback('💬 Reply to Customer', `reply_${orderId}`),
    ],
  ]);
}

// Noop handler — used for display-only buttons
export function noop() {}
