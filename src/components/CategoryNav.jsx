import React from 'react';
import { Utensils, Sandwich, Wine, Beer, Sparkles, CircleDot } from 'lucide-react';

const ICON_MAP = {
  Utensils,
  Sandwich,
  Wine,
  Beer,
  Sparkles,
};

export function CategoryNav({ categories, activeCategory, onSelectCategory }) {
  return (
    <div className="sticky top-0 z-20 bg-[#FCFAF6]/95 backdrop-blur-md border-b-2 border-[#DDD7C4] shadow-sm py-2.5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            const IconComponent = ICON_MAP[cat.iconName] || CircleDot;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 border ${
                  isActive
                    ? 'bg-[#4A692D] text-[#FCFAF6] border-[#4A692D] shadow-md shadow-[#4A692D]/20 scale-[1.02]'
                    : 'bg-[#F5F2EB] text-[#2C3E18] border-[#DDD7C4] hover:bg-[#ECE7D8] hover:border-[#4A692D]/40'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#4A692D]'}`} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
