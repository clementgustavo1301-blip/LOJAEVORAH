'use client';

import React, { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';

export function FooterNewsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  if (subscribed) {
    return (
      <div className="h-11 px-4 bg-brand-background border border-brand-border flex items-center gap-2 text-xs text-brand-text">
        <Check className="w-4 h-4 text-brand-gold shrink-0" />
        <span>Inscrição confirmada na lista EVORAH.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubscribe} className="flex border-b border-brand-text pb-1">
      <input
        id="footer-newsletter"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu e-mail principal"
        className="flex-1 h-9 bg-transparent text-xs text-brand-text placeholder:text-brand-textMuted outline-none"
        required
      />
      <button
        type="submit"
        aria-label="Inscrever-se na newsletter"
        className="h-9 px-2 text-brand-text hover:text-brand-gold text-[11px] font-semibold uppercase tracking-[0.16em] inline-flex items-center gap-1.5 transition-colors"
      >
        <span>Inscrever</span>
        <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
      </button>
    </form>
  );
}

