import type { NextConfig } from "next";
import path from "path";
import withBundleAnalyzer from "@next/bundle-analyzer";

const analyzeBundles = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 24,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@supabase/ssr',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'motion',
    ],
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    const prodSpeculationRoutes = isProd
      ? [
          {
            source: '/((?!_next/|api/|speculation\\.json).*)',
            headers: [
              {
                key: 'Speculation-Rules',
                value: '"/speculation.json"',
              },
            ],
          },
        ]
      : [];

    const prodImmutableAssetHeaders = isProd
      ? [
          {
            source: '/:path*\\.(svg|jpg|jpeg|png|webp|avif|mp4|webm|woff2|woff)',
            headers: [
              {
                key: 'Cache-Control',
                value: 'public, max-age=31536000, immutable',
              },
            ],
          },
        ]
      : [];

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://http2.mlstatic.com https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "media-src 'self' https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mercadopago.com https://*.mercadopago.com https://*.mercadolibre.com https://viacep.com.br https://brasilapi.com.br https://challenges.cloudflare.com",
              "frame-src 'self' https://challenges.cloudflare.com https://*.mercadopago.com https://*.mercadopago.com.br https://*.mercadolibre.com",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
      {
        source: '/speculation.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/speculationrules+json; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
      ...prodImmutableAssetHeaders,
      {
        source: '/(admin|checkout|carrinho|rastreio|favoritos|design-system|conta|entrar|cadastro|recuperar-senha|redefinir-senha)(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      {
        source: '/(conta|admin)(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      ...prodSpeculationRoutes,
    ];
  },
};

export default analyzeBundles(nextConfig);
