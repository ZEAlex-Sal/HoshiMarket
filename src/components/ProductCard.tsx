"use client";

import React, { useState } from 'react';
import { Product, Promotion } from '@/types';
import { useStore } from '@/context/store-context';
import { Star, Plus, Check, Flame, Gift, Sparkles, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProductCardProps {
  product: Product;
  onOpenDetail?: (product: Product) => void;
}

export default function ProductCard({ product, onOpenDetail }: ProductCardProps) {
  const { addToCart, promotions, settings } = useStore();
  const [justAdded, setJustAdded] = useState(false);

  // Find linked promotion
  const promotion: Promotion | undefined = product.promotion_id 
    ? promotions.find(p => p.id === product.promotion_id && p.is_active)
    : undefined;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setJustAdded(true);

    // If it's a promotional item, fire a cute mini confetti burst!
    if (promotion) {
      try {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;
        confetti({
          particleCount: 22,
          spread: 45,
          origin: { x, y },
          colors: ['#9368B7', '#FF6B8B', '#F59E0B', '#C4B5FD'],
          disableForReducedMotion: true,
        });
      } catch {}
    }

    setTimeout(() => {
      setJustAdded(false);
    }, 1200);
  };

  return (
    <div 
      onClick={() => onOpenDetail && onOpenDetail(product)}
      className="group relative bg-white rounded-3xl border border-[#EADBEE] hover:border-[#9368B7]/50 shadow-sm hover:shadow-xl hover:shadow-[#9368B7]/10 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* ======================================================== */}
      {/* PARTE SUPERIOR DEL CARD: ESTRELLA Y AVISO DE PROMOCIÓN */}
      {/* ======================================================== */}
      {promotion ? (
        <div className={`w-full text-white px-3 py-1.5 flex items-center justify-between text-xs font-black tracking-wide shadow-sm animate-pulse-subtle ${
          promotion.season_tag === 'vencimiento'
            ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700'
            : 'bg-gradient-to-r from-[#9368B7] via-[#FF6B8B] to-[#9368B7]'
        }`}>
          <div className="flex items-center gap-1.5 truncate">
            {promotion.season_tag === 'vencimiento' ? (
              <Clock className="w-3.5 h-3.5 text-amber-200 flex-shrink-0" />
            ) : (
              <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300 flex-shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
            )}
            <span className="truncate uppercase text-[11px] font-black">
              {promotion.badge_text || 'EN PROMOCIÓN'}
            </span>
          </div>
          <span className="text-[10px] bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full uppercase flex-shrink-0 font-bold">
            {promotion.type.toUpperCase()}
          </span>
        </div>
      ) : product.is_featured ? (
        <div className="w-full bg-[#EFE6F7] text-[#9368B7] px-3 py-1 flex items-center justify-between text-[11px] font-bold border-b border-[#EADBEE]">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#9368B7]" />
            Favorito de la Tienda
          </span>
          <span className="text-[10px] text-[#6B5E78]">Hoshi Choice</span>
        </div>
      ) : null}

      {/* Image Container with Zoom Effect */}
      <div className="relative aspect-square w-full bg-[#FAF8F5] overflow-hidden flex items-center justify-center p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-contain object-center group-hover:scale-108 transition-transform duration-500"
          loading="lazy"
        />

        {/* Promo Floating Tag on photo (left) */}
        {promotion && (
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            <span className={`inline-flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-black shadow-md border ${
              promotion.season_tag === 'vencimiento'
                ? 'text-amber-700 border-amber-300'
                : 'text-[#FF6B8B] border-[#FF6B8B]/20'
            }`}>
              {promotion.season_tag === 'vencimiento' ? (
                <Clock className="w-3 h-3 text-amber-600" />
              ) : (
                <Flame className="w-3 h-3 fill-rose-500 text-rose-500" />
              )}
              {promotion.type === '2x1' ? 'Lleva 2 Paga 1' : promotion.type === '3x2' ? 'Lleva 3 Paga 2' : 'Oferta'}
            </span>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-[#261C30]/75 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-white/90 text-[#261C30] font-black text-xs px-3 py-1.5 rounded-full uppercase tracking-wider shadow">
              Agotado Temporalmente
            </span>
          </div>
        )}
      </div>

      {/* Product Content & Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          {/* Category & Korean Subtitle */}
          <div className="flex items-center justify-between text-[11px] text-[#867894]">
            <span className="font-semibold uppercase tracking-wider">
              {product.category_name || 'Coreano'}
            </span>
            {product.korean_name && (
              <span className="font-medium text-[#9368B7] bg-[#EFE6F7] px-1.5 py-0.2 rounded text-[10px]">
                {product.korean_name}
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-sm md:text-base text-[#261C30] leading-snug line-clamp-2 group-hover:text-[#9368B7] transition-colors">
            {product.name}
          </h3>

          {/* Description snippet */}
          <p className="text-xs text-[#6B5E78] line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price and Add Button */}
        <div className="pt-2 border-t border-[#F3EDF8] flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg md:text-xl font-black text-[#261C30]">
                {settings.currency_symbol} {product.price.toFixed(2)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-xs text-[#9D91A8] line-through font-semibold">
                  {settings.currency_symbol} {product.original_price.toFixed(2)}
                </span>
              )}
            </div>
            {product.unit && (
              <span className="text-[10px] text-[#867894] font-medium block">
                por {product.unit}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            disabled={!product.in_stock}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all duration-200 shadow-sm ${
              !product.in_stock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-500 text-white scale-105'
                : 'bg-[#9368B7] hover:bg-[#7E52A3] text-white hover:scale-105 active:scale-95 shadow-[#9368B7]/20'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>¡Listo!</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
