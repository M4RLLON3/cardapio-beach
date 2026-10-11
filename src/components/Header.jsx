import React from 'react';
import { Clock, MapPin, Bike, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { BeachHouseLogo } from './BeachHouseLogo';

export function Header({ storeInfo, onNavigateToAdmin }) {
  return (
    <header className="relative bg-[#FCFAF6] border-b-2 border-[#DDD7C4] shadow-xs overflow-hidden">
      {/* Conteúdo Principal do Cabeçalho */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-5 relative z-10">
        
        {/* Barra Superior com Atalho para a Área da Loja */}
        {onNavigateToAdmin && (
          <div className="flex items-center justify-end mb-2">
            <button
              type="button"
              onClick={onNavigateToAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F2EB] hover:bg-[#EAF0DF] border border-[#DDD7C4] text-[11px] font-bold text-[#3A5323] transition-all cursor-pointer shadow-xs active:scale-95"
              title="Acessar Área Administrativa / Login da Loja"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#4A692D]" />
              <span>Área da Loja</span>
            </button>
          </div>
        )}

        {/* Logotipo Centralizado com Identidade do Cartão Fidelidade */}
        <div className="py-1">
          <BeachHouseLogo size="large" />
        </div>

        {/* Informações Rápidas (Pills de Informação sem Emojis e no estilo do cartão) */}
        <div className="mt-5 pt-3 border-t border-[#DDD7C4]/70 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          
          {/* Tempo */}
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#F5F2EB] border border-[#DDD7C4]">
            <div className="w-7 h-7 rounded-lg bg-[#4A692D]/10 text-[#4A692D] flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="truncate">
              <span className="text-[#4A692D]/80 block text-[10px] uppercase font-bold tracking-wider">
                Tempo Médio
              </span>
              <span className="font-extrabold text-[#2C3E18]">
                {storeInfo.estimatedTime}
              </span>
            </div>
          </div>

          {/* Taxa de Entrega */}
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#F5F2EB] border border-[#DDD7C4]">
            <div className="w-7 h-7 rounded-lg bg-[#4A692D]/10 text-[#4A692D] flex items-center justify-center flex-shrink-0">
              <Bike className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="truncate">
              <span className="text-[#4A692D]/80 block text-[10px] uppercase font-bold tracking-wider">
                Entrega
              </span>
              <span className="font-extrabold text-[#2C3E18]">
                {storeInfo.deliveryFee > 0 ? formatCurrency(storeInfo.deliveryFee) : 'Grátis'}
              </span>
            </div>
          </div>

          {/* Localização */}
          <div className="col-span-2 sm:col-span-1 flex items-center gap-2 p-2.5 rounded-2xl bg-[#F5F2EB] border border-[#DDD7C4]">
            <div className="w-7 h-7 rounded-lg bg-[#4A692D]/10 text-[#4A692D] flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="truncate">
              <span className="text-[#4A692D]/80 block text-[10px] uppercase font-bold tracking-wider">
                Localização
              </span>
              <span className="font-extrabold text-[#2C3E18] truncate block">
                {storeInfo.address}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
