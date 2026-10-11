import React from 'react';
import { CheckCircle, Clock, MapPin, Bike, Store, MessageCircle, X } from 'lucide-react';
import { formatCurrency, formatPhone, generateWhatsAppUrl } from '../utils/formatters';

export function OrderSuccessModal({ order, isOpen, onClose, storeInfo }) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#FCFAF6] rounded-3xl border-2 border-[#DDD7C4] shadow-2xl overflow-hidden z-10 flex flex-col animate-in zoom-in-95 duration-200 text-[#2C3E18]">
        
        {/* Topo com Ícone de Sucesso */}
        <div className="p-6 text-center bg-[#F5F2EB] border-b-2 border-[#DDD7C4] relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[#2C3E18]/60 hover:text-[#2C3E18] rounded-xl hover:bg-[#ECE7D8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-[#EAF0DF] text-[#4A692D] border-2 border-[#4A692D]/40 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <CheckCircle className="w-9 h-9 stroke-[2.3]" />
          </div>

          <span className="text-[11px] font-black uppercase tracking-widest text-[#4A692D] block mb-1">
            Pedido Registrado • #{order.id}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#2C3E18]">
            Pedido Enviado com Sucesso!
          </h2>
          <p className="text-xs sm:text-sm text-[#2C3E18]/75 mt-2 max-w-sm mx-auto leading-relaxed">
            A equipe da <strong>Beach House</strong> recebeu seu pedido e entrará em contato via WhatsApp no número <strong>{formatPhone(order.customerPhone)}</strong> para confirmar o início do preparo.
          </p>
        </div>

        {/* Detalhes do Pedido */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs sm:text-sm">
          
          {/* Informações de Entrega ou Retirada */}
          <div className="p-3.5 rounded-2xl bg-[#F5F2EB] border border-[#DDD7C4] space-y-1.5">
            <div className="flex items-center gap-2 font-black text-[#2C3E18]">
              {order.orderType === 'delivery' ? (
                <>
                  <Bike className="w-4 h-4 text-[#4A692D]" />
                  <span>Entrega (Delivery)</span>
                </>
              ) : (
                <>
                  <Store className="w-4 h-4 text-[#4A692D]" />
                  <span>Retirada no Balcão</span>
                </>
              )}
            </div>

            {order.orderType === 'delivery' && order.address && (
              <p className="text-xs text-[#2C3E18]/70">
                {order.address.street}, {order.address.number}
                {order.address.complement ? ` - ${order.address.complement}` : ''} • {order.address.neighborhood}
              </p>
            )}

            <div className="flex items-center gap-1.5 text-[11px] text-[#2C3E18]/60 pt-1 border-t border-[#DDD7C4]/60">
              <Clock className="w-3.5 h-3.5 text-[#4A692D]" />
              <span>Tempo médio estimado: {storeInfo.estimatedTime}</span>
            </div>
          </div>

          {/* Lista de Itens */}
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-[#2C3E18] mb-2">
              Resumo dos Itens
            </h4>
            <div className="divide-y divide-[#DDD7C4]/60 border-y border-[#DDD7C4]/60">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-start gap-2">
                  <div>
                    <span className="font-bold text-xs sm:text-sm">
                      {item.quantity}x {item.product.name}
                    </span>
                    {item.notes && (
                      <span className="block text-[11px] text-[#3A5323] italic">
                        Obs: {item.notes}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-right flex-shrink-0">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totais */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[#2C3E18]/70">
              <span>Subtotal:</span>
              <span className="font-bold">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.orderType === 'delivery' && (
              <div className="flex justify-between text-[#2C3E18]/70">
                <span>Taxa de Entrega:</span>
                <span className="font-bold">
                  {order.deliveryFee > 0 ? formatCurrency(order.deliveryFee) : 'Grátis'}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-[#2C3E18] pt-2 border-t border-[#DDD7C4]">
              <span>Total Geral:</span>
              <span className="text-[#4A692D]">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 sm:p-5 bg-[#FCFAF6] border-t-2 border-[#DDD7C4] space-y-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#4A692D] hover:bg-[#3A5323] text-white font-black py-3 px-4 rounded-xl shadow-md transition-all text-xs sm:text-sm"
          >
            Concluir e Voltar ao Cardápio
          </button>
        </div>
      </div>
    </div>
  );
}
