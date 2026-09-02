import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phone?: string;
  siteName: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ phone, siteName }) => {
  const cleanPhone = (phone || '').replace(/[^\d]/g, '');
  if (!cleanPhone) return null;

  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hi sandip, I found your wedding portfolio and would love to check availability for our wedding!`
  )}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      id="floating-whatsapp-btn"
      className="fixed right-6 bottom-6 z-40 w-13 h-13 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl hover:scale-105 hover:bg-emerald-600 transition-all duration-300 group"
      aria-label="Chat on WhatsApp"
      title="Direct WhatsApp Chat"
    >
      <MessageCircle className="w-6 h-6 fill-white/20" />
      <span className="absolute right-15 px-3.5 py-1.5 rounded-full bg-black text-white text-[10px] uppercase tracking-widest font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg border border-gray-800">
        Chat on WhatsApp
      </span>
    </a>
  );
};
