import { Markup } from 'telegraf';

// Main menu keyboard (persistent reply keyboard)
export function mainMenuKeyboard() {
  return Markup.keyboard([
    ['📦 Catalog', '🛒 Cart'],
    ['🔍 Search', '📋 My Orders'],
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

// Products in a category
export function productKeyboard(product, cartQty = 0) {
  const buttons = [];
  if (cartQty > 0) {
    buttons.push([
      Markup.button.callback('➖', `prod_minus_${product.id}`),
      Markup.button.callback(`${cartQty} pcs`, `prod_qty_${product.id}`),
      Markup.button.callback('➕', `prod_plus_${product.id}`),
    ]);
    buttons.push([
      Markup.button.callback('📦 Catalog', 'back_catalog'),
      Markup.button.callback('🛒 Cart', 'open_cart'),
    ]);
  } else {
    buttons.push([
      Markup.button.callback(
        `💰 ₹${product.price} — Add to Cart`,
        `prod_plus_${product.id}`
      ),
    ]);
  }
  return Markup.inlineKeyboard(buttons);
}

// Product navigation within category
export function productNavKeyboard(product, index, total, cartQty = 0) {
  const rows = [];

  // Add to cart / quantity row
  if (cartQty > 0) {
    rows.push([
      Markup.button.callback('➖', `prod_minus_${product.id}`),
      Markup.button.callback(`${cartQty} pcs`, `prod_qty_${product.id}`),
      Markup.button.callback('➕', `prod_plus_${product.id}`),
    ]);
  } else {
    rows.push([
      Markup.button.callback(
        `💰 Add to Cart — ₹${product.price}`,
        `prod_plus_${product.id}`
      ),
    ]);
  }

  // Navigation row
  if (total > 1) {
    rows.push([
      Markup.button.callback('◀️', `pnav_prev_${product.categoryId}_${index}`),
      Markup.button.callback(`${index + 1}/${total}`, 'noop'),
      Markup.button.callback('▶️', `pnav_next_${product.categoryId}_${index}`),
    ]);
  }

  rows.push([
    Markup.button.callback('📦 Back to Categories', 'back_catalog'),
    Markup.button.callback('🛒 Cart', 'open_cart'),
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
    [Markup.button.callback('💰 Pay via USDT', `pay_usdt_${orderId}`)],
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

// Order history keyboard
export function orderListKeyboard(orders, page, totalPages) {
  const rows = orders.map((o) => {
    const statusIcon =
      o.status === 'COMPLETED' ? '✅' :
      o.status === 'PROCESSED' ? '🔄' :
      o.status === 'CANCELED' ? '❌' :
      o.status === 'WAITING' ? '⏳' : '📦';
    return [
      Markup.button.callback(
        `${statusIcon} #${o.id} — ₹${o.amount} (${o.status})`,
        `order_detail_${o.id}`
      ),
    ];
  });

  // Pagination
  if (totalPages > 1) {
    const navRow = [];
    if (page > 0) navRow.push(Markup.button.callback('◀️ Prev', `orders_page_${page - 1}`));
    navRow.push(Markup.button.callback(`${page + 1}/${totalPages}`, 'noop'));
    if (page < totalPages - 1) navRow.push(Markup.button.callback('Next ▶️', `orders_page_${page + 1}`));
    rows.push(navRow);
  }

  return Markup.inlineKeyboard(rows);
}
