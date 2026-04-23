const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Admin',
      username: 'admin',
      password: hashedPassword,
      isActive: true,
      role: 'ADMIN',
    },
  });

  // Create default bot settings
  await prisma.botSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      upiId: '',
      usdtAddress: '',
      usdtNetwork: 'TRC20',
    },
  });

  // Create sample categories
  const electronics = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Electronics' },
  });

  const clothing = await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'Clothing' },
  });

  const accessories = await prisma.category.upsert({
    where: { id: 3 },
    update: {},
    create: { name: 'Accessories' },
  });

  // Create sample products
  const products = [
    {
      categoryId: electronics.id,
      photoUrl: 'https://via.placeholder.com/300x200/1a1a2e/e94560?text=Wireless+Earbuds',
      name: 'Wireless Earbuds Pro',
      description: 'Premium wireless earbuds with noise cancellation and 24hr battery life.',
      price: BigInt(2999),
    },
    {
      categoryId: electronics.id,
      photoUrl: 'https://via.placeholder.com/300x200/1a1a2e/e94560?text=Smart+Watch',
      name: 'Smart Watch X1',
      description: 'Fitness tracking, heart rate monitor, AMOLED display.',
      price: BigInt(4999),
    },
    {
      categoryId: clothing.id,
      photoUrl: 'https://via.placeholder.com/300x200/16213e/0f3460?text=Premium+Hoodie',
      name: 'Premium Hoodie',
      description: 'Ultra-soft cotton blend hoodie. Available in all sizes.',
      price: BigInt(1499),
    },
    {
      categoryId: clothing.id,
      photoUrl: 'https://via.placeholder.com/300x200/16213e/0f3460?text=Graphic+Tee',
      name: 'Graphic T-Shirt',
      description: 'Limited edition graphic tee. 100% organic cotton.',
      price: BigInt(799),
    },
    {
      categoryId: accessories.id,
      photoUrl: 'https://via.placeholder.com/300x200/1a1a2e/e94560?text=Leather+Wallet',
      name: 'Leather Wallet',
      description: 'Genuine leather bifold wallet with RFID protection.',
      price: BigInt(999),
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: products.indexOf(product) + 1 },
      update: {},
      create: product,
    });
  }

  // Create default messages
  const messages = [
    {
      name: 'START_MESSAGE',
      description: 'Welcome message shown on /start',
      text: '👋 Welcome to our shop!\n\nBrowse our catalog, add items to cart, and checkout with UPI or USDT.\n\nUse the menu buttons below to get started!',
    },
    {
      name: 'ORDER_CREATED_MESSAGE',
      description: 'Message shown after order is created',
      text: '✅ Your order has been created successfully!\n\nWe will process it shortly. You can track your orders using 📋 My Orders.',
    },
  ];

  for (const msg of messages) {
    await prisma.message.upsert({
      where: { name: msg.name },
      update: {},
      create: msg,
    });
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
