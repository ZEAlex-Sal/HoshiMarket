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

  // Find linked promotion (either assigned via promotion_id or included in a non-combo promotion's product_ids)
  const promotion: Promotion | undefined = promotions.find(
    p =>
      p.is_active &&
      (p.id === product.promotion_id ||
        (p.type !== 'combo' && p.product_ids?.includes(product.id)))
  );

  const isLiquidacionStyle = Boolean(
    promotion &&
      (promotion.visual_style === 'liquidacion' ||
        promotion.season_tag === 'vencimiento' ||
        promotion.season_tag === 'liquidacion')
  );

  const buyN =
    promotion && (promotion.type === '2x1' || promotion.type === '3x2')
      ? promotion.buy_qty && promotion.buy_qty >= 2
        ? promotion.buy_qty
        : promotion.type === '3x2'
        ? 3
        : 2
      : 2;

  const hasPercentDiscount =
    promotion &&
    promotion.type === 'discount_percent' &&
    promotion.discount_value &&
    promotion.discount_value > 0 &&
    !product.id.startsWith('combo-');

  const displayPrice = hasPercentDiscount
    ? product.price * (1 - (promotion?.discount_value || 0) / 100)
    : product.price;

  const displayOriginalPrice = hasPercentDiscount
    ? product.price
    : product.original_price;

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

  // Determine 3-tier stock status: 'available' | 'low' | 'out'
  const stockLevel: 'available' | 'low' | 'out' = !product.in_stock || product.stock_quantity === 0
    ? 'out'
    : product.stock_quantity !== undefined && product.stock_quantity <= 5
    ? 'low'
    : 'available';

  const isOut = stockLevel === 'out';

  return (
    <div 
      onClick={() => onOpenDetail && onOpenDetail(product)}
      className={`group relative rounded-3xl border transition-all duration-300 flex flex-col overflow-hidden cursor-pointer ${
        isOut
          ? 'bg-gray-100/90 border-gray-200/90 opacity-80 shadow-none'
          : 'bg-white border-[#EADBEE] hover:border-[#9368B7]/50 shadow-sm hover:shadow-xl hover:shadow-[#9368B7]/10'
      }`}
    >
      {/* ======================================================== */}
      {/* PARTE SUPERIOR DEL CARD: ALTURA UNIFORME PARA TODAS LAS TARJETAS */}
      {/* ======================================================== */}
      <div className="h-7 w-full flex-shrink-0 flex items-center">
        {isOut ? (
          <div className="w-full h-full bg-gray-200/80 text-gray-500 px-3 flex items-center justify-between text-[10px] font-bold border-b border-gray-200">
            <span className="uppercase tracking-wider text-[9px] truncate">
              {product.category_name || 'Hoshi Market'}
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] text-rose-600 font-extrabold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              SIN STOCK
            </span>
          </div>
        ) : promotion ? (
          <div className={`w-full h-full text-white px-3 flex items-center justify-between text-xs font-black tracking-wide shadow-sm animate-pulse-subtle ${
            isLiquidacionStyle
              ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700'
              : 'bg-gradient-to-r from-[#9368B7] via-[#FF6B8B] to-[#9368B7]'
          }`}>
            <div className="flex items-center gap-1.5 truncate">
              {isLiquidacionStyle ? (
                <Clock className="w-3 h-3 text-amber-200 flex-shrink-0" />
              ) : (
                <Star className="w-3 h-3 text-amber-300 fill-amber-300 flex-shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
              )}
              <span className="truncate uppercase text-[10px] font-black">
                {promotion.badge_text || 'EN PROMOCIÓN'}
              </span>
            </div>
            <span className="text-[9px] bg-white/20 backdrop-blur-xs px-1.5 py-0.2 rounded-full uppercase flex-shrink-0 font-bold">
              {promotion.type === '2x1' || promotion.type === '3x2'
                ? `${buyN}X${buyN - 1}`
                : promotion.type === 'discount_percent'
                ? `-${promotion.discount_value}%`
                : 'PACK'}
            </span>
          </div>
        ) : product.is_featured ? (
          <div className="w-full h-full bg-[#EFE6F7] text-[#9368B7] px-3 flex items-center justify-between text-[10px] font-bold border-b border-[#EADBEE]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#9368B7]" />
              Favorito de la Tienda
            </span>
            <span className="text-[9px] text-[#6B5E78]">Hoshi Choice</span>
          </div>
        ) : (
          <div className="w-full h-full bg-[#FAF8F5] text-[#867894] px-3 flex items-center justify-between text-[10px] font-medium border-b border-[#F3EDF8]">
            <span className="font-semibold text-[#9368B7] uppercase tracking-wider text-[9px]">
              {product.category_name || 'Hoshi Market'}
            </span>
            <span className="text-[9px] text-[#9D91A8]">Original</span>
          </div>
        )}
      </div>

      {/* Image Container with Zoom Effect */}
      <div className={`relative aspect-square w-full overflow-hidden flex items-center justify-center p-3 ${
        isOut ? 'bg-gray-100' : 'bg-[#FAF8F5]'
      }`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url}
          alt={product.name}
          className={`w-full h-full object-contain object-center transition-transform duration-500 ${
            isOut ? 'grayscale opacity-55' : 'group-hover:scale-108'
          }`}
          loading="lazy"
        />

        {/* Stock Status Pill (Top-Right) with Green / Orange / Red dot */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {stockLevel === 'available' && (
            <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 border border-emerald-200 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Disponible</span>
            </span>
          )}
          {stockLevel === 'low' && (
            <span className="inline-flex items-center gap-1.5 bg-amber-50/95 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-800 border border-amber-300 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Pocas unidades</span>
            </span>
          )}
          {stockLevel === 'out' && (
            <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] font-bold text-rose-700 border border-rose-200 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Agotado</span>
            </span>
          )}
        </div>

        {/* Promo Floating Tag on photo (left) */}
        {promotion && !isOut && (
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            <span className={`inline-flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-black shadow-md border ${
              isLiquidacionStyle
                ? 'text-amber-700 border-amber-300'
                : 'text-[#FF6B8B] border-[#FF6B8B]/20'
            }`}>
              {isLiquidacionStyle ? (
                <Clock className="w-3 h-3 text-amber-600" />
              ) : promotion.type === 'combo' ? (
                <Gift className="w-3 h-3 text-[#9368B7]" />
              ) : (
                <Flame className="w-3 h-3 fill-rose-500 text-rose-500" />
              )}
              {promotion.type === '2x1' || promotion.type === '3x2'
                ? `Lleva ${buyN} Paga ${buyN - 1}`
                : promotion.type === 'discount_percent'
                ? `Oferta -${promotion.discount_value}%`
                : 'Pack Combo'}
            </span>
          </div>
        )}

        {/* Out of Stock Center Ribbon */}
        {isOut && (
          <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-gray-800/90 text-white font-black text-[11px] px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Product Content & Details */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
        <div className="space-y-1.5">
          {/* Category & Korean Subtitle */}
          <div className="h-4 flex items-center justify-between text-[10px] text-[#867894] overflow-hidden">
            <span className={`font-semibold uppercase tracking-wider truncate max-w-[120px] ${isOut ? 'text-gray-400' : ''}`}>
              {product.category_name || 'Coreano'}
            </span>
            {product.korean_name && (
              <span className={`font-medium px-1.5 py-0.2 rounded text-[9px] truncate max-w-[100px] ${
                isOut ? 'text-gray-500 bg-gray-200/70' : 'text-[#9368B7] bg-[#EFE6F7]'
              }`}>
                {product.korean_name}
              </span>
            )}
          </div>

          {/* Product Name (Uniform 2-line height) */}
          <h3 className={`h-10 font-bold text-xs sm:text-sm leading-snug line-clamp-2 transition-colors flex items-start ${
            isOut ? 'text-gray-500' : 'text-[#261C30] group-hover:text-[#9368B7]'
          }`}>
            {product.name}
          </h3>

          {/* Description snippet (Uniform 2-line height) */}
          <p className={`h-8 text-[11px] line-clamp-2 leading-snug overflow-hidden ${
            isOut ? 'text-gray-400' : 'text-[#6B5E78]'
          }`}>
            {product.description}
          </p>
        </div>

        {/* Price and Add Button */}
        <div className={`pt-2 border-t flex items-center justify-between gap-2 ${
          isOut ? 'border-gray-200' : 'border-[#F3EDF8]'
        }`}>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-base sm:text-lg font-black ${isOut ? 'text-gray-400' : 'text-[#261C30]'}`}>
                {settings.currency_symbol} {displayPrice.toFixed(2)}
              </span>
              {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                <span className="text-[10px] text-[#9D91A8] line-through font-semibold">
                  {settings.currency_symbol} {displayOriginalPrice.toFixed(2)}
                </span>
              )}
            </div>
            {product.unit && (
              <span className={`text-[10px] font-medium block truncate max-w-[100px] ${
                isOut ? 'text-gray-400' : 'text-[#867894]'
              }`}>
                {product.unit}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            disabled={isOut}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all duration-200 shadow-sm ${
              isOut
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
                : justAdded
                ? 'bg-emerald-500 text-white scale-105'
                : 'bg-[#9368B7] hover:bg-[#7E52A3] text-white hover:scale-105 active:scale-95 shadow-[#9368B7]/20'
            }`}
          >
            {isOut ? (
              <span>Agotado</span>
            ) : justAdded ? (
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
