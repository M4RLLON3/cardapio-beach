import React from 'react';
import { Search, X } from 'lucide-react';

export function SearchBar({ searchQuery, setSearchQuery, totalResults, isFiltering }) {
  return (
    <div className="relative mb-6">
      <div className="relative flex items-center">
        <Search className="w-5 h-5 text-[#4A692D]/70 absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar no cardápio (ex: burger, porção, drink, chopp...)"
          className="w-full pl-11 pr-10 py-3 rounded-2xl bg-[#FCFAF6] border-2 border-[#DDD7C4] text-sm text-[#2C3E18] placeholder-[#2C3E18]/45 focus:outline-none focus:ring-2 focus:ring-[#4A692D]/20 focus:border-[#4A692D] transition-all shadow-sm font-medium"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 text-[#2C3E18]/60 hover:text-[#2C3E18] p-1 rounded-full hover:bg-[#F5F2EB] transition-colors"
            title="Limpar busca"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isFiltering && (
        <div className="mt-2 text-xs text-[#2C3E18]/70 flex items-center justify-between px-1">
          <span className="font-semibold">
            {totalResults === 0
              ? 'Nenhum produto encontrado para sua busca.'
              : `${totalResults} produto(s) encontrado(s)`}
          </span>
          <button
            onClick={() => setSearchQuery('')}
            className="text-[#4A692D] font-bold hover:underline"
          >
            Limpar filtro
          </button>
        </div>
      )}
    </div>
  );
}
