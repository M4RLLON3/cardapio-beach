import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export function CartDrawer({
  isOpen,
  onClose,
  items,
  subtotal,
  deliveryFee,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FCFAF6] shadow-2xl flex flex-col z-10 border-l-2 border-[#DDD7C4] animate-in slide-in-from-right duration-300">
          
          {/* Header do Drawer */}
          <div className="p-4 sm:p-5 border-b-2 border-[#DDD7C4] flex items-center justify-between bg-[#F5F2EB]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#EAF0DF] text-[#4A692D] rounded-xl border border-[#4A692D]/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#2C3E18]">Seu Carrinho</h2>
                <p className="text-xs text-[#2C3E18]/70">
                  {items.length === 0
                    ? 'Nenhum item adicionado'
                    : `${items.length} ${items.length === 1 ? 'item diferente' : 'itens diferentes'}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={onClearCart}
                  className="p-2 text-[#2C3E18]/60 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors text-xs font-semibold"
                  title="Esvaziar carrinho"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-[#2C3E18]/60 hover:text-[#2C3E18] rounded-lg hover:bg-[#ECE7D8] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lista de Itens do Carrinho */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-[#DDD7C4]/70">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 bg-[#F5F2EB] text-[#4A692D] border-2 border-[#DDD7C4] rounded-3xl flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 opacity-60" />
                </div>
                <div>
                  <h3 className="font-black text-[#2C3E18] text-base">Seu carrinho está vazio</h3>
                  <p className="text-xs text-[#2C3E18]/60 mt-1 max-w-xs">
                    Explore nosso cardápio e adicione suas porções, burgers e bebidas favoritas!
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="bg-[#4A692D] hover:bg-[#3A5323] text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-md"
                >
                  Ver Cardápio
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.cartItemId} className="py-4 first:pt-0 last:pb-0 flex gap-3">
                  {/* Foto do item */}
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-xl object-cover bg-[#ECE7D8] flex-shrink-0 border border-[#DDD7C4]"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80';
                    }}
                  />

                  {/* Informações */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-extrabold text-[#2C3E18] text-xs sm:text-sm leading-tight">
                          {item.product.name}
                        </h4>
                        <span className="font-black text-xs sm:text-sm text-[#2C3E18] flex-shrink-0">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </div>

                      {/* Observação customizada */}
                      {item.notes && (
                        <p className="text-[11px] text-[#3A5323] bg-[#EAF0DF] rounded-lg px-2 py-0.5 mt-1 font-medium border border-[#4A692D]/20 inline-block">
                          Obs: {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Controles de Quantidade */}
                    <div className="flex items-center justify-between mt-2 pt-1">
                      <span className="text-[11px] text-[#2C3E18]/60 font-medium">
                        {formatCurrency(item.product.price)} un.
                      </span>

                      <div className="flex items-center gap-1.5 bg-[#F5F2EB] rounded-lg p-0.5 border border-[#DDD7C4]">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-[#2C3E18] hover:bg-white transition-colors"
                          title="Diminuir"
                        >
                          <Minus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-[#2C3E18]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-[#2C3E18] hover:bg-white transition-colors"
                          title="Aumentar"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Rodapé com Totais e Botão de Checkout */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 bg-[#FCFAF6] border-t-2 border-[#DDD7C4] shadow-lg space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#2C3E18]/70">
                  <span>Subtotal</span>
                  <span className="font-extrabold text-[#2C3E18]">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#2C3E18]/70">
                  <span>Taxa de Entrega estimada</span>
                  <span className="font-extrabold text-[#2C3E18]">
                    {deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Grátis'}
                  </span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-black text-[#2C3E18] pt-2 border-t border-[#DDD7C4]">
                  <span>Total Previsto</span>
                  <span className="text-[#4A692D]">{formatCurrency(subtotal + deliveryFee)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onProceedToCheckout}
                className="w-full bg-[#4A692D] hover:bg-[#3A5323] active:scale-[0.99] text-[#FCFAF6] font-black py-3.5 px-4 rounded-xl shadow-lg shadow-[#4A692D]/25 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span>Avançar para Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full text-center text-xs font-bold text-[#2C3E18]/70 hover:text-[#2C3E18] transition-colors py-1"
              >
                Continuar Escolhendo Itens
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
