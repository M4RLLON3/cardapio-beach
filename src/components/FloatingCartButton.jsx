import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export function FloatingCartButton({ totalCount, subtotal, onOpenCart }) {
  if (totalCount === 0) return null;

  return (
    <aside className="fixed bottom-4 sm:bottom-6 right-4 left-4 sm:left-auto sm:right-8 z-40 max-w-md w-[calc(100%-2rem)] sm:w-96 bg-[#132512] text-white rounded-2xl shadow-2xl p-3 sm:p-4 transition-all duration-300 mx-auto animate-in slide-in-from-bottom-5">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 pl-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#283b26] flex items-center justify-center text-[#daeaaa] shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0 truncate">
            <span className="font-grotesk text-[10px] sm:text-xs text-[#b6cdb0] uppercase tracking-wider font-semibold truncate">
              {totalCount} {totalCount === 1 ? 'item adicionado' : 'itens adicionados'}
            </span>
            <span className="font-grotesk text-base sm:text-lg font-bold text-white tracking-tight">
              {formatCurrency(subtotal)}
            </span>
          </div>
        </div>

        <button
          onClick={onOpenCart}
          type="button"
          className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-[#fbf9f5] hover:bg-[#efeeea] text-[#132512] font-grotesk text-xs uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-xs active:scale-95"
        >
          <span>Ver Pedido</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
