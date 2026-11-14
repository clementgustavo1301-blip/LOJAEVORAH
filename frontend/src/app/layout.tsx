import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { CartProvider } from '@/context/cart-context';
import { TopBar } from '@/components/layout/top-bar';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MiniCartHost } from '@/components/cart/mini-cart-host';
import { NavigationProgress } from '@/components/layout/navigation-progress';

const manrope = localFont({
  src: './fonts/manrope-latin.woff2',
  variable: '--font-manrope',
  weight: '300 700',
  display: 'swap',
});

const cormorant = localFont({
  src: './fonts/cormorant-garamond-latin.woff2',
  variable: '--font-serif',
  weight: '400 700',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EVORAH EXPERIENCE | Joias em Prata 925 & Aço 316L',
  description:
    'Joias contemporâneas em Prata 925 e Aço Cirúrgico 316L. Correntes, anéis, pulseiras e pingentes à prova d\'água com frete grátis.',
  keywords: [
    'evorah',
    'evorah experience',
    'joias em aço inox',
    'prata 925',
    'correntes masculinas',
    'anéis de aço cirúrgico',
    'joias minimalistas',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${cormorant.variable}`}
    >
      <body className="bg-brand-background text-brand-text min-h-screen flex flex-col antialiased selection:bg-brand-gold selection:text-brand-text">
        <CartProvider>
          <NavigationProgress />
          <TopBar />
          <Header />
          <MiniCartHost />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
