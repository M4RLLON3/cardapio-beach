import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export function ProductModal({ product, isOpen, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setNotes('');
      if (product?.options && product.options.length > 0) {
        setSelectedOption(product.options[0]);
      } else {
        setSelectedOption(null);
      }
    }
  }, [isOpen, product]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const currentUnitPrice = selectedOption ? selectedOption.price : product.price;
  const totalItemPrice = currentUnitPrice * quantity;

  const handleConfirm = () => {
    const productToAdd = selectedOption
      ? {
          ...product,
          id: `${product.id}-${selectedOption.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: `${product.name} (${selectedOption.name})`,
          price: selectedOption.price,
        }
      : product;

    onAddToCart(productToAdd, quantity, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#FCFAF6] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col border-2 border-[#DDD7C4] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        
        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full backdrop-blur-md transition-all shadow-md"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Imagem do Produto */}
        <div className="relative h-56 sm:h-64 w-full bg-[#ECE7D8] flex-shrink-0">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
        </div>

        {/* Conteúdo com rolagem */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {product.badge && (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#EAF0DF] text-[#3A5323] border border-[#4A692D]/20">
                  {product.badge}
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-[#2C3E18] leading-tight">
              {product.name}
            </h2>
            <p className="text-xs sm:text-sm text-[#2C3E18]/75 mt-2 leading-relaxed">
              {product.description}
            </p>
            <div className="mt-3 text-lg font-black text-[#2C3E18]">
              {formatCurrency(currentUnitPrice)}
            </div>
          </div>

          {/* Seletor de Opções (ex.: Doses e Garrafas de Destilados) */}
          {product.options && product.options.length > 1 && (
            <div>
              <label className="block text-xs font-black text-[#2C3E18] uppercase tracking-wider mb-2">
                Selecione o Tamanho / Opção
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.options.map((opt) => {
                  const isSelected = selectedOption?.name === opt.name;
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => setSelectedOption(opt)}
                      className={`p-2.5 rounded-xl border-2 text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        isSelected
                          ? 'border-[#4A692D] bg-[#EAF0DF] text-[#2C3E18] shadow-sm'
                          : 'border-[#DDD7C4] bg-[#F5F2EB] text-[#2C3E18]/80 hover:border-[#4A692D]/40'
                      }`}
                    >
                      <span className="font-extrabold">{opt.name}</span>
                      <span className="text-[11px] font-black text-[#4A692D]">
                        {formatCurrency(opt.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <hr className="border-[#DDD7C4]" />

          {/* Campo de Observações */}
          <div>
            <label className="block text-xs font-black text-[#2C3E18] uppercase tracking-wider mb-1.5">
              Observações do Item
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Sem cebola, molho à parte, carne ao ponto..."
              className="w-full p-3 text-xs sm:text-sm rounded-xl border-2 border-[#DDD7C4] bg-[#F5F2EB] focus:bg-[#FCFAF6] focus:outline-none focus:ring-2 focus:ring-[#4A692D]/20 focus:border-[#4A692D] transition-all resize-none text-[#2C3E18] placeholder-[#2C3E18]/40"
              maxLength={150}
            />
            <div className="text-[10px] text-[#2C3E18]/50 text-right mt-1 font-medium">
              {notes.length}/150 caracteres
            </div>
          </div>
        </div>

        {/* Rodapé com Quantidade e Botão */}
        <div className="p-4 sm:p-5 bg-[#FCFAF6] border-t-2 border-[#DDD7C4] flex items-center gap-3">
          {/* Seletor de Quantidade */}
          <div className="flex items-center bg-[#F5F2EB] rounded-xl p-1 border-2 border-[#DDD7C4]">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#2C3E18] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <span className="w-8 text-center text-sm font-black text-[#2C3E18]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#2C3E18] hover:bg-white transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Botão de Adicionar */}
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-[#4A692D] hover:bg-[#3A5323] active:scale-[0.98] text-[#FCFAF6] font-black py-3.5 px-4 rounded-xl shadow-lg shadow-[#4A692D]/25 transition-all flex items-center justify-between text-xs sm:text-sm"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Adicionar ao Carrinho
            </span>
            <span>{formatCurrency(totalItemPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
