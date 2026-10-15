"use client";

import React, { useState } from 'react';
import { useStore } from '@/context/store-context';
import { ShoppingBag, Search, Sparkles, MapPin, X } from 'lucide-react';

export default function Header() {
  const { 
    settings, 
    searchQuery, 
    setSearchQuery, 
    totalCartItems, 
    cartTotal, 
    setIsCartOpen 
  } = useStore();

  const [showBanner, setShowBanner] = useState(true);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EADBEE]">
      {/* Top Announcement Bar */}
      {showBanner && settings.announcement_banner && (
        <div className="bg-[#9368B7] text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-inner">
          <div className="flex-1 flex items-center justify-center gap-2 text-center truncate">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin flex-shrink-0" style={{ animationDuration: '6s' }} />
            <span className="truncate">{settings.announcement_banner}</span>
          </div>
          <button 
            onClick={() => setShowBanner(false)}
            className="text-white/80 hover:text-white p-0.5 ml-2 transition-colors"
            title="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-tr from-[#9368B7] to-[#C4B5FD] flex items-center justify-center text-white shadow-md shadow-[#9368B7]/20 flex-shrink-0 font-bold text-xl select-none">
            ⭐
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#261C30]">
                {settings.store_name}
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-semibold bg-[#EFE6F7] text-[#9368B7] px-2 py-0.5 rounded-full border border-[#D8C3E5]">
                호시마켓 • Huánuco
              </span>
            </div>
            <p className="text-xs text-[#6B5E78] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#9368B7]" />
              <span className="truncate max-w-[200px] md:max-w-none">{settings.address}</span>
            </p>
          </div>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
          <input
            type="text"
            placeholder="Buscar ramens, melona, snacks, photocards, mangas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white pl-10 pr-4 py-2.5 rounded-full border border-[#EADBEE] text-sm text-[#261C30] placeholder-[#9D91A8] focus:outline-none focus:ring-2 focus:ring-[#9368B7] focus:border-transparent transition-all shadow-sm"
          />
          <Search className="w-4 h-4 text-[#9D91A8] absolute left-3.5 top-3.5" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3 text-[#9D91A8] hover:text-[#261C30]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Floating / Sticky Cart Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 bg-[#9368B7] hover:bg-[#7E52A3] text-white px-3.5 py-2 md:px-4 md:py-2.5 rounded-full shadow-md shadow-[#9368B7]/30 transition-all hover:scale-105 active:scale-95"
            aria-label="Ver carrito"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#FF6B8B] text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-bounce">
                  {totalCartItems}
                </span>
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[10px] uppercase font-bold text-[#EFE6F7] leading-none">Mi Carrito</span>
              <span className="text-xs font-black leading-tight">
                {settings.currency_symbol} {cartTotal.toFixed(2)}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar ramens, helados, mangas, k-pop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white pl-10 pr-9 py-2 rounded-full border border-[#EADBEE] text-xs text-[#261C30] placeholder-[#9D91A8] focus:outline-none focus:ring-2 focus:ring-[#9368B7]"
          />
          <Search className="w-4 h-4 text-[#9D91A8] absolute left-3.5 top-2.5" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-[#9D91A8]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
