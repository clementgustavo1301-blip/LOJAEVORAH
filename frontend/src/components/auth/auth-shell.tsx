'use client';

import React from 'react';
import Link from 'next/link';
import { MotionConfig, motion } from 'motion/react';
import { Logo } from '@/components/ui/logo';
import { ShieldCheck, Package, Heart, MapPin } from 'lucide-react';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const MEMBER_PRIVILEGES = [
  {
    icon: Package,
    title: 'Histórico & Rastreio Integrado',
    description: 'Acompanhe cada etapa de separação, código de rastreio e comprovantes.',
  },
  {
    icon: MapPin,
    title: 'Checkout em Segundos',
    description: 'Seus dados e endereços salvos preenchidos automaticamente na compra.',
  },
  {
    icon: Heart,
    title: 'Favoritos Sincronizados',
    description: 'Acesse sua curadoria pessoal de peças em qualquer dispositivo.',
  },
];

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="w-full flex-1 bg-brand-background py-10 sm:py-16 px-4 sm:px-6 lg:px-10">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-12 border border-brand-border bg-white">
          {/* Painel Obsidian Editorial (Asymmetric 5 cols) */}
          <aside className="hidden lg:flex lg:col-span-5 bg-[#0A0A0A] text-[#FAF9F6] p-10 xl:p-12 flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-brand-gold" />

            <div>
              <Link href="/" className="inline-block mb-10" aria-label="EVORAH Home">
                <Logo variant="horizontal" color="gold" className="[&_svg]:h-8" />
              </Link>

              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-gold block mb-3">
                Área Privada EVORAH
              </span>
              <h2 className="font-serif text-3xl xl:text-[34px] font-normal leading-[1.15] tracking-tight text-white">
                Suas joias, pedidos e garantias em um só lugar.
              </h2>
              <p className="text-xs text-[#A3A7AE] leading-relaxed mt-4">
                Compras anteriores feitas com o mesmo e-mail são vinculadas automaticamente após a confirmação da sua conta.
              </p>

              <ul className="mt-10 space-y-6 border-t border-white/15 pt-8">
                {MEMBER_PRIVILEGES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.title} className="flex items-start gap-3.5">
                      <span className="w-8 h-8 border border-brand-gold/40 bg-white/[0.03] flex items-center justify-center shrink-0 text-brand-gold">
                        <Icon className="w-3.5 h-3.5 stroke-[1.5]" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-white tracking-wide">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-[#A3A7AE] leading-relaxed mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="pt-8 mt-8 border-t border-white/15 flex items-center gap-2 text-[11px] text-[#A3A7AE]">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-gold shrink-0" strokeWidth={1.75} />
              <span>Ambiente criptografado SSL • Privacidade LGPD</span>
            </div>
          </aside>

          {/* Painel de Formulário (7 cols) */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 p-6 sm:p-10 xl:p-12 flex flex-col justify-between"
          >
            <div className="max-w-md w-full mx-auto">
              <div className="mb-8">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-gold block mb-2">
                  {eyebrow}
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl font-normal text-brand-text tracking-tight leading-tight">
                  {title}
                </h1>
                <p className="text-xs text-brand-textMuted mt-2 leading-relaxed">
                  {subtitle}
                </p>
              </div>

              {children}

              {footer && (
                <div className="mt-8 pt-6 border-t border-brand-border text-xs text-brand-textMuted">
                  {footer}
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </MotionConfig>
  );
}
