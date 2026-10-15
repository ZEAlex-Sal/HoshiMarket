"use client";

import React from 'react';
import { useStore } from '@/context/store-context';
import { MapPin, Phone, Heart } from 'lucide-react';

export default function Footer() {
  const { settings } = useStore();

  return (
    <footer className="w-full bg-white border-t border-[#EADBEE] mt-16 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#F3EDF8]">
          {/* Brand & Bio */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFF9F2] p-1 border border-[#EADBEE] flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Hoshi Market" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-black text-[#261C30] tracking-tight">
                {settings.store_name}
              </span>
              <span className="text-xs font-bold text-[#9368B7] bg-[#EFE6F7] px-2 py-0.5 rounded-full">
                호시마켓
              </span>
            </div>
            <p className="text-xs md:text-sm text-[#6B5E78] max-w-sm leading-relaxed">
              Tu rincón favorito en Huánuco para ramens virales, paletas Melona, snacks tradicionales, bebidas coreanas, mangas y los mejores artículos de K-pop.
            </p>
            <p className="text-xs text-[#867894] font-medium">
              🥢 Productos 100% originales importados de Corea y Japón.
            </p>
          </div>

          {/* Location & Hours */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-[#261C30] uppercase tracking-wider">
              Encuéntranos en Local
            </h4>
            <div className="space-y-1.5 text-xs text-[#6B5E78]">
              <p className="flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-[#9368B7] flex-shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </p>
              <p className="text-[11px] text-[#867894] pl-5">
                Huánuco, Perú (a pocas cuadras de la plaza principal)
              </p>
              <div className="pt-2">
                <span className="font-bold text-[#261C30] block">Horarios de atención:</span>
                <span>Lun - Dom: 9:30 AM a 2:00 PM y 3:00 PM a 8:30 PM</span>
              </div>
            </div>
          </div>

          {/* Social & Contact */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-[#261C30] uppercase tracking-wider">
              Contacto y Redes
            </h4>
            <div className="space-y-2 text-xs">
              <a 
                href={`https://wa.me/${settings.whatsapp_number}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-[#6B5E78] hover:text-[#9368B7] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#9368B7]" />
                <span>WhatsApp: {settings.phone_display}</span>
              </a>

              <a 
                href="https://www.instagram.com/hoshihco/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-[#6B5E78] hover:text-[#9368B7] transition-colors"
              >
                <svg className="w-4 h-4 text-[#9368B7] fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              <div className="pt-2">
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold inline-block">
                  🛵 Delivery disponible en Huánuco
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#867894] gap-3">
          <p className="flex items-center gap-1">
            © 2026 {settings.store_name}. Hecho con 
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> para los fans del K-lifestyle.
          </p>
          <p className="text-[11px] text-[#9D91A8]">
            Jr. Crespo Castillo 614 • Huánuco
          </p>
        </div>
      </div>
    </footer>
  );
}
