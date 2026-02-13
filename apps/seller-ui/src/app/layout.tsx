import './global.css';
import Providers from './providers';

export const metadata = {
  title: 'Eshop - Seller UI',
  description: 'A seller interface for managing products and orders in the Eshop platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
