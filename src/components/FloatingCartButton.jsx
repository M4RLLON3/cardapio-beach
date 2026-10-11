import React from 'react';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export function FloatingCartButton({ totalCount, subtotal, onOpenCart }) {
  if (totalCount === 0) return null;

  return (
    <div className="fixed bottom-4 inset-x-0 z-40 px-4 sm:px-6 pointer-events-none animate-in slide-in-from-bottom-5 duration-300">
      <div className="max-w-md mx-auto pointer-events-auto">
        <button
          onClick={onOpenCart}
          className="w-full bg-[#4A692D] hover:bg-[#3A5323] text-[#FCFAF6] rounded-2xl p-3.5 sm:p-4 shadow-2xl shadow-[#4A692D]/40 flex items-center justify-between transition-transform active:scale-[0.98] border-2 border-[#3A5323]"
        >
          {/* Badge e Contagem */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-[#FCFAF6] text-[#4A692D] flex items-center justify-center shadow-md">
                <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 bg-[#2C3E18] text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#FCFAF6]">
                {totalCount}
              </span>
            </div>

            <div className="text-left">
              <div className="text-xs font-black uppercase tracking-wider text-[#FCFAF6]">
                Ver Carrinho
              </div>
              <div className="text-xs text-[#FCFAF6]/80 font-medium">
                {totalCount} {totalCount === 1 ? 'item' : 'itens'} adicionados
              </div>
            </div>
          </div>

          {/* Subtotal e Seta */}
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-[#FCFAF6]">
              {formatCurrency(subtotal)}
            </span>
            <ChevronRight className="w-5 h-5 text-[#FCFAF6]/80 stroke-[2.5]" />
          </div>
        </button>
      </div>
    </div>
  );
}
