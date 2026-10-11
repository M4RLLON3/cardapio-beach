import React from 'react';
import { BeachHouseIcon, PalmLeavesDecoration } from './BeachHouseLogo';

export function LoyaltyCardBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#FCFAF6] border-2 border-[#DDD7C4] shadow-sm p-4 sm:p-6 mb-8 text-[#2C3E18]">
      {/* Folhagens tropicais nos cantos superiores */}
      <PalmLeavesDecoration
        position="left"
        className="absolute -top-3 -left-3 w-20 h-20 sm:w-28 sm:h-28"
      />
      <PalmLeavesDecoration
        position="right"
        className="absolute -top-3 -right-3 w-20 h-20 sm:w-28 sm:h-28"
      />

      <div className="relative z-10 text-center max-w-xl mx-auto">
        {/* Título */}
        <h3 className="text-base sm:text-xl font-black tracking-[0.2em] uppercase text-[#4A692D]">
          Cartão Fidelidade
        </h3>

        {/* Faixa / Banner Verde da Promoção */}
        <div className="mt-2 inline-block bg-[#4A692D] text-[#FCFAF6] font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-sm tracking-wide">
          Junte 5 carimbadas e ganhe <span className="underline font-black">1 hora de quadra</span>
        </div>

        {/* Círculos das 5 Carimbadas + Selo de Prêmio */}
        <div className="flex items-center justify-center gap-2 sm:gap-3.5 my-4 overflow-x-auto no-scrollbar py-1">
          {[1, 2, 3, 4, 5].map((num) => (
            <div
              key={num}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-dashed border-[#4A692D]/70 bg-[#F5F2EB] flex flex-col items-center justify-center flex-shrink-0 group hover:border-solid hover:border-[#4A692D] transition-all"
            >
              <BeachHouseIcon className="w-6 h-6 sm:w-7 sm:h-7 opacity-80" />
              <span className="text-[10px] font-black leading-none text-[#4A692D] mt-0.5">
                {num}
              </span>
            </div>
          ))}

          {/* Selo 1 Hora de Quadra */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#4A692D] text-white flex flex-col items-center justify-center flex-shrink-0 shadow-md p-1">
            {/* Ícone estilizado da Quadra */}
            <svg viewBox="0 0 32 20" className="w-6 h-4 stroke-white fill-none stroke-[1.5] mb-0.5">
              <rect x="1" y="1" width="30" height="18" rx="1" />
              <line x1="16" y1="1" x2="16" y2="19" />
              <line x1="8" y1="1" x2="8" y2="19" />
              <line x1="24" y1="1" x2="24" y2="19" />
            </svg>
            <span className="text-[9px] font-extrabold uppercase leading-tight text-center tracking-tighter">
              1 Hora de Quadra
            </span>
          </div>
        </div>

        {/* Rodapé do Cartão */}
        <div className="flex items-center justify-center gap-3 text-center">
          <span className="h-[1px] w-8 sm:w-16 bg-[#4A692D]/30" />
          <span
            className="font-script text-[#4A692D] text-base sm:text-xl font-bold"
            style={{ fontFamily: '"Caveat", cursive' }}
          >
            Aqui é sempre uma boa!
          </span>
          <span className="h-[1px] w-8 sm:w-16 bg-[#4A692D]/30" />
        </div>
      </div>
    </div>
  );
}
