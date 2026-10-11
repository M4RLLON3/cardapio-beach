import React from 'react';

/**
 * Ícone estilizado do Coqueiro com Rede de Beach Tennis
 * Baseado com precisão no logotipo do Cartão Fidelidade
 */
export function BeachHouseIcon({ className = "w-12 h-12", color = "#4A692D" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Folhas do Coqueiro */}
      <g stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {/* Folhas superiores */}
        <path d="M50 42 C45 25 35 18 20 22 C30 28 42 34 50 42" fill={color} fillOpacity="0.85" />
        <path d="M50 42 C55 25 65 18 80 22 C70 28 58 34 50 42" fill={color} fillOpacity="0.85" />
        
        {/* Folhas centrais */}
        <path d="M50 40 C48 18 50 10 50 8 C52 18 52 28 50 40" fill={color} fillOpacity="0.9" />
        <path d="M50 42 C35 32 24 32 14 38 C26 42 40 42 50 42" fill={color} fillOpacity="0.85" />
        <path d="M50 42 C65 32 76 32 86 38 C74 42 60 42 50 42" fill={color} fillOpacity="0.85" />
        
        {/* Folhas caídas laterais */}
        <path d="M50 44 C38 45 26 50 20 60 C32 54 44 48 50 44" fill={color} fillOpacity="0.85" />
        <path d="M50 44 C62 45 74 50 80 60 C68 54 56 48 50 44" fill={color} fillOpacity="0.85" />

        {/* Tronco */}
        <path d="M47 44 L46 88 L54 88 L53 44 Z" fill={color} fillOpacity="0.9" />

        {/* Rede de Beach Tennis sobreposta ao tronco */}
        <rect x="24" y="52" width="52" height="24" rx="2" fill="#F5F2EB" stroke={color} strokeWidth="2.5" />
        {/* Malha da rede */}
        <line x1="24" y1="60" x2="76" y2="60" stroke={color} strokeWidth="1.2" />
        <line x1="24" y1="68" x2="76" y2="68" stroke={color} strokeWidth="1.2" />
        <line x1="32" y1="52" x2="32" y2="76" stroke={color} strokeWidth="1.2" />
        <line x1="41" y1="52" x2="41" y2="76" stroke={color} strokeWidth="1.2" />
        <line x1="50" y1="52" x2="50" y2="76" stroke={color} strokeWidth="1.5" />
        <line x1="59" y1="52" x2="59" y2="76" stroke={color} strokeWidth="1.2" />
        <line x1="68" y1="52" x2="68" y2="76" stroke={color} strokeWidth="1.2" />
      </g>
    </svg>
  );
}

/**
 * Logotipo Completo BEACH HOUSE SPORTS N' BAR
 */
export function BeachHouseLogo({ size = "normal" }) {
  const isLarge = size === "large";

  return (
    <div className="flex flex-col items-center select-none text-center">
      {/* Linha Principal com Coqueiro ao Centro */}
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <span
          className={`font-black tracking-[0.18em] sm:tracking-[0.25em] text-[#4A692D] ${
            isLarge ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl'
          }`}
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          BEACH
        </span>

        <BeachHouseIcon
          className={isLarge ? "w-14 h-14 sm:w-20 sm:h-20" : "w-10 h-10 sm:w-12 sm:h-12"}
        />

        <span
          className={`font-black tracking-[0.18em] sm:tracking-[0.25em] text-[#4A692D] ${
            isLarge ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl'
          }`}
          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          HOUSE
        </span>
      </div>

      {/* Subtítulo Sports N' Bar */}
      <div
        className={`tracking-[0.35em] sm:tracking-[0.45em] text-[#4A692D] font-extrabold mt-0.5 uppercase ${
          isLarge ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'
        }`}
      >
        SPORTS N' BAR
      </div>

      {/* Slogan estilo manuscrito */}
      <div className="flex items-center gap-3 mt-1.5 w-full justify-center">
        <span className="h-[1px] w-8 sm:w-16 bg-[#4A692D]/40" />
        <span
          className="font-script text-[#4A692D] text-sm sm:text-lg tracking-wide font-bold"
          style={{ fontFamily: '"Caveat", cursive' }}
        >
          Jogue, Beba, Viva o Beach!
        </span>
        <span className="h-[1px] w-8 sm:w-16 bg-[#4A692D]/40" />
      </div>
    </div>
  );
}

/**
 * Ramo de Folhas de Palmeira decorativo dos cantos do Cartão Fidelidade
 */
export function PalmLeavesDecoration({ position = "left", className = "" }) {
  const isLeft = position === "left";
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} pointer-events-none opacity-40 sm:opacity-55`}
      style={{ transform: isLeft ? "none" : "scaleX(-1)" }}
    >
      <g stroke="#4A692D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#5C7C38" fillOpacity="0.4">
        {/* Folha 1 */}
        <path d="M10 10 Q45 25 70 70 Q40 60 25 80 Q30 50 10 10 Z" />
        <path d="M25 80 L35 70" />
        <path d="M35 60 L48 55" />
        <path d="M45 45 L60 42" />
        {/* Folha 2 */}
        <path d="M5 25 Q35 45 50 95 Q30 80 15 95 Q25 65 5 25 Z" />
        {/* Folha 3 */}
        <path d="M15 5 Q55 15 90 45 Q65 45 60 65 Q50 35 15 5 Z" />
      </g>
    </svg>
  );
}
