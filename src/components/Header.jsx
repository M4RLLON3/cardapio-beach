import React from 'react';
import { Clock, MapPin, Bike } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { BeachHouseLogo } from './BeachHouseLogo';

export function Header({ storeInfo }) {
  return (
    <div className="relative w-full overflow-hidden bg-[#fbf9f5] border-b border-[#dedad2]">
      {/* Subtle ambient top gradient element */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[840px] max-w-full h-[320px] bg-[#becd90]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Editorial Header Block */}
      <header className="relative max-w-[1080px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-7 pb-6">
        {/* Logotipo Centralizado: BEACH [Emblema] HOUSE */}
        <BeachHouseLogo size="large" />

        {/* 3 Cartões Pílulas de Status e Conveniência adaptados para Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 w-full mt-6 sm:mt-8">
          {/* Card 1: TEMPO MÉDIO */}
          <div className="flex items-center gap-3.5 p-3.5 md:p-4 rounded-xl bg-[#f5f3ef]/80 border border-[#dedad2] shadow-xs">
            <div className="w-9 h-9 rounded-full bg-[#e8e5dc] flex items-center justify-center shrink-0 text-[#314a27]">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold tracking-wider text-[#556050] uppercase font-grotesk">
                TEMPO MÉDIO
              </span>
              <span className="text-[15px] font-bold text-[#1a2e16] tracking-tight font-grotesk">
                {storeInfo.estimatedTime}
              </span>
            </div>
          </div>

          {/* Card 2: ENTREGA */}
          <div className="flex items-center gap-3.5 p-3.5 md:p-4 rounded-xl bg-[#f5f3ef]/80 border border-[#dedad2] shadow-xs">
            <div className="w-9 h-9 rounded-full bg-[#e8e5dc] flex items-center justify-center shrink-0 text-[#314a27]">
              <Bike className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold tracking-wider text-[#556050] uppercase font-grotesk">
                ENTREGA
              </span>
              <span className="text-[15px] font-bold text-[#1a2e16] tracking-tight font-grotesk">
                {storeInfo.deliveryFee > 0 ? formatCurrency(storeInfo.deliveryFee) : 'Grátis'}
              </span>
            </div>
          </div>

          {/* Card 3: LOCALIZAÇÃO */}
          <div className="flex items-center gap-3.5 p-3.5 md:p-4 rounded-xl bg-[#f5f3ef]/80 border border-[#dedad2] shadow-xs">
            <div className="w-9 h-9 rounded-full bg-[#e8e5dc] flex items-center justify-center shrink-0 text-[#314a27]">
              <MapPin className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col min-w-0 truncate">
              <span className="text-[11px] font-bold tracking-wider text-[#556050] uppercase font-grotesk">
                LOCALIZAÇÃO
              </span>
              <span className="text-[14px] md:text-[15px] font-bold text-[#1a2e16] tracking-tight truncate font-grotesk">
                {storeInfo.address}
              </span>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
