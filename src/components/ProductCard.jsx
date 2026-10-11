import React from 'react';
import { Plus } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export function ProductCard({ product, onSelectProduct }) {
  const isAvailable = product.isAvailable !== false;
  const lowestPrice =
    product.options && product.options.length > 1
      ? Math.min(...product.options.map((o) => o.price))
      : product.price;

  return (
    <article
      onClick={() => isAvailable && onSelectProduct(product)}
      className={`group flex flex-col bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md border border-[#e4e2de] transition-all duration-300 select-none ${
        isAvailable
          ? 'cursor-pointer active:scale-[0.99]'
          : 'opacity-65 cursor-not-allowed bg-[#fbf9f5]'
      }`}
    >
      {/* Imagem do Produto em Proporção 16/10 Editorial */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#efeeea]">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
            isAvailable ? 'group-hover:scale-[1.03]' : 'grayscale'
          }`}
          onError={(e) => {
            e.target.src =
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Badges superiores */}
        {product.badge && isAvailable && (
          <div className="absolute top-3 sm:top-3.5 left-3 sm:left-3.5">
            <span className="px-2.5 sm:px-3 py-1 bg-[#daeaaa] text-[#161f00] font-grotesk text-[10px] sm:text-[11px] uppercase tracking-widest font-bold rounded-lg shadow-xs backdrop-blur-sm">
              {product.badge}
            </span>
          </div>
        )}

        {!isAvailable && (
          <div className="absolute top-3 sm:top-3.5 left-3 sm:left-3.5">
            <span className="px-2.5 sm:px-3 py-1 bg-[#ba1a1a] text-white font-grotesk text-[10px] sm:text-[11px] uppercase tracking-widest font-bold rounded-lg shadow-xs">
              Esgotado
            </span>
          </div>
        )}
      </div>

      {/* Conteúdo do Card */}
      <div className="p-4 sm:p-6 flex flex-col flex-1 justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-grotesk text-base sm:text-lg font-bold text-[#132512] tracking-tight group-hover:text-[#283b26] transition-colors leading-snug">
              {product.name}
            </h2>
            <div className="text-right flex-shrink-0">
              {product.options && product.options.length > 1 && (
                <span className="block text-[10px] uppercase font-bold text-[#747870] font-grotesk">
                  A partir de
                </span>
              )}
              <span className="font-grotesk text-base sm:text-lg text-[#132512] font-bold whitespace-nowrap">
                {formatCurrency(lowestPrice)}
              </span>
            </div>
          </div>

          {product.description && (
            <p className="font-manrope text-xs sm:text-sm text-[#434841] mt-1.5 sm:mt-2 leading-relaxed line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        {/* Rodapé do Card com Ação */}
        <div className="pt-2.5 sm:pt-3 border-t border-[#f5f3ef] flex items-center justify-between">
          <span className="font-grotesk text-xs uppercase tracking-wider text-[#747870] flex items-center gap-1.5 truncate max-w-[55%]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#566431] flex-shrink-0" />
            <span className="truncate">{product.categoryName || 'Artesanal'}</span>
          </span>

          {isAvailable ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectProduct(product);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-[#283b26] hover:bg-[#132512] text-white font-grotesk text-xs uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{product.options && product.options.length > 1 ? 'Opções' : 'Adicionar'}</span>
            </button>
          ) : (
            <span className="text-xs font-grotesk text-[#747870] font-semibold">
              Indisponível
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
