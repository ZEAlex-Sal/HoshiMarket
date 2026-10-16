"use client";

import React from 'react';
import { useStore } from '@/context/store-context';
import { SeasonCampaign } from '@/types';
import { Flame, Sparkles, Layers, Clock, Gift } from 'lucide-react';

export default function CategoryFilter() {
  const { 
    categories, 
    selectedCategory, 
    setSelectedCategory, 
    selectedSeason, 
    setSelectedSeason,
    promotions
  } = useStore();

  const activePromosCount = promotions.filter(p => p.is_active).length;

  const seasonalFilters: Array<{ id: SeasonCampaign; label: string; icon: React.ReactNode; color: string }> = [
    { id: 'todos', label: 'Todo el Catálogo', icon: <Layers className="w-3.5 h-3.5 text-[#9368B7]" />, color: 'hover:border-[#9368B7]' },
    { id: 'general', label: 'Promociones', icon: <Flame className="w-3.5 h-3.5 text-rose-500" />, color: 'hover:border-rose-400' },
    { id: 'vencimiento', label: 'Liquidación / Fecha Próxima', icon: <Clock className="w-3.5 h-3.5 text-amber-500" />, color: 'hover:border-amber-400' },
    { id: 'combos', label: 'Packs & Combos', icon: <Gift className="w-3.5 h-3.5 text-purple-600" />, color: 'hover:border-purple-400' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
      {/* Seasonal Campaigns & Promo Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-[#6B5E78] uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-[#9368B7]" />
          Filtrar por:
        </span>
        <div className="flex items-center gap-1.5 flex-nowrap">
          {seasonalFilters.map((season) => {
            const isSelected = selectedSeason === season.id;
            return (
              <button
                key={season.id}
                onClick={() => setSelectedSeason(season.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#261C30] text-white border-[#261C30] shadow-sm'
                    : `bg-white/80 text-[#544660] border-[#EADBEE] ${season.color}`
                }`}
              >
                {season.icon}
                <span>{season.label}</span>
                {season.id === 'general' && activePromosCount > 0 && (
                  <span className="bg-[#FF6B8B] text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {activePromosCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Categories Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {/* 'Todos' Pill */}
        <button
          onClick={() => setSelectedCategory('todos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs md:text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
            selectedCategory === 'todos'
              ? 'bg-[#9368B7] text-white shadow-[#9368B7]/30 scale-105'
              : 'bg-white text-[#544660] border border-[#EADBEE] hover:bg-[#EFE6F7] hover:text-[#9368B7]'
          }`}
        >
          <span className="text-base">✨</span>
          <span>Todos</span>
        </button>

        {/* Dynamic Categories */}
        {categories
          .filter(cat => cat.is_active)
          .sort((a, b) => a.order - b.order)
          .map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs md:text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                  isSelected
                    ? 'bg-[#9368B7] text-white shadow-[#9368B7]/30 scale-105'
                    : 'bg-white text-[#544660] border border-[#EADBEE] hover:bg-[#EFE6F7] hover:text-[#9368B7]'
                }`}
              >
                <span className="text-base select-none">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
