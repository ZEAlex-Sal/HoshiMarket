"use client";

import React, { useState, useMemo } from 'react';
import { useStore } from '@/context/store-context';
import { Product } from '@/types';
import Header from '@/components/Header';
import CategoryFilter from '@/components/CategoryFilter';
import ProductCard from '@/components/ProductCard';
import ProductDetailModal from '@/components/ProductDetailModal';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import { Sparkles, Flame, SearchX } from 'lucide-react';

export default function Home() {
  const { 
    products, 
    categories, 
    promotions, 
    selectedCategory, 
    selectedSeason, 
    searchQuery, 
    setSearchQuery,
    settings 
  } = useStore();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesKorean = product.korean_name?.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        const matchesCat = product.category_name?.toLowerCase().includes(query);
        const matchesCode = product.code?.toLowerCase().includes(query);
        if (!matchesName && !matchesKorean && !matchesDesc && !matchesCat && !matchesCode) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'todos') {
        if (product.category_id !== selectedCategory) {
          return false;
        }
      }

      // 3. Seasonal Campaign & Promo Filter
      if (selectedSeason !== 'todos') {
        const promo = promotions.find(p => p.id === product.promotion_id && p.is_active);
        if (!promo) return false;

        if (selectedSeason === 'general') {
          // Any active promotion
          return true;
        } else {
          // Specific season (halloween, navidad, san_valentin, etc.)
          return promo.season_tag === selectedSeason;
        }
      }

      return true;
    });
  }, [products, promotions, selectedCategory, selectedSeason, searchQuery]);

  // Current category name for heading
  const currentCategoryObj = categories.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Header />

      <main className="flex-1">
        {/* Hero / Seasonal Campaign Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#9368B7] via-[#8553AE] to-[#6E3C99] text-white p-6 md:p-8 shadow-xl shadow-[#9368B7]/20 border border-[#D8C3E5]/30">
            {/* Background Korean decorative watermarks */}
            <div className="absolute -right-8 -bottom-8 text-8xl md:text-9xl font-black text-white/5 select-none pointer-events-none">
              호시
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#FFF9F2] p-2 shadow-xl flex-shrink-0 border-2 border-white/60 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Hoshi Market" className="w-full h-full object-contain" />
              </div>

              <div className="max-w-2xl space-y-2.5">
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black tracking-wide text-white border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>CATÁLOGO DIGITAL HOSHI MARKET • HUÁNUCO</span>
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
                  Sabores, Ramens y K-Culture directamente a tu mesa
                </h2>

                <p className="text-xs sm:text-sm text-[#EFE6F7] leading-relaxed">
                  Revisa nuestro catálogo de más de 500 productos coreanos originales. Agrega tus favoritos, aprovecha las promociones <span className="font-bold underline decoration-amber-300">2x1 y 3x2</span> y envía tu pedido directamente a nuestro WhatsApp oficial para coordinar recojo o delivery.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category & Campaign Filter */}
        <CategoryFilter />

        {/* Catalog Section Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg md:text-xl font-black text-[#261C30] flex items-center gap-2">
              <span>{currentCategoryObj ? `${currentCategoryObj.icon} ${currentCategoryObj.name}` : '✨ Todo el Catálogo'}</span>
              {selectedSeason !== 'todos' && (
                <span className="text-xs font-bold bg-[#FF6B8B] text-white px-2.5 py-0.5 rounded-full">
                  Filtro: {selectedSeason.toUpperCase()}
                </span>
              )}
            </h3>
            <p className="text-xs text-[#867894]">
              Mostrando {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenDetail={(prod) => setSelectedProduct(prod)}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-3xl border border-[#EADBEE] p-12 text-center max-w-md mx-auto my-8 space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#EFE6F7] mx-auto flex items-center justify-center text-[#9368B7]">
                <SearchX className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-[#261C30]">
                No encontramos productos con estos filtros
              </h4>
              <p className="text-xs text-[#867894]">
                Intenta buscar con otra palabra clave o deselecciona la categoría o campaña actual.
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="bg-[#9368B7] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#7E52A3]"
                >
                  Limpiar Búsqueda
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <Footer />
    </div>
  );
}
