"use client";

import React, { useState } from 'react';
import { Product, Promotion } from '@/types';
import { useStore } from '@/context/store-context';
import { X, Plus, Minus, Star, Flame, Sparkles, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { addToCart, promotions, settings } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const promotion: Promotion | undefined = product.promotion_id 
    ? promotions.find(p => p.id === product.promotion_id && p.is_active)
    : undefined;

  const handleAddToCart = (e: React.MouseEvent) => {
    addToCart(product, quantity);
    setAdded(true);

    if (promotion) {
      try {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { x, y },
          colors: ['#9368B7', '#FF6B8B', '#F59E0B']
        });
      } catch {}
    }

    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#261C30]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#EADBEE] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-[#EADBEE] flex items-center justify-center text-[#6B5E78] hover:text-[#261C30] hover:bg-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Promo Announcement if active */}
        {promotion && (
          <div className="bg-gradient-to-r from-[#9368B7] via-[#FF6B8B] to-[#9368B7] text-white px-4 py-2 text-xs font-black flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-300 fill-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
              {promotion.badge_text}
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase">
              {promotion.name}
            </span>
          </div>
        )}

        {/* Product Image */}
        <div className="relative aspect-video w-full bg-[#FAF8F5] p-6 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full object-contain filter drop-shadow-md"
          />
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#867894] mb-1">
              <span className="font-bold uppercase tracking-wider text-[#9368B7]">
                {product.category_name}
              </span>
              {product.code && (
                <span>• SKU: {product.code}</span>
              )}
            </div>

            <h2 className="text-xl font-black text-[#261C30] leading-tight">
              {product.name}
            </h2>

            {product.korean_name && (
              <p className="text-sm font-semibold text-[#9368B7] mt-0.5">
                {product.korean_name}
              </p>
            )}
          </div>

          <p className="text-xs md:text-sm text-[#6B5E78] leading-relaxed">
            {product.description}
          </p>

          {/* Promotional Description Info */}
          {promotion && (
            <div className="bg-[#FAF4FC] border border-[#EADBEE] rounded-2xl p-3 flex items-start gap-2 text-xs">
              <Flame className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#261C30] block">
                  Regla de la promoción:
                </span>
                <span className="text-[#6B5E78]">
                  {promotion.description || 'Aplica automáticamente al agregar las cantidades requeridas al carrito.'}
                </span>
              </div>
            </div>
          )}

          {/* Price, Stepper and CTA */}
          <div className="pt-3 border-t border-[#F3EDF8] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-2xl font-black text-[#261C30]">
                {settings.currency_symbol} {(product.price * quantity).toFixed(2)}
              </span>
              <span className="text-xs text-[#867894] block">
                ({settings.currency_symbol} {product.price.toFixed(2)} / {product.unit || 'unidad'})
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Stepper */}
              <div className="flex items-center border border-[#EADBEE] rounded-xl p-1 bg-[#FAF8F5]">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#544660] hover:bg-white"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-sm text-[#261C30]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#544660] hover:bg-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!product.in_stock}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                  !product.in_stock
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : added
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#9368B7] hover:bg-[#7E52A3] text-white shadow-lg shadow-[#9368B7]/30'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Agregado!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Agregar al Pedido</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
