import React from 'react';

/**
 * Ícone estilizado do Coqueiro com Rede de Beach Tennis
 * Baseado com precisão no logotipo do Cartão Fidelidade
 */
export function BeachHouseIcon({ className = "w-14 h-14", color = "#314a27" }) {
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ color }}
    >
      {/* Palmeira Folhagem */}
      <path d="M36 6V30" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 10 C30 10, 22 14, 18 20 C24 20, 31 18, 36 24" fill="currentColor" strokeWidth="1" />
      <path d="M36 10 C42 10, 50 14, 54 20 C48 20, 41 18, 36 24" fill="currentColor" strokeWidth="1" />
      <path d="M36 18 C28 20, 20 26, 17 32 C25 31, 31 27, 36 28" fill="currentColor" strokeWidth="1" />
      <path d="M36 18 C44 20, 52 26, 55 32 C47 31, 41 27, 36 28" fill="currentColor" strokeWidth="1" />
      {/* Rede de Beach Tennis / Base */}
      <rect x="24" y="31" width="24" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5" />
      {/* Linhas da grade da rede */}
      <line x1="30" y1="31" x2="30" y2="47" stroke="currentColor" strokeWidth="1.5" />
      <line x1="36" y1="31" x2="36" y2="47" stroke="currentColor" strokeWidth="1.5" />
      <line x1="42" y1="31" x2="42" y2="47" stroke="currentColor" strokeWidth="1.5" />
      <line x1="24" y1="36" x2="48" y2="36" stroke="currentColor" strokeWidth="1.5" />
      <line x1="24" y1="42" x2="48" y2="42" stroke="currentColor" strokeWidth="1.5" />
      {/* Poste de suporte */}
      <line x1="36" y1="47" x2="36" y2="55" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
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
      <div className="flex items-center justify-center gap-3 sm:gap-6 md:gap-8">
        <span
          className={`font-grotesk font-bold tracking-[0.22em] text-[#314a27] ${
            isLarge ? 'text-[26px] sm:text-[34px] md:text-[42px]' : 'text-[20px] sm:text-[24px]'
          }`}
        >
          BEACH
        </span>

        <div className="flex flex-col items-center justify-center text-[#314a27]">
          <BeachHouseIcon
            className={isLarge ? "w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16" : "w-8 h-8 sm:w-10 sm:h-10"}
          />
        </div>

        <span
          className={`font-grotesk font-bold tracking-[0.22em] text-[#314a27] ${
            isLarge ? 'text-[26px] sm:text-[34px] md:text-[42px]' : 'text-[20px] sm:text-[24px]'
          }`}
        >
          HOUSE
        </span>
      </div>

      {/* Subtítulo SPORTS N' BAR */}
      <div className="mt-1.5 sm:mt-2.5">
        <span
          className={`font-grotesk font-semibold tracking-[0.45em] text-[#314a27] uppercase pl-1.5 ${
            isLarge ? 'text-[12px] sm:text-[15px] md:text-[17px]' : 'text-[10px] sm:text-[12px]'
          }`}
        >
          SPORTS N' BAR
        </span>
      </div>

      {/* Slogan entre filetes delicados */}
      <div className="flex items-center justify-center w-full max-w-xs sm:max-w-md mt-2 sm:mt-2.5 gap-3 sm:gap-4 px-2">
        <span className="h-[1px] flex-1 bg-[#c4c8bf]/70" />
        <span
          className={`font-playfair italic text-[#314a27] tracking-wide whitespace-nowrap font-medium ${
            isLarge ? 'text-[13px] sm:text-[16px] md:text-[18px]' : 'text-[12px] sm:text-[14px]'
          }`}
        >
          Jogue, Beba, Viva o Beach!
        </span>
        <span className="h-[1px] flex-1 bg-[#c4c8bf]/70" />
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
