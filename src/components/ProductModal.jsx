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

      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col border border-[#dedad2] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        
        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Imagem do Produto */}
        <div className="relative h-56 sm:h-64 w-full bg-[#efeeea] flex-shrink-0">
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 font-manrope">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {product.badge && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-[#daeaaa] text-[#161f00] font-grotesk uppercase tracking-wider">
                  {product.badge}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-grotesk text-[#132512] leading-tight">
              {product.name}
            </h2>
            <p className="text-xs sm:text-sm text-[#434841] mt-2 leading-relaxed">
              {product.description}
            </p>
            <div className="mt-3 text-xl font-bold font-grotesk text-[#132512]">
              {formatCurrency(currentUnitPrice)}
            </div>
          </div>

          {/* Seletor de Opções (ex.: Doses e Garrafas de Destilados) */}
          {product.options && product.options.length > 1 && (
            <div>
              <label className="block text-xs font-bold font-grotesk text-[#132512] uppercase tracking-wider mb-2">
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
                      className={`p-2.5 rounded-xl border text-xs font-grotesk font-semibold transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        isSelected
                          ? 'border-[#283b26] bg-[#283b26] text-white shadow-xs'
                          : 'border-[#dedad2] bg-[#f5f3ef] text-[#132512] hover:border-[#283b26]'
                      }`}
                    >
                      <span className="font-bold">{opt.name}</span>
                      <span className={`text-[11px] ${isSelected ? 'text-[#daeaaa]' : 'text-[#566431]'}`}>
                        {formatCurrency(opt.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <hr className="border-[#efeeea]" />

          {/* Campo de Observações */}
          <div>
            <label className="block text-xs font-bold font-grotesk text-[#132512] uppercase tracking-wider mb-1.5">
              Observações do Item
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Sem cebola, molho à parte, bem passado..."
              className="w-full p-3 text-xs sm:text-sm rounded-xl border border-[#dedad2] bg-[#fbf9f5] focus:bg-white focus:border-[#283b26] focus:outline-none transition-all resize-none text-[#132512] placeholder-[#747870]"
              maxLength={150}
            />
            <div className="text-[10px] text-[#747870] text-right mt-1 font-manrope">
              {notes.length}/150 caracteres
            </div>
          </div>
        </div>

        {/* Rodapé com Quantidade e Botão */}
        <div className="p-4 sm:p-5 bg-[#fbf9f5] border-t border-[#dedad2] flex items-center gap-3">
          {/* Seletor de Quantidade */}
          <div className="flex items-center bg-white rounded-xl p-1 border border-[#dedad2]">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#132512] hover:bg-[#f5f3ef] disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <span className="w-8 text-center text-sm font-bold font-grotesk text-[#132512]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#132512] hover:bg-[#f5f3ef] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Botão de Adicionar */}
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-[#283b26] hover:bg-[#132512] active:scale-[0.98] text-white font-grotesk font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-between text-xs sm:text-sm cursor-pointer"
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
