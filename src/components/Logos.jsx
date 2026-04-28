import React from 'react';

export const MandataMark = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M3 19V5l9 9 9-9v14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" />
    <path d="M3 19h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
  </svg>
);

export const MandataWordmark = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <MandataMark size={20} className="text-ash-100" />
    <span className="font-display tracking-tight text-ash-100 text-[19px] leading-none">mandata</span>
  </span>
);

// Anthropic-style burst mark — three converging rays. Rendered in white/gray for the partner lockup.
export const AnthropicMark = ({ size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M7.5 4 3 20h3.2l1.05-3.6h5.5L13.8 20H17L12.5 4h-5Zm.4 9.6 1.85-6.3 1.85 6.3H7.9Z" fill="currentColor" />
    <path d="M17.4 4 21 20h-3l-3.6-16h3Z" fill="currentColor" />
  </svg>
);

export const AnthropicWordmark = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 ${className}`}>
    <AnthropicMark size={16} />
    <span className="font-display text-[14px] tracking-tight">Anthropic</span>
  </span>
);

export const PartnerLockup = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 text-ash-300 ${className}`}>
    <MandataWordmark className="text-ash-100" />
    <span className="text-ash-500 text-sm">×</span>
    <AnthropicWordmark className="text-ash-200" />
    <span className="text-ash-500 text-sm">×</span>
    <MetaLlamaWordmark className="text-ash-200" />
  </span>
);

// Llama / Meta mark — abstract three-stroke glyph, rendered in white/gray.
export const LlamaMark = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M3.6 6.5c2-2.4 4.6-3.4 7.2-2.8c2.6.6 4.4 2.7 5.1 5.6c.7 2.9-.1 5.6-2 7.4c-1.9 1.7-4.5 2.2-7 1.3c-2.5-.9-4.2-3-4.6-5.7c-.4-2.7.4-4 1.3-5.8Zm6.6 1.4c-.9 0-1.6.7-1.6 1.6S9.3 11 10.2 11s1.6-.7 1.6-1.6s-.7-1.5-1.6-1.5Zm5 0c-.9 0-1.6.7-1.6 1.6s.7 1.5 1.6 1.5s1.6-.7 1.6-1.5s-.7-1.6-1.6-1.6Z"
      fill="currentColor"
    />
  </svg>
);

export const MetaLlamaWordmark = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 ${className}`}>
    <LlamaMark size={16} />
    <span className="font-display text-[14px] tracking-tight">Llama</span>
  </span>
);
