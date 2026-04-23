import './globals.css';

export const metadata = {
  title: 'Shop Admin Panel',
  description: 'Manage your Telegram Shop',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
