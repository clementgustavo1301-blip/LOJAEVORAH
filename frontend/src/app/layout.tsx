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

function resolveMetadataBase(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://evorah.com.br';
  try {
    return new URL(raw);
  } catch {
    return new URL('https://evorah.com.br');
  }
}

const SITE_URL = resolveMetadataBase().toString().replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: 'EVORAH EXPERIENCE | Joias em Prata 925 & Aço Cirúrgico 316L',
    template: '%s | EVORAH',
  },
  description:
    'Joias contemporâneas em Prata 925 e Aço Cirúrgico 316L. Correntes, anéis, pulseiras e pingentes à prova d\'água com garantia vitalícia contra oxidação e frete grátis.',
  keywords: [
    'evorah',
    'evorah experience',
    'joias em aço inox 316l',
    'prata 925',
    'correntes masculinas',
    'anéis de aço cirúrgico',
    'joias minimalistas',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'EVORAH EXPERIENCE',
    title: 'EVORAH EXPERIENCE | Joias em Prata 925 & Aço Cirúrgico 316L',
    description:
      'Joalheria contemporânea em Aço Cirúrgico 316L e Prata 925 à prova d\'água, hipoalergênica e com garantia vitalícia.',
    url: '/',
    images: [
      {
        url: '/images/editorial-hand.webp',
        width: 1200,
        height: 800,
        alt: 'EVORAH Joalheria Contemporânea em Prata 925 e Aço Cirúrgico 316L',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EVORAH EXPERIENCE | Joias em Prata 925 & Aço Cirúrgico 316L',
    description:
      'Joias contemporâneas à prova d\'água e hipoalergênicas com garantia vitalícia contra oxidação.',
    images: ['/images/editorial-hand.webp'],
  },
};

const STORE_STRUCTURED_DATA = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'EVORAH EXPERIENCE',
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      email: 'atendimento@evorah.com.br',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'atendimento@evorah.com.br',
        availableLanguage: ['Portuguese'],
        areaServed: 'BR',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'EVORAH EXPERIENCE',
      inLanguage: 'pt-BR',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/produtos?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}).replace(/</g, '\\u003c');

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: STORE_STRUCTURED_DATA }}
        />
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
