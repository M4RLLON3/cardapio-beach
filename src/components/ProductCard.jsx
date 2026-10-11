import React from 'react';
import { Plus } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export function ProductCard({ product, onSelectProduct }) {
  const isAvailable = product.isAvailable !== false;

  return (
    <div
      onClick={() => isAvailable && onSelectProduct(product)}
      className={`group relative bg-[#FCFAF6] rounded-2xl p-3.5 sm:p-4 border-2 border-[#DDD7C4] shadow-sm transition-all duration-200 flex gap-3 sm:gap-4 overflow-hidden select-none ${
        isAvailable
          ? 'hover:shadow-md hover:border-[#4A692D]/60 cursor-pointer active:scale-[0.99]'
          : 'opacity-60 cursor-not-allowed bg-[#F5F2EB]'
      }`}
    >
      {/* Informações de Texto */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Badges */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            {!isAvailable ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase tracking-wider">
                Esgotado
              </span>
            ) : product.badge ? (
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#EAF0DF] text-[#3A5323] tracking-wide border border-[#4A692D]/20">
                {product.badge}
              </span>
            ) : null}
          </div>

          <h3 className="font-extrabold text-[#2C3E18] text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-[#4A692D] transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-[#2C3E18]/70 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Preço e Botão */}
        <div className="flex items-center justify-between mt-3 pt-2">
          <span className="font-black text-sm sm:text-base text-[#2C3E18]">
            {formatCurrency(product.price)}
          </span>

          {isAvailable ? (
            <button
              type="button"
              className="flex items-center gap-1 text-xs font-bold text-[#FCFAF6] bg-[#4A692D] hover:bg-[#3A5323] px-3 py-1.5 rounded-xl transition-all shadow-sm group-hover:scale-105"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="hidden sm:inline">Adicionar</span>
            </button>
          ) : (
            <span className="text-xs text-[#2C3E18]/40 font-medium">Indisponível</span>
          )}
        </div>
      </div>

      {/* Imagem do Produto */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 bg-[#ECE7D8] relative border border-[#DDD7C4]">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isAvailable ? 'group-hover:scale-110' : 'grayscale'
          }`}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
          }}
        />
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1">
            <span className="text-[10px] text-white font-extrabold uppercase text-center bg-rose-600/90 px-1.5 py-0.5 rounded">
              Esgotado
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
